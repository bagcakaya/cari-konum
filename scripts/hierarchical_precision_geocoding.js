const fs = require('fs');
const path = require('path');

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
  'ÖMER NASUHI BİLMEN': { lat: 39.9160, lng: 41.2580 },
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
  'HÜSEYİN AVNİ ULAŞ': { lat: 39.8730, lng: 41.2410 },
  'HÜSEYİN ACNİ ULAŞ': { lat: 39.8730, lng: 41.2410 },
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
// Caddelerin başlangıç ve bitiş koordinatları (Kapı numarasına göre cadde boyunca tam yerine oturtur)
const STREET_AXES = {
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
  // 200. Cadde (Hüseyin Avni Ulaş / Yıldızkent): No 1 (Çat yolu kavşağı) -> No 30 (Alparslan Türkeş yönü)
  CADDE_200: {
    start: { lat: 39.8775, lng: 41.2442, no: 1 },
    end: { lat: 39.8732, lng: 41.2398, no: 30 },
  },
  // Şehit Polis Murat Ellik Bulvarı: No 1 -> No 45
  MURAT_ELLIK: {
    start: { lat: 39.8722, lng: 41.2425, no: 1 },
    end: { lat: 39.8665, lng: 41.2372, no: 45 },
  },
  // Prof. Dr. Necmettin Erbakan Bulvarı: No 10 -> No 75
  NECMETTIN_ERBAKAN: {
    start: { lat: 39.9212, lng: 41.2145, no: 10 },
    end: { lat: 39.9255, lng: 41.1960, no: 75 },
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
  // Çat Yolu Caddesi: No 1 -> No 60
  CAT_YOLU: {
    start: { lat: 39.8820, lng: 41.2480, no: 1 },
    end: { lat: 39.8690, lng: 41.2380, no: 60 },
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
};

// 3. Özel Bina, AVM, Site ve İş Merkezleri Veritabanı
const LANDMARK_BUILDINGS = [
  { pattern: /SERRA CİTY|SERRA CITY/i, lat: 39.90685, lng: 41.27082, name: 'Serra City AVM (Cumhuriyet Cad)' },
  { pattern: /AK MERKEZ|AKMERKEZ/i, lat: 39.90635, lng: 41.27315, name: 'Ak Merkez (Cumhuriyet Cad)' },
  { pattern: /ERZURUM EVLER/i, lat: 39.90578, lng: 41.27845, name: 'Erzurum Evleri (Yüzbaşı Sok/Cumhuriyet)' },
  { pattern: /ALAÇATI MUHALLEBİCİSİ|ALAÇATI/i, lat: 39.90665, lng: 41.25812, name: 'Alaçatı Muhallebicisi (Özen Apt/Terminal)' },
  { pattern: /MNG AVM|MNG ALIŞVERİŞ/i, lat: 39.91154, lng: 41.25148, name: 'MNG AVM (Terminal Cad)' },
  { pattern: /FORUM ERZURUM/i, lat: 39.89785, lng: 41.25892, name: 'Forum Erzurum AVM (Palandöken)' },
  { pattern: /KAZIM KARABEKİR İŞ MRK|NAFİZ ERGÜN/i, lat: 39.90852, lng: 41.27154, name: 'Kazım Karabekir İş Mrk (Nafiz Ergün Sok)' },
  { pattern: /MUMCU İŞ MRK/i, lat: 39.90915, lng: 41.27025, name: 'Mumcu İş Merkezi (Mumcu Cad No:26)' },
  { pattern: /DENİZ APT.*MUMCU|MUMCU.*DENİZ APT/i, lat: 39.90845, lng: 41.27125, name: 'Deniz Apt (Mumcu Cad No:14)' },
  { pattern: /ÖZEN APT/i, lat: 39.90665, lng: 41.25812, name: 'Özen Apartmanı (Terminal Cad)' },
  { pattern: /SERHAT APT/i, lat: 39.90520, lng: 41.25550, name: 'Serhat Apartmanı (Terminal Cad No:33)' },
  { pattern: /DİKER SİT|DIKER SIT/i, lat: 39.86790, lng: 41.23850, name: 'Diker Sitesi (Murat Ellik Bulv No:31)' },
  { pattern: /DENİZ YAPI.*MURAT ELLİK|MURAT ELLİK.*DENİZ YAPI/i, lat: 39.86880, lng: 41.23920, name: 'Deniz Yapı B Blok (Murat Ellik Bulv No:29)' },
  { pattern: /TARABYA EVLER/i, lat: 39.92150, lng: 41.21200, name: 'Tarabya Evleri (Necmettin Erbakan Blv No:25)' },
  { pattern: /GÜZELKENT/i, lat: 39.92380, lng: 41.20250, name: 'Güzelkent A Blok (Necmettin Erbakan Blv No:54)' },
  { pattern: /ÖZDOĞU KENT|OZDOĞU KENT/i, lat: 39.92480, lng: 41.19800, name: 'Özdoğu Kent (Necmettin Erbakan Blv No:61)' },
  { pattern: /ŞAMPİYON EVLER/i, lat: 39.87180, lng: 41.24050, name: 'Şampiyon Evler (Hüseyin Avni Ulaş 103. Sk)' },
  { pattern: /SEVGİ APT/i, lat: 39.87250, lng: 41.24180, name: 'Sevgi Apartmanı (Hüseyin Avni Ulaş 13. Ara Sok)' },
  { pattern: /ULAŞIM DAİRE/i, lat: 39.87120, lng: 41.24350, name: 'Erzurum B.Ş.B. Ulaşım Dairesi (Yıldızkent)' },
  { pattern: /SEBZE HALİ/i, lat: 39.94204, lng: 41.25805, name: 'Erzurum Sebze Hali (Aziziye)' },
  { pattern: /ÇİĞDEMLİ KÖYÜ|AŞKELE YOLU/i, lat: 39.93200, lng: 41.13500, name: 'Aşkale Yolu Çiğdemli Köyü' },
  { pattern: /ET VE SÜT KURUMU|ET KOMBİNASI/i, lat: 39.93850, lng: 41.17200, name: 'Et ve Süt Kurumu Kombinası (Ilıca E-80)' },
  { pattern: /OTO TİCARET MERKEZİ|OTONOMİ/i, lat: 39.93550, lng: 41.17800, name: 'Erzurum Otonomi / Galericiler Sitesi' },
  { pattern: /İVEDİK OSB/i, lat: 39.99504, lng: 32.74805, name: 'İvedik OSB, Melih Gökçek Blv (Ankara)' },
  { pattern: /OSMAN OKUTMUŞ CAD/i, lat: 40.25820, lng: 40.22621, name: 'Osman Okutmuş Cad (Bayburt)' },
];

/**
 * Bir caddede kapı numarasına göre hassas konum interpolasyonu yapar.
 */
function interpolateStreetNumber(axis, targetNo) {
  if (!axis) return null;
  const { start, end } = axis;
  const minNo = Math.min(start.no, end.no);
  const maxNo = Math.max(start.no, end.no);
  
  // Oran hesapla (0 ile 1 arası)
  const clampedNo = Math.max(minNo, Math.min(maxNo, targetNo));
  const ratio = (clampedNo - minNo) / (maxNo - minNo);

  const lat = start.lat + (end.lat - start.lat) * ratio;
  const lng = start.lng + (end.lng - start.lng) * ratio;

  return { lat, lng };
}

/**
 * Adres metninden kapı numarasını ayıklar
 */
function extractDoorNumber(addressText) {
  if (!addressText) return null;
  const m = addressText.match(/NO\s*:\s*([0-9]+)/i) || addressText.match(/NO\s*([0-9]+)/i);
  if (m && m[1]) {
    const num = parseInt(m[1], 10);
    if (!isNaN(num) && num > 0) return num;
  }
  return null;
}

/**
 * Adresten Mahalle bilgisini ayıklar
 */
function extractMahalle(addressText) {
  if (!addressText) return null;
  const upper = addressText.toUpperCase();
  for (const mName of Object.keys(MAHALLE_COORDS)) {
    if (upper.includes(mName)) {
      return mName;
    }
  }
  return null;
}

/**
 * Hiyerarşik Hassas Konumlandırıcı
 */
function resolveHierarchicalLocation(cari) {
  const address = (cari.adres || '').trim();
  if (!address || address === '.') {
    // Adresi olmayanlar için ilçe varsayılanı veya null
    return null;
  }

  // 1. ADIM: Özel Landmark / Bina / Site İsmi Eşleşmesi (En Yüksek Öncelik)
  for (const lm of LANDMARK_BUILDINGS) {
    if (lm.pattern.test(address) || lm.pattern.test(cari.ad || '')) {
      return {
        lat: Number(lm.lat.toFixed(6)),
        lng: Number(lm.lng.toFixed(6)),
        matchType: 'LANDMARK_BUILDING',
        detail: lm.name,
      };
    }
  }

  // 2. ADIM: Sokak / Cadde ve Kapı Numarası Tespiti
  const doorNo = extractDoorNumber(address);
  const upper = address.toUpperCase();

  // Mumcu Caddesi
  if (/MUMCU/i.test(upper)) {
    const coord = interpolateStreetNumber(STREET_AXES.MUMCU, doorNo || 15);
    return { ...coord, matchType: doorNo ? 'STREET_DOOR_NO' : 'STREET_CENTER', detail: `Mumcu Cad. No:${doorNo || 'Ortası'}` };
  }

  // Terminal Caddesi
  if (/TERMİNAL|TERMINAL/i.test(upper)) {
    const coord = interpolateStreetNumber(STREET_AXES.TERMINAL, doorNo || 20);
    return { ...coord, matchType: doorNo ? 'STREET_DOOR_NO' : 'STREET_CENTER', detail: `Terminal Cad. No:${doorNo || 'Ortası'}` };
  }

  // Cumhuriyet Caddesi
  if (/CUMHURİYET|CUMHURIYET/i.test(upper)) {
    const coord = interpolateStreetNumber(STREET_AXES.CUMHURIYET, doorNo || 35);
    return { ...coord, matchType: doorNo ? 'STREET_DOOR_NO' : 'STREET_CENTER', detail: `Cumhuriyet Cad. No:${doorNo || 'Ortası'}` };
  }

  // 200. Cadde
  if (/200\.\s*CAD/i.test(upper)) {
    const coord = interpolateStreetNumber(STREET_AXES.CADDE_200, doorNo || 12);
    return { ...coord, matchType: doorNo ? 'STREET_DOOR_NO' : 'STREET_CENTER', detail: `200. Cad. No:${doorNo || 'Ortası'}` };
  }

  // Şehit Polis Murat Ellik Bulvarı
  if (/MURAT ELLİK|MURAT ELLIK/i.test(upper)) {
    const coord = interpolateStreetNumber(STREET_AXES.MURAT_ELLIK, doorNo || 20);
    return { ...coord, matchType: doorNo ? 'STREET_DOOR_NO' : 'STREET_CENTER', detail: `Murat Ellik Bulv. No:${doorNo || 'Ortası'}` };
  }

  // Prof. Dr. Necmettin Erbakan Bulvarı
  if (/NECMETTİN ERBAKAN|NECMETTIN ERBAKAN/i.test(upper)) {
    const coord = interpolateStreetNumber(STREET_AXES.NECMETTIN_ERBAKAN, doorNo || 40);
    return { ...coord, matchType: doorNo ? 'STREET_DOOR_NO' : 'STREET_CENTER', detail: `Necmettin Erbakan Blv. No:${doorNo || 'Ortası'}` };
  }

  // Yenikapı Caddesi
  if (/YENİKAPI|YENIKAPI/i.test(upper)) {
    const coord = interpolateStreetNumber(STREET_AXES.YENIKAPI, doorNo || 35);
    return { ...coord, matchType: doorNo ? 'STREET_DOOR_NO' : 'STREET_CENTER', detail: `Yenikapı Cad. No:${doorNo || 'Ortası'}` };
  }

  // Sabunhane Sokak
  if (/SABUNHANE/i.test(upper)) {
    const coord = interpolateStreetNumber(STREET_AXES.SABUNHANE, doorNo || 15);
    return { ...coord, matchType: doorNo ? 'STREET_DOOR_NO' : 'STREET_CENTER', detail: `Sabunhane Sok. No:${doorNo || 'Ortası'}` };
  }

  // Melike Mama Hatun Sokak
  if (/MELİKE MAMA HATUN|MELIKE MAMA/i.test(upper)) {
    const coord = interpolateStreetNumber(STREET_AXES.MELIKE_MAMA_HATUN, doorNo || 5);
    return { ...coord, matchType: doorNo ? 'STREET_DOOR_NO' : 'STREET_CENTER', detail: `Melike Mama Hatun Sk. No:${doorNo || 'Ortası'}` };
  }

  // İbrahim Ethem Seven Sokak
  if (/İBRAHİM ETHEM|IBRAHIM ETHEM/i.test(upper)) {
    const coord = interpolateStreetNumber(STREET_AXES.IBRAHIM_ETHEM_SEVEN, doorNo || 8);
    return { ...coord, matchType: doorNo ? 'STREET_DOOR_NO' : 'STREET_CENTER', detail: `İbrahim Ethem Seven Sk. No:${doorNo || 'Ortası'}` };
  }

  // Çat Yolu Caddesi
  if (/ÇAT YOLU|CAT YOLU/i.test(upper)) {
    const coord = interpolateStreetNumber(STREET_AXES.CAT_YOLU, doorNo || 25);
    return { ...coord, matchType: doorNo ? 'STREET_DOOR_NO' : 'STREET_CENTER', detail: `Çat Yolu Cad. No:${doorNo || 'Ortası'}` };
  }

  // Çaykara Caddesi
  if (/ÇAYKARA|CAYKARA/i.test(upper)) {
    const coord = interpolateStreetNumber(STREET_AXES.CAYKARA, doorNo || 20);
    return { ...coord, matchType: doorNo ? 'STREET_DOOR_NO' : 'STREET_CENTER', detail: `Çaykara Cad. No:${doorNo || 'Ortası'}` };
  }

  // Menderes Caddesi
  if (/MENDERES CAD/i.test(upper)) {
    const coord = interpolateStreetNumber(STREET_AXES.MENDERES_CAD, doorNo || 15);
    return { ...coord, matchType: doorNo ? 'STREET_DOOR_NO' : 'STREET_CENTER', detail: `Menderes Cad. No:${doorNo || 'Ortası'}` };
  }

  // 3. ADIM: Mahalle Seviyesi Eşleşme (Sokak/Cadde eksikse)
  const mahalle = extractMahalle(address);
  if (mahalle && MAHALLE_COORDS[mahalle]) {
    const mCoord = MAHALLE_COORDS[mahalle];
    // Mahalle içindeki binaların üst üste binmemesi için minik bir deterministik saçılım (dispersal)
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

  // Mevcut koordinat geçerliyse koru
  if (cari.enlem && cari.boylam) {
    return {
      lat: cari.enlem,
      lng: cari.boylam,
      matchType: 'EXISTING_COORDINATE',
      detail: 'Mevcut Koordinat',
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
  console.log('   CARİRADAR: HİYERARŞİK HASSAS KONUMLANDIRMA MOTORU (v2.5)');
  console.log('   (Mahalle ➔ Sokak/Cadde ➔ Kapı No Seviyesinde Eşleme)');
  console.log('=================================================================\n');

  let doorNoCount = 0;
  let landmarkCount = 0;
  let mahalleCount = 0;
  let keptCount = 0;
  let missingCount = 0;

  const updatedCariler = cariler.map((c) => {
    const res = resolveHierarchicalLocation(c);
    if (!res) {
      missingCount++;
      return c;
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
  console.log(`📌 Korunan Geçerli Koordinatlar: ${keptCount}`);
  console.log(`⚠️  Adresi Olmayan (Nokta / Boş): ${missingCount}\n`);

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
