import type { Session, User } from '@supabase/supabase-js';
import { supabase } from './supabase';

export type AuthState = { session: Session | null; user: User | null; loading: boolean };

export async function getSession() {
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

export function subscribeToAuth(callback: (session: Session | null) => void) {
  if (!supabase) return () => undefined;
  const { data } = supabase.auth.onAuthStateChange((_event, session) => callback(session));
  return () => data.subscription.unsubscribe();
}

function publicOrigin() {
  // Keep confirmation links on the deployment the user is currently using.
  if (typeof window !== 'undefined' && window.location.origin) {
    return window.location.origin;
  }
  return (import.meta.env.VITE_SITE_URL as string | undefined) ?? 'http://localhost:4324';
}

export async function signIn(email: string, password: string) {
  if (!supabase) throw new Error('Autenticação não está configurada neste ambiente.');
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

export async function signUp(email: string, password: string, name = '') {
  if (!supabase) throw new Error('Autenticação não está configurada neste ambiente.');
  const redirectTo = publicOrigin();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${redirectTo.replace(/\/$/, '')}/entrar`,
      data: { name: name.trim() },
    },
  });
  if (error) throw error;
}

export async function requestPasswordReset(email: string) {
  if (!supabase) throw new Error('Autenticação não está configurada neste ambiente.');
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${publicOrigin()}/redefinir-senha`,
  });
  if (error) throw error;
}

export async function updatePassword(password: string) {
  if (!supabase) throw new Error('Autenticação indisponível.');
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw error;
}

export async function updateProfileName(name: string) {
  if (!supabase) return;
  const { error } = await supabase.auth.updateUser({ data: { name: name.trim() } });
  if (error) throw error;
}

export async function signOut() {
  if (!supabase) return;
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
