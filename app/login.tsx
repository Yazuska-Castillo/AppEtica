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
        // Guardar usuario en AsyncStorage
        await AsyncStorage.setItem("user", JSON.stringify(data.user));
        Alert.alert("Bienvenido", `Hola ${data.user.name}`);

        // Consultar configuración
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
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <Button title="Iniciar Sesión" onPress={handleLogin} />

      <View style={{ marginTop: 20 }}>
        <Button
          title="¿No tienes cuenta? Regístrate"
          onPress={() => router.push("/register")}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 24,
    justifyContent: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 32,
    textAlign: "center",
    color: "#2c3e50",
  },
  input: {
    height: 50,
    borderColor: "#ccc",
    borderWidth: 1,
    paddingHorizontal: 16,
    marginBottom: 16,
    borderRadius: 8,
    backgroundColor: "#f9f9f9",
  },
});
