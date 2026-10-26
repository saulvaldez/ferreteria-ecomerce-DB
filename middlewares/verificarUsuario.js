// Importa el cliente de Supabase configurado
const supabase = require('../config/supabaseClient');

// Define el middleware asíncrono para verificar si el usuario está autenticado
async function verificarUsuario(req, res, next) {
  // Obtiene la cabecera de autorización de la petición o una cadena vacía
  const header = req.headers.authorization || '';
  
  // Extrae el token removiendo el prefijo 'Bearer '
  const token = header.replace('Bearer ', '');

  // Si no hay token, detiene la petición y responde con error 401
  if (!token) {
    return res.status(401).send('Tienes que iniciar sesión');
  }

  // Consulta a Supabase para validar el token y obtener los datos del usuario
  const { data, error } = await supabase.auth.getUser(token);

  // Si ocurre un error o el usuario no existe, rechaza la petición
  if (error || !data.user) {
    return res.status(401).send('Sesión inválida');
  }

  // Guarda los datos del usuario en el objeto 'req' para usarlos más adelante
  req.usuario = data.user;
  
  // Permite que la petición continúe hacia la siguiente función o controlador
  next();
}

// Exporta el middleware para poder usarlo en las rutas
module.exports = verificarUsuario;






