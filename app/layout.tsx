import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "密着ドキュメンタリー脚本アプリ",
  description: "脳科学に基づく構成で、密着ドキュメの脚本を作成。関連URLで肉付け。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
