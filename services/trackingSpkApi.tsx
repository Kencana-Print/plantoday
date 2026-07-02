import api from './api';

export type TrackingSpkListParams = {
    startDate?: string;
    endDate?: string;
    search?: string;
    filterStatus?: string;
    limit?: number;
};

export type TrackingSpkListItem = {
    spk_nomor: string;
    spk_tanggal: string;
    spk_nama: string;
    spk_jumlah: number;
    estimasi_list: { tanggal: string; jumlah: number }[];
    estimasi_total: number;
    komitmen_list: { tanggal: string; jumlah: number }[];
    komitmen_total: number;
    realisasi_list: { tanggal: string; jumlah: number }[];
    realisasi_total: number;
};

export const getTrackingSpkList = async (
    params: TrackingSpkListParams = {},
    token?: string | null,
) => {
    const response = await api.get('/tracking-spk', {
        params: {
            ...params,
            search: params.search?.trim() || undefined,
        },
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });

    return (response?.data?.data ?? []) as TrackingSpkListItem[];
};

export type TrackingSpkStatusCounts = {
    BELUM: number;
    PROSES: number;
    SUDAH: number;
};

export const getTrackingSpkStatusCounts = async (
    params?: { startDate?: string; endDate?: string } | null,
    token?: string | null,
) => {
    const response = await api.get('/tracking-spk/status-counts', {
        params: params || undefined,
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    return (response?.data?.data ?? { BELUM: 0, PROSES: 0, SUDAH: 0 }) as TrackingSpkStatusCounts;
};
