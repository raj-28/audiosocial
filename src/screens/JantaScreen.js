// src/screens/JantaScreen.js
import React, { useState, useRef } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, MOODS, TOPICS, TOPIC_MOODS, VOICE_REPLIES } from '../utils/constants';
import { formatCount, getMood, timeAgo } from '../utils/helpers';
import { MoodPill, ZoneDot, ProgressBar } from '../components/SharedUI';

const { height: SCREEN_H } = Dimensions.get('window');

// ─── TOPIC POST CARD ──────────────────────────────────────────
function TopicPostCard({ post, echoed, onEcho, onOpenDetail }) {
  const m = getMood(post.mood);
  const [playing, setPlaying] = useState(false);
  const [prog, setProg] = useState(0);
  const intervalRef = useRef(null);

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

  const replies = VOICE_REPLIES[post.id] || [];

  return (
    <View style={[tStyles.container, { height: SCREEN_H }]}>
      <View style={[tStyles.glow, { backgroundColor: m.color + '0C' }]} />
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
          <MoodPill mood={post.mood} />
          <ZoneDot zone={post.zone} />
        </View>
        <TouchableOpacity testID={`topic-post-play-${post.id}`} onPress={togglePlay} activeOpacity={0.8} style={{ alignItems: 'center' }}>
          <Text style={[tStyles.quote, playing && { textShadowColor: m.color, textShadowRadius: 20 }]}>
            "{post.text}"
          </Text>
          <View style={tStyles.playerRow}>
            <View style={[tStyles.playCircle, { backgroundColor: playing ? m.color : m.color + '22', borderColor: m.color + '66' }]}>
              <Text style={{ fontSize: 12 }}>{playing ? '⏸' : '▶'}</Text>
            </View>
            <View style={{ width: 140 }}>
              <ProgressBar pct={prog} color={m.color} />
              <Text style={tStyles.dur}>{post.dur}s</Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>
      <View style={tStyles.bottomRow}>
        <View>
          <Text style={tStyles.stats}>↩ {formatCount(post.echoes)} · ⚡ {post.pulse}/10</Text>
          <Text style={tStyles.reach}>Reached {post.reach}</Text>
        </View>
        <View style={{ gap: 18, alignItems: 'center' }}>
          <TouchableOpacity testID={`janta-echo-${post.id}`} onPress={() => onEcho(post.id)} style={{ alignItems: 'center', gap: 3 }}>
            <Text style={[tStyles.actionIcon, echoed && { color: m.color }]}>↩</Text>
            <Text style={[tStyles.actionCount, echoed && { color: m.color }]}>{formatCount(post.echoes)}</Text>
          </TouchableOpacity>
          <TouchableOpacity testID={`janta-detail-${post.id}`} onPress={() => onOpenDetail(post)} style={{ alignItems: 'center', gap: 3 }}>
            <Text style={tStyles.actionIcon}></Text>
            <Text style={tStyles.actionCount}>{replies.length}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const tStyles = StyleSheet.create({
  container: { backgroundColor: C.bg, padding: 20, paddingTop: 130, paddingBottom: 100, position: 'relative' },
  glow: { ...StyleSheet.absoluteFillObject },
  quote: { fontFamily: 'Outfit_700Bold', fontSize: 24, color: C.text, lineHeight: 32, letterSpacing: -0.6, textAlign: 'center', marginBottom: 20 },
  playerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  playCircle: { width: 36, height: 36, borderRadius: 99, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  dur: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 10, color: C.ghost, marginTop: 3 },
  bottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  stats: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 11, color: C.sub, marginBottom: 4 },
  reach: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 10, color: C.ghost },
  actionIcon: { fontSize: 18, color: C.muted },
  actionCount: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 10, color: C.ghost },
});

// ─── TOPIC DETAIL ─────────────────────────────────────────────
function TopicDetail({ topic, posts, interactions, onEcho, onOpenDetail, onOpenCreate, onBack }) {
  const insets = useSafeAreaInsets();
  const tPosts = (posts || []).filter(p => p.topic === topic.id);

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      {/* Sticky header */}
      <View style={[jStyles.topicHeader, { paddingTop: insets.top || 52 }]}>
        <TouchableOpacity testID="janta-back-btn" onPress={onBack} style={jStyles.backBtn}>
          <Text style={{ color: C.text, fontSize: 18 }}>←</Text>
        </TouchableOpacity>
        <View style={{ alignItems: 'center' }}>
          <Text style={jStyles.topicTitle}>{topic.icon} {topic.label}</Text>
          <Text style={jStyles.topicSub}>{(topic.voices / 1000).toFixed(1)}k voices · {topic.delta}</Text>
        </View>
        <TouchableOpacity testID="topic-add-voice-btn" onPress={onOpenCreate} style={jStyles.addBtn}>
          <Text style={{ color: C.text, fontSize: 20 }}>+</Text>
        </TouchableOpacity>
      </View>

      {tPosts.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
          <Text style={{ fontFamily: 'Outfit_400Regular', fontSize: 20, color: C.ghost, marginBottom: 20 }}>no voices yet</Text>
          <TouchableOpacity onPress={onOpenCreate} style={{ backgroundColor: C.brand, borderRadius: 99, paddingVertical: 14, paddingHorizontal: 28 }}>
            <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 14, color: C.bg }}>be the first →</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          testID="topic-feed-list"
          data={tPosts}
          keyExtractor={p => p.id}
          pagingEnabled
          showsVerticalScrollIndicator={false}
          snapToAlignment="start"
          decelerationRate="fast"
          renderItem={({ item }) => (
            <TopicPostCard
              post={item}
              echoed={interactions.echoed.has(item.id)}
              onEcho={onEcho}
              onOpenDetail={onOpenDetail}
            />
          )}
          getItemLayout={(_, i) => ({ length: SCREEN_H, offset: SCREEN_H * i, index: i })}
        />
      )}
    </View>
  );
}

