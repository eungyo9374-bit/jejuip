import { useEffect, useMemo, useRef, useState } from 'react'
import { Col, Row } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import { ErrorAlert, Loading } from '../components/Status'
import { fetchOlle } from '../api/client'
import MAP from '../data/jeju-map.json'
import { useAppStore } from '../store/useAppStore'

// ── 지도 좌표계 ───────────────────────────────────────────
// 위도·경도를 평면(SVG) 좌표로 바꿉니다. 추자도는 본섬에서 멀어서 한 화면에 들어오도록 아래쪽으로 옮겨 그렸어요.
const S = 1500                        // 1도당 픽셀
const KX = Math.cos((33.4 * Math.PI) / 180)
const LNG0 = 126.12
const LAT_TOP = 33.67
const CHUJA_SHIFT = 0.37
const pr = ([lng, lat]) => [(lng - LNG0) * KX * S, (LAT_TOP - (lat > 33.8 ? lat - CHUJA_SHIFT : lat)) * S]
const W = 1110, H = 860               // 처음 보이는 전체 영역

const keyOf = (c) => c.course.replace('코스', '')
const pathD = (pts, close) => pts.map((p, i) => { const [x, y] = pr(p); return `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}` }).join('') + (close ? 'Z' : '')

// 경로의 한가운데 점 (코스 번호 배지를 놓는 자리)
function midpoint(pts) {
  const xy = pts.map(pr)
  let total = 0; const seg = []
  for (let i = 1; i < xy.length; i++) { const d = Math.hypot(xy[i][0] - xy[i - 1][0], xy[i][1] - xy[i - 1][1]); seg.push(d); total += d }
  let acc = 0
  for (let i = 0; i < seg.length; i++) {
    if (acc + seg[i] >= total / 2) { const t = (total / 2 - acc) / (seg[i] || 1); return [xy[i][0] + (xy[i + 1][0] - xy[i][0]) * t, xy[i][1] + (xy[i + 1][1] - xy[i][1]) * t] }
    acc += seg[i]
  }
  return xy[0]
}

const LABELS = [
  ['제주시', 126.53, 33.47], ['서귀포시', 126.56, 33.28], ['조천', 126.65, 33.47], ['구좌', 126.8, 33.46], ['성산', 126.88, 33.4],
  ['표선', 126.77, 33.33], ['남원', 126.7, 33.3], ['중문', 126.42, 33.29], ['대정', 126.26, 33.26], ['한림', 126.3, 33.37], ['애월', 126.38, 33.44],
]
const ISLANDS = [['우도', 126.985, 33.47], ['가파도', 126.3, 33.145], ['마라도', 126.31, 33.085], ['추자도', 126.31, 33.905]]

