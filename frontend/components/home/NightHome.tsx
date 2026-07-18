'use client';
import { useRouter } from 'next/navigation';
import DemoPill from '../DemoPill';
import { MicIcon } from '../icons';
import type { Moment } from '../../lib/types';

/** 🌙 夜のホーム：挨拶と、呼吸するマイクだけ。 */
export default function NightHome({ onMoment }: { onMoment: (m: Moment) => void }) {
  const router = useRouter();
  const today = new Date();
  const w = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][today.getDay()];
  const dateLabel = `${today.getMonth() + 1}/${today.getDate()} ${w} ・ ${String(today.getHours()).padStart(2, '0')}:${String(today.getMinutes()).padStart(2, '0')}`;

  return (
    <div className="nsheet">
      <div className="moon" />
      <div className="ngreet">
        <p className="g">おつかれさまでした。</p>
        <p className="d">{dateLabel}</p>
        <button className="mic-big" aria-label="話す" onClick={() => router.push('/now/listen')}>
          <MicIcon />
        </button>
      </div>
      <DemoPill onChange={onMoment} />
    </div>
  );
}
