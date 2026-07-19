'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckIcon } from '../../components';
import { getReflect2 } from '../../api';

// ④ おわり画面：見出しの文字をバックエンド(reflect2)からもらう結合テスト版。
// 届かないときはFigmaの文字のまま → デモは絶対に壊れない。
export default function DonePage() {
  const [msg, setMsg] = useState('おつかれさまでした');

  useEffect(() => {
    getReflect2().then((m) => { if (m) setMsg(m); });
  }, []);

  return (
    <main className="night done">
      <div className="moon" />
      <div className="night-center">
        <div className="box">
          <span className="box-check"><CheckIcon size={24} color="#9DC0AC" /></span>
        </div>
        <p className="done-title">
          {msg}
          <br />
          あなたの時間をお過ごしください
        </p>
        <p className="done-sub">つづきは、あすの朝に</p>
      </div>
      <Link href="/morning" className="ghost">▸ あさ</Link>
    </main>
  );
}