import { Image } from "expo-image";
import { useRef } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View, type HostInstance, type LayoutRectangle } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import type { SharedValue } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import type { Incoming, Kind, Outgoing } from "@/lib/ellipse";
import { formatSize } from "@/lib/format";
import { colors, radius } from "@/lib/theme";
import { Icon, type IconName } from "./Icon";

/** Durée d'appui avant de soulever une carte (le défilement reste prioritaire avant). */
const LIFT_DELAY = 220;

interface VisualProps {
  kind: Kind;
  name: string;
  size: number;
  uri: string | null;
  aspect?: number;
}

/** Rendu commun aux cartes (même langage que le Stash du PC). */
export function CardVisual({ kind, name, size, uri, aspect }: VisualProps) {
  if (kind === "image" && uri) {
    const ratio = Math.min(1.6, Math.max(0.62, aspect ?? 1));
    return <Image source={{ uri }} style={[styles.media, { aspectRatio: ratio }]} contentFit="cover" transition={160} />;
  }
  if (kind === "video") {
    return (
      <View style={styles.video}>
        <View style={styles.playBadge}>
          <Icon name="play" size={16} />
        </View>
        <Text style={styles.videoName} numberOfLines={2}>
          {name}
        </Text>
      </View>
    );
  }
  return (
    <View>
      <Text style={styles.text} numberOfLines={4}>
        {name}
      </Text>
      <Text style={styles.info}>{formatSize(size)}</Text>
    </View>
  );
}

function Chip({ icon, onPress, filled = false, style }: { icon?: IconName; onPress?: () => void; filled?: boolean; style: object }) {
  return (
    <Pressable onPress={onPress} hitSlop={8} style={[styles.chip, filled && styles.chipFilled, style]}>
      {icon ? (
        <Icon name={icon} size={15} strokeWidth={2.4} color={filled ? colors.ink : colors.paper} />
      ) : (
        <ActivityIndicator size="small" color={colors.paper} />
      )}
    </Pressable>
  );
}

export interface DragHandles {
  tx: SharedValue<number>;
  ty: SharedValue<number>;
  hot: SharedValue<number>;
  /** Ordonnée (écran) sous laquelle le doigt « survole » l'île. */
  hotLine: number;
  lift(item: Outgoing, layout: LayoutRectangle): void;
  release(item: Outgoing, onIsland: boolean): void;
  hotChange(): void;
}

interface OutgoingProps {
  item: Outgoing;
  hidden: boolean;
  drag: DragHandles;
  onSend(): void;
  onRemove(): void;
}

export function OutgoingCard({ item, hidden, drag, onSend, onRemove }: OutgoingProps) {
  const ref = useRef<HostInstance>(null);
  const movable = item.state === "idle" || item.state === "error";
  const { tx, ty, hot, hotLine, hotChange } = drag;

  const lift = () =>
    ref.current?.measureInWindow((x, y, width, height) => drag.lift(item, { x, y, width, height }));
  const release = (onIsland: boolean) => drag.release(item, onIsland);

  const pan = Gesture.Pan()
    .enabled(movable)
    .activateAfterLongPress(LIFT_DELAY)
    .onStart(() => {
      tx.value = 0;
      ty.value = 0;
      scheduleOnRN(lift);
    })
    .onUpdate((e) => {
      tx.value = e.translationX;
      ty.value = e.translationY;
      const over = e.absoluteY < hotLine ? 1 : 0;
      if (over !== hot.value) {
        hot.value = over;
        scheduleOnRN(hotChange);
      }
    })
    .onEnd(() => {
      scheduleOnRN(release, hot.value === 1);
    });
  const tap = Gesture.Tap()
    .enabled(movable)
    .onEnd(() => {
      scheduleOnRN(onSend);
    });

  return (
    <GestureDetector gesture={Gesture.Exclusive(pan, tap)}>
      <View ref={ref} collapsable={false} style={[styles.card, hidden && styles.hidden]}>
        <CardVisual
          kind={item.kind}
          name={item.name}
          size={item.size}
          uri={item.uri}
          aspect={item.width && item.height ? item.width / item.height : undefined}
        />
        {item.state === "sending" && (
          <View style={styles.track}>
            <View style={[styles.bar, { width: `${Math.round(item.progress * 100)}%` }]} />
          </View>
        )}
        {item.state === "sent" && <Chip icon="check" filled style={styles.topRight} />}
        {item.state === "error" && <Chip icon="retry" onPress={onSend} style={styles.topRight} />}
        {item.state === "idle" && <Chip icon="x" onPress={onRemove} style={styles.topRight} />}
      </View>
    </GestureDetector>
  );
}

interface IncomingProps {
  item: Incoming;
  previewUri: string | null;
  onSave(): void;
}

export function IncomingCard({ item, previewUri, onSave }: IncomingProps) {
  const icon: IconName | undefined =
    item.state === "saved" ? "check" : item.state === "error" ? "retry" : item.state === "saving" ? undefined : "download";
  return (
    <View style={styles.card}>
      <CardVisual kind={item.kind} name={item.name} size={item.size} uri={item.kind === "image" ? previewUri : null} />
      <Chip
        icon={icon}
        filled={item.state === "saved"}
        onPress={item.state === "saved" || item.state === "saving" ? undefined : onSave}
        style={styles.bottomRight}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 10, borderRadius: radius.card, overflow: "hidden", backgroundColor: colors.card },
  hidden: { opacity: 0 },
  media: { width: "100%", maxHeight: 260 },
  video: { height: 156, padding: 14, justifyContent: "space-between", backgroundColor: colors.cardHigh },
  playBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(10,10,10,0.6)",
  },
  videoName: { color: colors.paper, fontSize: 14, fontWeight: "600" },
  text: { paddingHorizontal: 14, paddingTop: 16, color: colors.paper, fontSize: 17, fontWeight: "600", lineHeight: 22 },
  info: { paddingHorizontal: 14, paddingTop: 4, paddingBottom: 14, color: colors.muted, fontSize: 13 },
  chip: {
    position: "absolute",
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(10,10,10,0.72)",
  },
  chipFilled: { backgroundColor: colors.paper },
  topRight: { top: 8, right: 8 },
  bottomRight: { right: 8, bottom: 8 },
  track: { position: "absolute", left: 0, right: 0, bottom: 0, height: 3, backgroundColor: "rgba(248,247,244,0.2)" },
  bar: { height: 3, backgroundColor: colors.paper },
});
