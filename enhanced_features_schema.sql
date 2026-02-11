-- =============================================
-- WORK SUBMISSIONS TABLE (Documents, Links)
-- =============================================

DROP TABLE IF EXISTS work_submissions CASCADE;

CREATE TABLE work_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  work_description TEXT NOT NULL,
  link_url TEXT,
  attachment_url TEXT,
  file_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for performance
CREATE INDEX idx_work_subs_user_id ON work_submissions(user_id);

-- Enable RLS
ALTER TABLE work_submissions ENABLE ROW LEVEL SECURITY;

-- Policies for Work Submissions
-- Employees can view own submissions
CREATE POLICY "Users can view own submissions"
  ON work_submissions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Employees can submit work (insert)
CREATE POLICY "Users can submit work"
  ON work_submissions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins can view all submissions
CREATE POLICY "Admins can view all submissions"
  ON work_submissions
  FOR SELECT
  USING (is_admin());

-- =============================================
-- LEAVES TABLE
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

-- Index for performance
CREATE INDEX idx_leaves_user_id ON leaves(user_id);
CREATE INDEX idx_leaves_status ON leaves(status);

-- Enable RLS
ALTER TABLE leaves ENABLE ROW LEVEL SECURITY;

-- Policies for Leaves
-- Employees can see their own leaves
CREATE POLICY "Users can view own leaves"
  ON leaves
  FOR SELECT
  USING (auth.uid() = user_id);

-- Employees can request leave (insert)
CREATE POLICY "Users can request leave"
  ON leaves
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins can view all leaves
CREATE POLICY "Admins can view all leaves"
  ON leaves
  FOR SELECT
  USING (is_admin());

-- Admins can update leave status
CREATE POLICY "Admins can update leaves"
  ON leaves
  FOR UPDATE
  USING (is_admin());

-- =============================================
-- STORAGE BUCKET CONFIGURATION (for Work Documents)
-- =============================================

-- Create storage bucket (needs to be run in SQL Editor as Supabase storage is separate)
insert into storage.buckets (id, name, public) 
values ('work_documents', 'work_documents', true) 
ON CONFLICT (id) DO NOTHING;

-- Storage Policies
-- Allow Authenticated users (employees) to upload files
create policy "Authenticated users can upload work docs"
  on storage.objects for insert
  with check ( bucket_id = 'work_documents' AND auth.role() = 'authenticated' );

-- Allow Authenticated users to view files (public bucket, but restrict via policy if needed)
create policy "Public Access to work docs"
  on storage.objects for select
  using ( bucket_id = 'work_documents' );

-- Allow Users to delete their own files
create policy "Users can delete own work docs"
  on storage.objects for delete
  using ( bucket_id = 'work_documents' AND auth.uid() = owner );
