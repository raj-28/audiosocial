// src/screens/FeedScreen.js
import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, Dimensions, StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { C, MOODS, VOICE_REPLIES } from '../utils/constants';
import { timeAgo, formatCount, getMood } from '../utils/helpers';
import { MoodPill, ZoneDot, ProgressBar, Toast } from '../components/SharedUI';

const { height: SCREEN_H, width: SCREEN_W } = Dimensions.get('window');

// ─── VOICE REPLY ROW ──────────────────────────────────────────
function VoiceReplyRow({ reply, onEcho }) {
  const m = getMood(reply.mood);
  const [playing, setPlaying] = useState(false);
  const [prog, setProg] = useState(0);
  const intervalRef = useRef(null);

  function togglePlay() {
    if (playing) {
      clearInterval(intervalRef.current);
      setPlaying(false);
    } else {
      setPlaying(true);
      let elapsed = 0;
      intervalRef.current = setInterval(() => {
        elapsed += 0.1;
        const p = (elapsed / reply.duration) * 100;
        if (p >= 100) { clearInterval(intervalRef.current); setPlaying(false); setProg(0); }
        else setProg(p);
      }, 100);
    }
  }

  return (
    <View style={rrStyles.card}>
      <View style={rrStyles.header}>
        <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
          <MoodPill mood={reply.mood} />
          <Text style={rrStyles.anon}>@anonymous</Text>
        </View>
        <Text style={rrStyles.time}>{timeAgo(reply.ts)}</Text>
      </View>
      <TouchableOpacity testID="reply-play-btn" onPress={togglePlay} style={rrStyles.player}>
        <View style={[rrStyles.playBtn, { backgroundColor: playing ? m.color : m.color + '22', borderColor: m.color + '66' }]}>
          <Text style={{ fontSize: 12 }}>{playing ? '⏸' : '▶'}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={rrStyles.replyText}>"{reply.text}"</Text>
          <ProgressBar pct={prog} color={m.color} />
          <Text style={rrStyles.dur}>{reply.duration}s</Text>
        </View>
      </TouchableOpacity>
      <View style={rrStyles.footer}>
        <Text style={rrStyles.echoCount}>↩ {reply.echoes} echoes</Text>
        <TouchableOpacity testID="echo-reply-btn" onPress={() => onEcho(reply.id)} style={rrStyles.echoBtn}>
          <Text style={rrStyles.echoBtnText}>echo this</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const rrStyles = StyleSheet.create({
  card: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 16, padding: 14, marginBottom: 10 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  anon: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 10, color: C.muted },
  time: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 10, color: C.ghost },
  player: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 10, marginBottom: 10 },
  playBtn: { width: 32, height: 32, borderRadius: 99, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  replyText: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 13, color: C.sub, lineHeight: 19, marginBottom: 6, fontStyle: 'italic' },
  dur: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 9, color: C.ghost, marginTop: 3 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  echoCount: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 11, color: C.muted },
  echoBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 99, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: C.border },
  echoBtnText: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 11, color: C.sub },
});

