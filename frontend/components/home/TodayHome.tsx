'use client';
import { useEffect, useState } from 'react';
import HeaderBar from '../HeaderBar';
import DemoPill from '../DemoPill';
import { CheckIcon, MoonIcon } from '../icons';
import { completeTask, fetchToday } from '../../lib/api';
import type { Moment, Task } from '../../lib/types';

/** 🕐 きょう（Today）：タスクをタップで完了（図6 POST /tasks/{id}/complete） */
export default function TodayHome({ onMoment }: { onMoment: (m: Moment) => void }) {
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    fetchToday().then(setTasks);
  }, []);

  const toggle = (id: number) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: t.status === 'done' ? 'todo' : 'done' } : t)),
    );
    // 楽観更新：API失敗時もUIは維持（MVP割り切り）
    void completeTask(id);
  };

  const remaining = tasks.filter((t) => t.status !== 'done').length;
  const today = new Date();
  const wd = ['日', '月', '火', '水', '木', '金', '土'][today.getDay()];

  return (
    <>
      <HeaderBar title="こんにちは。" sub={`${today.getMonth() + 1}/${today.getDate()} ${wd}曜`} />
      <div className="body-area">
        <div className="sched">
          {tasks.map((t) => (
            <button key={t.id} className={`slot task${t.status === 'done' ? ' done' : ''}`} onClick={() => toggle(t.id)}>
              <span className={`checkbox${t.status === 'done' ? ' checked' : ''}`}>
                {t.status === 'done' && <CheckIcon size={11} />}
              </span>
              <span className="tm">{t.start_time}</span>
              <span className="nm">{t.title}</span>
              {t.fromNight && <span className="mk"><MoonIcon color="#DDA84F" /></span>}
            </button>
          ))}
        </div>

        <div className="say-line">
          <span className="dot" />
          <span className="tx">
            {remaining === 0
              ? 'ぜんぶ、おわりました。おつかれさまでした。'
              : `のこりは、${remaining}つ。ゆっくりで。`}
          </span>
        </div>

        <DemoPill onChange={onMoment} />
      </div>
    </>
  );
}
