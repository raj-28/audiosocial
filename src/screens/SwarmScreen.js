// src/screens/SwarmScreen.js — Feature: The Swarm (live collective voice events)
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Animated, Easing } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { C, MOODS, SWARM_EVENTS } from '../utils/constants';
import { getMood } from '../utils/helpers';
import { MoodPill } from '../components/SharedUI';

function PulseRing({ color, size, delay }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, { toValue:1, duration:1800, easing:Easing.out(Easing.ease), useNativeDriver:true }),
        Animated.timing(anim, { toValue:0, duration:0, useNativeDriver:true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);
  const scale = anim.interpolate({ inputRange:[0,1], outputRange:[1, 2.2] });
  const opacity = anim.interpolate({ inputRange:[0,0.5,1], outputRange:[0.6,0.3,0] });
  return (
    <Animated.View style={{ position:'absolute', width:size, height:size, borderRadius:size/2, borderWidth:1.5, borderColor:color, transform:[{scale}], opacity }} />
  );
}

function SwarmCard({ event, onJoin, joined }) {
  const m = getMood(event.mood);
  const [liveCount, setLiveCount] = useState(event.voices);
  useEffect(() => {
    if (!event.active) return;
    const t = setInterval(() => setLiveCount(c => c + Math.floor(Math.random()*3)), 4000);
    return () => clearInterval(t);
  }, []);

  return (
    <View style={[swStyles.card, { borderColor: joined ? m.color + '55' : C.border }]}>
      <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14 }}>
        <View style={{ flex:1, marginRight:12 }}>
          <View style={{ flexDirection:'row', alignItems:'center', gap:8, marginBottom:6 }}>
            {event.active && <View style={[swStyles.liveDot, { backgroundColor:m.color }]}/>}
            <Text style={[swStyles.liveLabel, { color: event.active ? m.color : C.ghost }]}>
              {event.active ? 'LIVE' : 'ENDED'}
            </Text>
          </View>
          <Text style={swStyles.topicTitle}>{event.topic}</Text>
          <MoodPill mood={event.mood} />
        </View>
        {/* Pulse animation for active swarms */}
        {event.active && (
          <View style={{ width:56, height:56, alignItems:'center', justifyContent:'center' }}>
            <PulseRing color={m.color} size={56} delay={0} />
            <PulseRing color={m.color} size={56} delay={600} />
            <View style={[swStyles.pulseCore, { backgroundColor: m.color + '33', borderColor: m.color }]}>
              <Ionicons name="people" size={18} color={m.color} />
            </View>
          </View>
        )}
      </View>

      {/* Voice count bar */}
      <View style={swStyles.voiceRow}>
        <Ionicons name="mic" size={12} color={C.muted} />
        <Text style={swStyles.voiceCount}>{liveCount.toLocaleString()} voices</Text>
        <Text style={swStyles.duration}>{event.duration}</Text>
      </View>

      {/* Waveform visualizer */}
      <View style={swStyles.waveRow}>
        {Array.from({length:32}).map((_,i) => {
          const h = event.active
            ? 4 + Math.abs(Math.sin(i*0.8)) * 24
            : 3 + Math.abs(Math.sin(i*0.5)) * 8;
          return <View key={i} style={[swStyles.waveBar, { height:h, backgroundColor: event.active ? m.color + 'AA' : C.ghost + '44' }]} />;
        })}
      </View>

      {event.active && (
        <TouchableOpacity
          testID={`swarm-join-${event.id}`}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onJoin(event.id); }}
          style={[swStyles.joinBtn, joined ? { backgroundColor: m.color + '22', borderColor: m.color } : { backgroundColor: m.color, borderColor: m.color }]}
        >
          <Ionicons name={joined ? 'checkmark-circle' : 'mic'} size={16} color={joined ? m.color : '#08080A'} />
          <Text style={[swStyles.joinBtnText, joined && { color: m.color }]}>
            {joined ? 'in the swarm' : 'join swarm'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function SwarmScreen({ onOpenCreate }) {
  const insets = useSafeAreaInsets();
  const [joined, setJoined] = useState(new Set());
  const [totalSwarmers, setTotalSwarmers] = useState(7240);

  useEffect(() => {
    const t = setInterval(() => setTotalSwarmers(c => c + Math.floor(Math.random()*5)), 3000);
    return () => clearInterval(t);
  }, []);

  function handleJoin(id) {
    setJoined(prev => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  }

  return (
    <View style={{ flex:1, backgroundColor:C.bg }}>
      <FlatList
        data={SWARM_EVENTS}
        keyExtractor={e => e.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal:20, paddingBottom:100 }}
        ListHeaderComponent={() => (
          <View style={[swStyles.header, { paddingTop:(insets.top||0)+16 }]}>
            <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'flex-end', marginBottom:4 }}>
              <View>
                <Text style={swStyles.overline}>the swarm</Text>
                <Text style={swStyles.heading}>collective voice</Text>
              </View>
              <View style={swStyles.totalBadge}>
                <Ionicons name="people" size={12} color={C.brand} />
                <Text style={swStyles.totalText}>{totalSwarmers.toLocaleString()} swarming</Text>
              </View>
            </View>
            <Text style={swStyles.sub}>live collective voice events · add your voice to the noise</Text>

            {/* Start swarm CTA */}
            <TouchableOpacity testID="start-swarm-btn" onPress={onOpenCreate} style={swStyles.startBtn}>
              <Ionicons name="mic" size={16} color={C.bg} />
              <Text style={swStyles.startBtnText}>start a swarm</Text>
            </TouchableOpacity>
          </View>
        )}
        renderItem={({ item }) => (
          <SwarmCard event={item} onJoin={handleJoin} joined={joined.has(item.id)} />
        )}
      />
    </View>
  );
}

