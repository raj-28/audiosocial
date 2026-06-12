// src/screens/OnboardingScreen.js — Emotional frequency selector
import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, FlatList, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { C, MOODS } from '../utils/constants';
import { LinearGradient } from 'expo-linear-gradient';

const { width: W, height: H } = Dimensions.get('window');

const MOOD_LIST = Object.entries(MOODS).map(([key, val]) => ({ key, ...val }));

const PAGES = [
  {
    title: 'your voice.\nno filter.',
    sub: 'Anonymous. Raw. Real. No names. No followers. Just what you actually feel.',
    icon: 'mic',
    color: '#FF3366',
  },
  {
    title: 'say it.\nbe heard.',
    sub: '30 seconds. That\'s all you need. Your voice reaches people who feel the same.',
    icon: 'radio',
    color: '#D4AF37',
  },
  {
    title: 'no vanity.\njust signal.',
    sub: 'No likes. No followers. Only Echoes and Pulse — because resonance > popularity.',
    icon: 'pulse',
    color: '#60A5FA',
  },
];

export default function OnboardingScreen({ onDone }) {
  const insets = useSafeAreaInsets();
  const [page, setPage] = useState(0);
  const [selectedMood, setSelectedMood] = useState(null);
  const [step, setStep] = useState('intro'); // intro | mood | done
  const fadeAnim = useRef(new Animated.Value(1)).current;

  function nextPage() {
    if (page < PAGES.length - 1) {
      Animated.sequence([
        Animated.timing(fadeAnim, { toValue:0, duration:200, useNativeDriver:true }),
        Animated.timing(fadeAnim, { toValue:1, duration:200, useNativeDriver:true }),
      ]).start();
      setTimeout(() => setPage(p => p + 1), 200);
    } else {
      setStep('mood');
    }
  }

  function selectMood(moodKey) {
    setSelectedMood(moodKey);
    setTimeout(() => { setStep('done'); setTimeout(onDone, 1200); }, 400);
  }

  const current = PAGES[page];

  if (step === 'done') {
    const m = MOODS[selectedMood];
    return (
      <View style={[obStyles.container, { paddingTop: insets.top }]}>
        <LinearGradient colors={[m.color + '33', C.bg, C.bg]} style={StyleSheet.absoluteFill} />
        <View style={{ flex:1, alignItems:'center', justifyContent:'center', padding:32 }}>
          <Ionicons name={m.icon} size={64} color={m.color} style={{ marginBottom:24 }} />
          <Text style={[obStyles.doneTitle, { color:m.color }]}>tuned to {selectedMood.toLowerCase()}</Text>
          <Text style={obStyles.doneSub}>your feed is calibrated. welcome to gripX.</Text>
        </View>
      </View>
    );
  }

  if (step === 'mood') {
    return (
      <View style={[obStyles.container, { paddingTop: insets.top }]}>
        <LinearGradient colors={['rgba(255,51,102,0.15)', C.bg, C.bg]} style={StyleSheet.absoluteFill} />
        <View style={{ padding:24, flex:1 }}>
          <Text style={obStyles.moodHeader}>what are you{'\n'}feeling right now?</Text>
          <Text style={obStyles.moodSub}>this tunes your feed. you can change it anytime.</Text>
          <FlatList
            data={MOOD_LIST}
            numColumns={2}
            keyExtractor={m => m.key}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ gap:10, paddingBottom:40 }}
            columnWrapperStyle={{ gap:10 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                testID={`mood-select-${item.key}`}
                onPress={() => selectMood(item.key)}
                style={[obStyles.moodCard, { borderColor: selectedMood===item.key ? item.color : C.border, backgroundColor: selectedMood===item.key ? item.color+'22' : C.surface }]}
              >
                <Ionicons name={item.icon} size={28} color={item.color} style={{ marginBottom:8 }} />
                <Text style={[obStyles.moodCardLabel, { color: item.color }]}>{item.label}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={[obStyles.container, { paddingTop: insets.top }]}>
      <LinearGradient colors={[current.color + '22', C.bg, C.bg]} style={StyleSheet.absoluteFill} />
      <Animated.View style={[obStyles.pageContent, { opacity: fadeAnim }]}>
        <View style={{ flex:1, justifyContent:'center', alignItems:'center', padding:32 }}>
          <View style={[obStyles.iconCircle, { backgroundColor: current.color + '22', borderColor: current.color + '55' }]}>
            <Ionicons name={current.icon} size={52} color={current.color} />
          </View>
          <Text style={obStyles.logoMark}>gripX</Text>
          <Text style={obStyles.pageTitle}>{current.title}</Text>
          <Text style={obStyles.pageSub}>{current.sub}</Text>
        </View>

        {/* Dot indicators */}
        <View style={obStyles.dots}>
          {PAGES.map((_, i) => (
            <View key={i} style={[obStyles.dot, i===page && obStyles.dotActive]} />
          ))}
        </View>

        <View style={{ padding:24, paddingBottom:Math.max(insets.bottom, 24) }}>
          <TouchableOpacity testID="onboard-next-btn" onPress={nextPage} style={obStyles.nextBtn}>
            <Text style={obStyles.nextBtnText}>{page < PAGES.length-1 ? 'next' : "let's go →"}</Text>
          </TouchableOpacity>
          {page === 0 && (
            <TouchableOpacity onPress={onDone} style={{ marginTop:12, alignItems:'center' }}>
              <Text style={{ fontFamily:'PlusJakartaSans_400Regular', fontSize:12, color:C.ghost }}>skip</Text>
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>
    </View>
  );
}

const obStyles = StyleSheet.create({
  container: { flex:1, backgroundColor:C.bg },
  pageContent: { flex:1, flexDirection:'column' },
  iconCircle: { width:100, height:100, borderRadius:99, borderWidth:1.5, alignItems:'center', justifyContent:'center', marginBottom:24 },
  logoMark: { fontFamily:'Outfit_800ExtraBold', fontSize:14, color:C.ghost, letterSpacing:3, textTransform:'uppercase', marginBottom:20 },
  pageTitle: { fontFamily:'Outfit_800ExtraBold', fontSize:36, color:C.text, letterSpacing:-1.5, lineHeight:42, textAlign:'center', marginBottom:16 },
  pageSub: { fontFamily:'PlusJakartaSans_400Regular', fontSize:15, color:C.sub, textAlign:'center', lineHeight:24 },
  dots: { flexDirection:'row', justifyContent:'center', gap:6, paddingVertical:24 },
  dot: { width:6, height:6, borderRadius:99, backgroundColor:C.ghost },
  dotActive: { width:20, backgroundColor:C.brand },
  nextBtn: { backgroundColor:C.text, borderRadius:99, paddingVertical:16, alignItems:'center' },
  nextBtnText: { fontFamily:'Outfit_800ExtraBold', fontSize:16, color:C.bg },
  moodHeader: { fontFamily:'Outfit_800ExtraBold', fontSize:30, color:C.text, letterSpacing:-1, lineHeight:36, marginBottom:8, marginTop:16 },
  moodSub: { fontFamily:'PlusJakartaSans_400Regular', fontSize:12, color:C.ghost, marginBottom:20 },
  moodCard: { flex:1, borderWidth:1, borderRadius:18, padding:18, alignItems:'center' },
  moodCardLabel: { fontFamily:'Outfit_700Bold', fontSize:11, letterSpacing:1 },
  doneTitle: { fontFamily:'Outfit_800ExtraBold', fontSize:28, letterSpacing:-1, marginBottom:12, textAlign:'center' },
  doneSub: { fontFamily:'PlusJakartaSans_400Regular', fontSize:14, color:C.sub, textAlign:'center' },
});
