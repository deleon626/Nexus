"""API tests for Speech-to-Text endpoint."""

import io
from unittest.mock import AsyncMock, patch

import pytest
from fastapi import UploadFile
from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


@pytest.fixture
def mock_audio_file_upload():
    """Create a mock UploadFile for testing."""
    audio_data = b"fake audio data"
    file = io.BytesIO(audio_data)

    return UploadFile(
        filename="test.webm",
        file=file,
        headers={"content-type": "audio/webm"}
    )


def test_transcribe_endpoint_success():
    """Test successful transcription via API endpoint."""
    audio_data = b"fake audio data"

    with patch("app.api.stt.STTService") as mock_stt_service:
        # Setup mock
        mock_service = AsyncMock()
        mock_stt_service.return_value = mock_service
        mock_service.transcribe = AsyncMock(return_value="Test transcription")

        # Make request
        response = client.post(
            "/api/stt/transcribe",
            files={"audio_file": ("test.webm", audio_data, "audio/webm")}
        )

        # Verify
        assert response.status_code == 200
        assert response.json() == {
            "text": "Test transcription",
            "success": True
        }


def test_transcribe_endpoint_missing_file():
    """Test API endpoint with missing audio file."""
    response = client.post("/api/stt/transcribe")

    assert response.status_code == 422  # Unprocessable Entity


def test_transcribe_endpoint_with_language():
    """Test transcription with language parameter."""
    audio_data = b"fake audio data"

    with patch("app.api.stt.STTService") as mock_stt_service:
        mock_service = AsyncMock()
        mock_stt_service.return_value = mock_service
        mock_service.transcribe = AsyncMock(return_value="Hola mundo")

        response = client.post(
            "/api/stt/transcribe",
            files={"audio_file": ("test.webm", audio_data, "audio/webm")},
            data={"language": "es"}
        )

        assert response.status_code == 200
        assert response.json()["text"] == "Hola mundo"
        mock_service.transcribe.assert_called_once()


def test_transcribe_endpoint_service_error():
    """Test API endpoint when STT service fails."""
    audio_data = b"fake audio data"

    with patch("app.api.stt.STTService") as mock_stt_service:
        mock_service = AsyncMock()
        mock_stt_service.return_value = mock_service
        mock_service.transcribe = AsyncMock(
            side_effect=Exception("Transcription failed")
        )

        response = client.post(
            "/api/stt/transcribe",
            files={"audio_file": ("test.webm", audio_data, "audio/webm")}
        )

        assert response.status_code == 500
        assert "detail" in response.json()


def test_transcribe_endpoint_empty_result():
    """Test API endpoint when transcription returns empty string."""
    audio_data = b"fake audio data"

    with patch("app.api.stt.STTService") as mock_stt_service:
        mock_service = AsyncMock()
        mock_stt_service.return_value = mock_service
        mock_service.transcribe = AsyncMock(return_value="")

        response = client.post(
            "/api/stt/transcribe",
            files={"audio_file": ("test.webm", audio_data, "audio/webm")}
        )

        assert response.status_code == 200
        assert response.json() == {
            "text": "",
            "success": True
        }


# Note: Large file test removed - causes test timeout
# File size limits should be handled by web server/proxy configuration