// 올레 지도 — 일러스트풍 제주 지도 위에 코스 경로선과 번호 배지
export default function OlleMap() {
  const addFavorite = useAppStore((s) => s.addFavorite)
  const [courses, setCourses] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)       // 선택한 코스 번호 (예: '7')
  const [hover, setHover] = useState(null)
  const [vb, setVb] = useState({ x: 0, y: 0, w: W, h: H })
  const anim = useRef(0)

  useEffect(() => {
    fetchOlle().then(setCourses).catch((e) => setError(e.message)).finally(() => setLoading(false))
  }, [])

  // 같은 번호의 갈래(3코스 A/B 등)는 하나로 묶어 대표 경로 하나만 그립니다
  const groups = useMemo(() => {
    const m = new Map()
    courses.forEach((c) => { const k = keyOf(c); if (!m.has(k)) m.set(k, []); m.get(k).push(c) })
    return [...m.entries()].map(([key, list]) => {
      const route = MAP.routes[list[0].id]
      return { key, list, c: list[0], route, mid: route ? midpoint(route.pts) : null }
    }).filter((g) => g.route)
  }, [courses])

  // 선택한 코스로 부드럽게 확대 / 전체 보기로 복귀
  function flyTo(target) {
    cancelAnimationFrame(anim.current)
    const from = vb, t0 = performance.now(), dur = 600
    const ease = (t) => 1 - (1 - t) ** 3
    const step = (now) => {
      const t = Math.min(1, (now - t0) / dur), e = ease(t)
      setVb({ x: from.x + (target.x - from.x) * e, y: from.y + (target.y - from.y) * e, w: from.w + (target.w - from.w) * e, h: from.h + (target.h - from.h) * e })
      if (t < 1) anim.current = requestAnimationFrame(step)
    }
    anim.current = requestAnimationFrame(step)
  }
  const select = (key) => {
    setSelected(key)
    const g = groups.find((x) => x.key === key)
    if (!g) return
    const xy = g.route.pts.map(pr)
    const xs = xy.map((p) => p[0]), ys = xy.map((p) => p[1])
    let w = Math.max(Math.max(...xs) - Math.min(...xs), 340) * 1.5
    let h = Math.max(Math.max(...ys) - Math.min(...ys), 340 * (H / W)) * 1.5
    if (w / h > W / H) h = w * (H / W); else w = h * (W / H)
    const cx = (Math.min(...xs) + Math.max(...xs)) / 2, cy = (Math.min(...ys) + Math.max(...ys)) / 2
    flyTo({ x: cx - w / 2, y: cy - h / 2, w, h })
  }
  const reset = () => { setSelected(null); flyTo({ x: 0, y: 0, w: W, h: H }) }

  const k = vb.w / W                      // 확대할수록 배지·글자는 작게 그려서 화면 크기를 유지
  const sel = groups.find((g) => g.key === selected)
  const hallasan = pr([126.53, 33.365])

  return (
    <>
      <PageHeader title="올레 지도" subtitle="코스의 번호를 눌러 경로와 거리·소요시간을 확인하세요" />
      <ErrorAlert error={error} />
      {loading ? <Loading /> : (
        <Row className="g-4">
          <Col lg={9}>
            <div className="olle-svg-wrap">
              <svg className="olle-svg" viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`} role="img" aria-label="제주 올레길 코스 지도">
                <defs>
                  <pattern id="sea" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                    <rect width="14" height="14" fill="#d6ebf7" /><rect width="5" height="14" fill="#cbe5f4" />
                  </pattern>
                </defs>
                <rect x="-3000" y="-3000" width="7000" height="7000" fill="url(#sea)" onClick={reset} />

                {/* 섬: 그림자 → 바다 테두리 → 땅 */}
                {MAP.rings.map((r, i) => <path key={`s${i}`} d={pathD(r.pts, true)} transform="translate(9 11)" fill="#a9cfe3" />)}
                {MAP.rings.map((r, i) => <path key={`o${i}`} d={pathD(r.pts, true)} fill="#fffdf6" stroke="#8cc7e8" strokeWidth="6" strokeLinejoin="round" />)}
                {MAP.rings.map((r, i) => <path key={`l${i}`} d={pathD(r.pts, true)} fill="none" stroke="#fff" strokeWidth="2" strokeLinejoin="round" />)}

                {/* 한라산 그림 */}
                <g transform={`translate(${hallasan[0]} ${hallasan[1]}) scale(${Math.max(k, 0.5)})`} style={{ pointerEvents: 'none' }}>
                  <path d="M-92 36 L-38 -22 L-12 6 L26 -52 L58 -8 L74 -22 L112 36 Z" fill="#d4e6d2" stroke="#6f9a7e" strokeWidth="3" strokeLinejoin="round" />
                  <path d="M12 -26 L26 -52 L40 -30 L30 -34 L22 -26 Z" fill="#fff" stroke="#6f9a7e" strokeWidth="2" strokeLinejoin="round" />
                  <text y="62" textAnchor="middle" className="map-label strong">한라산</text>
                </g>

                {/* 지역 이름 */}
                {LABELS.map(([t, lng, lat]) => { const [x, y] = pr([lng, lat]); return <text key={t} x={x} y={y} textAnchor="middle" className="map-label" style={{ fontSize: 25 * Math.max(k, 0.55), opacity: selected ? 0.55 : 1 }}>{t}</text> })}
                {ISLANDS.map(([t, lng, lat]) => { const [x, y] = pr([lng, lat]); return <text key={t} x={x} y={y} textAnchor="middle" className="map-label" style={{ fontSize: 24 * Math.max(k, 0.55) }}>{t}</text> })}

                {/* 코스 경로: 흰 테두리 위에 색 선 */}
                {groups.map((g) => {
                  const on = g.key === selected, dim = selected && !on
                  const d = pathD(g.route.pts, g.route.type === 'loop')
                  return (
                    <g key={g.key} opacity={dim ? 0.28 : 1} onMouseEnter={() => setHover(g.key)} onMouseLeave={() => setHover(null)} onClick={() => select(g.key)} style={{ cursor: 'pointer' }}>
                      <path d={d} fill="none" stroke="#fff" strokeWidth={on ? 15 : 12} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
                      <path d={d} fill="none" stroke={on ? '#ff6a13' : hover === g.key ? '#006fe0' : '#1a8cff'} strokeWidth={on ? 8 : 6} strokeLinecap="round" strokeLinejoin="round"
                        strokeDasharray={g.route.type === 'line' ? '2 9' : undefined} vectorEffect="non-scaling-stroke" />
                      <path d={d} fill="none" stroke="transparent" strokeWidth="22" vectorEffect="non-scaling-stroke" />
                    </g>
                  )
                })}

                {/* 선택한 코스의 출발·도착 */}
                {sel && (() => {
                  const a = pr(sel.route.pts[0]), b = pr(sel.route.pts[sel.route.pts.length - 1])
                  return (
                    <g style={{ pointerEvents: 'none' }}>
                      <g transform={`translate(${a[0]} ${a[1]}) scale(${k})`}><circle r="12" fill="#fff" stroke="#2b2926" strokeWidth="4" /><text y="-20" textAnchor="middle" className="map-pin">출발</text></g>
                      {sel.route.type !== 'loop' && <g transform={`translate(${b[0]} ${b[1]}) scale(${k})`}><circle r="12" fill="#2b2926" stroke="#fff" strokeWidth="4" /><text y="-20" textAnchor="middle" className="map-pin">도착</text></g>}
                    </g>
                  )
                })()}

                {/* 코스 번호 배지 */}
                {groups.map((g) => {
                  const on = g.key === selected, dim = selected && !on
                  return (
                    <g key={g.key} transform={`translate(${g.mid[0]} ${g.mid[1]}) scale(${k})`} opacity={dim ? 0.4 : 1} className="map-badge" role="button" tabIndex={0}
                      onClick={() => select(g.key)} onKeyDown={(e) => e.key === 'Enter' && select(g.key)}
                      onMouseEnter={() => setHover(g.key)} onMouseLeave={() => setHover(null)} style={{ cursor: 'pointer' }}>
                      <title>{`${g.c.course} ${g.c.name.replace(/\([AB]\)/, '')} · ${g.c.distance}`}</title>
                      <circle r={on ? 29 : 23} fill={on ? '#ff6a13' : '#fff'} stroke={on ? '#fff' : '#1a8cff'} strokeWidth="5" />
                      <text y="7" textAnchor="middle" className="map-badge-text" fill={on ? '#fff' : '#12304a'} style={{ fontSize: g.key.length > 2 ? 15 : 22 }}>{g.key}</text>
                    </g>
                  )
                })}
              </svg>
              {selected && <button type="button" className="map-reset" onClick={reset}>전체 보기</button>}
            </div>
            <p className="photo-credit mb-0">해안선 © OpenStreetMap contributors · 경로선은 해안선을 따라 그린 대략적인 선이에요 (공식 경로 아님, 점선은 내륙 코스를 두 지점으로 이어 표시) · 추자도는 위치를 옮겨 그렸어요</p>
          </Col>
          <Col lg={3}>
            {sel ? <Panel g={sel} onSave={addFavorite} onClose={reset} /> : (
              <div>
                <div className="eyebrow">{groups.length}개 코스</div>
                <h3 className="serif" style={{ fontSize: '1.4rem' }}>번호를 눌러 보세요</h3>
                <p className="small text-muted">지도의 파란 선이 올레길이에요. 번호 배지나 아래 번호를 누르면 코스가 확대돼요.</p>
              </div>
            )}
            <div className="map-chips mt-3">
              {groups.map((g) => (
                <button key={g.key} type="button" className={`chip ${selected === g.key ? 'on' : ''}`} onClick={() => select(g.key)}>{g.key}</button>
              ))}
            </div>
          </Col>
        </Row>
      )}
    </>
  )
}

function Panel({ g, onSave, onClose }) {
  return (
    <article className="map-panel">
      <div className="eyebrow">{g.c.area}</div>
      <h3 className="serif" style={{ fontSize: '1.6rem' }}>{g.c.course} · {g.c.name.replace(/\([AB]\)/, '')}</h3>
      {g.route.type === 'line' && <p className="small text-muted">내륙을 지나는 코스라 출발·도착 두 지점을 점선으로 이었어요.</p>}
      {g.list.map((c) => (
        <div key={c.id} className="mb-3">
          {g.list.length > 1 && <div className="small fw-bold">{c.name}</div>}
          <div className="small text-muted">{c.start}{c.end && c.end !== c.start ? ` → ${c.end}` : ''}</div>
          <div className="olle-tags mt-2"><span>{c.distance}</span><span>{c.duration}</span><span>{c.level}</span></div>
          <div className="d-flex gap-3 mt-2">
            <Link to={`/olle/${c.id}`} className="link-underline">상세 보기</Link>
            <button type="button" className="link-underline" onClick={() => onSave({ source: 'olle', id: c.id, title: `${c.course} ${c.name}` })}>올레 수첩에 담기</button>
          </div>
        </div>
      ))}
      <button type="button" className="link-underline small" onClick={onClose}>선택 해제 · 전체 보기</button>
    </article>
  )
}
