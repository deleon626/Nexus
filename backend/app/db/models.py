"""SQLAlchemy ORM models for Nexus."""

from datetime import datetime
from enum import Enum
from typing import Optional

from sqlalchemy import (
    JSON,
    DateTime,
    ForeignKey,
    String,
    Text,
    Integer,
    Numeric,
    CheckConstraint,
    UniqueConstraint,
    Index,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


# ============================================================================
# ENUMS
# ============================================================================

class FormStatus(str, Enum):
    """Form template status."""
    DRAFT = "draft"
    ACTIVE = "active"
    DEPRECATED = "deprecated"
    ARCHIVED = "archived"


class SubmissionStatus(str, Enum):
    """Form submission status."""
    DRAFT = "draft"
    PENDING_APPROVAL = "pending_approval"
    APPROVED = "approved"
    REJECTED = "rejected"
    ARCHIVED = "archived"


class ApprovalStatus(str, Enum):
    """Approval decision status."""
    APPROVED = "approved"
    REJECTED = "rejected"
    PENDING_REVIEW = "pending_review"
    CONDITIONAL = "conditional"


class MeasurementType(str, Enum):
    """Sample measurement type."""
    NUMERIC_GRADE = "numeric_grade"
    BOOLEAN = "boolean"
    TEXT = "text"
    CALCULATED = "calculated"
    OTHER = "other"


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


# ============================================================================
# FORM SYSTEM MODELS
# ============================================================================

class FormTemplate(Base):
    """
    Form template definition with versioning.

    Stores reusable form structures for different QC processes.
    Supports schema evolution through version tracking.

    Attributes:
        id: Unique template identifier (UUID)
        form_code: Form identifier code (e.g., "FR/QC/II.03.01")
        form_name: Human-readable form name
        category: Form category (e.g., "Receiving", "Processing")
        version: Version string (e.g., "Revisi 02")
        version_number: Numeric version for sorting
        schema_definition: JSONB containing complete form structure
        status: Template status (draft, active, deprecated, archived)
        effective_from: When this version becomes active
        effective_until: When this version expires
        created_at: Creation timestamp
        created_by: Creator user ID
        updated_at: Last update timestamp
        updated_by: Last updater user ID
        submissions: Related form submissions
    """
    __tablename__ = "form_templates"

    # Primary Key
    id: Mapped[str] = mapped_column(String(36), primary_key=True)

    # Form Identification
    form_code: Mapped[str] = mapped_column(String(50), nullable=False)
    form_name: Mapped[str] = mapped_column(String(255), nullable=False)
    category: Mapped[Optional[str]] = mapped_column(String(100))

    # Versioning
    version: Mapped[str] = mapped_column(String(50), nullable=False)
    version_number: Mapped[int] = mapped_column(Integer, nullable=False, default=1)

    # Schema Definition
    schema_definition: Mapped[dict] = mapped_column(JSON, nullable=False)

    # Metadata
    status: Mapped[str] = mapped_column(String(20), default=FormStatus.DRAFT.value)
    effective_from: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    effective_until: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    # Audit
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    created_by: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    updated_by: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)

    # Relationships
    submissions: Mapped[list["FormSubmission"]] = relationship(
        "FormSubmission",
        back_populates="template",
        cascade="all, delete-orphan"
    )

    # Constraints
    __table_args__ = (
        UniqueConstraint("form_code", "version", name="uq_form_template_code_version"),
        CheckConstraint(
            "status IN ('draft', 'active', 'deprecated', 'archived')",
            name="ck_form_template_status"
        ),
        Index("idx_form_templates_code", "form_code"),
        Index("idx_form_templates_status", "status"),
    )


