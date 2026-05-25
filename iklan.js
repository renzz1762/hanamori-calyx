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
  SHOW_ADS: true,
  AD_DELAY_MS: 1500,
  AD_AUTO_INTERVAL_MS: 5000,
  // Countdown detik di tombol Next sebelum bisa diklik
  AD_NEXT_COUNTDOWN_SEC: 3,

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
    //   type: "image",
    //   title: "🎁 Nama Iklan Baru",
    //   text: "Deskripsi iklan kamu di sini.",
    //   media_url: "https://link-gambar.com/foto.jpg",
    //   cta_buttons: [
    //     { type: "wa", url: "https://wa.me/...", label: "Hubungi WA" },
    //   ]
    // },
  ],
};
