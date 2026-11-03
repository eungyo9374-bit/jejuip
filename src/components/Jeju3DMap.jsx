import { useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Line, OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { LAND_RINGS, buildTerrain, heightAt, toXZ } from '../lib/terrain'

const MODES = {
  clear: { bg: '#f6f1e6', fog: '#f6f1e6', near: 40, far: 110, light: 1.15, sea: '#a9cfe0' },
  cloudy: { bg: '#e6e5e0', fog: '#e6e5e0', near: 30, far: 80, light: 0.8, sea: '#9fbccb' },
  rain: { bg: '#cfd5d8', fog: '#cfd5d8', near: 22, far: 70, light: 0.6, sea: '#8eaabb' },
  snow: { bg: '#eceff1', fog: '#eceff1', near: 24, far: 70, light: 0.9, sea: '#b5ced9' },
}
// 처음(전체) 시점: 세로로 좁은 휴대폰 화면에서는 섬이 잘리지 않게 더 멀리서 봐요
export const homeView = () => {
  const aspect = typeof window === 'undefined' ? 1.5 : Math.min(1.6, window.innerWidth / (window.innerHeight * 0.66))
  const dist = Math.max(18, 11.5 / (0.414 * aspect))      // 섬의 폭이 화면에 다 들어오는 거리
  return { pos: new THREE.Vector3(0, dist * 0.68, dist * 0.74), look: new THREE.Vector3(0, 0, 0) }
}

const ptsOf = (pts, y) => pts.map(([lng, lat]) => { const [x, z] = toXZ(lng, lat); return [x, y ?? heightAt(lng, lat) + 0.07, z] })

// 글자 상자(번호 배지·이름표)를 그림으로 만들어 화면 크기 그대로 보이는 스프라이트로 써요
const tagCache = new Map()
function tagTexture(text, kind) {
  const key = kind + text
  if (tagCache.has(key)) return tagCache.get(key)
  const S = 2, badge = kind !== 'label'
  const font = `${badge ? 'bold 15px' : '14px'} Pretendard, "Malgun Gothic", sans-serif`
  const c = document.createElement('canvas'), g = c.getContext('2d')
  g.font = font
  const tw = g.measureText(text).width
  const w = Math.ceil(badge ? Math.max(34, tw + 16) : tw + 20), h = badge ? 34 : 28
  c.width = w * S; c.height = h * S
  g.scale(S, S); g.font = font; g.textAlign = 'center'; g.textBaseline = 'middle'
  g.beginPath(); g.roundRect(1.5, 1.5, w - 3, h - 3, badge ? h / 2 : 3)
  g.fillStyle = kind === 'on' ? '#e4572e' : badge ? '#fffdf8' : '#2b2926'; g.fill()
  if (badge) { g.lineWidth = 3; g.strokeStyle = kind === 'on' ? '#fffdf8' : '#2b8fd9'; g.stroke() }
  g.fillStyle = kind === 'on' || !badge ? '#ffffff' : '#3d3b37'
  g.fillText(text, w / 2, h / 2 + 1)
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

// 바다 + 땅 + 해안선
function Land({ sea }) {
  const geo = useMemo(() => buildTerrain(), [])
  const far = useMemo(() => LAND_RINGS.slice(1).filter((r) => r.some((p) => p[1] < 33.18)), [])
  const shapes = useMemo(() => far.map((r) => new THREE.Shape(r.map(([lng, lat]) => { const [x, z] = toXZ(lng, lat); return new THREE.Vector2(x, -z) }))), [far])
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[240, 180]} />
        <meshBasicMaterial color={sea} />
      </mesh>
      <mesh geometry={geo}><meshStandardMaterial vertexColors roughness={1} /></mesh>
      {shapes.map((s, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}>
          <shapeGeometry args={[s]} /><meshStandardMaterial color="#d3e1b4" roughness={1} />
        </mesh>
      ))}
      {LAND_RINGS.map((r, i) => <Line key={i} points={ptsOf([...r, r[0]], 0.05)} color="#4a4743" lineWidth={1.4} />)}
    </>
  )
}

// 코스 선: 선택한 코스는 주황, 나머지는 파랑. 번호 배지를 누르면 선택돼요
function Routes({ groups, selected, onSelect }) {
  return groups.map((g) => {
    const on = g.key === selected, dim = selected && !on
    return (
      <group key={g.key}>
        {g.route.parts.map((p, i) => (
          <Line key={i} points={ptsOf(p)} color={on ? '#e4572e' : '#2b8fd9'} lineWidth={on ? 5 : 3} transparent opacity={dim ? 0.35 : 1}
            dashed={g.route.type === 'line'} dashSize={0.12} gapSize={0.12} />
        ))}
        <Tag text={g.key} kind={on ? 'on' : 'badge'} position={[g.mid[0], g.mid[1] + 0.3, g.mid[2]]} opacity={dim ? 0.55 : 1} onClick={() => onSelect(g.key)} />
      </group>
    )
  })
}

