const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ProductoSchema = new Schema({
  titulo: {
    type: String,
    required: true,
    trim: true
  },
  descripcion: {
    type: String,
    required: true
  },
  categoria: {
    type: String,
    required: true
  },
  estado: {
    type: String,
    required: true,
    enum: ['Nuevo', 'Como nuevo', 'Buen estado', 'Usado', 'Para reparar']
  },
  intercambioPor: {
    type: String,
    required: true
  },
  imagenes: {
    type: [String],
    default: []
  },
  usuario: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  ubicacion: {
    ciudad: {
      type: String,
      required: true
    },
    estado: {  // Cambiado de provincia a estado
      type: String,
      required: true
    },
    codigoPostal: {
      type: String
    }
  },
  disponible: {
    type: Boolean,
    default: true
  },
  vistas: {
    type: Number,
    default: 0
  },
  fechaTrueque: {
    type: Date
  },
  productoIntercambiado: {
    type: Schema.Types.ObjectId,
    ref: 'Producto'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Producto', ProductoSchema);