"use client";

import { useEffect, useState } from 'react';
import Link from "next/link";
import { CheckIcon } from "../../components";

// ④ おわり画面：振り返り完了後に表示する。
// メッセージは固定テキスト。
export default function DonePage() {
  const [msg] = useState<string>("おつかれさまでした\nあなたの時間をお過ごしください");

  return (
    <main className="night done">
      <div className="moon" />
      <div className="night-center">
        <div className="box">
          <span className="box-check">
            <CheckIcon size={24} color="#9DC0AC" />
          </span>
        </div>
        <p className="done-title" style={{ whiteSpace: 'pre-line' }}>
          {msg}
        </p>
        <p className="done-sub">つづきは、あすの朝に</p>
      </div>
      <Link href="/morning" className="ghost">
        ▸ あさ
      </Link>
    </main>
  );
}
