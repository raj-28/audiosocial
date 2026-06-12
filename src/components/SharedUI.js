// src/components/SharedUI.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C, MOODS } from '../utils/constants';

export function MoodPill({ mood, size = 'sm' }) {
  const m = MOODS[mood] || MOODS.HEALING;
  const iconSize = size === 'lg' ? 11 : 9;
  const fontSize = size === 'lg' ? 10 : 9;
  const px = size === 'lg' ? 10 : 8;
  const py = size === 'lg' ? 4 : 3;
  return (
    <View style={[styles.moodPill, { backgroundColor: m.color + '22', borderColor: m.color + '55', paddingHorizontal: px, paddingVertical: py }]}>
      <Ionicons name={m.icon} size={iconSize} color={m.color} />
      <Text style={[styles.moodLabel, { color: m.color, fontSize }]}>{m.label}</Text>
    </View>
  );
}

export function ZoneDot({ zone }) {
  const cfg = {
    PULSE:  { c: '#FF3366', l: 'pulse',  icon: 'radio' },
    ECHO:   { c: '#FACC15', l: 'echo',   icon: 'radio-outline' },
    SIGNAL: { c: '#60A5FA', l: 'signal', icon: 'globe-outline' },
  }[zone] || { c: '#71717A', l: zone?.toLowerCase(), icon: 'ellipse' };
  return (
    <View style={[styles.zonePill, { backgroundColor: cfg.c + '18', borderColor: cfg.c + '44' }]}>
      <View style={[styles.zoneDot, { backgroundColor: cfg.c }]} />
      <Text style={[styles.zoneLabel, { color: cfg.c }]}>{cfg.l}</Text>
    </View>
  );
}

export function ProgressBar({ pct, color, height = 3 }) {
  return (
    <View style={[styles.progressTrack, { height }]}>
      <View style={[styles.progressFill, { width: `${Math.min(pct, 100)}%`, backgroundColor: color, height }]} />
    </View>
  );
}

export function PlayButton({ playing, color, size = 36, onPress }) {
  return (
    <TouchableOpacity onPress={onPress}
      style={[styles.playBtn, { width: size, height: size, backgroundColor: playing ? color : color + '22', borderColor: color + '66' }]}>
      <Ionicons name={playing ? 'pause' : 'play'} size={size * 0.38} color={playing ? '#fff' : color} />
    </TouchableOpacity>
  );
}

export function Toast({ message }) {
  if (!message) return null;
  return (
    <View style={styles.toast} pointerEvents="none">
      <Text style={styles.toastText}>{message}</Text>
    </View>
  );
}

export function Divider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  moodPill: { flexDirection:'row', alignItems:'center', gap:4, borderWidth:1, borderRadius:99 },
  moodLabel: { fontFamily:'Outfit_700Bold', letterSpacing:1, textTransform:'uppercase' },
  zonePill: { flexDirection:'row', alignItems:'center', gap:4, borderWidth:1, borderRadius:99, paddingHorizontal:7, paddingVertical:2 },
  zoneDot: { width:5, height:5, borderRadius:99 },
  zoneLabel: { fontFamily:'PlusJakartaSans_600SemiBold', fontSize:9 },
  progressTrack: { backgroundColor:'rgba(255,255,255,0.07)', borderRadius:99, overflow:'hidden' },
  progressFill: { borderRadius:99 },
  playBtn: { borderWidth:1, borderRadius:99, alignItems:'center', justifyContent:'center' },
  toast: { position:'absolute', bottom:100, alignSelf:'center', backgroundColor:'rgba(255,255,255,0.1)', borderWidth:1, borderColor:C.border, borderRadius:99, paddingHorizontal:18, paddingVertical:10, zIndex:999 },
  toastText: { fontFamily:'PlusJakartaSans_600SemiBold', fontSize:12, color:C.text },
  divider: { height:1, backgroundColor:C.border },
});
