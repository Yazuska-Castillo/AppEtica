import AsyncStorage from "@react-native-async-storage/async-storage";
import { Picker } from "@react-native-picker/picker";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Button,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
} from "react-native";

export default function Configuracion() {
  const router = useRouter();

  const [username, setUsername] = useState<string | null>(null);

  const [objetivo, setObjetivo] = useState("ganar masa muscular");
  const [edad, setEdad] = useState("");
  const [sexo, setSexo] = useState("masculino");
  const [altura, setAltura] = useState("");
  const [peso, setPeso] = useState("");
  const [experiencia, setExperiencia] = useState("principiante");

  useEffect(() => {
    // Obtener usuario guardado al montar el componente
    AsyncStorage.getItem("user")
      .then((json) => {
        if (json) {
          const user = JSON.parse(json);
          setUsername(user.name || user.email || null);
        } else {
          Alert.alert(
            "Error",
            "No se encontró información del usuario. Por favor inicia sesión."
          );
          router.replace("/login");
        }
      })
      .catch((error) => {
        console.error("Error leyendo usuario de AsyncStorage:", error);
        Alert.alert(
          "Error",
          "Ocurrió un problema al obtener la información del usuario."
        );
        router.replace("/login");
      });
  }, []);

  const handleGuardar = async () => {
    if (!edad || !altura || !peso) {
      Alert.alert("Error", "Por favor completa todos los campos numéricos.");
      return;
    }

    if (!username) {
      Alert.alert(
        "Error",
        "No se pudo obtener el nombre de usuario. Por favor inicia sesión de nuevo."
      );
      router.replace("/login");
      return;
    }

    try {
      const response = await fetch(
        "http://192.168.1.128:3000/api/configuracion",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username,
            objetivo,
            edad,
            sexo,
            altura,
            peso,
            experiencia,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        Alert.alert("Éxito", data.message);
        router.replace("/home/alimentacion");
      } else {
        Alert.alert(
          "Error",
          data.message || "No se pudo guardar la configuración"
        );
      }
    } catch (error) {
      Alert.alert("Error", "No se pudo conectar con el servidor.");
      console.error(error);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Configuración Inicial</Text>

      <Text style={styles.label}>Objetivo físico</Text>
      <Picker selectedValue={objetivo} onValueChange={setObjetivo}>
        <Picker.Item label="Ganar masa muscular" value="ganar masa muscular" />
        <Picker.Item label="Tonificar" value="tonificar" />
        <Picker.Item label="Bajar de peso" value="bajar de peso" />
      </Picker>

      <Text style={styles.label}>Edad</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={edad}
        onChangeText={setEdad}
      />

      <Text style={styles.label}>Sexo</Text>
      <Picker selectedValue={sexo} onValueChange={setSexo}>
        <Picker.Item label="Masculino" value="masculino" />
        <Picker.Item label="Femenino" value="femenino" />
      </Picker>

      <Text style={styles.label}>Altura (cm)</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={altura}
        onChangeText={setAltura}
      />

      <Text style={styles.label}>Peso (kg)</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={peso}
        onChangeText={setPeso}
      />

      <Text style={styles.label}>Nivel de experiencia</Text>
      <Picker selectedValue={experiencia} onValueChange={setExperiencia}>
        <Picker.Item label="Principiante" value="principiante" />
        <Picker.Item label="Intermedio" value="intermedio" />
        <Picker.Item label="Avanzado" value="avanzado" />
      </Picker>

      <Button title="Guardar y continuar" onPress={handleGuardar} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#fff",
    flexGrow: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  label: {
    fontWeight: "600",
    marginTop: 10,
  },
  input: {
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 6,
    padding: 8,
    marginTop: 4,
  },
});
