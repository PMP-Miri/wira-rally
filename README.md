# Wira Rally: Lucky Draw 3D

Permainan cabutan bertuah untuk sehingga **100 peserta**, dengan frontend statik di GitHub Pages dan backend Google Apps Script. Peserta scan QR, isi nama, pilih lelaki/perempuan dan menerima warna pakaian secara automatik. Urusetia memulakan setiap lap. Satu pemenang dipilih oleh backend dan tidak layak dicabut lagi dalam sesi yang sama.

## Penting tentang versi ini

- **Tiada Google Sheet, Drive, arkib, analitik atau pangkalan data peserta kekal.**
- Nama dan sejarah pemenang hanya berada dalam **CacheService Apps Script** sepanjang sesi. Cache adalah best-effort dan **boleh dibuang oleh Google sebelum masa luput**. Jika ini berlaku, sesi tidak dapat dipulihkan. Versi ini sengaja tidak mempunyai sandaran, mengikut keperluan data sesi sahaja.
- Maksimum sesi ialah **6 jam dari sesi dibuka**, bukan enam jam selepas aktiviti terakhir. Selepas luput, pendaftaran dan cabutan sesi lama tidak diterima lagi. Urusetia boleh tamatkan sesi lebih awal.
- Butang **Tamat sesi & padam data** membuang objek cache yang mengandungi semua peserta, pemenang dan ID operasi. Tiada salinan peserta lain dicipta oleh aplikasi pada backend. Konfigurasi PIN hash dan origin sahaja kekal dalam Script Properties.
- Frontend menyimpan token urusetia dan ID tiket rawak dalam `sessionStorage`, **bukan nama atau senarai peserta**. Paparan yang masih terbuka memegang data dalam RAM sehingga Sync seterusnya atau tab ditutup. Pemadaman tidak boleh menarik balik tangkapan skrin, rakaman, cache dalaman pembekal atau salinan pihak lain.
- **Demo menggunakan RAM satu tab sahaja.** Refresh mengosongkannya. Tab pentas berasingan dan QR telefon memerlukan backend sebenar, bukan mod demo.
- Grafik ialah watak kartun 3D asli berbentuk bulat, bukan aset BoBoiBoy atau model animasi studio. Pergerakan badan, muka, rambut dan tunggangan dibina dalam kod.

## Apa yang tersedia

- Enam tema: **Larian Wira, Derbi Kuda, Regata Ceria, Itik & Angsa, Kart Karnival, Roket Kosmik**.
- Pendaftaran QR, nama unik, pilihan lelaki/perempuan, 24 warna pakaian automatik.
- Panel urusetia dilindungi PIN. PIN sebenar tidak diletakkan dalam frontend.
- Skrin pentas berasingan, skrin penuh, pilihan kualiti grafik, bunyi sintesis dan konfeti.
- Countdown **5 saat**, diikuti perlumbaan **6, 7 atau 8 saat**. Peserta lain melintasi checkpoint dalam lebih kurang 1.2 saat selepas pemenang. Butang lap seterusnya dibuka selepas tempoh berkumpul semula.
- Potong-memotong ringan. Kedudukan sepanjang masa dikira daripada jam pelayan; keputusan tidak bergantung pada FPS peranti.
- Laluan dunia bersambung. Kedudukan x peserta disambungkan secara matematik antara lap, termasuk ketika countdown lap berikutnya. Tiada kembali ke garisan mula. Susunan sisi melaras perlahan apabila bilangan peserta berkurang.
- Nama hadiah setiap lap, carian peserta, buang pendaftaran tersalah dan sejarah pemenang sementara.
- Nama pemenang hilang daripada senarai layak. Rekod kemenangan kekal hanya sehingga sesi ditamatkan atau luput.

## 1. Letakkan frontend di GitHub

