// Importamos el SDK de Supabase para crear clientes y nuestro cliente principal
const { createClient } = require('@supabase/supabase-js');
const supabase = require('../config/supabaseClient');

async function registrar(email, password, nombre) {
  // Explicación: Usamos la API de admin para crear el usuario en Supabase Auth sin confirmar mail
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  });

  if (error) throw error;

  // Explicación: Guardamos los datos adicionales (nombre) en la tabla 'perfiles' vinculando el ID
  const { error: e2 } = await supabase.from('perfiles')
    .insert({ id: data.user.id, nombre });

  if (e2) throw e2;

  // Retornamos el usuario registrado
  return data.user;
}

async function iniciarSesion(email, password) {
  // Explicación: Creamos un cliente temporal sin guardar sesión persistente para evitar desacoples
  const temporal = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY,
    { auth: { persistSession: false } }
  );

  // Explicación: Validamos las credenciales contra Supabase Auth
  const { data, error } = await temporal.auth.signInWithPassword({ email, password });
  if (error) return null;

  // Retornamos el token de acceso JWT al cliente
  return data.session.access_token;
}

module.exports = { registrar, iniciarSesion };