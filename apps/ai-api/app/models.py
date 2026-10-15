from typing import Literal

from pydantic import BaseModel, Field


class RecommendationRequest(BaseModel):
    locale: Literal["pt-BR"] = "pt-BR"


class RecommendationDraft(BaseModel):
    task_id: str = Field(min_length=1)
    microaction: str = Field(min_length=3, max_length=180)
    reason: str = Field(min_length=3, max_length=220)
    estimated_minutes: int = Field(ge=1, le=15)


class RecommendationResponse(RecommendationDraft):
    id: str | None = None
    task_revision: int = Field(ge=1)
    source: Literal["llama", "deterministic"]
    model: str | None = None


class TaskPayload(BaseModel):
    title: str
    project: str = ""
    date: str = ""
    done: bool = False
    steps: list[str] = Field(default_factory=list)
    priority: Literal["alta", "media", "baixa"] = "media"
    completedSteps: list[int] = Field(default_factory=list)
    dependsOn: list[str] = Field(default_factory=list)


class TaskRecord(BaseModel):
    id: str
    revision: int
    created_at: str
    payload: TaskPayload

