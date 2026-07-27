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

type LatestReflection = {
  gap_reason: string;
  today_key_point: string;
};

const defaultReflection: LatestReflection = {
  gap_reason: 'きょうの振り返りはまだありません。',
  today_key_point: 'きょうも一日、無理せずいきましょう。',
};

async function getLatestReflection(): Promise<LatestReflection> {
  try {
    const cookieStore = await cookies();

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/reflection/latest`,
      {
        cache: 'no-store',
        headers: {
          Cookie: cookieStore.toString(),
        },
      },
    );

    if (!res.ok) {
      return defaultReflection;
    }

    const data = await res.json();

    return {
      gap_reason: data.gap_reason || defaultReflection.gap_reason,
      today_key_point:
        data.today_key_point || defaultReflection.today_key_point,
    };
  } catch (error) {
    return defaultReflection;
  }
}

export default async function MorningPage() {
  const reflection = await getLatestReflection();

  return (
    <>
      <main className="day">
        <header className="day-head">
          <div>
            <h1>おはようございます</h1>
            <p className="morning-date">
              <Clock />
            </p>
          </div>
          <HeaderIcons />
        </header>

        <div className="rows">
          {rows.map((r) => (
            <div
              key={r.time}
              className={`rowcard${r.gold ? ' gold' : ''}`}
            >
              <span className="time">{r.time}</span>
              <span className="title">{r.title}</span>
              {r.moon && <MoonIcon size={16} color="#DDA84F" />}
            </div>
          ))}
        </div>

        <section className="reflection-cards" aria-label="AIからの振り返り">
          <article className="reflection-card">
            <p className="reflection-label">昨日の予定との差が出た理由</p>
            <p className="reflection-text">{reflection.gap_reason}</p>
          </article>

          <article className="reflection-card key-point-card">
            <p className="reflection-label">きょうのポイント</p>
            <p className="reflection-text">{reflection.today_key_point}</p>
          </article>
        </section>

        <Link href="/sendoff" className="big-btn">
          きょうもがんばる！
        </Link>
      </main>

      <Footer />
    </>
  );
}