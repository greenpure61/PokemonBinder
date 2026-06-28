import type { MetadataRoute } from "next";

// Web app manifest (served at /manifest.webmanifest, linked automatically by Next).
// Gives the PWA an install identity + standalone display. A full maskable icon set
// (192/512 PNG) is generated in the Capacitor "icons & splash" step; for now it
// falls back to the favicon.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Pokémon Binder",
    short_name: "Binder",
    description: "Build, organize, and share your Pokémon TCG binders.",
    start_url: "/",
    display: "standalone",
    background_color: "#f6f7fb",
    theme_color: "#ffffff",
    icons: [{ src: "/favicon.ico", sizes: "any", type: "image/x-icon" }],
  };
}
