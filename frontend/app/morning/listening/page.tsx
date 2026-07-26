"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { ApiError, createReflection } from "../../../api";
import { BackButton } from "../../../back-button";

// ============================================
// 朝・振り返りをきいている画面
// 置き場所: frontend/app/morning/listening/page.tsx
// （morning の下に新規フォルダ listening を作る）
//
// 夜の /listening と同じ作り。違いは3つだけ:
//   1. 見た目が朝の緑（夜の紺緑ではなく）
//   2. 送り先が createReflection（api.tsにこせっちが用意済み）
//      - reflection_date = 昨日（昨日の過ごし方を話すため）
//      - proposal_date   = 今日（AIの提案を今日に反映するため）
//   3. 成功したら /morning/done へ
//
// エラーはこの画面の中で案内して、もう一度ためせる
// （ページを開き直すと録音が再スタートする仕組みを使う）。
// ============================================

// api.ts の dateInTokyo と同じ計算（api.ts側は非公開のため自前で持つ）
function dateInTokyo(offsetDays: number): string {
  const target = new Date(Date.now() + offsetDays * 24 * 60 * 60 * 1000);
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(target);
  const values = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

// ApiError の中身から「Googleカレンダーに繋がらない401」かを見分ける
function isCalendarUnavailable(error: ApiError): boolean {
  const detail = error.detail as { detail?: { code?: string } } | null;
  return detail?.detail?.code === "google_calendar_unavailable";
}

export default function MorningListeningPage() {
  const router = useRouter();
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");
  const [failed, setFailed] = useState(false);

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
        setFailed(true);
        setMessage(
          "マイクを使えませんでした。スマホの設定でマイクを許可して、もう一度どうぞ。",
        );
      });

    // 画面を離れるときはマイクを返す
    return () => {
      recorderRef.current?.stream.getTracks().forEach((track) => track.stop());
    };
  }, []);

  // ■ボタン：録音を止めて、振り返りを送って、おわりへ
  const finish = () => {
    const recorder = recorderRef.current;

    if (!recorder || recorder.state === "inactive") {
      setMessage("録音データがありません。");
      return;
    }

    setSending(true);
    setMessage("今日の時間割に反映しています…");

    recorder.onstop = async () => {
      const audio = new Blob(chunksRef.current, { type: "audio/webm" });
      recorder.stream.getTracks().forEach((track) => track.stop());

      try {
        // 昨日を振り返り、提案は今日に反映する
        await createReflection(audio, dateInTokyo(-1), dateInTokyo(0));
        router.push("/morning/done");
      } catch (error) {
        setSending(false);
        setFailed(true);

        if (error instanceof ApiError && error.status === 401) {
          if (isCalendarUnavailable(error)) {
            setMessage(
              "Googleカレンダーに接続できませんでした。少し待って、もう一度どうぞ。",
            );
            return;
          }
          // ログインセッション切れ → ログインからやり直し
          window.location.assign("/?auth_error=session_expired");
          return;
        }

        if (error instanceof ApiError && error.status === 422) {
          setMessage(
            "うまく聞き取れませんでした。もう一度、ゆっくりで大丈夫です。",
          );
          return;
        }

        setMessage(
          "いま、送れませんでした。電波を確認して、もう一度お願いします。",
        );
      }
    };

    recorder.stop();
  };

  return (
    <main
      style={{
        flex: 1,
        background: "linear-gradient(172deg, #5D8B75, #4F7B68 70%)",
        display: "flex",
        flexDirection: "column",
        padding: "40px 26px calc(24px + env(safe-area-inset-bottom, 0px))",
      }}
    >
      {/* 音の波（かざり）。失敗中は静かに止める */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 5,
          height: 54,
        }}
      >
        {[16, 30, 44, 26, 38, 20, 32].map((height, index) => (
          <i
            key={index}
            style={{
              width: 5,
              height,
              borderRadius: 3,
              background: "#F4E1BB",
              opacity: failed ? 0.35 : 0.95,
              animation: failed
                ? "none"
                : `wave 1.1s ease-in-out ${index * 0.12}s infinite`,
            }}
          />
        ))}
      </div>

      {/* 問いかけ */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 10,
        }}
      >
        <p
          style={{
            fontSize: 15,
            fontWeight: 800,
            lineHeight: 1.7,
            color: "#F6F1E6",
            margin: 0,
          }}
        >
          おはようございます。
          <br />
          昨日は、どんな一日でしたか？
        </p>
        <p
          style={{
            fontSize: 12,
            fontWeight: 700,
            lineHeight: 1.8,
            color: "rgba(246,241,230,.75)",
            margin: 0,
          }}
        >
          できたこと、ズレたこと、今日の気がかり——
          <br />
          思いつくままで大丈夫です。
        </p>
        {message && (
          <p
            style={{
              fontSize: 12.5,
              fontWeight: 800,
              lineHeight: 1.8,
              color: "#F4E1BB",
              margin: "6px 0 0",
            }}
          >
            {message}
          </p>
        )}
      </div>

      {/* 失敗したら：もう一度 ／ うまくいけば：停止ボタン */}
      {failed ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 14,
          }}
        >
          <button
            onClick={() => window.location.reload()}
            style={{
              background: "#DDA84F",
              color: "#1C382E",
              borderRadius: 999,
              padding: "14px 44px",
              fontSize: 14,
              fontWeight: 900,
            }}
          >
            もう一度ためす
          </button>
          <Link
            href="/start"
            style={{
              color: "rgba(246,241,230,.7)",
              fontSize: 12,
              fontWeight: 800,
              textDecoration: "underline",
              textUnderlineOffset: 4,
            }}
          >
            あとにする
          </Link>
        </div>
      ) : (
        <button
          onClick={finish}
          aria-label="話しおわった"
          disabled={sending}
          style={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            background: "#DDA84F",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            alignSelf: "center",
            boxShadow: "0 10px 26px -8px rgba(221,168,79,.5)",
            opacity: sending ? 0.6 : 1,
          }}
        >
          <i
            style={{
              width: 20,
              height: 20,
              borderRadius: 5,
              background: "#2E4A3E",
            }}
          />
        </button>
      )}
      <BackButton to="/start" dark />
    </main>
  );
}
