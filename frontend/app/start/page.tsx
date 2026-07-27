"use client";

import { useSyncExternalStore, type CSSProperties } from "react";
import Link from "next/link";

import { Footer } from "../../components";

// ============================================
// ⓪ はじまり画面（ログイン後の分岐）
// 置き場所: frontend/app/start/page.tsx（新規フォルダ start を作る）
//
// 夜：明日の予定を預ける → /night
// 朝：昨日を振り返って今日を整える → /morning/listening
//
// 時間帯でおすすめバッジ「いまはこちら」を出す。
//   朝 4:00〜11:59 → あさ側
//   夜 16:00〜翌3:59 → よる側
//   昼はどちらも出さない
// 時計はブラウザでしか分からないので useEffect で判定する
// （最初は出さない＝サーバーとブラウザの表示ズレを防ぐ）。
// ============================================

type Suggest = "night" | "morning" | null;

function suggestByHour(hour: number): Suggest {
  if (hour >= 4 && hour < 12) return "morning";
  if (hour >= 16 || hour < 4) return "night";
  return null;
}

function subscribeToClock(onStoreChange: () => void): () => void {
  const intervalId = window.setInterval(onStoreChange, 60_000);

  return () => {
    window.clearInterval(intervalId);
  };
}

function getClientSuggest(): Suggest {
  return suggestByHour(new Date().getHours());
}

function getServerSuggest(): Suggest {
  return null;
}

const badgeStyle: CSSProperties = {
  position: "absolute",
  top: 14,
  right: 14,
  background: "#DDA84F",
  color: "#1C382E",
  fontSize: 10.5,
  fontWeight: 800,
  borderRadius: 999,
  padding: "4px 10px",
  letterSpacing: "0.04em",
};

export default function StartPage() {
  const suggest = useSyncExternalStore(
    subscribeToClock,
    getClientSuggest,
    getServerSuggest,
  );

  return (
    <>
      <main
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: 12,
          padding: "16px 18px 14px",
          minHeight: 0,
        }}
      >
        <p
          style={{
            textAlign: "center",
            fontSize: 11,
            fontWeight: 700,
            color: "#8A968E",
            letterSpacing: "0.12em",
            margin: "2px 0 0",
          }}
        >
          じぶん時間ラボ
        </p>

        {/* よる：明日の予定を預ける */}
        <Link
          href="/night"
          style={{
            flex: 1,
            position: "relative",
            borderRadius: 22,
            background: "linear-gradient(172deg, #24443A, #1C382E 70%)",
            padding: "22px 22px 18px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            overflow: "hidden",
          }}
        >
          {suggest === "night" && <span style={badgeStyle}>いまはこちら</span>}
          {/* 月（かざり） */}
          <span
            style={{
              position: "absolute",
              top: 20,
              left: 22,
              width: 22,
              height: 22,
              borderRadius: "50%",
              background: "#F4E1BB",
              boxShadow:
                "inset -6px -3px 0 rgba(184,130,58,.35), 0 0 18px rgba(244,225,187,.35)",
            }}
          />
          <span
            style={{
              fontSize: 11,
              fontWeight: 800,
              color: "#DDA84F",
              letterSpacing: "0.18em",
            }}
          >
            よる
          </span>
          <span
            style={{
              fontSize: 19,
              fontWeight: 800,
              color: "#F6F1E6",
              margin: "6px 0 4px",
              lineHeight: 1.4,
            }}
          >
            明日の予定を、預ける
          </span>
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: "rgba(246,241,230,.65)",
              lineHeight: 1.7,
            }}
          >
            寝る前に30秒、吐き出すだけ。
            <br />
            あとは忘れて大丈夫。
          </span>
        </Link>

        {/* あさ：昨日を振り返って今日を整える */}
        <Link
          href="/morning/listening"
          style={{
            flex: 1,
            position: "relative",
            borderRadius: 22,
            background: "#FFFFFF",
            border: "1px solid rgba(38,54,47,.08)",
            padding: "22px 22px 18px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            overflow: "hidden",
          }}
        >
          {suggest === "morning" && (
            <span style={badgeStyle}>いまはこちら</span>
          )}
          {/* 太陽（かざり） */}
          <span
            style={{
              position: "absolute",
              top: 20,
              left: 22,
              width: 22,
              height: 22,
              borderRadius: "50%",
              background: "#DDA84F",
              boxShadow: "0 0 0 5px rgba(221,168,79,.22)",
            }}
          />
          <span
            style={{
              fontSize: 11,
              fontWeight: 800,
              color: "#A87A1E",
              letterSpacing: "0.18em",
            }}
          >
            あさ
          </span>
          <span
            style={{
              fontSize: 19,
              fontWeight: 800,
              color: "#2E5548",
              margin: "6px 0 4px",
              lineHeight: 1.4,
            }}
          >
            昨日を振り返って、今日を整える
          </span>
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: "#5C6B62",
              lineHeight: 1.7,
            }}
          >
            30秒話すと、AIが今日の時間割を
            <br />
            ブラッシュアップします。
          </span>
        </Link>
      </main>
      <Footer />
    </>
  );
}
