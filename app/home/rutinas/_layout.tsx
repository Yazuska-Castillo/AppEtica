import { Ionicons } from "@expo/vector-icons";
import { Stack, useNavigation } from "expo-router";
import { Pressable, useColorScheme } from "react-native";

export default function RutinasLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "Rutinas" }} />
      <Stack.Screen
        name="editar"
        options={{ title: "Editar Rutina", headerLeft: () => <BackButton /> }}
      />
      <Stack.Screen
        name="nueva"
        options={{ title: "Agregar Rutina", headerLeft: () => <BackButton /> }}
      />
      <Stack.Screen
        name="progreso"
        options={{ title: "Progreso", headerLeft: () => <BackButton /> }}
      />
    </Stack>
  );
}

function BackButton() {
  const navigation = useNavigation();
  const colorScheme = useColorScheme();
  const iconColor = colorScheme === "dark" ? "white" : "black";

  return (
    <Pressable onPress={() => navigation.goBack()} style={{ paddingLeft: 15 }}>
      <Ionicons name="arrow-back" size={24} color={iconColor} />
    </Pressable>
  );
}
