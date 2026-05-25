import api from './api';

export type TrackingSpkListParams = {
    startDate?: string;
    endDate?: string;
    search?: string;
    filterStatus?: string;
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
