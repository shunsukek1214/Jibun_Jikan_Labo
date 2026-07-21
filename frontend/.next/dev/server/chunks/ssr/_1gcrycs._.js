module.exports = [
"[project]/api.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getReflect2",
    ()=>getReflect2,
    "sendUtterance",
    ()=>sendUtterance
]);
// ============================================
// バックエンド（FastAPI）を呼ぶところ。この1ファイルだけ。
// まさのSwagger（/docs）準拠。
// ============================================
const API = ("TURBOPACK compile-time value", "http://localhost:8000") ?? 'http://localhost:8000';
const dateStr = (d)=>d.toISOString().slice(0, 10);
const today = ()=>dateStr(new Date());
const tomorrow = ()=>dateStr(new Date(Date.now() + 24 * 60 * 60 * 1000));
async function sendUtterance(audio) {
    try {
        const fd = new FormData();
        fd.append('user_id', '1');
        fd.append('target_date', tomorrow());
        fd.append('audio_file', audio, 'utterance.webm');
        const res = await fetch(`${API}/api/v1/createTomorrowSchedule`, {
            method: 'POST',
            body: fd
        });
        console.log('createTomorrowSchedule:', res.status);
    } catch (e) {
        console.log('バックエンド未接続（あとで繋がればOK）', e);
    }
}
async function getReflect2() {
    try {
        const fd = new FormData();
        fd.append('user_id', '1');
        fd.append('reflection_date', today());
        fd.append('proposal_date', today());
        const res = await fetch(`${API}/api/v1/reflection2`, {
            method: 'POST',
            body: fd
        });
        if (!res.ok) return null;
        const data = await res.json();
        if (typeof data === 'string') return data;
        return data?.message ?? null;
    } catch  {
        return null;
    }
}
}),
"[project]/app/listening/page.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>ListeningPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/api.ts [app-ssr] (ecmascript)");
'use client';
;
;
;
;
function ListeningPage() {
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRouter"])();
    const recorderRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    const chunksRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])([]);
    // 画面が開いたら録音スタート
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        navigator.mediaDevices.getUserMedia({
            audio: true
        }).then((stream)=>{
            const rec = new MediaRecorder(stream);
            rec.ondataavailable = (e)=>chunksRef.current.push(e.data); // 音声のかけらを貯める
            rec.start();
            recorderRef.current = rec;
        }).catch(()=>{
            // マイクを許可されなくても画面はそのまま動く
            console.log('マイクが使えませんでした');
        });
        // 画面を離れるときはマイクを返す
        return ()=>{
            recorderRef.current?.stream.getTracks().forEach((t)=>t.stop());
        };
    }, []);
    // ■ボタン：録音を止めて、音声を送って、おわりへ
    const finish = ()=>{
        const rec = recorderRef.current;
        if (rec && rec.state !== 'inactive') {
            rec.onstop = ()=>{
                const audio = new Blob(chunksRef.current, {
                    type: 'audio/webm'
                });
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["sendUtterance"])(audio); // バックエンドへ（未接続でも止まらない）
                rec.stream.getTracks().forEach((t)=>t.stop());
            };
            rec.stop();
        }
        router.push('/done');
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("main", {
        className: "listening",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "waves",
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
                        fileName: "[project]/app/listening/page.tsx",
                        lineNumber: 62,
                        columnNumber: 11
                    }, this))
            }, void 0, false, {
                fileName: "[project]/app/listening/page.tsx",
                lineNumber: 60,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "heard",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        children: "えー、今日は会議がのびて、資料ぜんぜん手つかず…"
                    }, void 0, false, {
                        fileName: "[project]/app/listening/page.tsx",
                        lineNumber: 68,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        children: "経費精算もまだ。あしたの朝イチかなあ。"
                    }, void 0, false, {
                        fileName: "[project]/app/listening/page.tsx",
                        lineNumber: 69,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        children: "あと、Bさんに連絡返すの忘れてた。"
                    }, void 0, false, {
                        fileName: "[project]/app/listening/page.tsx",
                        lineNumber: 70,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/listening/page.tsx",
                lineNumber: 67,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                className: "stop-btn",
                onClick: finish,
                "aria-label": "話しおわった",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("i", {}, void 0, false, {
                    fileName: "[project]/app/listening/page.tsx",
                    lineNumber: 75,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/app/listening/page.tsx",
                lineNumber: 74,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/app/listening/page.tsx",
        lineNumber: 58,
        columnNumber: 5
    }, this);
}
}),
];

//# sourceMappingURL=_1gcrycs._.js.map