// 명소·문화유산 핀
function Pins({ pins, active, onActive }) {
  return pins.map((p) => {
    const [x, z] = toXZ(p.lng, p.lat), y = heightAt(p.lng, p.lat) + 0.05
    const on = active === p.id
    return (
      <group key={p.id} position={[x, y, z]}>
        <mesh position={[0, 0.2, 0]}><cylinderGeometry args={[0.012, 0.012, 0.4, 6]} /><meshBasicMaterial color="#4a4743" /></mesh>
        <mesh position={[0, 0.46, 0]} scale={on ? 1.5 : 1} onPointerOver={(e) => { e.stopPropagation(); onActive(p.id) }} onPointerOut={() => onActive(null)} onClick={(e) => { e.stopPropagation(); onActive(p.id) }}>
          {p.kind === 'heritage' ? <octahedronGeometry args={[0.1]} /> : <sphereGeometry args={[0.09, 14, 10]} />}
          <meshStandardMaterial color={p.kind === 'heritage' ? '#7b5ea7' : '#f2a93b'} />
        </mesh>
        {on && <Tag text={p.title} kind="label" position={[0, 0.8, 0]} />}
      </group>
    )
  })
}

// 비·눈 입자: 날씨에 따라 내려요
function Precip({ mode }) {
  const small = typeof window !== 'undefined' && window.innerWidth < 700
  const N = mode === 'rain' ? (small ? 900 : 1800) : mode === 'snow' ? (small ? 500 : 1000) : 0
  const data = useMemo(() => {
    const d = []
    for (let i = 0; i < N; i++) d.push({ x: (Math.random() - 0.5) * 30, y: Math.random() * 9, z: (Math.random() - 0.5) * 20, s: 0.6 + Math.random() * 0.8, p: Math.random() * 6.28 })
    return d
  }, [N])
  const geo = useRef(), pos = useMemo(() => new Float32Array(N * (mode === 'rain' ? 6 : 3)), [N, mode])
  useFrame((_, dt) => {
    if (!N) return
    const t = performance.now() / 1000
    for (let i = 0; i < N; i++) {
      const o = data[i]
      o.y -= (mode === 'rain' ? 11 : 1.1) * o.s * Math.min(dt, 0.05)
      if (o.y < 0) o.y = 9
      if (mode === 'rain') {
        pos.set([o.x, o.y, o.z, o.x + 0.03, o.y + 0.4, o.z], i * 6)
      } else {
        pos.set([o.x + Math.sin(t + o.p) * 0.25, o.y, o.z + Math.cos(t * 0.8 + o.p) * 0.2], i * 3)
      }
    }
    if (geo.current) geo.current.attributes.position.needsUpdate = true
  })
  if (!N) return null
  const attr = <bufferGeometry ref={geo}><bufferAttribute attach="attributes-position" args={[pos, 3]} count={pos.length / 3} /></bufferGeometry>
  return mode === 'rain'
    ? <lineSegments key="rain" frustumCulled={false}>{attr}<lineBasicMaterial color="#6f8fa8" transparent opacity={0.55} /></lineSegments>
    : <points key="snow" frustumCulled={false}>{attr}<pointsMaterial color="#ffffff" size={0.09} sizeAttenuation transparent opacity={0.95} /></points>
}

// 카메라를 코스 쪽으로 부드럽게 옮겨요 (사용자가 직접 돌리기 시작하면 멈춤)
function Rig({ view }) {
  const controls = useThree((s) => s.controls)
  const camera = useThree((s) => s.camera)
  const moving = useRef(true)
  useEffect(() => { moving.current = true }, [view])
  useEffect(() => {
    if (!controls) return undefined
    const stop = () => { moving.current = false }
    controls.addEventListener('start', stop)
    return () => controls.removeEventListener('start', stop)
  }, [controls])
  useFrame((_, dt) => {
    if (!controls || !moving.current) return
    const k = 1 - Math.exp(-Math.min(dt, 0.05) * 4)
    camera.position.lerp(view.pos, k)
    controls.target.lerp(view.look, k)
    controls.update()
    if (camera.position.distanceTo(view.pos) < 0.04 && controls.target.distanceTo(view.look) < 0.04) moving.current = false
  })
  return null
}

export default function Jeju3DMap({ groups, selected, onSelect, pins, activePin, onActivePin, view, mode }) {
  const m = MODES[mode] ?? MODES.clear
  return (
    <Canvas camera={{ position: view.pos.toArray(), fov: 45, near: 0.1, far: 160 }} dpr={[1, 2]}>
      <color attach="background" args={[m.bg]} />
      <fog attach="fog" args={[m.fog, m.near, m.far]} />
      <hemisphereLight args={['#ffffff', '#cdd9b8', 0.55 * m.light]} />
      <directionalLight position={[-7, 6, 4]} intensity={2 * m.light} />
      <Land sea={m.sea} />
      <Routes groups={groups} selected={selected} onSelect={onSelect} />
      <Pins pins={pins} active={activePin} onActive={onActivePin} />
      <Precip mode={mode} />
      <OrbitControls makeDefault enableDamping dampingFactor={0.12} minDistance={2} maxDistance={70} maxPolarAngle={1.45} />
      <Rig view={view} />
    </Canvas>
  )
}
