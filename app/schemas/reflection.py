from datetime import date
from typing import List, Optional

from pydantic import BaseModel, Field


class ExistingScheduleContext(BaseModel):
    """DB上のschedules/tasks、Googleカレンダー取得結果など、
    Azure OpenAIへ渡すためのコンテキスト（他モジュールから受け取る前提のインターフェース）
    """

    schedule_summary: Optional[str] = None
    tasks_summary: Optional[str] = None
    calendar_events_summary: Optional[str] = None


class ProposedScheduleChangeItem(BaseModel):
    """予定修正案の1タスク分（Googleカレンダー連携モジュールへの引き渡し用）"""

    title: str
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    reason: Optional[str] = None


class ReflectionRequest(BaseModel):
    """POST /reflection のリクエスト"""

    user_id: int
    reflection_date: date = Field(description="振り返り対象日")
    proposal_date: date = Field(description="重点ポイント・予定修正案の対象日")
    raw_text: Optional[str] = Field(
        default=None, description="音声を使わずテキストで直接入力する場合"
    )
    context: Optional[ExistingScheduleContext] = Field(
        default=None,
        description="DB/Googleカレンダーから取得した予定情報。他モジュールから渡される想定",
    )


class ReflectionResponse(BaseModel):
    """POST /reflection のレスポンス"""

    reflection_id: int
    reflection_date: date
    proposal_date: date
    raw_text: str
    reflection_summary: str
    gap_analysis: str
    gap_reason: str
    today_key_point: str
    proposed_schedule_change: List[ProposedScheduleChangeItem]