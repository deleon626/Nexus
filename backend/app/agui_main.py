"""
Nexus AG-UI - Main Entry Point

QC Data Entry System with AG-UI Protocol.

This entry point uses AgentOS with AGUI interface for the chat/agent
functionality, while preserving the existing STT, schemas, and ID
generation endpoints.

Run with: uvicorn app.agui_main:app --reload --port 8000
"""

import logging
from pathlib import Path
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.db.supabase_client import init_supabase
from app.db.sqlite import init_db, close_db, async_session_maker
from app.db.seed_default_schema import seed_default_schema
from app.services.agui_agent_service import get_qc_agent_service

# Import routers to preserve (sessions is replaced by AG-UI)
from app.api.stt import router as stt_router
from app.api.schemas import router as schemas_router
from app.api.id_generation import router as id_generation_router, ids_router


# Configure logging
logging.basicConfig(
    level=logging.INFO if settings.debug else logging.WARNING,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan context manager for the FastAPI app.

    Initializes database connections on startup and cleans up on shutdown.
    """
    # Startup
    logger.info("Starting Nexus AG-UI...")
    logger.info(f"OpenRouter Model: {settings.openrouter_model_id}")
    logger.info(f"Debug Mode: {settings.debug}")

    # Initialize Supabase
    init_supabase()
    logger.info("✓ Supabase initialized")

    # Initialize SQLite database
    await init_db()
    logger.info("✓ SQLite initialized")

    # Seed default schema
    async with async_session_maker() as session:
        await seed_default_schema(session)
    logger.info("✓ Default schema seeded")

    # Initialize QC agent service (creates AgentOS)
    # Note: Called for side effect of initializing the singleton
    _ = get_qc_agent_service()
    logger.info("✓ QC Agent service initialized")

    yield

    # Shutdown
    logger.info("Shutting down Nexus AG-UI...")
    await close_db()
    logger.info("✓ Database connections closed")


def create_app() -> FastAPI:
    """
    Create and configure the FastAPI application.

    Uses AgentOS.get_app() as base and adds additional routers
    for STT, schemas, and ID generation.

    Returns:
        FastAPI app instance ready for uvicorn
    """
    # Get the QC agent service which creates AgentOS with AG-UI
    qc_service = get_qc_agent_service()

    # Get the FastAPI app from AgentOS
    # This provides: /agui endpoint (SSE), /config endpoint
    app = qc_service.get_app()

    # Override title and description
    app.title = "Nexus QC API (AG-UI)"
    app.description = "AI-Powered Quality Control with AG-UI Protocol"
    app.version = "0.2.0"

    # Add lifespan if not already set by AgentOS
    if not app.router.lifespan_context:
        app.router.lifespan_context = lifespan

    # Add CORS middleware for frontend access
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "http://localhost:5173",  # Vite dev server (current frontend)
            "http://localhost:5174",  # Vite fallback
            "http://localhost:3000",  # Dojo frontend
            "http://localhost:3001",  # Dojo fallback
            "http://127.0.0.1:5173",
            "http://127.0.0.1:3000",
        ],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Include preserved routers (sessions router is replaced by /agui)
    app.include_router(stt_router)  # POST /api/stt/transcribe
    app.include_router(schemas_router)  # GET/POST /api/schemas/*
    app.include_router(id_generation_router, prefix="/api/id-rules")
    app.include_router(ids_router, prefix="/api/ids")

    # Mount static files for temp uploads
    temp_upload_dir = Path(settings.upload_dir)
    if not temp_upload_dir.is_absolute():
        temp_upload_dir = Path(__file__).parent.parent / temp_upload_dir
    temp_upload_dir = temp_upload_dir / "temp"
    temp_upload_dir.mkdir(parents=True, exist_ok=True)

    app.mount(
        "/uploads/temp",
        StaticFiles(directory=str(temp_upload_dir)),
        name="temp_uploads",
    )

    # Add custom endpoints
    @app.get("/")
    async def root():
        """Root endpoint with API info."""
        return {
            "message": "Welcome to Nexus QC API (AG-UI)",
            "version": "0.2.0",
            "protocol": "ag-ui",
            "endpoints": {
                "chat": "/agui (AG-UI protocol)",
                "config": "/config",
                "stt": "/api/stt/transcribe",
                "schemas": "/api/schemas",
                "health": "/health",
            },
            "docs": "/docs",
        }

    @app.get("/health")
    async def health_check():
        """Health check endpoint."""
        return {
            "status": "healthy",
            "app": "nexus-agui",
            "version": "0.2.0",
            "model": settings.openrouter_model_id,
        }

    logger.info("Nexus AG-UI app created successfully")
    return app


# Create app for uvicorn
app = create_app()


if __name__ == "__main__":
    import uvicorn

    # Run the server
    uvicorn.run(
        "app.agui_main:app",
        host=settings.api_host,
        port=settings.api_port,
        reload=settings.debug,
    )
