/* ================================================================
   TOOLS: Mentahan Video / Bahan GFX / Background GFX
   Diadaptasi dari mentahan.html/main.js biar nyambung ke tab
   "Tools" (bekas "Info") di HANAMORI CALYX AI.
   Data source: product.js (PRODUCTS), bahangfx.js (BAHAN_GFX),
   backgroundgfx.js (BACKGROUND_GFX)
================================================================ */

const toolsThumbCache = {};

document.addEventListener('DOMContentLoaded', () => {
  renderToolsVideos();
  renderToolsGfx();
  renderToolsBg();
});

// ===== SUB-TAB SWITCH (di dalam halaman Tools) =====
function toolsSwitchTab(name, btn) {
  document.querySelectorAll('.tools-tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tools-panel').forEach(p => p.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('toolsPanel-' + name).classList.add('active');
}

// ===== HELPERS (fallback kalau esc/showToast dari main.js belum ke-load) =====
function toolsEsc(str) {
  if (typeof esc === 'function') return esc(str);
  return String(str).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function toolsToast(msg) {
  if (typeof showToast === 'function') { showToast(msg); return; }
  console.log(msg);
}
function toolsSlug(str) {
  return String(str).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'file';
}
function toolsEmptyState(icon, msg) {
  return `<div class="tools-empty-state"><i class="fa-solid ${icon}"></i><p>${msg}</p></div>`;
}

// ===== DOWNLOAD (VIDEO & GAMBAR) =====
// Cara download di-urut dari yang paling "bersih" (gak nongolin dialog Chrome):
//   1) Lewat /api/proxy-download (server yang narik filenya, kirim balik dengan
//      header Content-Disposition: attachment). Ini yang bikin Chrome auto-save
//      diem-diem tanpa dialog konfirmasi. Butuh file api/proxy-download.js
//      ke-deploy di project Vercel kamu.
//   2) Kalau endpoint proxy itu belum ke-deploy (404) atau gagal, baru fallback
//      ke cara lama (blob/data URI client-side) — ini yang biasanya nongolin
//      dialog "Download file" dari Chrome, tapi tetep jalan.
const TOOLS_DATA_URI_MAX_BYTES = 20 * 1024 * 1024; // 20MB

let toolsProxyAvailable = null;
async function toolsCheckProxyAvailable() {
  if (toolsProxyAvailable !== null) return toolsProxyAvailable;
  try {
    const r = await fetch('/api/proxy-download');
    // 404 = file api/proxy-download.js belum ke-deploy. Selain itu (400/403/dst)
    // artinya endpoint-nya ADA, cuma nolak karena parameter belum lengkap — wajar.
    toolsProxyAvailable = r.status !== 404;
  } catch (e) {
    toolsProxyAvailable = false;
  }
  return toolsProxyAvailable;
}

async function toolsForceDownload(url, filename) {
  const proxyOk = await toolsCheckProxyAvailable();
  if (proxyOk) {
    const proxyUrl = `/api/proxy-download?url=${encodeURIComponent(url)}&filename=${encodeURIComponent(filename)}`;
    const a = document.createElement('a');
    a.href = proxyUrl; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    toolsToast('Download dimulai — cek notifikasi / folder Downloads di HP kamu');
    return;
  }

  // ── Fallback (proxy belum ke-deploy) ──
  try {
    const res = await fetch(url, { mode: 'cors' });
    if (!res.ok) throw new Error('fetch gagal');
    const blob = await res.blob();

    if (blob.size <= TOOLS_DATA_URI_MAX_BYTES) {
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      const a = document.createElement('a');
      a.href = dataUrl; a.download = filename;
      document.body.appendChild(a); a.click(); a.remove();
    } else {
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl; a.download = filename;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(blobUrl), 4000);
    }
    toolsToast('Download berhasil! Kalau muncul dialog konfirmasi dari browser, tekan "Yes/Download" buat nyimpennya.');
  } catch (e) {
    window.open(url, '_blank');
    toolsToast('Dibuka di tab baru — tekan lama / klik kanan lalu "Save As" untuk simpan');
  }
}

async function toolsDownloadVideo(link, btn) {
  const original = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Proses...';
  try {
    const api = `https://www.tikwm.com/api/?url=${encodeURIComponent(link)}`;
    const res = await fetch(api);
    const json = await res.json();
    if (json.code !== 0 || !json.data || !json.data.play) throw new Error('API gagal ambil video');
    let playUrl = json.data.play;
    if (playUrl.startsWith('/')) playUrl = 'https://www.tikwm.com' + playUrl;
    await toolsForceDownload(playUrl, `mentahan-${json.data.id || Date.now()}.mp4`);
  } catch (e) {
    toolsToast('Gagal download otomatis, coba tombol TikTok / TikTok Lite untuk buka manual');
  } finally {
    btn.disabled = false;
    btn.innerHTML = original;
  }
}

// ===== THUMBNAIL DARI LINK TIKTOK =====
async function toolsGetTiktokThumb(link) {
  if (toolsThumbCache[link]) return toolsThumbCache[link];
  try {
    const res = await fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(link)}`);
    const json = await res.json();
    toolsThumbCache[link] = json.thumbnail_url || '';
    return toolsThumbCache[link];
  } catch (e) {
    return '';
  }
}

async function toolsLoadThumb(p) {
  const url = await toolsGetTiktokThumb(p.tiktok);
  const img = document.getElementById(`tools-thumb-${p.id}`);
  const loading = document.getElementById(`tools-loading-${p.id}`);
  if (!img) return;
  if (url) {
    img.src = url;
    img.style.display = 'block';
    if (loading) loading.style.display = 'none';
  } else if (loading) {
    loading.innerHTML = '<i class="fa-solid fa-video"></i>';
  }
}

// ===== PREVIEW VIDEO AUTOPLAY (mentahan video jadi "gerak" kaya Latest News) =====
const toolsVideoPreviewCache = {};
function toolsSleep(ms) { return new Promise(r => setTimeout(r, ms)); }

let toolsVideoProxyAvailable = null;
async function toolsCheckVideoProxyAvailable() {
  if (toolsVideoProxyAvailable !== null) return toolsVideoProxyAvailable;
  try {
    const r = await fetch('/api/video-proxy');
    toolsVideoProxyAvailable = r.status !== 404;
  } catch (e) {
    toolsVideoProxyAvailable = false;
  }
  return toolsVideoProxyAvailable;
}

async function toolsGetVideoPreviewUrl(link, attempt = 1) {
  if (toolsVideoPreviewCache[link]) return toolsVideoPreviewCache[link];
  const MAX_ATTEMPTS = 3; // dijaga tetap 3x — biar gagal cepet, gak ngunci antrian lama
  try {
    const api = `https://www.tikwm.com/api/?url=${encodeURIComponent(link)}`;
    const res = await fetch(api);
    if (res.status === 429 && attempt < MAX_ATTEMPTS) {
      // Kena rate-limit — tunggu bentar terus coba lagi
      await toolsSleep(700 * attempt);
      return toolsGetVideoPreviewUrl(link, attempt + 1);
    }
    const json = await res.json();
    if (json.code !== 0 || !json.data || !json.data.play) throw new Error('no play url');
    let playUrl = json.data.play;
    if (playUrl.startsWith('/')) playUrl = 'https://www.tikwm.com' + playUrl;
    toolsVideoPreviewCache[link] = playUrl;
    return playUrl;
  } catch (e) {
    if (attempt < MAX_ATTEMPTS) {
      await toolsSleep(600 * attempt);
      return toolsGetVideoPreviewUrl(link, attempt + 1);
    }
    return '';
  }
}

