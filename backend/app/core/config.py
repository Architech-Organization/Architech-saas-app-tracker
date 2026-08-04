from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = ""           # Supabase connection string (set in Render env vars)
    SECRET_KEY: str = "change-me"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30
    FRONTEND_URL: str = "*"          # Vercel URL — set in Render env vars

    class Config:
        env_file = ".env"

settings = Settings()
