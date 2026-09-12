const fs = require('fs');
const path = require('path');

/**
 * Türkçe karakter normalizasyonu
 */
function normalizeTr(str) {
  if (!str) return '';
  return str
    .replace(/İ/g, 'I').replace(/ı/g, 'i')
    .replace(/Ğ/g, 'G').replace(/ğ/g, 'g')
    .replace(/Ü/g, 'U').replace(/ü/g, 'u')
    .replace(/Ş/g, 'S').replace(/ş/g, 's')
    .replace(/Ö/g, 'O').replace(/ö/g, 'o')
    .replace(/Ç/g, 'C').replace(/ç/g, 'c')
    .toUpperCase();
}

/**
 * Adreste Mahalle var mı kontrolü (KULLANICI KURALI: Mahalle yoksa haritada pin olmayacak!)
 */
function hasMahalle(addressText) {
  if (!addressText) return false;
  const norm = normalizeTr(addressText);
  return /MAH(\.|\b)|MAHALLE|MH(\.|\b)/.test(norm);
}

// 1. Erzurum Mahalle Merkezleri Referans Veritabanı
const MAHALLE_COORDS = {
  // Yakutiye
  'LALAPAŞA': { lat: 39.9078, lng: 41.2660 },
  'MURATPAŞA': { lat: 39.9025, lng: 41.2710 },
  'MURAT PAŞA': { lat: 39.9025, lng: 41.2710 },
  'RABİA ANA': { lat: 39.9045, lng: 41.2760 },
  'RABİAANA': { lat: 39.9045, lng: 41.2760 },
  'ŞÜKRÜPAŞA': { lat: 39.9210, lng: 41.2650 },
  'KAZIM KARABEKİR': { lat: 39.9140, lng: 41.2730 },
  'KAZIM KARABEKİR PAŞA': { lat: 39.9140, lng: 41.2730 },
  'ÖMER NASUHİ BİLMEN': { lat: 39.9160, lng: 41.2580 },
  'OMER NASUHI BILMEN': { lat: 39.9160, lng: 41.2580 },
  'GEZ': { lat: 39.9080, lng: 41.2610 },
  'YONCALIK': { lat: 39.9010, lng: 41.2770 },
  'SANAYİ': { lat: 39.9280, lng: 41.2550 },
  'GÜLAHMET': { lat: 39.9060, lng: 41.2820 },
  'VEYİSEFENDİ': { lat: 39.9095, lng: 41.2800 },
  'HASANİ BASRİ': { lat: 39.9080, lng: 41.2870 },
  'ALİPAŞA': { lat: 39.9070, lng: 41.2750 },
  'AYAZPAŞA': { lat: 39.9055, lng: 41.2735 },
  'KAVAK': { lat: 39.9030, lng: 41.2780 },

  // Palandöken
  'HÜSEYİN AVNİ ULAŞ': { lat: 39.8780, lng: 41.2420 },
  'HÜSEYİN ACNİ ULAŞ': { lat: 39.8780, lng: 41.2420 },
  'AVNİ ULAŞ': { lat: 39.8780, lng: 41.2420 },
  'ADNAN MENDERES': { lat: 39.8850, lng: 41.2520 },
  'YUNUS EMRE': { lat: 39.8820, lng: 41.2660 },
  'MÜFTÜ SOLAKZADE': { lat: 39.8890, lng: 41.2610 },
  'YILDIZKENT': { lat: 39.8740, lng: 41.2430 },
  'YENİŞEHİR': { lat: 39.8910, lng: 41.2570 },
  'ERTUĞRUL GAZİ': { lat: 39.8870, lng: 41.2680 },
  'KAYAKYOLU': { lat: 39.8790, lng: 41.2580 },

  // Aziziye
  'SELÇUKLU': { lat: 39.9240, lng: 41.2020 },
  'SALTUKLU': { lat: 39.9320, lng: 41.1850 },
  'ILICA': { lat: 39.9450, lng: 41.1450 },
  'DADAŞKENT': { lat: 39.9280, lng: 41.2150 },
};

