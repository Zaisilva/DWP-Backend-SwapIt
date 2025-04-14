const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User'); 
const jwt = require('jsonwebtoken'); 

  router.post('/register', async (req, res) => {
    try {
      const { email, password, nombre, apellido, estado, direccion, telefono } = req.body;

      if (!email || !password || !nombre || !apellido || !estado || !direccion || !telefono) {
        return res.status(400).json({ error: "Todos los campos son obligatorios" });
      }

      const existingUser = await User.findOne({ email: email });
      if (existingUser) {
        return res.status(400).json({ error: 'El usuario ya existe' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const newUser = new User({
        email,
        password: hashedPassword,
        nombre,
        apellido,
        estado,
        direccion,
        telefono
      });

      await newUser.save();

      res.status(201).json({ message: 'Usuario registrado exitosamente' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  });

  router.post('/login', async (req, res) => {
    try {
      const { email, password } = req.body;
  
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(401).json({ error: 'Credenciales inválidas' });
      }
  
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ error: 'Credenciales inválidas' });
      }
  
      user.last_login = new Date();
      await user.save();
  
      const token = jwt.sign(
        { userId: user._id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: '10m' }
      );
  
      res.json({
        token,
        user: {
          id: user._id,
          email: user.email,
          username: user.nombre, // o como lo estés usando en frontend
          tipo: user.tipo || 'usuario' 
        }
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  });

  router.post('/logout', (req, res) => {
      try {
        res.json({ message: 'Sesión cerrada exitosamente' });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
  });


 module.exports = router;