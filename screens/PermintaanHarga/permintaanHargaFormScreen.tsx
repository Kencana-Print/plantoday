/* eslint-disable react-native/no-inline-styles */
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import LinearGradient from 'react-native-linear-gradient';
import { launchImageLibrary } from 'react-native-image-picker';
import Toast from 'react-native-toast-message';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/authContext';
import {
  createPermintaanHarga,
  PermintaanHargaImageUpload,
  PermintaanHargaPayload,
  updatePermintaanHarga,
  uploadPermintaanHargaImage,
} from '../../services/permintaanHargaApi';
import { usePressGuard } from '../../utils/usePressGuard';
import { PENAWARAN_SHADOW, PENAWARAN_THEME } from '../Penawaran/penawaranTheme';

const THEME = PENAWARAN_THEME;

const DIVISI_OPTIONS = [
  { kode: '1', label: '1 - SPANDUK' },
  { kode: '3', label: '3 - KAOSAN' },
  { kode: '4', label: '4 - GARMEN' },
  { kode: '5', label: '5 - MMT' },
  { kode: '6', label: '6 - FIT U' },
];

const toYmd = (d: Date) => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const parseYmd = (ymd: string) => {
  const [y, m, d] = String(ymd || '')
    .split('-')
    .map(Number);
  return new Date(y || 2000, (m || 1) - 1, d || 1);
};

