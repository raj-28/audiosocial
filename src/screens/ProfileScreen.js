// src/screens/ProfileScreen.js — with saved echoes + resonance graph
import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { C, BADGE_LEVELS, PTS_HISTORY } from '../utils/constants';
import { getBadge } from '../utils/helpers';
import { ProgressBar, MoodPill } from '../components/SharedUI';

const { width: W } = Dimensions.get('window');
const GRAPH_W = W - 48;
const GRAPH_H = 80;

function ResonanceGraph({ history }) {
  const max = Math.max(...history.map(h => h.pts));
  return (
    <View style={graphStyles.container}>
      <Text style={graphStyles.title}>resonance this week</Text>
      <View style={graphStyles.graph}>
        {/* Grid lines */}
        {[0,1,2,3].map(i => (
          <View key={i} style={[graphStyles.gridLine, { bottom: (i/3)*GRAPH_H }]} />
        ))}
        {/* Bars */}
        <View style={graphStyles.barsRow}>
          {history.map((h, i) => {
            const barH = Math.max(4, (h.pts / max) * GRAPH_H);
            const isToday = i === history.length - 1;
            return (
              <View key={h.day} style={graphStyles.barCol}>
                <View style={[graphStyles.bar, { height:barH, backgroundColor: isToday ? C.brand : C.brand + '44' }]} />
                <Text style={[graphStyles.barLabel, isToday && { color:C.brand }]}>{h.day}</Text>
              </View>
            );
          })}
        </View>
      </View>
      <View style={{ flexDirection:'row', justifyContent:'space-between', marginTop:6 }}>
        <Text style={graphStyles.totalLabel}>total this week</Text>
        <Text style={graphStyles.totalVal}>+{history.reduce((a,b)=>a+b.pts,0)} pts</Text>
      </View>
    </View>
  );
}

function SavedPost({ post, onUnsave }) {
  return (
    <View style={savedStyles.card}>
      <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
        <MoodPill mood={post.mood} />
        <TouchableOpacity onPress={() => onUnsave(post.id)}>
          <Ionicons name="bookmark" size={16} color={C.brand} />
        </TouchableOpacity>
      </View>
      <Text style={savedStyles.text}>"{post.text}"</Text>
      <View style={{ flexDirection:'row', gap:10, marginTop:8 }}>
        <Text style={savedStyles.meta}>↩ {post.echoes}</Text>
        <Text style={savedStyles.meta}>⚡ {post.pulse}/10</Text>
        <Text style={savedStyles.meta}>{post.reach}</Text>
      </View>
    </View>
  );
}