// ─── JANTA BOARD MAIN ─────────────────────────────────────────
export default function JantaScreen({ posts, interactions, onEcho, onOpenDetail, onOpenCreate }) {
  const insets = useSafeAreaInsets();
  const [activeTopic, setActiveTopic] = useState(null);

  if (activeTopic) {
    return (
      <TopicDetail
        topic={activeTopic}
        posts={posts}
        interactions={interactions}
        onEcho={onEcho}
        onOpenDetail={onOpenDetail}
        onOpenCreate={onOpenCreate}
        onBack={() => setActiveTopic(null)}
      />
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <FlatList
        testID="janta-board-list"
        data={TOPICS}
        keyExtractor={t => t.id}
        ListHeaderComponent={() => (
          <View style={[jStyles.header, { paddingTop: (insets.top || 0) + 16 }]}>
            <Text style={jStyles.overline}>janta board</Text>
            <Text style={jStyles.heading}>what India feels</Text>
            <Text style={jStyles.sub}>tap → hear voices → add yours</Text>
          </View>
        )}
        renderItem={({ item: topic, index }) => {
          const moodBars = TOPIC_MOODS[topic.id] || {};
          return (
            <TouchableOpacity
              testID={`topic-card-${topic.id}`}
              onPress={() => setActiveTopic(topic)}
              style={jStyles.topicCard}
              activeOpacity={0.8}
            >
              <View style={jStyles.topicCardTop}>
                <View style={{ flex: 1, marginRight: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <Text style={jStyles.topicRank}>#{index + 1}</Text>
                    <Text style={jStyles.topicName}>{topic.icon} {topic.label}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <Text style={jStyles.topicVoices}>{(topic.voices / 1000).toFixed(1)}k voices</Text>
                    <Text style={[jStyles.topicDelta, { color: topic.color }]}>{topic.delta}</Text>
                  </View>
                </View>
                <View style={{ gap: 8, alignItems: 'flex-end' }}>
                  <View style={[jStyles.hearBtn, { backgroundColor: topic.color + '18', borderColor: topic.color + '55' }]}>
                    <Text style={[jStyles.hearBtnText, { color: topic.color }]}>hear voices →</Text>
                  </View>
                  <TouchableOpacity
                    testID={`add-voice-${topic.id}`}
                    onPress={e => { e.stopPropagation?.(); onOpenCreate(); }}
                    style={jStyles.addVoiceBtn}
                  >
                    <Text style={jStyles.addVoiceBtnText}>+ add voice</Text>
                  </TouchableOpacity>
                </View>
              </View>
              {/* Mood bar */}
              <View style={jStyles.moodBarRow}>
                {Object.entries(moodBars).map(([mood, p]) => {
                  const md = MOODS[mood] || MOODS.HEALING;
                  return <View key={mood} style={[jStyles.moodBarSeg, { flex: p, backgroundColor: md.color }]} />;
                })}
              </View>
            </TouchableOpacity>
          );
        }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const jStyles = StyleSheet.create({
  header: { paddingBottom: 16 },
  overline: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 9, color: C.brand, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 },
  heading: { fontFamily: 'Outfit_800ExtraBold', fontSize: 26, color: C.text, letterSpacing: -1, marginBottom: 2 },
  sub: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 11, color: C.ghost },
  topicCard: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 18, padding: 16, marginBottom: 10 },
  topicCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  topicRank: { fontFamily: 'Outfit_700Bold', fontSize: 11, color: C.ghost },
  topicName: { fontFamily: 'Outfit_700Bold', fontSize: 16, color: C.text, letterSpacing: -0.3 },
  topicVoices: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 11, color: C.muted },
  topicDelta: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 10 },
  hearBtn: { borderWidth: 1, borderRadius: 99, paddingHorizontal: 12, paddingVertical: 6 },
  hearBtnText: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 11 },
  addVoiceBtn: { backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: C.border, borderRadius: 99, paddingHorizontal: 12, paddingVertical: 6 },
  addVoiceBtnText: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 11, color: C.sub },
  moodBarRow: { flexDirection: 'row', height: 6, gap: 3 },
  moodBarSeg: { borderRadius: 99, opacity: 0.75 },
  topicHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 14, backgroundColor: 'rgba(8,8,10,0.97)', borderBottomWidth: 1, borderBottomColor: C.border },
  backBtn: { width: 36, height: 36, borderRadius: 99, backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  topicTitle: { fontFamily: 'Outfit_700Bold', fontSize: 17, color: C.text },
  topicSub: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 11, color: C.muted, marginTop: 2 },
  addBtn: { width: 36, height: 36, borderRadius: 99, backgroundColor: C.brand, alignItems: 'center', justifyContent: 'center' },
});
