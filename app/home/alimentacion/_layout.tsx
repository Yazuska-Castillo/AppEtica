import { Ionicons } from "@expo/vector-icons";
import { Stack, useNavigation } from "expo-router";
import { Pressable, useColorScheme } from "react-native";

export default function AlimentacionLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "Alimentación" }} />
      <Stack.Screen
        name="completa"
        options={{
          title: "hola",
          headerLeft: () => <BackButton />,
        }}
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
