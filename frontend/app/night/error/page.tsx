"use client";

import { Suspense } from "react";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

// ============================================
// 夜のエラー画面（Figma 02-1 / 02-2 / 05-1 対応）
// 置き場所: frontend/app/night/error/page.tsx（新規フォルダ error を作る）
//
// URLの ?reason= で3つの顔を使い分ける1枚:
//   /night/error?reason=mic      … マイクが使えない（許可拒否）
//   /night/error?reason=unheard  … 聞き取れなかった（バックの422）
//   /night/error?reason=offline  … 送れなかった（電波・サーバー不調）
// reasonが無い/不明なときは offline の顔になる（安全側）。
//
// クエリの読み取りは window.location 方式（こせっちの
// settings/line と同じやり方。静的書き出しでも動く）。
// ============================================

type Reason = "mic" | "unheard" | "offline";

const COPY: Record<
  Reason,
  { title: string; sub1: string; sub2: string; retry: string }
> = {
  mic: {
    title: "マイクが使えませんでした",
    sub1: "スマホの設定で、このアプリのマイクを",
    sub2: "許可してください。変えたら、もう一度どうぞ。",
    retry: "もう一度ためす",
  },
  unheard: {
    title: "うまく聞き取れませんでした",
    sub1: "まわりの音が大きかったのかもしれません。",
    sub2: "もう一度、ゆっくりで大丈夫です。",
    retry: "もう一度話す",
  },
  offline: {
    title: "いま、預かれませんでした",
    sub1: "電波か、サーバーの調子かもしれません。",
    sub2: "少し待って、もう一度お願いします。",
    retry: "もう一度ためす",
  },
};

function NightErrorContent() {
  const searchParams = useSearchParams();
  const value = searchParams.get("reason");

  const reason: Reason =
    value === "mic" || value === "unheard" || value === "offline"
      ? value
      : "offline";

  const copy = COPY[reason];

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #1C382E 0%, #152B22 100%)",
        color: "#F6F1E6",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "24px",
      }}
    >
      {/* 静かになった波形（かざり） */}
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: 16,
          background: "rgba(246,241,230,.12)",
          border: "1.5px solid rgba(246,241,230,.3)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 4,
          marginBottom: 22,
        }}
      >
        {[9, 14, 6, 12, 8].map((height, index) => (
          <span
            key={index}
            style={{
              width: 3,
              height,
              borderRadius: 2,
              background: "#9DC0AC",
              opacity: 0.55,
            }}
          />
        ))}
      </div>

      <h1 style={{ fontSize: 19, fontWeight: 900, letterSpacing: ".02em" }}>
        {copy.title}
      </h1>

      <p
        style={{
          fontSize: 12,
          fontWeight: 700,
          color: "#9DC0AC",
          lineHeight: 1.9,
          marginTop: 12,
        }}
      >
        {copy.sub1}
        <br />
        {copy.sub2}
      </p>

      {/* もう一度（きいている画面へ戻って録音し直す） */}
      <Link
        href="/listening"
        style={{
          marginTop: 30,
          background: "#DDA84F",
          color: "#1C382E",
          borderRadius: 999,
          padding: "14px 44px",
          fontSize: 14,
          fontWeight: 900,
          textDecoration: "none",
        }}
      >
        {copy.retry}
      </Link>

      {/* 逃げ道（夜画面へ。責めない） */}
      <Link
        href="/night"
        style={{
          marginTop: 20,
          color: "#9DC0AC",
          fontSize: 12,
          fontWeight: 800,
          textDecoration: "underline",
          textUnderlineOffset: 4,
        }}
      >
        今夜はやめておく
      </Link>
    </main>
  );
}

export default function NightErrorPage() {
  return (
    <Suspense
      fallback={
        <main
          style={{
            minHeight: "100vh",
            display: "grid",
            placeItems: "center",
            background: "#1C382E",
            color: "#F6F1E6",
          }}
        >
          <p>画面を読み込んでいます。</p>
        </main>
      }
    >
      <NightErrorContent />
    </Suspense>
  );
}
