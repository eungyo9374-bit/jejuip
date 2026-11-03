import { Component, Suspense, useEffect, useMemo, useState } from 'react'
import { Col, Row } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import * as THREE from 'three'
import PageHeader from '../components/PageHeader'
import { ErrorAlert, Loading } from '../components/Status'
import Jeju3DMap, { homeView } from '../components/Jeju3DMap'
import { fetchHeritageAll, fetchTourAll, fetchWeather } from '../api/client'
import { heightAt, toXZ } from '../lib/terrain'
import { useAppStore } from '../store/useAppStore'

const PREVIEWS = [['auto', '오늘 날씨'], ['clear', '맑음'], ['cloudy', '흐림'], ['rain', '비'], ['snow', '눈']]
const KIND = { tour: { label: '관광지', color: '#f2a93b' }, heritage: { label: '문화유산', color: '#7b5ea7' } }
// 지역 이름과 위치 (지도에 글자로 보이고, 누르면 그쪽으로 날아가요)
const REGIONS = [
  { name: '제주시', lng: 126.53, lat: 33.5 }, { name: '조천', lng: 126.65, lat: 33.52 }, { name: '구좌', lng: 126.8, lat: 33.52 },
  { name: '성산', lng: 126.92, lat: 33.44 }, { name: '표선', lng: 126.83, lat: 33.32 }, { name: '남원', lng: 126.7, lat: 33.28 },
  { name: '서귀포', lng: 126.56, lat: 33.25 }, { name: '중문', lng: 126.42, lat: 33.25 }, { name: '대정', lng: 126.25, lat: 33.24 },
  { name: '한림', lng: 126.27, lat: 33.41 }, { name: '애월', lng: 126.33, lat: 33.46 }, { name: '한라산', lng: 126.53, lat: 33.36 },
]

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

// 지도 위의 한 지점으로 날아가는 시점 (섬 바깥쪽 바다에서 안쪽을 바라봐요)
function viewAt(lng, lat, dist) {
  const [x, z] = toXZ(lng, lat)
  const len = Math.hypot(x, z)
  const [ox, oz] = len > 1.5 ? [x / len, z / len] : [0, 1]
  return { look: new THREE.Vector3(x, heightAt(lng, lat) * 0.6, z), pos: new THREE.Vector3(x + ox * dist, 0.5 * dist + 0.4 + heightAt(lng, lat), z + oz * dist) }
}