class FormSubmission(Base):
    """
    Submitted form with header data and workflow status.

    Represents a completed QC report pending or approved.

    Attributes:
        id: Unique submission identifier (UUID)
        template_id: Foreign key to form template
        form_code: Denormalized form code for querying
        form_version: Snapshot of version for audit trail
        session_id: Optional reference to agent session
        header_data: Form-specific header fields (JSONB)
        summary_data: Calculated aggregates (JSONB)
        status: Workflow status
        submitted_at: Submission timestamp
        submitted_by: Submitter user ID
        reviewed_at: Review timestamp
        reviewed_by: Reviewer user ID
        approval_status: Approval decision
        approval_comments: Reviewer comments
        decision: Release/Reject/Hold decision
        corrective_action: Required corrective actions
        attachment_urls: Array of storage URLs
        created_at: Creation timestamp
        created_by: Creator user ID
        updated_at: Last update timestamp
        template: Related form template
        samples: Related samples
        history: Related audit history entries
    """
    __tablename__ = "form_submissions"

    # Primary Key
    id: Mapped[str] = mapped_column(String(36), primary_key=True)

    # Form Template Reference
    template_id: Mapped[str] = mapped_column(String(36), ForeignKey("form_templates.id"), nullable=False)
    form_code: Mapped[str] = mapped_column(String(50), nullable=False)
    form_version: Mapped[str] = mapped_column(String(50), nullable=False)

    # Session Context
    session_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("sessions.id"), nullable=True)

    # Data
    header_data: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    summary_data: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    # Status & Workflow
    status: Mapped[str] = mapped_column(String(50), default=SubmissionStatus.DRAFT.value)

    # Approval
    submitted_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    submitted_by: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    reviewed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    reviewed_by: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    approval_status: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    approval_comments: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Compliance
    decision: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    corrective_action: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Attachments
    attachment_urls: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)

    # Audit
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    created_by: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    template: Mapped["FormTemplate"] = relationship("FormTemplate", back_populates="submissions")
    samples: Mapped[list["Sample"]] = relationship(
        "Sample",
        back_populates="submission",
        cascade="all, delete-orphan"
    )
    history: Mapped[list["FormSubmissionHistory"]] = relationship(
        "FormSubmissionHistory",
        back_populates="submission",
        cascade="all, delete-orphan"
    )

    # Constraints
    __table_args__ = (
        CheckConstraint(
            "status IN ('draft', 'pending_approval', 'approved', 'rejected', 'archived')",
            name="ck_submission_status"
        ),
        Index("idx_form_submissions_template", "template_id"),
        Index("idx_form_submissions_status", "status"),
    )


class Sample(Base):
    """
    Individual sample within a form submission.

    Stores sample-level data (temperature, weight, grade).

    Attributes:
        id: Unique sample identifier (UUID)
        submission_id: Foreign key to form submission
        sample_number: Sample sequence number (1-18)
        sample_label: Optional custom label
        temperature: Temperature reading (Celsius)
        weight: Weight in kg
        grade: Calculated average grade (5-9)
        sample_data: Additional sample fields (JSONB)
        created_at: Creation timestamp
        submission: Related form submission
        measurements: Related criterion measurements
    """
    __tablename__ = "samples"

    # Primary Key
    id: Mapped[str] = mapped_column(String(36), primary_key=True)

    # Parent Reference
    submission_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("form_submissions.id", ondelete="CASCADE"),
        nullable=False
    )

    # Sample Identification
    sample_number: Mapped[int] = mapped_column(Integer, nullable=False)
    sample_label: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    # Common Fields
    temperature: Mapped[Optional[float]] = mapped_column(Numeric(6, 2), nullable=True)
    weight: Mapped[Optional[float]] = mapped_column(Numeric(10, 3), nullable=True)
    grade: Mapped[Optional[float]] = mapped_column(Numeric(5, 2), nullable=True)

    # Flexible Data
    sample_data: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    # Audit
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    submission: Mapped["FormSubmission"] = relationship("FormSubmission", back_populates="samples")
    measurements: Mapped[list["SampleMeasurement"]] = relationship(
        "SampleMeasurement",
        back_populates="sample",
        cascade="all, delete-orphan"
    )

    # Constraints
    __table_args__ = (
        UniqueConstraint("submission_id", "sample_number", name="uq_sample_submission_number"),
        CheckConstraint("sample_number > 0", name="ck_sample_number_positive"),
        Index("idx_samples_submission", "submission_id"),
    )


class SampleMeasurement(Base):
    """
    Individual criterion measurement for a sample.

    Stores granular evaluation data (e.g., frozen appearance grade = 7).

    Attributes:
        id: Unique measurement identifier (UUID)
        sample_id: Foreign key to sample
        section: Section identifier (e.g., "frozen", "thawing")
        criterion_id: Criterion identifier (e.g., "appearance", "odor")
        criterion_label: Human-readable criterion label
        grade_value: Numeric grade value (5, 7, 9)
        text_value: Text value for non-numeric criteria
        measurement_type: Type of measurement
        created_at: Creation timestamp
        sample: Related sample
    """
    __tablename__ = "sample_measurements"

    # Primary Key
    id: Mapped[str] = mapped_column(String(36), primary_key=True)

    # Parent Reference
    sample_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("samples.id", ondelete="CASCADE"),
        nullable=False
    )

    # Measurement Context
    section: Mapped[str] = mapped_column(String(50), nullable=False)
    criterion_id: Mapped[str] = mapped_column(String(50), nullable=False)
    criterion_label: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    # Value
    grade_value: Mapped[Optional[float]] = mapped_column(Numeric(5, 2), nullable=True)
    text_value: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Metadata
    measurement_type: Mapped[str] = mapped_column(String(50), default=MeasurementType.NUMERIC_GRADE.value)

    # Audit
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    sample: Mapped["Sample"] = relationship("Sample", back_populates="measurements")

    # Constraints
    __table_args__ = (
        UniqueConstraint("sample_id", "section", "criterion_id", name="uq_measurement_sample_section_criterion"),
        CheckConstraint(
            "measurement_type IN ('numeric_grade', 'boolean', 'text', 'calculated', 'other')",
            name="ck_measurement_type"
        ),
        Index("idx_sample_measurements_sample", "sample_id"),
    )


