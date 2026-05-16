import api from './api';

export type PenawaranListParams = {
  startDate?: string;
  endDate?: string;
  status?: 'ALL' | 'OPEN' | 'BATAL' | 'CLOSE';
  search?: string;
  limit?: number;
};

export type PenawaranListItem = {
  nomor: string;
  tanggal: string;
  divisi: string;
  tipe: string;
  perusahaan: string;
  customer: string;
  sales: string;
  keterangan: string;
  fu1: string;
  fu2: string;
  fu3: string;
  proyeksi: string;
  nominal: number;
  detail_count: number;
  approval_state: '' | 'WAIT' | 'ACC' | 'TOLAK' | string;
};

export type PenawaranHeader = {
  nomor: string;
  tanggal: string;
  divisi: string;
  divisi_nama: string;
  tipe: string;
  perusahaan_kode: string;
  perusahaan: string;
  customer_kode: string;
  customer: string;
  customer_alamat: string;
  customer_kota: string;
  sales_kode: string;
  sales: string;
  keterangan: string;
  note: string;
  rekening: string;
  dp_per: number;
  ttd: string;
  ttd_jabatan: string;
  up: string;
  marketing: string;
  marketing_telp: string;
  status_harga: number;
  cetak_total: number;
  panjang: number;
  lebar: number;
  tambahan: string;
  fu1: string;
  fu2: string;
  fu3: string;
  proyeksi: string;
  mx: string;
  digital_sign: string;
  nominal: number;
  approval_state: '' | 'WAIT' | 'ACC' | 'TOLAK' | string;
};

export type PenawaranDetailItem = {
  id: string;
  urutan: number;
  minta: string;
  nama_barang: string;
  bahan: string;
  ukuran: string;
  panjang: number;
  lebar: number;
  satuan: string;
  qty: number;
  harga: number;
  total: number;
  status: string;
  ket_batal: string;
  ket_confirm: string;
  gambar: string;
};

export type PenawaranMasterOption = {
  kode: string;
  nama: string;
  alamat?: string;
};

export type PenawaranMasterNomorOption = {
  kode: string;
  nama: string;
  tanggal?: string;
  customer?: string;
  perusahaan?: string;
};

export type PenawaranPermintaanHargaOption = {
  nomor: string;
  tanggal?: string;
  status?: string;
  divisi?: string;
  sales_kode?: string;
  sales?: string;
  customer_kode?: string;
  customer?: string;
  nama_barang?: string;
  bahan?: string;
  ukuran?: string;
  panjang?: number;
  lebar?: number;
  qty?: number;
  harga_referensi?: number;
  is_non_belum?: number;
};

export type PenawaranPermintaanHargaSelected = {
  nomor: string;
  tanggal?: string;
  status?: string;
  divisi?: string;
  sales_kode?: string;
  sales?: string;
  customer_kode?: string;
  customer?: string;
  autofill: {
    no_permintaan: string;
    nama_barang?: string;
    bahan?: string;
    ukuran?: string;
    panjang?: number;
    lebar?: number;
    qty?: number;
    harga_referensi?: number;
    keterangan?: string;
  };
  warning?: string;
};

export type PenawaranCreatePayload = {
  tanggal: string;
  divisi: string;
  tipe: string;
  perusahaan_kode: string;
  up?: string;
  ttd?: string;
  ttd_jabatan?: string;
  customer_kode: string;
  sales_kode: string;
  keterangan?: string;
  note?: string;
  user?: string;
  details: Array<{
    minta?: string;
    nama_barang: string;
    bahan?: string;
    ukuran?: string;
    panjang?: number;
    lebar?: number;
    satuan?: string;
    qty: number;
    harga: number;
  }>;
};

export type PenawaranStatusUpdate = {
  id: string;
  status: 'OPEN' | 'BATAL' | 'CLOSE' | '';
  ket_batal?: string;
  ket_confirm?: string;
};

export type PenawaranStatusUpdatePayload = {
  updates: PenawaranStatusUpdate[];
  user?: string;
};

export type ApprovalRequestPayload = {
  alasan: string;
  user?: string;
};

