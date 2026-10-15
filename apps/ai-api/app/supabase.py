from dataclasses import dataclass
from datetime import UTC, datetime

import httpx
from fastapi import HTTPException, status

from .config import Settings
from .models import RecommendationResponse, TaskRecord


@dataclass(frozen=True)
class UserSession:
    access_token: str
    user_id: str


class SupabaseGateway:
    def __init__(self, settings: Settings, client: httpx.AsyncClient):
        self.settings = settings
        self.client = client
        self.base_url = str(settings.supabase_url).rstrip("/")

    def headers(self, access_token: str) -> dict[str, str]:
        return {
            "apikey": self.settings.supabase_publishable_key,
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json",
        }

    async def authenticate(self, authorization: str | None) -> UserSession:
        if not authorization or not authorization.startswith("Bearer "):
            raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Acesso não autenticado.")
        token = authorization.removeprefix("Bearer ").strip()
        response = await self.client.get(
            f"{self.base_url}/auth/v1/user",
            headers=self.headers(token),
        )
        if response.status_code != 200:
            raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Sessão inválida ou expirada.")
        user_id = response.json().get("id")
        if not user_id:
            raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Sessão inválida.")
        return UserSession(access_token=token, user_id=user_id)

    async def tasks(self, session: UserSession) -> list[TaskRecord]:
        response = await self.client.get(
            f"{self.base_url}/rest/v1/workspace_items",
            headers=self.headers(session.access_token),
            params={
                "select": "id,payload,revision,created_at",
                "kind": "eq.task",
                "order": "created_at.asc",
            },
        )
        if response.status_code != 200:
            raise HTTPException(status.HTTP_502_BAD_GATEWAY, "Não foi possível ler suas tarefas.")
        return [TaskRecord.model_validate(item) for item in response.json()]

    async def save_recommendation(
        self,
        session: UserSession,
        recommendation: RecommendationResponse,
    ) -> str | None:
        response = await self.client.post(
            f"{self.base_url}/rest/v1/ai_recommendations",
            headers={**self.headers(session.access_token), "Prefer": "return=representation"},
            json={
                "task_id": recommendation.task_id,
                "task_revision": recommendation.task_revision,
                "microaction": recommendation.microaction,
                "reason": recommendation.reason,
                "estimated_minutes": recommendation.estimated_minutes,
                "source": recommendation.source,
                "model": recommendation.model,
            },
        )
        if response.status_code not in (200, 201):
            return None
        records = response.json()
        return records[0]["id"] if records else None

    async def accept(self, session: UserSession, recommendation_id: str) -> None:
        response = await self.client.patch(
            f"{self.base_url}/rest/v1/ai_recommendations",
            headers={**self.headers(session.access_token), "Prefer": "return=representation"},
            params={"id": f"eq.{recommendation_id}"},
            json={"status": "accepted", "accepted_at": datetime.now(UTC).isoformat()},
        )
        if response.status_code != 200 or not response.json():
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Sugestão não encontrada.")