// 2. Erzurum Ana Arterleri ve Kapı Numarası Hassas İnterpolasyon Fonksiyonları
const STREET_AXES = {
  // Şehit Polis Murat Ellik Bulvarı: No 1-2 (Altuğ Park / Sezer Loft) -> No 45 (Güney ucu)
  MURAT_ELLIK: {
    start: { lat: 39.8830, lng: 41.2425, no: 1 },
    end: { lat: 39.8670, lng: 41.2380, no: 45 },
  },
  // 200. Cadde (Hüseyin Avni Ulaş / Yıldızkent): No 1 (Çat yolu kavşağı) -> No 30 (Alparslan Türkeş yönü)
  CADDE_200: {
    start: { lat: 39.8775, lng: 41.2442, no: 1 },
    end: { lat: 39.8732, lng: 41.2398, no: 30 },
  },
  // Mumcu Caddesi: No 1 (Havuzbaşı civarı) -> No 35 (Yukarı Mumcu / Atatürk Evi)
  MUMCU: {
    start: { lat: 39.9074, lng: 41.2726, no: 1 },
    end: { lat: 39.9098, lng: 41.2692, no: 35 },
  },
  // Terminal Caddesi: No 1 (Lalapaşa parkı) -> No 45 (MNG AVM civarı)
  TERMINAL: {
    start: { lat: 39.9072, lng: 41.2588, no: 1 },
    end: { lat: 39.9045, lng: 41.2542, no: 45 },
  },
  // Cumhuriyet Caddesi: No 1 (Çaykara kavşağı) -> No 80 (Kale / Çifte Minareli)
  CUMHURIYET: {
    start: { lat: 39.9072, lng: 41.2702, no: 1 },
    end: { lat: 39.9056, lng: 41.2785, no: 80 },
  },
  // Prof. Dr. Necmettin Erbakan Bulvarı: No 10 -> No 75
  NECMETTIN_ERBAKAN: {
    start: { lat: 39.9212, lng: 41.2145, no: 10 },
    end: { lat: 39.9255, lng: 41.1960, no: 75 },
  },
  // Çat Yolu Caddesi: No 1 (Devlet Hastanesi / Üniversite) -> No 60 (Çat yönü)
  CAT_YOLU: {
    start: { lat: 39.8880, lng: 41.2520, no: 1 },
    end: { lat: 39.8650, lng: 41.2350, no: 60 },
  },
  // Yenikapı Caddesi: No 1 -> No 80
  YENIKAPI: {
    start: { lat: 39.9058, lng: 41.2730, no: 1 },
    end: { lat: 39.9022, lng: 41.2762, no: 80 },
  },
  // Sabunhane Sokak: No 1 -> No 35
  SABUNHANE: {
    start: { lat: 39.9020, lng: 41.2685, no: 1 },
    end: { lat: 39.9002, lng: 41.2708, no: 35 },
  },
  // Melike Mama Hatun Sokak: No 1 -> No 15
  MELIKE_MAMA_HATUN: {
    start: { lat: 39.9094, lng: 41.2602, no: 1 },
    end: { lat: 39.9085, lng: 41.2588, no: 15 },
  },
  // İbrahim Ethem Seven Sokak: No 1 -> No 20
  IBRAHIM_ETHEM_SEVEN: {
    start: { lat: 39.9080, lng: 41.2685, no: 1 },
    end: { lat: 39.9088, lng: 41.2698, no: 20 },
  },
  // Çaykara Caddesi: No 1 -> No 50
  CAYKARA: {
    start: { lat: 39.9075, lng: 41.2695, no: 1 },
    end: { lat: 39.9115, lng: 41.2655, no: 50 },
  },
  // Menderes Caddesi (Yakutiye): No 1 -> No 40
  MENDERES_CAD: {
    start: { lat: 39.9085, lng: 41.2650, no: 1 },
    end: { lat: 39.9065, lng: 41.2610, no: 40 },
  },
  // 50. Yıl Caddesi (Ömer Nasuhi Bilmen): No 1 -> No 60
  YIL_50: {
    start: { lat: 39.9145, lng: 41.2595, no: 1 },
    end: { lat: 39.9190, lng: 41.2550, no: 60 },
  },
};

