'use client';
import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { sendUtterance } from '../../api';

// ============================================
// ③ きいている画面（Figma 3枚目）
// 開いた瞬間から録音がはじまる。■で止めると
// 音声をバックエンドへ送って「おわり」へ進む。
//
// 録音のしくみ（2ステップだけ）:
//   1. getUserMedia でマイクを借りる（許可ダイアログが出る）
//   2. MediaRecorder で録音 → 止めると音声ファイル(Blob)になる
// 画面に出ている3行はFigmaと同じ見本の文字（演出）。
// 本物の文字起こしはバックエンド（Azure Speech）の仕事。
// ============================================
export default function ListeningPage() {
  const router = useRouter();
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // 画面が開いたら録音スタート
  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        const rec = new MediaRecorder(stream);
        rec.ondataavailable = (e) => chunksRef.current.push(e.data); // 音声のかけらを貯める
        rec.start();
        recorderRef.current = rec;
      })
      .catch(() => {
        // マイクを許可されなくても画面はそのまま動く
        console.log('マイクが使えませんでした');
      });

    // 画面を離れるときはマイクを返す
    return () => {
      recorderRef.current?.stream.getTracks().forEach((t) => t.stop());
    };
  }, []);

  // ■ボタン：録音を止めて、音声を送って、おわりへ
  const finish = () => {
    const rec = recorderRef.current;
    if (rec && rec.state !== 'inactive') {
      rec.onstop = () => {
        const audio = new Blob(chunksRef.current, { type: 'audio/webm' });
        sendUtterance(audio); // バックエンドへ（未接続でも止まらない）
        rec.stream.getTracks().forEach((t) => t.stop());
      };
      rec.stop();
    }
    router.push('/done');
  };

  return (
    <main className="listening">
      {/* 音の波（かざり） */}
      <div className="waves">
        {[16, 30, 44, 26, 38, 20, 32].map((h, i) => (
          <i key={i} style={{ height: h, animationDelay: `${i * 0.12}s` }} />
        ))}
      </div>

      {/* 話した言葉（Figmaと同じ見本文） */}
      <div className="heard">
        <p>えー、今日は会議がのびて、資料ぜんぜん手つかず…</p>
        <p>経費精算もまだ。あしたの朝イチかなあ。</p>
        <p>あと、Bさんに連絡返すの忘れてた。</p>
      </div>

      {/* 停止ボタン */}
      <button className="stop-btn" onClick={finish} aria-label="話しおわった">
        <i />
      </button>
    </main>
  );
}
