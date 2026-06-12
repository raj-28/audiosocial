// src/services/authService.js
// All auth via Supabase Auth — replaces our custom JWT
import { supabase } from './supabase';

export function validEmail(e) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());
}

export function validPassword(p) {
  const errs = [];
  if (p.length < 8)      errs.push('8+ characters');
  if (!/[A-Z]/.test(p)) errs.push('1 uppercase letter');
  if (!/[0-9]/.test(p)) errs.push('1 number');
  return errs;
}

// ─── SIGN UP ─────────────────────────────────────────────────
export async function signup(email, password) {
  email = email.trim().toLowerCase();
  if (!validEmail(email))         return { ok: false, error: 'Invalid email' };
  const pe = validPassword(password);
  if (pe.length)                  return { ok: false, error: `Password needs: ${pe[0]}` };

  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) return { ok: false, error: error.message };

  // Profile is auto-created by DB trigger
  return { ok: true, user: { id: data.user.id, email, pts: 10 } };
}

// ─── SIGN IN ─────────────────────────────────────────────────
export async function login(email, password) {
  email = email.trim().toLowerCase();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { ok: false, error: error.message };

  // Fetch profile for pts
  const { data: profile } = await supabase
    .from('profiles').select('pts, badge_level').eq('id', data.user.id).single();

  return {
    ok: true,
    user: { id: data.user.id, email, pts: profile?.pts || 10 }
  };
}

// ─── RESTORE SESSION ─────────────────────────────────────────
export async function restoreSession() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;

  const { data: profile } = await supabase
    .from('profiles').select('pts, badge_level').eq('id', session.user.id).single();

  return {
    id: session.user.id,
    email: session.user.email,
    pts: profile?.pts || 10,
  };
}

// ─── LOGOUT ──────────────────────────────────────────────────
export async function logout() {
  await supabase.auth.signOut();
}

export const DEMO_USER = { id: 'demo', email: 'demo@gripx.app', pts: 240 };
