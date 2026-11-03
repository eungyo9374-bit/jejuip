import { Component, Suspense, useEffect, useMemo, useState } from 'react'
import { Col, Row } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import * as THREE from 'three'
import PageHeader from '../components/PageHeader'
import { ErrorAlert, Loading } from '../components/Status'
import Jeju3DMap, { homeView } from '../components/Jeju3DMap'
import { fetchHeritageNear, fetchNearby, fetchOlle, fetchWeather } from '../api/client'
import { routeOf } from '../lib/jejuMap'
import { heightAt, toXZ } from '../lib/terrain'
import { useAppStore } from '../store/useAppStore'

const keyOf = (c) => c.course.replace('코스', '')
const PREVIEWS = [['auto', '오늘 날씨'], ['clear', '맑음'], ['cloudy', '흐림'], ['rain', '비'], ['snow', '눈']]

// 경로의 한가운데 점 (3D 좌표)
function midOf(parts) {
  const pts = parts.reduce((a, b) => (b.length > a.length ? b : a))
  const [lng, lat] = pts[Math.floor(pts.length / 2)]
  const [x, z] = toXZ(lng, lat)
  return [x, heightAt(lng, lat), z]
}

function weatherMode(slot) {
  if (!slot) return 'clear'
  if (slot.rain === '눈') return 'snow'
  if (slot.rain && slot.rain !== '없음') return 'rain'
  if (slot.sky === '흐림') return 'cloudy'
  return 'clear'
}

const hasWebGL = () => {
  try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')) } catch { return false }
}

// 3D 장면에서 오류가 나도 페이지가 하얗게 되지 않도록
class Boundary extends Component {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() { return this.state.failed ? this.props.fallback : this.props.children }
}

function Fallback() {
  return (
    <div className="m3d-fallback">
      <p className="mb-2">이 기기에서는 3D 지도를 그릴 수 없어요.</p>
      <Link to="/map" className="link-underline">손그림 올레 지도로 보기</Link>
    </div>
  )
}

