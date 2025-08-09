import AsyncStorage from "@react-native-async-storage/async-storage"; // ✅ ESTA LÍNEA
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";


type Recomendacion = {
  objetivo: string;
  categoria: string;
  alimento: string;
  porcion: string;
  gramos: number;
  calorias: number;
};

export default function Alimentacion() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const [objetivo, setObjetivo] = useState<string | null>(null);
  const [recomendaciones, setRecomendaciones] = useState<Recomendacion[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      const fetchDatos = async () => {
        setLoading(true);
        try {
          const storedUser = await AsyncStorage.getItem("user");
          if (!storedUser) {
            Alert.alert("Error", "Usuario no autenticado.");
            router.replace("/login");
            return;
          }
          const user = JSON.parse(storedUser);
          const userId = user.id;

          const resConfig = await fetch(
            `http://192.168.1.139:3000/api/configuracion/${encodeURIComponent(
              userId
            )}`
          );
          if (!resConfig.ok)
            throw new Error("No se pudo obtener la configuración");

          const configData = await resConfig.json();
          setObjetivo(configData.objetivo);

          const resAlim = await fetch(
            `http://192.168.1.139:3000/api/alimentacion/${encodeURIComponent(
              configData.objetivo
            )}`
          );
          if (!resAlim.ok)
            throw new Error("No hay recomendaciones para este objetivo");

          const alimData: Recomendacion[] = await resAlim.json();
          setRecomendaciones(alimData);
        } catch (error: any) {
          console.error("Error en fetchDatos:", error.message);
          Alert.alert("Error", error.message || "Error al cargar datos.");
          setRecomendaciones([]);
          setObjetivo(null);
        } finally {
          setLoading(false);
        }
      };

      fetchDatos();
    }, [router])
  );

  const handleGoToFullTracking = () => {
    router.push("/home/alimentacion/completa");
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Cargando plan alimentario...</Text>
      </View>
    );
  }

  if (!objetivo || recomendaciones.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>
          No se encontraron recomendaciones para tu objetivo.
        </Text>
        <Pressable onPress={handleGoToFullTracking} style={styles.button}>
          <Text style={styles.buttonText}>Consumo diario</Text>
        </Pressable>
      </View>
    );
  }

  const categorias = [...new Set(recomendaciones.map((r) => r.categoria))];

  const totalPorCategoria = (categoria: string) =>
    recomendaciones
      .filter((r) => r.categoria === categoria)
      .reduce((sum, r) => sum + r.gramos, 0);

  return (
    <ScrollView
      style={[
        styles.container,
        { backgroundColor: colorScheme === "dark" ? "#121212" : "#fff" },
      ]}
    >
      <View style={styles.header}>
        <Text
          style={[
            styles.title,
            { color: colorScheme === "dark" ? "#fff" : "#000" },
          ]}
        >
          Plan alimentario recomendado
        </Text>
        <Pressable onPress={handleGoToFullTracking}>
          <Text
            style={{
              color: colorScheme === "dark" ? "#fff" : "#000",
              fontWeight: "600",
            }}
          >
            Consumo diario
          </Text>
        </Pressable>
      </View>

      <Text
        style={[
          styles.text,
          { color: colorScheme === "dark" ? "#ddd" : "#444" },
        ]}
      >
        Según tu objetivo de <Text style={styles.bold}>{objetivo}</Text>, te
        recomendamos:
      </Text>

      {categorias.map((cat) => (
        <View key={cat} style={styles.categorySection}>
          <Text
            style={[
              styles.categoryTitle,
              { color: colorScheme === "dark" ? "#fff" : "#000" },
            ]}
          >
            {cat.charAt(0).toUpperCase() + cat.slice(1)}:{" "}
            {totalPorCategoria(cat).toFixed(0)}g sugeridos
          </Text>
          {recomendaciones
            .filter((r) => r.categoria === cat)
            .map((item, idx) => (
              <Text
                key={idx}
                style={[
                  styles.bullet,
                  { color: colorScheme === "dark" ? "#ccc" : "#444" },
                ]}
              >
                • {item.alimento} — {item.porcion} ({item.gramos}g,{" "}
                {item.calorias} kcal)
              </Text>
            ))}
        </View>
      ))}

      <Text
        style={[
          styles.text,
          { color: colorScheme === "dark" ? "#ddd" : "#444" },
        ]}
      >
        Mantente bien hidratado y trata de comer en horarios regulares.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
  },
  text: {
    fontSize: 16,
    marginBottom: 12,
  },
  bold: {
    fontWeight: "bold",
  },
  bullet: {
    fontSize: 16,
    marginLeft: 10,
    marginBottom: 6,
  },
  categorySection: {
    marginBottom: 16,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 6,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#4CAF50",
  },
  errorText: {
    fontSize: 18,
    color: "#f44336",
    textAlign: "center",
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#4CAF50",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
  },
});
