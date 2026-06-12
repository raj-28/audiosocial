// src/screens/AuthScreen.js
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { C } from '../utils/constants';
import { signup, login, validPassword, validEmail, DEMO_USER } from '../auth/auth';

// ─── SHARED INPUT ─────────────────────────────────────────────
function AuthInput({ label, value, onChangeText, error, placeholder, secureTextEntry, icon, keyboardType }) {
  const [show, setShow] = useState(false);
  return (
    <View style={styles.inputWrap}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={[styles.inputRow, error ? styles.inputError : null]}>
        {icon ? <Text style={styles.inputIcon}>{icon}</Text> : null}
        <TextInput
          testID={`auth-input-${label.toLowerCase().replace(' ', '-')}`}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={C.ghost}
          secureTextEntry={secureTextEntry && !show}
          keyboardType={keyboardType || 'default'}
          autoCapitalize="none"
          autoCorrect={false}
          style={[styles.input, icon ? { paddingLeft: 36 } : null]}
        />
        {secureTextEntry ? (
          <TouchableOpacity onPress={() => setShow(!show)} style={styles.eyeBtn}>
            <Text style={{ fontSize: 16 }}>{show ? 'show‍' : 'show'}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
      {error ? <Text style={styles.errText}>{error}</Text> : null}
    </View>
  );
}

// ─── PASSWORD STRENGTH ────────────────────────────────────────
function PwStrength({ password }) {
  if (!password) return null;
  const errs = validPassword(password);
  const s = Math.max(1, 4 - errs.length);
  const colors = ['', '#FB7185', '#FACC15', '#A3E635', '#A3E635'];
  const labels = ['', 'weak', 'ok', 'strong', 'strong'];
  return (
    <View style={{ marginBottom: 14 }}>
      <View style={{ flexDirection: 'row', gap: 4, marginBottom: 5 }}>
        {[1, 2, 3, 4].map(i => (
          <View key={i} style={[styles.strengthBar, { backgroundColor: i <= s ? colors[s] : C.surface }]} />
        ))}
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={[styles.strengthLabel, { color: colors[s] }]}>{labels[s]}</Text>
        {errs.length > 0 && <Text style={[styles.strengthLabel, { color: C.ghost }]}>needs: {errs[0]}</Text>}
      </View>
    </View>
  );
}

// ─── PRIMARY BUTTON ───────────────────────────────────────────
function PrimaryBtn({ label, onPress, loading, disabled }) {
  return (
    <TouchableOpacity
      testID="auth-primary-btn"
      onPress={onPress}
      disabled={loading || disabled}
      style={[styles.primaryBtn, (loading || disabled) && { opacity: 0.45 }]}
    >
      {loading
        ? <ActivityIndicator color={C.bg} />
        : <Text style={styles.primaryBtnText}>{label}</Text>
      }
    </TouchableOpacity>
  );
}

// ─── LOGIN SCREEN ─────────────────────────────────────────────
function LoginScreen({ onSuccess, onGoSignup, onGoForgot }) {
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState({});
  const [attempts, setAttempts] = useState(0);
  const locked = attempts >= 5;

  async function submit() {
    if (locked) return;
    const e = {};
    if (!email.trim()) e.email = 'Required';
    if (!pw) e.pw = 'Required';
    setErr(e);
    if (Object.keys(e).length) return;
    setLoading(true);
    const r = await login(email, pw);
    setLoading(false);
    if (!r.ok) { setAttempts(a => a + 1); setErr({ gen: r.error }); return; }
    onSuccess(r.user);
  }

  return (
    <View style={styles.screenPad}>
      <View style={{ marginBottom: 28 }}>
        <Text style={styles.overline}>welcome back</Text>
        <Text style={styles.heading}>your voice{'\n'}is waiting</Text>
      </View>
      {err.gen ? <View style={styles.errBox}><Text style={styles.errBoxText}>{err.gen}</Text></View> : null}
      {locked ? <View style={styles.errBox}><Text style={styles.errBoxText}> Too many attempts — reset your password</Text></View> : null}
      <AuthInput label="Email" value={email} onChangeText={v => { setEmail(v); setErr({}); }} error={err.email} placeholder="you@example.com" icon="mail" keyboardType="email-address" />
      <AuthInput label="Password" value={pw} onChangeText={v => { setPw(v); setErr({}); }} error={err.pw} placeholder="your password" icon="" secureTextEntry />
      <TouchableOpacity onPress={onGoForgot} style={{ alignSelf: 'flex-end', marginBottom: 20, marginTop: -8 }}>
        <Text style={styles.linkText}>forgot password?</Text>
      </TouchableOpacity>
      <PrimaryBtn label={locked ? 'Account locked' : 'Sign in →'} onPress={submit} loading={loading} disabled={locked} />
      <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 16, gap: 6 }}>
        <Text style={styles.mutedText}>No account?</Text>
        <TouchableOpacity onPress={onGoSignup}>
          <Text style={styles.brandLink}>Create one</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── SIGNUP SCREEN ────────────────────────────────────────────
function SignupScreen({ onSuccess, onGoLogin }) {
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState({});
  const [agreed, setAgreed] = useState(false);

  async function submit() {
    const e = {};
    if (!validEmail(email)) e.email = 'Enter a valid email';
    const pe = validPassword(pw); if (pe.length) e.pw = `Needs: ${pe[0]}`;
    if (pw !== confirm) e.confirm = "Passwords don't match";
    if (!agreed) e.terms = 'You must accept to continue';
    setErr(e);
    if (Object.keys(e).length) return;
    setLoading(true);
    const r = await signup(email, pw);
    setLoading(false);
    if (!r.ok) { setErr({ gen: r.error }); return; }
    onSuccess(r.user);
  }

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.screenPad} showsVerticalScrollIndicator={false}>
      <View style={{ marginBottom: 24 }}>
        <Text style={styles.overline}>join gripX</Text>
        <Text style={styles.heading}>create your{'\n'}anonymous voice</Text>
        <Text style={[styles.mutedText, { marginTop: 8 }]}>Email is only for account recovery — never shown publicly</Text>
      </View>
      {err.gen ? <View style={styles.errBox}><Text style={styles.errBoxText}>{err.gen}</Text></View> : null}
      <AuthInput label="Email" value={email} onChangeText={setEmail} error={err.email} placeholder="you@example.com" icon="mail" keyboardType="email-address" />
      <AuthInput label="Password" value={pw} onChangeText={setPw} error={err.pw} placeholder="8+ chars, uppercase, number" icon="" secureTextEntry />
      <PwStrength password={pw} />
      <AuthInput label="Confirm Password" value={confirm} onChangeText={setConfirm} error={err.confirm} placeholder="same password again" icon="" secureTextEntry />
      <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start', marginBottom: err.terms ? 4 : 20 }}>
        <TouchableOpacity
          testID="agree-checkbox"
          onPress={() => setAgreed(!agreed)}
          style={[styles.checkbox, { backgroundColor: agreed ? C.brand : 'transparent', borderColor: agreed ? C.brand : C.border }]}
        >
          {agreed ? <Text style={{ fontSize: 11, color: C.bg, fontWeight: '700' }}>✓</Text> : null}
        </TouchableOpacity>
        <Text style={[styles.mutedText, { flex: 1, lineHeight: 20 }]}>
          I understand gripX is anonymous — my identity is never shown to other users
        </Text>
      </View>
      {err.terms ? <Text style={[styles.errText, { marginBottom: 14 }]}>{err.terms}</Text> : null}
      <PrimaryBtn label="Create account →" onPress={submit} loading={loading} />
      <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 16, gap: 6 }}>
        <Text style={styles.mutedText}>Already have one?</Text>
        <TouchableOpacity onPress={onGoLogin}>
          <Text style={styles.brandLink}>Sign in</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

