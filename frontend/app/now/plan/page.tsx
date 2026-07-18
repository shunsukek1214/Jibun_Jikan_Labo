'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import FooterNav from '../../../components/FooterNav';
import { CheckIcon } from '../../../components/icons';
import { approveScheduleChanges, postReflection } from '../../../lib/api';
import { mockReply } from '../../../lib/mock';
import { setDemoMoment } from '../../../lib/time';
import type { Reflection } from '../../../lib/types';

type Phase = 'ask' | 'propose' | 'decided';

/**
 * ☀️ 朝・ひとこと：発話/入力 → POST /reflection（図5）→ 提案表示
 * → 「そうする」 → POST /schedule-changes/approve → いってらっしゃい。
 */
export default function PlanPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>('ask');
  const [text, setText] = useState('');
  const [quote, setQuote] = useState('');
  const [ref, setRef] = useState<Reflection | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const t = text.trim();
    if (!t || busy) return;
    setBusy(true);
    setQuote(t);
    const r = await postReflection(t); // TODO: 音声版は useRecorder を同様に接続
    setRef(r);
    setPhase('propose');
    setBusy(false);
  };

  const approve = async () => {
    if (!ref || busy) return;
    setBusy(true);
    await approveScheduleChanges(ref.id);
    setPhase('decided');
    setBusy(false);
  };

  const toDay = () => {
    setDemoMoment('day');
    router.push('/now');
  };

  return (
    <>
      <div className="view-body">
        <div className="body-area vmorning plan">
          {phase === 'ask' && (
            <>
              <p className="plan-say">きになること、あれば。</p>
              <textarea
                className="plan-textarea"
                placeholder="例：見積もりの返信、気が重いなー"
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
              <button className="go-btn" onClick={submit} disabled={busy || !text.trim()}>
                きいてもらう
              </button>
              <button className="ghost-next gray" onClick={() => router.push('/now')}>
                やっぱり、そのままで
              </button>
            </>
          )}

          {phase === 'propose' && ref && (
            <>
              <div className="quote"><div className="q-t">「{quote}」</div></div>
              <p className="plan-say">{mockReply}</p>
              <div className="re-sched">
                {ref.proposed_schedule_change.map((s, i) => (
                  <div key={i} className={`slot${s.changed ? ' new' : ''}`}>
                    <span className="tm">{s.time}</span>
                    <span className="nm">{s.title}</span>
                    {s.changed && <span className="chip">← 軽く</span>}
                  </div>
                ))}
              </div>
              <button className="go-btn" onClick={approve} disabled={busy}>そうする</button>
              <button className="ghost-next gray" onClick={() => router.push('/now')}>
                やっぱり、そのままで
              </button>
            </>
          )}

          {phase === 'decided' && (
            <div className="dec-hero">
              <div className="dec-circle"><CheckIcon size={28} color="#2E5548" /></div>
              <p className="dec-a">いってらっしゃい。</p>
              <p className="dec-b">カレンダーは直しておきました。</p>
              <button className="ghost-next gray" onClick={toDay}>▸ ひる</button>
            </div>
          )}
        </div>
      </div>
      <FooterNav />
    </>
  );
}
