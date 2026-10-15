from functools import lru_cache

from pydantic import AnyHttpUrl, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    supabase_url: AnyHttpUrl
    supabase_publishable_key: str = Field(min_length=20)
    llm_api_key: str | None = None
    llm_base_url: AnyHttpUrl = "https://api.cloudflare.com/client/v4/accounts/change-me/ai/v1"
    llm_model: str = "@cf/meta/llama-3.1-8b-instruct-fp8-fast"
    allowed_origins: str = "doitbad://,http://localhost:8081"
    request_timeout_seconds: float = Field(default=12, ge=2, le=60)

    @property
    def origins(self) -> list[str]:
        return [value.strip() for value in self.allowed_origins.split(",") if value.strip()]

    @property
    def inference_enabled(self) -> bool:
        return bool(self.llm_api_key and "change-me" not in str(self.llm_base_url))


@lru_cache
def get_settings() -> Settings:
    return Settings()  # type: ignore[call-arg]
