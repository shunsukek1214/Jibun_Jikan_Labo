"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { CheckIcon } from "../../../components";

// ============================================
// 朝・振り返りおわり画面
// 置き場所: frontend/app/morning/done/page.tsx
// （morning の下に新規フォルダ done を作る）
//
// 「ありがとうございます！今日の予定をお伝えしますね」
// → 2秒後に自動で /morning（今日の時間割）へ。
// 待てない人のためにボタンも置いてある。
// ============================================

export default function MorningDonePage() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push("/morning");
    }, 2000);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <main
      style={{
        flex: 1,
        background: "linear-gradient(172deg, #5D8B75, #4F7B68 70%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 20,
        textAlign: "center",
        padding: 24,
      }}
    >
      {/* 受け取り箱（かざり） */}
      <div
        style={{
          width: 84,
          height: 58,
          borderRadius: 12,
          background: "rgba(246,241,230,.12)",
          border: "1.5px solid rgba(246,241,230,.35)",
          position: "relative",
        }}
      >
        <span
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <CheckIcon size={24} color="#F4E1BB" />
        </span>
      </div>

      <p
        style={{
          fontSize: 17,
          fontWeight: 800,
          color: "#F6F1E6",
          lineHeight: 1.8,
          margin: 0,
        }}
      >
        ありがとうございます！
        <br />
        今日の予定をお伝えしますね
      </p>

      <Link
        href="/morning"
        style={{
          marginTop: 6,
          background: "#DDA84F",
          color: "#1C382E",
          borderRadius: 999,
          padding: "13px 40px",
          fontSize: 14,
          fontWeight: 900,
        }}
      >
        今日の時間割を見る
      </Link>
    </main>
  );
}
