/**
 * Cari Konum - Geocoding & Adres Normalizasyon Servisi
 * OpenStreetMap Nominatim API kullanarak carilerin koordinatlarini (Enlem/Boylam) cikarir.
 * Onbellek (geocache.json) ile calisir, ayni adresi asla tekrar sorgulamaz.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const CACHE_FILE = path.join(__dirname, 'geocache.json');
const RAW_FILE = path.join(__dirname, 'raw_cariler.json');
const OUTPUT_FILE = path.join(__dirname, 'output', 'cariler.json');
const WEB_OUTPUT_FILE = path.join(__dirname, '..', 'web', 'public', 'data', 'cariler.json');

// Ensure output dirs exist
if (!fs.existsSync(path.join(__dirname, 'output'))) {
  fs.mkdirSync(path.join(__dirname, 'output'), { recursive: true });
}
const webDataDir = path.join(__dirname, '..', 'web', 'public', 'data');
if (!fs.existsSync(webDataDir)) {
  fs.mkdirSync(webDataDir, { recursive: true });
}

// Load cache
let geoCache = {};
if (fs.existsSync(CACHE_FILE)) {
  try {
    geoCache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
  } catch (e) {
    console.warn('Onbellek dosyasi okunamadi, yeni olusturuluyor.');
  }
}

function saveCache() {
  fs.writeFileSync(CACHE_FILE, JSON.stringify(geoCache, null, 2), 'utf8');
}

// Adres temizleme ve normallestirme
function cleanAddress(rawAdres) {
  if (!rawAdres) return '';
  let str = rawAdres.trim();
  
  // Wolvox ERP 'ADRES1', 'ADRES11' gibi onekleri temizle
  str = str.replace(/^ADRES\d*\s*/i, '');
  // Basindaki/sonundaki noktalari ve cizgileri temizle
  str = str.replace(/^[\.\-\s]+|[\.\-\s]+$/g, '');
  
  // Eger sadece '.' veya anlamsiz tek karakter kaldiysa bos say
  if (str.length <= 2 || str === '.') return '';
  
  // Cift bosluklari teke indir
  str = str.replace(/\s+/g, ' ');
  return str;
}

