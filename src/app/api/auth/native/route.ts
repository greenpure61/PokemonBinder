import { OAuth2Client } from "google-auth-library";
import { NextResponse } from "next/server";
import { z } from "zod";
import { ApiError, parseBody, withApiHandler } from "@/lib/api";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";

/**
 * Native sign-in exchange. The Capacitor app obtains a Google `idToken` from the OS
 * account picker (Google blocks OAuth inside embedded WebViews) and posts it here.
 * We verify the token, resolve/create the user + linked Google account exactly like
 * the NextAuth Prisma adapter does on a web sign-in, then create a database session
 * and set the NextAuth session cookie — so SSR and every API route authenticate the
 * native app identically to the web app, with no other changes. See MOBILE.md Step 4.
 */

const bodySchema = z.object({ idToken: z.string().min(1) });

// Sessions live as long as NextAuth's default (30 days).
const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

const googleClient = new OAuth2Client();

export const POST = withApiHandler(async (req) => {
  const { idToken } = await parseBody(req, bodySchema);

  // 1. Verify signature, expiry, issuer, and that the token was minted for *our*
  //    web OAuth client (audience). google-auth-library throws on any failure.
  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({ idToken, audience: env.GOOGLE_CLIENT_ID });
    payload = ticket.getPayload();
  } catch {
    throw new ApiError(401, "Invalid Google token");
  }
  if (!payload?.sub || !payload.email) {
    throw new ApiError(401, "Google token is missing required claims");
  }
  const { sub, email, name, picture, email_verified } = payload;

  // 2. Resolve the user by their Google account, falling back to email, creating
  //    the user + account on first sign-in (mirrors PrismaAdapter behaviour).
  const account = await prisma.account.findUnique({
    where: { provider_providerAccountId: { provider: "google", providerAccountId: sub } },
    select: { userId: true },
  });

  let userId = account?.userId;
  if (!userId) {
    const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    const user =
      existing ??
      (await prisma.user.create({
        data: {
          email,
          name: name ?? null,
          image: picture ?? null,
          emailVerified: email_verified ? new Date() : null,
        },
        select: { id: true },
      }));
    userId = user.id;
    await prisma.account.create({
      data: { userId, type: "oauth", provider: "google", providerAccountId: sub, id_token: idToken },
    });
  }

  // 3. Create the database session and set the NextAuth session cookie. The cookie
  //    name/flags must match what NextAuth derives per-request: the `__Secure-`
  //    prefix + Secure flag are used on HTTPS (prod), plain name on HTTP (local dev).
  const sessionToken = crypto.randomUUID();
  const expires = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);
  await prisma.session.create({ data: { sessionToken, userId, expires } });

  const proto = req.headers.get("x-forwarded-proto") ?? new URL(req.url).protocol.replace(":", "");
  const secure = proto === "https";

  const res = NextResponse.json({ ok: true });
  res.cookies.set(secure ? "__Secure-next-auth.session-token" : "next-auth.session-token", sessionToken, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure,
    expires,
  });
  return res;
});
