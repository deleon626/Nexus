"""Unit tests for Speech-to-Text service."""

import io
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.services.stt_service import STTService, TranscriptionError


@pytest.fixture
def mock_audio_file():
    """Create a mock audio file for testing."""
    audio_data = b"fake audio data"
    file = io.BytesIO(audio_data)
    file.name = "test.webm"
    return file


@pytest.fixture
def stt_service():
    """Create STT service instance."""
    return STTService(api_key="test_api_key")


@pytest.mark.asyncio
async def test_transcribe_success(stt_service, mock_audio_file):
    """Test successful transcription."""
    expected_text = "This is a test transcription"

    with patch("app.services.stt_service.AsyncOpenAI") as mock_openai:
        # Setup mock
        mock_client = MagicMock()
        mock_openai.return_value = mock_client
        mock_transcriptions = AsyncMock()
        mock_client.audio.transcriptions.create = mock_transcriptions
        mock_transcriptions.return_value = expected_text

        # Create service with mocked client
        service = STTService(api_key="test_api_key")
        service.client = mock_client

        # Test transcription
        result = await service.transcribe(mock_audio_file)

        # Verify
        assert result == expected_text
        mock_transcriptions.assert_called_once()
        call_kwargs = mock_transcriptions.call_args[1]
        assert call_kwargs["model"] == "whisper-1"
        assert call_kwargs["response_format"] == "text"


@pytest.mark.asyncio
async def test_transcribe_with_language(stt_service, mock_audio_file):
    """Test transcription with specified language."""
    expected_text = "Hola mundo"

    with patch("app.services.stt_service.AsyncOpenAI") as mock_openai:
        mock_client = MagicMock()
        mock_openai.return_value = mock_client
        mock_transcriptions = AsyncMock()
        mock_client.audio.transcriptions.create = mock_transcriptions
        mock_transcriptions.return_value = expected_text

        service = STTService(api_key="test_api_key")
        service.client = mock_client

        result = await service.transcribe(mock_audio_file, language="es")

        assert result == expected_text
        call_kwargs = mock_transcriptions.call_args[1]
        assert call_kwargs["language"] == "es"


@pytest.mark.asyncio
async def test_transcribe_api_error(stt_service, mock_audio_file):
    """Test transcription when API returns error."""
    with patch("app.services.stt_service.AsyncOpenAI") as mock_openai:
        mock_client = MagicMock()
        mock_openai.return_value = mock_client
        mock_transcriptions = AsyncMock()
        mock_client.audio.transcriptions.create = mock_transcriptions
        mock_transcriptions.side_effect = Exception("API Error")

        service = STTService(api_key="test_api_key")
        service.client = mock_client

        with pytest.raises(TranscriptionError) as exc_info:
            await service.transcribe(mock_audio_file)

        assert "Failed to transcribe audio" in str(exc_info.value)


@pytest.mark.asyncio
async def test_transcribe_empty_result(stt_service, mock_audio_file):
    """Test transcription when API returns empty result."""
    with patch("app.services.stt_service.AsyncOpenAI") as mock_openai:
        mock_client = MagicMock()
        mock_openai.return_value = mock_client
        mock_transcriptions = AsyncMock()
        mock_client.audio.transcriptions.create = mock_transcriptions
        mock_transcriptions.return_value = ""

        service = STTService(api_key="test_api_key")
        service.client = mock_client

        result = await service.transcribe(mock_audio_file)

        # Should return empty string, not raise error
        assert result == ""


@pytest.mark.asyncio
async def test_transcribe_strips_whitespace(stt_service, mock_audio_file):
    """Test that transcription result is stripped of whitespace."""
    with patch("app.services.stt_service.AsyncOpenAI") as mock_openai:
        mock_client = MagicMock()
        mock_openai.return_value = mock_client
        mock_transcriptions = AsyncMock()
        mock_client.audio.transcriptions.create = mock_transcriptions
        mock_transcriptions.return_value = "  Test transcription  \n"

        service = STTService(api_key="test_api_key")
        service.client = mock_client

        result = await service.transcribe(mock_audio_file)

        assert result == "Test transcription"


@pytest.mark.asyncio
async def test_transcribe_file_pointer_reset(stt_service, mock_audio_file):
    """Test that file pointer is reset before transcription."""
    # Move file pointer to end
    mock_audio_file.seek(0, 2)
    assert mock_audio_file.tell() > 0

    with patch("app.services.stt_service.AsyncOpenAI") as mock_openai:
        mock_client = MagicMock()
        mock_openai.return_value = mock_client
        mock_transcriptions = AsyncMock()
        mock_client.audio.transcriptions.create = mock_transcriptions
        mock_transcriptions.return_value = "Test"

        service = STTService(api_key="test_api_key")
        service.client = mock_client

        await service.transcribe(mock_audio_file)

        # Verify file pointer was reset
        assert mock_audio_file.tell() == 0
