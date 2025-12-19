from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.config import settings
from app.db.supabase_client import init_supabase
from app.db.redis_client import init_redis, close_redis
from app.db.sqlite import init_db, close_db
from app.api.sessions import router as sessions_router
from app.api.stt import router as stt_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    init_supabase()
    await init_redis()
    await init_db()  # Initialize SQLite database
    print("✓ Application startup complete")
    yield
    # Shutdown
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
        "http://localhost:3001",  # Next.js dev server
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",  # Next.js dev server
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(sessions_router)
app.include_router(stt_router)


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
