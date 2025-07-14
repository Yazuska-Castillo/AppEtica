import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { useNavigation, useRouter } from "expo-router";
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useState,
} from "react";
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type Ejercicio = {
  nombre: string;
  peso: number;
  repeticiones: number;
  series: number;
};

type Rutina = {
  username?: string;
  nombre: string;
  descripcion?: string;
  ejercicios: Ejercicio[];
};

export default function ListaRutinas() {
  const [rutinas, setRutinas] = useState<Rutina[]>([]);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState<string | null>(null);
  const router = useRouter();
  const navigation = useNavigation();

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  // Cargar username de AsyncStorage al montar componente
  useEffect(() => {
    const cargarUsuario = async () => {
      try {
        const userStr = await AsyncStorage.getItem("user");
        if (!userStr) {
          Alert.alert("Error", "Por favor inicia sesión.");
          router.replace("/login");
          return;
        }
        const user = JSON.parse(userStr);
        const name = user.name || user.email || null;
        if (!name) {
          Alert.alert(
            "Error",
            "No se pudo obtener el usuario. Por favor inicia sesión."
          );
          router.replace("/login");
          return;
        }
        setUsername(name);
      } catch (error) {
        Alert.alert("Error", "No se pudo cargar el usuario.");
        router.replace("/login");
      }
    };
    cargarUsuario();
  }, []);

  // Cuando tenemos username, cargar rutinas
  useFocusEffect(
    useCallback(() => {
      if (username) {
        cargarRutinas();
      }
    }, [username])
  );

  const cargarRutinas = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `http://192.168.1.128:3000/api/rutinas/${encodeURIComponent(username!)}`
      );
      if (!res.ok) throw new Error("Error cargando rutinas");
      const data = await res.json();
      setRutinas(data);
    } catch (error) {
      console.error("Error en cargarRutinas:", error);
      Alert.alert("Error", "No se pudieron cargar las rutinas");
    } finally {
      setLoading(false);
    }
  };

  const eliminarRutina = (index: number) => {
    Alert.alert("Confirmar", "¿Seguro que quieres eliminar esta rutina?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          try {
            const res = await fetch(
              `http://192.168.1.128:3000/api/rutinas/${index}`,
              {
                method: "DELETE",
              }
            );
            if (!res.ok) throw new Error("Error eliminando rutina");
            Alert.alert("Éxito", "Rutina eliminada");
            cargarRutinas();
          } catch (err) {
            console.error("Error eliminando rutina:", err);
            Alert.alert("Error", "No se pudo eliminar la rutina");
          }
        },
      },
    ]);
  };

  const renderItem = ({ item, index }: { item: Rutina; index: number }) => (
    <View style={styles.item}>
      <View style={{ flex: 1 }}>
        <Text style={styles.nombre}>{item.nombre}</Text>
        {item.descripcion ? <Text>{item.descripcion}</Text> : null}
        {item.ejercicios.length > 0 && (
          <View style={{ marginTop: 4 }}>
            {item.ejercicios.map((ej, i) => (
              <Text key={i} style={{ fontSize: 12, color: "#555" }}>
                {`${ej.nombre} - Peso: ${ej.peso}, Reps: ${ej.repeticiones}, Series: ${ej.series}`}
              </Text>
            ))}
          </View>
        )}
      </View>
      <TouchableOpacity
        style={[styles.btn, styles.btnEditar]}
        onPress={() =>
          router.push({
            pathname: "/home/rutinas/editar",
            params: { index: index.toString() },
          })
        }
      >
        <Text style={styles.btnText}>Editar</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.btn, styles.btnEliminar]}
        onPress={() => eliminarRutina(index)}
      >
        <Text style={styles.btnText}>Eliminar</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.btnAgregar}
        onPress={() => router.push("/home/rutinas/nueva")}
      >
        <Text style={styles.btnText}>+ Nueva Rutina</Text>
      </TouchableOpacity>
      {loading ? (
        <Text>Cargando rutinas...</Text>
      ) : rutinas.length === 0 ? (
        <Text>No hay rutinas creadas.</Text>
      ) : (
        <FlatList
          data={rutinas}
          keyExtractor={(_, index) => index.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 16 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  item: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    padding: 12,
    backgroundColor: "#eee",
    borderRadius: 8,
  },
  nombre: { fontWeight: "bold", fontSize: 16 },
  btn: {
    marginLeft: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  btnEditar: { backgroundColor: "#4CAF50" },
  btnEliminar: { backgroundColor: "#F44336" },
  btnText: { color: "white", fontWeight: "bold" },
  btnAgregar: {
    backgroundColor: "#2196F3",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: "center",
  },
});
