import { useMemo } from 'react'

// 올레 지도의 일러스트 — 바다·땅·오름·나무·랜드마크 그림을 SVG 로 직접 그렸습니다.
// 모든 그림은 (0,0)이 바닥 중앙이고, 위쪽(−y)으로 그려져 있어요. 위치는 [경도, 위도] 로 지정합니다.

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
  ['a-wind', 126.235, 33.335, 0.95], ['a-wind', 126.262, 33.346, 0.8],
  ['a-wind', 126.785, 33.522, 0.9], ['a-wind', 126.83, 33.51, 0.75],
  ['a-palm', 126.28, 33.4, 0.9], ['a-palm', 126.43, 33.238, 0.85], ['a-palm', 126.72, 33.33, 0.8],
  ['a-boat', 126.135, 33.455, 1.0], ['a-boat', 126.75, 33.205, 0.9], ['a-boat', 126.98, 33.4, 0.8],
  ['a-ferry', 126.4, 33.135, 0.9], ['a-ferry', 126.62, 33.612, 0.8],
  ['a-plane', 126.43, 33.628, 0.95],
  ['a-surf', 126.5, 33.2, 1.0],
  ['a-cloud', 126.72, 33.645, 1.1], ['a-cloud', 126.27, 33.62, 0.9], ['a-cloud', 126.93, 33.6, 0.8], ['a-cloud', 126.19, 33.18, 0.8],
]
const GULLS = [[126.34, 33.585, 1], [126.37, 33.575, 0.8], [126.85, 33.585, 1], [126.22, 33.5, 0.9], [126.9, 33.2, 1], [126.55, 33.15, 0.9], [126.18, 33.255, 0.8]]

