# gripX Android App 🎙

**Anonymous voice social app for Gen Z India.**  
Built with Expo + React Native. Ready to run on Android.

---

## Quick Start

### Prerequisites
- Node.js 18+
- Expo Go app on your Android phone (install from Play Store)

### Run in 3 steps

```bash
# 1. Install dependencies
npm install

# 2. Start Expo dev server
npm start
# or
npx expo start

# 3. Scan the QR code with Expo Go app on your phone
```

That's it. The app runs live on your phone.

---

## Build APK (to install directly, no Play Store)

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo account (free)
eas login

# Build APK
npm run build:apk
```

EAS builds in the cloud, no Android Studio needed. Takes ~10 min.  
Download the `.apk` and install on any Android device.

---

## Project Structure

```
gripx-android/
├── App.js                        ← Root: fonts, auth, navigation
├── app.json                      ← Expo config
├── eas.json                      ← Build profiles (APK/AAB)
├── babel.config.js
├── package.json
└── src/
    ├── screens/
    │   ├── AuthScreen.js         ← Login, Signup, Forgot password
    │   ├── FeedScreen.js         ← TikTok snap-scroll feed + post detail
    │   ├── JantaScreen.js        ← Topic board + topic feed
    │   ├── PulseScreen.js        ← City pulse + nearby voices + knock
    │   ├── ProfileScreen.js      ← Badge levels, resonance points
    │   └── CreateScreen.js       ← Record voice / type + post preview
    ├── components/
    │   └── SharedUI.js           ← MoodPill, ZoneDot, ProgressBar, Toast
    ├── navigation/
    │   └── BottomNav.js          ← Bottom tab bar
    ├── auth/
    │   └── auth.js               ← JWT, PBKDF2, expo-secure-store
    └── utils/
        ├── constants.js          ← Colors, moods, seed data
        └── helpers.js            ← timeAgo, detectMood, getBadge
```

---

## Tech Stack

| What | How |
|------|-----|
| Framework | Expo SDK 51 + React Native 0.74 |
| Navigation | Bottom tabs (custom, no react-navigation overhead) |
| Fonts | Outfit + Plus Jakarta Sans via @expo-google-fonts |
| Audio recording | expo-av |
| Auth storage | expo-secure-store (encrypted keychain) |
| Password hashing | expo-crypto (PBKDF2 / SHA-256) |
| Haptics | expo-haptics |

---

## Login

On the auth screen tap **"🎙 continue as demo · skip login"** — instant access, no account needed.

To create a real account: email + password (8+ chars, 1 uppercase, 1 number).  
Stored securely in Android Keystore via expo-secure-store.

---

## Features

| Screen | What you can do |
|--------|----------------|
| **Feed** | Scroll TikTok-style through voice cards, tap to play, echo ↩, pulse ⚡, open replies |
| **Janta Board** | Tap any topic to enter its snap-scroll voice feed |
| **City Pulse** | Switch cities, see emotional bars, nearby voices, send knock |
| **Profile** | See badge level, resonance points progress, sign out |
| **Create** | Record mic or type, choose zone + dissolve timer, release |

---

## Moods

`HEALING 🌱` `EXHAUSTION 🥀` `ANGER 🔥` `JOY ✨` `LONELINESS 🌑`  
`HOPE ☀️` `RAGE ⚡` `NUMB ◯` `COCKROACH 🪳` `DEMAND ✊` `WITNESS 👁️`

---

## Production Upgrades Needed

- **Speech-to-text**: Replace local STT stub with Google Cloud Speech-to-Text or Whisper API
- **Backend**: Add Supabase for user DB, post storage, real echoes/pulse
- **Voice storage**: Upload `.m4a` files to S3/Supabase Storage
- **Push notifications**: Expo Notifications when someone echoes your voice
- **Play Store**: Switch `eas build` profile to `production` for `.aab`
