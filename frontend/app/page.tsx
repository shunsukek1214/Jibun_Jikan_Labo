import { GoogleIcon } from "../components";

type LoginPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

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

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const authError = Array.isArray(params.auth_error)
    ? params.auth_error[0]
    : params.auth_error;

  const apiBase = (
    process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000"
  ).replace(/\/$/, "");

  const forceConsent = authError === "missing_refresh_token";
  const loginUrl = `${apiBase}/api/v1/auth/google/start${
    forceConsent ? "?force_consent=true" : ""
  }`;

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

      <a href={loginUrl} className="google-btn">
        <GoogleIcon />
        {forceConsent ? "Googleへ再同意する" : "Googleではじめる"}
      </a>

      <p className="login-note">Googleカレンダーと連携してログイン</p>
    </main>
  );
}