async function toolsLoadVideoPreview(p, thumbAlreadyLoaded) {
  // Poster dulu (thumbnail statis) biar ada yang keliatan selagi video-nya dimuat.
  // Kalau udah dimuat duluan lewat toolsLoadAllThumbs, skip ini biar gak dobel fetch.
  if (!thumbAlreadyLoaded) await toolsLoadThumb(p);
  const wrap = document.getElementById(`tools-thumbwrap-${p.id}`);
  const img = document.getElementById(`tools-thumb-${p.id}`);
  const loading = document.getElementById(`tools-loading-${p.id}`);
  if (!wrap) return;
  const playUrl = await toolsGetVideoPreviewUrl(p.tiktok);
  if (!playUrl) {
    // Gagal ambil video asli setelah beberapa kali coba (biasanya tikwm lagi
    // rate-limit). Daripada diem doang selamanya, kasih tombol retry manual.
    const oldRetryBtn = wrap.querySelector('.tools-thumb-retrybtn');
    if (oldRetryBtn) oldRetryBtn.remove();
    const retryBtn = document.createElement('button');
    retryBtn.className = 'tools-thumb-retrybtn';
    retryBtn.innerHTML = '<i class="fa-solid fa-rotate-right"></i> Tap buat coba lagi';
    retryBtn.setAttribute('onclick', `toolsRetryVideoPreview(event, this, ${p.id})`);
    wrap.appendChild(retryBtn);
    return;
  }

  const proxyOk = await toolsCheckVideoProxyAvailable();
  // Kalau proxy ada, pakai itu duluan (CDN tikwm suka nolak hotlink langsung dari
  // domain lain — lewat proxy request-nya keliatan sah). Kalau gagal juga, coba
  // link langsung sebagai upaya terakhir sebelum nyerah ke foto statis.
  let triedDirect = !proxyOk;
  const video = document.createElement('video');
  video.className = 'tools-thumb-video';
  video.src = proxyOk ? `/api/video-proxy?url=${encodeURIComponent(playUrl)}` : playUrl;
  video.autoplay = true; video.muted = true; video.loop = true; video.playsInline = true;
  if (img && img.src) video.poster = img.src;
  video.onerror = () => {
    if (!triedDirect) {
      // Percobaan pertama (lewat proxy) gagal, coba link langsung sekali lagi
      triedDirect = true;
      video.src = playUrl;
      video.load();
      return;
    }
    video.remove(); playBtn.remove(); if (img) img.style.display = 'block';
    delete toolsVideoPreviewCache[p.tiktok || p.video];
    const retryBtn = document.createElement('button');
    retryBtn.className = 'tools-thumb-retrybtn';
    retryBtn.innerHTML = '<i class="fa-solid fa-rotate-right"></i> Tap buat coba lagi';
    retryBtn.setAttribute('onclick', `toolsRetryVideoPreview(event, this, ${p.id})`);
    wrap.appendChild(retryBtn);
  };
  wrap.insertBefore(video, wrap.firstChild);
  if (img) img.style.display = 'none';
  if (loading) loading.style.display = 'none';

  // Tombol play/pause manual — videonya tetep autoplay duluan, tombol ini cuma buat toggle
  const playBtn = document.createElement('button');
  playBtn.className = 'tools-thumb-playbtn';
  playBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
  playBtn.setAttribute('onclick', 'toolsToggleVideoPlay(event, this)');
  wrap.appendChild(playBtn);
}