const formatDate = (ymd: string) => {
  const [y, m, d] = String(ymd || '')
    .split('-')
    .map(Number);
  if (!y || !m || !d) return '-';
  return new Date(y, m - 1, d).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const toUpper = (v: string) => String(v || '').toUpperCase();

const onlyDigits = (value: string) =>
  String(value || '').replace(/[^0-9]/g, '');

const formatThousandsId = (value: string) => {
  const cleaned = onlyDigits(value);
  if (!cleaned) return '';
  return new Intl.NumberFormat('id-ID').format(Number(cleaned));
};

const toNumCurrency = (v: string) => {
  const raw = String(v || '');
  const onlyNum = onlyDigits(raw);
  if (!onlyNum) return 0;
  const n = Number(onlyNum);
  return Number.isFinite(n) ? n : 0;
};

const toNumDecimal = (v: string) => {
  const normalized = String(v || '')
    .replace(/,/g, '.')
    .replace(/[^0-9.]/g, '');
  if (!normalized) return 0;
  const firstDot = normalized.indexOf('.');
  const safe =
    firstDot === -1
      ? normalized
      : normalized.slice(0, firstDot + 1) +
        normalized.slice(firstDot + 1).replace(/\./g, '');
  const n = Number(safe);
  return Number.isFinite(n) ? n : 0;
};

const sanitizeDecimalInput = (value: string) => {
  const normalizedSeparators = String(value || '').replace(/,/g, '.');
  const cleaned = normalizedSeparators.replace(/[^0-9.]/g, '');
  const firstDot = cleaned.indexOf('.');
  if (firstDot === -1) return cleaned;
  const before = cleaned.slice(0, firstDot + 1);
  const after = cleaned.slice(firstDot + 1).replace(/\./g, '');
  return before + after;
};

const editableStatus = (status?: string) => {
  const s = String(status || '').toUpperCase();
  return !s || s === 'MINTA';
};

type PickedImage = {
  uri: string;
  type?: string;
  fileName?: string;
  fileSize?: number;
  base64?: string;
};

type FormImage =
  | ({ source: 'existing' } & PickedImage)
  | ({ source: 'new' } & PickedImage);

const MAX_IMAGE_SIZE = 1024 * 1024;
const ALLOWED_IMAGE_MIME = new Set(['image/jpeg', 'image/jpg', 'image/png']);

const formatSizeMb = (size?: number) => {
  const bytes = Number(size || 0);
  if (!bytes) return '0 MB';
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

export default function PermintaanHargaFormScreen({ navigation, route }: any) {
  const insets = useSafeAreaInsets();
  const runGuardedPress = usePressGuard();
  const { user, token } = useAuth();

  const mode: 'create' | 'edit' =
    route?.params?.mode === 'edit' ? 'edit' : 'create';
  const initial = useMemo(
    () => route?.params?.initialData || {},
    [route?.params],
  );
  const nomor = String(route?.params?.nomor || initial?.mh_nomor || '');

  const isManager = useMemo(
    () =>
      toUpper(String(user?.jabatan || ''))
        .split(/[\s/_-]+/)
        .includes('MANAGER'),
    [user?.jabatan],
  );
  const loginSalesName = useMemo(
    () => toUpper(String(user?.nama || '').trim()),
    [user?.nama],
  );
  const loginSalesKode = useMemo(
    () =>
      toUpper(
        String(
          user?.sales_kode ||
            user?.sal_kode ||
            user?.kode_sales ||
            user?.spk_sal_kode ||
            '',
        ).trim(),
      ),
    [user?.sales_kode, user?.sal_kode, user?.kode_sales, user?.spk_sal_kode],
  );

  const [saving, setSaving] = useState(false);
  const [showDateOrderPicker, setShowDateOrderPicker] = useState(false);
  const [showDivisiOptions, setShowDivisiOptions] = useState(false);

  const [mh_divisi, setMhDivisi] = useState(String(initial?.mh_divisi || '1'));
  const [mh_cus_kode, setMhCusKode] = useState(
    String(initial?.mh_cus_kode || ''),
  );
  const [mh_cus_nama, setMhCusNama] = useState(
    toUpper(String(initial?.mh_cus_nama || '')),
  );
  const [mh_sal_kode, setMhSalKode] = useState(
    toUpper(String(initial?.mh_sal_kode || loginSalesKode)),
  );
  const [mh_sal_nama, setMhSalNama] = useState(
    toUpper(String(initial?.sales_nama || loginSalesName)),
  );
  const [mh_nama, setMhNama] = useState(String(initial?.mh_nama || ''));
  const [mh_jmlorder, setMhJmlOrder] = useState(
    String(initial?.mh_jmlorder ?? ''),
  );
  const [mh_harga, setMhHarga] = useState(String(initial?.mh_harga ?? ''));
  const [mh_budget, setMhBudget] = useState(String(initial?.mh_budget ?? ''));
  const [mh_dateorder, setMhDateOrder] = useState(
    String(initial?.mh_dateorder || toYmd(new Date())),
  );
  const [mh_kain, setMhKain] = useState(String(initial?.mh_kain || ''));
  const [mh_panjang, setMhPanjang] = useState(
    String(initial?.mh_panjang ?? ''),
  );
  const [mh_lebar, setMhLebar] = useState(String(initial?.mh_lebar ?? ''));
  const [mh_ukuran, setMhUkuran] = useState(String(initial?.mh_ukuran || ''));
  const [mh_gramasi, setMhGramasi] = useState(
    String(initial?.mh_gramasi || ''),
  );
  const [mh_finishing, setMhFinishing] = useState(
    String(initial?.mh_finishing || ''),
  );
  const [mh_ket, setMhKet] = useState(String(initial?.mh_ket || ''));

  const [image1, setImage1] = useState<FormImage | null>(null);
  const [image2, setImage2] = useState<FormImage | null>(null);

  useEffect(() => {
    if (mode !== 'edit') return;

    const existing1 = String(initial?.gambar_1_url || '').trim();
    const existing2 = String(initial?.gambar_2_url || '').trim();

    setImage1(
      existing1
        ? {
            source: 'existing',
            uri: existing1,
            type: 'image/jpeg',
            fileName: String(initial?.gambar_1_file || `${nomor}.jpg`),
          }
        : null,
    );

    setImage2(
      existing2
        ? {
            source: 'existing',
            uri: existing2,
            type: 'image/jpeg',
            fileName: String(initial?.gambar_2_file || `${nomor}-2.jpg`),
          }
        : null,
    );
  }, [initial, mode, nomor]);

  const imageList = [
    image1 ? { slot: 1 as const, image: image1 } : null,
    image2 ? { slot: 2 as const, image: image2 } : null,
  ].filter(Boolean) as Array<{ slot: 1 | 2; image: FormImage }>;

  useEffect(() => {
    const selectedCustomer = route?.params?.selectedCustomer;
    if (selectedCustomer) {
      setMhCusKode(toUpper(String(selectedCustomer?.kode || '')));
      setMhCusNama(toUpper(String(selectedCustomer?.nama || '')));
    }
  }, [route?.params?.selectedCustomer]);

  useEffect(() => {
    const selectedSales = route?.params?.selectedSales;
    if (!isManager) return;
    if (selectedSales) {
      setMhSalKode(toUpper(String(selectedSales?.kode || '')));
      setMhSalNama(toUpper(String(selectedSales?.nama || '')));
    }
  }, [isManager, route?.params?.selectedSales]);

  useEffect(() => {
    if (!isManager) {
      setMhSalNama(loginSalesName);
      setMhSalKode(loginSalesKode);
    }
  }, [isManager, loginSalesKode, loginSalesName]);

  const canEdit = useMemo(
    () => editableStatus(initial?.mh_status),
    [initial?.mh_status],
  );
  const selectedDivisiLabel = useMemo(() => {
    const found = DIVISI_OPTIONS.find(
      opt => opt.kode === String(mh_divisi || '').trim(),
    );
    if (found) return found.label;
    return mh_divisi ? `${mh_divisi} - LAINNYA` : '-';
  }, [mh_divisi]);

  const pickImage = async (slot: 1 | 2) => {
    const res = await launchImageLibrary({
      mediaType: 'photo',
      selectionLimit: 1,
      quality: 0.9,
      includeBase64: true,
    });
    const asset = res.assets?.[0];
    if (!asset?.uri) return;
    const mime = String(asset.type || '').toLowerCase();
    const fileName = String(asset.fileName || '').toLowerCase();
    const extOk = /\.(jpg|jpeg|png)$/.test(fileName);
    const mimeOk = ALLOWED_IMAGE_MIME.has(mime);
    if (!mimeOk && !extOk) {
      Toast.show({
        type: 'glassError',
        text1: 'Format file tidak didukung',
        text2: 'Hanya file gambar JPG/JPEG/PNG yang diperbolehkan.',
      });
      return;
    }
    const size = Number(asset.fileSize || 0);
    if (size > MAX_IMAGE_SIZE) {
      Toast.show({
        type: 'glassError',
        text1: 'Ukuran terlalu besar',
        text2: `Maksimal ukuran gambar 1MB per file. File dipilih: ${formatSizeMb(
          size,
        )}`,
      });
      return;
    }
    const img: FormImage = {
      source: 'new',
      uri: asset.uri,
      type: asset.type,
      fileName: asset.fileName,
      fileSize: asset.fileSize,
      base64: asset.base64,
    };
    if (slot === 1) setImage1(img);
    else setImage2(img);
  };

  const pickNextImage = async () => {
    if (!image1) {
      await pickImage(1);
      return;
    }
    if (!image2) {
      await pickImage(2);
      return;
    }
    Toast.show({
      type: 'glassError',
      text1: 'Maksimal gambar',
      text2: 'Maksimal 2 gambar. Hapus salah satu untuk mengganti.',
    });
  };

  const removeImageAt = (index: number) => {
    if (index === 0 || index === 1) {
      setImage1(null);
      return;
    }
    if (index === 2) {
      setImage2(null);
    }
  };

  const toUploadPayload = (img: FormImage): PermintaanHargaImageUpload => ({
    uri: img.uri,
    type: 'image/jpeg',
    name: `permintaan-harga-${Date.now()}.jpg`,
    base64: img.base64,
  });

  const submit = async () => {
    if (mh_cus_nama && !mh_cus_kode) {
      Toast.show({
        type: 'glassError',
        text1: 'Validasi Customer',
        text2:
          'Customer belum valid. Pilih dari tombol Cari sampai kode customer terisi.',
      });
      return;
    }

    if (
      !mh_divisi ||
      !mh_cus_kode ||
      !mh_cus_nama ||
      !mh_sal_kode ||
      !mh_nama
    ) {
      Toast.show({
        type: 'glassError',
        text1: 'Validasi',
        text2: 'Divisi, customer, sales, dan nama wajib diisi',
      });
      return;
    }

    const payload: PermintaanHargaPayload = {
      mh_divisi,
      mh_cus_kode,
      mh_cus_nama,
      mh_sal_kode,
      mh_nama,
      mh_jmlorder: toNumCurrency(mh_jmlorder),
      mh_harga: toNumCurrency(mh_harga),
      mh_budget: toNumCurrency(mh_budget),
      mh_dateorder,
      mh_kain,
      mh_panjang: toNumDecimal(mh_panjang),
      mh_lebar: toNumDecimal(mh_lebar),
      mh_ukuran,
      mh_gramasi,
      mh_finishing,
      mh_ket,
    };

    console.log('[permintaanHargaForm.submit] price normalization', {
      mh_harga_input: mh_harga,
      mh_budget_input: mh_budget,
      mh_harga_payload: payload.mh_harga,
      mh_budget_payload: payload.mh_budget,
      mh_panjang_input: mh_panjang,
      mh_lebar_input: mh_lebar,
      mh_panjang_payload: payload.mh_panjang,
      mh_lebar_payload: payload.mh_lebar,
    });

    setSaving(true);
    let nomorSaved = nomor;

    try {
      if (mode === 'edit') {
        if (!canEdit) {
          Toast.show({
            type: 'glassError',
            text1: 'Tidak bisa diedit',
            text2: 'Dokumen dengan status ini tidak dapat diubah',
          });
          return;
        }
        console.log('[permintaanHargaForm.submit] start update', {
          nomor,
          hasImage1: Boolean(image1),
          hasImage2: Boolean(image2),
        });
        await updatePermintaanHarga(nomor, payload, token);
        console.log('[permintaanHargaForm.submit] update success', { nomor });
      } else {
        console.log('[permintaanHargaForm.submit] start create', {
          hasImage1: Boolean(image1),
          hasImage2: Boolean(image2),
        });
        const created = await createPermintaanHarga(payload, token);
        nomorSaved = String(created?.nomor || '');
        console.log('[permintaanHargaForm.submit] create success', {
          nomor: nomorSaved,
        });
      }
    } catch (err: any) {
      console.log('[permintaanHargaForm.submit] create/update failed', {
        message: err?.message,
        serverMessage: err?.response?.data?.message,
      });
      Toast.show({
        type: 'glassError',
        text1: 'Error',
        text2:
          err?.response?.data?.message || 'Gagal menyimpan permintaan harga',
      });
      setSaving(false);
      return;
    }

    const targetNomor = String(nomorSaved || nomor || '').trim();
    const uploadFailures: number[] = [];
    const uploadFailureDetails: string[] = [];
    console.log('[permintaanHargaForm.submit] upload gate check', {
      mode,
      nomor,
      nomorSaved,
      targetNomor,
      hasImage1: Boolean(image1),
      hasImage2: Boolean(image2),
      image1Meta: image1
        ? {
            uri: image1.uri,
            type: image1.type,
            fileName: image1.fileName,
            fileSize: image1.fileSize,
          }
        : null,
      image2Meta: image2
        ? {
            uri: image2.uri,
            type: image2.type,
            fileName: image2.fileName,
            fileSize: image2.fileSize,
          }
        : null,
      hasToken: Boolean(token),
    });
    if (targetNomor) {
      if (image1?.source === 'new') {
        try {
          console.log('[permintaanHargaForm.submit] start upload', {
            nomor: targetNomor,
            slot: 1,
            hasToken: Boolean(token),
          });
          await uploadPermintaanHargaImage(
            targetNomor,
            1,
            toUploadPayload(image1),
            token,
          );
          console.log('[permintaanHargaForm.submit] upload success', {
            nomor: targetNomor,
            slot: 1,
          });
        } catch (err: any) {
          uploadFailures.push(1);
          uploadFailureDetails.push(
            `slot1:${String(
              err?.response?.status || err?.code || err?.message || 'UNKNOWN',
            )}`,
          );
          console.log('[permintaanHargaForm.submit] upload failed', {
            nomor: targetNomor,
            slot: 1,
            message: err?.message,
            serverMessage: err?.response?.data?.message,
            status: err?.response?.status,
            code: err?.code,
            responseData: err?.response?.data,
          });
        }
      }

      if (image2?.source === 'new') {
        try {
          console.log('[permintaanHargaForm.submit] start upload', {
            nomor: targetNomor,
            slot: 2,
            hasToken: Boolean(token),
          });
          await uploadPermintaanHargaImage(
            targetNomor,
            2,
            toUploadPayload(image2),
            token,
          );
          console.log('[permintaanHargaForm.submit] upload success', {
            nomor: targetNomor,
            slot: 2,
          });
        } catch (err: any) {
          uploadFailures.push(2);
          uploadFailureDetails.push(
            `slot2:${String(
              err?.response?.status || err?.code || err?.message || 'UNKNOWN',
            )}`,
          );
          console.log('[permintaanHargaForm.submit] upload failed', {
            nomor: targetNomor,
            slot: 2,
            message: err?.message,
            serverMessage: err?.response?.data?.message,
            status: err?.response?.status,
            code: err?.code,
            responseData: err?.response?.data,
          });
        }
      }
    }

    const successText =
      mode === 'edit'
        ? 'Permintaan harga berhasil diubah'
        : 'Permintaan harga berhasil ditambah';
    if (uploadFailures.length > 0) {
      Toast.show({
        type: 'glassError',
        text1: 'Tersimpan dengan peringatan',
        text2: `Permintaan harga berhasil disimpan, namun upload gambar ${uploadFailures.join(
          ', ',
        )} gagal (${uploadFailureDetails.join(' | ') || 'tanpa detail'})`,
      });
    } else {
      Toast.show({
        type: 'glassSuccess',
        text1: 'Berhasil',
        text2: successText,
      });
    }
    setSaving(false);
    navigation.navigate('PermintaanHargaList');
  };

  return (
    <LinearGradient
      colors={[THEME.bgTop, THEME.bgBottom]}
      style={[styles.container, { paddingTop: insets.top }]}
    >
      <StatusBar
        barStyle="dark-content"
        translucent
        backgroundColor="transparent"
      />
      <View style={styles.headerArea}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.navigate('PermintaanHargaList')}
          activeOpacity={0.9}
        >
          <Text style={styles.backBtnText}>Kembali</Text>
        </TouchableOpacity>

        <View style={styles.headerTextWrap}>
          <Text style={styles.title}>
            {mode === 'edit'
              ? 'Edit \nPermintaan Harga'
              : 'Buat \nPermintaan Harga'}
          </Text>
        </View>

        <View style={styles.headerRightSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          {mode === 'edit' ? (
            <Text style={styles.nomor}>No. Permintaan: {nomor || '-'}</Text>
          ) : null}
          <Text style={[styles.label, { marginTop: 12 }]}>Sales</Text>
          <View style={styles.row}>
            <TextInput
              style={[
                styles.input,
                styles.rowInput,
                !isManager ? styles.inputDisabled : null,
              ]}
              value={mh_sal_nama}
              editable={isManager}
              onChangeText={t => {
                if (!isManager) return;
                setMhSalNama(toUpper(t));
                if (mh_sal_kode) setMhSalKode('');
              }}
              placeholder="Pilih Sales"
              placeholderTextColor={THEME.ink}
            />
            {isManager ? (
              <TouchableOpacity
                style={styles.searchButton}
                onPress={() =>
                  runGuardedPress('permintaan-harga:search-sales', () =>
                    navigation.navigate('CariSalesPenawaran', {
                      from: 'PERMINTAAN_HARGA_FORM',
                      keyword: mh_sal_nama,
                    }),
                  )
                }
              >
                <Text style={styles.btnSoftText}>Cari</Text>
              </TouchableOpacity>
            ) : null}
          </View>
          {mh_sal_kode ? (
            <Text style={styles.helper}>Kode Sales: {mh_sal_kode}</Text>
          ) : null}

          <Text style={[styles.label]}>Customer</Text>
          <View style={[styles.row, styles.rowFieldAlign]}>
            <TextInput
              style={[styles.input, styles.rowInput]}
              value={mh_cus_nama}
              onChangeText={t => {
                setMhCusNama(toUpper(t));
                if (mh_cus_kode) setMhCusKode('');
              }}
              placeholder="Pilih Customer"
              placeholderTextColor={THEME.muted}
            />
            <TouchableOpacity
              style={styles.searchButton}
              onPress={() =>
                runGuardedPress('permintaan-harga:search-customer', () =>
                  navigation.navigate('CariCustomer', {
                    from: 'PERMINTAAN_HARGA_FORM',
                    keyword: mh_cus_nama,
                  }),
                )
              }
            >
              <Text style={styles.btnSoftText}>Cari</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.searchButton}
              onPress={() =>
                runGuardedPress('permintaan-harga:add-customer', () =>
                  navigation.navigate('TambahCustomerPermintaanHarga'),
                )
              }
            >
              <Text style={styles.btnSoftText}>Tambah</Text>
            </TouchableOpacity>
          </View>
          {mh_cus_kode ? (
            <Text style={styles.helper}>Kode: {mh_cus_kode}</Text>
          ) : mh_cus_nama ? (
            <Text style={styles.warningText}>Customer belum valid.</Text>
          ) : null}

          <View style={styles.fieldWrap}>
            <Text style={styles.label}>Nama Pekerjaan</Text>
            <TextInput
              style={styles.input}
              value={mh_nama}
              onChangeText={setMhNama}
              placeholder="Nama Pekerjaan"
              placeholderTextColor={THEME.muted}
            />
          </View>

          <Text style={[styles.label, { marginTop: 8 }]}>Divisi Tujuan</Text>
          <TouchableOpacity
            style={styles.inputButton}
            onPress={() => setShowDivisiOptions(v => !v)}
          >
            <Text style={styles.inputButtonText}>{selectedDivisiLabel}</Text>
            <Text style={styles.dropdownArrowText}>
              {showDivisiOptions ? '▲' : '▼'}
            </Text>
          </TouchableOpacity>
          {showDivisiOptions ? (
            <View style={styles.dropdownWrap}>
              {DIVISI_OPTIONS.map(opt => (
                <TouchableOpacity
                  key={`divisi-${opt.kode}`}
                  style={styles.dropdownItem}
                  onPress={() => {
                    setMhDivisi(opt.kode);
                    setShowDivisiOptions(false);
                  }}
                >
                  <Text style={styles.dropdownItemText}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : null}

          <View style={styles.fieldWrap}>
            <Text style={styles.label}>Rencana Jumlah Order</Text>
            <TextInput
              style={styles.input}
              value={mh_jmlorder}
              onChangeText={t => setMhJmlOrder(onlyDigits(t))}
              keyboardType="numeric"
              placeholder="Rencana Jumlah Order"
              placeholderTextColor={THEME.muted}
            />
          </View>
          <View style={styles.fieldWrap}>
            <Text style={styles.label}>Harga Lama</Text>
            <View style={styles.moneyInputWrap}>
              <Text style={styles.moneyPrefix}>Rp.</Text>
              <TextInput
                style={[styles.input, styles.moneyInput]}
                value={mh_harga}
                onChangeText={t => setMhHarga(formatThousandsId(t))}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={THEME.muted}
              />
            </View>
          </View>
          <View style={styles.fieldWrap}>
            <Text style={styles.label}>Harga Budget</Text>
            <View style={styles.moneyInputWrap}>
              <Text style={styles.moneyPrefix}>Rp.</Text>
              <TextInput
                style={[styles.input, styles.moneyInput]}
                value={mh_budget}
                onChangeText={t => setMhBudget(formatThousandsId(t))}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={THEME.muted}
              />
            </View>
          </View>

          <TouchableOpacity
            style={styles.dateChip}
            onPress={() => setShowDateOrderPicker(true)}
          >
            <Text style={styles.label}>Tanggal Order Terakhir</Text>
            <Text style={styles.dateValue}>{formatDate(mh_dateorder)}</Text>
          </TouchableOpacity>

          <View style={styles.fieldWrap}>
            <Text style={styles.label}>Kain</Text>
            <TextInput
              style={styles.input}
              value={mh_kain}
              onChangeText={setMhKain}
              placeholder="Kain"
              placeholderTextColor={THEME.muted}
            />
          </View>
          <View style={styles.row}>
            <View style={[styles.fieldWrap, styles.rowInput]}>
              <Text style={styles.label}>Panjang</Text>
              <TextInput
                style={styles.input}
                value={mh_panjang}
                onChangeText={t => setMhPanjang(sanitizeDecimalInput(t))}
                keyboardType="numeric"
                placeholder="0.00"
                placeholderTextColor={THEME.muted}
              />
              <Text style={styles.unitSuffix}>M</Text>
            </View>
            <View style={[styles.fieldWrap, styles.rowInput]}>
              <Text style={styles.label}>Lebar</Text>
              <TextInput
                style={styles.input}
                value={mh_lebar}
                onChangeText={t => setMhLebar(sanitizeDecimalInput(t))}
                keyboardType="numeric"
                placeholder="0.00"
                placeholderTextColor={THEME.muted}
              />
              <Text style={styles.unitSuffix}>M</Text>
            </View>
          </View>
          <View style={styles.fieldWrap}>
            <Text style={styles.label}>Ket. Ukuran</Text>
            <TextInput
              style={styles.input}
              value={mh_ukuran}
              onChangeText={setMhUkuran}
              placeholder="Contoh: L=40, XL=10"
              placeholderTextColor={THEME.muted}
            />
          </View>
          <View style={styles.fieldWrap}>
            <Text style={styles.label}>Gramasi</Text>
            <TextInput
              style={styles.input}
              value={mh_gramasi}
              onChangeText={setMhGramasi}
              placeholder="Gramasi"
              placeholderTextColor={THEME.muted}
            />
          </View>
          <View style={styles.fieldWrap}>
            <Text style={styles.label}>Finishing</Text>
            <TextInput
              style={styles.input}
              value={mh_finishing}
              onChangeText={setMhFinishing}
              placeholder="Finishing"
              placeholderTextColor={THEME.muted}
            />
          </View>
          <View style={styles.fieldWrap}>
            <Text style={styles.label}>Keterangan</Text>
            <TextInput
              style={[styles.input, styles.inputMulti, styles.keteranganInput]}
              value={mh_ket}
              onChangeText={setMhKet}
              placeholder="Keterangan"
              placeholderTextColor={THEME.muted}
              multiline
            />
          </View>

          <View style={styles.fieldWrap}>
            <Text style={styles.label}>
              Upload Gambar (Ukuran Maksimal 1 MB)
            </Text>
            <TouchableOpacity style={styles.uploadBtn} onPress={pickNextImage}>
              <Text style={styles.uploadBtnText}>Upload Gambar</Text>
            </TouchableOpacity>
            {imageList.length > 0 ? (
              <View style={styles.previewWrap}>
                {imageList.map(({ slot, image }) => (
                  <View style={styles.previewItem} key={`preview-${slot}`}>
                    <Text style={styles.previewLabel}>
                      Preview {slot}{' '}
                      {image.source === 'existing' ? '(existing)' : '(new)'}
                    </Text>
                    <View style={styles.previewImageWrap}>
                      <Image
                        source={{ uri: image.uri }}
                        style={styles.previewImage}
                        resizeMode="cover"
                      />
                      <TouchableOpacity
                        style={styles.previewCloseBtn}
                        onPress={() => removeImageAt(slot)}
                        activeOpacity={0.9}
                      >
                        <Text style={styles.previewCloseBtnText}>×</Text>
                      </TouchableOpacity>
                    </View>
                    {image.source === 'new' ? (
                      <Text style={styles.helper}>
                        Ukuran: {formatSizeMb(image.fileSize)}
                      </Text>
                    ) : (
                      <Text style={styles.helper}>Sumber: server</Text>
                    )}
                  </View>
                ))}
              </View>
            ) : null}
          </View>

          <TouchableOpacity
            style={[
              styles.submitBtn,
              (!canEdit && mode === 'edit') || saving
                ? styles.submitBtnDisabled
                : null,
            ]}
            onPress={submit}
            disabled={saving || (mode === 'edit' && !canEdit)}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitText}>
                {mode === 'edit'
                  ? 'Simpan Perubahan'
                  : 'Ajukan Permintaan Harga'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {showDateOrderPicker ? (
        <DateTimePicker
          mode="date"
          value={parseYmd(mh_dateorder)}
          onChange={(_, d) => {
            setShowDateOrderPicker(false);
            if (!d) return;
            setMhDateOrder(toYmd(d));
          }}
        />
      ) : null}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerArea: {
    marginTop: 8,
    marginHorizontal: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  headerTextWrap: { alignItems: 'center', paddingHorizontal: 0 },
  headerRightSpacer: { width: 88 },
  content: { padding: 16, paddingBottom: 32 },
  title: {
    color: THEME.ink,
    paddingTop: 8,
    fontWeight: '900',
    fontSize: 18,
    lineHeight: 24,
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 4,
    marginBottom: 8,
    color: THEME.muted,
    fontSize: 12,
    fontWeight: '700',
  },
  nomor: {
    color: THEME.primary,
    fontWeight: '700',
    marginTop: 6,
    marginBottom: 10,
    textAlign: 'center',
  },
  card: {
    backgroundColor: THEME.card,
    borderWidth: 1,
    borderColor: THEME.line,
    borderRadius: 16,
    padding: 14,
    ...PENAWARAN_SHADOW.softCard,
  },
  fieldWrap: { marginTop: 10 },
  label: { color: THEME.muted, fontSize: 12, fontWeight: '700' },
  helper: {
    marginTop: 4,
    marginBottom: 10,
    color: THEME.sub,
    fontSize: 12,
    fontWeight: '700',
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowFieldAlign: { alignItems: 'flex-end' },
  input: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: THEME.line,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 10,
    color: THEME.ink,
    backgroundColor: THEME.soft,
    fontWeight: '600',
  },
  rowInput: { flex: 1 },
  inputDisabled: { opacity: 0.7, color: THEME.ink },
  inputMulti: { minHeight: 84, textAlignVertical: 'top' },
  keteranganInput: { minHeight: 130 },
  inputButton: {
    marginTop: 6,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: THEME.line,
    backgroundColor: THEME.soft,
    paddingHorizontal: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inputButtonText: { color: THEME.ink, fontWeight: '700' },
  dropdownArrowText: { color: THEME.muted, fontWeight: '900' },
  dropdownWrap: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: THEME.line,
    borderRadius: 12,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  dropdownItem: {
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: THEME.line,
  },
  dropdownItemText: { color: THEME.ink, fontWeight: '700' },
  searchButton: {
    marginTop: 6,
    minHeight: 42,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: THEME.line,
    backgroundColor: THEME.soft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSoftText: {
    color: THEME.primary,
    fontWeight: '900',
    letterSpacing: 0.4,
    fontSize: 12,
  },
  dateChip: {
    borderWidth: 1,
    borderColor: THEME.line,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: THEME.soft,
    marginTop: 10,
  },
  dateValue: { color: THEME.ink, fontWeight: '800', marginTop: 3 },
  uploadBtn: {
    marginTop: 8,
    flex: 1,
    backgroundColor: THEME.soft,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: THEME.line,
    alignItems: 'center',
    justifyContent: 'center',
    height: 42,
  },
  uploadBtnText: { color: THEME.ink, fontWeight: '800', fontSize: 12 },
  warningText: {
    marginTop: 6,
    color: '#B45309',
    fontSize: 12,
    fontWeight: '700',
  },
  previewWrap: {
    marginTop: 10,
    gap: 10,
  },
  previewItem: {
    borderWidth: 1,
    borderColor: THEME.line,
    borderRadius: 12,
    backgroundColor: '#fff',
    padding: 10,
  },
  previewLabel: {
    color: THEME.ink,
    fontWeight: '800',
    fontSize: 12,
    marginBottom: 8,
  },
  previewImage: {
    width: '100%',
    height: 170,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
  },
  previewImageWrap: {
    position: 'relative',
  },
  previewCloseBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: THEME.soft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewCloseBtnText: {
    color: THEME.danger,
    fontSize: 20,
    fontWeight: '900',
    lineHeight: 18,
    marginTop: -1,
  },
  previewPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewPlaceholderText: {
    color: THEME.muted,
    fontWeight: '700',
    fontSize: 12,
  },
  submitBtn: {
    marginTop: 16,
    backgroundColor: THEME.primary,
    borderRadius: 12,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnDisabled: { opacity: 0.5 },
  submitText: { color: '#fff', fontWeight: '800' },
  backBtn: {
    backgroundColor: THEME.soft,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: THEME.line,
    minWidth: 88,
    alignItems: 'center',
  },
  backBtnText: {
    color: THEME.primary,
    fontWeight: '900',
    fontSize: 12,
    letterSpacing: 0.2,
  },
  unitSuffix: {
    position: 'absolute',
    right: 10,
    top: '50%',
    marginTop: 5,
    color: THEME.muted,
    fontSize: 13,
    fontWeight: '800',
    includeFontPadding: false,
  },
  moneyInputWrap: {
    position: 'relative',
  },
  moneyPrefix: {
    position: 'absolute',
    left: 10,
    top: '50%',
    marginTop: -5,
    color: THEME.muted,
    fontSize: 13,
    fontWeight: '800',
    zIndex: 1,
    includeFontPadding: false,
  },
  moneyInput: {
    paddingLeft: 34,
  },
});
