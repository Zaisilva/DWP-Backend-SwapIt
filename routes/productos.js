const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const auth = require('../middleware/auth');
const Producto = require('../models/Producto');
const Comentario = require('../models/Comentario');

const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    const dir = 'uploads/productos';
    if (!fs.existsSync(dir)){
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function(req, file, cb) {
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1E9)}-${file.originalname}`);
  }
});
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: function(req, file, cb) {
    const filetypes = /jpeg|jpg|png|webp/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Solo se permiten imágenes (jpeg, jpg, png, webp)'));
  }
});
router.get('/',auth, async (req, res) => {
  try {
    const productos = await Producto.find({ disponible: true })
      .populate('usuario', 'nombre email')
      .sort({ createdAt: -1 });
    res.json(productos);
  } catch (error) {
    console.error('Error al obtener productos:', error);
    res.status(500).json({ mensaje: 'Error del servidor' });
  }
});
// Obtener un producto específico
router.get('/:id',auth, async (req, res) => {
  try {
    const producto = await Producto.findById(req.params.id)
      .populate({
        path: 'usuario',
        select: 'nombre email telefono' // Make sure this matches the field name in your User model
      });
    
    if (!producto) {
      return res.status(404).json({ mensaje: 'Producto no encontrado' });
    }
    
    // Debug the populated user to check field names
    console.log('Usuario populado:', JSON.stringify(producto.usuario, null, 2));
    
    // If the phone number is stored with a different field name, you can add it manually
    if (producto.usuario && !producto.usuario.telefono) {
      console.log('Teléfono no encontrado en el usuario, verificando campos alternativos');
      // You might need to check your User model for the correct field name
      // e.g., it could be 'phone', 'phoneNumber', etc.
    }
    
    res.json(producto);
  } catch (error) {
    console.error('Error al obtener el producto:', error);
    res.status(500).json({ mensaje: 'Error del servidor' });
  }
});
// crear un produto
router.post('/', auth, upload.array('imagenes', 5), async (req, res) => {
        try {
        console.log("Request Body:", req.body);
        
        const { 
            titulo, 
            descripcion,
            categoria, 
            estado, 
            intercambioPor
        } = req.body;
        
        // Intentar diferentes formas de obtener los datos de ubicación
        let ubicacion;
        
        if (req.body.ubicacion && typeof req.body.ubicacion === 'object') {
            // Si ubicacion es un objeto anidado
            ubicacion = req.body.ubicacion;
        } else {
            // Si vienen como campos individuales con notación de corchetes
            ubicacion = {
            ciudad: req.body['ubicacion[ciudad]'],
            estado: req.body['ubicacion[estado]'],
            codigoPostal: req.body['ubicacion[codigoPostal]'] || ''
            };
        }
        
        console.log("Ubicacion processed:", ubicacion);
        
        // Procesar imágenes - FIX THE REFERENCE ERROR
        const imagenesArray = req.files ? req.files.map(file => `/uploads/productos/${file.filename}`) : [];
        
        const nuevoProducto = new Producto({
            titulo,
            descripcion,
            categoria,
            estado,
            intercambioPor,
            ubicacion,
            imagenes: imagenesArray,
            usuario: req.user?.id || req.body.usuario, // Use req.body.usuario as fallback
            disponible: true,
            createdAt: new Date()
        });
        
        const productoGuardado = await nuevoProducto.save();
        res.status(201).json(productoGuardado);
        } catch (error) {
        console.error('Error al crear producto:', error);
        res.status(500).json({ mensaje: 'Error al crear el producto' });
        }
});
// Actualizar un producto (solo el propietario)
router.put('/:id', auth, upload.array('nuevasImagenes', 5), async (req, res) => {
  try {
    const producto = await Producto.findById(req.params.id);
    
    if (!producto) {
      return res.status(404).json({ mensaje: 'Producto no encontrado' });
    }
    
    // Verificar que el usuario es el propietario
    if (producto.usuario.toString() !== req.user.id) {
      return res.status(403).json({ mensaje: 'No autorizado para editar este producto' });
    }
    
    // Preparar datos de actualización
    const datosActualizados = {
      titulo: req.body.titulo,
      descripcion: req.body.descripcion,
      categoria: req.body.categoria,
      estado: req.body.estado,
      intercambioPor: req.body.intercambioPor,
      ubicacion: {
        ciudad: req.body['ubicacion[ciudad]'],
        estado: req.body['ubicacion[estado]'],  // Cambiado de provincia a estado
        codigoPostal: req.body['ubicacion[codigoPostal]'] || ''
      }
    };
    
    // Manejo de imágenes
    let imagenes = [];
    
    // Mantener imágenes existentes que no se eliminaron
    if (req.body.imagenesExistentes) {
      try {
        const imagenesExistentes = JSON.parse(req.body.imagenesExistentes);
        imagenes = [...imagenesExistentes];
      } catch (e) {
        console.error('Error al parsear imagenesExistentes:', e);
      }
    }
    
    // Añadir nuevas imágenes
    if (req.files && req.files.length > 0) {
      const nuevasImagenes = req.files.map(file => `/uploads/productos/${file.filename}`);
      imagenes = [...imagenes, ...nuevasImagenes];
    }
    
    datosActualizados.imagenes = imagenes;
    
    const productoActualizado = await Producto.findByIdAndUpdate(
      req.params.id,
      datosActualizados,
      { new: true }
    );
    
    res.json(productoActualizado);
  } catch (error) {
    console.error('Error al actualizar producto:', error);
    res.status(500).json({ mensaje: 'Error del servidor' });
  }
});
// Eliminar un producto (solo el propietario)
router.delete('/:id', auth, async (req, res) => {
  try {
    const producto = await Producto.findById(req.params.id);
    
    if (!producto) {
      return res.status(404).json({ mensaje: 'Producto no encontrado' });
    }
    
    // Verificar que el usuario es el propietario
    if (producto.usuario.toString() !== req.user.id) {
      return res.status(403).json({ mensaje: 'No autorizado para eliminar este producto' });
    }
    
    // Opcional: Eliminar las imágenes asociadas del servidor
    if (producto.imagenes && producto.imagenes.length > 0) {
      producto.imagenes.forEach(imagenUrl => {
        try {
          const ruta = path.join(__dirname, '..', 'public', imagenUrl);
          if (fs.existsSync(ruta)) {
            fs.unlinkSync(ruta);
          }
        } catch (err) {
          console.error('Error al eliminar imagen:', err);
        }
      });
    }
    
    await Producto.findByIdAndDelete(req.params.id);
    res.json({ mensaje: 'Producto eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar producto:', error);
    res.status(500).json({ mensaje: 'Error del servidor' });
  }
});
// Obtener productos por usuario
router.get('/usuario/:userId', async (req, res) => {
  try {
    const productos = await Producto.find({ 
      usuario: req.params.userId,
    }).sort({ createdAt: -1 });
    
    res.json(productos);
  } catch (error) {
    console.error('Error al obtener productos del usuario:', error);
    res.status(500).json({ mensaje: 'Error del servidor' });
  }
});
// Buscar productos por nombre
router.get('/buscar/nombre/:nombre', async (req, res) => {
  try {
    const productos = await Producto.find({
      titulo: { $regex: req.params.nombre, $options: 'i' },
      disponible: true
    })
    .populate('usuario', 'nombre email')
    .sort({ createdAt: -1 });
    
    res.json(productos);
  } catch (error) {
    console.error('Error al buscar productos por nombre:', error);
    res.status(500).json({ mensaje: 'Error del servidor' });
  }
});
// Buscar productos
router.get('/buscar/filtro', async (req, res) => {
  try {
    const { q, categoria, ubicacion } = req.query;
    const filtro = { disponible: true };
    
    if (q) {
      filtro.$or = [
        { titulo: { $regex: q, $options: 'i' } },
        { descripcion: { $regex: q, $options: 'i' } },
        { intercambioPor: { $regex: q, $options: 'i' } }
      ];
    }
    
    if (categoria) {
      filtro.categoria = categoria;
    }
    
    if (ubicacion) {
      filtro['ubicacion.ciudad'] = { $regex: ubicacion, $options: 'i' };
    }
    
    const productos = await Producto.find(filtro)
      .populate('usuario', 'nombre email')
      .sort({ createdAt: -1 });
      
    res.json(productos);
  } catch (error) {
    console.error('Error en la búsqueda de productos:', error);
    res.status(500).json({ mensaje: 'Error del servidor' });
  }
});



// Obtener comentarios de un producto
router.get('/:id/comentarios', async (req, res) => {
  try {
    const comentarios = await Comentario.find({ producto: req.params.id })
      .populate('usuario', 'nombre email')
      .populate('respuestas.usuario', 'nombre email')
      .sort({ fecha: -1 });
    
    res.json(comentarios);
  } catch (error) {
    console.error('Error al obtener comentarios:', error);
    res.status(500).json({ mensaje: 'Error del servidor' });
  }
});

// Añadir un comentario a un producto
router.post('/:id/comentarios', auth, async (req, res) => {
  try {
    const producto = await Producto.findById(req.params.id);
    
    if (!producto) {
      return res.status(404).json({ mensaje: 'Producto no encontrado' });
    }
    
    const nuevoComentario = new Comentario({
      producto: req.params.id,
      usuario: req.user.id,
      texto: req.body.texto
    });
    
    const comentarioGuardado = await nuevoComentario.save();
    
    // Populate user info before sending response
    const comentarioPopulado = await Comentario.findById(comentarioGuardado._id)
      .populate('usuario', 'nombre email');
    
    res.status(201).json(comentarioPopulado);
  } catch (error) {
    console.error('Error al añadir comentario:', error);
    res.status(500).json({ mensaje: 'Error del servidor' });
  }
});

// Añadir respuesta a un comentario
router.post('/comentarios/:comentarioId/respuestas', auth, async (req, res) => {
  try {
    const comentario = await Comentario.findById(req.params.comentarioId);
    
    if (!comentario) {
      return res.status(404).json({ mensaje: 'Comentario no encontrado' });
    }
    
    const nuevaRespuesta = {
      usuario: req.user.id,
      texto: req.body.texto,
      fecha: new Date()
    };
    
    comentario.respuestas.push(nuevaRespuesta);
    await comentario.save();
    
    // Populate user info before sending response
    const comentarioActualizado = await Comentario.findById(req.params.comentarioId)
      .populate('usuario', 'nombre email')
      .populate('respuestas.usuario', 'nombre email');
    
    res.status(201).json(comentarioActualizado);
  } catch (error) {
    console.error('Error al añadir respuesta:', error);
    res.status(500).json({ mensaje: 'Error del servidor' });
  }
});

// Eliminar un comentario (solo el propietario o admin)
router.delete('/comentarios/:comentarioId', auth, async (req, res) => {
  try {
    const comentario = await Comentario.findById(req.params.comentarioId);
    
    if (!comentario) {
      return res.status(404).json({ mensaje: 'Comentario no encontrado' });
    }
    
    // Verificar que el usuario es el propietario del comentario
    if (comentario.usuario.toString() !== req.user.id) {
      return res.status(403).json({ mensaje: 'No autorizado para eliminar este comentario' });
    }
    
    await Comentario.findByIdAndDelete(req.params.comentarioId);
    res.json({ mensaje: 'Comentario eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar comentario:', error);
    res.status(500).json({ mensaje: 'Error del servidor' });
  }
});

// Eliminar una respuesta de un comentario
router.delete('/comentarios/:comentarioId/respuestas/:respuestaId', auth, async (req, res) => {
  try {
    const comentario = await Comentario.findById(req.params.comentarioId);
    
    if (!comentario) {
      return res.status(404).json({ mensaje: 'Comentario no encontrado' });
    }
    
    // Encontrar la respuesta
    const respuesta = comentario.respuestas.id(req.params.respuestaId);
    
    if (!respuesta) {
      return res.status(404).json({ mensaje: 'Respuesta no encontrada' });
    }
    
    // Verificar que el usuario es el propietario de la respuesta
    if (respuesta.usuario.toString() !== req.user.id) {
      return res.status(403).json({ mensaje: 'No autorizado para eliminar esta respuesta' });
    }
    
    // Eliminar la respuesta
    comentario.respuestas.pull(req.params.respuestaId);
    await comentario.save();
    
    res.json({ mensaje: 'Respuesta eliminada correctamente' });
  } catch (error) {
    console.error('Error al eliminar respuesta:', error);
    res.status(500).json({ mensaje: 'Error del servidor' });
  }
});

module.exports = router;