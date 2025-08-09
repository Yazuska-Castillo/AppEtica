import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import React, { useEffect, useLayoutEffect, useState } from "react";
import {
  Alert,
  Button,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";

type Ejercicio = {
  nombre: string;
  peso: number;
  repeticiones: number;
  series: number;
};

type Rutina = {
  ID: string;
  userId: string;
  nombre: string;
  descripcion: string;
  ejercicios: Ejercicio[];
};

type ProgresoEjercicio = {
  completadas: number;
};

export default function ProgresoRutina() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const navigation = useNavigation();
  const colorScheme = useColorScheme();
  const theme = colorScheme === "dark" ? "dark" : "light";
  const styles = getStyles(theme);

  const [rutina, setRutina] = useState<Rutina | null>(null);
  const [progreso, setProgreso] = useState<Record<number, ProgresoEjercicio>>(
    {}
  );
  const [loading, setLoading] = useState(true);

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: true });
  }, [navigation]);

  useEffect(() => {
    if (!id || typeof id !== "string") {
      Alert.alert("Error", "ID de rutina no válido");
      router.back();
      return;
    }

    async function cargarRutina() {
      try {
        setLoading(true);
        const res = await fetch(`http://192.168.1.128:3000/api/rutina/${id}`);
        if (!res.ok) throw new Error("No se pudo cargar la rutina");
        const data: Rutina = await res.json();
        setRutina(data);

        const initialProgreso: Record<number, ProgresoEjercicio> = {};
        data.ejercicios.forEach((_, i) => {
          initialProgreso[i] = { completadas: 0 };
        });
        setProgreso(initialProgreso);
      } catch (error) {
        Alert.alert("Error", "No se pudo cargar la rutina");
        router.back();
      } finally {
        setLoading(false);
      }
    }

    cargarRutina();
  }, [id]);

  const incrementarSerie = (index: number) => {
    if (!rutina) return;
    setProgreso((prev) => {
      const actual = prev[index]?.completadas || 0;
      if (actual >= rutina.ejercicios[index].series) return prev;
      return { ...prev, [index]: { completadas: actual + 1 } };
    });
  };

  const decrementarSerie = (index: number) => {
    setProgreso((prev) => {
      const actual = prev[index]?.completadas || 0;
      if (actual <= 0) return prev;
      return { ...prev, [index]: { completadas: actual - 1 } };
    });
  };

  const guardarProgreso = () => {
    Alert.alert("Progreso guardado", "Has guardado tu progreso correctamente");
    router.back();
  };

  const totalSeries = rutina
    ? rutina.ejercicios.reduce((acc, ej) => acc + ej.series, 0)
    : 0;

  const seriesCompletadas = Object.values(progreso).reduce(
    (acc, p) => acc + (p.completadas || 0),
    0
  );

  const progresoGeneral = totalSeries > 0 ? seriesCompletadas / totalSeries : 0;

  if (loading) {
    return (
      <View style={styles.center}>
        <Text style={styles.text}>Cargando rutina...</Text>
      </View>
    );
  }

  if (!rutina) {
    return (
      <View style={styles.center}>
        <Text style={styles.text}>Rutina no encontrada</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{rutina.nombre}</Text>
      <Text style={styles.description}>{rutina.descripcion}</Text>

      <View style={styles.barraGeneralContenedor}>
        <View
          style={[
            styles.barraGeneralProgreso,
            { width: `${progresoGeneral * 100}%` },
          ]}
        />
      </View>
      <Text style={styles.progresoGeneralTexto}>
        Progreso general: {seriesCompletadas} / {totalSeries} series
      </Text>

      {rutina.ejercicios.map((ej, index) => {
        const completadas = progreso[index]?.completadas || 0;
        const progresoEjercicio = ej.series > 0 ? completadas / ej.series : 0;

        return (
          <View key={index} style={styles.ejercicioContainer}>
            <View style={{ flex: 1 }}>
              <Text style={styles.ejercicioNombre}>{ej.nombre}</Text>
              <Text style={styles.text}>
                Peso: {ej.peso} kg - Repeticiones: {ej.repeticiones} - Series:{" "}
                {ej.series}
              </Text>
              <View style={styles.controles}>
                <TouchableOpacity
                  style={styles.btn}
                  onPress={() => decrementarSerie(index)}
                >
                  <Text style={styles.btnText}>-</Text>
                </TouchableOpacity>
                <Text style={styles.seriesText}>
                  {completadas} / {ej.series} series hechas
                </Text>
                <TouchableOpacity
                  style={styles.btn}
                  onPress={() => incrementarSerie(index)}
                >
                  <Text style={styles.btnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.barraVerticalContenedor}>
              <View
                style={[
                  styles.barraVerticalProgreso,
                  { height: `${progresoEjercicio * 100}%` },
                ]}
              />
            </View>
          </View>
        );
      })}

      <View style={{ marginTop: 30 }}>
        <Button title="Guardar progreso" onPress={guardarProgreso} />
      </View>
    </ScrollView>
  );
}

const getStyles = (theme: "light" | "dark") =>
  StyleSheet.create({
    container: {
      padding: 16,
      backgroundColor: theme === "dark" ? "#121212" : "#fff",
      paddingBottom: 40,
    },
    center: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: theme === "dark" ? "#121212" : "#fff",
    },
    title: {
      fontSize: 24,
      fontWeight: "bold",
      marginBottom: 8,
      color: theme === "dark" ? "#fff" : "#000",
    },
    description: {
      fontSize: 16,
      marginBottom: 16,
      color: theme === "dark" ? "#bbb" : "#555",
    },
    text: {
      color: theme === "dark" ? "#fff" : "#000",
    },
    barraGeneralContenedor: {
      height: 20,
      width: "100%",
      backgroundColor: theme === "dark" ? "#333" : "#ddd",
      borderRadius: 10,
      overflow: "hidden",
      marginBottom: 8,
      marginTop: 12,
    },
    barraGeneralProgreso: {
      height: "100%",
      backgroundColor: "#28a745",
      borderRadius: 10,
    },
    progresoGeneralTexto: {
      fontSize: 14,
      color: theme === "dark" ? "#ccc" : "#333",
      marginBottom: 12,
      fontWeight: "600",
      textAlign: "center",
    },
    ejercicioContainer: {
      marginBottom: 20,
      padding: 12,
      backgroundColor: theme === "dark" ? "#1e1e1e" : "#f0f0f0",
      borderRadius: 8,
      flexDirection: "row",
      alignItems: "center",
    },
    ejercicioNombre: {
      fontWeight: "bold",
      fontSize: 18,
      marginBottom: 4,
      color: theme === "dark" ? "#fff" : "#000",
    },
    controles: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 8,
    },
    btn: {
      backgroundColor: "#007bff",
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 6,
    },
    btnText: {
      color: "white",
      fontSize: 20,
      fontWeight: "bold",
    },
    seriesText: {
      marginHorizontal: 12,
      fontSize: 16,
      color: theme === "dark" ? "#fff" : "#000",
    },
    barraVerticalContenedor: {
      width: 20,
      height: 80,
      backgroundColor: theme === "dark" ? "#333" : "#ddd",
      borderRadius: 6,
      marginLeft: 12,
      justifyContent: "flex-end",
      overflow: "hidden",
    },
    barraVerticalProgreso: {
      width: "100%",
      backgroundColor: "#28a745",
      borderRadius: 6,
    },
  });
