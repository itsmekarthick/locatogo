import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Locatogo – Local Places Atlas",
    short_name: "Locatogo",
    description: "Discover verified schools, hospitals, cafes, landmarks and more on the live interactive map.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#e26a4f",
    orientation: "portrait-primary",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    categories: ["maps", "travel", "navigation"],
    lang: "en",
  };
}
