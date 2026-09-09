/**
 * Cari Konum - Tek Tıkla Canlı SQL Senkronizasyonu
 * 1. MSSQL POLATLAR2025'ten canlı bakiye ve adresleri çeker.
 * 2. Yeni adresleri geocode eder (önbellekle).
 * 3. web/public/data/cariler.json dosyasını günceller.
 * 4. Vercel webhook/API ayarlanmışsa buluta gönderir.
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const { run: runGeocoder } = require('./geocoder');

async function syncAll() {
  console.log('====================================================');
  console.log('   CARI KONUM - CANLI VERİ SENKRONİZASYONU');
  console.log('====================================================');
  console.log(`Zaman: ${new Date().toLocaleString('tr-TR')}\n`);

  // Adım 1: SQL Server'dan en güncel verileri çek
  console.log('[1/3] SQL Server (POLATLAR2025) taranıyor...');
  const psScript = path.join(__dirname, 'extract_sql.ps1');
  try {
    const psOutput = execSync(`powershell -ExecutionPolicy Bypass -File "${psScript}"`, {
      encoding: 'utf8'
    });
    console.log(psOutput.trim());
  } catch (err) {
    console.error('SQL Çekme Hatası:', err.message);
    process.exit(1);
  }

  // Adım 2: Adres Normalizasyonu & Geocoding
  console.log('\n[2/3] Adresler ve koordinatlar senkronize ediliyor...');
  const cariler = await runGeocoder({ maxNewQueries: 100 });

  // Adım 3: Vercel Cloud Push (Opsiyonel)
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    require('dotenv').config({ path: envPath });
  }

  const syncUrl = process.env.VERCEL_SYNC_URL;
  const syncSecret = process.env.SYNC_SECRET;

  if (syncUrl) {
    console.log(`\n[3/3] Vercel bulut sistemine aktarılıyor (${syncUrl})...`);
    try {
      const payload = JSON.stringify({
        secret: syncSecret,
        updatedAt: new Date().toISOString(),
        cariler: cariler
      });

      const res = await fetch(syncUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${syncSecret}`
        },
        body: payload
      });

      if (res.ok) {
        console.log('✅ Vercel bulut senkronizasyonu BAŞARILI!');
      } else {
        console.warn(`⚠️ Vercel HTTP ${res.status}: ${await res.text()}`);
      }
    } catch (pushErr) {
      console.error('⚠️ Buluta gönderim hatası:', pushErr.message);
    }
  } else {
    console.log('\n[3/3] Yerel dosya senkronizasyonu tamamlandı (Vercel URL tanımlanmamış).');
  }

  console.log('\n====================================================');
  console.log('   SENKRONİZASYON BAŞARIYLA TAMAMLANDI!');
  console.log('====================================================\n');
}

if (require.main === module) {
  syncAll().catch(console.error);
}

module.exports = { syncAll };
