// src/services/postService.js
import { supabase, AUDIO_BUCKET } from './supabase';
import * as FileSystem from 'expo-file-system';

// ─── FETCH FEED ──────────────────────────────────────────────
export async function getFeed({ topic, zone, limit = 20, offset = 0 } = {}) {
  let query = supabase
    .from('feed_view')
    .select('*')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (topic) query = query.eq('topic', topic);
  if (zone)  query = query.eq('zone', zone);

  const { data, error } = await query;
  if (error) return { ok: false, posts: [], error: error.message };
  return { ok: true, posts: data || [] };
}

// ─── GET SINGLE POST ─────────────────────────────────────────
export async function getPost(postId) {
  const { data, error } = await supabase
    .from('feed_view').select('*').eq('id', postId).single();
  if (error) return null;
  return data;
}

// ─── UPLOAD AUDIO + CREATE POST ──────────────────────────────
export async function createPost({ text, audioUri, mood, topic, zone, reach, duration, dissolveTimer }) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'not logged in' };

  let audioUrl = null;

  // Upload audio file if provided
  if (audioUri) {
    try {
      const fileName = `${user.id}/${Date.now()}.m4a`;
      
      // Read file as base64
      const base64 = await FileSystem.readAsStringAsync(audioUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      // Decode base64 to binary
      const binary = Uint8Array.from(atob(base64), c => c.charCodeAt(0));

      const { error: uploadError } = await supabase.storage
        .from(AUDIO_BUCKET)
        .upload(fileName, binary, { contentType: 'audio/m4a', upsert: false });

      if (!uploadError) {
        const { data: urlData } = supabase.storage.from(AUDIO_BUCKET).getPublicUrl(fileName);
        audioUrl = urlData.publicUrl;
      }
    } catch (e) {
      console.warn('Audio upload failed:', e.message);
      // Continue without audio — post text only
    }
  }

  // Insert post
  const { data, error } = await supabase
    .from('posts')
    .insert({
      user_id: user.id,
      text: text.trim(),
      audio_url: audioUrl,
      mood,
      topic: topic || '3am',
      zone: zone || 'PULSE',
      reach: reach || 'nearby',
      duration_secs: duration || 15,
      dissolve_timer: dissolveTimer || '48h',
      pulse_score: 5.0,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };

  // +10 pts for posting
  await supabase.rpc('increment_pts', { user_id: user.id, amount: 10 });

  return { ok: true, post: data };
}

// ─── ECHO / UN-ECHO ──────────────────────────────────────────
export async function toggleEcho(postId) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'not logged in' };

  // Check if already echoed
  const { data: existing } = await supabase
    .from('echoes')
    .select('id')
    .eq('post_id', postId)
    .eq('user_id', user.id)
    .single();

  if (existing) {
    // Remove echo
    const { error } = await supabase
      .from('echoes').delete().eq('id', existing.id);
    if (error) return { ok: false, error: error.message };
    return { ok: true, echoed: false };
  } else {
    // Add echo
    const { error } = await supabase
      .from('echoes').insert({ post_id: postId, user_id: user.id });
    if (error) return { ok: false, error: error.message };
    return { ok: true, echoed: true };
  }
}

// ─── GET USER'S ECHOED POST IDs ───────────────────────────────
export async function getUserEchoes() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Set();
  const { data } = await supabase
    .from('echoes').select('post_id').eq('user_id', user.id);
  return new Set((data || []).map(e => e.post_id));
}

// ─── GET REPLIES FOR POST ────────────────────────────────────
export async function getReplies(postId) {
  const { data, error } = await supabase
    .from('replies_view')
    .select('*')
    .eq('post_id', postId)
    .order('created_at', { ascending: false });
  if (error) return [];
  return data || [];
}

// ─── CREATE REPLY ────────────────────────────────────────────
export async function createReply({ postId, text, audioUri, mood, duration }) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'not logged in' };

  let audioUrl = null;
  if (audioUri) {
    try {
      const fileName = `replies/${user.id}/${Date.now()}.m4a`;
      const base64 = await FileSystem.readAsStringAsync(audioUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const binary = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
      const { error: upErr } = await supabase.storage
        .from(AUDIO_BUCKET).upload(fileName, binary, { contentType: 'audio/m4a' });
      if (!upErr) {
        const { data: urlData } = supabase.storage.from(AUDIO_BUCKET).getPublicUrl(fileName);
        audioUrl = urlData.publicUrl;
      }
    } catch(e) { console.warn('Reply audio upload failed:', e.message); }
  }

  const { data, error } = await supabase
    .from('replies')
    .insert({ post_id: postId, user_id: user.id, text, audio_url: audioUrl, mood, duration_secs: duration || 10 })
    .select().single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, reply: data };
}

// ─── SAVE / UNSAVE POST ──────────────────────────────────────
export async function toggleSave(postId) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false };

  const { data: existing } = await supabase
    .from('saved_posts').select('id').eq('post_id', postId).eq('user_id', user.id).single();

  if (existing) {
    await supabase.from('saved_posts').delete().eq('id', existing.id);
    return { ok: true, saved: false };
  } else {
    await supabase.from('saved_posts').insert({ post_id: postId, user_id: user.id });
    return { ok: true, saved: true };
  }
}

// ─── GET SAVED POSTS ─────────────────────────────────────────
export async function getSavedPosts() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from('saved_posts')
    .select('post_id, feed_view(*)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  return (data || []).map(d => d.feed_view).filter(Boolean);
}

// ─── REALTIME: subscribe to echo count changes ────────────────
export function subscribeToPost(postId, onUpdate) {
  return supabase
    .channel(`post:${postId}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'posts',
      filter: `id=eq.${postId}`,
    }, payload => onUpdate(payload.new))
    .subscribe();
}
