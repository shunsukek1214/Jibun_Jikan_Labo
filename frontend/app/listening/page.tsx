"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { ApiError, sendUtterance } from "../../api";
import { BackButton } from "../../back-button";

// ============================================
// ③ きいている画面（発話誘導＋録音品質アップ版）
// 置き場所: frontend/app/listening/page.tsx（丸ごと置き換え）
//
// 前回からの変更点:
//   1. 発話誘導コピー — 「何を話せばいいか」を例文で見せる
//      （りすちゃんFB: 誘導しないと欲しい発話は出てこない）
//   2. 録音品質 — マイクにノイズ抑制・エコー除去・自動音量を指定し、
//      対応ブラウザではopus 128kbpsで録音（文字起こし精度の底上げ）
// エラー振り分け（/night/error）は前回のまま。
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
      .getUserMedia({
        audio: {
          // まわりの雑音・エコー・声量ムラをブラウザ側で整えてから録る
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      })
      .then((stream) => {
        // 対応していれば高めのビットレートのopusで録音する
        const options: MediaRecorderOptions = {};
        if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
          options.mimeType = "audio/webm;codecs=opus";
          options.audioBitsPerSecond = 128000;
        }

        const recorder = new MediaRecorder(stream, options);
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
      <BackButton to="/night" dark />

      {/* 音の波（かざり） */}
      <div className="waves">
        {[16, 30, 44, 26, 38, 20, 32].map((height, index) => (
          <i
            key={index}
            style={{ height, animationDelay: `${index * 0.12}s` }}
          />
        ))}
      </div>

      {/* 発話の誘導：質問ではなく「答えの型」を見せる */}
      <div className="heard">
        <p style={{ fontWeight: 800, fontSize: 15 }}>
          あしたやることを、時間と一緒にどうぞ。
        </p>
        <p style={{ opacity: 0.75 }}>
          例：「10時にA社の見積もり。午後は資料づくり。
          <br />
          13時から1on1。経費精算もやらなきゃ」
        </p>
        <p style={{ opacity: 0.75 }}>
          順番バラバラ・思いつくままで大丈夫です。
        </p>
        {message && (
          <p style={{ color: "#F4E1BB", fontWeight: 800 }}>{message}</p>
        )}
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
