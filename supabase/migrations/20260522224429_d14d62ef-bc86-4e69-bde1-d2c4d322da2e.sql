INSERT INTO public.settings (clave, valor, descripcion, tipo_dato) VALUES
  ('empresa_logo_dark_url', '', 'Logo versión oscura (modo oscuro)', 'text'),
  ('empresa_favicon_url', '', 'Favicon / logo compacto (modo claro)', 'text'),
  ('empresa_favicon_dark_url', '', 'Favicon / logo compacto (modo oscuro)', 'text')
ON CONFLICT (clave) DO NOTHING;