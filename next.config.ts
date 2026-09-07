import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // お店の写真投稿(最大3MB)や、記事のブロックエディタ(複数画像を1回で送信、
      // 各1.5MBまで)がフォーム送信に乗るため、既定の1MBより広げる
      bodySizeLimit: "10mb",
    },
  },
  async redirects() {
    return [
      {
        // www → wwwなしの正規URLへ301リダイレクト(Vercelのダッシュボード設定に頼らず、
        // コードで管理することで「Claude Codeから変更しやすい」状態を保つ)
        source: "/:path*",
        has: [{ type: "host", value: "www.o-school.site" }],
        destination: "https://o-school.site/:path*",
        permanent: true,
      },
    ];
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