// Retry manual pas user tap tombol "coba lagi" di kartu yang gagal load videonya
function toolsRetryVideoPreview(e, btn, productId) {
  e.stopPropagation();
  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Memuat ulang...';
  const item = (typeof PRODUCTS !== 'undefined' && PRODUCTS.find(p => p.id === productId))
    || (typeof BAHAN_GFX !== 'undefined' && BAHAN_GFX.find(g => g.id === productId))
    || (typeof BACKGROUND_GFX !== 'undefined' && BACKGROUND_GFX.find(b => b.id === productId));
  if (!item) { btn.remove(); return; }
  delete toolsVideoPreviewCache[item.tiktok || item.video];
  btn.remove();
  toolsLoadVideoPreview(item);
}

// Load semua thumbnail statis duluan (cepat, gak nunggu tikwm) biar user langsung
// liat gambar buat SEMUA kartu, gak ada yang stuck loading lama.
async function toolsLoadAllThumbs(items, concurrency = 6) {
  let idx = 0;
  async function worker() {
    while (idx < items.length) {
      const item = items[idx++];
      await toolsLoadThumb(item);
    }
  }
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, worker);
  await Promise.all(workers);
}

// Load semua preview video gantian (antrian, N sekaligus) — bukan serentak semua,
// biar gak nembak API tikwm bareng-bareng dan kena rate-limit. Ini jalan SETELAH
// semua thumbnail statis kelar dimuat, jadi user gak nunggu video buat liat gambar.
// Kalau satu kartu gagal, dia nyerah cepet (bukan retry lama-lama) dan nampilin
// tombol retry manual — biar kartu lain di antrian gak ketahan nunggu.
async function toolsLoadVideoPreviewQueue(items, concurrency = 3, gapMs = 200) {
  await toolsLoadAllThumbs(items);
  let idx = 0;
  async function worker() {
    while (idx < items.length) {
      const item = items[idx++];
      await toolsLoadVideoPreview(item, true);
      await toolsSleep(gapMs);
    }
  }
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, worker);
  await Promise.all(workers);
}

