// MySQLテーブル（RFP 図4〜6）に対応する型定義

export type Moment = 'night' | 'morning' | 'day';

/** <Tasks> テーブル準拠 */
export interface Task {
  id: number;
  schedule_id?: number;
  title: string;
  start_time: string; // "09:00"
  end_time?: string;
  priority?: number;
  estimated_minutes?: number;
  status: 'todo' | 'done';
  completed_at?: string | null;
  /** 夜の言葉から生まれた予定（calendar_events 経由で付与想定） */
  fromNight?: boolean;
}

/** <reflection> テーブル準拠（POST /reflection のレスポンス想定） */
export interface Reflection {
  id: number;
  reflection_summary: string;
  gap_analysis?: string;
  gap_reason?: string;
  today_key_point: string;
  proposed_schedule_change: ProposalSlot[];
}

export interface ProposalSlot {
  time: string;
  title: string;
  changed?: boolean; // 組み替えで動いた枠
}

/** 朝ブリーフィングの表示データ */
export interface MorningBriefing {
  dateLabel: string; // "7/16 水曜"
  slots: Task[];
  keyPoint: string; // reflection.today_key_point
}