export default function ProfileScreen({ currentUser, userPts, posts, onLogout }) {
  const insets = useSafeAreaInsets();
  const lvl = getBadge(userPts);
  const nextLvl = BADGE_LEVELS.find(b => b.pts > userPts);
  const pct = nextLvl ? Math.min(100,((userPts-(lvl?.pts||0))/(nextLvl.pts-(lvl?.pts||0)))*100) : 100;
  const [activeTab, setActiveTab] = useState('stats'); // stats | saved
  const savedPosts = (posts || []).filter(p => p.saved);

  return (
    <ScrollView style={{ flex:1, backgroundColor:C.bg }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom:100 }}>
      {/* Header */}
      <View style={[prStyles.header, { paddingTop:(insets.top||0)+16 }]}>
        <View style={prStyles.avatarRow}>
          <View style={[prStyles.avatar, { borderColor: lvl?.color || C.brand }]}>
            <Ionicons name={lvl?.iconName || 'person'} size={36} color={lvl?.color || C.brand} />
          </View>
          <View style={{ flex:1 }}>
            <Text style={prStyles.badgeName}>{lvl?.name || 'new voice'}</Text>
            <Text style={prStyles.anonHandle}>@anonymous</Text>
            <Text style={prStyles.email}>{currentUser?.email}</Text>
          </View>
          <TouchableOpacity testID="sign-out-btn" onPress={onLogout} style={prStyles.signOutIconBtn}>
            <Ionicons name="log-out-outline" size={20} color={C.muted} />
          </TouchableOpacity>
        </View>

        {/* Points card */}
        <View style={prStyles.ptsCard}>
          <View style={{ flexDirection:'row', justifyContent:'space-between', marginBottom:8 }}>
            <View style={{ flexDirection:'row', alignItems:'center', gap:6 }}>
              <Ionicons name="medal" size={14} color='#D4AF37' />
              <Text style={prStyles.ptsLabel}>resonance points</Text>
            </View>
            <Text style={prStyles.ptsVal}>{userPts.toLocaleString()}</Text>
          </View>
          <ProgressBar pct={pct} color="#D4AF37" height={6} />
          {nextLvl && (
            <Text style={prStyles.nextLvl}>{nextLvl.pts - userPts} pts to {nextLvl.name}</Text>
          )}
        </View>
      </View>

      {/* Tab switcher */}
      <View style={prStyles.tabRow}>
        {[['stats','stats-chart','Stats'],['saved','bookmark','Saved']].map(([id,icon,label]) => (
          <TouchableOpacity key={id} testID={`profile-tab-${id}`} onPress={() => setActiveTab(id)}
            style={[prStyles.tab, activeTab===id && prStyles.tabActive]}>
            <Ionicons name={icon} size={14} color={activeTab===id ? C.brand : C.ghost} />
            <Text style={[prStyles.tabText, activeTab===id && { color:C.brand }]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={{ paddingHorizontal:20 }}>
        {activeTab === 'stats' && (
          <>
            {/* Resonance graph */}
            <ResonanceGraph history={PTS_HISTORY} />

            {/* Badge ladder */}
            <Text style={prStyles.sectionTitle}>badge levels</Text>
            {BADGE_LEVELS.map(b => {
              const earned = userPts >= b.pts;
              return (
                <View key={b.name} style={[prStyles.badgeRow, !earned && { opacity:0.38 }]}>
                  <View style={[prStyles.badgeIcon, { backgroundColor: b.color+'22', borderColor: b.color+'55' }]}>
                    <Ionicons name={b.iconName} size={22} color={b.color} />
                  </View>
                  <View style={{ flex:1, marginLeft:12 }}>
                    <Text style={[prStyles.badgeTitle, { color: earned ? C.text : C.ghost }]}>{b.name}</Text>
                    <Text style={prStyles.badgeDesc}>{b.desc}</Text>
                  </View>
                  <View style={{ alignItems:'flex-end' }}>
                    <Text style={[prStyles.badgePts, { color: earned ? b.color : C.ghost }]}>{b.pts.toLocaleString()}</Text>
                    {earned && <Text style={prStyles.earned}>✓ earned</Text>}
                  </View>
                </View>
              );
            })}

            {/* Earn guide */}
            <View style={prStyles.earnCard}>
              <Ionicons name="information-circle-outline" size={14} color={C.muted} style={{ marginBottom:6 }} />
              <Text style={prStyles.earnText}>
                post (+10) · get echoed (+5) · voice reply (+8) · join swarm (+20)
              </Text>
            </View>
          </>
        )}

        {activeTab === 'saved' && (
          <>
            {savedPosts.length === 0 ? (
              <View style={{ alignItems:'center', paddingTop:48 }}>
                <Ionicons name="bookmark-outline" size={48} color={C.ghost} style={{ marginBottom:16 }} />
                <Text style={{ fontFamily:'Outfit_700Bold', fontSize:18, color:C.ghost }}>no saved echoes yet</Text>
                <Text style={{ fontFamily:'PlusJakartaSans_400Regular', fontSize:13, color:C.muted, marginTop:8, textAlign:'center' }}>
                  tap the bookmark on any voice card to save it
                </Text>
              </View>
            ) : (
              savedPosts.map(p => <SavedPost key={p.id} post={p} onUnsave={() => {}} />)
            )}
          </>
        )}
      </View>
    </ScrollView>
  );
}

const graphStyles = StyleSheet.create({
  container: { backgroundColor:C.surface, borderWidth:1, borderColor:C.border, borderRadius:18, padding:16, marginBottom:20 },
  title: { fontFamily:'PlusJakartaSans_600SemiBold', fontSize:9, color:C.ghost, letterSpacing:1.5, textTransform:'uppercase', marginBottom:16 },
  graph: { height:GRAPH_H, position:'relative', justifyContent:'flex-end' },
  gridLine: { position:'absolute', left:0, right:0, height:1, backgroundColor:C.border },
  barsRow: { flexDirection:'row', alignItems:'flex-end', gap:6, height:GRAPH_H },
  barCol: { flex:1, alignItems:'center', gap:4 },
  bar: { width:'100%', borderRadius:4 },
  barLabel: { fontFamily:'PlusJakartaSans_400Regular', fontSize:9, color:C.ghost },
  totalLabel: { fontFamily:'PlusJakartaSans_400Regular', fontSize:11, color:C.ghost },
  totalVal: { fontFamily:'Outfit_700Bold', fontSize:12, color:C.brand },
});

const savedStyles = StyleSheet.create({
  card: { backgroundColor:C.surface, borderWidth:1, borderColor:C.border, borderRadius:16, padding:14, marginBottom:10 },
  text: { fontFamily:'Outfit_600SemiBold', fontSize:15, color:C.text, lineHeight:22, fontStyle:'italic' },
  meta: { fontFamily:'PlusJakartaSans_400Regular', fontSize:11, color:C.ghost },
});

const prStyles = StyleSheet.create({
  header: { paddingHorizontal:20, paddingBottom:16, borderBottomWidth:1, borderBottomColor:C.border, marginBottom:16 },
  avatarRow: { flexDirection:'row', alignItems:'center', gap:14, marginBottom:16 },
  avatar: { width:64, height:64, borderRadius:99, borderWidth:2, backgroundColor:C.surfaceHigh, alignItems:'center', justifyContent:'center' },
  badgeName: { fontFamily:'Outfit_800ExtraBold', fontSize:20, color:C.text, letterSpacing:-0.5 },
  anonHandle: { fontFamily:'PlusJakartaSans_400Regular', fontSize:12, color:C.muted, marginTop:2 },
  email: { fontFamily:'PlusJakartaSans_400Regular', fontSize:11, color:C.ghost, marginTop:2 },
  signOutIconBtn: { padding:8 },
  ptsCard: { backgroundColor:C.surfaceHigh, borderWidth:1, borderColor:C.border, borderRadius:14, padding:14 },
  ptsLabel: { fontFamily:'PlusJakartaSans_400Regular', fontSize:11, color:C.muted },
  ptsVal: { fontFamily:'Outfit_700Bold', fontSize:14, color:'#D4AF37' },
  nextLvl: { fontFamily:'PlusJakartaSans_400Regular', fontSize:10, color:C.ghost, textAlign:'center', marginTop:6 },
  tabRow: { flexDirection:'row', marginHorizontal:20, gap:8, marginBottom:20 },
  tab: { flex:1, flexDirection:'row', alignItems:'center', justifyContent:'center', gap:6, paddingVertical:10, borderRadius:12, backgroundColor:C.surface, borderWidth:1, borderColor:C.border },
  tabActive: { borderColor:C.brand, backgroundColor:C.brandDim },
  tabText: { fontFamily:'PlusJakartaSans_600SemiBold', fontSize:12, color:C.ghost },
  sectionTitle: { fontFamily:'PlusJakartaSans_600SemiBold', fontSize:9, color:C.ghost, letterSpacing:1.5, textTransform:'uppercase', marginBottom:12 },
  badgeRow: { flexDirection:'row', alignItems:'center', backgroundColor:C.surface, borderWidth:1, borderColor:C.border, borderRadius:14, padding:12, marginBottom:8 },
  badgeIcon: { width:48, height:48, borderRadius:12, borderWidth:1, alignItems:'center', justifyContent:'center' },
  badgeTitle: { fontFamily:'Outfit_700Bold', fontSize:14 },
  badgeDesc: { fontFamily:'PlusJakartaSans_400Regular', fontSize:11, color:C.muted, marginTop:2 },
  badgePts: { fontFamily:'Outfit_700Bold', fontSize:13 },
  earned: { fontFamily:'PlusJakartaSans_400Regular', fontSize:10, color:'#A3E635', marginTop:2 },
  earnCard: { backgroundColor:C.brandDim, borderWidth:1, borderColor:'rgba(255,51,102,.2)', borderRadius:14, padding:14, marginTop:4, marginBottom:16, alignItems:'center' },
  earnText: { fontFamily:'PlusJakartaSans_400Regular', fontSize:11, color:C.muted, lineHeight:18, textAlign:'center' },
});
