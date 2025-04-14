const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const auth = require('../middleware/auth');
const Producto = require('../models/Producto');
const Comentario = require('../models/Comentario');

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