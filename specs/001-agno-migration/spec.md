# Feature Specification: Agno Framework Migration

**Feature Branch**: `001-agno-migration`
**Created**: 2025-12-13
**Status**: Draft
**Input**: User description: "I want to add a dependency. I want to use Agno framework for my Agentic architecture instead of Anthropic."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - AI Agent Processes QC Data (Priority: P1)

A field operator uploads a scale image and sends a voice message. The AI agent (now powered by Agno framework) extracts the weight value from the image, validates it against the schema, and presents a confirmation modal to the user.

**Why this priority**: This is the core functionality of Nexus. Without the AI agent processing images and voice, the system cannot function. Migrating the agent framework is foundational to all other features.

**Independent Test**: Can be tested by uploading a scale image via the API and verifying the agent extracts the correct numeric value and triggers the confirmation modal.

**Acceptance Scenarios**:

1. **Given** a session with an active QC schema, **When** the operator uploads a scale image with "1250 kg" displayed, **Then** the agent extracts "1250" as the weight value
2. **Given** extracted data ready for confirmation, **When** the agent prepares the response, **Then** the confirmation modal tool is called before any data commit
3. **Given** the Agno framework is configured with OpenRouter, **When** the agent processes a request, **Then** it routes to the configured model via OpenRouter's unified API

---

### User Story 2 - Agent Tools Execute Correctly (Priority: P2)

The AI agent calls custom tools (show_confirmation_modal, commit_qc_data) that are defined using Agno's tool system. The tools execute correctly and return results to the agent for further processing.

**Why this priority**: Tools are essential for the human-in-the-loop workflow. Without working tools, the agent cannot show confirmations or commit data.

**Independent Test**: Can be tested by sending a message that triggers tool execution and verifying the tool receives correct parameters and returns expected results.

**Acceptance Scenarios**:

1. **Given** a custom tool defined using Agno's tool decorator, **When** the agent determines the tool should be called, **Then** the tool function executes with the correct arguments
2. **Given** the show_confirmation_modal tool is called, **When** execution completes, **Then** the confirmation data is stored for client retrieval
3. **Given** the commit_qc_data tool is called after user confirmation, **When** execution completes, **Then** the data is persisted with an audit event

---

### User Story 3 - Multi-Model Support (Priority: P3)

The system administrator can configure different AI models (Claude, GPT, Llama) through Agno's unified interface without changing application code. This provides flexibility for cost optimization or capability requirements.

**Why this priority**: OpenRouter provides access to 400+ models. Agno's OpenRouter integration enables switching models via configuration without code changes. This is a bonus capability, not essential for MVP.

**Independent Test**: Can be tested by changing the model ID in environment configuration and verifying the agent still processes requests correctly with a different model.

**Acceptance Scenarios**:

1. **Given** Agno is configured with OpenRouter and a specific model ID, **When** processing requests, **Then** requests are routed through OpenRouter to the specified model
2. **Given** a configuration change to use a different model ID (e.g., from `anthropic/claude-3.5-sonnet` to `openai/gpt-4o`), **When** the agent is initialized, **Then** it uses the newly configured model without code changes

---

### Edge Cases

- What happens when Agno framework fails to initialize (missing API key, network error)?
- How does the system handle tool execution timeouts?
- What happens when the model returns an unexpected response format?
- How does the system handle streaming responses vs. non-streaming?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST replace the current SDK with Agno framework for all AI agent operations
- **FR-002**: System MUST use Agno's `OpenRouter` model class (`agno.models.openrouter.OpenRouter`) as the primary model gateway, enabling access to multiple LLM providers (Claude, GPT, Llama, etc.) through a single interface
- **FR-003**: System MUST define agent tools using Agno's tool decorator or Toolkit class
- **FR-004**: System MUST maintain existing tool functionality (show_confirmation_modal, commit_qc_data)
- **FR-005**: System MUST support vision capabilities for image processing via Agno's media handling
- **FR-006**: System MUST preserve the human-in-the-loop workflow (confirmation before commit)
- **FR-007**: System MUST handle streaming responses from the agent
- **FR-008**: System MUST use `OPENROUTER_API_KEY` environment variable for authentication

### Key Entities

- **Agent**: The AI assistant that processes QC data; configured with model, tools, and system prompt
- **Tool**: A function the agent can call; defined with Agno's decorator pattern
- **Model**: The underlying LLM provider accessed via OpenRouter gateway; model ID configurable (e.g., `anthropic/claude-3.5-sonnet`, `openai/gpt-4o`, `meta-llama/llama-3.1-70b-instruct`)
- **Session**: Conversation context maintained across multiple agent interactions

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All existing agent functionality works identically after migration (image extraction, tool calling, confirmation modal)
- **SC-002**: Agent response time remains within acceptable bounds (under 5 seconds for non-image requests)
- **SC-003**: All existing tests pass after migration
- **SC-004**: Tool execution maintains the same input/output contracts
- **SC-005**: System can be configured to use different models without code changes (configuration only)

## Assumptions

- The Agno framework is stable and production-ready
- OpenRouter supports vision and tool use for the selected model (e.g., Claude, GPT-4o)
- The existing confirmation modal workflow can be implemented using Agno's tool system
- Session state management will continue to use Redis (Agno does not replace this)
- Environment variables: `OPENROUTER_API_KEY` for OpenRouter authentication

## Out of Scope

- Mobile app changes (Flutter)
- Web dashboard changes (React)
- Database schema changes
- Authentication/authorization changes
- Changes to non-agent services (STT via Whisper remains unchanged)
