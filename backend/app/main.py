import asyncio
import logging
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager

from app.config import settings
from app.db.supabase_client import init_supabase
from app.db.redis_client import init_redis, close_redis
from app.db.sqlite import init_db, close_db, async_session_maker
from app.db.seed_default_schema import seed_default_schema
from app.db.memory_store import memory_store
from app.api.sessions import router as sessions_router
from app.api.stt import router as stt_router
from app.api.schemas import router as schemas_router
from app.api.id_generation import router as id_generation_router, ids_router

logger = logging.getLogger(__name__)

# Cleanup interval in seconds (default: 5 minutes)
CLEANUP_INTERVAL_SECONDS = 300


async def cleanup_expired_data():
    """Background task to periodically clean up expired sessions and confirmations."""
    while True:
        try:
            await asyncio.sleep(CLEANUP_INTERVAL_SECONDS)
            result = memory_store.cleanup_all_expired()
            if result["sessions"] > 0 or result["confirmations"] > 0:
                logger.info(
                    f"Cleanup: removed {result['sessions']} expired sessions, "
                    f"{result['confirmations']} expired confirmations"
                )
        except asyncio.CancelledError:
            logger.info("Cleanup task cancelled")
            break
        except Exception as e:
            logger.error(f"Cleanup task error: {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    init_supabase()
    await init_redis()
    await init_db()  # Initialize SQLite database

    # Seed default schema
    async with async_session_maker() as session:
        await seed_default_schema(session)

    # Start background cleanup task
    cleanup_task = asyncio.create_task(cleanup_expired_data())
    logger.info(f"✓ Cleanup task started (interval: {CLEANUP_INTERVAL_SECONDS}s)")

    print("✓ Application startup complete")
    yield
    
    # Shutdown
    cleanup_task.cancel()
    try:
        await cleanup_task
    except asyncio.CancelledError:
        pass
    
    await close_redis()
    await close_db()  # Close SQLite connections
    print("✓ Application shutdown complete")


app = FastAPI(
    title="Nexus QC API",
    description="AI-Powered Quality Control & Traceability System",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS configuration for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite dev server
        "http://localhost:5174",  # Vite dev server (fallback port)
        "http://localhost:3000",  # Supabase Studio
        "http://localhost:8080",  # Alternative ports
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(sessions_router)
app.include_router(stt_router)
app.include_router(schemas_router)
app.include_router(id_generation_router, prefix="/api/id-rules")
app.include_router(ids_router, prefix="/api/ids")

# Mount static files for temp uploads (document preview)
temp_upload_dir = Path(settings.upload_dir)
if not temp_upload_dir.is_absolute():
    temp_upload_dir = Path(__file__).parent.parent / temp_upload_dir
temp_upload_dir = temp_upload_dir / "temp"
temp_upload_dir.mkdir(parents=True, exist_ok=True)

app.mount("/uploads/temp", StaticFiles(directory=str(temp_upload_dir)), name="temp_uploads")


@app.get("/")
async def root():
    return {"message": "Welcome to Nexus QC API", "version": "0.1.0", "docs": "/docs"}


@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": "0.1.0"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host=settings.api_host,
        port=settings.api_port,
        reload=settings.debug,
    )
