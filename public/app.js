// =========================================================
// FRONT DE LA TIENDA - FERRETERÍA
// =========================================================

// ---------- ESTADO ----------
const catalogo = {};  
let carrito = JSON.parse(localStorage.getItem('carrito')) || [];   
let token = localStorage.getItem('token');                         
let usuarioEmail = localStorage.getItem('email'); 
let categoriaActual = null;

// =========================================================
// CATALOGO Y CATEGORÍAS
// =========================================================

// Pide las categorías y genera los botones de filtro
async function cargarCategorias() {
  try {
    const res = await fetch('/categorias');
    if (!res.ok) return;
    const categorias = await res.json();
    const nav = document.getElementById('categorias');
    
    let html = `<button data-id="" class="${categoriaActual === null ? 'activa' : ''}" onclick="cargarProductos(null)">Todas</button>`;
    categorias.forEach(c => {
      const activa = categoriaActual === c.id ? 'activa' : '';
      html += `<button data-id="${c.id}" class="${activa}" onclick="cargarProductos(${c.id})">${c.nombre}</button>`;
    });
    nav.innerHTML = html;
  } catch (error) {
    console.error('Error al cargar categorías:', error);
  }
}

function pintarCategoriaActiva() {
  document.querySelectorAll('#categorias button').forEach(b => {
    const id = b.dataset.id ? Number(b.dataset.id) : null;
    b.classList.toggle('activa', id === categoriaActual);
  });
}

// Carga los productos (filtrando por categoría si se pasa un ID)
async function cargarProductos(categoriaId = null) {
  categoriaActual = categoriaId;
  pintarCategoriaActiva();

  const url = categoriaId ? `/productos?categoria=${categoriaId}` : '/productos';

  try {
    const res = await fetch(url);
    const datos = await res.json();

    if (res.ok) {
      pintarProductos(datos);
    } else {
      mostrarMensaje(datos.message || 'Error al cargar productos', 'error');
    }
  } catch (error) {
    mostrarMensaje('No se pudo conectar con el servidor', 'error');
  }
}

// Renderiza productos separando: Últimas unidades, Catálogo con stock y Productos Sin Stock al final
function pintarProductos(lista) {
  const grillaGeneral = document.getElementById('productos');
  const grillaUltimas = document.getElementById('productos-ultimas');

  // Guardar en diccionario para el carrito
  lista.forEach(p => { catalogo[p.id] = p; });
  pintarCarrito();

  if (lista.length === 0) {
    grillaGeneral.innerHTML = '<p class="vacio">No hay productos para mostrar en esta categoría.</p>';
    if (grillaUltimas) grillaUltimas.innerHTML = '';
    return;
  }

  // 1. Productos con stock bajo (1 a 3 unidades)
  const ultimasUnidades = lista.filter(p => p.stock > 0 && p.stock <= 3);
  if (grillaUltimas) {
    if (ultimasUnidades.length === 0) {
      grillaUltimas.innerHTML = '<p class="vacio">No hay ofertas de últimas unidades en esta categoría.</p>';
    } else {
      grillaUltimas.innerHTML = ultimasUnidades.map(p => crearTarjetaHTML(p, true)).join('');
    }
  }

  // 2. Ordenar el catálogo general: con stock primero, SIN STOCK (stock == 0) AL FINAL
  const conStock = lista.filter(p => p.stock > 0);
  const sinStock = lista.filter(p => p.stock < 1);
  const listaOrdenada = [...conStock, ...sinStock];

  // Renderizar catálogo
  grillaGeneral.innerHTML = listaOrdenada.map(p => crearTarjetaHTML(p, false)).join('');
}

// Función auxiliar para renderizar cada tarjeta HTML
function crearTarjetaHTML(p, esDestacado) {
  const sinStock = p.stock < 1;
  const claseSinStock = sinStock ? 'sin-stock' : '';
  const claseDestacada = esDestacado ? 'destacada' : '';

  return `
    <article class="tarjeta ${claseDestacada} ${claseSinStock}">
      <img src="${p.imagen_url || ''}" alt="${p.nombre}">
      <div class="info">
        <span class="categoria">${p.categorias ? p.categorias.nombre : 'Ferretería'}</span>
        <h3>${p.nombre}</h3>
        <p class="descripcion">${p.descripcion || ''}</p>
        <span class="precio">$${p.precio}</span>
        <span class="stock ${sinStock ? 'texto-sin-stock' : ''}">${sinStock ? 'Agotado / Sin stock' : 'Quedan ' + p.stock + ' unidades'}</span>
        <button class="btn btn-principal" onclick="agregar(${p.id})" ${sinStock ? 'disabled' : ''}>
          ${sinStock ? 'Agotado' : 'Agregar al carrito'}
        </button>
      </div>
    </article>
  `;
}

// =========================================================
// CARRITO DE COMPRAS
// =========================================================

function guardarCarrito() {
  localStorage.setItem('carrito', JSON.stringify(carrito));
  pintarCarrito();
}

