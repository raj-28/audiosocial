// src/utils/transcribe.js
// Transcribes audio using Groq Whisper API
// Free tier: 7200 seconds/day — more than enough for development
// Sign up free at: console.groq.com
// Same API format as OpenAI Whisper

import * as FileSystem from 'expo-file-system';

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
    // Use expo-file-system instead of fetch for reliable FormData uploads on Android
    const res = await FileSystem.uploadAsync(GROQ_URL, uri, {
      httpMethod: 'POST',
      uploadType: FileSystem.FileSystemUploadType.MULTIPART,
      fieldName: 'file',
      mimeType: 'audio/m4a',
      parameters: {
        model: 'whisper-large-v3',
        language: language === 'hi-IN' ? 'hi' : 'en',
        response_format: 'json',
      },
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
      },
    });

    if (res.status !== 200) {
      return { ok: false, text: '', error: res.body };
    }

    const data = JSON.parse(res.body);
    return { ok: true, text: data.text?.trim() || '' };
  } catch (e) {
    return { ok: false, text: '', error: e.message };
  }
}
