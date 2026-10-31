# SiberMuhafız

11–18 yaş için Türkçe siber güvenlik eğitim prototipi. Gerçek hedefe saldırı, tarama veya gerçek parola girişi içermez. Bütün kişi, adres, olay ve kayıtlar kurgusaldır.

## Çalışan özellikler

- Kaşif (11–13), Savunucu (14–15), Analist (16–18): 8 yol × 3 kademe = 24 farklı görev.
- Üç adımlık animasyonlu mini dersler, açıklamalı cevaplar ve ipuçları.
- Oltalama analizinde işaretleme, dijital ayak izinde ayrıntı seçimi, Sezar/Base64 bulmacaları, parola güvenliği ve kurgusal log analizi.
- İlk tamamlamada 100 XP, kademe/yol rozetleri ve seviye. Tekrar çözüm ek puan üretmez.
- İsteğe bağlı takma ad ve yalnızca bu cihazdaki kişisel sıralama. Global sıralama yoktur.
- Yerel öğretmen alanı: sınıf etiketi oluşturma, öğrencinin indirdiği JSON raporunu içe aktarma, kazanım özeti ve metin raporu.
- Aynı ekranda iki takımın dönüşümlü oynadığı 8 soruluk yarışma. Çevrim içi çok oyunculu değildir.
- Veli rehberi, gizlilik açıklaması, etik çerçeve, cihaz kayıtlarını silme ve rapor indirme.

## Sınırlar

Sunucu, üyelik, merkezi öğrenci takibi, uzaktan sınıf kodu, gerçek veli onayı hizmeti veya doğrulanmış öğretmen rolü yoktur. Öğretmen alanı bir yerel demodur. Sınıf raporları otomatik toplanmaz; öğrenciler dosyalarını kendileri paylaşır. Resmi MEB kazanımlarıyla onaylı eşleştirme veya KVKK uygunluk belgesi iddia edilmez. Okul ölçeğinde çevrim içi kullanım için erişim, izin ve veri yönetimi ayrıca tasarlanmalıdır.

Kişinin gerçek adı, okul bilgisi, doğum tarihi, e-postası veya parolası istenmez. Takma ad isteğe bağlıdır. Tarayıcıda `sibermuhafiz-v1` anahtarıyla kademe, rastgele cihaz kimliği, tamamlamalar, son 300 deneme ve yerel sınıflar tutulur. Veri doğrudan bir sunucuya gönderilmez. Aynı tarayıcıyı kullananlar kayıtlara erişebilir; ortak cihazda kayıtlar silinebilir. Barındırma sağlayıcısının erişim kayıtları uygulamadan ayrıdır. Harici yazı tipi, video, analiz veya reklam servisi kullanılmaz.

Soru cevapları istemci kaynak kodunda görülebilir; bu bir sınav veya hileye dayanıklı puanlama altyapısı değildir. Parola yarışı görsel bir benzetimdir, gerçek kırma süresi hesabı değildir. Base64 bir kodlamadır; Sezar şifresi gerçek sırları korumak için güvenli değildir.

## Yayınlama

Derleme ve paket kurulumu gerekmez. GitHub Settings → Pages → Deploy from a branch → main → /(root) → Save. GitHub Pages, bu dizindeki `index.html`, `style.css`, `app.js`, `shield.svg` dosyalarını doğrudan yayınlar. Bağlantılar göreli olduğu için proje alt dizininde çalışır.

Yerelde dosyaları bir statik HTTP sunucusuyla sunun veya `index.html` dosyasını açın (yerel dosya modunda tarayıcı depolaması tarayıcıya göre değişebilir).

## Doğrulama

24 görevin tamamı tarayıcı arayüzünden çözüldü; XP toplamı 2400 olarak doğrulandı. Aynı görevin tekrarı puan artırmadı. Hatalı cevap ve eksik işaretleme engeli, arama sonuçsuz durumu, sayfa yenilemesinden sonra ilerleme ve JSON rapor indirme doğrulandı. Gerçek hedef veya öğrenci verisi kullanılmadı.

Tüm içerik özgün bir eğitim prototipidir; referans platformların kodları veya görsel varlıkları kopyalanmamıştır.

