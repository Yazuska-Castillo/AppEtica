import Slider from "@react-native-community/slider";
import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function AlimentacionScreen() {
  const [expandido, setExpandido] = useState(false);
  const [carbs, setCarbs] = useState(0);
  const [protein, setProtein] = useState(0);
  const [fat, setFat] = useState(0);
  const metaCalorias = 2540;

  const calorias = carbs * 4 + protein * 4 + fat * 9;
  const porcentaje = Math.min((calorias / metaCalorias) * 100, 100);

  return (
    <View style={styles.container}>
      <Pressable onPress={() => setExpandido(!expandido)}>
        <Text style={styles.titulo}>
          Nutrientes ingeridos {expandido ? "▲" : "▼"}
        </Text>
      </Pressable>

      <Text style={styles.subtitulo}>Calorías</Text>
      <View style={styles.sliderContainer}>
        <Text style={styles.valor}>{calorias.toFixed(0)}</Text>
        <Slider
          value={calorias}
          minimumValue={0}
          maximumValue={metaCalorias}
          disabled={true}
          style={styles.slider}
          minimumTrackTintColor="#007bff"
          maximumTrackTintColor="#ccc"
          thumbTintColor="transparent"
        />
        <Text style={styles.valor}>{metaCalorias}</Text>
      </View>

      {expandido && (
        <>
          <Text style={styles.subtitulo}>Carbohidratos (g)</Text>
          <Slider
            minimumValue={0}
            maximumValue={500}
            value={carbs}
            onValueChange={setCarbs}
            style={styles.slider}
          />

          <Text style={styles.subtitulo}>Proteínas (g)</Text>
          <Slider
            minimumValue={0}
            maximumValue={300}
            value={protein}
            onValueChange={setProtein}
            style={styles.slider}
          />

          <Text style={styles.subtitulo}>Grasas (g)</Text>
          <Slider
            minimumValue={0}
            maximumValue={200}
            value={fat}
            onValueChange={setFat}
            style={styles.slider}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  titulo: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  subtitulo: {
    marginTop: 10,
    fontWeight: "500",
    marginBottom: 4,
    fontSize: 15,
  },
  sliderContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  slider: {
    flex: 1,
    height: 40,
  },
  valor: {
    fontSize: 14,
    width: 50,
    textAlign: "center",
  },
});
