-- =============================================
-- MASTER EMS DATABASE SCHEMA (V2)
-- Run this in Supabase SQL Editor
-- =============================================

-- 1. CLEANUP
DROP TABLE IF EXISTS attendance CASCADE;
DROP TABLE IF EXISTS work_submissions CASCADE;
DROP TABLE IF EXISTS leaves CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP FUNCTION IF EXISTS is_admin() CASCADE;

-- 2. CORE TABLES
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  employee_id TEXT UNIQUE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'employee' CHECK (role IN ('employee', 'admin')),
  position TEXT DEFAULT 'Member',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  check_in TIME,
  check_out TIME,
  work_done TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

CREATE TABLE work_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  work_description TEXT NOT NULL,
  link_url TEXT,
  attachment_url TEXT,
  file_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE leaves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. INDEXES
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_attendance_composite ON attendance(user_id, date);
CREATE INDEX idx_work_subs_user ON work_submissions(user_id);
CREATE INDEX idx_leaves_status ON leaves(status);

-- 4. PERMISSIONS & RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaves ENABLE ROW LEVEL SECURITY;

-- Helper Function
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. POLICIES

-- Profiles
CREATE POLICY "Profile Select" ON profiles FOR SELECT USING (auth.uid() = id OR is_admin());
CREATE POLICY "Profile Insert" ON profiles FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Profile Update" ON profiles FOR UPDATE USING (auth.uid() = id OR is_admin());

-- Attendance
CREATE POLICY "Attendance Select" ON attendance FOR SELECT USING (auth.uid() = user_id OR is_admin());
CREATE POLICY "Attendance Insert" ON attendance FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Attendance Update" ON attendance FOR UPDATE USING (auth.uid() = user_id);

-- Work Submissions
CREATE POLICY "Work Select" ON work_submissions FOR SELECT USING (auth.uid() = user_id OR is_admin());
CREATE POLICY "Work Insert" ON work_submissions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Leaves
CREATE POLICY "Leaves Select" ON leaves FOR SELECT USING (auth.uid() = user_id OR is_admin());
CREATE POLICY "Leaves Insert" ON leaves FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Leaves Update" ON leaves FOR UPDATE USING (is_admin());

-- 6. STORAGE
INSERT INTO storage.buckets (id, name, public) VALUES ('work_documents', 'work_documents', true) ON CONFLICT (id) DO NOTHING;
CREATE POLICY "Storage Upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'work_documents');
CREATE POLICY "Storage Select" ON storage.objects FOR SELECT USING (bucket_id = 'work_documents');
