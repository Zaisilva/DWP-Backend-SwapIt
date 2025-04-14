const express = require('express');
const router = express.Router();
const User = require('../models/User'); // Importar el modelo Mongoose
const authenticateToken = require('../middleware/auth');
const bcrypt = require('bcryptjs'); // Usar bcryptjs para ser consistente con auth.js

// Get user profile
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const user = await User.findById(userId).lean();
    
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    
    // Return user data without password
    const { password, ...userData } = user;
    res.status(200).json(userData);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ message: 'Error al obtener el perfil' });
  }
});

// Update user profile
router.put('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { firstName, lastName, email, phone } = req.body;
    
    // Validate required fields
    if (!firstName || !lastName || !email) {
      return res.status(400).json({ message: 'Nombre, apellido y correo son obligatorios' });
    }
    
    // Check if email is already in use by another user
    const existingUser = await User.findOne({ 
      email, 
      _id: { $ne: userId }
    });
    
    if (existingUser) {
      return res.status(400).json({ message: 'Este correo ya está en uso' });
    }
    
    // Update user profile
    const result = await User.updateOne(
      { _id: userId },
      { $set: { 
          nombre: firstName,
          apellido: lastName,
          email,
          telefono: phone || ''
        }
      }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    
    res.status(200).json({ message: 'Perfil actualizado correctamente' });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Error al actualizar el perfil' });
  }
});

// Update password
router.put('/password', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { currentPassword, newPassword, confirmPassword } = req.body;
    
    // Validate passwords
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: 'Todos los campos son obligatorios' });
    }
    
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'Las contraseñas no coinciden' });
    }
    
    // Get user
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    
    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'La contraseña actual es incorrecta' });
    }
    
    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update password
    user.password = hashedPassword;
    await user.save();
    
    res.status(200).json({ message: 'Contraseña actualizada correctamente' });
  } catch (error) {
    console.error('Error updating password:', error);
    res.status(500).json({ message: 'Error al actualizar la contraseña' });
  }
});

module.exports = router;