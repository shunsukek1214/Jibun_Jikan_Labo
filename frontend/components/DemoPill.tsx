'use client';
import { getMoment, setDemoMoment } from '../lib/time';
import type { Moment } from '../lib/types';
import { useEffect, useState } from 'react';

/**
 * デモ用の時間帯切替〔夜▸朝▸昼〕。フッター直上に置く。
 * 本実装時は NEXT_PUBLIC_DEMO=0 で非表示にできる。
 */
export default function DemoPill({ onChange }: { onChange?: (m: Moment) => void }) {
  const [cur, setCur] = useState<Moment>('night');
  useEffect(() => setCur(getMoment()), []);
  if (process.env.NEXT_PUBLIC_DEMO === '0') return null;

  const set = (m: Moment) => {
    setDemoMoment(m);
    setCur(m);
    onChange?.(m);
  };
  const Btn = ({ m, label }: { m: Moment; label: string }) => (
    <button className={cur === m ? 'on' : ''} onClick={() => set(m)}>{label}</button>
  );
  return (
    <div className="demo-pill">
      <Btn m="night" label="夜" />
      <span className="sep">▸</span>
      <Btn m="morning" label="朝" />
      <span className="sep">▸</span>
      <Btn m="day" label="昼" />
    </div>
  );
}
