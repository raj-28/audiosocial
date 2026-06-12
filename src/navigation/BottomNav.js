// src/navigation/BottomNav.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { C } from '../utils/constants';
import { getBadge } from '../utils/helpers';

// All icons from Ionicons TTF — bundled, no internet needed
const TABS = [
  { id:'feed',  icon:'home',        iconActive:'home',         label:'feed'  },
  { id:'janta', icon:'globe-outline',iconActive:'globe',        label:'janta' },
  { id:'pulse', icon:'pulse-outline',iconActive:'pulse',        label:'pulse' },
  { id:'swarm', icon:'people-outline',iconActive:'people',      label:'swarm' },
  { id:'me',    icon:'person-outline',iconActive:'person',      label:'me'    },
];

export default function BottomNav({ tab, setTab, userPts }) {
  const insets = useSafeAreaInsets();
  const lvl = getBadge(userPts);

  return (
    <View style={[styles.nav, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {TABS.map(item => {
        const active = tab === item.id;
        return (
          <TouchableOpacity
            key={item.id}
            testID={`nav-tab-${item.id}`}
            onPress={() => setTab(item.id)}
            style={styles.tabBtn}
            activeOpacity={0.7}
          >
            <Ionicons
              name={active ? item.iconActive : item.icon}
              size={active ? 24 : 22}
              color={active ? C.brand : C.ghost}
            />
            <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
              {item.label}
            </Text>
            {/* Red dot for swarm if active events */}
            {item.id === 'swarm' && (
              <View style={styles.dot} />
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  nav: { flexDirection:'row', backgroundColor:'rgba(8,8,10,0.97)', borderTopWidth:1, borderTopColor:'rgba(255,255,255,0.07)', paddingTop:8 },
  tabBtn: { flex:1, alignItems:'center', gap:3, paddingVertical:4, position:'relative' },
  tabLabel: { fontFamily:'PlusJakartaSans_600SemiBold', fontSize:9, color:'#3F3F46', letterSpacing:0.5 },
  tabLabelActive: { color:'#FF3366' },
  dot: { position:'absolute', top:0, right:8, width:7, height:7, borderRadius:99, backgroundColor:'#FF3366', borderWidth:1.5, borderColor:'#08080A' },
});
