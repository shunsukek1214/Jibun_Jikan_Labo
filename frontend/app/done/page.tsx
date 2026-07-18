import Link from 'next/link';
import { CheckIcon } from '../../components';

// ============================================
// ④ おわりの画面（Figma 4枚目）
// 言葉が箱にしまわれて、今日はおしまい。
// 文言はFigmaのまま。
// ============================================
export default function DonePage() {
  return (
    <main className="night done">
      <div className="moon" />

      <div className="night-center">
        {/* しまわれた箱 */}
        <div className="box">
          <span className="box-check"><CheckIcon size={24} color="#9DC0AC" /></span>
        </div>

        <p className="done-title">
          おつかれさまでした
          <br />
          あなたの時間をお過ごしください
        </p>
        <p className="done-sub">つづきは、あすの朝に</p>
      </div>

      {/* デモ用：翌朝へ進むリンク */}
      <Link href="/morning" className="ghost">▸ あさ</Link>
    </main>
  );
}
