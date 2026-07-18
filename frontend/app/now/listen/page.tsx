'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useRecorder } from '../../../hooks/useRecorder';
import { createTomorrowSchedule } from '../../../lib/api';

/**
 * 🌙 きいている：録音しながら言葉が浮かぶ。
 * 停止 → 音声を POST /createTomorrowSchedule（図4）→ おわりへ。
 * ライブ文字起こしは Web Speech API があれば使う（表示用）。本処理はサーバ側STT。
 */
export default function ListenPage() {
  const router = useRouter();
  const { start, stop, error } = useRecorder();
  const [lines, setLines] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [textMode, setTextMode] = useState(false);
  const [text, setText] = useState('');
  const srRef = useRef<{ stop: () => void } | null>(null);

  useEffect(() => {
    void start();
    // ライブ文字起こし（対応ブラウザのみ / 表示演出用）
    const SR = (window as unknown as { webkitSpeechRecognition?: new () => any }).webkitSpeechRecognition;
    if (SR) {
      const sr = new SR();
      sr.lang = 'ja-JP';
      sr.continuous = true;
      sr.interimResults = true;
      sr.onresult = (e: any) => {
        const out: string[] = [];
        for (let i = 0; i < e.results.length; i++) out.push(e.results[i][0].transcript);
        setLines(out.filter(Boolean).slice(-3));
      };
      try { sr.start(); srRef.current = sr; } catch { /* noop */ }
    }
    return () => srRef.current?.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const finish = async () => {
    if (busy) return;
    setBusy(true);
    srRef.current?.stop();
    const blob = await stop();
    const payload = textMode && text.trim() ? text.trim() : blob;
    if (payload) await createTomorrowSchedule(payload);
    router.push('/now/done');
  };

  return (
    <div className="view-body vnight">
      <div className="nsheet listen">
        <div className="waves" aria-hidden>
          {[16, 30, 44, 26, 38, 20, 32].map((h, i) => (
            <i key={i} style={{ height: h, animationDelay: `${i * 0.12}s` }} />
          ))}
        </div>

        <div className="heard">
          {lines.length > 0
            ? lines.map((l, i) => <div className="ln" key={i}>{l}</div>)
            : <div className="ln dim">{error ?? 'きいています…'}</div>}
        </div>

        {textMode && (
          <textarea
            className="night-textarea"
            placeholder="ここに書いてもだいじょうぶ"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        )}

        <button className="stop-btn" aria-label="話しおわった" onClick={finish} disabled={busy}>
          <i />
        </button>
        <button className="ghost-next" onClick={() => setTextMode((v) => !v)}>
          {textMode ? '声にもどす' : 'キーボードで書く'}
        </button>
      </div>
    </div>
  );
}
