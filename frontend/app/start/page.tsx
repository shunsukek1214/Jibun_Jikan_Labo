"use client";

import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import Link from "next/link";

// ============================================
// ⓪ はじまり画面（丸アイコン3つ版）
// 置き場所: frontend/app/start/page.tsx（丸ごと置き換え）
//
// 構成：
//   上   … ログインと同じ時計リング＋ロゴ（アプリの顔）
//   中央下 … 丸ボタン3つ〔あさ／きょうやること／よる〕
//
// 時間帯で「いまはこちら」の丸だけ大きく金リングで光る。
// 所定勤務時間＝8:00〜17:00（チーム決定）を基準に：
//   あさ＝始業前 4:00〜7:59
//   きょうやること＝勤務時間内 8:00〜16:59
//   よる＝終業後 17:00〜翌3:59（深夜0〜4時は「まだ今日の夜」扱い）
// さらに夜の時間帯は、画面ごと夜の色に変わる。
// 時計の判定は useEffect（サーバーとブラウザのズレ防止のため、
// 最初はどれも光らせず、ブラウザ側で判定してから光らせる）。
// ============================================

type Phase = "morning" | "day" | "night" | null;

function phaseByHour(hour: number): Phase {
  if (hour >= 4 && hour < 8) return "morning";
  if (hour >= 8 && hour < 17) return "day";
  return "night";
}

// 時間帯ごとの挨拶＋「いまの1行」
const HINTS: Record<"morning" | "day" | "night", [string, string]> = {
  morning: ["おはようございます。", "昨日を振り返って、今日を整える時間です。"],
  day: ["こんにちは。", "きょうのやることを、たしかめる時間です。"],
  night: ["おつかれさまでした。", "明日の予定を、預ける時間です。"],
};

// ---- アイコン（かざり） ----

function SunIcon({ color }: { color: string }) {
  return (
    <svg width="32" height="32" viewBox="0 0 34 34">
      <circle cx="17" cy="17" r="7.5" fill={color} />
      <g stroke={color} strokeWidth="2.6" strokeLinecap="round">
        <line x1="17" y1="2" x2="17" y2="6.5" />
        <line x1="17" y1="27.5" x2="17" y2="32" />
        <line x1="2" y1="17" x2="6.5" y2="17" />
        <line x1="27.5" y1="17" x2="32" y2="17" />
        <line x1="6.4" y1="6.4" x2="9.5" y2="9.5" />
        <line x1="24.5" y1="24.5" x2="27.6" y2="27.6" />
        <line x1="6.4" y1="27.6" x2="9.5" y2="24.5" />
        <line x1="24.5" y1="9.5" x2="27.6" y2="6.4" />
      </g>
    </svg>
  );
}

function TodoIcon({ color }: { color: string }) {
  return (
    <svg width="30" height="30" viewBox="0 0 30 30">
      <rect
        x="4"
        y="4"
        width="22"
        height="22"
        rx="6"
        fill="none"
        stroke={color}
        strokeWidth="2.6"
      />
      <path
        d="M10 15.5 l4 4 l7 -8"
        stroke={color}
        strokeWidth="2.6"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MoonIcon2({ color }: { color: string }) {
  return (
    <svg width="28" height="28" viewBox="0 0 26 26">
      <path
        d="M19 3 A11 11 0 1 0 23 15.5 A8.8 8.8 0 0 1 19 3 Z"
        fill={color}
      />
    </svg>
  );
}

// ---- 丸ボタン1個ぶん ----

function RoundOption({
  href,
  label,
  active,
  night,
  circleStyle,
  children,
}: {
  href: string;
  label: string;
  active: boolean;
  night: boolean;
  circleStyle: CSSProperties;
  children: ReactNode;
}) {
  const size = active ? 94 : 76;

  return (
    <Link
      href={href}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 9,
        position: "relative",
      }}
    >
      {active && (
        <span
          style={{
            position: "absolute",
            top: -32,
            left: "50%",
            transform: "translateX(-50%)",
            background: "#DDA84F",
            color: "#1C382E",
            fontSize: 10.5,
            fontWeight: 900,
            borderRadius: 999,
            padding: "4px 11px",
            whiteSpace: "nowrap",
          }}
        >
          いまはこちら
        </span>
      )}
      <span
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: active
            ? "0 0 0 4px rgba(221,168,79,.9), 0 0 0 13px rgba(221,168,79,.18)"
            : undefined,
          ...circleStyle,
        }}
      >
        {children}
      </span>
      <span
        style={{
          fontSize: 11.5,
          fontWeight: 800,
          letterSpacing: "0.06em",
          color: night
            ? active
              ? "#F4E1BB"
              : "rgba(246,241,230,.75)"
            : active
              ? "#2E5548"
              : "#5C6B62",
        }}
      >
        {label}
      </span>
    </Link>
  );
}