// ─── FEED CARD ────────────────────────────────────────────────
function FeedCard({ post, hasEchoed, hasPulsed, onEcho, onPulse, onOpenDetail, onOpenCreate }) {
  const m = getMood(post.mood);
  const [playing, setPlaying] = useState(false);
  const [prog, setProg] = useState(0);
  const intervalRef = useRef(null);
  const replies = VOICE_REPLIES[post.id] || [];

  function togglePlay() {
    if (playing) {
      clearInterval(intervalRef.current);
      setPlaying(false);
    } else {
      setPlaying(true);
      let elapsed = 0;
      intervalRef.current = setInterval(() => {
        elapsed += 0.1;
        const p = (elapsed / post.dur) * 100;
        if (p >= 100) { clearInterval(intervalRef.current); setPlaying(false); setProg(0); }
        else setProg(p);
      }, 100);
    }
  }

  return (
    <View style={[cardStyles.container, { height: SCREEN_H }]}>
      {/* Mood glow bg */}
      <View style={[cardStyles.glow, { backgroundColor: m.color + '0C' }]} />

      {/* Top row */}
      <View style={cardStyles.topRow}>
        <MoodPill mood={post.mood} />
        <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
          <ZoneDot zone={post.zone} />
          <Text style={cardStyles.anonLabel}>@anon</Text>
        </View>
      </View>

      {/* Main quote + player */}
      <TouchableOpacity testID={`feed-card-play-${post.id}`} onPress={togglePlay} style={cardStyles.quoteArea} activeOpacity={0.8}>
        <Text style={[cardStyles.quoteText, playing && { textShadowColor: m.color, textShadowRadius: 20 }]}>
          "{post.text}"
        </Text>
        <View style={cardStyles.playerRow}>
          <View style={[cardStyles.playCircle, { backgroundColor: playing ? m.color : m.color + '22', borderColor: m.color + '66' }]}>
            <Text style={{ fontSize: 14 }}>{playing ? '⏸' : '▶'}</Text>
          </View>
          <View style={{ width: 140 }}>
            <ProgressBar pct={prog} color={m.color} />
            <Text style={cardStyles.durText}>{post.dur}s voice note</Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* Stats + action buttons */}
      <View style={cardStyles.bottomRow}>
        <View>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 4 }}>
            <Text style={cardStyles.stat}>↩ {formatCount(post.echoes)}</Text>
            <Text style={cardStyles.dot}>·</Text>
            <Text style={[cardStyles.stat, { color: '#FACC15' }]}>⚡ {post.pulse}/10</Text>
            <Text style={cardStyles.dot}>·</Text>
            <Text style={[cardStyles.stat, { color: '#D4AF37' }]}>pts {post.pts}</Text>
          </View>
          <Text style={cardStyles.reach}>Reached {post.reach}</Text>
        </View>

        <View style={{ gap: 18, alignItems: 'center' }}>
          <TouchableOpacity
            testID={`echo-btn-${post.id}`}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onEcho(post.id); }}
            style={{ alignItems: 'center', gap: 3 }}
          >
            <Text style={[cardStyles.actionIcon, hasEchoed && { color: m.color }]}>↩</Text>
            <Text style={[cardStyles.actionCount, hasEchoed && { color: m.color }]}>{formatCount(post.echoes)}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            testID={`pulse-btn-${post.id}`}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onPulse(post.id); }}
            style={{ alignItems: 'center', gap: 3 }}
          >
            <Text style={[cardStyles.actionIcon, hasPulsed && { color: '#FACC15' }]}>⚡</Text>
            <Text style={[cardStyles.actionCount, hasPulsed && { color: '#FACC15' }]}>{Math.floor(post.pulse * 10)}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            testID={`replies-btn-${post.id}`}
            onPress={() => onOpenDetail(post)}
            style={{ alignItems: 'center', gap: 3 }}
          >
            <Text style={cardStyles.actionIcon}></Text>
            <Text style={cardStyles.actionCount}>{replies.length}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const cardStyles = StyleSheet.create({
  container: { backgroundColor: C.bg, padding: 20, paddingTop: 64, paddingBottom: 100, position: 'relative' },
  glow: { ...StyleSheet.absoluteFillObject, opacity: 0.8 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  anonLabel: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 11, color: C.ghost },
  quoteArea: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  quoteText: { fontFamily: 'Outfit_700Bold', fontSize: 26, color: C.text, lineHeight: 34, letterSpacing: -0.7, textAlign: 'center', marginBottom: 20 },
  playerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  playCircle: { width: 44, height: 44, borderRadius: 99, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  durText: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 10, color: C.ghost, marginTop: 4 },
  bottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  stat: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 11, color: C.sub },
  dot: { color: C.ghost },
  reach: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 10, color: C.ghost },
  actionIcon: { fontSize: 22, color: C.muted },
  actionCount: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 10, color: C.ghost },
});

