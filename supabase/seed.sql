insert into public.cabin (id, slug, name, headline, description, nightly_rate, jacuzzi_rate, max_guests, area_m2)
values
  ('00000000-0000-0000-0000-000000000001', 'laguna-norte', 'Laguna Norte', 'Vista al volcán', 'Cabaña inmersa entre lengas con hot tub exterior.', 165000, 20000, 4, 78),
  ('00000000-0000-0000-0000-000000000002', 'bosque-sur', 'Bosque Sur', 'Arquitectura en madera', 'Doble altura con quincho cerrado y jacuzzi interior.', 210000, 25000, 6, 112),
  ('00000000-0000-0000-0000-000000000003', 'andino-lodge', 'Andino Lodge', 'Refugio XXL', 'Lodge con sauna, sala multimedia y terrazas panorámicas.', 285000, 32000, 8, 150)
on conflict (slug) do nothing;

insert into public.cabin_image (cabin_id, url, caption, position)
values
  ('00000000-0000-0000-0000-000000000001', 'https://images.unsplash.com/photo-1523419409543-0c1df022bddb?auto=format&fit=crop&w=1800&q=80', 'Exterior Laguna Norte', 0),
  ('00000000-0000-0000-0000-000000000001', 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1200&q=80', 'Interior Laguna Norte', 1),
  ('00000000-0000-0000-0000-000000000002', 'https://images.unsplash.com/photo-1448630360428-65456885c650?auto=format&fit=crop&w=1800&q=80', 'Exterior Bosque Sur', 0),
  ('00000000-0000-0000-0000-000000000003', 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1800&q=80', 'Exterior Andino Lodge', 0)
on conflict do nothing;

-- Sample price calendar overrides for holidays
insert into public.price_calendar (cabin_id, cabin_slug, date, nightly_rate)
values
  ('00000000-0000-0000-0000-000000000001', 'laguna-norte', '2025-12-24', 190000),
  ('00000000-0000-0000-0000-000000000002', 'bosque-sur', '2025-12-24', 235000),
  ('00000000-0000-0000-0000-000000000003', 'andino-lodge', '2025-12-31', 320000)
on conflict (cabin_id, date) do update set nightly_rate = excluded.nightly_rate;

-- Seed admin user (replace UUID with auth user id)
insert into public."user" (id, role)
values ('00000000-0000-0000-0000-00000000a11c', 'admin')
on conflict (id) do update set role = excluded.role;

-- Example admin block (maintenance)
insert into public.admin_block (cabin_id, cabin_slug, start_date, end_date, reason)
values ('00000000-0000-0000-0000-000000000002', 'bosque-sur', '2025-11-10', '2025-11-12', 'Mantención jacuzzi')
on conflict do nothing;
