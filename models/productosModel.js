// Importamos el cliente de Supabase
const supabase = require('../config/supabaseClient');

async function obtenerProductos(categoriaId) {
  // definimos qué columnas traer e incluimos el nombre de la categoría vía JOIN
  const columnas = 'id, nombre, descripcion, precio, stock, imagen_url, categorias (nombre)';
  
  // preparamos la consulta a la tabla productos filtrando solo los activos
  let consulta = supabase
    .from('productos')
    .select(columnas)
    .eq('activo', true)
    .order('nombre');

  // si recibimos un ID de categoría, agregamos la condición a la consulta
  if (categoriaId) {
    consulta = consulta.eq('categoria_id', categoriaId);
  }

  // ejecutamos la consulta a la base de datos y verificamos si hubo errores
  const { data, error } = await consulta;
  if (error) throw error;
  
  // Retornamos el listado de productos de ferretería
  return data;
}

module.exports = { obtenerProductos };