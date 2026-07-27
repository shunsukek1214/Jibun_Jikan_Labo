"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import { GoogleIcon } from "../components";
import { getCurrentUser } from "../api";

// ============================================
// ① ログイン画面（体感速度アップ版）
// 置き場所: frontend/app/page.tsx（丸ごと置き換え）
//
// 変更点は2つ:
//   1. 画面を開いた瞬間に /auth/me を裏で1回呼ぶ。
//      ・眠っているバックエンドをここで起こしておく
//        （ボタンを押す頃にはウォームアップ済み＝体感が速くなる）
//      ・すでにログイン済みなら、ボタンを押させずに /start へ直行
//   2. ボタンを押したら「Googleへ移動中…」表示にして、
//      無反応に見える時間をなくす
// ============================================

const ERROR_MESSAGES: Record<string, string> = {
  access_denied: "Googleログインまたはカレンダー連携がキャンセルされました。",
  invalid_state: "認証状態を確認できませんでした。最初からやり直してください。",
  expired_state: "認証操作の有効時間が切れました。最初からやり直してください。",
  missing_refresh_token:
    "カレンダーの自動更新に必要な権限を取得できませんでした。再同意してください。",
  account_conflict: "既存ユーザーとの紐付けを安全に完了できませんでした。",
  google_auth_failed: "Google認証を完了できませんでした。",
  internal_error: "認証処理中にサーバーエラーが発生しました。",
  session_expired: "ログインセッションの有効期限が切れました。",
  backend_unavailable: "FastAPIへ接続できませんでした。",
};

function LoginContent() {
  const searchParams = useSearchParams();
  const authError = searchParams.get("auth_error");
  const [leaving, setLeaving] = useState(false);

  // バックエンドのウォームアップ＋ログイン済みならスキップ
  useEffect(() => {
    // セッション切れで戻された直後は自動スキップしない
    // （また /start へ往復するループを防ぐ）
    if (authError) return;

    getCurrentUser()
      .then(() => {
        // Cookieのセッションがまだ生きている → ログイン不要
        window.location.replace("/start");
      })
      .catch(() => {
        // 未ログインや圏外は何もしない（この呼び出し自体が
        // バックエンドを起こす役目を果たしている）
      });
  }, [authError]);

  const apiBase = (
    process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000"
  ).replace(/\/$/, "");

  const forceConsent = authError === "missing_refresh_token";

  const loginUrl =
    `${apiBase}/api/v1/auth/google/start` +
    (forceConsent ? "?force_consent=true" : "");

  return (
    <main className="login">
      <div className="ring">
        <div className="hands" />
      </div>

      <h1>じぶん時間ラボ</h1>
      <p className="catch">今日を、ここに置いていく。</p>

      {authError && (
        <p className="auth-error">
          {ERROR_MESSAGES[authError] ?? "ログインを完了できませんでした。"}
        </p>
      )}

      <a
        href={loginUrl}
        className="google-btn"
        onClick={() => setLeaving(true)}
        style={leaving ? { opacity: 0.7, pointerEvents: "none" } : undefined}
      >
        <GoogleIcon />
        {leaving
          ? "Googleへ移動中…"
          : forceConsent
            ? "Googleへ再同意する"
            : "Googleではじめる"}
      </a>

      <p className="login-note">Googleカレンダーと連携してログイン</p>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="login">
          <p>画面を読み込んでいます。</p>
        </main>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
