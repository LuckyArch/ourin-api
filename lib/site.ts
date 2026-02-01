/**
 * =====================================================
 * KONFIGURASI WEBSITE - Ourin API
 * =====================================================
 * 
 * File ini berisi semua konfigurasi utama untuk website.
 * Edit sesuai kebutuhan project kamu.
 * 
 * PENTING: 
 * - Ganti baseUrl dengan domain production saat deploy
 * - Semua konfigurasi di sini akan digunakan di seluruh aplikasi
 */

// =====================================================
// BASE URL
// =====================================================
// URL dasar aplikasi. Ganti dengan domain kamu saat production.
// Contoh production: "https://api.ourin.id"
const baseUrl = "https://api.ourin.my.id";

// =====================================================
// KONFIGURASI UTAMA
// =====================================================
export const siteConfig = {
  // -----------------------------------------------------
  // IDENTITAS APLIKASI
  // -----------------------------------------------------
  // Nama aplikasi (digunakan untuk branding)
  name: "Ourin",
  
  // Title untuk SEO dan browser tab
  title: "Ourin API",
  
  // Deskripsi aplikasi untuk SEO
  description: "High-performance REST API for AI generation, media processing, and more",
  
  // URL website (otomatis dari baseUrl)
  url: baseUrl,
  
  // -----------------------------------------------------
  // BRANDING
  // -----------------------------------------------------
  brand: {
    // Tagline yang muncul di header
    tagline: "#Ourin/api",
    
    // Path ke file logo (taruh di folder public/)
    logo: "/logo.png",
    
    // Path ke favicon
    favicon: "/favicon.ico",
  },

  // -----------------------------------------------------
  // SOCIAL MEDIA
  // -----------------------------------------------------
  // Link ke akun sosial media. Kosongkan jika tidak ada.
  social: {
    github: "https://github.com/LuckyArch",
    discord: "",
    twitter: "",
    instagram: "",
  },

  // -----------------------------------------------------
  // KONTAK
  // -----------------------------------------------------
  contact: {
    email: "support@ourin.id",
    website: "https://sc.ourin.my.id",
  },

  // -----------------------------------------------------
  // KONFIGURASI API
  // -----------------------------------------------------
  api: {
    // Base URL untuk semua API endpoints
    baseUrl,
    
    // Versi API saat ini
    version: "1.0.0",
    
    // Path ke halaman dokumentasi
    docsPath: "/docs",
  },

  // -----------------------------------------------------
  // META TAGS (SEO)
  // -----------------------------------------------------
  meta: {
    // Keywords untuk SEO (dipisah dengan koma)
    keywords: ["API", "REST API", "AI", "Image Generation", "Ourin"],
    
    // Nama author/pembuat
    author: "Zann",
    
    // Theme color untuk mobile browser
    themeColor: "#10b981",
  },
};

// Type export untuk TypeScript
export type SiteConfig = typeof siteConfig;

/**
 * =====================================================
 * CARA PENGGUNAAN
 * =====================================================
 * 
 * Import di file lain:
 * 
 *   import { siteConfig } from "@/lib/site";
 * 
 * Contoh penggunaan:
 * 
 *   // Di component React
 *   <h1>{siteConfig.title}</h1>
 *   <a href={siteConfig.social.github}>GitHub</a>
 * 
 *   // Di API route
 *   const apiUrl = `${siteConfig.api.baseUrl}/api/endpoint`;
 * 
 * =====================================================
 */
