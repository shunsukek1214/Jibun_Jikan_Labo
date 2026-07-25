import Link from 'next/link';
import { Footer, MicIcon } from '../../components';
import { Clock } from '../../clock';

// ============================================
// ② 夜の画面（Figma 2枚目）
// おつかれさまでした ＋ マイクだけ。
// マイクをタップ →「きいている」へ。
// ============================================
export default function NightPage() {
  return (
    <>
      <main className="night">
        <div className="moon" />

        <div className="night-center">
          <p className="night-greet">おつかれさまでした</p>
          <p className="night-date"><Clock /></p>

          <Link href="/listening" className="mic-btn" aria-label="話す">
            <MicIcon />
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
