from datetime import date
from typing import List, Optional

from pydantic import BaseModel, Field


class TaskItem(BaseModel):
    """AIが構造化した個々のタスク（Tasksテーブルへの引き渡し用スキーマ）"""

    title: str
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    priority: Optional[str] = Field(default=None, description="high / medium / low など")
    estimated_minutes: Optional[int] = None


class ScheduleStructuringRequest(BaseModel):
    """POST /createTomorrowSchedule のリクエスト

    音声データはmultipart/form-dataで別途受け取るため、
    ここではテキスト直接入力にも対応できるようoptionalにしている。
    """

    user_id: int
    target_date: date
    raw_text: Optional[str] = Field(
        default=None, description="音声を使わずテキストで直接入力する場合"
    )


class ScheduleStructuringResponse(BaseModel):
    """POST /createTomorrowSchedule のレスポンス

    schedule_id/task一覧は、DB保存後にGoogleカレンダー連携モジュール（他担当）へ
    引き渡すためのインターフェースとして利用される想定。
    """

    schedule_id: int
    target_date: date
    raw_text: str
    summary: str
    tasks: List[TaskItem]