// ─── POST DETAIL MODAL ────────────────────────────────────────
function PostDetailModal({ post, onClose, onRecord }) {
  const m = getMood(post.mood);
  const [playing, setPlaying] = useState(false);
  const [prog, setProg] = useState(0);
  const intervalRef = useRef(null);
  const replies = VOICE_REPLIES[post.id] || [];

  function togglePlay() {
    if (playing) { clearInterval(intervalRef.current); setPlaying(false); }
    else {
      setPlaying(true);
      let e = 0;
      intervalRef.current = setInterval(() => {
        e += 0.1;
        const p = (e / post.dur) * 100;
        if (p >= 100) { clearInterval(intervalRef.current); setPlaying(false); setProg(0); }
        else setProg(p);
      }, 100);
    }
  }

  return (
    <View style={detailStyles.container}>
      {/* Header */}
      <View style={detailStyles.header}>
        <TouchableOpacity testID="detail-close-btn" onPress={onClose} style={detailStyles.closeBtn}>
          <Text style={{ color: C.text, fontSize: 18 }}>←</Text>
        </TouchableOpacity>
        <MoodPill mood={post.mood} size="lg" />
        <ZoneDot zone={post.zone} />
      </View>

      <FlatList
        data={replies}
        keyExtractor={r => r.id}
        ListHeaderComponent={() => (
          <View>
            <View style={{ position: 'relative', padding: 20 }}>
              <TouchableOpacity onPress={togglePlay} activeOpacity={0.8} style={{ alignItems: 'center' }}>
                <Text style={[detailStyles.quoteText, playing && { textShadowColor: m.color, textShadowRadius: 20 }]}>
                  "{post.text}"
                </Text>
                <View style={detailStyles.playerRow}>
                  <View style={[detailStyles.playCircle, { backgroundColor: playing ? m.color : m.color + '22', borderColor: m.color + '66' }]}>
                    <Text>{playing ? '⏸' : '▶'}</Text>
                  </View>
                  <View style={{ width: 160 }}>
                    <ProgressBar pct={prog} color={m.color} />
                    <Text style={detailStyles.durText}>{post.dur}s voice note</Text>
                  </View>
                </View>
              </TouchableOpacity>
              <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 10, marginTop: 10 }}>
                <Text style={{ color: C.sub, fontSize: 12 }}>↩ {formatCount(post.echoes)}</Text>
                <Text style={{ color: C.ghost }}>·</Text>
                <Text style={{ color: '#FACC15', fontSize: 12 }}>⚡ {post.pulse}/10</Text>
              </View>
              <Text style={{ textAlign: 'center', color: C.ghost, fontSize: 10, marginTop: 4 }}>
                Reached {post.reach} · {timeAgo(post.ts)}
              </Text>
            </View>
            <View style={{ height: 1, backgroundColor: C.border }} />
            <View style={{ padding: 20, paddingBottom: 8 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 }}>
                <Text style={{ fontFamily: 'PlusJakartaSans_700Bold', fontSize: 11, color: C.muted, letterSpacing: 1.2, textTransform: 'uppercase' }}>
                  {replies.length} voice replies
                </Text>
                <Text style={{ fontFamily: 'PlusJakartaSans_400Regular', fontSize: 10, color: C.ghost }}>tap to play</Text>
              </View>
            </View>
          </View>
        )}
        renderItem={({ item }) => (
          <View style={{ paddingHorizontal: 20 }}>
            <VoiceReplyRow reply={item} onEcho={() => {}} />
          </View>
        )}
        ListEmptyComponent={() => (
          <View style={{ alignItems: 'center', padding: 32 }}>
            <Text style={{ fontFamily: 'Outfit_400Regular', fontSize: 16, color: C.ghost }}>be the first to reply</Text>
          </View>
        )}
        contentContainerStyle={{ paddingBottom: 100 }}
      />

      {/* Reply CTA */}
      <View style={detailStyles.replyBar}>
        <TouchableOpacity testID="voice-reply-btn" onPress={onRecord} style={detailStyles.replyBtn}>
          <Text style={{ fontSize: 18 }}></Text>
          <Text style={detailStyles.replyBtnText}>reply with your voice</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const detailStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 52, backgroundColor: 'rgba(8,8,10,0.97)', borderBottomWidth: 1, borderBottomColor: C.border },
  closeBtn: { width: 36, height: 36, borderRadius: 99, backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  quoteText: { fontFamily: 'Outfit_700Bold', fontSize: 22, color: C.text, lineHeight: 30, letterSpacing: -0.6, textAlign: 'center', marginBottom: 16 },
  playerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  playCircle: { width: 38, height: 38, borderRadius: 99, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  durText: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 10, color: C.ghost, marginTop: 4 },
  replyBar: { padding: 16, paddingBottom: 28, borderTopWidth: 1, borderTopColor: C.border, backgroundColor: 'rgba(8,8,10,0.97)' },
  replyBtn: { backgroundColor: C.brand, borderRadius: 99, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  replyBtnText: { fontFamily: 'Outfit_800ExtraBold', fontSize: 15, color: C.bg },
});

