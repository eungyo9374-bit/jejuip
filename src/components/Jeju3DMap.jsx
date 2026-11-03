import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Line, OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { CATEGORIES, PIN_SCALE, pinGeometry } from '../lib/pinModels'
import { DEEP_SEA, LAND_RINGS, SEABED_Y, buildTerrain, fromXZ, heightAt, paperTexture, puffTexture, terrainMaterial, toXZ, waveTexture } from '../lib/terrain'

const SMALL = typeof window !== 'undefined' && window.innerWidth < 700   // 휴대폰이면 입자·그림자를 줄여요
const C = (h) => new THREE.Color(h)

// 날씨별 하늘·빛·바다·구름 (바뀔 때는 부드럽게 섞여요)
const MODES = {
  clear: { top: C('#8dbfe0'), horizon: C('#f3eee2'), near: 40, far: 120, sun: 2.6, sunColor: C('#fff0d2'), hemi: 0.55, sea: C('#a4d4e4'), cloud: C('#ffffff'), clouds: 5, wet: 0, snow: 0, wind: 0.25 },
  cloudy: { top: C('#b4bec5'), horizon: C('#e6e5e0'), near: 26, far: 85, sun: 0.9, sunColor: C('#f1f1ef'), hemi: 0.95, sea: C('#a9c0c9'), cloud: C('#eef0f0'), clouds: 14, wet: 0, snow: 0, wind: 0.4 },
  rain: { top: C('#76848f'), horizon: C('#c6cdd1'), near: 15, far: 62, sun: 0.4, sunColor: C('#dfe6ea'), hemi: 0.75, sea: C('#87a3b1'), cloud: C('#8c969d'), clouds: 16, wet: 1, snow: 0, wind: 0.8 },
  snow: { top: C('#c1c9d0'), horizon: C('#eef0f1'), near: 18, far: 70, sun: 0.75, sunColor: C('#f4f6f8'), hemi: 1.05, sea: C('#a8c1cb'), cloud: C('#e4e8eb'), clouds: 14, wet: 0, snow: 1, wind: 0.3 },
}

// 처음(전체) 시점: 화면 비율에 맞춰 섬 전체가 들어오는 거리
export const homeView = () => {
  const aspect = typeof window === 'undefined' ? 1.5 : Math.min(1.6, window.innerWidth / (window.innerHeight * 0.66))
  const dist = Math.max(18, 11.5 / (0.414 * aspect))
  return { pos: new THREE.Vector3(0, dist * 0.62, dist * 0.8), look: new THREE.Vector3(0, 0, 0) }
}

// ── 글자 상자(번호 배지·이름표): 그림으로 만들어 화면 크기 그대로 보이는 스프라이트 ──
const tagCache = new Map()
function tagTexture(text, kind) {
  const key = kind + text
  if (tagCache.has(key)) return tagCache.get(key)
  const S = 2, badge = kind !== 'label' && kind !== 'region'
  const font = `${badge ? 'bold 15px' : kind === 'region' ? 'bold 17px' : '14px'} Pretendard, "Malgun Gothic", sans-serif`
  const c = document.createElement('canvas'), g = c.getContext('2d')
  g.font = font
  const tw = g.measureText(text).width
  const w = Math.ceil(kind === 'region' ? tw + 12 : badge ? Math.max(34, tw + 16) : tw + 20), h = badge ? 34 : kind === 'region' ? 26 : 28
  c.width = w * S; c.height = h * S
  g.scale(S, S); g.font = font; g.textAlign = 'center'; g.textBaseline = 'middle'
  if (kind === 'region') {
    g.lineWidth = 4; g.lineJoin = 'round'; g.strokeStyle = 'rgba(255,250,240,0.9)'; g.strokeText(text, w / 2, h / 2 + 1)
    g.fillStyle = '#4a4743'; g.fillText(text, w / 2, h / 2 + 1)
  } else {
    g.beginPath(); g.roundRect(1.5, 1.5, w - 3, h - 3, badge ? h / 2 : 3)
    g.fillStyle = kind === 'on' ? '#e4572e' : badge ? '#fffdf8' : '#2b2926'; g.fill()
    if (badge) { g.lineWidth = 3; g.strokeStyle = kind === 'on' ? '#fffdf8' : '#2b8fd9'; g.stroke() }
    g.fillStyle = kind === 'on' || !badge ? '#ffffff' : '#3d3b37'
    g.fillText(text, w / 2, h / 2 + 1)
  }
  const map = new THREE.CanvasTexture(c)
  map.colorSpace = THREE.SRGBColorSpace
  const v = { map, aspect: w / h }
  tagCache.set(key, v)
  return v
}
function Tag({ text, kind, position, height = 0.05, opacity = 1, onClick }) {
  const { map, aspect } = useMemo(() => tagTexture(text, kind), [text, kind])
  return (
    <sprite position={position} scale={[height * aspect, height, 1]} renderOrder={10} onClick={onClick && ((e) => { e.stopPropagation(); onClick() })}>
      <spriteMaterial map={map} sizeAttenuation={false} depthTest={false} transparent opacity={opacity} />
    </sprite>
  )
}

