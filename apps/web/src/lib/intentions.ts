export type Intention = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
};

const STORAGE_KEY = 'doitbad-beta-intentions-v1';

export async function listIntentions(): Promise<Intention[]> {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed)) throw new Error('Os dados locais não puderam ser lidos.');
  return parsed as Intention[];
}

export async function saveIntention(title: string): Promise<Intention> {
  const intentions = await listIntentions();
  const now = new Date().toISOString();
  const intention = {
    id: crypto.randomUUID(),
    title: title.trim(),
    createdAt: now,
    updatedAt: now,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify([intention, ...intentions]));
  return intention;
}
