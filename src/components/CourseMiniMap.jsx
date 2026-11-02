import { useMemo } from 'react'
import MAP from '../data/jeju-map.json'
import { H, W, midpoint, pathD, pr } from '../lib/jejuMap'
import { keyFromId } from '../lib/olle'
import { LandArt, SeaArt } from './JejuArt'

// 코스 위치 미니 지도 — 제주 전체 그림 위에 "이 코스"만 주황색 선으로 크게, 나머지 코스는 연하게 보여줘요
// g: lib/olle.js 의 groupCourses() 가 만든 코스 묶음
export default function CourseMiniMap({ g }) {
  const route = MAP.routes[g.variants[0].id]
  const mainPoly = useMemo(() => MAP.rings.find((r) => r.main).pts.map(pr), [])
  const others = useMemo(() => Object.entries(MAP.routes).filter(([id]) => keyFromId(id) !== g.key), [g.key])
  if (!route) return null

  const a = pr(route.pts[0]), b = pr(route.pts[route.pts.length - 1]), mid = midpoint(route.pts)
  // 이름표는 섬 가운데에서 바깥쪽 방향으로 빼서 달아요
  const [cx, cy] = pr([126.55, 33.38])
  let dx = mid[0] - cx, dy = mid[1] - cy
  const len = Math.hypot(dx, dy) || 1
  dx /= len; dy /= len
  // 이름표가 그림 밖으로 잘리지 않게 가운데 정렬하고 좌우·상하 범위를 제한해요
  const ex = Math.min(Math.max(mid[0] + dx * 150, 250), W - 250), ey = Math.min(Math.max(mid[1] + dy * 150, 70), H - 40)
  const d = pathD(route.pts, route.type === 'loop')

  return (
    <figure className="mini-map-wrap">
      <svg className="mini-map" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`제주도에서 ${g.course}의 위치`}>
        <SeaArt mainPoly={mainPoly} rings={MAP.rings} pathD={pathD} moving={false} />
        <LandArt rings={MAP.rings} mainPoly={mainPoly} pr={pr} pathD={pathD} moving={false} light />
        <use href="#a-halla" transform={`translate(${pr([126.53, 33.372]).join(' ')}) scale(1.15)`} style={{ pointerEvents: 'none' }} />

        {/* 다른 코스: 연하게 */}
        {others.map(([id, r]) => (
          <path key={id} d={pathD(r.pts, r.type === 'loop')} fill="none" stroke="#2b8fd9" strokeOpacity=".4" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
            strokeDasharray={r.type === 'line' ? '2 7' : undefined} vectorEffect="non-scaling-stroke" />
        ))}

        {/* 이 코스: 종이색 테두리 + 주황빨강 선 */}
        <path d={d} fill="none" stroke="#f6f1e6" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        <path d={d} fill="none" stroke="#e4572e" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={route.type === 'line' ? '2 9' : undefined} vectorEffect="non-scaling-stroke" />

        {/* 출발 · 도착 */}
        <g transform={`translate(${a[0]} ${a[1]})`}><circle r="19" fill="#fffdf8" stroke="#3d3b37" strokeWidth="6" /></g>
        {route.type !== 'loop' && <g transform={`translate(${b[0]} ${b[1]})`}><circle r="19" fill="#3d3b37" stroke="#fffdf8" strokeWidth="6" /></g>}

        {/* "여기예요" 맥박 + 설명선 */}
        <g transform={`translate(${mid[0]} ${mid[1]})`}><circle r="16" className="mini-pulse" fill="none" stroke="#e4572e" strokeWidth="5" /></g>
        <line x1={mid[0]} y1={mid[1]} x2={ex} y2={ey} stroke="#7d8f99" strokeWidth="2" strokeDasharray="4 5" vectorEffect="non-scaling-stroke" />
        <text x={ex} y={ey + (dy > 0 ? 44 : -14)} textAnchor="middle" className="map-callout" style={{ fontSize: 52 }}>
          <tspan className="num">{g.course}</tspan> {g.name}
        </text>
      </svg>
      <figcaption className="small text-muted mt-2">
        <span className="legend-dot start" /> 출발 <span className="legend-dot end ms-3" /> 도착
        <span className="ms-3">제주 전체 지도에서 이 코스의 위치예요 (대략적인 선)</span>
      </figcaption>
    </figure>
  )
}
