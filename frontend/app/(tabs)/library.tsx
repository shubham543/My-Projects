import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/context/ThemeContext';
import { api } from '../../src/utils/api';

type FilterType = 'all' | 'book' | 'article' | 'tv' | 'movie';

const FILTERS: { key: FilterType; label: string; icon: string }[] = [
  { key: 'all', label: 'All', icon: 'grid-outline' },
  { key: 'book', label: 'Books', icon: 'book-outline' },
  { key: 'article', label: 'Articles', icon: 'newspaper-outline' },
  { key: 'tv', label: 'TV', icon: 'tv-outline' },
  { key: 'movie', label: 'Movies', icon: 'film-outline' },
];

export default function LibraryScreen() {
  const { colors } = useTheme();
  const [filter, setFilter] = useState<FilterType>('all');
  const [search, setSearch] = useState('');
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadLibrary = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/library?filter_type=${filter}`);
      setItems(res);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, [filter]);

  useEffect(() => { loadLibrary(); }, [loadLibrary]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadLibrary();
    setRefreshing(false);
  };

  const filtered = search
    ? items.filter((i) => i.title?.toLowerCase().includes(search.toLowerCase()))
    : items;

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'book': return 'book';
      case 'article': return 'newspaper';
      case 'tv': return 'tv';
      case 'movie': return 'film';
      default: return 'document';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'book': return '#728C69';
      case 'article': return '#7B9BAB';
      case 'tv': return '#5B8BA0';
      case 'movie': return '#9B6B9E';
      default: return '#888';
    }
  };

  return (
    <ScrollView
      style={[s.container, { backgroundColor: colors.background }]}
      contentContainerStyle={s.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      {/* Search */}
      <View style={[s.searchBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Ionicons name="search" size={18} color={colors.textMuted} />
        <TextInput
          testID="library-search"
          style={[s.searchInput, { color: colors.textMain }]}
          placeholder="Search your content..."
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity testID="library-search-clear" onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.filterScroll}>
        <View style={s.filterRow}>
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f.key}
              testID={`library-filter-${f.key}`}
              style={[
                s.filterChip,
                {
                  backgroundColor: filter === f.key ? colors.primary : colors.surface,
                  borderColor: filter === f.key ? colors.primary : colors.border,
                },
              ]}
              onPress={() => setFilter(f.key)}
            >
              <Ionicons
                name={f.icon as any}
                size={16}
                color={filter === f.key ? colors.primaryForeground : colors.textMuted}
              />
              <Text
                style={[
                  s.filterLabel,
                  { color: filter === f.key ? colors.primaryForeground : colors.textMuted },
                ]}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Items */}
      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
      ) : filtered.length === 0 ? (
        <View style={s.emptyState}>
          <Ionicons name="library-outline" size={48} color={colors.textMuted} />
          <Text style={[s.emptyTitle, { color: colors.textMain }]}>Nothing here yet</Text>
          <Text style={[s.emptySubtitle, { color: colors.textMuted }]}>
            Start logging activities with books, articles, TV shows or movies to build your library.
          </Text>
        </View>
      ) : (
        filtered.map((item, i) => {
          const typeColor = getTypeColor(item.type);
          return (
            <View
              key={`${item.title}-${item.date}-${i}`}
              style={[s.itemCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <View style={[s.itemIcon, { backgroundColor: typeColor + '20' }]}>
                <Ionicons name={getTypeIcon(item.type) as any} size={20} color={typeColor} />
              </View>
              <View style={s.itemInfo}>
                <Text style={[s.itemTitle, { color: colors.textMain }]} numberOfLines={2}>
                  {item.title}
                </Text>
                <View style={s.itemMeta}>
                  <Text style={[s.itemType, { color: typeColor }]}>{item.type.toUpperCase()}</Text>
                  <Text style={[s.itemDate, { color: colors.textMuted }]}>{item.date}</Text>
                </View>
                {item.topic && (
                  <Text style={[s.itemTopic, { color: colors.textMuted }]} numberOfLines={1}>
                    {item.topic}
                  </Text>
                )}
              </View>
              {item.rating > 0 && (
                <View style={s.itemRating}>
                  <Ionicons name="star" size={14} color={colors.accent} />
                  <Text style={[s.ratingText, { color: colors.accent }]}>{item.rating}</Text>
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
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14,
    paddingVertical: 10, borderRadius: 12, borderWidth: 1, gap: 10, marginBottom: 12,
  },
  searchInput: { flex: 1, fontSize: 15 },
  filterScroll: { marginBottom: 16 },
  filterRow: { flexDirection: 'row', gap: 8 },
  filterChip: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14,
    paddingVertical: 8, borderRadius: 20, borderWidth: 1, gap: 6,
  },
  filterLabel: { fontSize: 13, fontWeight: '600' },
  itemCard: {
    flexDirection: 'row', alignItems: 'center', padding: 14,
    borderRadius: 12, borderWidth: 1, marginBottom: 10, gap: 12,
  },
  itemIcon: { width: 44, height: 44, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  itemInfo: { flex: 1 },
  itemTitle: { fontSize: 15, fontWeight: '700' },
  itemMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  itemType: { fontSize: 11, fontWeight: '700' },
  itemDate: { fontSize: 12 },
  itemTopic: { fontSize: 12, marginTop: 2 },
  itemRating: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  ratingText: { fontSize: 14, fontWeight: '700' },
  emptyState: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyTitle: { fontSize: 20, fontWeight: '800' },
  emptySubtitle: { fontSize: 15, textAlign: 'center', lineHeight: 22, paddingHorizontal: 20 },
});
