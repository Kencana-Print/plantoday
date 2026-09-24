export interface OngkirMasterItem {
  id: number;
  alokasi: string;
  harga_kg: number;
  min_kg: number;
  free_spanduk_m: number;
  free_mmt_m2: number;
  free_garmen_pcs: number;
  spanduk_m_per_kg: number;
  mmt_m2_per_kg: number;
  garmen_med_pcs_per_kg: number;
  garmen_prem_pcs_per_kg: number;
}

export interface OngkirCalcResult {
  alokasi: string;
  isCustom: boolean;
  totalBeratKg: number;
  beratDihitungKg: number;
  minKg: number;
  tarifPerKg: number;
  isFreeCharge: boolean;
  freeThreshold: number;
  totalOngkir: number;
  ongkirPerPcs: number;
  ringkasan: string;
}

export const FALLBACK_ONGKIR_OPTIONS: OngkirMasterItem[] = [
  { id: 1, alokasi: 'Jakarta', harga_kg: 2000, min_kg: 20, free_spanduk_m: 1000, free_mmt_m2: 500, free_garmen_pcs: 300, spanduk_m_per_kg: 10, mmt_m2_per_kg: 2, garmen_med_pcs_per_kg: 5, garmen_prem_pcs_per_kg: 3 },
  { id: 2, alokasi: 'Bandung', harga_kg: 2000, min_kg: 20, free_spanduk_m: 1000, free_mmt_m2: 500, free_garmen_pcs: 300, spanduk_m_per_kg: 10, mmt_m2_per_kg: 2, garmen_med_pcs_per_kg: 5, garmen_prem_pcs_per_kg: 3 },
  { id: 3, alokasi: 'Yogya', harga_kg: 2000, min_kg: 20, free_spanduk_m: 1000, free_mmt_m2: 500, free_garmen_pcs: 300, spanduk_m_per_kg: 10, mmt_m2_per_kg: 2, garmen_med_pcs_per_kg: 5, garmen_prem_pcs_per_kg: 3 },
  { id: 4, alokasi: 'Sidoarjo', harga_kg: 2000, min_kg: 20, free_spanduk_m: 1000, free_mmt_m2: 500, free_garmen_pcs: 300, spanduk_m_per_kg: 10, mmt_m2_per_kg: 2, garmen_med_pcs_per_kg: 5, garmen_prem_pcs_per_kg: 3 },
  { id: 5, alokasi: 'Surabaya', harga_kg: 2000, min_kg: 20, free_spanduk_m: 1000, free_mmt_m2: 500, free_garmen_pcs: 300, spanduk_m_per_kg: 10, mmt_m2_per_kg: 2, garmen_med_pcs_per_kg: 5, garmen_prem_pcs_per_kg: 3 },
  { id: 6, alokasi: 'Surakarta', harga_kg: 2000, min_kg: 20, free_spanduk_m: 1000, free_mmt_m2: 500, free_garmen_pcs: 300, spanduk_m_per_kg: 10, mmt_m2_per_kg: 2, garmen_med_pcs_per_kg: 5, garmen_prem_pcs_per_kg: 3 },
  { id: 7, alokasi: 'Jawa Lainnya', harga_kg: 5000, min_kg: 20, free_spanduk_m: 0, free_mmt_m2: 0, free_garmen_pcs: 0, spanduk_m_per_kg: 10, mmt_m2_per_kg: 2, garmen_med_pcs_per_kg: 5, garmen_prem_pcs_per_kg: 3 },
  { id: 8, alokasi: 'Sumatra', harga_kg: 10000, min_kg: 40, free_spanduk_m: 0, free_mmt_m2: 0, free_garmen_pcs: 0, spanduk_m_per_kg: 10, mmt_m2_per_kg: 2, garmen_med_pcs_per_kg: 5, garmen_prem_pcs_per_kg: 3 },
  { id: 9, alokasi: 'Sulawesi', harga_kg: 10000, min_kg: 40, free_spanduk_m: 0, free_mmt_m2: 0, free_garmen_pcs: 0, spanduk_m_per_kg: 10, mmt_m2_per_kg: 2, garmen_med_pcs_per_kg: 5, garmen_prem_pcs_per_kg: 3 },
  { id: 10, alokasi: 'Kalimantan', harga_kg: 15000, min_kg: 40, free_spanduk_m: 0, free_mmt_m2: 0, free_garmen_pcs: 0, spanduk_m_per_kg: 10, mmt_m2_per_kg: 2, garmen_med_pcs_per_kg: 5, garmen_prem_pcs_per_kg: 3 },
  { id: 11, alokasi: 'Bali', harga_kg: 8000, min_kg: 40, free_spanduk_m: 0, free_mmt_m2: 0, free_garmen_pcs: 0, spanduk_m_per_kg: 10, mmt_m2_per_kg: 2, garmen_med_pcs_per_kg: 5, garmen_prem_pcs_per_kg: 3 },
  { id: 12, alokasi: 'Nusa Tenggara', harga_kg: 10000, min_kg: 40, free_spanduk_m: 0, free_mmt_m2: 0, free_garmen_pcs: 0, spanduk_m_per_kg: 10, mmt_m2_per_kg: 2, garmen_med_pcs_per_kg: 5, garmen_prem_pcs_per_kg: 3 },
];

