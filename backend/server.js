const express = require("express");
const fs = require("fs");
const cors = require("cors");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

const app = express();
app.use(cors());
app.use(express.json());

const USUARIOS_PATH = path.join(__dirname, "usuarios.txt");
const CONFIG_PATH = path.join(__dirname, "configuracion.txt");
const RUTINAS_PATH = path.join(__dirname, "rutinas.txt");
const ALIMENTACION_PATH = path.join(__dirname, "alimentacion.txt");

// --- RUTA ALIMENTACIÓN (lee 7 campos, incluye 'comida') ---
app.get("/api/alimentacion/:objetivo", (req, res) => {
  const objetivoParam = (req.params.objetivo || "").trim().toLowerCase();

  fs.readFile(ALIMENTACION_PATH, "utf8", (err, data) => {
    if (err) {
      console.error("Error leyendo alimentacion.txt:", err);
      return res
        .status(500)
        .json({ message: "Error leyendo recomendaciones." });
    }

    const lineas = data.split("\n").filter(Boolean);

    const recomendaciones = [];
    for (const line of lineas) {
      // objetivo|comida|categoria|alimento|porcion|gramos|calorias
      const parts = line.split("|");
      if (parts.length < 7) continue;

      const [obj, comida, categoria, alimento, porcion, gramos, calorias] =
        parts.map((p) => p.trim());

      if ((obj || "").toLowerCase() !== objetivoParam) continue;

      recomendaciones.push({
        objetivo: obj,
        comida, // "Desayuno" | "Almuerzo" | "Merienda" | "Cena"
        categoria, // "carbohidratos" | "proteinas" | "grasas saludables"
        alimento,
        porcion,
        gramos: Number(gramos) || 0,
        calorias: Number(calorias) || 0,
      });
    }

    if (!recomendaciones.length) {
      return res
        .status(404)
        .json({ message: `No hay recomendaciones para '${objetivoParam}'.` });
    }

    res.json(recomendaciones);
  });
});

// --- RUTAS RUTINAS ---

app.post("/api/rutinas", (req, res) => {
  const { ID, userId, nombre, descripcion, ejercicios } = req.body;

  if (!ID || !userId || !nombre || !descripcion || !ejercicios) {
    return res.status(400).json({ message: "Faltan datos en la rutina." });
  }

  fs.readFile(RUTINAS_PATH, "utf8", (err, data) => {
    let lineas = data ? data.split("\n").filter(Boolean) : [];

    // Buscar si ya existe rutina con ese ID
    const index = lineas.findIndex((line) => line.startsWith(ID + "|"));

    // Formatear ejercicios como JSON string sin saltos de línea
    const ejerciciosStr = JSON.stringify(ejercicios).replace(/\n/g, "");

    const nuevaLinea = `${ID}|${userId}|${nombre}|${descripcion}|${ejerciciosStr}`;

    if (index >= 0) {
      // Actualizar rutina existente
      lineas[index] = nuevaLinea;
    } else {
      // Agregar nueva rutina
      lineas.push(nuevaLinea);
    }

    fs.writeFile(RUTINAS_PATH, lineas.join("\n") + "\n", (err) => {
      if (err) {
        return res.status(500).json({ message: "Error guardando rutina." });
      }
      res.json({ message: "Rutina guardada correctamente." });
    });
  });
});

app.get("/api/rutinas/:userId", (req, res) => {
  const { userId } = req.params;
  fs.readFile(RUTINAS_PATH, "utf8", (err, data) => {
    if (err) {
      console.error("Error leyendo archivo:", err);
      return res.status(500).json({ message: "Error leyendo rutinas." });
    }

    const lineas = data.split("\n").filter(Boolean);

    const rutinas = lineas
      .map((line) => {
        const [ID, uid, nombre, descripcion, ejerciciosJSON] = line.split("|");
        try {
          return {
            ID,
            userId: uid,
            nombre,
            descripcion,
            ejercicios: JSON.parse(ejerciciosJSON),
          };
        } catch (e) {
          console.warn("Error parseando línea:", line);
          return null;
        }
      })
      .filter((r) => r && r.userId === userId);

    res.json(rutinas);
  });
});

app.get("/api/rutina/:id", (req, res) => {
  const { id } = req.params;

  fs.readFile(RUTINAS_PATH, "utf8", (err, data) => {
    if (err) {
      return res.status(500).json({ message: "Error leyendo archivo" });
    }

    const lineas = data.split("\n").filter(Boolean);
    for (let line of lineas) {
      const [ID, userId, nombre, descripcion, ejerciciosJSON] = line.split("|");
      if (ID === id) {
        try {
          const rutina = {
            ID,
            userId,
            nombre,
            descripcion,
            ejercicios: JSON.parse(ejerciciosJSON),
          };
          return res.json(rutina);
        } catch (e) {
          return res
            .status(500)
            .json({ message: "Error parseando ejercicios" });
        }
      }
    }

    res.status(404).json({ message: "Rutina no encontrada" });
  });
});

