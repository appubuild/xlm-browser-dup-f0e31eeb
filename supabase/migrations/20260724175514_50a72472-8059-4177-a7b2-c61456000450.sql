ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS cloudinary_cloud_name text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS cloudinary_upload_preset text NOT NULL DEFAULT '';