"""File processing service for PDF to image conversion."""

import base64
import io
import uuid
from pathlib import Path

from fastapi import UploadFile
from PIL import Image

from app.config import settings


class FileProcessingError(Exception):
    """Raised when file processing fails."""

    def __init__(self, message: str, error_code: str = "PROCESSING_ERROR"):
        self.message = message
        self.error_code = error_code
        super().__init__(self.message)


def get_upload_dir() -> Path:
    """Get upload directory path, creating if needed."""
    upload_path = Path(settings.upload_dir)
    if not upload_path.is_absolute():
        # Make relative to backend directory
        upload_path = Path(__file__).parent.parent.parent / upload_path
    upload_path.mkdir(parents=True, exist_ok=True)
    return upload_path


def get_temp_upload_dir() -> Path:
    """Get temporary upload directory for preview files."""
    upload_dir = get_upload_dir()
    temp_dir = upload_dir / "temp"
    temp_dir.mkdir(parents=True, exist_ok=True)
    return temp_dir


def generate_unique_filename(original_filename: str) -> str:
    """Generate unique filename preserving extension."""
    ext = Path(original_filename).suffix.lower()
    return f"{uuid.uuid4().hex}{ext}"


async def save_upload_file(file_content: bytes, original_filename: str) -> Path:
    """
    Save uploaded file to temporary storage.

    Args:
        file_content: Raw file bytes
        original_filename: Original filename

    Returns:
        Path to saved file
    """
    upload_dir = get_upload_dir()
    unique_name = generate_unique_filename(original_filename)
    file_path = upload_dir / unique_name

    file_path.write_bytes(file_content)
    return file_path


async def cleanup_file(file_path: Path) -> None:
    """Remove temporary file."""
    try:
        if file_path.exists():
            file_path.unlink()
    except OSError:
        pass  # Ignore cleanup errors


def convert_pdf_to_images(pdf_content: bytes, dpi: int = 200) -> list[bytes]:
    """
    Convert PDF to list of images (one per page).

    Args:
        pdf_content: Raw PDF bytes
        dpi: Resolution for conversion (default 200)

    Returns:
        List of PNG image bytes, one per page

    Raises:
        FileProcessingError: If conversion fails
    """
    try:
        from pdf2image import convert_from_bytes

        # Convert PDF to PIL images
        images = convert_from_bytes(pdf_content, dpi=dpi)

        # Convert each page to PNG bytes
        result = []
        for img in images:
            buffer = io.BytesIO()
            img.save(buffer, format="PNG")
            result.append(buffer.getvalue())

        return result

    except ImportError:
        raise FileProcessingError(
            "pdf2image not installed. Install with: uv add pdf2image",
            error_code="MISSING_DEPENDENCY",
        )
    except Exception as e:
        raise FileProcessingError(
            f"Failed to convert PDF: {str(e)}",
            error_code="PDF_CONVERSION_ERROR",
        )


def convert_pdf_first_page_to_image(pdf_content: bytes, dpi: int = 200) -> bytes:
    """
    Convert first page of PDF to image.

    Args:
        pdf_content: Raw PDF bytes
        dpi: Resolution for conversion

    Returns:
        PNG image bytes of first page

    Raises:
        FileProcessingError: If conversion fails
    """
    images = convert_pdf_to_images(pdf_content, dpi=dpi)
    if not images:
        raise FileProcessingError(
            "PDF appears to be empty (no pages)",
            error_code="EMPTY_PDF",
        )
    return images[0]


def image_to_base64(image_bytes: bytes) -> str:
    """
    Convert image bytes to base64 string for LLM vision.

    Args:
        image_bytes: Raw image bytes

    Returns:
        Base64-encoded string with data URL prefix
    """
    # Detect image type
    img = Image.open(io.BytesIO(image_bytes))
    mime_type = f"image/{img.format.lower()}" if img.format else "image/png"

    # Encode to base64
    b64_data = base64.b64encode(image_bytes).decode("utf-8")
    return f"data:{mime_type};base64,{b64_data}"


