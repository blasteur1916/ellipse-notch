import { CameraView, useCameraPermissions, type BarcodeScanningResult } from "expo-camera";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon } from "@/components/Icon";
import { useEllipse } from "@/lib/ellipse";
import { parsePairingUrl } from "@/lib/pairing";
import { colors } from "@/lib/theme";

const FRAME = 248;

export default function PairScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { pair } = useEllipse();
  const [permission, requestPermission] = useCameraPermissions();
  const [error, setError] = useState<string | null>(null);
  const done = useRef(false);

  const onScan = async ({ data }: BarcodeScanningResult) => {
    if (done.current) return;
    const pairing = parsePairingUrl(data);
    if (!pairing) {
      setError("Ce QR code n’est pas celui d’Ellipse.");
      return;
    }
    done.current = true;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await pair(pairing);
    router.back();
  };

  return (
    <View style={styles.screen}>
      {permission?.granted ? (
        <CameraView style={StyleSheet.absoluteFill} barcodeScannerSettings={{ barcodeTypes: ["qr"] }} onBarcodeScanned={onScan} />
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.center]}>
          <Text style={styles.title}>Accès à l’appareil photo</Text>
          <Text style={styles.body}>Il sert uniquement à scanner le QR code affiché dans le Notch de votre PC.</Text>
          <Pressable style={styles.primary} onPress={requestPermission}>
            <Text style={styles.primaryLabel}>Autoriser</Text>
          </Pressable>
        </View>
      )}

      {permission?.granted && (
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.center]}>
          <View style={styles.frame}>
            <Icon name="scan" size={FRAME} strokeWidth={0.6} />
          </View>
          <Text style={[styles.title, { marginTop: 28 }]}>Scannez le QR code</Text>
          <Text style={styles.body}>
            {error ?? "Sur le PC, survolez le Notch puis touchez le bouton Téléphone."}
          </Text>
        </View>
      )}

      <Pressable style={[styles.close, { top: insets.top + 12 }]} onPress={() => router.back()} hitSlop={10}>
        <Icon name="x" size={20} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.black },
  center: { alignItems: "center", justifyContent: "center", paddingHorizontal: 32 },
  frame: { width: FRAME, height: FRAME },
  title: { color: colors.paper, fontSize: 22, fontWeight: "700", textAlign: "center" },
  body: { marginTop: 8, color: colors.muted, fontSize: 15, lineHeight: 21, textAlign: "center", maxWidth: 300 },
  primary: { marginTop: 24, height: 52, paddingHorizontal: 28, borderRadius: 26, backgroundColor: colors.paper, justifyContent: "center" },
  primaryLabel: { color: colors.ink, fontSize: 16, fontWeight: "600" },
  close: {
    position: "absolute",
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(28,28,30,0.85)",
  },
});
