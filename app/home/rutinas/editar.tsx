import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import React, { useEffect, useLayoutEffect, useState } from "react";
import {
  Alert,
  Button,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

type Ejercicio = {
  nombre: string;
  peso: number;
  repeticiones: number;
  series: number;
};

type Rutina = {
  ID: string;
  username: string;
  nombre: string;
  descripcion: string;
  ejercicios: Ejercicio[];
};

export default function EditarRutina() {
  const router = useRouter();
  const navigation = useNavigation();
  const { id } = useLocalSearchParams();

  const [rutina, setRutina] = useState<Rutina | null>(null);
  const [loading, setLoading] = useState(true);

  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [ejercicios, setEjercicios] = useState<Ejercicio[]>([]);

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: true });
  }, [navigation]);

  useEffect(() => {
    if (!id || typeof id !== "string") {
      console.log("[EditarRutina] ID inválido:", id);
      Alert.alert("Error", "ID de rutina no válido.");
      router.back();
      return;
    }

    const cargarRutina = async () => {
      try {
        console.log("[EditarRutina] Cargando rutina con ID:", id);
        setLoading(true);
        const res = await fetch(`http://192.168.1.128:3000/api/rutina/${id}`);
        console.log("[EditarRutina] Respuesta fetch:", res.status);
        if (!res.ok) throw new Error("No se pudo cargar la rutina");
        const data: Rutina = await res.json();
        console.log("[EditarRutina] Datos recibidos:", data);

        setRutina(data);
        setNombre(data.nombre);
        setDescripcion(data.descripcion);
        setEjercicios(data.ejercicios);
      } catch (error) {
        console.error("[EditarRutina] Error cargando rutina:", error);
        Alert.alert("Error", "No se pudo cargar la rutina");
        router.back();
      } finally {
        setLoading(false);
        console.log("[EditarRutina] Loading finalizado");
      }
    };

    cargarRutina();
  }, [id]);

  const guardarCambios = async () => {
    if (!rutina) {
      console.log("[EditarRutina] Intento de guardar sin rutina cargada");
      return;
    }

    if (!nombre.trim() || !descripcion.trim()) {
      console.log("[EditarRutina] Nombre o descripción vacíos");
      Alert.alert("Error", "Nombre y descripción son obligatorios");
      return;
    }

    try {
      const body: Rutina = {
        ID: rutina.ID,
        username: rutina.username,
        nombre,
        descripcion,
        ejercicios,
      };
      console.log("[EditarRutina] Enviando datos para guardar:", body);

      const res = await fetch("http://192.168.1.128:3000/api/rutinas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      console.log("[EditarRutina] Respuesta guardar:", res.status);

      if (!res.ok) throw new Error("Error al guardar rutina");

      Alert.alert("Éxito", "Rutina actualizada correctamente");
      router.push("/home/rutinas");
    } catch (error) {
      console.error("[EditarRutina] Error guardando rutina:", error);
      Alert.alert("Error", "No se pudo guardar la rutina");
    }
  };

  const agregarEjercicio = () => {
    setEjercicios((prev) => [
      ...prev,
      { nombre: "", peso: 0, repeticiones: 0, series: 0 },
    ]);
  };

  const actualizarEjercicio = (
    index: number,
    campo: keyof Ejercicio,
    valor: string
  ) => {
    const nuevos = [...ejercicios];
    if (campo === "peso" || campo === "repeticiones" || campo === "series") {
      nuevos[index][campo] = parseInt(valor) || 0;
    } else {
      nuevos[index][campo] = valor;
    }
    setEjercicios(nuevos);
  };

  const eliminarEjercicio = (index: number) => {
    const nuevos = [...ejercicios];
    nuevos.splice(index, 1);
    setEjercicios(nuevos);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <Text>Cargando rutina...</Text>
      </View>
    );
  }

  if (!rutina) {
    return (
      <View style={styles.center}>
        <Text>Rutina no encontrada</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.label}>Nombre</Text>
      <TextInput
        style={styles.input}
        value={nombre}
        onChangeText={setNombre}
        placeholder="Nombre de la rutina"
      />

      <Text style={styles.label}>Descripción</Text>
      <TextInput
        style={styles.input}
        value={descripcion}
        onChangeText={setDescripcion}
        placeholder="Descripción de la rutina"
      />

      <Text style={styles.label}>Ejercicios</Text>
      {ejercicios.map((ej, index) => (
        <View key={index} style={styles.ejercicioContainer}>
          <TextInput
            style={styles.input}
            value={ej.nombre}
            onChangeText={(text) => actualizarEjercicio(index, "nombre", text)}
            placeholder="Nombre del ejercicio"
          />
          <TextInput
            style={styles.input}
            value={ej.peso.toString()}
            onChangeText={(text) => actualizarEjercicio(index, "peso", text)}
            placeholder="Peso"
            keyboardType="numeric"
          />
          <TextInput
            style={styles.input}
            value={ej.repeticiones.toString()}
            onChangeText={(text) =>
              actualizarEjercicio(index, "repeticiones", text)
            }
            placeholder="Repeticiones"
            keyboardType="numeric"
          />
          <TextInput
            style={styles.input}
            value={ej.series.toString()}
            onChangeText={(text) => actualizarEjercicio(index, "series", text)}
            placeholder="Series"
            keyboardType="numeric"
          />
          <Button
            title="Eliminar ejercicio"
            color="#dc3545"
            onPress={() => eliminarEjercicio(index)}
          />
        </View>
      ))}

      <Button title="Agregar ejercicio" onPress={agregarEjercicio} />

      <View style={{ marginTop: 20 }}>
        <Button title="Guardar Cambios" onPress={guardarCambios} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: "#fff",
    flexGrow: 1,
  },
  label: {
    fontWeight: "bold",
    marginBottom: 6,
    fontSize: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginBottom: 12,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  ejercicioContainer: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    padding: 10,
    marginBottom: 12,
    backgroundColor: "#f9f9f9",
  },
});
