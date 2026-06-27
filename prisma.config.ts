import { existsSync } from "node:fs";
import { defineConfig } from "@prisma/config";

// Load local env when present (dev). In CI / on deploy platforms there is no
// .env.local — env vars are injected by the platform — so don't fail without it.
if (existsSync(".env.local")) process.loadEnvFile(".env.local");

export default defineConfig({
  schema: "./prisma/schema.prisma",
  datasource: {
    url: process.env.DATABASE_URL!,
  },
  migrations: {
    path: "./prisma/migrations",
  },
});
