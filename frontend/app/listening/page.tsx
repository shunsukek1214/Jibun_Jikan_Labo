"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { ApiError, sendUtterance } from "../../api";

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
        // マイクを許可されなくても画面はそのまま動く
        setMessage(
          "マイクを使用できません。ブラウザの許可設定を確認してください。",
        );
      });

    // 画面を離れるときはマイクを返す
    return () => {
      recorderRef.current?.stream.getTracks().forEach((track) => track.stop());
    };
  }, []);

  // ■ボタン：録音を止めて、音声を送って、おわりへ
  const finish = () => {
    const recorder = recorderRef.current;

    if (!recorder || recorder.state === "inactive") {
      setMessage("録音データがありません。");
      return;
    }

    setSending(true);
    setMessage("予定を保存しています。");

    recorder.onstop = async () => {
      const audio = new Blob(chunksRef.current, { type: "audio/webm" });
      recorder.stream.getTracks().forEach((track) => track.stop());

      try {
        await sendUtterance(audio); // バックエンドへ（未接続でも止まらない）
        router.push("/done");
      } catch (error) {
        setSending(false);

        if (error instanceof ApiError && error.status === 401) {
          window.location.assign("/?auth_error=session_expired");
          return;
        }

        setMessage(
          "予定を保存できませんでした。FastAPIのログを確認してください。",
        );
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
    </main>
  );
}
