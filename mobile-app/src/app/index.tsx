import * as DocumentPicker from "expo-document-picker";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useMemo, useRef, useState } from "react";
import {
  ActionSheetIOS,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type LayoutRectangle,
} from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { scheduleOnRN } from "react-native-worklets";
import { CardVisual, IncomingCard, OutgoingCard, type DragHandles } from "@/components/Cards";
import { Icon } from "@/components/Icon";
import { Island } from "@/components/Island";
import { kindOf, useEllipse, type Outgoing } from "@/lib/ellipse";
import { colors } from "@/lib/theme";

type Tab = "out" | "in";

const GUTTER = 14;
const GAP = 10;

/** Répartit les cartes sur deux colonnes en équilibrant leur hauteur estimée. */
function masonry<T>(items: T[], height: (item: T) => number): [T[], T[]] {
  const cols: [T[], T[]] = [[], []];
  const heights = [0, 0];
  for (const item of items) {
    const col = heights[0] <= heights[1] ? 0 : 1;
    cols[col].push(item);
    heights[col] += height(item) + GAP;
  }
  return cols;
}

const estimate = (kind: string, aspect = 1) => (kind === "image" ? 1 / Math.min(1.6, Math.max(0.62, aspect)) : kind === "video" ? 0.9 : 0.75);

