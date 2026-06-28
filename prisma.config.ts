import { existsSync } from "node:fs";
import { defineConfig } from "@prisma/config";

// Load local env when present (dev). In CI / on deploy platforms there is no
// .env.local — env vars are injected by the platform — so don't fail without it.
if (existsSync(".env.local")) process.loadEnvFile(".env.local");

export default defineConfig({
  schema: "./prisma/schema.prisma",
  datasource: {
    // Migrations need a *direct* (unpooled) connection: DDL and Prisma migrate
    // don't work through PgBouncer's transaction pooler, which DATABASE_URL points
    // at in production (see .env.example). Falls back to DATABASE_URL for local/dev
    // setups that use a single, non-pooled database.
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL!,
  },
  migrations: {
    path: "./prisma/migrations",
  },
});
