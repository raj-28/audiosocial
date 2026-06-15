// src/screens/CreateScreen.js
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Animated, Easing, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { C, MOODS } from '../utils/constants';
import { detectMood, getMood } from '../utils/helpers';
import { MoodPill } from '../components/SharedUI';
import { transcribeAudio } from '../utils/transcribe';

const MOOD_LIST = Object.keys(MOODS);
const MAX_DURATION = 30;

// ─── WAVEFORM ─────────────────────────────────────────────────
function Waveform({ isRecording, amplitude }) {
  const bars = 28;
  return (
    <View style={wfStyles.container}>
      {Array.from({ length: bars }).map((_, i) => {
        const dist = Math.abs(i - bars / 2) / (bars / 2);
        const baseH = 4 + Math.abs(Math.sin(i * 0.7)) * 10;
        const liveH = isRecording
          ? 6 + amplitude * 32 * (1 - dist * 0.4) * (0.5 + Math.random() * 0.5)
          : baseH;
        return (
          <View
            key={i}
            style={[
              wfStyles.bar,
              {
                height: Math.max(3, liveH),
                backgroundColor: isRecording
                  ? `rgba(255,51,102,${0.4 + (1 - dist) * 0.55})`
                  : 'rgba(255,255,255,0.12)',
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const wfStyles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', gap: 3, height: 52, justifyContent: 'center', width: '100%' },
  bar: { width: 3, borderRadius: 99, minHeight: 3 },
});

// ─── MOOD SELECTOR ────────────────────────────────────────────
function MoodSelector({ selected, onSelect }) {
  return (
    <View style={{ marginBottom: 20 }}>
      <Text style={crStyles.pickerLabel}>mood</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 2 }}>
        {MOOD_LIST.map(key => {
          const m = MOODS[key];
          const active = selected === key;
          return (
            <TouchableOpacity
              key={key}
              testID={`mood-btn-${key}`}
              onPress={() => onSelect(key)}
              style={[crStyles.moodPill, {
                backgroundColor: active ? m.color + '33' : C.surface,
                borderColor: active ? m.color : C.border,
              }]}
            >
              <Ionicons name={m.icon} size={12} color={m.color} />
              <Text style={[crStyles.moodPillText, { color: active ? m.color : C.muted }]}>
                {m.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

// ─── POST PREVIEW ─────────────────────────────────────────────
function PostPreview({ text, setText, mood, setMood, elapsed, onBack, onPost }) {
  const m = getMood(mood);
  const [zone, setZone] = useState('PULSE');
  const [dissolve, setDissolve] = useState('48h');

  return (
    <ScrollView
      contentContainerStyle={crStyles.previewScroll}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Header */}
      <View style={crStyles.previewHeader}>
        <TouchableOpacity testID="preview-back-btn" onPress={onBack} style={crStyles.backBtn}>
          <Ionicons name="arrow-back" size={16} color={C.sub} />
          <Text style={crStyles.backBtnText}>back</Text>
        </TouchableOpacity>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Ionicons name="mic" size={12} color={C.ghost} />
          <Text style={{ fontFamily: 'PlusJakartaSans_400Regular', fontSize: 11, color: C.ghost }}>
            {elapsed}s recorded
          </Text>
        </View>
      </View>

      {/* Editable quote */}
      <View style={crStyles.quoteBox}>
        <Text style={crStyles.quoteHint}>tap to edit your voice</Text>
        <TextInput
          testID="preview-text-input"
          value={text}
          onChangeText={v => { setText(v); setMood(detectMood(v)); }}
          multiline
          style={[crStyles.quoteText, { color: m.color }]}
          placeholder="what did you say..."
          placeholderTextColor={C.ghost}
        />
      </View>

      {/* Mood */}
      <MoodSelector selected={mood} onSelect={setMood} />

      {/* Zone */}
      <Text style={crStyles.pickerLabel}>who hears this</Text>
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
        {[
          ['PULSE',  'radio-outline',  'nearby',   '#FF3366'],
          ['ECHO',   'radio',          'region',   '#FACC15'],
          ['SIGNAL', 'globe-outline',  'national', '#60A5FA'],
        ].map(([z, icon, lbl, zc]) => (
          <TouchableOpacity
            key={z}
            testID={`zone-btn-${z}`}
            onPress={() => setZone(z)}
            style={[crStyles.zonePick, zone === z && { backgroundColor: zc + '18', borderColor: zc + '55' }]}
          >
            <Ionicons name={icon} size={18} color={zone === z ? zc : C.ghost} />
            <Text style={[crStyles.zonePickLabel, zone === z && { color: zc }]}>{z}</Text>
            <Text style={crStyles.zonePickSub}>{lbl}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Dissolve */}
      <Text style={crStyles.pickerLabel}>how long it stays</Text>
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 28 }}>
        {[['6h', 'Spark'], ['48h', 'Ember'], ['7d', 'Carved']].map(([lbl, sub]) => (
          <TouchableOpacity
            key={lbl}
            testID={`dissolve-btn-${lbl}`}
            onPress={() => setDissolve(lbl)}
            style={[crStyles.dissolvePick, dissolve === lbl && crStyles.dissolvePickActive]}
          >
            <Text style={[crStyles.dissolveLabel, dissolve === lbl && { color: C.text }]}>{lbl}</Text>
            <Text style={crStyles.dissolveSub}>{sub}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Release */}
      <TouchableOpacity
        testID="release-btn"
        onPress={onPost}
        disabled={text.trim().length < 2}
        style={[crStyles.releaseBtn, { opacity: text.trim().length < 2 ? 0.4 : 1 }]}
      >
        <Ionicons name="send" size={16} color={C.bg} />
        <Text style={crStyles.releaseBtnText}>release it</Text>
      </TouchableOpacity>
      <Text style={crStyles.releaseNote}>no names · no followers · just signal</Text>
    </ScrollView>
  );
}

// ─── MAIN CREATE SCREEN ───────────────────────────────────────
export default function CreateScreen({ onPost, onClose }) {
  const insets = useSafeAreaInsets();

  // Step: 'record' | 'transcribing' | 'preview'
  const [step, setStep] = useState('record');
  const [mode, setMode] = useState('voice'); // 'voice' | 'type'
  const [lang, setLang] = useState('en-IN');

  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [amplitude, setAmplitude] = useState(0);
  const recordingRef = useRef(null);
  const audioUriRef = useRef(null);
  const timerRef = useRef(null);
  const ampTimerRef = useRef(null);

  // Text + mood
  const [text, setText] = useState('');
  const [mood, setMood] = useState('EXHAUSTION');
  const [typeText, setTypeText] = useState('');
  const [err, setErr] = useState('');
  const [transcribing, setTranscribing] = useState(false);

  // Pulse animation for mic button
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseLoop = useRef(null);

  useEffect(() => {
    if (isRecording) {
      pulseLoop.current = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.14, duration: 500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1,    duration: 500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      );
      pulseLoop.current.start();
    } else {
      pulseLoop.current?.stop();
      pulseAnim.setValue(1);
    }
  }, [isRecording]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearInterval(timerRef.current);
      clearInterval(ampTimerRef.current);
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync().catch(() => {});
      }
    };
  }, []);

  async function startRecording() {
    setErr('');
    setElapsed(0);
    setAmplitude(0);

    try {
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) {
        setErr('Microphone permission denied. Go to Settings > gripX > Microphone.');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      recordingRef.current = recording;
      setIsRecording(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Timer
      timerRef.current = setInterval(() => {
        setElapsed(e => {
          if (e >= MAX_DURATION) { stopRecording(); return MAX_DURATION; }
          return e + 1;
        });
      }, 1000);

      // Amplitude (simulated — expo-av doesn't expose real-time amplitude easily)
      ampTimerRef.current = setInterval(() => {
        setAmplitude(0.3 + Math.random() * 0.7);
      }, 80);

    } catch (e) {
      setErr('Could not start recording: ' + e.message);
    }
  }

  async function stopRecording() {
    clearInterval(timerRef.current);
    clearInterval(ampTimerRef.current);
    setIsRecording(false);
    setAmplitude(0);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (!recordingRef.current) return;

    try {
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      audioUriRef.current = uri;
      recordingRef.current = null;

      if (!uri) {
        setErr('Recording failed. Please try again.');
        return;
      }

      // Transcription temporarily bypassed.
      // Set a default text so the post can be released immediately with just the audio.
      setText('🎙️ Voice Note');
      setMood('EXHAUSTION'); // Default mood or we could try detectMood('🎙️ Voice Note')
      setStep('preview');

    } catch (e) {
      setTranscribing(false);
      setStep('record');
      setErr('Recording error: ' + e.message);
    }
  }

  function handleTypeNext() {
    const t = typeText.trim();
    if (t.length < 2) { setErr('Write something first!'); return; }
    setText(t);
    setMood(detectMood(t));
    setStep('preview');
  }

  function doPost() {
    const t = text.trim();
    if (t.length < 2) return;
    onPost({
      text: t,
      dur: elapsed || Math.max(8, Math.min(30, Math.ceil(t.split(' ').length * 0.6))),
      mood,
      audioUri: audioUriRef.current,
    });
  }

  // ── TRANSCRIBING STATE ─────────────────────────────────────
  if (step === 'transcribing') {
    return (
      <View style={[crStyles.container, { paddingTop: insets.top || 0 }]}>
        <View style={crStyles.header}>
          <View style={{ width: 36 }} />
          <Text style={crStyles.brand}>gripX</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 20 }}>
          <ActivityIndicator size="large" color={C.brand} />
          <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 18, color: C.text }}>
            transcribing your voice...
          </Text>
          <Text style={{ fontFamily: 'PlusJakartaSans_400Regular', fontSize: 13, color: C.muted }}>
            this takes 1-2 seconds
          </Text>
        </View>
      </View>
    );
  }

  // ── PREVIEW STATE ──────────────────────────────────────────
  if (step === 'preview') {
    return (
      <View style={[crStyles.container, { paddingTop: insets.top || 0 }]}>
        <View style={crStyles.header}>
          <TouchableOpacity testID="create-close-btn" onPress={onClose} style={crStyles.closeBtn}>
            <Ionicons name="close" size={20} color={C.text} />
          </TouchableOpacity>
          <Text style={crStyles.brand}>gripX</Text>
          <View style={{ width: 36 }} />
        </View>

        {err ? (
          <View style={crStyles.errBanner}>
            <Ionicons name="information-circle-outline" size={14} color={C.error} />
            <Text style={crStyles.errBannerText}>{err}</Text>
            <TouchableOpacity onPress={() => setErr('')}>
              <Ionicons name="close" size={14} color={C.error} />
            </TouchableOpacity>
          </View>
        ) : null}

        <PostPreview
          text={text}
          setText={setText}
          mood={mood}
          setMood={setMood}
          elapsed={elapsed}
          onBack={() => { setStep('record'); setErr(''); setText(''); setElapsed(0); }}
          onPost={doPost}
        />
      </View>
    );
  }

  // ── RECORD STATE ───────────────────────────────────────────
  return (
    <View style={[crStyles.container, { paddingTop: insets.top || 0 }]}>
      {/* Header */}
      <View style={crStyles.header}>
        <TouchableOpacity testID="create-close-btn" onPress={onClose} style={crStyles.closeBtn}>
          <Ionicons name="close" size={20} color={C.text} />
        </TouchableOpacity>
        <Text style={crStyles.brand}>gripX</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={crStyles.inputScroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={crStyles.heading}>
          say it.{'\n'}
          <Text style={crStyles.headingSub}>no filter.</Text>
        </Text>

        {/* Mode toggle */}
        <View style={crStyles.modeRow}>
          {[['voice', 'mic', 'voice'], ['type', 'pencil', 'type it']].map(([id, icon, label]) => (
            <TouchableOpacity
              key={id}
              testID={`mode-btn-${id}`}
              onPress={() => { setMode(id); setErr(''); }}
              style={[crStyles.modeBtn, mode === id && crStyles.modeBtnActive]}
            >
              <Ionicons name={icon} size={14} color={mode === id ? C.text : C.muted} />
              <Text style={[crStyles.modeBtnText, mode === id && { color: C.text }]}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── VOICE MODE ── */}
        {mode === 'voice' && (
          <View style={{ alignItems: 'center' }}>
            {/* Language picker */}
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 24 }}>
              {[['en-IN', 'English'], ['hi-IN', 'Hindi'], ['en-US', 'EN-US']].map(([id, lbl]) => (
                <TouchableOpacity
                  key={id}
                  testID={`lang-${id}`}
                  onPress={() => !isRecording && setLang(id)}
                  style={[crStyles.langBtn, lang === id && crStyles.langBtnActive, isRecording && { opacity: 0.45 }]}
                >
                  <Text style={[crStyles.langBtnText, lang === id && { color: C.brand }]}>{lbl}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Waveform */}
            <Waveform isRecording={isRecording} amplitude={amplitude} />

            {/* Timer bar */}
            {isRecording && (
              <View style={{ width: '100%', marginTop: 12, marginBottom: 4 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <View style={crStyles.recDot} />
                    <Text style={crStyles.recLabel}>recording</Text>
                  </View>
                  <Text style={crStyles.timerText}>{elapsed}s / {MAX_DURATION}s</Text>
                </View>
                <View style={crStyles.timerTrack}>
                  <View style={[crStyles.timerFill, {
                    width: `${(elapsed / MAX_DURATION) * 100}%`,
                    backgroundColor: elapsed > 24 ? C.brand : C.muted,
                  }]} />
                </View>
              </View>
            )}

            {/* Mic button */}
            <View style={{ alignItems: 'center', marginTop: 24, gap: 10 }}>
              <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                <TouchableOpacity
                  testID="record-btn"
                  onPress={isRecording ? stopRecording : startRecording}
                  style={[
                    crStyles.micBtn,
                    isRecording && { backgroundColor: C.brand, borderColor: C.brand },
                  ]}
                >
                  <Ionicons
                    name={isRecording ? 'stop' : 'mic'}
                    size={40}
                    color={isRecording ? C.bg : C.text}
                  />
                </TouchableOpacity>
              </Animated.View>
              <Text style={crStyles.micHint}>
                {isRecording ? 'tap to stop · max 30s' : 'tap to start recording'}
              </Text>
              {!isRecording && (
                <Text style={crStyles.micSubHint}>
                  your voice will be auto-transcribed
                </Text>
              )}
            </View>
          </View>
        )}

        {/* ── TYPE MODE ── */}
        {mode === 'type' && (
          <View>
            <TextInput
              testID="type-input"
              value={typeText}
              onChangeText={v => { setTypeText(v); setErr(''); }}
              placeholder={'Politics, love, NEET, 3am...\nHindi, English, Hinglish — sab chalega.'}
              placeholderTextColor={C.ghost}
              multiline
              autoFocus
              style={crStyles.typeInput}
            />

            {/* Live mood detection */}
            {typeText.length > 5 && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <Text style={{ fontFamily: 'PlusJakartaSans_400Regular', fontSize: 11, color: C.ghost }}>
                  detected:
                </Text>
                <MoodPill mood={detectMood(typeText)} />
              </View>
            )}

            <TouchableOpacity
              testID="type-next-btn"
              onPress={handleTypeNext}
              disabled={typeText.trim().length < 2}
              style={[crStyles.proceedBtn, typeText.trim().length < 2 && { opacity: 0.4 }]}
            >
              <Text style={crStyles.proceedBtnText}>preview →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Error */}
        {err ? (
          <View style={crStyles.errBox}>
            <Ionicons name="alert-circle-outline" size={14} color={C.error} />
            <Text style={crStyles.errText}>{err}</Text>
          </View>
        ) : null}

      </ScrollView>
    </View>
  );
}

const crStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  closeBtn: {
    width: 36, height: 36, borderRadius: 99,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center',
  },
  brand: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 10, color: C.brand, letterSpacing: 2.5, textTransform: 'uppercase' },

  inputScroll: { padding: 24, paddingBottom: 48 },
  heading: { fontFamily: 'Outfit_800ExtraBold', fontSize: 28, color: C.text, lineHeight: 34, letterSpacing: -1, marginBottom: 24 },
  headingSub: { fontFamily: 'Outfit_500Medium', fontSize: 24, color: C.muted },

  modeRow: {
    flexDirection: 'row', gap: 4,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 99, padding: 4, marginBottom: 28,
  },
  modeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 9, borderRadius: 99 },
  modeBtnActive: { backgroundColor: 'rgba(255,255,255,0.1)' },
  modeBtnText: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 12, color: C.muted },

  langBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 99, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: C.border },
  langBtnActive: { backgroundColor: 'rgba(255,51,102,0.15)', borderColor: 'rgba(255,51,102,0.4)' },
  langBtnText: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 12, color: C.muted },

  recDot: { width: 8, height: 8, borderRadius: 99, backgroundColor: C.brand },
  recLabel: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 11, color: C.brand },
  timerText: { fontFamily: 'Outfit_700Bold', fontSize: 12, color: C.sub },
  timerTrack: { height: 3, backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 99, overflow: 'hidden' },
  timerFill: { height: 3, borderRadius: 99 },

  micBtn: {
    width: 96, height: 96, borderRadius: 99,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1.5, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center',
  },
  micHint: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 12, color: C.sub },
  micSubHint: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 11, color: C.ghost },

  typeInput: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1, borderColor: C.border, borderRadius: 16,
    padding: 16, color: C.text,
    fontFamily: 'PlusJakartaSans_400Regular', fontSize: 15,
    minHeight: 160, textAlignVertical: 'top', marginBottom: 14,
  },

  errBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: 'rgba(251,113,133,0.08)', borderRadius: 12, padding: 12, marginTop: 14 },
  errText: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 12, color: C.error, flex: 1 },
  errBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(251,113,133,0.08)', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(251,113,133,0.2)' },
  errBannerText: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 11, color: C.error, flex: 1 },

  proceedBtn: { backgroundColor: C.text, borderRadius: 99, paddingVertical: 15, alignItems: 'center' },
  proceedBtnText: { fontFamily: 'Outfit_800ExtraBold', fontSize: 15, color: C.bg },

  // Preview
  previewScroll: { padding: 20, paddingBottom: 48 },
  previewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1, borderColor: C.border, borderRadius: 99, paddingHorizontal: 12, paddingVertical: 6 },
  backBtnText: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 11, color: C.sub },
  quoteBox: { marginBottom: 24 },
  quoteHint: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 9, color: C.ghost, letterSpacing: 2, textTransform: 'uppercase', textAlign: 'center', marginBottom: 10 },
  quoteText: { fontFamily: 'Outfit_700Bold', fontSize: 22, lineHeight: 30, letterSpacing: -0.6, textAlign: 'center', minHeight: 80, textAlignVertical: 'top' },

  pickerLabel: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 9, color: C.ghost, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 10 },
  moodPill: { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderRadius: 99, paddingHorizontal: 10, paddingVertical: 6 },
  moodPillText: { fontFamily: 'Outfit_700Bold', fontSize: 9, letterSpacing: 1 },

  zonePick: { flex: 1, paddingVertical: 10, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: C.border, alignItems: 'center', gap: 4 },
  zonePickLabel: { fontFamily: 'Outfit_700Bold', fontSize: 9, color: C.muted },
  zonePickSub: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 8, color: C.ghost },

  dissolvePick: { flex: 1, paddingVertical: 10, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: C.border, borderRadius: 12, alignItems: 'center', gap: 4 },
  dissolvePickActive: { backgroundColor: 'rgba(255,51,102,0.15)', borderColor: 'rgba(255,51,102,0.4)' },
  dissolveLabel: { fontFamily: 'Outfit_700Bold', fontSize: 12, color: C.sub },
  dissolveSub: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 9, color: C.ghost },

  releaseBtn: { backgroundColor: C.text, borderRadius: 99, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  releaseBtnText: { fontFamily: 'Outfit_800ExtraBold', fontSize: 15, color: C.bg },
  releaseNote: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 10, color: C.ghost, textAlign: 'center', marginTop: 10 },
});
