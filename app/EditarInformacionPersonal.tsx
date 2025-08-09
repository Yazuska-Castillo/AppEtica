import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useRouter } from "expo-router";
import {
  default as React,
  useCallback,
  useLayoutEffect,
  useState,
} from "react";
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

export default function EditarInformacionPersonal() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const navigation = useNavigation();
  const scheme = colorScheme ?? "light";
  const styles = getStyles(scheme);

  // Estados para el usuario y carga
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      const fetchUsuario = async () => {
        try {
          setLoading(true);
          const storedUser = await AsyncStorage.getItem("user");
          if (!storedUser) {
            Alert.alert("Error", "Usuario no autenticado.");
            router.replace("/login");
            return;
          }

          const user = JSON.parse(storedUser);
          setUserId(user.id); // Guardar userId para futuras peticiones

          const res = await fetch(
            `http://192.168.1.128:3000/api/usuario/${encodeURIComponent(
              user.id
            )}`
          );
          if (!res.ok) {
            throw new Error("No se pudo obtener los datos del usuario");
          }

          const usuarioData = await res.json();

          // Setea los datos en los estados para mostrar en inputs
          setUsername(usuarioData.username || "");
          setEmail(usuarioData.email || "");
        } catch (error) {
          Alert.alert("Error", "Error al cargar los datos del usuario.");
          console.error(error);
        } finally {
          setLoading(false);
        }
      };

      fetchUsuario();
    }, [router])
  );

  const handleUpdate = async () => {
    if (!username || !email) {
      Alert.alert("Error", "Nombre de usuario y correo son obligatorios.");
      return;
    }

    if (password && password !== confirmPassword) {
      Alert.alert("Error", "Las contraseñas no coinciden.");
      return;
    }

    if (!userId) {
      Alert.alert("Error", "No se pudo obtener el ID del usuario.");
      router.replace("/login");
      return;
    }

    try {
      const response = await fetch(
        "http://192.168.1.128:3000/api/actualizar-usuario",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId, // Enviar userId en vez de oldUsername
            newUsername: username,
            email,
            password,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        // Actualizar AsyncStorage con nuevos datos
        const storedUser = await AsyncStorage.getItem("user");
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          const updatedUser = {
            ...parsedUser,
            name: username,
            username,
            email,
          };
          await AsyncStorage.setItem("user", JSON.stringify(updatedUser));
        }
        Alert.alert("Éxito", "Información actualizada correctamente.");
        router.back();
      } else {
        Alert.alert("Error", data.message || "Algo salió mal.");
      }
    } catch (error) {
      console.error("Error actualizando usuario:", error);
      Alert.alert("Error", "No se pudo conectar con el servidor.");
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
        <Text style={{ color: scheme === "dark" ? "#fff" : "#000" }}>
          Cargando...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Editar Información Personal</Text>

      <View style={styles.field}>
        <Text style={styles.label}>Nombre de usuario</Text>
        <TextInput
          style={styles.input}
          value={username}
          onChangeText={setUsername}
          placeholder="Ej: juan_perez"
          placeholderTextColor={scheme === "dark" ? "#888" : "#555"}
          selectionColor={scheme === "dark" ? "#fff" : "#000"}
          autoCapitalize="none"
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Correo electrónico</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholder="Ej: ejemplo@correo.com"
          placeholderTextColor={scheme === "dark" ? "#888" : "#555"}
          selectionColor={scheme === "dark" ? "#fff" : "#000"}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Nueva contraseña (opcional)</Text>
        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.inputPassword}
            value={password}
            onChangeText={setPassword}
            placeholder="********"
            secureTextEntry={!showPassword}
            placeholderTextColor={scheme === "dark" ? "#888" : "#555"}
            selectionColor={scheme === "dark" ? "#fff" : "#000"}
          />
          <Pressable onPress={() => setShowPassword(!showPassword)}>
            <Text style={styles.toggle}>
              {showPassword ? "Ocultar" : "Ver"}
            </Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Confirmar nueva contraseña</Text>
        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.inputPassword}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Repite tu contraseña"
            secureTextEntry={!showConfirm}
            placeholderTextColor={scheme === "dark" ? "#888" : "#555"}
            selectionColor={scheme === "dark" ? "#fff" : "#000"}
          />
          <Pressable onPress={() => setShowConfirm(!showConfirm)}>
            <Text style={styles.toggle}>{showConfirm ? "Ocultar" : "Ver"}</Text>
          </Pressable>
        </View>
      </View>

      <Button
        title="Guardar cambios"
        onPress={handleUpdate}
        color={scheme === "dark" ? "#4CAF50" : "#388E3C"}
      />
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
      fontSize: 26,
      fontWeight: "bold",
      marginBottom: 28,
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
