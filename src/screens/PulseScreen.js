// src/screens/PulseScreen.js
import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { C, MOODS, CITIES, NEARBY } from '../utils/constants';
import { getMood } from '../utils/helpers';
import { MoodPill, ProgressBar } from '../components/SharedUI';

const CITY_INSIGHT = {
  delhi:     'Delhi is screaming quietly. Multiple wounds, one city.',
  mumbai:    'Mumbai is exhausted but still moving. Barely.',
  kota:      'Kota is in collective rage tonight. NEET ka jawab chahiye.',
  bangalore: 'Bangalore is lonely at scale. Grinding alone together.',
  patna:     'Patna is organizing. CJP energy is real here.',
};

export default function PulseScreen() {
  const insets = useSafeAreaInsets();
  const [city, setCity] = useState('delhi');
  const [tab, setTab] = useState('pulse');
  const [knocked, setKnocked] = useState(new Set());
  const [knockedBack, setKnockedBack] = useState(new Set());

  const d = CITIES[city] || CITIES.delhi;
  const m = getMood(d.dom);

  function knock(id) {
    if (knocked.has(id)) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setKnocked(prev => new Set([...prev, id]));
    if (Math.random() > 0.45) {
      setTimeout(() => {
        setKnockedBack(prev => new Set([...prev, id]));
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }, 1500 + Math.random() * 2000);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      {/* Sticky Header */}
      <View style={[pStyles.header, { paddingTop: (insets.top || 0) + 8 }]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <View>
            <Text style={pStyles.overline}>city pulse</Text>
            <Text style={pStyles.cityName}>{d.name}</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {Object.entries(CITIES).map(([key, val]) => (
                <TouchableOpacity
                  key={key}
                  testID={`city-btn-${key}`}
                  onPress={() => setCity(key)}
                  style={[pStyles.cityPill, city === key && pStyles.cityPillActive]}
                >
                  <Text style={[pStyles.cityPillText, city === key && { color: C.text }]}>{val.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
        <View style={pStyles.tabRow}>
          {['pulse', 'nearby'].map(t => (
            <TouchableOpacity
              key={t}
              testID={`pulse-tab-${t}`}
              onPress={() => setTab(t)}
              style={[pStyles.tab, tab === t && pStyles.tabActive]}
            >
              <Text style={[pStyles.tabText, tab === t && pStyles.tabTextActive]}>
                {t === 'pulse' ? 'city pulse' : 'nearby voices'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {tab === 'pulse' && (
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
          {/* Stats row */}
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
            {[[d.now.toLocaleString(), 'active now'], [`${(d.d24 / 1000).toFixed(1)}k`, 'voices/24h']].map(([val, lbl]) => (
              <View key={lbl} style={pStyles.statCard}>
                <Text style={pStyles.statVal}>{val}</Text>
                <Text style={pStyles.statLbl}>{lbl}</Text>
              </View>
            ))}
            <View style={[pStyles.statCard, { backgroundColor: m.color + '12', borderColor: m.color + '44' }]}>
              <Text style={{ fontSize: 20 }}>{m.icon}</Text>
              <Text style={[pStyles.statLbl, { color: m.color, fontFamily: 'Outfit_700Bold', letterSpacing: 1 }]}>{d.dom}</Text>
            </View>
          </View>

          {/* Emotional climate */}
          <View style={pStyles.climateCard}>
            <Text style={pStyles.climateTitle}>emotional climate</Text>
            {Object.entries(d.bars).map(([mood, pct]) => {
              const md = getMood(mood);
              return (
                <View key={mood} style={{ marginBottom: 12 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
                    <Text style={pStyles.moodLabel}>{md.icon} {mood}</Text>
                    <Text style={[pStyles.moodPct, { color: md.color }]}>{pct}%</Text>
                  </View>
                  <ProgressBar pct={pct} color={md.color} height={6} />
                </View>
              );
            })}
          </View>

          {/* City insight */}
          <View style={[pStyles.insightCard, { backgroundColor: m.color + '0E', borderColor: m.color + '33' }]}>
            <Text style={[pStyles.insightText, { color: m.color }]}>{CITY_INSIGHT[city]}</Text>
          </View>
        </ScrollView>
      )}

      {tab === 'nearby' && (
        <FlatList
          testID="nearby-list"
          data={NEARBY}
          keyExtractor={v => v.id}
          contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={() => (
            <View style={pStyles.zoneInfo}>
              <Text style={pStyles.zoneInfoText}>
                <Text style={{ color: '#FF3366' }}>● Pulse</Text> = &lt;50km  ·  <Text style={{ color: '#FACC15' }}>● Echo</Text> = &lt;500km  ·  <Text style={{ color: '#60A5FA' }}>● Signal</Text> = national{'\n'}
                <Text style={{ color: C.ghost, fontSize: 10 }}>No exact location. Ever.</Text>
              </Text>
            </View>
          )}
          renderItem={({ item: v }) => {
            const nm = getMood(v.mood);
            const isKnocked = knocked.has(v.id);
            const isKnockedBack = knockedBack.has(v.id);
            return (
              <View style={[pStyles.nearbyCard, isKnockedBack && { borderColor: nm.color + '66' }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <MoodPill mood={v.mood} />
                  <Text style={pStyles.dist}>{v.dist} away</Text>
                </View>
                <Text style={pStyles.snip}>"{v.snip}..."</Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
                  <Text style={pStyles.nearbyMeta}>{v.dur}s · {v.echoes} echoes</Text>
                  {isKnockedBack ? (
                    <View style={[pStyles.connectedBadge, { backgroundColor: nm.color + '1A', borderColor: nm.color + '55' }]}>
                      <Text style={[pStyles.connectedText, { color: nm.color }]}>24h connection</Text>
                    </View>
                  ) : (
                    <TouchableOpacity
                      testID={`knock-btn-${v.id}`}
                      onPress={() => knock(v.id)}
                      disabled={isKnocked}
                      style={[pStyles.knockBtn, isKnocked && { opacity: 0.5 }]}
                    >
                      <Text style={pStyles.knockBtnText}>{isKnocked ? 'knock sent...' : 'knock ↗'}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const pStyles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingBottom: 12, backgroundColor: 'rgba(8,8,10,0.97)', borderBottomWidth: 1, borderBottomColor: C.border },
  overline: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 9, color: C.ghost, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 3 },
  cityName: { fontFamily: 'Outfit_800ExtraBold', fontSize: 26, color: C.text, letterSpacing: -1 },
  cityPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 99, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: C.border },
  cityPillActive: { backgroundColor: 'rgba(255,255,255,0.1)', borderColor: C.borderHigh },
  cityPillText: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 12, color: C.muted },
  tabRow: { flexDirection: 'row', gap: 4, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 99, padding: 4 },
  tab: { flex: 1, paddingVertical: 8, borderRadius: 99, alignItems: 'center' },
  tabActive: { backgroundColor: 'rgba(255,255,255,0.1)' },
  tabText: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 12, color: C.muted },
  tabTextActive: { color: C.text },
  statCard: { flex: 1, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 14, padding: 12, alignItems: 'center' },
  statVal: { fontFamily: 'Outfit_700Bold', fontSize: 20, color: C.text },
  statLbl: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 10, color: C.ghost, marginTop: 2 },
  climateCard: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 18, padding: 18, marginBottom: 14 },
  climateTitle: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 9, color: C.ghost, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 14 },
  moodLabel: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 11, color: C.sub },
  moodPct: { fontFamily: 'Outfit_700Bold', fontSize: 11 },
  insightCard: { borderWidth: 1, borderRadius: 14, padding: 14, alignItems: 'center' },
  insightText: { fontFamily: 'Outfit_600SemiBold', fontSize: 13, lineHeight: 20, textAlign: 'center' },
  zoneInfo: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 14, padding: 14, marginBottom: 16 },
  zoneInfoText: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 12, color: C.muted, lineHeight: 22 },
  nearbyCard: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 16, padding: 14, marginBottom: 10 },
  dist: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 10, color: C.ghost },
  snip: { fontFamily: 'Outfit_600SemiBold', fontSize: 14, color: C.sub, fontStyle: 'italic' },
  nearbyMeta: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 10, color: C.ghost },
  knockBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 99, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: C.border },
  knockBtnText: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 11, color: C.text },
  connectedBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 99, borderWidth: 1 },
  connectedText: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 11 },
});
