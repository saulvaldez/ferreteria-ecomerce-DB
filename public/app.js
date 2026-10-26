// =========================================================
// FRONTEND DE LA TIENDA - CLASE 3
// =========================================================

// ---------- ESTADO LOCAL ----------
const catalogo = {};
let ultimaLista = []; // Para el buscador por nombre
let carrito = JSON.parse(localStorage.getItem('carrito')) || [];
let token = localStorage.getItem('token');
let usuarioEmail = localStorage.getItem('email');
let categoriaActual = null;

// =========================================================
// 1. CATEGORÍAS (Clase 3)
// =========================================================

// Carga las categorías desde GET /categorias y dibuja los botones
async function cargarCategorias() {
  try {
    const res = await fetch('/categorias');
    if (!res.ok) return;
    const categorias = await res.json();
    const nav = document.getElementById('categorias');
    if (!nav) return;

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

// =========================================================
// 2. PRODUCTOS Y CATÁLOGO (Clase 3)
// =========================================================

// Carga los productos desde GET /productos
async function cargarProductos(categoriaId = null) {
  categoriaActual = categoriaId;
  pintarCategoriaActiva();

  const url = categoriaId ? `/productos?categoria=${categoriaId}` : '/productos';

  try {
    const res = await fetch(url);
    const datos = await res.json();

    if (res.ok) {
      ultimaLista = datos; // Guardar para el buscador
      pintarProductos(datos);
    } else {
      mostrarMensaje(datos.message || 'Error al cargar productos', 'error');
    }
  } catch (error) {
    mostrarMensaje('Falta implementar: cargarProductos (Clase 3)', 'error');
  }
}

// Muestra los productos en pantalla
function pintarProductos(lista) {
  const grilla = document.getElementById('productos');
  if (!grilla) return;

  // Guardar productos en diccionario para usar con el carrito
  lista.forEach(p => { catalogo[p.id] = p; });
  pintarCarrito();

  if (lista.length === 0) {
    grilla.innerHTML = '<p class="vacio">No hay productos para mostrar.</p>';
    return;
  }

  // Ordenar: Productos con stock primero, SIN STOCK al final
  const conStock = lista.filter(p => p.stock > 0);
  const sinStock = lista.filter(p => p.stock < 1);
  const listaOrdenada = [...conStock, ...sinStock];

  grilla.innerHTML = listaOrdenada.map(p => {
    const agotado = p.stock < 1;
    return `
      <article class="tarjeta ${agotado ? 'sin-stock' : ''}">
        <img src="${p.imagen_url || ''}" alt="${p.nombre}">
        <div class="info">
          <span class="categoria">${p.categorias ? p.categorias.nombre : 'Ferretería'}</span>
          <h3>${p.nombre}</h3>
          <p class="descripcion">${p.descripcion || ''}</p>
          <span class="precio">$${p.precio}</span>
          <span class="stock ${agotado ? 'texto-sin-stock' : ''}">
            ${agotado ? 'Sin stock' : 'Stock: ' + p.stock}
          </span>
          <button class="btn btn-principal" onclick="agregar(${p.id})" ${agotado ? 'disabled' : ''}>
            ${agotado ? 'Agotado' : 'Agregar al carrito'}
          </button>
        </div>
      </article>
    `;
  }).join('');
}

// Buscador por nombre (Clase 3)
function buscar(texto) {
  const t = texto.toLowerCase();
  const filtrados = ultimaLista.filter(p => p.nombre.toLowerCase().includes(t));
  pintarProductos(filtrados);
}

// =========================================================
// 3. CARRITO DE COMPRAS (Local)
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
  if (!lista) return;
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
  if (document.getElementById('carrito-total')) document.getElementById('carrito-total').textContent = '$' + total;
  if (document.getElementById('contador')) document.getElementById('contador').textContent = unidades;
}

function alternarCarrito() {
  const c = document.getElementById('carrito');
  if (c) c.classList.toggle('oculto');
}

// =========================================================
// 4. USUARIOS Y COMPRA (Plantilla de la Clase 3)
// =========================================================

function abrirModal() {
  const m = document.getElementById('modal');
  if (m) m.classList.remove('oculto');
}

function cerrarModal() {
  const m = document.getElementById('modal');
  if (m) m.classList.add('oculto');
}

function mostrarRegistro(mostrar) {
  const fReg = document.getElementById('form-registro');
  const fLog = document.getElementById('form-login');
  if (fReg) fReg.classList.toggle('oculto', !mostrar);
  if (fLog) fLog.classList.toggle('oculto', mostrar);
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
  const saludo = document.getElementById('saludo');
  const btnSalir = document.getElementById('btn-salir');
  if (saludo) saludo.textContent = logueado ? usuarioEmail : '';
  if (btnSalir) btnSalir.classList.toggle('oculto', !logueado);
}

// TODO (Clase 3): completar estas funciones según la plantilla
async function registrar(evento) {
  const nombre = document.getElementById('reg-nombre').value;
const email = document.getElementById('reg-email').value;
const password = document.getElementById('reg-password').value;
const res = await fetch('/registro', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ nombre, email, password })
});
if (res.status === 201) {
 mostrarMensaje('Cuenta creada. Ahora ingresá con tu email y contraseña.', 'ok');
 mostrarRegistro(false); // pasa al login
 document.getElementById('login-email').value = email;
} else {
 mostrarMensaje(await res.text(), 'error');
}
}

async function iniciarSesion(evento) {
  evento.preventDefault();
  const email = document.getElementById('login-email').value;
const password = document.getElementById('login-password').value;
const res = await fetch('/login', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ email, password })
});
if (!res.ok) return mostrarMensaje(await res.text(), 'error');
const datos = await res.json(); // { token: "eyJhb..." }
token = datos.token;
usuarioEmail = email;
localStorage.setItem('token', token);
localStorage.setItem('email', email);
cerrarModal();
actualizarSesion(); // muestra el email y el botón Salir
mostrarMensaje('¡Hola! Ya podés comprar.', 'ok');
}

async function comprar() {
  if (!token) { // sin sesión: primero ingresar
 abrirModal();
 return mostrarMensaje('Ingresá para poder comprar', 'error');
}
const res = await fetch('/pedidos', {
 method: 'POST',
 headers: {
 'Content-Type': 'application/json',
 'Authorization': 'Bearer ' + token // con un espacio después de Bearer
 },
 body: JSON.stringify({ items: carrito })
});
if (res.status === 201) {
 const pedido = await res.json();
 carrito = [];
 guardarCarrito();
 alternarCarrito();
 mostrarMensaje('¡Compra realizada! Pedido #' + pedido.id +
 ' por $' + pedido.total, 'ok');
 cargarProductos(categoriaActual); // para ver el stock nuevo
} else if (res.status === 401) {
 cerrarSesion();
 abrirModal();
 mostrarMensaje('Tu sesión venció. Ingresá de nuevo.', 'error');
} else {
 mostrarMensaje(await res.text(), 'error');
}
}

function mostrarMensaje(texto, tipo) {
  const caja = document.getElementById('mensaje');
  if (!caja) return;
  caja.textContent = texto;
  caja.className = 'mensaje ' + tipo;
  clearTimeout(caja.temporizador);
  caja.temporizador = setTimeout(() => caja.classList.add('oculto'), 4000);
}

// ---------- AL ABRIR LA PÁGINA ----------
cargarCategorias();
cargarProductos();
pintarCarrito();
actualizarSesion();