const swStyles = StyleSheet.create({
  header: { paddingBottom:16 },
  overline: { fontFamily:'PlusJakartaSans_700Bold', fontSize:9, color:C.brand, letterSpacing:2, textTransform:'uppercase', marginBottom:4 },
  heading: { fontFamily:'Outfit_800ExtraBold', fontSize:26, color:C.text, letterSpacing:-1 },
  sub: { fontFamily:'PlusJakartaSans_400Regular', fontSize:11, color:C.ghost, marginBottom:16 },
  totalBadge: { flexDirection:'row', alignItems:'center', gap:5, backgroundColor:C.brandDim, borderWidth:1, borderColor:'rgba(255,51,102,0.3)', borderRadius:99, paddingHorizontal:10, paddingVertical:5 },
  totalText: { fontFamily:'Outfit_700Bold', fontSize:11, color:C.brand },
  startBtn: { backgroundColor:C.brand, borderRadius:99, paddingVertical:13, flexDirection:'row', alignItems:'center', justifyContent:'center', gap:8, marginBottom:4 },
  startBtnText: { fontFamily:'Outfit_800ExtraBold', fontSize:14, color:C.bg },
  card: { backgroundColor:C.surface, borderWidth:1, borderRadius:20, padding:18, marginBottom:12 },
  liveDot: { width:8, height:8, borderRadius:99 },
  liveLabel: { fontFamily:'Outfit_700Bold', fontSize:10, letterSpacing:1.5 },
  topicTitle: { fontFamily:'Outfit_800ExtraBold', fontSize:20, color:C.text, letterSpacing:-0.5, marginBottom:8 },
  pulseCore: { width:36, height:36, borderRadius:99, borderWidth:1.5, alignItems:'center', justifyContent:'center' },
  voiceRow: { flexDirection:'row', alignItems:'center', gap:6, marginBottom:12 },
  voiceCount: { fontFamily:'PlusJakartaSans_600SemiBold', fontSize:12, color:C.sub, flex:1 },
  duration: { fontFamily:'PlusJakartaSans_400Regular', fontSize:11, color:C.ghost },
  waveRow: { flexDirection:'row', alignItems:'center', gap:2, height:32, marginBottom:14 },
  waveBar: { width:3, borderRadius:99, minHeight:3 },
  joinBtn: { borderWidth:1.5, borderRadius:99, paddingVertical:12, flexDirection:'row', alignItems:'center', justifyContent:'center', gap:8 },
  joinBtnText: { fontFamily:'Outfit_800ExtraBold', fontSize:14, color:C.bg },
});
