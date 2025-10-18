import { Noto_Sans_JP } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata = { title: "Stamper", description: "Stamper PoC" };

const notoSans = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ja">
      <body className={`${notoSans.className} bg-surface-backdrop text-text-primary min-h-screen`}>{children}</body>
    </html>
  );
}
