/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = "#388E3C"; // botón registro claro
const tintColorDark = "#4CAF50"; // botón registro oscuro

export const Colors = {
  light: {
    text: "#000",
    background: "#fff",
    tint: tintColorLight,
    icon: "#555", // para placeholder
    tabIconDefault: "#aaa", // borde input
    tabIconSelected: "#1976D2", // botón iniciar sesión
    inputBackground: "#f5f5f5",
    label: "#333",
  },
  dark: {
    text: "#fff",
    background: "#1e1e1e",
    tint: tintColorDark,
    icon: "#888",
    tabIconDefault: "#555",
    tabIconSelected: "#2196F3",
    inputBackground: "#2b2b2b",
    label: "#ddd",
  },
};
