"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { ApiError, sendUtterance } from "../../api";
import { BackButton } from '../../back-button';

// ============================================
// ③ きいている画面（エラー振り分け対応版）
// 置き場所: frontend/app/listening/page.tsx（丸ごと置き換え）
//
// こせっちの実装（await送信・401はログインへ）はそのまま生かして、
// 失敗の種類ごとに専用のエラー画面 /night/error へ振り分ける:
//   ・マイク拒否            → /night/error?reason=mic
//   ・422（聞き取れず）      → /night/error?reason=unheard
//   ・その他の失敗（電波等）  → /night/error?reason=offline
//   ・401（セッション切れ）   → /?auth_error=session_expired（従来どおり）
// ============================================

export default function ListeningPage() {
  const router = useRouter();
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");

  // 画面が開いたら録音スタート
  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        const recorder = new MediaRecorder(stream);
        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) chunksRef.current.push(event.data);
        };
        recorder.start();
        recorderRef.current = recorder;
      })
      .catch(() => {
        // マイクを許可してもらえなかった → 専用画面で案内する
        router.push("/night/error?reason=mic");
      });

    // 画面を離れるときはマイクを返す
    return () => {
      recorderRef.current?.stream.getTracks().forEach((track) => track.stop());
    };
  }, [router]);

  // ■ボタン：録音を止めて、音声を送って、おわりへ
  const finish = () => {
    const recorder = recorderRef.current;

    if (!recorder || recorder.state === "inactive") {
      setMessage("録音データがありません。");
      return;
    }

    setSending(true);
    setMessage("あずかっています…");

    recorder.onstop = async () => {
      const audio = new Blob(chunksRef.current, { type: "audio/webm" });
      recorder.stream.getTracks().forEach((track) => track.stop());

      try {
        await sendUtterance(audio);
        router.push("/done");
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          // セッション切れ → ログインからやり直し（こせっち実装のまま）
          window.location.assign("/?auth_error=session_expired");
          return;
        }

        if (error instanceof ApiError && error.status === 422) {
          // バックの「音声を認識できませんでした」→ 聞き取れなかった画面へ
          router.push("/night/error?reason=unheard");
          return;
        }

        // それ以外（電波が無い・サーバー不調・500など）
        router.push("/night/error?reason=offline");
      }
    };

    recorder.stop();
  };

  return (
    <main className="listening">
      {/* 音の波（かざり） */}
      <div className="waves">
        {[16, 30, 44, 26, 38, 20, 32].map((height, index) => (
          <i
            key={index}
            style={{ height, animationDelay: `${index * 0.12}s` }}
          />
        ))}
      </div>

      {/* 話した言葉（Figmaと同じ見本文） */}
      <div className="heard">
        <p>明日の予定とタスクを話してください。</p>
        {message && <p>{message}</p>}
      </div>

      {/* 停止ボタン */}
      <button
        className="stop-btn"
        onClick={finish}
        aria-label="話しおわった"
        disabled={sending}
      >
        <i />
      </button>
      <BackButton to="/start" dark />
    </main>
  );
}