// 3. Özel Bina, AVM, Site ve İş Merkezleri Veritabanı (En Yüksek Hassasiyet)
const LANDMARK_BUILDINGS = [
  // Şehit Polis Murat Ellik Bulvarı & Altuğ Park (Kullanıcı Görsel-1 Düzeltmesi)
  { pattern: /ALTUĞ PARK|ALTUG PARK|ALTUĞ SİT|ALTUG SIT/i, lat: 39.88280, lng: 41.24240, name: 'Altuğ Park / Sitesi (Şehit Polis Murat Ellik Blv No:2)' },
  { pattern: /SEZER LOFT/i, lat: 39.88300, lng: 41.24250, name: 'Sezer Loft (Şehit Polis Murat Ellik Blv No:1)' },
  { pattern: /DİKER SİT|DIKER SIT/i, lat: 39.86790, lng: 41.23850, name: 'Diker Sitesi (Şehit Polis Murat Ellik Bulv No:31)' },
  { pattern: /DENİZ YAPI.*MURAT ELLİK|MURAT ELLİK.*DENİZ YAPI|DENİZ YAPI B BLOK/i, lat: 39.86880, lng: 41.23920, name: 'Deniz Yapı B Blok (Şehit Polis Murat Ellik Bulv No:29)' },

  // Hüseyin Avni Ulaş / Yıldızkent
  { pattern: /BAŞYAPIT|BASYAPIT|MODALİFE|MODALIFE/i, lat: 39.87350, lng: 41.24350, name: 'Başyapıt / Modalife (Aladağ Sok)' },
  { pattern: /GOLDCİTY|GOLDCITY/i, lat: 39.87450, lng: 41.23800, name: 'Goldcity A Blok (TOKİ 2. Sk No:29)' },
  { pattern: /ŞAMPİYON EVLER/i, lat: 39.87180, lng: 41.24050, name: 'Şampiyon Evler (Hüseyin Avni Ulaş 103. Sk)' },
  { pattern: /SEVGİ APT/i, lat: 39.87250, lng: 41.24180, name: 'Sevgi Apartmanı (Hüseyin Avni Ulaş 13. Ara Sok)' },
  { pattern: /ULAŞIM DAİRE/i, lat: 39.87120, lng: 41.24350, name: 'Erzurum B.Ş.B. Ulaşım Dairesi (Yıldızkent 14. Ara Sok)' },
  { pattern: /DUTÇU KÜME|DUTCU KUME/i, lat: 39.86600, lng: 41.22800, name: 'Dutçu Küme Evleri (Hüseyin Avni Ulaş)' },

  // Lalapaşa / Mumcu / Terminal
  { pattern: /SERRA CİTY|SERRA CITY/i, lat: 39.90685, lng: 41.27082, name: 'Serra City AVM (Cumhuriyet Cad)' },
  { pattern: /AK MERKEZ|AKMERKEZ/i, lat: 39.90635, lng: 41.27315, name: 'Ak Merkez (Cumhuriyet Cad No:70)' },
  { pattern: /ERZURUM EVLER/i, lat: 39.90578, lng: 41.27845, name: 'Erzurum Evleri (Yüzbaşı Sok/Cumhuriyet)' },
  { pattern: /ALAÇATI MUHALLEBİCİSİ|ALAÇATI/i, lat: 39.90665, lng: 41.25812, name: 'Alaçatı Muhallebicisi (Özen Apt/Terminal)' },
  { pattern: /MNG AVM|MNG ALIŞVERİŞ/i, lat: 39.91154, lng: 41.25148, name: 'MNG AVM (Terminal Cad No:45)' },
  { pattern: /FORUM ERZURUM/i, lat: 39.89785, lng: 41.25892, name: 'Forum Erzurum AVM (Palandöken)' },
  { pattern: /KAZIM KARABEKİR İŞ MRK|NAFİZ ERGÜN/i, lat: 39.90852, lng: 41.27154, name: 'Kazım Karabekir İş Mrk (Nafiz Ergün Sok)' },
  { pattern: /MUMCU İŞ MRK/i, lat: 39.90915, lng: 41.27025, name: 'Mumcu İş Merkezi (Mumcu Cad No:26)' },
  { pattern: /DENİZ APT.*MUMCU|MUMCU.*DENİZ APT/i, lat: 39.90845, lng: 41.27125, name: 'Deniz Apt (Mumcu Cad No:14)' },
  { pattern: /ÖZEN APT/i, lat: 39.90665, lng: 41.25812, name: 'Özen Apartmanı (Terminal Cad)' },
  { pattern: /SERHAT APT/i, lat: 39.90520, lng: 41.25550, name: 'Serhat Apartmanı (Terminal Cad No:33)' },

  // Muratpaşa / Haşıl Efendi
  { pattern: /KARİZMA APARTMANI|KARİZMA APT/i, lat: 39.90180, lng: 41.27350, name: 'Karizma Apt (Muhyettin Aksak Blv No:8)' },
  { pattern: /ERKAL İŞ MERKEZİ|VANİEFENDİ/i, lat: 39.90350, lng: 41.27200, name: 'Erkal / Vani Efendi İş Mrk (Haşıl Efendi Cad)' },

  // Dadaşkent (Selçuklu / Saltuklu)
  { pattern: /TARABYA EVLER/i, lat: 39.92150, lng: 41.21200, name: 'Tarabya Evleri (Necmettin Erbakan Blv No:25)' },
  { pattern: /GÜZELKENT/i, lat: 39.92380, lng: 41.20250, name: 'Güzelkent A Blok (Necmettin Erbakan Blv No:54)' },
  { pattern: /ÖZDOĞU KENT|OZDOĞU KENT/i, lat: 39.92480, lng: 41.19800, name: 'Özdoğu Kent (Necmettin Erbakan Blv No:61)' },

  // Üniversite / Teknokent
  { pattern: /ATA TEKNOKENT|TEKNO KENT|TEKNOKENT/i, lat: 39.89500, lng: 41.24200, name: 'Ata Teknokent (Çat Yolu Cad)' },

  // Ömer Nasuhi Bilmen / Kombina
  { pattern: /PRESTİJ PARK|PRESTIJ PARK/i, lat: 39.92350, lng: 41.26300, name: 'Prestij Park (Korg. Zekai Aksakallı Cad No:8A)' },
  { pattern: /KOMBİNA CAD|KOMBINA CAD/i, lat: 39.91850, lng: 41.26140, name: 'Kombina Caddesi (Ömer Nasuhi Bilmen)' },
];

