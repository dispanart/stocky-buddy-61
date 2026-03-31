
CREATE TABLE public.items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  sku text,
  category text,
  base_unit text NOT NULL DEFAULT '',
  units jsonb DEFAULT '[]'::jsonb,
  stock numeric NOT NULL DEFAULT 0,
  min_stock numeric NOT NULL DEFAULT 0,
  icon text DEFAULT 'Package',
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid REFERENCES public.items(id) ON DELETE CASCADE,
  item_name text NOT NULL,
  type text NOT NULL,
  quantity numeric NOT NULL DEFAULT 0,
  unit text,
  base_quantity numeric NOT NULL DEFAULT 0,
  note text,
  reference text,
  performed_by text,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to items" ON public.items FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to transactions" ON public.transactions FOR ALL TO public USING (true) WITH CHECK (true);
