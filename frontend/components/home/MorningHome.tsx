'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import HeaderBar from '../HeaderBar';
import DemoPill from '../DemoPill';
import { MicIcon, MoonIcon } from '../icons';
import { fetchMorningBriefing } from '../../lib/api';
import type { Moment, MorningBriefing } from '../../lib/types';

/** ☀️ 朝のホーム：秘書のブリーフィング。予定＋気づき一言＋任意のひとこと。 */
export default function MorningHome({ onMoment }: { onMoment: (m: Moment) => void }) {
  const router = useRouter();
  const [data, setData] = useState<MorningBriefing | null>(null);
  const [decided, setDecided] = useState(false);

  useEffect(() => {
    fetchMorningBriefing().then(setData);
  }, []);

  if (!data) return null;

  return (
    <>
      <HeaderBar title="おはようございます。" sub={data.dateLabel} />
      <div className="body-area vmorning">
        <div className="sched">
          {data.slots.map((s, i) => (
            <div key={s.id} className={`slot${i === 0 ? ' quiet' : ''}`}>
              <span className="tm">{s.start_time}</span>
              <span className="nm">{s.title}</span>
              {s.fromNight && <span className="mk"><MoonIcon color="#DDA84F" /></span>}
            </div>
          ))}
        </div>

        <div className="say-line">
          <span className="dot" />
          <span className="tx">{data.keyPoint}</span>
        </div>

        <button className="mic-pill" onClick={() => router.push('/now/plan')}>
          <span className="mp-ic"><MicIcon size={15} color="#fff" /></span>
          <span className="mp-tx">ひとこと、あれば</span>
        </button>

        {decided ? (
          <div className="sent-off">いってらっしゃい。</div>
        ) : (
          <button className="go-btn" onClick={() => setDecided(true)}>これでいこう</button>
        )}

        <DemoPill onChange={onMoment} />
      </div>
    </>
  );
}
