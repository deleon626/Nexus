"""SQLAlchemy ORM models for Nexus."""

from datetime import datetime
from typing import Optional

from sqlalchemy import JSON, DateTime, ForeignKey, String, Text
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    """Base class for all ORM models."""
    pass


class Session(Base):
    """
    Agent conversation session.

    Attributes:
        id: Unique session identifier (UUID)
        status: Session status (active, completed)
        created_at: Session creation timestamp
        updated_at: Last update timestamp
        messages: Related messages in this session
        reports: Related reports created in this session
    """
    __tablename__ = "sessions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    status: Mapped[str] = mapped_column(String(20), default="active")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[Optional[datetime]] = mapped_column(DateTime, onupdate=datetime.utcnow, nullable=True)

    # Relationships
    messages: Mapped[list["Message"]] = relationship(
        "Message",
        back_populates="session",
        cascade="all, delete-orphan"
    )
    reports: Mapped[list["Report"]] = relationship(
        "Report",
        back_populates="session",
        cascade="all, delete-orphan"
    )


class Message(Base):
    """
    Individual message in a conversation session.

    Attributes:
        id: Unique message identifier (UUID)
        session_id: Foreign key to parent session
        role: Message sender (user, assistant)
        content: Message text content
        created_at: Message creation timestamp
        session: Related session object
    """
    __tablename__ = "messages"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    session_id: Mapped[str] = mapped_column(String(36), ForeignKey("sessions.id"))
    role: Mapped[str] = mapped_column(String(20))  # "user" or "assistant"
    content: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    session: Mapped["Session"] = relationship("Session", back_populates="messages")


class Report(Base):
    """
    QC data report created from confirmed extraction.

    Attributes:
        id: Unique report identifier (UUID)
        session_id: Foreign key to session (optional)
        confirmation_id: Reference to confirmation that created this report
        data: JSON-serialized extracted data
        status: Report status (pending_approval, approved, rejected)
        created_at: Report creation timestamp
        created_by: User identifier (future: for multi-user support)
        session: Related session object
    """
    __tablename__ = "reports"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    session_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("sessions.id"), nullable=True)
    confirmation_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    data: Mapped[dict] = mapped_column(JSON)
    status: Mapped[str] = mapped_column(String(20), default="pending_approval")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    created_by: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)

    # Relationships
    session: Mapped[Optional["Session"]] = relationship("Session", back_populates="reports")