// ─── FEED SCREEN ──────────────────────────────────────────────
export default function FeedScreen({ posts, interactions, onEcho, onPulse, onOpenCreate, addPts }) {
  const insets = useSafeAreaInsets();
  const [detailPost, setDetailPost] = useState(null);
  const [toast, setToast] = useState('');
  const flatRef = useRef(null);

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(''), 2400); }

  function handleEcho(id) {
    onEcho(id);
    showToast(interactions.echoed.has(id) ? 'echo removed' : 'echoed ↩ +2 pts');
  }

  function handlePulse(id) {
    onPulse(id);
    showToast(interactions.pulsed.has(id) ? 'pulse removed' : 'pulse sent ⚡');
  }

  if (detailPost) {
    return (
      <PostDetailModal
        post={detailPost}
        onClose={() => setDetailPost(null)}
        onRecord={() => { setDetailPost(null); onOpenCreate(); }}
      />
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />

      {/* Status bar overlay */}
      <View style={[feedStyles.statusOverlay, { paddingTop: insets.top || 12 }]}>
        <Text style={feedStyles.time}>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}</Text>
        <Text style={feedStyles.brand}>gripX</Text>
        <Text style={feedStyles.signal}>●●● 90</Text>
      </View>

      <FlatList
        ref={flatRef}
        testID="feed-flatlist"
        data={posts}
        keyExtractor={p => p.id}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToAlignment="start"
        decelerationRate="fast"
        renderItem={({ item }) => (
          <FeedCard
            post={item}
            hasEchoed={interactions.echoed.has(item.id)}
            hasPulsed={interactions.pulsed.has(item.id)}
            onEcho={handleEcho}
            onPulse={handlePulse}
            onOpenDetail={setDetailPost}
            onOpenCreate={onOpenCreate}
          />
        )}
        getItemLayout={(_, index) => ({ length: SCREEN_H, offset: SCREEN_H * index, index })}
      />

      {/* Floating record button */}
      <TouchableOpacity
        testID="record-voice-button"
        onPress={onOpenCreate}
        style={[feedStyles.fab, { bottom: 90 + (insets.bottom || 0) }]}
      >
        <View style={feedStyles.fabInner} />
      </TouchableOpacity>

      <Toast message={toast} />
    </View>
  );
}

const feedStyles = StyleSheet.create({
  statusOverlay: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 50, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 8 },
  time: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 13, color: C.text },
  brand: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 10, color: C.muted, letterSpacing: 1 },
  signal: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 11, color: C.ghost },
  fab: { position: 'absolute', alignSelf: 'center', width: 56, height: 56, borderRadius: 99, backgroundColor: C.brand, alignItems: 'center', justifyContent: 'center', elevation: 8, shadowColor: C.brand, shadowOpacity: 0.5, shadowRadius: 12 },
  fabInner: { width: 18, height: 18, borderRadius: 99, backgroundColor: C.text },
});
