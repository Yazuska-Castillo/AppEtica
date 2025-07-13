const express = require("express");
const fs = require("fs");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

const USUARIOS_PATH = path.join(__dirname, "usuarios.txt");

// Ruta para registrar usuario
app.post("/api/register", (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ message: "Faltan datos requeridos." });
  }

  // Leer usuarios existentes
  fs.readFile(USUARIOS_PATH, "utf8", (err, data) => {
    // Si no existe archivo, data será ""
    const usuarios = data
      ? data
          .split("\n")
          .filter(Boolean)
          .map((line) => {
            const [user, mail, pass] = line.split("|");
            return { user, mail, pass };
          })
      : [];

    // Validar si email ya existe
    const emailExiste = usuarios.some((u) => u.mail === email);
    if (emailExiste) {
      return res.status(409).json({ message: "El correo ya está registrado." });
    }

    // Guardar nuevo usuario
    const nuevaLinea = `${username}|${email}|${password}\n`;
    fs.appendFile(USUARIOS_PATH, nuevaLinea, (err) => {
      if (err) {
        return res.status(500).json({ message: "Error al guardar usuario." });
      }
      res.json({ message: "Usuario registrado correctamente." });
    });
  });
});

// Ruta para login
app.post("/api/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Faltan email o password." });
  }

  fs.readFile(USUARIOS_PATH, "utf8", (err, data) => {
    if (err)
      return res.status(500).json({ message: "Error al leer usuarios." });

    const usuarios = data
      .split("\n")
      .filter(Boolean)
      .map((line) => {
        const [username, mail, pass] = line.split("|");
        return { username, mail, pass };
      });

    const user = usuarios.find((u) => u.mail === email && u.pass === password);

    if (!user) {
      return res
        .status(401)
        .json({ message: "Usuario o contraseña incorrectos." });
    }

    // Login exitoso
    res.json({ user: { name: user.username, email: user.mail } });
  });
});

// Opcional: ruta para obtener todos los usuarios (solo para test)
app.get("/api/users", (req, res) => {
  fs.readFile(USUARIOS_PATH, "utf8", (err, data) => {
    if (err)
      return res.status(500).json({ message: "Error al leer usuarios." });
    const usuarios = data
      .split("\n")
      .filter(Boolean)
      .map((line) => {
        const [username, mail, pass] = line.split("|");
        return { username, mail };
      });
    res.json(usuarios);
  });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
