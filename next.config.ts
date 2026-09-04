import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // お店の写真投稿(最大3MB)がフォーム送信で乗るため、既定の1MBより広げる
      bodySizeLimit: "5mb",
    },
  },
  async headers() {
    return [
      {
        // 全ページ共通のセキュリティヘッダー
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
