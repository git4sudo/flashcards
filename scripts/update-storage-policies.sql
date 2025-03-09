-- Drop existing policies
DROP POLICY IF EXISTS "Give users authenticated access to folder 1" ON storage.objects;
DROP POLICY IF EXISTS "Give users authenticated access to folder 2" ON storage.objects;
DROP POLICY IF EXISTS "Enable read access for all users" ON storage.objects;
DROP POLICY IF EXISTS "Enable insert access for all users" ON storage.objects;
DROP POLICY IF EXISTS "Enable update access for all users" ON storage.objects;
DROP POLICY IF EXISTS "Enable delete access for all users" ON storage.objects;
-- Create new policies
CREATE POLICY "Allow public read access" ON storage.objects FOR
SELECT USING (bucket_id = 'flashcards');
-- Make bucket public
UPDATE storage.buckets
SET public = true
WHERE id = 'flashcards';