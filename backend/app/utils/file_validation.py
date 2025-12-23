"""File upload validation utilities."""

import mimetypes
from pathlib import Path
from typing import BinaryIO

from fastapi import UploadFile

from app.config import settings


class FileValidationError(Exception):
    """Raised when file validation fails."""

    def __init__(self, message: str, error_code: str = "VALIDATION_ERROR"):
        self.message = message
        self.error_code = error_code
        super().__init__(self.message)


def get_file_extension(filename: str) -> str:
    """Extract file extension from filename."""
    return Path(filename).suffix.lower()


def validate_file_extension(filename: str) -> None:
    """
    Validate file extension against allowed list.

    Args:
        filename: Name of the uploaded file

    Raises:
        FileValidationError: If extension is not allowed
    """
    ext = get_file_extension(filename)
    if ext not in settings.allowed_upload_extensions:
        raise FileValidationError(
            f"File extension '{ext}' not allowed. Allowed: {settings.allowed_upload_extensions}",
            error_code="INVALID_EXTENSION",
        )


def validate_mime_type(content_type: str | None, filename: str) -> None:
    """
    Validate MIME type against allowed list.

    Args:
        content_type: Content-Type header from upload
        filename: Filename for fallback MIME detection

    Raises:
        FileValidationError: If MIME type is not allowed
    """
    # Use content_type from header, or guess from filename
    mime_type = content_type
    if not mime_type:
        mime_type, _ = mimetypes.guess_type(filename)

    if mime_type not in settings.allowed_upload_mime_types:
        raise FileValidationError(
            f"MIME type '{mime_type}' not allowed. Allowed: {settings.allowed_upload_mime_types}",
            error_code="INVALID_MIME_TYPE",
        )


def validate_file_size(file: BinaryIO, filename: str) -> int:
    """
    Validate file size against maximum limit.

    Args:
        file: File-like object to check
        filename: Filename for error message

    Returns:
        File size in bytes

    Raises:
        FileValidationError: If file exceeds size limit
    """
    # Seek to end to get size
    file.seek(0, 2)
    size = file.tell()
    file.seek(0)  # Reset to beginning

    if size > settings.max_upload_size_bytes:
        max_mb = settings.max_upload_size_bytes / (1024 * 1024)
        actual_mb = size / (1024 * 1024)
        raise FileValidationError(
            f"File '{filename}' exceeds maximum size of {max_mb:.1f}MB (actual: {actual_mb:.1f}MB)",
            error_code="FILE_TOO_LARGE",
        )

    return size


def validate_file_not_empty(file: BinaryIO, filename: str) -> None:
    """
    Validate that file is not empty.

    Args:
        file: File-like object to check
        filename: Filename for error message

    Raises:
        FileValidationError: If file is empty
    """
    file.seek(0, 2)
    size = file.tell()
    file.seek(0)

    if size == 0:
        raise FileValidationError(
            f"File '{filename}' is empty",
            error_code="EMPTY_FILE",
        )


async def validate_upload_file(upload_file: UploadFile) -> int:
    """
    Validate an uploaded file completely.

    Checks:
    - File extension is allowed
    - MIME type is allowed
    - File size is within limits
    - File is not empty

    Args:
        upload_file: FastAPI UploadFile object

    Returns:
        File size in bytes

    Raises:
        FileValidationError: If any validation fails
    """
    filename = upload_file.filename or "unknown"

    # Validate extension
    validate_file_extension(filename)

    # Validate MIME type
    validate_mime_type(upload_file.content_type, filename)

    # Read file content for size validation
    content = await upload_file.read()
    await upload_file.seek(0)  # Reset for later reading

    if len(content) == 0:
        raise FileValidationError(
            f"File '{filename}' is empty",
            error_code="EMPTY_FILE",
        )

    if len(content) > settings.max_upload_size_bytes:
        max_mb = settings.max_upload_size_bytes / (1024 * 1024)
        actual_mb = len(content) / (1024 * 1024)
        raise FileValidationError(
            f"File '{filename}' exceeds maximum size of {max_mb:.1f}MB (actual: {actual_mb:.1f}MB)",
            error_code="FILE_TOO_LARGE",
        )

    return len(content)
