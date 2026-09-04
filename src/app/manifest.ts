import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "O-school",
    short_name: "O-school",
    description:
      "今日の時間割・課題・行事・大空町のお店・記事をまとめた、学校非公式の生活ポータル",
    start_url: "/",
    display: "standalone",
    background_color: "#f4f9ff",
    theme_color: "#0ea5e9",
    orientation: "portrait",
    icons: [
      { src: "/icons/192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/192", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icons/512", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/512", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