export default function StartPage() {
  const [phase, setPhase] = useState<Phase>(null);

  useEffect(() => {
    setPhase(phaseByHour(new Date().getHours()));
  }, []);

  const night = phase === "night";
  const hint = phase ? HINTS[phase] : null;

  // 丸の中の色（昼の見た目 ／ 夜の見た目）
  const asaCircle: CSSProperties = night
    ? {
        background: "rgba(246,241,230,.1)",
        border: "1.5px solid rgba(246,241,230,.28)",
      }
    : { background: "#FFFFFF", border: "1.5px solid #E9E4D6" };

  const todoCircle: CSSProperties = night
    ? {
        background: "rgba(246,241,230,.1)",
        border: "1.5px solid rgba(246,241,230,.28)",
      }
    : {
        background: phase === "day" ? "#FFFFFF" : "#EEF4EF",
        border: "1.5px solid #DFE8DF",
      };

  const yoruCircle: CSSProperties = night
    ? { background: "#DDA84F" }
    : { background: "linear-gradient(172deg, #24443A, #1C382E)" };

  return (
    <main
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "0 24px",
        background: night
          ? "linear-gradient(172deg, #24443A, #1C382E 70%)"
          : undefined,
        transition: "background .4s",
      }}
    >
      <div style={{ height: "17vh" }} />

      {/* ログインと同じ時計リング（アプリの顔） */}
      <div className="ring">
        <div className="hands" />
      </div>
      <p
        style={{
          fontSize: 20,
          fontWeight: 800,
          color: night ? "#F6F1E6" : "#2E5548",
          margin: "18px 0 0",
        }}
      >
        じぶん時間ラボ
      </p>

      <div style={{ flex: 1 }} />

      {/* 挨拶＋いまの1行（判定前は高さだけ確保） */}
      <p
        style={{
          fontSize: 12.5,
          fontWeight: 700,
          lineHeight: 1.8,
          textAlign: "center",
          color: night ? "rgba(246,241,230,.8)" : "#5C6B62",
          margin: 0,
          minHeight: 45,
        }}
      >
        {hint ? (
          <>
            {hint[0]}
            <br />
            {hint[1]}
          </>
        ) : (
          " "
        )}
      </p>

      {/* 丸ボタン3つ */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: 22,
          marginTop: 30,
        }}
      >
        <RoundOption
          href="/morning/listening"
          label="あさ"
          active={phase === "morning"}
          night={night}
          circleStyle={asaCircle}
        >
          <SunIcon color={night ? "rgba(244,225,187,.85)" : "#DDA84F"} />
        </RoundOption>

        <RoundOption
          href="/today"
          label="きょうやること"
          active={phase === "day"}
          night={night}
          circleStyle={todoCircle}
        >
          <TodoIcon color={night ? "rgba(246,241,230,.85)" : "#2E5548"} />
        </RoundOption>

        <RoundOption
          href="/night"
          label="よる"
          active={night}
          night={night}
          circleStyle={yoruCircle}
        >
          <MoonIcon2 color={night ? "#1C382E" : "#F4E1BB"} />
        </RoundOption>
      </div>

      <div style={{ height: "13vh" }} />
    </main>
  );
}
