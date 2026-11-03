// 3D 제주 지형 — 고도 격자(jeju-terrain.json)로 땅 모양·색·물빛을 만들어요.
// 고도 자료: AWS Open Data Terrain Tiles(Mapzen, SRTM 등) 약 0.28km 격자 / 바다는 해안까지 거리로 깊이와 물빛을 정해요
import * as THREE from 'three'
import T from '../data/jeju-terrain.json'
import MAP from '../data/jeju-map.json'
import COAST from '../data/jeju-coast-detail.json'

const KX = Math.cos((33.4 * Math.PI) / 180)
const U = 30                         // 위도 1도 = 3D 단위 30
export const EXAG = 1.0              // 높이 1km = 3D 단위 1.0 (실제보다 약 3.7배 과장)
export const LIFT = 0.012            // 바닷가 땅을 물 위로 살짝 띄우는 높이
export const SEABED_Y = -0.33
export const toXZ = (lng, lat) => [(lng - 126.55) * KX * U, (33.38 - lat) * U]
export const fromXZ = (x, z) => [x / (KX * U) + 126.55, 33.38 - z / U]

// 해안선 고리: 본섬은 자세한 해안선, 나머지 섬은 지도 데이터 (추자도는 너무 멀어서 제외)
const islands = MAP.rings.filter((r) => !r.main && r.pts.every((p) => p[1] < 33.8)).map((r) => r.pts)
export const LAND_RINGS = [COAST, ...islands]

// 격자 값 → 3D 높이. 땅은 고도, 바다는 해안에서 멀수록 깊게 (해안선이 계단 없이 매끈해져요)
const yOf = (v) => (v >= 0 ? LIFT + (v * EXAG) / 1000 : -(LIFT + Math.min(-v * 10, 2500) * 0.00012))
const Y = Float32Array.from(T.v, yOf)

function sample(arr, lng, lat) {
  const fx = Math.min(Math.max((lng - T.lng0) / T.dLng, 0), T.nx - 1.001)
  const fy = Math.min(Math.max((lat - T.lat0) / T.dLat, 0), T.ny - 1.001)
  const i = Math.floor(fx), j = Math.floor(fy), tx = fx - i, ty = fy - j, n = T.nx
  const a = arr[j * n + i], b = arr[j * n + i + 1], c = arr[(j + 1) * n + i], d = arr[(j + 1) * n + i + 1]
  return (a * (1 - tx) + b * tx) * (1 - ty) + (c * (1 - tx) + d * tx) * ty
}
// 땅 위 높이(바다면 0) — 코스 선·핀을 땅에 붙일 때 써요
export const heightAt = (lng, lat) => Math.max(sample(Y, lng, lat), 0)

// 해안에서 떨어진 거리(m) — 땅이면 0 (배를 띄울 자리 고를 때 써요)
export function seaDistAt(lng, lat) {
  const i = Math.round((lng - T.lng0) / T.dLng), j = Math.round((lat - T.lat0) / T.dLat)
  if (i < 0 || j < 0 || i >= T.nx || j >= T.ny) return 3000
  const v = T.v[j * T.nx + i]
  return v >= 0 ? 0 : -v * 10
}

// 땅 색: 바닷가 모래 → 들판 → 숲 → 관목 → 바위 (수채화 느낌의 따뜻한 톤)
const hex = (h) => { const c = new THREE.Color(h); return [c.r, c.g, c.b] }
const LAND = [[0, '#eadcb6'], [12, '#e2e2b8'], [150, '#d0dca2'], [400, '#afc485'], [800, '#8fae72'], [1150, '#9a9f74'], [1450, '#bcab88'], [1800, '#d9cdbb']].map(([m, h]) => [m, hex(h)])
const SEA = [[0, '#dcebd9'], [150, '#c0e0e0'], [600, '#9fcfdd'], [1500, '#86bdd3'], [2500, '#78b0c9']].map(([m, h]) => [m, hex(h)])
export const DEEP_SEA = '#78b0c9'
function ramp(stops, m) {
  for (let i = 1; i < stops.length; i++) {
    if (m <= stops[i][0]) {
      const [m0, c0] = stops[i - 1], [m1, c1] = stops[i], t = (m - m0) / (m1 - m0)
      return c0.map((v, k) => v + (c1[k] - v) * t)
    }
  }
  return stops[stops.length - 1][1]
}

