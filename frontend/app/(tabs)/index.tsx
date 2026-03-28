import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert, Modal, Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../src/context/ThemeContext';
import { api } from '../../src/utils/api';
import {
  DEFAULT_ACTIVITIES, EXTRA_FIELDS, MOODS, ICON_OPTIONS, COLOR_OPTIONS,
  Activity, ExtraField,
} from '../../src/constants/activities';

const today = () => new Date().toISOString().split('T')[0];
const fmtDate = (d: string) => {
  const dt = new Date(d + 'T12:00:00');
  return dt.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
};
const shiftDate = (d: string, n: number) => {
  const dt = new Date(d + 'T12:00:00');
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().split('T')[0];
};

export default function LogScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [date, setDate] = useState(today());
  const [mood, setMood] = useState<string | null>(null);
  const [entries, setEntries] = useState<Record<string, any>>({});
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [customActivities, setCustomActivities] = useState<Activity[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newIcon, setNewIcon] = useState('star-outline');
  const [newColor, setNewColor] = useState('#C17767');
  const [dirty, setDirty] = useState(false);
  const [dropdownField, setDropdownField] = useState<{ actId: string; field: ExtraField } | null>(null);

  const allActivities = [...DEFAULT_ACTIVITIES, ...customActivities];

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [logRes, customRes] = await Promise.all([
        api.get(`/logs/${date}`),
        api.get('/custom-activities'),
      ]);
      setEntries(logRes.entries || {});
      setMood(logRes.mood || null);
      setCustomActivities(
        customRes.map((a: any) => ({
          id: a.id, name: a.name, icon: a.icon || 'star-outline',
          color: a.color || '#888', category: 'hobby' as const, isCustom: true,
        }))
      );
      setDirty(false);
    } catch (e) {
      console.error('Load error:', e);
    }
    setLoading(false);
  }, [date]);

  useEffect(() => { loadData(); }, [loadData]);

  const updateEntry = (actId: string, field: string, value: any) => {
    setEntries((prev) => ({
      ...prev,
      [actId]: { ...(prev[actId] || {}), [field]: value },
    }));
    setDirty(true);
  };

  const toggleExpanded = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.post('/logs', { date, mood, entries });
      setSaveMsg('Saved!');
      setDirty(false);
      setTimeout(() => setSaveMsg(''), 2000);
    } catch (e) {
      Alert.alert('Error', 'Failed to save. Please try again.');
    }
    setSaving(false);
  };

  const handleAddActivity = async () => {
    if (!newName.trim()) return;
    try {
      const res = await api.post('/custom-activities', {
        name: newName.trim(), icon: newIcon, color: newColor,
      });
      setCustomActivities((prev) => [
        ...prev,
        { id: res.id, name: res.name, icon: res.icon, color: res.color, category: 'hobby', isCustom: true },
      ]);
      setNewName('');
      setNewIcon('star-outline');
      setNewColor('#C17767');
      setShowAddModal(false);
    } catch (e) {
      Alert.alert('Error', 'Failed to add activity.');
    }
  };

  const handleDeleteActivity = async (id: string) => {
    Alert.alert('Delete Activity', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/custom-activities/${id}`);
            setCustomActivities((prev) => prev.filter((a) => a.id !== id));
          } catch (e) {
            Alert.alert('Error', 'Failed to delete.');
          }
        },
      },
    ]);
  };

  const renderStars = (actId: string) => {
    const quality = entries[actId]?.quality || 0;
    return (
      <View style={s.starsRow}>
        <Text style={[s.fieldLabel, { color: colors.textMuted }]}>Quality</Text>
        <View style={s.stars}>
          {[1, 2, 3, 4, 5].map((n) => (
            <TouchableOpacity
              key={n}
              testID={`star-${actId}-${n}`}
              onPress={() => updateEntry(actId, 'quality', n)}
            >
              <Ionicons
                name={n <= quality ? 'star' : 'star-outline'}
                size={26}
                color={n <= quality ? colors.accent : colors.textMuted}
              />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const renderField = (actId: string, field: ExtraField) => {
    const val = entries[actId]?.[field.key] || '';

    if (field.type === 'select' && field.options) {
      return (
        <View key={field.key} style={s.fieldWrap}>
          <Text style={[s.fieldLabel, { color: colors.textMuted }]}>{field.label}</Text>
          <TouchableOpacity
            testID={`dropdown-${actId}-${field.key}`}
            style={[
              s.dropdownBtn,
              {
                backgroundColor: colors.background,
                borderColor: val ? colors.primary : colors.border,
              },
            ]}
            onPress={() => setDropdownField({ actId, field })}
            activeOpacity={0.7}
          >
            <Text
              style={[
                s.dropdownText,
                { color: val ? colors.textMain : colors.textMuted },
              ]}
              numberOfLines={1}
            >
              {val || `Select ${field.label}...`}
            </Text>
            <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View key={field.key} style={s.fieldWrap}>
        <Text style={[s.fieldLabel, { color: colors.textMuted }]}>{field.label}</Text>
        <TextInput
          testID={`field-${actId}-${field.key}`}
          style={[
            s.input,
            field.type === 'multiline' && s.multiline,
            { backgroundColor: colors.background, color: colors.textMain, borderColor: colors.border },
          ]}
          value={String(val)}
          onChangeText={(t) => updateEntry(actId, field.key, field.type === 'number' ? t.replace(/[^0-9]/g, '') : t)}
          placeholder={field.label}
          placeholderTextColor={colors.textMuted}
          multiline={field.type === 'multiline'}
          numberOfLines={field.type === 'multiline' ? 3 : 1}
          keyboardType={field.type === 'number' ? 'numeric' : 'default'}
        />
      </View>
    );
  };

  const hasEntryData = (actId: string) => {
    const e = entries[actId];
    if (!e) return false;
    return Object.values(e).some((v) => v !== '' && v !== 0 && v !== null && v !== undefined);
  };

  if (loading) {
    return (
      <View style={[s.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 100 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Date Navigator */}
        <View style={[s.dateNav, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <TouchableOpacity testID="date-prev" onPress={() => setDate(shiftDate(date, -1))} style={s.dateBtn}>
            <Ionicons name="chevron-back" size={24} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity testID="date-today" onPress={() => setDate(today())}>
            <Text style={[s.dateText, { color: colors.textMain }]}>{fmtDate(date)}</Text>
            {date === today() && <Text style={[s.todayBadge, { color: colors.primary }]}>Today</Text>}
          </TouchableOpacity>
          <TouchableOpacity testID="date-next" onPress={() => setDate(shiftDate(date, 1))} style={s.dateBtn}>
            <Ionicons name="chevron-forward" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Mood Selector */}
        <View style={s.section}>
          <Text style={[s.sectionTitle, { color: colors.textMain }]}>How are you feeling?</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={s.moodRow}>
              {MOODS.map((m) => (
                <TouchableOpacity
                  key={m.id}
                  testID={`mood-${m.id}`}
                  style={[
                    s.moodPill,
                    {
                      backgroundColor: mood === m.id ? m.color : colors.surface,
                      borderColor: mood === m.id ? m.color : colors.border,
                    },
                  ]}
                  onPress={() => { setMood(m.id); setDirty(true); }}
                >
                  <Text style={s.moodEmoji}>{m.emoji}</Text>
                  <Text style={[s.moodLabel, { color: mood === m.id ? '#fff' : colors.textMuted }]}>
                    {m.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Activities */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={[s.sectionTitle, { color: colors.textMain }]}>Activities</Text>
            <TouchableOpacity
              testID="add-activity-btn"
              style={[s.addBtn, { backgroundColor: colors.primary }]}
              onPress={() => setShowAddModal(true)}
            >
              <Ionicons name="add" size={18} color={colors.primaryForeground} />
              <Text style={[s.addBtnText, { color: colors.primaryForeground }]}>Add</Text>
            </TouchableOpacity>
          </View>

          {allActivities.map((act) => {
            const isExpanded = expanded.has(act.id);
            const hasData = hasEntryData(act.id);
            const extraFields = EXTRA_FIELDS[act.id] || [];

            return (
              <View
                key={act.id}
                style={[s.actCard, { backgroundColor: colors.surface, borderColor: hasData ? act.color : colors.border }]}
              >
                <TouchableOpacity
                  testID={`activity-card-${act.id}`}
                  style={s.actHeader}
                  onPress={() => toggleExpanded(act.id)}
                  activeOpacity={0.7}
                >
                  <View style={[s.actIconWrap, { backgroundColor: act.color + '20' }]}>
                    <Ionicons name={act.icon as any} size={22} color={act.color} />
                  </View>
                  <View style={s.actInfo}>
                    <Text style={[s.actName, { color: colors.textMain }]}>{act.name}</Text>
                    {hasData && (
                      <Text style={[s.actTime, { color: colors.textMuted }]}>
                        {entries[act.id]?.startTime && entries[act.id]?.endTime
                          ? `${entries[act.id].startTime} - ${entries[act.id].endTime}`
                          : 'Logged'}
                      </Text>
                    )}
                  </View>
                  <View style={s.actRight}>
                    {hasData && <View style={[s.dot, { backgroundColor: colors.success }]} />}
                    {act.isCustom && (
                      <TouchableOpacity
                        testID={`delete-activity-${act.id}`}
                        onPress={() => handleDeleteActivity(act.id)}
                        style={s.deleteBtn}
                      >
                        <Ionicons name="trash-outline" size={16} color={colors.destructive} />
                      </TouchableOpacity>
                    )}
                    <Ionicons
                      name={isExpanded ? 'chevron-up' : 'chevron-down'}
                      size={20}
                      color={colors.textMuted}
                    />
                  </View>
                </TouchableOpacity>

                {isExpanded && (
                  <View style={[s.actBody, { borderTopColor: colors.border }]}>
                    {/* Time inputs */}
                    <View style={s.timeRow}>
                      <View style={s.timeField}>
                        <Text style={[s.fieldLabel, { color: colors.textMuted }]}>Start</Text>
                        <TextInput
                          testID={`time-start-${act.id}`}
                          style={[s.input, s.timeInput, { backgroundColor: colors.background, color: colors.textMain, borderColor: colors.border }]}
                          value={entries[act.id]?.startTime || ''}
                          onChangeText={(t) => updateEntry(act.id, 'startTime', t)}
                          placeholder="08:00"
                          placeholderTextColor={colors.textMuted}
                        />
                      </View>
                      <View style={s.timeField}>
                        <Text style={[s.fieldLabel, { color: colors.textMuted }]}>End</Text>
                        <TextInput
                          testID={`time-end-${act.id}`}
                          style={[s.input, s.timeInput, { backgroundColor: colors.background, color: colors.textMain, borderColor: colors.border }]}
                          value={entries[act.id]?.endTime || ''}
                          onChangeText={(t) => updateEntry(act.id, 'endTime', t)}
                          placeholder="09:00"
                          placeholderTextColor={colors.textMuted}
                        />
                      </View>
                    </View>

                    {renderStars(act.id)}

                    {/* Common fields */}
                    <View style={s.fieldWrap}>
                      <Text style={[s.fieldLabel, { color: colors.textMuted }]}>Notes</Text>
                      <TextInput
                        testID={`notes-${act.id}`}
                        style={[s.input, s.multiline, { backgroundColor: colors.background, color: colors.textMain, borderColor: colors.border }]}
                        value={entries[act.id]?.notes || ''}
                        onChangeText={(t) => updateEntry(act.id, 'notes', t)}
                        placeholder="What did you do?"
                        placeholderTextColor={colors.textMuted}
                        multiline
                        numberOfLines={3}
                      />
                    </View>

                    <View style={s.fieldWrap}>
                      <Text style={[s.fieldLabel, { color: colors.textMuted }]}>What I Learned</Text>
                      <TextInput
                        testID={`learned-${act.id}`}
                        style={[s.input, s.multiline, { backgroundColor: colors.background, color: colors.textMain, borderColor: colors.border }]}
                        value={entries[act.id]?.learned || ''}
                        onChangeText={(t) => updateEntry(act.id, 'learned', t)}
                        placeholder="Key takeaways..."
                        placeholderTextColor={colors.textMuted}
                        multiline
                        numberOfLines={2}
                      />
                    </View>

                    <View style={s.fieldWrap}>
                      <Text style={[s.fieldLabel, { color: colors.textMuted }]}>Sources</Text>
                      <TextInput
                        testID={`sources-${act.id}`}
                        style={[s.input, { backgroundColor: colors.background, color: colors.textMain, borderColor: colors.border }]}
                        value={entries[act.id]?.sources || ''}
                        onChangeText={(t) => updateEntry(act.id, 'sources', t)}
                        placeholder="URLs, books, videos..."
                        placeholderTextColor={colors.textMuted}
                      />
                    </View>

                    {/* Activity-specific fields */}
                    {extraFields.length > 0 && (
                      <View style={[s.extraSection, { borderTopColor: colors.border }]}>
                        <Text style={[s.extraTitle, { color: colors.accent }]}>
                          {act.name} Details
                        </Text>
                        {extraFields.map((f) => renderField(act.id, f))}
                      </View>
                    )}
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Save Button */}
      <View style={[s.saveBar, { backgroundColor: colors.surface, borderTopColor: colors.border, paddingBottom: insets.bottom + 8 }]}>
        {saveMsg ? (
          <Text style={[s.savedText, { color: colors.success }]}>{saveMsg}</Text>
        ) : dirty ? (
          <Text style={[s.unsavedText, { color: colors.accent }]}>Unsaved changes</Text>
        ) : null}
        <TouchableOpacity
          testID="save-log-btn"
          style={[s.saveBtn, { backgroundColor: colors.primary, opacity: saving ? 0.6 : 1 }]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color={colors.primaryForeground} />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={20} color={colors.primaryForeground} />
              <Text style={[s.saveBtnText, { color: colors.primaryForeground }]}>Save Log</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Dropdown Selection Modal */}
      <Modal visible={!!dropdownField} transparent animationType="fade">
        <Pressable style={s.dropdownOverlay} onPress={() => setDropdownField(null)}>
          <View style={[s.dropdownModal, { backgroundColor: colors.surface }]}>
            <View style={s.dropdownHeader}>
              <Text style={[s.dropdownTitle, { color: colors.textMain }]}>
                {dropdownField?.field.label || 'Select'}
              </Text>
              <TouchableOpacity testID="dropdown-close" onPress={() => setDropdownField(null)}>
                <Ionicons name="close" size={24} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            <ScrollView style={s.dropdownScroll} showsVerticalScrollIndicator={false}>
              {dropdownField?.field.options?.map((option) => {
                const isSelected = entries[dropdownField.actId]?.[dropdownField.field.key] === option;
                return (
                  <TouchableOpacity
                    key={option}
                    testID={`dropdown-option-${option.toLowerCase().replace(/\s+/g, '-')}`}
                    style={[
                      s.dropdownOption,
                      {
                        backgroundColor: isSelected ? colors.primary : 'transparent',
                        borderColor: isSelected ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => {
                      if (dropdownField) {
                        updateEntry(dropdownField.actId, dropdownField.field.key, option);
                      }
                      setDropdownField(null);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        s.dropdownOptionText,
                        { color: isSelected ? colors.primaryForeground : colors.textMain },
                      ]}
                    >
                      {option}
                    </Text>
                    {isSelected && (
                      <Ionicons name="checkmark" size={20} color={colors.primaryForeground} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>

      {/* Add Activity Modal */}
      <Modal visible={showAddModal} transparent animationType="slide">
        <Pressable style={s.modalOverlay} onPress={() => setShowAddModal(false)}>
          <Pressable style={[s.modalContent, { backgroundColor: colors.surface }]} onPress={() => {}}>
            <Text style={[s.modalTitle, { color: colors.textMain }]}>Add Custom Activity</Text>

            <Text style={[s.fieldLabel, { color: colors.textMuted }]}>Name</Text>
            <TextInput
              testID="new-activity-name"
              style={[s.input, { backgroundColor: colors.background, color: colors.textMain, borderColor: colors.border }]}
              value={newName}
              onChangeText={setNewName}
              placeholder="Activity name"
              placeholderTextColor={colors.textMuted}
            />

            <Text style={[s.fieldLabel, { color: colors.textMuted, marginTop: 12 }]}>Icon</Text>
            <View style={s.iconGrid}>
              {ICON_OPTIONS.map((ico) => (
                <TouchableOpacity
                  key={ico}
                  testID={`icon-option-${ico}`}
                  style={[
                    s.iconOption,
                    {
                      backgroundColor: newIcon === ico ? colors.primary : colors.background,
                      borderColor: newIcon === ico ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => setNewIcon(ico)}
                >
                  <Ionicons
                    name={ico as any}
                    size={20}
                    color={newIcon === ico ? colors.primaryForeground : colors.textMain}
                  />
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[s.fieldLabel, { color: colors.textMuted, marginTop: 12 }]}>Color</Text>
            <View style={s.colorGrid}>
              {COLOR_OPTIONS.map((c) => (
                <TouchableOpacity
                  key={c}
                  testID={`color-option-${c}`}
                  style={[
                    s.colorOption,
                    { backgroundColor: c, borderWidth: newColor === c ? 3 : 0, borderColor: colors.textMain },
                  ]}
                  onPress={() => setNewColor(c)}
                />
              ))}
            </View>

            <View style={s.modalActions}>
              <TouchableOpacity
                testID="cancel-add-activity"
                style={[s.modalBtn, { borderColor: colors.border, borderWidth: 1 }]}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={{ color: colors.textMain, fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                testID="confirm-add-activity"
                style={[s.modalBtn, { backgroundColor: colors.primary }]}
                onPress={handleAddActivity}
              >
                <Text style={{ color: colors.primaryForeground, fontWeight: '600' }}>Add Activity</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  dateNav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1,
  },
  dateBtn: { padding: 8 },
  dateText: { fontSize: 18, fontWeight: '800', textAlign: 'center' },
  todayBadge: { fontSize: 12, fontWeight: '600', textAlign: 'center', marginTop: 2 },
  section: { paddingHorizontal: 16, marginTop: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '800' },
  moodRow: { flexDirection: 'row', gap: 8, paddingVertical: 4 },
  moodPill: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14,
    paddingVertical: 10, borderRadius: 20, borderWidth: 1, gap: 6,
  },
  moodEmoji: { fontSize: 18 },
  moodLabel: { fontSize: 13, fontWeight: '600' },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12,
    paddingVertical: 6, borderRadius: 8, gap: 4,
  },
  addBtnText: { fontSize: 13, fontWeight: '700' },
  actCard: { borderRadius: 12, borderWidth: 1, marginBottom: 10, overflow: 'hidden' },
  actHeader: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  actIconWrap: { width: 42, height: 42, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  actInfo: { flex: 1 },
  actName: { fontSize: 15, fontWeight: '700' },
  actTime: { fontSize: 12, marginTop: 2 },
  actRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  deleteBtn: { padding: 4 },
  actBody: { paddingHorizontal: 14, paddingBottom: 14, borderTopWidth: 1 },
  timeRow: { flexDirection: 'row', gap: 12, marginTop: 12 },
  timeField: { flex: 1 },
  fieldWrap: { marginTop: 12 },
  fieldLabel: { fontSize: 12, fontWeight: '600', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15 },
  timeInput: { textAlign: 'center' },
  multiline: { minHeight: 70, textAlignVertical: 'top' },
  starsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  stars: { flexDirection: 'row', gap: 4 },
  extraSection: { marginTop: 12, paddingTop: 12, borderTopWidth: 1 },
  extraTitle: { fontSize: 13, fontWeight: '700', marginBottom: 4 },
  saveBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 12, borderTopWidth: 1,
  },
  savedText: { fontSize: 14, fontWeight: '600' },
  unsavedText: { fontSize: 13, fontWeight: '500' },
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20,
    paddingVertical: 12, borderRadius: 10, gap: 8,
  },
  saveBtnText: { fontSize: 15, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, maxHeight: '80%' },
  modalTitle: { fontSize: 20, fontWeight: '800', marginBottom: 16 },
  iconGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  iconOption: { width: 42, height: 42, borderRadius: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  colorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  colorOption: { width: 36, height: 36, borderRadius: 18 },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 20 },
  modalBtn: { flex: 1, paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  dropdownBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 12,
  },
  dropdownText: { fontSize: 15, flex: 1 },
  dropdownOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center',
    paddingHorizontal: 24,
  },
  dropdownModal: {
    borderRadius: 16, maxHeight: '60%', overflow: 'hidden',
  },
  dropdownHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12,
  },
  dropdownTitle: { fontSize: 18, fontWeight: '800' },
  dropdownScroll: { paddingHorizontal: 12, paddingBottom: 16 },
  dropdownOption: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 14, paddingHorizontal: 16, borderRadius: 10,
    borderWidth: 1, marginBottom: 6,
  },
  dropdownOptionText: { fontSize: 15, fontWeight: '600' },
});
