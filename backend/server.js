const express = require("express");
const fs = require("fs");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

const USUARIOS_PATH = path.join(__dirname, "usuarios.txt");
const CONFIG_PATH = path.join(__dirname, "configuracion.txt");
const PESO_PATH = path.join(__dirname, "peso.txt");
const PROGRESO_PATH = path.join(__dirname, "progreso.txt");
const RUTINAS_PATH = path.join(__dirname, "rutinas.txt");

// Guardar rutina
app.post("/api/rutinas", (req, res) => {
  const { username, nombre, descripcion, ejercicios } = req.body;

  if (!username || !nombre || !Array.isArray(ejercicios)) {
    return res.status(400).json({ message: "Datos incompletos" });
  }

  const id = generarId();
  console.log("Enviando respuesta con id:", id);

  const ejerciciosPlano = ejercicios
    .map((e) => `${e.nombre},${e.peso},${e.repeticiones},${e.series}`)
    .join(";");

  const nuevaLinea = `${id}|${username}|${nombre}|${descripcion}|${ejerciciosPlano}\n`;

  console.log("Guardando rutina:", nuevaLinea);

  fs.appendFile(RUTINAS_PATH, nuevaLinea, (err) => {
    if (err) {
      console.error("Error escribiendo rutina:", err);
      return res.status(500).json({ message: "Error guardando rutina" });
    }
    res.json({ id, username, nombre, descripcion, ejercicios });
  });
});

// Obtener rutinas de un usuario
app.get("/api/rutinas/:username", (req, res) => {
  const { username } = req.params;

  fs.readFile(RUTINAS_PATH, "utf8", (err, data) => {
    if (err) {
      if (err.code === "ENOENT") return res.json([]); // archivo no existe
      return res.status(500).json({ message: "Error leyendo rutinas" });
    }

    const lineas = data.split("\n").filter(Boolean);
    const rutinas = lineas
      .map((line) => {
        const [user, nombre, descripcion, ejerciciosPlano] = line.split("|");
        const ejercicios = ejerciciosPlano
          ? ejerciciosPlano.split(";").map((e) => {
              const [nombre, peso, repeticiones, series] = e.split(",");
              return {
                nombre,
                peso: Number(peso),
                repeticiones: Number(repeticiones),
                series: Number(series),
              };
            })
          : [];
        return { username: user, nombre, descripcion, ejercicios };
      })
      .filter((rutina) => rutina.username === username); // filtramos por usuario

    res.json(rutinas);
  });
});

app.get("/api/rutina/:id", (req, res) => {
  const { id } = req.params;

  fs.readFile(RUTINAS_PATH, "utf8", (err, data) => {
    if (err) return res.status(500).json({ message: "Error leyendo rutinas" });

    const linea = data
      .split("\n")
      .filter(Boolean)
      .find((line) => line.startsWith(id + "|"));

    if (!linea)
      return res.status(404).json({ message: "Rutina no encontrada" });

    const [rutinaId, username, nombre, descripcion, ejerciciosPlano] =
      linea.split("|");
    const ejercicios = ejerciciosPlano
      ? ejerciciosPlano.split(";").map((e) => {
          const [nombre, peso, repeticiones, series] = e.split(",");
          return {
            nombre,
            peso: Number(peso),
            repeticiones: Number(repeticiones),
            series: Number(series),
          };
        })
      : [];

    res.json({ id: rutinaId, username, nombre, descripcion, ejercicios });
  });
});

// Ruta para obtener una rutina específica por nombre
app.put("/api/rutina/:id", (req, res) => {
  const { id } = req.params;
  const { nombre, descripcion, ejercicios } = req.body;

  if (!nombre || !descripcion || !Array.isArray(ejercicios)) {
    return res.status(400).json({ message: "Datos incompletos" });
  }

  fs.readFile(RUTINAS_PATH, "utf8", (err, data) => {
    if (err) return res.status(500).json({ message: "Error leyendo archivo" });

    const lineas = data.split("\n").filter(Boolean);
    const nuevasLineas = lineas.map((linea) => {
      const [rutinaId, user, nom, desc, ejer] = linea.split("|");

      if (rutinaId === id) {
        const ejerciciosPlano = ejercicios
          .map((e) => `${e.nombre},${e.peso},${e.repeticiones},${e.series}`)
          .join(";");
        return `${id}|${user}|${nombre}|${descripcion}|${ejerciciosPlano}`;
      }
      return linea;
    });

    fs.writeFile(RUTINAS_PATH, nuevasLineas.join("\n") + "\n", (err) => {
      if (err)
        return res.status(500).json({ message: "Error escribiendo archivo" });
      res.json({ message: "Rutina actualizada correctamente" });
    });
  });
});

// Guardar peso
app.post("/api/peso", (req, res) => {
  const { username, fecha, peso } = req.body;

  const pesoNum = parseFloat(peso);

  if (!username || !fecha || isNaN(pesoNum) || pesoNum <= 0) {
    return res.status(400).json({ message: "Peso inválido o faltan datos." });
  }

  const linea = `${username}|${fecha}|${pesoNum}\n`;

  fs.appendFile(PESO_PATH, linea, (err) => {
    if (err) {
      console.error("❌ Error guardando peso:", err);
      return res.status(500).json({ message: "Error guardando peso." });
    }
    console.log("✅ Peso guardado:", linea.trim());
    res.json({ message: "Peso guardado correctamente." });
  });
});

// Obtener pesos
app.get("/api/peso/:username", (req, res) => {
  const { username } = req.params;
  fs.readFile(PESO_PATH, "utf8", (err, data) => {
    if (err) return res.status(500).json({ message: "Error leyendo pesos." });
    const lineas = data.split("\n").filter(Boolean);
    const registros = lineas
      .filter((line) => line.startsWith(username + "|"))
      .map((line) => {
        const [, fecha, peso] = line.split("|");
        return { fecha, peso: parseFloat(peso) };
      });
    res.json(registros);
  });
});

// Guardar progreso ejercicio
app.post("/api/progreso", (req, res) => {
  const { username, fecha, ejercicio, peso, repeticiones, series } = req.body;
  if (!username || !fecha || !ejercicio || !peso || !repeticiones || !series) {
    return res.status(400).json({ message: "Faltan datos para progreso." });
  }
  const linea = `${username}|${fecha}|${ejercicio}|${peso}|${repeticiones}|${series}\n`;
  fs.appendFile(PROGRESO_PATH, linea, (err) => {
    if (err)
      return res.status(500).json({ message: "Error guardando progreso." });
    res.json({ message: "Progreso guardado correctamente." });
  });
});

// Obtener progreso ejercicio
app.get("/api/progreso/:username", (req, res) => {
  const { username } = req.params;
  fs.readFile(PROGRESO_PATH, "utf8", (err, data) => {
    if (err)
      return res.status(500).json({ message: "Error leyendo progreso." });
    const lineas = data.split("\n").filter(Boolean);
    const registros = lineas
      .filter((line) => line.startsWith(username + "|"))
      .map((line) => {
        const [, fecha, ejercicio, peso, repeticiones, series] =
          line.split("|");
        return {
          fecha,
          ejercicio,
          peso: parseFloat(peso),
          repeticiones: parseInt(repeticiones),
          series: parseInt(series),
        };
      });
    res.json(registros);
  });
});

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
