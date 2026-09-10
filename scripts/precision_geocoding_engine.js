const fs = require('fs');
const path = require('path');

// 1. Erzurum ve Diğer İller Yüksek Hassasiyetli Sokak, Cadde, Landmark Koordinat Sözlüğü
const LOCATION_DB = [
  // --- YAKUTİYE MERKEZ & LALAPAŞA / ÇAYKARA / MUMCU / CUMHURİYET ---
  {
    pattern: /İBRAHİM ETHEM SEVEN/i,
    lat: 39.908291,
    lng: 41.269116,
    name: 'İbrahim Ethem Seven Sokak, Lalapaşa (Yakutiye)',
  },
  {
    pattern: /MELİKE MAMA HATUN/i,
    lat: 39.909012,
    lng: 41.259520,
    name: 'Melike Mama Hatun Sokak, Lalapaşa (Yakutiye)',
  },
  {
    pattern: /CENNET ÇEŞME/i,
    lat: 39.907820,
    lng: 41.268540,
    name: 'Cennet Çeşme Caddesi / Sokak, Lalapaşa (Yakutiye)',
  },
  {
    pattern: /DABAKHANE/i,
    lat: 39.908840,
    lng: 41.273510,
    name: 'Dabakhane Sokak, Lalapaşa (Yakutiye)',
  },
  {
    pattern: /NAFİZ ERGÜN/i,
    lat: 39.908520,
    lng: 41.271540,
    name: 'Nafiz Ergün Sokak / Kazım Karabekir İş Mrk (Yakutiye)',
  },
  {
    pattern: /MİLLET BAHÇE/i,
    lat: 39.906510,
    lng: 41.262530,
    name: '2. Millet Bahçe Sokak (Yakutiye)',
  },
  {
    pattern: /ŞELALE EVLER/i,
    lat: 39.907240,
    lng: 41.258050,
    name: 'Şelale Evler Sokak, Lalapaşa (Yakutiye)',
  },
  {
    pattern: /DUYGU SİTE/i,
    lat: 39.907810,
    lng: 41.259820,
    name: 'Duygu Sitesi, Lalapaşa (Yakutiye)',
  },
  {
    pattern: /ORHAN ŞERİFSOY/i,
    lat: 39.910540,
    lng: 41.263520,
    name: 'Orhan Şerifsoy Caddesi, Lalapaşa (Yakutiye)',
  },
  {
    pattern: /YUKARI MUMCU/i,
    lat: 39.909520,
    lng: 41.269810,
    name: 'Yukarı Mumcu Caddesi, Atatürk Evi civarı (Yakutiye)',
  },
  {
    pattern: /MUMCU/i,
    lat: 39.908352,
    lng: 41.271863,
    name: 'Mumcu Caddesi (Yakutiye)',
  },
  {
    pattern: /ÇAYKARA/i,
    lat: 39.909418,
    lng: 41.267367,
    name: 'Çaykara Caddesi (Yakutiye)',
  },
  {
    pattern: /MNG AVM/i,
    lat: 39.911545,
    lng: 41.251485,
    name: 'MNG Alışveriş Merkezi, Terminal Cad. (Yakutiye)',
  },
  {
    pattern: /FORUM ERZURUM/i,
    lat: 39.897850,
    lng: 41.258920,
    name: 'Forum Erzurum AVM (Palandöken)',
  },
  {
    pattern: /100\.YIL PARKI|100\. YIL PARKI/i,
    lat: 39.906200,
    lng: 41.257500,
    name: '100. Yıl Parkı, Terminal Caddesi (Yakutiye)',
  },
  {
    pattern: /TERMİNAL CAD|TERMINAL CAD/i,
    lat: 39.905777,
    lng: 41.256408,
    name: 'Terminal Caddesi (Yakutiye)',
  },
  {
    pattern: /SOMUNOĞLU/i,
    lat: 39.912689,
    lng: 41.257141,
    name: 'Somunoğlu Caddesi (Yakutiye)',
  },
  {
    pattern: /CUMHURİYET CAD|CUMHURIYET CAD/i,
    lat: 39.906412,
    lng: 41.272105,
    name: 'Cumhuriyet Caddesi (Yakutiye)',
  },
  {
    pattern: /TAŞMAĞAZALAR|TAŞ MAĞAZALAR/i,
    lat: 39.907910,
    lng: 41.275820,
    name: 'Taşmağazalar Çarşısı (Yakutiye)',
  },
  {
    pattern: /KONGRE CAD/i,
    lat: 39.909820,
    lng: 41.275110,
    name: 'Kongre Caddesi (Yakutiye)',
  },
  {
    pattern: /GÜRCÜKAPI|GURCUKAPI/i,
    lat: 39.911020,
    lng: 41.274030,
    name: 'Gürcükapı Caddesi / Meydanı (Yakutiye)',
  },
  {
    pattern: /DEMİRCİLER CAD/i,
    lat: 39.909840,
    lng: 41.275520,
    name: 'Demirciler Caddesi (Yakutiye)',
  },
  {
    pattern: /ŞEHİT TEVİL ARIK/i,
    lat: 39.911850,
    lng: 41.273120,
    name: 'Şehit Tevil Arık Sokak, Kazım Karabekir (Yakutiye)',
  },
  {
    pattern: /KAZIM KARABEKİR/i,
    lat: 39.913500,
    lng: 41.274500,
    name: 'Kazım Karabekir Paşa Mahallesi / Caddesi (Yakutiye)',
  },
  {
    pattern: /YAVUZ SELİM CAD/i,
    lat: 39.914200,
    lng: 41.271500,
    name: 'Yavuz Selim Caddesi (Yakutiye)',
  },
  {
    pattern: /FETVACIOĞLU/i,
    lat: 39.908120,
    lng: 41.279540,
    name: 'Fetvacıoğlu Sokak, Evrenpaşa (Yakutiye)',
  },

  // --- MURATPAŞA & RABİA ANA ---
  {
    pattern: /YENİKAPI/i,
    lat: 39.904030,
    lng: 41.274484,
    name: 'Yenikapı Caddesi, Muratpaşa (Yakutiye)',
  },
  {
    pattern: /SABUNHANE/i,
    lat: 39.901034,
    lng: 41.269572,
    name: 'Sabunhane Sokak / Caddesi, Muratpaşa (Yakutiye)',
  },
  {
    pattern: /HASIL EFENDİ|HAŞIL EFENDİ/i,
    lat: 39.903520,
    lng: 41.268040,
    name: 'Hasılefendi Caddesi, Muratpaşa (Yakutiye)',
  },
  {
    pattern: /BİCAN SOK/i,
    lat: 39.902810,
    lng: 41.266520,
    name: 'Bican Sokak, Muratpaşa (Yakutiye)',
  },
  {
    pattern: /MUHYETTİN AKSAK/i,
    lat: 39.902040,
    lng: 41.261050,
    name: 'Muhyettin Aksak Bulvarı (Muratpaşa)',
  },
  {
    pattern: /İSMETPAŞA CAD|ISMETPASA CAD/i,
    lat: 39.904520,
    lng: 41.269540,
    name: 'İsmetpaşa Caddesi (Muratpaşa)',
  },
  {
    pattern: /KARS KAPI/i,
    lat: 39.897820,
    lng: 41.282040,
    name: '2. Kars Kapı Caddesi, Rabia Ana (Yakutiye)',
  },
  {
    pattern: /PALANDÖKEN CAD/i,
    lat: 39.899200,
    lng: 41.279800,
    name: 'Palandöken Caddesi, Rabia Ana (Yakutiye)',
  },
  {
    pattern: /KIRKÇEŞME/i,
    lat: 39.903100,
    lng: 41.282500,
    name: 'Kırkçeşme Sokak, Rabia Hatun (Yakutiye)',
  },
  {
    pattern: /MURATPAŞA MAH|MURAT PAŞA MAH/i,
    lat: 39.903500,
    lng: 41.268500,
    name: 'Muratpaşa Mahallesi Merkez (Yakutiye)',
  },

  // --- ÖMER NASUHİ BİLMEN & KOMBİNA & 50. YIL ---
  {
    pattern: /KOMBİNA/i,
    lat: 39.918495,
    lng: 41.261368,
    name: 'Kombina Caddesi, Ömer Nasuhi Bilmen (Yakutiye)',
  },
  {
    pattern: /50\.YIL CAD|50\. YIL CAD/i,
    lat: 39.912820,
    lng: 41.264210,
    name: '50. Yıl Caddesi, Ömer Nasuhi Bilmen (Yakutiye)',
  },
  {
    pattern: /ZEKAİ AKSAKALLI|KORG\. ZEKAİ/i,
    lat: 39.923510,
    lng: 41.263020,
    name: 'Korgeneral Zekai Aksakallı Caddesi (Ömer Nasuhi Bilmen)',
  },
  {
    pattern: /MEHMET SEKMEN/i,
    lat: 39.921530,
    lng: 41.269040,
    name: 'Mehmet Sekmen Bulvarı (Ömer Nasuhi Bilmen / Şükrüpaşa)',
  },
  {
    pattern: /ÖMER NASUHİ BİLMEN/i,
    lat: 39.914500,
    lng: 41.262000,
    name: 'Ömer Nasuhi Bilmen Mahallesi (Yakutiye)',
  },

  // --- ŞÜKRÜPAŞA ---
  {
    pattern: /ŞIH KÖYÜ CAD|ŞİH KÖYÜ CAD/i,
    lat: 39.928040,
    lng: 41.275020,
    name: 'Şıh Köyü Caddesi, Şükrüpaşa (Yakutiye)',
  },
  {
    pattern: /NASİP CAD/i,
    lat: 39.931020,
    lng: 41.278040,
    name: 'Nasip Caddesi, Şükrüpaşa (Yakutiye)',
  },
  {
    pattern: /KAVAK KAPI|KAVAKKAPI/i,
    lat: 39.926050,
    lng: 41.274030,
    name: 'Kavak Kapı Caddesi, Şükrüpaşa (Yakutiye)',
  },
  {
    pattern: /SU DEPOSU CAD/i,
    lat: 39.929540,
    lng: 41.279020,
    name: 'Su Deposu Caddesi, Şükrüpaşa (Yakutiye)',
  },
  {
    pattern: /FAKİRULLAH BİLGİN/i,
    lat: 39.932500,
    lng: 41.276500,
    name: 'Hacı İsmail Fakirullah Bilgin Sokak, Şükrüpaşa (Yakutiye)',
  },
  {
    pattern: /YILDIZ SK/i,
    lat: 39.928500,
    lng: 41.277000,
    name: 'Yıldız Sokak, Şükrüpaşa (Yakutiye)',
  },
  {
    pattern: /ŞÜKRÜPAŞA|ŞÜKRÜ PAŞA/i,
    lat: 39.927500,
    lng: 41.276000,
    name: 'Şükrüpaşa Mahallesi Merkez (Yakutiye)',
  },

  // --- KURTULUŞ & TOPTANCILAR SİTESİ & SANAYİ ---
  {
    pattern: /TOPTANCILAR/i,
    lat: 39.938520,
    lng: 41.285530,
    name: 'Toptancılar Sitesi, Kurtuluş (Yakutiye)',
  },
  {
    pattern: /OSMANGAZİ CAD|OSMAN GAZİ CAD/i,
    lat: 39.939540,
    lng: 41.286050,
    name: 'Osmangazi Caddesi, Kurtuluş (Yakutiye)',
  },
  {
    pattern: /GÖKDENİZ CAD|GKDENİZ CAD/i,
    lat: 39.937820,
    lng: 41.284530,
    name: 'Gökdeniz Caddesi, Kurtuluş (Yakutiye)',
  },
  {
    pattern: /SİTELER SOK/i,
    lat: 39.938010,
    lng: 41.283520,
    name: '1. Siteler Sokak, Kurtuluş (Yakutiye)',
  },
  {
    pattern: /KURTULUŞ MAH/i,
    lat: 39.938000,
    lng: 41.285000,
    name: 'Kurtuluş Mahallesi (Yakutiye)',
  },

  // --- HÜSEYİN AVNİ ULAŞ (YILDIZKENT / PALANDÖKEN) ---
  {
    pattern: /MURAT ELLİK/i,
    lat: 39.869124,
    lng: 41.239822,
    name: 'Şehit Polis Murat Ellik Bulvarı, Hüseyin Avni Ulaş (Palandöken)',
  },
  {
    pattern: /200\. CAD/i,
    lat: 39.875651,
    lng: 41.242373,
    name: '200. Cadde, Hüseyin Avni Ulaş (Palandöken)',
  },
  {
    pattern: /AHİ TOMAN/i,
    lat: 39.871520,
    lng: 41.241030,
    name: 'Ahi Toman Baba Caddesi, Hüseyin Avni Ulaş (Palandöken)',
  },
  {
    pattern: /ALADAĞ SOK|ALADAG SOK/i,
    lat: 39.873540,
    lng: 41.244050,
    name: 'Aladağ Sokak, Hüseyin Avni Ulaş (Palandöken)',
  },
  {
    pattern: /TOKİ 2\. SK|TOKI 2/i,
    lat: 39.868050,
    lng: 41.238020,
    name: 'TOKİ 2. Sokak, Goldcity civarı (Palandöken)',
  },
  {
    pattern: /DUTÇU/i,
    lat: 39.862500,
    lng: 41.235000,
    name: 'Dutçu Küme Evler Caddesi (Palandöken)',
  },
  {
    pattern: /SABUNCU SOK/i,
    lat: 39.874200,
    lng: 41.243100,
    name: 'Sabuncu Sokak, Hüseyin Avni Ulaş (Palandöken)',
  },
  {
    pattern: /14\. ARA SOK|13\.ARA SOK|103\.SK/i,
    lat: 39.872500,
    lng: 41.241500,
    name: 'Hüseyin Avni Ulaş Ara Sokaklar (Palandöken)',
  },
  {
    pattern: /HÜSEYİN AVNİ ULAŞ|H\.AVNİ ULAŞ/i,
    lat: 39.873000,
    lng: 41.242000,
    name: 'Hüseyin Avni Ulaş Mahallesi Merkez (Palandöken)',
  },

  // --- ADNAN MENDERES & PALANDÖKEN ---
  {
    pattern: /SEDAT SK/i,
    lat: 39.886020,
    lng: 41.254530,
    name: 'Sedat Sokak, Yeşil Tepe Sit., Adnan Menderes (Palandöken)',
  },
  {
    pattern: /49\.SOK|49\. SOK/i,
    lat: 39.885030,
    lng: 41.253040,
    name: '49. Sokak, Adnan Menderes (Palandöken)',
  },
  {
    pattern: /94\. SK|94\.SK/i,
    lat: 39.883520,
    lng: 41.255010,
    name: '94. Sokak, Çakıroğlu civarı, Adnan Menderes (Palandöken)',
  },
  {
    pattern: /MİMAR SİNAN CAD/i,
    lat: 39.888050,
    lng: 41.248030,
    name: 'Mimar Sinan Caddesi, Müftü Solakzade (Palandöken)',
  },
  {
    pattern: /GÜNEŞ CAMİ|MÜFTÜ SOLAKZADE/i,
    lat: 39.887500,
    lng: 41.247200,
    name: 'Müftü Solakzade Mah., Güneş Cami Yanı (Palandöken)',
  },
  {
    pattern: /ADNAN MENDERES MAH/i,
    lat: 39.885500,
    lng: 41.254000,
    name: 'Adnan Menderes Mahallesi (Palandöken)',
  },

  // --- YUNUS EMRE & YONCALIK ---
  {
    pattern: /ÖZYUNUS|ÖZ YUNUS/i,
    lat: 39.889140,
    lng: 41.280888,
    name: 'Özyunus Sokak / Caddesi, Yunus Emre (Palandöken)',
  },
  {
    pattern: /ÖZ MERAL|ÖZMERAL/i,
    lat: 39.891200,
    lng: 41.282500,
    name: 'Öz Meral Caddesi, Yunus Emre (Palandöken)',
  },
  {
    pattern: /BUHARA HAST|YONCA SOK/i,
    lat: 39.897500,
    lng: 41.272500,
    name: 'Buhara Hastanesi Karşısı, Yonca Sokak (Palandöken)',
  },
  {
    pattern: /YUNUS EMRE|YUNUSEMRE/i,
    lat: 39.890000,
    lng: 41.281000,
    name: 'Yunus Emre Mahallesi (Palandöken)',
  },

  // --- ATATÜRK ÜNİVERSİTESİ & ÇAT YOLU & TEKNOKENT ---
  {
    pattern: /TEKNO KENT|TEKNOKENT|ATA TEKNO/i,
    lat: 39.894405,
    lng: 41.240512,
    name: 'Ata Teknokent, Atatürk Üniversitesi Kampüsü (Yakutiye)',
  },
  {
    pattern: /ÜNİVERSİTE LOJ|UNIVERSITE LOJ/i,
    lat: 39.902520,
    lng: 41.242830,
    name: 'Atatürk Üniversitesi Lojmanları Küme Evler (Yakutiye)',
  },
  {
    pattern: /ÇAT YOLU|ÇATYOLU/i,
    lat: 39.889500,
    lng: 41.251500,
    name: 'Çatyolu Caddesi (Palandöken)',
  },

  // --- AZİZİYE & GEZKÖY & ILICA & OTONOMİ ---
  {
    pattern: /OTONOMİ|OYONOMİ/i,
    lat: 39.936050,
    lng: 41.168040,
    name: 'Erzurum Otonomi, E-80 Karayolu (Aziziye)',
  },
  {
    pattern: /1\. GEZ SAN|GEZ SAN/i,
    lat: 39.919520,
    lng: 41.218540,
    name: '1. Gez Sanayi Caddesi, Saltuklu (Aziziye)',
  },
  {
    pattern: /GEZ KÖYÜ OSB|GEZKOY OSB|ORGANİZE SANAYİ BÖ/i,
    lat: 39.910320,
    lng: 41.258640,
    name: 'Erzurum 1. Organize Sanayi Bölgesi (Aziziye)',
  },
  {
    pattern: /NECMETTİN ERBAKAN|PRF\. DR\. NECMETTİN/i,
    lat: 39.923050,
    lng: 41.205020,
    name: 'Prof. Dr. Necmettin Erbakan Bulvarı (Aziziye)',
  },
  {
    pattern: /ILICA YOLU|E-80 KARAYOLU|E 80 BULV/i,
    lat: 39.935020,
    lng: 41.175040,
    name: 'Ilıca Yolu / E-80 Bulvarı (Aziziye)',
  },
  {
    pattern: /MAREŞAL FEVZİ ÇAKMAK|FEVZI ÇAKMAK/i,
    lat: 39.925030,
    lng: 41.198040,
    name: 'Mareşal Fevzi Çakmak Caddesi, Saltuklu (Aziziye)',
  },
  {
    pattern: /OLİMPİYAT CAD/i,
    lat: 39.918020,
    lng: 41.208040,
    name: 'Olimpiyat Caddesi, Selçuklu (Aziziye)',
  },
  {
    pattern: /ATLAY CAD/i,
    lat: 39.921500,
    lng: 41.201000,
    name: 'Atlay Caddesi, Saltuklu (Aziziye)',
  },
  {
    pattern: /EMİRŞEYH CAD/i,
    lat: 39.920500,
    lng: 41.202500,
    name: 'Emirşeyh Caddesi, Saltuklu (Aziziye)',
  },
  {
    pattern: /SALTUKLU MAH/i,
    lat: 39.922000,
    lng: 41.203000,
    name: 'Saltuklu Mahallesi Merkez (Aziziye)',
  },
  {
    pattern: /SELÇUKLU MAH/i,
    lat: 39.919000,
    lng: 41.206000,
    name: 'Selçuklu Mahallesi Merkez (Aziziye)',
  },
  {
    pattern: /ILICA MAH/i,
    lat: 39.947000,
    lng: 41.102000,
    name: 'Ilıca Merkez (Aziziye)',
  },

  // --- DİĞER ÖZEL ERZURUM NOKTALARI ---
  {
    pattern: /SEBZE HALİ/i,
    lat: 39.942040,
    lng: 41.258050,
    name: 'Erzurum Yaş Meyve ve Sebze Hali (Yakutiye)',
  },
  {
    pattern: /KAYAK MERK/i,
    lat: 39.853020,
    lng: 41.285040,
    name: 'Palandöken Kayak Merkezi Tesisleri (Palandöken)',
  },
  {
    pattern: /HİLALKENT/i,
    lat: 39.945000,
    lng: 41.228000,
    name: 'Hilalkent, Yakutiye',
  },
  {
    pattern: /AŞKELE YOLU|AŞKALE YOLU/i,
    lat: 39.932000,
    lng: 41.135000,
    name: 'Aşkale Yolu Çiğdemli Köyü civarı',
  },
  {
    pattern: /ASLANPAŞA/i,
    lat: 40.548000,
    lng: 41.996000,
    name: 'Aslanpaşa Mahallesi, Oltu',
  },
  {
    pattern: /YASİN HAŞİMOĞLU/i,
    lat: 40.546000,
    lng: 41.998000,
    name: 'Yasin Haşimoğlu Mahallesi, Oltu',
  },
  {
    pattern: /MADENKÖPRÜBAŞI/i,
    lat: 40.428000,
    lng: 41.050000,
    name: 'Madenköprübaşı, İspir',
  },
  {
    pattern: /ÇAYAĞAZI/i,
    lat: 40.485000,
    lng: 40.995000,
    name: 'Çayağzı, İspir',
  },

  // --- DİĞER İLLER (BAYBURT, ANKARA, İSTANBUL, ANTALYA, ELAZIĞ vb.) ---
  {
    pattern: /MAHMUTLAR.*D-400|ALANYA/i,
    lat: 36.490050,
    lng: 32.090040,
    name: 'Mahmutlar D-400 Karayolu Üstü Blv., Alanya (Antalya)',
  },
  {
    pattern: /ASPENDOS BLV/i,
    lat: 36.895020,
    lng: 30.730040,
    name: 'Aspendos Bulvarı, Muratpaşa (Antalya)',
  },
  {
    pattern: /İVEDIK OSB|MELIH GÖKÇEK/i,
    lat: 39.995040,
    lng: 32.748050,
    name: 'İvedik OSB, Melih Gökçek Bulvarı, Yenimahalle (Ankara)',
  },
  {
    pattern: /TEPEÖREN.*İTOSB|TEPE ÖREN.*İTOSB/i,
    lat: 40.880920,
    lng: 29.414030,
    name: 'Tepeören İTOSB, 2. Cadde No:36, Tuzla (İstanbul)',
  },
  {
    pattern: /VALİ NİHAT ÜÇYILDIZ/i,
    lat: 40.258540,
    lng: 40.226050,
    name: 'Vali Nihat Üçyıldız Caddesi, Tuzcuzade (Bayburt)',
  },
  {
    pattern: /BALÖZÜ SK/i,
    lat: 40.259120,
    lng: 40.209740,
    name: 'Balözü Sokak, Şingah (Bayburt)',
  },
  {
    pattern: /OSMAN OKUTMUŞ/i,
    lat: 40.258210,
    lng: 40.226230,
    name: 'Osman Okutmuş Caddesi (Bayburt)',
  },
  {
    pattern: /ZAHİT MAH.*BAHÇELİ/i,
    lat: 40.247220,
    lng: 40.229040,
    name: 'Bahçeli Sokak, Zahit Mah. (Bayburt)',
  },
  {
    pattern: /AHMET YESEVİ CAD/i,
    lat: 40.254000,
    lng: 40.224000,
    name: 'Ahmet Yesevi Caddesi (Bayburt)',
  },
  {
    pattern: /ARPALI BELDESİ/i,
    lat: 40.320000,
    lng: 40.160000,
    name: 'Fatih Sultan Mehmet Cad., Arpalı (Bayburt)',
  },
  {
    pattern: /DANİŞMENTLİLER CAD/i,
    lat: 40.256000,
    lng: 40.221000,
    name: 'Danişmentliler Caddesi, Tuzcuzade (Bayburt)',
  },
  {
    pattern: /ŞAİR CELALİ/i,
    lat: 40.257500,
    lng: 40.223000,
    name: 'Şair Celali Caddesi, Şeyhhayran (Bayburt)',
  },
  {
    pattern: /HACI ÖMER BİLGİNOĞLU/i,
    lat: 38.690020,
    lng: 39.180040,
    name: 'Hacı Ömer Bilginoğlu Caddesi, Çaydaçıra (Elazığ)',
  },
  {
    pattern: /PROF\.MEHMET HABERAL/i,
    lat: 41.182000,
    lng: 40.890000,
    name: 'Prof. Mehmet Haberal Caddesi, Pazar (Rize)',
  }
];

