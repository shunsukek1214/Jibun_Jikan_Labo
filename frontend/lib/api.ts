// FastAPI（Main.py）クライアント — RFP 図4〜6 のエンドポイントに準拠
// バックエンド未起動でも動くよう、失敗時はモックにフォールバックする。
import { mockBriefing, mockReflection, mockTasks } from './mock';
import type { MorningBriefing, Reflection, Task } from './types';

const API = process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:8000';

// TODO(バック連携): セッション/認証の受け渡し方式が決まったら差し替える（NFR-08）
const USER_ID = 1;

/** 図4/5: 初回のみ Google OAuth へ（バックエンドがそのままリダイレクトする） */
export const googleAuthUrl = `${API}/auth/google/start`;

async function post(path: string, body: FormData | object): Promise<Response> {
  const init: RequestInit =
    body instanceof FormData
      ? { method: 'POST', body }
      : {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        };
  return fetch(`${API}${path}`, init);
}

/**
 * 図4: POST /createTomorrowSchedule
 * 夜の吐き出し（音声Blob または テキスト）を送る。応答は「保存完了」でよい。
 */
export async function createTomorrowSchedule(input: Blob | string): Promise<{ ok: boolean }> {
  try {
    const fd = new FormData();
    fd.append('user_id', String(USER_ID));
    if (typeof input === 'string') fd.append('text', input);
    else fd.append('audio', input, 'utterance.webm'); // ※STT側のwebm対応をバック担当と要確認
    const res = await post('/createTomorrowSchedule', fd);
    return { ok: res.ok };
  } catch {
    console.warn('[api] createTomorrowSchedule: バック未接続のためモック動作');
    return { ok: true };
  }
}

/**
 * 図5: POST /reflection
 * 朝のひとこと（音声/テキスト）→ 要約・ズレ考察・重点・予定修正案が返る。
 */
export async function postReflection(input: Blob | string): Promise<Reflection> {
  try {
    const fd = new FormData();
    fd.append('user_id', String(USER_ID));
    if (typeof input === 'string') fd.append('text', input);
    else fd.append('audio', input, 'reflection.webm');
    const res = await post('/reflection', fd);
    if (!res.ok) throw new Error(String(res.status));
    return (await res.json()) as Reflection;
  } catch {
    console.warn('[api] postReflection: バック未接続のためモック動作');
    return mockReflection;
  }
}

/** 図5: POST /schedule-changes/approve — 予定修正案をGoogleカレンダーへ反映 */
export async function approveScheduleChanges(reflectionId: number): Promise<{ ok: boolean }> {
  try {
    const res = await post('/schedule-changes/approve', { reflection_id: reflectionId, user_id: USER_ID });
    return { ok: res.ok };
  } catch {
    console.warn('[api] approve: バック未接続のためモック動作');
    return { ok: true };
  }
}

/** 図6: POST /tasks/{task_id}/complete — タスク完了 */
export async function completeTask(taskId: number): Promise<{ ok: boolean }> {
  try {
    const res = await post(`/tasks/${taskId}/complete`, {});
    return { ok: res.ok };
  } catch {
    console.warn('[api] completeTask: バック未接続のためモック動作');
    return { ok: true };
  }
}

/**
 * 今日の予定・タスク取得。
 * TODO(バック連携): 取得系のエンドポイント名は図に明記がない（FR-05 予定取得に対応）。
 * バック担当と「GET /tasks/today」or「GET /calendar-events?timeMin&timeMax」を要確認。
 */
export async function fetchToday(): Promise<Task[]> {
  try {
    const res = await fetch(`${API}/tasks/today?user_id=${USER_ID}`);
    if (!res.ok) throw new Error(String(res.status));
    return (await res.json()) as Task[];
  } catch {
    return mockTasks;
  }
}

/** 朝ブリーフィング表示用（予定＋今日の重点） */
export async function fetchMorningBriefing(): Promise<MorningBriefing> {
  try {
    const res = await fetch(`${API}/briefing/today?user_id=${USER_ID}`); // TODO: 要確認
    if (!res.ok) throw new Error(String(res.status));
    return (await res.json()) as MorningBriefing;
  } catch {
    return mockBriefing;
  }
}
