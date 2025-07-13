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

export default function RegisterScreen() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleRegister = async () => {
    if (!username || !email || !password || !confirmPassword) {
      Alert.alert("Error", "Por favor completa todos los campos.");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Las contraseñas no coinciden.");
      return;
    }

    try {
      const response = await fetch("http://192.168.1.128:3000/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert("Registro exitoso", data.message);
        router.replace("/login");
      } else {
        Alert.alert("Error", data.message || "Algo salió mal");
      }
    } catch (error) {
      Alert.alert("Error", "No se pudo conectar con el servidor");
      console.error(error);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Crear Cuenta</Text>

      <View style={styles.field}>
        <Text style={styles.label}>Nombre de usuario</Text>
        <TextInput
          style={styles.input}
          placeholder="Ej: juan_perez"
          placeholderTextColor="#888"
          value={username}
          onChangeText={setUsername}
          selectionColor="#fff"
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Correo electrónico</Text>
        <TextInput
          style={styles.input}
          placeholder="Ej: ejemplo@correo.com"
          placeholderTextColor="#888"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          selectionColor="#fff"
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Contraseña</Text>
        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.inputPassword}
            placeholder="Ej: ********"
            placeholderTextColor="#888"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            selectionColor="#fff"
          />
          <Pressable onPress={() => setShowPassword(!showPassword)}>
            <Text style={styles.toggle}>
              {showPassword ? "Ocultar" : "Ver"}
            </Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Confirmar contraseña</Text>
        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.inputPassword}
            placeholder="Repite tu contraseña"
            placeholderTextColor="#888"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showConfirm}
            selectionColor="#fff"
          />
          <Pressable onPress={() => setShowConfirm(!showConfirm)}>
            <Text style={styles.toggle}>{showConfirm ? "Ocultar" : "Ver"}</Text>
          </Pressable>
        </View>
      </View>

      <Button title="Registrarse" onPress={handleRegister} color="#4CAF50" />

      <View style={{ marginTop: 20 }}>
        <Button
          title="¿Ya tienes cuenta? Inicia sesión"
          onPress={() => router.push("/login")}
          color="#2196F3"
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
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
  field: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 6,
    fontSize: 16,
    fontWeight: "500",
    color: "#ddd", // gris claro para etiquetas
  },
  input: {
    height: 50,
    borderColor: "#555",
    borderWidth: 1,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: "#2b2b2b", // fondo oscuro inputs
    color: "#fff", // texto blanco inputs
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderColor: "#555",
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: "#2b2b2b",
    paddingRight: 10,
  },
  inputPassword: {
    flex: 1,
    height: 50,
    paddingHorizontal: 16,
    color: "#fff", // texto blanco input password
  },
  toggle: {
    color: "#4CAF50", // verde para toggle ver/ocultar
    fontWeight: "600",
  },
});
