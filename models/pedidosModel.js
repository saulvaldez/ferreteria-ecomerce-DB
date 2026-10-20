const supabase = require('../config/supabaseClient');

// Error personalizado para enviar estado HTTP 400 cuando falla una validación
function errorCliente(mensaje) {
  const e = new Error(mensaje);
  e.status = 400;
  return e;
}

async function crearPedido(usuarioId, items) {
  // 1. Extraemos los IDs de los productos recibidos en el carrito
  const ids = items.map(i => i.producto_id);
  
  // 2. Traemos desde Supabase los datos actualizados de los productos a comprar
  const { data: productos, error: e1 } = await supabase
    .from('productos')
    .select('id, nombre, precio, stock')
    .in('id', ids)
    .eq('activo', true);

  if (e1) throw e1;

  let total = 0;
  const filas = [];

  // 3. Validamos las existencias, stock y calculamos el total con el precio oficial de la DB
  for (const item of items) {
    const p = productos.find(x => x.id === item.producto_id);
    if (!p) throw errorCliente('No existe el producto ID ' + item.producto_id);
    if (!Number.isInteger(item.cantidad) || item.cantidad < 1) {
      throw errorCliente('Cantidad inválida para ' + p.nombre);
    }
    if (p.stock < item.cantidad) throw errorCliente('Sin stock de ' + p.nombre);

    total += p.precio * item.cantidad;
    filas.push({ producto_id: p.id, cantidad: item.cantidad, precio_unitario: p.precio });
  }

  // 4. Creamos el registro en la tabla 'pedidos'
  const { data: pedido, error: e2 } = await supabase
    .from('pedidos')
    .insert({ usuario_id: usuarioId, total })
    .select()
    .single();

  if (e2) throw e2;

  // 5. Insertamos cada detalle en 'pedido_items' vinculando el ID del pedido
  const conPedido = filas.map(f => ({ ...f, pedido_id: pedido.id }));
  const { error: e3 } = await supabase.from('pedido_items').insert(conPedido);
  if (e3) throw e3;

  // 6. Descontamos el stock de cada producto en la tabla 'productos'
  for (const f of filas) {
    const p = productos.find(x => x.id === f.producto_id);
    await supabase.from('productos')
      .update({ stock: p.stock - f.cantidad })
      .eq('id', p.id);
  }

  return pedido;
}

module.exports = { crearPedido };