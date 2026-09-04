// api/video-proxy.js
//
// KENAPA FILE INI ADA:
// Video preview (yang autoplay di thumbnail Mentahan Video/Bahan GFX) kadang gak
// mau jalan padahal link-nya udah kedapet dari API tikwm. Penyebabnya: CDN video
// TikTok/tikwm sering ngecek header "Referer" / "User-Agent" buat nolak hotlink
// dari domain lain (anti-leech) — jadi kalau <video> di web ini coba nge-load
// langsung dari CDN itu, sebagian ke-block diem-diem (videonya error, balik jadi
// foto statis lagi). Konsisten gagal terus walau udah di-retry berkali-kali,
// karena emang diblokir, bukan soal rate-limit.
//
// Fix-nya: server (kita) yang minta videonya dengan header yang bikin CDN-nya
// percaya request itu "sah" (Referer & User-Agent yang wajar), terus di-stream
// balik ke browser. Support Range request juga biar video playback-nya smooth.
//
// WAJIB DI-DEPLOY: taruh file ini di folder /api/ di root project Vercel kamu,
// sejajar sama api/download.js dan api/proxy-download.js.

const ALLOWED_HOSTS = ['tikwm.com'];

function isAllowedHost(hostname) {
  return ALLOWED_HOSTS.some(h => hostname === h || hostname.endsWith('.' + h));
}

export default async function handler(req, res) {
  const { url } = req.query;

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
      message: `Domain "${target.hostname}" belum diizinkan di video-proxy. Tambahin ke ALLOWED_HOSTS kalau memang tepercaya.`
    });
    return;
  }

  try {
    const upstreamHeaders = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Referer': 'https://www.tikwm.com/',
    };
    // Teruskan header Range dari browser (buat seeking/streaming yang smooth)
    if (req.headers.range) upstreamHeaders['Range'] = req.headers.range;

    const upstream = await fetch(target.toString(), { headers: upstreamHeaders });
    if (!upstream.ok && upstream.status !== 206) {
      res.status(502).json({ success: false, message: 'Gagal ambil video dari sumbernya (status ' + upstream.status + ')' });
      return;
    }
    if (!upstream.body) {
      res.status(502).json({ success: false, message: 'Upstream gak ngasih data video' });
      return;
    }

    res.status(upstream.status); // 200 atau 206 (partial content)
    const passHeaders = ['content-type', 'content-length', 'content-range', 'accept-ranges', 'cache-control'];
    passHeaders.forEach(h => {
      const v = upstream.headers.get(h);
      if (v) res.setHeader(h, v);
    });
    if (!upstream.headers.get('accept-ranges')) res.setHeader('Accept-Ranges', 'bytes');
    if (!upstream.headers.get('content-type')) res.setHeader('Content-Type', 'video/mp4');

    const reader = upstream.body.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(Buffer.from(value));
    }
    res.end();
  } catch (e) {
    res.status(500).json({ success: false, message: 'Video proxy gagal: ' + e.message });
  }
}
