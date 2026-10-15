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

const apiUrl = process.env.EXPO_PUBLIC_AI_API_URL?.replace(/\/$/, '');

async function api<T>(path: string, accessToken: string, init?: RequestInit): Promise<T> {
  if (!apiUrl) throw new Error('A ajuda inteligente ainda não foi publicada.');
  const response = await fetch(`${apiUrl}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.detail ?? 'Não foi possível escolher seu próximo passo.');
  }
  return (response.status === 204 ? undefined : response.json()) as Promise<T>;
}

export function recommendNextStep(accessToken: string): Promise<AIRecommendation> {
  return api('/v1/recommendations/next-step', accessToken, {
    method: 'POST',
    body: JSON.stringify({ locale: 'pt-BR' }),
  });
}

export function acceptRecommendation(accessToken: string, id: string): Promise<void> {
  return api(`/v1/recommendations/${encodeURIComponent(id)}/accept`, accessToken, {
    method: 'POST',
  });
}

export const hasAIService = Boolean(apiUrl);