// Toggle play/pause buat video preview (Mentahan Video / Bahan GFX / Background GFX)
function toolsToggleVideoPlay(e, btn) {
  e.stopPropagation();
  const wrap = btn.closest('.tools-thumb-wrap');
  const video = wrap && wrap.querySelector('video');
  if (!video) return;
  if (video.paused) {
    video.play();
    btn.innerHTML = '<i class="fa-solid fa-pause"></i>';
  } else {
    video.pause();
    btn.innerHTML = '<i class="fa-solid fa-play"></i>';
  }
}

// ===== RENDER: MENTAHAN VIDEO (data: PRODUCTS dari product.js) =====
function renderToolsVideos() {
  const input = document.getElementById('toolsSearchVideo');
  const grid = document.getElementById('toolsVideoGrid');
  if (!grid || typeof PRODUCTS === 'undefined') return;
  const q = (input ? input.value : '').toLowerCase();
  const filtered = PRODUCTS.filter(p =>
    p.title.toLowerCase().includes(q) || (p.category || '').toLowerCase().includes(q)
  );
  if (!filtered.length) { grid.innerHTML = toolsEmptyState('fa-video-slash', 'Belum ada mentahan video'); return; }

  grid.innerHTML = filtered.map(p => `
    <div class="tools-card video-card">
      <div class="tools-thumb-wrap" id="tools-thumbwrap-${p.id}">
        <img class="tools-thumb-img" id="tools-thumb-${p.id}" src="" alt="${toolsEsc(p.title)}" style="display:none">
        <div class="tools-thumb-loading" id="tools-loading-${p.id}"><i class="fa-solid fa-spinner fa-spin"></i></div>
        <span class="tools-badge-cat">${toolsEsc(p.category || 'mentahan')}</span>
      </div>
      <div class="tools-card-body">
        <div class="tools-card-title">${toolsEsc(p.title)}</div>
        <div class="tools-card-actions">
          <a href="${p.tiktok}" target="_blank" class="tools-btn-outline" title="Buka di TikTok"><i class="fa-brands fa-tiktok"></i></a>
          ${p.tiktokLite ? `<a href="${p.tiktokLite}" target="_blank" class="tools-btn-outline" title="Buka di TikTok Lite"><i class="fa-solid fa-bolt"></i></a>` : ''}
          <button class="tools-btn-download" onclick="toolsDownloadVideo('${p.tiktok}', this)"><i class="fa-solid fa-download"></i> Download</button>
        </div>
      </div>
    </div>
  `).join('');

  toolsLoadVideoPreviewQueue(filtered);
}

// ===== RENDER: BAHAN GFX (data: BAHAN_GFX dari bahangfx.js) =====
// Setiap item boleh isi "image" (foto, statis) ATAU "video" (link .mp4/.webm — bakal autoplay/loop kaya thumbnail Mentahan Video)
function renderToolsGfx() {
  const input = document.getElementById('toolsSearchGfx');
  const grid = document.getElementById('toolsGfxGrid');
  if (!grid || typeof BAHAN_GFX === 'undefined') return;
  const q = (input ? input.value : '').toLowerCase();
  const filtered = BAHAN_GFX.filter(g => g.title.toLowerCase().includes(q));
  if (!filtered.length) { grid.innerHTML = toolsEmptyState('fa-layer-group', 'Belum ada bahan GFX'); return; }

  grid.innerHTML = filtered.map(g => {
    const isVideo = !!g.video;
    const src = isVideo ? g.video : g.image;
    const media = isVideo
      ? `<video class="tools-thumb-video" src="${g.video}" autoplay muted loop playsinline ${g.image ? `poster="${g.image}"` : ''} onerror="toolsThumbFallback(this)"></video>
         <button class="tools-thumb-playbtn" onclick="toolsToggleVideoPlay(event, this)"><i class="fa-solid fa-pause"></i></button>`
      : `<img class="tools-thumb-img" src="${g.image}" alt="${toolsEsc(g.title)}" loading="lazy" onerror="toolsThumbFallback(this)">`;
    return `
    <div class="tools-card gfx-card">
      <div class="tools-thumb-wrap" onclick='toolsOpenLightbox(${JSON.stringify(src)}, ${JSON.stringify(g.title)})'>
        ${media}
      </div>
      <div class="tools-card-body">
        <div class="tools-card-title">${toolsEsc(g.title)}</div>
        <div class="tools-card-actions">
          <button class="tools-btn-download" onclick="toolsForceDownload('${src}', '${toolsSlug(g.title)}.${isVideo ? 'mp4' : 'png'}')"><i class="fa-solid fa-download"></i> Download</button>
        </div>
      </div>
    </div>
  `;
  }).join('');
}

