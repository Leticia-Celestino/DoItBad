import json
from datetime import UTC, datetime

import httpx
from fastapi import FastAPI, Header, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from workers import WorkerEntrypoint

from models import RecommendationDraft, RecommendationRequest, RecommendationResponse, TaskRecord


app = FastAPI(title="DoItBad AI API", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Authorization", "Content-Type"],
)

PRIORITY = {"alta": 0, "media": 1, "baixa": 2}


def eligible_tasks(tasks: list[TaskRecord]) -> list[TaskRecord]:
    completed = {task.id for task in tasks if task.payload.done}
    return sorted(
        (
            task
            for task in tasks
            if not task.payload.done
            and all(dependency in completed for dependency in task.payload.dependsOn)
        ),
        key=lambda task: (PRIORITY[task.payload.priority], task.created_at),
    )[:5]


def deterministic(tasks: list[TaskRecord]) -> RecommendationResponse:
    task = tasks[0]
    pending_step = next(
        (
            step
            for index, step in enumerate(task.payload.steps)
            if index not in task.payload.completedSteps
        ),
        None,
    )
    return RecommendationResponse(
        task_id=task.id,
        task_revision=task.revision,
        microaction=(pending_step or f"Abra o que precisa e comece por: {task.payload.title}")[:180],
        reason="Este é o próximo passo disponível com maior prioridade.",
        estimated_minutes=2,
        source="deterministic",
        model=None,
    )


def worker_env(request: Request):
    return request.scope["env"]


def supabase_headers(env, access_token: str) -> dict[str, str]:
    return {
        "apikey": str(env.SUPABASE_PUBLISHABLE_KEY),
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json",
    }


def authenticate(env, authorization: str | None) -> tuple[str, str]:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Acesso não autenticado.")
    token = authorization.removeprefix("Bearer ").strip()
    response = httpx.get(
        f"{str(env.SUPABASE_URL).rstrip('/')}/auth/v1/user",
        headers=supabase_headers(env, token),
        timeout=10,
    )
    if response.status_code != 200 or not response.json().get("id"):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Sessão inválida ou expirada.")
    return token, response.json()["id"]


def load_tasks(env, token: str) -> list[TaskRecord]:
    response = httpx.get(
        f"{str(env.SUPABASE_URL).rstrip('/')}/rest/v1/workspace_items",
        headers=supabase_headers(env, token),
        params={
            "select": "id,payload,revision,created_at",
            "kind": "eq.task",
            "order": "created_at.asc",
        },
        timeout=10,
    )
    if response.status_code != 200:
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, "Não foi possível ler suas tarefas.")
    return [TaskRecord.model_validate(item) for item in response.json()]


async def choose_with_llama(env, tasks: list[TaskRecord]) -> RecommendationResponse:
    fallback = deterministic(tasks)
    candidates = [
        {
            "id": task.id,
            "title": task.payload.title,
            "tag": task.payload.project,
            "priority": task.payload.priority,
            "pending_steps": [
                step
                for index, step in enumerate(task.payload.steps)
                if index not in task.payload.completedSteps
            ][:4],
        }
        for task in tasks
    ]
    prompt = (
        "Escolha exatamente uma tarefa e proponha uma microação concreta, acolhedora e executável "
        "em até 15 minutos. Não invente IDs, tarefas ou fatos. Evite cobrança e frases genéricas. "
        "Responda apenas JSON com task_id, microaction, reason e estimated_minutes.\n"
        f"Tarefas elegíveis: {json.dumps(candidates, ensure_ascii=False)}"
    )
    try:
        model = str(getattr(env, "LLM_MODEL", "@cf/meta/llama-3.1-8b-instruct-fp8-fast"))
        result = await env.AI.run(
            model,
            {
                "messages": [
                    {
                        "role": "system",
                        "content": "Você ajuda pessoas a começar com gentileza. Produza somente JSON válido.",
                    },
                    {"role": "user", "content": prompt},
                ],
                "temperature": 0.2,
                "max_tokens": 220,
                "response_format": {"type": "json_object"},
            },
        )
        content = result.response
        draft = (
            RecommendationDraft.model_validate_json(content)
            if isinstance(content, str)
            else RecommendationDraft.model_validate(content)
        )
        selected = next((task for task in tasks if task.id == draft.task_id), None)
        if selected is None:
            return fallback
        return RecommendationResponse(
            **draft.model_dump(),
            task_revision=selected.revision,
            source="llama",
            model=model,
        )
    except Exception as error:
        print(f"workers_ai_fallback={type(error).__name__}")
        return fallback


def save_recommendation(
    env,
    token: str,
    recommendation: RecommendationResponse,
) -> str | None:
    response = httpx.post(
        f"{str(env.SUPABASE_URL).rstrip('/')}/rest/v1/ai_recommendations",
        headers={**supabase_headers(env, token), "Prefer": "return=representation"},
        json={
            "task_id": recommendation.task_id,
            "task_revision": recommendation.task_revision,
            "microaction": recommendation.microaction,
            "reason": recommendation.reason,
            "estimated_minutes": recommendation.estimated_minutes,
            "source": recommendation.source,
            "model": recommendation.model,
        },
        timeout=10,
    )
    if response.status_code not in (200, 201):
        return None
    records = response.json()
    return records[0]["id"] if records else None


@app.get("/health")
async def health(request: Request) -> dict[str, str]:
    env = worker_env(request)
    return {
        "status": "ok",
        "model": str(getattr(env, "LLM_MODEL", "@cf/meta/llama-3.1-8b-instruct-fp8-fast")),
        "inference": "llama",
    }


@app.post("/v1/recommendations/next-step", response_model=RecommendationResponse)
async def next_step(
    _: RecommendationRequest,
    request: Request,
    authorization: str | None = Header(default=None),
) -> RecommendationResponse:
    env = worker_env(request)
    token, _ = authenticate(env, authorization)
    tasks = eligible_tasks(load_tasks(env, token))
    if not tasks:
        raise HTTPException(status.HTTP_409_CONFLICT, "Não há uma tarefa disponível agora.")
    recommendation = await choose_with_llama(env, tasks)
    recommendation.id = save_recommendation(env, token, recommendation)
    return recommendation


@app.post("/v1/recommendations/{recommendation_id}/accept", status_code=status.HTTP_204_NO_CONTENT)
async def accept_recommendation(
    recommendation_id: str,
    request: Request,
    authorization: str | None = Header(default=None),
) -> None:
    env = worker_env(request)
    token, _ = authenticate(env, authorization)
    response = httpx.patch(
        f"{str(env.SUPABASE_URL).rstrip('/')}/rest/v1/ai_recommendations",
        headers={**supabase_headers(env, token), "Prefer": "return=representation"},
        params={"id": f"eq.{recommendation_id}"},
        json={"status": "accepted", "accepted_at": datetime.now(UTC).isoformat()},
        timeout=10,
    )
    if response.status_code != 200 or not response.json():
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Sugestão não encontrada.")


class Default(WorkerEntrypoint):
    async def fetch(self, request):
        import asgi

        return await asgi.fetch(app, request.js_object, self.env)