const ptsOf = (pts, y) => pts.map(([lng, lat]) => { const [x, z] = toXZ(lng, lat); return [x, y ?? heightAt(lng, lat) + 0.05, z] })
// ── 하늘: 위는 날씨 색, 아래는 안개와 같은 색으로 번지는 둥근 천장 ──
const skyShader = {
  uniforms: { top: { value: new THREE.Color() }, horizon: { value: new THREE.Color() } },
  vertexShader: 'varying vec3 vDir; void main() { vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: 'uniform vec3 top; uniform vec3 horizon; varying vec3 vDir; void main() { float h = smoothstep(0.0, 0.5, vDir.y); gl_FragColor = vec4(mix(horizon, top, h), 1.0); }',
}

// ── 땅·바다·해안선 ──
function Land({ fx }) {
  const geo = useMemo(() => buildTerrain(), [])
  const paper = useMemo(() => paperTexture(), [])
  const mat = useMemo(() => terrainMaterial(fx, paper), [fx, paper])
  const waves = useMemo(() => { const t = waveTexture(); t.repeat.set(85, 65); return t }, [])
  // 바다 밑바닥도 땅과 같은 종이결·빛을 받아야 경계가 보이지 않아요
  const floor = useMemo(() => { const t = paper.clone(); t.repeat.set(155, 120); t.needsUpdate = true; return t }, [paper])
  useFrame((_, dt) => { waves.offset.x += dt * 0.004; waves.offset.y += dt * 0.0015 })
  const rings = useMemo(() => LAND_RINGS.map((r) => ptsOf([...r, r[0]], 0.016)), [])
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, SEABED_Y, 0]}><planeGeometry args={[260, 200]} /><meshStandardMaterial color={DEEP_SEA} map={floor} roughness={0.95} /></mesh>
      <mesh geometry={geo} material={mat} castShadow receiveShadow />
      <mesh rotation={[-Math.PI / 2, 0, 0]} renderOrder={1}>
        <planeGeometry args={[260, 200]} />
        <meshBasicMaterial ref={(m) => { fx.water = m }} transparent opacity={0.62} depthWrite={false} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.003, 0]} renderOrder={2}>
        <planeGeometry args={[260, 200]} />
        <meshBasicMaterial map={waves} transparent opacity={0.35} depthWrite={false} />
      </mesh>
      {rings.map((p, i) => <Line key={`s${i}`} points={p} color="#ffffff" lineWidth={5} transparent opacity={0.55} />)}
      {rings.map((p, i) => <Line key={`c${i}`} points={p} color="#5a5148" lineWidth={1.4} />)}
    </>
  )
}

// ── 지역 이름: 글자만 보이는 지도 라벨 ──
function Regions({ regions }) {
  return regions.map((r) => {
    const [x, z] = toXZ(r.lng, r.lat)
    return <Tag key={r.name} text={r.name} kind="region" position={[x, heightAt(r.lng, r.lat) + 0.12, z]} height={0.034} />
  })
}

// ── 명소·문화유산 핀: 종류마다 그 장소를 닮은 작은 모형(배·파라솔·탑 등)을 세워요 ──
const PIN_MAT = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.65 })
function PinLayer({ items, cat, onHover, onSelect }) {
  const ref = useRef()
  const n = items.length
  const geo = useMemo(() => pinGeometry(cat), [cat])
  useEffect(() => {
    if (!ref.current) return
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(PIN_SCALE, PIN_SCALE, PIN_SCALE), p = new THREE.Vector3()
    items.forEach((it, i) => {
      const [x, z] = toXZ(it.lng, it.lat)
      ref.current.setMatrixAt(i, m.compose(p.set(x, heightAt(it.lng, it.lat), z), q, s))
    })
    ref.current.instanceMatrix.needsUpdate = true
    ref.current.computeBoundingSphere()
  }, [items])
  if (!n) return null
  return (
    <instancedMesh key={cat + n} ref={ref} args={[geo, PIN_MAT, n]} frustumCulled={false} castShadow
      onPointerMove={(e) => { e.stopPropagation(); onHover(items[e.instanceId]?.id ?? null) }}
      onPointerOut={() => onHover(null)}
      onClick={(e) => { e.stopPropagation(); const it = items[e.instanceId]; if (it) onSelect(it.id) }} />
  )
}

