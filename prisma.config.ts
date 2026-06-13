import { defineConfig } from "@prisma/config";

process.loadEnvFile(".env.local");

export default defineConfig({
  schema: "./prisma/schema.prisma",
  datasource: {
    url: process.env.DATABASE_URL!,
  },
  migrations: {
    path: "./prisma/migrations",
  },
});