// 3D 올레 지도 — 실제 고도로 만든 제주 위에 코스 선·명소 핀·날씨(비·눈) 효과
export default function Map3D() {
  const [courses, setCourses] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [view, setView] = useState(homeView)
  const [weather, setWeather] = useState({})            // 지역 → 예보 목록
  const [preview, setPreview] = useState('auto')
  const [tour, setTour] = useState([])
  const [heritage, setHeritage] = useState([])
  const [activePin, setActivePin] = useState(null)
  const addFavorite = useAppStore((s) => s.addFavorite)
  const [gl] = useState(hasWebGL)

  useEffect(() => {
    fetchOlle().then(setCourses).catch((e) => setError(e.message)).finally(() => setLoading(false))
    fetchWeather('제주시').then((w) => setWeather((o) => ({ ...o, 제주시: w }))).catch(() => {})
  }, [])

  const groups = useMemo(() => {
    const m = new Map()
    courses.forEach((c) => { const k = keyOf(c); if (!m.has(k)) m.set(k, []); m.get(k).push(c) })
    return [...m.entries()].map(([key, list]) => {
      const route = routeOf(key, list[0].id)
      return route && route.parts.every((q) => q.every((pt) => pt[1] < 33.8)) ? { key, list, c: list[0], route, mid: midOf(route.parts) } : null
    }).filter(Boolean)
  }, [courses])

  const sel = groups.find((g) => g.key === selected)
  const place = sel?.c.weatherPlace ?? '제주시'
  const slots = weather[place]
  const autoMode = weatherMode(slots?.[0])
  const mode = preview === 'auto' ? autoMode : preview

  function select(key) {
    const g = groups.find((x) => x.key === key)
    if (!g) return
    setSelected(key); setActivePin(null); setTour([]); setHeritage([])
    const xz = g.route.parts.flat().map(([lng, lat]) => toXZ(lng, lat))
    const xs = xz.map((p) => p[0]), zs = xz.map((p) => p[1])
    const cx = (Math.min(...xs) + Math.max(...xs)) / 2, cz = (Math.min(...zs) + Math.max(...zs)) / 2
    const size = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...zs) - Math.min(...zs), 2.5)
    setView({ look: new THREE.Vector3(cx, 0.2, cz), pos: new THREE.Vector3(cx, 0.75 * size + 2, cz + 0.95 * size + 2.5) })
    fetchNearby(g.c.lat, g.c.lng).then(setTour).catch(() => setTour([]))
    fetchHeritageNear(g.c.lat, g.c.lng).then(setHeritage).catch(() => setHeritage([]))
    if (!weather[g.c.weatherPlace]) fetchWeather(g.c.weatherPlace).then((w) => setWeather((o) => ({ ...o, [g.c.weatherPlace]: w }))).catch(() => {})
  }
  const reset = () => { setSelected(null); setActivePin(null); setTour([]); setHeritage([]); setView(homeView()) }

  const pins = useMemo(() => [
    ...tour.filter((t) => Number(t.lat) > 0 && Number(t.lng) > 0).map((t) => ({ id: `t-${t.id}`, kind: 'tour', title: t.title, lat: Number(t.lat), lng: Number(t.lng) })),
    ...heritage.filter((h) => Number(h.lat) > 0 && Number(h.lng) > 0).map((h) => ({ id: `h-${h.name}`, kind: 'heritage', title: h.name, lat: Number(h.lat), lng: Number(h.lng) })),
  ], [tour, heritage])

  const slot = slots?.[0]
  return (
    <>
      <PageHeader title="3D 올레 지도" subtitle="실제 고도로 만든 제주 위에서 코스를 돌려 보세요 — 끌어서 회전, 휠·두 손가락으로 확대" />
      <ErrorAlert error={error} />
      {loading ? <Loading /> : (
        <Row className="g-4">
          <Col lg={9}>
            <div className="m3d-wrap">
              {gl ? (
                <Boundary fallback={<Fallback />}>
                  <Suspense fallback={<Loading text="3D 지도를 그리는 중..." />}>
                    <Jeju3DMap groups={groups} selected={selected} onSelect={select} pins={pins} activePin={activePin} onActivePin={setActivePin} view={view} mode={mode} />
                  </Suspense>
                </Boundary>
              ) : <Fallback />}
              {selected && <button type="button" className="map-reset" onClick={reset}>전체 보기</button>}
            </div>
            <div className="m3d-weather">
              <span className="eyebrow me-2">날씨 효과</span>
              {PREVIEWS.map(([k, label]) => (
                <button key={k} type="button" className={`chip ${preview === k ? 'on' : ''}`} onClick={() => setPreview(k)}>{label}</button>
              ))}
              <span className="small text-muted ms-2">
                {preview === 'auto'
                  ? (slot ? `${place} 예보: ${slot.sky}${slot.rain && slot.rain !== '없음' ? `, ${slot.rain}` : ''} · ${slot.temp}℃ · 강수확률 ${slot.pop}%` : '예보를 불러오는 중...')
                  : '미리보기 중이에요 (실제 날씨가 아니에요)'}
              </span>
            </div>
            <p className="photo-credit mb-0">고도 자료: Open-Meteo (Copernicus DEM, 약 1.2km 간격) · 높이는 실제보다 약 3.7배 과장했어요 · 해안선·경로 © OpenStreetMap contributors · 코스 선은 일부만 실제 올레길이고 나머지는 대략적인 선이에요 · 추자도 코스는 3D에서 뺐어요 · 명소는 한국관광공사, 문화유산은 국가유산청, 날씨는 기상청</p>
          </Col>
          <Col lg={3}>
            {sel ? (
              <article className="map-panel">
                <div className="eyebrow">{sel.c.area}</div>
                <h3 className="serif" style={{ fontSize: '1.5rem' }}>{sel.c.course} · {sel.c.name.replace(/\([AB]\)/, '')}</h3>
                <div className="olle-tags mt-2 mb-2"><span>{sel.c.distance}</span><span>{sel.c.duration}</span><span>{sel.c.level}</span></div>
                <div className="d-flex gap-3 mb-3">
                  <Link to={`/olle/${sel.key}`} className="link-underline">상세 보기</Link>
                  <button type="button" className="link-underline" onClick={() => addFavorite({ source: 'olle', id: sel.key, title: `${sel.c.course} ${sel.c.name.replace(/\([AB]\)/, '')}` })}>올레 수첩에 담기</button>
                </div>
                <div className="small mb-1"><span className="m3d-dot" style={{ background: '#f2a93b' }} /> 주변 관광지 {tour.length}곳 · <span className="m3d-dot" style={{ background: '#7b5ea7' }} /> 문화유산 {heritage.length}곳</div>
                <ul className="m3d-pins">
                  {pins.map((p) => (
                    <li key={p.id}>
                      <button type="button" className={activePin === p.id ? 'on' : ''} onClick={() => setActivePin(p.id)} onMouseEnter={() => setActivePin(p.id)}>
                        <span className="m3d-dot" style={{ background: p.kind === 'heritage' ? '#7b5ea7' : '#f2a93b' }} />{p.title}
                      </button>
                    </li>
                  ))}
                </ul>
              </article>
            ) : (
              <div>
                <div className="eyebrow">{groups.length}개 코스</div>
                <h3 className="serif" style={{ fontSize: '1.4rem' }}>번호를 눌러 보세요</h3>
                <p className="small text-muted">지도 위 번호나 아래 번호를 누르면 카메라가 그 코스로 날아가고, 주변 관광지·문화유산 핀이 나타나요.</p>
              </div>
            )}
            <div className="map-chips mt-3">
              {groups.map((g) => <button key={g.key} type="button" className={`chip ${selected === g.key ? 'on' : ''}`} onClick={() => select(g.key)}>{g.key}</button>)}
            </div>
          </Col>
        </Row>
      )}
    </>
  )
}
