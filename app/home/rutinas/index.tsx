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
  ActivityIndicator,
  Alert,
  FlatList,
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
  username: string;
  nombre: string;
  descripcion: string;
  ejercicios: Ejercicio[];
};

export default function ListaRutinas() {
  const colorScheme = useColorScheme();
  const styles = getStyles(colorScheme === "dark" ? "dark" : "light");

  const router = useRouter();
  const [rutinas, setRutinas] = useState<Rutina[]>([]);
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const navigation = useNavigation();

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: true });
  }, [navigation]);

  const cargarUsuario = async () => {
    try {
      const userString = await AsyncStorage.getItem("user");
      if (userString) {
        const user = JSON.parse(userString);
        const nombreUsuario = user.name || user.username || null;
        setUsername(nombreUsuario);
      } else {
        console.log("No se encontró usuario en AsyncStorage");
      }
    } catch (error) {
      console.error("Error cargando usuario:", error);
    }
  };

  const cargarRutinas = async (user: string) => {
    try {
      setLoading(true);
      const res = await fetch(`http://192.168.1.128:3000/api/rutinas/${user}`);
      if (!res.ok) throw new Error("Error cargando rutinas");
      const data: Rutina[] = await res.json();
      setRutinas(data);
    } catch (error) {
      Alert.alert("Error", "No se pudieron cargar las rutinas");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      await cargarUsuario();
    })();
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (username) {
        cargarRutinas(username);
      }
    }, [username])
  );

  const eliminarRutina = (id: string) => {
    Alert.alert("Confirmar", "¿Seguro que quieres eliminar esta rutina?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          try {
            const res = await fetch(
              `http://192.168.1.128:3000/api/rutina/${id}`,
              {
                method: "DELETE",
              }
            );
            if (!res.ok) throw new Error("Error eliminando rutina");
            Alert.alert("Éxito", "Rutina eliminada");
            if (username) cargarRutinas(username);
          } catch (err) {
            console.error("Error eliminando rutina:", err);
            Alert.alert("Error", "No se pudo eliminar la rutina");
          }
        },
      },
    ]);
  };

  const editarRutina = (id: string) => {
    router.push(`/home/rutinas/editar?id=${id}`);
  };

  const nuevaRutina = () => {
    router.push("/home/rutinas/nueva");
  };

  const verProgreso = (id: string) => {
    router.push(`/home/rutinas/progreso?id=${id}`);
  };

  const renderItem = ({ item }: { item: Rutina }) => (
    <View style={styles.itemContainer}>
      <TouchableOpacity
        style={{ flex: 1 }}
        onPress={() => verProgreso(item.ID)}
        activeOpacity={0.7}
      >
        <Text style={styles.nombre}>{item.nombre}</Text>
        <Text style={styles.descripcion}>{item.descripcion}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.btnEditar}
        onPress={() => editarRutina(item.ID)}
      >
        <Text style={styles.btnText}>Editar</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.btnEliminar}
        onPress={() => eliminarRutina(item.ID)}
      >
        <Text style={styles.btnText}>Eliminar</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Mis Rutinas</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#0066cc" />
      ) : rutinas.length === 0 ? (
        <Text style={styles.noRutinas}>No hay rutinas aún</Text>
      ) : (
        <FlatList
          data={rutinas}
          keyExtractor={(item) => item.ID}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 80 }}
        />
      )}

      <TouchableOpacity style={styles.btnNueva} onPress={nuevaRutina}>
        <Text style={styles.btnNuevaTexto}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const getStyles = (theme: "light" | "dark") =>
  StyleSheet.create({
    container: {
      flex: 1,
      padding: 16,
      backgroundColor: theme === "dark" ? "#121212" : "#fff",
    },
    titulo: {
      fontSize: 24,
      fontWeight: "bold",
      marginBottom: 16,
      color: theme === "dark" ? "#fff" : "#000",
    },
    itemContainer: {
      flexDirection: "row",
      padding: 12,
      backgroundColor: theme === "dark" ? "#1e1e1e" : "#eee",
      borderRadius: 8,
      marginBottom: 12,
      alignItems: "center",
    },
    nombre: {
      fontSize: 18,
      fontWeight: "bold",
      color: theme === "dark" ? "#fff" : "#000",
    },
    descripcion: {
      fontSize: 14,
      color: theme === "dark" ? "#ccc" : "#555",
    },
    btnEditar: {
      backgroundColor: "#007bff",
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 6,
      marginHorizontal: 6,
    },
    btnEliminar: {
      backgroundColor: "#dc3545",
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 6,
    },
    btnText: {
      color: "#fff",
    },
    noRutinas: {
      textAlign: "center",
      marginTop: 20,
      color: theme === "dark" ? "#aaa" : "#000",
    },
    btnNueva: {
      position: "absolute",
      bottom: 24,
      right: 24,
      backgroundColor: "#28a745",
      width: 56,
      height: 56,
      borderRadius: 28,
      justifyContent: "center",
      alignItems: "center",
      elevation: 5,
    },
    btnNuevaTexto: {
      color: "#fff",
      fontSize: 32,
      lineHeight: 32,
    },
  });
