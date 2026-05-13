import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import LinearGradient from 'react-native-linear-gradient';
import Toast from 'react-native-toast-message';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PENAWARAN_SHADOW, PENAWARAN_THEME } from './penawaranTheme';
import { useAuth } from '../../context/authContext';
import {
  getTrackingMapList,
  TrackingMapListItem,
} from '../../services/trackingMapApi';

const THEME = PENAWARAN_THEME;

const toYmd = (d: Date) => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const getCurrentMonth = () => {
  const now = new Date();
  return {
    startDate: toYmd(new Date(now.getFullYear(), now.getMonth(), 1)),
    endDate: toYmd(new Date(now.getFullYear(), now.getMonth() + 1, 0)),
  };
};

const parseYmd = (ymd: string) => {
  const [y, m, d] = String(ymd || '')
    .split('-')
    .map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
};

const formatDate = (ymd?: string) => {
  if (!ymd) return '-';
  const [y, m, d] = ymd.split('-').map(Number);
  if (!y || !m || !d) return ymd;
  return new Date(y, m - 1, d).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export default function TrackingMapScreen() {
  const { token } = useAuth();
  const insets = useSafeAreaInsets();
  const initialRange = useMemo(() => getCurrentMonth(), []);
  const [startDate, setStartDate] = useState(initialRange.startDate);
  const [endDate, setEndDate] = useState(initialRange.endDate);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [items, setItems] = useState<TrackingMapListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSearchSubmitting, setIsSearchSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadList = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      try {
        if (!token) {
          setItems([]);
          return;
        }

        const data = await getTrackingMapList(
          {
            startDate,
            endDate,
            search: appliedSearch.trim() || undefined,
          },
          token,
        );
        setItems(data);
      } catch (err: any) {
        setItems([]);
        Toast.show({
          type: 'glassError',
          text1: 'Error',
          text2:
            err?.response?.data?.message || 'Gagal mengambil data tracking MAP',
        });
      } finally {
        setLoading(false);
        setRefreshing(false);
        setIsSearchSubmitting(false);
      }
    },
    [appliedSearch, endDate, startDate, token],
  );

  useEffect(() => {
    loadList();
  }, [loadList]);

  const applyFilter = useCallback(() => {
    if (loading || isSearchSubmitting) return;
    const nextSearch = search.trim();
    const currentAppliedSearch = appliedSearch.trim();
    if (nextSearch === currentAppliedSearch) {
      setIsSearchSubmitting(false);
      return;
    }
    setIsSearchSubmitting(true);
    setAppliedSearch(nextSearch);
  }, [appliedSearch, isSearchSubmitting, loading, search]);

  const onChangeSearch = useCallback((value: string) => {
    setSearch(value);
    if (!value.trim()) {
      setAppliedSearch('');
    }
  }, []);

  useEffect(() => {
    loadList();
  }, [appliedSearch, startDate, endDate, loadList]);

  const onChangeStartDate = (_: any, selectedDate?: Date) => {
    if (Platform.OS !== 'ios') setShowStartPicker(false);
    if (!selectedDate) return;
    const ymd = toYmd(selectedDate);
    setStartDate(ymd);
    if (ymd > endDate) setEndDate(ymd);
  };

  const onChangeEndDate = (_: any, selectedDate?: Date) => {
    if (Platform.OS !== 'ios') setShowEndPicker(false);
    if (!selectedDate) return;
    const ymd = toYmd(selectedDate);
    if (ymd < startDate) setStartDate(ymd);
    setEndDate(ymd);
  };

  const renderItem = ({ item }: { item: TrackingMapListItem }) => {
    return (
      <TouchableOpacity activeOpacity={0.9} style={styles.rowCard}>
        <View style={styles.rowHeader}>
          <View style={styles.rowLeft}>
            <Text style={styles.rowLabel}>MAP</Text>
            <Text style={styles.rowNo} numberOfLines={2}>
              {item.no_map || '-'}
            </Text>
            <Text style={styles.rowCompany} numberOfLines={2}>
              {item.customer || '-'}
            </Text>
            <Text style={styles.rowSub} numberOfLines={2}>
              {item.alamat || '-'}
            </Text>
          </View>
          <View style={styles.rowRight}>
            <Text style={styles.rowLabel}>Detail</Text>
            <Text style={styles.rowActionSub}>Tanggal MAP</Text>
            <Text style={styles.rowActionHint}>
              {formatDate(item.tanggal_map)}
            </Text>
          </View>
        </View>

        <View style={styles.statusWrap}>
          <View style={styles.statusChip}>
            <Text style={styles.statusLabel}>Tanggal BAST</Text>
            <Text style={styles.statusValue}>
              {formatDate(item.tanggal_bast)}
            </Text>
          </View>
          <View style={styles.statusChip}>
            <Text style={styles.statusLabel}>Tanggal SJ MAP</Text>
            <Text style={styles.statusValue}>
              {formatDate(item.tanggal_sj_map)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <LinearGradient
      colors={[THEME.bgTop, THEME.bgBottom]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent
      />

      <FlatList
        data={items}
        keyExtractor={(item, idx) => `${item.no_map}-${idx}`}
        renderItem={renderItem}
        contentContainerStyle={[
          styles.listContainer,
          { paddingBottom: 120 + insets.bottom },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadList(true)}
            tintColor={THEME.primary}
          />
        }
        ListHeaderComponent={
          <View style={styles.headerWrap}>
            <Text style={styles.title}>Tracking MAP</Text>
            <Text style={styles.subtitle}>Pantau MAP</Text>
            <View style={styles.filterCard}>
              <View style={styles.dateRow}>
                <TouchableOpacity
                  style={styles.dateChip}
                  onPress={() => setShowStartPicker(true)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.dateChipLabel}>Mulai</Text>
                  <Text style={styles.dateChipValue}>
                    {formatDate(startDate)}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.dateChip}
                  onPress={() => setShowEndPicker(true)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.dateChipLabel}>Sampai</Text>
                  <Text style={styles.dateChipValue}>
                    {formatDate(endDate)}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.searchBox}>
                <TextInput
                  value={search}
                  onChangeText={onChangeSearch}
                  placeholder="Cari MAP / customer / alamat"
                  placeholderTextColor={THEME.muted}
                  style={styles.searchInput}
                  returnKeyType="search"
                  onSubmitEditing={applyFilter}
                />
                {search.trim() ? (
                  <TouchableOpacity
                    style={styles.clearSearchButton}
                    onPress={() => {
                      setSearch('');
                      setAppliedSearch('');
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.clearSearchButtonText}>x</Text>
                  </TouchableOpacity>
                ) : null}
              </View>

              <TouchableOpacity
                style={styles.filterButton}
                activeOpacity={0.88}
                onPress={applyFilter}
                disabled={loading || isSearchSubmitting}
              >
                <LinearGradient
                  colors={[THEME.primary, THEME.accent]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.filterButtonGradient}
                >
                  {isSearchSubmitting ? (
                    <View style={styles.filterButtonLoadingWrap}>
                      <ActivityIndicator size="small" color="#fff" />
                      <Text style={styles.filterButtonText}>Memuat...</Text>
                    </View>
                  ) : (
                    <Text style={styles.filterButtonText}>
                      Lakukan Pencarian
                    </Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>

            <View style={styles.divider} />
            <Text style={styles.summaryText}>
              Menampilkan {items.length} data
            </Text>
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="large" color={THEME.primary} />
              <Text style={styles.loadingText}>Memuat data tracking...</Text>
            </View>
          ) : (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyTitle}>Belum ada data</Text>
            </View>
          )
        }
      />

      {showStartPicker && (
        <DateTimePicker
          value={parseYmd(startDate)}
          mode="date"
          display="default"
          onChange={onChangeStartDate}
        />
      )}
      {showEndPicker && (
        <DateTimePicker
          value={parseYmd(endDate)}
          mode="date"
          display="default"
          onChange={onChangeEndDate}
        />
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContainer: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 44 : 14,
  },
  headerWrap: { marginBottom: 14 },
  title: {
    fontSize: 25,
    fontWeight: '900',
    color: THEME.ink,
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 4,
    marginBottom: 12,
    color: THEME.muted,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  filterCard: {
    backgroundColor: THEME.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: THEME.line,
    padding: 14,
    marginBottom: 12,
    ...PENAWARAN_SHADOW.card,
  },
  dateRow: { marginTop: 2, flexDirection: 'row', gap: 8 },
  dateChip: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: THEME.line,
    paddingHorizontal: 10,
    paddingVertical: 9,
    backgroundColor: THEME.soft,
  },
  dateChipLabel: { color: THEME.muted, fontSize: 11, fontWeight: '600' },
  dateChipValue: {
    color: THEME.ink,
    marginTop: 2,
    fontSize: 13,
    fontWeight: '800',
  },
  searchBox: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: THEME.line,
    borderRadius: 15,
    backgroundColor: THEME.soft,
    height: 46,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    paddingVertical: 0,
    color: THEME.ink,
    fontSize: 14,
    fontWeight: '700',
    padding: 0,
  },
  clearSearchButton: {
    width: 24,
    height: 24,
    borderRadius: 999,
    backgroundColor: 'rgba(100,116,139,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  clearSearchButtonText: {
    color: THEME.ink,
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 16,
  },
  filterButton: {
    marginTop: 10,
    borderRadius: 14,
    overflow: 'hidden',
    ...PENAWARAN_SHADOW.softCard,
  },
  filterButtonGradient: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    paddingHorizontal: 12,
  },
  filterButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  filterButtonLoadingWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  divider: {
    height: 1,
    backgroundColor: THEME.line,
  },
  summaryText: {
    color: THEME.ink,
    fontWeight: '800',
    textAlign: 'right',
    fontSize: 12,
  },
  rowCard: {
    backgroundColor: THEME.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: THEME.line,
    marginBottom: 10,
    ...PENAWARAN_SHADOW.softCard,
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 10,
  },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  rowLeft: {
    flex: 1,
    minWidth: 0,
  },
  rowNo: {
    color: THEME.ink,
    fontSize: 15,
    fontWeight: '900',
    lineHeight: 20,
  },
  rowCompany: {
    marginTop: 2,
    color: THEME.ink,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  rowLabel: {
    color: THEME.muted,
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 2,
  },
  rowSub: {
    marginTop: 2,
    color: THEME.muted,
    fontWeight: '700',
    fontSize: 12,
  },
  rowRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    minWidth: 130,
  },
  rowActionSub: {
    marginTop: 3,
    color: THEME.muted,
    fontSize: 12,
    fontWeight: '700',
    maxWidth: 140,
  },
  rowActionHint: {
    marginTop: 3,
    color: THEME.primary,
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'right',
  },
  statusWrap: {
    flexDirection: 'row',
    gap: 8,
  },
  statusChip: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: THEME.line,
    backgroundColor: THEME.soft,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  statusLabel: {
    color: THEME.muted,
    fontSize: 11,
    fontWeight: '700',
  },
  statusValue: {
    color: THEME.ink,
    marginTop: 2,
    fontSize: 12,
    fontWeight: '800',
  },
  loadingWrap: { paddingVertical: 30, alignItems: 'center' },
  loadingText: { marginTop: 8, color: THEME.muted, fontSize: 13 },
  emptyWrap: {
    backgroundColor: THEME.card,
    borderWidth: 1,
    borderColor: THEME.line,
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
  },
  emptyTitle: { color: THEME.ink, fontSize: 16, fontWeight: '700' },
});
