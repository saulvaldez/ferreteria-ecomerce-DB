// Importa Express y crea un enrutador modular
const express = require('express');
const router = express.Router();

// Importa los controladores 
const auth = require('../controllers/authController');
const productos = require('../controllers/productosController');
const pedidos = require('../controllers/pedidosController');

// Importa el middleware para verificar la autenticación del usuario
const verificarUsuario = require('../middlewares/verificarUsuario');

// Ruta POST para registrar un nuevo usuario
router.post('/registro', auth.registro);

// Ruta POST para iniciar sesión
router.post('/login', auth.login);

// Ruta GET para obtener las categorías
router.get('/categorias', productos.verCategorias);

// Ruta GET para obtener la lista de productos
router.get('/productos', productos.verProductos);

// Ruta POST protegida: verifica al usuario antes de crear el pedido
router.post('/pedidos', verificarUsuario, pedidos.crearPedido);

// Exporta el enrutador para usarlo en la aplicación principal
module.exports = router;