import { useMemo } from 'react'
import { MASCOT_ICONS } from '../data/mascotIcons'

// 올레 지도의 일러스트 — 펜으로 윤곽을 긋고 수채물감을 살짝 엇나가게 칠한 손그림 스케치 느낌입니다.
// 모든 그림은 (0,0)이 바닥 중앙이고, 위쪽(−y)으로 그려져 있어요. 위치는 [경도, 위도] 로 지정합니다.

const INK = '#4a4743'
const PAPER = '#f6f1e6'

// 항상 같은 모양이 나오도록 시드가 있는 난수
const rng = (seed) => { let s = seed; return () => (s = (s * 16807) % 2147483647) / 2147483647 }
const inPoly = (x, y, poly) => {
  let c = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j]
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c
  }
  return c
}

// ── 그림 정의: w = 수채 칠(색), i = 펜 선 ─────────────────────────────
// 수채 칠은 펜 선보다 살짝 어긋나게(오른쪽 아래로) 얹어서 손으로 칠한 느낌을 냅니다.
const CROWN = 'M-10 -7 Q-14 -17 -5 -21 Q0 -27 8 -21 Q16 -14 9 -6 Q0 -1 -10 -7 Z'
const HALLA = 'M-135 40 Q-112 22 -82 -4 Q-52 -20 -32 -36 Q-12 -62 16 -66 Q44 -62 60 -36 Q82 -18 110 4 Q132 22 152 40 Z'
const ICONS = {
  'a-tree': { w: [[CROWN, '#a6cd82']], i: [CROWN, 'M0 -3 L0 7', 'M-5 -13 Q-1 -17 3 -13'] },
  'a-tuft': { w: [], i: ['M-5 0 L-6 -7', 'M0 0 L0 -9', 'M5 0 L6 -7'] },
  'a-mound': {
    w: [['M-28 0 Q-20 -28 0 -28 Q20 -28 28 0 Z', '#cadda9']],
    i: ['M-28 0 Q-20 -28 0 -28 Q20 -28 28 0', 'M-12 -4 L-8 -13 M-5 -4 L-1 -17 M3 -4 L6 -17 M11 -4 L13 -12'],
  },
  'a-halla': {
    w: [[HALLA, '#bfd59f'], ['M16 -66 Q44 -62 60 -36 Q82 -18 110 4 Q132 22 152 40 L44 40 Q54 -4 16 -66 Z', '#a2c07c']],
    i: [HALLA, 'M-12 -52 Q0 -64 16 -66 Q36 -63 46 -50 Q36 -44 29 -50 Q21 -41 12 -48 Q4 -41 -3 -48 Q-9 -44 -12 -52 Z',
      'M30 -40 L24 -22 M40 -34 L32 -14 M50 -26 L42 -6 M62 -16 L54 4 M76 -8 L68 12 M92 2 L84 22 M108 10 L100 30 M-62 14 Q-50 4 -40 14 M-98 28 Q-88 20 -78 28'],
    cap: ['M-12 -52 Q0 -64 16 -66 Q36 -63 46 -50 Q36 -44 29 -50 Q21 -41 12 -48 Q4 -41 -3 -48 Q-9 -44 -12 -52 Z', PAPER],
  },
  'a-ilchul': {
    w: [['M-42 0 L-35 -24 L-25 -20 L-19 -37 L-9 -27 L0 -41 L10 -29 L19 -37 L27 -25 L35 -27 L42 0 Z', '#c2d79f'], ['M3 -36 a11 11 0 1 0 22 0 a11 11 0 1 0 -22 0', '#f4d27a']],
    i: ['M-42 0 L-35 -24 L-25 -20 L-19 -37 L-9 -27 L0 -41 L10 -29 L19 -37 L27 -25 L35 -27 L42 0', 'M-19 -37 L-13 -24 M0 -41 L6 -22 M19 -37 L23 -20'],
  },
  'a-sanbang': {
    w: [['M-33 0 Q-33 -46 0 -50 Q33 -46 33 0 Z', '#d6d1a8']],
    i: ['M-33 0 Q-33 -46 0 -50 Q33 -46 33 0', 'M-15 -10 Q-13 -30 -7 -41 M2 -8 Q4 -30 8 -43 M17 -10 Q19 -24 21 -33', 'M-7 -5 Q0 -12 7 -5'],
  },
  'a-light': {
    w: [['M-9 0 L9 0 L6 -36 L-6 -36 Z', '#fdfbf4'], ['M-8 -12 L8 -12 L7 -19 L-7 -19 Z M-6.5 -27 L6.5 -27 L6 -33 L-6 -33 Z', '#e08a7a'], ['M-8 -45 H8 V-36 H-8 Z', '#f3d36b'], ['M-10 -45 L0 -54 L10 -45 Z', '#e08a7a']],
    i: ['M-9 0 L9 0 L6 -36 L-6 -36 Z', 'M-8 -45 H8 V-36 H-8 Z', 'M-10 -45 L0 -54 L10 -45 Z'],
  },
  'a-hare': {
    w: [['M-17 -30 Q0 -48 17 -30 Z', '#b8b1a6'], ['M-12 -31 H12 V-18 Q12 -14 8 -14 H-8 Q-12 -14 -12 -18 Z', '#d3cdc3'], ['M-14 -14 L14 -14 L17 0 L-17 0 Z', '#d3cdc3']],
    i: ['M-17 -30 Q0 -48 17 -30 Z', 'M-12 -31 H12 V-18 Q12 -14 8 -14 H-8 Q-12 -14 -12 -18 Z', 'M-14 -14 L14 -14 L17 0 L-17 0 Z', 'M-5 -24 L-5 -23 M5 -24 L5 -23', 'M0 -22 L0 -18', 'M-9 -8 Q-4 -5 0 -7 M9 -8 Q4 -5 0 -7'],
  },
  'a-tang': {
    w: [['M-14 -13 a14 14 0 1 0 28 0 a14 14 0 1 0 -28 0', '#f2a95a'], ['M0 -26 Q2 -33 10 -31 Q7 -24 0 -26 Z', '#9cc27a']],
    i: ['M-14 -13 a14 14 0 1 0 28 0 a14 14 0 1 0 -28 0', 'M0 -26 Q2 -33 10 -31 Q7 -24 0 -26 Z', 'M-6 -18 Q-3 -21 0 -19'],
  },
  'a-wind': {
    w: [],
    i: ['M-3 0 L3 0 L1.6 -48 L-1.6 -48 Z', 'M0 -48 L0 -75 M0 -48 L-23 -35 M0 -48 L23 -35', 'M-3 -46 a3 3 0 1 0 6 0 a3 3 0 1 0 -6 0'],
  },
  'a-palm': {
    w: [['M-2 -31 Q14 -44 28 -30 Q12 -36 -2 -31 Z M-2 -31 Q-16 -44 -30 -30 Q-14 -36 -2 -31 Z M-2 -31 Q4 -50 -4 -58 Q-8 -44 -2 -31 Z', '#a6cf8a']],
    i: ['M0 0 Q5 -16 -2 -31', 'M-2 -31 Q14 -44 28 -30 Q12 -36 -2 -31 Z', 'M-2 -31 Q-16 -44 -30 -30 Q-14 -36 -2 -31 Z', 'M-2 -31 Q4 -50 -4 -58 Q-8 -44 -2 -31 Z'],
  },
  'a-boat': {
    w: [['M-26 0 L26 0 L16 12 L-16 12 Z', '#d98a7a'], ['M3 -52 L25 -7 L3 -7 Z', '#fbfaf5'], ['M-4 -42 L-22 -7 L-4 -7 Z', '#a9cbdc']],
    i: ['M-26 0 L26 0 L16 12 L-16 12 Z', 'M0 -4 L0 -54', 'M3 -52 L25 -7 L3 -7 Z', 'M-4 -42 L-22 -7 L-4 -7 Z'],
  },
  'a-ferry': {
    w: [['M-42 0 L42 0 L33 15 L-35 15 Z', '#eaf0f3'], ['M-39 4 H38 V8 H-39 Z', '#d98a7a'], ['M-26 -17 H22 V0 H-26 Z', '#fbfaf5'], ['M-10 -30 H14 V-17 H-10 Z', '#fbfaf5'], ['M-20 -12 h9 v7 h-9 Z M-6 -12 h9 v7 h-9 Z M8 -12 h9 v7 h-9 Z', '#a9cbdc']],
    i: ['M-42 0 L42 0 L33 15 L-35 15 Z', 'M-26 -17 H22 V0 H-26', 'M-10 -30 H14 V-17', 'M-20 -12 h9 v7 h-9 Z M-6 -12 h9 v7 h-9 Z M8 -12 h9 v7 h-9 Z'],
  },
  'a-plane': {
    w: [['M-48 0 Q-48 -7 -38 -8 L30 -10 Q52 -10 52 0 Q52 6 30 7 L-32 8 Q-48 8 -48 0 Z', '#fbfaf5'], ['M-6 -9 L-24 -34 L-11 -34 L14 -9 Z', '#e7edf0'], ['M-42 -7 L-52 -23 L-40 -23 L-28 -8 Z', '#f0b36b']],
    i: ['M-48 0 Q-48 -7 -38 -8 L30 -10 Q52 -10 52 0 Q52 6 30 7 L-32 8 Q-48 8 -48 0 Z', 'M-6 -9 L-24 -34 L-11 -34 L14 -9', 'M-6 7 L-24 30 L-11 30 L14 8', 'M-42 -7 L-52 -23 L-40 -23 L-28 -8', 'M36 -4 Q44 -4 47 0'],
  },
  'a-surf': {
    w: [['M-32 7 Q-12 -7 10 7 Q24 13 38 4 L38 15 L-32 15 Z', '#a9cbdc'], ['M-24 4 a24 4.4 -8 1 0 48 0 a24 4.4 -8 1 0 -48 0', '#f3d36b'], ['M-5 -37 a6.5 6.5 0 1 0 13 0 a6.5 6.5 0 1 0 -13 0', '#f0cfb0']],
    i: ['M-32 7 Q-12 -7 10 7 Q24 13 38 4', 'M-24 4 Q0 -1 24 2', 'M-5 -37 a6.5 6.5 0 1 0 13 0 a6.5 6.5 0 1 0 -13 0', 'M-1 -30 L-4 -7', 'M-1 -28 L-15 -22 M-1 -28 L13 -33', 'M-4 -7 L-11 3 M-4 -7 L5 3'],
  },
  'a-cloud': {
    w: [['M-26 8 Q-30 -4 -18 -4 Q-14 -16 -2 -12 Q8 -20 16 -10 Q28 -10 26 8 Z', '#eef3f5']],
    i: ['M-26 8 Q-30 -4 -18 -4 Q-14 -16 -2 -12 Q8 -20 16 -10 Q28 -10 26 8 Z'],
  },
  'a-gull': { w: [], i: ['M-13 3 Q-6 -10 0 1 Q6 -10 13 3'] },
}

