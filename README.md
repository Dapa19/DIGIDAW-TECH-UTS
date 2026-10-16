# Digidaw Tech

Website e-commerce sederhana untuk katalog komponen PC. Frontend menggunakan React + Vite, backend menggunakan Express, dan data tersimpan secara permanen di SQLite3.

## Fitur

- Katalog dan detail produk yang mengambil data dari REST API.
- Admin sederhana untuk menambah, mengubah, dan menghapus produk.
- Checkout tanpa login dengan pilihan beberapa produk dan kuantitas.
- Backend menghitung ulang harga, memvalidasi stok, menyimpan customer/pesanan/item dalam satu transaksi, lalu mengurangi stok.
- Daftar dan detail pesanan, termasuk snapshot harga setiap item.
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
| GET | `/products` | Daftar produk |
| GET | `/products/:id` | Detail produk |
| POST | `/products` | Tambah produk |
| PUT | `/products/:id` | Ubah produk |
| DELETE | `/products/:id` | Hapus produk yang belum dipakai dalam pesanan |
| POST | `/orders` | Checkout dan simpan pesanan |
| GET | `/orders` | Riwayat pesanan |
| GET | `/orders/:id` | Detail pesanan |

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
  "customer": { "name": "Dina", "email": "dina@example.com", "phone": "08123456789" },
  "items": [
    { "product_id": 1, "quantity": 1 },
    { "product_id": 4, "quantity": 2 }
  ]
}
```

Respons sukses berbentuk `{ "success": true, "data": ... }`; respons error berbentuk `{ "success": false, "message": "..." }`.

## Cara mencoba alur UTS

1. Jalankan kedua server dan buka katalog. Produk tampil dari `GET /products`.
2. Masuk ke Admin, tambahkan produk; pastikan produk muncul di katalog setelah disimpan (`POST /products`). Coba edit dan hapus.
3. Buka Checkout, isi nama/email/telepon, pilih lebih dari satu produk dan kuantitas, lalu buat pesanan.
4. Pastikan pesanan muncul di halaman Pesanan, buka detailnya, dan cek stok produk di katalog/admin sudah berkurang.
5. Ulangi checkout melebihi stok untuk melihat validasi server. Pesanan yang gagal tidak mengurangi stok.

## Catatan

- Harga disimpan sebagai integer rupiah.
- Foreign key SQLite diaktifkan pada koneksi aplikasi.
- Riwayat pesanan mempertahankan produk yang dibeli; produk yang sudah direferensikan pesanan tidak dapat dihapus.
- Ini proyek demonstrasi lokal tanpa autentikasi admin atau payment gateway.
