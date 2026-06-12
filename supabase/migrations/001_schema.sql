-- ============================================================
-- gripX Database Schema
-- Run this in Supabase SQL Editor
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- USERS
-- Supabase Auth handles auth.users
-- This extends it with app-specific data
-- ============================================================
CREATE TABLE public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  pts         INTEGER NOT NULL DEFAULT 10,
  badge_level TEXT NOT NULL DEFAULT 'new',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- NOTE: email is in auth.users — never stored/exposed here

-- ============================================================
-- POSTS (Voice Cards)
-- ============================================================
CREATE TABLE public.posts (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  text            TEXT NOT NULL CHECK (LENGTH(text) >= 2 AND LENGTH(text) <= 500),
  audio_url       TEXT,                    -- Supabase Storage URL
  mood            TEXT NOT NULL,
  topic           TEXT NOT NULL DEFAULT '3am',
  zone            TEXT NOT NULL DEFAULT 'PULSE' CHECK (zone IN ('PULSE','ECHO','SIGNAL')),
  reach           TEXT NOT NULL DEFAULT 'nearby',
  duration_secs   INTEGER NOT NULL DEFAULT 15 CHECK (duration_secs BETWEEN 1 AND 30),
  pulse_score     NUMERIC(3,1) NOT NULL DEFAULT 5.0,
  echo_count      INTEGER NOT NULL DEFAULT 0,
  reply_count     INTEGER NOT NULL DEFAULT 0,
  dissolve_timer  TEXT NOT NULL DEFAULT '48h' CHECK (dissolve_timer IN ('6h','48h','7d')),
  expires_at      TIMESTAMPTZ,             -- set by trigger based on dissolve_timer
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-set expires_at from dissolve_timer
CREATE OR REPLACE FUNCTION set_post_expiry()
RETURNS TRIGGER AS $$
BEGIN
  NEW.expires_at := CASE NEW.dissolve_timer
    WHEN '6h'  THEN NOW() + INTERVAL '6 hours'
    WHEN '48h' THEN NOW() + INTERVAL '48 hours'
    WHEN '7d'  THEN NOW() + INTERVAL '7 days'
    ELSE NOW() + INTERVAL '48 hours'
  END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER post_expiry_trigger
  BEFORE INSERT ON public.posts
  FOR EACH ROW EXECUTE FUNCTION set_post_expiry();

-- Auto-deactivate expired posts
CREATE OR REPLACE FUNCTION deactivate_expired_posts()
RETURNS void AS $$
  UPDATE public.posts
  SET is_active = FALSE
  WHERE expires_at < NOW() AND is_active = TRUE;
$$ LANGUAGE sql;

-- ============================================================
-- ECHOES (Reactions — like a like but called echo)
-- ============================================================
CREATE TABLE public.echoes (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id    UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(post_id, user_id)  -- one echo per user per post
);

-- Auto update post echo_count and owner pts when echo added/removed
CREATE OR REPLACE FUNCTION update_echo_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts SET echo_count = echo_count + 1 WHERE id = NEW.post_id;
    -- Give post owner +5 pts
    UPDATE public.profiles p
    SET pts = pts + 5
    FROM public.posts po
    WHERE po.id = NEW.post_id AND p.id = po.user_id AND po.user_id != NEW.user_id;
    -- Give echoer +2 pts
    UPDATE public.profiles SET pts = pts + 2 WHERE id = NEW.user_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts SET echo_count = GREATEST(echo_count - 1, 0) WHERE id = OLD.post_id;
    UPDATE public.profiles p
    SET pts = GREATEST(pts - 5, 0)
    FROM public.posts po
    WHERE po.id = OLD.post_id AND p.id = po.user_id AND po.user_id != OLD.user_id;
    UPDATE public.profiles SET pts = GREATEST(pts - 2, 0) WHERE id = OLD.user_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER echo_count_trigger
  AFTER INSERT OR DELETE ON public.echoes
  FOR EACH ROW EXECUTE FUNCTION update_echo_count();

-- ============================================================
-- REPLIES (Voice replies to posts)
-- ============================================================
CREATE TABLE public.replies (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id       UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  text          TEXT NOT NULL,
  audio_url     TEXT,
  mood          TEXT NOT NULL DEFAULT 'HEALING',
  duration_secs INTEGER NOT NULL DEFAULT 10,
  echo_count    INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto update post reply_count
CREATE OR REPLACE FUNCTION update_reply_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts SET reply_count = reply_count + 1 WHERE id = NEW.post_id;
    -- Post owner gets +8 pts for a voice reply
    UPDATE public.profiles p
    SET pts = pts + 8
    FROM public.posts po
    WHERE po.id = NEW.post_id AND p.id = po.user_id AND po.user_id != NEW.user_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts SET reply_count = GREATEST(reply_count - 1, 0) WHERE id = OLD.post_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER reply_count_trigger
  AFTER INSERT OR DELETE ON public.replies
  FOR EACH ROW EXECUTE FUNCTION update_reply_count();

-- ============================================================
-- REPLY ECHOES
-- ============================================================
CREATE TABLE public.reply_echoes (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reply_id   UUID NOT NULL REFERENCES public.replies(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(reply_id, user_id)
);

CREATE OR REPLACE FUNCTION update_reply_echo_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.replies SET echo_count = echo_count + 1 WHERE id = NEW.reply_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.replies SET echo_count = GREATEST(echo_count - 1, 0) WHERE id = OLD.reply_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER reply_echo_trigger
  AFTER INSERT OR DELETE ON public.reply_echoes
  FOR EACH ROW EXECUTE FUNCTION update_reply_echo_count();

-- ============================================================
-- SAVED POSTS (Bookmarks)
-- ============================================================
CREATE TABLE public.saved_posts (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id    UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);

-- ============================================================
-- SWARMS (Live collective voice events)
-- ============================================================
CREATE TABLE public.swarms (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  topic         TEXT NOT NULL,
  mood          TEXT NOT NULL,
  created_by    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  voice_count   INTEGER NOT NULL DEFAULT 0,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  color         TEXT NOT NULL DEFAULT '#FF3366',
  starts_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ends_at       TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '2 hours',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.swarm_participants (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  swarm_id   UUID NOT NULL REFERENCES public.swarms(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(swarm_id, user_id)
);

CREATE OR REPLACE FUNCTION update_swarm_voice_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.swarms SET voice_count = voice_count + 1 WHERE id = NEW.swarm_id;
    -- +20 pts for joining a swarm
    UPDATE public.profiles SET pts = pts + 20 WHERE id = NEW.user_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.swarms SET voice_count = GREATEST(voice_count - 1, 0) WHERE id = OLD.swarm_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER swarm_count_trigger
  AFTER INSERT OR DELETE ON public.swarm_participants
  FOR EACH ROW EXECUTE FUNCTION update_swarm_voice_count();

-- ============================================================
-- KNOCKS (Anonymous proximity signals)
-- ============================================================
CREATE TABLE public.knocks (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_user   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  to_user     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id     UUID REFERENCES public.posts(id) ON DELETE SET NULL,
  status      TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','expired')),
  expires_at  TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '24 hours',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(from_user, to_user)
);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE TABLE public.notifications (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type       TEXT NOT NULL CHECK (type IN ('echo','reply','knock','swarm','badge')),
  title      TEXT NOT NULL,
  body       TEXT NOT NULL,
  post_id    UUID REFERENCES public.posts(id) ON DELETE SET NULL,
  is_read    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-create notification on echo
CREATE OR REPLACE FUNCTION notify_on_echo()
RETURNS TRIGGER AS $$
DECLARE
  post_owner UUID;
  post_text TEXT;
BEGIN
  SELECT user_id, text INTO post_owner, post_text FROM public.posts WHERE id = NEW.post_id;
  IF post_owner IS NOT NULL AND post_owner != NEW.user_id THEN
    INSERT INTO public.notifications (user_id, type, title, body, post_id)
    VALUES (post_owner, 'echo', 'someone echoed your voice', 
            LEFT(post_text, 60) || '...', NEW.post_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER echo_notification_trigger
  AFTER INSERT ON public.echoes
  FOR EACH ROW EXECUTE FUNCTION notify_on_echo();

-- Auto-create notification on reply
CREATE OR REPLACE FUNCTION notify_on_reply()
RETURNS TRIGGER AS $$
DECLARE
  post_owner UUID;
  post_text TEXT;
BEGIN
  SELECT user_id, text INTO post_owner, post_text FROM public.posts WHERE id = NEW.post_id;
  IF post_owner IS NOT NULL AND post_owner != NEW.user_id THEN
    INSERT INTO public.notifications (user_id, type, title, body, post_id)
    VALUES (post_owner, 'reply', 'someone replied to your voice',
            LEFT(post_text, 60) || '...', NEW.post_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER reply_notification_trigger
  AFTER INSERT ON public.replies
  FOR EACH ROW EXECUTE FUNCTION notify_on_reply();

-- Auto-update badge level when pts change
CREATE OR REPLACE FUNCTION update_badge_level()
RETURNS TRIGGER AS $$
BEGIN
  NEW.badge_level := CASE
    WHEN NEW.pts >= 10000 THEN 'indestructible'
    WHEN NEW.pts >= 2000  THEN 'swarm'
    WHEN NEW.pts >= 500   THEN 'colony'
    WHEN NEW.pts >= 100   THEN 'cockroach'
    ELSE 'new'
  END;
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER badge_update_trigger
  BEFORE UPDATE OF pts ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_badge_level();

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, pts, badge_level)
  VALUES (NEW.id, 10, 'new');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- INDEXES for performance
-- ============================================================
CREATE INDEX idx_posts_created_at   ON public.posts(created_at DESC);
CREATE INDEX idx_posts_topic        ON public.posts(topic);
CREATE INDEX idx_posts_mood         ON public.posts(mood);
CREATE INDEX idx_posts_zone         ON public.posts(zone);
CREATE INDEX idx_posts_is_active    ON public.posts(is_active);
CREATE INDEX idx_posts_expires_at   ON public.posts(expires_at);
CREATE INDEX idx_posts_echo_count   ON public.posts(echo_count DESC);
CREATE INDEX idx_echoes_post_id     ON public.echoes(post_id);
CREATE INDEX idx_echoes_user_id     ON public.echoes(user_id);
CREATE INDEX idx_replies_post_id    ON public.replies(post_id);
CREATE INDEX idx_saved_user_id      ON public.saved_posts(user_id);
CREATE INDEX idx_swarms_is_active   ON public.swarms(is_active);
CREATE INDEX idx_notifs_user_unread ON public.notifications(user_id, is_read);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- Protects user privacy — userId never exposed to other users
-- ============================================================
ALTER TABLE public.profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.echoes           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.replies          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reply_echoes     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_posts      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.swarms           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.swarm_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knocks           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications    ENABLE ROW LEVEL SECURITY;

-- profiles: users can only read/update their own
CREATE POLICY "profiles: own read" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles: own update" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- posts: anyone can read active posts, only owner can insert/delete
CREATE POLICY "posts: read active" ON public.posts FOR SELECT USING (is_active = TRUE);
CREATE POLICY "posts: own insert"  ON public.posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "posts: own delete"  ON public.posts FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "posts: own update"  ON public.posts FOR UPDATE USING (auth.uid() = user_id);

-- echoes: read all, insert/delete own only
CREATE POLICY "echoes: read all"   ON public.echoes FOR SELECT USING (TRUE);
CREATE POLICY "echoes: own insert" ON public.echoes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "echoes: own delete" ON public.echoes FOR DELETE USING (auth.uid() = user_id);

-- replies: read all, insert own
CREATE POLICY "replies: read all"   ON public.replies FOR SELECT USING (TRUE);
CREATE POLICY "replies: own insert" ON public.replies FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "replies: own delete" ON public.replies FOR DELETE USING (auth.uid() = user_id);

-- reply_echoes: read all, own insert/delete
CREATE POLICY "reply_echoes: read"   ON public.reply_echoes FOR SELECT USING (TRUE);
CREATE POLICY "reply_echoes: insert" ON public.reply_echoes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "reply_echoes: delete" ON public.reply_echoes FOR DELETE USING (auth.uid() = user_id);

-- saved_posts: private, own only
CREATE POLICY "saved: own all" ON public.saved_posts FOR ALL USING (auth.uid() = user_id);

-- swarms: read all active, own insert
CREATE POLICY "swarms: read active" ON public.swarms FOR SELECT USING (is_active = TRUE);
CREATE POLICY "swarms: own insert"  ON public.swarms FOR INSERT WITH CHECK (auth.uid() = created_by);

-- swarm_participants: read all, own insert/delete
CREATE POLICY "swarm_p: read"   ON public.swarm_participants FOR SELECT USING (TRUE);
CREATE POLICY "swarm_p: insert" ON public.swarm_participants FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "swarm_p: delete" ON public.swarm_participants FOR DELETE USING (auth.uid() = user_id);

-- knocks: only sender and receiver can see
CREATE POLICY "knocks: own" ON public.knocks FOR ALL 
  USING (auth.uid() = from_user OR auth.uid() = to_user);

-- notifications: own only
CREATE POLICY "notifs: own" ON public.notifications FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- VIEWS (safe data — never exposes user_id)
-- ============================================================

-- Public feed view: never exposes user_id
CREATE VIEW public.feed_view AS
SELECT
  p.id,
  p.text,
  p.audio_url,
  p.mood,
  p.topic,
  p.zone,
  p.reach,
  p.duration_secs,
  p.pulse_score,
  p.echo_count,
  p.reply_count,
  p.dissolve_timer,
  p.expires_at,
  p.created_at,
  -- Never expose user_id — always anonymous
  '@anonymous' AS author
FROM public.posts p
WHERE p.is_active = TRUE
ORDER BY p.created_at DESC;

-- Replies view: also anonymous
CREATE VIEW public.replies_view AS
SELECT
  r.id,
  r.post_id,
  r.text,
  r.audio_url,
  r.mood,
  r.duration_secs,
  r.echo_count,
  r.created_at,
  '@anonymous' AS author
FROM public.replies r;

-- City pulse aggregation
CREATE VIEW public.city_pulse AS
SELECT
  zone,
  mood,
  COUNT(*) AS voice_count,
  AVG(pulse_score) AS avg_pulse
FROM public.posts
WHERE is_active = TRUE
  AND created_at > NOW() - INTERVAL '24 hours'
GROUP BY zone, mood
ORDER BY voice_count DESC;

-- Seed swarm data
INSERT INTO public.swarms (topic, mood, created_by, voice_count, is_active, color, ends_at)
SELECT 
  s.topic, s.mood, (SELECT id FROM auth.users LIMIT 1), 
  s.voice_count, s.is_active, s.color,
  NOW() + s.duration::INTERVAL
FROM (VALUES
  ('NEET ko Jawab Do',   'DEMAND',    1240, TRUE,  '#FF4500', '2 hours'),
  ('Main Bhi Cockroach', 'COCKROACH', 3820, TRUE,  '#D4AF37', '45 minutes'),
  ('3am Club India',     'LONELINESS', 890, FALSE, '#60A5FA', '0 minutes'),
  ('Kota Speaks',        'RAGE',      2100, TRUE,  '#FF4500', '1 hour')
) AS s(topic, mood, voice_count, is_active, color, duration)
WHERE EXISTS (SELECT 1 FROM auth.users LIMIT 1);

