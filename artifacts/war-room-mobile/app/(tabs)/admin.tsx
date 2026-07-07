import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  useAdminCheck,
  useAdminListUsers,
  useAdminSetUserRole,
  useAdminDeleteUser,
  useListSignals,
  getAdminListUsersQueryKey,
} from "@workspace/api-client-react";
import { useAuth } from "@clerk/expo";
import { useQueryClient } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

// @ts-ignore
type AdminUser = {
  userId: string;
  email: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  role: "admin" | "user";
  createdAt: string;
};

// @ts-ignore
type Signal = {
  id: string;
  symbol: string;
  side: "LONG" | "SHORT";
  entry: number;
  confidence: number;
  createdAt: string;
};

function UserRow({
  user,
  colors,
  onSetRole,
  onDelete,
}: {
  user: AdminUser;
  colors: any;
  onSetRole: (userId: string, role: "admin" | "user") => void;
  onDelete: (userId: string) => void;
}) {
  return (
    <View style={[styles.userRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.userInfo}>
        <Text style={[styles.userEmail, { color: colors.foreground }]}>{user.email}</Text>
        <View style={styles.userMeta}>
          <View
            style={[
              styles.roleBadge,
              {
                backgroundColor: user.role === "admin" ? colors.primary + "22" : colors.muted,
                borderColor: user.role === "admin" ? colors.primary : colors.border,
              },
            ]}
          >
            <Text
              style={[
                styles.roleText,
                { color: user.role === "admin" ? colors.primary : colors.mutedForeground },
              ]}
            >
              {user.role.toUpperCase()}
            </Text>
          </View>
        </View>
      </View>
      <View style={styles.userActions}>
        <Pressable
          style={[styles.actionBtn, { borderColor: colors.border }]}
          onPress={() => onSetRole(user.userId, user.role === "admin" ? "user" : "admin")}
        >
          <Feather name="shield" size={14} color={colors.accent} />
        </Pressable>
        <Pressable
          style={[styles.actionBtn, { borderColor: colors.border }]}
          onPress={() => onDelete(user.userId)}
        >
          <Feather name="trash-2" size={14} color={colors.destructive} />
        </Pressable>
      </View>
    </View>
  );
}

export default function AdminScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { signOut } = useAuth();
  const queryClient = useQueryClient();

  const [tab, setTab] = useState<"users" | "signals">("users");

  const { data: adminStatus, isLoading: checkLoading } = useAdminCheck();
  const isAdmin = adminStatus?.isAdmin ?? false;

  const { data: users = [], isLoading: usersLoading } = useAdminListUsers({
    query: { enabled: isAdmin },
  });
  const { data: signals = [], isLoading: signalsLoading } = useListSignals({
    query: { enabled: isAdmin },
  });

  const setRoleMutation = useAdminSetUserRole({
    mutation: {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getAdminListUsersQueryKey() }),
    },
  });
  const deleteMutation = useAdminDeleteUser({
    mutation: {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getAdminListUsersQueryKey() }),
    },
  });

  const handleSetRole = (userId: string, role: "admin" | "user") => {
    setRoleMutation.mutate({ userId, data: { role } });
  };

  const handleDelete = (userId: string) => {
    Alert.alert("Delete User", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => deleteMutation.mutate({ userId }),
      },
    ]);
  };

  const webTopPad = Platform.OS === "web" ? 67 : 0;

  if (checkLoading) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!isAdmin) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
        <Feather name="shield-off" size={48} color={colors.mutedForeground} />
        <Text style={[styles.noAccessTitle, { color: colors.foreground }]}>Access Restricted</Text>
        <Text style={[styles.noAccessText, { color: colors.mutedForeground }]}>
          This area is for administrators only.
        </Text>
      </View>
    );
  }

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
        <View>
          <Text style={[styles.headerBrand, { color: colors.primary }]}>ADMIN</Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>WAR ROOM CONSOLE</Text>
        </View>
        <Pressable
          style={[styles.signOutBtn, { borderColor: colors.border }]}
          onPress={() => signOut()}
        >
          <Feather name="log-out" size={16} color={colors.mutedForeground} />
        </Pressable>
      </View>

      <View style={[styles.tabBar, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Pressable
          style={[styles.tabItem, tab === "users" && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
          onPress={() => setTab("users")}
        >
          <Text style={[styles.tabText, { color: tab === "users" ? colors.primary : colors.mutedForeground }]}>
            Users ({(users as AdminUser[]).length})
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tabItem, tab === "signals" && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
          onPress={() => setTab("signals")}
        >
          <Text style={[styles.tabText, { color: tab === "signals" ? colors.primary : colors.mutedForeground }]}>
            Signals ({(signals as Signal[]).length})
          </Text>
        </Pressable>
      </View>

      {tab === "users" ? (
        usersLoading ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : (
          <FlatList
            data={users as AdminUser[]}
            keyExtractor={(item) => item.userId}
            renderItem={({ item }) => (
              <UserRow
                user={item}
                colors={colors}
                onSetRole={handleSetRole}
                onDelete={handleDelete}
              />
            )}
            contentContainerStyle={[
              styles.list,
              { paddingBottom: insets.bottom + (Platform.OS === "web" ? 84 : 80) },
            ]}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Feather name="users" size={36} color={colors.mutedForeground} />
                <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No users found</Text>
              </View>
            }
          />
        )
      ) : signalsLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={signals as Signal[]}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={[styles.signalRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.sigSymbol, { color: colors.foreground }]}>{item.symbol}</Text>
              <View
                style={[
                  styles.sideBadge,
                  {
                    backgroundColor: item.side === "LONG" ? colors.primary + "22" : colors.destructive + "22",
                    borderColor: item.side === "LONG" ? colors.primary : colors.destructive,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.sideText,
                    { color: item.side === "LONG" ? colors.primary : colors.destructive },
                  ]}
                >
                  {item.side}
                </Text>
              </View>
              <Text style={[styles.sigEntry, { color: colors.mutedForeground }]}>
                ${item.entry.toLocaleString()}
              </Text>
              <Text style={[styles.sigConf, { color: item.confidence >= 0.70 ? colors.primary : colors.amber }]}>
                {Math.round(item.confidence * 100)}%
              </Text>
            </View>
          )}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: insets.bottom + (Platform.OS === "web" ? 84 : 80) },
          ]}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Feather name="activity" size={36} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No signals yet</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  header: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  headerBrand: { fontFamily: "Inter_700Bold", fontSize: 18, letterSpacing: 4 },
  headerSub: { fontFamily: "Inter_500Medium", fontSize: 9, letterSpacing: 2 },
  signOutBtn: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
  },
  tabBar: {
    flexDirection: "row",
    borderBottomWidth: 1,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
  },
  tabText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    letterSpacing: 0.5,
  },
  list: { padding: 16, gap: 10 },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
  },
  userInfo: { flex: 1, gap: 4 },
  userEmail: { fontFamily: "Inter_500Medium", fontSize: 13 },
  userMeta: { flexDirection: "row" },
  roleBadge: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  roleText: { fontFamily: "Inter_700Bold", fontSize: 9, letterSpacing: 1 },
  userActions: { flexDirection: "row", gap: 8 },
  actionBtn: {
    borderWidth: 1,
    borderRadius: 6,
    padding: 8,
  },
  signalRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
  },
  sigSymbol: { fontFamily: "Inter_700Bold", fontSize: 15, flex: 1 },
  sideBadge: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  sideText: { fontFamily: "Inter_700Bold", fontSize: 9, letterSpacing: 1 },
  sigEntry: { fontFamily: "Inter_500Medium", fontSize: 13 },
  sigConf: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  empty: { alignItems: "center", paddingTop: 60, gap: 10 },
  emptyText: { fontFamily: "Inter_400Regular", fontSize: 14 },
  noAccessTitle: { fontFamily: "Inter_600SemiBold", fontSize: 20 },
  noAccessText: { fontFamily: "Inter_400Regular", fontSize: 14, textAlign: "center", paddingHorizontal: 32 },
  amber: "#FFB020",
});
