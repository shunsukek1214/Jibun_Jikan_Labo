# じぶん時間ラボ — フロントエンド (Next.js App Router)

RFP 図4〜6 のアーキテクチャ（Next.js → FastAPI）準拠。バックエンド未接続でもモックデータで全画面が動きます。

## 入れ方

既存のNext.jsリポジトリ（create-next-app済み）のルートに、以下をそのままコピー：

```
app/         ← 既存のapp/と置き換え（page.tsx, layout.tsx, globals.css含む）
components/
hooks/
lib/
.env.local.example  → コピーして .env.local を作る
```

※ `src/` ディレクトリ構成のリポジトリなら `src/` の中に app/components/hooks/lib を置く（importは相対パスなのでそのまま動く）。

```bash
cp .env.local.example .env.local
npm run dev
# http://localhost:3000
```

## フォルダ構成と画面

```
app/
  layout.tsx            ルート（スマホ専用シェル、safe-area対応）
  globals.css           デザイントークン＋全コンポーネントCSS（v8モック準拠）
  page.tsx              ① ログイン（Googleではじめる → FastAPI /auth/google/start）
  now/
    page.tsx            ② いま：時間帯でホームが変形（夜/朝/昼）
    listen/page.tsx     ③ きいている：録音＋ライブ文字起こし→ stop で送信
    done/page.tsx       ④ おわり：言葉が箱にしまわれるアニメ
    plan/page.tsx       ⑤ 朝・ひとこと→AI提案→そうする→いってらっしゃい
  calendar/page.tsx     ⑥ カレンダー（閲覧専用・🌙印）
  me/page.tsx           ⑦ じぶん（ありがとう・クセ・よみの精度）
components/
  FooterNav.tsx         〔じぶん｜いま｜カレンダー〕いま中央・時間帯アイコン
  HeaderBar.tsx / DemoPill.tsx / icons.tsx
  home/NightHome.tsx / MorningHome.tsx / TodayHome.tsx
hooks/useRecorder.ts    MediaRecorderラッパ（webm）
lib/
  api.ts                FastAPIクライアント（下表）※失敗時モックにフォールバック
  mock.ts / time.ts / types.ts
```

## API対応表（図4〜6 → lib/api.ts）

| 図 | エンドポイント | 関数 | 呼ぶ画面 |
|---|---|---|---|
| 4/5 | GET /auth/google/start | `googleAuthUrl`（aタグ遷移） | ログイン |
| 4 | POST /createTomorrowSchedule | `createTomorrowSchedule(audio\|text)` | きいている(停止時) |
| 5 | POST /reflection | `postReflection(audio\|text)` | 朝・ひとこと |
| 5 | POST /schedule-changes/approve | `approveScheduleChanges(reflectionId)` | 朝・ひとこと(そうする) |
| 6 | POST /tasks/{task_id}/complete | `completeTask(taskId)` | きょう(チェック) |
| ― | GET /tasks/today ほか取得系 | `fetchToday` / `fetchMorningBriefing` | 朝・昼・カレンダー |

## バック担当と要確認（TODO）

1. **取得系エンドポイントの名前**：図に明記がない（FR-05 予定取得に対応）。`GET /tasks/today` と `GET /briefing/today` を仮置きしてある → 実名に合わせて `lib/api.ts` を1行ずつ直すだけ
2. **認証の受け渡し**：`USER_ID=1` を仮置き（NFR-08）。セッション/クッキー方式が決まったら差し替え
3. **OAuthコールバック後のリダイレクト先**：バックの `/auth/google/callback` 処理後に **フロントの `/now` へリダイレクト**してもらう
4. **CORS**：FastAPI側に `CORSMiddleware` で `http://localhost:3000`（と本番URL）を許可してもらう
5. **音声フォーマット**：MediaRecorderは `audio/webm`。STT側が対応しているか確認（未対応ならフロントでwav変換を足す）
6. **LINE通知のリンク先**：通知から開くURLは `/now`（時間帯で正しい画面が出る）

## デモ用の仕掛け（本番で消すもの）

- 画面下の〔夜▸朝▸昼〕ピル → `.env.local` で `NEXT_PUBLIC_DEMO=0` にすると非表示
- ログインの「まずはさわってみる」リンク（認証なしで /now へ）
- `lib/api.ts` のモックフォールバック（バック接続後は失敗を画面に出す実装に差し替え推奨）
