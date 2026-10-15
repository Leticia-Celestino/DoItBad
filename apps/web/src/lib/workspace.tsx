import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { createRepository, type Item, type Kind, type Payloads } from '@doitbad/core';
import { supabase } from './supabase';

const repository = createRepository(
  supabase,
  {
    getItem: async (key) => localStorage.getItem(key),
    setItem: async (key, value) => localStorage.setItem(key, value),
  },
  () => crypto.randomUUID(),
);
type Workspace = {
  items: Item[];
  loading: boolean;
  ready: boolean;
  busy: boolean;
  error: string;
  reload: () => Promise<void>;
  save: <K extends Kind>(
    kind: K,
    payload: Payloads[K],
    previous?: Item<K>,
  ) => Promise<Item<K> | null>;
  remove: (previous: Item) => Promise<boolean>;
};
const Context = createContext<Workspace | null>(null);
export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const lock = useRef(false);
  const version = useRef(0);
  async function reload() {
    if (lock.current) return;
    setLoading(true);
    const started = version.current;
    try {
      const next = await repository.list();
      if (started !== version.current) return;
      setItems(next);
      setError('');
      setReady(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha ao carregar.');
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void reload();
    const refresh = () => {
      void reload();
    };
    window.addEventListener('focus', refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener('focus', refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);
  async function save<K extends Kind>(
    kind: K,
    payload: Payloads[K],
    previous?: Item<K>,
  ): Promise<Item<K> | null> {
    if (lock.current) return null;
    lock.current = true;
    version.current++;
    setBusy(true);
    setError('');
    try {
      const saved = await repository.save(kind, payload, previous);
      setItems((current) => [saved, ...current.filter((i) => i.id !== saved.id)]);
      return saved;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha ao salvar.');
      return null;
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  async function remove(previous: Item): Promise<boolean> {
    if (lock.current) return false;
    lock.current = true;
    version.current++;
    setBusy(true);
    setError('');
    try {
      await repository.remove(previous);
      setItems((current) => current.filter((item) => item.id !== previous.id));
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha ao remover.');
      return false;
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <Context.Provider value={{ items, loading, ready, busy, error, reload, save, remove }}>
      {children}
    </Context.Provider>
  );
}
export function useWorkspace() {
  const value = useContext(Context);
  if (!value) throw new Error('Workspace indisponível.');
  return value;
}
