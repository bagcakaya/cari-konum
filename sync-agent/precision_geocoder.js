/**
 * CariRadar - Precision Geocoding Engine
 * 1. Sadece gercek, acik adresi olan carileri (Mahalle, Cadde, Sokak) tespit eder.
 * 2. Adresi '.' veya yetersiz olan carilerin konumunu NULL yapar (haritada pin gozukmez).
 * 3. Gercek adreslerin tam koordinatlarini OpenStreetMap (Nominatim & Photon) ile bulur.
 */

const fs = require('fs');
const path = require('path');

const RAW_FILE = path.join(__dirname, 'raw_cariler.json');
const CACHE_FILE = path.join(__dirname, 'precision_geocache.json');
const OUTPUT_FILE = path.join(__dirname, 'output', 'cariler.json');
const WEB_OUTPUT_FILE = path.join(__dirname, '..', 'web', 'public', 'data', 'cariler.json');
const WEB_DIST_OUTPUT = path.join(__dirname, '..', 'web', 'dist', 'data', 'cariler.json');

// Cache yukle
let cache = {};
if (fs.existsSync(CACHE_FILE)) {
  try {
    cache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
  } catch (e) {
    cache = {};
  }
}

function saveCache() {
  fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2), 'utf8');
}

function sleep(ms) {
  return new Promise(res => setTimeout(res, ms));
}

function cleanAddress(rawAdres) {
  if (!rawAdres) return '';
  let str = rawAdres.trim();
  str = str.replace(/^ADRES\d*\s*/i, '');
  str = str.replace(/^[\.\-\s]+|[\.\-\s]+$/g, '');
  str = str.replace(/\s+/g, ' ');
  return str;
}

// Acik adres mi kontrolu (Mahalle, Cadde, Sokak, Bulvar vb. var mi?)
function isOpenAddress(rawAdres) {
  if (!rawAdres) return false;
  const str = cleanAddress(rawAdres);
  if (str.length < 5) return false;
  if (/^(\.|\-|\s)+$/.test(str)) return false;

  const keywords = /(MAH|CAD|SOK|SK|BLV|BULV|YOL|SANAY|SİTE|SITE|MVK|KÖY|KOY|HAL|PARK|CADDESİ|SOKAĞI|BULVARI|MAHALLESİ)/i;
  const noPattern = /(NO\s*:\s*\d+|NO\s*\d+|\b\d+\s*\/\s*[A-Z0-9]+)/i;

  return keywords.test(str) || (str.split(' ').length >= 3 && noPattern.test(str)) || str.length > 20;
}

// Mahalle ismini ayikla
function extractMahalle(adres) {
  const match = adres.match(/([a-zA-ZçğıöşüÇĞİÖŞÜ0-9\.\s]+?)(MAH|MAHALLESİ|MAH\.)/i);
  if (match) {
    let m = match[0].trim();
    // Basindaki 'MERKEZ' veya ekleri temizle
    m = m.replace(/^(MERKEZ|ADRES1)/i, '').trim();
    return m;
  }
  return null;
}

// Cadde veya Sokak ismini ayikla
function extractStreet(adres) {
  const match = adres.match(/([a-zA-ZçğıöşüÇĞİÖŞÜ0-9\.\s]+?)(CAD|CADDESİ|SOK|SOKAĞI|SK|BLV|BULVARI)/i);
  if (match) {
    let s = match[0].trim();
    s = s.replace(/^(MERKEZ|ADRES1)/i, '').trim();
    return s;
  }
  return null;
}

// Nominatim Geocode
async function queryNominatim(query) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&countrycodes=tr`;
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'CariRadarPrecision/2.0 (bilgi@polatlar.com.tr)' }
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
        displayName: data[0].display_name,
        source: 'nominatim'
      };
    }
  } catch (err) {
    // ignore
  }
  return null;
}

// Photon Geocode (Hizli & guvenilir alternatif)
async function queryPhoton(query) {
  const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=1`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    if (data && data.features && data.features.length > 0) {
      const f = data.features[0];
      return {
        lat: f.geometry.coordinates[1],
        lng: f.geometry.coordinates[0],
        displayName: f.properties.name || query,
        source: 'photon'
      };
    }
  } catch (err) {
    // ignore
  }
  return null;
}

async function geocodeSingle(c) {
  const cleaned = cleanAddress(c.adres);
  const mahalle = extractMahalle(cleaned);
  const street = extractStreet(cleaned);
  const ilce = (c.ilce || '').trim();
  const il = (c.il || 'Erzurum').trim();

  const cacheKey = `${cleaned}|${ilce}|${il}`.toLowerCase();
  if (cache[cacheKey] !== undefined) {
    return cache[cacheKey];
  }

  let result = null;

  // 1. Deneme: Mahalle + Cadde/Sokak + Ilce + Il
  if (mahalle && street && mahalle !== street) {
    const q1 = `${street}, ${mahalle}, ${ilce}, ${il}, Türkiye`;
    result = await queryNominatim(q1);
    if (!result) result = await queryPhoton(q1);
    if (result) {
      cache[cacheKey] = result;
      saveCache();
      return result;
    }
  }

  // 2. Deneme: Mahalle + Ilce + Il
  if (mahalle) {
    const q2 = `${mahalle}, ${ilce}, ${il}, Türkiye`;
    result = await queryNominatim(q2);
    if (!result) result = await queryPhoton(q2);
    if (result) {
      cache[cacheKey] = result;
      saveCache();
      return result;
    }
  }

  // 3. Deneme: Cadde/Sokak + Ilce + Il
  if (street) {
    const q3 = `${street}, ${ilce}, ${il}, Türkiye`;
    result = await queryNominatim(q3);
    if (!result) result = await queryPhoton(q3);
    if (result) {
      cache[cacheKey] = result;
      saveCache();
      return result;
    }
  }

  // 4. Deneme: Temiz adresin ilk 3-4 kelimesi + Ilce + Il
  const words = cleaned.split(' ').slice(0, 4).join(' ');
  if (words.length >= 8) {
    const q4 = `${words}, ${ilce}, ${il}, Türkiye`;
    result = await queryPhoton(q4);
    if (result) {
      cache[cacheKey] = result;
      saveCache();
      return result;
    }
  }

  cache[cacheKey] = null;
  saveCache();
  return null;
}

