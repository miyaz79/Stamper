import { Noto_Sans_JP } from "next/font/google";
import React from "react";
import "./globals.css";

export const metadata = { title: "Stamper", description: "Stamper PoC" };

const notoSans = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className={notoSans.className}>{children}</body>
    </html>
  );
}
