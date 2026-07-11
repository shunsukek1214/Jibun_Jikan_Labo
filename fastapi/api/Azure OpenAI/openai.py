import os
from openai import AzureOpenAI
from dotenv import load_dotenv

# .env ファイルから環境変数をロードする
load_dotenv()

# 環境変数を取得する
endpoint = os.getenv("ENDPOINT_URL")
deployment = os.getenv("DEPLOYMENT_NAME")
subscription_key = os.getenv("AZURE_OPENAI_API_KEY")
api_version = os.getenv("API_VERSION")

# キーベースの認証を使用して Azure OpenAI クライアントを初期化する
client = AzureOpenAI(
    azure_endpoint=endpoint,
    api_key=subscription_key,
    api_version=api_version,
)

# モデルへの指示とコンテキストを定義する。
model_context = "情報を見つけるのに役立つ AI アシスタントです。"

# ユーザー クエリを定義する。
user_query = "これはテストメッセージです。"

# チャット プロンプトを準備する
chat_prompt = [{
    "role": "system",
    "content": [
        {
            "type": "text",
            "text": model_context
        },
    ],
}, {
    "role": "user",
    "content": [
        {
            "type": "text",
            "text": user_query,
        },
    ],
}]

# パラメーターを設定する
parameters = {
    "model": deployment,
    "max_tokens": 800,
    "temperature": 1.0,
    "top_p": 0.7,
    "frequency_penalty": 0,
    "presence_penalty": 0,
    "stop": None,
    "stream": False,
}

# チャット プロンプトを送信する
completion = client.chat.completions.create(messages=chat_prompt, **parameters)

# チャット プロンプトを表示する
print(completion.choices[0].message.content)

# 使用したトークンを表示する
print(f"- 完了トークン: {completion.usage.completion_tokens}")
print(f"- プロンプトトークン: {completion.usage.prompt_tokens}")