// 선택·가리킨 핀: 크게 키워 보여 주고 이름표를 붙여요 (선택한 핀에는 물결이 퍼져요)
function Focus({ pin, selected }) {
  const ring = useRef()
  useFrame(({ clock }) => {
    if (!ring.current) return
    const t = (clock.elapsedTime * 0.8) % 1
    ring.current.scale.setScalar(0.5 + t * 2.2)
    ring.current.material.opacity = (1 - t) * 0.8
  })
  if (!pin) return null
  const [x, z] = toXZ(pin.lng, pin.lat), y = heightAt(pin.lng, pin.lat), color = CATEGORIES[pin.cat].color
  return (
    <group position={[x, y, z]}>
      <mesh geometry={pinGeometry(pin.cat)} material={PIN_MAT} scale={PIN_SCALE * 1.5} castShadow />
      {selected && (
        <mesh ref={ring} position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.28, 0.34, 32]} /><meshBasicMaterial color={color} transparent depthWrite={false} />
        </mesh>
      )}
      <Tag text={pin.title} kind="label" position={[0, 0.85, 0]} />
    </group>
  )
}

// ── 구름: 솜뭉치 여러 개를 모은 덩어리. 날씨에 따라 개수·색·짙기가 바뀌어요 ──
function Clouds({ fx }) {
  const tex = useMemo(() => puffTexture(0.5), [])
  const list = useMemo(() => Array.from({ length: 16 }, (_, i) => ({
    x: (Math.random() - 0.5) * 40, z: -9 + Math.random() * 16, y: 4.3 + Math.random() * 2.2, s: 0.8 + Math.random() * 0.7,
    puffs: Array.from({ length: 6 }, () => [(Math.random() - 0.5) * 3.4, (Math.random() - 0.5) * 0.5, (Math.random() - 0.5) * 1.6, 2 + Math.random() * 1.6]),
    mat: new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: 0, depthWrite: false }),
    order: i,
  })), [tex])
  const refs = useRef([])
  useFrame((_, dt) => {
    const m = MODES[fx.mode], k = 1 - Math.exp(-Math.min(dt, 0.05) * 1.5)
    list.forEach((c, i) => {
      c.x += fx.cur.wind * dt * (0.6 + c.s * 0.4)
      if (c.x > 22) c.x = -22
      const target = c.order < m.clouds ? (fx.mode === 'clear' ? 0.8 : 0.92) : 0
      c.mat.opacity += (target - c.mat.opacity) * k
      c.mat.color.copy(fx.cur.cloud)
      if (refs.current[i]) refs.current[i].position.set(c.x, c.y, c.z)
    })
  })
  return list.map((c, i) => (
    <group key={i} ref={(g) => { refs.current[i] = g }} scale={c.s}>
      {c.puffs.map(([x, y, z, s], k) => <sprite key={k} position={[x, y, z]} scale={[s, s * 0.62, 1]} material={c.mat} />)}
    </group>
  ))
}