// Nominatim API'den koordinat arama (1 sn gecikmeli)
async function fetchCoordinates(query) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&countrycodes=tr`;
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'CariKonumSync/1.0 (bilgi@polatlar.com.tr)'
      }
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
        display_name: data[0].display_name
      };
    }
  } catch (err) {
    console.error(`Geocoding hatasi (${query}):`, err.message);
  }
  return null;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function geocodeAddress(adres, ilce, il) {
  const cleaned = cleanAddress(adres);
  const cacheKey = `${cleaned}|${ilce}|${il}`.trim().toLowerCase();

  if (geoCache[cacheKey] !== undefined) {
    return geoCache[cacheKey];
  }

  // 1. Strateji: Acik adres + ilce + il
  let query = '';
  if (cleaned) {
    query = `${cleaned}, ${ilce}, ${il}, Türkiye`;
    console.log(`[Geocoding 1] Aranıyor: ${query}`);
    let coord = await fetchCoordinates(query);
    if (coord) {
      geoCache[cacheKey] = coord;
      saveCache();
      await sleep(1000);
      return coord;
    }
    await sleep(1000);

    // 1.2 Strateji: Mahalle bazli arama (Cadde/kapi no bulunamazsa mahalle)
    const mahalleMatch = cleaned.match(/([a-zA-ZçğıöşüÇĞİÖŞÜ\s]+(MAH|MAHALLESİ|MAH\.))/i);
    if (mahalleMatch) {
      const mahQuery = `${mahalleMatch[0]}, ${ilce}, ${il}, Türkiye`;
      console.log(`[Geocoding 1.2] Mahalle araniyor: ${mahQuery}`);
      coord = await fetchCoordinates(mahQuery);
      if (coord) {
        geoCache[cacheKey] = coord;
        saveCache();
        await sleep(1000);
        return coord;
      }
      await sleep(1000);
    }
  }

  // 2. Strateji: Ilce + Il bazli arama (Merkez noktasi)
  if (ilce || il) {
    query = `${ilce ? ilce + ', ' : ''}${il}, Türkiye`;
    console.log(`[Geocoding 2] İlçe/İl merkezi araniyor: ${query}`);
    let coord = await fetchCoordinates(query);
    if (coord) {
      geoCache[cacheKey] = { ...coord, isDistrictCenter: true };
      saveCache();
      await sleep(1000);
      return coord;
    }
    await sleep(1000);
  }

  geoCache[cacheKey] = null;
  saveCache();
  return null;
}

async function run(options = { maxNewQueries: 30 }) {
  console.log('=== CARI KONUM GEOCODING & SENKRONIZASYON BASLADI ===');

  // 1. Raw dosya yoksa MSSQL'den cek
  if (!fs.existsSync(RAW_FILE)) {
    console.log('SQL verisi cekiliyor...');
    execSync('powershell -ExecutionPolicy Bypass -File "' + path.join(__dirname, 'extract_sql.ps1') + '"', {
      stdio: 'inherit'
    });
  }

  let rawText = fs.readFileSync(RAW_FILE, 'utf8');
  if (rawText.charCodeAt(0) === 0xFEFF) {
    rawText = rawText.slice(1);
  }
  const rawData = JSON.parse(rawText);
  console.log(`Toplam Cari Sayısı: ${rawData.length}`);

  let newQueryCount = 0;
  const processedCariler = [];

  for (let i = 0; i < rawData.length; i++) {
    const item = rawData[i];
    const cleaned = cleanAddress(item.adres);
    const cacheKey = `${cleaned}|${item.ilce}|${item.il}`.trim().toLowerCase();

    let coords = null;

    if (geoCache[cacheKey] !== undefined) {
      coords = geoCache[cacheKey];
    } else if (newQueryCount < options.maxNewQueries) {
      console.log(`\n[${i + 1}/${rawData.length}] ${item.kod} - ${item.ad}`);
      coords = await geocodeAddress(item.adres, item.ilce, item.il);
      newQueryCount++;
    }

    processedCariler.push({
      id: item.id,
      kod: item.kod,
      ad: item.ad,
      adres: item.adres,
      adresTemiz: cleaned,
      il: item.il,
      ilce: item.ilce,
      telefon: item.telefon,
      yetkili: item.yetkili,
      enlem: coords ? coords.lat : null,
      boylam: coords ? coords.lng : null,
      konumTipi: coords ? (coords.isDistrictCenter ? 'ilce_merkezi' : 'tam_adres') : 'konum_yok',
      borc: item.borc,
      alacak: item.alacak,
      bakiye: item.bakiye,
      bakiyeDurumu: item.bakiye > 0 ? 'borclu' : item.bakiye < 0 ? 'alacakli' : 'kapali'
    });
  }

  // Cikti dosyalarini kaydet
  const jsonOutput = JSON.stringify({
    syncTime: new Date().toISOString(),
    totalCount: processedCariler.length,
    geocodedCount: processedCariler.filter(c => c.enlem !== null).length,
    cariler: processedCariler
  }, null, 2);

  fs.writeFileSync(OUTPUT_FILE, jsonOutput, 'utf8');
  fs.writeFileSync(WEB_OUTPUT_FILE, jsonOutput, 'utf8');

  console.log(`\nSenkronizasyon tamamlandi!`);
  console.log(`- Toplam Cari: ${processedCariler.length}`);
  console.log(`- Konumlu Cari: ${processedCariler.filter(c => c.enlem !== null).length}`);
  console.log(`- Yapılan Yeni Geocoding İsteği: ${newQueryCount}`);
  console.log(`- Çıktı Dosyaları:`);
  console.log(`  * ${OUTPUT_FILE}`);
  console.log(`  * ${WEB_OUTPUT_FILE}`);

  return processedCariler;
}

if (require.main === module) {
  // Komuttan parametre alinabilir: node geocoder.js [maxQueries]
  const maxQueries = process.argv[2] ? parseInt(process.argv[2]) : 50;
  run({ maxNewQueries: maxQueries }).catch(console.error);
}

module.exports = { run, geocodeAddress, cleanAddress };
