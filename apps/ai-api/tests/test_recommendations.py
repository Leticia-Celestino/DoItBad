from app.models import TaskRecord
from app.recommendations import deterministic, eligible_tasks


def task(
    task_id: str,
    *,
    priority: str = "media",
    done: bool = False,
    depends_on: list[str] | None = None,
    steps: list[str] | None = None,
) -> TaskRecord:
    return TaskRecord.model_validate(
        {
            "id": task_id,
            "revision": 1,
            "created_at": f"2026-01-0{len(task_id)}T12:00:00Z",
            "payload": {
                "title": f"Tarefa {task_id}",
                "project": "",
                "date": "2026-01-01",
                "done": done,
                "steps": steps or [],
                "priority": priority,
                "completedSteps": [],
                "dependsOn": depends_on or [],
            },
        }
    )


def test_eligible_tasks_respect_dependencies_and_priority() -> None:
    tasks = [
        task("done", done=True),
        task("blocked", priority="alta", depends_on=["missing"]),
        task("low", priority="baixa"),
        task("high", priority="alta", depends_on=["done"]),
    ]
    assert [item.id for item in eligible_tasks(tasks)] == ["high", "low"]


def test_deterministic_uses_first_pending_microaction() -> None:
    recommendation = deterministic([task("one", steps=["Abrir o arquivo", "Escrever o título"])])
    assert recommendation.task_id == "one"
    assert recommendation.microaction == "Abrir o arquivo"
    assert recommendation.source == "deterministic"