// ── 비: 바람에 비스듬히 떨어지는 빗줄기 + 바다·땅에 튀는 물방울 ──
function Rain({ fx, on }) {
  const N = SMALL ? 1100 : 2600
  const controls = useThree((s) => s.controls)
  const group = useRef(), geo = useRef(), mat = useRef()
  const d = useMemo(() => { const a = new Float32Array(N * 4); for (let i = 0; i < N; i++) a.set([(Math.random() - 0.5) * 28, Math.random() * 9, (Math.random() - 0.5) * 22, 0.7 + Math.random() * 0.6], i * 4); return a }, [N])
  const pos = useMemo(() => new Float32Array(N * 6), [N])
  useFrame((_, dt) => {
    const step = Math.min(dt, 0.05), wind = fx.cur.wind
    if (mat.current) mat.current.opacity += ((on ? 0.5 : 0) - mat.current.opacity) * (1 - Math.exp(-step * 3))
    if (!mat.current || mat.current.opacity < 0.01) { if (group.current) group.current.visible = false; return }
    group.current.visible = true
    if (controls) group.current.position.set(controls.target.x, 0, controls.target.z)
    for (let i = 0; i < N; i++) {
      const o = i * 4, s = d[o + 3]
      d[o + 1] -= 12 * s * step; d[o] += wind * 1.4 * step
      if (d[o + 1] < 0) { d[o + 1] = 8 + Math.random(); d[o] = (Math.random() - 0.5) * 28 }
      const len = 0.28 + s * 0.22
      pos.set([d[o], d[o + 1], d[o + 2], d[o] - wind * 0.2 * len, d[o + 1] + len, d[o + 2]], i * 6)
    }
    geo.current.attributes.position.needsUpdate = true
  })
  return (
    <group ref={group} visible={false}>
      <lineSegments frustumCulled={false}>
        <bufferGeometry ref={geo}><bufferAttribute attach="attributes-position" args={[pos, 3]} /></bufferGeometry>
        <lineBasicMaterial ref={mat} color="#5d7584" transparent opacity={0} depthWrite={false} />
      </lineSegments>
      {on && <Splashes />}
    </group>
  )
}
function Splashes() {
  const S = SMALL ? 70 : 160
  const ref = useRef()
  const controls = useThree((s) => s.controls)
  const st = useMemo(() => Array.from({ length: S }, () => ({ x: 0, z: 0, y: -5, life: Math.random() })), [S])
  const tmp = useMemo(() => ({ m: new THREE.Matrix4(), q: new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0)), p: new THREE.Vector3(), s: new THREE.Vector3(), c: new THREE.Color() }), [])
  useFrame((_, dt) => {
    if (!ref.current) return
    const cx = controls?.target.x ?? 0, cz = controls?.target.z ?? 0
    st.forEach((o, i) => {
      o.life += Math.min(dt, 0.05) * 2.4
      if (o.life >= 1) {
        o.life = 0; o.x = (Math.random() - 0.5) * 18; o.z = (Math.random() - 0.5) * 13
        const [lng, lat] = fromXZ(cx + o.x, cz + o.z); o.y = heightAt(lng, lat) + 0.012
      }
      const sc = 0.5 + o.life * 2.2
      tmp.p.set(o.x, o.y, o.z); tmp.s.set(sc, sc, sc)
      ref.current.setMatrixAt(i, tmp.m.compose(tmp.p, tmp.q, tmp.s))
      ref.current.setColorAt(i, tmp.c.setScalar((1 - o.life) * 0.55))
    })
    ref.current.instanceMatrix.needsUpdate = true
    if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true
  })
  return (
    <instancedMesh ref={ref} args={[null, null, S]} frustumCulled={false}>
      <ringGeometry args={[0.022, 0.034, 18]} />
      <meshBasicMaterial color="#ffffff" transparent blending={THREE.AdditiveBlending} depthWrite={false} />
    </instancedMesh>
  )
}

// ── 눈: 눈송이가 흔들리며 내려요 (땅에는 셰이더로 눈이 쌓여요) ──
function Snow({ fx, on }) {
  const N = SMALL ? 700 : 1600
  const controls = useThree((s) => s.controls)
  const tex = useMemo(() => puffTexture(0.35), [])
  const group = useRef(), geo = useRef(), mat = useRef()
  const d = useMemo(() => { const a = new Float32Array(N * 4); for (let i = 0; i < N; i++) a.set([(Math.random() - 0.5) * 26, Math.random() * 8, (Math.random() - 0.5) * 20, Math.random() * 6.28], i * 4); return a }, [N])
  const pos = useMemo(() => new Float32Array(N * 3), [N])
  useFrame(({ clock }, dt) => {
    const step = Math.min(dt, 0.05), t = clock.elapsedTime
    if (mat.current) mat.current.opacity += ((on ? 0.95 : 0) - mat.current.opacity) * (1 - Math.exp(-step * 3))
    if (!mat.current || mat.current.opacity < 0.01) { if (group.current) group.current.visible = false; return }
    group.current.visible = true
    if (controls) group.current.position.set(controls.target.x, 0, controls.target.z)
    for (let i = 0; i < N; i++) {
      const o = i * 4, p = d[o + 3]
      d[o + 1] -= (0.7 + (i % 5) * 0.12) * step; d[o] += fx.cur.wind * 0.5 * step
      if (d[o + 1] < 0) { d[o + 1] = 8; d[o] = (Math.random() - 0.5) * 26 }
      pos.set([d[o] + Math.sin(t * 0.9 + p) * 0.3, d[o + 1], d[o + 2] + Math.cos(t * 0.7 + p) * 0.22], i * 3)
    }
    geo.current.attributes.position.needsUpdate = true
  })
  return (
    <group ref={group} visible={false}>
      <points frustumCulled={false}>
        <bufferGeometry ref={geo}><bufferAttribute attach="attributes-position" args={[pos, 3]} /></bufferGeometry>
        <pointsMaterial ref={mat} map={tex} size={0.13} sizeAttenuation transparent opacity={0} depthWrite={false} color="#ffffff" />
      </points>
    </group>
  )
}

