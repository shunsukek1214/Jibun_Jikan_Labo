import FooterNav from '../../components/FooterNav';
import HeaderBar from '../../components/HeaderBar';
import { MoonIcon } from '../../components/icons';
import { mockTasks } from '../../lib/mock';

/** 📅 カレンダー：閲覧専用。予定の正は Google カレンダー。 */
export default function CalendarPage() {
  return (
    <>
      <div className="view-body">
        <HeaderBar title="カレンダー" sub="Googleカレンダーと同期中" />
        <div className="body-area">
          <div className="card">
            <h3>きょう</h3>
            {mockTasks.map((t) => (
              <div key={t.id} className="slot">
                <span className="tm">{t.start_time}</span>
                <span className="nm">{t.title}</span>
                {t.fromNight && <span className="mk"><MoonIcon color="#DDA84F" /></span>}
              </div>
            ))}
          </div>
          <div className="card">
            <h3>あす</h3>
            <div className="slot"><span className="tm">10:00</span><span className="nm">部内定例</span></div>
            <div className="slot"><span className="tm">14:00</span><span className="nm">部会</span></div>
          </div>
          <p className="legend">🌙 ＝ 夜のことばから生まれた予定</p>
        </div>
      </div>
      <FooterNav />
    </>
  );
}
