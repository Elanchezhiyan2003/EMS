-- =============================================
-- COMPLETE EMPLOYEE MANAGEMENT SYSTEM SCHEMA
-- =============================================

-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS attendance CASCADE;
DROP TABLE IF EXISTS work_submissions CASCADE;
DROP TABLE IF EXISTS leaves CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP FUNCTION IF EXISTS is_admin() CASCADE;

-- =============================================
-- 1. PROFILES TABLE
-- =-- =============================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  employee_id TEXT UNIQUE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('employee', 'admin')),
  position TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 2. ATTENDANCE TABLE
-- =============================================
CREATE TABLE attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  check_in TIME,
  check_out TIME,
  work_done TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- =============================================
-- 3. WORK SUBMISSIONS TABLE (Documents, Links)
-- =============================================
CREATE TABLE work_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  work_description TEXT NOT NULL,
  link_url TEXT,
  attachment_url TEXT,
  file_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 4. LEAVES TABLE
-- =============================================
CREATE TABLE leaves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 5. INDEXES FOR PERFORMANCE
-- =============================================
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_attendance_user_id ON attendance(user_id);
CREATE INDEX idx_attendance_date ON attendance(date);
CREATE INDEX idx_work_subs_user_id ON work_submissions(user_id);
CREATE INDEX idx_leaves_user_id ON leaves(user_id);
CREATE INDEX idx_leaves_status ON leaves(status);

-- =============================================
-- 6. HELPER FUNCTIONS
-- =============================================

-- Create a function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;

-- =============================================
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaves ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------
-- PROFILES POLICIES
-- ---------------------------------------------
CREATE POLICY "Users can read own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Allow authenticated users to insert profile" ON profiles FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can read all profiles" ON profiles FOR SELECT USING (is_admin());
CREATE POLICY "Admins can update all profiles" ON profiles FOR UPDATE USING (is_admin());

-- ---------------------------------------------
-- ATTENDANCE POLICIES
-- ---------------------------------------------
CREATE POLICY "Users and admins can read attendance" ON attendance FOR SELECT USING (auth.uid() = user_id OR is_admin());
CREATE POLICY "Users can insert own attendance" ON attendance FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own attendance" ON attendance FOR UPDATE USING (auth.uid() = user_id);

-- ---------------------------------------------
-- WORK SUBMISSIONS POLICIES
-- ---------------------------------------------
CREATE POLICY "Users can view own submissions" ON work_submissions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can submit work" ON work_submissions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all submissions" ON work_submissions FOR SELECT USING (is_admin());

-- ---------------------------------------------
-- LEAVES POLICIES
-- ---------------------------------------------
CREATE POLICY "Users can view own leaves" ON leaves FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can request leave" ON leaves FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all leaves" ON leaves FOR SELECT USING (is_admin());
CREATE POLICY "Admins can update leaves" ON leaves FOR UPDATE USING (is_admin());

-- =============================================
-- 8. STORAGE BUCKET CONFIGURATION
-- =============================================

-- Create storage bucket for work documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('work_documents', 'work_documents', true) 
ON CONFLICT (id) DO NOTHING;

-- Storage Policies
CREATE POLICY "Authenticated users can upload work docs"
  ON storage.objects FOR INSERT
  WITH CHECK ( bucket_id = 'work_documents' AND auth.role() = 'authenticated' );

CREATE POLICY "Public Access to work docs"
  ON storage.objects FOR SELECT
  USING ( bucket_id = 'work_documents' );

CREATE POLICY "Users can delete own work docs"
  ON storage.objects FOR DELETE
  USING ( bucket_id = 'work_documents' AND (auth.uid() = owner OR is_admin()) );
