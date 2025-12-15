from typing import Optional

import redis.asyncio as redis
from app.config import settings

redis_client: Optional[redis.Redis] = None


async def init_redis() -> redis.Redis:
    """Initialize and return the Redis client."""
    global redis_client
    redis_client = await redis.from_url(
        settings.redis_url, encoding="utf-8", decode_responses=True
    )
    return redis_client


async def close_redis() -> None:
    """Close the Redis connection."""
    if redis_client:
        await redis_client.close()


def get_redis() -> redis.Redis:
    if redis_client is None:
        raise RuntimeError("Redis client not initialized. Call init_redis() first.")
    return redis_client
