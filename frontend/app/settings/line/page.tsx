"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import {
  ApiError,
  getLineConnectUrl,
  getLineStatus,
  LineStatus,
} from "../../../api";
import styles from "./line.module.css";

export default function LineSettingsPage() {
  const [status, setStatus] = useState<LineStatus | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const loadStatus = useCallback(async () => {
    setLoading(true);

    try {
      setStatus(await getLineStatus());
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        window.location.assign("/?auth_error=session_expired");
        return;
      }
      setMessage("LINE連携状態を取得できませんでした。");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const linked = params.get("linked");
    const friend = params.get("friend");
    const error = params.get("error");

    if (linked === "1") {
      setMessage(
        friend === "1"
          ? "LINE連携と友だち追加が完了しました。"
          : "LINE連携は完了しました。公式アカウントを友だち追加してください。",
      );
    } else if (linked === "0") {
      setMessage(
        error
          ? `LINE連携を完了できませんでした：${error}`
          : "LINE連携をキャンセルしました。",
      );
    }

    void loadStatus();
  }, [loadStatus]);

  const statusText = () => {
    if (loading) return "確認中です";
    if (!status?.linked) return "未連携";
    if (status.status === "blocked")
      return "LINE公式アカウントがブロックされています";
    if (!status.is_friend) return "LINE連携済み・友だち追加待ち";
    return "LINE連携済み";
  };

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <p className={styles.label}>通知設定</p>
        <h1 className={styles.title}>LINE通知</h1>
        <p className={styles.description}>
          予定や今日の重点ポイントをLINEで受け取るための設定画面です。
        </p>

        <div className={styles.statusBox}>
          <span>現在の状態</span>
          <strong>{statusText()}</strong>
          {status?.display_name && (
            <small>LINE表示名：{status.display_name}</small>
          )}
        </div>

        {message && <p className={styles.message}>{message}</p>}

        <button
          type="button"
          className={styles.lineButton}
          onClick={() => window.location.assign(getLineConnectUrl())}
        >
          LINEと連携する
        </button>

        <button
          type="button"
          className={styles.refreshButton}
          onClick={() => void loadStatus()}
          disabled={loading}
        >
          {loading ? "確認中です" : "連携状態を再確認する"}
        </button>

        <Link href="/night" className={styles.backLink}>
          夜の画面へ戻る
        </Link>
      </section>
    </main>
  );
}