export default function Home() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const app = useEllipse();
  const [tab, setTab] = useState<Tab>("out");
  const [pulse, setPulse] = useState(0);
  const [dragged, setDragged] = useState<{ item: Outgoing; layout: LayoutRectangle } | null>(null);

  const islandTop = insets.top + 10;
  const armed = useSharedValue(0);
  const hot = useSharedValue(0);
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const flight = useSharedValue(0);
  // Position de la carte soulevée : lue au relâchement, hors du cycle de rendu.
  const liftedRef = useRef<LayoutRectangle | null>(null);

  // ----- Glisser une carte vers l'île -----
  const finish = () => {
    setDragged(null);
    flight.value = 0;
  };
  const drag: DragHandles = {
    tx,
    ty,
    hot,
    hotLine: islandTop + 64 + 70,
    lift: (item, layout) => {
      liftedRef.current = layout;
      setDragged({ item, layout });
      armed.value = 1;
      app.dragging(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    },
    hotChange: () => Haptics.selectionAsync(),
    release: (item, onIsland) => {
      armed.value = 0;
      hot.value = 0;
      const layout = liftedRef.current;
      if (onIsland && layout) {
        // La carte est aspirée par l'île, puis l'envoi démarre.
        tx.value = withTiming(screenWidth / 2 - (layout.x + layout.width / 2), { duration: 380 });
        ty.value = withTiming(islandTop + 30 - (layout.y + layout.height / 2), { duration: 380 });
        flight.value = withTiming(1, { duration: 380 }, () => scheduleOnRN(finish));
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        app.send(item.id);
        setPulse((p) => p + 1);
      } else {
        app.dragging(false);
        tx.value = withSpring(0, { damping: 18, stiffness: 220 });
        ty.value = withSpring(0, { damping: 18, stiffness: 220 }, () => scheduleOnRN(finish));
      }
    },
  };

  const ghost = useAnimatedStyle(() => ({
    opacity: 1 - flight.value,
    transform: [
      { translateX: tx.value },
      { translateY: ty.value },
      // La carte rétrécit en approchant de l'île, puis disparaît dedans.
      { scale: (1.04 - Math.min(0.4, Math.max(0, -ty.value / 900))) * (1 - flight.value * 0.75) },
      { rotate: `${tx.value / 40}deg` },
    ],
  }));

  // ----- Sélection de fichiers -----
  const pickMedia = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images", "videos"],
      allowsMultipleSelection: true,
      selectionLimit: 0,
      quality: 1,
    });
    if (result.canceled) return;
    app.add(
      result.assets.map((a) => {
        const name = a.fileName ?? `${a.type === "video" ? "video" : "photo"}-${Date.now()}.${a.type === "video" ? "mp4" : "jpg"}`;
        return {
          uri: a.uri,
          name,
          size: a.fileSize ?? 0,
          mime: a.mimeType ?? "",
          kind: a.type === "video" ? ("video" as const) : ("image" as const),
          width: a.width,
          height: a.height,
        };
      }),
    );
    setTab("out");
  };
  const pickFiles = async () => {
    const result = await DocumentPicker.getDocumentAsync({ multiple: true, type: "*/*", copyToCacheDirectory: true });
    if (result.canceled) return;
    app.add(
      result.assets.map((a) => ({
        uri: a.uri,
        name: a.name,
        size: a.size ?? 0,
        mime: a.mimeType ?? "",
        kind: kindOf(a.name, a.mimeType ?? ""),
      })),
    );
    setTab("out");
  };

  const menu = () => {
    const forget = () =>
      Alert.alert("Oublier ce PC ?", "Il faudra scanner à nouveau le QR code pour vous reconnecter.", [
        { text: "Annuler", style: "cancel" },
        { text: "Oublier", style: "destructive", onPress: app.unpair },
      ]);
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: ["Appairer un autre PC", "Oublier ce PC", "Annuler"], destructiveButtonIndex: 1, cancelButtonIndex: 2 },
        (i) => (i === 0 ? router.push("/pair") : i === 1 ? forget() : undefined),
      );
    } else {
      Alert.alert("Ellipse", undefined, [
        { text: "Appairer un autre PC", onPress: () => router.push("/pair") },
        { text: "Oublier ce PC", style: "destructive", onPress: forget },
        { text: "Fermer", style: "cancel" },
      ]);
    }
  };

  // ----- Rendu -----
  const columnWidth = (screenWidth - GUTTER * 2 - GAP) / 2;
  const outCols = useMemo(
    () => masonry(app.outgoing, (f) => columnWidth * estimate(f.kind, f.width && f.height ? f.width / f.height : 1)),
    [app.outgoing, columnWidth],
  );
  const inCols = useMemo(() => masonry(app.incoming, (f) => columnWidth * estimate(f.kind)), [app.incoming, columnWidth]);
  const pending = app.outgoing.filter((f) => f.state === "idle" || f.state === "error");

  const statusLabel =
    app.status === "connected" ? app.endpoint!.name : app.status === "unpaired" ? "Non appairé" : "Recherche…";
  const subtitle =
    app.status === "connected"
      ? `Connecté ${app.endpoint!.transport === "usb" ? "par câble USB" : "en Wi-Fi"}`
      : app.status === "searching"
        ? "Recherche de votre PC…"
        : "Appairez votre PC pour commencer.";

  if (app.status === "unpaired") {
    return (
      <View style={styles.screen}>
        <View style={{ position: "absolute", top: islandTop, left: 0, right: 0, zIndex: 30 }}>
          <Island label="Ellipse" online={false} armed={armed} hot={hot} pulse={0} />
        </View>
        <View style={styles.onboarding}>
          <Image source={require("../../assets/splash-icon.png")} style={styles.heroLogo} contentFit="contain" />
          <Text style={styles.heroTitle}>Votre PC, à portée de pouce</Text>
          <Text style={styles.heroBody}>
            Envoyez photos et fichiers vers le Notch de votre PC d’un simple glissement, et recevez ceux qu’il vous envoie.
          </Text>
          <View style={styles.modes}>
            <Mode icon="wifi" label="Wi-Fi" />
            <Mode icon="usb" label="Câble USB" hint={Platform.OS === "ios" ? "Android" : undefined} />
          </View>
        </View>
        <View style={[styles.dock, { paddingBottom: insets.bottom + 14 }]}>
          <Pressable style={styles.primary} onPress={() => router.push("/pair")}>
            <Icon name="scan" size={20} color={colors.ink} />
            <Text style={styles.primaryLabel}>Scanner le QR code du PC</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={{ position: "absolute", top: islandTop, left: 0, right: 0, zIndex: 30 }}>
        <Island label={statusLabel} online={app.status === "connected"} armed={armed} hot={hot} pulse={pulse} />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 72, paddingHorizontal: GUTTER, paddingBottom: insets.bottom + 120 }}
        scrollEnabled={!dragged}
      >
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Ellipse</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
          </View>
          <Pressable style={styles.iconButton} onPress={menu} hitSlop={8}>
            <Icon name="more" size={20} />
          </Pressable>
        </View>

        <View style={styles.tabs}>
          <TabButton label="Envoyer" count={app.outgoing.length} active={tab === "out"} onPress={() => setTab("out")} />
          <TabButton label="Reçus" count={app.incoming.length} active={tab === "in"} onPress={() => setTab("in")} />
        </View>

        {tab === "out" &&
          (app.outgoing.length === 0 ? (
            <Empty
              title="Envoyer vers le PC"
              body="Choisissez des photos ou des fichiers, puis maintenez une carte et glissez-la vers l’île. Un simple toucher l’envoie aussi."
            />
          ) : (
            <View style={styles.grid}>
              {outCols.map((col, i) => (
                <View key={i} style={{ width: columnWidth }}>
                  {col.map((item) => (
                    <OutgoingCard
                      key={item.id}
                      item={item}
                      hidden={dragged?.item.id === item.id}
                      drag={drag}
                      onSend={() => {
                        app.send(item.id);
                        setPulse((p) => p + 1);
                      }}
                      onRemove={() => app.remove(item.id)}
                    />
                  ))}
                </View>
              ))}
            </View>
          ))}

        {tab === "in" &&
          (app.incoming.length === 0 ? (
            <Empty
              title="Rien de reçu pour l’instant"
              body="Sur le PC, déposez un fichier sur la zone Téléphone du Notch : il apparaît ici aussitôt."
            />
          ) : (
            <View style={styles.grid}>
              {inCols.map((col, i) => (
                <View key={i} style={{ width: columnWidth }}>
                  {col.map((item) => (
                    <IncomingCard
                      key={item.id}
                      item={item}
                      previewUri={app.incomingUrl(item.id)}
                      onSave={() => app.save(item.id)}
                    />
                  ))}
                </View>
              ))}
            </View>
          ))}
      </ScrollView>

      {dragged && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.ghost,
            { left: dragged.layout.x, top: dragged.layout.y, width: dragged.layout.width },
            ghost,
          ]}
        >
          <CardVisual
            kind={dragged.item.kind}
            name={dragged.item.name}
            size={dragged.item.size}
            uri={dragged.item.uri}
            aspect={dragged.item.width && dragged.item.height ? dragged.item.width / dragged.item.height : undefined}
          />
        </Animated.View>
      )}

      <View style={[styles.dock, { paddingBottom: insets.bottom + 14 }]}>
        <Pressable style={styles.primary} onPress={pickMedia}>
          <Icon name="image" size={20} color={colors.ink} />
          <Text style={styles.primaryLabel}>Photos</Text>
        </Pressable>
        <Pressable style={styles.secondary} onPress={pickFiles}>
          <Icon name="file" size={19} />
          <Text style={styles.secondaryLabel}>Fichiers</Text>
        </Pressable>
        {pending.length > 1 && app.status === "connected" && (
          <Pressable
            style={styles.secondary}
            onPress={() => {
              pending.forEach((f) => app.send(f.id));
              setPulse((p) => p + 1);
            }}
          >
            <Icon name="arrowUp" size={19} />
          </Pressable>
        )}
      </View>
    </View>
  );
}

