"""
Form Submission Service

Handles form submission operations including creation, approval workflow,
sample management, and audit trail.
"""

import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.models import (
    FormSubmission,
    FormTemplate,
    Sample,
    SampleMeasurement,
    FormSubmissionHistory,
    SubmissionStatus,
    ApprovalStatus,
    MeasurementType,
)


class FormSubmissionService:
    """Service for managing form submissions."""

    def __init__(self, db: AsyncSession):
        """
        Initialize FormSubmissionService.

        Args:
            db: Async database session
        """
        self.db = db

    async def create_submission(
        self,
        template_id: str,
        header_data: dict,
        samples_data: Optional[list[dict]] = None,
        session_id: Optional[str] = None,
        created_by: Optional[str] = None
    ) -> FormSubmission:
        """
        Create a new form submission with samples and measurements.

        Args:
            template_id: Form template UUID
            header_data: Form header fields (supplier, date, lot_no, etc.)
            samples_data: List of sample dictionaries (optional)
            session_id: Agent session ID (optional)
            created_by: Creator user ID (optional)

        Returns:
            Created FormSubmission with samples and measurements

        Example:
            >>> submission = await service.create_submission(
            ...     template_id="template-uuid",
            ...     header_data={"supplier": "ABC Co.", "date": "2024-12-20"},
            ...     samples_data=[
            ...         {
            ...             "sample_number": 1,
            ...             "temperature": -18.5,
            ...             "measurements": {
            ...                 "frozen": {
            ...                     "appearance": 9,
            ...                     "dehydration": 7
            ...                 }
            ...             }
            ...         }
            ...     ]
            ... )
        """
        # Retrieve template
        stmt = select(FormTemplate).where(FormTemplate.id == template_id)
        result = await self.db.execute(stmt)
        template = result.scalar_one_or_none()

        if not template:
            raise ValueError(f"Template {template_id} not found")

        # Create submission
        submission_id = str(uuid.uuid4())
        submission = FormSubmission(
            id=submission_id,
            template_id=template_id,
            form_code=template.form_code,
            form_version=template.version,
            session_id=session_id,
            header_data=header_data,
            status=SubmissionStatus.DRAFT.value,
            created_by=created_by
        )

        self.db.add(submission)
        await self.db.flush()  # Flush to get submission.id for samples

        # Add samples if provided
        if samples_data:
            await self._add_samples_internal(submission, samples_data)

        await self.db.commit()
        await self.db.refresh(submission)

        return submission

    async def _add_samples_internal(
        self,
        submission: FormSubmission,
        samples_data: list[dict]
    ) -> list[Sample]:
        """
        Internal method to add samples and measurements to a submission.

        Args:
            submission: FormSubmission object
            samples_data: List of sample dictionaries

        Returns:
            List of created Sample objects

        Sample data structure:
            {
                "sample_number": 1,
                "temperature": -18.5,
                "weight": 25.5,
                "measurements": {
                    "frozen": {
                        "appearance": 9,
                        "dehydration": 7,
                        "discoloration": 9
                    },
                    "thawing": {
                        "appearance": 9,
                        "odor": 7,
                        "meat": 7,
                        "texture": 9
                    }
                }
            }
        """
        created_samples = []

        for sample_data in samples_data:
            # Create sample
            sample_id = str(uuid.uuid4())
            sample = Sample(
                id=sample_id,
                submission_id=submission.id,
                sample_number=sample_data["sample_number"],
                sample_label=sample_data.get("sample_label"),
                temperature=sample_data.get("temperature"),
                weight=sample_data.get("weight"),
                sample_data=sample_data.get("sample_data")
            )

            self.db.add(sample)
            await self.db.flush()  # Flush to get sample.id for measurements

            # Add measurements if provided
            measurements_by_section = sample_data.get("measurements", {})
            measurement_objects = []

            for section, criteria in measurements_by_section.items():
                for criterion_id, grade_value in criteria.items():
                    measurement = SampleMeasurement(
                        id=str(uuid.uuid4()),
                        sample_id=sample.id,
                        section=section,
                        criterion_id=criterion_id,
                        grade_value=float(grade_value) if grade_value is not None else None,
                        measurement_type=MeasurementType.NUMERIC_GRADE.value
                    )
                    measurement_objects.append(measurement)

            if measurement_objects:
                self.db.add_all(measurement_objects)

            # Calculate sample grade as average of all measurements
            if measurement_objects:
                grades = [m.grade_value for m in measurement_objects if m.grade_value is not None]
                if grades:
                    sample.grade = sum(grades) / len(grades)

            created_samples.append(sample)

        return created_samples

    async def add_samples(
        self,
        submission_id: str,
        samples_data: list[dict]
    ) -> list[Sample]:
        """
        Add samples to an existing submission.

        Args:
            submission_id: Submission UUID
            samples_data: List of sample dictionaries

        Returns:
            List of created Sample objects

        Example:
            >>> samples = await service.add_samples(
            ...     submission_id="submission-uuid",
            ...     samples_data=[...]
            ... )
        """
        # Retrieve submission
        stmt = select(FormSubmission).where(FormSubmission.id == submission_id)
        result = await self.db.execute(stmt)
        submission = result.scalar_one_or_none()

        if not submission:
            raise ValueError(f"Submission {submission_id} not found")

        # Add samples
        created_samples = await self._add_samples_internal(submission, samples_data)

        await self.db.commit()

        return created_samples

    async def calculate_summary(self, submission_id: str) -> dict:
        """
        Calculate summary statistics for a submission.

        Aggregates data from samples: AVG(grade), SUM(weight), MIN/MAX temperatures.

        Args:
            submission_id: Submission UUID

        Returns:
            Dictionary of summary statistics

        Example:
            >>> summary = await service.calculate_summary("submission-uuid")
            >>> print(summary)
            {
                "sample_count": 10,
                "average_grade": 7.8,
                "total_weight": 150.5,
                "min_temperature": -19.2,
                "max_temperature": -17.8,
                "failed_samples_count": 2
            }
        """
        # Retrieve submission with samples
        stmt = (
            select(FormSubmission)
            .options(selectinload(FormSubmission.samples))
            .where(FormSubmission.id == submission_id)
        )
        result = await self.db.execute(stmt)
        submission = result.scalar_one_or_none()

        if not submission:
            raise ValueError(f"Submission {submission_id} not found")

        samples = submission.samples

        if not samples:
            return {
                "sample_count": 0,
                "average_grade": None,
                "total_weight": None,
                "min_temperature": None,
                "max_temperature": None,
                "failed_samples_count": 0
            }

        # Calculate statistics
        grades = [s.grade for s in samples if s.grade is not None]
        weights = [s.weight for s in samples if s.weight is not None]
        temperatures = [s.temperature for s in samples if s.temperature is not None]

        summary = {
            "sample_count": len(samples),
            "average_grade": sum(grades) / len(grades) if grades else None,
            "total_weight": sum(weights) if weights else None,
            "min_temperature": min(temperatures) if temperatures else None,
            "max_temperature": max(temperatures) if temperatures else None,
            "failed_samples_count": sum(1 for g in grades if g < 7.0)  # Grade < 7 is failed
        }

        # Update submission summary_data
        submission.summary_data = summary
        await self.db.commit()

        return summary

    async def submit_for_approval(
        self,
        submission_id: str,
        user_id: Optional[str] = None
    ) -> FormSubmission:
        """
        Submit a form for approval.

        Transitions status from draft to pending_approval.

        Args:
            submission_id: Submission UUID
            user_id: Submitter user ID (optional)

        Returns:
            Updated FormSubmission

        Example:
            >>> submission = await service.submit_for_approval(
            ...     submission_id="uuid",
            ...     user_id="user-uuid"
            ... )
        """
        submission = await self.get_submission_by_id(submission_id)
        if not submission:
            raise ValueError(f"Submission {submission_id} not found")

        # Update status
        submission.status = SubmissionStatus.PENDING_APPROVAL.value
        submission.submitted_at = datetime.utcnow()
        submission.submitted_by = user_id
        submission.approval_status = ApprovalStatus.PENDING_REVIEW.value

        await self.db.commit()
        await self.db.refresh(submission)

        return submission

    async def approve_submission(
        self,
        submission_id: str,
        approver_id: str,
        comments: Optional[str] = None
    ) -> FormSubmission:
        """
        Approve a form submission.

        Args:
            submission_id: Submission UUID
            approver_id: Approver user ID
            comments: Optional approval comments

        Returns:
            Updated FormSubmission

        Example:
            >>> submission = await service.approve_submission(
            ...     submission_id="uuid",
            ...     approver_id="supervisor-uuid",
            ...     comments="All samples meet standards"
            ... )
        """
        submission = await self.get_submission_by_id(submission_id)
        if not submission:
            raise ValueError(f"Submission {submission_id} not found")

        # Update approval status
        submission.status = SubmissionStatus.APPROVED.value
        submission.approval_status = ApprovalStatus.APPROVED.value
        submission.reviewed_at = datetime.utcnow()
        submission.reviewed_by = approver_id
        submission.approval_comments = comments

        await self.db.commit()
        await self.db.refresh(submission)

        return submission

    async def reject_submission(
        self,
        submission_id: str,
        approver_id: str,
        comments: str,
        corrective_action: Optional[str] = None
    ) -> FormSubmission:
        """
        Reject a form submission.

        Args:
            submission_id: Submission UUID
            approver_id: Approver user ID
            comments: Rejection reason (required)
            corrective_action: Required corrective actions (optional)

        Returns:
            Updated FormSubmission

        Example:
            >>> submission = await service.reject_submission(
            ...     submission_id="uuid",
            ...     approver_id="supervisor-uuid",
            ...     comments="Temperature readings out of range",
            ...     corrective_action="Reinspect batch and adjust storage temperature"
            ... )
        """
        submission = await self.get_submission_by_id(submission_id)
        if not submission:
            raise ValueError(f"Submission {submission_id} not found")

        # Update rejection status
        submission.status = SubmissionStatus.REJECTED.value
        submission.approval_status = ApprovalStatus.REJECTED.value
        submission.reviewed_at = datetime.utcnow()
        submission.reviewed_by = approver_id
        submission.approval_comments = comments
        submission.corrective_action = corrective_action

        await self.db.commit()
        await self.db.refresh(submission)

        return submission

    async def get_submission_by_id(
        self,
        submission_id: str,
        include_samples: bool = False,
        include_measurements: bool = False
    ) -> Optional[FormSubmission]:
        """
        Retrieve a submission by ID.

        Args:
            submission_id: Submission UUID
            include_samples: Whether to eagerly load samples (default: False)
            include_measurements: Whether to eagerly load measurements (default: False)

        Returns:
            FormSubmission if found, None otherwise

        Example:
            >>> submission = await service.get_submission_by_id(
            ...     submission_id="uuid",
            ...     include_samples=True,
            ...     include_measurements=True
            ... )
        """
        stmt = select(FormSubmission).where(FormSubmission.id == submission_id)

        if include_samples:
            stmt = stmt.options(selectinload(FormSubmission.samples))
            if include_measurements:
                stmt = stmt.options(
                    selectinload(FormSubmission.samples).selectinload(Sample.measurements)
                )

        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_submission_history(
        self,
        submission_id: str
    ) -> list[FormSubmissionHistory]:
        """
        Get audit trail for a submission.

        Args:
            submission_id: Submission UUID

        Returns:
            List of FormSubmissionHistory ordered by timestamp (ascending)

        Example:
            >>> history = await service.get_submission_history("uuid")
            >>> for event in history:
            ...     print(f"{event.event_type} at {event.event_timestamp}")
        """
        stmt = (
            select(FormSubmissionHistory)
            .where(FormSubmissionHistory.submission_id == submission_id)
            .order_by(FormSubmissionHistory.event_timestamp.asc())
        )

        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def list_submissions(
        self,
        status: Optional[str] = None,
        form_code: Optional[str] = None,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None,
        limit: int = 100,
        offset: int = 0
    ) -> list[FormSubmission]:
        """
        List form submissions with optional filters.

        Args:
            status: Filter by status (optional)
            form_code: Filter by form code (optional)
            date_from: Filter by created_at >= date_from (optional)
            date_to: Filter by created_at <= date_to (optional)
            limit: Maximum number of results (default: 100)
            offset: Number of results to skip (default: 0)

        Returns:
            List of FormSubmission objects

        Example:
            >>> submissions = await service.list_submissions(
            ...     status="pending_approval",
            ...     limit=50
            ... )
        """
        stmt = select(FormSubmission)

        # Apply filters
        if status:
            stmt = stmt.where(FormSubmission.status == status)
        if form_code:
            stmt = stmt.where(FormSubmission.form_code == form_code)
        if date_from:
            stmt = stmt.where(FormSubmission.created_at >= date_from)
        if date_to:
            stmt = stmt.where(FormSubmission.created_at <= date_to)

        # Apply pagination and ordering
        stmt = stmt.order_by(FormSubmission.created_at.desc()).offset(offset).limit(limit)

        result = await self.db.execute(stmt)
        return list(result.scalars().all())