export function ArtDefs() {
  const o = '#8a5a2b'
  return (
    <defs>
      <linearGradient id="a-sea" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#58b6ea" /><stop offset="1" stopColor="#95daf6" />
      </linearGradient>
      <radialGradient id="a-land" cx="0.5" cy="0.5" r="0.65">
        <stop offset="0" stopColor="#8fd043" /><stop offset="1" stopColor="#a6d95e" />
      </radialGradient>

      <g id="a-tree"><rect x="-2" y="-2" width="4" height="9" fill={o} /><circle cy="-12" r="11" fill="#3d8f2b" /><circle cx="-4" cy="-16" r="5" fill="#66b941" /></g>
      <g id="a-mound">
        <path d="M-30 0 Q-22 -30 0 -30 Q22 -30 30 0 Z" fill="#7dc13f" stroke="#4d9a2c" strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M-15 -13 Q-7 -23 4 -23" fill="none" stroke="#bde87f" strokeWidth="3" strokeLinecap="round" />
      </g>
      <g id="a-halla">
        <path d="M-135 40 Q-112 22 -82 -4 Q-52 -20 -32 -36 Q-12 -62 16 -66 Q44 -62 60 -36 Q82 -18 110 4 Q132 22 152 40 Z" fill="#5cab38" stroke="#3a7c26" strokeWidth="4" strokeLinejoin="round" />
        <path d="M16 -66 Q44 -62 60 -36 Q82 -18 110 4 Q132 22 152 40 L44 40 Q54 -4 16 -66 Z" fill="#3f8a2b" opacity=".45" />
        <path d="M-12 -52 Q0 -64 16 -66 Q36 -63 46 -50 Q36 -44 29 -50 Q21 -41 12 -48 Q4 -41 -3 -48 Q-9 -44 -12 -52 Z" fill="#fff" stroke="#9db8c0" strokeWidth="2" strokeLinejoin="round" />
        <path d="M-62 14 Q-50 4 -40 14 M80 18 Q92 8 102 18 M-98 28 Q-88 20 -78 28" stroke="#8fd05a" strokeWidth="3" fill="none" strokeLinecap="round" />
      </g>
      <g id="a-ilchul">
        <circle cx="16" cy="-36" r="11" fill="#ffd23f" opacity=".95" />
        <path d="M-42 0 L-35 -24 L-25 -20 L-19 -37 L-9 -27 L0 -41 L10 -29 L19 -37 L27 -25 L35 -27 L42 0 Z" fill="#69ab3c" stroke="#3d7b27" strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M-19 -37 L-13 -25 M0 -41 L6 -23 M19 -37 L23 -21" stroke="#93c966" strokeWidth="3" strokeLinecap="round" />
      </g>
      <g id="a-sanbang">
        <path d="M-33 0 Q-33 -46 0 -50 Q33 -46 33 0 Z" fill="#a4b57c" stroke="#69794a" strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M-15 -10 Q-13 -30 -7 -41 M2 -8 Q4 -30 8 -43 M17 -10 Q19 -24 21 -33" stroke="#7a8b57" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <ellipse cy="-5" rx="7" ry="5" fill="#46563a" />
      </g>
      <g id="a-light">
        <path d="M-9 0 L9 0 L6 -36 L-6 -36 Z" fill="#fff" stroke="#6b7f8a" strokeWidth="2" strokeLinejoin="round" />
        <path d="M-8 -12 L8 -12 L7 -19 L-7 -19 Z M-6.5 -27 L6.5 -27 L6 -33 L-6 -33 Z" fill="#ef5a4f" />
        <rect x="-8" y="-45" width="16" height="9" fill="#ffd23f" stroke="#6b7f8a" strokeWidth="2" />
        <path d="M-10 -45 L0 -54 L10 -45 Z" fill="#ef5a4f" stroke="#6b7f8a" strokeWidth="2" strokeLinejoin="round" />
      </g>
      <g id="a-hare">
        <path d="M-17 -30 Q0 -48 17 -30 Z" fill="#6f6a64" stroke="#4a463f" strokeWidth="1.8" strokeLinejoin="round" />
        <rect x="-12" y="-31" width="24" height="17" rx="7" fill="#a29d95" stroke="#4a463f" strokeWidth="1.8" />
        <circle cx="-5" cy="-24" r="2.4" fill="#2f2c28" /><circle cx="5" cy="-24" r="2.4" fill="#2f2c28" />
        <ellipse cy="-19" rx="3" ry="3.4" fill="#7c776f" />
        <path d="M-14 -14 L14 -14 L17 0 L-17 0 Z" fill="#a29d95" stroke="#4a463f" strokeWidth="1.8" strokeLinejoin="round" />
        <ellipse cx="-5" cy="-7" rx="4.5" ry="2.6" fill="#8b867e" /><ellipse cx="5" cy="-5" rx="4.5" ry="2.6" fill="#8b867e" />
      </g>
      <g id="a-tang">
        <circle cy="-13" r="14" fill="#ff9d1c" stroke="#e17900" strokeWidth="2.5" />
        <ellipse cx="-5" cy="-18" rx="4.5" ry="2.7" fill="#ffc766" transform="rotate(-30 -5 -18)" />
        <path d="M0 -26 Q2 -33 10 -31 Q7 -24 0 -26 Z" fill="#3e9a35" stroke="#2b7a28" strokeWidth="1.2" />
      </g>
      <g id="a-wind">
        <path d="M-3 0 L3 0 L1.6 -48 L-1.6 -48 Z" fill="#fff" stroke="#9fb4c0" strokeWidth="1.6" strokeLinejoin="round" />
        <g transform="translate(0 -48)">
          <path id="a-blade" d="M-2.6 -3 L0 -27 L2.6 -3 Z" fill="#fff" stroke="#9fb4c0" strokeWidth="1.4" strokeLinejoin="round" />
          <path d="M-2.6 -3 L0 -27 L2.6 -3 Z" transform="rotate(120)" fill="#fff" stroke="#9fb4c0" strokeWidth="1.4" strokeLinejoin="round" />
          <path d="M-2.6 -3 L0 -27 L2.6 -3 Z" transform="rotate(240)" fill="#fff" stroke="#9fb4c0" strokeWidth="1.4" strokeLinejoin="round" />
          <circle r="3.6" fill="#fff" stroke="#9fb4c0" strokeWidth="1.4" />
        </g>
      </g>
      <g id="a-palm">
        <path d="M0 0 Q5 -16 -2 -31" stroke={o} strokeWidth="4.5" fill="none" strokeLinecap="round" />
        <g transform="translate(-2 -31)" fill="#3e9a35" stroke="#2b7a28" strokeWidth="1.2">
          <ellipse cx="13" rx="14" ry="4.6" transform="rotate(-28)" /><ellipse cx="13" rx="14" ry="4.6" transform="rotate(22)" />
          <ellipse cx="-13" rx="14" ry="4.6" transform="rotate(28)" /><ellipse cx="-13" rx="14" ry="4.6" transform="rotate(-22)" />
          <ellipse cy="-12" rx="4.6" ry="12" />
        </g>
      </g>
      <g id="a-boat">
        <path d="M-26 0 L26 0 L16 12 L-16 12 Z" fill="#ef5a4f" stroke="#fff" strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M0 -4 L0 -54" stroke="#fff" strokeWidth="3" />
        <path d="M3 -52 L25 -7 L3 -7 Z" fill="#fff" /><path d="M-4 -42 L-22 -7 L-4 -7 Z" fill="#eef8ff" />
      </g>
      <g id="a-ferry">
        <path d="M-42 0 L42 0 L33 15 L-35 15 Z" fill="#fff" stroke="#2b6aa8" strokeWidth="2.5" strokeLinejoin="round" />
        <rect x="-40" y="4" width="78" height="4" fill="#ef5a4f" />
        <rect x="-26" y="-17" width="48" height="17" fill="#fff" stroke="#2b6aa8" strokeWidth="2.5" />
        <rect x="-20" y="-12" width="9" height="7" fill="#58b7ea" /><rect x="-6" y="-12" width="9" height="7" fill="#58b7ea" /><rect x="8" y="-12" width="9" height="7" fill="#58b7ea" />
        <rect x="-10" y="-30" width="24" height="13" fill="#fff" stroke="#2b6aa8" strokeWidth="2.5" />
        <rect x="-5" y="-26" width="14" height="6" fill="#58b7ea" />
      </g>
      <g id="a-plane">
        <path d="M-48 0 Q-48 -7 -38 -8 L30 -10 Q52 -10 52 0 Q52 6 30 7 L-32 8 Q-48 8 -48 0 Z" fill="#fff" stroke="#6b7f8a" strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M-6 -9 L-24 -34 L-11 -34 L14 -9 Z" fill="#f5f8fa" stroke="#6b7f8a" strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M-6 7 L-24 30 L-11 30 L14 8 Z" fill="#e9eff3" stroke="#6b7f8a" strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M-42 -7 L-52 -23 L-40 -23 L-28 -8 Z" fill="#ff8a1e" stroke="#c96a00" strokeWidth="2" strokeLinejoin="round" />
        <path d="M38 -7 Q47 -6 50 0 Q47 3 38 4 Z" fill="#58b7ea" />
      </g>
      <g id="a-surf">
        <path d="M-32 7 Q-12 -7 10 7 Q24 13 38 4 L38 15 L-32 15 Z" fill="#2f9ee0" opacity=".9" />
        <ellipse cy="4" rx="24" ry="4.4" fill="#ffd23f" stroke="#e5a800" strokeWidth="1.5" transform="rotate(-8)" />
        <circle cx="2" cy="-30" r="6.5" fill="#f2c9a0" />
        <path d="M-1 -23 L-4 -7" stroke="#ff5a5f" strokeWidth="6" strokeLinecap="round" />
        <path d="M-1 -21 L-15 -15 M-1 -21 L13 -26" stroke="#f2c9a0" strokeWidth="3.2" strokeLinecap="round" />
        <path d="M-4 -7 L-11 3 M-4 -7 L5 3" stroke="#2b3a67" strokeWidth="4.4" strokeLinecap="round" />
      </g>
      <g id="a-cloud" opacity=".95">
        <circle cx="-15" cy="-2" r="11" fill="#fff" /><circle cx="0" cy="-9" r="14" fill="#fff" /><circle cx="16" cy="-2" r="11" fill="#fff" /><rect x="-26" y="-3" width="52" height="12" rx="6" fill="#fff" />
      </g>
      <g id="a-gull"><path d="M-13 3 Q-6 -10 0 1 Q6 -10 13 3" fill="none" stroke="#fff" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" /></g>
    </defs>
  )
}

