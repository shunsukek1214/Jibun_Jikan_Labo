# Speech to Text + Azure OpenAI 実装（じぶん時間ラボ）

RFPスコープ外部分（Googleカレンダー連携・LINE通知・DB本体）を除き、以下の範囲で実装。

- 明日の予定構造化：音声（テキスト）入力 → Speech to Text → Azure OpenAIで構造化（図4対応）
- 振り返り：音声入力 → Speech to Text → Azure OpenAIで要約・ズレ分析・重点ポイント・予定修正案生成（図5対応）
- DBは`schedules`（raw_text/summary）と`reflection`（raw_text〜proposed_schedule_change）の最小限のみ

## ファイル構造

```text
app/
  main.py
  core/
    config.py
    logging_config.py
  api/
    v1/
      __init__.py
      schedule_structuring.py
      reflection.py
  schemas/
    schedule_structuring.py
    reflection.py
  services/
    speech_service.py
    openai_service.py
  models/
    schedule.py
    reflection.py
  db/
    database.py
    session.py
requirements.txt
.env.example