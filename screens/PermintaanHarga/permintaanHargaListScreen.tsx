/* eslint-disable react-native/no-inline-styles */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  BackHandler,
  Modal,
  Platform,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ScrollView,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import LinearGradient from 'react-native-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/authContext';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { ListSkeleton } from '../../components/loadingSkeleton';
import {
  getPermintaanHargaList,
  PermintaanHargaItem,
} from '../../services/permintaanHargaApi';
import { PENAWARAN_SHADOW, PENAWARAN_THEME } from '../Penawaran/penawaranTheme';

const THEME = PENAWARAN_THEME;

const getCurrentMonth = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const toYmd = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
      d.getDate(),
    ).padStart(2, '0')}`;
  return { startDate: toYmd(start), endDate: toYmd(end) };
};

const formatDate = (ymd: string) => {
  const [y, m, d] = String(ymd || '')
    .split('-')
    .map(Number);
  if (!y || !m || !d) return ymd || '-';
  return new Date(y, m - 1, d).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const getStatusBadgeStyle = (status: string) => {
  const value = String(status || '').toUpperCase();
  const withTone = (base: string, text: string) => ({
    backgroundColor: `${base}1A`,
    borderColor: base,
    textColor: text,
  });

  if (value === 'BELUM') {
    return withTone('#6B7280', '#374151');
  }
  if (value === 'MINTA') {
    return withTone('#FF0000', '#B00000');
  }
  if (value === 'CANCEL') {
    return withTone('#0000FF', '#0000CC');
  }
  if (value === 'WAIT') {
    return withTone('#008000', '#006400');
  }
  if (value === 'DONE' || value === 'SELESAI') {
    return withTone('#000000', '#111827');
  }
  return withTone('#6366F1', THEME.primary);
};

export default function PermintaanHargaListScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  const initialRange = useMemo(() => getCurrentMonth(), []);
  const [items, setItems] = useState<PermintaanHargaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState(initialRange.startDate);
  const [endDate, setEndDate] = useState(initialRange.endDate);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [showSearchFab, setShowSearchFab] = useState(false);
  const [openSearchMini, setOpenSearchMini] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const loadData = useCallback(
    async (isRefresh = false) => {
      isRefresh ? setRefreshing(true) : setLoading(true);
      try {
        if (!token) {
          setItems([]);
          return;
        }

        const data = await getPermintaanHargaList(
          {
            startDate,
            endDate,
            search: search.trim() || undefined,
            status: filterStatus === 'all' ? undefined : filterStatus,
            limit: 100,
            page: 1,
          },
          token,
        );
        setItems(data);
      } catch (err: any) {
        Toast.show({
          type: 'glassError',
          text1: 'Error',
          text2:
            err?.response?.data?.message ||
            'Gagal mengambil daftar permintaan harga',
        });
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [endDate, search, startDate, token, filterStatus],
  );

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  useFocusEffect(
    useCallback(() => {
      const goHome = () => {
        navigation.navigate('Home');
        return true;
      };

      const backHandler = BackHandler.addEventListener(
        'hardwareBackPress',
        goHome,
      );

      const unsubscribeBeforeRemove = navigation.addListener(
        'beforeRemove',
        (e: any) => {
          if (e?.data?.action?.type === 'NAVIGATE') {
            return;
          }
          e.preventDefault();
          navigation.navigate('Home');
        },
      );

      return () => {
        backHandler.remove();
        unsubscribeBeforeRemove();
      };
    }, [navigation]),
  );

  useEffect(() => {
    const timer = setTimeout(() => loadData(), 350);
    return () => clearTimeout(timer);
  }, [loadData]);

  const parseYmd = (ymd: string) => {
    const [y, m, d] = String(ymd || '')
      .split('-')
      .map(Number);
    return new Date(y, (m || 1) - 1, d || 1);
  };

  const onPressItem = (item: PermintaanHargaItem) => {
    navigation.navigate('PermintaanHargaDetail', { nomor: item.nomor });
  };

  const ListHeader = (
    <View style={styles.headerWrap}>
      <View style={styles.headerTop}>
        <View style={styles.headerTopRow}>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.title}>Permintaan Harga</Text>
            <Text style={styles.subtitle}>
              Periode {formatDate(startDate)} - {formatDate(endDate)}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.statusLegendWrap}>
        <View style={styles.statusLegendRow}>
          <View
            style={[styles.statusLegendDot, { backgroundColor: '#6B7280' }]}
          />
          <Text style={styles.statusLegendText}>
            = BELUM (Tidak muncul di kalkulasi harga)
          </Text>
        </View>
        <View style={styles.statusLegendRow}>
          <View
            style={[styles.statusLegendDot, { backgroundColor: '#FF0000' }]}
          />
          <Text style={styles.statusLegendText}>
            = MINTA (Sedang dimintakan harga ke Finance)
          </Text>
        </View>
        <View style={styles.statusLegendRow}>
          <View
            style={[styles.statusLegendDot, { backgroundColor: '#0000FF' }]}
          />
          <Text style={styles.statusLegendText}>= CANCEL</Text>
        </View>
        <View style={styles.statusLegendRow}>
          <View
            style={[styles.statusLegendDot, { backgroundColor: '#008000' }]}
          />
          <Text style={styles.statusLegendText}>
            = WAIT (Sudah diproses, menunggu acc)
          </Text>
        </View>
        <View style={styles.statusLegendRow}>
          <View
            style={[styles.statusLegendDot, { backgroundColor: '#000000' }]}
          />
          <Text style={styles.statusLegendText}>= DONE</Text>
        </View>
      </View>

      <View style={styles.headerCard}>
        <View style={styles.dateRow}>
          <TouchableOpacity
            style={styles.dateChip}
            onPress={() => setShowStartPicker(true)}
            activeOpacity={0.85}
          >
            <Text style={styles.dateChipLabel}>Mulai</Text>
            <Text style={styles.dateChipValue}>{formatDate(startDate)}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.dateChip}
            onPress={() => setShowEndPicker(true)}
            activeOpacity={0.85}
          >
            <Text style={styles.dateChipLabel}>Sampai</Text>
            <Text style={styles.dateChipValue}>{formatDate(endDate)}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.searchBox}>
          <TextInput
            placeholder="Cari nomor/nama/customer"
            placeholderTextColor={THEME.muted}
            value={search}
            onChangeText={setSearch}
            style={styles.searchInput}
          />
          {search.trim() ? (
            <TouchableOpacity
              style={styles.clearSearchButton}
              onPress={() => setSearch('')}
              activeOpacity={0.8}
            >
              <MaterialIcons
                name="close"
                style={styles.clearSearchButtonText}
              />
            </TouchableOpacity>
          ) : null}
        </View>

        <TouchableOpacity
          style={styles.createButtonWide}
          onPress={() =>
            navigation.navigate('PermintaanHargaForm', { mode: 'create' })
          }
          activeOpacity={0.9}
          accessibilityLabel="Tambah Permintaan Harga"
        >
          <LinearGradient
            colors={[THEME.primary, THEME.accent]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.createButtonWideGradient}
          >
            <Text style={styles.createButtonWideText}>
              Buat Permintaan Harga
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.chipRow}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipScroll}
          >
            {(['done', 'minta', 'wait', 'belum', 'cancel'] as const).map(
              opt => {
                const active = filterStatus === opt;
                const label =
                  opt === 'done'
                    ? '⚫ Done'
                    : opt === 'minta'
                    ? '🔴 Minta'
                    : opt === 'wait'
                    ? '🟢 Wait'
                    : opt === 'belum'
                    ? '⚪ Belum'
                    : '🔵 Cancel';
                return (
                  <TouchableOpacity
                    key={`status-${opt}`}
                    style={[styles.chipItem, active && styles.chipItemActive]}
                    activeOpacity={0.8}
                    onPress={() =>
                      setFilterStatus(prev => (prev === opt ? 'all' : opt))
                    }
                  >
                    <Text
                      style={[
                        styles.chipLabel,
                        active && styles.chipLabelActive,
                      ]}
                    >
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              },
            )}
          </ScrollView>
          <Text style={styles.countBadge}>{items.length}</Text>
        </View>
      </View>
    </View>
  );

  const onScroll = useCallback((e: any) => {
    const y = e?.nativeEvent?.contentOffset?.y || 0;
    setShowSearchFab(y > 180);
  }, []);

  return (
    <LinearGradient
      colors={[THEME.bgTop, THEME.bgBottom]}
      style={[styles.container, { paddingTop: insets.top }]}
    >
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent
      />

      <FlatList
        data={loading ? [] : items}
        keyExtractor={(item, idx) => `${item.nomor}-${idx}`}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: 140 + insets.bottom },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadData(true)}
            tintColor={THEME.primary}
          />
        }
        renderItem={({ item }) => {
          const statusStyle = getStatusBadgeStyle(item.status);
          return (
            <TouchableOpacity
              style={styles.card}
              activeOpacity={0.9}
              onPress={() => onPressItem(item)}
            >
              <View style={styles.rowBetween}>
                <Text style={styles.nomor}>{item.nomor}</Text>
                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor: statusStyle.backgroundColor,
                      borderColor: statusStyle.borderColor,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      { color: statusStyle.textColor },
                    ]}
                  >
                    {item.status || '-'}
                  </Text>
                </View>
              </View>

              <Text style={styles.nama} numberOfLines={1}>
                {item.nama || '-'}
              </Text>
              <Text style={styles.metaText} numberOfLines={1}>
                Customer: {item.customer || '-'}
              </Text>
              <Text style={styles.metaText} numberOfLines={1}>
                {formatDate(item.tanggal)} • {item.divisi || '-'}
              </Text>
              <Text style={styles.metaText} numberOfLines={1}>
                Jumlah Order: {item.jml_order || 0}
              </Text>
              <Text style={styles.detail}>Tap untuk lihat detail</Text>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          loading ? (
            <View style={styles.loadingWrap}>
              <Text style={styles.loadingText}>
                Memuat data permintaan harga...
              </Text>
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
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      />

      {showStartPicker && (
        <DateTimePicker
          mode="date"
          value={parseYmd(startDate)}
          onChange={(_, d) => {
            if (Platform.OS !== 'ios') setShowStartPicker(false);
            if (!d) return;
            const ymd = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
              2,
              '0',
            )}-${String(d.getDate()).padStart(2, '0')}`;
            setStartDate(ymd);
            if (ymd > endDate) setEndDate(ymd);
          }}
          maximumDate={parseYmd(endDate)}
        />
      )}

      {showEndPicker && (
        <DateTimePicker
          mode="date"
          value={parseYmd(endDate)}
          onChange={(_, d) => {
            if (Platform.OS !== 'ios') setShowEndPicker(false);
            if (!d) return;
            const ymd = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
              2,
              '0',
            )}-${String(d.getDate()).padStart(2, '0')}`;
            setEndDate(ymd);
            if (ymd < startDate) setStartDate(ymd);
          }}
          minimumDate={parseYmd(startDate)}
        />
      )}

      {showSearchFab && (
        <TouchableOpacity
          style={[styles.fabSearch, { bottom: 82 + insets.bottom }]}
          onPress={() => setOpenSearchMini(true)}
          activeOpacity={0.9}
          accessibilityLabel="Cari Permintaan Harga"
        >
          <View style={styles.fabSearchInner}>
            <MaterialIcons name="search" size={16} color={THEME.ink} />
            <Text style={styles.fabSearchText}>Cari</Text>
          </View>
        </TouchableOpacity>
      )}

      <Modal
        visible={openSearchMini}
        transparent
        animationType="fade"
        onRequestClose={() => setOpenSearchMini(false)}
      >
        <View
          style={[styles.modalBackdrop, { paddingBottom: 18 + insets.bottom }]}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Pencarian</Text>
              <TouchableOpacity
                onPress={() => setOpenSearchMini(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.searchBox}>
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Cari nomor/nama/customer"
                placeholderTextColor={THEME.muted}
                style={styles.searchInput}
              />
              {search.trim() ? (
                <TouchableOpacity
                  style={styles.clearSearchButton}
                  onPress={() => setSearch('')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.clearSearchButtonText}>x</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerWrap: {
    backgroundColor: THEME.bgBottom,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    paddingBottom: 10,
  },
  headerTop: { marginBottom: 10 },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleWrap: { alignItems: 'center' },
  title: {
    fontSize: 25,
    fontWeight: '900',
    color: THEME.ink,
    letterSpacing: 0.2,
    marginTop: 0,
  },
  subtitle: {
    marginTop: 6,
    fontSize: 12,
    color: THEME.muted,
    fontWeight: '700',
    textAlign: 'center',
  },
  statusLegendWrap: {
    marginBottom: 10,
    backgroundColor: '#DBEAFE',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 6,
  },
  statusLegendRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusLegendDot: {
    width: 14,
    height: 14,
    marginRight: 8,
  },
  statusLegendText: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  headerCard: {
    backgroundColor: THEME.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: THEME.line,
    padding: 14,
    ...PENAWARAN_SHADOW.card,
  },
  dateRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  dateChip: {
    flex: 1,
    borderWidth: 1,
    borderColor: THEME.line,
    borderRadius: 14,
    backgroundColor: THEME.soft,
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  dateChipLabel: { color: THEME.muted, fontSize: 11, fontWeight: '700' },
  dateChipValue: {
    color: THEME.ink,
    fontSize: 13,
    fontWeight: '800',
    marginTop: 2,
  },
  searchBox: {
    marginTop: 12,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: THEME.line,
    backgroundColor: THEME.soft,
    paddingHorizontal: 12,
    height: 46,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    color: THEME.ink,
    fontSize: 14,
    fontWeight: '700',
    padding: 0,
  },
  clearSearchButton: {
    marginLeft: 8,
    width: 24,
    height: 24,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(100,116,139,0.14)',
  },
  clearSearchButtonText: {
    color: THEME.ink,
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 16,
  },
  createButtonWide: {
    marginTop: 10,
    borderRadius: 14,
    overflow: 'hidden',
    ...PENAWARAN_SHADOW.softCard,
  },
  createButtonWideGradient: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    paddingHorizontal: 12,
  },
  createButtonWideText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 14,
    letterSpacing: 0.2,
  },
  divider: {
    marginTop: 10,
    height: 1,
    backgroundColor: THEME.line,
  },
  chipRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chipScroll: {
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 2,
  },
  chipItem: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: THEME.line,
    backgroundColor: THEME.soft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipItemActive: {
    backgroundColor: 'rgba(79, 70, 229, 0.08)',
    borderColor: THEME.primary,
  },
  chipLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.muted,
  },
  chipLabelActive: {
    color: THEME.primary,
    fontWeight: '800',
  },
  countBadge: {
    color: THEME.ink,
    fontSize: 13,
    fontWeight: '900',
    backgroundColor: THEME.soft,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: THEME.line,
    paddingHorizontal: 10,
    paddingVertical: 4,
    overflow: 'hidden',
    textAlign: 'center',
    minWidth: 36,
  },
  loadingWrap: {
    paddingVertical: 12,
  },
  loadingText: { color: THEME.muted, fontSize: 13, textAlign: 'center' },
  skeletonWrap: { marginTop: 10 },
  listContent: {
    paddingBottom: 24,
    paddingTop: 4,
  },
  card: {
    backgroundColor: THEME.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: THEME.line,
    padding: 14,
    marginHorizontal: 20,
    marginBottom: 10,
    ...PENAWARAN_SHADOW.softCard,
  },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between' },
  nomor: { color: THEME.ink, fontWeight: '800', fontSize: 15 },
  statusBadge: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  statusText: { fontWeight: '800', fontSize: 11, letterSpacing: 0.3 },
  nama: { color: THEME.ink, fontWeight: '800', marginTop: 6, fontSize: 15 },
  metaText: { marginTop: 2, fontSize: 12, color: THEME.ink },
  detail: {
    color: THEME.muted,
    fontWeight: '700',
    fontSize: 11,
    paddingTop: 5,
  },
  emptyWrap: {
    alignItems: 'center',
    paddingTop: 42,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME.muted,
  },
  fabSearch: {
    position: 'absolute',
    right: 16,
  },
  fabSearchInner: {
    height: 40,
    paddingHorizontal: 14,
    borderRadius: 20,
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(15,23,42,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  fabSearchText: {
    color: THEME.ink,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.3,
    marginLeft: 6,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    paddingHorizontal: 16,
    justifyContent: 'flex-end',
    paddingBottom: 18,
  },
  modalCard: {
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(15,23,42,0.10)',
    padding: 14,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  modalTitle: { color: THEME.ink, fontWeight: '900', fontSize: 16 },
  modalClose: {
    color: THEME.muted,
    fontWeight: '900',
    fontSize: 18,
    paddingHorizontal: 6,
  },
});
