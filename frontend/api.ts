// ============================================
// バックエンド（FastAPI）を呼ぶところ。この1ファイルだけ。
// まさが実装済みのAPIに合わせて、いまは1本だけ繋いでいる。
// ============================================

// 接続先。ローカル開発では http://localhost:8000（frontend/.env.local で変更できる）
const API = process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:8000';

/**
 * 夜の吐き出し（録音した音声）をバックエンドに送る。
 * → POST /createTomorrowSchedule （RFP図4）
 * バックエンドが起動していなくてもエラーで止まらないようにしてある。
 */
export async function sendUtterance(audio: Blob) {
  try {
    const fd = new FormData();
    fd.append('user_id', '1'); // TODO: ログインができたら本物のIDにする
    fd.append('audio', audio, 'utterance.webm');
    await fetch(`${API}/createTomorrowSchedule`, { method: 'POST', body: fd });
    console.log('音声を送信しました');
  } catch (e) {
    console.log('バックエンド未接続（あとで繋がればOK）', e);
  }
}

// --------------------------------------------
// TODO: 次に繋ぐ候補（バックの実装が揃ったら足す）
//
// 朝のひとこと → POST /reflection （RFP図5）
// export async function sendReflection(text: string) { ... }
//
// 提案を採用   → POST /schedule-changes/approve （RFP図5）
// タスク完了   → POST /tasks/{id}/complete （RFP図6）
// --------------------------------------------

/** 結合テスト用：まさのreflect2から挨拶をもらう。届かなければnull（画面は元の文字のまま） */
export async function getReflect2(): Promise<string | null> {
  try {
    const res = await fetch(`${API}/reflect2`); // ←パスは/docsで確認して合わせる
    if (!res.ok) return null;
    const data = await res.json();
    return data.message ?? null;
  } catch {
    return null;
  }
}