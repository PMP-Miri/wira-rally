# Laporan semakan pakej Wira Rally

## Keputusan yang benar-benar diperoleh

1. **Logik teras: LULUS, 64,326 assertions, 6 kumpulan.** Sumber `shared/core.js` dan `tests/core-tests.js` daripada pakej akhir dilaksanakan dalam persekitaran JavaScript renderer. Liputan: sanitasi nama, tetapan, 100 peserta, kapasiti, nama berulang, rejection sampling, 100 lap tanpa pemenang berulang, tepat satu pemenang setiap lap, semua peserta sampai, 6 tema, tempoh 6/7/8 saat, gerakan maju dan kedudukan bersambung antara lap.
2. **Backend simulasi: LULUS, 42 assertions.** `backend/Code.gs` dilaksanakan dengan mock CacheService, PropertiesService, Utilities dan LockService. Liputan: 100 pendaftaran, PIN, token, origin, POST bridge, deduplication, dua lap, pemadaman, luput, cache dibuang awal dan token sesi lama tidak boleh mengawal sesi baharu. Ini bukan panggilan kepada Google sebenar. Hash dalam mock bukan implementasi SHA-256 Google sebenar.
3. **Aliran frontend sebenar dalam mod demo: LULUS, 11 checkpoints.** Klik handler UI sebenar: log masuk, tambah 100 peserta, tukar tema bot, carian, buang peserta dengan pengesahan, mula countdown, satu pemenang, nama pemenang, lap kedua tanpa pemenang terdahulu, tamat sesi dan token panel dikosongkan. Masa perlumbaan dipercepat dalam ujian. Ini bukan ukuran kelancaran animasi sebenar.
4. **Semakan visual statik:** render berjaya untuk 100 pelari, galeri semua enam tema (12 watak setiap tema), dan panel urusetia pada lebar 650 px dengan 100 peserta tema bot. Tiada kanvas kosong dalam tangkapan tersebut. Galeri menunjukkan larian, kuda, bot, itik/angsa, kart dan roket. Ini tangkapan bingkai, bukan benchmark FPS atau pengesahan gerakan sepanjang video.
5. **Audit statik:** semua rujukan literal ID UI mempunyai markup; semua nama kelas statik yang diekstrak mempunyai aturan CSS; `backend/Core.gs` sepadan byte demi byte dengan `shared/core.js`. Semakan ini tidak menggantikan linter JavaScript lengkap atau semua cabang runtime.

Ujian di atas dijalankan menggunakan projek semakan berasingan. Projek semakan itu tidak diperlukan untuk menjalankan permainan dan tidak dimasukkan dalam ZIP sumber. `tests.html` disertakan supaya logik teras dan mock backend boleh dijalankan semula melalui hosting HTTP/HTTPS.

## Belum diuji / memerlukan akaun dan peranti pemilik

- Deployment Google Apps Script sebenar, authorization akaun dan polisi akses `Anyone`.
- Rangkaian GitHub Pages ke Apps Script, POST iframe dan JSONP dalam pelayar peserta sebenar.
- Imbasan QR dengan kamera telefon dan pemuatan pustaka QR daripada CDN sebenar.
- Pendaftaran 100 telefon serentak, contention lock, kuota Google, latensi atau ketahanan rangkaian lokasi.
- FPS laptop acara, projektor, GPU berbeza, ketahanan sesi sehingga enam jam dan pelayar telefon sebenar.
- Audit keselamatan bebas, audit kriptografi atau pensijilan cabutan.

## Batasan yang sengaja dikekalkan

- Cache sesi boleh dibuang lebih awal; tiada pemulihan atau sandaran peserta.
- Pemenang diketahui oleh klien melalui payload sebelum animasi tamat; bukan cabutan dengan keputusan tersembunyi secara teknikal.
- Nama unik dan tiket per tab bukan pengesahan identiti. Urusetia mesti memastikan penyertaan yang layak.
- Data nama hanya digunakan sementara oleh aplikasi. Pemadaman aplikasi tidak boleh memadam tangkapan skrin atau menjamin pemadaman serta-merta daripada sistem dalaman pembekal.
- Mod demo tidak berkongsi data antara tab atau telefon.

## Semakan sebelum acara

Jalankan latihan dengan dua telefon dan dua tab host/pentas pada Wi-Fi dan komputer sebenar. Uji pendaftaran, tutup pendaftaran, setiap tema, cabutan berturut-turut dan butang padam sesi. Selepas latihan, tamatkan sesi dan buka sesi baharu untuk acara. Jangan gunakan demo untuk pendaftaran peserta sebenar.
