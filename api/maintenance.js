/* ================================================================
   API: /api/maintenance
   Baca teks maintenance dari Environment Variable Vercel.
   - Ada isi teks di Vercel  -> maintenance NYALA
   - Kosong / tidak diset    -> maintenance MATI
================================================================ */
module.exports = (req, res) => {
  res.setHeader('Cache-Control', 'no-store, max-age=0');

  const text = (process.env.MAINTENANCE_TEXT || '').trim();
  const mode = (process.env.MAINTENANCE_MODE || 'manual').trim(); // "manual" | "auto"
  const durationHours = parseFloat(process.env.MAINTENANCE_DURATION_HOURS || '2');
  const start = (process.env.MAINTENANCE_START || '').trim();

  res.status(200).json({
    text,
    mode,
    durationHours: isNaN(durationHours) ? 2 : durationHours,
    start,
  });
};
