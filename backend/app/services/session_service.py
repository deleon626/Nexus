"""Session management service with SQLite backend."""

import uuid
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import Session as DBSession, Message as DBMessage, Report as DBReport


class SessionService:
    """Service for managing agent conversation sessions."""

    def __init__(self, db: AsyncSession):
        """Initialize session service with database session."""
        self.db = db

    async def create_session(self) -> str:
        """
        Create a new agent conversation session.

        Returns:
            Session ID (UUID string)
        """
        session_id = str(uuid.uuid4())
        session = DBSession(id=session_id, status="active")
        self.db.add(session)
        await self.db.commit()
        return session_id

    async def delete_session(self, session_id: str) -> bool:
        """
        Delete a session and all associated data.

        Args:
            session_id: Session identifier

        Returns:
            True if session was deleted, False if not found
        """
        result = await self.db.execute(
            select(DBSession).where(DBSession.id == session_id)
        )
        session = result.scalar_one_or_none()

        if not session:
            return False

        await self.db.delete(session)
        await self.db.commit()
        return True

    async def get_session(self, session_id: str) -> Optional[dict]:
        """
        Get session details.

        Args:
            session_id: Session identifier

        Returns:
            Session data dict or None if not found
        """
        result = await self.db.execute(
            select(DBSession).where(DBSession.id == session_id)
        )
        session = result.scalar_one_or_none()

        if not session:
            return None

        return {
            "id": session.id,
            "status": session.status,
            "created_at": session.created_at.isoformat(),
            "updated_at": session.updated_at.isoformat() if session.updated_at else None,
        }

    async def complete_session(self, session_id: str) -> bool:
        """
        Mark a session as completed.

        Args:
            session_id: Session identifier

        Returns:
            True if session was updated, False if not found
        """
        result = await self.db.execute(
            select(DBSession).where(DBSession.id == session_id)
        )
        session = result.scalar_one_or_none()

        if not session:
            return False

        session.status = "completed"
        await self.db.commit()
        return True

    async def add_message(
        self,
        session_id: str,
        role: str,
        content: str
    ) -> str:
        """
        Add a message to a session.

        Args:
            session_id: Session identifier
            role: Message role ("user" or "assistant")
            content: Message content text

        Returns:
            Message ID (UUID string)

        Raises:
            ValueError: If session not found
        """
        # Verify session exists
        result = await self.db.execute(
            select(DBSession).where(DBSession.id == session_id)
        )
        session = result.scalar_one_or_none()

        if not session:
            raise ValueError(f"Session {session_id} not found")

        message_id = str(uuid.uuid4())
        message = DBMessage(
            id=message_id,
            session_id=session_id,
            role=role,
            content=content
        )
        self.db.add(message)
        await self.db.commit()
        return message_id

    async def get_messages(self, session_id: str) -> list[dict]:
        """
        Get all messages for a session in chronological order.

        Args:
            session_id: Session identifier

        Returns:
            List of message dicts with id, role, content, created_at
        """
        result = await self.db.execute(
            select(DBMessage)
            .where(DBMessage.session_id == session_id)
            .order_by(DBMessage.created_at)
        )
        messages = result.scalars().all()

        return [
            {
                "id": msg.id,
                "role": msg.role,
                "content": msg.content,
                "created_at": msg.created_at.isoformat(),
            }
            for msg in messages
        ]

    async def create_report(
        self,
        session_id: str,
        confirmation_id: str,
        data: dict,
        created_by: Optional[str] = None
    ) -> str:
        """
        Create a QC report from confirmed data.

        Args:
            session_id: Session identifier (optional)
            confirmation_id: Confirmation ID that created this report
            data: Extracted QC data as dict
            created_by: User identifier (optional)

        Returns:
            Report ID (UUID string)
        """
        report_id = str(uuid.uuid4())
        report = DBReport(
            id=report_id,
            session_id=session_id if session_id else None,
            confirmation_id=confirmation_id,
            data=data,
            status="pending_approval",
            created_by=created_by
        )
        self.db.add(report)
        await self.db.commit()
        return report_id

    async def get_report(self, report_id: str) -> Optional[dict]:
        """
        Get report details.

        Args:
            report_id: Report identifier

        Returns:
            Report data dict or None if not found
        """
        result = await self.db.execute(
            select(DBReport).where(DBReport.id == report_id)
        )
        report = result.scalar_one_or_none()

        if not report:
            return None

        return {
            "id": report.id,
            "session_id": report.session_id,
            "confirmation_id": report.confirmation_id,
            "data": report.data,
            "status": report.status,
            "created_at": report.created_at.isoformat(),
            "created_by": report.created_by,
        }
