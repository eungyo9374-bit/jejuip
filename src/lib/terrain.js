// 3D 제주 지형 — 고도 격자(jeju-elev.json)와 해안선으로 땅 모양과 색을 만들어요.
// 고도 자료: Open-Meteo Elevation API (Copernicus DEM, 약 1.2km 간격으로 한 번 받아 저장)
import * as THREE from 'three'
import ELEV from '../data/jeju-elev.json'
import MAP from '../data/jeju-map.json'
import COAST from '../data/jeju-coast-detail.json'

const KX = Math.cos((33.4 * Math.PI) / 180)
const U = 30                         // 위도 1도 = 3D 단위 30
export const EXAG = 1.0              // 높이 1km = 3D 단위 1.0 (실제보다 약 3.7배 과장)
export const toXZ = (lng, lat) => [(lng - 126.55) * KX * U, (33.38 - lat) * U]

// 땅 모양(고리): 본섬은 자세한 해안선, 나머지 섬은 지도 데이터 (추자도는 너무 멀어서 제외)
const islands = MAP.rings.filter((r) => !r.main && r.pts.every((p) => p[1] < 33.8)).map((r) => r.pts)
export const LAND_RINGS = [COAST, ...islands]

const BOX = { x0: 126.14, x1: 126.98, y0: 33.18, y1: 33.58 }

function inside(ring, x, y) {
  let c = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j]
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c
  }
  return c
}
const RING_BOX = LAND_RINGS.map((r) => {
  const xs = r.map((p) => p[0]), ys = r.map((p) => p[1])
  return { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) }
})
const isLand = (lng, lat) => LAND_RINGS.some((r, i) => {
  const b = RING_BOX[i]
  return lng >= b.x0 && lng <= b.x1 && lat >= b.y0 && lat <= b.y1 && inside(r, lng, lat)
})

// 고도(미터): 격자 4점을 이어서 계산
export function elevAt(lng, lat) {
  const { lng0, lat0, dLng, dLat, nx, ny, h } = ELEV
  const fx = Math.min(Math.max((lng - lng0) / dLng, 0), nx - 1.001)
  const fy = Math.min(Math.max((lat - lat0) / dLat, 0), ny - 1.001)
  const i = Math.floor(fx), j = Math.floor(fy), tx = fx - i, ty = fy - j
  const a = h[j * nx + i], b = h[j * nx + i + 1], c = h[(j + 1) * nx + i], d = h[(j + 1) * nx + i + 1]
  return (a * (1 - tx) + b * tx) * (1 - ty) + (c * (1 - tx) + d * tx) * ty
}
// 3D 높이 (바다에서는 0)
export const heightAt = (lng, lat) => Math.max(elevAt(lng, lat), 0) * EXAG / 1000

// 높이에 따른 색: 낮은 곳 연두 → 중턱 황록 → 높은 곳 바위색
const STOPS = [[0, [0.84, 0.89, 0.71]], [250, [0.74, 0.83, 0.57]], [700, [0.66, 0.74, 0.48]], [1200, [0.67, 0.63, 0.5]], [1700, [0.82, 0.79, 0.72]]]
function landColor(m) {
  for (let i = 1; i < STOPS.length; i++) {
    if (m <= STOPS[i][0]) {
      const [m0, c0] = STOPS[i - 1], [m1, c1] = STOPS[i], t = (m - m0) / (m1 - m0)
      return c0.map((v, k) => v + (c1[k] - v) * t)
    }
  }
  return STOPS[STOPS.length - 1][1]
}
const SEA_FLOOR = [0.62, 0.8, 0.88]

// 땅 모양 한 장 (섬 + 바다 밑바닥)
export function buildTerrain() {
  const NX = 300, NY = 143
  const pos = new Float32Array(NX * NY * 3), col = new Float32Array(NX * NY * 3)
  for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) {
    const lng = BOX.x0 + ((BOX.x1 - BOX.x0) * i) / (NX - 1)
    const lat = BOX.y1 - ((BOX.y1 - BOX.y0) * j) / (NY - 1)
    const land = isLand(lng, lat)
    const m = land ? Math.max(elevAt(lng, lat), 0) : 0
    const [x, z] = toXZ(lng, lat)
    const k = (j * NX + i) * 3
    pos[k] = x; pos[k + 1] = land ? m * EXAG / 1000 + 0.03 : -0.14; pos[k + 2] = z
    const c = land ? landColor(m) : SEA_FLOOR
    col[k] = c[0]; col[k + 1] = c[1]; col[k + 2] = c[2]
  }
  const idx = new Uint32Array((NX - 1) * (NY - 1) * 6)
  let n = 0
  for (let j = 0; j < NY - 1; j++) for (let i = 0; i < NX - 1; i++) {
    const a = j * NX + i, b = a + 1, c = a + NX, d = c + 1
    idx[n++] = a; idx[n++] = c; idx[n++] = b
    idx[n++] = b; idx[n++] = c; idx[n++] = d
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  g.setAttribute('color', new THREE.BufferAttribute(col, 3))
  g.setIndex(new THREE.BufferAttribute(idx, 1))
  g.computeVertexNormals()
  return g
}
