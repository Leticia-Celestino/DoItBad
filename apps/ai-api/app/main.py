from contextlib import asynccontextmanager

import httpx
from fastapi import Depends, FastAPI, Header, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware

from .config import Settings, get_settings
from .models import RecommendationRequest, RecommendationResponse
from .recommendations import ask_llama, eligible_tasks
from .supabase import SupabaseGateway


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    app.state.client = httpx.AsyncClient(timeout=settings.request_timeout_seconds)
    yield
    await app.state.client.aclose()


app = FastAPI(title="DoItBad AI API", version="0.1.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=get_settings().origins,
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Authorization", "Content-Type"],
)


def gateway(settings: Settings = Depends(get_settings)) -> SupabaseGateway:
    return SupabaseGateway(settings, app.state.client)


@app.get("/health")
async def health(settings: Settings = Depends(get_settings)) -> dict[str, str]:
    return {
        "status": "ok",
        "model": settings.llm_model,
        "inference": "llama" if settings.inference_enabled else "fallback",
    }


@app.post("/v1/recommendations/next-step", response_model=RecommendationResponse)
async def next_step(
    _: RecommendationRequest,
    authorization: str | None = Header(default=None),
    settings: Settings = Depends(get_settings),
    store: SupabaseGateway = Depends(gateway),
) -> RecommendationResponse:
    session = await store.authenticate(authorization)
    tasks = eligible_tasks(await store.tasks(session))
    if not tasks:
        raise HTTPException(status.HTTP_409_CONFLICT, "Não há uma tarefa disponível agora.")
    recommendation = await ask_llama(settings, app.state.client, tasks)
    recommendation.id = await store.save_recommendation(session, recommendation)
    return recommendation


@app.post("/v1/recommendations/{recommendation_id}/accept", status_code=status.HTTP_204_NO_CONTENT)
async def accept_recommendation(
    recommendation_id: str,
    authorization: str | None = Header(default=None),
    store: SupabaseGateway = Depends(gateway),
) -> None:
    session = await store.authenticate(authorization)
    await store.accept(session, recommendation_id)
