import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export const isSupabaseConfigured = Boolean(supabase);
export const CREATOR_EMAIL = 'matthieu.lecointre@gmail.com';

export function isCreator(user: { email?: string | null } | null): boolean {
  return user?.email?.trim().toLowerCase() === CREATOR_EMAIL;
}

export interface UserContent {
  book_edits: Record<number, unknown>;
  wedding_timeline: unknown[];
  program_events: unknown[];
  program_providers: unknown[];
}
