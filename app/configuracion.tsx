import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Button,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  View,
} from "react-native";
import DropDownPicker from "react-native-dropdown-picker";

export default function Configuracion() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const darkMode = colorScheme === "dark";
  const styles = getStyles(darkMode);

  // Ahora guardamos el user completo (objeto con id, name, email)
  const [user, setUser] = useState<{
    id: string;
    name: string;
    email: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  // Dropdown states (igual que antes)
  const [openObjetivo, setOpenObjetivo] = useState(false);
  const [objetivo, setObjetivo] = useState("ganar masa muscular");
  const objetivos = [
    { label: "Ganar masa muscular", value: "ganar masa muscular" },
    { label: "Tonificar", value: "tonificar" },
    { label: "Bajar de peso", value: "bajar de peso" },
  ];

  const [openSexo, setOpenSexo] = useState(false);
  const [sexo, setSexo] = useState("masculino");
  const sexos = [
    { label: "Masculino", value: "masculino" },
    { label: "Femenino", value: "femenino" },
  ];

  const [openExperiencia, setOpenExperiencia] = useState(false);
  const [experiencia, setExperiencia] = useState("principiante");
  const experiencias = [
    { label: "Principiante", value: "principiante" },
    { label: "Intermedio", value: "intermedio" },
    { label: "Avanzado", value: "avanzado" },
  ];

  // Otros campos
  const [edad, setEdad] = useState("");
  const [altura, setAltura] = useState("");
  const [peso, setPeso] = useState("");

  // Control dropdowns para que solo uno esté abierto
  const onOpenObjetivo = () => {
    setOpenSexo(false);
    setOpenExperiencia(false);
  };
  const onOpenSexo = () => {
    setOpenObjetivo(false);
    setOpenExperiencia(false);
  };
  const onOpenExperiencia = () => {
    setOpenObjetivo(false);
    setOpenSexo(false);
  };

  useEffect(() => {
    AsyncStorage.getItem("user")
      .then((json) => {
        if (!json) {
          Alert.alert(
            "Error",
            "No se encontró información del usuario. Por favor inicia sesión."
          );
          router.replace("/login");
          return;
        }
        const userObj = JSON.parse(json);
        if (!userObj || !userObj.id) {
          Alert.alert(
            "Error",
            "No se pudo obtener la información del usuario. Por favor inicia sesión de nuevo."
          );
          router.replace("/login");
          return;
        }
        setUser(userObj);

        fetch(
          `http://192.168.1.139:3000/api/configuracion/${encodeURIComponent(
            userObj.id
          )}`
        )
          .then(async (res) => {
            if (res.ok) {
              const data = await res.json();
              setObjetivo(data.objetivo || "ganar masa muscular");
              setEdad(data.edad || "");
              setSexo(data.sexo || "masculino");
              setAltura(data.altura || "");
              setPeso(data.peso || "");
              setExperiencia(data.experiencia || "principiante");
            }
          })
          .catch((err) => {
            console.error("Error cargando configuración:", err);
            Alert.alert("Error", "No se pudo cargar la configuración.");
          })
          .finally(() => setLoading(false));
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

    if (!user) {
      Alert.alert(
        "Error",
        "No se pudo obtener la información del usuario. Por favor inicia sesión de nuevo."
      );
      router.replace("/login");
      return;
    }

    try {
      const response = await fetch(
        "http://192.168.1.139:3000/api/configuracion",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user.id,
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

  if (loading) {
    return (
      <View
        style={[
          styles.container,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <ActivityIndicator size="large" color={darkMode ? "#fff" : "#000"} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.container}
    >
      <Text style={styles.title}>Configuración Inicial</Text>

      <Text style={styles.label}>Objetivo físico</Text>
      <DropDownPicker
        open={openObjetivo}
        value={objetivo}
        items={objetivos}
        setOpen={setOpenObjetivo}
        setValue={setObjetivo}
        setItems={() => {}}
        onOpen={onOpenObjetivo}
        style={styles.dropdown}
        dropDownContainerStyle={styles.dropDownContainer}
        placeholder="Selecciona un objetivo"
        textStyle={styles.dropdownText}
        listMode="SCROLLVIEW"
        dropDownDirection="AUTO"
      />

      <Text style={styles.label}>Edad</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={edad}
        onChangeText={setEdad}
        placeholder="Ej: 25"
        placeholderTextColor={darkMode ? "#888" : "#aaa"}
      />

      <Text style={styles.label}>Sexo</Text>
      <DropDownPicker
        open={openSexo}
        value={sexo}
        items={sexos}
        setOpen={setOpenSexo}
        setValue={setSexo}
        setItems={() => {}}
        onOpen={onOpenSexo}
        style={styles.dropdown}
        dropDownContainerStyle={styles.dropDownContainer}
        placeholder="Selecciona sexo"
        textStyle={styles.dropdownText}
        listMode="SCROLLVIEW"
        dropDownDirection="AUTO"
      />

      <Text style={styles.label}>Altura (cm)</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={altura}
        onChangeText={setAltura}
        placeholder="Ej: 170"
        placeholderTextColor={darkMode ? "#888" : "#aaa"}
      />

      <Text style={styles.label}>Peso (kg)</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={peso}
        onChangeText={setPeso}
        placeholder="Ej: 70"
        placeholderTextColor={darkMode ? "#888" : "#aaa"}
      />

      <Text style={styles.label}>Nivel de experiencia</Text>
      <DropDownPicker
        open={openExperiencia}
        value={experiencia}
        items={experiencias}
        setOpen={setOpenExperiencia}
        setValue={setExperiencia}
        setItems={() => {}}
        onOpen={onOpenExperiencia}
        style={styles.dropdown}
        dropDownContainerStyle={styles.dropDownContainer}
        placeholder="Selecciona nivel"
        textStyle={styles.dropdownText}
        listMode="SCROLLVIEW"
        dropDownDirection="AUTO"
      />

      <View style={{ marginTop: 20 }}>
        <Button
          title="Guardar y continuar"
          onPress={handleGuardar}
          color={darkMode ? "#1e90ff" : undefined}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const getStyles = (darkMode: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      padding: 20,
      backgroundColor: darkMode ? "#121212" : "#fff",
    },
    title: {
      fontSize: 24,
      fontWeight: "bold",
      marginBottom: 20,
      color: darkMode ? "#fff" : "#000",
    },
    label: {
      fontWeight: "600",
      marginTop: 10,
      marginBottom: 4,
      color: darkMode ? "#ccc" : "#333",
    },
    input: {
      borderColor: darkMode ? "#555" : "#999",
      borderWidth: 1,
      borderRadius: 6,
      padding: 8,
      color: darkMode ? "#fff" : "#000",
      backgroundColor: darkMode ? "#2b2b2b" : "#f9f9f9",
      marginBottom: 10,
    },
    dropdown: {
      borderColor: darkMode ? "#555" : "#999",
      backgroundColor: darkMode ? "#2b2b2b" : "#f9f9f9",
      marginBottom: 10,
    },
    dropDownContainer: {
      borderColor: darkMode ? "#555" : "#999",
      backgroundColor: darkMode ? "#2b2b2b" : "#f9f9f9",
    },
    dropdownText: {
      color: darkMode ? "#fff" : "#000",
      fontSize: 16,
    },
  });