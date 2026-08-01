ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS badges text[] NOT NULL DEFAULT '{}';

DROP POLICY IF EXISTS "submitters update own pending" ON public.projects;
CREATE POLICY "owners update own projects" ON public.projects
  FOR UPDATE TO authenticated
  USING (submitter_id = auth.uid())
  WITH CHECK (submitter_id = auth.uid());

CREATE POLICY "owners delete own projects" ON public.projects
  FOR DELETE TO authenticated
  USING (submitter_id = auth.uid());

CREATE OR REPLACE FUNCTION public.projects_guard_privileged_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.has_role(auth.uid(), 'admin') OR auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;
  NEW.status := OLD.status;
  NEW.verified := OLD.verified;
  NEW.featured := OLD.featured;
  NEW.badges := OLD.badges;
  NEW.payment_tx := OLD.payment_tx;
  NEW.payment_amount := OLD.payment_amount;
  NEW.payment_at := OLD.payment_at;
  NEW.submitter_id := OLD.submitter_id;
  IF OLD.status <> 'approved'::project_status THEN
    NEW.is_public := OLD.is_public;
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS projects_guard_privileged_fields ON public.projects;
CREATE TRIGGER projects_guard_privileged_fields
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.projects_guard_privileged_fields();