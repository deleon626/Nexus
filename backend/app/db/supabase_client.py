from typing import Optional

from supabase import create_client, Client
from app.config import settings

supabase_client: Optional[Client] = None


def init_supabase() -> Client:
    """Initialize and return the Supabase client."""
    global supabase_client
    supabase_client = create_client(
        settings.supabase_url,
        settings.supabase_url,  # Using URL as service key for now (local dev)
    )
    return supabase_client


def get_supabase() -> Client:
    if supabase_client is None:
        raise RuntimeError(
            "Supabase client not initialized. Call init_supabase() first."
        )
    return supabase_client
