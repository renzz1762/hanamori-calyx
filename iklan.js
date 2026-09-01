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

    // ─── TAMBAH IKLAN BARU DI SINI ───
     {
      type: "image",
     title: "FOLLOW SALURAN DEV",
      text: "TEMBUSIN 3K FOLLOWERS",
      media_url: "https://files.catbox.moe/lbhaap.jpg",
      cta_buttons: [
        { type: "tiktok", url: "https://whatsapp.com/channel/0029Vb5aoKwEwEjpsmaQol3A", label: "SALURAN" },
      ]
     },

     {
      type: "image",
     title: "FOLLOW INFO HC AI",
      text: "BERISI TENTANG INFORMASI HC AI",
      media_url: "https://files.catbox.moe/w7ltnw.jpg",
      cta_buttons: [
        { type: "tiktok", url: "https://whatsapp.com/channel/0029VbBs1ug5q08UkVxnro3w", label: "SALURAN" },
      ]
     },
  ],
};
