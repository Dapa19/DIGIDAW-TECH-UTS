# Digidaw Tech

Website e-commerce sederhana untuk katalog komponen PC. Frontend menggunakan React + Vite, backend menggunakan Express, dan data tersimpan secara permanen di SQLite3.

## Fitur

- Katalog dan detail produk yang mengambil data dari REST API.
- Admin dengan login sederhana untuk menambah, mengubah, dan menghapus produk.
- Checkout tanpa login dengan alamat pelanggan, pilihan beberapa produk, dan kuantitas. Dialog sukses menampilkan ID pesanan untuk disalin.
- Backend menghitung ulang harga, memvalidasi stok, menyimpan customer/pesanan/item dalam satu transaksi, lalu mengurangi stok.
- Admin dapat mengelola produk, melihat semua riwayat transaksi, mengubah status, mencari pelanggan/nomor, dan memfilter status.
- Customer dapat mengecek status pesanan lewat menu Cek pesanan menggunakan ID, email, atau nomor telepon tanpa melihat riwayat umum.
- Tampilan responsif dengan warna putih, biru, dan hitam tanpa gradient.

## Persyaratan

- Node.js 20.19 atau lebih baru dan npm.
- Dua terminal untuk menjalankan backend dan frontend.

## Menjalankan aplikasi

Terminal 1:

```bash
cd backend
npm install
npm run dev
```

API berjalan di `http://localhost:3000/api`. Pada start pertama, database `backend/data/digidaw.sqlite` dibuat otomatis, termasuk empat tabel dan tujuh produk awal. File database tidak di-commit.

Terminal 2:

```bash
cd frontend
npm install
npm run dev
```

Buka URL Vite yang tampil di terminal (biasanya `http://localhost:5173`). Bila URL API berbeda, buat `frontend/.env` dari `frontend/.env.example` dan ubah `VITE_API_URL`.

## Endpoint API

Semua endpoint memakai prefix `http://localhost:3000/api`.

| Method | Endpoint | Kegunaan |
| --- | --- | --- |
| POST | `/admin/login` | Login admin dan menerima token sesi |
| GET | `/admin/session` | Memeriksa sesi admin |
| POST | `/admin/logout` | Mengakhiri sesi admin |
| GET | `/products` | Daftar produk |
| GET | `/products/:id` | Detail produk |
| POST | `/products` | Tambah produk (perlu login admin) |
| PUT | `/products/:id` | Ubah produk (perlu login admin) |
| DELETE | `/products/:id` | Hapus produk (perlu login admin, produk yang sudah dipesan tidak bisa dihapus) |
| POST | `/orders` | Checkout dan simpan pesanan |
| POST | `/orders/lookup` | Cari status pesanan dengan ID, email, atau telepon |
| GET | `/orders` | Riwayat pesanan (perlu login admin) |
| GET | `/orders/:id` | Detail pesanan (perlu login admin) |
| PATCH | `/orders/:id/status` | Ubah status transaksi (perlu login admin) |

Kredensial demo Admin: username `superadmin`, password `admin123`. Kredensial tetap dan tidak tersedia fitur ubah password.

Contoh body untuk menambah produk:

```json
{
  "name": "AMD Ryzen 5 5600",
  "category": "Processor",
  "description": "6 core, 12 thread.",
  "price": 1899000,
  "stock": 10,
  "image_url": ""
}
```

Contoh body checkout (frontend tidak mengirim harga atau total):

```json
{
  "customer": { "name": "Dina", "email": "dina@example.com", "phone": "08123456789", "address": "Jl. Melati No. 12, Bandung" },
  "items": [
    { "product_id": 1, "quantity": 1 },
    { "product_id": 4, "quantity": 2 }
  ]
}
```

Respons sukses berbentuk `{ "success": true, "data": ... }`; respons error berbentuk `{ "success": false, "message": "..." }`.

## Cara mencoba alur UTS

1. Jalankan kedua server dan buka katalog. Produk tampil dari `GET /products`.
2. Buka URL `/admin` secara langsung dan masuk menggunakan kredensial demo. Tambahkan produk; pastikan produk muncul di katalog setelah disimpan. Coba edit dan hapus.
3. Buka Checkout, isi nama/email/telepon/alamat, pilih lebih dari satu produk dan kuantitas, lalu buat pesanan. Salin ID dari dialog “Checkout berhasil”.
4. Buka menu Cek pesanan dan cari dengan ID, email, atau telepon.
5. Buka `/admin` → Riwayat transaksi. Cari/filter pesanan, buka detail, ubah status, lalu cek status yang sama tampil di menu Cek pesanan.
6. Ulangi checkout melebihi stok untuk melihat validasi server. Pesanan yang gagal tidak mengurangi stok.

## Catatan

- Harga disimpan sebagai integer rupiah.
- Foreign key SQLite diaktifkan pada koneksi aplikasi.
- Riwayat pesanan mempertahankan produk yang dibeli; produk yang sudah direferensikan pesanan tidak dapat dihapus.
- Alamat checkout disimpan sebagai snapshot `shipping_address` pada setiap pesanan. Database yang sudah ada dimigrasikan otomatis saat backend dijalankan.
- Sesi admin tersimpan di memori backend dan berakhir saat logout atau backend dimulai ulang.
- Ini proyek demonstrasi lokal tanpa payment gateway.
