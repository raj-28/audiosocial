// src/utils/transcribe.js
// Transcribes audio using Groq Whisper API
// Free tier: 7200 seconds/day — more than enough for development
// Sign up free at: console.groq.com
// Same API format as OpenAI Whisper

const GROQ_API_KEY = ''; // <-- paste your Groq API key here
const GROQ_URL = 'https://api.groq.com/openai/v1/audio/transcriptions';

/**
 * Transcribe an audio file URI using Groq Whisper
 * @param {string} uri - local file URI from expo-av recording
 * @param {string} language - 'en', 'hi', etc.
 * @returns {Promise<{ok: boolean, text: string, error?: string}>}
 */
export async function transcribeAudio(uri, language = 'en') {
  if (!GROQ_API_KEY) {
    // No API key configured — return empty so user can type manually
    return { ok: false, text: '', error: 'no_api_key' };
  }

  try {
    // Build multipart form data
    const formData = new FormData();
    formData.append('file', {
      uri,
      type: 'audio/m4a',
      name: 'recording.m4a',
    });
    formData.append('model', 'whisper-large-v3');
    formData.append('language', language === 'hi-IN' ? 'hi' : 'en');
    formData.append('response_format', 'json');

    const res = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        // Don't set Content-Type - fetch sets it automatically with boundary
      },
      body: formData,
    });

    if (!res.ok) {
      const err = await res.text();
      return { ok: false, text: '', error: err };
    }

    const data = await res.json();
    return { ok: true, text: data.text?.trim() || '' };
  } catch (e) {
    return { ok: false, text: '', error: e.message };
  }
}
