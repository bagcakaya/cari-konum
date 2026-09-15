# CariRadar - Vercel Canlı Dağıtım ve PWA Kurulum Kılavuzu 🚀📱

Bu kılavuz, uygulamanızı **Vercel** üzerinde 7/24 ücretsiz canlıya almanız, telefonunuza (Android veya iPhone) **"Ana Ekrana Ekle"** diyerek native bir mobil uygulama gibi kurmanız ve verileri eksiksiz kullanmanız için hazırlanmıştır.

---

## 1. Adım: Vercel Üzerinde 1 Tıkla Canlıya Alma (Deploy)

Tüm proje dosyalarınız, Vercel yapılandırmaları (`vercel.json`), PWA servisleri (`sw.js`, `manifest.json`) ve en güncel 371 cari verisi (`cariler.json`) GitHub deponuza (`bagcakaya/cari-konum`) aktarılmıştır.

1. **[vercel.com](https://vercel.com)** adresine gidin ve GitHub hesabınızla giriş yapın (Ücretsizdir).
2. Sağ üstteki **"Add New..." ➔ "Project"** butonuna tıklayın.
3. Karşınıza gelen listeden **`cari-konum`** deponuzun yanındaki **"Import"** butonuna basın.
4. **Hiçbir ayarı değiştirmenize gerek yoktur!** 
   * Proje köküne ve `web` klasörüne otomatik derleme kuralları (`vercel.json`) yerleştirilmiştir.
   * Framework olarak `Vite` otomatik seçilecektir.
5. Doğrudan mavi **"Deploy"** butonuna tıklayın!
6. Yaklaşık 30-45 saniye içinde uygulamanız dünya genelinde `https://cari-konum-xxx.vercel.app` (veya belirleyeceğiniz özel bir alan adı) üzerinden canlıya alınacaktır! 🎉

---

## 2. Adım: Verilerin Canlıda Yüklü Gelmesi

* **Çift Katmanlı Veri Güvencesi:** En güncel 371 cari verisi (`cariler.json`) uygulamanın içerisine doğrudan gömülmüştür. Vercel linkine ilk girdiğiniz anda hiçbir bekleme süresi olmadan tüm harita pinleri ve cari listesi anında açılır.
* **Otomatik PWA Önbelleği:** Service Worker (`sw.js`), ilk açılışta `cariler.json` dosyasını telefonun yerel hafızasına kaydeder. İnternetiniz çekmese dahi uygulama verileriyle birlikte açılır.
* **Canlı Veri Güncelleme:** Uygulama açıkken sağ üstteki döngü simgesine basıldığında sunucudaki en güncel bakiyeler anlık olarak yenilenir.

---

## 3. Adım: Cep Telefonunda "Ana Ekrana Ekle" (PWA Kurulumu)

Vercel linkinizi telefonunuzda açtığınızda üst barda mavi **"Ana Ekrana Ekle"** butonunu göreceksiniz. Butona dokunduğunuzda cihazınıza göre rehber veya yükleme penceresi açılır:

### 🤖 Android (Google Chrome / Samsung Internet / Edge):
1. Sitedeki **"Ana Ekrana Ekle"** butonuna veya tarayıcının sağ üstündeki **üç nokta (⋮)** menüsüne dokunun.
2. **"Uygulamayı Yükle"** veya **"Ana ekrana ekle"** seçeneğine basın.
3. Onaylayın. CariRadar telefonunuza tıpkı Play Store'dan indirilmiş gibi logosuyla birlikte kurulur ve tam ekran çalışır.

### 🍏 iPhone (iOS / Safari):
1. Vercel linkini **Safari** tarayıcısında açın.
2. Sitedeki **"Ana Ekrana Ekle"** butonuna dokunun (Rehber ekrana gelir).
3. Safari'nin alt ortasındaki **Paylaş (Share)** simgesine (kare ve yukarı ok) dokunun.
4. Menüde aşağı kaydırıp **"Ana Ekrana Ekle"** (Add to Home Screen) seçeneğine basın.
5. Sağ üstteki **"Ekle"** düğmesine dokunun.
6. Telefonunuzun ana ekranında CariRadar ikonu oluşur. Üst/alt tarayıcı çubukları olmadan tam ekran bir iOS uygulaması olarak açılır!

---

## 4. Adım: SQL Server (POLATLAR2025) Verilerini Canlıya Aktarma

Masaüstünüzde fatura kesildiğinde veya borç/alacak değiştiğinde:
1. `Verileri-Guncelle.bat` çalıştırılır.
2. Git ile push edilir (`git add . ; git commit -m "data update" ; git push`).
3. Vercel yaklaşık 20 saniyede otomatik yeni veriyi canlıya alır.
4. Telefondan "Yenile" butonuna basıldığında yeni bakiyeler ekrana yansır.
