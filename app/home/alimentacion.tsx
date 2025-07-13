import { useNavigation } from "expo-router";
import React, { useLayoutEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";

type Grupo = "C" | "P" | "G";

type Alimento = {
  nombre: string;
  grupo: Grupo;
  gramos: number;
  icono: string;
};

const alimentos: Alimento[] = [
  // Carbohidratos
  { nombre: "Pan", grupo: "C", gramos: 30, icono: "🍞" },
  { nombre: "Arroz", grupo: "C", gramos: 50, icono: "🍚" },
  { nombre: "Papa", grupo: "C", gramos: 40, icono: "🥔" },
  { nombre: "Fideos", grupo: "C", gramos: 35, icono: "🍝" },
  { nombre: "Cereal", grupo: "C", gramos: 25, icono: "🥣" },
  { nombre: "Pan Integral", grupo: "C", gramos: 28, icono: "🍞" },
  { nombre: "Quinoa", grupo: "C", gramos: 40, icono: "🍲" },

  // Proteínas
  { nombre: "Pollo", grupo: "P", gramos: 25, icono: "🍗" },
  { nombre: "Huevo", grupo: "P", gramos: 10, icono: "🥚" },
  { nombre: "Tofu", grupo: "P", gramos: 15, icono: "🍛" },
  { nombre: "Pescado", grupo: "P", gramos: 20, icono: "🐟" },
  { nombre: "Carne", grupo: "P", gramos: 30, icono: "🥩" },
  { nombre: "Queso", grupo: "P", gramos: 20, icono: "🧀" },
  { nombre: "Lentejas", grupo: "P", gramos: 25, icono: "🥣" },

  // Grasas
  { nombre: "Palta", grupo: "G", gramos: 15, icono: "🥑" },
  { nombre: "Aceite", grupo: "G", gramos: 10, icono: "🧴" },
  { nombre: "Maní", grupo: "G", gramos: 20, icono: "🥜" },
  { nombre: "Nueces", grupo: "G", gramos: 15, icono: "🌰" },
  { nombre: "Mantequilla", grupo: "G", gramos: 12, icono: "🧈" },
  { nombre: "Semillas de Chía", grupo: "G", gramos: 15, icono: "🌱" },
  { nombre: "Aceitunas", grupo: "G", gramos: 12, icono: "🫒" },
];

const porciones = [0.25, 0.5, 1, 1.5, 2];

export default function SeleccionAlimentosFlexible() {
  const colorScheme = useColorScheme();
  const darkMode = colorScheme === "dark";
  const styles = getStyles(darkMode);
  const navigation = useNavigation();

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: true });
  }, [navigation]);

  const [cantidades, setCantidades] = useState<Record<string, number>>({});
  const [porcionesMap, setPorcionesMap] = useState<Record<string, number>>({});
  const [historial, setHistorial] = useState<Record<string, number>>({});

  const modificarCantidad = (nombre: string, delta: number) => {
    setCantidades((prev) => {
      const actual = prev[nombre] || 0;
      const nuevo = Math.max(0, actual + delta);
      return { ...prev, [nombre]: nuevo };
    });
  };

  const cambiarPorcion = (nombre: string) => {
    setPorcionesMap((prev) => {
      const actual = prev[nombre] || 1;
      const idx = porciones.indexOf(actual);
      const siguiente = porciones[(idx + 1) % porciones.length];
      return { ...prev, [nombre]: siguiente };
    });
  };

  const getTotal = (grupo: Grupo): number =>
    alimentos
      .filter((a) => a.grupo === grupo)
      .reduce((total, a) => {
        const actual = cantidades[a.nombre] || 0;
        const anterior = historial[a.nombre] || 0;
        const porcion = porcionesMap[a.nombre] || 1;
        return total + (actual + anterior) * porcion * a.gramos;
      }, 0);

  const carbs = getTotal("C");
  const protein = getTotal("P");
  const fat = getTotal("G");

  const metaCalorias = 2540;
  const calorias = carbs * 4 + protein * 4 + fat * 9;

  const guardarSeleccion = () => {
    const nuevoHistorial = { ...historial };
    for (const key in cantidades) {
      nuevoHistorial[key] = (nuevoHistorial[key] || 0) + cantidades[key];
    }
    setHistorial(nuevoHistorial);
    setCantidades({});
    Alert.alert("¡Guardado!", "Tu selección se ha sumado al progreso.");
  };

  const renderBarra = (
    label: string,
    valor: number,
    max: number,
    color: string
  ) => (
    <View style={styles.barra}>
      <Text style={styles.barraLabel}>
        {label}: {valor.toFixed(0)}g
      </Text>
      <View style={styles.progressBackground}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${Math.min((valor / max) * 100, 100)}%`,
              backgroundColor: color,
            },
          ]}
        />
      </View>
    </View>
  );

  const renderGrupo = (grupo: Grupo, label: string) => {
    const datos = alimentos.filter((a) => a.grupo === grupo);
    return (
      <View style={styles.grupoContainer} key={grupo}>
        <Text style={styles.grupoTitulo}>{label}</Text>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={datos}
          keyExtractor={(item) => item.nombre}
          renderItem={({ item }) => {
            const cantidad = cantidades[item.nombre] || 0;
            const porcion = porcionesMap[item.nombre] || 1;
            return (
              <View
                style={[
                  styles.card,
                  cantidad > 0 ? styles.cardSeleccionado : null,
                ]}
              >
                <Text style={styles.emoji}>{item.icono}</Text>
                <Text style={styles.cardLabel}>
                  {item.nombre} x{cantidad}
                  {porcion !== 1 ? ` (${porcion}x)` : ""}
                </Text>
                <Pressable
                  onPress={() => cambiarPorcion(item.nombre)}
                  style={styles.btnGrande}
                >
                  <Text style={styles.porcionText}>{porcion}x</Text>
                </Pressable>
                <View style={styles.botones}>
                  <Pressable
                    onPress={() => modificarCantidad(item.nombre, -1)}
                    style={styles.btn}
                  >
                    <Text style={styles.btnText}>-</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => modificarCantidad(item.nombre, 1)}
                    style={styles.btn}
                  >
                    <Text style={styles.btnText}>+</Text>
                  </Pressable>
                </View>
              </View>
            );
          }}
        />
      </View>
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.titulo}>Selecciona tus alimentos</Text>
      <Text style={styles.calorias}>
        Calorías: {calorias.toFixed(0)} / {metaCalorias}
      </Text>
      <View style={styles.progressBackground}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${Math.min((calorias / metaCalorias) * 100, 100)}%`,
              backgroundColor: "#007bff",
            },
          ]}
        />
      </View>

      {renderBarra("Carbohidratos", carbs, 400, "#fca311")}
      {renderBarra("Proteínas", protein, 200, "#2a9d8f")}
      {renderBarra("Grasas", fat, 150, "#e76f51")}

      {renderGrupo("C", "Carbohidratos")}
      {renderGrupo("P", "Proteínas")}
      {renderGrupo("G", "Grasas")}

      <Pressable style={styles.btnGuardar} onPress={guardarSeleccion}>
        <Text style={styles.textoGuardar}>Guardar selección</Text>
      </Pressable>
    </ScrollView>
  );
}

