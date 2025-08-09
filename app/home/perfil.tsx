import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Button,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";

type ConfiguracionUsuario = {
  userId: string;
  username: string;
  objetivo: string;
  edad: string;
  sexo: string;
  altura: string;
  peso: string;
  experiencia: string;
};

export default function Perfil() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const scheme = colorScheme ?? "light";
  const styles = getStyles(scheme);

  const [config, setConfig] = useState<ConfiguracionUsuario | null>(null);
  const [cargando, setCargando] = useState(true);

  useFocusEffect(
    useCallback(() => {
      const fetchConfig = async () => {
        try {
          const storedUser = await AsyncStorage.getItem("user");
          if (!storedUser) {
            Alert.alert("Error", "Usuario no autenticado.");
            router.replace("/login");
            return;
          }

          const user = JSON.parse(storedUser);
          const userId = user.id;
          const username = user.name;

          const res = await fetch(
            `http://192.168.1.139:3000/api/configuracion/${encodeURIComponent(
              userId
            )}`
          );
          if (!res.ok) {
            throw new Error("No se pudo obtener la configuración");
          }

          const data = await res.json();

          // Aseguramos que el objeto tenga el username y userId para mostrar
          setConfig({
            userId,
            username,
            objetivo: data.objetivo,
            edad: data.edad,
            sexo: data.sexo,
            altura: data.altura,
            peso: data.peso,
            experiencia: data.experiencia,
          });
        } catch (error) {
          Alert.alert("Error", "Error al cargar los datos del perfil.");
          console.error(error);
        } finally {
          setCargando(false);
        }
      };

      fetchConfig();
    }, [])
  );

  const handleLogout = async () => {
    await AsyncStorage.removeItem("user");
    router.replace("/login");
  };

  if (cargando) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Cargando configuración...</Text>
      </View>
    );
  }

  if (!config) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>
          No se encontró la configuración del usuario.
        </Text>
        <Button
          title="Ir a configurar"
          color="#4CAF50"
          onPress={() => router.replace("/configuracion")}
        />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Encabezado con nombre + botón editar info personal */}
      <View style={styles.header}>
        <Text style={styles.title}>{config.username}</Text>
        <TouchableOpacity
          onPress={() => router.push("/EditarInformacionPersonal")}
          style={styles.editButton}
        >
          <Text style={styles.editText}>✏️</Text>
        </TouchableOpacity>
      </View>

      {/* Información del usuario */}
      <View style={styles.card}>
        <ProfileItem
          label="🎯 Objetivo"
          value={config.objetivo}
          styles={styles}
        />
        <ProfileItem
          label="🎂 Edad"
          value={`${config.edad} años`}
          styles={styles}
        />
        <ProfileItem label="🚻 Sexo" value={config.sexo} styles={styles} />
        <ProfileItem
          label="📏 Altura"
          value={`${config.altura} cm`}
          styles={styles}
        />
        <ProfileItem
          label="⚖️ Peso"
          value={`${config.peso} kg`}
          styles={styles}
        />
        <ProfileItem
          label="💪 Nivel"
          value={config.experiencia}
          styles={styles}
        />
      </View>

      {/* Botón para editar configuración */}
      <View style={{ marginTop: 30 }}>
        <Button
          title="Editar configuración"
          color="#4CAF50"
          onPress={() => router.push("/configuracion")}
        />
      </View>

      {/* Botón cerrar sesión abajo */}
      <View style={styles.logoutContainer}>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function ProfileItem({
  label,
  value,
  styles,
}: {
  label: string;
  value: string;
  styles: ReturnType<typeof getStyles>;
}) {
  return (
    <View style={styles.item}>
      <Text style={styles.itemLabel}>{label}</Text>
      <Text style={styles.itemValue}>{value}</Text>
    </View>
  );
}

const getStyles = (colorScheme: "light" | "dark" | null) =>
  StyleSheet.create({
    container: {
      padding: 20,
      backgroundColor: colorScheme === "dark" ? "#121212" : "#fff",
      flexGrow: 1,
    },
    centered: {
      flex: 1,
      backgroundColor: colorScheme === "dark" ? "#121212" : "#fff",
      justifyContent: "center",
      alignItems: "center",
      padding: 20,
    },
    loadingText: {
      marginTop: 10,
      color: colorScheme === "dark" ? "#bbb" : "#555",
      fontSize: 16,
    },
    errorText: {
      fontSize: 18,
      marginBottom: 20,
      color: "#f44336",
      textAlign: "center",
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 30,
    },
    title: {
      fontSize: 28,
      fontWeight: "bold",
      color: colorScheme === "dark" ? "#fff" : "#000",
    },
    editButton: {
      backgroundColor: "#4CAF50",
      padding: 8,
      borderRadius: 6,
    },
    editText: {
      color: "#fff",
      fontSize: 16,
    },
    card: {
      backgroundColor: colorScheme === "dark" ? "#1e1e1e" : "#f5f5f5",
      borderRadius: 12,
      padding: 20,
      elevation: 5,
      shadowColor: "#000",
      shadowOpacity: 0.3,
      shadowRadius: 5,
    },
    item: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: 12,
      borderBottomColor: colorScheme === "dark" ? "#333" : "#ccc",
      borderBottomWidth: 1,
    },
    itemLabel: {
      color: colorScheme === "dark" ? "#aaa" : "#666",
      fontWeight: "600",
      fontSize: 16,
    },
    itemValue: {
      color: colorScheme === "dark" ? "#fff" : "#000",
      fontWeight: "600",
      fontSize: 16,
    },
    logoutContainer: {
      marginTop: 60,
      alignItems: "center",
    },
    logoutButton: {
      marginTop: 20,
      backgroundColor: "#f44336",
      paddingVertical: 10,
      paddingHorizontal: 30,
      borderRadius: 8,
    },
    logoutText: {
      color: "#fff",
      fontWeight: "600",
      fontSize: 16,
    },
  });
