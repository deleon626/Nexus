from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", case_sensitive=False
    )

    # API Configuration
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    debug: bool = False

    # Database
    supabase_url: str
    postgres_url: str

    # Redis
    redis_url: str = "redis://localhost:6379/0"
    redis_session_ttl: int = 3600

    # OpenRouter Configuration (Agno framework)
    openrouter_api_key: str
    openrouter_model_id: str = "anthropic/claude-3.5-sonnet"
    claude_max_tokens: int = 4096

    # Whisper API
    openai_api_key: str
    whisper_model: str = "whisper-1"


settings = Settings()
