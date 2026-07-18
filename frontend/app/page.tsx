import Link from 'next/link';
import { GoogleIcon } from '../components';

// ============================================
// ① ログイン画面（Figma 1枚目）
// 「Googleではじめる」→ いまは夜の画面へ。
// 本物のGoogleログインは、バックの /auth/google/start ができたら
// href をそこに差し替えるだけ。
// ============================================
export default function LoginPage() {
  return (
    <main className="login">
      {/* 時計の輪ロゴ */}
      <div className="ring"><div className="hands" /></div>

      <h1>じぶん時間ラボ</h1>
      <p className="catch">今日を、ここに置いていく。</p>

      <Link href="/night" className="google-btn">
        <GoogleIcon />
        Googleではじめる
      </Link>
      <p className="login-note">Googleカレンダーと連携してログイン</p>
    </main>
  );
}
