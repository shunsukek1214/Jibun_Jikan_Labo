// ============================================================
// FastAPIとの通信処理を、このファイルへ集約します。
//
// 各画面から直接fetch()を書くのではなく、このファイルの関数を呼ぶことで、
// APIのURL、Cookie送信、エラー処理などを共通化します。
// ============================================================

// ============================================================
// FastAPIのベースURL
// ============================================================
//
// .env.localにNEXT_PUBLIC_API_BASE_URLが設定されていれば、その値を使います。
// 設定されていない場合は、ローカルFastAPIのURLを使います。
//
// 例：
// NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
//
// replace(/\/$/, "")は、URL末尾の「/」を削除する処理です。
// これにより、URLが「//api/v1/...」になることを防ぎます。
const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000"
).replace(/\/$/, "");

// ============================================================
// FastAPIからエラーが返された場合に使用する独自エラー
// ============================================================
//
// 通常のErrorに加えて、次の情報を保持します。
//
// status：HTTPステータスコード
// detail：FastAPIが返したエラーの詳細
//
// 例：
// status = 401
// detail = { detail: "ログインが必要です。" }
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly detail: unknown,
  ) {
    // 親クラスであるErrorのメッセージを設定します。
    super(`API request failed: ${status}`);

    // エラー名を明示しておくと、デバッグ時に判別しやすくなります。
    this.name = "ApiError";
  }
}

// ============================================================
// GET /api/v1/auth/me が返すログインユーザー情報
// ============================================================
export type CurrentUser = {
  // usersテーブルのID
  id: number;

  // Googleアカウントなどから取得した表示名
  name: string;

  // ログインユーザーのメールアドレス
  email: string;

  // Google Calendarとの連携が完了しているか
  calendar_connected: boolean;
};

// ============================================================
// GET /api/line/status が返すLINE連携状態
// ============================================================
export type LineStatus = {
  // LINEアカウントとの紐付けが存在するか
  linked: boolean;

  // ユーザーがLINE公式アカウントを友だち追加しているか
  is_friend: boolean;

  // LINE連携の状態
  status: string;

  // LINEの表示名。取得できない場合はnull
  display_name: string | null;
};

// ============================================================
// Google Calendarから取得した予定1件分
// ============================================================
export type CalendarEventItem = {
  // Google Calendar側のイベントID
  google_event_id: string;

  // 予定のタイトル
  title: string;

  // 開始日時
  //
  // 通常予定の例：
  // "2026-07-25T09:00:00+09:00"
  //
  // 終日予定の例：
  // "2026-07-25"
  start: string;

  // 終了日時
  end: string;

  // 終日予定ならtrue
  all_day: boolean;

  // Google Calendar画面で予定を開くためのURL
  html_link: string | null;

  // confirmed、tentative、cancelledなどの予定状態
  status: string | null;
};

// ============================================================
// FastAPIのベースURLを他のファイルへ返します。
// ============================================================
//
// fetchではなく、ブラウザをFastAPIへ直接移動させる場合などに使います。
//
// 例：
// Google OAuth開始
// LINE Login開始
export function getApiBaseUrl(): string {
  return API_BASE_URL;
}

// ============================================================
// FastAPIを呼び出す共通fetch関数
// ============================================================
//
// この関数を通すことで、すべてのAPI通信に次を共通設定します。
//
// ・FastAPIのベースURL
// ・ログインセッションCookieの送信
// ・キャッシュ無効化
// ・JSONレスポンスの要求
// ・HTTPエラーの共通処理
export async function apiFetch(
  // FastAPIのAPIパス
  //
  // 例：
  // "/api/v1/auth/me"
  // "/api/v1/reflection"
  path: string,

  // fetch()へ渡す追加設定
  //
  // method、body、headersなどを呼び出し側から指定できます。
  init: RequestInit = {},
): Promise<Response> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    // 呼び出し側から渡されたfetch設定を展開します。
    ...init,

    // HttpOnly Cookieに保存されたログインセッションを
    // FastAPIへ送信します。
    //
    // Next.jsとFastAPIのポートが異なるため、明示的に必要です。
    credentials: "include",

    // 指定がなければ、APIレスポンスをキャッシュしません。
    //
    // ログイン状態や予定情報が古い状態で表示されることを防ぎます。
    cache: init.cache ?? "no-store",

    headers: {
      // JSON形式のレスポンスを受け取りたいことをFastAPIへ伝えます。
      Accept: "application/json",

      // 呼び出し側で指定されたヘッダーを追加します。
      //
      // 例：
      // "Content-Type": "application/json"
      ...init.headers,
    },
  });

  // 200番台以外が返された場合はエラーとして処理します。
  if (!response.ok) {
    let detail: unknown = null;

    try {
      // FastAPIは通常、エラーをJSON形式で返します。
      //
      // 例：
      // {
      //   "detail": "ログインが必要です。"
      // }
      detail = await response.json();
    } catch {
      // JSONとして解析できない場合は、文字列として読み取ります。
      detail = await response.text();
    }

    // HTTPステータスコードとエラー詳細を保持した
    // ApiErrorを呼び出し元へ投げます。
    throw new ApiError(response.status, detail);
  }

  // 成功したResponseを呼び出し元へ返します。
  //
  // 呼び出し元でresponse.json()などを実行します。
  return response;
}