/**
 * Bir caddede kapı numarasına göre hassas konum interpolasyonu yapar.
 */
function interpolateStreetNumber(axis, targetNo) {
  if (!axis) return null;
  const { start, end } = axis;
  const minNo = Math.min(start.no, end.no);
  const maxNo = Math.max(start.no, end.no);
  
  const clampedNo = Math.max(minNo, Math.min(maxNo, targetNo));
  const ratio = (clampedNo - minNo) / (maxNo - minNo);

  const lat = Number((start.lat + (end.lat - start.lat) * ratio).toFixed(6));
  const lng = Number((start.lng + (end.lng - start.lng) * ratio).toFixed(6));

  return { lat, lng };
}

/**
 * Adres metninden kapı numarasını ayıklar
 */
function extractDoorNumber(addressText) {
  if (!addressText) return null;
  const m = addressText.match(/NO\s*:\s*([!0-9]+)/i) || addressText.match(/NO\s*([!0-9]+)/i);
  if (m && m[1]) {
    const cleanNum = m[1].replace('!', '1');
    const num = parseInt(cleanNum, 10);
    if (!isNaN(num) && num > 0) return num;
  }
  return null;
}

/**
 * Adresten Mahalle bilgisini ayıklar
 */
function extractMahalle(addressText) {
  if (!addressText) return null;
  const norm = normalizeTr(addressText);
  for (const mName of Object.keys(MAHALLE_COORDS)) {
    if (norm.includes(normalizeTr(mName))) {
      return mName;
    }
  }
  return null;
}

