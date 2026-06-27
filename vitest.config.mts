import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Resolve the `@/*` alias from tsconfig natively (replaces vite-tsconfig-paths).
  resolve: { tsconfigPaths: true },
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    // Dummy values so modules that validate env at import (src/lib/env.ts) load.
    // Nothing in the test suite connects to a DB or authenticates.
    env: {
      DATABASE_URL: "postgresql://user:pass@localhost:5432/db",
      GOOGLE_CLIENT_ID: "test-client-id",
      GOOGLE_CLIENT_SECRET: "test-client-secret",
      NEXTAUTH_SECRET: "test-nextauth-secret",
    },
  },
});