// ============================================================
// 日本時間を基準にYYYY-MM-DD形式の日付を作ります。
// ============================================================
//
// offsetDays：今日から何日後の日付を取得するか
//
// 0 → 今日
// 1 → 明日
// -1 → 昨日
function dateInTokyo(offsetDays: number): string {
  // 現在時刻へ指定日数を加算します。
  const target = new Date(Date.now() + offsetDays * 24 * 60 * 60 * 1000);

  // Asia/Tokyoを指定し、日本時間の日付へ変換します。
  //
  // en-CAを使うと、年月日を扱いやすい形で取得できます。
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(target);

  // formatToParts()の配列を、次のようなオブジェクトへ変換します。
  //
  // {
  //   year: "2026",
  //   month: "07",
  //   day: "25"
  // }
  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  );

  // FastAPIの日付型へ送れるYYYY-MM-DD形式で返します。
  return `${values.year}-${values.month}-${values.day}`;
}

// ============================================================
// ログイン中のユーザー情報を取得します。
// ============================================================
//
// FastAPI：
// GET /api/v1/auth/me
//
// Cookieからログインユーザーを特定するため、
// フロントエンドからuser_idは送りません。
export async function getCurrentUser(): Promise<CurrentUser> {
  const response = await apiFetch("/api/v1/auth/me");

  // FastAPIが返したJSONをCurrentUserとして返します。
  return response.json();
}

// ============================================================
// ログアウトします。
// ============================================================
//
// FastAPI：
// POST /api/v1/auth/logout
//
// FastAPI側では次の処理を行います。
//
// 1. app_sessionsのセッションを失効させる
// 2. ブラウザのログインCookieを削除する
export async function logout(): Promise<void> {
  await apiFetch("/api/v1/auth/logout", {
    method: "POST",
  });
}

// ============================================================
// 夜画面で録音した「明日の予定」をFastAPIへ送ります。
// ============================================================
//
// FastAPI：
// POST /api/v1/createTomorrowSchedule
//
// FastAPI側の処理：
//
// 1. 音声をAzure Speechで文字起こし
// 2. Azure OpenAIで予定とタスクへ構造化
// 3. schedulesテーブルへ保存
// 4. tasksテーブルへ保存
//
// user_idはCookieセッションから特定されるため送信しません。
export async function sendUtterance(audio: Blob): Promise<void> {
  // 音声ファイルと日付をmultipart/form-dataで送るため、
  // FormDataを使用します。
  const formData = new FormData();

  // 明日の予定なので、日本時間の翌日を指定します。
  formData.append("target_date", dateInTokyo(1));

  // 録音データをaudio_fileとして追加します。
  //
  // FastAPI側の引数名と同じ名前にする必要があります。
  formData.append("audio_file", audio, "utterance.webm");

  await apiFetch("/api/v1/createTomorrowSchedule", {
    method: "POST",
    body: formData,

    // FormDataを送る場合、Content-Typeは手動設定しません。
    //
    // ブラウザが次のようなboundary付きの値を自動設定します。
    // multipart/form-data; boundary=...
  });
}

// ============================================================
// 振り返りの音声をFastAPIへ送ります。
// ============================================================
//
// FastAPI：
// POST /api/v1/reflection
//
// FastAPI側の処理：
//
// 1. 音声をAzure Speechで文字起こし
// 2. DBから対象日のScheduleとTaskを取得
// 3. Google Calendarから対象日の予定を取得
// 4. Azure OpenAIで振り返りを分析
// 5. reflectionテーブルへ保存
//
// user_id、予定概要、タスク概要、カレンダー概要は、
// FastAPI側で取得するためフロントエンドから送りません。
export async function createReflection(
  // ブラウザで録音した振り返り音声
  audio: Blob,

  // 振り返り対象日
  //
  // 省略した場合は日本時間の今日
  reflectionDate = dateInTokyo(0),

  // 重点ポイントや予定修正案を適用する日
  //
  // 省略した場合は日本時間の今日
  proposalDate = dateInTokyo(0),
): Promise<unknown> {
  const formData = new FormData();

  // FastAPI側のreflection_date: date = Form(...)へ渡します。
  formData.append("reflection_date", reflectionDate);

  // FastAPI側のproposal_date: date = Form(...)へ渡します。
  formData.append("proposal_date", proposalDate);

  // 振り返り音声を追加します。
  formData.append("audio_file", audio, "reflection.webm");

  const response = await apiFetch("/api/v1/reflection", {
    method: "POST",
    body: formData,
  });

  // ReflectionResponseのJSONを返します。
  return response.json();
}