/**
 * Hiyerarşik Hassas Konumlandırıcı
 * 1. ADIM: Adreste Mahalle Yoksa -> null döner (HARİTADA PİN GÖSTERİLMEZ!)
 * 2. ADIM: Mahalle Varsa -> Mahalle İçinde Özel Landmark / Bina / Site Eşleşmesi
 * 3. ADIM: Mahalle İçinde Sokak / Cadde ve Kapı Numarası Hassas İnterpolasyonu
 * 4. ADIM: Sokak/Cadde yoksa -> Hassas Mahalle Merkezi (Mikro-saçılımlı)
 * 5. ADIM: Dış İl/İlçe Mahalleli cariler için mevcut geocoded koordinat korunur
 */
function resolveHierarchicalLocation(cari) {
  const address = (cari.adres || '').trim();

  // KULLANICI KURALI: Adresinde Mahalle yoksa haritada gösterilmeyecek!
  if (!hasMahalle(address)) {
    return null;
  }

  const norm = normalizeTr(address);
  const normAd = normalizeTr(cari.ad || '');
  const combined = norm + ' ' + normAd;

  // 1. ÖZEL LANDMARK / BİNA / SİTE EŞLEŞMESİ (En yüksek hassasiyet - Görsel 1 Altuğ Park vb.)
  for (const lm of LANDMARK_BUILDINGS) {
    if (lm.pattern.test(combined)) {
      return {
        lat: Number(lm.lat.toFixed(6)),
        lng: Number(lm.lng.toFixed(6)),
        matchType: 'LANDMARK_BUILDING',
        detail: lm.name,
      };
    }
  }

  // 2. CADDE / SOKAK VE KAPI NUMARASI İNTERPOLASYONU (Mahalle İçinde)
  const doorNo = extractDoorNumber(address);

  // Şehit Polis Murat Ellik Bulvarı (Kullanıcı Bildirimi: Altuğ Park No:2 kuzeyde, Deniz Yapı güneyde)
  if (/MURAT ELLIK|MURAT ELLİK/i.test(norm)) {
    const coord = interpolateStreetNumber(STREET_AXES.MURAT_ELLIK, doorNo || 2);
    return { ...coord, matchType: doorNo ? 'STREET_DOOR_NO' : 'STREET_CENTER', detail: `Şht. Polis Murat Ellik Blv. No:${doorNo || 'Ortası'}` };
  }

  // 200. Cadde (Yıldızkent / Hüseyin Avni Ulaş)
  if (/200\.\s*CAD/i.test(norm)) {
    const coord = interpolateStreetNumber(STREET_AXES.CADDE_200, doorNo || 12);
    return { ...coord, matchType: doorNo ? 'STREET_DOOR_NO' : 'STREET_CENTER', detail: `200. Cad. No:${doorNo || 'Ortası'}` };
  }

  // Mumcu Caddesi (Lalapaşa)
  if (/MUMCU/i.test(norm)) {
    const coord = interpolateStreetNumber(STREET_AXES.MUMCU, doorNo || 15);
    return { ...coord, matchType: doorNo ? 'STREET_DOOR_NO' : 'STREET_CENTER', detail: `Mumcu Cad. No:${doorNo || 'Ortası'}` };
  }

  // Terminal Caddesi (Lalapaşa)
  if (/TERMINAL|TERMİNAL/i.test(norm)) {
    const coord = interpolateStreetNumber(STREET_AXES.TERMINAL, doorNo || 20);
    return { ...coord, matchType: doorNo ? 'STREET_DOOR_NO' : 'STREET_CENTER', detail: `Terminal Cad. No:${doorNo || 'Ortası'}` };
  }

  // Cumhuriyet Caddesi
  if (/CUMHURIYET|CUMHURİYET/i.test(norm)) {
    const coord = interpolateStreetNumber(STREET_AXES.CUMHURIYET, doorNo || 35);
    return { ...coord, matchType: doorNo ? 'STREET_DOOR_NO' : 'STREET_CENTER', detail: `Cumhuriyet Cad. No:${doorNo || 'Ortası'}` };
  }

  // Prof. Dr. Necmettin Erbakan Bulvarı (Dadaşkent / Selçuklu / Saltuklu)
  if (/NECMETTIN ERBAKAN|NECMETTİN ERBAKAN/i.test(norm)) {
    const coord = interpolateStreetNumber(STREET_AXES.NECMETTIN_ERBAKAN, doorNo || 40);
    return { ...coord, matchType: doorNo ? 'STREET_DOOR_NO' : 'STREET_CENTER', detail: `Necmettin Erbakan Blv. No:${doorNo || 'Ortası'}` };
  }

  // Çat Yolu Caddesi
  if (/CAT YOLU|ÇAT YOLU/i.test(norm)) {
    const coord = interpolateStreetNumber(STREET_AXES.CAT_YOLU, doorNo || 25);
    return { ...coord, matchType: doorNo ? 'STREET_DOOR_NO' : 'STREET_CENTER', detail: `Çat Yolu Cad. No:${doorNo || 'Ortası'}` };
  }

  // 50. Yıl Caddesi (Ömer Nasuhi Bilmen)
  if (/50\.\s*YIL/i.test(norm)) {
    const coord = interpolateStreetNumber(STREET_AXES.YIL_50, doorNo || 35);
    return { ...coord, matchType: doorNo ? 'STREET_DOOR_NO' : 'STREET_CENTER', detail: `50. Yıl Cad. No:${doorNo || 'Ortası'}` };
  }

  // Yenikapı Caddesi
  if (/YENIKAPI|YENİKAPI/i.test(norm)) {
    const coord = interpolateStreetNumber(STREET_AXES.YENIKAPI, doorNo || 35);
    return { ...coord, matchType: doorNo ? 'STREET_DOOR_NO' : 'STREET_CENTER', detail: `Yenikapı Cad. No:${doorNo || 'Ortası'}` };
  }

  // Sabunhane Sokak
  if (/SABUNHANE/i.test(norm)) {
    const coord = interpolateStreetNumber(STREET_AXES.SABUNHANE, doorNo || 15);
    return { ...coord, matchType: doorNo ? 'STREET_DOOR_NO' : 'STREET_CENTER', detail: `Sabunhane Sok. No:${doorNo || 'Ortası'}` };
  }

  // Melike Mama Hatun Sokak
  if (/MELIKE MAMA|MELİKE MAMA/i.test(norm)) {
    const coord = interpolateStreetNumber(STREET_AXES.MELIKE_MAMA_HATUN, doorNo || 5);
    return { ...coord, matchType: doorNo ? 'STREET_DOOR_NO' : 'STREET_CENTER', detail: `Melike Mama Hatun Sk. No:${doorNo || 'Ortası'}` };
  }

  // İbrahim Ethem Seven Sokak
  if (/IBRAHIM ETHEM|İBRAHİM ETHEM/i.test(norm)) {
    const coord = interpolateStreetNumber(STREET_AXES.IBRAHIM_ETHEM_SEVEN, doorNo || 8);
    return { ...coord, matchType: doorNo ? 'STREET_DOOR_NO' : 'STREET_CENTER', detail: `İbrahim Ethem Seven Sk. No:${doorNo || 'Ortası'}` };
  }

  // Çaykara Caddesi
  if (/CAYKARA|ÇAYKARA/i.test(norm)) {
    const coord = interpolateStreetNumber(STREET_AXES.CAYKARA, doorNo || 20);
    return { ...coord, matchType: doorNo ? 'STREET_DOOR_NO' : 'STREET_CENTER', detail: `Çaykara Cad. No:${doorNo || 'Ortası'}` };
  }

  // Menderes Caddesi (Yakutiye)
  if (/MENDERES CAD/i.test(norm)) {
    const coord = interpolateStreetNumber(STREET_AXES.MENDERES_CAD, doorNo || 15);
    return { ...coord, matchType: doorNo ? 'STREET_DOOR_NO' : 'STREET_CENTER', detail: `Menderes Cad. No:${doorNo || 'Ortası'}` };
  }

  // 3. ADIM: MAHALLE MERKEZİ EŞLEŞMESİ (Sokak/Cadde bulunamadıysa)
  const mahalle = extractMahalle(address);
  if (mahalle && MAHALLE_COORDS[mahalle]) {
    const mCoord = MAHALLE_COORDS[mahalle];
    const hash = (cari.id || 0) % 20;
    const latOffset = ((hash % 5) - 2) * 0.00035;
    const lngOffset = (Math.floor(hash / 5) - 2) * 0.00045;

    return {
      lat: Number((mCoord.lat + latOffset).toFixed(6)),
      lng: Number((mCoord.lng + lngOffset).toFixed(6)),
      matchType: 'MAHALLE_PRECISE',
      detail: `${mahalle} Mahallesi`,
    };
  }

  // 4. ADIM: Dış İl / İlçe Mahalleli Cariler İçin Mevcut Geçerli Koordinat Korunur
  if (cari.enlem && cari.boylam) {
    return {
      lat: cari.enlem,
      lng: cari.boylam,
      matchType: 'EXISTING_COORDINATE',
      detail: 'Mevcut Hassas Koordinat',
    };
  }

  return null;
}

