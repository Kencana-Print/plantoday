import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
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
import { ListSkeleton } from '../../components/loadingSkeleton';
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

const splitNotes = (value?: string) => {
  const raw = String(value || '').trim();
  if (!raw) return [] as string[];

  return raw
    .split(/\r?\n|\s*\|\s*|\s*;\s*|\s*•\s*/)
    .map(v => v.trim())
    .filter(Boolean);
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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [openedItemKey, setOpenedItemKey] = useState<string | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isBusy = loading || isSearchSubmitting || refreshing;

  const loadList = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      try {
        setErrorMessage(null);
        if (!token) {
          setItems([]);
          setHasLoadedOnce(true);
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
        setHasLoadedOnce(true);
      } catch (err: any) {
        setItems([]);
        const message =
          err?.response?.data?.message || 'Gagal mengambil data tracking MAP';
        setErrorMessage(message);
        setHasLoadedOnce(true);
        Toast.show({
          type: 'glassError',
          text1: 'Error',
          text2: message,
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
    if (isBusy) return;
    const nextSearch = search.trim();
    const currentAppliedSearch = appliedSearch.trim();
    if (nextSearch === currentAppliedSearch) {
      setIsSearchSubmitting(false);
      return;
    }
    setIsSearchSubmitting(true);
    setAppliedSearch(nextSearch);
  }, [appliedSearch, isBusy, search]);

  const onChangeSearch = useCallback((value: string) => {
    setSearch(value);
    setIsSearchSubmitting(true);
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      const nextSearch = value.trim();
      setAppliedSearch(prev => {
        if (prev === nextSearch) {
          setIsSearchSubmitting(false);
          return prev;
        }
        return nextSearch;
      });
    }, 450);
  }, []);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const isInitialLoading = loading && !hasLoadedOnce;

  const onRetry = useCallback(() => {
    if (loading || refreshing) return;
    loadList();
  }, [loadList, loading, refreshing]);

  const onRefresh = useCallback(() => {
    if (loading || isSearchSubmitting) return;
    loadList(true);
  }, [isSearchSubmitting, loadList, loading]);

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

  const renderItem = useCallback(
    ({ item, index }: { item: TrackingMapListItem; index: number }) => {
      const itemKey = `${item.no_map || 'map'}-${
        item.tanggal_map || 'tgl'
      }-${index}`;
      return (
        <TrackingMapRow
          item={item}
          isOpened={openedItemKey === itemKey}
          onToggle={() => {
            setOpenedItemKey(prev => (prev === itemKey ? null : itemKey));
          }}
        />
      );
    },
    [openedItemKey],
  );

  const keyExtractor = useCallback(
    (item: TrackingMapListItem, idx: number) =>
      `${item.no_map || 'map'}-${item.tanggal_map || 'tgl'}-${idx}`,
    [],
  );

  const listEmptyComponent = useMemo(() => {
    if (isInitialLoading) {
      return (
        <View style={styles.loadingWrap}>
          <Text style={styles.loadingSubText}>Memuat data tracking MAP...</Text>
          <View style={styles.skeletonWrap}>
            <ListSkeleton rows={4} />
          </View>
        </View>
      );
    }

    if (errorMessage) {
      return (
        <View style={styles.errorWrap}>
          <Text style={styles.errorTitle}>Gagal memuat data</Text>
          <Text style={styles.errorSubtitle}>{errorMessage}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            activeOpacity={0.88}
            onPress={onRetry}
          >
            <Text style={styles.retryButtonText}>Coba Lagi</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.emptyWrap}>
        <Text style={styles.emptyTitle}>Data tracking MAP tidak ditemukan</Text>
        <Text style={styles.emptySubtitle}>
          Ubah rentang tanggal atau kata kunci pencarian, lalu coba lagi.
        </Text>
      </View>
    );
  }, [errorMessage, isInitialLoading, onRetry]);

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
        extraData={openedItemKey}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        updateCellsBatchingPeriod={60}
        windowSize={7}
        removeClippedSubviews={Platform.OS === 'android'}
        contentContainerStyle={[
          styles.listContainer,
          { paddingBottom: 120 + insets.bottom },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
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
                  placeholder="Cari MAP "
                  placeholderTextColor={THEME.muted}
                  style={styles.searchInput}
                  returnKeyType="search"
                  onSubmitEditing={applyFilter}
                  editable={!isBusy}
                />
                {search.trim() ? (
                  <TouchableOpacity
                    style={styles.clearSearchButton}
                    onPress={() => {
                      setSearch('');
                      setIsSearchSubmitting(true);
                      setAppliedSearch('');
                    }}
                    activeOpacity={0.8}
                    disabled={isBusy}
                  >
                    <Text style={styles.clearSearchButtonText}>x</Text>
                  </TouchableOpacity>
                ) : null}
              </View>

              <TouchableOpacity
                style={styles.filterButton}
                activeOpacity={0.88}
                onPress={applyFilter}
                disabled={isBusy}
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

              {isSearchSubmitting || (loading && hasLoadedOnce) ? (
                <View style={styles.inlineLoadingWrap}>
                  <ActivityIndicator size="small" color={THEME.primary} />
                  <Text style={styles.inlineLoadingText}>
                    Memuat hasil pencarian...
                  </Text>
                </View>
              ) : null}
            </View>

            <View style={styles.divider} />
            <Text style={styles.summaryText}>
              Menampilkan {items.length} data
            </Text>
          </View>
        }
        ListEmptyComponent={listEmptyComponent}
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

const TrackingMapRow = memo(
  ({
    item,
    isOpened,
    onToggle,
  }: {
    item: TrackingMapListItem;
    isOpened: boolean;
    onToggle: () => void;
  }) => {
    return (
      <TouchableOpacity
        activeOpacity={0.9}
        style={styles.rowCard}
        onPress={onToggle}
      >
        <View style={styles.rowHeader}>
          <View style={styles.rowLeft}>
            <Text style={styles.rowLabel}>MAP</Text>
            <Text style={styles.rowNo} numberOfLines={1} ellipsizeMode="clip">
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
            <Text style={styles.rowActionSub}>
              {isOpened ? 'Tap untuk tutup' : 'Tap untuk buka'}
            </Text>
            <Text style={styles.rowActionDateLabel}>Tanggal MAP</Text>
            <Text style={styles.rowActionHint}>
              {formatDate(item.tanggal_map)}
            </Text>
          </View>
          <View style={styles.chevronWrap}>
            <Text style={styles.chevron}>{isOpened ? '▲' : '▼'}</Text>
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

        {isOpened && (
          <View style={styles.dropdownBody}>
            <View style={styles.mapItemCard}>
              <Text style={styles.dropdownText}>
                Nama: {item.mspk_nama || '-'}
              </Text>
              <Text style={styles.dropdownText}>
                Ukuran: {item.mspk_ukuran || '-'}
              </Text>
              <Text style={styles.dropdownText}>
                Kain: {item.mspk_kain || '-'}
              </Text>
              <Text style={styles.dropdownText}>
                Finishing: {item.mspk_finishing || '-'}
              </Text>
              <View style={styles.notesWrap}>
                <Text style={styles.notesTitle}>Keterangan</Text>
                {splitNotes(item.mspk_keterangan).length > 0 ? (
                  splitNotes(item.mspk_keterangan).map((note, noteIndex) => (
                    <View
                      style={styles.noteItem}
                      key={`${item.no_map}-note-${noteIndex}`}
                    >
                      <Text style={styles.noteBullet}>•</Text>
                      <Text style={styles.noteText}>{note}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.dropdownTextHint}>-</Text>
                )}
              </View>
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  },
);

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
  inlineLoadingWrap: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  inlineLoadingText: {
    color: THEME.muted,
    fontSize: 12,
    fontWeight: '700',
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
    fontSize: 14,
    fontWeight: '900',
    lineHeight: 20,
  },
  rowCompany: {
    marginTop: 2,
    color: THEME.ink,
    fontSize: 12,
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
    minWidth: 100,
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
  rowActionDateLabel: {
    marginTop: 4,
    color: THEME.muted,
    fontSize: 11,
    fontWeight: '700',
  },
  chevronWrap: {
    marginTop: 15,
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: THEME.line,
    backgroundColor: THEME.soft,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  chevron: {
    color: THEME.primary,
    fontWeight: '900',
    fontSize: 11,
    lineHeight: 12,
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
  dropdownBody: {
    borderTopWidth: 1,
    borderTopColor: THEME.line,
    paddingTop: 10,
    marginTop: 2,
  },
  mapItemCard: {
    borderWidth: 1,
    borderColor: THEME.line,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 9,
    backgroundColor: THEME.soft,
    marginBottom: 2,
  },
  notesWrap: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: THEME.line,
    borderRadius: 8,
    padding: 8,
    backgroundColor: THEME.card,
  },
  notesTitle: {
    color: THEME.ink,
    fontWeight: '900',
    marginBottom: 4,
  },
  noteItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 2,
  },
  noteBullet: {
    color: THEME.primary,
    fontWeight: '900',
    marginRight: 6,
    lineHeight: 18,
  },
  noteText: {
    flex: 1,
    color: THEME.ink,
    fontWeight: '700',
    lineHeight: 18,
  },
  dropdownText: {
    color: THEME.ink,
    fontWeight: '700',
    marginTop: 2,
  },
  dropdownTextHint: {
    color: THEME.muted,
    fontWeight: '700',
    marginTop: 2,
    fontSize: 12,
  },
  loadingWrap: { paddingVertical: 14 },
  loadingSubText: {
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 12,
    color: THEME.muted,
    fontSize: 12,
    fontWeight: '600',
  },
  skeletonWrap: {
    width: '100%',
  },
  emptyWrap: {
    backgroundColor: THEME.card,
    borderWidth: 1,
    borderColor: THEME.line,
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
  },
  emptyTitle: { color: THEME.ink, fontSize: 16, fontWeight: '700' },
  emptySubtitle: {
    marginTop: 6,
    color: THEME.muted,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 17,
  },
  errorWrap: {
    backgroundColor: THEME.card,
    borderWidth: 1,
    borderColor: THEME.line,
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
  },
  errorTitle: {
    color: THEME.ink,
    fontSize: 16,
    fontWeight: '800',
  },
  errorSubtitle: {
    marginTop: 6,
    color: THEME.muted,
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 17,
  },
  retryButton: {
    marginTop: 12,
    backgroundColor: THEME.primary,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 12,
  },
});