const getStyles = (darkMode: boolean) =>
  StyleSheet.create({
    container: {
      padding: 20,
      paddingBottom: 60,
      backgroundColor: darkMode ? "#121212" : "#fff",
    },
    titulo: {
      fontSize: 20,
      fontWeight: "bold",
      marginBottom: 12,
      textAlign: "center",
      color: darkMode ? "#fff" : "#000",
    },
    calorias: {
      fontWeight: "600",
      marginBottom: 6,
      textAlign: "center",
      color: darkMode ? "#fff" : "#000",
    },
    barra: {
      marginTop: 14,
    },
    barraLabel: {
      fontSize: 14,
      fontWeight: "500",
      marginBottom: 4,
      color: darkMode ? "#fff" : "#000",
    },
    progressBackground: {
      width: "100%",
      height: 10,
      backgroundColor: darkMode ? "#444" : "#eee",
      borderRadius: 5,
      marginBottom: 16,
    },
    progressFill: {
      height: 10,
      borderRadius: 5,
    },
    grupoContainer: {
      marginBottom: 20,
    },
    grupoTitulo: {
      fontWeight: "bold",
      fontSize: 16,
      marginBottom: 8,
      color: darkMode ? "#fff" : "#000",
    },
    card: {
      width: 100,
      marginRight: 12,
      padding: 10,
      borderRadius: 12,
      backgroundColor: darkMode ? "#1e1e1e" : "#f2f2f2",
      alignItems: "center",
    },
    cardSeleccionado: {
      backgroundColor: darkMode ? "#355d3a" : "#c4f5c1",
    },
    emoji: {
      fontSize: 36,
    },
    cardLabel: {
      marginTop: 4,
      fontSize: 12,
      fontWeight: "500",
      textAlign: "center",
      color: darkMode ? "#fff" : "#000",
    },
    btnGrande: {
      marginTop: 6,
      paddingHorizontal: 10,
      paddingVertical: 6,
      backgroundColor: darkMode ? "#444" : "#ddd",
      borderRadius: 8,
      alignItems: "center",
    },
    porcionText: {
      fontWeight: "600",
      color: darkMode ? "#fff" : "#000",
    },
    botones: {
      flexDirection: "row",
      marginTop: 8,
      gap: 8,
    },
    btn: {
      width: 30,
      height: 30,
      backgroundColor: darkMode ? "#333" : "#ddd",
      borderRadius: 15,
      alignItems: "center",
      justifyContent: "center",
    },
    btnText: {
      fontWeight: "bold",
      fontSize: 18,
      color: darkMode ? "#fff" : "#000",
    },
    btnGuardar: {
      marginTop: 28,
      backgroundColor: "#007bff",
      borderRadius: 10,
      paddingVertical: 14,
      alignItems: "center",
    },
    textoGuardar: {
      color: "#fff",
      fontWeight: "700",
      fontSize: 16,
    },
  });
