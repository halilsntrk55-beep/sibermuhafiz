# SiberMuhafız

11–18 yaş için Türkçe siber güvenlik eğitim platformu. [Canlı site](https://halilsntrk55-beep.github.io/sibermuhafiz/).

## GitHub Pages + Firebase

Site GitHub Pages üzerinde statik çalışır. Öğrenci kayıt/girişini **Firebase Authentication**, ad ve öğrenme ilerlemesini **Firebase Realtime Database** yönetir. Ayrı Node.js sunucusu, SQLite veya ücretli sunucu kurulumu gerekmez. Firebase hizmetinin kendi kota ve koşulları geçerlidir.

Mevcut `ubilsem-kds` Firebase projesindeki ayrı `sibermuhafiz_v1/users/{Firebase UID}` alanı kullanılır. Diğer uygulamaların veri alanları değiştirilmez. Öğrenci adı (soyadı gerekli değil), 3–24 karakterli benzersiz kullanıcı adı ve 12–128 karakterli parola ile kayıt olunur. Aynı adla farklı öğrenciler ayrı kullanıcı adları kullanabilir. Kullanıcı adından uygulamaya özgü `sm-{kullaniciadi}@sibermuhafiz.invalid` kimliği oluşturulur; gerçek e-posta istenmez ve bu adrese e-posta gönderilmez. E-posta ile parola kurtarma bu sürümde yoktur.

Firebase SDK, `sibermuhafiz` adlı ayrı uygulama örneği ve SESSION oturum kalıcılığıyla çalışır. Sayfa yenilenince oturum geri gelir; tarayıcı oturumu kapandığında yeniden giriş gerekir. Parolayı Firebase Authentication yönetir; uygulama veritabanına parola veya parola özeti yazılmaz. `firebase-client.js` içindeki web yapılandırması admin anahtarı değildir. Hizmet hesabı, admin token veya özel anahtar kaynak kodunda bulunmaz.

## İlerleme

Ad, kullanıcı adı, puanları oluşturan görev tamamlamaları, kademe, isteğe bağlı takma ad, son 300 deneme ve son ders/görev adımı Firebase'de saklanır. Başka cihazda aynı kullanıcı adı/parolayla giriş, bu verileri geri getirir. Görevde henüz gönderilmemiş cevap veya kutu seçimi yerine ders/görev adımı kaydedilir. Her kademe/yol için ilk tamamlamada 100 XP; tekrar çözümde ek XP yoktur.

Kayıt durumu ekranda gösterilir. Ağ veya izin hatası kayıt yapılmış gibi sunulmaz. Kaydedilmemiş ilerleme varsa güvenli çıkış durdurulur ve rapor indirilebilir. Çoklu sekme/cihaz çakışmalarında Realtime Database transaction ve revision denetimi kullanılır; tamamlanan görevler birleştirilir. Konuk ilerlemesi cihazda kalır ve ortak cihazdaki önceki kişinin verisi yeni hesaba otomatik taşınmaz.

## Güvenlik kuralları

`database.rules.fragment.json`, yalnızca bu uygulamanın kural parçasıdır; **mevcut Firebase kurallarının tamamının yerine geçirilmemelidir**. Canlı projede mevcut kök kuralları korunarak:

1. Var olan `$alan` genel okuma/yazma koşullarına `&& $alan !== 'sibermuhafiz_v1'` eklendi. Böylece genel alan erişimi bu özel alanı açmaz.
2. `sibermuhafiz_v1` altında kök okuma/yazma kapatıldı; sadece `auth.uid === $uid` kendi öğrenci kaydını okuyup yazabilir.
3. Profil, görev anahtarları, alan türleri ve revision geçişi doğrulanır. Yeni ve bilinmeyen alanlar reddedilir.

Diğer uygulamaların özel kuralları ve öğretmen kimlikleri bu açık kaynak depoya kopyalanmaz. Adlar açık bir listede veya sıralamada yayınlanmaz. Öğretmen alanı halen isteğe bağlı takma adlı raporların yerel demosudur; Firebase'deki tüm öğrencileri listeleme yetkisi yoktur. Hesap silme önce yeniden parola doğrulaması, ardından kendi veri kaydı ve Auth hesabı silmeyle yapılır.

## İçerik

Kaşif (11–13), Savunucu (14–15), Analist (16–18): sekizer görev, toplam 24. Şifre Kalesi, Oltaya Gelme, Dijital Ayak İzi, Siber Zorbalığa Dur, Oyun Alanını Koru, Gizli Mesajlar, Sahte Haber Dedektifi ve Siber Dedektif. Mini dersler, ipuçları, açıklamalı cevaplar, rozetler ve aynı ekranda iki takımlı yarışma vardır.

Gerçek sistem taraması veya hesap kırma yoktur. Kişiler, adresler ve loglar kurgusaldır. Kaynak kodu görüldüğü için puanlar hileye dayanıklı sınav notu değildir. Resmi MEB eşleştirmesi veya hukuki uygunluk belgesi iddia edilmez. Kayıt bilgilendirmesi doğrulanmış veli onayı hizmeti değildir; kurumun ve velinin veri/izin süreçleri ayrıca ele alınmalıdır.

## Yerel önizleme ve test

Canlı kullanım paket veya Node.js gerektirmez. Yerel geliştirme için Node.js 20+ ile `npm start`. Bağımlılık kurulumu yoktur. İnternet bağlantısı ve Firebase SDK erişimi gerekir.

- `npm test`: veri alanları, seri hale getirme, sınırlar ve sahiplik kuralı testleri.
- `npm run test:firebase-live`: gerçek Firebase üzerinde **yalnızca kendi oluşturduğu rastgele kurgusal hesapları** kullanır; kayıt/giriş, kalıcılık, anonim erişim reddi, başka kullanıcı okuma/yazma reddi, listeleme reddi ve revision denetimini sınar. Test sonunda kendi hesaplarını ve verilerini siler. Canlı test bilinçli olarak ayrıca çalıştırılır.

24 görev arayüzden doğrulandı. Firebase arayüz testinde hesap oluşturuldu; bir görevle 100 XP kazanıldı, ikinci derste duruldu, çıkış/giriş yapıldığında 100 XP ve ikinci ders adımı geri geldi. Gerçek öğrenci bilgisi testlerde kullanılmadı.

Resmi kaynaklar: [Firebase parola ile kimlik doğrulama](https://firebase.google.com/docs/auth/web/password-auth), [oturum kalıcılığı](https://firebase.google.com/docs/auth/web/auth-state-persistence), [Realtime Database kuralları](https://firebase.google.com/docs/database/security/rules-conditions).

