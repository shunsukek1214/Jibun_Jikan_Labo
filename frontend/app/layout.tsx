import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'じぶん時間ラボ',
  description: '今日を、ここに置いていく。',
  appleWebApp: { capable: true, title: 'じぶん時間ラボ', statusBarStyle: 'default' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#F6F1E6',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>
        <div className="app">{children}</div>
      </body>
    </html>
  );
}
