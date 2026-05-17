/* ================================================================
   ╔══════════════════════════════════════════════════════════╗
   ║     HANAMORI CALYX AI — REDEEM CODES (DAFTAR KODE)      ║
   ║     By renzzzzofc18 | File ini = daftar kode valid      ║
   ╚══════════════════════════════════════════════════════════╝

   FILE INI berisi DAFTAR KODE yang bisa di-redeem user.
   HADIAH tiap kode ada di file: backpackredem.js

   CARA TAMBAH KODE BARU:
   1. Tambah entry di REDEEM_CODES di bawah
   2. Buat juga hadiah-nya di backpackredem.js dengan KEY yang sama
   3. Kode bersifat case-insensitive (huruf besar/kecil tidak masalah)

   FORMAT:
   "KODE_REDEEM": {
     active  : true,          ← false = kode mati/expired
     type    : "vip",         ← "free" | "vip" | "ultra" | "special"
     desc    : "Keterangan kode (tampil di UI)",
     expires : null,          ← null = tidak expired | "2026-12-31" = expired tgl itu
   }
================================================================ */

const REDEEM_CODES = {

  /* ══ FREE CODES ══════════════════════════════════════════ */
  "HCFREE01": {
    active : true,
    type   : "free",
    desc   : "Free Pack Basic — Script Chat Tag gratis untuk semua!",
    expires: null,
  },

  "HCWELCOME": {
    active : true,
    type   : "free",
    desc   : "Welcome Pack — Hadiah selamat datang untuk member baru.",
    expires: null,
  },

  /* ══ VIP CODES ═══════════════════════════════════════════ */
  "HCVIP2026": {
    active : true,
    type   : "vip",
    desc   : "VIP Pack 2026 — Akses script premium pilihan.",
    expires: null,
  },

  "HCVIPBETA": {
    active : true,
    type   : "vip",
    desc   : "VIP Beta Tester — Reward khusus beta tester setia.",
    expires: null,
  },

  /* ══ ULTRA CODES ═════════════════════════════════════════ */
  "HCULTRA01": {
    active : true,
    type   : "ultra",
    desc   : "Ultra Pack v1 — Akses penuh semua script + priority support.",
    expires: null,
  },

  /* ══ SPECIAL / EVENT CODES ═══════════════════════════════ */
  "HCSPECIAL": {
    active : true,
    type   : "special",
    desc   : "Special Event Pack — Edisi terbatas event HANAMORI CALYX AI!",
    expires: "2026-12-31",   // expired akhir 2026
  },

  "HCBDAY2026": {
    active : true,
    type   : "special",
    desc   : "Birthday Pack 2026 — Hadiah ulang tahun HANAMORI CALYX AI! 🎂",
    expires: null,
  },

  // ─── TAMBAH KODE BARU DI SINI ─────────────────────────────
  // "KODEBARU": {
  //   active : true,
  //   type   : "free",      // "free" | "vip" | "ultra" | "special"
  //   desc   : "Deskripsi kode ini.",
  //   expires: null,        // null = selamanya | "YYYY-MM-DD" = tanggal expired
  // },
};