function TabButton({ label, count, active, onPress }: { label: string; count: number; active: boolean; onPress(): void }) {
  return (
    <Pressable style={[styles.tab, active && styles.tabActive]} onPress={onPress}>
      <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{label}</Text>
      <View style={[styles.count, active && styles.countActive]}>
        <Text style={[styles.countLabel, active && styles.tabLabelActive]}>{count}</Text>
      </View>
    </Pressable>
  );
}

function Empty({ title, body }: { title: string; body: string }) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyArt}>
        <View style={styles.emptyPill} />
        <View style={styles.emptySheet}>
          <Icon name="arrowUp" size={22} color={colors.muted} />
        </View>
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyBody}>{body}</Text>
    </View>
  );
}

function Mode({ icon, label, hint }: { icon: "wifi" | "usb"; label: string; hint?: string }) {
  return (
    <View style={styles.mode}>
      <Icon name={icon} size={18} />
      <Text style={styles.modeLabel}>{label}</Text>
      {hint && <Text style={styles.modeHint}>{hint}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ink },
  header: { flexDirection: "row", alignItems: "flex-start" },
  title: { color: colors.paper, fontSize: 34, fontWeight: "700", letterSpacing: -0.8 },
  subtitle: { marginTop: 4, color: colors.muted, fontSize: 15 },
  iconButton: {
    width: 40,
    height: 40,
    marginTop: 4,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.card,
  },
  tabs: { flexDirection: "row", gap: 6, marginTop: 22, marginBottom: 16 },
  tab: {
    flex: 1,
    height: 42,
    borderRadius: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    backgroundColor: colors.card,
  },
  tabActive: { backgroundColor: colors.paper },
  tabLabel: { color: colors.muted, fontSize: 15, fontWeight: "600" },
  tabLabelActive: { color: colors.ink },
  count: { minWidth: 22, height: 22, paddingHorizontal: 6, borderRadius: 11, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(138,138,142,0.25)" },
  countActive: { backgroundColor: "rgba(10,10,10,0.12)" },
  countLabel: { color: colors.muted, fontSize: 12, fontWeight: "600" },
  grid: { flexDirection: "row", justifyContent: "space-between" },
  ghost: { position: "absolute", zIndex: 40, borderRadius: 20, overflow: "hidden", backgroundColor: colors.card },
  empty: { alignItems: "center", paddingTop: 36, paddingHorizontal: 16 },
  emptyArt: { width: 150, height: 120, alignItems: "center", marginBottom: 20 },
  emptyPill: { width: 92, height: 28, borderRadius: 14, backgroundColor: colors.black, borderWidth: 1, borderColor: colors.line },
  emptySheet: {
    position: "absolute",
    bottom: 0,
    width: 70,
    height: 76,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.card,
  },
  emptyTitle: { color: colors.paper, fontSize: 19, fontWeight: "600" },
  emptyBody: { marginTop: 6, maxWidth: 290, color: colors.muted, fontSize: 14, lineHeight: 20, textAlign: "center" },
  dock: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    gap: 10,
    paddingTop: 16,
    paddingHorizontal: GUTTER,
    backgroundColor: "rgba(10,10,10,0.92)",
  },
  primary: {
    flex: 1,
    height: 56,
    borderRadius: 28,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.paper,
  },
  primaryLabel: { color: colors.ink, fontSize: 16, fontWeight: "600" },
  secondary: {
    height: 56,
    paddingHorizontal: 20,
    borderRadius: 28,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.card,
  },
  secondaryLabel: { color: colors.paper, fontSize: 15, fontWeight: "600" },
  onboarding: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 28, paddingBottom: 80 },
  heroLogo: { width: 88, height: 88, marginBottom: 24 },
  heroTitle: { color: colors.paper, fontSize: 28, fontWeight: "700", letterSpacing: -0.6, textAlign: "center" },
  heroBody: { marginTop: 10, color: colors.muted, fontSize: 16, lineHeight: 23, textAlign: "center" },
  modes: { flexDirection: "row", gap: 10, marginTop: 28 },
  mode: { flexDirection: "row", alignItems: "center", gap: 8, height: 40, paddingHorizontal: 14, borderRadius: 20, backgroundColor: colors.card },
  modeLabel: { color: colors.paper, fontSize: 14, fontWeight: "600" },
  modeHint: { color: colors.muted, fontSize: 12 },
});