async function main() {
  console.log('=== CARIRADAR HASSAS KONUM VE FİLTRELEME BAŞLADI ===\n');

  let rawText = fs.readFileSync(RAW_FILE, 'utf8');
  if (rawText.charCodeAt(0) === 0xFEFF) rawText = rawText.slice(1);
  const rawData = JSON.parse(rawText);

  console.log(`Toplam Cari: ${rawData.length}`);

  let geocodedCount = 0;
  let excludedCount = 0;
  const processed = [];

  for (let i = 0; i < rawData.length; i++) {
    const item = rawData[i];
    const cleaned = cleanAddress(item.adres);
    const valid = isOpenAddress(item.adres);

    if (!valid) {
      // KULLANICI İSTEĞİ: Açık adresi olmayan, '.' veya sadece il/ilçe olan cariler
      // haritada KESİNLİKLE GÖZÜKMEYECEK (enlem = null, boylam = null)
      excludedCount++;
      processed.push({
        id: item.id,
        kod: item.kod,
        ad: item.ad,
        adres: item.adres,
        adresTemiz: cleaned,
        il: item.il,
        ilce: item.ilce,
        telefon: item.telefon,
        yetkili: item.yetkili,
        enlem: null,
        boylam: null,
        konumTipi: 'konum_yok',
        borc: item.borc,
        alacak: item.alacak,
        bakiye: item.bakiye,
        bakiyeDurumu: item.bakiye > 0 ? 'borclu' : item.bakiye < 0 ? 'alacakli' : 'kapali'
      });
      continue;
    }

    // Açık adresi olan cari -> Gerçek koordinatını ara
    const cacheKey = `${cleaned}|${item.ilce}|${item.il}`.toLowerCase();
    let coords = cache[cacheKey];

    if (coords === undefined) {
      process.stdout.write(`[${i + 1}/${rawData.length}] Aranıyor: ${item.kod} - ${cleaned.slice(0, 35)}... `);
      coords = await geocodeSingle(item);
      if (coords) {
        console.log(`✅ (${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)})`);
      } else {
        console.log(`❌ Bulunamadı`);
      }
      await sleep(350); // nezaket gecikmesi
    }

    if (coords && coords.lat) {
      geocodedCount++;
      processed.push({
        id: item.id,
        kod: item.kod,
        ad: item.ad,
        adres: item.adres,
        adresTemiz: cleaned,
        il: item.il,
        ilce: item.ilce,
        telefon: item.telefon,
        yetkili: item.yetkili,
        enlem: coords.lat,
        boylam: coords.lng,
        konumTipi: 'tam_adres',
        borc: item.borc,
        alacak: item.alacak,
        bakiye: item.bakiye,
        bakiyeDurumu: item.bakiye > 0 ? 'borclu' : item.bakiye < 0 ? 'alacakli' : 'kapali'
      });
    } else {
      // Adresi olmasına rağmen haritada bulunamayanlar da yanlış yere konmasın
      excludedCount++;
      processed.push({
        id: item.id,
        kod: item.kod,
        ad: item.ad,
        adres: item.adres,
        adresTemiz: cleaned,
        il: item.il,
        ilce: item.ilce,
        telefon: item.telefon,
        yetkili: item.yetkili,
        enlem: null,
        boylam: null,
        konumTipi: 'konum_bulunamadi',
        borc: item.borc,
        alacak: item.alacak,
        bakiye: item.bakiye,
        bakiyeDurumu: item.bakiye > 0 ? 'borclu' : item.bakiye < 0 ? 'alacakli' : 'kapali'
      });
    }
  }

  const jsonOutput = JSON.stringify({
    syncTime: new Date().toISOString(),
    totalCount: processed.length,
    geocodedCount: geocodedCount,
    excludedCount: excludedCount,
    cariler: processed
  }, null, 2);

  fs.writeFileSync(OUTPUT_FILE, jsonOutput, 'utf8');
  fs.writeFileSync(WEB_OUTPUT_FILE, jsonOutput, 'utf8');
  if (fs.existsSync(path.dirname(WEB_DIST_OUTPUT))) {
    fs.writeFileSync(WEB_DIST_OUTPUT, jsonOutput, 'utf8');
  }

  console.log('\n====================================================');
  console.log('   HASSAS SENKRONİZASYON TAMAMLANDI!');
  console.log('====================================================');
  console.log(`- Toplam Cari: ${processed.length}`);
  console.log(`- Haritada Gösterilen Gerçek Konumlu Cari: ${geocodedCount}`);
  console.log(`- Açık Adresi Olmayan / Hariç Tutulan (Haritada Pin Çıkmayacak): ${excludedCount}`);
  console.log('====================================================\n');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main };
