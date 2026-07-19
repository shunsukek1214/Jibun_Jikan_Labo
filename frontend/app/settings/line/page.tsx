"use client";

// Next.jsのページ遷移用コンポーネントです。
import Link from "next/link";

// Reactの状態管理と、画面表示後の処理に使用します。
import { useCallback, useEffect, useState } from "react";

// この画面専用のCSSを読み込みます。
import styles from "./line.module.css";

/**
 * FastAPIの
 * GET /api/line/status
 * から返ってくるデータの形です。
 */
type LineStatus = {
  // じぶん時間ラボのユーザーとLINEが連携済みか
  linked: boolean;

  // LINE公式アカウントを友だち追加済みか
  is_friend: boolean;

  // not_linked、active、needs_friend、blocked等
  status: string;

  // LINE上の表示名
  display_name: string | null;
};

/**
 * FastAPIのURLを環境変数から取得します。
 *
 * ローカル環境の例：
 * http://127.0.0.1:8000
 *
 * URL末尾に「/」が付いていると、
 * //api/line/status のようになる可能性があるため、
 * replace()で末尾の「/」を削除しています。
 */
const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").replace(
  /\/$/,
  "",
);

/**
 * 現在はLINE機能の動作確認用として、
 * .env.localに書いたuser_idを使用します。
 *
 * 本番ではログイン情報からuser_idを取得するため、
 * この処理は将来的に削除します。
 */
const TEST_USER_ID = Number(process.env.NEXT_PUBLIC_LINE_TEST_USER_ID ?? "1");

/**
 * LINE通知設定画面です。
 */
