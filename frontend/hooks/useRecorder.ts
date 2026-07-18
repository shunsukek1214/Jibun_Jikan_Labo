'use client';
import { useCallback, useRef, useState } from 'react';

/**
 * MediaRecorder の薄いラッパ。
 * start() でマイク許可→録音開始、stop() で Blob(webm) を返す。
 */
export function useRecorder() {
  const recRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const start = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      chunksRef.current = [];
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      rec.start();
      recRef.current = rec;
      setRecording(true);
      setError(null);
    } catch {
      setError('マイクを使えませんでした。テキストでもどうぞ。');
    }
  }, []);

  const stop = useCallback((): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const rec = recRef.current;
      if (!rec || rec.state === 'inactive') {
        setRecording(false);
        resolve(null);
        return;
      }
      rec.onstop = () => {
        rec.stream.getTracks().forEach((t) => t.stop());
        setRecording(false);
        resolve(new Blob(chunksRef.current, { type: rec.mimeType || 'audio/webm' }));
      };
      rec.stop();
    });
  }, []);

  return { start, stop, recording, error };
}
