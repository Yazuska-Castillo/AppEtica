import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, Button, StyleSheet, Text, TextInput, View } from "react-native";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

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
        const configResponse = await fetch(
          `http://192.168.1.128:3000/api/configuracion/${data.user.name}`
        );

        if (configResponse.ok) {
          // Si tiene configuración, ir directo a home
          router.replace("/home/alimentacion");
        } else {
          // Si no tiene configuración, ir a configurar
          router.replace("/configuracion");
        }
      })
      .catch((err) => {
        Alert.alert("Error", err.message);
      });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>GYMPAL</Text>

      <TextInput
        style={styles.input}
        placeholder="Correo electrónico"
        placeholderTextColor="#aaa"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        selectionColor="#fff"
      />

      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        placeholderTextColor="#aaa"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        selectionColor="#fff"
      />

      <Button title="Iniciar Sesión" onPress={handleLogin} color="#4CAF50" />

      <View style={{ marginTop: 20 }}>
        <Button
          title="¿No tienes cuenta? Regístrate"
          onPress={() => router.push("/register")}
          color="#2196F3"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1e1e1e", // fondo oscuro
    padding: 24,
    justifyContent: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 32,
    textAlign: "center",
    color: "#fff", // texto blanco para título
  },
  input: {
    height: 50,
    borderColor: "#555",
    borderWidth: 1,
    paddingHorizontal: 16,
    marginBottom: 16,
    borderRadius: 8,
    backgroundColor: "#2b2b2b", // input fondo oscuro
    color: "#fff", // texto blanco en input
  },
});
