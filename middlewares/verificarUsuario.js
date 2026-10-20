const supabase = require('../config/supabaseClient');

async function verificarUsuario(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.replace('Bearer ', '');

  if (!token) {
    return res.status(401).send('Tienes que iniciar sesión');
  }

  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    return res.status(401).send('Sesión inválida');
  }

  req.usuario = data.user;
  next();
}

module.exports = verificarUsuario;