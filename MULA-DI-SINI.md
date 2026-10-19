# Mula di sini, Hafiz

## Pakej ini

Wira Rally ialah cabutan bertuah beranimasi kartun 3D untuk sehingga 100 peserta. Enam tema, satu pemenang setiap lap, pemenang dikecualikan daripada lap berikutnya. Tiada Google Sheet, eksport atau arkib kekal. Data sesi dalam CacheService sahaja, maksimum enam jam dan boleh hilang lebih awal.

## 1. Upload ke GitHub

Ekstrak ZIP. Upload semua **kandungan folder `wira-rally`** ke root repository. Pastikan `index.html` berada di root, bukan dalam satu lagi subfolder `wira-rally`.

Aktifkan GitHub Pages: Settings > Pages > Deploy from a branch > main > / (root).

Buka laman dan tekan **Cuba demo**. Tekan Urusetia > Log masuk > Isi 100 untuk melihat semua watak. Demo tidak memerlukan backend, tetapi tetap memerlukan internet untuk pustaka 3D. Jangan gunakan QR demo untuk peserta sebenar.

## 2. Sediakan Apps Script

- Cipta projek Google Apps Script baharu.
- Salin `backend/Code.gs` ke fail `Code.gs` dalam editor Google.
- Tambah fail Script bernama `Core`, kemudian salin `backend/Core.gs` ke situ.
- Dalam editor Google sahaja, ubah `SETUP.ADMIN_PIN` dan `SETUP.ALLOWED_ORIGINS` di bahagian atas `Code.gs`.
- Origin contoh: `https://hafiz.github.io`. Jangan masukkan laluan repository atau slash akhir.
- Jalankan fungsi `setup`, benarkan akses yang diminta.
- Deploy sebagai Web app: Execute as Me, akses Anyone. Salin URL `/exec`.

**Jangan upload PIN sebenar ke repository awam.** Ubah PIN dalam editor Google sahaja. Jika akaun organisasi tidak membenarkan akses awam, rujuk pentadbir akaun.

## 3. Masukkan satu URL

Edit `config.js` dalam repository. Isi `apiUrl` dengan URL deployment `/exec` tadi. Commit dan tunggu Pages dikemas kini.

## 4. Jalankan acara

1. Buka Meja urusetia dan log masuk PIN untuk membuka sesi.
2. Pilih tema, tempoh 6/7/8 saat, nama acara dan nama hadiah. Simpan tetapan.
3. Buka Skrin pentas pada projektor. QR penyertaan boleh dipaparkan dari pentas atau panel urusetia.
4. Peserta scan, isi nama dan pilih lelaki/perempuan. Warna pakaian automatik.
5. Tutup dialog QR. Urusetia tekan Mula perlumbaan dan sahkan.
6. Countdown lima saat, kemudian perlumbaan. Tepat satu pemenang setiap lap.
7. Tunggu semua selesai dan berkumpul. Ubah hadiah jika perlu, simpan dan mula lap berikutnya. Peserta meneruskan laluan, bukan kembali ke titik mula.
8. Tamat acara: tekan **Tamat sesi & padam data**, taip `TAMAT SESI` dan sahkan.

## Penting sebelum acara

Uji menggunakan Wi-Fi acara, laptop sebenar, dua telefon dan skrin pentas. Sambungan kepada akaun Google Hafiz belum dapat diuji dalam pakej ini. Cache bukan simpanan terjamin; jika cache hilang, peserta perlu daftar semula. Jangan refresh demo jika mahu mengekalkan senarai demo.

Grafik ialah watak kartun 3D asli berasaskan bentuk bulat, bukan watak BoBoiBoy atau aset studio. Tiada dakwaan benchmark FPS, audit cabutan bertauliah atau identiti peserta yang disahkan.

Panduan lengkap: `README.md`. Keputusan ujian dan batasan: `TEST-REPORT.md`. Ujian logik boleh dibuka di `tests.html` selepas hosting.
