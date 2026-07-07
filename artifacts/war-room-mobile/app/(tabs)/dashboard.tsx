import React from "react";
import { Platform, StyleSheet, View, ActivityIndicator, Text } from "react-native";
import { WebView } from "react-native-webview";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

const DOMAIN = process.env.EXPO_PUBLIC_DOMAIN ?? "";
const DASHBOARD_URL = DOMAIN
  ? `https://${DOMAIN}/war-room.html`
  : "about:blank";

export default function DashboardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const webTopPad = Platform.OS === "web" ? 67 : 0;

  if (Platform.OS === "web") {
    return (
      <View style={[styles.webContainer, { paddingTop: insets.top + webTopPad, backgroundColor: colors.background }]}>
        <iframe
          src={DASHBOARD_URL}
          style={{ width: "100%", height: "100%", border: "none" }}
          title="WAR ROOM Dashboard"
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      <WebView
        source={{ uri: DASHBOARD_URL }}
        style={styles.webview}
        startInLoadingState
        renderLoading={() => (
          <View style={[StyleSheet.absoluteFill, styles.loading, { backgroundColor: colors.background }]}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
              Loading Dashboard...
            </Text>
          </View>
        )}
        onError={() => null}
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  webContainer: { flex: 1 },
  webview: { flex: 1, backgroundColor: "transparent" },
  loading: {
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  loadingText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    letterSpacing: 1,
  },
});
