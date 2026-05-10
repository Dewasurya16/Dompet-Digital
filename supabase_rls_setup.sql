-- ================================================================
-- SCRIPT INI UNTUK DIJALANKAN DI SUPABASE SQL EDITOR
-- Tujuan: Menambah kolom user_id di tabel transactions (jika belum ada)
-- dan mengaktifkan Row Level Security (RLS) agar data terisolasi per-user
-- ================================================================

-- 1. Tambahkan kolom user_id ke tabel transactions (jika belum ada)
ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. Aktifkan Row Level Security (RLS) di semua tabel
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pockets ENABLE ROW LEVEL SECURITY;
ALTER TABLE investments ENABLE ROW LEVEL SECURITY;

-- ================================================================
-- 3. Buat Policy untuk tabel TRANSACTIONS
-- ================================================================
-- Hapus policy lama jika ada
DROP POLICY IF EXISTS "Users can view their own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can insert their own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can update their own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can delete their own transactions" ON transactions;

-- Policy baru
CREATE POLICY "Users can view their own transactions"
  ON transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own transactions"
  ON transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own transactions"
  ON transactions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own transactions"
  ON transactions FOR DELETE
  USING (auth.uid() = user_id);

-- ================================================================
-- 4. Buat Policy untuk tabel POCKETS
-- ================================================================
DROP POLICY IF EXISTS "Users can view their own pockets" ON pockets;
DROP POLICY IF EXISTS "Users can insert their own pockets" ON pockets;
DROP POLICY IF EXISTS "Users can update their own pockets" ON pockets;
DROP POLICY IF EXISTS "Users can delete their own pockets" ON pockets;

CREATE POLICY "Users can view their own pockets"
  ON pockets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own pockets"
  ON pockets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pockets"
  ON pockets FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own pockets"
  ON pockets FOR DELETE
  USING (auth.uid() = user_id);

-- ================================================================
-- 5. Buat Policy untuk tabel INVESTMENTS
-- ================================================================
DROP POLICY IF EXISTS "Users can view their own investments" ON investments;
DROP POLICY IF EXISTS "Users can insert their own investments" ON investments;
DROP POLICY IF EXISTS "Users can update their own investments" ON investments;
DROP POLICY IF EXISTS "Users can delete their own investments" ON investments;

CREATE POLICY "Users can view their own investments"
  ON investments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own investments"
  ON investments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own investments"
  ON investments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own investments"
  ON investments FOR DELETE
  USING (auth.uid() = user_id);

-- ================================================================
-- SELESAI! Sekarang setiap user hanya bisa melihat data miliknya sendiri.
-- ================================================================
