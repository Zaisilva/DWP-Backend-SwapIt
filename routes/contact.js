const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');

// Configure email transporter
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // use SSL
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD
  },
  debug: true // Enable debug output
});

// Contact form endpoint
router.post('/', async (req, res) => {
  try {
    const { name, email, message } = req.body;
    
    // Log authentication details (remove in production)
    console.log('Attempting to send email with:');
    console.log('User:', process.env.EMAIL_USER);
    console.log('Password length:', process.env.EMAIL_APP_PASSWORD ? process.env.EMAIL_APP_PASSWORD.length : 0);
    
    // Validate required fields
    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }

    // Email to admin - Enhanced professional template
    const adminMailOptions = {
      from: process.env.EMAIL_USER,
      to: 'zagarsil.10@gmail.com',
      subject: `Nuevo mensaje de contacto de ${name}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
            .container { padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px; }
            .header { background-color: #1b2a41; color: white; padding: 15px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { padding: 20px; background-color: #f9f9f9; }
            .footer { font-size: 12px; text-align: center; margin-top: 20px; color: #777; }
            .info-row { margin-bottom: 10px; }
            .label { font-weight: bold; }
            .message-box { background-color: white; padding: 15px; border-left: 4px solid #1b2a41; margin: 15px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>Nuevo Mensaje de Contacto</h2>
            </div>
            <div class="content">
              <div class="info-row">
                <span class="label">Nombre:</span> ${name}
              </div>
              <div class="info-row">
                <span class="label">Email:</span> ${email}
              </div>
              <div class="info-row">
                <span class="label">Mensaje:</span>
                <div class="message-box">${message}</div>
              </div>
            </div>
            <div class="footer">
              <p>Este mensaje fue enviado desde el formulario de contacto de SwapIt.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    // Auto-reply to user - Enhanced professional template
    const userMailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Hemos recibido tu mensaje - SwapIt',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
            .container { padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px; }
            .header { background-color: #1b2a41; color: white; padding: 15px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { padding: 20px; background-color: #f9f9f9; }
            .footer { font-size: 12px; text-align: center; margin-top: 20px; color: #777; }
            .greeting { font-size: 18px; margin-bottom: 15px; }
            .message { margin-bottom: 20px; }
            .signature { margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>Gracias por Contactarnos</h2>
            </div>
            <div class="content">
              <div class="greeting">Hola ${name},</div>
              <div class="message">
                <p>Hemos recibido tu mensaje y queremos agradecerte por ponerte en contacto con nosotros.</p>
                <p>Nuestro equipo revisará tu consulta y te responderemos lo antes posible.</p>
                <p>Este es un correo automático, por favor no respondas a este mensaje.</p>
              </div>
              <div class="signature">
                <p>Saludos cordiales,</p>
                <p><strong>El equipo de SwapIt</strong></p>
              </div>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} SwapIt. Todos los derechos reservados.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    // Send emails
    await transporter.sendMail(adminMailOptions);
    await transporter.sendMail(userMailOptions);

    res.status(200).json({ message: 'Mensaje enviado correctamente' });
  } catch (error) {
    console.error('Error sending contact email:', error);
    res.status(500).json({ error: 'Error al enviar el mensaje' });
  }
});

module.exports = router;