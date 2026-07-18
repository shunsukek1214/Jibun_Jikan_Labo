import Link from 'next/link';
import { Footer, HeaderIcons, MoonIcon } from '../../../components';

// ============================================
// ⑥ 朝・ひとこと画面（Figma 6枚目）
// ユーザーのひとこと → AIの返事 → 組み替えた予定 → そうする/そのままで
// 文言・並びはFigmaのまま。
// 将来：ひとことを本当に入力できるようにして POST /reflection に送る（api.tsのTODO参照）
// ============================================

const rows = [
  { time: '9:00', title: 'A社見積もりの返信（30分）', gold: true },
  { time: '9:30', title: '資料作成（60分）', gold: true },
  { time: '10:30', title: '企画会議' },
  { time: '13:00', title: '1on1' },
  { time: '15:00', title: '経費精算', moon: true },
];

export default function MorningTalkPage() {
  return (
    <>
      <main className="day">
        <header className="day-head">
          <div />
          <HeaderIcons />
        </header>

        {/* あなたのひとこと */}
        <div className="quote">
          見積もりの返信、気が重いけど早くやらなきゃ。でも資料も早めの方がいいって言われている
        </div>

        {/* AIの返事 */}
        <p className="reply">
          それなら、見積もりは30分だけ時間を決めて返信を終わらせてしまいましょう。
        </p>

        {/* 組み替えた予定 */}
        <div className="rows">
          {rows.map((r) => (
            <div key={r.time} className={`rowcard${r.gold ? ' gold' : ''}`}>
              <span className="time">{r.time}</span>
              <span className="title">{r.title}</span>
              {r.moon && <MoonIcon size={16} color="#DDA84F" />}
            </div>
          ))}
        </div>

        {/* 決めるボタン2つ */}
        <div className="btn-row">
          <Link href="/sendoff" className="big-btn half">そうする</Link>
          <Link href="/morning" className="gray-btn half">そのままで</Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
