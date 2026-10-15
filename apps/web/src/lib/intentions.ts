export type Intention = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
};

import { supabase } from './supabase';

const STORAGE_KEY = 'doitbad-beta-intentions-v1';
type RemoteIntention = { id: string; title: string; created_at: string; updated_at: string };

function fromRemote(item: RemoteIntention): Intention {
  return { id: item.id, title: item.title, createdAt: item.created_at, updatedAt: item.updated_at };
}

export async function listIntentions(): Promise<Intention[]> {
  if (supabase) {
    const { data, error } = await supabase
      .from('intentions')
      .select('id,title,created_at,updated_at')
      .order('updated_at', { ascending: false });
    if (error) throw error;
    return (data as RemoteIntention[]).map(fromRemote);
  }
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed)) throw new Error('Os dados locais não puderam ser lidos.');
  return parsed as Intention[];
}

export async function saveIntention(title: string): Promise<Intention> {
  if (supabase) {
    const { data, error } = await supabase
      .from('intentions')
      .insert({ title: title.trim() })
      .select('id,title,created_at,updated_at')
      .single();
    if (error) throw error;
    return fromRemote(data as RemoteIntention);
  }
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
