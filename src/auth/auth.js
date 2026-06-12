// src/auth/auth.js
// Pure JS crypto only — works in Expo Go without native build
import * as SecureStore from 'expo-secure-store';

// ─── VALIDATORS ──────────────────────────────────────────────
export function validEmail(e) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());
}

export function validPassword(p) {
  const errs = [];
  if (p.length < 8)       errs.push('8+ characters');
  if (!/[A-Z]/.test(p))  errs.push('1 uppercase letter');
  if (!/[0-9]/.test(p))  errs.push('1 number');
  return errs;
}

// ─── PURE JS PASSWORD HASHING ────────────────────────────────
// No native module — works in Expo Go
function simpleHash(str) {
  // FNV-1a 64-bit style hash — fast, good distribution
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16).padStart(16, '0');
}

function generateSalt() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let salt = '';
  for (let i = 0; i < 32; i++) {
    salt += chars[Math.floor(Math.random() * chars.length)];
  }
  return salt;
}

// Stretch the hash 10000 times to slow brute force
function stretchHash(password, salt, iterations = 10000) {
  let hash = simpleHash(password + salt);
  for (let i = 0; i < iterations; i++) {
    hash = simpleHash(hash + salt + i);
  }
  return hash;
}

async function hashPassword(password) {
  const salt = generateSalt();
  const hash = stretchHash(password, salt);
  return { hash, salt };
}

async function verifyPassword(password, storedHash, salt) {
  const hash = stretchHash(password, salt);
  return hash === storedHash;
}

function generateId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// ─── TOKEN ───────────────────────────────────────────────────
function makeToken(userId, email, pts) {
  return JSON.stringify({
    sub: userId,
    email,
    pts,
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
    iat: Date.now(),
  });
}

function parseToken(token) {
  try {
    const p = JSON.parse(token);
    if (p.exp < Date.now()) return null;
    return p;
  } catch { return null; }
}

// ─── STORAGE — expo-secure-store (works in Expo Go) ──────────
function emailToKey(email) {
  // SecureStore keys must be alphanumeric + _ only
  return 'user_' + email.toLowerCase().replace(/[^a-z0-9]/g, '_');
}

async function getUser(email) {
  try {
    const raw = await SecureStore.getItemAsync(emailToKey(email));
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

async function saveUser(user) {
  try {
    await SecureStore.setItemAsync(emailToKey(user.email), JSON.stringify(user));
    return true;
  } catch { return false; }
}

async function saveToken(token) {
  try { await SecureStore.setItemAsync('auth_token', token); } catch {}
}

async function getToken() {
  try { return await SecureStore.getItemAsync('auth_token'); } catch { return null; }
}

async function clearToken() {
  try { await SecureStore.deleteItemAsync('auth_token'); } catch {}
}

// ─── AUTH ACTIONS ────────────────────────────────────────────
export async function signup(email, password) {
  email = email.trim().toLowerCase();
  if (!validEmail(email)) return { ok: false, error: 'Invalid email address' };
  const pwErrs = validPassword(password);
  if (pwErrs.length) return { ok: false, error: `Password needs: ${pwErrs[0]}` };
  const existing = await getUser(email);
  if (existing) return { ok: false, error: 'Account already exists with this email' };
  const { hash, salt } = await hashPassword(password);
  const user = { id: generateId(), email, hash, salt, pts: 10, createdAt: Date.now() };
  const saved = await saveUser(user);
  if (!saved) return { ok: false, error: 'Storage error — try demo login' };
  const token = makeToken(user.id, email, 10);
  await saveToken(token);
  return { ok: true, user: { id: user.id, email, pts: 10 } };
}

export async function login(email, password) {
  email = email.trim().toLowerCase();
  if (!validEmail(email)) return { ok: false, error: 'Invalid email address' };
  const user = await getUser(email);
  if (!user) return { ok: false, error: 'No account found with this email' };
  const valid = await verifyPassword(password, user.hash, user.salt);
  if (!valid) return { ok: false, error: 'Incorrect password' };
  const token = makeToken(user.id, email, user.pts);
  await saveToken(token);
  return { ok: true, user: { id: user.id, email, pts: user.pts } };
}

export async function restoreSession() {
  const token = await getToken();
  if (!token) return null;
  const payload = parseToken(token);
  if (!payload) { await clearToken(); return null; }
  return { id: payload.sub, email: payload.email, pts: payload.pts || 10 };
}

export async function logout() {
  await clearToken();
}

export const DEMO_USER = { id: 'demo', email: 'demo@gripx.app', pts: 240 };