// 3D 제주 지도 — 실제 고도로 만든 제주 위에 관광지·문화유산 핀과 날씨 효과
export default function Map3D() {
  const [tour, setTour] = useState([])
  const [heritage, setHeritage] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [on, setOn] = useState({ tour: true, heritage: true })
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(null)        // 선택한 핀 id
  const [hover, setHover] = useState(null)
  const [view, setView] = useState(homeView)
  const [weather, setWeather] = useState({})            // 지역 → 예보 목록
  const [place, setPlace] = useState('제주시')
  const [preview, setPreview] = useState('auto')
  const addFavorite = useAppStore((s) => s.addFavorite)
  const [gl] = useState(hasWebGL)

  useEffect(() => {
    Promise.allSettled([fetchTourAll('12'), fetchTourAll('14'), fetchHeritageAll()]).then(([a, b, h]) => {
      const t = [...(a.status === 'fulfilled' ? a.value : []), ...(b.status === 'fulfilled' ? b.value : [])]
      setTour(t)
      setHeritage(h.status === 'fulfilled' ? h.value : [])
      if (!t.length && h.status !== 'fulfilled') setError('관광지·문화유산 정보를 불러오지 못했어요')
    }).finally(() => setLoading(false))
  }, [])
  useEffect(() => {
    if (weather[place]) return
    fetchWeather(place).then((w) => setWeather((o) => ({ ...o, [place]: w }))).catch(() => {})
  }, [place, weather])

  // 지도에 올리는 핀: 관광지·문화유산을 같은 모양의 자료로 맞춰요
  const pins = useMemo(() => [
    ...tour.map((t) => ({ id: `t-${t.id}`, kind: 'tour', title: t.title, sub: t.addr, image: t.image, srcId: t.id, lat: Number(t.lat), lng: Number(t.lng) })),
    ...heritage.map((h) => ({ id: `h-${h.name}`, kind: 'heritage', title: h.name, sub: `${h.kind} · ${h.city}`, srcId: h.name, lat: Number(h.lat), lng: Number(h.lng) })),
  ], [tour, heritage])
  const q = query.trim()
  const shown = useMemo(() => pins.filter((p) => on[p.kind] && (!q || p.title.includes(q))), [pins, on, q])
  const layers = useMemo(() => ['tour', 'heritage'].map((kind) => ({ kind, items: shown.filter((p) => p.kind === kind) })), [shown])
  const byId = useMemo(() => new Map(pins.map((p) => [p.id, p])), [pins])
  const sel = selected ? byId.get(selected) : null
  const hov = hover && hover !== selected ? byId.get(hover) : null

  function pick(id) {
    const p = byId.get(id)
    if (!p) return
    setSelected(id); setPlace(p.lat < 33.37 ? '서귀포시' : '제주시')
    setView(viewAt(p.lng, p.lat, 3.2))
  }
  function goRegion(r) {
    setSelected(null); setPlace(r.lat < 33.37 ? '서귀포시' : '제주시')
    setView(viewAt(r.lng, r.lat, r.name === '한라산' ? 9 : 6.5))
  }
  const reset = () => { setSelected(null); setPlace('제주시'); setView(homeView()) }

  const slots = weather[place]
  const slot = slots?.[0]
  const mode = preview === 'auto' ? weatherMode(slot) : preview
  const count = (k) => pins.filter((p) => p.kind === k).length

  return (
    <>
      <PageHeader title="3D 제주 지도" subtitle="실제 고도로 만든 제주에서 관광지와 문화유산을 찾아보세요 — 끌어서 회전, 휠·두 손가락으로 확대, 핀을 눌러 보세요" />
      <ErrorAlert error={error} />
      {loading ? <Loading /> : (
        <Row className="g-4">
          <Col lg={9}>
            <div className="m3d-wrap">
              {gl ? (
                <Boundary fallback={<Fallback />}>
                  <Suspense fallback={<Loading text="3D 지도를 그리는 중..." />}>
                    <Jeju3DMap layers={layers} regions={REGIONS} hoverPin={hov} selectedPin={sel} onHover={setHover} onSelect={pick} view={view} mode={mode} />
                  </Suspense>
                </Boundary>
              ) : <Fallback />}
              {(sel || view.pos.y < 8) && <button type="button" className="map-reset" onClick={reset}>전체 보기</button>}
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
            <p className="photo-credit mb-0">고도 자료: AWS Open Data Terrain Tiles (Mapzen · SRTM 등, 약 0.28km 간격) · 높이는 실제보다 약 3.7배 과장했어요 · 해안선 © OpenStreetMap contributors · 관광지는 한국관광공사, 문화유산은 국가유산청, 날씨는 기상청 (비·눈·구름 효과는 분위기 연출이에요) · 추자도는 3D에서 뺐어요</p>
          </Col>
          <Col lg={3}>
            <div className="eyebrow">제주 관광지·문화유산</div>
            <div className="map-chips mb-2">
              {Object.entries(KIND).map(([k, v]) => (
                <button key={k} type="button" className={`chip ${on[k] ? 'on' : ''}`} onClick={() => setOn((o) => ({ ...o, [k]: !o[k] }))}>
                  <span className="m3d-dot" style={{ background: v.color }} />{v.label} {count(k)}
                </button>
              ))}
            </div>
            <input type="search" className="form-control form-control-sm mb-2" placeholder="이름으로 찾기 (예: 오름, 성산, 관덕정)" value={query} onChange={(e) => setQuery(e.target.value)} />
            <div className="map-chips mb-3">
              {REGIONS.map((r) => <button key={r.name} type="button" className="chip" onClick={() => goRegion(r)}>{r.name}</button>)}
            </div>
            {sel ? (
              <article className="map-panel mb-3">
                <div className="eyebrow"><span className="m3d-dot" style={{ background: KIND[sel.kind].color }} />{KIND[sel.kind].label}</div>
                <h3 className="serif" style={{ fontSize: '1.35rem' }}>{sel.title}</h3>
                {sel.image && <img className="m3d-photo" src={sel.image.replace('http://', 'https://')} alt={sel.title} loading="lazy" />}
                <div className="small text-muted mb-2">{sel.sub}</div>
                <div className="d-flex gap-3">
                  <button type="button" className="link-underline" onClick={() => addFavorite({ source: sel.kind === 'tour' ? 'tour' : 'heritage', id: sel.srcId, title: sel.title, image: sel.image })}>내 수첩에 담기</button>
                  <button type="button" className="link-underline" onClick={() => setSelected(null)}>닫기</button>
                </div>
              </article>
            ) : (
              <p className="small text-muted">핀을 누르거나 아래 목록에서 고르면 그곳으로 날아가요. 지역 이름을 누르면 그 동네를 둘러볼 수 있어요.</p>
            )}
            <div className="small text-muted mb-1">{q || !(on.tour && on.heritage) ? `${shown.length}곳` : `전체 ${shown.length}곳`}</div>
            <ul className="m3d-pins">
              {shown.slice(0, 60).map((p) => (
                <li key={p.id}>
                  <button type="button" className={selected === p.id ? 'on' : ''} onClick={() => pick(p.id)} onMouseEnter={() => setHover(p.id)} onMouseLeave={() => setHover(null)}>
                    <span className="m3d-dot" style={{ background: KIND[p.kind].color }} />{p.title}
                  </button>
                </li>
              ))}
              {shown.length > 60 && <li className="small text-muted">…이름으로 찾으면 더 보여요</li>}
            </ul>
          </Col>
        </Row>
      )}
    </>
  )
}
