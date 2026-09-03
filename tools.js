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
async function toolsForceDownload(url, filename) {
  try {
    const res = await fetch(url, { mode: 'cors' });
    if (!res.ok) throw new Error('fetch gagal');
    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(blobUrl);
    toolsToast('Download berhasil!');
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
      <div class="tools-thumb-wrap">
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

  filtered.forEach(toolsLoadThumb);
}

// ===== RENDER: BAHAN GFX (data: BAHAN_GFX dari bahangfx.js) =====
function renderToolsGfx() {
  const input = document.getElementById('toolsSearchGfx');
  const grid = document.getElementById('toolsGfxGrid');
  if (!grid || typeof BAHAN_GFX === 'undefined') return;
  const q = (input ? input.value : '').toLowerCase();
  const filtered = BAHAN_GFX.filter(g => g.title.toLowerCase().includes(q));
  if (!filtered.length) { grid.innerHTML = toolsEmptyState('fa-layer-group', 'Belum ada bahan GFX'); return; }

  grid.innerHTML = filtered.map(g => `
    <div class="tools-card gfx-card">
      <div class="tools-thumb-wrap" onclick='toolsOpenLightbox(${JSON.stringify(g.image)}, ${JSON.stringify(g.title)})'>
        <img class="tools-thumb-img" src="${g.image}" alt="${toolsEsc(g.title)}" loading="lazy">
      </div>
      <div class="tools-card-body">
        <div class="tools-card-title">${toolsEsc(g.title)}</div>
        <div class="tools-card-actions">
          <button class="tools-btn-download" onclick="toolsForceDownload('${g.image}', '${toolsSlug(g.title)}.png')"><i class="fa-solid fa-download"></i> Download</button>
        </div>
      </div>
    </div>
  `).join('');
}

// ===== RENDER: BACKGROUND GFX (data: BACKGROUND_GFX dari backgroundgfx.js) =====
function renderToolsBg() {
  const input = document.getElementById('toolsSearchBg');
  const grid = document.getElementById('toolsBgGrid');
  if (!grid || typeof BACKGROUND_GFX === 'undefined') return;
  const q = (input ? input.value : '').toLowerCase();
  const filtered = BACKGROUND_GFX.filter(b => b.title.toLowerCase().includes(q));
  if (!filtered.length) { grid.innerHTML = toolsEmptyState('fa-mountain-sun', 'Belum ada background GFX'); return; }

  grid.innerHTML = filtered.map(b => `
    <div class="tools-card bg-card">
      <div class="tools-thumb-wrap" onclick='toolsOpenLightbox(${JSON.stringify(b.image)}, ${JSON.stringify(b.title)})'>
        <img class="tools-thumb-img" src="${b.image}" alt="${toolsEsc(b.title)}" loading="lazy">
      </div>
      <div class="tools-card-body">
        <div class="tools-card-title">${toolsEsc(b.title)}</div>
        <div class="tools-card-actions">
          <button class="tools-btn-download" onclick="toolsForceDownload('${b.image}', '${toolsSlug(b.title)}.png')"><i class="fa-solid fa-download"></i> Download</button>
        </div>
      </div>
    </div>
  `).join('');
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
          ${links.slice(0, 6).map((l, i) => `<button class="tools-btn-download" onclick='toolsForceDownload(${JSON.stringify(l.url)}, "download-${Date.now()}-${i}.mp4")'><i class="fa-solid fa-download"></i> ${toolsEsc(l.label)}</button>`).join('')}
        </div>
      </div>
    </div>
  `;
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
