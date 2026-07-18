// アプリ全体で使うSVGアイコン（v8モックと同一の線画）
export const MicIcon = ({ size = 28, color = '#1C382E' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <rect x="9" y="3" width="6" height="11" rx="3" fill={color} />
    <path d="M5 11a7 7 0 0 0 14 0" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    <path d="M12 18v3" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

export const MoonIcon = ({ color = 'currentColor' }: { color?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" width="19" height="19">
    <path d="M19 14.5A8 8 0 1 1 9.5 5 6.5 6.5 0 0 0 19 14.5z" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
  </svg>
);

export const SunriseIcon = ({ color = 'currentColor' }: { color?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" width="19" height="19">
    <path d="M5 17a7 7 0 0 1 14 0" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    <path d="M12 4v3M4 10l1.8 1.8M20 10l-1.8 1.8M3 17h18" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

export const SunIcon = ({ color = 'currentColor' }: { color?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" width="19" height="19">
    <circle cx="12" cy="12" r="4" stroke={color} strokeWidth="1.8" />
    <path
      d="M12 3.5v2M12 18.5v2M20.5 12h-2M5.5 12h-2M17.8 6.2l-1.4 1.4M7.6 16.4l-1.4 1.4M17.8 17.8l-1.4-1.4M7.6 7.6L6.2 6.2"
      stroke={color} strokeWidth="1.8" strokeLinecap="round"
    />
  </svg>
);

export const PersonIcon = ({ color = 'currentColor' }: { color?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" width="19" height="19">
    <circle cx="12" cy="8.5" r="3.5" stroke={color} strokeWidth="1.8" />
    <path d="M5.5 19.5c1.2-3.2 3.7-4.8 6.5-4.8s5.3 1.6 6.5 4.8" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

export const CalendarIcon = ({ color = 'currentColor' }: { color?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" width="19" height="19">
    <rect x="4" y="5" width="16" height="15" rx="3" stroke={color} strokeWidth="1.8" />
    <path d="M4 10h16" stroke={color} strokeWidth="1.8" />
    <path d="M9 3v3M15 3v3" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

export const HistoryIcon = ({ color = '#4F7B68' }: { color?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
    <path d="M4 12a8 8 0 1 1 2.5 5.8" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    <path d="M4 12V7M4 12H9" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M12 8.5v4l2.6 1.6" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const GearIcon = ({ color = '#4F7B68' }: { color?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
    <circle cx="12" cy="12" r="3.2" stroke={color} strokeWidth="1.8" />
    <path
      d="M12 2.8l1 2.3 2.5-.6.6 2.5 2.3 1-1.2 2.2 1.2 2.2-2.3 1-.6 2.5-2.5-.6-1 2.3-1-2.3-2.5.6-.6-2.5-2.3-1 1.2-2.2L6.9 10l2.3-1 .6-2.5 2.5.6z"
      stroke={color} strokeWidth="1.4" strokeLinejoin="round" opacity=".55"
    />
  </svg>
);

export const CheckIcon = ({ size = 15, color = '#fff' }: { size?: number; color?: string }) => (
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