// 랜드마크 배치: [그림 id, 경도, 위도, 크기, 이름(선택)]
const LANDMARKS = [
  ['a-halla', 126.53, 33.372, 1.25, '한라산'],
  ['a-ilchul', 126.968, 33.43, 0.85],
  ['a-sanbang', 126.338, 33.278, 0.95, '산방산'],
  ['a-light', 126.952, 33.505, 0.85],
  ['a-light', 126.224, 33.405, 0.65],
  ['a-hare', 126.515, 33.488, 1.0],
  ['a-tang', 126.605, 33.298, 1.25],
  ['a-tang', 126.66, 33.31, 0.9],
  ['a-wind', 126.235, 33.335, 0.9], ['a-wind', 126.262, 33.346, 0.75],
  ['a-wind', 126.785, 33.522, 0.85], ['a-wind', 126.83, 33.51, 0.7],
  ['a-palm', 126.28, 33.4, 0.9], ['a-palm', 126.43, 33.238, 0.85], ['a-palm', 126.72, 33.33, 0.8],
  ['a-boat', 126.135, 33.455, 1.0], ['a-boat', 126.75, 33.205, 0.9], ['a-boat', 126.98, 33.4, 0.8],
  ['a-ferry', 126.4, 33.135, 0.9], ['a-ferry', 126.62, 33.612, 0.8],
  ['a-plane', 126.43, 33.628, 0.95],
  ['a-surf', 126.5, 33.2, 1.0],
  ['a-cloud', 126.72, 33.645, 1.1], ['a-cloud', 126.27, 33.62, 0.9], ['a-cloud', 126.93, 33.6, 0.8], ['a-cloud', 126.19, 33.18, 0.8],
]
const GULLS = [[126.34, 33.585, 1], [126.37, 33.575, 0.8], [126.85, 33.585, 1], [126.22, 33.5, 0.9], [126.9, 33.2, 1], [126.55, 33.15, 0.9], [126.18, 33.255, 0.8]]

