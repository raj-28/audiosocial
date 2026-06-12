// supabase/functions/transcribe/index.ts
// Edge Function: transcribe audio using Groq Whisper
// Deploy: supabase functions deploy transcribe

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY') ?? '';
const GROQ_URL = 'https://api.groq.com/openai/v1/audio/transcriptions';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    // Verify user is authenticated
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401, headers: corsHeaders });

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401, headers: corsHeaders });

    // Get audio from request
    const formData = await req.formData();
    const audioFile = formData.get('file') as File;
    const language = formData.get('language') as string || 'en';

    if (!audioFile) return new Response(JSON.stringify({ error: 'no audio file' }), { status: 400, headers: corsHeaders });

    if (!GROQ_API_KEY) return new Response(JSON.stringify({ error: 'no_api_key', text: '' }), { status: 200, headers: corsHeaders });

    // Send to Groq Whisper
    const groqForm = new FormData();
    groqForm.append('file', audioFile, 'recording.m4a');
    groqForm.append('model', 'whisper-large-v3');
    groqForm.append('language', language === 'hi-IN' ? 'hi' : 'en');
    groqForm.append('response_format', 'json');

    const groqRes = await fetch(GROQ_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${GROQ_API_KEY}` },
      body: groqForm,
    });

    if (!groqRes.ok) {
      const err = await groqRes.text();
      return new Response(JSON.stringify({ error: err, text: '' }), { status: 200, headers: corsHeaders });
    }

    const data = await groqRes.json();
    return new Response(JSON.stringify({ ok: true, text: data.text?.trim() || '' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders });
  }
});
