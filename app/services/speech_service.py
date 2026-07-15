import logging

import azure.cognitiveservices.speech as speechsdk

from app.core.config import get_settings

logger = logging.getLogger(__name__)


class SpeechToTextError(Exception):
    """Speech to Text処理に関するエラー"""


class SpeechService:
    """Azure Speech to Textを用いた音声→テキスト変換サービス"""

    def __init__(self) -> None:
        settings = get_settings()
        self._speech_config = speechsdk.SpeechConfig(
            subscription=settings.azure_speech_key,
            region=settings.azure_speech_region,
        )
        self._speech_config.speech_recognition_language = "ja-JP"

    def transcribe_audio_file(self, audio_file_path: str) -> str:
        """音声ファイルをテキストに変換する

        Args:
            audio_file_path: 一時保存された音声ファイルのパス

        Returns:
            文字起こしされたテキスト

        Raises:
            SpeechToTextError: 認識に失敗した場合
        """
        audio_config = speechsdk.audio.AudioConfig(filename=audio_file_path)
        recognizer = speechsdk.SpeechRecognizer(
            speech_config=self._speech_config, audio_config=audio_config
        )

        result = recognizer.recognize_once()

        if result.reason == speechsdk.ResultReason.RecognizedSpeech:
            return result.text

        if result.reason == speechsdk.ResultReason.NoMatch:
            logger.warning("Speech to Text: 音声から音声が認識できませんでした")
            raise SpeechToTextError("音声を認識できませんでした。もう一度お試しください。")

        if result.reason == speechsdk.ResultReason.Canceled:
            cancellation = result.cancellation_details
            logger.error(f"Speech to Text canceled: reason={cancellation.reason}")
            raise SpeechToTextError("音声認識処理がキャンセルされました。")

        raise SpeechToTextError("音声認識で不明なエラーが発生しました。")


def get_speech_service() -> SpeechService:
    return SpeechService()