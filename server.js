require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const connectDB = require("./config/db"); 

const authRoutes = require("./routes/auth");
const profileRoutes = require("./routes/profile");
const productosRoutes = require("./routes/productos");
const contactRoutes = require("./routes/contact");

const app = express();
app.use(cors());
app.use(express.json());

// Configurar middleware para servir archivos estáticos
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
// Si tienes una carpeta public para otros archivos estáticos
app.use(express.static(path.join(__dirname, "public")));

connectDB();

app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/productos", productosRoutes);
app.use("/api/contact", contactRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Funcionando en el puerto ${PORT}`);
});