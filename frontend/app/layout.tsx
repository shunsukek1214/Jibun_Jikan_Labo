import type { Metadata, Viewport } from "next";

import { AuthProvider } from "../auth-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "じぶん時間ラボ",
  description: "今日を、ここに置いていく。",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#F6F1E6",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>
        <div className="app">
          <AuthProvider>{children}</AuthProvider>
        </div>
      </body>
    </html>
  );
}