// ── 번개: 비가 올 때 가끔 하늘이 번쩍이고 바다로 번개가 내리쳐요 ──
function Lightning({ fx }) {
  const line = useRef()
  const st = useRef({ next: 4, start: -10 })
  useFrame(({ clock }) => {
    const t = clock.elapsedTime, s = st.current
    if (fx.mode !== 'rain') { fx.flash = 0; s.next = t + 3; if (line.current) line.current.visible = false; return }
    if (t > s.next) {
      s.start = t; s.next = t + 6 + Math.random() * 8
      const pts = []
      let x = (Math.random() - 0.5) * 30, z = Math.random() < 0.5 ? -9 - Math.random() * 4 : 8 + Math.random() * 4
      for (let y = 5.2; y > 0; y -= 0.45) { pts.push(x, y, z); x += (Math.random() - 0.5) * 0.7; z += (Math.random() - 0.5) * 0.4 }
      pts.push(x, 0, z)
      line.current?.geometry.setPositions(pts)
    }
    const e = t - s.start
    fx.flash = e < 0 ? 0 : Math.max(0, Math.exp(-e * 10) + (e > 0.16 ? 0.8 * Math.exp(-(e - 0.16) * 7) : 0))
    if (line.current) { line.current.visible = fx.flash > 0.08; line.current.material.opacity = Math.min(1, fx.flash) }
  })
  return <Line ref={line} points={[[0, 5, 0], [0, 0, 0]]} color="#f4f7ff" lineWidth={2.6} transparent opacity={0} visible={false} />
}

// ── 날씨에 따라 하늘·안개·빛·바다·젖음·눈 쌓임을 서서히 바꿔요 ──
function Atmosphere({ fx, sky, sun, hemi }) {
  const scene = useThree((s) => s.scene)
  const white = useMemo(() => new THREE.Color('#ffffff'), [])
  useFrame((_, dt) => {
    const m = MODES[fx.mode], c = fx.cur, step = Math.min(dt, 0.05)
    const k = 1 - Math.exp(-step * 1.8), ks = 1 - Math.exp(-step * 0.5)
    c.top.lerp(m.top, k); c.horizon.lerp(m.horizon, k); c.sea.lerp(m.sea, k); c.cloud.lerp(m.cloud, k); c.sunColor.lerp(m.sunColor, k)
    c.near += (m.near - c.near) * k; c.far += (m.far - c.far) * k; c.sun += (m.sun - c.sun) * k; c.hemi += (m.hemi - c.hemi) * k; c.wind += (m.wind - c.wind) * k
    fx.uWet.value += (m.wet - fx.uWet.value) * k
    fx.uSnow.value += (m.snow - fx.uSnow.value) * ks
    const f = fx.flash
    if (scene.fog) { scene.fog.color.copy(c.horizon).lerp(white, f * 0.35); scene.fog.near = c.near; scene.fog.far = c.far }
    if (sky.current) { sky.current.uniforms.top.value.copy(c.top).lerp(white, f * 0.55); sky.current.uniforms.horizon.value.copy(c.horizon).lerp(white, f * 0.35) }
    if (sun.current) { sun.current.intensity = c.sun; sun.current.color.copy(c.sunColor) }
    if (hemi.current) hemi.current.intensity = c.hemi + f * 2.2
    if (fx.water) fx.water.color.copy(c.sea)
  })
  return null
}

