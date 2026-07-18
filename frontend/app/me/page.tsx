import FooterNav from '../../components/FooterNav';
import HeaderBar from '../../components/HeaderBar';

/** 🧭 じぶん：ありがとう＋クセ。続ける理由が育つ場所。（MVPは静的表示） */
export default function MePage() {
  return (
    <>
      <div className="view-body">
        <HeaderBar title="じぶん" sub="すこしずつ、わかってきたこと" />
        <div className="body-area">
          <div className="arigato">
            <div className="a-t">7日つづけて、聞かせてくれて<br />ありがとう。</div>
            <div className="a-d">{Array.from({ length: 7 }).map((_, i) => <i key={i} />)}</div>
          </div>

          <div className="kuse">
            <div className="k-h">🌀 会議のあとの予定は、押しがち</div>
            <div className="k-b">
              会議がのびた日は、つぎの予定もつられて後ろへ。だいじな作業は会議の前が安全みたいです。
              <br /><span className="basis">23日ぶん・12回の観察から</span>
            </div>
          </div>

          <div className="kuse hypo">
            <div className="k-h">🔍 朝いちの30分が、その日を決める…かも</div>
            <div className="k-b">まだ確信がもてません。あと2日、見せてください。</div>
          </div>

          <div className="kuse">
            <div className="k-h">☀️ よみが、あたってきています</div>
            <div className="day-dots">
              {[0, 0, 1, 0, 1, 1, 0, 1, 2, 2].map((v, i) => (
                <i key={i} className={v === 2 ? 'hit strong' : v === 1 ? 'hit' : ''} />
              ))}
            </div>
          </div>
        </div>
      </div>
      <FooterNav />
    </>
  );
}
