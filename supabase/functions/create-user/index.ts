import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('No authorization header');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) throw new Error('Unauthorized');

    const { data: roles, error: rolesError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);
    if (rolesError || !roles?.some((r) => r.role === 'admin')) {
      throw new Error('User must have admin role');
    }

    const body = await req.json();
    const email = String(body.email ?? '').trim().toLowerCase();
    const password = String(body.password ?? '');
    const nombre = String(body.nombre ?? '').trim();
    const apellido = body.apellido ? String(body.apellido).trim() : null;
    const phone = body.phone ? String(body.phone).trim() : null;
    const branch_id = body.branch_id && body.branch_id !== 'none' ? String(body.branch_id) : null;
    const estado = ['activo', 'inactivo', 'invitado'].includes(body.estado) ? body.estado : 'invitado';
    const newRoles: string[] = Array.isArray(body.roles) ? body.roles : [];

    if (!email.includes('@')) throw new Error('Email inválido');
    if (password.length < 8) throw new Error('La contraseña debe tener al menos 8 caracteres');
    if (!nombre) throw new Error('El nombre es obligatorio');
    if (newRoles.length === 0) throw new Error('Debe asignar al menos un rol');

    const supabaseAdmin = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { nombre, apellido },
    });
    if (createError) throw createError;
    const newUserId = created.user!.id;

    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({ id: newUserId, email, nombre, apellido, phone, branch_id, estado });
    if (profileError) throw profileError;

    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .upsert(newRoles.map((role) => ({ user_id: newUserId, role })), { onConflict: 'user_id,role' });
    if (roleError) throw roleError;

    return new Response(JSON.stringify({ success: true, userId: newUserId }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error creating user:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
