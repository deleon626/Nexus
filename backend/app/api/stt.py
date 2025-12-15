"""Speech-to-Text API endpoints."""

import os
from typing import Optional

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from pydantic import BaseModel

from app.services.stt_service import STTService, TranscriptionError


router = APIRouter(prefix="/api/stt", tags=["stt"])


class TranscriptionResponse(BaseModel):
    """Response model for transcription."""
    text: str
    success: bool = True


class ErrorResponse(BaseModel):
    """Error response model."""
    error: str
    success: bool = False


@router.post("/transcribe", response_model=TranscriptionResponse)
async def transcribe_audio(
    audio_file: UploadFile = File(..., description="Audio file to transcribe"),
    language: Optional[str] = Form(None, description="ISO 639-1 language code (e.g., 'en', 'es')")
) -> TranscriptionResponse:
    """
    Transcribe audio file to text using OpenAI Whisper.

    Args:
        audio_file: Audio file (webm, mp4, mp3, wav, etc.)
        language: Optional language code for better accuracy

    Returns:
        Transcription result

    Raises:
        HTTPException: If transcription fails
    """
    # Validate file is audio
    if not audio_file.content_type or not audio_file.content_type.startswith("audio/"):
        raise HTTPException(
            status_code=400,
            detail="File must be an audio file"
        )

    # Get OpenAI API key from environment
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=500,
            detail="OpenAI API key not configured"
        )

    try:
        # Create STT service
        stt_service = STTService(api_key=api_key)

        # Transcribe audio
        text = await stt_service.transcribe(audio_file.file, language=language)

        return TranscriptionResponse(text=text, success=True)

    except TranscriptionError as e:
        raise HTTPException(
            status_code=500,
            detail=f"Transcription failed: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Unexpected error: {str(e)}"
        )