// ── 카메라를 목표 시점으로 부드럽게 옮겨요 (사용자가 직접 돌리면 멈춤) ──
function Rig({ view, onMoving }) {
  const controls = useThree((s) => s.controls)
  const camera = useThree((s) => s.camera)
  const moving = useRef(true)
  useEffect(() => { moving.current = true; onMoving(true) }, [view, onMoving])
  useEffect(() => {
    if (!controls) return undefined
    const stop = () => { if (moving.current) { moving.current = false; onMoving(false) } }
    controls.addEventListener('start', stop)
    return () => controls.removeEventListener('start', stop)
  }, [controls, onMoving])
  useFrame((_, dt) => {
    if (!controls || !moving.current) return
    const k = 1 - Math.exp(-Math.min(dt, 0.05) * 2.6)
    camera.position.lerp(view.pos, k)
    controls.target.lerp(view.look, k)
    controls.update()
    if (camera.position.distanceTo(view.pos) < 0.03 && controls.target.distanceTo(view.look) < 0.03) { moving.current = false; onMoving(false) }
  })
  return null
}

function makeFx(mode) {
  const m = MODES[mode] ?? MODES.clear
  return {
    mode, flash: 0, water: null, uSnow: { value: m.snow }, uWet: { value: m.wet },
    cur: { top: m.top.clone(), horizon: m.horizon.clone(), sea: m.sea.clone(), cloud: m.cloud.clone(), sunColor: m.sunColor.clone(), near: m.near, far: m.far, sun: m.sun, hemi: m.hemi, wind: m.wind },
  }
}

function Scene({ layers, regions, hoverPin, selectedPin, onHover, onSelect, view, mode }) {
  const [fx] = useState(() => makeFx(mode))
  useEffect(() => { fx.mode = MODES[mode] ? mode : 'clear' }, [fx, mode])
  const sky = useRef(), sun = useRef(), hemi = useRef(), skyMesh = useRef()
  const camera = useThree((s) => s.camera)
  useFrame(() => { if (skyMesh.current) skyMesh.current.position.copy(camera.position) })
  const [moving, setMoving] = useState(true)
  const [touchedView, setTouchedView] = useState(null)
  const spin = !selectedPin && !moving && touchedView !== view     // 전체 보기에서는 천천히 회전

  return (
    <>
      <fog attach="fog" args={[fx.cur.horizon.clone(), fx.cur.near, fx.cur.far]} />
      <mesh ref={skyMesh} renderOrder={-1}>
        <sphereGeometry args={[150, 32, 16]} />
        <shaderMaterial ref={sky} args={[{ ...skyShader, uniforms: { top: { value: fx.cur.top.clone() }, horizon: { value: fx.cur.horizon.clone() } } }]} side={THREE.BackSide} depthWrite={false} />
      </mesh>
      <hemisphereLight ref={hemi} args={['#ffffff', '#cdbf9e', fx.cur.hemi]} />
      <directionalLight ref={sun} position={[-9, 11, 7]} intensity={fx.cur.sun} castShadow
        shadow-mapSize={[SMALL ? 1024 : 2048, SMALL ? 1024 : 2048]} shadow-bias={-0.0004} shadow-normalBias={0.03}
        shadow-camera-left={-17} shadow-camera-right={17} shadow-camera-top={13} shadow-camera-bottom={-13} shadow-camera-near={1} shadow-camera-far={45} />
      <Atmosphere fx={fx} sky={sky} sun={sun} hemi={hemi} />
      <Land fx={fx} />
      <Regions regions={regions} />
      {layers.map((l) => <PinLayer key={l.cat} cat={l.cat} items={l.items} onHover={onHover} onSelect={onSelect} />)}
      <Focus pin={selectedPin ?? hoverPin} selected={!!selectedPin} />
      <Clouds fx={fx} />
      <Rain fx={fx} on={mode === 'rain'} />
      <Snow fx={fx} on={mode === 'snow'} />
      <Lightning fx={fx} />
      <OrbitControls makeDefault enableDamping dampingFactor={0.1} minDistance={1.5} maxDistance={70} maxPolarAngle={1.42}
        autoRotate={spin} autoRotateSpeed={0.35} onStart={() => setTouchedView(view)} />
      <Rig view={view} onMoving={setMoving} />
    </>
  )
}

export default function Jeju3DMap(props) {
  // 처음엔 멀리 높은 곳에서 시작해 섬으로 내려오며 들어와요
  const [start] = useState(() => props.view.pos.clone().multiplyScalar(1.9).applyAxisAngle(new THREE.Vector3(0, 1, 0), -0.6))
  return (
    <Canvas shadows camera={{ position: start.toArray(), fov: 45, near: 0.1, far: 400 }} dpr={SMALL ? [1, 1.5] : [1, 2]}>
      <Scene {...props} />
    </Canvas>
  )
}
