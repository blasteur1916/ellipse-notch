import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";
import { colors } from "@/lib/theme";
import { Icon } from "./Icon";

const SPRING = { damping: 16, stiffness: 220, mass: 0.8 };

interface Props {
  label: string;
  online: boolean;
  /** 0 → repos, 1 → une carte est soulevée. */
  armed: SharedValue<number>;
  /** 0 → hors zone, 1 → la carte survole l'île. */
  hot: SharedValue<number>;
  /** Incrémenter pour jouer une impulsion (fichier envoyé ou reçu). */
  pulse: number;
}

/** Écho du Notch du PC en haut de l'écran : statut, et cible de dépôt pendant un glisser. */
export function Island({ label, online, armed, hot, pulse }: Props) {
  const bump = useSharedValue(1);

  useEffect(() => {
    if (pulse > 0) bump.value = withSequence(withTiming(1.12, { duration: 140 }), withSpring(1, SPRING));
  }, [pulse, bump]);

  const body = useAnimatedStyle(() => ({
    width: withSpring(armed.value ? 300 : 150, SPRING),
    height: withSpring(armed.value ? 64 : 36, SPRING),
    borderRadius: withSpring(armed.value ? 26 : 18, SPRING),
    borderColor: armed.value ? "rgba(248,247,244,0.35)" : colors.line,
    backgroundColor: interpolateColor(withTiming(hot.value, { duration: 160 }), [0, 1], [colors.black, colors.paper]),
    transform: [{ scale: bump.value * withSpring(hot.value ? 1.06 : 1, SPRING) }],
  }));
  const idle = useAnimatedStyle(() => ({ opacity: withTiming(armed.value ? 0 : 1, { duration: 120 }) }));
  const drop = useAnimatedStyle(() => ({ opacity: withTiming(armed.value ? 1 : 0, { duration: 160 }) }));
  const dropLight = useAnimatedStyle(() => ({ opacity: withTiming(hot.value, { duration: 160 }) }));

  return (
    <View pointerEvents="none" style={styles.wrap}>
      <Animated.View style={[styles.body, body]}>
        <Animated.View style={[styles.row, idle]}>
          <View style={[styles.dot, { backgroundColor: online ? colors.paper : colors.muted }]} />
          <Text style={styles.label} numberOfLines={1}>
            {label}
          </Text>
        </Animated.View>
        <Animated.View style={[styles.row, styles.overlay, drop]}>
          <Icon name="arrowUp" size={18} />
          <Text style={styles.dropLabel}>Relâchez sur l’île</Text>
          {/* Variante claire quand la carte est au-dessus de l'île. */}
          <Animated.View style={[styles.row, styles.overlay, styles.hot, dropLight]}>
            <Icon name="arrowUp" size={18} color={colors.ink} />
            <Text style={[styles.dropLabel, { color: colors.ink }]}>Envoyer au PC</Text>
          </Animated.View>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: "absolute", top: 0, left: 0, right: 0, alignItems: "center", zIndex: 30 },
  body: { alignItems: "center", justifyContent: "center", borderWidth: 1, overflow: "hidden" },
  row: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 14 },
  overlay: { ...StyleSheet.absoluteFill, justifyContent: "center" },
  hot: { backgroundColor: colors.paper },
  dot: { width: 7, height: 7, borderRadius: 4 },
  label: { color: colors.paper, fontSize: 13, fontWeight: "600" },
  dropLabel: { color: colors.paper, fontSize: 15, fontWeight: "600" },
});
