import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "PokemonBinder — Design your collection",
  description: "A friendly way to build, organize, and share your Pokémon TCG binders.",
};

// Next 16 moved theme-color to the viewport export; it tints the mobile browser /
// PWA chrome to match the app's white top bar. (viewport-fit=cover + safe-area
// insets are deferred to the Capacitor step, where the status-bar overlay is
// handled and testable on a real device.)
export const viewport: Viewport = {
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // suppressHydrationWarning: the WebView / browser injects inline styles on the
    // root before React hydrates (e.g. --safe-area-inset-* custom properties), which
    // our SSR output can't match. This only suppresses attribute warnings on these
    // elements themselves, not their children.
    <html lang="en" className={`${jakarta.variable} h-full`} suppressHydrationWarning>
      <body className="min-h-full antialiased" suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
