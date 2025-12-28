-- Create 'avatars' bucket
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Create 'post-images' bucket
insert into storage.buckets (id, name, public)
values ('post-images', 'post-images', true)
on conflict (id) do nothing;

-- Note: RLS on storage.objects is enabled by default in Supabase.
-- Skipping 'alter table storage.objects enable row level security;' to avoid permission errors.

-- Policies for 'avatars'

drop policy if exists "Avatar images are publicly accessible." on storage.objects;
create policy "Avatar images are publicly accessible."
  on storage.objects for select
  using ( bucket_id = 'avatars' );

drop policy if exists "Anyone can upload an avatar." on storage.objects;
create policy "Anyone can upload an avatar."
  on storage.objects for insert
  with check ( bucket_id = 'avatars' and auth.role() = 'authenticated' );

drop policy if exists "Users can update their own avatars." on storage.objects;
create policy "Users can update their own avatars."
  on storage.objects for update
  using ( bucket_id = 'avatars' and auth.uid() = owner )
  with check ( bucket_id = 'avatars' and auth.uid() = owner );

drop policy if exists "Users can delete their own avatars." on storage.objects;
create policy "Users can delete their own avatars."
  on storage.objects for delete
  using ( bucket_id = 'avatars' and auth.uid() = owner );


-- Policies for 'post-images'

drop policy if exists "Post images are publicly accessible." on storage.objects;
create policy "Post images are publicly accessible."
  on storage.objects for select
  using ( bucket_id = 'post-images' );

drop policy if exists "Authenticated users can upload post images." on storage.objects;
create policy "Authenticated users can upload post images."
  on storage.objects for insert
  with check ( bucket_id = 'post-images' and auth.role() = 'authenticated' );

drop policy if exists "Users can update their own post images." on storage.objects;
create policy "Users can update their own post images."
  on storage.objects for update
  using ( bucket_id = 'post-images' and auth.uid() = owner )
  with check ( bucket_id = 'post-images' and auth.uid() = owner );

drop policy if exists "Users can delete their own post images." on storage.objects;
create policy "Users can delete their own post images."
  on storage.objects for delete
  using ( bucket_id = 'post-images' and auth.uid() = owner );
