import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation, useRouter } from "expo-router";
import React, { useLayoutEffect, useState } from "react";
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

export default function NuevaRutina() {
  const router = useRouter();

  // Estado con un ejercicio inicial obligatorio
  const [ejercicios, setEjercicios] = useState<Ejercicio[]>([
    { nombre: "", peso: 0, repeticiones: 0, series: 0 },
  ]);
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const navigation = useNavigation();

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  // Generar un ID único para la rutina
  const generarID = () => Math.floor(Date.now() * Math.random()).toString();

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
    if (ejercicios.length === 1) {
      Alert.alert("Error", "Debe haber al menos un ejercicio");
      return;
    }
    const nuevos = [...ejercicios];
    nuevos.splice(index, 1);
    setEjercicios(nuevos);
  };

  const guardarRutina = async () => {
    if (!nombre.trim() || !descripcion.trim()) {
      Alert.alert("Error", "Nombre y descripción son obligatorios");
      return;
    }

    // Validar que todos los ejercicios tengan nombre
    if (ejercicios.some((ej) => !ej.nombre.trim())) {
      Alert.alert("Error", "Todos los ejercicios deben tener un nombre");
      return;
    }

    try {
      const userString = await AsyncStorage.getItem("user");
      let username = "desconocido";
      if (userString) {
        const user = JSON.parse(userString);
        username = user.name || user.username || "desconocido";
      }

      const nuevaRutina = {
        ID: generarID(),
        username,
        nombre,
        descripcion,
        ejercicios,
      };

      const res = await fetch("http://192.168.1.128:3000/api/rutinas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nuevaRutina),
      });

      if (!res.ok) throw new Error("Error guardando rutina");

      Alert.alert("Éxito", "Rutina creada correctamente");
      router.push("/home/rutinas");
    } catch (error) {
      Alert.alert("Error", "No se pudo guardar la rutina");
      console.error(error);
    }
  };

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
        <Button title="Guardar Rutina" onPress={guardarRutina} />
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
  ejercicioContainer: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    padding: 10,
    marginBottom: 12,
    backgroundColor: "#f9f9f9",
  },
});
