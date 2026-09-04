// Data bahan GFX (gambar/asset siap pakai untuk edit)
// Tinggal tambah objek baru di sini, id harus unik.
//
// Ada 2 mode per item:
//  - FOTO statis  -> isi field "image" aja
//      { id: 1, title: "GFX Sparkle Pink", image: "https://i.pinimg.com/originals/xx/xx/xx/nama-file.jpg" }
//  - VIDEO (autoplay/loop, biar "gerak")  -> isi field "video" (link .mp4/.webm langsung)
//      { id: 2, title: "GFX Overlay Sparkle", video: "https://contoh-cdn.com/sparkle.mp4", image: "https://contoh-cdn.com/sparkle-poster.jpg" }
//    "image" di mode video itu OPSIONAL, dipakai sebagai poster/preview sebelum videonya kebuka.
//
// PENTING soal link Pinterest:
// Link "pinterest.com/pin/xxxxx" atau "pin.it/xxxx" itu link HALAMAN, bukan link gambar
// langsung, jadi GAK bisa dipasang di sini (bakal gagal load / kotak abu-abu).
// Yang bisa dipakai adalah link gambar aslinya (domain i.pinimg.com), caranya:
//   1) Buka pin-nya di Pinterest
//   2) Klik kanan gambarnya -> "Copy image address" / "Salin alamat gambar"
//      (atau "Buka gambar di tab baru" dulu, baru copy URL dari address bar)
//   3) Link yang di-copy harusnya diawali https://i.pinimg.com/... — nah itu yang dipasang di "image"
// Kalau link i.pinimg.com tetep gagal (jarang, tapi bisa aja diblokir), pakai catbox.moe
// sebagai cadangan — upload di catbox terus pasang link catbox-nya di sini.
const BAHAN_GFX = [
  // tambah objek baru di sini, id harus unik
];
