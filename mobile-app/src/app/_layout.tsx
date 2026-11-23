import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { EllipseProvider } from "@/lib/ellipse";
import { colors } from "@/lib/theme";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.ink }}>
      <SafeAreaProvider>
        <EllipseProvider>
          <StatusBar style="light" />
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.ink } }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="pair" options={{ presentation: "fullScreenModal", animation: "fade" }} />
          </Stack>
        </EllipseProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
