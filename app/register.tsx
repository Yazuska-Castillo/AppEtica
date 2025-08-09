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
  useColorScheme,
  View,
} from "react-native";

export default function RegisterScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();

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

  const scheme = colorScheme ?? "light";
  const styles = getStyles(scheme);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Crear Cuenta</Text>

      <View style={styles.field}>
        <Text style={styles.label}>Nombre de usuario</Text>
        <TextInput
          style={styles.input}
          placeholder="Ej: juan_perez"
          placeholderTextColor={colorScheme === "dark" ? "#888" : "#555"}
          value={username}
          onChangeText={setUsername}
          selectionColor={colorScheme === "dark" ? "#fff" : "#000"}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Correo electrónico</Text>
        <TextInput
          style={styles.input}
          placeholder="Ej: ejemplo@correo.com"
          placeholderTextColor={colorScheme === "dark" ? "#888" : "#555"}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          selectionColor={colorScheme === "dark" ? "#fff" : "#000"}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Contraseña</Text>
        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.inputPassword}
            placeholder="Ej: ********"
            placeholderTextColor={colorScheme === "dark" ? "#888" : "#555"}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            selectionColor={colorScheme === "dark" ? "#fff" : "#000"}
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
            placeholderTextColor={colorScheme === "dark" ? "#888" : "#555"}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showConfirm}
            selectionColor={colorScheme === "dark" ? "#fff" : "#000"}
          />
          <Pressable onPress={() => setShowConfirm(!showConfirm)}>
            <Text style={styles.toggle}>{showConfirm ? "Ocultar" : "Ver"}</Text>
          </Pressable>
        </View>
      </View>

      <Button
        title="Registrarse"
        onPress={handleRegister}
        color={colorScheme === "dark" ? "#4CAF50" : "#388E3C"}
      />

      <View style={{ marginTop: 20 }}>
        <Button
          title="¿Ya tienes cuenta? Inicia sesión"
          onPress={() => router.push("/login")}
          color={colorScheme === "dark" ? "#2196F3" : "#1976D2"}
        />
      </View>
    </ScrollView>
  );
}

const getStyles = (colorScheme: "light" | "dark" | null) =>
  StyleSheet.create({
    container: {
      flexGrow: 1,
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
    field: {
      marginBottom: 16,
    },
    label: {
      marginBottom: 6,
      fontSize: 16,
      fontWeight: "500",
      color: colorScheme === "dark" ? "#ddd" : "#333",
    },
    input: {
      height: 50,
      borderColor: colorScheme === "dark" ? "#555" : "#aaa",
      borderWidth: 1,
      paddingHorizontal: 16,
      borderRadius: 8,
      backgroundColor: colorScheme === "dark" ? "#2b2b2b" : "#f5f5f5",
      color: colorScheme === "dark" ? "#fff" : "#000",
    },
    passwordContainer: {
      flexDirection: "row",
      alignItems: "center",
      borderColor: colorScheme === "dark" ? "#555" : "#aaa",
      borderWidth: 1,
      borderRadius: 8,
      backgroundColor: colorScheme === "dark" ? "#2b2b2b" : "#f5f5f5",
      paddingRight: 10,
    },
    inputPassword: {
      flex: 1,
      height: 50,
      paddingHorizontal: 16,
      color: colorScheme === "dark" ? "#fff" : "#000",
    },
    toggle: {
      color: "#4CAF50",
      fontWeight: "600",
    },
  });
