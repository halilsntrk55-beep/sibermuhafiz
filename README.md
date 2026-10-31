# SiberMuhafız

11–18 yaş için Türkçe siber güvenlik eğitim platformu. Gerçek hedefe saldırı, hesap kırma veya tarama yoktur; bütün senaryolar kurgusaldır.

## Gerçek öğrenci hesapları

Node.js 24 + SQLite sunucusu dahildir. Öğrenci adı (soyadı gerekmez), benzersiz kullanıcı adı ve en az 12 karakterli parola ile kayıt olunur. Aynı adla farklı öğrenciler farklı kullanıcı adlarıyla kayıt olabilir. Başka cihazda giriş yapıldığında puan, rozet, kademe ve son ders/görev adımı sunucudan yüklenir. Görevdeki gönderilmemiş cevaplar yerine ders/görev adımı saklanır.

Ad yalnızca hesap sahibine döner; rapor ve isteğe bağlı cihaz sıralaması takma ad kullanır. Parolalar ayrı tuzlarla scrypt özetine dönüştürülür. Oturumlarda rastgele 256 bit anahtarın sunucuda SHA-256 özeti ve tarayıcıda HttpOnly/SameSite çerezi kullanılır. Canlı HTTPS sürümünde Secure uygulanır. Origin, CSRF, giriş denemesi sınırı, parametreli SQL ve sunucu taraflı kullanıcı izolasyonu vardır. Hesap silme parola doğrulamasıyla ad, parola özeti, ilerleme ve oturumları aktif veritabanından kaldırır.

Konuk ilerlemesi tarayıcıda kalır ve öğrenci hesabına otomatik birleştirilmez; ortak cihazdaki önceki kişinin verisi yeni hesaba yazılmaz. Hesap parolası veya adı localStorage'a yazılmaz. Ağ sorunu kayıt durumunda gösterilir; kaydedilmemiş ilerleme varsa çıkış durdurulur ve rapor indirilebilir. Çoklu sekme için revision denetimi ve tamamlamaları birleştirme kullanılır.

## Başlatma

Node.js 24 gerekir. Harici paket kurulumu gerekmez.

```powershell
npm start
```

Adres: `http://127.0.0.1:4182`. Veritabanı varsayılan olarak `data/sibermuhafiz.sqlite` dosyasında tutulur ve Git'e eklenmez. `npm test` gerçek veritabanı üzerinde entegrasyon testlerini çalıştırır.

## Canlı yayın

**GitHub Pages Node.js/SQLite çalıştıramaz.** Pages yalnızca tanıtım/konuk sürümünü gösterir; gerçek kayıt varmış gibi davranmaz. Hesaplı sürüm için Node.js 24 veya Docker sunucusu, HTTPS ve kalıcı disk gerekir. Kodun GitHub'a aktarılması canlı veritabanı yayınlandığı anlamına gelmez.

```text
NODE_ENV=production
PUBLIC_ORIGIN=https://gercek-alan-adiniz
HOST=0.0.0.0
PORT=4182
DB_PATH=/kalici-disk/sibermuhafiz.sqlite
```

PUBLIC_ORIGIN gerçek kökenle aynı olmalı, sonunda `/` bulunmamalıdır. Dockerfile dahildir; `/app/data` için kalıcı volume bağlayın. Canlı HTTPS kökeni ayarlanmadan production başlatılamaz. Tek sunucu/tek veritabanı modelidir. Ölçek büyüdüğünde ortak PostgreSQL ve hız sınırlama altyapısına geçilmelidir. Yedekleme, saklama süreleri, disk şifreleme ve erişim denetimi hosting/kurum tarafından yapılandırılmalıdır. E-posta veya yönetici üzerinden parola kurtarma akışı henüz yoktur; parola yöneticisi kullanın.

## Eğitim

Kaşif (11–13), Savunucu (14–15), Analist (16–18) kademelerinde sekizer farklı görev: Şifre Kalesi, Oltaya Gelme, Dijital Ayak İzi, Siber Zorbalığa Dur, Oyun Alanını Koru, Gizli Mesajlar, Sahte Haber Dedektifi, Siber Dedektif. Animasyonlu mini dersler, ipuçları, açıklamalı cevaplar; ilk tamamlamada 100 XP ve rozet. Tekrar çözmek XP üretmez. Kaynak kodu görünür olduğundan bu bir hileye dayanıklı sınav altyapısı değildir.

İki takım için aynı ekranda dönüşümlü 8 soruluk yarışma vardır; çevrim içi çok oyunculu değildir. Öğretmen alanı yerel rapor demosudur: sınıf etiketi, öğrencinin indirdiği JSON raporları, kazanım özeti. Öğretmen rolü, otomatik öğrenci listesi veya uzaktan sınıf takibi eklenmemiştir. Öğrenci hesaplarının adları bu alanda kendiliğinden listelenmez.

## Veri ve okul kullanımı

Kayıtta ad ve ilerleme verilerinin saklanması açıklanır. Soyadı, e-posta, okul, kesin doğum tarihi veya konum istenmez. Son 300 deneme saklanır. Üçüncü taraf reklam, analiz, font veya video servisi yoktur. Ortak cihazda çıkış yapılmalıdır. Hosting kayıtları ve yedekleri ayrı süreçlerdir.

Bilgilendirme kutusu doğrulanmış veli onayı hizmeti değildir. Kurumun ve velinin bilgilendirme, izin ve veri yönetimi süreçleri gerçek öğrenci kullanımından önce tamamlanmalıdır. KVKK uygunluk belgesi, bilimsel davranış ölçümü veya onaylı MEB kazanım eşleştirmesi iddia edilmez.

## Testler

24 eğitim görevi tarayıcı arayüzünden tamamlandı; XP tekrarı, arama, yerel kalıcılık ve JSON rapor doğrulandı. Sunucu testleri kayıt, aynı adla farklı kullanıcı, parola özeti, çerez bayrakları, yanlış parola, CSRF, kullanıcı izolasyonu, revision çakışması, başka oturumdan devam, sunucu yeniden başlatılınca kalıcılık, çıkış ve hesap silmeyi doğrular. Gerçek öğrenci verisi kullanılmadı.

