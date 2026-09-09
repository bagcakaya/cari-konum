# Cari Konum - Vercel ve Mobil Kurulum Kılavuzu 📱

Bu kılavuz, uygulamanızı **Vercel** üzerinde 7/24 ücretsiz olarak yayına almanız, cep telefonunuzun ana ekranına uygulama olarak eklemeniz ve **OneSignal Web Push** bildirimlerini yapılandırmanız için hazırlanmıştır.

---

## 1. Adım: Vercel Üzerinde Yayınlama (Deploy)

Uygulamanızı Vercel'e yüklemek için en kolay iki yöntem şunlardır:

### Yöntem A: GitHub ile Otomatik Dağıtım (Önerilen)
1. **GitHub Hesabınıza Yükleyin:**
   * Bilgisayarınızda `c:\Users\Mert\Desktop\Cari Konum` klasörünü bir Git deposu olarak GitHub hesabınıza aktarın (Örn: `cari-konum`).
2. **Vercel'e Bağlayın:**
   * [vercel.com](https://vercel.com) adresine gidin ve GitHub ile giriş yapın (Tamamen ücretsizdir).
   * **"Add New Project"** butonuna tıklayın.
   * `cari-konum` deponuzu seçin.
3. **Ayarlar:**
   * **Root Directory (Kök Dizin):** `web` klasörünü seçin.
   * **Framework Preset:** `Vite` (Vercel otomatik tanır).
   * **"Deploy"** butonuna tıklayın.
4. Yaklaşık 30 saniye içinde uygulamanız `https://cari-konum.vercel.app` gibi bir bağlantıyla dünya genelinde yayında olacaktır!

---

### Yöntem B: Komut Satırından Vercel CLI ile (Doğrudan)
Eğer GitHub kullanmak istemiyorsanız, terminalden 1 komutla doğrudan yükleyebilirsiniz:
```bash
cd "c:\Users\Mert\Desktop\Cari Konum\web"
npx vercel
```
Ekrana gelen sorulara `Y` (Evet) diyerek 1 dakikada yayına alabilirsiniz.

---

## 2. Adım: Cep Telefonunda "Ana Ekrana Ekle" (PWA Kurulumu)

Uygulama linkinizi (`https://sizin-uygulamaniz.vercel.app`) telefonunuzda açın:

### 🍏 iPhone (iOS / Safari) Kullanıcıları İçin:
1. Safari tarayıcısında linki açın.
2. Ekranın alt ortasındaki **Paylaş** simgesine (yukarı oklu kutucuk) dokunun.
3. Aşağı kaydırıp **"Ana Ekrana Ekle" (Add to Home Screen)** seçeneğine dokunun.
4. Sağ üstteki **"Ekle"** butonuna basın.
5. Telefonunuzun ana ekranına **Cari Konum** ikonu yerleşecektir. Artık normal bir mobil uygulama gibi tam ekran açılır!

### 🤖 Android (Google Chrome) Kullanıcıları İçin:
1. Chrome tarayıcısında linki açın.
2. Sağ üstteki **üç nokta (⋮)** menüsüne dokunun.
3. **"Uygulamayı Yükle"** veya **"Ana Ekrana Ekle"** seçeneğine dokunun.
4. Onaylayın. Uygulama telefonunuza native uygulama gibi kurulur.

---

## 3. Adım: OneSignal Web Push Bildirimleri (Ücretsiz)

Mobil tarayıcınızda ekran açıkken veya PWA çalışırken 200m bildirimleri doğrudan işletim sistemi üzerinden iletilir. İsterseniz OneSignal Web Push servisini de ücretsiz bağlayabilirsiniz:

1. [onesignal.com](https://onesignal.com) adresinden ücretsiz bir hesap oluşturun.
2. **"New App/Website"** seçeneğine tıklayın.
3. Platform olarak **"Web Push"** seçin.
4. Site URL kısmına Vercel adresinizi (Örn: `https://cari-konum.vercel.app`) yazın.
5. **Settings > Keys & IDs** bölümünden **"OneSignal App ID"** kodunu kopyalayın.
6. `web/.env` dosyası oluşturup içine ekleyin:
   ```env
   VITE_ONESIGNAL_APP_ID=kopyaladiginiz_app_id
   ```
7. Vercel paneline de **Environment Variables** kısmından bu anahtarı ekleyip kaydedin.

---

## 4. Adım: SQL Server'daki Yeni Değişiklikleri Senkronize Etme

ERP'nize yeni bir fatura kesildiğinde, borç/alacak değiştiğinde veya yeni bir müşteri eklendiğinde:

1. Masaüstünüzdeki **`Verileri-Guncelle.bat`** dosyasına çift tıklayın.
2. Program otomatik olarak SQL Server (`POLATLAR2025`) veritabanını tarar, son bakiyeleri eşitler ve dosyaları günceller.
3. Vercel uygulamanızı açtığınızda ekrandaki **"Yenile" (Döngü)** simgesine bastığınız anda en güncel veriler telefona yansır!

---

## 🎯 Ofisten Test Etme (Simülasyon Modu)

Uygulamanın 200m çapına girildiğinde verdiği tepkiyi test etmek için sahaya çıkmanıza gerek yoktur:

1. Uygulama ekranının sağ üstündeki **Hedef / Nişangah (🎯)** simgesine tıklayın.
2. Ekranda sarı renkli *"Test Modu Aktif"* uyarısı belirecektir.
3. Haritada kırmızı veya yeşil pinli herhangi bir carinin çok yakınına (200m içine) haritaya dokunun.
4. Anında:
   * Cihazınız titreşir (mobil cihazdaysa).
   * Ekranda büyük **"📍 [Firma Adı] firmasına yaklaştınız, uğramak ister misiniz?"** penceresi açılır.
   * **[Evet]** butonuna bastığınızda firmanın güncel Borç, Alacak, Net Bakiye ve iletişim kartı açılır.
   * **[Hayır]** dediğinizde kapanır.
