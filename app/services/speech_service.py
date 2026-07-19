import logging
import os
import threading

import azure.cognitiveservices.speech as speechsdk
from pydub import AudioSegment

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

  def _convert_to_wav(self, source_path: str) -> str:
    """webm等の音声ファイルをAzure Speech SDK向けのWAV（PCM）に変換する

    Args:
      source_path: 変換前の音声ファイルパス（webm等）

    Returns:
      変換後のWAVファイルパス

    Raises:
      SpeechToTextError: 変換に失敗した場合
    """
    wav_path = f"{source_path}.converted.wav"
    try:
      audio = AudioSegment.from_file(source_path)
      audio = audio.set_frame_rate(16000).set_channels(1).set_sample_width(2)
      audio.export(wav_path, format="wav")
    except Exception as exc:
      logger.error(f"音声ファイルの変換に失敗しました: {exc}")
      raise SpeechToTextError("音声ファイルの形式を変換できませんでした。") from exc
    return wav_path

  def transcribe_audio_file(self, audio_file_path: str) -> str:
    """音声ファイルをテキストに変換する（連続認識版）

    ブラウザ（MediaRecorder）から送られてくる音声はwebm形式のため、
    Azure Speech SDKが前提とするWAV（PCM）へ変換したうえで認識処理を行う。

    Args:
      audio_file_path: 一時保存された音声ファイルのパス（webm等）

    Returns:
      文字起こしされたテキスト（複数区間はスペース区切りで連結）

    Raises:
      SpeechToTextError: 認識に失敗した場合
    """
    wav_path = self._convert_to_wav(audio_file_path)

    try:
      audio_config = speechsdk.audio.AudioConfig(filename=wav_path)
      recognizer = speechsdk.SpeechRecognizer(
        speech_config=self._speech_config, audio_config=audio_config
      )

      results: list[str] = []
      done = threading.Event()
      cancellation_error: dict[str, str] = {}

      def handle_recognized(evt: speechsdk.SpeechRecognitionEventArgs) -> None:
        if evt.result.reason == speechsdk.ResultReason.RecognizedSpeech:
          if evt.result.text:
            results.append(evt.result.text)
        elif evt.result.reason == speechsdk.ResultReason.NoMatch:
          logger.warning("Speech to Text: 区間内で音声が認識できませんでした")

      def handle_canceled(evt: speechsdk.SpeechRecognitionCanceledEventArgs) -> None:
        if evt.reason == speechsdk.CancellationReason.Error:
          logger.error(
            f"Speech to Text canceled: error_code={evt.error_code}, "
            f"details={evt.error_details}"
          )
          cancellation_error["message"] = "音声認識処理中にエラーが発生しました。"
        done.set()

      def handle_stopped(evt: speechsdk.SessionEventArgs) -> None:
        done.set()

      recognizer.recognized.connect(handle_recognized)
      recognizer.session_stopped.connect(handle_stopped)
      recognizer.canceled.connect(handle_canceled)

      recognizer.start_continuous_recognition()
      try:
        done.wait()
      finally:
        recognizer.stop_continuous_recognition()

      if cancellation_error:
        raise SpeechToTextError(cancellation_error["message"])

      if not results:
        raise SpeechToTextError("音声を認識できませんでした。もう一度お試しください。")

      return " ".join(results)
    finally:
      try:
        os.unlink(wav_path)
      except OSError:
        logger.warning(f"変換用一時ファイルの削除に失敗しました: {wav_path}")


def get_speech_service() -> SpeechService:
  return SpeechService()