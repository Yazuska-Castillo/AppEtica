import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useState } from "react";
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

type Rutina = {
  id: string;
  username: string;
  nombre: string;
  descripcion: string;
  ejercicios: {
    nombre: string;
    peso: number;
    repeticiones: number;
    series: number;
  }[];
};

export default function NuevaRutina() {
  const router = useRouter();

  const [nombreRutina, setNombreRutina] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [ejercicios, setEjercicios] = useState<Ejercicio[]>([
    { nombre: "", peso: "", repeticiones: "", series: "" },
  ]);

  type CampoEjercicio = keyof Ejercicio;

  const actualizarEjercicio = (
    index: number,
    campo: CampoEjercicio,
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
    const nuevos = ejercicios.filter((_, i) => i !== index);
    setEjercicios(nuevos);
  };

  const guardarRutina = async () => {
    if (!nombreRutina.trim()) {
      Alert.alert("Error", "El nombre de la rutina es obligatorio");
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

    // Generar ID único para la rutina:
    const idRutina = Date.now().toString();

    // Convertir strings a números para enviar
    const ejerciciosParseados = ejercicios.map((e) => ({
      nombre: e.nombre.trim(),
      peso: Number(e.peso),
      repeticiones: Number(e.repeticiones),
      series: Number(e.series),
    }));

    try {
      // Obtener usuario de AsyncStorage
      const userStr = await AsyncStorage.getItem("user");
      if (!userStr) {
        Alert.alert(
          "Error",
          "No se encontró usuario. Por favor inicia sesión."
        );
        router.replace("/login");
        return;
      }
      const user = JSON.parse(userStr);
      const username = user.name || user.email;
      if (!username) {
        Alert.alert("Error", "No se pudo obtener el nombre de usuario.");
        router.replace("/login");
        return;
      }

      const rutina: Rutina = {
        id: idRutina,
        username,
        nombre: nombreRutina.trim(),
        descripcion: descripcion.trim(),
        ejercicios: ejerciciosParseados,
      };

      const res = await fetch("http://192.168.1.128:3000/api/rutinas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(rutina),
      });
      if (!res.ok) throw new Error("Error guardando rutina");

      // Guardar localmente en AsyncStorage la rutina con ID
      const rutinasStr = await AsyncStorage.getItem("rutinas");
      let rutinas = rutinasStr ? JSON.parse(rutinasStr) : [];
      rutinas.push(rutina);
      await AsyncStorage.setItem("rutinas", JSON.stringify(rutinas));

      Alert.alert("Éxito", "Rutina creada correctamente");
      router.back();
    } catch (error) {
      Alert.alert("Error", "No se pudo guardar la rutina");
      console.error(error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.label}>Nombre de la rutina</Text>
      <TextInput
        style={styles.input}
        value={nombreRutina}
        onChangeText={setNombreRutina}
        placeholder="Nombre de la rutina"
      />

      <Text style={styles.label}>Descripción</Text>
      <TextInput
        style={[styles.input, { height: 80 }]}
        multiline
        value={descripcion}
        onChangeText={setDescripcion}
        placeholder="Descripción de la rutina (opcional)"
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

      <Button title="Guardar rutina" onPress={guardarRutina} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  label: {
    fontWeight: "bold",
    fontSize: 18,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#aaa",
    borderRadius: 6,
    padding: 8,
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
