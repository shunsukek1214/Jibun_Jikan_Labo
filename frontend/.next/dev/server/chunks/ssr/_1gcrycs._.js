module.exports = [
"[project]/api.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "sendUtterance",
    ()=>sendUtterance
]);
// ============================================
// バックエンド（FastAPI）を呼ぶところ。この1ファイルだけ。
// まさが実装済みのAPIに合わせて、いまは1本だけ繋いでいる。
// ============================================
// 接続先。ローカル開発では http://localhost:8000（frontend/.env.local で変更できる）
const API = ("TURBOPACK compile-time value", "http://localhost:8000") ?? 'http://localhost:8000';
async function sendUtterance(audio) {
    try {
        const fd = new FormData();
        fd.append('user_id', '1'); // TODO: ログインができたら本物のIDにする
        fd.append('audio', audio, 'utterance.webm');
        await fetch(`${API}/createTomorrowSchedule`, {
            method: 'POST',
            body: fd
        });
        console.log('音声を送信しました');
    } catch (e) {
        console.log('バックエンド未接続（あとで繋がればOK）', e);
    }
} // --------------------------------------------
 // TODO: 次に繋ぐ候補（バックの実装が揃ったら足す）
 //
 // 朝のひとこと → POST /reflection （RFP図5）
 // export async function sendReflection(text: string) { ... }
 //
 // 提案を採用   → POST /schedule-changes/approve （RFP図5）
 // タスク完了   → POST /tasks/{id}/complete （RFP図6）
 // --------------------------------------------
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