from pydantic_settings import BaseSettings
from urllib.parse import quote_plus

class Settings(BaseSettings):
    PROJECT_NAME: str = "SupplyChainAPI"
    ENV: str = "development"

    DB_HOST: str | None = None
    DB_PORT: int | None = None
    DB_NAME: str | None = None
    DB_USER: str | None = None
    DB_PASSWORD: str | None = None

    DATABASE_URL: str | None = None

    SECRET_KEY: str
    ALGORITHM: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int

    class Config:
        env_file = ".env"
        env_file_encoding = 'utf-8'

    @property
    def database_url(self) -> str:
        if self.DATABASE_URL:
            return self.DATABASE_URL

        if not all([
            self.DB_HOST,
            self.DB_PORT,
            self.DB_NAME,
            self.DB_USER,
            self.DB_PASSWORD,
        ]):
            raise ValueError("Database configuration incomplete")

        password = quote_plus(self.DB_PASSWORD)
        return (
            f"postgresql://{self.DB_USER}:{password}"
            f"@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
        )

settings = Settings()
