"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import {
  ApiError,
  getLineConnectUrl,
  getLineStatus,
  LineStatus,
} from "../../../api";
import styles from "./line.module.css";

function LineSettingsContent() {
  const searchParams = useSearchParams();

  const [status, setStatus] = useState<LineStatus | null>(null);
  const [requestError, setRequestError] = useState("");
  const [loading, setLoading] = useState(true);

  const linked = searchParams.get("linked");
  const friend = searchParams.get("friend");
  const lineError = searchParams.get("error");

  const callbackMessage =
    linked === "1"
      ? friend === "1"
        ? "LINE連携と友だち追加が完了しました。"
        : "LINE連携は完了しました。公式アカウントを友だち追加してください。"
      : linked === "0"
        ? lineError
          ? `LINE連携を完了できませんでした：${lineError}`
          : "LINE連携をキャンセルしました。"
        : "";

  const message = requestError || callbackMessage;

  useEffect(() => {
    let active = true;

    getLineStatus()
      .then((currentStatus) => {
        if (!active) {
          return;
        }

        setStatus(currentStatus);
      })
      .catch((error: unknown) => {
        if (!active) {
          return;
        }

        if (error instanceof ApiError && error.status === 401) {
          window.location.assign("/?auth_error=session_expired");
          return;
        }

        setRequestError("LINE連携状態を取得できませんでした。");
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const handleRefresh = async () => {
    setRequestError("");
    setLoading(true);

    try {
      const currentStatus = await getLineStatus();
      setStatus(currentStatus);
    } catch (error: unknown) {
      if (error instanceof ApiError && error.status === 401) {
        window.location.assign("/?auth_error=session_expired");
        return;
      }

      setRequestError("LINE連携状態を取得できませんでした。");
    } finally {
      setLoading(false);
    }
  };

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
          onClick={handleRefresh}
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

export default function LineSettingsPage() {
  return (
    <Suspense
      fallback={
        <main>
          <p>LINE連携状態を確認しています。</p>
        </main>
      }
    >
      <LineSettingsContent />
    </Suspense>
  );
}
