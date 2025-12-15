"""Speech-to-Text service using OpenAI Whisper API."""

from typing import BinaryIO, Optional

from openai import AsyncOpenAI


class TranscriptionError(Exception):
    """Raised when transcription fails."""
    pass


class STTService:
    """
    Service for transcribing audio to text using OpenAI Whisper.

    Usage:
        service = STTService(api_key=settings.openai_api_key)
        text = await service.transcribe(audio_file)
    """

    def __init__(self, api_key: str):
        """
        Initialize STT service.

        Args:
            api_key: OpenAI API key
        """
        self.client = AsyncOpenAI(api_key=api_key)

    async def transcribe(
        self,
        audio_file: BinaryIO,
        language: Optional[str] = None
    ) -> str:
        """
        Transcribe audio file to text.

        Args:
            audio_file: Audio file object (supports webm, mp4, mp3, wav, etc.)
            language: Optional ISO 639-1 language code (e.g., "en", "es")

        Returns:
            Transcribed text (whitespace stripped)

        Raises:
            TranscriptionError: If transcription fails
        """
        try:
            # Reset file pointer to beginning
            audio_file.seek(0)

            # Build request parameters
            params = {
                "model": "whisper-1",
                "file": audio_file,
                "response_format": "text",
            }

            if language:
                params["language"] = language

            # Call Whisper API
            transcript = await self.client.audio.transcriptions.create(**params)

            # Return cleaned text
            return transcript.strip() if isinstance(transcript, str) else ""

        except Exception as e:
            raise TranscriptionError(f"Failed to transcribe audio: {str(e)}")
