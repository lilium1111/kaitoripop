import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kaitori Pop Generator",
  description: "Create high resolution TCG buylist pop images."
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
