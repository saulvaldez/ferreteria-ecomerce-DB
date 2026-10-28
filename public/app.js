// =========================================================
// FRONTEND DE LA TIENDA - VERSIÓN PRO/CARRUSELES
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
  } catch (error) { console.error('Error al cargar categorías:', error); }
}

function pintarCategoriaActiva() {
  document.querySelectorAll('#categorias button').forEach(b => {
    const id = b.dataset.id ? Number(b.dataset.id) : null;
    b.classList.toggle('activa', id === categoriaActual);
  });
}

// =========================================================
// 2. PRODUCTOS Y CATÁLOGO (CARRUSELES - SIN BACKEND)
// =========================================================

async function cargarProductos(categoriaId = null) {
  categoriaActual = categoriaId;
  pintarCategoriaActiva();
  // Se cargan todos para poder agruparlos en frontend
  const url = '/productos'; 

  try {
    const res = await fetch(url);
    const datos = await res.json();

    if (res.ok) {
      ultimaLista = datos; 
      // Filtrar por categoría actual si hay una seleccionada
      const listaFinal = categoriaId 
        ? datos.filter(p => p.categoria_id === categoriaId)
        : datos;
      pintarProductos(listaFinal, Boolean(categoriaId));
    } else {
      mostrarMensaje(datos.message || 'Error al cargar productos', 'error');
    }
  } catch (error) { mostrarMensaje('Error de conexión', 'error'); }
}

// Muestra los productos en carruseles agrupados por categoría (Tu Bosquejo)
function pintarProductos(lista, esFiltrado = false) {
  const container = document.getElementById('productos-catalogo');
  if (!container) return;
  container.innerHTML = '';

  if (lista.length === 0) {
    container.innerHTML = '<p class="vacio">No hay productos en esta selección.</p>';
    return;
  }

  // 1. Guardar en diccionario para carrito
  lista.forEach(p => catalogo[p.id] = p);
  pintarCarrito();

  // 2. Ordenar lista plana (con stock primero)
  const ordenar = (a, b) => b.stock - a.stock;

  // Si estamos en búsqueda o filtrado de categorías (Clase 3), 
  // mostramos una grilla normal, no carruseles
  if (esFiltrado || (document.getElementById('input-buscar') && document.getElementById('input-buscar').value.length > 0)) {
    const ordenada = lista.sort(ordenar);
    container.innerHTML = `
      <h2 class="categoria-titulo-bosquejo">Resultados</h2>
      <div class="grilla" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 20px;">
        ${ordenada.map(p => generarTarjetaHTML(p)).join('')}
      </div>
    `;
    return;
  }

  // 3. AGRUPAR POR CATEGORÍA (Tus filas del bosquejo)
  const productosAgrupados = {};
  lista.forEach(p => {
    // Si el backend no envía el nombre, usamos 'General'
    const catNombre = p.categorias && p.categorias.nombre 
      ? p.categorias.nombre.toLowerCase() 
      : 'General';
    if (!productosAgrupados[catNombre]) productosAgrupados[catNombre] = [];
    productosAgrupados[catNombre].push(p);
  });

  // 4. GENERAR HTML DE CARRUSELES
  let htmlTotal = '';
  // Convertimos objeto en array y ordenamos categorías por nombre
  Object.keys(productosAgrupados).sort().forEach(catNombre => {
    const productosCat = productosAgrupados[catNombre];
    const ordenadaCat = productosCat.sort(ordenar);
    const catIdPrefix = 'cat-' + catNombre.replace(/\s+/g, '-'); // ID único para flechas

    htmlTotal += `
      <section class="seccion-categoria" id="${catIdPrefix}">
        <h2 class="categoria-titulo-bosquejo">${catNombre}</h2>
        
        <!-- Flechas de navegación (tus circulitos) -->
        <button class="carrusel-btn carrusel-btn-izq" onclick="moverCarrusel('${catIdPrefix}', -1)" title="Anterior">
            <i class="fas fa-chevron-left"></i>
        </button>
        <button class="carrusel-btn carrusel-btn-der" onclick="moverCarrusel('${catIdPrefix}', 1)" title="Siguiente">
            <i class="fas fa-chevron-right"></i>
        </button>

        <!-- El contenedor del carrusel -->
        <div class="carrusel-pista-contenedor">
          <div class="carrusel-pista">
            ${ordenadaCat.map(p => generarTarjetaHTML(p)).join('')}
          </div>
        </div>
      </section>
    `;
  });

  container.innerHTML = htmlTotal;
  // Actualizar estado de las flechas (desactivar si no hay más que deslizar)
  setTimeout(() => {
    Object.keys(productosAgrupados).forEach(catNombre => {
        actualizarFlechas('cat-' + catNombre.replace(/\s+/g, '-'));
    });
  }, 100);
}

// Función auxiliar para generar el HTML de una tarjeta
function generarTarjetaHTML(p) {
  const agotado = p.stock < 1;
  const precioFormatted = Number(p.precio).toLocaleString('es-CL'); // Formato precio local
  return `
    <article class="tarjeta ${agotado ? 'sin-stock' : ''}">
      <img src="${p.imagen_url || ''}" alt="${p.nombre}" loading="lazy">
      <div class="info">
        <h3>${p.nombre}</h3>
        <p class="descripcion">${p.descripcion || ''}</p>
        <span class="stock ${agotado ? 'texto-sin-stock' : ''}">
            ${agotado ? '<i class="fas fa-times-circle"></i> Sin stock' : '<i class="fas fa-box"></i> Stock: ' + p.stock}
        </span>
        <span class="precio">$${precioFormatted}</span>
        <button class="btn btn-principal compra" onclick="agregar(${p.id})" ${agotado ? 'disabled' : ''}>
          ${agotado ? 'Agotado' : 'Añadir <i class="fas fa-cart-plus"></i>'}
        </button>
      </div>
    </article>
  `;
}