// 펜 선 속성
const inkProps = { fill: 'none', stroke: INK, strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' }

export function ArtDefs() {
  return (
    <defs>
      {/* 손으로 그은 듯 선이 살짝 흔들리게 */}
      <filter id="a-wobble" x="-5%" y="-5%" width="110%" height="110%">
        <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="2" seed="4" result="n" />
        <feDisplacementMap in="SourceGraphic" in2="n" scale="6" xChannelSelector="R" yChannelSelector="G" />
      </filter>
      <filter id="a-wobble-s" x="-5%" y="-5%" width="110%" height="110%">
        <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" seed="9" result="n" />
        <feDisplacementMap in="SourceGraphic" in2="n" scale="2.6" xChannelSelector="R" yChannelSelector="G" />
      </filter>
      <filter id="a-bleed" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="14" /></filter>
      <filter id="a-bleed-s" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="7" /></filter>
      <radialGradient id="a-wash" cx="0.5" cy="0.5" r="0.65">
        <stop offset="0" stopColor="#eef3dc" /><stop offset="1" stopColor="#d5e3b8" />
      </radialGradient>
      {Object.entries({ ...ICONS, ...MASCOT_ICONS }).map(([id, ic]) => (
        <g id={id} key={id}>
          <g transform="translate(1.8 1.4)" stroke="none">
            {ic.w.map(([d, c], n) => <path key={n} d={d} fill={c} fillOpacity=".88" />)}
          </g>
          {ic.cap && <path d={ic.cap[0]} fill={ic.cap[1]} stroke="none" />}
          <g {...inkProps}>{ic.i.map((d, n) => <path key={n} d={d} />)}</g>
        </g>
      ))}
    </defs>
  )
}

// 바다: 종이 위에 번진 물빛 + 펜으로 그은 물결
export function SeaArt({ mainPoly, rings, pathD, moving }) {
  const waves = useMemo(() => {
    const r = rng(7), out = []
    for (let i = 0; i < 160 && out.length < 90; i++) {
      const x = r() * 1110, y = r() * 860
      if (inPoly(x, y, mainPoly)) continue
      out.push([x, y, 0.7 + r() * 0.7])
    }
    return out
  }, [mainPoly])
  return (
    <g style={{ pointerEvents: 'none' }}>
      <rect x="-3000" y="-3000" width="7000" height="7000" fill={PAPER} />
      <g filter={moving ? undefined : 'url(#a-bleed)'}>
        {rings.map((r, i) => <path key={`g1${i}`} d={pathD(r.pts, true)} fill="none" stroke="#b5d3e0" strokeOpacity=".5" strokeWidth="120" strokeLinejoin="round" />)}
      </g>
      <g filter={moving ? undefined : 'url(#a-bleed-s)'}>
        {rings.map((r, i) => <path key={`g2${i}`} d={pathD(r.pts, true)} fill="none" stroke="#9ec7d8" strokeOpacity=".55" strokeWidth="56" strokeLinejoin="round" />)}
      </g>
      <g filter={moving ? undefined : 'url(#a-wobble-s)'}>
        {waves.map(([x, y, s], i) => (
          <path key={i} d="M0 0 h20 M5 6 h12 M9 12 h5" transform={`translate(${x} ${y}) scale(${s})`} fill="none" stroke="#7fa7b8" strokeOpacity=".75" strokeWidth="1.8" strokeLinecap="round" />
        ))}
      </g>
    </g>
  )
}

// 땅: 연한 수채 + 펜 윤곽 + 손으로 그린 나무·오름
export function LandArt({ rings, mainPoly, pr, pathD, moving, light }) {
  const deco = useMemo(() => {
    const r = rng(11), trees = [], mounds = [], tufts = []
    if (light) return { trees, mounds, tufts }   // 미니 지도는 간단하게
    const [hx, hy] = pr([126.53, 33.372])
    const bad = (x, y) => Math.hypot(x - hx, y - hy) < 120
    for (let i = 0; i < 800 && trees.length < 130; i++) {
      const x = 40 + r() * 1030, y = 120 + r() * 700
      if (inPoly(x, y, mainPoly) && !bad(x, y)) trees.push([x, y, 0.55 + r() * 0.45])
    }
    for (let i = 0; i < 600 && tufts.length < 60; i++) {
      const x = 40 + r() * 1030, y = 120 + r() * 700
      if (inPoly(x, y, mainPoly) && !bad(x, y)) tufts.push([x, y, 0.7 + r() * 0.5])
    }
    for (let i = 0; i < 400 && mounds.length < 14; i++) {
      const [x, y] = pr([126.42 + r() * 0.45, 33.33 + r() * 0.17])
      if (inPoly(x, y, mainPoly) && !bad(x, y) && mounds.every(([a, b]) => Math.hypot(a - x, b - y) > 60)) mounds.push([x, y, 0.55 + r() * 0.5])
    }
    return { trees: trees.sort((a, b) => a[1] - b[1]), mounds, tufts }
  }, [mainPoly, pr, light])
  const mainD = pathD(rings.find((r) => r.main).pts, true)
  return (
    <g>
      {/* 수채 칠: 땅 + 군데군데 번진 초록 얼룩 */}
      <g filter={moving ? undefined : 'url(#a-wobble)'}>
        {rings.map((r, i) => <path key={`ld${i}`} d={pathD(r.pts, true)} fill="url(#a-wash)" stroke="none" />)}
      </g>
      <clipPath id="a-clip"><path d={mainD} /></clipPath>
      <g clipPath="url(#a-clip)" style={{ pointerEvents: 'none' }}>
        <g filter={moving ? undefined : 'url(#a-bleed-s)'} opacity=".6">
          <ellipse cx="300" cy="470" rx="150" ry="70" fill="#b9d29a" /><ellipse cx="760" cy="360" rx="170" ry="60" fill="#c3d9a4" />
          <ellipse cx="560" cy="560" rx="200" ry="55" fill="#b2cc92" /><ellipse cx="500" cy="300" rx="140" ry="50" fill="#bcd49d" />
          <ellipse cx="880" cy="470" rx="110" ry="60" fill="#c8dca9" />
        </g>
      </g>
      {/* 펜 윤곽: 두 번 겹쳐 그은 선 */}
      <g filter={moving ? undefined : 'url(#a-wobble)'} style={{ pointerEvents: 'none' }}>
        {rings.map((r, i) => <path key={`in${i}`} d={pathD(r.pts, true)} fill="none" stroke={INK} strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round" />)}
        {rings.map((r, i) => <path key={`in2${i}`} d={pathD(r.pts, true)} transform="translate(2.5 2)" fill="none" stroke={INK} strokeOpacity=".28" strokeWidth="1.4" strokeLinejoin="round" />)}
      </g>
      <g filter={moving ? undefined : 'url(#a-wobble-s)'} style={{ pointerEvents: 'none' }}>
        {deco.tufts.map(([x, y, s], i) => <use key={`f${i}`} href="#a-tuft" transform={`translate(${x} ${y}) scale(${s})`} />)}
        {deco.mounds.map(([x, y, s], i) => <use key={`m${i}`} href="#a-mound" transform={`translate(${x} ${y}) scale(${s})`} />)}
        {deco.trees.map(([x, y, s], i) => <use key={`t${i}`} href="#a-tree" transform={`translate(${x} ${y}) scale(${s})`} />)}
      </g>
    </g>
  )
}

// 랜드마크·탈것·갈매기
export function Landmarks({ pr, k = 1, moving }) {
  return (
    <g style={{ pointerEvents: 'none' }}>
      <g filter={moving ? undefined : 'url(#a-wobble-s)'}>
        {LANDMARKS.map(([id, lng, lat, s], i) => {
          const [x, y] = pr([lng, lat])
          return <use key={i} href={`#${id}`} transform={`translate(${x} ${y}) scale(${s})`} />
        })}
        {GULLS.map(([lng, lat, s], i) => { const [x, y] = pr([lng, lat]); return <use key={`g${i}`} href="#a-gull" transform={`translate(${x} ${y}) scale(${s})`} /> })}
      </g>
      {LANDMARKS.filter((l) => l[4]).map(([id, lng, lat, s, name]) => {
        const [x, y] = pr([lng, lat])
        return <text key={name} x={x} y={y + 22 * s + 16} textAnchor="middle" className="map-label strong" style={{ fontSize: 28 * Math.max(k, 0.55) }}>{name}</text>
      })}
    </g>
  )
}
