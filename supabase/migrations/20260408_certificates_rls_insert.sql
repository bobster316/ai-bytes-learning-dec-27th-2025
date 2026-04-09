-- Migration: 20260408_certificates_rls_insert
-- Description: Adds missing INSERT and UPDATE RLS policies to the certificates table.
--              Without these, authenticated users could SELECT their certificates
--              but the server-side insert in the completion page would be silently denied,
--              resulting in certificates never being persisted.

-- Allow authenticated users to insert their own certificate records
CREATE POLICY "Users can insert own certificates" ON certificates
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to update their own certificate records (e.g. pdf_url backfill)
CREATE POLICY "Users can update own certificates" ON certificates
    FOR UPDATE USING (auth.uid() = user_id);
