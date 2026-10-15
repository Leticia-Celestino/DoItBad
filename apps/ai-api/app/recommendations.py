import json

import httpx

from .config import Settings
from .models import RecommendationDraft, RecommendationResponse, TaskRecord


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
    microaction = pending_step or f"Abra o que precisa e comece por: {task.payload.title}"
    return RecommendationResponse(
        task_id=task.id,
        task_revision=task.revision,
        microaction=microaction[:180],
        reason="Este é o próximo passo disponível com maior prioridade.",
        estimated_minutes=2,
        source="deterministic",
        model=None,
    )


async def ask_llama(
    settings: Settings,
    client: httpx.AsyncClient,
    tasks: list[TaskRecord],
) -> RecommendationResponse:
    fallback = deterministic(tasks)
    if not settings.inference_enabled:
        return fallback
    candidates = [
        {
            "id": task.id,
            "revision": task.revision,
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
        "em até 15 minutos. Não invente IDs, tarefas ou fatos. Evite cobrança, produtividade tóxica "
        "e frases genéricas. Responda apenas JSON com task_id, microaction, reason e estimated_minutes.\n"
        f"Tarefas elegíveis: {json.dumps(candidates, ensure_ascii=False)}"
    )
    try:
        response = await client.post(
            f"{str(settings.llm_base_url).rstrip('/')}/chat/completions",
            headers={"Authorization": f"Bearer {settings.llm_api_key}"},
            json={
                "model": settings.llm_model,
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
        response.raise_for_status()
        content = response.json()["choices"][0]["message"]["content"]
        draft = RecommendationDraft.model_validate_json(content)
        selected = next((task for task in tasks if task.id == draft.task_id), None)
        if selected is None:
            return fallback
        return RecommendationResponse(
            **draft.model_dump(),
            task_revision=selected.revision,
            source="llama",
            model=settings.llm_model,
        )
    except (httpx.HTTPError, KeyError, TypeError, ValueError):
        return fallback
