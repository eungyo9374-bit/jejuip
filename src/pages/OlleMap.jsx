import { useEffect, useMemo, useRef, useState } from 'react'
import { Col, Row } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import PageHeader from '../components/PageHeader'
import { ErrorAlert, Loading } from '../components/Status'
import { fetchOlle } from '../api/client'
import { COURSE_PHOTOS } from '../data/olle-photos'
import { useAppStore } from '../store/useAppStore'

const keyOf = (c) => c.course.replace('코스', '')

// 올레 지도 — 위성사진 지도 위에 코스별 실제 사진 마커 (Leaflet + Esri World Imagery)
export default function OlleMap() {
  const addFavorite = useAppStore((s) => s.addFavorite)
  const [courses, setCourses] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)       // 선택한 코스 번호 (예: '7')
  const mapEl = useRef(null)
  const map = useRef(null)
  const markers = useRef({})                            // 코스 번호 → 마커
  const detail = useRef(null)                           // 선택 코스의 시작·도착 표시 레이어

  // 같은 번호의 갈래(3코스 A/B 등)는 한 마커로 묶습니다
  const groups = useMemo(() => {
    const m = new Map()
    courses.forEach((c) => { const k = keyOf(c); if (!m.has(k)) m.set(k, []); m.get(k).push(c) })
    return [...m.entries()].map(([key, list]) => ({ key, list, c: list[0] }))
  }, [courses])

  useEffect(() => {
    fetchOlle().then(setCourses).catch((e) => setError(e.message)).finally(() => setLoading(false))
  }, [])

  // 지도 만들기 (코스 데이터가 도착한 뒤 한 번)
  useEffect(() => {
    if (loading || !mapEl.current || map.current || groups.length === 0) return
    const m = L.map(mapEl.current, { zoomSnap: 0.25, scrollWheelZoom: false })
    map.current = m
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 17,
      attribution: '위성영상 © Esri, Maxar, Earthstar Geographics',
    }).addTo(m)
    m.fitBounds([[33.1, 126.15], [33.6, 127.0]])        // 제주 본섬 + 우도 (추자도는 목록에서 선택)

    groups.forEach(({ key, c }) => {
      if (!c.lat) return
      const photo = COURSE_PHOTOS[key]?.image
      const icon = L.divIcon({
        className: 'pm-wrap',
        html: `<div class="pm">${photo ? `<img src="${photo}" alt="" onerror="this.remove()">` : ''}<span>${key}</span></div>`,
        iconSize: [48, 48], iconAnchor: [24, 24],
      })
      const mk = L.marker([c.lat, c.lng], { icon, title: `${key}코스 ${c.name}` }).addTo(m)
      mk.on('click', () => setSelected(key))
      markers.current[key] = mk
    })
    return () => { m.remove(); map.current = null; markers.current = {} }
  }, [loading, groups])

  // 선택이 바뀌면: 마커 강조 + 시작·도착 표시 + 지도 이동
  useEffect(() => {
    const m = map.current
    if (!m) return
    Object.entries(markers.current).forEach(([k, mk]) => mk.getElement()?.classList.toggle('on', k === selected))
    detail.current?.remove(); detail.current = null
    const g = groups.find((x) => x.key === selected)
    if (!g) return
    const layer = L.layerGroup().addTo(m)
    detail.current = layer
    const pts = []
    g.list.forEach((c) => {
      if (c.startLat) { pts.push([c.startLat, c.startLng]); L.circleMarker([c.startLat, c.startLng], dot('#fff')).bindTooltip(`출발 · ${c.start}`).addTo(layer) }
      if (c.endLat && c.end !== c.start) { pts.push([c.endLat, c.endLng]); L.circleMarker([c.endLat, c.endLng], dot('#e9b44c')).bindTooltip(`도착 · ${c.end}`).addTo(layer) }
    })
    if (pts.length > 1) m.flyToBounds(pts, { padding: [80, 80], maxZoom: 13, duration: 0.8 })
    else if (pts.length === 1) m.flyTo(pts[0], 13, { duration: 0.8 })
  }, [selected, groups])

  const sel = groups.find((g) => g.key === selected)

  return (
    <>
      <PageHeader title="올레 지도" subtitle="위성사진 위에서 코스를 고르고, 마커를 눌러 거리·시간·사진을 확인하세요" />
      <ErrorAlert error={error} />
      {loading ? <Loading /> : (
        <Row className="g-4">
          <Col lg={8}>
            <div ref={mapEl} className="olle-map" />
            <p className="photo-credit mb-0">마커 사진 · 한국관광공사 TourAPI(코스 인근 관광지) / 코스 위치는 시종점 지명 기준 대략값이에요</p>
          </Col>
          <Col lg={4}>
            {sel ? <Panel g={sel} onSave={addFavorite} onClose={() => setSelected(null)} /> : (
              <div>
                <div className="eyebrow">{groups.length}개 코스</div>
                <h3 className="serif" style={{ fontSize: '1.4rem' }}>마커를 눌러 보세요</h3>
                <p className="small text-muted">지도의 사진 마커 또는 아래 번호를 누르면 코스 정보가 나와요.</p>
              </div>
            )}
            <div className="map-chips mt-3">
              {groups.map((g) => (
                <button key={g.key} type="button" className={`chip ${selected === g.key ? 'on' : ''}`} onClick={() => setSelected(g.key)}>{g.key}</button>
              ))}
            </div>
          </Col>
        </Row>
      )}
    </>
  )
}

const dot = (fill) => ({ radius: 7, color: '#2b2926', weight: 2, fillColor: fill, fillOpacity: 1 })

function Panel({ g, onSave, onClose }) {
  const photo = COURSE_PHOTOS[g.key]
  return (
    <article className="map-panel">
      {photo && (
        <div className="media" style={{ aspectRatio: '4 / 3' }}>
          <img src={photo.image} alt={photo.spot} />
        </div>
      )}
      {photo && <p className="small text-muted mb-2">사진 · {photo.spot} (코스 인근)</p>}
      <div className="eyebrow">{g.c.area}</div>
      <h3 className="serif" style={{ fontSize: '1.5rem' }}>{g.c.course} · {g.c.name.replace(/\([AB]\)/, '')}</h3>
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
      <button type="button" className="link-underline small" onClick={onClose}>선택 해제</button>
    </article>
  )
}
