"use client";

import Link from "next/link";
import type { CSSProperties } from "react";

// ============================================
// 全ページ共通の「もどる」ボタン
// 置き場所: frontend/back-button.tsx（api.ts・components.tsx と同じ階層）
//
// 使い方: 各ページの <main ...> の直後に1行置くだけ。
//   暗い背景（夜・朝の緑）: <BackButton to="/night" dark />
//   明るい背景（昼・設定）: <BackButton to="/start" />
//
// to は「もどった先」を固定で指定する。
// ブラウザ履歴に頼らないので、URL直打ちやログイン直後でも
// 必ず決まった場所へ戻れる（デモ中に迷子にならない）。
// ============================================

type Props = {
  to: string;
  dark?: boolean;
  label?: string;
  style?: CSSProperties;
};

export function BackButton({
  to,
  dark = false,
  label = "もどる",
  style,
}: Props) {
  return (
    <Link
      href={to}
      style={{
        alignSelf: "flex-start",
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "6px 14px 6px 10px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 800,
        lineHeight: 1,
        color: dark ? "rgba(246,241,230,.85)" : "#5C6B62",
        background: dark ? "rgba(246,241,230,.14)" : "rgba(38,54,47,.07)",
        ...style,
      }}
    >
      <span style={{ fontSize: 14, lineHeight: 1 }}>‹</span>
      {label}
    </Link>
  );
}
