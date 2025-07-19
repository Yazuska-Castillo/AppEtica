const express = require("express");
const fs = require("fs");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

const USUARIOS_PATH = path.join(__dirname, "usuarios.txt");
const CONFIG_PATH = path.join(__dirname, "configuracion.txt");
const RUTINAS_PATH = path.join(__dirname, "rutinas.txt");
const ALIMENTACION_PATH = path.join(__dirname, "alimentacion.txt");

// --- RUTAS ALIMENTACION ---

app.get("/api/alimentacion/:objetivo", (req, res) => {
  const { objetivo } = req.params;
  console.log("Objetivo recibido:", objetivo);

  fs.readFile(ALIMENTACION_PATH, "utf8", (err, data) => {
    if (err) {
      console.error("Error leyendo archivo alimentacion.txt:", err);
      return res
        .status(500)
        .json({ message: "Error leyendo recomendaciones." });
    }

    const lineas = data.split("\n").filter(Boolean);
    console.log("Total de líneas leídas:", lineas.length);

    // Filtrar líneas donde el objetivo (antes del primer '|') coincide ignorando mayúsculas y espacios extra
    const filtradas = lineas.filter((line) => {
      const objLinea = line.split("|")[0].trim().toLowerCase();
      const coincide = objLinea === objetivo.trim().toLowerCase();
      if (coincide) {
        console.log("Línea coincidente:", line);
      }
      return coincide;
    });

    console.log("Total de recomendaciones encontradas:", filtradas.length);

    const recomendaciones = filtradas.map((line) => {
      const [obj, categoria, alimento, porcion, gramos, calorias] =
        line.split("|");
      return {
        objetivo: obj,
        categoria,
        alimento,
        porcion,
        gramos: Number(gramos),
        calorias: Number(calorias),
      };
    });

    if (recomendaciones.length === 0) {
      console.warn(
        `No se encontraron recomendaciones para el objetivo '${objetivo}'.`
      );
      return res.status(404).json({
        message: `No hay recomendaciones para el objetivo '${objetivo}'.`,
      });
    }

    console.log("Recomendaciones a enviar:", recomendaciones);
    res.json(recomendaciones);
  });
});

// --- RUTAS RUTINAS ---

app.post("/api/rutinas", (req, res) => {
  const { ID, username, nombre, descripcion, ejercicios } = req.body;

  if (!ID || !username || !nombre || !descripcion || !ejercicios) {
    return res.status(400).json({ message: "Faltan datos en la rutina." });
  }

  fs.readFile(RUTINAS_PATH, "utf8", (err, data) => {
    let lineas = data ? data.split("\n").filter(Boolean) : [];

    // Buscar si ya existe rutina con ese ID
    const index = lineas.findIndex((line) => line.startsWith(ID + "|"));

    // Formatear ejercicios como JSON string sin saltos de línea
    const ejerciciosStr = JSON.stringify(ejercicios).replace(/\n/g, "");

    const nuevaLinea = `${ID}|${username}|${nombre}|${descripcion}|${ejerciciosStr}`;

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

app.get("/api/rutinas/:username", (req, res) => {
  const { username } = req.params;
  fs.readFile(RUTINAS_PATH, "utf8", (err, data) => {
    if (err) {
      console.error("Error leyendo archivo:", err);
      return res.status(500).json({ message: "Error leyendo rutinas." });
    }

    const lineas = data.split("\n").filter(Boolean);

    const rutinas = lineas
      .map((line) => {
        const [ID, user, nombre, descripcion, ejerciciosJSON] = line.split("|");
        try {
          return {
            ID,
            username: user,
            nombre,
            descripcion,
            ejercicios: JSON.parse(ejerciciosJSON),
          };
        } catch (e) {
          console.warn("Error parseando línea:", line);
          return null;
        }
      })
      .filter((r) => r && r.username === username);

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
      const [ID, username, nombre, descripcion, ejerciciosJSON] =
        line.split("|");
      if (ID === id) {
        try {
          const rutina = {
            ID,
            username,
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
      console.log("Rutina eliminada:", id);
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

// --- RUTAS CONFIGURACION ---

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
