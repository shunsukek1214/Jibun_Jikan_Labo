import Link from 'next/link';
import { googleAuthUrl } from '../lib/api';
import { GoogleIcon } from '../components/icons';

/** ログイン（入口）。Google OAuth へは FastAPI /auth/google/start 経由（図4/5）。 */
export default function LoginPage() {
  return (
    <main className="splash">
      <div className="ring"><div className="hands" /></div>
      <h1>じぶん時間ラボ</h1>
      <div className="catch">今日を、ここに置いていく。</div>

      <a className="cta" href={googleAuthUrl}>
        <GoogleIcon />
        Googleではじめる
      </a>
      <p className="sub-note">Googleカレンダーと連携します</p>

      {/* バック未接続でもチームが触れるように */}
      <Link className="demo-link" href="/now">まずはさわってみる →</Link>
    </main>
  );
}
