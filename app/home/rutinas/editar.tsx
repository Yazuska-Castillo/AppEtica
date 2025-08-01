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
  useColorScheme,
} from "react-native";

type Ejercicio = {
  nombre: string;
  peso: number;
  repeticiones: number;
  series: number;
};

type Rutina = {
  ID: string;
  userId: string;
  nombre: string;
  descripcion: string;
  ejercicios: Ejercicio[];
};

export default function EditarRutina() {
  const router = useRouter();
  const navigation = useNavigation();
  const { id } = useLocalSearchParams();

  const colorScheme = useColorScheme();
  const styles = getStyles(colorScheme === "dark" ? "dark" : "light");

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
      Alert.alert("Error", "ID de rutina no válido.");
      router.back();
      return;
    }

    const cargarRutina = async () => {
      try {
        setLoading(true);
        const res = await fetch(`http://192.168.1.128:3000/api/rutina/${id}`);
        if (!res.ok) throw new Error("No se pudo cargar la rutina");
        const data: Rutina = await res.json();

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
        userId: rutina.userId, // Cambiado de username a userId
        nombre,
        descripcion,
        ejercicios,
      };

      const res = await fetch("http://192.168.1.128:3000/api/rutinas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

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
        <Text style={styles.label}>Cargando rutina...</Text>
      </View>
    );
  }

  if (!rutina) {
    return (
      <View style={styles.center}>
        <Text style={styles.label}>Rutina no encontrada</Text>
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
        placeholderTextColor={colorScheme === "dark" ? "#aaa" : "#888"}
      />

      <Text style={styles.label}>Descripción</Text>
      <TextInput
        style={styles.input}
        value={descripcion}
        onChangeText={setDescripcion}
        placeholder="Descripción de la rutina"
        placeholderTextColor={colorScheme === "dark" ? "#aaa" : "#888"}
      />

      <Text style={styles.label}>Ejercicios</Text>
      {ejercicios.map((ej, index) => (
        <View key={index} style={styles.ejercicioContainer}>
          <TextInput
            style={styles.input}
            value={ej.nombre}
            onChangeText={(text) => actualizarEjercicio(index, "nombre", text)}
            placeholder="Nombre del ejercicio"
            placeholderTextColor={colorScheme === "dark" ? "#aaa" : "#888"}
          />

          <Text style={styles.labelPeque}>Peso (kg)</Text>
          <TextInput
            style={styles.input}
            value={ej.peso.toString()}
            onChangeText={(text) => actualizarEjercicio(index, "peso", text)}
            placeholder="Peso"
            keyboardType="numeric"
            placeholderTextColor={colorScheme === "dark" ? "#aaa" : "#888"}
          />

          <Text style={styles.labelPeque}>Repeticiones</Text>
          <TextInput
            style={styles.input}
            value={ej.repeticiones.toString()}
            onChangeText={(text) =>
              actualizarEjercicio(index, "repeticiones", text)
            }
            placeholder="Repeticiones"
            keyboardType="numeric"
            placeholderTextColor={colorScheme === "dark" ? "#aaa" : "#888"}
          />

          <Text style={styles.labelPeque}>Series</Text>
          <TextInput
            style={styles.input}
            value={ej.series.toString()}
            onChangeText={(text) => actualizarEjercicio(index, "series", text)}
            placeholder="Series"
            keyboardType="numeric"
            placeholderTextColor={colorScheme === "dark" ? "#aaa" : "#888"}
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

const getStyles = (theme: "light" | "dark") =>
  StyleSheet.create({
    container: {
      padding: 16,
      backgroundColor: theme === "dark" ? "#121212" : "#fff",
      flexGrow: 1,
    },
    label: {
      fontWeight: "bold",
      marginBottom: 6,
      fontSize: 16,
      color: theme === "dark" ? "#fff" : "#000",
    },
    labelPeque: {
      fontSize: 12,
      color: theme === "dark" ? "#ccc" : "#555",
      marginBottom: 4,
      marginLeft: 4,
      fontWeight: "600",
    },
    input: {
      borderWidth: 1,
      borderColor: theme === "dark" ? "#555" : "#ccc",
      backgroundColor: theme === "dark" ? "#1e1e1e" : "#fff",
      color: theme === "dark" ? "#fff" : "#000",
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 6,
      marginBottom: 12,
    },
    center: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: theme === "dark" ? "#121212" : "#fff",
    },
    ejercicioContainer: {
      borderWidth: 1,
      borderColor: theme === "dark" ? "#555" : "#ccc",
      borderRadius: 6,
      padding: 10,
      marginBottom: 12,
      backgroundColor: theme === "dark" ? "#1e1e1e" : "#f9f9f9",
    },
  });