// Kalau link gambar/video gagal dimuat (mis. link Pinterest bukan direct-link,
// atau hotlink diblokir), tampilin placeholder yang rapi + hint di console.
function toolsThumbFallback(el) {
  const wrap = el.closest('.tools-thumb-wrap');
  if (!wrap || wrap.querySelector('.tools-thumb-broken')) return;
  el.style.display = 'none';
  wrap.insertAdjacentHTML('beforeend', `<div class="tools-thumb-broken"><i class="fa-solid fa-triangle-exclamation"></i><span>Link gagal dimuat</span></div>`);
  console.warn('[HANAMORI] Gagal load media:', el.src, '— kalau ini link Pinterest, pastikan itu link gambar langsung (i.pinimg.com/...), bukan link halaman pin (pinterest.com/pin/...).');
}

// ===== RENDER: BACKGROUND GFX (data: BACKGROUND_GFX dari backgroundgfx.js) =====
// Sama kayak Bahan GFX: boleh isi "image" (statis) atau "video" (autoplay/loop)
function renderToolsBg() {
  const input = document.getElementById('toolsSearchBg');
  const grid = document.getElementById('toolsBgGrid');
  if (!grid || typeof BACKGROUND_GFX === 'undefined') return;
  const q = (input ? input.value : '').toLowerCase();
  const filtered = BACKGROUND_GFX.filter(b => b.title.toLowerCase().includes(q));
  if (!filtered.length) { grid.innerHTML = toolsEmptyState('fa-mountain-sun', 'Belum ada background GFX'); return; }

  grid.innerHTML = filtered.map(b => {
    const isVideo = !!b.video;
    const src = isVideo ? b.video : b.image;
    const media = isVideo
      ? `<video class="tools-thumb-video" src="${b.video}" autoplay muted loop playsinline ${b.image ? `poster="${b.image}"` : ''} onerror="toolsThumbFallback(this)"></video>
         <button class="tools-thumb-playbtn" onclick="toolsToggleVideoPlay(event, this)"><i class="fa-solid fa-pause"></i></button>`
      : `<img class="tools-thumb-img" src="${b.image}" alt="${toolsEsc(b.title)}" loading="lazy" onerror="toolsThumbFallback(this)">`;
    return `
    <div class="tools-card bg-card">
      <div class="tools-thumb-wrap" onclick='toolsOpenLightbox(${JSON.stringify(src)}, ${JSON.stringify(b.title)})'>
        ${media}
      </div>
      <div class="tools-card-body">
        <div class="tools-card-title">${toolsEsc(b.title)}</div>
        <div class="tools-card-actions">
          <button class="tools-btn-download" onclick="toolsForceDownload('${src}', '${toolsSlug(b.title)}.${isVideo ? 'mp4' : 'png'}')"><i class="fa-solid fa-download"></i> Download</button>
        </div>
      </div>
    </div>
  `;
  }).join('');
}