// 바다: 그라데이션 + 물결무늬 + 해안 빛
export function SeaArt({ mainPoly, pr, rings, pathD }) {
  const waves = useMemo(() => {
    const r = rng(7), out = []
    for (let i = 0; i < 110 && out.length < 80; i++) {
      const x = r() * 1110, y = r() * 860
      if (inPoly(x, y, mainPoly)) continue
      out.push([x, y, 0.7 + r() * 0.8])
    }
    return out
  }, [mainPoly])
  return (
    <g style={{ pointerEvents: 'none' }}>
      <rect x="-3000" y="-3000" width="7000" height="7000" fill="url(#a-sea)" />
      {waves.map(([x, y, s], i) => (
        <path key={i} d="M0 0 q7 -7 14 0 t14 0" transform={`translate(${x} ${y}) scale(${s})`} fill="none" stroke="#fff" strokeOpacity=".75" strokeWidth="2.6" strokeLinecap="round" />
      ))}
      {rings.map((r, i) => <path key={`g1${i}`} d={pathD(r.pts, true)} fill="none" stroke="#c5ecfc" strokeOpacity=".5" strokeWidth="64" strokeLinejoin="round" />)}
      {rings.map((r, i) => <path key={`g2${i}`} d={pathD(r.pts, true)} fill="none" stroke="#e1f6ff" strokeOpacity=".7" strokeWidth="34" strokeLinejoin="round" />)}
    </g>
  )
}

