'use client';
import { useRouter } from 'next/navigation';
import { setDemoMoment } from '../../../lib/time';
import { CheckIcon } from '../../../components/icons';

/** 🌙 おわり：言葉が箱にしまわれて、今日が閉じる。 */
export default function DonePage() {
  const router = useRouter();

  const toMorning = () => {
    setDemoMoment('morning'); // デモ動線：翌朝へ
    router.push('/now');
  };

  return (
    <div className="view-body vnight">
      <div className="nsheet">
        <div className="moon" />
        <div className="fold-zone">
          <div className="fold-lines"><i /><i /><i /></div>
          <div className="box">
            <span className="bx-check"><CheckIcon size={26} color="#9DC0AC" /></span>
          </div>
          <div className="done-words">
            <p className="a">おつかれさまでした。</p>
            <p className="b">つづきは、あすの朝に。</p>
          </div>
        </div>
        <button className="ghost-next" onClick={toMorning}>▸ あさ</button>
      </div>
    </div>
  );
}
