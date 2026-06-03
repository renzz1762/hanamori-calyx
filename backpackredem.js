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
    "HC6822026": {
    label: "SCRIPT PULAU APUNG",
    files: [
      {
        name: "Script PULAU APUNG",
        filename: "pulau-apung.lua",
        desc: "SCRIPT PULAU APUNG VERSI SIMPLE",
        content: `local centerPart = script.Parent
local terrain = workspace.Terrain

-- WARNA
terrain:SetMaterialColor(Enum.Material.Snow, Color3.fromRGB(220, 238, 255))
terrain:SetMaterialColor(Enum.Material.Asphalt, Color3.fromRGB(30, 30, 35))
terrain:SetMaterialColor(Enum.Material.Glacier, Color3.fromRGB(180, 215, 255))

-- =========================
-- PULAU
-- =========================
local RADIUS = 120
local BASE_THICKNESS = 25
local RESOLUTION = 4

-- =========================
-- JALAN LURUS
-- =========================
local ROAD_WIDTH = 22
local EDGE_SOFTNESS = 8

-- =========================
-- BUKIT
-- =========================
local HILL_HEIGHT = 28
local ROAD_OFFSET_HILL = 6

-- =========================
-- BAWAH
-- =========================
local BASE_DEPTH = 160
local EDGE_SMOOTH = 35
local SHAPE_POWER = 1.4

-- =========================
-- SNOW
-- =========================
local ROAD_SNOW_THICKNESS = 0.8   -- super tipis kaya tisu
local BOTTOM_SNOW_THICKNESS = 3   -- snow di bawah pulau

-- =========================
local FINAL_TEXT = "Pulau Milik HANAMORI CALYX"

if FINAL_TEXT ~= "Pulau Milik HANAMORI CALYX" then
    error("SCRIPT DI UBAH! DILARANG EDIT!")
end

-- =========================
local function smoothstep(t)
    return t * t * (3 - 2 * t)
end

local function smootherstep(t)
    return t * t * t * (t * (t * 6 - 15) + 10)
end

-- Jalan lurus tengah (sumbu Z)
local function getRoadFactor(x, z)
    local half = ROAD_WIDTH / 2
    local dist = math.abs(x)  -- jarak dari sumbu X=0 (jalan lurus arah Z)
    if dist < half then
        return 1
    elseif dist < half + EDGE_SOFTNESS then
        local t = (dist - half) / EDGE_SOFTNESS
        return 1 - smoothstep(t)
    end
    return 0
end

-- =========================
-- BENTUK PULAU APUNG LEBIH BAGUS
-- Tepi rata, tengah sedikit naik, bawah mengerucut runcing
-- =========================
local function getEdgeFade(dist)
    if dist > (RADIUS - EDGE_SMOOTH) then
        local et = (dist - (RADIUS - EDGE_SMOOTH)) / EDGE_SMOOTH
        return 1 - smootherstep(et)
    end
    return 1
end

local function getHillShape(dist, roadFactor)
    local safeRoad = math.clamp((1 - roadFactor) - (ROAD_OFFSET_HILL / 20), 0, 1)
    local t = smoothstep(safeRoad)
    -- Dome halus, lebih flat di pinggir
    local shape = 1 - (dist / RADIUS)^2.5
    shape = math.clamp(shape, 0, 1)
    shape = smootherstep(shape)
    return shape * HILL_HEIGHT * t
end

-- =========================
-- GENERATE
-- =========================
local function generateIsland()
    local center = centerPart.Position
    centerPart.Transparency = 1
    centerPart.Anchored = true
    centerPart.CanCollide = false
    
    for x = -RADIUS, RADIUS, RESOLUTION do
        for z = -RADIUS, RADIUS, RESOLUTION do
            local dist = math.sqrt(x^2 + z^2)
            if dist <= RADIUS then
                local worldX = center.X + x
                local worldZ = center.Z + z
                local roadFactor = getRoadFactor(x, z)
                local isRoad = roadFactor > 0.5
                
                local hillHeight = getHillShape(dist, roadFactor)
                local edgeFade = getEdgeFade(dist)
                local finalThickness = (BASE_THICKNESS * edgeFade) + hillHeight
                
                if finalThickness > 1 then
                    local material = isRoad and Enum.Material.Asphalt or Enum.Material.Snow
                    
                    local yOffset = hillHeight / 2
                    local topY = center.Y + yOffset + (BASE_THICKNESS / 2)
                    local newCenterY = topY - (finalThickness / 2)
                    local bottomY = newCenterY - (finalThickness / 2)
                    
                    -- LAPISAN ATAS (Snow / Jalan)
                    terrain:FillBlock(
                    CFrame.new(worldX, newCenterY, worldZ),
                    Vector3.new(RESOLUTION, finalThickness, RESOLUTION),
                    material
                    )
                    
                    -- 🌨️ SNOW TIPIS DI ATAS JALAN (kaya tisu)
                    if isRoad then
                        local snowY = topY + (ROAD_SNOW_THICKNESS / 2)
                        terrain:FillBlock(
                        CFrame.new(worldX, snowY, worldZ),
                        Vector3.new(RESOLUTION, ROAD_SNOW_THICKNESS, RESOLUTION),
                        Enum.Material.Snow
                        )
                    end
                    
                    -- =========================
                    -- BAWAH PULAU APUNG
                    -- Layer: Snow tipis → Glacier → Basalt runcing
                    -- =========================
                    local taper = dist / RADIUS
                    local shapeBase = (1 - taper)^SHAPE_POWER
                    local depth = BASE_DEPTH * shapeBase
                    
                    if depth > 2 then
                        -- 🌨️ Snow tipis paling bawah permukaan atas bawah
                        terrain:FillBlock(
                        CFrame.new(worldX, bottomY - (BOTTOM_SNOW_THICKNESS / 2), worldZ),
                        Vector3.new(RESOLUTION, BOTTOM_SNOW_THICKNESS, RESOLUTION),
                        Enum.Material.Snow
                        )
                        
                        -- Es Glacier (lapisan tengah bawah)
                        local glacierDepth = math.min(depth * 0.25, 18)
                        local glacierY = bottomY - BOTTOM_SNOW_THICKNESS - (glacierDepth / 2)
                        terrain:FillBlock(
                        CFrame.new(worldX, glacierY, worldZ),
                        Vector3.new(RESOLUTION, glacierDepth, RESOLUTION),
                        Enum.Material.Glacier
                        )
                        
                        -- Basalt inti (paling bawah, runcing)
                        local basaltDepth = depth - BOTTOM_SNOW_THICKNESS - glacierDepth
                        if basaltDepth > 2 then
                            local basaltY = bottomY - BOTTOM_SNOW_THICKNESS - glacierDepth - (basaltDepth / 2)
                            terrain:FillBlock(
                            CFrame.new(worldX, basaltY, worldZ),
                            Vector3.new(RESOLUTION, basaltDepth, RESOLUTION),
                            Enum.Material.Basalt
                            )
                        end
                    end
                end
            end
        end
        task.wait()
    end
end

-- RUN
generateIsland()

print(FINAL_TEXT)
print("Script By HANAMORI CALYX")

`
      },
      {
        name: "CARA PASANG SCRIPT",
        filename: "CARA PASANB",
        desc: "INI ADALAH BERUBA INFORMASI PEMASANGAN SCRIPT",
        content: `
CARA PASANG SCRIPT HD GRAFICK :
1 BIKIN PART TRUS BIKIN SCRIPT DI DALEM PART
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
