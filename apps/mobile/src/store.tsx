import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';
import { createClient, type Session } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import {
  createRepository,
  loadActivityEvents,
  type ActivityEvent,
  type Item,
  type Kind,
  type Payloads,
} from '@doitbad/core';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
export const supabase =
  url && key
    ? createClient(url, key, {
        auth: {
          storage: {
            getItem: SecureStore.getItemAsync,
            setItem: SecureStore.setItemAsync,
            removeItem: SecureStore.deleteItemAsync,
          },
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: false,
        },
      })
    : null;
const repo = createRepository(supabase, AsyncStorage, Crypto.randomUUID);
type Store = {
  session: Session | null;
  ready: boolean;
  dataReady: boolean;
  items: Item[];
  events: ActivityEvent[];
  error: string;
  busy: boolean;
  night: boolean;
  toggleNight: () => void;
  refresh: () => Promise<void>;
  save: <K extends Kind>(
    kind: K,
    payload: Payloads[K],
    previous?: Item<K>,
  ) => Promise<Item<K> | null>;
  remove: (previous: Item) => Promise<boolean>;
};
const Context = createContext<Store | null>(null);
export function StoreProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(!supabase);
  const [dataReady, setDataReady] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [night, setNight] = useState(false);
  const lock = useRef(false);
  const generation = useRef(0);
  const owner = useRef<string | null>(null);
  const revision = useRef(0);
  useEffect(() => {
    void AsyncStorage.getItem('doitbad:night').then((value) => setNight(value === '1'));
  }, []);
  function toggleNight() {
    setNight((value) => {
      void AsyncStorage.setItem('doitbad:night', value ? '0' : '1');
      return !value;
    });
  }
  async function refresh() {
    if (lock.current) return;
    const current = generation.current;
    const started = revision.current;
    try {
      const next = await repo.list();
      if (current === generation.current && started === revision.current) {
        setItems(next);
        setEvents(await loadActivityEvents(supabase, next));
        setDataReady(true);
        setError('');
      }
    } catch (e) {
      if (current === generation.current)
        setError(e instanceof Error ? e.message : 'Falha ao sincronizar.');
    }
  }
  useEffect(() => {
    if (!supabase) return;
    void supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (error) setError(error.message);
        setSession(data.session);
        setReady(true);
      })
      .catch(() => {
        setError('Não foi possível recuperar seu acesso. Tente novamente.');
        setReady(true);
      });
    const { data } = supabase.auth.onAuthStateChange((_event, value) => {
      if (owner.current !== (value?.user.id ?? null)) {
        generation.current++;
        owner.current = value?.user.id ?? null;
        setItems([]);
        setEvents([]);
        setDataReady(false);
      }
      setSession(value);
      setReady(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);
  useEffect(() => {
    if (!supabase || session) void refresh();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        supabase?.auth.startAutoRefresh();
        if (!supabase || session) void refresh();
      } else supabase?.auth.stopAutoRefresh();
    });
    return () => sub.remove();
  }, [session?.user.id]);
  async function save<K extends Kind>(
    kind: K,
    payload: Payloads[K],
    previous?: Item<K>,
  ): Promise<Item<K> | null> {
    if (lock.current) return null;
    lock.current = true;
    revision.current++;
    setBusy(true);
    setError('');
    const current = generation.current;
    try {
      const item = await repo.save(kind, payload, previous);
      if (current !== generation.current) return null;
      const next = [item, ...items.filter((i) => i.id !== item.id)];
      setItems(next);
      setEvents(await loadActivityEvents(supabase, next));
      return item;
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
    revision.current++;
    setBusy(true);
    setError('');
    const current = generation.current;
    try {
      await repo.remove(previous);
      if (current !== generation.current) return false;
      setItems((values) => values.filter((item) => item.id !== previous.id));
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
    <Context.Provider
      value={{
        session,
        ready,
        dataReady,
        items,
        events,
        error,
        busy,
        night,
        toggleNight,
        refresh,
        save,
        remove,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useStore() {
  const value = useContext(Context);
  if (!value) throw new Error('Store indisponível.');
  return value;
}