function agregar(id) {
  const p = catalogo[id];
  if (p && p.stock < 1) return mostrarMensaje('Producto sin stock', 'error');

  const item = carrito.find(i => i.producto_id === id);
  if (item) item.cantidad++;
  else carrito.push({ producto_id: id, cantidad: 1 });
  
  guardarCarrito();
  mostrarMensaje('Producto agregado al carrito', 'ok');
}

function cambiarCantidad(id, cambio) {
  const item = carrito.find(i => i.producto_id === id);
  if (!item) return;
  item.cantidad += cambio;
  if (item.cantidad < 1) carrito = carrito.filter(i => i.producto_id !== id);
  guardarCarrito();
}

function pintarCarrito() {
  const lista = document.getElementById('carrito-lista');
  let total = 0;
  let unidades = 0;
  lista.innerHTML = '';

  carrito.forEach(item => {
    const p = catalogo[item.producto_id];
    const nombre = p ? p.nombre : 'Producto ' + item.producto_id;
    const subtotal = p ? p.precio * item.cantidad : 0;
    total += subtotal;
    unidades += item.cantidad;
    lista.innerHTML += `
      <li>
        <span>${nombre}<br><small>$${subtotal}</small></span>
        <span class="cantidad">
          <button onclick="cambiarCantidad(${item.producto_id}, -1)">−</button>
          ${item.cantidad}
          <button onclick="cambiarCantidad(${item.producto_id}, 1)">+</button>
        </span>
      </li>`;
  });

  if (carrito.length === 0) lista.innerHTML = '<li>Tu carrito está vacío</li>';
  document.getElementById('carrito-total').textContent = '$' + total;
  document.getElementById('contador').textContent = unidades;
}

function alternarCarrito() {
  document.getElementById('carrito').classList.toggle('oculto');
}

// =========================================================
// USUARIOS: REGISTRO, LOGIN Y SESIÓN
// =========================================================

async function registrar(evento) {
  evento.preventDefault();
  const nombre = document.getElementById('reg-nombre').value;
  const email = document.getElementById('reg-email').value;
  const password = document.getElementById('reg-password').value;

  try {
    const res = await fetch('/registro', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, email, password })
    });

    if (res.ok) {
      mostrarMensaje('Cuenta creada con éxito. Ahora inicia sesión.', 'ok');
      mostrarRegistro(false);
    } else {
      const txt = await res.text();
      mostrarMensaje(txt, 'error');
    }
  } catch (error) {
    mostrarMensaje('Error de conexión al registrar usuario', 'error');
  }
}

async function iniciarSesion(evento) {
  evento.preventDefault();
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;

  try {
    const res = await fetch('/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const datos = await res.json();

    if (res.ok) {
      token = datos.token;
      usuarioEmail = email;
      localStorage.setItem('token', token);
      localStorage.setItem('email', usuarioEmail);
      actualizarSesion();
      mostrarMensaje('¡Bienvenido/a!', 'ok');
    } else {
      mostrarMensaje('Email o contraseña incorrectos', 'error');
    }
  } catch (error) {
    mostrarMensaje('Error de conexión al iniciar sesión', 'error');
  }
}

function cerrarSesion() {
  token = null;
  usuarioEmail = null;
  localStorage.removeItem('token');
  localStorage.removeItem('email');
  actualizarSesion();
  mostrarMensaje('Cerraste sesión', 'ok');
}

function actualizarSesion() {
  const logueado = Boolean(token);
  document.getElementById('saludo').textContent = logueado ? usuarioEmail : '';
  document.getElementById('btn-salir').classList.toggle('oculto', !logueado);

  document.getElementById('vista-login').classList.toggle('oculto', logueado);
  document.getElementById('vista-tienda').classList.toggle('oculto', !logueado);

  if (logueado) {
    cargarCategorias();
    cargarProductos();
  }
}

// =========================================================
// COMPRA
// =========================================================

async function comprar() {
  if (carrito.length === 0) return mostrarMensaje('Tu carrito está vacío', 'error');
  if (!token) {
    return mostrarMensaje('Debes iniciar sesión para comprar', 'error');
  }

  try {
    const res = await fetch('/pedidos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ items: carrito })
    });

    if (res.ok) {
      carrito = [];
      guardarCarrito();
      cargarProductos(categoriaActual);
      mostrarMensaje('¡Compra realizada con éxito!', 'ok');
    } else {
      const txt = await res.text();
      mostrarMensaje(txt, 'error');
    }
  } catch (error) {
    mostrarMensaje('Error de conexión al realizar la compra', 'error');
  }
}

// =========================================================
// AYUDANTES
// =========================================================

function mostrarMensaje(texto, tipo) {
  const caja = document.getElementById('mensaje');
  caja.textContent = texto;
  caja.className = 'mensaje ' + tipo;
  clearTimeout(caja.temporizador);
  caja.temporizador = setTimeout(() => caja.classList.add('oculto'), 4000);
}

function mostrarRegistro(mostrar) {
  document.getElementById('form-registro').classList.toggle('oculto', !mostrar);
  document.getElementById('form-login').classList.toggle('oculto', mostrar);
}

// ---------- AL ABRIR LA PÁGINA ----------
pintarCarrito();
actualizarSesion();