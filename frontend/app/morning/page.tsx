import Link from 'next/link';
import { Footer, HeaderIcons, MicIcon, MoonIcon } from '../../components';

// ============================================
// ⑤ 朝の画面（Figma 5枚目）
// 今日の予定 ＋ ひとことアドバイス ＋ マイク ＋「これで決まり！」
// 🌙マーク ＝ 昨夜の言葉から生まれた予定
// 予定の中身を変えたいときは、下の rows を書き換えるだけ。
// ============================================

const rows = [
  { time: '9:00', title: 'A社見積もりの返信', moon: true, gold: true },
  { time: '10:30', title: '企画会議' },
  { time: '13:00', title: '1on1' },
  { time: '15:00', title: '経費精算', moon: true },
];

export default function MorningPage() {
  return (
    <>
      <main className="day">
        <header className="day-head">
          <div>
            <h1>おはようございます</h1>
            <p>7/16 Thu ・ 8:34</p>
          </div>
          <HeaderIcons />
        </header>

        {/* 今日の予定（1行＝1カード） */}
        <div className="rows">
          {rows.map((r) => (
            <div key={r.time} className={`rowcard${r.gold ? ' gold' : ''}`}>
              <span className="time">{r.time}</span>
              <span className="title">{r.title}</span>
              {r.moon && <MoonIcon size={16} color="#DDA84F" />}
            </div>
          ))}
        </div>

        {/* 秘書のひとこと */}
        <p className="advice">きょうは会議が続く日。集中して作業できるのは、朝のうちだけです。</p>

        {/* ひとこと言いたい人はこちら → 提案画面へ */}
        <Link href="/morning/talk" className="mic-pill">
          <span className="mic-circle"><MicIcon size={15} color="#fff" /></span>
          きょうどのように過ごしたいですか？
        </Link>

        {/* そのままでいい人はこちら → 送り出し */}
        <Link href="/sendoff" className="big-btn">これで決まり！</Link>
      </main>
      <Footer />
    </>
  );
}
