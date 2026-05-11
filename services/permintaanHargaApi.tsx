import api from './api';
import { PUBLIC_IMAGE_READ_ORIGIN } from './api';

export type PermintaanHargaListParams = {
  startDate?: string;
  endDate?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
};

export type PermintaanHargaItem = {
  nomor: string;
  tanggal: string;
  created_at_fmt: string;
  nama: string;
  customer: string;
  divisi: string;
  jml_order: number;
  harga_kalkulasi: number;
  status: string;
  ket_kalkulasi: string;
  user_create: string;
};

export type PermintaanHargaDetail = {
  mh_nomor: string;
  mh_tanggal: string;
  mh_divisi: string;
  mh_cus_kode: string;
  mh_cus_nama: string;
  mh_sal_kode: string;
  mh_nama: string;
  mh_jmlorder: number;
  mh_harga: number;
  mh_budget: number;
  mh_kain: string;
  mh_panjang: number;
  mh_lebar: number;
  mh_ukuran: string;
  mh_gramasi: string;
  mh_finishing: string;
  mh_ket: string;
  mh_status: string;
  mh_harga_kalkulasi: number;
  mh_ket_kalkulasi: string;
  created_at_fmt?: string;
  gambar_1_url?: string;
  gambar_2_url?: string;
};

export type PermintaanHargaPayload = {
  mh_tanggal?: string;
  mh_divisi: string;
  mh_cus_kode: string;
  mh_cus_nama: string;
  mh_sal_kode: string;
  mh_nama: string;
  mh_jmlorder: number;
  mh_harga: number;
  mh_budget: number;
  mh_dateorder?: string;
  mh_kain: string;
  mh_panjang: number;
  mh_lebar: number;
  mh_ukuran: string;
  mh_gramasi: string;
  mh_finishing: string;
  mh_ket: string;
  mh_harga_kalkulasi?: number;
  mh_ket_kalkulasi?: string;
};

export type PermintaanHargaImageUpload = {
  uri: string;
  type?: string;
  name?: string;
  base64?: string;
};

export type PermintaanHargaCreateCustomerPayload = {
  nama: string;
  alamat: string;
  kota: string;
  cus_telp: string;
  cus_cp: string;
  cus_email: string;
  cus_korporasi: 'Y' | 'N';
  cus_jenisusaha?: string;
  cus_npwp?: string;
  cus_nama_npwp?: string;
  cus_alamat_npwp?: string;
  cus_kota_npwp?: string;
};

