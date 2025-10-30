-- Drop all policies for brand-logos bucket
DROP POLICY IF EXISTS "Anyone can view brand logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload brand logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update brand logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete brand logos" ON storage.objects;

-- Delete the bucket
DELETE FROM storage.buckets WHERE id = 'brand-logos';