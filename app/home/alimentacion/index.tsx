import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
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

type Objetivo = "bajar de peso" | "ganar masa muscular" | "tonificar";
type Categoria = "carbohidratos" | "proteinas" | "grasas saludables";
type Comida = "Desayuno" | "Almuerzo" | "Merienda" | "Cena";

type Recomendacion = {
  objetivo: string;
  comida: Comida; // viene del backend
  categoria: Categoria;
  alimento: string;
  porcion: string;
  gramos: number;
  calorias: number;
};

export default function Alimentacion() {
  const colorScheme = useColorScheme();
  const router = useRouter();

  const [objetivo, setObjetivo] = useState<Objetivo | null>(null);
  const [metaCalorias, setMetaCalorias] = useState<number | null>(null);
  const [items, setItems] = useState<Recomendacion[]>([]); // ← siempre arreglo
  const [loading, setLoading] = useState(true);

  // acordeones cerrados por defecto
  const [open, setOpen] = useState<Record<Comida, Record<Categoria, boolean>>>({
    Desayuno: {
      carbohidratos: false,
      proteinas: false,
      "grasas saludables": false,
    },
    Almuerzo: {
      carbohidratos: false,
      proteinas: false,
      "grasas saludables": false,
    },
    Merienda: {
      carbohidratos: false,
      proteinas: false,
      "grasas saludables": false,
    },
    Cena: {
      carbohidratos: false,
      proteinas: false,
      "grasas saludables": false,
    },
  });

  const calcularMetaCalorias = (
    peso?: number,
    altura?: number,
    edad?: number,
    sexo?: string,
    actividad?: string,
    obj?: string
  ) => {
    if (!peso || !altura || !edad || !sexo) return null;
    const s = sexo.toLowerCase().startsWith("m") ? 5 : -161;
    const bmr = 10 * peso + 6.25 * altura - 5 * edad + s;
    let factor = 1.2;
    if (actividad === "ligera") factor = 1.375;
    if (actividad === "moderada") factor = 1.55;
    if (actividad === "alta") factor = 1.725;
    const tdee = bmr * factor;
    if (obj?.toLowerCase().includes("ganar")) return Math.round(tdee + 300);
    if (
      obj?.toLowerCase().includes("bajar") ||
      obj?.toLowerCase().includes("perder")
    )
      return Math.round(tdee - 500);
    return Math.round(tdee);
  };

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

          // Config
          const resConfig = await fetch(
            `http://192.168.1.128:3000/api/configuracion/${encodeURIComponent(
              userId
            )}`
          );
          if (!resConfig.ok)
            throw new Error("No se pudo obtener la configuración");
          const config = await resConfig.json();

          const o = String(config.objetivo || "").toLowerCase();
          const objetivoClave: Objetivo =
            o.includes("bajar") || o.includes("perder")
              ? "bajar de peso"
              : o.includes("ganar")
              ? "ganar masa muscular"
              : "tonificar";
          setObjetivo(objetivoClave);

          const meta =
            config.metaCalorias ??
            calcularMetaCalorias(
              config.peso,
              config.altura,
              config.edad,
              config.sexo,
              config.actividad,
              config.objetivo
            ) ??
            2000;
          setMetaCalorias(meta);

          // Alimentación
          const resAlim = await fetch(
            `http://192.168.1.128:3000/api/alimentacion/${encodeURIComponent(
              objetivoClave
            )}`
          );
          if (!resAlim.ok) {
            setItems([]);
            throw new Error("No hay recomendaciones para este objetivo");
          }
          const raw = await resAlim.json();

          // --- Normalización robusta ---
          // Acepta payload con o sin 'comida' y categorías con variaciones de texto.
          type RawItem = {
            objetivo?: string;
            comida?: string; // puede no venir
            categoria: string;
            alimento: string;
            porcion: string;
            gramos: number | string;
            calorias: number | string;
          };

          const arr: RawItem[] = Array.isArray(raw) ? raw : [];

          const toCategoria = (c: string): Categoria | null => {
            const s = (c || "").trim().toLowerCase();
            if (s.startsWith("carb")) return "carbohidratos";
            if (s.startsWith("prot")) return "proteinas";
            if (s.includes("grasa")) return "grasas saludables";
            return null;
          };

          const comidas: Comida[] = [
            "Desayuno",
            "Almuerzo",
            "Merienda",
            "Cena",
          ];

          // Agrupo por categoría para repartir luego por comidas cuando falte 'comida'
          const porCat: Record<Categoria, RawItem[]> = {
            carbohidratos: [],
            proteinas: [],
            "grasas saludables": [],
          };

          arr.forEach((r) => {
            const cat = toCategoria(r.categoria);
            if (!cat) return;
            porCat[cat].push(r);
          });

          // Construyo la lista final con 'comida'
          const normalizados: Recomendacion[] = [];

          // Si un ítem ya trae 'comida', la respeto; si no, lo reparto round-robin
          (Object.keys(porCat) as Categoria[]).forEach((cat) => {
            let idxDistrib = 0;
            porCat[cat].forEach((r) => {
              const tieneComida = !!r.comida;
              const comidaAsignada: Comida = tieneComida
                ? (r.comida as Comida)
                : comidas[idxDistrib++ % comidas.length];

              normalizados.push({
                objetivo: String(r.objetivo ?? objetivoClave),
                comida: comidaAsignada,
                categoria: cat,
                alimento: r.alimento,
                porcion: r.porcion,
                gramos: Number(r.gramos) || 0,
                calorias: Number(r.calorias) || 0,
              });
            });
          });

          setItems(normalizados);

          await AsyncStorage.setItem("metaCalorias", String(meta));
          await AsyncStorage.setItem("objetivo", objetivoClave);
          await AsyncStorage.setItem(
            "recomendaciones",
            JSON.stringify(normalizados)
          );
        } catch (e: any) {
          console.error("fetchDatos error:", e?.message || e);
          Alert.alert("Error", e?.message || "Error al cargar datos.");
          setItems([]); // ← evita undefined
          setObjetivo(null);
          setMetaCalorias(null);
        } finally {
          setLoading(false);
        }
      };
      fetchDatos();
    }, [router])
  );

  const handleGoToFullTracking = () =>
    router.push("/home/alimentacion/completa");

  // Agrupar con fallback a []
  const agrupado = useMemo(() => {
    const base: Record<Comida, Record<Categoria, Recomendacion[]>> = {
      Desayuno: { carbohidratos: [], proteinas: [], "grasas saludables": [] },
      Almuerzo: { carbohidratos: [], proteinas: [], "grasas saludables": [] },
      Merienda: { carbohidratos: [], proteinas: [], "grasas saludables": [] },
      Cena: { carbohidratos: [], proteinas: [], "grasas saludables": [] },
    };
    const arr: Recomendacion[] = Array.isArray(items) ? items : [];
    arr.forEach((it) => {
      if (base[it.comida]) base[it.comida][it.categoria].push(it);
    });
    return base;
  }, [items]);

  const totalComida = (comida: Comida, cat: Categoria) =>
    agrupado[comida][cat].reduce((acc, i) => acc + (Number(i.gramos) || 0), 0);

  const ordenComidas: Comida[] = ["Desayuno", "Almuerzo", "Merienda", "Cena"];
  const themeBg = colorScheme === "dark" ? "#121212" : "#fff";
  const themeText = colorScheme === "dark" ? "#eee" : "#333";
  const themeTitle = colorScheme === "dark" ? "#fff" : "#000";

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Cargando plan alimentario...</Text>
      </View>
    );
  }

  if (!objetivo) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>No se encontraron recomendaciones.</Text>
        <Pressable onPress={handleGoToFullTracking} style={styles.button}>
          <Text style={styles.buttonText}>Consumo diario</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: themeBg }]}>
      <Text style={[styles.title, { color: themeTitle }]}>
        Plan alimentario recomendado
      </Text>

      <Text style={[styles.text, { color: themeText }]}>
        Calorías recomendadas:{" "}
        <Text style={styles.bold}>{metaCalorias ?? "—"}</Text> kcal
      </Text>
      <Text style={[styles.text, { color: themeText }]}>
        Según tu objetivo de <Text style={styles.bold}>{objetivo}</Text>, te
        sugerimos el siguiente esquema por comidas. Toca cada nutriente para ver
        opciones.
      </Text>

      {ordenComidas.map((comida) => (
        <View key={comida} style={styles.block}>
          <Text style={[styles.sectionTitle, { color: themeTitle }]}>
            {comida}
          </Text>

          {(
            ["carbohidratos", "proteinas", "grasas saludables"] as Categoria[]
          ).map((cat) => {
            const abierto = open[comida][cat];
            const lista = agrupado[comida][cat].slice(0, 5);
            return (
              <View key={cat} style={styles.accordion}>
                <Pressable
                  onPress={() =>
                    setOpen((prev) => ({
                      ...prev,
                      [comida]: { ...prev[comida], [cat]: !prev[comida][cat] },
                    }))
                  }
                  style={styles.accordionHeader}
                >
                  <Text
                    style={[
                      styles.caret,
                      { transform: [{ rotate: abierto ? "90deg" : "0deg" }] },
                    ]}
                  >
                    ▸
                  </Text>
                  <Text style={styles.accordionTitle}>
                    {capitalize(cat)} —{" "}
                    <Text style={styles.bold}>{totalComida(comida, cat)}g</Text>
                  </Text>
                </Pressable>

                {abierto && (
                  <View style={styles.accordionBody}>
                    {lista.length === 0 ? (
                      <Text
                        style={[
                          styles.text,
                          { color: themeText, marginLeft: 8 },
                        ]}
                      >
                        No hay sugerencias para esta sección.
                      </Text>
                    ) : (
                      lista.map((it, idx) => (
                        <Text key={`${cat}-${idx}`} style={styles.bullet}>
                          • {it.alimento} — {it.porcion} ({it.gramos}g,{" "}
                          {it.calorias} kcal)
                        </Text>
                      ))
                    )}
                  </View>
                )}
              </View>
            );
          })}
        </View>
      ))}

      <View style={styles.bottomButtonContainer}>
        <Pressable onPress={handleGoToFullTracking} style={styles.button}>
          <Text style={styles.buttonText}>Consumo diario</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 8 },
  text: { fontSize: 16, marginBottom: 12 },
  bold: { fontWeight: "bold" },
  block: {
    marginBottom: 18,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#ccc",
  },
  sectionTitle: { fontSize: 18, fontWeight: "700", marginBottom: 8 },

  accordion: { borderRadius: 10, backgroundColor: "#f5f7f5", marginBottom: 8 },
  accordionHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 6,
  },
  caret: { fontSize: 16, width: 16, textAlign: "center", color: "#1b5e20" },
  accordionTitle: { fontSize: 15, fontWeight: "600", color: "#1b5e20" },
  accordionBody: { paddingBottom: 10, paddingHorizontal: 28 },
  bullet: { fontSize: 15, color: "#333", marginBottom: 6 },

  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: { marginTop: 10, fontSize: 16, color: "#4CAF50" },
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
  buttonText: { color: "#fff", fontWeight: "600" },
  bottomButtonContainer: {
    alignItems: "center",
    marginTop: 20,
    marginBottom: 40,
  },
});
