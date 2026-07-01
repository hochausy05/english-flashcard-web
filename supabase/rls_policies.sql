-- ==========================================
-- SUPABASE ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

-- 1. Enable RLS on all tables
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE vocab_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_session_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE word_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to prevent conflicts
DROP POLICY IF EXISTS "Allow public read access to courses" ON courses;
DROP POLICY IF EXISTS "Allow public read access to lessons" ON lessons;
DROP POLICY IF EXISTS "Allow public read access to vocab_items" ON vocab_items;

DROP POLICY IF EXISTS "Allow authenticated users to insert their own study sessions" ON study_sessions;
DROP POLICY IF EXISTS "Allow authenticated users to select their own study sessions" ON study_sessions;
DROP POLICY IF EXISTS "Allow authenticated users to update their own study sessions" ON study_sessions;

DROP POLICY IF EXISTS "Allow authenticated users to insert their own session lessons" ON study_session_lessons;
DROP POLICY IF EXISTS "Allow authenticated users to select their own session lessons" ON study_session_lessons;
DROP POLICY IF EXISTS "Allow authenticated users to update their own session lessons" ON study_session_lessons;

DROP POLICY IF EXISTS "Allow authenticated users to insert their own study answers" ON study_answers;
DROP POLICY IF EXISTS "Allow authenticated users to select their own study answers" ON study_answers;
DROP POLICY IF EXISTS "Allow authenticated users to update their own study answers" ON study_answers;

DROP POLICY IF EXISTS "Allow authenticated users to select their own word progress" ON word_progress;
DROP POLICY IF EXISTS "Allow authenticated users to insert/update their own word progress" ON word_progress;
DROP POLICY IF EXISTS "Allow authenticated users to update their own word progress" ON word_progress;

DROP POLICY IF EXISTS "Allow authenticated users to select their own settings" ON user_settings;
DROP POLICY IF EXISTS "Allow authenticated users to insert/update their own settings" ON user_settings;
DROP POLICY IF EXISTS "Allow authenticated users to update their own settings" ON user_settings;

DROP POLICY IF EXISTS "Allow users to read their own profile" ON profiles;
DROP POLICY IF EXISTS "Allow users to update their own profile" ON profiles;
DROP POLICY IF EXISTS "Allow admins to read all profiles" ON profiles;

-- 3. Public Read Policies (Allow everyone to read general learning data)
CREATE POLICY "Allow public read access to courses" ON courses
    FOR SELECT USING (true);

CREATE POLICY "Allow public read access to lessons" ON lessons
    FOR SELECT USING (true);

CREATE POLICY "Allow public read access to vocab_items" ON vocab_items
    FOR SELECT USING (true);

-- 4. Study Sessions Policies
CREATE POLICY "Allow authenticated users to insert their own study sessions" ON study_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow authenticated users to select their own study sessions" ON study_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Allow authenticated users to update their own study sessions" ON study_sessions
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 5. Study Session Lessons Policies (Through session ownership check)
CREATE POLICY "Allow authenticated users to insert their own session lessons" ON study_session_lessons
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM study_sessions 
            WHERE study_sessions.id = session_id 
            AND study_sessions.user_id = auth.uid()
        )
    );

CREATE POLICY "Allow authenticated users to select their own session lessons" ON study_session_lessons
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM study_sessions 
            WHERE study_sessions.id = study_session_lessons.session_id 
            AND study_sessions.user_id = auth.uid()
        )
    );

CREATE POLICY "Allow authenticated users to update their own session lessons" ON study_session_lessons
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM study_sessions 
            WHERE study_sessions.id = study_session_lessons.session_id 
            AND study_sessions.user_id = auth.uid()
        )
    ) WITH CHECK (
        EXISTS (
            SELECT 1 FROM study_sessions 
            WHERE study_sessions.id = study_session_lessons.session_id 
            AND study_sessions.user_id = auth.uid()
        )
    );

-- 6. Study Answers Policies (Enforce both user_id match and session ownership)
CREATE POLICY "Allow authenticated users to insert their own study answers" ON study_answers
    FOR INSERT WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (
            SELECT 1 FROM study_sessions 
            WHERE study_sessions.id = session_id 
            AND study_sessions.user_id = auth.uid()
        )
    );

CREATE POLICY "Allow authenticated users to select their own study answers" ON study_answers
    FOR SELECT USING (
        auth.uid() = user_id AND
        EXISTS (
            SELECT 1 FROM study_sessions 
            WHERE study_sessions.id = study_answers.session_id 
            AND study_sessions.user_id = auth.uid()
        )
    );

CREATE POLICY "Allow authenticated users to update their own study answers" ON study_answers
    FOR UPDATE USING (
        auth.uid() = user_id AND
        EXISTS (
            SELECT 1 FROM study_sessions 
            WHERE study_sessions.id = study_answers.session_id 
            AND study_sessions.user_id = auth.uid()
        )
    ) WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (
            SELECT 1 FROM study_sessions 
            WHERE study_sessions.id = study_answers.session_id 
            AND study_sessions.user_id = auth.uid()
        )
    );

-- 7. Word Progress Policies
CREATE POLICY "Allow authenticated users to select their own word progress" ON word_progress
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Allow authenticated users to insert/update their own word progress" ON word_progress
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow authenticated users to update their own word progress" ON word_progress
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 8. User Settings Policies
CREATE POLICY "Allow authenticated users to select their own settings" ON user_settings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Allow authenticated users to insert/update their own settings" ON user_settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow authenticated users to update their own settings" ON user_settings
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 9. Profiles Policies
CREATE POLICY "Allow users to read their own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Allow users to update their own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id)
    WITH CHECK (
        auth.uid() = id AND 
        role = (SELECT role FROM public.profiles WHERE id = auth.uid())
    );

CREATE POLICY "Allow admins to read all profiles" ON profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );


-- ==========================================
-- UNIQUE CONSTRAINT ON WORD_PROGRESS
-- ==========================================
-- This constraint prevents duplicate records for the same word per user,
-- allowing upserts to work correctly.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'word_progress_user_id_vocab_item_id_key'
    ) THEN
        ALTER TABLE word_progress 
        ADD CONSTRAINT word_progress_user_id_vocab_item_id_key UNIQUE (user_id, vocab_item_id);
    END IF;
END $$;