def resize_image_if_needed(image_bytes: bytes, max_dimension: int = 2048) -> bytes:
    """
    Resize image if any dimension exceeds max_dimension.

    Args:
        image_bytes: Raw image bytes
        max_dimension: Maximum width or height

    Returns:
        Resized image bytes (or original if no resize needed)
    """
    img = Image.open(io.BytesIO(image_bytes))

    # Check if resize needed
    if img.width <= max_dimension and img.height <= max_dimension:
        return image_bytes

    # Calculate new dimensions preserving aspect ratio
    ratio = min(max_dimension / img.width, max_dimension / img.height)
    new_width = int(img.width * ratio)
    new_height = int(img.height * ratio)

    # Resize
    img = img.resize((new_width, new_height), Image.Resampling.LANCZOS)

    # Convert back to bytes
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    return buffer.getvalue()


async def prepare_image_for_extraction(
    file_content: bytes,
    content_type: str,
    max_dimension: int = 2048,
) -> tuple[str, int]:
    """
    Prepare file for LLM vision extraction.

    Handles PDFs by converting to image, resizes if needed,
    and returns base64-encoded image.

    Args:
        file_content: Raw file bytes
        content_type: MIME type
        max_dimension: Max image dimension

    Returns:
        Tuple of (base64_image_string, file_size_bytes)

    Raises:
        FileProcessingError: If processing fails
    """
    # Convert PDF to image if needed
    if content_type == "application/pdf":
        image_bytes = convert_pdf_first_page_to_image(file_content)
    else:
        image_bytes = file_content

    # Resize if too large
    image_bytes = resize_image_if_needed(image_bytes, max_dimension)

    # Convert to base64
    base64_image = image_to_base64(image_bytes)

    return base64_image, len(file_content)


def get_pdf_page_count(pdf_content: bytes) -> int:
    """
    Get page count from PDF file.

    Args:
        pdf_content: Raw PDF bytes

    Returns:
        Number of pages in PDF

    Raises:
        FileProcessingError: If unable to read PDF
    """
    try:
        from pdf2image import pdfinfo_from_bytes

        info = pdfinfo_from_bytes(pdf_content)
        return info.get("Pages", 0)
    except ImportError:
        raise FileProcessingError(
            "pdf2image not installed. Install with: uv add pdf2image",
            error_code="MISSING_DEPENDENCY",
        )
    except Exception:
        # Fallback: try to get page count from conversion
        try:
            images = convert_pdf_to_images(pdf_content, dpi=72)  # Low DPI for speed
            return len(images)
        except Exception as e2:
            raise FileProcessingError(
                f"Failed to get PDF page count: {str(e2)}",
                error_code="PDF_INFO_ERROR",
            )


async def save_temp_file_for_preview(
    file: UploadFile, session_id: str
) -> dict:
    """
    Save uploaded file to temp directory for preview.

    Args:
        file: FastAPI UploadFile instance
        session_id: Session identifier for unique filename prefix

    Returns:
        Dict with: url, filename, size, mime_type, page_count (for PDFs)

    Raises:
        FileProcessingError: If file save fails
    """
    try:
        # Read file content
        content = await file.read()
        await file.seek(0)  # Reset for potential re-reading

        # Generate unique filename
        ext = Path(file.filename or "upload").suffix.lower()
        unique_name = f"{session_id}_{uuid.uuid4().hex}{ext}"

        # Save to temp directory
        temp_dir = get_temp_upload_dir()
        file_path = temp_dir / unique_name

        file_path.write_bytes(content)

        # Build response
        result = {
            "url": f"/uploads/temp/{unique_name}",
            "filename": file.filename or "unknown",
            "size": len(content),
            "mime_type": file.content_type or "application/octet-stream",
        }

        # Get page count for PDFs
        if file.content_type == "application/pdf":
            try:
                page_count = get_pdf_page_count(content)
                result["page_count"] = page_count
            except FileProcessingError:
                # Not critical, can omit page count
                result["page_count"] = None

        return result

    except Exception as e:
        raise FileProcessingError(
            f"Failed to save temp file: {str(e)}",
            error_code="TEMP_SAVE_ERROR",
        )


