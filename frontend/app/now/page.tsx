'use client';
import { useEffect, useState } from 'react';
import FooterNav from '../../components/FooterNav';
import NightHome from '../../components/home/NightHome';
import MorningHome from '../../components/home/MorningHome';
import TodayHome from '../../components/home/TodayHome';
import { getMoment } from '../../lib/time';
import type { Moment } from '../../lib/types';

/** 「いま」タブ：時間帯でホームが変形する（夜／朝／昼） */
export default function NowPage() {
  const [moment, setMoment] = useState<Moment | null>(null);
  useEffect(() => setMoment(getMoment()), []); // ハイドレーション差異を避ける

  if (!moment) return <div className="view-body" />;

  return (
    <>
      <div className={`view-body${moment === 'night' ? ' vnight' : ''}`}>
        {moment === 'night' && <NightHome onMoment={setMoment} />}
        {moment === 'morning' && <MorningHome onMoment={setMoment} />}
        {moment === 'day' && <TodayHome onMoment={setMoment} />}
      </div>
      <FooterNav />
    </>
  );
}