1. Cipta repository, contohnya `wira-rally`.
2. Upload **kandungan folder ini**, bukan ZIP dan bukan folder berlapis. `index.html` mesti berada di root repository.
3. Buka **Settings > Pages**, pilih deploy daripada branch `main`, folder `/ (root)`.
4. Tunggu laman tersedia. Contoh alamat: `https://NAMA-GITHUB.github.io/wira-rally/`.
5. Buka laman, tekan **Cuba demo**. Log masuk demo, kemudian tekan **+ 20 demo** atau **Isi 100**.

Jangan buka `index.html` melalui `file://`. Import JavaScript dan origin backend memerlukan hosting HTTP/HTTPS. Untuk ujian tempatan, gunakan static server dan tambah origin yang berkenaan pada backend jika mahu sambungan sebenar. Production mesti HTTPS.

## 2. Sediakan Google Apps Script

1. Buka Google Apps Script dan cipta **New project**.
2. Gantikan isi fail `Code.gs` dengan kandungan **`backend/Code.gs`** dalam projek ini.
3. Cipta satu lagi fail jenis Script bernama **`Core`**, kemudian salin keseluruhan **`backend/Core.gs`**. Fail ini salinan tepat `shared/core.js`, bukan HTML.
4. Dalam editor Apps Script sahaja, ubah bahagian `SETUP`:

```js
const SETUP = {
  ADMIN_PIN: 'PIN-RAHSIA-ANDA-MINIMUM-8-AKSARA',
  ALLOWED_ORIGINS: ['https://NAMA-GITHUB.github.io'],
  MAX_PARTICIPANTS: 100,
  SESSION_HOURS: 6
};
```

**Origin tidak mengandungi `/wira-rally/` atau slash akhir.** Contoh betul: `https://hafiz.github.io`. Jika guna domain sendiri, masukkan origin domain itu juga.

5. Pilih fungsi **`setup`**, tekan Run dan benarkan kebenaran yang diminta. Tiada spreadsheet akan dicipta.
6. Pilih **Deploy > New deployment > Web app**.
7. Tetapkan **Execute as: Me** dan **Who has access: Anyone**. Peserta tidak sepatutnya diminta log masuk Google.
8. Deploy dan salin URL yang berakhir dengan **`/exec`**, bukan `/dev`.

Jika polisi akaun organisasi tidak menyediakan akses `Anyone`, backend ini tidak boleh digunakan untuk peserta awam tanpa perubahan polisi atau akaun yang dibenarkan. Jangan cuba memintas polisi organisasi.

**Jangan commit PIN sebenar ke GitHub.** Fail backend dalam repository hendaklah mengekalkan placeholder. PIN ditukar dalam salinan editor Apps Script sahaja. Menjalankan `setup()` semula mengosongkan sesi aktif dan membatalkan token lama. Jangan jalankan semasa acara.

## 3. Sambungkan frontend

Edit `config.js` di GitHub:

```js
window.WIRA_CONFIG = Object.freeze({
  apiUrl: 'https://script.google.com/macros/s/ID-DEPLOYMENT-ANDA/exec',
  title: 'WIRA RALLY',
  subtitle: 'Satu perlumbaan. Satu rezeki.',
  maxParticipants: 100,
  defaultDuration: 8,
  defaultTheme: 'run',
  publicBaseUrl: ''
});
```

`publicBaseUrl` boleh dikosongkan. Untuk URL QR tersuai, isi alamat halaman `index.html` yang sebenar, termasuk laluan repository jika ada.

Commit, tunggu GitHub Pages dikemas kini dan refresh laman. Apabila mengubah kod Apps Script pada masa hadapan, pilih **Manage deployments > Edit > New version > Deploy**. Menyimpan fail dalam editor sahaja tidak semestinya mengemas kini deployment sedia ada.

## 4. Cara guna semasa acara

