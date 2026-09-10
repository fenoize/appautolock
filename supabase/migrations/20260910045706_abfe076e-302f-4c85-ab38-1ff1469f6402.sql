-- RLS policies for the private "comprobantes" bucket (quote payment receipts)

CREATE POLICY "Authenticated users can upload comprobantes"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'comprobantes');

CREATE POLICY "Authenticated users can read comprobantes"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'comprobantes');

CREATE POLICY "Authenticated users can update comprobantes"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'comprobantes')
WITH CHECK (bucket_id = 'comprobantes');

CREATE POLICY "Authenticated users can delete comprobantes"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'comprobantes');