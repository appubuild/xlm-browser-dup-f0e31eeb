ALTER TABLE public.author_profiles ADD COLUMN IF NOT EXISTS featured boolean NOT NULL DEFAULT false;

UPDATE public.author_profiles SET official_email = NULL WHERE official_email = '';

WITH d AS (
  SELECT id, row_number() OVER (PARTITION BY lower(company_name) ORDER BY created_at) AS rn
  FROM public.author_profiles
)
UPDATE public.author_profiles p SET company_name = p.company_name || ' (' || d.rn || ')'
FROM d WHERE d.id = p.id AND d.rn > 1;

WITH e AS (
  SELECT id, row_number() OVER (PARTITION BY lower(official_email) ORDER BY created_at) AS rn
  FROM public.author_profiles WHERE official_email IS NOT NULL
)
UPDATE public.author_profiles p SET official_email = NULL
FROM e WHERE e.id = p.id AND e.rn > 1;

CREATE UNIQUE INDEX IF NOT EXISTS author_profiles_company_name_uniq ON public.author_profiles (lower(company_name));
CREATE UNIQUE INDEX IF NOT EXISTS author_profiles_official_email_uniq ON public.author_profiles (lower(official_email)) WHERE official_email IS NOT NULL;