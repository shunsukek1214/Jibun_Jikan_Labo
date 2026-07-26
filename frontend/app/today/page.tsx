'use client';

import { useEffect, useState } from 'react';
import { Footer, HeaderIcons, MicIcon, MoonIcon, CheckIcon } from '../../components';
import { getTodaySchedule, updateTaskStatus, ScheduleResponse } from '../../api';

// ============================================
// ⑧ きょうの画面（Figma 8枚目）
// タスクをタップするとチェックが付く／外れる。
// RFP図6の POST /tasks/{id}/complete に対応する画面。
// ============================================

type TaskUI = {
  id: number;
  time: string;
  title: string;
  moon?: boolean;
  done: boolean;
};

const defaultTasks: TaskUI[] = [
  { id: 1, time: '9:00', title: 'A社見積もりの返信（30分）', done: true },
  { id: 2, time: '9:30', title: '資料作成（60分）', done: true },
  { id: 3, time: '10:30', title: '企画会議', done: false },
  { id: 4, time: '13:00', title: '1on1', done: false },
  { id: 5, time: '15:00', title: '経費精算', moon: true, done: false },
];

function formatTime(tStr: string | null): string {
  if (!tStr) return '時間未定';
  const parts = tStr.split(':');
  if (parts.length >= 2) {
    const h = parseInt(parts[0], 10);
    const m = parts[1];
    return `${h}:${m}`;
  }
  return tStr;
}

export default function TodayPage() {
  const [tasks, setTasks] = useState<TaskUI[]>(defaultTasks);
  const [dateLabel, setDateLabel] = useState<string>('7/16 Thu ・ 12:30');

  useEffect(() => {
    // クライアント側の日付ラベル設定
    const d = new Date();
    const formattedDate = new Intl.DateTimeFormat('en-US', {
      month: 'numeric',
      day: 'numeric',
      weekday: 'short',
    }).format(d);
    const formattedTime = new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(d);
    setDateLabel(`${formattedDate} ・ ${formattedTime}`);

    // APIから本日の予定をロード
    getTodaySchedule()
      .then((data: ScheduleResponse | null) => {
        if (data && data.tasks.length > 0) {
          const mapped: TaskUI[] = data.tasks.map((t) => ({
            id: t.id,
            time: formatTime(t.start_time),
            title: t.title + (t.estimated_minutes ? `（${t.estimated_minutes}分）` : ''),
            moon: true,
            done: t.status === 'completed',
          }));
          setTasks(mapped);
        }
      })
      .catch((err) => {
        console.error('Failed to fetch today schedule', err);
      });
  }, []);

  const toggle = async (id: number) => {
    const t = tasks.find((t) => t.id === id);
    if (!t) return;
    const newDone = !t.done;

    // 楽観的更新
    setTasks(tasks.map((task) => (task.id === id ? { ...task, done: newDone } : task)));

    try {
      // バックエンド側と同期
      await updateTaskStatus(id, newDone ? 'completed' : 'pending');
    } catch (error) {
      console.error('Failed to update task completion status', error);
      // 失敗した場合は元に戻す
      setTasks(tasks.map((task) => (task.id === id ? { ...task, done: !newDone } : task)));
    }
  };

  return (
    <>
      <main className="day">
        <header className="day-head">
          <div>
            <h1>こんにちは ☀️</h1>
            <p>{dateLabel}</p>
          </div>
          <HeaderIcons />
        </header>

        {/* タスク一覧（タップで完了） */}
        <div className="rows">
          {tasks.map((t) => (
            <button key={t.id} className={`rowcard task${t.done ? ' done' : ''}`} onClick={() => toggle(t.id)}>
              <span className={`checkbox${t.done ? ' checked' : ''}`}>
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
          <span className="mic-circle"><MicIcon size={15} color="#fff" /></span>
          何かメモしておきたいことはありますか？
        </div>
      </main>
      <Footer />
    </>
  );
}
