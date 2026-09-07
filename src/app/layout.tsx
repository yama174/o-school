import type { Metadata, Viewport } from "next";
import { Noto_Sans_JP } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { SiteChrome } from "@/components/SiteChrome";
import { getCurrentUser } from "@/lib/auth";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import { getSiteUrl } from "@/lib/site";

function safeSiteUrl() {
  try {
    return new URL(getSiteUrl());
  } catch {
    return undefined;
  }
}

const notoSansJP = Noto_Sans_JP({
  variable: "--font-noto-sans-jp",
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: safeSiteUrl(),
  title: {
    default: "O-school",
    template: "%s | O-school",
  },
  description:
    "今日の時間割・課題・行事・大空町のお店・記事をひとつにまとめた、学校非公式の生活ポータル「O-school」。",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "O-school",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0ea5e9",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const user = await getCurrentUser();
  const viewer = user ? { nickname: user.nickname, role: user.role as "STUDENT" | "ADMIN" } : null;

  return (
    <html lang="ja" className={`${notoSansJP.variable} h-full antialiased`}>
      <head>
        {/* Google AdSense サイト所有権確認用(審査申請のため)。strategy="beforeInteractive"で
            <head>内・他スクリプトより先に配信されるようにする */}
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5628096670327247"
          crossOrigin="anonymous"
          strategy="beforeInteractive"
        />
      </head>
      <body className="min-h-full">
        <SiteChrome viewer={viewer}>{children}</SiteChrome>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
