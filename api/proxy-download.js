// api/proxy-download.js
//
// KENAPA FILE INI ADA:
// Kalau download dipicu dari JavaScript pakai trik blob:/data: URI (cara lama),
// Chrome di Android suka nongolin dialog konfirmasi "Download file — Do you want
// to download 'xxxxx.mp4'?" dan kadang macet gitu aja pas ditekan "YES".
// Itu perilaku standar Chrome buat proteksi, bukan bug di website ini.
//
// Fix-nya: server (kita) yang ambil file-nya dulu, terus kirim balik ke browser
// sebagai response HTTP biasa dengan header "Content-Disposition: attachment".
// Kalau downloadnya lewat cara ini, Chrome bakal auto-save ke folder Downloads
// TANPA dialog konfirmasi apa pun — cuma muncul notifikasi kecil di bawah.
//
// CARA PAKAI dari sisi client (sudah otomatis dipanggil dari tools.js):
//   /api/proxy-download?url=<link asli, di-encode>&filename=<nama file, di-encode>
//
// WAJIB DI-DEPLOY: taruh file ini persis di folder /api/ di root project Vercel
// kamu (sejajar sama api/download.js yang udah ada). Vercel otomatis bikin route
// /api/proxy-download begitu file ini ke-deploy, gak perlu setting tambahan.

// Domain yang diizinkan di-proxy — biar endpoint ini gak disalahgunain jadi
// "open proxy" buat sembarang URL. Tambahin domain lain di sini kalau perlu
// (misalnya kalau nanti nambah sumber CDN baru).
const ALLOWED_HOSTS = [
  'tikwm.com',
  'i.pinimg.com',
  'i.ibb.co',
  'ibb.co',
  'files.catbox.moe',
  'catbox.moe',
];

function isAllowedHost(hostname) {
  return ALLOWED_HOSTS.some(h => hostname === h || hostname.endsWith('.' + h));
}

export default async function handler(req, res) {
  const { url, filename } = req.query;

  if (!url || typeof url !== 'string') {
    res.status(400).json({ success: false, message: 'Parameter "url" wajib diisi' });
    return;
  }

  let target;
  try {
    target = new URL(url);
  } catch {
    res.status(400).json({ success: false, message: 'URL gak valid' });
    return;
  }

  if (!isAllowedHost(target.hostname)) {
    res.status(403).json({
      success: false,
      message: `Domain "${target.hostname}" belum diizinkan di proxy-download. Tambahin ke ALLOWED_HOSTS di api/proxy-download.js kalau memang tepercaya.`
    });
    return;
  }

  try {
    // Beberapa CDN (misal video TikTok/tikwm) ngecek Referer/User-Agent buat
    // nolak hotlink dari domain lain — kita kasih header yang wajar biar dianggap
    // request yang sah, jadi gak ke-block.
    const upstream = await fetch(target.toString(), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Referer': 'https://www.tikwm.com/',
      }
    });
    if (!upstream.ok || !upstream.body) {
      res.status(502).json({ success: false, message: 'Gagal ambil file dari sumbernya (upstream error)' });
      return;
    }

    const contentType = upstream.headers.get('content-type') || 'application/octet-stream';
    const contentLength = upstream.headers.get('content-length');
    const safeName = (filename ? String(filename) : 'download').replace(/[^a-zA-Z0-9._-]/g, '_') || 'download';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${safeName}"`);
    if (contentLength) res.setHeader('Content-Length', contentLength);
    res.setHeader('Cache-Control', 'no-store');

    // Stream langsung ke response biar gak numpuk seluruh file di memori server
    const reader = upstream.body.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(Buffer.from(value));
    }
    res.end();
  } catch (e) {
    res.status(500).json({ success: false, message: 'Proxy download gagal: ' + e.message });
  }
}
