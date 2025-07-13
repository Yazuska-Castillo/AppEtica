import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Button,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type ConfiguracionUsuario = {
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
  const [config, setConfig] = useState<ConfiguracionUsuario | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const storedUser = await AsyncStorage.getItem("user");
        if (!storedUser) {
          Alert.alert("Error", "Usuario no autenticado.");
          router.replace("/login");
          return;
        }

        const { name } = JSON.parse(storedUser);

        const res = await fetch(
          `http://192.168.1.128:3000/api/configuracion/${name}`
        );
        if (!res.ok) {
          throw new Error("No se pudo obtener la configuración");
        }

        const data = await res.json();
        setConfig(data);
      } catch (error) {
        Alert.alert("Error", "Error al cargar los datos del perfil.");
        console.error(error);
      } finally {
        setCargando(false);
      }
    };

    fetchConfig();
  }, []);

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
      <View style={styles.header}>
        <Text style={styles.title}>{config.username}</Text>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <ProfileItem label="🎯 Objetivo" value={config.objetivo} />
        <ProfileItem label="🎂 Edad" value={`${config.edad} años`} />
        <ProfileItem label="🚻 Sexo" value={config.sexo} />
        <ProfileItem label="📏 Altura" value={`${config.altura} cm`} />
        <ProfileItem label="⚖️ Peso" value={`${config.peso} kg`} />
        <ProfileItem label="💪 Nivel" value={config.experiencia} />
      </View>

      <View style={{ marginTop: 30 }}>
        <Button
          title="Editar configuración"
          color="#4CAF50"
          onPress={() => router.push("/configuracion")}
        />
      </View>
    </ScrollView>
  );
}

function ProfileItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.item}>
      <Text style={styles.itemLabel}>{label}</Text>
      <Text style={styles.itemValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#121212",
    flexGrow: 1,
  },
  centered: {
    flex: 1,
    backgroundColor: "#121212",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    color: "#bbb",
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
    color: "#fff",
  },
  logoutButton: {
    backgroundColor: "#f44336",
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 6,
  },
  logoutText: {
    color: "#fff",
    fontWeight: "600",
  },
  card: {
    backgroundColor: "#1e1e1e",
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
    borderBottomColor: "#333",
    borderBottomWidth: 1,
  },
  itemLabel: {
    color: "#aaa",
    fontWeight: "600",
    fontSize: 16,
  },
  itemValue: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
});
