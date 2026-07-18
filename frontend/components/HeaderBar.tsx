import { GearIcon, HistoryIcon } from './icons';

/** 明るい画面のヘッダー：あいさつ＋（記録・設定はMVP外のためダミーボタン） */
export default function HeaderBar({ title, sub }: { title?: string; sub?: string }) {
  return (
    <div className="header">
      <div className="htxt">
        {title && <h1>{title}</h1>}
        {sub && <p>{sub}</p>}
      </div>
      <div className="header-utils">
        {/* TODO: 記録・設定画面はMVP後に実装（図2の範囲外） */}
        <button className="hicon" aria-label="記録"><HistoryIcon /></button>
        <button className="hicon" aria-label="設定"><GearIcon /></button>
      </div>
    </div>
  );
}
