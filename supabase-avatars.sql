
-- =============================================
-- STORAGE BUCKET CONFIGURATION (for Profile Avatars)
-- =============================================

-- Create storage bucket for avatars
insert into storage.buckets (id, name, public) 
values ('avatars', 'avatars', true);

-- Storage Policies for Avatars

-- Allow Authenticated users (employees) to upload their own avatar
create policy "Authenticated users can upload avatars"
    on storage.objects for insert
    with check ( bucket_id = 'avatars' AND auth.role() = 'authenticated' );

-- Allow public access to view avatars (since they are public profiles)
create policy "Public Access to avatars"
    on storage.objects for select
    using ( bucket_id = 'avatars' );

-- Allow Users to update their own avatar (delete old, insert new usually, or overwrite)
create policy "Users can update own avatar"
    on storage.objects for update
    using ( bucket_id = 'avatars' AND auth.uid() = owner );

-- Allow Users to delete their own avatar
create policy "Users can delete own avatar"
    on storage.objects for delete
    using ( bucket_id = 'avatars' AND auth.uid() = owner );
