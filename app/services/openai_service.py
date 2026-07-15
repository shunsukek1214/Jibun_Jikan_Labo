import json
import logging
from typing import Any, Dict, Optional

from openai import AzureOpenAI

from app.core.config import get_settings

logger = logging.getLogger(__name__)


class OpenAIServiceError(Exception):
    """Azure OpenAI処理に関するエラー"""


SCHEDULE_STRUCTURING_SYSTEM_PROMPT = """\
あなたは、ユーザーが話した明日の予定・タスクの独り言を構造化するアシスタントです。
入力テキストから以下のJSON形式で出力してください。他の説明文は一切出力しないこと。

{
  "summary": "予定全体の概要（1〜2文）",
  "tasks": [
    {
      "title": "タスク名",
      "start_time": "HH:MM または null",
      "end_time": "HH:MM または null",
      "priority": "high/medium/low のいずれか",
      "estimated_minutes": 数値または null
    }
  ]
}
"""

REFLECTION_SYSTEM_PROMPT = """\
あなたは、ユーザーの1日の振り返り発話と、予定・タスク・カレンダー情報を突き合わせて
分析するアシスタントです。以下のJSON形式で出力してください。他の説明文は一切出力しないこと。

{
  "reflection_summary": "振り返り内容の要約",
  "gap_analysis": "予定と実績のズレの分析（どこでどのくらい時間がずれたか）",
  "gap_reason": "ズレが生じた理由の考察",
  "today_key_point": "今日の重点ポイント（1〜2文）",
  "proposed_schedule_change": [
    {
      "title": "タスク名",
      "start_time": "HH:MM または null",
      "end_time": "HH:MM または null",
      "reason": "修正理由"
    }
  ]
}
"""


class OpenAIService:
    """Azure OpenAIを用いた予定構造化・振り返り分析サービス"""

    def __init__(self) -> None:
        settings = get_settings()
        self._client = AzureOpenAI(
            api_key=settings.azure_openai_api_key,
            api_version=settings.azure_openai_api_version,
            azure_endpoint=settings.azure_openai_endpoint,
        )
        self._deployment_name = settings.azure_openai_deployment_name

    def _call_chat_completion(self, system_prompt: str, user_content: str) -> Dict[str, Any]:
        try:
            response = self._client.chat.completions.create(
                model=self._deployment_name,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_content},
                ],
                response_format={"type": "json_object"},
                temperature=0.3,
            )
        except Exception as exc:  # noqa: BLE001
            logger.error(f"Azure OpenAI呼び出しに失敗しました: {exc}")
            raise OpenAIServiceError("AI処理でエラーが発生しました。時間をおいて再試行してください。") from exc

        content = response.choices[0].message.content
        try:
            return json.loads(content)
        except json.JSONDecodeError as exc:
            logger.error(f"Azure OpenAIレスポンスのJSON解析に失敗しました: {content}")
            raise OpenAIServiceError("AI応答の解析に失敗しました。") from exc

    def structure_tomorrow_schedule(self, raw_text: str) -> Dict[str, Any]:
        """明日の予定・タスクの独り言テキストを構造化する"""
        return self._call_chat_completion(SCHEDULE_STRUCTURING_SYSTEM_PROMPT, raw_text)

    def analyze_reflection(
        self,
        raw_text: str,
        schedule_summary: Optional[str],
        tasks_summary: Optional[str],
        calendar_events_summary: Optional[str],
    ) -> Dict[str, Any]:
        """振り返り発話と既存の予定情報を突き合わせて分析する"""
        user_content = json.dumps(
            {
                "reflection_raw_text": raw_text,
                "schedule_summary": schedule_summary or "",
                "tasks_summary": tasks_summary or "",
                "calendar_events_summary": calendar_events_summary or "",
            },
            ensure_ascii=False,
        )
        return self._call_chat_completion(REFLECTION_SYSTEM_PROMPT, user_content)


def get_openai_service() -> OpenAIService:
    return OpenAIService()