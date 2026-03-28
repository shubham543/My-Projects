import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, TouchableOpacity, Text, StyleSheet, Modal, Pressable } from 'react-native';
import { useState } from 'react';
import { useTheme } from '../../src/context/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type ThemeMode = 'light' | 'dark' | 'auto';

export default function TabLayout() {
  const { colors, mode, setMode, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [showTheme, setShowTheme] = useState(false);

  const modes: { key: ThemeMode; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { key: 'light', label: 'Light', icon: 'sunny-outline' },
    { key: 'dark', label: 'Dark', icon: 'moon-outline' },
    { key: 'auto', label: 'Auto', icon: 'phone-portrait-outline' },
  ];

  return (
    <>
      <Tabs
        screenOptions={{
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.textMain,
          headerTitleStyle: { fontWeight: '800', fontSize: 18 },
          headerRight: () => (
            <TouchableOpacity
              testID="theme-toggle"
              onPress={() => setShowTheme(true)}
              style={{ marginRight: 16 }}
            >
              <Ionicons
                name={isDark ? 'moon' : 'sunny'}
                size={22}
                color={colors.primary}
              />
            </TouchableOpacity>
          ),
          tabBarStyle: {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            borderTopWidth: 1,
            paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
            paddingTop: 8,
            height: 60 + (insets.bottom > 0 ? insets.bottom : 8),
          },
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textMuted,
          tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Log',
            headerTitle: 'Daily Log',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="create-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="review"
          options={{
            title: 'Review',
            headerTitle: 'AI Review',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="bulb-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="stats"
          options={{
            title: 'Stats',
            headerTitle: 'Weekly Stats',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="bar-chart-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="library"
          options={{
            title: 'Library',
            headerTitle: 'Content Library',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="library-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="history"
          options={{
            title: 'History',
            headerTitle: 'Log History',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="time-outline" size={size} color={color} />
            ),
          }}
        />
      </Tabs>

      <Modal visible={showTheme} transparent animationType="fade">
        <Pressable style={s.overlay} onPress={() => setShowTheme(false)}>
          <View style={[s.modal, { backgroundColor: colors.surface, paddingBottom: insets.bottom + 16 }]}>
            <Text style={[s.modalTitle, { color: colors.textMain }]}>Theme</Text>
            {modes.map((m) => (
              <TouchableOpacity
                key={m.key}
                testID={`theme-option-${m.key}`}
                style={[
                  s.modeBtn,
                  {
                    backgroundColor: mode === m.key ? colors.primary : colors.background,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => { setMode(m.key); setShowTheme(false); }}
              >
                <Ionicons
                  name={m.icon}
                  size={20}
                  color={mode === m.key ? colors.primaryForeground : colors.textMain}
                />
                <Text
                  style={[
                    s.modeTxt,
                    { color: mode === m.key ? colors.primaryForeground : colors.textMain },
                  ]}
                >
                  {m.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modal: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    gap: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 8,
  },
  modeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
  },
  modeTxt: {
    fontSize: 16,
    fontWeight: '600',
  },
});