// ─── FORGOT SCREEN ────────────────────────────────────────────
function ForgotScreen({ onBack }) {
  return (
    <View style={styles.screenPad}>
      <TouchableOpacity onPress={onBack} style={{ marginBottom: 24 }}>
        <Text style={styles.linkText}>← Back to login</Text>
      </TouchableOpacity>
      <Text style={styles.overline}>recover account</Text>
      <Text style={styles.heading}>Forgot your{'\n'}password?</Text>
      <View style={[styles.errBox, { borderColor: 'rgba(163,230,53,0.3)', backgroundColor: 'rgba(163,230,53,0.08)', marginTop: 24 }]}>
        <Text style={[styles.errBoxText, { color: C.success }]}>
          ⚙ In production this sends a reset code to your email.{'\n\n'}
          For now, tap "Continue as demo" on the login screen.
        </Text>
      </View>
    </View>
  );
}

// ─── AUTH SHELL ───────────────────────────────────────────────
export default function AuthScreen({ onAuth }) {
  const [screen, setScreen] = useState('login');

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoRow}>
            <View style={styles.logoOrb}>
              <Text style={{ fontSize: 16 }}></Text>
            </View>
            <Text style={styles.logoText}>gripX</Text>
          </View>
          <Text style={styles.tagline}>no names · no followers · just signal</Text>
        </View>

        {/* Tab switcher */}
        {screen !== 'forgot' && (
          <View style={styles.tabRow}>
            {['login', 'signup'].map(s => (
              <TouchableOpacity
                key={s}
                testID={`auth-tab-${s}`}
                onPress={() => setScreen(s)}
                style={[styles.tab, screen === s && styles.tabActive]}
              >
                <Text style={[styles.tabText, screen === s && styles.tabTextActive]}>
                  {s === 'login' ? 'Sign in' : 'Create account'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Screens */}
        <View style={{ flex: 1 }}>
          {screen === 'login'  && <LoginScreen  onSuccess={onAuth} onGoSignup={() => setScreen('signup')} onGoForgot={() => setScreen('forgot')} />}
          {screen === 'signup' && <SignupScreen onSuccess={onAuth} onGoLogin={() => setScreen('login')} />}
          {screen === 'forgot' && <ForgotScreen onBack={() => setScreen('login')} />}
        </View>

        {/* Demo bypass */}
        <View style={styles.demoSection}>
          <View style={styles.divider} />
          <TouchableOpacity
            testID="demo-login-btn"
            onPress={() => onAuth(DEMO_USER)}
            style={styles.demoBtn}
          >
            <Text style={styles.demoBtnText}>continue as demo · skip login</Text>
          </TouchableOpacity>
          <Text style={styles.footerText}> identity is never public · anonymous by design</Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 16 },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  logoOrb: {
    width: 32, height: 32, borderRadius: 99,
    backgroundColor: 'rgba(255,51,102,0.15)',
    borderWidth: 1, borderColor: 'rgba(255,51,102,0.3)',
    alignItems: 'center', justifyContent: 'center',
  },
  logoText: { fontFamily: 'Outfit_800ExtraBold', fontSize: 18, color: C.text, letterSpacing: -0.5 },
  tagline:  { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 11, color: C.ghost },
  tabRow: { flexDirection: 'row', gap: 4, marginHorizontal: 24, marginBottom: 8 },
  tab: {
    flex: 1, paddingVertical: 9, borderRadius: 99,
    borderWidth: 1, borderColor: C.border,
    alignItems: 'center',
  },
  tabActive: { backgroundColor: 'rgba(255,255,255,0.09)', borderColor: C.borderHigh },
  tabText: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 12, color: C.muted },
  tabTextActive: { color: C.text },
  screenPad: { paddingHorizontal: 24, paddingTop: 8 },
  overline: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 10, color: C.brand, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 },
  heading: { fontFamily: 'Outfit_800ExtraBold', fontSize: 28, color: C.text, letterSpacing: -1, lineHeight: 34 },
  inputWrap: { marginBottom: 16 },
  inputLabel: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 11, color: C.muted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 7 },
  inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.surfaceHigh, borderWidth: 1.5, borderColor: C.border, borderRadius: 14 },
  inputError: { borderColor: C.error },
  inputIcon: { position: 'absolute', left: 14, zIndex: 1, fontSize: 16 },
  input: { flex: 1, padding: 14, color: C.text, fontFamily: 'PlusJakartaSans_400Regular', fontSize: 15 },
  eyeBtn: { padding: 14 },
  errText: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 11, color: C.error, marginTop: 5, paddingLeft: 4 },
  errBox: { backgroundColor: 'rgba(251,113,133,0.1)', borderWidth: 1, borderColor: 'rgba(251,113,133,0.3)', borderRadius: 12, padding: 12, marginBottom: 16 },
  errBoxText: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 12, color: C.error },
  primaryBtn: { backgroundColor: C.text, borderRadius: 99, paddingVertical: 16, alignItems: 'center' },
  primaryBtnText: { fontFamily: 'Outfit_800ExtraBold', fontSize: 15, color: C.bg },
  linkText: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 12, color: C.muted },
  brandLink: { fontFamily: 'Outfit_700Bold', fontSize: 13, color: C.brand },
  mutedText: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 12, color: C.muted },
  checkbox: { width: 20, height: 20, borderRadius: 6, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  strengthBar: { flex: 1, height: 3, borderRadius: 99 },
  strengthLabel: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 10 },
  demoSection: { paddingHorizontal: 24, paddingBottom: 24 },
  divider: { height: 1, backgroundColor: C.border, marginBottom: 16 },
  demoBtn: { backgroundColor: C.brandDim, borderWidth: 1, borderColor: 'rgba(255,51,102,0.3)', borderRadius: 99, paddingVertical: 13, alignItems: 'center' },
  demoBtnText: { fontFamily: 'Outfit_700Bold', fontSize: 14, color: C.brand },
  footerText: { textAlign: 'center', fontFamily: 'PlusJakartaSans_400Regular', fontSize: 10, color: C.ghost, marginTop: 10 },
});
