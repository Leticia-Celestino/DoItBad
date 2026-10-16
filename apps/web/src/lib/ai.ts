export type AIRecommendation = {
  id: string | null;
  task_id: string;
  task_revision: number;
  microaction: string;
  reason: string;
  estimated_minutes: number;
  source: 'llama' | 'deterministic';
  model: string | null;
};

const apiUrl = (
  (import.meta.env.VITE_AI_API_URL as string | undefined) ??
  'https://doitbad-ai.doitbad-app.workers.dev'
).replace(/\/$/, '');

export async function recommendNextStep(accessToken: string): Promise<AIRecommendation> {
  const response = await fetch(`${apiUrl}/v1/recommendations/next-step`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ locale: 'pt-BR' }),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.detail ?? 'Não foi possível encontrar um começo específico.');
  }
  return response.json() as Promise<AIRecommendation>;
}

export async function acceptRecommendation(accessToken: string, id: string) {
  await fetch(`${apiUrl}/v1/recommendations/${encodeURIComponent(id)}/accept`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}
