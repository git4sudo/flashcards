-- Enable RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
-- Create policies for the flashcards bucket
CREATE POLICY "Enable read access for all users" ON storage.objects FOR
SELECT USING (bucket_id = 'flashcards');
CREATE POLICY "Enable insert access for all users" ON storage.objects FOR
INSERT WITH CHECK (bucket_id = 'flashcards');
CREATE POLICY "Enable update access for all users" ON storage.objects FOR
UPDATE USING (bucket_id = 'flashcards');
CREATE POLICY "Enable delete access for all users" ON storage.objects FOR DELETE USING (bucket_id = 'flashcards');