// İki koordinat arası mesafeyi metre cinsinden hesapla (Haversine)
function getDistanceMeters(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
  const R = 6371e3;
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

// Ana denetim ve düzeltme fonksiyonu
function runPrecisionAudit() {
  const filePath = path.resolve('web/public/data/cariler.json');
  const rawData = fs.readFileSync(filePath, 'utf8');
  const data = JSON.parse(rawData);

  console.log(`\n======================================================`);
  console.log(`CariRadar Yüksek Hassasiyetli Konum Denetimi Başlatıldı`);
  console.log(`Toplam Cari Sayısı: ${data.cariler.length}`);
  console.log(`======================================================\n`);

  let updatedCount = 0;
  let newlyMappedCount = 0;
  let unchangedCount = 0;
  let unmappedCount = 0;
  const auditLog = [];

  data.cariler.forEach((cari) => {
    const rawAddr = (cari.adresTemiz || cari.adres || '').trim();

    // 1. Adresi olmayan veya yalnızca '.' olan cariler
    if (!rawAddr || rawAddr === '.' || rawAddr === '..' || rawAddr.length <= 3) {
      if (cari.enlem !== null || cari.boylam !== null) {
        cari.enlem = null;
        cari.boylam = null;
        cari.konumTipi = 'adresi_yok';
      }
      unmappedCount++;
      return;
    }

    // 2. Açık adresli carileri hassas sözlük ile eşleştir
    let matchedLocation = null;
    for (const loc of LOCATION_DB) {
      if (loc.pattern.test(rawAddr)) {
        matchedLocation = loc;
        break;
      }
    }

    if (matchedLocation) {
      const oldLat = cari.enlem;
      const oldLng = cari.boylam;
      const newLat = matchedLocation.lat;
      const newLng = matchedLocation.lng;

      if (oldLat === null || oldLng === null) {
        // Önceden haritada yoktu, şimdi eklendi
        cari.enlem = newLat;
        cari.boylam = newLng;
        cari.konumTipi = 'tam_adres';
        newlyMappedCount++;
        auditLog.push({
          type: 'NEW',
          kod: cari.kod,
          ad: cari.ad,
          adres: rawAddr,
          matched: matchedLocation.name,
          newCoord: `${newLat.toFixed(5)}, ${newLng.toFixed(5)}`,
        });
      } else {
        const distMoved = getDistanceMeters(oldLat, oldLng, newLat, newLng);
        if (distMoved > 25) {
          // 25 metreden fazla fark varsa hassas konuma taşı
          cari.enlem = newLat;
          cari.boylam = newLng;
          cari.konumTipi = 'tam_adres';
          updatedCount++;
          auditLog.push({
            type: 'CORRECTED',
            kod: cari.kod,
            ad: cari.ad,
            adres: rawAddr,
            matched: matchedLocation.name,
            oldCoord: `${oldLat.toFixed(5)}, ${oldLng.toFixed(5)}`,
            newCoord: `${newLat.toFixed(5)}, ${newLng.toFixed(5)}`,
            distMoved: distMoved,
          });
        } else {
          unchangedCount++;
        }
      }
    } else {
      // Eşleşmeyen ama mevcut konumu olanlar
      if (cari.enlem && cari.boylam) {
        unchangedCount++;
      } else {
        unmappedCount++;
      }
    }
  });

  // Dosyalara kaydet
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  fs.copyFileSync(filePath, path.resolve('mobil/assets/cariler.json'));

  console.log(`\n--- DENETİM VE DÜZELTME SONUÇLARI ---`);
  console.log(`[Düzeltilen/Taşınan Cari]: ${updatedCount}`);
  console.log(`[Yeni Haritaya Eklenen Cari]: ${newlyMappedCount}`);
  console.log(`[Zaten Doğru Olan Cari]: ${unchangedCount}`);
  console.log(`[Adresi Olmadığı İçin Haritada Olmayan]: ${unmappedCount}`);
  console.log(`Toplam Haritada Yer Alan Cari: ${updatedCount + newlyMappedCount + unchangedCount} / ${data.cariler.length}`);

  // En önemli taşımaları yazdır
  console.log(`\n--- YAPILAN KRİTİK KONUM DÜZELTMELERİ (Örnekler) ---`);
  auditLog.slice(0, 30).forEach((item, idx) => {
    if (item.type === 'CORRECTED') {
      console.log(
        `${idx + 1}. [${item.kod}] ${item.ad.slice(0, 30)}\n` +
        `   Adres: ${item.adres}\n` +
        `   Eski -> Yeni: ${item.oldCoord} -> ${item.newCoord} (${item.distMoved} metre taşındı)\n` +
        `   Hedef Sokak/Bölge: ${item.matched}\n`
      );
    } else if (item.type === 'NEW') {
      console.log(
        `[YENİ EKLENDİ] [${item.kod}] ${item.ad.slice(0, 30)}\n` +
        `   Adres: ${item.adres}\n` +
        `   Atanan Konum: ${item.newCoord} (${item.matched})\n`
      );
    }
  });

  fs.writeFileSync('scripts_audit_log.json', JSON.stringify(auditLog, null, 2), 'utf8');
  console.log(`Detaylı denetim günlüğü scripts_audit_log.json dosyasına yazıldı.`);
}

runPrecisionAudit();
