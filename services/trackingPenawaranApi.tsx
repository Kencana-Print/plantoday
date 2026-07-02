import api from './api';

export type TrackingPenawaranListParams = {
  startDate?: string;
  endDate?: string;
  search?: string;
  sales?: string;
  customer?: string;
  status?: string;
  limit?: number;
};

export type TrackingPenawaranListItem = {
  no_penawaran: string;
  tanggal_penawaran: string;
  customer: string;
  sales: string;
  total_item: number;
  total_item_map: number;
  no_map: string;
  map_status: string;
  map_deadline: string;
  map_workshop: string;
  map_keterangan: string;
  map_kendala: string;
  status_tracking?: 'OPEN' | 'PARSIAL' | 'CLOSE';
};

export type TrackingPenawaranStatusCounts = {
  OPEN: number;
  PARSIAL: number;
  CLOSE: number;
};

export type TrackingMapDetailItem = {
  pen_id: string;
  no_map: string;
  map_nama?: string;
  tanggal_map: string;
  map_deadline: string;
  map_divisi: number;
  map_workshop: string;
  map_status: string;
  map_keterangan: string;
  map_kendala: string;
  map_close: string;
};

export type TrackingPenawaranDetailResponse = {
  header: {
    no_penawaran: string;
  };
  summary: {
    total_map_item: number;
    total_map_number: number;
    map_numbers: string[];
  };
  map_details: TrackingMapDetailItem[];
  meta_optional: {
    references: {
      no_permintaan: string;
      map_divisi: number;
      map_perusahaan_kode: string;
      map_customer_kode: string;
    };
    revision: {
      map_revisi: string;
      map_revisi_no: number;
    };
    audit: {
      map_user_create: string;
      map_user_modified: string;
      map_date_create: string | null;
      map_date_modified: string | null;
    };
  };
};

export const getTrackingPenawaranList = async (
  params: TrackingPenawaranListParams = {},
  token?: string | null,
) => {
  const response = await api.get('/tracking-penawaran', {
    params: {
      ...params,
      search: params.search?.trim() || undefined,
      sales: params.sales?.trim() || undefined,
      customer: params.customer?.trim() || undefined,
    },
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });

  return {
    items: (response?.data?.data ?? []) as TrackingPenawaranListItem[],
    filter_options: (response?.data?.meta?.filter_options ?? { sales: [], customers: [] }) as {
      sales: string[];
      customers: string[];
    },
  };
};

export const getTrackingPenawaranDetail = async (
  noPenawaran: string,
  token?: string | null,
) => {
  const normalizedNoPenawaran = String(noPenawaran || '').trim();
  if (!normalizedNoPenawaran) {
    return {
      header: { no_penawaran: '' },
      summary: {
        total_map_item: 0,
        total_map_number: 0,
        map_numbers: [],
      },
      map_details: [],
      meta_optional: {
        references: {
          no_permintaan: '',
          map_divisi: 0,
          map_perusahaan_kode: '',
          map_customer_kode: '',
        },
        revision: {
          map_revisi: '',
          map_revisi_no: 0,
        },
        audit: {
          map_user_create: '',
          map_user_modified: '',
          map_date_create: null,
          map_date_modified: null,
        },
      },
    } as TrackingPenawaranDetailResponse;
  }

  const response = await api.get('/tracking-penawaran/detail', {
    params: {
      noPenawaran: normalizedNoPenawaran,
    },
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });

  return (response?.data?.data ?? {
    header: { no_penawaran: normalizedNoPenawaran },
    summary: {
      total_map_item: 0,
      total_map_number: 0,
      map_numbers: [],
    },
    map_details: [],
    meta_optional: {
      references: {
        no_permintaan: '',
        map_divisi: 0,
        map_perusahaan_kode: '',
        map_customer_kode: '',
      },
      revision: {
        map_revisi: '',
        map_revisi_no: 0,
      },
      audit: {
        map_user_create: '',
        map_user_modified: '',
        map_date_create: null,
        map_date_modified: null,
      },
    },
  }) as TrackingPenawaranDetailResponse;
};

export const getTrackingPenawaranStatusCounts = async (
  params?: { startDate?: string; endDate?: string } | null,
  token?: string | null,
) => {
  const response = await api.get('/tracking-penawaran/status-counts', {
    params: params || undefined,
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  return (response.data?.data ?? {
    OPEN: 0,
    PARSIAL: 0,
    CLOSE: 0,
  }) as TrackingPenawaranStatusCounts;
};
