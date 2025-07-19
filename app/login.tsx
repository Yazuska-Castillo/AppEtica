import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Button,
  StyleSheet,
  Text,
  TextInput,
  View,
  useColorScheme,
} from "react-native";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();
  const colorScheme = useColorScheme();

  const handleLogin = () => {
    if (email === "" || password === "") {
      Alert.alert("Error", "Por favor completa todos los campos.");
      return;
    }

    fetch("http://192.168.1.128:3000/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || "Error en la autenticación");
        }
        return res.json();
      })
      .then(async (data) => {
        await AsyncStorage.setItem("user", JSON.stringify(data.user));

        Alert.alert("Bienvenido", `Hola ${data.user.name}`);

        // Comprobar si tiene configuración guardada
        const configResponse = await fetch(
          `http://192.168.1.128:3000/api/configuracion/${encodeURIComponent(
            data.user.name
          )}`
        );

        if (configResponse.ok) {
          // Si tiene configuración, va a alimentación
          router.replace("/home/rutinas");
        } else {
          // Si no, va a pantalla de configuración
          router.replace("/configuracion");
        }
      })
      .catch((err) => {
        Alert.alert("Error", err.message);
      });
  };

  const styles = getStyles(colorScheme ?? "light");

  return (
    <View style={styles.container}>
      <Text style={styles.title}>GYMPAL</Text>

      <TextInput
        style={styles.input}
        placeholder="Correo electrónico"
        placeholderTextColor={colorScheme === "dark" ? "#aaa" : "#555"}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        selectionColor={colorScheme === "dark" ? "#fff" : "#000"}
      />

      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        placeholderTextColor={colorScheme === "dark" ? "#aaa" : "#555"}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        selectionColor={colorScheme === "dark" ? "#fff" : "#000"}
      />

      <Button
        title="Iniciar Sesión"
        onPress={handleLogin}
        color={colorScheme === "dark" ? "#4CAF50" : "#388E3C"}
      />

      <View style={{ marginTop: 20 }}>
        <Button
          title="¿No tienes cuenta? Regístrate"
          onPress={() => router.push("/register")}
          color={colorScheme === "dark" ? "#2196F3" : "#1976D2"}
        />
      </View>
    </View>
  );
}

const getStyles = (colorScheme: "light" | "dark") =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colorScheme === "dark" ? "#1e1e1e" : "#fff",
      padding: 24,
      justifyContent: "center",
    },
    title: {
      fontSize: 28,
      fontWeight: "bold",
      marginBottom: 32,
      textAlign: "center",
      color: colorScheme === "dark" ? "#fff" : "#000",
    },
    input: {
      height: 50,
      borderColor: colorScheme === "dark" ? "#555" : "#aaa",
      borderWidth: 1,
      paddingHorizontal: 16,
      marginBottom: 16,
      borderRadius: 8,
      backgroundColor: colorScheme === "dark" ? "#2b2b2b" : "#f5f5f5",
      color: colorScheme === "dark" ? "#fff" : "#000",
    },
  });