// =========================================================
// 2. LÓGICA DE MOVIMIENTO DEL CARRUSEL (No backend)
// =========================================================

// Mueve el carrusel de forma suave (Tus flechas circulitos)
function moverCarrusel(seccionId, direccion) {
  const seccion = document.getElementById(seccionId);
  const pistaContenedor = seccion.querySelector('.carrusel-pista-contenedor');
  const anchoTarjeta = 260;
  const gap = 20;
  const desplazamiento = anchoTarjeta + gap; // Desplazar una tarjeta a la vez

  pistaContenedor.scrollLeft += (desplazamiento * direccion);
  
  // Pequeño retardo para dar tiempo al scroll suave
  setTimeout(() => actualizarFlechas(seccionId), 400); 
}

// Actualiza el estado (desactivado) de las flechas si se llega al inicio/fin
function actualizarFlechas(seccionId) {
    const seccion = document.getElementById(seccionId);
    const pistaContenedor = seccion.querySelector('.carrusel-pista-contenedor');
    const btnIzq = seccion.querySelector('.carrusel-btn-izq');
    const btnDer = seccion.querySelector('.carrusel-btn-der');

    if (!pistaContenedor) return;

    // Desactivar izq si está en el inicio
    btnIzq.disabled = (pistaContenedor.scrollLeft <= 5);

    // Desactivar der si está en el final
    // (Total ancho pista - ancho contenedor <= scroll actual)
    btnDer.disabled = (pistaContenedor.scrollWidth - pistaContenedor.clientWidth <= pistaContenedor.scrollLeft + 5);
}

// =========================================================
// 3. RESTO DE FUNCIONES (Actualizadas estéticamente)
// =========================================================

function buscar(texto) {
  const t = texto.trim().toLowerCase();
  // Mostramos grilla si hay búsqueda, carruseles si está vacío
  const filtrados = t.length > 0 
    ? ultimaLista.filter(p => p.nombre.toLowerCase().includes(t))
    : ultimaLista;
  
  // categoriaActual null y buscador vacío: modo carrusel total
  pintarProductos(filtrados, Boolean(categoriaActual)); 
}

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
  mostrarMensaje(`¡${p.nombre} añadido!`, 'ok');
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
    if (!p) return; // Por seguridad si se borró un producto
    const nombre = p.nombre;
    const subtotal = p.precio * item.cantidad;
    total += subtotal;
    unidades += item.cantidad;

    lista.innerHTML += `
      <li>
        <div class="item-info">
            <strong>${nombre}</strong><br>
            <span class="item-precio">$${p.precio.toLocaleString('es-CL')} / ud.</span>
        </div>
        <div class="cantidad">
          <button onclick="cambiarCantidad(${item.producto_id}, -1)">−</button>
          <strong>${item.cantidad}</strong>
          <button onclick="cambiarCantidad(${item.producto_id}, 1)">+</button>
        </div>
      </li>
    `;
  });

  if (carrito.length === 0) lista.innerHTML = '<li class="vacio">Tu carrito está vacío</li>';
  if (document.getElementById('carrito-total')) document.getElementById('carrito-total').textContent = '$' + total.toLocaleString('es-CL');
  if (document.getElementById('contador')) document.getElementById('contador').textContent = unidades;
}

function alternarCarrito() {
  const c = document.getElementById('carrito');
  if (c) c.classList.toggle('oculto');
}

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
  if (saludo) saludo.textContent = logueado ? `Hola, ${usuarioEmail.split('@')[0]}` : '';
  if (btnSalir) btnSalir.classList.toggle('oculto', !logueado);
}

async function registrar(evento) {
  evento.preventDefault();
  const nombre = document.getElementById('reg-nombre').value;
  const email = document.getElementById('reg-email').value;
  const password = document.getElementById('reg-password').value;

  const res = await fetch('/registro', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nombre, email, password })
  });

  if (res.status === 201) {
    mostrarMensaje('Cuenta creada. Ingresa con tus credenciales.', 'ok');
    mostrarRegistro(false);
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

  const datos = await res.json();
  token = datos.token;
  usuarioEmail = email;
  localStorage.setItem('token', token);
  localStorage.setItem('email', email);
  cerrarModal();
  actualizarSesion();
  mostrarMensaje('¡Hola de nuevo!', 'ok');
}

async function comprar() {
  if (!token) {
    abrirModal();
    return mostrarMensaje('Ingresa para poder comprar', 'error');
  }

  const res = await fetch('/pedidos', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token
    },
    body: JSON.stringify({ items: carrito })
  });

  if (res.status === 201) {
    const pedido = await res.json();
    carrito = [];
    guardarCarrito();
    alternarCarrito();
    mostrarMensaje('¡Compra realizada!', 'ok');
    cargarProductos(categoriaActual); 
  } else if (res.status === 401) {
    cerrarSesion();
    abrirModal();
    mostrarMensaje('Tu sesión venció.', 'error');
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
cargarProductos(); // Carga todas las categorías en modo carrusel
pintarCarrito();
actualizarSesion();