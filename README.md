
<div align="center">

# 🚀 Ourin REST API

![https://cdn.gimita.id/download/0719eeee4fe543a5cd59d74093fd1a60_1769904529474_25eada33.jpg](https://cdn.gimita.id/download/0719eeee4fe543a5cd59d74093fd1a60_1769904529474_25eada33.jpg)

![Version](https://img.shields.io/badge/version-1.0.0-cyan?style=for-the-badge)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-green?style=for-the-badge)

**REST API modern , Gaya Terminal**

[📖 Dokumentasi](#dokumentasi) • [⚡ Quick Start](#quick-start) • [🔌 Plugins](#plugins) • [🛠️ Development](#development)

</div>

---

## 📋 Tentang Proyek

Ourin API adalah REST API yang dibangun dengan **Next.js 15** dan **TypeScript**. Proyek ini menyediakan berbagai endpoint.

Didesain dengan arsitektur **plugin-based** yang memudahkan developer untuk menambah endpoint baru.

---

## ⚡ Quick Start

### 1. Clone Repository

```bash
git clone https://github.com/LuckyArch/ourin-api.git
cd ourin-api
```

### 2. Install Dependencies

```bash
# Menggunakan npm
npm install

# Atau menggunakan pnpm (recommended)
pnpm install
```

### 3. Konfigurasi

Edit file `lib/site.ts` untuk menyesuaikan konfigurasi:

```typescript
const baseUrl = "http://localhost:3000"; // Ganti dengan domain kamu

export const siteConfig = {
  name: "Ourin",
  title: "Ourin API",
  // ...lihat site.ts untuk konfigurasi lengkap
};
```

### 4. Jalankan Development Server

```bash
npm run dev
```

Server akan berjalan di `http://localhost:3000`

### 5. Akses Dokumentasi

Buka browser dan kunjungi:
- **Homepage**: `http://localhost:3000`
- **Dokumentasi API**: `http://localhost:3000/docs`

---

## 📖 Dokumentasi

### Struktur Response

Semua endpoint mengembalikan format response yang konsisten:

```json
{
  "success": true,
  "executionTime": "123ms",
  "result": {
    // Data hasil
  }
}
```

### Response Error

```json
{
  "success": false,
  "error": "Pesan error",
  "executionTime": "50ms"
}
```

### HTTP Status Codes

| Code | Arti | Deskripsi |
|------|------|-----------|
| `200` | Success | Request berhasil |
| `400` | Bad Request | Parameter tidak valid |
| `401` | Unauthorized | API key tidak valid |
| `404` | Not Found | Resource tidak ditemukan |
| `500` | Server Error | Error dari server |

---

## 🔌 Plugins

### AI Plugins

| Endpoint | Deskripsi | Parameter |
|----------|-----------|-----------|
| `/api/ai/cici` | CiCi AI Chat | `q` (required) |
| `/api/ai/gemini` | Google Gemini | `q` (required) |
| `/api/ai/perplexity` | Perplexity AI | `q` (required) |
| `/api/ai/public` | Public AI Models | `q`, `model` |

**Contoh Request:**

```bash
curl -X GET "http://localhost:3000/api/ai/cici?q=Halo%20apa%20kabar"
```

---

### Downloader Plugins

| Endpoint | Platform | Parameter |
|----------|----------|-----------|
| `/api/download/tiktok` | TikTok | `url` (required) |
| `/api/download/youtube` | YouTube | `url` (required) |
| `/api/download/instagram` | Instagram | `url` (required) |
| `/api/download/twitter` | Twitter/X | `url` (required) |
| `/api/download/spotify` | Spotify | `url` (required) |
| `/api/download/facebook` | Facebook | `url` (required) |
| `/api/download/pinterest` | Pinterest | `url` (required) |
| `/api/download/capcut` | CapCut | `url` (required) |
| `/api/download/blibli` | Blibli | `url` (required) |

**Contoh Request:**

```bash
curl -X GET "http://localhost:3000/api/download/tiktok?url=https://vt.tiktok.com/xxxxx"
```

**Contoh Response:**

```json
{
  "success": true,
  "executionTime": "1.2s",
  "result": {
    "metadata": {
      "id": "123456789",
      "description": "Video description"
    },
    "video": {
      "downloadUrl": "https://...",
      "cover": "https://..."
    },
    "author": {
      "nickname": "username",
      "avatar": "https://..."
    }
  }
}
```

---

### Stalker Plugins

| Endpoint | Platform | Parameter |
|----------|----------|-----------|
| `/api/stalker/instagram` | Instagram | `username` (required) |
| `/api/stalker/tiktok` | TikTok | `username` (required) |
| `/api/stalker/twitter` | Twitter/X | `username` (required) |

**Contoh Request:**

```bash
curl -X GET "http://localhost:3000/api/stalker/instagram?username=cristiano"
```

---

## 🛠️ Development

### Struktur Folder

```
ourin-api/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes (auto-generated)
│   ├── docs/              # Dokumentasi Page
│   └── page.tsx           # Homepage
├── lib/
│   ├── plugins/           # Semua plugin endpoints
│   │   ├── ai/           # AI plugins
│   │   ├── download/     # Downloader plugins
│   │   └── stalker/      # Stalker plugins
│   ├── utils/            # Utility functions
│   ├── index.ts          # Main exports
│   ├── registry.ts       # Plugin registry
│   ├── site.ts           # Konfigurasi website
│   └── types.ts          # TypeScript types
├── public/               # Static files
└── scripts/              # Build scripts
```

### Membuat Plugin Baru

Lihat dokumentasi lengkap di [`lib/plugins/example.md`](lib/plugins/example.md)

**Quick Overview:**

```typescript
import { registerPlugin, jsonResponse, errorResponse, getStartTime } from "@/lib";
import { NextRequest } from "next/server";

registerPlugin({
  name: "My Plugin",
  slug: "my-plugin",
  category: "ai", // ai | download | stalker
  description: "Deskripsi plugin",
  endpoint: {
    title: "My Plugin",
    description: "Endpoint description",
    path: "/api/ai/my-plugin",
    method: "GET",
    responseType: "json",
    tags: ["ai", "custom"],
    parameters: [
      {
        name: "q",
        required: true,
        description: "Your query",
        type: "string",
      },
    ],
    run: async (request: NextRequest) => {
      const startTime = getStartTime();
      // Logic here
      return jsonResponse({ result: "data" }, 200, startTime, "NONE");
    },
  },
});
```

### Script Tersedia

```bash
# Development server
npm run dev

# Build production
npm run build

# Start production server
npm start

# Generate plugin loader
npm run generate:plugins

# Lint code
npm run lint
```

---

## ⚙️ Konfigurasi

Konfigurasi utama ada di file `lib/site.ts`:

| Property | Deskripsi |
|----------|-----------|
| `name` | Nama aplikasi |
| `title` | Title untuk SEO |
| `description` | Deskripsi aplikasi |
| `brand.tagline` | Tagline brand |
| `social.*` | Link sosial media |
| `contact.*` | Info kontak |
| `api.baseUrl` | Base URL API |
| `api.version` | Versi API |

Lihat komentar di `lib/site.ts` untuk penjelasan lengkap.

---

## 📦 Dependencies

| Package | Fungsi |
|---------|--------|
| `next` | Framework React |
| `axios` | HTTP Client |
| `cheerio` | HTML Parser |
| `framer-motion` | Animasi |
| `lucide-react` | Icon library |

---

## 🤝 Kontribusi

1. Fork repository ini
2. Buat branch baru (`git checkout -b feature/nama-fitur`)
3. Commit perubahan (`git commit -m 'Tambah fitur baru'`)
4. Push ke branch (`git push origin feature/nama-fitur`)
5. Buat Pull Request

---

## 📄 Lisensi

Proyek ini dilisensikan di bawah [MIT License](LICENSE).

---

<div align="center">

**Made with ❤️ by Zann**

</div>
