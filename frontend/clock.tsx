"use client";

import { useEffect, useState } from "react";

// ============================================
// いまの日時を「7/26 Sat ・ 21:05」形式で表示する時計部品。
// 30秒ごとに更新するので、分の変わり目もすぐ反映される。
//
// 最初は空文字にしておき、画面が表示されてから時刻を入れる。
// （サーバーが作ったHTMLと端末の時計のズレで
//   Next.jsが警告を出すのを防ぐため）
// ============================================

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function formatNow(now: Date): string {
  const date = `${now.getMonth() + 1}/${now.getDate()}`;
  const weekday = WEEKDAYS[now.getDay()];
  const time = `${now.getHours()}:${String(now.getMinutes()).padStart(2, "0")}`;
  return `${date} ${weekday} ・ ${time}`;
}

export function Clock() {
  const [text, setText] = useState("");

  useEffect(() => {
    const update = () => setText(formatNow(new Date()));
    update();
    const timer = setInterval(update, 30_000);
    return () => clearInterval(timer);
  }, []);

  return <>{text}</>;
}