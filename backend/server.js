const express = require("express");
const fs = require("fs");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

const USUARIOS_PATH = path.join(__dirname, "usuarios.txt");
const CONFIG_PATH = path.join(__dirname, "configuracion.txt");

// Registro usuario
app.post("/api/register", (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ message: "Faltan datos requeridos." });
  }

  fs.readFile(USUARIOS_PATH, "utf8", (err, data) => {
    const usuarios = data
      ? data
          .split("\n")
          .filter(Boolean)
          .map((line) => {
            const [user, mail, pass] = line.split("|");
            return { user, mail, pass };
          })
      : [];

    if (usuarios.some((u) => u.mail === email)) {
      return res.status(409).json({ message: "El correo ya está registrado." });
    }

    const nuevaLinea = `${username}|${email}|${password}\n`;
    fs.appendFile(USUARIOS_PATH, nuevaLinea, (err) => {
      if (err) {
        return res.status(500).json({ message: "Error al guardar usuario." });
      }
      res.json({ message: "Usuario registrado correctamente." });
    });
  });
});

// Login usuario
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

    res.json({ user: { name: user.username, email: user.mail } });
  });
});

// Guardar o actualizar configuración del usuario
app.post("/api/configuracion", (req, res) => {
  const { username, objetivo, edad, sexo, altura, peso, experiencia } =
    req.body;

  if (
    !username ||
    !objetivo ||
    !edad ||
    !sexo ||
    !altura ||
    !peso ||
    !experiencia
  ) {
    return res
      .status(400)
      .json({ message: "Faltan datos en la configuración." });
  }

  fs.readFile(CONFIG_PATH, "utf8", (err, data) => {
    let lineas = data ? data.split("\n").filter(Boolean) : [];

    // Buscar si ya existe configuración para el usuario
    const index = lineas.findIndex((line) => line.startsWith(username + "|"));

    const nuevaConfig = `${username}|${objetivo}|${edad}|${sexo}|${altura}|${peso}|${experiencia}`;

    if (index >= 0) {
      // Actualizar línea existente
      lineas[index] = nuevaConfig;
    } else {
      // Agregar nueva línea
      lineas.push(nuevaConfig);
    }

    fs.writeFile(CONFIG_PATH, lineas.join("\n") + "\n", (err) => {
      if (err) {
        return res
          .status(500)
          .json({ message: "Error guardando configuración." });
      }
      res.json({ message: "Configuración guardada correctamente." });
    });
  });
});

// Obtener configuración de un usuario (por username)
app.get("/api/configuracion/:username", (req, res) => {
  const { username } = req.params;

  fs.readFile(CONFIG_PATH, "utf8", (err, data) => {
    if (err) {
      return res
        .status(500)
        .json({ message: "Error leyendo configuraciones." });
    }
    const lineas = data.split("\n").filter(Boolean);
    const configLinea = lineas.find((line) => line.startsWith(username + "|"));
    if (!configLinea) {
      return res.status(404).json({ message: "Configuración no encontrada." });
    }

    const [user, objetivo, edad, sexo, altura, peso, experiencia] =
      configLinea.split("|");

    res.json({
      username: user,
      objetivo,
      edad,
      sexo,
      altura,
      peso,
      experiencia,
    });
  });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
