import React, { useCallback } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useListSignals } from "@workspace/api-client-react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useAuth } from "@clerk/expo";
import { useColors } from "@/hooks/useColors";

// @ts-ignore
type Signal = {
  id: string;
  symbol: string;
  side: "LONG" | "SHORT";
  entry: number;
  stop?: number | null;
  target?: number | null;
  confidence: number;
  outcome?: string | null;
  pnlPct?: number | null;
  createdAt: string;
};

function ConfidenceBar({ value, colors }: { value: number; colors: any }) {
  const pct = Math.round(value * 100);
  const color =
    pct >= 75 ? colors.primary : pct >= 50 ? colors.amber : colors.destructive;
  return (
    <View style={[styles.confBar, { backgroundColor: colors.muted }]}>
      <View style={[styles.confFill, { width: `${pct}%` as any, backgroundColor: color }]} />
    </View>
  );
}

function SignalCard({ signal, colors }: { signal: Signal; colors: any }) {
  const isLong = signal.side === "LONG";
  const sideColor = isLong ? colors.primary : colors.destructive;
  const sideCardBg = isLong
    ? "rgba(0,229,160,0.06)"
    : "rgba(255,62,62,0.06)";
  const sideBorder = isLong
    ? "rgba(0,229,160,0.25)"
    : "rgba(255,62,62,0.25)";

  const date = new Date(signal.createdAt);
  const timeStr = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <View style={[styles.card, { backgroundColor: sideCardBg, borderColor: sideBorder }]}>
      <View style={styles.cardHeader}>
        <View style={styles.symbolRow}>
          <Text style={[styles.symbol, { color: colors.foreground }]}>{signal.symbol}</Text>
          <View style={[styles.sideBadge, { backgroundColor: sideColor + "22", borderColor: sideColor }]}>
            <Text style={[styles.sideText, { color: sideColor }]}>{signal.side}</Text>
          </View>
        </View>
        <Text style={[styles.time, { color: colors.mutedForeground }]}>{timeStr}</Text>
      </View>

      <View style={styles.priceRow}>
        <View style={styles.priceItem}>
          <Text style={[styles.priceLabel, { color: colors.mutedForeground }]}>ENTRY</Text>
          <Text style={[styles.priceValue, { color: colors.foreground }]}>
            ${signal.entry.toLocaleString()}
          </Text>
        </View>
        {signal.stop != null && (
          <View style={styles.priceItem}>
            <Text style={[styles.priceLabel, { color: colors.mutedForeground }]}>STOP</Text>
            <Text style={[styles.priceValue, { color: colors.destructive }]}>
              ${signal.stop.toLocaleString()}
            </Text>
          </View>
        )}
        {signal.target != null && (
          <View style={styles.priceItem}>
            <Text style={[styles.priceLabel, { color: colors.mutedForeground }]}>TARGET</Text>
            <Text style={[styles.priceValue, { color: colors.primary }]}>
              ${signal.target.toLocaleString()}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.confRow}>
        <Text style={[styles.confLabel, { color: colors.mutedForeground }]}>
          CONFIDENCE
        </Text>
        <Text style={[styles.confPct, { color: colors.foreground }]}>
          {Math.round(signal.confidence * 100)}%
        </Text>
      </View>
      <ConfidenceBar value={signal.confidence} colors={colors} />

      {signal.pnlPct != null && (
        <View style={styles.outcomeRow}>
          <Text style={[styles.outcomeLabel, { color: colors.mutedForeground }]}>
            PNL
          </Text>
          <Text
            style={[
              styles.outcomeValue,
              { color: signal.pnlPct >= 0 ? colors.primary : colors.destructive },
            ]}
          >
            {signal.pnlPct >= 0 ? "+" : ""}
            {signal.pnlPct.toFixed(2)}%
          </Text>
        </View>
      )}
    </View>
  );
}

export default function SignalsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { signOut } = useAuth();

  const { data: signals = [], isLoading, refetch, isFetching } = useListSignals();

  const onRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const webTopPad = Platform.OS === "web" ? 67 : 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + webTopPad,
            borderBottomColor: colors.border,
            backgroundColor: colors.card,
          },
        ]}
      >
        <View style={styles.headerLeft}>
          <Text style={[styles.headerBrand, { color: colors.primary }]}>WAR ROOM</Text>
          <View style={styles.liveRow}>
            <View style={[styles.liveDot, { backgroundColor: colors.primary }]} />
            <Text style={[styles.liveText, { color: colors.mutedForeground }]}>LIVE</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
            SIGNAL LOG
          </Text>
          <Pressable
            onPress={() => signOut()}
            style={({ pressed }) => [
              styles.signOutBtn,
              { borderColor: colors.border, opacity: pressed ? 0.6 : 1 },
            ]}
          >
            <Feather name="log-out" size={14} color={colors.mutedForeground} />
          </Pressable>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={signals as Signal[]}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <SignalCard signal={item} colors={colors} />}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: insets.bottom + (Platform.OS === "web" ? 84 : 80) },
          ]}
          refreshControl={
            <RefreshControl
              refreshing={isFetching && !isLoading}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Feather name="activity" size={40} color={colors.mutedForeground} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
                No Signals Yet
              </Text>
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                Signals will appear here when they are generated.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  headerLeft: { gap: 4 },
  headerBrand: {
    fontFamily: "Inter_700Bold",
    fontSize: 20,
    letterSpacing: 4,
  },
  liveRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  liveText: {
    fontFamily: "Inter_500Medium",
    fontSize: 9,
    letterSpacing: 2,
  },
  headerRight: {
    alignItems: "flex-end",
    gap: 8,
  },
  headerSub: {
    fontFamily: "Inter_500Medium",
    fontSize: 10,
    letterSpacing: 2,
  },
  signOutBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  list: { padding: 16, gap: 12 },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    gap: 10,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  symbolRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  symbol: { fontFamily: "Inter_700Bold", fontSize: 18, letterSpacing: 1 },
  sideBadge: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  sideText: { fontFamily: "Inter_700Bold", fontSize: 11, letterSpacing: 1 },
  time: { fontFamily: "Inter_400Regular", fontSize: 12 },
  priceRow: { flexDirection: "row", gap: 20 },
  priceItem: { gap: 2 },
  priceLabel: { fontFamily: "Inter_500Medium", fontSize: 9, letterSpacing: 1 },
  priceValue: { fontFamily: "Inter_600SemiBold", fontSize: 15 },
  confRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  confLabel: { fontFamily: "Inter_500Medium", fontSize: 9, letterSpacing: 1 },
  confPct: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  confBar: { height: 4, borderRadius: 2, overflow: "hidden" },
  confFill: { height: "100%" as any, borderRadius: 2 },
  outcomeRow: { flexDirection: "row", justifyContent: "space-between" },
  outcomeLabel: { fontFamily: "Inter_500Medium", fontSize: 11, letterSpacing: 1 },
  outcomeValue: { fontFamily: "Inter_700Bold", fontSize: 14 },
  empty: { alignItems: "center", paddingTop: 80, gap: 12 },
  emptyTitle: { fontFamily: "Inter_600SemiBold", fontSize: 18 },
  emptyText: { fontFamily: "Inter_400Regular", fontSize: 14, textAlign: "center", paddingHorizontal: 32 },
});
