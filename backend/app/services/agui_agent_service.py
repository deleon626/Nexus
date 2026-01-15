"""
QC Agent Service with AG-UI integration.

This service creates and configures the Agno Agent with OpenRouter,
and provides the interface for AgentOS with AG-UI protocol.

Replaces the manual REST API + polling approach with SSE streaming.
"""

import logging
from typing import Optional

from agno.agent.agent import Agent
from agno.models.openrouter import OpenRouter
from agno.os import AgentOS
from agno.os.interfaces.agui import AGUI

from app.config import settings
from app.tools.agui_commit import commit_qc_data


logger = logging.getLogger(__name__)


# System prompt for QC data extraction
QC_SYSTEM_PROMPT = """You are a Quality Control (QC) assistant for manufacturing operations.

Your role is to help field operators capture and validate QC data through voice and image inputs.

Key responsibilities:
1. Extract data from scale images (weight readings, units)
2. Process voice commands to fill QC forms
3. Validate extracted data against schema requirements
4. Present extracted data clearly for user confirmation
5. Call commit_qc_data ONLY after user confirms the data

When you extract data from images or voice:
- Be precise with numerical values
- Identify units of measurement
- Note any quality issues or anomalies
- Ask clarifying questions if data is unclear

IMPORTANT Human-in-the-Loop Protocol:
- After extracting data, present it clearly to the user
- Wait for explicit user confirmation before committing
- If user rejects, ask for corrections
- NEVER commit data without user saying "confirm", "yes", "approve", or similar

The frontend will provide:
- Schema context via the conversation (field definitions, validation rules)
- Session context automatically managed by AG-UI

When the user confirms the extracted data:
- Call commit_qc_data with the session_id, schema_id, and extracted_data
- Include any user modifications
"""


class QCAgentService:
    """
    QC Agent Service with AG-UI integration.

    This replaces the old AgentService which used manual Redis management
    and REST API endpoints. AgentOS handles session state and AG-UI handles
    real-time communication via SSE.
    """

    def __init__(self):
        """Initialize the QC Agent with AG-UI interface."""

        # Validate model ID format
        self._validate_model_id(settings.openrouter_model_id)

        # Create the QC Agent
        self.agent = Agent(
            name="QC Assistant",
            model=OpenRouter(
                id=settings.openrouter_model_id,
                api_key=settings.openrouter_api_key,
            ),
            instructions=QC_SYSTEM_PROMPT,
            tools=[commit_qc_data],
            markdown=True,
            add_datetime_to_context=True,
            add_history_to_context=True,
        )

        # Setup AgentOS with AG-UI interface
        self.agent_os = AgentOS(
            agents=[self.agent],
            interfaces=[AGUI(agent=self.agent)],
        )

        logger.info(f"QC Agent initialized with model: {settings.openrouter_model_id}")
        logger.info("AG-UI interface enabled at /agui endpoint")

    @staticmethod
    def _validate_model_id(model_id: str) -> None:
        """
        Validate model ID format.

        Model ID must follow the pattern: provider/model-name
        Examples: anthropic/claude-3.5-sonnet, openai/gpt-4o

        Args:
            model_id: Model identifier to validate

        Raises:
            ValueError: If model ID format is invalid
        """
        if not model_id or not isinstance(model_id, str):
            raise ValueError(
                "Invalid model ID format: model ID must be a non-empty string"
            )

        if model_id.count("/") != 1:
            raise ValueError(
                f"Invalid model ID format: '{model_id}'. "
                "Expected format: provider/model-name (e.g., 'anthropic/claude-3.5-sonnet')"
            )

        provider, model_name = model_id.split("/")

        if not provider or not model_name:
            raise ValueError(
                f"Invalid model ID format: '{model_id}'. "
                "Both provider and model name must be non-empty"
            )

    def get_app(self):
        """
        Get the FastAPI app from AgentOS.

        This app includes:
        - /agui endpoint for AG-UI protocol (SSE streaming)
        - /config endpoint for configuration viewing
        - Session management built-in

        Returns:
            FastAPI application instance
        """
        return self.agent_os.get_app()


# Global instance - lazy initialization
_qc_agent_service: Optional[QCAgentService] = None


def get_qc_agent_service() -> QCAgentService:
    """
    Get the global QC agent service instance.

    Uses lazy initialization to avoid creating the agent
    until it's actually needed.

    Returns:
        QCAgentService instance
    """
    global _qc_agent_service
    if _qc_agent_service is None:
        _qc_agent_service = QCAgentService()
    return _qc_agent_service
