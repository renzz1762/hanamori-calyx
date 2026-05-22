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
  "HC4372026": {
    label: "SCRIPT HD GRAFICK",
    files: [
      {
        name: "Script HD GRAFICK",
        filename: "hd_grafick.lua",
        desc: "SCRIPT HD GRAFICK VERSI SIMPLE",
        content: `--INSTRUCTIONS:
--MOVE THIS SCRIPT INTO ServerScriptService!
--THAT'S ALL!
--THANKS FOR USING MY SCRIPT! (:

local Lighting = game:GetService("Lighting")
local StarterGui = game:GetService("StarterGui")

-- Hapus efek lama tapi JANGAN hapus Sky
for i, v in pairs(Lighting:GetChildren()) do
    if v:IsA("BloomEffect") or v:IsA("BlurEffect") or v:IsA("ColorCorrectionEffect") 
        or v:IsA("SunRaysEffect") or v:IsA("Atmosphere") or v:IsA("DepthOfFieldEffect") then
        v:Destroy()
    end
    -- Sky tidak dihapus!
end

-- Buat efek baru
local Bloom = Instance.new("BloomEffect")
local Blur = Instance.new("BlurEffect")
local ColorCor = Instance.new("ColorCorrectionEffect")
local SunRays = Instance.new("SunRaysEffect")
local Atm = Instance.new("Atmosphere")
local DepthOfField = Instance.new("DepthOfFieldEffect")

Bloom.Parent = Lighting
Blur.Parent = Lighting
ColorCor.Parent = Lighting
SunRays.Parent = Lighting
Atm.Parent = Lighting
DepthOfField.Parent = Lighting

-- HD Bloom Settings (dikurangi agar tidak silau)
Bloom.Intensity = 0.2
Bloom.Size = 16
Bloom.Threshold = 1

-- HD Blur (subtle for realism)
Blur.Size = 1.5

-- HD Color Correction
ColorCor.Brightness = 0
ColorCor.Contrast = 0.2
ColorCor.Saturation = 0.1
ColorCor.TintColor = Color3.fromRGB(255, 255, 255)

-- HD Sun Rays (dikurangi agar tidak silau)
SunRays.Intensity = 0.05
SunRays.Spread = 0.1

-- HD Lighting Settings
Lighting.Ambient = Color3.fromRGB(135, 135, 135)
Lighting.Brightness = 2
Lighting.ColorShift_Bottom = Color3.fromRGB(0, 0, 0)
Lighting.ColorShift_Top = Color3.fromRGB(240, 240, 240)
Lighting.EnvironmentDiffuseScale = 0.4
Lighting.EnvironmentSpecularScale = 0.4
Lighting.GlobalShadows = true
Lighting.OutdoorAmbient = Color3.fromRGB(127, 127, 127)
Lighting.ShadowSoftness = 0.15
Lighting.ClockTime = 14
Lighting.GeographicLatitude = 41.73
Lighting.ExposureCompensation = 0
 
-- HD Atmosphere (dikurangi Glare)
Atm.Density = 0.3
Atm.Offset = 0.25
Atm.Color = Color3.fromRGB(199, 199, 210)
Atm.Decay = Color3.fromRGB(106, 112, 125)
Atm.Glare = 0
Atm.Haze = 1.5
 
-- Depth of Field for HD realism
DepthOfField.FarIntensity = 0.1
DepthOfField.FocusDistance = 0.05
DepthOfField.InFocusRadius = 50
DepthOfField.NearIntensity = 0.75

--delete the script after the lighting is done!
script:Destroy()
`
      },
      {
        name: "CARA PASANG SCRIPT",
        filename: "CARA PASANB",
        desc: "INI ADALAH BERUBA INFORMASI PEMASANGAN SCRIPT",
        content: `
CARA PASANG SCRIPT HD GRAFICK :
1 CARI ServerScriptService TRUS BIKIN Script/Naskah
2 TRUS TEMPEL SCRIPT YANG AKU KASIH TADI

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
