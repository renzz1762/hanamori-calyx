/* ================================================================
   ╔══════════════════════════════════════════════════════════╗
   ║     HANAMORI CALYX AI — IKLAN CONFIG                    ║
   ║     By renzzzzofc18 | Pisahkan di file ini              ║
   ╚══════════════════════════════════════════════════════════╝
   
   CARA PAKAI:
   - SHOW_ADS: false  → iklan TIDAK muncul sama sekali
   - SHOW_ADS: true   → iklan muncul sesuai daftar di bawah
   
   Tambah iklan baru: copy salah satu blok di ADS_LIST dan edit!
================================================================ */

const IKLAN_CFG = {

  /* ─── TOGGLE IKLAN ─────────────────────────────────────────
   *  true  = iklan aktif & muncul
   *  false = iklan MATI, tidak akan tampil sama sekali
   ──────────────────────────────────────────────────────────── */
  SHOW_ADS: true,

  /* ─── DELAY & INTERVAL ─────────────────────────────────────
   * AD_DELAY_MS       : jeda (ms) sebelum iklan muncul setelah beta overlay ditutup
   * AD_AUTO_INTERVAL  : jeda ganti slide otomatis (ms), 0 = manual aja
   ──────────────────────────────────────────────────────────── */
  AD_DELAY_MS: 1500,
  AD_AUTO_INTERVAL_MS: 5000,

  /* ─── DAFTAR IKLAN ─────────────────────────────────────────
   * type       : "text" | "image" | "video"
   * title      : judul iklan
   * text       : deskripsi iklan
   * media_url  : URL gambar/video (kosongkan kalau type "text")
   * cta_buttons: array tombol { type: "wa"|"ig"|"tt"|"dc"|"web", url, label }
   *
   * Tambah iklan baru: copy salah satu blok, paste di bawahnya, ganti isinya!
   ──────────────────────────────────────────────────────────── */
  ADS_LIST: [
    {
      type: "text",
      title: "🔥 Follow TikTok Gue!",
      text: "Konten script Roblox, tips coding, dan info update HANAMORI CALYX AI setiap hari. Jangan ketinggalan bro!",
      media_url: "",
      cta_buttons: [
        { type: "tt", url: "https://tiktok.com/@renzzzzofc18", label: "Follow TikTok" },
        { type: "wa", url: "https://whatsapp.com/channel/0029Vb5aoKwEwEjpsmaQol3A", label: "Join WA Channel" },
      ]
    },
    // ─── TAMBAH IKLAN BARU DI SINI ───
    // {
    //   type: "image",                        // atau "text" / "video"
    //   title: "🎁 Nama Iklan Baru",
    //   text: "Deskripsi iklan kamu di sini.",
    //   media_url: "https://link-gambar.com/foto.jpg",  // kosongkan kalau type "text"
    //   cta_buttons: [
    //     { type: "wa", url: "https://wa.me/...", label: "Hubungi WA" },
    //   ]
    // },
  ],
};