# =============================================================================
# Permanent Document Storage (for source documents)
# =============================================================================


def get_documents_dir() -> Path:
    """
    Get the permanent documents storage directory.

    Returns:
        Path: Absolute path to documents directory

    Note:
        Creates directory if it doesn't exist.
    """
    upload_dir = get_upload_dir()
    docs_dir = upload_dir / "documents"
    docs_dir.mkdir(parents=True, exist_ok=True)
    return docs_dir


async def save_schema_document(
    file_content: bytes,
    original_filename: str,
    schema_id: str,
) -> dict:
    """
    Save source document permanently for a schema.

    Args:
        file_content: Raw file bytes
        original_filename: Original filename (for extension and metadata)
        schema_id: Schema UUID for directory organization

    Returns:
        Dict with: path, filename, size, mime_type

    Raises:
        FileProcessingError: If file save fails
    """
    try:
        docs_dir = get_documents_dir()
        schema_dir = docs_dir / schema_id
        schema_dir.mkdir(parents=True, exist_ok=True)

        # Preserve original extension
        ext = Path(original_filename).suffix.lower()
        stored_filename = f"source{ext}"
        file_path = schema_dir / stored_filename

        # Write file
        file_path.write_bytes(file_content)

        # Detect MIME type
        import mimetypes
        mime_type, _ = mimetypes.guess_type(original_filename)

        return {
            "path": f"documents/{schema_id}/{stored_filename}",
            "filename": original_filename,
            "size": len(file_content),
            "mime_type": mime_type or "application/octet-stream",
        }

    except Exception as e:
        raise FileProcessingError(
            f"Failed to save schema document: {str(e)}",
            error_code="DOCUMENT_SAVE_ERROR",
        )


async def delete_schema_document(schema_id: str) -> bool:
    """
    Delete stored document for a schema.

    Args:
        schema_id: Schema UUID

    Returns:
        bool: True if deleted, False if not found
    """
    import shutil

    docs_dir = get_documents_dir()
    schema_dir = docs_dir / schema_id

    if schema_dir.exists():
        shutil.rmtree(schema_dir)
        return True
    return False


def get_schema_document_url(document_path: str) -> str:
    """
    Convert relative document path to accessible URL.

    Args:
        document_path: Relative path (e.g., "documents/{schema_id}/source.pdf")

    Returns:
        str: Full URL path to access document
    """
    return f"/uploads/{document_path}"


async def move_temp_to_permanent(
    session_id: str,
    schema_id: str,
) -> dict | None:
    """
    Move a temp file to permanent document storage.

    Args:
        session_id: Session ID prefix used when saving temp file
        schema_id: Schema UUID for permanent storage

    Returns:
        Dict with document info, or None if no temp file found
    """
    try:
        temp_dir = get_temp_upload_dir()
        # Find temp file(s) for this session
        temp_files = list(temp_dir.glob(f"{session_id}_*"))

        if not temp_files:
            return None

        # Use the first matching file
        temp_file = temp_files[0]
        content = temp_file.read_bytes()

        # Extract original filename from temp name (format: {session_id}_{uuid}.ext)
        # We'll use a generic name since original is encoded in UUID
        original_filename = temp_file.name.split("_", 1)[1] if "_" in temp_file.name else temp_file.name

        # Save to permanent storage
        result = await save_schema_document(
            file_content=content,
            original_filename=original_filename,
            schema_id=schema_id,
        )

        # Clean up temp file
        cleanup_file(str(temp_file))

        return result

    except Exception as e:
        raise FileProcessingError(
            f"Failed to move temp file to permanent storage: {str(e)}",
            error_code="DOCUMENT_MOVE_ERROR",
        )
