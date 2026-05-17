/* ================================================================
   ╔══════════════════════════════════════════════════════════╗
   ║     HANAMORI CALYX AI — BACKPACK / HADIAH REDEEM        ║
   ║     By renzzzzofc18 | File ini = isi hadiah tiap kode   ║
   ╚══════════════════════════════════════════════════════════╝

   FILE INI berisi HADIAH (files/reward) untuk setiap kode redeem.
   Kode redeemnya sendiri ada di: redemcode.js

   FORMAT TIAP ENTRY:
   "NAMA_KODE": {
     label: "Nama Pack (tampil di UI)",
     files: [
       {
         name    : "Nama file (tampil di card)",
         filename: "namafile.lua",           ← nama file saat download
         desc    : "Deskripsi singkat",
         content : `...isi file...`
       },
       // ... bisa tambah banyak file
     ]
   }

   CARA TAMBAH HADIAH BARU:
   1. Pastikan kode sudah didaftarkan di redemcode.js
   2. Tambah entry baru di BACKPACK di bawah sesuai format
================================================================ */

const BACKPACK = {

  /* ══════════════════════════════════════════
     HCVIP2026 — VIP PACK 2026
  ══════════════════════════════════════════ */
  "HCVIP2026": {
    label: "🔑 VIP PACK 2026",
    files: [
      {
        name: "Script Fly GUI VIP",
        filename: "fly_gui_vip.lua",
        desc: "Script Fly Roblox versi VIP dengan speed control, mobile support, dan UI premium.",
        content: `-- ╔══════════════════════════════════════════╗
-- ║  FLY GUI VIP  |  BY HANAMORI CALYX AI   ║
-- ║  renzzzzofc18 | VIP v1.0                 ║
-- ╚══════════════════════════════════════════╝

-- >> Ini adalah preview script VIP. Kode penuh tersedia setelah konfirmasi Discord. <<
-- Join Discord: https://discord.gg/PFVEfKRak
-- Follow TikTok: https://tiktok.com/@renzzzzofc18

print("FLY GUI VIP by HANAMORI CALYX AI loaded!")`
      },
      {
        name: "Info VIP Member",
        filename: "info_vip.txt",
        desc: "Informasi lengkap akses member VIP HANAMORI CALYX AI.",
        content: `╔══════════════════════════════════╗
║    HANAMORI CALYX AI — VIP       ║
╚══════════════════════════════════╝

Selamat! Kamu berhasil redeem kode VIP.

AKSES VIP MELIPUTI:
✅ Script Fly GUI Premium
✅ Script Chat GUI V3 Full
✅ Script Admin Panel Lengkap
✅ Update script seumur hidup
✅ Priority support di Discord

CARA DAPAT SCRIPT LENGKAP:
→ Join Discord: https://discord.gg/PFVEfKRak
→ DM admin dengan bukti redeem ini
→ Script dikirim dalam 1x24 jam

By HANAMORI CALYX AI — renzzzzofc18`
      },
    ]
  },
  // ─── TAMBAH HADIAH KODE BARU DI SINI ───────────────────────
  // "KODE_BARU": {
  //   label: "🎁 Nama Pack Baru",
  //   files: [
  //     {
  //       name: "Nama File",
  //       filename: "namafile.lua",
  //       desc: "Deskripsi file.",
  //       content: `-- isi kode atau teks di sini`
  //     },
  //     // bisa tambah banyak file sekaligus!
  //   ]
  // },
};
