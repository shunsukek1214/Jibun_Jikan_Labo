"use client";

import { useEffect, useState } from "react";

import {
  Footer,
  HeaderIcons,
  MicIcon,
  MoonIcon,
  CheckIcon,
} from "../../components";
import { BackButton } from "../../back-button";
import {
  getTodaySchedule,
  updateTaskStatus,
  ScheduleResponse,
} from "../../api";

// ============================================
// ⑧ きょうの画面（重要ポイント掲載版）
// 置き場所: frontend/app/today/page.tsx（丸ごと置き換え）
//
// もとの実装（実データ取得＋タップで完了/未完了の楽観的更新）はそのまま。
// 追加した点は2つだけ:
//   1. きょうの重要ポイント（today_key_point）をタスクの上に表示
//   2. 戻るボタン（/morning へ）
// ============================================

type TaskUI = {
  id: number;
  time: string;
  title: string;
  moon?: boolean;
  done: boolean;
};

const defaultTasks: TaskUI[] = [
  { id: 1, time: "9:00", title: "A社見積もりの返信（30分）", done: true },
  { id: 2, time: "9:30", title: "資料作成（60分）", done: true },
  { id: 3, time: "10:30", title: "企画会議", done: false },
  { id: 4, time: "13:00", title: "1on1", done: false },
  { id: 5, time: "15:00", title: "経費精算", moon: true, done: false },
];

function formatTime(tStr: string | null): string {
  if (!tStr) return "時間未定";
  const parts = tStr.split(":");
  if (parts.length >= 2) {
    const h = parseInt(parts[0], 10);
    const m = parts[1];
    return `${h}:${m}`;
  }
  return tStr;
}

export default function TodayPage() {
  const [tasks, setTasks] = useState<TaskUI[]>(defaultTasks);
  const [keyPoint, setKeyPoint] = useState<string>("");
  const [dateLabel, setDateLabel] = useState<string>("7/16 Thu ・ 12:30");

  useEffect(() => {
    // ブラウザーの初期描画が完了した後に日付を設定する
    const timerId = window.setTimeout(() => {
      const d = new Date();
      const formattedDate = new Intl.DateTimeFormat("en-US", {
        month: "numeric",
        day: "numeric",
        weekday: "short",
      }).format(d);
      const formattedTime = new Intl.DateTimeFormat("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }).format(d);
      setDateLabel(`${formattedDate} ・ ${formattedTime}`);
    }, 0);

    return () => {
      window.clearTimeout(timerId);
    };
  }, []);

  useEffect(() => {
    // APIから本日の予定と重要ポイントをロード
    getTodaySchedule()
      .then((data: ScheduleResponse | null) => {
        if (!data) return;

        if (data.tasks.length > 0) {
          const mapped: TaskUI[] = data.tasks.map((t) => ({
            id: t.id,
            time: formatTime(t.start_time),
            title:
              t.title +
              (t.estimated_minutes ? `（${t.estimated_minutes}分）` : ""),
            moon: true,
            done: t.status === "completed",
          }));
          setTasks(mapped);
        }

        if (data.today_key_point) {
          setKeyPoint(data.today_key_point);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch today schedule", err);
      });
  }, []);

  const toggle = async (id: number) => {
    const t = tasks.find((t) => t.id === id);
    if (!t) return;
    const newDone = !t.done;

    // 楽観的更新
    setTasks(
      tasks.map((task) => (task.id === id ? { ...task, done: newDone } : task)),
    );

    try {
      // バックエンド側と同期
      await updateTaskStatus(id, newDone ? "completed" : "pending");
    } catch (error) {
      console.error("Failed to update task completion status", error);
      // 失敗した場合は元に戻す
      setTasks(
        tasks.map((task) =>
          task.id === id ? { ...task, done: !newDone } : task,
        ),
      );
    }
  };

  return (
    <>
      <main className="day">
        <BackButton to="/morning" />

        <header className="day-head">
          <div>
            <h1>こんにちは ☀️</h1>
            <p style={{ color: "#5F6E66" }}>{dateLabel}</p>
          </div>
          <HeaderIcons />
        </header>

        {/* きょうの重要ポイント（朝の振り返りから生まれた一言） */}
        {keyPoint && (
          <p className="advice">
            <MoonIcon size={14} color="#DDA84F" /> きょうの重要ポイント：
            {keyPoint}
          </p>
        )}

        {/* タスク一覧（タップで完了） */}
        <div className="rows">
          {tasks.map((t) => (
            <button
              key={t.id}
              className={`rowcard task${t.done ? " done" : ""}`}
              onClick={() => toggle(t.id)}
            >
              <span className={`checkbox${t.done ? " checked" : ""}`}>
                {t.done && <CheckIcon size={11} />}
              </span>
              <span className="time">{t.time}</span>
              <span className="title">{t.title}</span>
              {t.moon && <MoonIcon size={16} color="#DDA84F" />}
            </button>
          ))}
        </div>

        {/* 思いつきメモの入口（かざり。将来は夜と同じ録音へ） */}
        <div className="mic-pill">
          <span className="mic-circle">
            <MicIcon size={15} color="#fff" />
          </span>
          何かメモしておきたいことはありますか？
        </div>
      </main>
      <Footer />
    </>
  );
}
