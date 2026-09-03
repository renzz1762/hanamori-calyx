/*
 Proxy untuk fitur "Download dari Link" di tab Tools.
 Dipanggil dari browser via fetch('/api/download', { method:'POST', body:{url} })
 lalu function ini yang neruskan request ke provider (server-side),
 supaya gak kena CORS kalau dipanggil langsung dari browser.

 Source provider: getdl.space
 Original script: t.me/AwasPhpJir — api.ikyyxd.my.id
*/

const BASE_URL = 'https://getdl.space';
const API_ENDPOINT = `${BASE_URL}/api/download`;

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36',
  'Referer': `${BASE_URL}/id`,
  'Origin': BASE_URL,
  'Content-Type': 'application/json',
  'Accept': 'application/json, text/plain, */*',
  'Cookie': 'NEXT_LOCALE=id'
};

module.exports = async (req, res) => {
  // CORS dasar (biar aman kalau nanti dipanggil dari domain lain juga)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ success: false, message: 'Method tidak diizinkan, pakai POST' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (e) { body = {}; }
  }
  const targetUrl = body && body.url ? String(body.url).trim() : '';

  if (!targetUrl || !/^https?:\/\//i.test(targetUrl)) {
    return res.status(400).json({ success: false, message: 'Parameter "url" wajib diisi dan harus link valid (http/https)' });
  }

  try {
    const upstream = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify({ url: targetUrl })
    });

    const raw = await upstream.text();
    let data;
    try { data = JSON.parse(raw); } catch (e) { data = raw; }

    if (!upstream.ok) {
      return res.status(upstream.status).json({
        success: false,
        message: 'Provider mengembalikan error',
        status_code: upstream.status,
        raw: data
      });
    }

    return res.status(200).json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Gagal konek ke provider: ' + err.message });
  }
};