export const getPermintaanHargaList = async (
  params: PermintaanHargaListParams = {},
  token?: string | null,
) => {
  const response = await api.get('/permintaan-harga', {
    params,
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  return (response.data?.data || []) as PermintaanHargaItem[];
};

export const getPermintaanHargaDetail = async (
  nomor: string,
  token?: string | null,
) => {
  const response = await api.get(
    `/permintaan-harga/${encodeURIComponent(nomor)}`,
    {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    },
  );
  const payload = (response.data?.data || {}) as any;
  const readOrigin = String(PUBLIC_IMAGE_READ_ORIGIN || '').replace(/\/$/, '');
  const rewriteToReadOrigin = (value: any) => {
    if (typeof value !== 'string') return value;
    return value.replace(/^http:\/\/103\.94\.238\.252:8080/i, readOrigin);
  };

  console.log('[permintaanHargaApi.detail] image url mapping', {
    nomor,
    readOrigin,
    raw1: payload?.gambar_1_url,
    raw2: payload?.gambar_2_url,
  });

  return {
    ...payload,
    gambar_1_url: rewriteToReadOrigin(payload?.gambar_1_url),
    gambar_2_url: rewriteToReadOrigin(payload?.gambar_2_url),
    gambar_1_legacy_url: rewriteToReadOrigin(payload?.gambar_1_legacy_url),
    gambar_2_legacy_url: rewriteToReadOrigin(payload?.gambar_2_legacy_url),
    image1: rewriteToReadOrigin(payload?.image1),
    image2: rewriteToReadOrigin(payload?.image2),
  } as PermintaanHargaDetail;
};

export const createPermintaanHarga = async (
  payload: PermintaanHargaPayload,
  token?: string | null,
) => {
  const response = await api.post('/permintaan-harga', payload, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  return response.data?.data as { nomor: string };
};

export const updatePermintaanHarga = async (
  nomor: string,
  payload: PermintaanHargaPayload,
  token?: string | null,
) => {
  const response = await api.put(
    `/permintaan-harga/${encodeURIComponent(nomor)}`,
    payload,
    {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    },
  );
  return response.data?.data as { nomor: string };
};

export const createPermintaanHargaCustomer = async (
  payload: PermintaanHargaCreateCustomerPayload,
  token?: string | null,
) => {
  const response = await api.post('/permintaan-harga/customer', payload, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  return response.data?.data as { kode: string; nama: string };
};

export const uploadPermintaanHargaImage = async (
  nomor: string,
  slot: 1 | 2,
  file: PermintaanHargaImageUpload,
  token?: string | null,
) => {
  const rawUri = String(file.uri || '').trim();
  const normalizedType = file.type || 'image/jpeg';
  const cleanedNomor = String(nomor || '').trim();
  const fallbackName =
    String(file.name || '').trim() ||
    `${cleanedNomor}${slot === 2 ? '-2' : ''}.${
      normalizedType.includes('png') ? 'png' : 'jpg'
    }`;
  const normalizedName = fallbackName;
  const normalizedUri = rawUri.startsWith('content://')
    ? rawUri
    : rawUri.startsWith('file://')
    ? rawUri
    : `file://${rawUri}`;
  const uploadPath = normalizedUri.startsWith('file://')
    ? normalizedUri.replace('file://', '')
    : normalizedUri;

  console.log('[permintaanHargaApi.upload] prepare', {
    nomor,
    slot,
    hasToken: Boolean(token),
    rawUri,
    normalizedUri,
    uploadPath,
    type: normalizedType,
    name: normalizedName,
  });

  const blobToDataUrl =
    typeof FileReader !== 'undefined'
      ? (blob: Blob) =>
          new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(String(reader.result || ''));
            reader.onerror = () =>
              reject(reader.error || new Error('read failed'));
            reader.readAsDataURL(blob);
          })
      : null;

  try {
    let base64DataUrl = '';
    const providedBase64 = String(file.base64 || '').trim();
    if (providedBase64) {
      base64DataUrl = `data:${normalizedType};base64,${providedBase64}`;
    } else {
      if (!blobToDataUrl) {
        throw new Error('FileReader tidak tersedia pada runtime');
      }
      const localFileResponse = await fetch(normalizedUri);
      if (!localFileResponse.ok) {
        throw new Error(
          `Gagal membaca file lokal untuk upload (${localFileResponse.status})`,
        );
      }
      const localBlob = await localFileResponse.blob();
      base64DataUrl = await blobToDataUrl(localBlob);
    }

    const response = await api.post(
      `/permintaan-harga/${encodeURIComponent(nomor)}/gambar-base64/${slot}`,
      {
        file_base64: base64DataUrl,
        file_name: normalizedName,
        file_type: normalizedType,
      },
      {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        skipDedupe: true,
      } as any,
    );

    const parsed = response.data || null;

    if (parsed?.success === false) {
      const error: any = new Error(parsed?.message || 'Upload base64 gagal');
      error.status = response.status;
      error.response = { status: response.status, data: parsed };
      throw error;
    }

    console.log('[permintaanHargaApi.upload] success', {
      nomor,
      slot,
      status: response.status,
      data: parsed?.data,
      mode: 'base64',
    });
    return parsed?.data;
  } catch (err: any) {
    console.log('[permintaanHargaApi.upload] error', {
      nomor,
      slot,
      message: err?.message,
      code: err?.code,
      status: err?.status || err?.response?.status,
      responseData: err?.response?.data,
      requestMethod: 'POST',
    });
    throw err;
  }
};
