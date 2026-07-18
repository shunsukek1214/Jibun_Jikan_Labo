'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getMoment } from '../lib/time';
import type { Moment } from '../lib/types';
import { CalendarIcon, MoonIcon, PersonIcon, SunIcon, SunriseIcon } from './icons';

/** フッター〔じぶん｜いま｜カレンダー〕— いま中央、アイコンは時間帯で変化 */
export default function FooterNav() {
  const pathname = usePathname();
  const [moment, setMoment] = useState<Moment>('night');
  useEffect(() => setMoment(getMoment()), []); // SSRとのズレを避けるためマウント後に確定

  const NowIcon = moment === 'morning' ? SunriseIcon : moment === 'day' ? SunIcon : MoonIcon;
  const tabs = [
    { href: '/me', label: 'じぶん', Icon: PersonIcon },
    { href: '/now', label: 'いま', Icon: NowIcon },
    { href: '/calendar', label: 'カレンダー', Icon: CalendarIcon },
  ];

  return (
    <nav className="footer-nav">
      {tabs.map(({ href, label, Icon }) => {
        const active = pathname.startsWith(href);
        return (
          <Link key={href} href={href} className={active ? 'tab active' : 'tab'}>
            <span className="icon-wrap">
              <Icon color={active ? '#2E5548' : '#8A968E'} />
            </span>
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
