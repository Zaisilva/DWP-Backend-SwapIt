const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  nombre: { type: String, required: true },
  apellido: { type: String, required: true },
  estado: { type: String, required: true },
  direccion: { type: String, required: true },
  telefono: { type: String, required: true },
  tipo: { type: Number, default: 2 },
  last_login: { type: Date, default: Date.now },
  cambios: { type: Number, default: 0 } 
});

const User = mongoose.model('User', userSchema);

module.exports = User;
