"""Unit tests for SQLite database operations."""

import asyncio
import os
import tempfile
import uuid
from datetime import datetime
from pathlib import Path

import pytest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker

from app.db.models import Base, Session, Message, Report


@pytest.fixture
async def temp_db():
    """Create a temporary database for testing."""
    # Create temp database file
    fd, path = tempfile.mkstemp(suffix=".db")
    os.close(fd)

    # Create engine and session maker
    engine = create_async_engine(f"sqlite+aiosqlite:///{path}", echo=False)
    async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    # Create tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    yield async_session

    # Cleanup
    await engine.dispose()
    Path(path).unlink(missing_ok=True)


@pytest.mark.asyncio
async def test_create_session(temp_db):
    """Test creating a new session."""
    session_id = str(uuid.uuid4())

    async with temp_db() as db:
        # Create session
        session = Session(id=session_id, status="active")
        db.add(session)
        await db.commit()

    # Verify session was created
    async with temp_db() as db:
        result = await db.execute(select(Session).where(Session.id == session_id))
        fetched_session = result.scalar_one_or_none()

        assert fetched_session is not None
        assert fetched_session.id == session_id
        assert fetched_session.status == "active"
        assert fetched_session.created_at is not None


@pytest.mark.asyncio
async def test_delete_session(temp_db):
    """Test deleting a session."""
    session_id = str(uuid.uuid4())

    # Create session
    async with temp_db() as db:
        session = Session(id=session_id, status="active")
        db.add(session)
        await db.commit()

    # Delete session
    async with temp_db() as db:
        result = await db.execute(select(Session).where(Session.id == session_id))
        session = result.scalar_one()
        await db.delete(session)
        await db.commit()

    # Verify session was deleted
    async with temp_db() as db:
        result = await db.execute(select(Session).where(Session.id == session_id))
        fetched_session = result.scalar_one_or_none()
        assert fetched_session is None


@pytest.mark.asyncio
async def test_create_message(temp_db):
    """Test creating a message in a session."""
    session_id = str(uuid.uuid4())
    message_id = str(uuid.uuid4())

    async with temp_db() as db:
        # Create session first
        session = Session(id=session_id, status="active")
        db.add(session)
        await db.commit()

        # Create message
        message = Message(
            id=message_id,
            session_id=session_id,
            role="user",
            content="Test message"
        )
        db.add(message)
        await db.commit()

    # Verify message was created
    async with temp_db() as db:
        result = await db.execute(select(Message).where(Message.id == message_id))
        fetched_message = result.scalar_one_or_none()

        assert fetched_message is not None
        assert fetched_message.id == message_id
        assert fetched_message.session_id == session_id
        assert fetched_message.role == "user"
        assert fetched_message.content == "Test message"


@pytest.mark.asyncio
async def test_get_session_messages(temp_db):
    """Test retrieving all messages for a session."""
    session_id = str(uuid.uuid4())

    async with temp_db() as db:
        # Create session
        session = Session(id=session_id, status="active")
        db.add(session)

        # Create multiple messages
        for i in range(3):
            message = Message(
                id=str(uuid.uuid4()),
                session_id=session_id,
                role="user" if i % 2 == 0 else "assistant",
                content=f"Message {i}"
            )
            db.add(message)

        await db.commit()

    # Retrieve messages
    async with temp_db() as db:
        result = await db.execute(
            select(Message)
            .where(Message.session_id == session_id)
            .order_by(Message.created_at)
        )
        messages = result.scalars().all()

        assert len(messages) == 3
        assert messages[0].content == "Message 0"
        assert messages[1].content == "Message 1"
        assert messages[2].content == "Message 2"


@pytest.mark.asyncio
async def test_create_report(temp_db):
    """Test creating a QC report."""
    session_id = str(uuid.uuid4())
    report_id = str(uuid.uuid4())
    confirmation_id = str(uuid.uuid4())

    async with temp_db() as db:
        # Create session
        session = Session(id=session_id, status="active")
        db.add(session)
        await db.commit()

        # Create report
        report = Report(
            id=report_id,
            session_id=session_id,
            confirmation_id=confirmation_id,
            data={"weight": 150.5, "batch": "ABC123"},
            status="pending_approval"
        )
        db.add(report)
        await db.commit()

    # Verify report was created
    async with temp_db() as db:
        result = await db.execute(select(Report).where(Report.id == report_id))
        fetched_report = result.scalar_one_or_none()

        assert fetched_report is not None
        assert fetched_report.id == report_id
        assert fetched_report.session_id == session_id
        assert fetched_report.confirmation_id == confirmation_id
        assert fetched_report.data == {"weight": 150.5, "batch": "ABC123"}
        assert fetched_report.status == "pending_approval"


@pytest.mark.asyncio
async def test_cascade_delete_session_with_messages(temp_db):
    """Test that deleting a session also deletes its messages."""
    session_id = str(uuid.uuid4())

    async with temp_db() as db:
        # Create session with messages
        session = Session(id=session_id, status="active")
        db.add(session)

        message = Message(
            id=str(uuid.uuid4()),
            session_id=session_id,
            role="user",
            content="Test message"
        )
        db.add(message)
        await db.commit()

        message_id = message.id

    # Delete session
    async with temp_db() as db:
        result = await db.execute(select(Session).where(Session.id == session_id))
        session = result.scalar_one()
        await db.delete(session)
        await db.commit()

    # Verify both session and message were deleted
    async with temp_db() as db:
        session_result = await db.execute(select(Session).where(Session.id == session_id))
        message_result = await db.execute(select(Message).where(Message.id == message_id))

        assert session_result.scalar_one_or_none() is None
        assert message_result.scalar_one_or_none() is None


@pytest.mark.asyncio
async def test_update_session_status(temp_db):
    """Test updating session status."""
    session_id = str(uuid.uuid4())

    async with temp_db() as db:
        # Create session
        session = Session(id=session_id, status="active")
        db.add(session)
        await db.commit()

    # Update status
    async with temp_db() as db:
        result = await db.execute(select(Session).where(Session.id == session_id))
        session = result.scalar_one()
        session.status = "completed"
        await db.commit()

    # Verify update
    async with temp_db() as db:
        result = await db.execute(select(Session).where(Session.id == session_id))
        session = result.scalar_one()
        assert session.status == "completed"
        assert session.updated_at is not None
