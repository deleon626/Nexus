"""In-memory store for session context and confirmation modals.

This replaces Redis for the MVP, storing transient data in memory.
For production, this should be replaced with Redis or similar.
"""

from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Any, Dict, Optional
from threading import Lock


@dataclass
class SessionContext:
    """Session context data stored in memory."""
    session_id: str
    context: Dict[str, Any] = field(default_factory=dict)
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)
    ttl_seconds: int = 3600  # Default 1 hour TTL
    
    @property
    def expires_at(self) -> datetime:
        """Calculate expiration based on last update + TTL."""
        return self.updated_at + timedelta(seconds=self.ttl_seconds)
    
    @property
    def is_expired(self) -> bool:
        """Check if session has expired."""
        return datetime.utcnow() > self.expires_at


@dataclass
class ConfirmationModal:
    """Confirmation modal data pending user approval."""
    confirmation_id: str
    session_id: str
    schema_id: Optional[str]
    extracted_data: Dict[str, Any]
    created_at: datetime = field(default_factory=datetime.utcnow)
    expires_at: datetime = field(default_factory=lambda: datetime.utcnow() + timedelta(minutes=15))


class MemoryStore:
    """
    Thread-safe in-memory store for session context and confirmations.

    Usage:
        store = MemoryStore()
        store.set_session_context(session_id, {"key": "value"})
        context = store.get_session_context(session_id)
    """

    def __init__(self):
        """Initialize empty stores with thread locks."""
        self._sessions: Dict[str, SessionContext] = {}
        self._confirmations: Dict[str, ConfirmationModal] = {}
        self._session_lock = Lock()
        self._confirmation_lock = Lock()

    def set_session_context(
        self, session_id: str, context: Dict[str, Any], ttl_seconds: int = 3600
    ) -> None:
        """
        Store or update session context.

        Args:
            session_id: Session identifier
            context: Context data to store
            ttl_seconds: Time-to-live in seconds (default: 1 hour)
        """
        with self._session_lock:
            if session_id in self._sessions:
                self._sessions[session_id].context = context
                self._sessions[session_id].updated_at = datetime.utcnow()
                # Extend TTL on activity
                self._sessions[session_id].ttl_seconds = ttl_seconds
            else:
                self._sessions[session_id] = SessionContext(
                    session_id=session_id,
                    context=context,
                    ttl_seconds=ttl_seconds
                )

    def get_session_context(self, session_id: str) -> Optional[Dict[str, Any]]:
        """
        Retrieve session context.

        Args:
            session_id: Session identifier

        Returns:
            Context dict or None if not found
        """
        with self._session_lock:
            session = self._sessions.get(session_id)
            return session.context if session else None

    def delete_session_context(self, session_id: str) -> bool:
        """
        Delete session context.

        Args:
            session_id: Session identifier

        Returns:
            True if deleted, False if not found
        """
        with self._session_lock:
            if session_id in self._sessions:
                del self._sessions[session_id]
                return True
            return False

    def store_confirmation(
        self,
        confirmation_id: str,
        session_id: str,
        schema_id: Optional[str],
        extracted_data: Dict[str, Any]
    ) -> None:
        """
        Store a confirmation modal pending user approval.

        Args:
            confirmation_id: Unique confirmation identifier
            session_id: Associated session
            schema_id: QC schema identifier (optional for MVP)
            extracted_data: Data extracted by agent
        """
        with self._confirmation_lock:
            self._confirmations[confirmation_id] = ConfirmationModal(
                confirmation_id=confirmation_id,
                session_id=session_id,
                schema_id=schema_id,
                extracted_data=extracted_data
            )

    def get_confirmation(self, confirmation_id: str) -> Optional[Dict[str, Any]]:
        """
        Retrieve confirmation modal data.

        Args:
            confirmation_id: Confirmation identifier

        Returns:
            Confirmation data dict or None if not found/expired
        """
        with self._confirmation_lock:
            confirmation = self._confirmations.get(confirmation_id)

            if not confirmation:
                return None

            # Check expiration (15 minutes)
            if datetime.utcnow() > confirmation.expires_at:
                del self._confirmations[confirmation_id]
                return None

            return {
                "confirmation_id": confirmation.confirmation_id,
                "session_id": confirmation.session_id,
                "schema_id": confirmation.schema_id,
                "extracted_data": confirmation.extracted_data,
                "created_at": confirmation.created_at.isoformat(),
                "expires_at": confirmation.expires_at.isoformat(),
            }

    def get_session_confirmation(self, session_id: str) -> Optional[Dict[str, Any]]:
        """
        Retrieve the most recent confirmation for a session.

        Args:
            session_id: Session identifier

        Returns:
            Confirmation data dict or None if not found
        """
        with self._confirmation_lock:
            # Find all confirmations for this session
            session_confirmations = [
                conf for conf in self._confirmations.values()
                if conf.session_id == session_id
            ]

            if not session_confirmations:
                return None

            # Get the most recent non-expired confirmation
            session_confirmations.sort(key=lambda x: x.created_at, reverse=True)
            for confirmation in session_confirmations:
                if datetime.utcnow() <= confirmation.expires_at:
                    return {
                        "confirmation_id": confirmation.confirmation_id,
                        "session_id": confirmation.session_id,
                        "schema_id": confirmation.schema_id,
                        "extracted_data": confirmation.extracted_data,
                        "created_at": confirmation.created_at.isoformat() + "Z",
                        "expires_at": confirmation.expires_at.isoformat() + "Z",
                    }

            return None

    def delete_confirmation(self, confirmation_id: str) -> bool:
        """
        Delete a confirmation modal.

        Args:
            confirmation_id: Confirmation identifier

        Returns:
            True if deleted, False if not found
        """
        with self._confirmation_lock:
            if confirmation_id in self._confirmations:
                del self._confirmations[confirmation_id]
                return True
            return False

    def cleanup_expired_confirmations(self) -> int:
        """
        Remove all expired confirmations.

        Returns:
            Number of confirmations removed
        """
        with self._confirmation_lock:
            now = datetime.utcnow()
            expired_ids = [
                conf_id for conf_id, conf in self._confirmations.items()
                if now > conf.expires_at
            ]

            for conf_id in expired_ids:
                del self._confirmations[conf_id]

            return len(expired_ids)

    # Alias for backward compatibility
    cleanup_expired = cleanup_expired_confirmations

    def cleanup_expired_sessions(self) -> int:
        """
        Remove all expired sessions.

        Returns:
            Number of sessions removed
        """
        with self._session_lock:
            expired_ids = [
                session_id for session_id, session in self._sessions.items()
                if session.is_expired
            ]

            for session_id in expired_ids:
                del self._sessions[session_id]

            return len(expired_ids)

    def cleanup_all_expired(self) -> Dict[str, int]:
        """
        Remove all expired sessions and confirmations.

        Returns:
            Dict with counts: {"sessions": N, "confirmations": M}
        """
        sessions_removed = self.cleanup_expired_sessions()
        confirmations_removed = self.cleanup_expired_confirmations()
        return {
            "sessions": sessions_removed,
            "confirmations": confirmations_removed
        }

    def get_stats(self) -> Dict[str, int]:
        """
        Get current store statistics.

        Returns:
            Dict with counts: {"sessions": N, "confirmations": M}
        """
        with self._session_lock:
            session_count = len(self._sessions)
        with self._confirmation_lock:
            confirmation_count = len(self._confirmations)
        return {
            "sessions": session_count,
            "confirmations": confirmation_count
        }

    def clear_all(self) -> None:
        """Clear all stored data. For testing purposes only."""
        with self._session_lock:
            self._sessions.clear()
        with self._confirmation_lock:
            self._confirmations.clear()


# Global memory store instance
memory_store = MemoryStore()
