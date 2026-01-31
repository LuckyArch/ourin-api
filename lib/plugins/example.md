# 📚 Panduan Lengkap Membuat Plugin

> **Untuk Pemula** - Panduan ini dibuat sejelas mungkin agar siapapun bisa membuat plugin sendiri.

---

## 🎯 Apa Itu Plugin?

Plugin adalah **file TypeScript** yang mendefinisikan satu endpoint API. Setiap plugin akan otomatis terdaftar dan bisa diakses melalui URL.

**Contoh**: Kamu membuat plugin `hello.ts` → bisa diakses di `/api/custom/hello`

---

## 📁 Dimana Menyimpan Plugin?

```
lib/plugins/
├── ai/             ← Plugin AI (chatbot, text generation)
├── download/       ← Plugin downloader (TikTok, YouTube, dll)
├── stalker/        ← Plugin stalker (profil user)
└── custom/         ← BEBAS! Kategori kamu sendiri
```

> ⚠️ **PENTING**: Kamu bisa membuat kategori APAPUN! Tidak harus `ai`, `download`, atau `stalker`. Contoh: `tools`, `games`, `converter`, `random`, dll.

---

## 🚀 Langkah Demi Langkah

### Langkah 1: Buat File Baru

Buat file `.ts` di folder yang sesuai. Contoh kita buat kategori baru `tools`:

```
lib/plugins/tools/hello.ts
```

### Langkah 2: Copy Template Ini

```typescript
// =====================================================
// PLUGIN: Hello World
// KATEGORI: tools (bebas ganti sesuai keinginan)
// =====================================================

import { registerPlugin, jsonResponse, errorResponse, getStartTime } from "@/lib";
import { NextRequest } from "next/server";

registerPlugin({
  // -----------------------------------------------------
  // INFORMASI PLUGIN
  // -----------------------------------------------------
  name: "Hello World",          // Nama yang muncul di docs
  slug: "hello",                // Bagian terakhir URL (lowercase, tanpa spasi)
  category: "tools",            // Nama folder tempat file ini
  description: "Plugin pertamaku",

  // -----------------------------------------------------
  // KONFIGURASI ENDPOINT
  // -----------------------------------------------------
  endpoint: {
    title: "Hello World API",
    description: "Endpoint yang mengembalikan salam",
    
    // PATH = /api/{category}/{slug}
    // Contoh: /api/tools/hello
    path: "/api/tools/hello",
    
    method: "GET",              // GET atau POST
    responseType: "json",       // json, image, audio, video
    tags: ["demo", "hello"],    // Tag untuk filter di docs

    // -----------------------------------------------------
    // PARAMETER (opsional)
    // -----------------------------------------------------
    parameters: [
      {
        name: "nama",           // Nama parameter di URL
        required: false,        // Wajib diisi? true/false
        description: "Nama kamu",
        type: "string",         // string, number, boolean
        defaultValue: "Teman",  // Nilai default jika kosong
      },
    ],

    // -----------------------------------------------------
    // LOGIC UTAMA
    // -----------------------------------------------------
    run: async (request: NextRequest) => {
      // Selalu mulai dengan ini untuk ukur waktu eksekusi
      const startTime = getStartTime();

      // Ambil parameter dari URL
      // URL: /api/tools/hello?nama=John
      const nama = request.nextUrl.searchParams.get("nama") || "Teman";

      // RETURN SUKSES
      return jsonResponse(
        { pesan: `Halo ${nama}! Selamat datang di Ourin API!` },
        200,           // HTTP status code
        startTime,     // Untuk hitung execution time
        "NONE"         // Cache: NONE, SHORT, LONG
      );
    },
  },
});
```

### Langkah 3: Generate Plugin

Setelah menyimpan file, jalankan:

```bash
npm run generate:plugins
```

Ini akan otomatis menambahkan import plugin ke `lib/plugins/index.ts`

### Langkah 4: Test

```bash
npm run dev
```

Buka browser: `http://localhost:3000/api/tools/hello?nama=John`

**Response:**
```json
{
  "success": true,
  "executionTime": "5ms",
  "result": {
    "pesan": "Halo John! Selamat datang di Ourin API!"
  }
}
```

---

## 📝 Penjelasan Detail

### Apa itu `registerPlugin()`?

Fungsi untuk mendaftarkan plugin ke sistem. Semua plugin WAJIB memanggil fungsi ini.

### Apa itu `getStartTime()`?

Fungsi untuk menandai waktu mulai. Digunakan untuk menghitung berapa lama endpoint berjalan. **SELALU panggil di awal fungsi `run`**.

### Apa itu `jsonResponse()`?

Fungsi untuk mengembalikan response sukses.

```typescript
jsonResponse(
  data,       // Object yang akan dikembalikan
  200,        // Status code (200 = sukses)
  startTime,  // Dari getStartTime()
  "NONE"      // Cache control
)
```

**Cache Control:**
- `"NONE"` = Tidak di-cache
- `"SHORT"` = Cache 5 menit
- `"LONG"` = Cache 1 jam

### Apa itu `errorResponse()`?

Fungsi untuk mengembalikan response error.

```typescript
errorResponse(
  "Pesan error",  // Pesan yang ditampilkan
  400,            // Status code (400 = bad request, 500 = server error)
  startTime
)
```

---

## 🔧 Contoh Kasus Nyata

### Contoh 1: Hitung Umur

