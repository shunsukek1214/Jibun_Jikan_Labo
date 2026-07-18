// バックエンド未接続でもアプリが動くためのモックデータ（Figmaモックと同内容）
import type { MorningBriefing, Reflection, Task } from './types';

export const mockTasks: Task[] = [
  { id: 1, title: 'A社見積もりの返信', start_time: '9:00', status: 'todo', fromNight: true },
  { id: 2, title: '企画会議', start_time: '10:30', status: 'todo' },
  { id: 3, title: '1on1', start_time: '13:00', status: 'todo' },
  { id: 4, title: '経費精算', start_time: '15:00', status: 'todo', fromNight: true },
];

export const mockBriefing: MorningBriefing = {
  dateLabel: '7/16 水曜',
  slots: mockTasks,
  keyPoint: 'きょうは会議がつづく日。しずかなのは、朝のうちだけです。',
};

export const mockReflection: Reflection = {
  id: 1,
  reflection_summary: '会議がのびて資料が手つかず。経費精算とBさんへの連絡が持ち越し。',
  today_key_point: '15:00の経費精算だけ、まもれたら上出来です。',
  proposed_schedule_change: [
    { time: '9:00', title: '見積もりの返信（30分だけ）', changed: true },
    { time: '9:30', title: '資料の直し', changed: true },
    { time: '10:30', title: '企画会議' },
  ],
};

/** AIの返答（提案に添える一言） */
export const mockReply =
  'なら、30分だけ先にひらいておきましょう。終わらなくて、だいじょうぶ。';
