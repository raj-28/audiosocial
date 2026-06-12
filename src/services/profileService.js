// src/services/profileService.js
import { supabase } from './supabase';

// ─── GET PROFILE ─────────────────────────────────────────────
export async function getProfile() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles').select('*').eq('id', user.id).single();

  if (error) return null;
  return { ...data, email: user.email };
}

// ─── GET NOTIFICATIONS ───────────────────────────────────────
export async function getNotifications() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50);

  return data || [];
}

// ─── MARK NOTIFICATIONS READ ─────────────────────────────────
export async function markNotificationsRead() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', user.id)
    .eq('is_read', false);
}

// ─── GET PTS HISTORY ─────────────────────────────────────────
// Returns last 7 days of activity
export async function getPtsHistory() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // Count echoes received per day for last 7 days
  const { data } = await supabase
    .from('echoes')
    .select('created_at')
    .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

  // Group by day
  const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const counts = new Array(7).fill(0);
  (data || []).forEach(e => {
    const d = new Date(e.created_at).getDay();
    counts[d] += 5; // 5 pts per echo
  });

  return days.map((day, i) => ({ day, pts: counts[i] }));
}

// ─── REALTIME: profile pts changes ───────────────────────────
export function subscribeToProfile(userId, onUpdate) {
  return supabase
    .channel(`profile:${userId}`)
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'profiles',
      filter: `id=eq.${userId}`,
    }, payload => onUpdate(payload.new))
    .subscribe();
}
