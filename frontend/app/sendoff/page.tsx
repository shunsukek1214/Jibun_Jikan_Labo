import Link from 'next/link';
import { Footer } from '../../components';

// ============================================
// ⑦ 送り出し画面（Figma 7枚目）
// 予定が決まったあとの一言。文言はFigmaのまま。
// （設計書には「いってらっしゃい。」案もある。変えるならここの1行だけ）
// ============================================
export default function SendoffPage() {
  return (
    <>
      <main className="sendoff">
        <p>がんばってください！</p>
        {/* デモ用：昼の画面へ */}
        <Link href="/today" className="ghost gray">▸ ひる</Link>
      </main>
      <Footer />
    </>
  );
}
