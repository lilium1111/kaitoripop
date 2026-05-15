import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "買取ポップ画像ジェネレーター",
  description: "高解像度のTCG買取リストポップ画像を作成します。"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
