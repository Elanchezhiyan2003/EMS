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

-- Policies

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
