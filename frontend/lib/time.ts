import type { Moment } from './types';

const KEY = 'demo-moment';

/**
 * いまの時間帯を返す。
 * デモ用にセッション内の上書き（DemoPill / setDemoMoment）を優先する。
 * 境界はチームで調整可：朝 4-11時 / 昼 11-17時 / 夜 17-4時
 */
export function getMoment(d = new Date()): Moment {
  if (typeof window !== 'undefined') {
    const o = sessionStorage.getItem(KEY);
    if (o === 'night' || o === 'morning' || o === 'day') return o;
  }
  const h = d.getHours();
  if (h >= 4 && h < 11) return 'morning';
  if (h >= 11 && h < 17) return 'day';
  return 'night';
}

/** デモ切替（null で実時間に戻す） */
export function setDemoMoment(m: Moment | null) {
  if (typeof window === 'undefined') return;
  if (m) sessionStorage.setItem(KEY, m);
  else sessionStorage.removeItem(KEY);
}