class FormSubmissionHistory(Base):
    """
    Temporal audit trail for form submissions.

    Immutable event log for FDA 21 CFR Part 11 compliance.

    Attributes:
        id: Unique history entry identifier (UUID)
        submission_id: Foreign key to form submission
        event_type: Type of event (created, updated, submitted, etc.)
        event_timestamp: When the event occurred
        event_by: User who triggered the event
        snapshot_data: Complete state snapshot (JSONB)
        changes: Delta of changes (JSONB)
        reason: Reason for change
        metadata: Additional context (IP, user agent, etc.)
        submission: Related form submission
    """
    __tablename__ = "form_submission_history"

    # Primary Key
    id: Mapped[str] = mapped_column(String(36), primary_key=True)

    # Reference
    submission_id: Mapped[str] = mapped_column(String(36), ForeignKey("form_submissions.id"), nullable=False)

    # Event Metadata
    event_type: Mapped[str] = mapped_column(String(100), nullable=False)
    event_timestamp: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    event_by: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)

    # State Snapshot
    snapshot_data: Mapped[dict] = mapped_column(JSON, nullable=False)
    changes: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    # Context
    reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    event_metadata: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    # Relationships
    submission: Mapped["FormSubmission"] = relationship("FormSubmission", back_populates="history")

    # Constraints
    __table_args__ = (
        CheckConstraint(
            "event_type IN ('created', 'updated', 'submitted', 'approved', 'rejected', 'modified', 'archived')",
            name="ck_history_event_type"
        ),
        Index("idx_form_submission_history_submission", "submission_id", "event_timestamp"),
    )


# ============================================================================
# ID GENERATION MODELS
# ============================================================================

class IDGenerationRule(Base):
    """
    ID generation rule for automatic ID creation.

    Stores parsed ID patterns for batches, samples, reports, and schemas.

    Attributes:
        id: Unique rule identifier (UUID)
        entity_type: Type of entity ('batch', 'sample', 'report', 'schema')
        facility_id: Optional facility scope (NULL for global rules)
        rule_name: Human-readable rule name
        pattern: ID pattern template (e.g., "NAB-{YYYY}-{MM}-{SEQ:4}")
        components: JSON structured rule components
        natural_language_source: Original natural language description
        last_sequence: Last used sequence number for this rule
        sequence_reset_period: When to reset sequence ('never', 'monthly', 'yearly')
        active: Whether rule is active
        created_at: Creation timestamp
        updated_at: Last update timestamp
    """
    __tablename__ = "id_generation_rules"

    # Primary Key
    id: Mapped[str] = mapped_column(String(36), primary_key=True)

    # Rule Scope
    entity_type: Mapped[str] = mapped_column(String(20), nullable=False)
    facility_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)

    # Rule Definition
    rule_name: Mapped[str] = mapped_column(String(100), nullable=False)
    pattern: Mapped[str] = mapped_column(String(255), nullable=False)
    components: Mapped[dict] = mapped_column(JSON, nullable=False)
    natural_language_source: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Sequence Tracking
    last_sequence: Mapped[int] = mapped_column(Integer, default=0)
    sequence_reset_period: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)

    # Status
    active: Mapped[bool] = mapped_column(default=True)

    # Audit
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Constraints
    __table_args__ = (
        UniqueConstraint("entity_type", "facility_id", name="uq_id_rule_entity_facility"),
        CheckConstraint(
            "entity_type IN ('batch', 'sample', 'report', 'schema')",
            name="ck_id_rule_entity_type"
        ),
        Index("idx_id_rules_entity_facility", "entity_type", "facility_id"),
        Index("idx_id_rules_active", "active"),
    )
