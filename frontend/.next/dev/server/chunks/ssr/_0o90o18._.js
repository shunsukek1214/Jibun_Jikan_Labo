module.exports = [
"[project]/hooks/useRecorder.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useRecorder",
    ()=>useRecorder
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
'use client';
;
function useRecorder() {
    const recRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    const chunksRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])([]);
    const [recording, setRecording] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const start = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async ()=>{
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true
            });
            const rec = new MediaRecorder(stream);
            chunksRef.current = [];
            rec.ondataavailable = (e)=>{
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };
            rec.start();
            recRef.current = rec;
            setRecording(true);
            setError(null);
        } catch  {
            setError('マイクを使えませんでした。テキストでもどうぞ。');
        }
    }, []);
    const stop = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(()=>{
        return new Promise((resolve)=>{
            const rec = recRef.current;
            if (!rec || rec.state === 'inactive') {
                setRecording(false);
                resolve(null);
                return;
            }
            rec.onstop = ()=>{
                rec.stream.getTracks().forEach((t)=>t.stop());
                setRecording(false);
                resolve(new Blob(chunksRef.current, {
                    type: rec.mimeType || 'audio/webm'
                }));
            };
            rec.stop();
        });
    }, []);
    return {
        start,
        stop,
        recording,
        error
    };
}
}),
"[project]/lib/mock.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// バックエンド未接続でもアプリが動くためのモックデータ（Figmaモックと同内容）
__turbopack_context__.s([
    "mockBriefing",
    ()=>mockBriefing,
    "mockReflection",
    ()=>mockReflection,
    "mockReply",
    ()=>mockReply,
    "mockTasks",
    ()=>mockTasks
]);
const mockTasks = [
    {
        id: 1,
        title: 'A社見積もりの返信',
        start_time: '9:00',
        status: 'todo',
        fromNight: true
    },
    {
        id: 2,
        title: '企画会議',
        start_time: '10:30',
        status: 'todo'
    },
    {
        id: 3,
        title: '1on1',
        start_time: '13:00',
        status: 'todo'
    },
    {
        id: 4,
        title: '経費精算',
        start_time: '15:00',
        status: 'todo',
        fromNight: true
    }
];
const mockBriefing = {
    dateLabel: '7/16 水曜',
    slots: mockTasks,
    keyPoint: 'きょうは会議がつづく日。しずかなのは、朝のうちだけです。'
};
const mockReflection = {
    id: 1,
    reflection_summary: '会議がのびて資料が手つかず。経費精算とBさんへの連絡が持ち越し。',
    today_key_point: '15:00の経費精算だけ、まもれたら上出来です。',
    proposed_schedule_change: [
        {
            time: '9:00',
            title: '見積もりの返信（30分だけ）',
            changed: true
        },
        {
            time: '9:30',
            title: '資料の直し',
            changed: true
        },
        {
            time: '10:30',
            title: '企画会議'
        }
    ]
};
const mockReply = 'なら、30分だけ先にひらいておきましょう。終わらなくて、だいじょうぶ。';
}),
"[project]/lib/api.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "approveScheduleChanges",
    ()=>approveScheduleChanges,
    "completeTask",
    ()=>completeTask,
    "createTomorrowSchedule",
    ()=>createTomorrowSchedule,
    "fetchMorningBriefing",
    ()=>fetchMorningBriefing,
    "fetchToday",
    ()=>fetchToday,
    "googleAuthUrl",
    ()=>googleAuthUrl,
    "postReflection",
    ()=>postReflection
]);
// FastAPI（Main.py）クライアント — RFP 図4〜6 のエンドポイントに準拠
// バックエンド未起動でも動くよう、失敗時はモックにフォールバックする。
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$mock$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/mock.ts [app-ssr] (ecmascript)");
;
const API = ("TURBOPACK compile-time value", "http://localhost:8000") ?? 'http://localhost:8000';
// TODO(バック連携): セッション/認証の受け渡し方式が決まったら差し替える（NFR-08）
const USER_ID = 1;
const googleAuthUrl = `${API}/auth/google/start`;
async function post(path, body) {
    const init = body instanceof FormData ? {
        method: 'POST',
        body
    } : {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    };
    return fetch(`${API}${path}`, init);
}
async function createTomorrowSchedule(input) {
    try {
        const fd = new FormData();
        fd.append('user_id', String(USER_ID));
        if (typeof input === 'string') fd.append('text', input);
        else fd.append('audio', input, 'utterance.webm'); // ※STT側のwebm対応をバック担当と要確認
        const res = await post('/createTomorrowSchedule', fd);
        return {
            ok: res.ok
        };
    } catch  {
        console.warn('[api] createTomorrowSchedule: バック未接続のためモック動作');
        return {
            ok: true
        };
    }
}
async function postReflection(input) {
    try {
        const fd = new FormData();
        fd.append('user_id', String(USER_ID));
        if (typeof input === 'string') fd.append('text', input);
        else fd.append('audio', input, 'reflection.webm');
        const res = await post('/reflection', fd);
        if (!res.ok) throw new Error(String(res.status));
        return await res.json();
    } catch  {
        console.warn('[api] postReflection: バック未接続のためモック動作');
        return __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$mock$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["mockReflection"];
    }
}
async function approveScheduleChanges(reflectionId) {
    try {
        const res = await post('/schedule-changes/approve', {
            reflection_id: reflectionId,
            user_id: USER_ID
        });
        return {
            ok: res.ok
        };
    } catch  {
        console.warn('[api] approve: バック未接続のためモック動作');
        return {
            ok: true
        };
    }
}
async function completeTask(taskId) {
    try {
        const res = await post(`/tasks/${taskId}/complete`, {});
        return {
            ok: res.ok
        };
    } catch  {
        console.warn('[api] completeTask: バック未接続のためモック動作');
        return {
            ok: true
        };
    }
}
async function fetchToday() {
    try {
        const res = await fetch(`${API}/tasks/today?user_id=${USER_ID}`);
        if (!res.ok) throw new Error(String(res.status));
        return await res.json();
    } catch  {
        return __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$mock$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["mockTasks"];
    }
}
async function fetchMorningBriefing() {
    try {
        const res = await fetch(`${API}/briefing/today?user_id=${USER_ID}`); // TODO: 要確認
        if (!res.ok) throw new Error(String(res.status));
        return await res.json();
    } catch  {
        return __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$mock$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["mockBriefing"];
    }
}
}),
"[project]/app/now/listen/page.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>ListenPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$hooks$2f$useRecorder$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/hooks/useRecorder.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/api.ts [app-ssr] (ecmascript)");
'use client';
;
;
;
;
;
function ListenPage() {
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRouter"])();
    const { start, stop, error } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$hooks$2f$useRecorder$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRecorder"])();
    const [lines, setLines] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    const [busy, setBusy] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [textMode, setTextMode] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [text, setText] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])('');
    const srRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        void start();
        // ライブ文字起こし（対応ブラウザのみ / 表示演出用）
        const SR = window.webkitSpeechRecognition;
        if (SR) {
            const sr = new SR();
            sr.lang = 'ja-JP';
            sr.continuous = true;
            sr.interimResults = true;
            sr.onresult = (e)=>{
                const out = [];
                for(let i = 0; i < e.results.length; i++)out.push(e.results[i][0].transcript);
                setLines(out.filter(Boolean).slice(-3));
            };
            try {
                sr.start();
                srRef.current = sr;
            } catch  {}
        }
        return ()=>srRef.current?.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    const finish = async ()=>{
        if (busy) return;
        setBusy(true);
        srRef.current?.stop();
        const blob = await stop();
        const payload = textMode && text.trim() ? text.trim() : blob;
        if (payload) await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createTomorrowSchedule"])(payload);
        router.push('/now/done');
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "view-body vnight",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "nsheet listen",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "waves",
                    "aria-hidden": true,
                    children: [
                        16,
                        30,
                        44,
                        26,
                        38,
                        20,
                        32
                    ].map((h, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("i", {
                            style: {
                                height: h,
                                animationDelay: `${i * 0.12}s`
                            }
                        }, i, false, {
                            fileName: "[project]/app/now/listen/page.tsx",
                            lineNumber: 56,
                            columnNumber: 13
                        }, this))
                }, void 0, false, {
                    fileName: "[project]/app/now/listen/page.tsx",
                    lineNumber: 54,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "heard",
                    children: lines.length > 0 ? lines.map((l, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "ln",
                            children: l
                        }, i, false, {
                            fileName: "[project]/app/now/listen/page.tsx",
                            lineNumber: 62,
                            columnNumber: 35
                        }, this)) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "ln dim",
                        children: error ?? 'きいています…'
                    }, void 0, false, {
                        fileName: "[project]/app/now/listen/page.tsx",
                        lineNumber: 63,
                        columnNumber: 15
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/app/now/listen/page.tsx",
                    lineNumber: 60,
                    columnNumber: 9
                }, this),
                textMode && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("textarea", {
                    className: "night-textarea",
                    placeholder: "ここに書いてもだいじょうぶ",
                    value: text,
                    onChange: (e)=>setText(e.target.value)
                }, void 0, false, {
                    fileName: "[project]/app/now/listen/page.tsx",
                    lineNumber: 67,
                    columnNumber: 11
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                    className: "stop-btn",
                    "aria-label": "話しおわった",
                    onClick: finish,
                    disabled: busy,
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("i", {}, void 0, false, {
                        fileName: "[project]/app/now/listen/page.tsx",
                        lineNumber: 76,
                        columnNumber: 11
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/app/now/listen/page.tsx",
                    lineNumber: 75,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                    className: "ghost-next",
                    onClick: ()=>setTextMode((v)=>!v),
                    children: textMode ? '声にもどす' : 'キーボードで書く'
                }, void 0, false, {
                    fileName: "[project]/app/now/listen/page.tsx",
                    lineNumber: 78,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/app/now/listen/page.tsx",
            lineNumber: 53,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/app/now/listen/page.tsx",
        lineNumber: 52,
        columnNumber: 5
    }, this);
}
}),
];

//# sourceMappingURL=_0o90o18._.js.map