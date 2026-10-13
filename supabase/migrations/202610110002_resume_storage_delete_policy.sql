create policy "Users can delete their own resume"
  on storage.objects
  for delete
  using (bucket_id = 'resumes' and auth.uid()::text = (storage.foldername(name))[1]);