import { useMemo } from 'react'
import COAST from '../data/jeju-coast-detail.json'
import MAP from '../data/jeju-map.json'
import { H, W, pathD, pr, routeD, routeOf, snapPoint } from '../lib/jejuMap'

const INK = '#4a4743'
const PAPER = '#f6f1e6'

// 항상 같은 모양이 나오도록 시드가 있는 난수 / 점이 땅(다각형) 안에 있는지
const rng = (seed) => { let s = seed; return () => (s = (s * 16807) % 2147483647) / 2147483647 }
const inPoly = (x, y, poly) => {
  let c = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j]
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c
  }
  return c
}

const COAST_XY = COAST.map(pr)                                   // 본섬 자세한 해안선 (한 번만 계산)
const COAST_D = pathD(COAST, true)
const ISLANDS = MAP.rings.filter((r) => !r.main).map((r) => pathD(r.pts, true))

// 코스 확대 지도 — 이 코스가 지나는 곳만 크게 확대해서 경로·출발/도착·주변 명소를 손그림으로 보여줘요
// g: lib/olle.js 의 groupCourses() 결과 한 개 / spots: TourAPI 주변 명소 목록(선택)
export default function CourseMap({ g, spots = [] }) {
  const route = useMemo(() => routeOf(g.key, g.variants[0].id), [g])
  const view = useMemo(() => {
    if (!route) return null
    const xy = route.parts.flat().map(pr)
    const xs = xy.map((p) => p[0]), ys = xy.map((p) => p[1])
    const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys)
    let w = Math.max((x1 - x0) * 1.45, 170), h = Math.max((y1 - y0) * 1.45, 170 * (H / W))
    if (w / h > W / H) h = w * (H / W); else w = h * (W / H)
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2
    return { x: cx - w / 2, y: cy - h / 2, w, h }
  }, [route])
  const px = view ? view.w / 400 : 1                              // 화면 1px 이 지도 좌표로 얼마인지

  const c = g.variants[0]
  const pins = useMemo(() => {
    if (!route) return null
    const s = snapPoint(route, c.startLat, c.startLng), e = snapPoint(route, c.endLat, c.endLng)
    return { s: pr(s), e: pr(e), loop: route.type === 'loop' || g.start === g.end }
  }, [route, c, g])

  // 나무: 화면에 보이는 땅 위에서 경로와 겹치지 않게 흩뿌리기
  const trees = useMemo(() => {
    if (!view || !route) return []
    const r = rng(23), out = [], rp = route.parts.flat().map(pr)
    for (let i = 0; i < 500 && out.length < 46; i++) {
      const x = view.x + r() * view.w, y = view.y + r() * view.h
      if (!inPoly(x, y, COAST_XY)) continue
      if (rp.some((p) => Math.hypot(p[0] - x, p[1] - y) < 22 * px)) continue
      out.push([x, y, 0.7 + r() * 0.5, r() < 0.2 ? 'a-mound' : r() < 0.4 ? 'a-tuft' : 'a-tree'])
    }
    return out.sort((a, b) => a[1] - b[1])
  }, [view, route, px])

  // 화면 안에 들어오는 주변 명소만, 가까운 순으로 최대 6개
  const pois = useMemo(() => {
    if (!view) return []
    return spots.map((p) => ({ ...p, xy: pr([Number(p.lng), Number(p.lat)]) }))
      .filter((p) => p.xy[0] > view.x + 30 * px && p.xy[0] < view.x + view.w - 30 * px && p.xy[1] > view.y + 30 * px && p.xy[1] < view.y + view.h - 30 * px)
      .slice(0, 6)
  }, [view, spots, px])

  if (!route || !view) return null
  const d = routeD(route)
  const km = [0.5, 1, 2, 5, 10].reduce((b, k) => (Math.abs(k / 0.0741 - 90 * px) < Math.abs(b / 0.0741 - 90 * px) ? k : b), 1)   // 1 좌표단위 ≈ 74m
  const barLen = km / 0.0741
  const T = (n) => ({ fontSize: n * px, strokeWidth: n * 0.3 * px })

  return (
    <figure className="mini-map-wrap">
      <svg className="mini-map" viewBox={`${view.x} ${view.y} ${view.w} ${view.h}`} role="img" aria-label={`${g.course} 코스 확대 지도`}>
        <defs>
          <filter id="c-wobble" x="-5%" y="-5%" width="110%" height="110%">
            <feTurbulence type="fractalNoise" baseFrequency={0.03 / px / 4} numOctaves="2" seed="4" result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale={5 * px} xChannelSelector="R" yChannelSelector="G" />
          </filter>
          <filter id="c-bleed" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation={16 * px} /></filter>
        </defs>

        <rect x={view.x - 10} y={view.y - 10} width={view.w + 20} height={view.h + 20} fill={PAPER} />
        {/* 바다: 해안선에서 번져 나가는 물빛 */}
        <g filter="url(#c-bleed)">
          <path d={COAST_D} fill="none" stroke="#a9cfe0" strokeOpacity=".6" strokeWidth={150 * px} strokeLinejoin="round" />
          {ISLANDS.map((p, i) => <path key={i} d={p} fill="none" stroke="#a9cfe0" strokeOpacity=".6" strokeWidth={150 * px} strokeLinejoin="round" />)}
        </g>
        {/* 땅: 연한 수채 + 펜 윤곽 */}
        <g filter="url(#c-wobble)">
          <path d={COAST_D} fill="url(#a-wash)" />
          {ISLANDS.map((p, i) => <path key={i} d={p} fill="url(#a-wash)" />)}
          <path d={COAST_D} fill="none" stroke={INK} strokeWidth={2.6 * px} strokeLinejoin="round" />
          {ISLANDS.map((p, i) => <path key={i} d={p} fill="none" stroke={INK} strokeWidth={2.6 * px} strokeLinejoin="round" />)}
          <path d={COAST_D} transform={`translate(${2.5 * px} ${2 * px})`} fill="none" stroke={INK} strokeOpacity=".25" strokeWidth={1.4 * px} strokeLinejoin="round" />
        </g>
        {/* 물결 표시 */}
        {[0.12, 0.3, 0.5, 0.72, 0.9].map((fx, i) => (
          <path key={i} d="M0 0 h18 M5 6 h11 M8 12 h5" transform={`translate(${view.x + view.w * fx} ${view.y + view.h * (0.1 + ((i * 37) % 80) / 100)}) scale(${px * 1.2})`} fill="none" stroke="#7fa7b8" strokeOpacity=".5" strokeWidth="1.8" strokeLinecap="round" />
        ))}
        {/* 나무·풀·오름 */}
        <g filter="url(#c-wobble)" style={{ pointerEvents: 'none' }}>
          {trees.map(([x, y, s, id], i) => <use key={i} href={`#${id}`} transform={`translate(${x} ${y}) scale(${s * px * 0.95})`} />)}
        </g>

        {/* 주변 명소 */}
        {pois.map((p) => (
          <g key={p.id} transform={`translate(${p.xy[0]} ${p.xy[1]})`}>
            <circle r={5 * px} fill="#2b8fd9" stroke="#fffdf8" strokeWidth={2 * px} />
            <text y={-10 * px} textAnchor="middle" className="map-label" style={T(14)}>{p.title.length > 9 ? `${p.title.slice(0, 9)}…` : p.title}</text>
          </g>
        ))}

        {/* 코스 경로: 종이색 테두리 + 주황빨강 선 */}
        <path d={d} fill="none" stroke={PAPER} strokeWidth="15" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        <path d={d} fill="none" stroke="#e4572e" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={route.type === 'line' ? '2 10' : undefined} vectorEffect="non-scaling-stroke" />

        {/* 출발·도착 */}
        <g transform={`translate(${pins.s[0]} ${pins.s[1]})`}>
          <circle r={9 * px} fill="#fffdf8" stroke="#3d3b37" strokeWidth={3.5 * px} />
          <text y={-17 * px} textAnchor="middle" className="map-pin" style={T(16)}>{pins.loop ? '출발·도착' : '출발'} {g.start.length > 12 ? `${g.start.slice(0, 12)}…` : g.start}</text>
        </g>
        {!pins.loop && (
          <g transform={`translate(${pins.e[0]} ${pins.e[1]})`}>
            <circle r={9 * px} fill="#3d3b37" stroke="#fffdf8" strokeWidth={3.5 * px} />
            <text y={27 * px} textAnchor="middle" className="map-pin" style={T(16)}>도착 {g.end.length > 12 ? `${g.end.slice(0, 12)}…` : g.end}</text>
          </g>
        )}

        {/* 축척 */}
        <g transform={`translate(${view.x + 22 * px} ${view.y + view.h - 24 * px})`} style={{ pointerEvents: 'none' }}>
          <path d={`M0 0 v${-6 * px} M0 0 H${barLen} M${barLen} 0 v${-6 * px}`} fill="none" stroke={INK} strokeWidth={2 * px} />
          <text x={barLen + 8 * px} y={5 * px} className="map-label" style={T(14)}>{km}km</text>
        </g>
      </svg>
      <figcaption className="small text-muted mt-2">
        <span className="legend-dot start" /> 출발 <span className="legend-dot end ms-3" /> 도착 <span className="legend-dot spot ms-3" /> 주변 명소
        <div className="mt-1">
          {route.accurate
            ? '경로: OpenStreetMap에 기록된 실제 올레길 (© OpenStreetMap contributors)'
            : '이 코스는 경로 데이터가 없어 해안선을 따라 그린 대략적인 선이에요 (© OpenStreetMap contributors)'}
        </div>
      </figcaption>
    </figure>
  )
}
