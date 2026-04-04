from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://fintrack:fintrack@db:5432/fintrack"
    secret_key: str = "change-me-in-production-use-a-long-random-string"
    access_token_expire_minutes: int = 15
    refresh_token_expire_days: int = 7
    rate_limit_per_minute: int = 60

    class Config:
        env_file = ".env"


settings = Settings()
