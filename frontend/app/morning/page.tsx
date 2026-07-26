import Link from 'next/link';
import { cookies } from 'next/headers';
import { Footer, HeaderIcons, MoonIcon } from '../../components';
import { Clock } from '../../clock';

const rows = [
  { time: '9:00', title: 'A社見積もりの返信', moon: true, gold: true },
  { time: '10:30', title: '企画会議' },
  { time: '13:00', title: '1on1' },
  { time: '15:00', title: '経費精算', moon: true },
];

async function getTodayKeyPoint(): Promise<string> {
  try {
    const cookieStore = await cookies();
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/reflection/latest`, {
      cache: 'no-store',
      headers: {
        Cookie: cookieStore.toString(),
      },
    });

    if (!res.ok) {
      return 'きょうも一日、無理せずいきましょう。';
    }

    const data = await res.json();
    return data.today_key_point || 'きょうも一日、無理せずいきましょう。';
  } catch (error) {
    return 'きょうも一日、無理せずいきましょう。';
  }
}

export default async function MorningPage() {
  const todayKeyPoint = await getTodayKeyPoint();

  return (
    <>
      <main className="day">
        <header className="day-head">
          <div>
            <h1>おはようございます</h1>
            <p className="morning-date"><Clock /></p>
          </div>
          <HeaderIcons />
        </header>

        <div className="rows">
          {rows.map((r) => (
            <div key={r.time} className={`rowcard${r.gold ? ' gold' : ''}`}>
              <span className="time">{r.time}</span>
              <span className="title">{r.title}</span>
              {r.moon && <MoonIcon size={16} color="#DDA84F" />}
            </div>
          ))}
        </div>

        <p className="advice">{todayKeyPoint}</p>

        <Link href="/sendoff" className="big-btn">きょうもがんばる！</Link>
      </main>
      <Footer />
    </>
  );
}