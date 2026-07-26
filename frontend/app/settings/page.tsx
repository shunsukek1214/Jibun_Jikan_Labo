'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Footer } from '../../components';
import { getLineStatus, updateLineStatus, LineStatus } from '../../api';

// ============================================
// ⑨ 設定画面（新規・2026-07-20 UI変更版）
// MVPで置くのは「LINE通知のオン/オフ」だけ。
// 連携の手続きそのもの（LINEログイン〜友だち追加）は
// 既存の /settings/line で行い、ここは日々の入り口。
// ============================================

const C = {
  night: '#1C382E',
  green: '#2E5548',
  gold: '#DDA84F',
  cream: '#F6F1E6',
  sub: '#6B7A70',
  line: 'rgba(28,56,46,.12)',
};

const card: React.CSSProperties = {
  background: '#fff',
  border: `1px solid ${C.line}`,
  borderRadius: 14,
  padding: '16px 16px',
  marginBottom: 14,
};

export default function SettingsPage() {
  const [lineOn, setLineOn] = useState(false);
  const [status, setStatus] = useState<LineStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    getLineStatus()
      .then((data) => {
        setStatus(data);
        if (data.linked && data.is_friend && data.status === 'active') {
          setLineOn(true);
        } else {
          setLineOn(false);
        }
      })
      .catch((err) => {
        console.error('Failed to get line status', err);
        setErrorMsg('LINEの連携状態を取得できませんでした。');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const handleToggle = async () => {
    if (loading) return;

    if (!status?.linked || !status.is_friend) {
      setErrorMsg('LINE通知を有効にするには、先にLINEアカウントの連携と友だち追加が必要です。');
      return;
    }

    const nextState = !lineOn;
    // 楽観的更新
    setLineOn(nextState);
    setErrorMsg('');

    try {
      await updateLineStatus(nextState ? 'active' : 'disabled');
      // 成功後、ローカルステートの status.status を同期
      setStatus({ ...status, status: nextState ? 'active' : 'disabled' });
    } catch (err) {
      console.error('Failed to update line status', err);
      setErrorMsg('LINE通知設定の更新に失敗しました。');
      setLineOn(!nextState); // ロールバック
    }
  };

  return (
    <>
      <main className="day" style={{ paddingBottom: 90 }}>
        {/* ヘッダー */}
        <header className="day-head" style={{ alignItems: 'center' }}>
          <div>
            <h1>設定</h1>
          </div>
          <Link
            href="/morning"
            style={{ fontSize: 13, fontWeight: 700, color: C.green, textDecoration: 'none' }}
          >
            ◂ もどる
          </Link>
        </header>

        {errorMsg && (
          <p style={{ color: '#D9534F', fontSize: 13, fontWeight: 700, margin: '0 4px 14px', lineHeight: 1.5 }}>
            ⚠️ {errorMsg}
          </p>
        )}

        {/* LINE通知のオン/オフ */}
        <section style={card}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontWeight: 800, color: C.night, fontSize: 15 }}>LINE通知</p>
              <p style={{ fontSize: 12, color: C.sub, marginTop: 4, lineHeight: 1.7 }}>
                朝7時に今日の予定、日中は要所でそっとお知らせします
              </p>
            </div>

            {/* トグルスイッチ */}
            <button
              onClick={handleToggle}
              aria-label="LINE通知の切り替え"
              disabled={loading}
              style={{
                width: 52,
                height: 30,
                borderRadius: 999,
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                flexShrink: 0,
                marginLeft: 12,
                background: lineOn ? C.gold : '#D8D4C8',
                position: 'relative',
                transition: 'background .2s',
                opacity: loading ? 0.6 : 1,
              }}
            >
              <span
                style={{
                  position: 'absolute',
                  top: 3,
                  left: lineOn ? 25 : 3,
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  background: '#fff',
                  boxShadow: '0 1px 4px rgba(28,56,46,.25)',
                  transition: 'left .2s',
                }}
              />
            </button>
          </div>

          {/* 状態の一言 */}
          <p style={{ fontSize: 12.5, fontWeight: 700, marginTop: 12, color: lineOn ? C.green : C.sub }}>
            {loading ? '状態を確認中...' : lineOn ? '通知はオンです' : '通知はオフです'}
          </p>

          {/* 通知時刻（表示のみ） */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
            {['07:00', '10:00', '13:00', '15:00', '17:00'].map((t) => (
              <span
                key={t}
                style={{
                  fontSize: 11.5,
                  fontWeight: 700,
                  color: C.green,
                  background: C.cream,
                  border: `1px solid ${C.line}`,
                  borderRadius: 999,
                  padding: '3px 10px',
                }}
              >
                {t}
              </span>
            ))}
          </div>
        </section>

        {/* アカウント連携の入口 */}
        <section style={card}>
          <Link
            href="/settings/line"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              textDecoration: 'none',
            }}
          >
            <div>
              <p style={{ fontWeight: 800, color: C.night, fontSize: 15 }}>LINEアカウント連携</p>
              <p style={{ fontSize: 12, color: C.sub, marginTop: 4 }}>
                {!loading && status?.linked ? `連携済み（表示名: ${status.display_name ?? 'なし'}）` : 'はじめての方はこちらから連携します'}
              </p>
            </div>
            <span style={{ color: C.gold, fontWeight: 900, fontSize: 18 }}>▸</span>
          </Link>
        </section>
      </main>
      <Footer />
    </>
  );
}
