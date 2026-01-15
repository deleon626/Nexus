"""Seed default schema for fallback use."""

import logging
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import FormTemplate, FormStatus

logger = logging.getLogger(__name__)

# Default schema ID constant
DEFAULT_SCHEMA_ID = "default-schema"

# Default schema structure
DEFAULT_SCHEMA = {
    "per_sample_fields": [
        {
            "id": "weight",
            "label": "Weight",
            "field_type": "number",
            "required": True,
            "unit": "kg",
        },
        {
            "id": "temperature",
            "label": "Temperature",
            "field_type": "number",
            "required": False,
            "unit": "°C",
        },
        {
            "id": "notes",
            "label": "Notes",
            "field_type": "text",
            "required": False,
        },
    ],
    "sections": [],
    "batch_metadata_fields": [
        {
            "id": "batch_id",
            "label": "Batch ID",
            "field_type": "text",
            "required": True,
        },
        {
            "id": "date",
            "label": "Date",
            "field_type": "date",
            "required": True,
        },
    ],
}


async def seed_default_schema(db: AsyncSession) -> None:
    """
    Seed a default schema if none exists.

    This ensures there's always a fallback schema available for sessions
    that don't specify a schema_id.

    Args:
        db: Database session
    """
    try:
        # Check if default schema already exists
        query = select(FormTemplate).where(FormTemplate.id == DEFAULT_SCHEMA_ID)
        result = await db.execute(query)
        existing = result.scalar_one_or_none()

        if existing:
            logger.info("Default schema already exists, skipping seed")
            return

        # Create default schema
        default_template = FormTemplate(
            id=DEFAULT_SCHEMA_ID,
            form_code="DEFAULT-001",
            form_name="Default QC Schema",
            category="General",
            version="1.0.0",
            version_number=1,
            schema_definition=DEFAULT_SCHEMA,
            status=FormStatus.ACTIVE.value,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )

        db.add(default_template)
        await db.commit()

        logger.info("✓ Default schema seeded successfully")

    except Exception as e:
        logger.error(f"Failed to seed default schema: {e}")
        await db.rollback()
        # Don't raise - seeding failure shouldn't stop app startup
