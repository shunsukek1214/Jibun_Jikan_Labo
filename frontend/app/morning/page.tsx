"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { Footer, HeaderIcons, MoonIcon } from "../../components";
import { Clock } from "../../clock";
import { BackButton } from "../../back-button";
import { getTodaySchedule, ScheduleResponse } from "../../api";

// ============================================
// ⑤ 朝の画面（本物データ版）
// 置き場所: frontend/app/morning/page.tsx（丸ごと置き換え）
//
// 変更点:
// ・GET /api/v1/schedule（今日）から時間割と重要ポイントを取得。
//   旧実装の /reflection/latest は「振り返った日＝今日」で探すため、
//   朝フロー（昨日を振り返る）とは日付がズレて見つからない。
//   schedule は proposal_date＝今日 で重要ポイントを結合してくれる。
// ・旧実装の cookies()（サーバー側取得）は静的書き出し
//   （next.config の output: "export"）だとビルドが通らないため、
//   今日画面(/today)と同じクライアント取得方式に統一。
// ・スケジュールが無い日はFigmaの見本を出す（デモは絶対に壊れない）。
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

const FALLBACK_ADVICE = "きょうも一日、無理せずいきましょう。";

// "09:00:00" → "9:00"
function fmtTime(value: string | null): string {
  if (!value) return "時間未定";
  const parts = value.split(":");
  if (parts.length >= 2) return `${parseInt(parts[0], 10)}:${parts[1]}`;
  return value;
}

export default function MorningPage() {
  const [rows, setRows] = useState<RowUI[]>(FALLBACK_ROWS);
  const [advice, setAdvice] = useState<string>(FALLBACK_ADVICE);

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
              // 夜の声から生まれた予定なので月マーク
              moon: true,
              // 優先度highは金色で目立たせる
              gold: t.priority === "high",
            })),
          );
        }

        if (data.today_key_point) {
          setAdvice(data.today_key_point);
        }
      })
      .catch((error) => {
        // 失敗しても見本のままなので画面は壊れない
        console.error("朝画面のスケジュール取得に失敗しました。", error);
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

        {/* 秘書のひとこと ＝ きょうの重要ポイント */}
        <p className="advice">{advice}</p>

        <Link href="/sendoff" className="big-btn">
          きょうもがんばる！
        </Link>
      </main>
      <Footer />
    </>
  );
}