app.delete("/api/rutina/:id", (req, res) => {
  const { id } = req.params;

  fs.readFile(RUTINAS_PATH, "utf8", (err, data) => {
    if (err) {
      console.error("Error leyendo archivo:", err);
      return res.status(500).json({ message: "Error leyendo rutinas." });
    }

    let lineas = data.split("\n").filter(Boolean);

    const nuevasLineas = lineas.filter((line) => {
      const [lineID] = line.split("|");
      return lineID !== id;
    });

    if (nuevasLineas.length === lineas.length) {
      return res.status(404).json({ message: "Rutina no encontrada." });
    }

    fs.writeFile(RUTINAS_PATH, nuevasLineas.join("\n") + "\n", (err) => {
      if (err) {
        console.error("Error escribiendo archivo:", err);
        return res.status(500).json({ message: "Error eliminando rutina." });
      }
      res.json({ message: "Rutina eliminada correctamente." });
    });
  });
});

// --- RUTAS REGISTRO ---

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
            const [id, user, mail, pass] = line.split("|");
            return { id, user, mail, pass };
          })
      : [];

    if (
      usuarios.some(
        (u) => u.mail.trim().toLowerCase() === email.trim().toLowerCase()
      )
    ) {
      return res.status(409).json({ message: "El correo ya está registrado." });
    }

    const newId = uuidv4();
    const nuevaLinea = `${newId}|${username.trim()}|${email
      .trim()
      .toLowerCase()}|${password.trim()}\n`;

    fs.appendFile(USUARIOS_PATH, nuevaLinea, (err) => {
      if (err) {
        return res.status(500).json({ message: "Error al guardar usuario." });
      }
      res.json({
        message: "Usuario registrado correctamente.",
        user: {
          id: newId,
          name: username.trim(),
          email: email.trim().toLowerCase(),
        },
      });
    });
  });
});

// --- ACTUALIZAR DATOS PERSONALES ---

app.post("/api/actualizar-usuario", (req, res) => {
  const { userId, newUsername, email, password } = req.body;

  const ruta = USUARIOS_PATH;

  fs.readFile(ruta, "utf-8", (err, data) => {
    if (err) {
      return res
        .status(500)
        .json({ message: "Error al leer la base de datos." });
    }

    const lineas = data.trim().split("\n");
    const nuevasLineas = [];
    let usuarioEncontrado = false;

    for (let linea of lineas) {
      const [id, nombre, correo, clave] = linea.split("|");

      if (id === userId) {
        usuarioEncontrado = true;

        const nuevaLinea = [
          id,
          newUsername || nombre,
          email || correo,
          password || clave,
        ].join("|");

        nuevasLineas.push(nuevaLinea);
      } else {
        nuevasLineas.push(linea);
      }
    }

    if (!usuarioEncontrado) {
      return res.status(404).json({ message: "Usuario no encontrado." });
    }

    const nuevoContenido = nuevasLineas.join("\n");

    fs.writeFile(ruta, nuevoContenido, "utf-8", (err) => {
      if (err) {
        return res
          .status(500)
          .json({ message: "Error al guardar los cambios." });
      }

      return res
        .status(200)
        .json({ message: "Usuario actualizado correctamente." });
    });
  });
});

// --- RUTAS LOGIN ---

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
        const [id, username, mail, pass] = line.split("|");
        return {
          id: id.trim(),
          username: username.trim(),
          mail: mail.trim().toLowerCase(),
          pass: pass.trim(),
        };
      });

    const user = usuarios.find(
      (u) => u.mail === email.trim().toLowerCase() && u.pass === password.trim()
    );

    if (!user) {
      return res
        .status(401)
        .json({ message: "Usuario o contraseña incorrectos." });
    }

    res.json({ user: { id: user.id, name: user.username, email: user.mail } });
  });
});

// --- RUTAS CONFIGURACION ---

app.post("/api/configuracion", (req, res) => {
  const { userId, objetivo, edad, sexo, altura, peso, experiencia } = req.body;

  if (
    !userId ||
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

    const index = lineas.findIndex((line) => line.startsWith(userId + "|"));

    const nuevaConfig = `${userId}|${objetivo}|${edad}|${sexo}|${altura}|${peso}|${experiencia}`;

    if (index >= 0) {
      lineas[index] = nuevaConfig;
    } else {
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

app.get("/api/configuracion/:userId", (req, res) => {
  const { userId } = req.params;

  fs.readFile(CONFIG_PATH, "utf8", (err, data) => {
    if (err) {
      console.error("Error leyendo archivo de configuración:", err);
      return res
        .status(500)
        .json({ message: "Error leyendo configuraciones." });
    }
    const lineas = data.split("\n").filter(Boolean);

    const configLinea = lineas.find((line) => {
      const uid = line.split("|")[0].trim();
      return uid === userId;
    });

    if (!configLinea) {
      console.warn("No se encontró configuración para userId:", userId);
      return res.status(404).json({ message: "Configuración no encontrada." });
    }

    const [uid, objetivo, edad, sexo, altura, peso, experiencia] =
      configLinea.split("|");

    res.json({
      userId: uid,
      objetivo,
      edad,
      sexo,
      altura,
      peso,
      experiencia,
    });
  });
});

// --- RUTA USUARIO ---
app.get("/api/usuario/:userId", (req, res) => {
  const { userId } = req.params;

  fs.readFile(USUARIOS_PATH, "utf8", (err, data) => {
    if (err)
      return res.status(500).json({ message: "Error leyendo usuarios." });

    const lineas = data.split("\n").filter(Boolean);
    const usuario = lineas
      .map((line) => {
        const [id, nombre, correo, clave] = line.split("|");
        return { id, username: nombre, email: correo, password: clave };
      })
      .find((u) => u.id === userId);

    if (!usuario) {
      return res.status(404).json({ message: "Usuario no encontrado." });
    }

    res.json(usuario);
  });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
