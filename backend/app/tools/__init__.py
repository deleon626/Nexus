"""
Nexus Agent Tools Module

This module provides tool implementations for the Agno-powered QC agent.
Tools enable the agent to interact with the system for data validation,
confirmation, and persistence.

Key tools:
- show_confirmation_modal: Present extracted QC data for user approval
- commit_qc_data: Persist approved data to database with audit trail

All tools use the @tool decorator from agno.tools for proper integration
with the Agno agent framework.
"""

from agno.tools import tool

__all__ = ["tool"]
