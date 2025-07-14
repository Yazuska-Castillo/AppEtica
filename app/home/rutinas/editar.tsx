import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

type Ejercicio = {
  nombre: string;
  peso: string;
  repeticiones: string;
  series: string;
};

export default function EditarRutina() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState(""); // opcional
  const [ejercicios, setEjercicios] = useState<Ejercicio[]>([
    { nombre: "", peso: "", repeticiones: "", series: "" },
  ]);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState<string | null>(null);

  // Cargar usuario y rutina al iniciar
  useEffect(() => {
    async function cargarDatos() {
      try {
        // Obtener usuario del AsyncStorage
        const userStr = await AsyncStorage.getItem("user");
        if (!userStr) {
          Alert.alert("Error", "Por favor inicia sesión.");
          router.replace("/login");
          return;
        }
        const user = JSON.parse(userStr);
        const userName = user.name || user.email || null;
        setUsername(userName);

        if (!id) {
          setLoading(false);
          return;
        }

        const res = await fetch(
          `http://192.168.1.128:3000/api/rutina/${encodeURIComponent(id)}`
        );
        if (!res.ok) throw new Error("Error cargando rutina");

        const data = await res.json();

        setNombre(data.nombre || "");
        setDescripcion(data.descripcion || "");
        // Mapear ejercicios para que tengan strings (por si vienen como números)
        const ejParsed = (data.ejercicios || []).map((ej: any) => ({
          nombre: ej.nombre || "",
          peso: String(ej.peso ?? ""),
          repeticiones: String(ej.repeticiones ?? ""),
          series: String(ej.series ?? ""),
        }));
        setEjercicios(
          ejParsed.length
            ? ejParsed
            : [{ nombre: "", peso: "", repeticiones: "", series: "" }]
        );
      } catch (error) {
        console.error("Error al cargar la rutina:", error);
        Alert.alert("Error", "No se pudo cargar la rutina");
      } finally {
        setLoading(false);
      }
    }
    cargarDatos();
  }, [id]);

  const actualizarEjercicio = (
    index: number,
    campo: keyof Ejercicio,
    valor: string
  ) => {
    const nuevos = [...ejercicios];
    nuevos[index][campo] = valor;
    setEjercicios(nuevos);
  };

  const agregarEjercicio = () => {
    setEjercicios([
      ...ejercicios,
      { nombre: "", peso: "", repeticiones: "", series: "" },
    ]);
  };

  const eliminarEjercicio = (index: number) => {
    if (ejercicios.length === 1) {
      Alert.alert("Error", "Debe haber al menos un ejercicio.");
      return;
    }
    setEjercicios(ejercicios.filter((_, i) => i !== index));
  };

  const guardarCambios = async () => {
    if (!username) {
      Alert.alert("Error", "No hay usuario autenticado.");
      router.replace("/login");
      return;
    }
    if (!id) {
      Alert.alert("Error", "ID de rutina inválido.");
      return;
    }

    if (!nombre.trim()) {
      Alert.alert("Error", "El nombre es obligatorio");
      return;
    }

    for (let i = 0; i < ejercicios.length; i++) {
      const e = ejercicios[i];
      if (!e.nombre.trim()) {
        Alert.alert("Error", `El ejercicio ${i + 1} debe tener un nombre.`);
        return;
      }
      if (!e.peso || isNaN(Number(e.peso))) {
        Alert.alert("Error", `El peso del ejercicio ${i + 1} no es válido.`);
        return;
      }
      if (!e.repeticiones || isNaN(Number(e.repeticiones))) {
        Alert.alert(
          "Error",
          `Las repeticiones del ejercicio ${i + 1} no son válidas.`
        );
        return;
      }
      if (!e.series || isNaN(Number(e.series))) {
        Alert.alert(
          "Error",
          `Las series del ejercicio ${i + 1} no son válidas.`
        );
        return;
      }
    }

    try {
      const ejerciciosParseados = ejercicios.map((e) => ({
        nombre: e.nombre.trim(),
        peso: Number(e.peso),
        repeticiones: Number(e.repeticiones),
        series: Number(e.series),
      }));

      const res = await fetch(
        `http://192.168.1.128:3000/api/rutina/${encodeURIComponent(id)}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nombre: nombre.trim(),
            descripcion: descripcion.trim(),
            ejercicios: ejerciciosParseados,
          }),
        }
      );

      if (!res.ok) throw new Error("Error guardando rutina");

      Alert.alert("Éxito", "Rutina actualizada");
      router.back();
    } catch (error) {
      console.error("Error guardando rutina:", error);
      Alert.alert("Error", "No se pudo guardar la rutina");
    }
  };

  if (loading) return <Text style={{ padding: 16 }}>Cargando...</Text>;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.label}>Nombre</Text>
      <TextInput style={styles.input} value={nombre} onChangeText={setNombre} />

      <Text style={styles.label}>Descripción (opcional)</Text>
      <TextInput
        style={styles.input}
        value={descripcion}
        onChangeText={setDescripcion}
        multiline
      />

      {ejercicios.map((ejercicio, index) => (
        <View key={index} style={styles.ejercicioContainer}>
          <Text style={styles.ejercicioTitulo}>Ejercicio {index + 1}</Text>

          <TextInput
            style={styles.input}
            placeholder="Nombre"
            value={ejercicio.nombre}
            onChangeText={(text) => actualizarEjercicio(index, "nombre", text)}
          />
          <TextInput
            style={styles.input}
            placeholder="Peso (kg)"
            keyboardType="numeric"
            value={ejercicio.peso}
            onChangeText={(text) => actualizarEjercicio(index, "peso", text)}
          />
          <TextInput
            style={styles.input}
            placeholder="Repeticiones"
            keyboardType="numeric"
            value={ejercicio.repeticiones}
            onChangeText={(text) =>
              actualizarEjercicio(index, "repeticiones", text)
            }
          />
          <TextInput
            style={styles.input}
            placeholder="Series"
            keyboardType="numeric"
            value={ejercicio.series}
            onChangeText={(text) => actualizarEjercicio(index, "series", text)}
          />

          <Pressable
            style={styles.btnEliminarEjercicio}
            onPress={() => eliminarEjercicio(index)}
          >
            <Text style={styles.btnEliminarTexto}>Eliminar ejercicio</Text>
          </Pressable>
        </View>
      ))}

      <Pressable style={styles.btnAgregarEjercicio} onPress={agregarEjercicio}>
        <Text style={styles.btnAgregarTexto}>+ Agregar ejercicio</Text>
      </Pressable>

      <Button title="Guardar" onPress={guardarCambios} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  label: { fontWeight: "bold", marginTop: 12 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 8,
    borderRadius: 6,
    marginTop: 4,
    marginBottom: 12,
  },
  ejercicioContainer: {
    marginBottom: 24,
    padding: 12,
    backgroundColor: "#eee",
    borderRadius: 8,
  },
  ejercicioTitulo: {
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 8,
  },
  btnEliminarEjercicio: {
    backgroundColor: "#F44336",
    padding: 8,
    borderRadius: 6,
    alignItems: "center",
  },
  btnEliminarTexto: {
    color: "#fff",
    fontWeight: "bold",
  },
  btnAgregarEjercicio: {
    backgroundColor: "#2196F3",
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    alignItems: "center",
  },
  btnAgregarTexto: {
    color: "#fff",
    fontWeight: "bold",
  },
});