// 땅 + 나무·오름 흩뿌리기 + 랜드마크
export function LandArt({ rings, mainPoly, pr, pathD }) {
  const deco = useMemo(() => {
    const r = rng(11), trees = [], mounds = []
    const [hx, hy] = pr([126.53, 33.372])
    const bad = (x, y) => Math.hypot(x - hx, y - hy) < 120
    for (let i = 0; i < 700 && trees.length < 150; i++) {
      const x = 40 + r() * 1030, y = 120 + r() * 700
      if (inPoly(x, y, mainPoly) && !bad(x, y)) trees.push([x, y, 0.55 + r() * 0.45])
    }
    for (let i = 0; i < 400 && mounds.length < 14; i++) {
      const [x, y] = pr([126.42 + r() * 0.45, 33.33 + r() * 0.17])
      if (inPoly(x, y, mainPoly) && !bad(x, y) && mounds.every(([a, b]) => Math.hypot(a - x, b - y) > 60)) mounds.push([x, y, 0.55 + r() * 0.5])
    }
    return { trees: trees.sort((a, b) => a[1] - b[1]), mounds }
  }, [mainPoly, pr])
  return (
    <g>
      {rings.map((r, i) => <path key={`sh${i}`} d={pathD(r.pts, true)} transform="translate(8 11)" fill="#5fa5cc" opacity=".55" />)}
      {rings.map((r, i) => <path key={`ld${i}`} d={pathD(r.pts, true)} fill="url(#a-land)" stroke="#4b9a2a" strokeWidth="5" strokeLinejoin="round" />)}
      {rings.map((r, i) => <path key={`hl${i}`} d={pathD(r.pts, true)} fill="none" stroke="#fff" strokeOpacity=".55" strokeWidth="2" strokeLinejoin="round" transform="translate(-2 -2)" />)}
      <g style={{ pointerEvents: 'none' }}>
        {deco.mounds.map(([x, y, s], i) => <use key={`m${i}`} href="#a-mound" transform={`translate(${x} ${y}) scale(${s})`} />)}
        {deco.trees.map(([x, y, s], i) => <use key={`t${i}`} href="#a-tree" transform={`translate(${x} ${y}) scale(${s})`} />)}
      </g>
    </g>
  )
}

// 랜드마크·탈것·갈매기 (확대해도 지도와 함께 커지는 그림)
export function Landmarks({ pr, k = 1 }) {
  return (
    <g style={{ pointerEvents: 'none' }}>
      {LANDMARKS.map(([id, lng, lat, s, name], i) => {
        const [x, y] = pr([lng, lat])
        return (
          <g key={i} transform={`translate(${x} ${y})`}>
            <use href={`#${id}`} transform={`scale(${s})`} />
            {name && <text y={22 * s + 14} textAnchor="middle" className="map-label strong" style={{ fontSize: 26 * Math.max(k, 0.55) }}>{name}</text>}
          </g>
        )
      })}
      {GULLS.map(([lng, lat, s], i) => { const [x, y] = pr([lng, lat]); return <use key={`g${i}`} href="#a-gull" transform={`translate(${x} ${y}) scale(${s})`} /> })}
    </g>
  )
}
