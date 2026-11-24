import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CholokLabs — Product & Engineering Studio",
    short_name: "CholokLabs",
    description:
      "CholokLabs builds intelligent technology products and delivers full-stack engineering from AI/ML and GPU acceleration to embedded systems and silicon.",
    start_url: "/",
    display: "standalone",
    background_color: "#0A1416",
    theme_color: "#0A1416",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