export default function LineSettingsPage() {
  /**
   * FastAPIから取得したLINE連携状態を保存します。
   *
   * 初回表示時はまだデータがないためnullです。
   */
  const [status, setStatus] = useState<LineStatus | null>(null);

  /**
   * ユーザーに表示する案内・エラーメッセージです。
   */
  const [message, setMessage] = useState("");

  /**
   * FastAPIへ問い合わせ中かどうかを管理します。
   */
  const [loading, setLoading] = useState(true);

  /**
   * FastAPIから、現在のLINE連携状態を取得します。
   *
   * 呼び出すAPI：
   * GET /api/line/status?user_id=1
   */
  const loadStatus = useCallback(async () => {
    /**
     * FastAPIのURLが設定されていない場合は、
     * fetchを実行せず、画面に設定不足を表示します。
     */
    if (!API_BASE_URL) {
      setMessage("NEXT_PUBLIC_API_BASE_URLが設定されていません。");

      setLoading(false);
      return;
    }

    /**
     * user_idが数値でない、または0以下の場合は、
     * 不正な設定として処理を中止します。
     */
    if (!Number.isInteger(TEST_USER_ID) || TEST_USER_ID <= 0) {
      setMessage("NEXT_PUBLIC_LINE_TEST_USER_IDが不正です。");

      setLoading(false);
      return;
    }

    // APIへの問い合わせを開始します。
    setLoading(true);

    /**
     * 実際に呼び出すURLを作成します。
     */
    const statusUrl =
      `${API_BASE_URL}/api/line/status` + `?user_id=${TEST_USER_ID}`;

    try {
      /**
       * FastAPIへLINE連携状態を問い合わせます。
       *
       * cache: 'no-store'
       * 毎回最新のDB状態を取得するため、
       * ブラウザやNext.jsのキャッシュを使用しません。
       */
      const response = await fetch(statusUrl, {
        method: "GET",
        cache: "no-store",
        headers: {
          Accept: "application/json",
        },
      });

      /**
       * 404、500など正常以外のレスポンスの場合は、
       * エラーとして処理します。
       */
      if (!response.ok) {
        let detail = "";

        try {
          const errorData = await response.json();

          detail =
            typeof errorData.detail === "string"
              ? errorData.detail
              : JSON.stringify(errorData.detail);
        } catch {
          // レスポンスがJSONでない場合は何もしません。
        }

        throw new Error(
          detail ||
            `LINE連携状態の取得に失敗しました。` +
              `HTTP status=${response.status}`,
        );
      }

      /**
       * FastAPIから返されたJSONを読み込みます。
       */
      const data: LineStatus = await response.json();

      /**
       * 取得した連携状態を画面へ反映します。
       */
      setStatus(data);
    } catch (error) {
      /**
       * Failed to fetchの場合は、主に次が原因です。
       *
       * ・FastAPIが起動していない
       * ・APIのURLが間違っている
       * ・CORS設定が合っていない
       * ・FastAPIへネットワーク接続できない
       */
      console.error("LINE連携状態の取得に失敗しました。", {
        apiUrl: statusUrl,
        error,
      });

      if (error instanceof Error) {
        setMessage(
          "FastAPIへ接続できませんでした。" +
            `\n接続先：${statusUrl}` +
            `\n詳細：${error.message}`,
        );
      } else {
        setMessage(
          "FastAPIへ接続できませんでした。" + `\n接続先：${statusUrl}`,
        );
      }
    } finally {
      /**
       * 成功・失敗に関係なく、
       * 問い合わせ中の表示を終了します。
       */
      setLoading(false);
    }
  }, []);

  /**
   * LINE設定画面が最初に表示されたときに実行します。
   */
  useEffect(() => {
    /**
     * LINE Login完了後はFastAPIから、
     *
     * /settings/line?linked=1&friend=1
     *
     * のようなURLへ戻ってきます。
     *
     * URLのクエリパラメータを確認し、
     * ユーザーへ結果を表示します。
     */
    const params = new URLSearchParams(window.location.search);

    const linked = params.get("linked");
    const friend = params.get("friend");
    const error = params.get("error");

    /**
     * LINE連携が完了した場合です。
     */
    if (linked === "1") {
      if (friend === "1") {
        setMessage("LINE連携と友だち追加が完了しました。");
      } else {
        setMessage(
          "LINE連携は完了しました。" +
            "LINE公式アカウントを友だち追加してください。",
        );
      }
    }

    /**
     * LINE連携がキャンセル・失敗した場合です。
     */
    if (linked === "0") {
      setMessage(
        error
          ? `LINE連携を完了できませんでした：${error}`
          : "LINE連携をキャンセルしました。",
      );
    }

    /**
     * FastAPIから現在のLINE連携状態を取得します。
     */
    void loadStatus();
  }, [loadStatus]);

  /**
   * 「LINEと連携する」ボタンを押したときの処理です。
   */
  const startLineConnection = () => {
    /**
     * FastAPIのURLがない場合は、
     * LINE Loginを開始できません。
     */
    if (!API_BASE_URL) {
      setMessage("NEXT_PUBLIC_API_BASE_URLが設定されていません。");

      return;
    }

    /**
     * FastAPIのLINE連携開始APIへ移動します。
     *
     * FastAPI
     * ↓
     * LINE Login画面
     * ↓
     * FastAPIのcallback
     * ↓
     * この画面
     *
     * という順番で戻ってきます。
     */
    const connectionUrl =
      `${API_BASE_URL}/api/line/connect/start` + `?user_id=${TEST_USER_ID}`;

    window.location.assign(connectionUrl);
  };

  /**
   * FastAPIから取得した状態を、
   * 画面表示用の日本語へ変換します。
   */
  const getStatusText = () => {
    if (loading) {
      return "確認中です";
    }

    if (!status?.linked) {
      return "未連携";
    }

    if (!status.is_friend) {
      return "LINE連携済み・友だち追加待ち";
    }

    if (status.status === "blocked") {
      return "LINE公式アカウントがブロックされています";
    }

    return "LINE連携済み";
  };

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        {/* 画面の小見出し */}
        <p className={styles.label}>通知設定</p>

        {/* 画面タイトル */}
        <h1 className={styles.title}>LINE通知</h1>

        {/* 機能の説明 */}
        <p className={styles.description}>
          予定や今日の重点ポイントをLINEで 受け取るための開発用設定画面です。
        </p>

        {/* 現在のLINE連携状態 */}
        <div className={styles.statusBox}>
          <span>現在の状態</span>

          <strong>{getStatusText()}</strong>

          {/* LINE表示名が取得できた場合だけ表示します。 */}
          {status?.display_name && (
            <small>LINE表示名：{status.display_name}</small>
          )}
        </div>

        {/* 案内またはエラーがある場合だけ表示します。 */}
        {message && (
          <p className={styles.message} style={{ whiteSpace: "pre-line" }}>
            {message}
          </p>
        )}

        {/* LINE Login開始ボタン */}
        <button
          type="button"
          className={styles.lineButton}
          onClick={startLineConnection}
        >
          LINEと連携する
        </button>

        {/* DB上の連携状態を再取得するボタン */}
        <button
          type="button"
          className={styles.refreshButton}
          onClick={() => void loadStatus()}
          disabled={loading}
        >
          {loading ? "確認中です" : "連携状態を再確認する"}
        </button>

        {/* トップページへ戻るリンク */}
        <Link href="/" className={styles.backLink}>
          トップ画面へ戻る
        </Link>

        {/* 現在の検証用user_idを表示します。 */}
        <p className={styles.testNote}>動作確認用 user_id：{TEST_USER_ID}</p>
      </section>
    </main>
  );
}