1. Sambungkan komputer pentas kepada skrin/projektor dan gunakan Chrome atau Edge desktop dengan WebGL/hardware acceleration.
2. Buka **Meja urusetia**, tekan **Urusetia** dan log masuk menggunakan PIN. Ini membuka sesi sementara jika belum ada sesi aktif.
3. Tetapkan nama acara, tema, hadiah dan tempoh. Tekan **Simpan tetapan**. Tajuk dan hadiah maksimum 32 aksara.
4. Tekan **Skrin pentas** untuk paparan bersih dalam tab atau tetingkap berasingan. Pindahkan ke projektor. Hidupkan bunyi pada **satu** paparan sahaja untuk mengelakkan bunyi berganda.
5. Tekan **Paparkan QR** pada panel urusetia atau **QR penyertaan** pada skrin pentas. Paparkan dialog QR semasa pendaftaran atau kongsi pautan penyertaan dalam kumpulan acara. Tutup dialog sebelum memulakan perlumbaan.
6. Peserta scan, isi nama dan pilih watak. Telefon tidak perlu dibuka sepanjang acara selepas pendaftaran berjaya. Nama perlu unik; jika bertindih, tambah nama keluarga atau nombor meja.
7. Semak jumlah peserta. Tekan **Mula perlumbaan** dan sahkan. Pendaftaran ditutup secara automatik. Countdown bermula, kemudian perlumbaan.
8. Pemenang dipaparkan dan tidak dicabut semula. Tutup kad kemenangan dengan `×` jika perlu. Selepas semua berkumpul, ubah nama hadiah, simpan dan mulakan lap seterusnya.
9. Jika perlu menerima peserta tambahan, buka pendaftaran dan simpan selepas perlumbaan selesai. Had 100 termasuk peserta yang telah menang dalam sesi itu.
10. Selepas acara, tekan **Tamat sesi & padam data**, taip `TAMAT SESI` dan sahkan. Tiada eksport atau arkib automatik.

**Pintasan:** `Space` membuka pengesahan mula di panel urusetia; `F` meminta skrin penuh; `Escape` menutup dialog jika tiada permintaan sedang diproses. Shortcut diabaikan ketika menaip. Akses skrin penuh dan audio tetap bergantung pada kebenaran/gerak isyarat pelayar.

Pertukaran tema semasa ada sejarah perlumbaan diterapkan pada lap baharu. Tiada reset kedudukan perjalanan. Ini menukar medium secara visual, bukan mengekalkan kuda di dalam air sebagai fizik realistik.

## Cara pemilihan pemenang

Backend memilih satu indeks daripada senarai peserta layak dengan rejection sampling untuk mengelakkan bias modulo. Input rawak dihasilkan daripada UUID Apps Script yang dihash. Animasi mempersembahkan keputusan itu dan semua peserta lain melintasi garisan selepas pemenang.

Ini **bukan sistem cabutan bertauliah, bukan audit kriptografi dan bukan platform pertaruhan**. Tiada rekod kekal atau bukti cabutan yang boleh diaudit selepas sesi dipadam. Payload perlumbaan awam mengandungi `winnerId` sebelum animasi tamat kerana klien memerlukannya untuk animasi; orang yang memeriksa rangkaian boleh mengetahui keputusan awal. Jangan gunakan versi ini jika keputusan mesti dirahsiakan secara teknikal sehingga garisan penamat atau jika acara memerlukan bukti audit kekal.

Pemeriksaan nama unik dan ID satu tab mengurangkan pendaftaran tersalah/berulang, tetapi **bukan pengesahan identiti**. Orang yang menggunakan peranti lain atau sesi pelayar lain masih boleh mendaftar nama lain. Urusetia perlu menyemak senarai peserta layak.

## Prestasi dan batasan