export const hitungOngkirOtomatis = ({
  options = [],
  alokasi = 'Jakarta',
  divisi = '1',
  panjang = 0,
  lebar = 0,
  qty = 0,
  sublim = '',
  customNominal = 0,
  isCustom = false,
}: {
  options?: OngkirMasterItem[];
  alokasi?: string;
  divisi?: string;
  panjang?: number;
  lebar?: number;
  qty?: number;
  sublim?: string;
  customNominal?: number;
  isCustom?: boolean;
}): OngkirCalcResult => {
  const numPanjang = Number(panjang) || 0;
  const numLebar = Number(lebar) || 0;
  const numQty = Number(qty) || 0;
  const normDivisi = String(divisi || '1').trim();

  // Mode Tanpa Ongkir (Opsional / Default Rp 0)
  if (
    !alokasi ||
    String(alokasi).toLowerCase() === 'tanpa ongkir' ||
    String(alokasi).toLowerCase() === 'none' ||
    String(alokasi).trim() === ''
  ) {
    return {
      alokasi: 'Tanpa Ongkir',
      isCustom: false,
      totalBeratKg: 0,
      beratDihitungKg: 0,
      minKg: 0,
      tarifPerKg: 0,
      isFreeCharge: true,
      freeThreshold: 0,
      totalOngkir: 0,
      ongkirPerPcs: 0,
      ringkasan: 'Tanpa Ongkir (Rp 0)',
    };
  }

  // Mode Custom / Manual
  if (isCustom || String(alokasi).toLowerCase() === 'custom' || String(alokasi).toLowerCase() === 'manual') {
    const totalOngkir = Number(customNominal) || 0;
    const ongkirPerPcs = numQty > 0 ? Math.round(totalOngkir / numQty) : totalOngkir;
    return {
      alokasi: 'Custom',
      isCustom: true,
      totalBeratKg: 0,
      beratDihitungKg: 0,
      minKg: 0,
      tarifPerKg: 0,
      isFreeCharge: totalOngkir === 0,
      freeThreshold: 0,
      totalOngkir,
      ongkirPerPcs,
      ringkasan: totalOngkir > 0 ? `Manual: Rp ${totalOngkir.toLocaleString('id-ID')}` : 'Rp 0',
    };
  }

  const masterList = options.length > 0 ? options : FALLBACK_ONGKIR_OPTIONS;
  const matched =
    masterList.find(
      o => o.alokasi.toLowerCase() === String(alokasi).toLowerCase(),
    ) || masterList[0];

  if (!matched) {
    const totalOngkir = Number(customNominal) || 0;
    return {
      alokasi: alokasi || 'Custom',
      isCustom: true,
      totalBeratKg: 0,
      beratDihitungKg: 0,
      minKg: 0,
      tarifPerKg: 0,
      isFreeCharge: false,
      freeThreshold: 0,
      totalOngkir,
      ongkirPerPcs: numQty > 0 ? Math.round(totalOngkir / numQty) : totalOngkir,
      ringkasan: 'Ongkir Manual',
    };
  }

  let totalBeratKg = 0;
  let isFreeCharge = false;
  let freeThreshold = 0;

  if (normDivisi === '1') {
    // Spanduk: 10 meter = 1 kg
    const totalMeter = Math.round(numPanjang * numQty * 100) / 100;
    const rasio = Number(matched.spanduk_m_per_kg) || 10;
    totalBeratKg = rasio > 0 ? totalMeter / rasio : 0;
    freeThreshold = Number(matched.free_spanduk_m) || 0;
    if (freeThreshold > 0 && totalMeter >= freeThreshold) {
      isFreeCharge = true;
    }
  } else if (normDivisi === '5') {
    // MMT: 2 m2 = 1 kg (0.5 kg / m2)
    const luasPerPcs = Math.round(numPanjang * numLebar * 100) / 100;
    const totalLuas = Math.round(luasPerPcs * numQty * 100) / 100;
    const rasio = Number(matched.mmt_m2_per_kg) || 2;
    totalBeratKg = rasio > 0 ? totalLuas / rasio : 0;
    freeThreshold = Number(matched.free_mmt_m2) || 0;
    if (freeThreshold > 0 && totalLuas >= freeThreshold) {
      isFreeCharge = true;
    }
  } else if (normDivisi === '4') {
    // Garmen: 5 pcs/kg (Medium) atau 3 pcs/kg (Premium)
    const isPremium = String(sublim || '').toUpperCase() === 'PREMIUM';
    const rasio = isPremium
      ? Number(matched.garmen_prem_pcs_per_kg) || 3
      : Number(matched.garmen_med_pcs_per_kg) || 5;
    totalBeratKg = rasio > 0 ? numQty / rasio : 0;
    freeThreshold = Number(matched.free_garmen_pcs) || 0;
    if (freeThreshold > 0 && numQty >= freeThreshold) {
      isFreeCharge = true;
    }
  } else {
    totalBeratKg = numQty;
  }

  totalBeratKg = Math.round(totalBeratKg * 100) / 100;

  const minKg = Number(matched.min_kg) || 20;
  const tarifPerKg = Number(matched.harga_kg) || 0;

  let totalOngkir = 0;
  let beratDihitungKg = totalBeratKg;

  if (isFreeCharge) {
    totalOngkir = 0;
    beratDihitungKg = totalBeratKg;
  } else {
    beratDihitungKg = Math.max(totalBeratKg, minKg);
    totalOngkir = Math.round(beratDihitungKg * tarifPerKg);
  }

  const ongkirPerPcs = numQty > 0 ? Math.round(totalOngkir / numQty) : totalOngkir;

  let ringkasan = '';
  if (isFreeCharge) {
    ringkasan = 'Gratis Ongkir (Free Charge)';
  } else {
    ringkasan = `Rp ${totalOngkir.toLocaleString('id-ID')} (${beratDihitungKg}kg @ Rp ${tarifPerKg.toLocaleString('id-ID')}/kg)`;
  }

  return {
    alokasi: matched.alokasi,
    isCustom: false,
    totalBeratKg,
    beratDihitungKg,
    minKg,
    tarifPerKg,
    isFreeCharge,
    freeThreshold,
    totalOngkir,
    ongkirPerPcs,
    ringkasan,
  };
};