```typescript
// lib/plugins/tools/hitung-umur.ts

import { registerPlugin, jsonResponse, errorResponse, getStartTime } from "@/lib";
import { NextRequest } from "next/server";

registerPlugin({
  name: "Hitung Umur",
  slug: "hitung-umur",
  category: "tools",
  description: "Hitung umur dari tanggal lahir",
  endpoint: {
    title: "Kalkulator Umur",
    description: "Masukkan tanggal lahir dan dapatkan umur",
    path: "/api/tools/hitung-umur",
    method: "GET",
    responseType: "json",
    tags: ["tools", "kalkulator"],
    parameters: [
      {
        name: "lahir",
        required: true,
        description: "Tanggal lahir (format: YYYY-MM-DD)",
        type: "string",
      },
    ],
    run: async (request: NextRequest) => {
      const startTime = getStartTime();
      const lahir = request.nextUrl.searchParams.get("lahir");

      // Validasi
      if (!lahir) {
        return errorResponse("Parameter 'lahir' wajib diisi", 400, startTime);
      }

      // Hitung umur
      const tanggalLahir = new Date(lahir);
      const sekarang = new Date();
      
      let umur = sekarang.getFullYear() - tanggalLahir.getFullYear();
      const bulanBeda = sekarang.getMonth() - tanggalLahir.getMonth();
      
      if (bulanBeda < 0 || (bulanBeda === 0 && sekarang.getDate() < tanggalLahir.getDate())) {
        umur--;
      }

      return jsonResponse({
        tanggalLahir: lahir,
        umur: umur,
        pesan: `Umur kamu ${umur} tahun`
      }, 200, startTime, "NONE");
    },
  },
});
```

**Test:** `/api/tools/hitung-umur?lahir=2000-05-15`

---

### Contoh 2: Random Quote

```typescript
// lib/plugins/random/quote.ts

import { registerPlugin, jsonResponse, getStartTime } from "@/lib";
import { NextRequest } from "next/server";

const quotes = [
  { quote: "Hidup adalah perjuangan.", author: "Anonim" },
  { quote: "Berani bermimpi, berani mencoba.", author: "Anonim" },
  { quote: "Kesuksesan dimulai dari langkah kecil.", author: "Anonim" },
  { quote: "Jangan menyerah sebelum mencoba.", author: "Anonim" },
];

registerPlugin({
  name: "Random Quote",
  slug: "quote",
  category: "random",  // Kategori custom!
  description: "Dapatkan quote random",
  endpoint: {
    title: "Random Quote",
    description: "API untuk mendapatkan quote motivasi acak",
    path: "/api/random/quote",
    method: "GET",
    responseType: "json",
    tags: ["random", "quote", "motivasi"],
    parameters: [],  // Tidak ada parameter
    run: async (request: NextRequest) => {
      const startTime = getStartTime();
      
      // Pilih random
      const randomIndex = Math.floor(Math.random() * quotes.length);
      const selected = quotes[randomIndex];

      return jsonResponse(selected, 200, startTime, "NONE");
    },
  },
});
```

---

### Contoh 3: Dengan API Eksternal

```typescript
// lib/plugins/tools/cuaca.ts

import { registerPlugin, jsonResponse, errorResponse, getStartTime, httpClient } from "@/lib";
import { NextRequest } from "next/server";

registerPlugin({
  name: "Info Cuaca",
  slug: "cuaca",
  category: "tools",
  description: "Dapatkan info cuaca kota",
  endpoint: {
    title: "Weather API",
    description: "Cek cuaca berdasarkan nama kota",
    path: "/api/tools/cuaca",
    method: "GET",
    responseType: "json",
    tags: ["tools", "weather", "cuaca"],
    parameters: [
      {
        name: "kota",
        required: true,
        description: "Nama kota",
        type: "string",
      },
    ],
    run: async (request: NextRequest) => {
      const startTime = getStartTime();
      const kota = request.nextUrl.searchParams.get("kota");

      if (!kota) {
        return errorResponse("Parameter 'kota' wajib diisi", 400, startTime);
      }

      try {
        // Request ke API eksternal
        const response = await httpClient.get(
          `https://wttr.in/${encodeURIComponent(kota)}?format=j1`,
          { timeout: 10000 }
        );

        const data = response.data as Record<string, unknown>;
        const current = (data.current_condition as Record<string, unknown>[])?.[0];

        return jsonResponse({
          kota: kota,
          suhu: `${current?.temp_C}°C`,
          kondisi: (current?.weatherDesc as Record<string, unknown>[])?.[0]?.value,
          kelembaban: `${current?.humidity}%`,
        }, 200, startTime, "SHORT");
      } catch (error) {
        return errorResponse("Gagal mengambil data cuaca", 500, startTime);
      }
    },
  },
});
```

---

## ❓ FAQ (Pertanyaan Umum)

### Q: Boleh buat kategori sendiri?
**A:** BOLEH! Kategori tidak dibatasi. Tinggal buat folder baru dan sesuaikan `category` di plugin.

### Q: Bagaimana handle error?
**A:** Gunakan try-catch dan return `errorResponse()`.

### Q: Bagaimana simpan data?
**A:** Untuk data sementara, bisa pakai `withCache()`. Untuk permanent, hubungkan ke database.

### Q: Method POST gimana?
**A:** Ubah `method: "POST"` dan ambil data dari body:
```typescript
const body = await request.json();
const nama = body.nama;
```

---

## ✅ Checklist Sebelum Publish

- [ ] File disimpan di `lib/plugins/{category}/{slug}.ts`
- [ ] Path sesuai format `/api/{category}/{slug}`
- [ ] Semua parameter tervalidasi
- [ ] Ada error handling (try-catch)
- [ ] Sudah test di local
- [ ] Jalankan `npm run generate:plugins`

---

## 🆘 Butuh Bantuan?

Lihat contoh plugin yang sudah ada:
- `lib/plugins/ai/cici.ts` - Contoh AI chat
- `lib/plugins/download/tiktok.ts` - Contoh downloader
- `lib/plugins/stalker/instagram.ts` - Contoh stalker

---

**Selamat Coding! 🎉**
