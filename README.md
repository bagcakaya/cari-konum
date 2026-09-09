# Cari Konum 📍 - Mobil PWA & Akıllı Yakınlık Takip Sistemi

SQL Server (**POLATLAR2025**) veritabanındaki carilerin adres, konum ve canlı borç-alacak bakiyelerini takip eden, sahada gezerken bir carinin **200 metre çapına** girildiğinde otomatik bildirim gönderen mobil uyumlu PWA uygulaması.

---

## 🚀 Öne Çıkan Özellikler

1. **Mobil PWA (Ana Ekrana Ekle):**
   * App Store veya Google Play (`.aab` / `.ipa`) gerektirmez.
   * Tarayıcıdan tek tıkla **"Ana Ekrana Ekle"** diyerek tam ekran native bir mobil uygulama gibi çalışır.
   * Vercel üzerinden 7/24 ücretsiz barındırılır.

2. **200 Metre Geofencing & Yakınlık Bildirimi:**
   * Mobil cihazın GPS konumu arka planda sürekli takip edilir.
   * Bir carinin **200 metre** yakınına girdiğinizde cihaz titrer ve bildirim ekranı açılır:
     > **"📍 [Firma Adı] firmasına yaklaştınız, uğramak ister misiniz?"**
   * **[Evet]** butonuna basıldığında firmanın:
     * Güncel Net Bakiyesi
     * Toplam Borç ve Toplam Alacak tutarları
     * Açık adresi, yetkili adı ve telefon numarası
     * Tek tıkla **"Yol Tarifi Al"** ve **"Hemen Ara"** butonları açılır.
   * **[Hayır]** butonuna basıldığında bildirim kapanır ve aynı firma için 30 dakika boyunca tekrar bildirim gösterilmez (spam engelleme filtresi).

3. **Canlı Borç & Alacak Entegrasyonu:**
   * Statik rakamlar değil, SQL Server'daki hareketler (`FINANS_DETAY` / `CARI_BAKIYELER`) baz alınır.
   * Tek tıkla (`Verileri-Guncelle.bat`) tüm carilerin güncel bakiyeleri eşitlenir.

4. **İnteraktif Harita & Arama:**
   * **OpenStreetMap & Leaflet:** %100 ücretsiz, lisans veya kredi kartı gerektirmez.
   * Kullanıcının anlık GPS konumu ve etrafındaki **200 metre mavi radar çemberi**.
   * Renk kodlu pinler: 🔴 **Kırmızı** (Borçlu / Alacağımız var), 🟢 **Yeşil** (Alacaklı / Borcumuz var), ⚪ **Gri** (Bakiyesi kapalı).
   * **En Yakındakiler Listesi:** Mesafeye göre anlık sıralama (örn: "80m", "1.2 km").

5. **Ofisten Test / Simülasyon Modu:**
   * Sahaya çıkmadan önce test edebilmeniz için harita üzerinde hedef simgesi (🎯) yer alır.
   * Simülasyon modunu açıp haritada herhangi bir carinin yanına tıkladığınızda konumunuz oraya taşınır ve 200m bildiriminin çalıştığını anında test edebilirsiniz!

---

## 📁 Proje Yapısı

```
Cari Konum/
├── Verileri-Guncelle.bat      # SQL'den güncel bakiye & adresleri çeken kısayol
├── Uygulamayi-Baslat.bat     # Yerel test sunucusunu başlatan kısayol
├── VERCEL_KURULUMU.md        # Vercel'e yükleme ve OneSignal kılavuzu
│
├── sync-agent/               # Yerel Veri Senkronizasyon Servisi
│   ├── extract_sql.ps1       # POLATLAR2025'ten veri çeken PowerShell motoru
│   ├── geocoder.js           # Açık adresleri koordinata çeviren motor (önbellekli)
│   ├── sync.js               # Tam otomatik senkronizasyon yöneticisi
│   └── geocache.json         # Çıkarılan koordinatların kalıcı önbelleği
│
└── web/                      # Mobil PWA Web Uygulaması (Vercel Deploy)
    ├── index.html            # Ana şablon & PWA tanımları
    ├── vercel.json           # Vercel dağıtım ayarları
    ├── public/
    │   ├── manifest.json     # PWA kurulum manifestosu
    │   ├── sw.js             # Service Worker (Bildirim & Offline motoru)
    │   ├── data/cariler.json # Eşitlenmiş güncel cari & bakiye veritabanı
    │   └── icons/            # Mobil uygulama ikonları
    └── src/
        ├── App.jsx           # Ana kontrolcü & 200m geofencing mantığı
        ├── components/       # Harita, Liste, Detay ve Bildirim Modalları
        └── services/         # OneSignal & Web Push servisi
```

---

## ⚡ Hızlı Başlangıç (Yerel Test)

1. **Verileri Güncellemek İçin:**
   * Klasördeki **`Verileri-Guncelle.bat`** dosyasına çift tıklayın.
   * SQL Server'daki son bakiyeleri okur ve yeni adresleri haritaya işler.

2. **Uygulamayı Açmak İçin:**
   * Klasördeki **`Uygulamayi-Baslat.bat`** dosyasına çift tıklayın.
   * Tarayıcınızda `http://localhost:3000` adresini açın.
   * Aynı Wi-Fi ağına bağlı cep telefonunuzdan terminalde yazan `Network: http://192.168.x.x:3000` adresine girerek telefonunuzda test edebilirsiniz.

---

## 🌐 Vercel Üzerinde Yayınlama

Detaylı adım adım anlatım için lütfen [VERCEL_KURULUMU.md](file:///c:/Users/Mert/Desktop/Cari%20Konum/VERCEL_KURULUMU.md) kılavuzunu inceleyin.