// ===== DOWNLOAD DARI LINK (semua platform, via /api/download) =====
async function toolsDownloadByLink() {
  const input = document.getElementById('toolsLinkInput');
  const btn = document.getElementById('toolsLinkBtn');
  const resultBox = document.getElementById('toolsLinkResult');
  if (!input || !btn || !resultBox) return;

  const url = input.value.trim();
  if (!url) { toolsToast('Tempel link-nya dulu ya'); return; }
  if (!/^https?:\/\//i.test(url)) { toolsToast('Link harus diawali http:// atau https://'); return; }

  const original = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Proses...';
  resultBox.innerHTML = '';

  try {
    const res = await fetch('/api/download', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error(json.message || 'Gagal ambil data dari server');
    toolsRenderLinkResult(json.data, url);
  } catch (e) {
    resultBox.innerHTML = `<div class="tools-link-error"><i class="fa-solid fa-triangle-exclamation"></i> Gagal proses link: ${toolsEsc(e.message)}. Coba <a href="${url}" target="_blank">buka manual</a> atau cek lagi link-nya.</div>`;
    toolsToast('Gagal proses link');
  } finally {
    btn.disabled = false;
    btn.innerHTML = original;
  }
}

// Cari semua field berisi URL di dalam response (struktur tiap provider beda-beda,
// jadi di-scan rekursif biar fleksibel apapun bentuk JSON-nya)
function toolsExtractMediaLinks(obj, results = [], seen = new Set()) {
  if (!obj || typeof obj !== 'object') return results;
  for (const [key, val] of Object.entries(obj)) {
    if (typeof val === 'string' && /^https?:\/\//i.test(val) && !seen.has(val)) {
      seen.add(val);
      results.push({ label: toolsPrettyLabel(key), url: val });
    } else if (Array.isArray(val)) {
      val.forEach((item, i) => {
        if (typeof item === 'string' && /^https?:\/\//i.test(item) && !seen.has(item)) {
          seen.add(item);
          results.push({ label: `${toolsPrettyLabel(key)} ${i + 1}`, url: item });
        } else if (item && typeof item === 'object') {
          toolsExtractMediaLinks(item, results, seen);
        }
      });
    } else if (val && typeof val === 'object') {
      toolsExtractMediaLinks(val, results, seen);
    }
  }
  return results;
}
function toolsPrettyLabel(key) {
  return String(key).replace(/[_-]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function toolsRenderLinkResult(data, originalUrl) {
  const resultBox = document.getElementById('toolsLinkResult');
  const obj = (data && typeof data === 'object') ? data : {};
  const title = obj.title || obj.desc || obj.description || obj.caption || 'Media ditemukan';
  const thumb = obj.thumbnail || obj.cover || obj.thumb || obj.image || '';

  // buang link .m3u8 (stream, gak bisa didownload langsung sebagai file)
  const links = toolsExtractMediaLinks(obj).filter(l => !/\.m3u8(\?|$)/i.test(l.url));

  if (!links.length) {
    resultBox.innerHTML = `<div class="tools-link-error"><i class="fa-solid fa-circle-exclamation"></i> Link ketemu tapi gak ada media yang bisa didownload otomatis. <a href="${originalUrl}" target="_blank">Buka manual</a></div>`;
    return;
  }

  resultBox.innerHTML = `
    <div class="tools-link-card">
      ${thumb ? `<img class="tools-link-thumb" src="${thumb}" alt="thumbnail" onerror="this.style.display='none'">` : ''}
      <div class="tools-link-info">
        <div class="tools-link-title">${toolsEsc(title)}</div>
        <div class="tools-link-btns">
          ${links.slice(0, 6).map((l, i) => `
            <div class="tools-link-btn-row">
              <button class="tools-btn-download" onclick='toolsForceDownload(${JSON.stringify(l.url)}, "download-${Date.now()}-${i}.mp4")'><i class="fa-solid fa-download"></i> ${toolsEsc(l.label)}</button>
              <button class="tools-btn-outline" title="Salin link — buat ditaruh di bahangfx.js/backgroundgfx.js" onclick='toolsCopyLink(this, ${JSON.stringify(l.url)})'><i class="fa-solid fa-copy"></i></button>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

// Salin link media (bukan download) — biar gampang dipaste langsung ke
// "image"/"video" di bahangfx.js atau backgroundgfx.js, gak perlu buka link
// manual terus klik kanan "Copy image address" lagi.
async function toolsCopyLink(btn, url) {
  const original = btn.innerHTML;
  try {
    await navigator.clipboard.writeText(url);
    btn.innerHTML = '<i class="fa-solid fa-check"></i>';
    toolsToast('Link disalin! Tinggal paste ke bahangfx.js / backgroundgfx.js');
  } catch (e) {
    // Fallback kalau Clipboard API gak diizinkan (mis. bukan HTTPS)
    window.prompt('Copy link ini manual (Ctrl+C / tekan lama lalu Salin):', url);
  } finally {
    setTimeout(() => { btn.innerHTML = original; }, 1500);
  }
}

// ===== LIGHTBOX (preview gambar GFX / Background) =====
function toolsOpenLightbox(src, title) {
  document.getElementById('toolsLightboxImg').src = src;
  document.getElementById('toolsLightboxTitle').textContent = title;
  const dlBtn = document.getElementById('toolsLightboxDownloadBtn');
  dlBtn.onclick = () => toolsForceDownload(src, toolsSlug(title) + '.png');
  document.getElementById('toolsLightbox').classList.add('show');
}
function toolsCloseLightbox(e) {
  if (e.target.id === 'toolsLightbox' || e.target.closest('.tools-btn-close')) {
    document.getElementById('toolsLightbox').classList.remove('show');
  }
}
