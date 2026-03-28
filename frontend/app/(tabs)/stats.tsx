import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/context/ThemeContext';
import { api } from '../../src/utils/api';
import { DEFAULT_ACTIVITIES } from '../../src/constants/activities';

const today = () => new Date().toISOString().split('T')[0];
const fmtDate = (d: string) => {
  const dt = new Date(d + 'T12:00:00');
  return dt.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
};
const fmtShort = (d: string) => {
  const dt = new Date(d + 'T12:00:00');
  return dt.toLocaleDateString('en-US', { weekday: 'narrow' });
};
const shiftWeek = (d: string, n: number) => {
  const dt = new Date(d + 'T12:00:00');
  dt.setDate(dt.getDate() + n * 7);
  return dt.toISOString().split('T')[0];
};

const actMap: Record<string, { name: string; icon: string; color: string }> = {};
DEFAULT_ACTIVITIES.forEach((a) => { actMap[a.id] = { name: a.name, icon: a.icon, color: a.color }; });

export default function StatsScreen() {
  const { colors } = useTheme();
  const [date, setDate] = useState(today());
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadStats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/stats/weekly?date=${date}`);
      setStats(res);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, [date]);

  useEffect(() => { loadStats(); }, [loadStats]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  };

  if (loading && !stats) {
    return (
      <View style={[s.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const weekRange = stats?.week_dates
    ? `${fmtDate(stats.week_dates[0])} - ${fmtDate(stats.week_dates[6])}`
    : '';

  return (
    <ScrollView
      style={[s.container, { backgroundColor: colors.background }]}
      contentContainerStyle={s.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      {/* Week Navigator */}
      <View style={[s.weekNav, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <TouchableOpacity testID="stats-week-prev" onPress={() => setDate(shiftWeek(date, -1))}>
          <Ionicons name="chevron-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <View>
          <Text style={[s.weekText, { color: colors.textMain }]}>{weekRange}</Text>
        </View>
        <TouchableOpacity testID="stats-week-next" onPress={() => setDate(shiftWeek(date, 1))}>
          <Ionicons name="chevron-forward" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Overview Cards */}
      <View style={s.overviewRow}>
        <View style={[s.overviewCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[s.overviewNum, { color: colors.primary }]}>
            {stats?.days_with_logs || 0}
          </Text>
          <Text style={[s.overviewLabel, { color: colors.textMuted }]}>Days Logged</Text>
        </View>
        <View style={[s.overviewCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[s.overviewNum, { color: colors.secondary }]}>
            {stats?.total_activities_logged || 0}
          </Text>
          <Text style={[s.overviewLabel, { color: colors.textMuted }]}>Activities</Text>
        </View>
        <View style={[s.overviewCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[s.overviewNum, { color: colors.accent }]}>
            {stats?.average_quality || 0}
          </Text>
          <Text style={[s.overviewLabel, { color: colors.textMuted }]}>Avg Quality</Text>
        </View>
      </View>

      {/* Daily Heatmap */}
      <View style={[s.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[s.sectionTitle, { color: colors.textMain }]}>Daily Activity</Text>
        <View style={s.heatmapRow}>
          {stats?.daily_summary?.map((day: any) => {
            const intensity = Math.min(day.activities_logged / 5, 1);
            return (
              <View key={day.date} style={s.heatmapDay}>
                <Text style={[s.heatmapLabel, { color: colors.textMuted }]}>{fmtShort(day.date)}</Text>
                <View
                  style={[
                    s.heatmapBlock,
                    {
                      backgroundColor: day.has_log
                        ? `rgba(114, 140, 105, ${0.2 + intensity * 0.8})`
                        : colors.background,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Text style={[s.heatmapNum, { color: day.has_log ? '#fff' : colors.textMuted }]}>
                    {day.activities_logged}
                  </Text>
                </View>
                {day.mood && <Text style={s.heatmapMood}>{day.mood === 'productive' ? '\u{1F680}' : day.mood === 'happy' ? '\u{1F60A}' : '\u{1F4AA}'}</Text>}
              </View>
            );
          })}
        </View>
      </View>

      {/* Activity Breakdown */}
      <View style={[s.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[s.sectionTitle, { color: colors.textMain }]}>Activity Breakdown</Text>
        {stats?.activity_breakdown?.length === 0 ? (
          <Text style={[s.emptyText, { color: colors.textMuted }]}>No data this week yet.</Text>
        ) : (
          stats?.activity_breakdown?.map((item: any) => {
            const act = actMap[item.activity_id] || { name: item.activity_id, icon: 'ellipse', color: '#888' };
            const hrs = Math.floor(item.total_minutes / 60);
            const mins = item.total_minutes % 60;
            const timeStr = item.total_minutes > 0 ? `${hrs}h ${mins}m` : '';
            const progress = Math.min(item.days_logged / 7, 1);

            return (
              <View key={item.activity_id} style={[s.breakdownItem, { borderBottomColor: colors.border }]}>
                <View style={s.breakdownTop}>
                  <View style={s.breakdownLeft}>
                    <View style={[s.miniIcon, { backgroundColor: act.color + '20' }]}>
                      <Ionicons name={act.icon as any} size={16} color={act.color} />
                    </View>
                    <Text style={[s.breakdownName, { color: colors.textMain }]}>{act.name}</Text>
                  </View>
                  <View style={s.breakdownRight}>
                    <Text style={[s.breakdownStat, { color: colors.textMuted }]}>
                      {item.days_logged}d {timeStr ? `\u2022 ${timeStr}` : ''}
                    </Text>
                    {item.avg_quality > 0 && (
                      <View style={s.qualityBadge}>
                        <Ionicons name="star" size={12} color={colors.accent} />
                        <Text style={[s.qualityText, { color: colors.accent }]}>{item.avg_quality}</Text>
                      </View>
                    )}
                  </View>
                </View>
                <View style={[s.progressBg, { backgroundColor: colors.background }]}>
                  <View style={[s.progressFill, { width: `${progress * 100}%`, backgroundColor: act.color }]} />
                </View>
              </View>
            );
          })
        )}
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  weekNav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 16,
  },
  weekText: { fontSize: 14, fontWeight: '700', textAlign: 'center' },
  overviewRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  overviewCard: {
    flex: 1, alignItems: 'center', paddingVertical: 20,
    borderRadius: 12, borderWidth: 1,
  },
  overviewNum: { fontSize: 28, fontWeight: '800' },
  overviewLabel: { fontSize: 12, fontWeight: '600', marginTop: 4 },
  section: { borderRadius: 12, borderWidth: 1, padding: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '800', marginBottom: 14 },
  heatmapRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 4 },
  heatmapDay: { flex: 1, alignItems: 'center', gap: 4 },
  heatmapLabel: { fontSize: 11, fontWeight: '600' },
  heatmapBlock: {
    width: '100%', aspectRatio: 1, borderRadius: 8,
    justifyContent: 'center', alignItems: 'center', borderWidth: 1,
  },
  heatmapNum: { fontSize: 14, fontWeight: '700' },
  heatmapMood: { fontSize: 12 },
  breakdownItem: { paddingVertical: 12, borderBottomWidth: 1, gap: 8 },
  breakdownTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  breakdownLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  miniIcon: { width: 30, height: 30, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  breakdownName: { fontSize: 14, fontWeight: '600' },
  breakdownRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  breakdownStat: { fontSize: 12 },
  qualityBadge: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  qualityText: { fontSize: 12, fontWeight: '700' },
  progressBg: { height: 6, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  emptyText: { fontSize: 14, textAlign: 'center', paddingVertical: 20 },
});
