// src/services/swarmService.js
import { supabase } from './supabase';

// ─── GET ACTIVE SWARMS ───────────────────────────────────────
export async function getSwarms() {
  const { data, error } = await supabase
    .from('swarms')
    .select('*')
    .order('voice_count', { ascending: false });
  if (error) return [];
  return data || [];
}

// ─── JOIN / LEAVE SWARM ──────────────────────────────────────
export async function toggleSwarm(swarmId) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false };

  const { data: existing } = await supabase
    .from('swarm_participants')
    .select('id').eq('swarm_id', swarmId).eq('user_id', user.id).single();

  if (existing) {
    await supabase.from('swarm_participants').delete().eq('id', existing.id);
    return { ok: true, joined: false };
  } else {
    await supabase.from('swarm_participants').insert({ swarm_id: swarmId, user_id: user.id });
    return { ok: true, joined: true };
  }
}

// ─── GET JOINED SWARM IDs ────────────────────────────────────
export async function getJoinedSwarms() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Set();
  const { data } = await supabase
    .from('swarm_participants').select('swarm_id').eq('user_id', user.id);
  return new Set((data || []).map(s => s.swarm_id));
}

// ─── CREATE SWARM ────────────────────────────────────────────
export async function createSwarm({ topic, mood, color }) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'not logged in' };

  const { data, error } = await supabase
    .from('swarms')
    .insert({ topic, mood, created_by: user.id, color: color || '#FF3366' })
    .select().single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, swarm: data };
}

// ─── REALTIME: live voice count updates ──────────────────────
export function subscribeToSwarms(onUpdate) {
  return supabase
    .channel('swarms_realtime')
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'swarms',
    }, payload => onUpdate(payload.new))
    .subscribe();
}
