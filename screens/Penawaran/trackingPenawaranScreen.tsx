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
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../../context/authContext';
import { ListSkeleton } from '../../components/loadingSkeleton';
import {
  getTrackingPenawaranDetail,
  TrackingMapDetailItem,
  getTrackingPenawaranList,
  TrackingPenawaranListItem,
} from '../../services/trackingPenawaranApi';
import { PENAWARAN_SHADOW, PENAWARAN_THEME } from './penawaranTheme';
import { RootStackParamList } from '../../navigation/appNavigator';

const THEME = PENAWARAN_THEME;

const DIVISI_OPTIONS = [
  { kode: '1', label: '1 - SPANDUK' },
  { kode: '3', label: '3 - KAOSAN' },
  { kode: '4', label: '4 - GARMEN' },
  { kode: '5', label: '5 - MMT' },
  { kode: '6', label: '6 - FIT U' },
];

type Props = NativeStackScreenProps<RootStackParamList, 'TrackingPenawaran'>;

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

const parseYmd = (ymd: string) => {
  const [y, m, d] = String(ymd || '')
    .split('-')
    .map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
};

const toReadableCloseStatus = (value?: string) => {
  const v = String(value || '')
    .trim()
    .toUpperCase();
  if (v === 'Y') return 'Sudah';
  if (v === 'N') return 'Belum';
  return '-';
};

const splitNotes = (value?: string) => {
  const raw = String(value || '').trim();
  if (!raw) return [] as string[];

  return raw
    .split(/\r?\n|\s*\|\s*|\s*;\s*|\s*•\s*/)
    .map(v => v.trim())
    .filter(Boolean);
};

const toReadableDivisi = (value?: number | string) => {
  const kode = String(value ?? '').trim();
  if (!kode) return '-';
  const found = DIVISI_OPTIONS.find(option => option.kode === kode);
  return found?.label || kode;
};

