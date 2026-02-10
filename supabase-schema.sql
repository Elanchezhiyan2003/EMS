-- =============================================
-- Employee Check-In/Check-Out Database Schema
-- =============================================

-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS attendance CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP FUNCTION IF EXISTS is_admin() CASCADE;

-- Create profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  employee_id TEXT UNIQUE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('employee', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  position TEXT NOT NULL
);

-- Create attendance table
CREATE TABLE attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  check_in TIME,
  check_out TIME,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Create indexes for better performance
CREATE INDEX idx_attendance_user_id ON attendance(user_id);
CREATE INDEX idx_attendance_date ON attendance(date);
CREATE INDEX idx_profiles_email ON profiles(email);

-- =============================================
-- Helper Function to Check Admin Role
-- =============================================

-- Create a function to check if user is admin (avoids recursion)
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
-- Row Level Security (RLS) Policies
-- =============================================

-- Enable RLS on tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- =============================================
-- PROFILES TABLE POLICIES
-- =============================================

-- Allow users to read their own profile
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Allow authenticated users to insert profile during registration
CREATE POLICY "Allow authenticated users to insert profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Allow admins to read all profiles
CREATE POLICY "Admins can read all profiles"
  ON profiles
  FOR SELECT
  USING (is_admin());

-- Allow admins to update all profiles (for employee_id management)
CREATE POLICY "Admins can update all profiles"
  ON profiles
  FOR UPDATE
  USING (is_admin());

-- =============================================
-- ATTENDANCE TABLE POLICIES
-- =============================================

-- Allow users to read their own attendance OR all if admin
CREATE POLICY "Users and admins can read attendance"
  ON attendance
  FOR SELECT
  USING (
    auth.uid() = user_id OR is_admin()
  );

-- Allow users to insert their own attendance
CREATE POLICY "Users can insert own attendance"
  ON attendance
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own attendance
CREATE POLICY "Users can update own attendance"
  ON attendance
  FOR UPDATE
  USING (auth.uid() = user_id);