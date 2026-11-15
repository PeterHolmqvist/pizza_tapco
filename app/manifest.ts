import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/kitchen",
    name: "T-App-Co Kitchen",
    short_name: "Kitchen",
    description: "Köksvy för restaurangens beställningar",
    start_url: "/kitchen",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#0f172a",
    theme_color: "#0f172a",
    lang: "sv",
    icons: [
      { src: "/icons/kitchen.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" }
    ]
  };
}