// 땅 + 바다 밑바닥을 한 장의 그물(mesh)로
export function buildTerrain() {
  const { nx, ny, lng0, lat0, dLng, dLat, v } = T
  const pos = new Float32Array(nx * ny * 3), col = new Float32Array(nx * ny * 3), uv = new Float32Array(nx * ny * 2)
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    const n = j * nx + i, k = n * 3
    const [x, z] = toXZ(lng0 + i * dLng, lat0 + j * dLat)
    pos[k] = x; pos[k + 1] = Y[n]; pos[k + 2] = z
    const c = v[n] >= 0 ? ramp(LAND, v[n]) : ramp(SEA, -v[n] * 10)
    col[k] = c[0]; col[k + 1] = c[1]; col[k + 2] = c[2]
    uv[n * 2] = (i / (nx - 1)) * 14; uv[n * 2 + 1] = (j / (ny - 1)) * 10
  }
  const idx = new Uint32Array((nx - 1) * (ny - 1) * 6)
  let p = 0
  for (let j = 0; j < ny - 1; j++) for (let i = 0; i < nx - 1; i++) {
    const a = j * nx + i, b = a + 1, c = a + nx, d = c + 1
    idx[p++] = a; idx[p++] = b; idx[p++] = c
    idx[p++] = b; idx[p++] = d; idx[p++] = c
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  g.setAttribute('color', new THREE.BufferAttribute(col, 3))
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2))
  g.setIndex(new THREE.BufferAttribute(idx, 1))
  g.computeVertexNormals()
  return g
}

// 땅 재질: 종이결 + 등고선(100m 가늘게, 500m 진하게) + 비에 젖은 색 + 눈 쌓임
export function terrainMaterial(fx, paper) {
  const m = new THREE.MeshStandardMaterial({ vertexColors: true, map: paper, roughness: 0.95, metalness: 0 })
  m.onBeforeCompile = (s) => {
    s.uniforms.uSnow = fx.uSnow
    s.uniforms.uWet = fx.uWet
    s.vertexShader = 'varying float vH;\n' + s.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvH = position.y;')
    s.fragmentShader = 'varying float vH;\nuniform float uSnow;\nuniform float uWet;\n' + s.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
      float hm = (vH - ${LIFT.toFixed(4)}) / ${EXAG.toFixed(2)} * 1000.0;
      if (hm > 4.0) {
        float c1 = hm / 100.0;
        float l1 = 1.0 - min(abs(fract(c1 - 0.5) - 0.5) / max(fwidth(c1), 1e-4), 1.0);
        float c5 = hm / 500.0;
        float l5 = 1.0 - min(abs(fract(c5 - 0.5) - 0.5) / max(fwidth(c5) * 1.7, 1e-4), 1.0);
        diffuseColor.rgb *= 1.0 - 0.12 * l1 - 0.2 * l5;
        float snowLine = mix(2300.0, 420.0, uSnow);
        float sn = smoothstep(snowLine - 140.0, snowLine + 140.0, hm) * uSnow;
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.97, 0.975, 0.98), sn);
      }
      diffuseColor.rgb *= mix(1.0, 0.8, uWet);`)
  }
  m.customProgramCacheKey = () => 'jeju-terrain'
  return m
}

// ── 손그림 질감 (캔버스로 직접 그려요) ─────────────────────
const canvas = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')] }

// 종이결: 부드러운 얼룩 + 고운 알갱이
export function paperTexture() {
  const [small, sg] = canvas(24, 24)
  const img = sg.createImageData(24, 24)
  for (let i = 0; i < 24 * 24; i++) { const g = 228 + Math.random() * 27; img.data.set([g, g, g - 4, 255], i * 4) }
  sg.putImageData(img, 0, 0)
  const [c, g] = canvas(256, 256)
  g.imageSmoothingEnabled = true
  g.drawImage(small, 0, 0, 256, 256)
  const grain = g.getImageData(0, 0, 256, 256)
  for (let i = 0; i < 256 * 256; i++) { const d = (Math.random() - 0.5) * 16; for (let k = 0; k < 3; k++) grain.data[i * 4 + k] = Math.min(255, grain.data[i * 4 + k] + d) }
  g.putImageData(grain, 0, 0)
  const t = new THREE.CanvasTexture(c)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 4
  return t
}

// 물결 붓질: 짧은 흰 곡선들
export function waveTexture() {
  const [c, g] = canvas(256, 256)
  g.strokeStyle = 'rgba(255,255,255,0.75)'; g.lineCap = 'round'
  for (let i = 0; i < 26; i++) {
    const x = Math.random() * 256, y = Math.random() * 256, w = 10 + Math.random() * 16
    g.lineWidth = 1.2 + Math.random() * 1.3
    for (const ox of [0, -256, 256]) for (const oy of [0, -256, 256]) {
      g.beginPath(); g.moveTo(x + ox - w, y + oy); g.quadraticCurveTo(x + ox, y + oy - 5, x + ox + w, y + oy); g.stroke()
    }
  }
  const t = new THREE.CanvasTexture(c)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.anisotropy = 4
  return t
}

// 둥근 솜뭉치(구름·눈송이)
export function puffTexture(soft = 0.55) {
  const [c, g] = canvas(128, 128)
  const r = g.createRadialGradient(64, 64, 0, 64, 64, 62)
  r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(soft, 'rgba(255,255,255,0.75)'); r.addColorStop(1, 'rgba(255,255,255,0)')
  g.fillStyle = r; g.fillRect(0, 0, 128, 128)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}
