import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Home Icon Studio",
  description: "ホーム画面録画からアイコン作成候補を整理する個人利用向け Web アプリ"
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
