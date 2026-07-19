from typing import Any

import httpx

from app.core.config import settings


class LineApiError(RuntimeError):
    """
    LINE API呼び出し時のエラーです。
    """

    def __init__(
        self,
        status_code: int,
        detail: Any,
        line_request_id: str | None = None,
    ) -> None:
        self.status_code = status_code
        self.detail = detail
        self.line_request_id = line_request_id

        super().__init__(
            f"LINE API error: status={status_code}, detail={detail}"
        )


def get_error_detail(response: httpx.Response) -> Any:
    """
    LINEのレスポンスがJSONでない場合にも対応します。
    """

    try:
        return response.json()
    except ValueError:
        return response.text


async def exchange_line_login_code(code: str) -> dict[str, Any]:
    """
    LINE Loginから受け取った認可コードを、
    アクセストークンとIDトークンへ交換します。
    """

    url = "https://api.line.me/oauth2/v2.1/token"

    form_data = {
        "grant_type": "authorization_code",
        "code": code,
        "redirect_uri": settings.line_login_callback_url,
        "client_id": settings.line_login_channel_id,
        "client_secret": settings.line_login_channel_secret,
    }

    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.post(
            url,
            data=form_data,
            headers={
                "Content-Type": "application/x-www-form-urlencoded",
            },
        )

    if response.status_code != 200:
        raise LineApiError(
            status_code=response.status_code,
            detail=get_error_detail(response),
            line_request_id=response.headers.get("x-line-request-id"),
        )

    return response.json()


async def verify_line_id_token(
    id_token: str,
    nonce: str,
) -> dict[str, Any]:
    """
    IDトークンをLINE側で検証します。

    検証済みレスポンスのsubが、LINEユーザーIDです。
    """

    url = "https://api.line.me/oauth2/v2.1/verify"

    form_data = {
        "id_token": id_token,
        "client_id": settings.line_login_channel_id,
        "nonce": nonce,
    }

    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.post(
            url,
            data=form_data,
            headers={
                "Content-Type": "application/x-www-form-urlencoded",
            },
        )

    if response.status_code != 200:
        raise LineApiError(
            status_code=response.status_code,
            detail=get_error_detail(response),
            line_request_id=response.headers.get("x-line-request-id"),
        )

    return response.json()


async def get_friendship_status(
    line_login_access_token: str,
) -> bool:
    """
    ユーザーが、リンクされたLINE公式アカウントを
    友だち追加しているか確認します。
    """

    url = "https://api.line.me/friendship/v1/status"

    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.get(
            url,
            headers={
                "Authorization": f"Bearer {line_login_access_token}",
            },
        )

    if response.status_code != 200:
        raise LineApiError(
            status_code=response.status_code,
            detail=get_error_detail(response),
            line_request_id=response.headers.get("x-line-request-id"),
        )

    return bool(response.json().get("friendFlag"))


async def send_push_message(
    line_user_id: str,
    message_text: str,
    retry_key: str,
) -> str | None:
    """
    LINE Messaging APIでテキストメッセージを送ります。

    retry_keyにはUUIDを指定します。
    通信エラー時に同じretry_keyで再試行することで、
    LINE側での重複送信リスクを抑えられます。
    """

    url = "https://api.line.me/v2/bot/message/push"

    payload = {
        "to": line_user_id,
        "messages": [
            {
                "type": "text",
                "text": message_text,
            }
        ],
    }

    headers = {
        "Authorization": (
            f"Bearer {settings.line_channel_access_token}"
        ),
        "Content-Type": "application/json",
        "X-Line-Retry-Key": retry_key,
    }

    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.post(
            url,
            json=payload,
            headers=headers,
        )

    line_request_id = response.headers.get("x-line-request-id")

    if response.status_code != 200:
        raise LineApiError(
            status_code=response.status_code,
            detail=get_error_detail(response),
            line_request_id=line_request_id,
        )

    return line_request_id