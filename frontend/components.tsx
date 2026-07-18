// ============================================
// 共通部品はこのファイルだけ。フッターとアイコン。
// ============================================
import Link from 'next/link';

// ---- アイコン（FigmaからコピーしたSVGと同じ線画） ----

export const MicIcon = ({ size = 28, color = '#1C382E' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <rect x="9" y="3" width="6" height="11" rx="3" fill={color} />
    <path d="M5 11a7 7 0 0 0 14 0" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    <path d="M12 18v3" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

export const MoonIcon = ({ size = 19, color = 'currentColor' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M19 14.5A8 8 0 1 1 9.5 5 6.5 6.5 0 0 0 19 14.5z" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
  </svg>
);

export const PersonIcon = ({ color = 'currentColor' }: { color?: string }) => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="8.5" r="3.5" stroke={color} strokeWidth="1.8" />
    <path d="M5.5 19.5c1.2-3.2 3.7-4.8 6.5-4.8s5.3 1.6 6.5 4.8" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

export const CalendarIcon = ({ color = 'currentColor' }: { color?: string }) => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
    <rect x="4" y="5" width="16" height="15" rx="3" stroke={color} strokeWidth="1.8" />
    <path d="M4 10h16" stroke={color} strokeWidth="1.8" />
    <path d="M9 3v3M15 3v3" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

export const HistoryIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M4 12a8 8 0 1 1 2.5 5.8" stroke="#4F7B68" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M4 12V7M4 12H9" stroke="#4F7B68" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M12 8.5v4l2.6 1.6" stroke="#4F7B68" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const GearIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="3.2" stroke="#4F7B68" strokeWidth="1.8" />
    <path
      d="M12 2.8l1 2.3 2.5-.6.6 2.5 2.3 1-1.2 2.2 1.2 2.2-2.3 1-.6 2.5-2.5-.6-1 2.3-1-2.3-2.5.6-.6-2.5-2.3-1 1.2-2.2L6.9 10l2.3-1 .6-2.5 2.5.6z"
      stroke="#4F7B68" strokeWidth="1.4" strokeLinejoin="round" opacity=".55"
    />
  </svg>
);

export const CheckIcon = ({ size = 14, color = '#fff' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M5 12l5 5 9-10" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const GoogleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <path d="M21 12.2c0-.7-.06-1.4-.18-2H12v3.9h5.02c-.22 1.2-.9 2.2-1.9 2.9v2.4h3.06C20 17.6 21 15.1 21 12.2z" fill="#fff" />
    <path d="M12 21c2.4 0 4.5-.8 6-2.1l-3.06-2.4c-.85.6-1.94.9-2.94.9-2.26 0-4.18-1.5-4.86-3.6H4V16c1.5 3 4.5 5 8 5z" fill="#fff" opacity=".85" />
    <path d="M7.14 13.8a5.4 5.4 0 0 1 0-3.6V7.9H4a9 9 0 0 0 0 8.1l3.14-2.2z" fill="#fff" opacity=".7" />
    <path d="M12 6.5c1.3 0 2.5.45 3.44 1.34L18.1 5.2C16.5 3.7 14.4 3 12 3 8.5 3 5.5 5 4 7.9l3.14 2.3C7.82 8.1 9.74 6.5 12 6.5z" fill="#fff" opacity=".55" />
  </svg>
);

// ---- ヘッダー右上の（記録・設定）ボタン ※画面はまだ無いので飾り ----
export const HeaderIcons = () => (
  <div className="hicons">
    <span className="hicon"><HistoryIcon /></span>
    <span className="hicon"><GearIcon /></span>
  </div>
);

// ---- フッター〔じぶん｜いま｜カレンダー〕 ----
// じぶん・カレンダーの画面はまだ無いので、押せない飾りにしてある（Figmaと同じ）。
export const Footer = () => (
  <nav className="footer">
    <span className="tab off">
      <PersonIcon color="#8A968E" />
      <span>じぶん</span>
    </span>
    <Link href="/night" className="tab on">
      <MoonIcon color="#2E5548" />
      <span>いま</span>
    </Link>
    <span className="tab off">
      <CalendarIcon color="#8A968E" />
      <span>カレンダー</span>
    </span>
  </nav>
);
