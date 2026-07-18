'use client';
import { useState } from 'react';
import { Footer, HeaderIcons, MicIcon, MoonIcon, CheckIcon } from '../../components';

// ============================================
// ⑧ きょうの画面（Figma 8枚目）
// タスクをタップするとチェックが付く／外れる。
// RFP図6の POST /tasks/{id}/complete に対応する画面（API接続はこれから）。
// ============================================

type Task = { id: number; time: string; title: string; moon?: boolean; done: boolean };

const firstTasks: Task[] = [
  { id: 1, time: '9:00', title: 'A社見積もりの返信（30分）', done: true },
  { id: 2, time: '9:30', title: '資料作成（60分）', done: true },
  { id: 3, time: '10:30', title: '企画会議', done: false },
  { id: 4, time: '13:00', title: '1on1', done: false },
  { id: 5, time: '15:00', title: '経費精算', moon: true, done: false },
];

export default function TodayPage() {
  const [tasks, setTasks] = useState(firstTasks);

  // タップで done を反転するだけ
  const toggle = (id: number) => {
    setTasks(tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
    // TODO: バックが用意できたら completeTask(id) を呼ぶ（api.tsのTODO参照）
  };

  return (
    <>
      <main className="day">
        <header className="day-head">
          <div>
            <h1>こんにちは ☀️</h1>
            <p>7/16 Thu ・ 12:30</p>
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
