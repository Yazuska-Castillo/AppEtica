import { MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
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

  useEffect(() => {
    const fetchObjetivoYRecomendaciones = async () => {
      try {
        // Obtener usuario almacenado
        const storedUser = await AsyncStorage.getItem("user");
        console.log("Usuario almacenado:", storedUser);
        if (!storedUser) throw new Error("Usuario no autenticado");

        const { name } = JSON.parse(storedUser);
        console.log("Nombre de usuario extraído:", name);

        // Traer configuración para obtener objetivo
        const resConfig = await fetch(
          `http://192.168.1.128:3000/api/configuracion/${name}`
        );
        console.log("Respuesta config status:", resConfig.status);
        if (!resConfig.ok) throw new Error("Error al obtener configuración");

        const configData = await resConfig.json();
        console.log("Datos configuración recibidos:", configData);
        console.log(
          "Objetivo para buscar recomendaciones:",
          configData.objetivo
        ); // <- ESTA LÍNEA NUEVA
        setObjetivo(configData.objetivo);

        setObjetivo(configData.objetivo);

        // Traer recomendaciones alimentación según objetivo
        const resAlim = await fetch(
          `http://192.168.1.128:3000/api/alimentacion/${encodeURIComponent(
            configData.objetivo
          )}`
        );
        console.log("Respuesta alimentación status:", resAlim.status);
        if (!resAlim.ok)
          throw new Error("No hay recomendaciones para este objetivo");

        const alimData: Recomendacion[] = await resAlim.json();
        console.log("Datos alimentación recibidos:", alimData);
        setRecomendaciones(alimData);
      } catch (error: any) {
        console.log("Error en fetchObjetivoYRecomendaciones:", error.message);
        Alert.alert("Error", error.message || "Error cargando datos");
        setRecomendaciones([]);
        setObjetivo(null);
      } finally {
        setLoading(false);
      }
    };

    fetchObjetivoYRecomendaciones();
  }, []);

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
          <Text style={styles.buttonText}>Ver registro completo</Text>
        </Pressable>
      </View>
    );
  }

  // Agrupar recomendaciones por categoría para mostrar bien
  const categorias = [...new Set(recomendaciones.map((r) => r.categoria))];

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
          <MaterialCommunityIcons
            name="crown-outline"
            size={24}
            color={colorScheme === "dark" ? "#fff" : "#000"}
          />
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
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
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
        Mantente bien hidratado y trata de comer en horarios regulares. Si
        necesitas más control nutricional, presiona la corona arriba a la
        derecha para acceder al registro completo de alimentos.
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
