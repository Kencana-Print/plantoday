import api from './api';

export type TrackingMapListParams = {
  startDate?: string;
  endDate?: string;
  search?: string;
  sales?: string;
  filterBast?: string;
  filterSjMap?: string;
};


export type TrackingMapListItem = {
  no_map: string;
  customer: string;
  alamat: string;
  tanggal_map: string;
  tanggal_bast?: string;
  tanggal_sj_map?: string;
  nomor_sj?: string;
  mspk_nama?: string;
  mspk_ukuran?: string;
  mspk_kain?: string;
  mspk_finishing?: string;
  mspk_keterangan?: string;
  sales?: string;
};

export const getTrackingMapList = async (
  params: TrackingMapListParams = {},
  token?: string | null,
) => {
  const response = await api.get('/tracking-map', {
    params: {
      ...params,
      search: params.search?.trim() || undefined,
      sales: params.sales?.trim() || undefined,
    },
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });

  return {
    items: (response?.data?.data ?? []) as TrackingMapListItem[],
    filter_options: (response?.data?.meta?.filter_options ?? { sales: [] }) as {
      sales: string[];
    },
  };
};
