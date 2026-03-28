import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/context/ThemeContext';
import { api } from '../../src/utils/api';
import { DEFAULT_ACTIVITIES } from '../../src/constants/activities';

const fmtDate = (d: string) => {
  const dt = new Date(d + 'T12:00:00');
  return dt.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
};

const actMap: Record<string, { name: string; icon: string; color: string }> = {};
DEFAULT_ACTIVITIES.forEach((a) => { actMap[a.id] = { name: a.name, icon: a.icon, color: a.color }; });

const MOOD_MAP: Record<string, string> = {
  productive: '\u{1F680}',
  focused: '\u{1F3AF}',
  happy: '\u{1F60A}',
  relaxed: '\u{1F60C}',
  tired: '\u{1F634}',
  stressed: '\u{1F630}',
  neutral: '\u{1F610}',
};

export default function HistoryScreen() {
  const { colors } = useTheme();
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedDate, setExpandedDate] = useState<string | null>(null);
  const [detail, setDetail] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/history');
      setHistory(res);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadHistory();
    setRefreshing(false);
  };

  const toggleDate = async (date: string) => {
    if (expandedDate === date) {
      setExpandedDate(null);
      setDetail(null);
      return;
    }
    setExpandedDate(date);
    setDetailLoading(true);
    try {
      const res = await api.get(`/history/${date}`);
      setDetail(res);
    } catch (e) {
      console.error(e);
    }
    setDetailLoading(false);
  };

  if (loading) {
    return (
      <View style={[s.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={[s.container, { backgroundColor: colors.background }]}
      contentContainerStyle={s.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      {history.length === 0 ? (
        <View style={s.emptyState}>
          <Ionicons name="time-outline" size={48} color={colors.textMuted} />
          <Text style={[s.emptyTitle, { color: colors.textMain }]}>No history yet</Text>
          <Text style={[s.emptySubtitle, { color: colors.textMuted }]}>
            Start logging your daily activities to build your history.
          </Text>
        </View>
      ) : (
        history.map((item) => {
          const isExpanded = expandedDate === item.date;
          const moodEmoji = MOOD_MAP[item.mood] || '';

          return (
            <View key={item.date}>
              <TouchableOpacity
                testID={`history-item-${item.date}`}
                style={[
                  s.historyCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: isExpanded ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => toggleDate(item.date)}
                activeOpacity={0.7}
              >
                <View style={s.historyLeft}>
                  <Text style={[s.historyDate, { color: colors.textMain }]}>{fmtDate(item.date)}</Text>
                  <View style={s.historyMeta}>
                    {moodEmoji ? <Text style={s.moodEmoji}>{moodEmoji}</Text> : null}
                    <Text style={[s.historyCount, { color: colors.textMuted }]}>
                      {item.activity_count} {item.activity_count === 1 ? 'activity' : 'activities'}
                    </Text>
                  </View>
                  <View style={s.activityTags}>
                    {item.activities.slice(0, 5).map((actId: string) => {
                      const act = actMap[actId];
                      return act ? (
                        <View key={actId} style={[s.tag, { backgroundColor: act.color + '20' }]}>
                          <Ionicons name={act.icon as any} size={12} color={act.color} />
                          <Text style={[s.tagText, { color: act.color }]}>{act.name}</Text>
                        </View>
                      ) : (
                        <View key={actId} style={[s.tag, { backgroundColor: colors.border }]}>
                          <Text style={[s.tagText, { color: colors.textMuted }]}>{actId}</Text>
                        </View>
                      );
                    })}
                    {item.activities.length > 5 && (
                      <Text style={[s.moreText, { color: colors.textMuted }]}>
                        +{item.activities.length - 5}
                      </Text>
                    )}
                  </View>
                </View>
                <Ionicons
                  name={isExpanded ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={colors.textMuted}
                />
              </TouchableOpacity>

              {isExpanded && (
                <View style={[s.detailCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                  {detailLoading ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : detail ? (
                    <>
                      {/* Log entries */}
                      {Object.entries(detail.log?.entries || {}).map(([actId, entry]: [string, any]) => {
                        const act = actMap[actId] || { name: actId, icon: 'ellipse', color: '#888' };
                        return (
                          <View key={actId} style={[s.detailEntry, { borderBottomColor: colors.border }]}>
                            <View style={s.detailHeader}>
                              <Ionicons name={act.icon as any} size={16} color={act.color} />
                              <Text style={[s.detailName, { color: colors.textMain }]}>{act.name}</Text>
                              {entry.startTime && entry.endTime && (
                                <Text style={[s.detailTime, { color: colors.textMuted }]}>
                                  {entry.startTime} - {entry.endTime}
                                </Text>
                              )}
                            </View>
                            {entry.quality > 0 && (
                              <View style={s.starRow}>
                                {[1, 2, 3, 4, 5].map((n) => (
                                  <Ionicons
                                    key={n}
                                    name={n <= entry.quality ? 'star' : 'star-outline'}
                                    size={14}
                                    color={colors.accent}
                                  />
                                ))}
                              </View>
                            )}
                            {entry.notes && (
                              <Text style={[s.detailText, { color: colors.textMuted }]} numberOfLines={3}>
                                {entry.notes}
                              </Text>
                            )}
                            {entry.learned && (
                              <Text style={[s.detailText, { color: colors.secondary }]} numberOfLines={2}>
                                Learned: {entry.learned}
                              </Text>
                            )}
                          </View>
                        );
                      })}

                      {/* Review snippet */}
                      {detail.review?.review_text && (
                        <View style={[s.reviewSnippet, { backgroundColor: colors.background, borderColor: colors.accent }]}>
                          <View style={s.reviewSnipHeader}>
                            <Ionicons name="sparkles" size={14} color={colors.accent} />
                            <Text style={[s.reviewSnipTitle, { color: colors.accent }]}>AI Review</Text>
                          </View>
                          <Text style={[s.reviewSnipText, { color: colors.textMain }]} numberOfLines={4}>
                            {detail.review.review_text.substring(0, 200)}...
                          </Text>
                        </View>
                      )}
                    </>
                  ) : null}
                </View>
              )}
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  historyCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 2,
  },
  historyLeft: { flex: 1, gap: 6 },
  historyDate: { fontSize: 15, fontWeight: '700' },
  historyMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  moodEmoji: { fontSize: 16 },
  historyCount: { fontSize: 13 },
  activityTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  tagText: { fontSize: 11, fontWeight: '600' },
  moreText: { fontSize: 11, alignSelf: 'center' },
  detailCard: { borderRadius: 12, borderWidth: 1, marginBottom: 10, padding: 14, marginTop: -1 },
  detailEntry: { paddingVertical: 10, borderBottomWidth: 1, gap: 4 },
  detailHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  detailName: { fontSize: 14, fontWeight: '600', flex: 1 },
  detailTime: { fontSize: 12 },
  starRow: { flexDirection: 'row', gap: 2 },
  detailText: { fontSize: 13, lineHeight: 18 },
  reviewSnippet: { marginTop: 12, padding: 12, borderRadius: 10, borderWidth: 1 },
  reviewSnipHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  reviewSnipTitle: { fontSize: 13, fontWeight: '700' },
  reviewSnipText: { fontSize: 13, lineHeight: 18 },
  emptyState: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyTitle: { fontSize: 20, fontWeight: '800' },
  emptySubtitle: { fontSize: 15, textAlign: 'center', lineHeight: 22, paddingHorizontal: 20 },
});
