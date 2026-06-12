// App.js — Root with Supabase backend + mock data fallback
import React, { useState, useEffect, useCallback } from 'react';
import { View, Modal, StyleSheet, LogBox, Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import {
  useFonts,
  Outfit_400Regular, Outfit_500Medium, Outfit_600SemiBold,
  Outfit_700Bold, Outfit_800ExtraBold,
} from '@expo-google-fonts/outfit';
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { Ionicons } from '@expo/vector-icons';

import { C, SEED_POSTS } from './src/utils/constants';
import { detectMood } from './src/utils/helpers';

// Services — with graceful fallback if Supabase not configured
import { restoreSession, logout, DEMO_USER } from './src/auth/auth';
import * as PostSvc   from './src/services/postService';
import * as SwarmSvc  from './src/services/swarmService';

import OnboardingScreen from './src/screens/OnboardingScreen';
import AuthScreen       from './src/screens/AuthScreen';
import FeedScreen       from './src/screens/FeedScreen';
import JantaScreen      from './src/screens/JantaScreen';
import PulseScreen      from './src/screens/PulseScreen';
import SwarmScreen      from './src/screens/SwarmScreen';
import ProfileScreen    from './src/screens/ProfileScreen';
import CreateScreen     from './src/screens/CreateScreen';
import BottomNav        from './src/navigation/BottomNav';

LogBox.ignoreLogs([
  'Non-serializable values',
  'fontFamily',
  'Some of your fonts',
  'Sending `onAnimatedValueUpdate`',
  'new NativeEventEmitter',
]);
Text.defaultProps = Text.defaultProps || {};
Text.defaultProps.allowFontScaling = false;

// Check if Supabase is configured
import { SUPABASE_URL } from './src/services/supabase';
const SUPABASE_CONFIGURED = !SUPABASE_URL.includes('YOUR_PROJECT');

export default function App() {
  // ── Fonts with 3s timeout ──────────────────────────────────
  const [fontsLoaded] = useFonts({
    Outfit_400Regular, Outfit_500Medium, Outfit_600SemiBold,
    Outfit_700Bold, Outfit_800ExtraBold,
    PlusJakartaSans_400Regular, PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
  });
  const [fontTimeout, setFontTimeout] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setFontTimeout(true), 3000);
    return () => clearTimeout(t);
  }, []);
  const ready = fontsLoaded || fontTimeout;

  // ── App state ──────────────────────────────────────────────
  const [appState, setAppState] = useState('loading');
  const [currentUser, setCurrentUser] = useState(null);
  const [tab, setTab] = useState('feed');
  const [posts, setPosts] = useState(SEED_POSTS);
  const [interactions, setInteractions] = useState({
    echoed: new Set(),
    pulsed: new Set(),
  });
  const [userPts, setUserPts] = useState(240);
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(false);

  // ── Boot sequence ──────────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => setAppState('onboarding'), 2500);
    restoreSession()
      .then(user => {
        clearTimeout(timer);
        if (user) {
          setCurrentUser(user);
          setUserPts(user.pts || 240);
          setAppState('app');
          if (SUPABASE_CONFIGURED) loadFeed();
        } else {
          setAppState('onboarding');
        }
      })
      .catch(() => { clearTimeout(timer); setAppState('onboarding'); });
  }, []);

  // ── Load feed from Supabase ────────────────────────────────
  const loadFeed = useCallback(async () => {
    if (!SUPABASE_CONFIGURED) return;
    try {
      const [feedRes, echoedSet] = await Promise.all([
        PostSvc.getFeed({ limit: 20 }),
        PostSvc.getUserEchoes(),
      ]);
      if (feedRes.ok && feedRes.posts.length > 0) {
        // Merge with seed posts so app always has content
        const dbPosts = feedRes.posts.map(p => ({
          id: p.id,
          topic: p.topic,
          mood: p.mood,
          text: p.text,
          dur: p.duration_secs,
          echoes: p.echo_count,
          pulse: p.pulse_score,
          pts: 0,
          zone: p.zone,
          reach: p.reach,
          ts: new Date(p.created_at).getTime(),
          audioUrl: p.audio_url,
          saved: false,
        }));
        setPosts(prev => {
          const ids = new Set(dbPosts.map(p => p.id));
          const seeds = prev.filter(p => !ids.has(p.id));
          return [...dbPosts, ...seeds];
        });
      }
      if (echoedSet.size > 0) {
        setInteractions(prev => ({ ...prev, echoed: echoedSet }));
      }
    } catch(e) {
      console.warn('Feed load failed, using seed data:', e.message);
    }
  }, []);

  // ── Auth handlers ──────────────────────────────────────────
  function handleAuth(user) {
    setCurrentUser(user);
    setUserPts(user.pts || 10);
    setAppState('app');
    if (SUPABASE_CONFIGURED) loadFeed();
  }

  async function handleLogout() {
    await logout();
    setCurrentUser(null);
    setAppState('onboarding');
    setTab('feed');
    setPosts(SEED_POSTS);
    setInteractions({ echoed: new Set(), pulsed: new Set() });
  }

  // ── Echo ───────────────────────────────────────────────────
  async function handleEcho(id) {
    // Optimistic update
    setInteractions(prev => {
      const echoed = new Set(prev.echoed);
      const was = echoed.has(id);
      was ? echoed.delete(id) : echoed.add(id);
      setPosts(p => p.map(post =>
        post.id === id
          ? { ...post, echoes: post.echoes + (was ? -1 : 1) }
          : post
      ));
      if (!was) setUserPts(p => p + 2);
      return { ...prev, echoed };
    });

    // Sync to DB
    if (SUPABASE_CONFIGURED && currentUser?.id !== 'demo') {
      try { await PostSvc.toggleEcho(id); } catch(e) { console.warn('Echo sync failed:', e.message); }
    }
  }

  // ── Pulse ──────────────────────────────────────────────────
  function handlePulse(id) {
    setInteractions(prev => {
      const pulsed = new Set(prev.pulsed);
      const was = pulsed.has(id);
      was ? pulsed.delete(id) : pulsed.add(id);
      return { ...prev, pulsed };
    });
  }

  // ── Save ───────────────────────────────────────────────────
  async function handleSave(id) {
    setPosts(p => p.map(post =>
      post.id === id ? { ...post, saved: !post.saved } : post
    ));
    if (SUPABASE_CONFIGURED && currentUser?.id !== 'demo') {
      try { await PostSvc.toggleSave(id); } catch(e) { console.warn('Save sync failed:', e.message); }
    }
  }

  // ── Create post ────────────────────────────────────────────
  async function handlePost({ text, dur, mood, audioUri }) {
    // Add to local state immediately (optimistic)
    const tempId = `temp_${Date.now()}`;
    const newPost = {
      id: tempId,
      topic: '3am', mood, text, dur,
      echoes: 0, pulse: 5.0, pts: 10,
      zone: 'PULSE', reach: 'nearby',
      ts: Date.now(), isOwn: true, saved: false,
      audioUri,
    };
    setPosts(p => [newPost, ...p]);
    setUserPts(p => p + 10);
    setShowCreate(false);
    if (tab !== 'feed') setTab('feed');

    // Sync to DB in background
    if (SUPABASE_CONFIGURED && currentUser?.id !== 'demo') {
      try {
        const res = await PostSvc.createPost({
          text, audioUri, mood, topic: '3am',
          zone: 'PULSE', reach: 'nearby',
          duration: dur, dissolveTimer: '48h',
        });
        if (res.ok) {
          // Replace temp post with real one
          setPosts(p => p.map(post =>
            post.id === tempId ? { ...newPost, id: res.post.id } : post
          ));
        }
      } catch(e) {
        console.warn('Post sync failed, keeping local:', e.message);
      }
    }
  }

  // ── SPLASH ────────────────────────────────────────────────
  if (!ready || appState === 'loading') {
    return (
      <View style={s.splash}>
        <StatusBar style="light" />
        <View style={s.splashOrb}>
          <Ionicons name="mic" size={40} color={C.brand} />
        </View>
        <Text style={s.splashBrand}>gripX</Text>
        <Text style={s.splashTag}>no names · no followers · just signal</Text>
      </View>
    );
  }

  if (appState === 'onboarding') {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <StatusBar style="light" />
          <OnboardingScreen onDone={() => setAppState('auth')} />
        </SafeAreaProvider>
      </GestureHandlerRootView>
    );
  }

  if (appState === 'auth') {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <StatusBar style="light" />
          <AuthScreen onAuth={handleAuth} />
        </SafeAreaProvider>
      </GestureHandlerRootView>
    );
  }

  // ── MAIN APP ──────────────────────────────────────────────
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" backgroundColor={C.bg} />
        <View style={s.app}>
          <View style={s.content}>
            {tab === 'feed'  && (
              <FeedScreen
                posts={posts}
                interactions={interactions}
                onEcho={handleEcho}
                onPulse={handlePulse}
                onSave={handleSave}
                onOpenCreate={() => setShowCreate(true)}
                addPts={n => setUserPts(p => p + n)}
              />
            )}
            {tab === 'janta' && (
              <JantaScreen
                posts={posts}
                interactions={interactions}
                onEcho={handleEcho}
                onOpenDetail={() => {}}
                onOpenCreate={() => setShowCreate(true)}
              />
            )}
            {tab === 'pulse' && <PulseScreen />}
            {tab === 'swarm' && <SwarmScreen onOpenCreate={() => setShowCreate(true)} />}
            {tab === 'me'    && (
              <ProfileScreen
                currentUser={currentUser}
                userPts={userPts}
                posts={posts}
                onLogout={handleLogout}
              />
            )}
          </View>

          <BottomNav tab={tab} setTab={setTab} userPts={userPts} />

          <Modal
            visible={showCreate}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={() => setShowCreate(false)}
          >
            <CreateScreen
              onPost={handlePost}
              onClose={() => setShowCreate(false)}
            />
          </Modal>
        </View>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const s = StyleSheet.create({
  splash: { flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center', gap: 16 },
  splashOrb: { width: 88, height: 88, borderRadius: 99, backgroundColor: 'rgba(255,51,102,0.15)', borderWidth: 1.5, borderColor: 'rgba(255,51,102,0.3)', alignItems: 'center', justifyContent: 'center' },
  splashBrand: { fontFamily: 'Outfit_800ExtraBold', fontSize: 28, color: C.text, letterSpacing: -1 },
  splashTag: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 11, color: C.ghost },
  app: { flex: 1, backgroundColor: C.bg },
  content: { flex: 1 },
});
