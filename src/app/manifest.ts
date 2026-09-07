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
      // ロゴ画像自体がキャンバス一杯まで占めるデザインのため、余白のない
      // maskable purposeは指定しない(OS側で丸くクロップされ欠ける恐れがあるため)。
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
}
