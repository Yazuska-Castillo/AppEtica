import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { useNavigation, useRouter } from "expo-router";
import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import {
  ActionSheetIOS,
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
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
  nombre: string;
  descripcion: string;
  ejercicios: Ejercicio[];
};

export default function ListaRutinas() {
  const colorScheme = useColorScheme();
  const styles = getStyles(colorScheme === "dark" ? "dark" : "light");

  const router = useRouter();
  const navigation = useNavigation();

  const [rutinas, setRutinas] = useState<Rutina[]>([]);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null); // <-- cambio aquí
  const [mostrarPredefinidas, setMostrarPredefinidas] = useState(false);

  const rutinasPredefinidas: Rutina[] = [
    {
      ID: "111",
      nombre: "Pierna (sin equipo)",
      descripcion:
        "Entrenamiento de piernas enfocado en la fuerza buscando un cuerpo sano, tonificado y funcional, sin equipo y adaptable a cualquier nivel.",
      ejercicios: [
        { nombre: "Sentadillas", peso: 1, repeticiones: 15, series: 3 },
        { nombre: "Zancadas", peso: 1, repeticiones: 12, series: 3 },
        { nombre: "Puente de gluteos", peso: 1, repeticiones: 20, series: 3 },
        {
          nombre: "Sentadillas con saltos",
          peso: 1,
          repeticiones: 12,
          series: 3,
        },
        {
          nombre: "salto de longitud con pies juntos",
          peso: 1,
          repeticiones: 10,
          series: 3,
        },
        {
          nombre: "Elevaciones de talones",
          peso: 1,
          repeticiones: 30,
          series: 4,
        },
      ],
    },
    {
      ID: "112",
      nombre: "Pierna (con equipo)",
      descripcion:
        "Entrenamiento de piernas enfocado en ganar fuerza y musculatura, con equipo y con un mínimo de conocimiento en la tecnica de los ejercicios. Se recomienda que las personas que nunca hayan realizado estos ejercicios primero los realicen con poco peso, enfocandose en acostumbrarse a la técnica de los ejercicios y luego aumentar el peso y la cantidad de series.",
      ejercicios: [
        {
          nombre: "Sentadillas con barra",
          peso: 20,
          repeticiones: 12,
          series: 3,
        },
        { nombre: "Peso muerto", peso: 30, repeticiones: 10, series: 3 },
        {
          nombre: "Elevaciones de talones en maquina",
          peso: 30,
          repeticiones: 12,
          series: 3,
        },
        {
          nombre: "Elevacion de talones en maquina sentado",
          peso: 30,
          repeticiones: 12,
          series: 3,
        },
        {
          nombre: "Curl femoral en maquina",
          peso: 30,
          repeticiones: 12,
          series: 4,
        },
        {
          nombre: "Extención de cuadriceps",
          peso: 30,
          repeticiones: 12,
          series: 4,
        },
      ],
    },
    {
      ID: "113",
      nombre: "Velocidad",
      descripcion:
        "Entrenamiento de piernas enfocado en ganar velocidad, agilidad y coordinacion. Realizar con calzado acolchado y con peso ligero.",
      ejercicios: [
        { nombre: "Saltar la cuerda", peso: 1, repeticiones: 30, series: 3 },
        { nombre: "Sprint", peso: 1, repeticiones: 8, series: 3 },
        { nombre: "Salto en cruz", peso: 1, repeticiones: 8, series: 3 },
        { nombre: "Salto al cajon", peso: 1, repeticiones: 12, series: 3 },
        {
          nombre: "Skater jump con salto vertical",
          peso: 1,
          repeticiones: 10,
          series: 3,
        },
        {
          nombre: "Escalera de agilidad v1",
          peso: 1,
          repeticiones: 3,
          series: 4,
        },
        {
          nombre: "Escalera de agilidad v2",
          peso: 1,
          repeticiones: 3,
          series: 4,
        },
      ],
    },
    {
      ID: "114",
      nombre: "Abdominales",
      descripcion:
        "Entrenamiento enfocado en la estabilidad y coordinacion del abdomen.",
      ejercicios: [
        {
          nombre: "Planchas con toques de hombro",
          peso: 1,
          repeticiones: 45,
          series: 3,
        },
        {
          nombre: "Side Plank con elevación de pierna",
          peso: 1,
          repeticiones: 15,
          series: 3,
        },
        {
          nombre: "lanzamiento lateral de pelota medicinal",
          peso: 1,
          repeticiones: 15,
          series: 3,
        },
        { nombre: "Abdominales en V", peso: 1, repeticiones: 12, series: 3 },
        {
          nombre: "Crunch isométrico en 90°",
          peso: 1,
          repeticiones: 30,
          series: 3,
        },
      ],
    },
    {
      ID: "115",
      nombre: "Abdominales v2",
      descripcion:
        "Entrenamiento enfocado en el desarrollo muscular del abdomen.",
      ejercicios: [
        {
          nombre: "Crunch en máquina o con carga",
          peso: 1,
          repeticiones: 15,
          series: 3,
        },
        {
          nombre: "Crunch isométrico en 90°",
          peso: 1,
          repeticiones: 30,
          series: 3,
        },
        {
          nombre: "Elevaciones de piernas colgado",
          peso: 1,
          repeticiones: 15,
          series: 3,
        },
        {
          nombre: "Reverse crunch con control",
          peso: 1,
          repeticiones: 15,
          series: 3,
        },
        { nombre: "Giro ruso con carga", peso: 1, repeticiones: 30, series: 3 },
        {
          nombre: "Side Plank con elevación de pierna",
          peso: 1,
          repeticiones: 15,
          series: 4,
        },
      ],
    },
    {
      ID: "116",
      nombre: "Empuje (push)",
      descripcion:
        "Entrenamiento enfocado en el desarrollo del musculo y la fuerza en el pecho, hombros y triceps. Si se usa esta rutina tambien se debe usar la rutina de tirón (pull)",
      ejercicios: [
        { nombre: "Press banca plano", peso: 1, repeticiones: 12, series: 3 },
        {
          nombre: "Press inclinado con mancuernas",
          peso: 1,
          repeticiones: 12,
          series: 3,
        },
        { nombre: "Press militar", peso: 1, repeticiones: 15, series: 3 },
        {
          nombre: "Elevaciones laterales",
          peso: 1,
          repeticiones: 12,
          series: 3,
        },
        { nombre: "Fondos", peso: 1, repeticiones: 12, series: 3 },
        {
          nombre: "Extensión de tríceps",
          peso: 1,
          repeticiones: 15,
          series: 4,
        },
      ],
    },
    {
      ID: "117",
      nombre: "Tirón (pull)",
      descripcion:
        "Entrenamiento enfocado en el desarrollo del musculo y la fuerza en la espalda y el biceps. Si se usa esta rutina tambien se debe usar la rutina de empuje (push).",
      ejercicios: [
        {
          nombre: "Dominadas o jalón al pecho",
          peso: 1,
          repeticiones: 10,
          series: 3,
        },
        {
          nombre: "Remo con barra o mancuerna",
          peso: 1,
          repeticiones: 10,
          series: 3,
        },
        {
          nombre: "Remo en máquina o polea baja",
          peso: 1,
          repeticiones: 12,
          series: 3,
        },
        { nombre: "Face pull", peso: 1, repeticiones: 15, series: 3 },
        { nombre: "Curl bíceps", peso: 1, repeticiones: 12, series: 3 },
        { nombre: "Curl martillo", peso: 1, repeticiones: 15, series: 4 },
      ],
    },
    {
      ID: "118",
      nombre: "Empuje (sin equipo)",
      descripcion:
        "Entrenamiento enfocado en el desarrollo del musculo y la fuerza en el pecho, hombro y triceps. Si se usa esta rutina tambien se debe usar la rutina de tirón (sin equipo).",
      ejercicios: [
        { nombre: "Flexiones", peso: 1, repeticiones: 12, series: 3 },
        {
          nombre: "Flexiones declinadas",
          peso: 1,
          repeticiones: 12,
          series: 3,
        },
        { nombre: "Flexiones diamante", peso: 1, repeticiones: 12, series: 3 },
        { nombre: "Flexiones en pica", peso: 1, repeticiones: 15, series: 3 },
        { nombre: "Fondos", peso: 1, repeticiones: 12, series: 3 },
        {
          nombre: "Flexiones explosivas",
          peso: 1,
          repeticiones: 12,
          series: 3,
        },
      ],
    },
    {
      ID: "119",
      nombre: "Tirón (sin equipo)",
      descripcion:
        "Entrenamiento enfocado en el desarrollo del musculo y la fuerza en la espalda, biceps y el hombro posterior. Si se usa esta rutina tambien se debe usar la rutina de empuje (sin equipo).",
      ejercicios: [
        {
          nombre: "Dominadas con agarre prono",
          peso: 1,
          repeticiones: 10,
          series: 3,
        },
        {
          nombre: "Dominadas con agarre supino",
          peso: 1,
          repeticiones: 10,
          series: 3,
        },
        { nombre: "Remo inverso", peso: 1, repeticiones: 12, series: 3 },
        {
          nombre: "Dominads con agarre neutro",
          peso: 1,
          repeticiones: 10,
          series: 3,
        },
        {
          nombre: "Face pulls con toalla",
          peso: 1,
          repeticiones: 12,
          series: 3,
        },
        {
          nombre: "Curls excéntricos con mochila",
          peso: 1,
          repeticiones: 15,
          series: 3,
        },
      ],
    },
  ];

  const guardarRutinaPredefinida = async (rutina: Rutina) => {
    if (!userId) return;

    const { ID, ...resto } = rutina;
    const payload = {
      ...resto,
      ID,
      userId,
    };

    try {
      const res = await fetch("http://192.168.1.128:3000/api/rutinas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const resText = await res.text();

      if (!res.ok) {
        throw new Error(`Error del servidor: ${res.status} - ${resText}`);
      }

      Alert.alert("Éxito", "Rutina guardada en tus rutinas");
      cargarRutinas(userId);
    } catch (error) {
      console.error("Error guardando rutina predefinida:", error);
      Alert.alert("Error", "No se pudo guardar la rutina");
    }
  };

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: true });
  }, [navigation]);

  const cargarUsuario = async () => {
    try {
      const userString = await AsyncStorage.getItem("user");
      if (userString) {
        const user = JSON.parse(userString);
        const id = user.id || null;

        setUserId(id);
      } else {
        console.log("No se encontró usuario en AsyncStorage");
      }
    } catch (error) {
      console.error("Error cargando usuario:", error);
    }
  };

  const cargarRutinas = async (id: string) => {
    try {
      setLoading(true);
      const res = await fetch(`http://192.168.1.128:3000/api/rutinas/${id}`); // usa userId en la url
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
    cargarUsuario();
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (userId) {
        cargarRutinas(userId);
      }
    }, [userId])
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
            if (userId) cargarRutinas(userId);
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
        style={styles.nombreContainer}
        onPress={() => verProgreso(item.ID)}
        activeOpacity={0.7}
      >
        <Text style={styles.nombre}>{item.nombre}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => editarRutina(item.ID)}
        style={styles.iconButton}
      >
        <Ionicons
          name="create-outline"
          size={24}
          color={styles.iconColor.color}
        />
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => eliminarRutina(item.ID)}
        style={styles.iconButton}
      >
        <Ionicons name="trash-outline" size={24} color="#dc3545" />
      </TouchableOpacity>
    </View>
  );

  const yaGuardada = (rutinaPredef: Rutina): boolean => {
    return rutinas.some((r) => r.nombre === rutinaPredef.nombre);
  };

  const abrirMenu = () => {
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: [
            "Crear rutina nueva",
            "Ver rutinas predefinidas",
            "Cancelar",
          ],
          cancelButtonIndex: 2,
        },
        (buttonIndex) => {
          if (buttonIndex === 0) {
            nuevaRutina();
          } else if (buttonIndex === 1) {
            setMostrarPredefinidas(true);
          }
        }
      );
    } else {
      Alert.alert(
        "Opciones",
        "¿Qué quieres hacer?",
        [
          { text: "Crear rutina nueva", onPress: nuevaRutina },
          {
            text: "Ver rutinas predefinidas",
            onPress: () => setMostrarPredefinidas(true),
          },
          { text: "Cancelar", style: "cancel" },
        ],
        { cancelable: true }
      );
    }
  };

  const renderPredefinida = ({ item }: { item: Rutina }) => {
    const guardada = yaGuardada(item);

    return (
      <View style={styles.itemContainer}>
        <View style={{ flex: 1 }}>
          <Text style={styles.nombre}>{item.nombre}</Text>
          <Text style={styles.descripcion}>{item.descripcion}</Text>
        </View>

        <TouchableOpacity
          style={[styles.btnEditar, guardada && styles.btnGuardada]}
          onPress={() => !guardada && guardarRutinaPredefinida(item)}
          disabled={guardada}
          activeOpacity={guardada ? 1 : 0.7}
        >
          <Text style={styles.btnText}>
            {guardada ? "Guardada" : "Agregar a mis rutinas"}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Mis Rutinas</Text>

      {mostrarPredefinidas && (
        <TouchableOpacity
          onPress={() => setMostrarPredefinidas(false)}
          style={{ marginBottom: 12 }}
        >
          <Text style={styles.linkText}>← Ocultar predefinidas</Text>
        </TouchableOpacity>
      )}

      {mostrarPredefinidas ? (
        <FlatList
          data={rutinasPredefinidas}
          keyExtractor={(item) => item.ID}
          renderItem={renderPredefinida}
          contentContainerStyle={{ paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
        />
      ) : loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={styles.primaryColor.color} />
          <Text style={styles.loadingText}>Cargando rutinas...</Text>
        </View>
      ) : rutinas.length === 0 ? (
        <Text style={styles.noRutinas}>No hay rutinas aún</Text>
      ) : (
        <FlatList
          data={rutinas}
          keyExtractor={(item) => item.ID}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
        />
      )}

      <TouchableOpacity
        style={styles.btnNueva}
        onPress={abrirMenu}
        activeOpacity={0.8}
      >
        <Text style={styles.btnNuevaTexto}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const getStyles = (theme: "light" | "dark") =>
  StyleSheet.create({
    container: {
      flex: 1,
      padding: 20,
      backgroundColor: theme === "dark" ? "#121212" : "#fff",
    },
    titulo: {
      fontSize: 26,
      fontWeight: "bold",
      marginBottom: 16,
      color: theme === "dark" ? "#fff" : "#000",
    },
    itemContainer: {
      flexDirection: "row",
      padding: 14,
      backgroundColor: theme === "dark" ? "#1e1e1e" : "#f0f0f0",
      borderRadius: 10,
      marginBottom: 14,
      alignItems: "center",
      shadowColor: theme === "dark" ? "#000" : "#aaa",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 2,
      elevation: 3,
    },
    nombreContainer: {
      flex: 1,
      marginRight: 12,
    },
    nombre: {
      fontSize: 18,
      fontWeight: "700",
      color: theme === "dark" ? "#fff" : "#222",
    },
    descripcion: {
      fontSize: 14,
      color: theme === "dark" ? "#ccc" : "#555",
      marginTop: 4,
    },
    iconButton: {
      padding: 8,
      marginLeft: 6,
      borderRadius: 6,
      justifyContent: "center",
      alignItems: "center",
    },
    btnEditar: {
      backgroundColor: "#007bff",
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: 8,
      marginLeft: 8,
    },
    btnGuardada: {
      backgroundColor: "#6c757d",
    },
    btnText: {
      color: "#fff",
      fontWeight: "600",
      fontSize: 14,
    },
    noRutinas: {
      textAlign: "center",
      marginTop: 30,
      fontSize: 16,
      color: theme === "dark" ? "#aaa" : "#444",
    },
    center: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: theme === "dark" ? "#121212" : "#fff",
      paddingTop: 40,
    },
    loadingText: {
      marginTop: 14,
      fontSize: 16,
      color: theme === "dark" ? "#bbb" : "#555",
    },
    btnNueva: {
      position: "absolute",
      bottom: 28,
      right: 28,
      backgroundColor: "#28a745",
      width: 56,
      height: 56,
      borderRadius: 28,
      justifyContent: "center",
      alignItems: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 6,
    },
    btnNuevaTexto: {
      color: "#fff",
      fontSize: 34,
      lineHeight: 34,
      fontWeight: "700",
    },
    linkText: {
      color: "#2196F3",
      fontSize: 16,
      fontWeight: "600",
    },
    primaryColor: {
      color: "#28a745",
    },
    iconColor: {
      color: theme === "dark" ? "#4caf50" : "#007bff",
    },
  });
