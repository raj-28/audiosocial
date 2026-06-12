// src/services/supabase.js
// Central Supabase client — used by all services
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── CONFIG ──────────────────────────────────────────────────
// Get these from: Supabase Dashboard → Settings → API
export const SUPABASE_URL = 'https://YOUR_PROJECT.supabase.co';
export const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY';

// ─── CLIENT ──────────────────────────────────────────────────
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,         // persists session on device
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// ─── STORAGE BUCKETS ─────────────────────────────────────────
export const AUDIO_BUCKET = 'audio';   // voice recordings
export const AVATAR_BUCKET = 'avatars'; // future use

// ─── HELPERS ─────────────────────────────────────────────────
export function getAudioUrl(path) {
  if (!path) return null;
  const { data } = supabase.storage.from(AUDIO_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
