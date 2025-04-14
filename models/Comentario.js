const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ComentarioSchema = new Schema({
  producto: {
    type: Schema.Types.ObjectId,
    ref: 'Producto',
    required: true
  },
  // En Comentario.js verifica que la referencia sea correcta
usuario: {
  type: Schema.Types.ObjectId,
  ref: 'User', // Debe coincidir exactamente con el nombre del modelo
  required: true
},
  texto: {
    type: String,
    required: true,
    trim: true
  },
  respuestas: [{
    // En Comentario.js verifica que la referencia sea correcta
usuario: {
  type: Schema.Types.ObjectId,
  ref: 'User', // Debe coincidir exactamente con el nombre del modelo
  required: true
},
    texto: {
      type: String,
      required: true,
      trim: true
    },
    fecha: {
      type: Date,
      default: Date.now
    }
  }],
  fecha: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Comentario', ComentarioSchema);