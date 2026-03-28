import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/context/ThemeContext';
import { api } from '../../src/utils/api';

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

function ReviewSection({ text, colors }: { text: string; colors: any }) {
  const lines = text.split('\n');
  return (
    <View style={s.reviewBody}>
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (trimmed.startsWith('## ')) {
          return (
            <Text key={i} style={[s.reviewH2, { color: colors.primary }]}>
              {trimmed.replace('## ', '')}
            </Text>
          );
        }
        if (trimmed.startsWith('- ')) {
          return (
            <View key={i} style={s.bulletRow}>
              <Text style={[s.bullet, { color: colors.secondary }]}>{'\u2022'}</Text>
              <Text style={[s.bulletText, { color: colors.textMain }]}>
                {trimmed.substring(2)}
              </Text>
            </View>
          );
        }
        if (/^\d+\.\s/.test(trimmed)) {
          const num = trimmed.match(/^(\d+)\./)?.[1] || '';
          const rest = trimmed.replace(/^\d+\.\s*/, '');
          return (
            <View key={i} style={s.bulletRow}>
              <Text style={[s.numBullet, { color: colors.primary }]}>{num}.</Text>
              <Text style={[s.bulletText, { color: colors.textMain }]}>{rest}</Text>
            </View>
          );
        }
        if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
          return (
            <Text key={i} style={[s.boldText, { color: colors.textMain }]}>
              {trimmed.replace(/\*\*/g, '')}
            </Text>
          );
        }
        if (trimmed === '') return <View key={i} style={s.spacer} />;
        return (
          <Text key={i} style={[s.reviewText, { color: colors.textMain }]}>
            {trimmed.replace(/\*\*/g, '')}
          </Text>
        );
      })}
    </View>
  );
}

export default function ReviewScreen() {
  const { colors } = useTheme();
  const [date, setDate] = useState(today());
  const [review, setReview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadReview = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/reviews/${date}`);
      setReview(res.review_text || null);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, [date]);

  useEffect(() => { loadReview(); }, [loadReview]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await api.post('/review/generate', { date });
      setReview(res.review_text);
    } catch (e: any) {
      let msg = 'Failed to generate review.';
      try {
        const parsed = JSON.parse(e.message);
        if (parsed.detail) msg = parsed.detail;
      } catch (_) {
        if (e.message) msg = e.message;
      }
      setReview(null);
      alert(msg);
    }
    setGenerating(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadReview();
    setRefreshing(false);
  };

  return (
    <ScrollView
      style={[s.container, { backgroundColor: colors.background }]}
      contentContainerStyle={s.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      {/* Date Navigator */}
      <View style={[s.dateNav, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <TouchableOpacity testID="review-date-prev" onPress={() => setDate(shiftDate(date, -1))}>
          <Ionicons name="chevron-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <View>
          <Text style={[s.dateText, { color: colors.textMain }]}>{fmtDate(date)}</Text>
          {date === today() && <Text style={[s.todayBadge, { color: colors.primary }]}>Today</Text>}
        </View>
        <TouchableOpacity testID="review-date-next" onPress={() => setDate(shiftDate(date, 1))}>
          <Ionicons name="chevron-forward" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Generate Button */}
      <TouchableOpacity
        testID="ai-review-generate"
        style={[s.generateBtn, { backgroundColor: colors.primary, opacity: generating ? 0.6 : 1 }]}
        onPress={handleGenerate}
        disabled={generating}
      >
        {generating ? (
          <ActivityIndicator size="small" color={colors.primaryForeground} />
        ) : (
          <Ionicons name="sparkles" size={20} color={colors.primaryForeground} />
        )}
        <Text style={[s.generateText, { color: colors.primaryForeground }]}>
          {generating ? 'Generating Review...' : review ? 'Regenerate AI Review' : 'Generate AI Review'}
        </Text>
      </TouchableOpacity>

      {generating && (
        <View style={s.loadingWrap}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[s.loadingText, { color: colors.textMuted }]}>
            Claude is analyzing your day...
          </Text>
        </View>
      )}

      {/* Review Display */}
      {loading && !generating ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
      ) : review ? (
        <View style={[s.reviewCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={s.reviewHeader}>
            <Ionicons name="sparkles" size={18} color={colors.accent} />
            <Text style={[s.reviewTitle, { color: colors.accent }]}>AI Daily Review</Text>
          </View>
          <ReviewSection text={review} colors={colors} />
        </View>
      ) : !generating ? (
        <View style={s.emptyState}>
          <Ionicons name="bulb-outline" size={48} color={colors.textMuted} />
          <Text style={[s.emptyTitle, { color: colors.textMain }]}>No review yet</Text>
          <Text style={[s.emptySubtitle, { color: colors.textMuted }]}>
            Log your activities first, then generate an AI review to get personalized insights and improvement tips.
          </Text>
        </View>
      ) : null}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  dateNav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 16,
  },
  dateText: { fontSize: 18, fontWeight: '800', textAlign: 'center' },
  todayBadge: { fontSize: 12, fontWeight: '600', textAlign: 'center', marginTop: 2 },
  generateBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 16, borderRadius: 12, gap: 10, marginBottom: 16,
  },
  generateText: { fontSize: 16, fontWeight: '700' },
  loadingWrap: { alignItems: 'center', paddingVertical: 40, gap: 16 },
  loadingText: { fontSize: 15 },
  reviewCard: { borderRadius: 12, borderWidth: 1, padding: 20 },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  reviewTitle: { fontSize: 16, fontWeight: '800' },
  reviewBody: { gap: 4 },
  reviewH2: { fontSize: 17, fontWeight: '800', marginTop: 16, marginBottom: 6 },
  bulletRow: { flexDirection: 'row', gap: 8, paddingLeft: 4, marginVertical: 2 },
  bullet: { fontSize: 16, lineHeight: 22 },
  numBullet: { fontSize: 15, fontWeight: '700', lineHeight: 22, minWidth: 20 },
  bulletText: { flex: 1, fontSize: 15, lineHeight: 22 },
  boldText: { fontSize: 15, fontWeight: '700', lineHeight: 22, marginVertical: 4 },
  reviewText: { fontSize: 15, lineHeight: 22 },
  spacer: { height: 8 },
  emptyState: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyTitle: { fontSize: 20, fontWeight: '800' },
  emptySubtitle: { fontSize: 15, textAlign: 'center', lineHeight: 22, paddingHorizontal: 20 },
});
