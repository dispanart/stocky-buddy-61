CREATE TABLE public.app_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  name text NOT NULL,
  role text NOT NULL DEFAULT 'staff',
  password_hash text NOT NULL,
  last_login timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to app_users" ON public.app_users
  FOR ALL USING (true) WITH CHECK (true);