- Watak dilukis dengan instanced geometry. Semua peserta layak berada dalam kiraan dan paparan, tetapi tidak semua label dipaparkan serentak untuk mengelakkan nama bertindih. Nama penuh kekal dalam senarai peserta. Skrin besar disyorkan bagi 100 watak.
- Pilihan Auto mengehadkan resolusi; Rendah mengehadkan pixel ratio kepada 1. Antialiasing renderer dimatikan secara lalai untuk mengurangkan beban.
- Paparan host/pentas menggunakan polling, bukan WebSocket. Poll sekitar 3 saat ketika perlumbaan dan 4.5 saat ketika menunggu, dengan jitter. Telefon berdaftar poll sekitar sekali seminit; telefon belum berdaftar sekitar 12 saat. Tab tersembunyi poll lebih perlahan.
- Tiada jaminan FPS atau masa respons tertentu. Kelancaran bergantung pada GPU, projektor, bilangan tab, rangkaian, masa mula Apps Script dan kuota akaun. 100 pendaftaran serentak boleh mengambil masa atau memerlukan cuba semula. Latih dalam persekitaran sebenar sebelum acara.
- API menggunakan JSONP untuk bacaan awam dan POST form + iframe + `postMessage` untuk penulisan. PIN/token tidak dimasukkan dalam URL. Origin allowlist ialah pemeriksaan keserasian/kawalan asas, **bukan pengganti autentikasi**; tindakan urusetia tetap memerlukan token.
- Three.js **0.180.0** dan qrcode-generator **1.4.4** dimuat daripada jsDelivr. Bunyi dihasilkan sendiri melalui Web Audio. Laman tidak boleh berfungsi sepenuhnya tanpa rangkaian/CDN. Uji akses CDN dari Wi-Fi acara.
- Jika menerima timeout ketika menekan mula, **jangan terus mula lagi**. Semak sama ada countdown/pusingan telah diterima. Pengulangan operasi dalaman dengan ID sama dilindungi, tetapi klik baharu menghasilkan ID baharu.
- Jika cache hilang awal, semua data sesi hilang. Refresh komputer tidak memulihkan cache yang telah dibuang. Sesi baharu mesti dibuka semula dan peserta perlu mendaftar lagi.

## Ujian yang disertakan

Buka `tests.html` pada hosting yang sama untuk menjalankan ujian logik dan simulasi backend. Ia menggunakan **servis Google tiruan**, bukan deployment Google sebenar. Tidak memerlukan PIN sebenar dan tidak menyentuh sesi acara.

- `tests/core-tests.js`: 100 lap, pemenang unik, semua peserta sampai, kapasiti, sanitasi, tempoh, semua tema dan kesinambungan posisi.
- `tests/backend-tests.js`: 100 peserta, PIN, token, origin, POST bridge, deduplication, penamatan/pemadaman, luput dan simulasi cache dibuang awal.
- `TEST-REPORT.md`: keputusan semakan yang benar-benar dilakukan untuk pakej ini dan perkara yang belum diuji.

## Struktur

```text
index.html, styles.css, config.js   Halaman statik
src/app.js                        UI host/pentas/pendaftaran
src/api.js                        Sambungan GAS + demo RAM
src/scene.js                      Watak, tunggangan, kamera, litar 3D
src/effects.js                    Bunyi + konfeti
shared/core.js                    Logik cabutan/posisi yang dikongsi
backend/Code.gs                  Backend sesi sementara
backend/Core.gs                  Salinan shared/core.js untuk GAS
tests.html, tests/               Ujian logik dan mock backend
```

## Sebelum digunakan untuk acara sebenar

- Uji dengan sekurang-kurangnya dua telefon sebenar dan satu paparan pentas.
- Uji pendaftaran serentak secara berperingkat, akses tanpa log masuk Google dan Wi-Fi lokasi.
- Uji tema pada laptop/projektor sebenar. Guna Rendah jika frame rate turun.
- Jalankan satu lap latihan dalam sesi berasingan, tamatkan sesi itu, kemudian buka sesi sebenar.
- Pastikan PIN tidak dipaparkan di skrin pentas atau dalam repository.
- Pastikan peserta faham nama mereka kelihatan pada skrin dan maklumkan risiko data sementara hilang.

Rujukan rasmi untuk semakan deployment dan had perkhidmatan:
- https://developers.google.com/apps-script/guides/web
- https://developers.google.com/apps-script/reference/cache/cache
- https://developers.google.com/apps-script/guides/services/quotas
- https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site

Notis lesen pustaka ada dalam `THIRD-PARTY-NOTICES.md`.