// Ana Çalıştırma
function main() {
  const assetsFile = path.join(__dirname, '..', 'mobil', 'assets', 'cariler.json');
  const webDataFile = path.join(__dirname, '..', 'web', 'public', 'data', 'cariler.json');

  const rawData = JSON.parse(fs.readFileSync(assetsFile, 'utf8'));
  const cariler = rawData.cariler || [];

  console.log('=================================================================');
  console.log('   CARİRADAR: HİYERARŞİK HASSAS KONUMLANDIRMA MOTORU (v3.0)');
  console.log('   (Mahalle Kontrolü ➔ Sokak/Cadde ➔ Kapı No Seviyesinde Eşleme)');
  console.log('=================================================================\n');

  let landmarkCount = 0;
  let doorNoCount = 0;
  let mahalleCount = 0;
  let keptCount = 0;
  let hiddenCount = 0;

  const updatedCariler = cariler.map((c) => {
    const res = resolveHierarchicalLocation(c);
    
    // KURAL: Mahalle yoksa haritada pin olmayacak (enlem/boylam = null)
    if (!res) {
      hiddenCount++;
      return {
        ...c,
        enlem: null,
        boylam: null,
        konumKaynagi: null,
        konumDetay: 'Mahalle Belirtilmemiş (Haritada Gizli)',
      };
    }

    if (res.matchType === 'LANDMARK_BUILDING') landmarkCount++;
    else if (res.matchType === 'STREET_DOOR_NO' || res.matchType === 'STREET_CENTER') doorNoCount++;
    else if (res.matchType === 'MAHALLE_PRECISE') mahalleCount++;
    else keptCount++;

    return {
      ...c,
      enlem: res.lat,
      boylam: res.lng,
      konumKaynagi: res.matchType,
      konumDetay: res.detail,
    };
  });

  console.log(`Toplam Cari: ${cariler.length}`);
  console.log(`🏛️  Özel Bina / AVM / Site Seviyesinde: ${landmarkCount}`);
  console.log(`🚪 Sokak & Kapı No İnterpolasyonu: ${doorNoCount}`);
  console.log(`🏘️  Hassas Mahalle Seviyesinde: ${mahalleCount}`);
  console.log(`📌 Korunan Harici Hassas Koordinatlar: ${keptCount}`);
  console.log(`🚫 Mahalle Olmayan / Haritada Gizlenen Cariler: ${hiddenCount}\n`);

  // Dosyalara Kaydet
  const payload = JSON.stringify({ cariler: updatedCariler }, null, 2);
  fs.writeFileSync(assetsFile, payload, 'utf8');
  console.log(`✅ [1/2] Mobil asset güncellendi: ${assetsFile}`);

  if (fs.existsSync(webDataFile)) {
    fs.writeFileSync(webDataFile, payload, 'utf8');
    console.log(`✅ [2/2] Web verisi güncellendi: ${webDataFile}`);
  }

  console.log('\n=================================================================');
  console.log('   HİYERARŞİK EŞLEŞTİRME BAŞARIYLA TAMAMLANDI!');
  console.log('=================================================================');
}

main();