export default function TrackingPenawaranScreen({}: Props) {
  const { token } = useAuth();
  const insets = useSafeAreaInsets();
  const initialRange = useMemo(() => getCurrentMonth(), []);
  const [startDate, setStartDate] = useState(initialRange.startDate);
  const [endDate, setEndDate] = useState(initialRange.endDate);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [items, setItems] = useState<TrackingPenawaranListItem[]>([]);
  const [openedNoPenawaran, setOpenedNoPenawaran] = useState<string | null>(
    null,
  );
  const [detailMapByPenawaran, setDetailMapByPenawaran] = useState<
    Record<string, TrackingMapDetailItem[]>
  >({});
  const [loadingDetailByPenawaran, setLoadingDetailByPenawaran] = useState<
    Record<string, boolean>
  >({});
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

        const data = await getTrackingPenawaranList(
          {
            startDate,
            endDate,
            search: appliedSearch.trim() || undefined,
            limit: 100,
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
            err?.response?.data?.message ||
            'Gagal mengambil data tracking penawaran',
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

    // Hindari loading menggantung jika tombol ditekan saat filter tidak berubah.
    if (nextSearch === currentAppliedSearch) {
      setIsSearchSubmitting(false);
      return;
    }

    setIsSearchSubmitting(true);
    setAppliedSearch(nextSearch);
  }, [appliedSearch, isSearchSubmitting, loading, search]);

  const onChangeSearch = useCallback((value: string) => {
    setSearch(value);
    // Samakan UX dengan form lain: saat input dikosongkan,
    // list langsung kembali ke mode default (tanpa filter search).
    if (!value.trim()) {
      setAppliedSearch('');
    }
  }, []);

  useEffect(() => {
    loadList();
  }, [appliedSearch, startDate, endDate, loadList]);

  const loadMapDetails = useCallback(
    async (noPenawaran: string) => {
      if (!noPenawaran) return;
      if (detailMapByPenawaran[noPenawaran]) return;

      setLoadingDetailByPenawaran(prev => ({ ...prev, [noPenawaran]: true }));
      try {
        const data = await getTrackingPenawaranDetail(noPenawaran, token);
        setDetailMapByPenawaran(prev => ({
          ...prev,
          [noPenawaran]: data?.map_details || [],
        }));
      } catch {
        setDetailMapByPenawaran(prev => ({
          ...prev,
          [noPenawaran]: [],
        }));
        Toast.show({
          type: 'glassError',
          text1: 'Error',
          text2: 'Gagal mengambil detail MAP',
        });
      } finally {
        setLoadingDetailByPenawaran(prev => ({
          ...prev,
          [noPenawaran]: false,
        }));
      }
    },
    [detailMapByPenawaran, token],
  );

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

  const renderItem = ({ item }: { item: TrackingPenawaranListItem }) => {
    const isOpened = openedNoPenawaran === item.no_penawaran;
    const nomorPenawaran = String(item.no_penawaran || '-').trim() || '-';
    const customerName = String(item.customer || '').trim() || '-';
    const noSpk = String(item.no_map || '')
      .split(',')
      .map(v => v.trim())
      .filter(Boolean)
      .join(', ');

    return (
      <TouchableOpacity
        activeOpacity={0.9}
        style={styles.rowCard}
        onPress={async () => {
          const nextOpened =
            openedNoPenawaran === item.no_penawaran ? null : item.no_penawaran;
          setOpenedNoPenawaran(nextOpened);
          if (nextOpened) {
            await loadMapDetails(nextOpened);
          }
        }}
      >
        <View style={styles.rowHeader}>
          <View style={styles.rowLeft}>
            <Text style={styles.rowLabel}>No. Penawaran</Text>
            <Text style={styles.rowNo} numberOfLines={2}>
              {nomorPenawaran}
            </Text>
            <Text style={styles.rowCompany} numberOfLines={2}>
              {customerName}
            </Text>
            <Text style={styles.rowSub} numberOfLines={1}>
              {formatDate(item.tanggal_penawaran)}
            </Text>
          </View>
          <View style={styles.rowRight}>
            <Text style={styles.rowLabel}>Detail MAP</Text>
            <Text style={styles.rowActionSub} numberOfLines={1}>
              {isOpened ? 'Tap untuk tutup' : 'Tap untuk buka'}
            </Text>
            <Text style={styles.rowActionHint}>-</Text>
          </View>
          <View style={styles.chevronWrap}>
            <Text style={styles.chevron}>{isOpened ? '▲' : '▼'}</Text>
          </View>
        </View>

        <Text style={styles.mapPreviewLabel}>List MAP</Text>
        <Text style={styles.mapPreviewValue} numberOfLines={2}>
          {noSpk || '-'}
        </Text>

        {isOpened && (
          <View style={styles.dropdownBody}>
            {loadingDetailByPenawaran[item.no_penawaran] ? (
              <View style={styles.dropdownLoadingWrap}>
                <ActivityIndicator size="small" color={THEME.primary} />
                <Text style={styles.dropdownTextHint}>
                  Memuat detail MAP...
                </Text>
              </View>
            ) : (detailMapByPenawaran[item.no_penawaran] || []).length === 0 ? (
              <Text style={styles.dropdownTextHint}>Belum ada detail MAP</Text>
            ) : (
              (detailMapByPenawaran[item.no_penawaran] || []).map(
                (mapItem, mapIndex) => (
                  <View
                    style={styles.mapItemCard}
                    key={`${mapItem.pen_id}-${mapIndex}`}
                  >
                    <Text style={styles.mapItemTitle}>
                      {mapIndex + 1}. {mapItem.no_map || `MAP belum tersedia`}
                    </Text>
                    <Text style={styles.dropdownText}>
                      Nama: {mapItem.map_nama || '-'}
                    </Text>
                    <Text style={styles.dropdownText}>
                      Tanggal MAP: {formatDate(mapItem.tanggal_map)}
                    </Text>
                    <Text style={styles.dropdownText}>
                      Dateline: {formatDate(mapItem.map_deadline)}
                    </Text>
                    <Text style={styles.dropdownText}>
                      Divisi: {toReadableDivisi(mapItem.map_divisi)}
                    </Text>
                    <Text style={styles.dropdownText}>
                      Status Proses: {mapItem.map_status || '-'}
                    </Text>
                    <Text style={styles.dropdownText}>
                      Status Close: {toReadableCloseStatus(mapItem.map_close)}
                    </Text>
                    <View style={styles.notesWrap}>
                      <Text style={styles.notesTitle}>Catatan</Text>
                      {splitNotes(mapItem.map_keterangan).length > 0 ? (
                        splitNotes(mapItem.map_keterangan).map(
                          (note, noteIndex) => (
                            <View
                              style={styles.noteItem}
                              key={`${mapItem.pen_id}-${mapIndex}-note-${noteIndex}`}
                            >
                              <Text style={styles.noteBullet}>•</Text>
                              <Text style={styles.noteText}>{note}</Text>
                            </View>
                          ),
                        )
                      ) : (
                        <Text style={styles.dropdownTextHint}>-</Text>
                      )}
                    </View>
                  </View>
                ),
              )
            )}
          </View>
        )}
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
        keyExtractor={item => item.no_penawaran}
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
            <Text style={styles.title}>Tracking Penawaran</Text>
            <Text style={styles.subtitle}>Pantau status penawaran</Text>
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
                  placeholder="Cari no penawaran"
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
              <Text style={styles.loadingText}>Memuat data tracking...</Text>
              <View style={styles.skeletonWrap}>
                <ListSkeleton rows={4} />
              </View>
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
  tableHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 2,
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
  rowActionTitle: {
    color: THEME.primary,
    fontSize: 13,
    fontWeight: '900',
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
    color: THEME.muted,
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'right',
  },
  mapPreviewLabel: {
    marginTop: 2,
    color: THEME.muted,
    fontSize: 11,
    fontWeight: '700',
  },
  mapPreviewValue: {
    marginTop: 2,
    color: THEME.ink,
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 18,
  },
  dropdownBody: {
    borderTopWidth: 1,
    borderTopColor: THEME.line,
    paddingTop: 10,
    marginTop: 2,
  },
  dropdownLoadingWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mapItemCard: {
    borderWidth: 1,
    borderColor: THEME.line,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 9,
    backgroundColor: THEME.soft,
    marginBottom: 8,
  },
  mapItemTitle: {
    color: THEME.primary,
    fontWeight: '900',
    marginBottom: 4,
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
    marginTop: 6,
    fontSize: 12,
  },
  loadingWrap: { paddingVertical: 14 },
  loadingText: { color: THEME.muted, fontSize: 13, textAlign: 'center' },
  skeletonWrap: { marginTop: 10 },
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