// ============================================================
// ログインユーザーのLINE連携状態を取得します。
// ============================================================
//
// FastAPI：
// GET /api/line/status
//
// user_idはURLへ付けません。
// Cookieセッションからログインユーザーを特定します。
export async function getLineStatus(): Promise<LineStatus> {
  const response = await apiFetch("/api/line/status");

  return response.json();
}

// ============================================================
// LINE連携を開始するFastAPIのURLを作ります。
// ============================================================
//
// このURLはfetch()ではなく、ブラウザのページ遷移に使用します。
//
// 例：
//
// window.location.href = getLineConnectUrl();
//
// または：
//
// <a href={getLineConnectUrl()}>
//   LINEと連携する
// </a>
//
// FastAPIがLINEの認証画面へリダイレクトします。
export function getLineConnectUrl(): string {
  return `${API_BASE_URL}/api/line/connect/start`;
}

// ============================================================
// 指定日のGoogle Calendar予定を取得します。
// ============================================================
//
// FastAPI：
// GET /api/v1/calendar/events?target_date=YYYY-MM-DD
export async function getCalendarEvents(
  // 取得対象日。YYYY-MM-DD形式
  targetDate: string,
): Promise<CalendarEventItem[]> {
  // URLへ日付を安全に埋め込むため、encodeURIComponentを使用します。
  const encodedTargetDate = encodeURIComponent(targetDate);

  const response = await apiFetch(
    `/api/v1/calendar/events?target_date=${encodedTargetDate}`,
  );

  // FastAPIのレスポンス例：
  //
  // {
  //   "target_date": "2026-07-25",
  //   "calendar_id": "primary",
  //   "events": [...]
  // }
  const data = await response.json();

  // 画面側で必要な予定配列だけを返します。
  return data.events;
}

// ============================================================
// Google Calendarへ予定を1件登録します。
// ============================================================
//
// FastAPI：
// POST /api/v1/calendar/events
//
// JSON形式で送信するため、Content-Typeをapplication/jsonにします。
export async function createCalendarEvent(input: {
  // Google Calendarへ登録する予定タイトル
  title: string;

  // タイムゾーン付きの開始日時
  //
  // 例：
  // "2026-07-25T09:00:00+09:00"
  start: string;

  // タイムゾーン付きの終了日時
  end: string;

  // 予定の説明。省略可能
  description?: string;

  // tasksテーブルのタスクと紐付ける場合に指定
  //
  // 手動予定やタスクに紐づかない予定では省略可能
  task_id?: number;
}): Promise<unknown> {
  const response = await apiFetch("/api/v1/calendar/events", {
    method: "POST",

    // JSON形式で送信することをFastAPIへ伝えます。
    headers: {
      "Content-Type": "application/json",
    },

    // TypeScriptのオブジェクトをJSON文字列へ変換します。
    body: JSON.stringify(input),
  });

  // FastAPIが返した予定登録結果を返します。
  return response.json();
}

// ============================================================
// スケジュールおよびタスク取得のための型定義とAPI
// ============================================================

export type TaskResponseItem = {
  id: number;
  title: string;
  start_time: string | null;
  end_time: string | null;
  priority: string;
  estimated_minutes: number | null;
  status: string;
};

export type ScheduleResponse = {
  schedule_id: number;
  target_date: string;
  summary: string | null;
  tasks: TaskResponseItem[];
  today_key_point: string | null;
};

/**
 * 指定日のスケジュール・タスク・重点ポイントを取得します。
 * 登録がない場合はnullを返します。
 */
export async function getTodaySchedule(
  targetDate = dateInTokyo(0),
): Promise<ScheduleResponse | null> {
  try {
    const encodedDate = encodeURIComponent(targetDate);
    const response = await apiFetch(`/api/v1/schedule?target_date=${encodedDate}`);
    return response.json();
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }
    throw error;
  }
}

/**
 * 指定されたタスクの完了ステータスを更新します。
 */
export async function updateTaskStatus(
  taskId: number,
  status: "completed" | "pending",
): Promise<TaskResponseItem> {
  const response = await apiFetch(`/api/v1/tasks/${taskId}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ status }),
  });
  return response.json();
}

/**
 * LINE通知のオン/オフ状態（status: 'active' | 'disabled'）を更新します。
 */
export async function updateLineStatus(
  status: "active" | "disabled",
): Promise<LineStatus> {
  const response = await apiFetch("/api/line/status", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ status }),
  });
  return response.json();
}

