"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { Footer, HeaderIcons, MoonIcon } from "../../components";
import { Clock } from "../../clock";
import { BackButton } from "../../back-button";
import {
  apiFetch,
  getTodaySchedule,
  ScheduleResponse,
} from "../../api";

// ============================================
// ⑤ 朝の画面（実データ＋AI振り返りカード統合版 v4）
// 置き場所: frontend/app/morning/page.tsx（丸ごと置き換え）
//
// まさ版（AI振り返りカード表示）と、実データ版を統合したもの。
//
// 変更点:
// ・予定の行: GET /api/v1/schedule（今日）の実データ。無い日は見本表示
// ・きょうのポイント: schedule の today_key_point（proposal_date=今日で
//   正しく紐づく）
// ・差が出た理由(gap_reason): GET /api/v1/reflection/latest を
//   target_date=昨日 で取得（朝の振り返りは「昨日」を振り返るため。
//   日付を付けないと今日で検索されて見つからない）
// ・旧実装の cookies()（サーバー側取得）は静的書き出し
//   （output: "export"）ではビルド時に固定化されて本番で動かないため、
//   全てクライアント取得に統一。
// 見た目はまさが追加した reflection-cards のCSSをそのまま使用。
// ============================================

type RowUI = {
  key: string;
  time: string;
  title: string;
  moon?: boolean;
  gold?: boolean;
};

// APIが届かない日も画面が成立するための見本（Figmaと同じ）
const FALLBACK_ROWS: RowUI[] = [
  { key: "f1", time: "9:00", title: "A社見積もりの返信", moon: true, gold: true },
  { key: "f2", time: "10:30", title: "企画会議" },
  { key: "f3", time: "13:00", title: "1on1" },
  { key: "f4", time: "15:00", title: "経費精算", moon: true },
];

const DEFAULT_GAP_REASON = "きょうの振り返りはまだありません。";
const DEFAULT_KEY_POINT = "きょうも一日、無理せずいきましょう。";

// "09:00:00" → "9:00"
function fmtTime(value: string | null): string {
  if (!value) return "時間未定";
  const parts = value.split(":");
  if (parts.length >= 2) return `${parseInt(parts[0], 10)}:${parts[1]}`;
  return value;
}

// api.ts の dateInTokyo と同じ計算（api.ts側は非公開のため自前で持つ）
function dateInTokyo(offsetDays: number): string {
  const target = new Date(Date.now() + offsetDays * 24 * 60 * 60 * 1000);
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(target);
  const values = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export default function MorningPage() {
  const [rows, setRows] = useState<RowUI[]>(FALLBACK_ROWS);
  const [gapReason, setGapReason] = useState<string>(DEFAULT_GAP_REASON);
  const [keyPoint, setKeyPoint] = useState<string>(DEFAULT_KEY_POINT);

  // 今日の時間割と重要ポイント（/schedule が proposal_date=今日で結合）
  useEffect(() => {
    getTodaySchedule()
      .then((data: ScheduleResponse | null) => {
        if (!data) return;

        if (data.tasks.length > 0) {
          setRows(
            data.tasks.map((t) => ({
              key: `t${t.id}`,
              time: fmtTime(t.start_time),
              title:
                t.title +
                (t.estimated_minutes ? `（${t.estimated_minutes}分）` : ""),
              moon: true,
              gold: t.priority === "high",
            })),
          );
        }

        if (data.today_key_point) {
          setKeyPoint(data.today_key_point);
        }
      })
      .catch((error) => {
        console.error("朝画面のスケジュール取得に失敗しました。", error);
      });
  }, []);

  // 昨日の振り返り（差が出た理由）。朝フローは reflection_date=昨日 なので
  // target_date を昨日にして取得する
  useEffect(() => {
    apiFetch(
      `/api/v1/reflection/latest?target_date=${encodeURIComponent(dateInTokyo(-1))}`,
    )
      .then((res) => res.json())
      .then((data) => {
        if (data?.gap_reason) setGapReason(data.gap_reason);
        // 振り返り直後で /schedule 側にまだ無い場合の保険
        if (data?.today_key_point) setKeyPoint(data.today_key_point);
      })
      .catch(() => {
        // 振り返りが無い日（404）はデフォルト文言のまま
      });
  }, []);

  return (
    <>
      <main className="day">
        <BackButton to="/start" />

        <header className="day-head">
          <div>
            <h1>おはようございます</h1>
            <p className="morning-date" style={{ color: "#5F6E66" }}>
              <Clock />
            </p>
          </div>
          <HeaderIcons />
        </header>

        {/* 今日の予定（1行＝1カード） */}
        <div className="rows">
          {rows.map((r) => (
            <div key={r.key} className={`rowcard${r.gold ? " gold" : ""}`}>
              <span className="time">{r.time}</span>
              <span className="title">{r.title}</span>
              {r.moon && <MoonIcon size={16} color="#DDA84F" />}
            </div>
          ))}
        </div>

        {/* AIからの振り返り（まさ版のカードUIをそのまま使用） */}
        <section className="reflection-cards" aria-label="AIからの振り返り">
          <article className="reflection-card">
            <p className="reflection-label">昨日の予定との差が出た理由</p>
            <p className="reflection-text">{gapReason}</p>
          </article>

          <article className="reflection-card key-point-card">
            <p className="reflection-label">きょうのポイント</p>
            <p className="reflection-text">{keyPoint}</p>
          </article>
        </section>

        <Link href="/today" className="big-btn">
          時間割を確認する
        </Link>
      </main>

      <Footer />
    </>
  );
}
