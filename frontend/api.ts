// ============================================
// バックエンド（FastAPI）を呼ぶところ。この1ファイルだけ。
// まさのSwagger（/docs）準拠。
// ============================================

const API = process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:8000';

const dateStr = (d: Date) => d.toISOString().slice(0, 10);
const today = () => dateStr(new Date());
const tomorrow = () => dateStr(new Date(Date.now() + 24 * 60 * 60 * 1000));

/**
 * 夜の吐き出しを送る → POST /api/v1/createTomorrowSchedule
 * 必須: user_id, target_date（明日の日付）／音声の項目名は audio_file
 */
export async function sendUtterance(audio: Blob) {
  try {
    const fd = new FormData();
    fd.append('user_id', '1');
    fd.append('target_date', tomorrow());
    fd.append('audio_file', audio, 'utterance.webm');
    const res = await fetch(`${API}/api/v1/createTomorrowSchedule`, { method: 'POST', body: fd });
    console.log('createTomorrowSchedule:', res.status);
  } catch (e) {
    console.log('バックエンド未接続（あとで繋がればOK）', e);
  }
}

/**
 * 結合テスト用 → POST /api/v1/reflection2
 * 返事は {"message": "おつかれさまでした"} の形。文字列だけの形にも対応。
 */
export async function getReflect2(): Promise<string | null> {
  try {
    const fd = new FormData();
    fd.append('user_id', '1');
    fd.append('reflection_date', today());
    fd.append('proposal_date', today());
    const res = await fetch(`${API}/api/v1/reflection2`, { method: 'POST', body: fd });
    if (!res.ok) return null;
    const data = await res.json();
    if (typeof data === 'string') return data;
    return data?.message ?? null;
  } catch {
    return null;
  }
}