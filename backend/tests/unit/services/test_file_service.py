"""Smoke tests for PDF parsing in file_service.

TDD: These tests validate PDF parsing functionality using real QC form PDFs.
They verify the core pipeline: PDF -> images -> base64 for LLM vision.
"""

import pytest
from pathlib import Path
from PIL import Image
import io
import base64

from app.services.file_service import (
    convert_pdf_to_images,
    convert_pdf_first_page_to_image,
    get_pdf_page_count,
    prepare_image_for_extraction,
)


class TestPdfParsingSmokeTest:
    """Quick smoke tests using real QC form PDF."""

    @pytest.fixture
    def qc_form_pdf_bytes(self) -> bytes:
        """Load QC form PDF from docs/qc-forms/."""
        pdf_path = (
            Path(__file__).parent.parent.parent.parent.parent
            / "docs/qc-forms/1. FR-QC-II.03.01 - Penerimaan Bahan Baku.pdf"
        )
        if not pdf_path.exists():
            pytest.skip(f"QC form PDF not found at {pdf_path}")
        return pdf_path.read_bytes()

    def test_pdf_converts_to_images_without_error(self, qc_form_pdf_bytes: bytes):
        """
        Given: Real QC form PDF
        When: convert_pdf_to_images is called
        Then: Returns list of valid PNG images without errors
        """
        images = convert_pdf_to_images(qc_form_pdf_bytes)

        assert isinstance(images, list)
        assert len(images) > 0
        # Verify each page is valid PNG
        for img_bytes in images:
            img = Image.open(io.BytesIO(img_bytes))
            assert img.format == "PNG"

    def test_pdf_page_count_matches_conversion(self, qc_form_pdf_bytes: bytes):
        """
        Given: Real QC form PDF
        When: get_pdf_page_count and convert_pdf_to_images called
        Then: Page count matches number of converted images
        """
        page_count = get_pdf_page_count(qc_form_pdf_bytes)
        images = convert_pdf_to_images(qc_form_pdf_bytes)

        assert page_count == len(images)
        assert page_count > 0

    @pytest.mark.asyncio
    async def test_prepare_image_for_extraction_produces_valid_base64(
        self, qc_form_pdf_bytes: bytes
    ):
        """
        Given: Real QC form PDF
        When: prepare_image_for_extraction is called
        Then: Returns valid base64 image ready for LLM vision
        """
        base64_image, file_size = await prepare_image_for_extraction(
            file_content=qc_form_pdf_bytes,
            content_type="application/pdf",
            max_dimension=2048,
        )

        # Verify base64 format
        assert base64_image.startswith("data:image/png;base64,")

        # Verify file size is original PDF size
        assert file_size == len(qc_form_pdf_bytes)

        # Verify decoded image is valid and within size limit
        b64_data = base64_image.split(",")[1]
        decoded = base64.b64decode(b64_data)
        img = Image.open(io.BytesIO(decoded))
        assert img.width <= 2048
        assert img.height <= 2048