export type PenawaranActivityLog = {
  type: 'APPROVAL' | 'STATUS_UPDATE' | string;
  created_at: string;
  user: string;
  note: string;
  approval_state?: '' | 'WAIT' | 'ACC' | 'TOLAK' | string;
  changes?: Array<{
    id: string;
    before: {
      status: string;
      ket_batal: string;
      ket_confirm: string;
    };
    after: {
      status: string;
      ket_batal: string;
      ket_confirm: string;
    };
  }>;
};

export const getPenawaranList = async (
  params: PenawaranListParams = {},
  token?: string | null,
) => {
  const response = await api.get('/penawaran', {
    params,
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  return (response.data?.data || []) as PenawaranListItem[];
};

export const getPenawaranDetail = async (
  nomor: string,
  token?: string | null,
) => {
  const response = await api.get(`/penawaran/${encodeURIComponent(nomor)}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  return response.data?.data as {
    header: PenawaranHeader;
    details: PenawaranDetailItem[];
  };
};

export const createPenawaran = async (
  payload: PenawaranCreatePayload,
  token?: string | null,
) => {
  const response = await api.post('/penawaran', payload, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  return response.data?.data as { nomor: string };
};

export const getMasterPerusahaan = async (search?: string) => {
  const response = await api.get('/penawaran/master/perusahaan', {
    params: { search: search || '' },
  });
  return (response.data?.data || []) as PenawaranMasterOption[];
};

export const getMasterSales = async (search?: string) => {
  const response = await api.get('/penawaran/master/sales', {
    params: { search: search || '' },
  });
  return (response.data?.data || []) as PenawaranMasterOption[];
};

export const getMasterCustomer = async (search?: string) => {
  const response = await api.get('/penawaran/master/customer', {
    params: { search: search || '' },
  });
  const data = response.data?.data || [];
  return data.map((item: any) => ({
    kode: item.cc_kode || item.kode || '',
    nama: item.cc_nama || item.nama || '',
    alamat: item.cc_alamat || item.alamat || '',
  })) as PenawaranMasterOption[];
};

export const getMasterPenawaranNomor = async (search?: string) => {
  const response = await api.get('/penawaran/master/nomor', {
    params: { search: search || '' },
  });
  return (response.data?.data || []) as PenawaranMasterNomorOption[];
};

export const getMasterPermintaanHargaForPenawaran = async (
  params: {
    search?: string;
    nomor?: string;
    sales_kode?: string;
    customer_kode?: string;
    page?: number;
    limit?: number;
  } = {},
  token?: string | null,
) => {
  const response = await api.get('/penawaran/master/permintaan-harga', {
    params,
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });

  return {
    options: (response.data?.data?.options ||
      []) as PenawaranPermintaanHargaOption[],
    selected:
      (response.data?.data?.selected as PenawaranPermintaanHargaSelected) ||
      null,
    meta: response.data?.meta || {},
  };
};

export const updatePenawaranStatusDetail = async (
  nomor: string,
  payload: PenawaranStatusUpdatePayload,
  token?: string | null,
) => {
  const response = await api.put(
    `/penawaran/${encodeURIComponent(nomor)}/status`,
    payload,
    {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    },
  );
  return response.data as { success: boolean; message: string };
};

export const getMasterPenawaranBatal = async () => {
  const response = await api.get('/penawaran/master/batal');
  return (response.data?.data || []) as PenawaranMasterOption[];
};

export const getMasterPenawaranConfirm = async () => {
  const response = await api.get('/penawaran/master/confirm');
  return (response.data?.data || []) as PenawaranMasterOption[];
};

export const requestApprovalPerubahan = async (
  nomor: string,
  payload: ApprovalRequestPayload,
  token?: string | null,
) => {
  const response = await api.post(
    `/penawaran/${encodeURIComponent(nomor)}/pengajuan-perubahan`,
    payload,
    {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    },
  );
  return response.data as {
    success: boolean;
    message: string;
    approval_state: string;
  };
};

export const getPenawaranActivityLogs = async (
  nomor: string,
  token?: string | null,
) => {
  const response = await api.get(
    `/penawaran/${encodeURIComponent(nomor)}/activity-logs`,
    {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    },
  );
  return (response.data?.data || []) as PenawaranActivityLog[];
};
