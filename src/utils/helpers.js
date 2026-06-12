// src/utils/helpers.js
import { BADGE_LEVELS, MOODS } from './constants';

export function timeAgo(ts) {
  const m = Math.floor((Date.now() - ts) / 60000);
  if (m < 1) return 'now';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

export function getBadge(pts) {
  for (let i = BADGE_LEVELS.length - 1; i >= 0; i--) {
    if (pts >= BADGE_LEVELS[i].pts) return BADGE_LEVELS[i];
  }
  return null;
}

export function detectMood(text) {
  const l = text.toLowerCase();
  if (/cockroach|cjp/.test(l))             return 'COCKROACH';
  if (/demand|accountability|jawab/.test(l)) return 'DEMAND';
  if (/witness|testify|proof/.test(l))      return 'WITNESS';
  if (/theek|heal|slowly|dheere/.test(l))   return 'HEALING';
  if (/tired|thak|exhaust/.test(l))         return 'EXHAUSTION';
  if (/alone|akela|lonely|3am/.test(l))     return 'LONELINESS';
  if (/hope|umeed|believe/.test(l))         return 'HOPE';
  if (/rage|furious|angry|gussa/.test(l))   return 'RAGE';
  return 'EXHAUSTION';
}

export function getMood(key) {
  return MOODS[key] || MOODS.HEALING;
}

export function formatCount(n) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}
