import { useEffect, useState } from 'react'
import { Col, Row } from 'react-bootstrap'
import { Link, useParams } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import ItemCard from '../components/ItemCard'
import { Empty, ErrorAlert, Loading } from '../components/Status'
import { fetchHeritageNear, fetchNearby, fetchOlle, fetchWeather } from '../api/client'
import { useAppStore } from '../store/useAppStore'

// 올레 코스 상세 — 코스 정보(올레코스현황) + 날씨(기상청) + 시종점 주변 명소(TourAPI)
export default function OlleDetail() {
  const { id } = useParams()
  const addFavorite = useAppStore((s) => s.addFavorite)
  const [course, setCourse] = useState(null)
  const [weather, setWeather] = useState([])
  const [spots, setSpots] = useState([])
  const [heritage, setHeritage] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true); setError('')
    fetchOlle().then(async (list) => {
      const c = list.find((x) => x.id === id)
      setCourse(c ?? null)
      if (!c) return
      // 날씨와 주변 명소는 코스를 찾은 뒤 동시에 불러옵니다 (하나가 실패해도 나머지는 보여줌)
      const [w, n, h] = await Promise.allSettled([fetchWeather(c.weatherPlace), fetchNearby(c.lat, c.lng), fetchHeritageNear(c.lat, c.lng)])
      setWeather(w.status === 'fulfilled' ? w.value : [])
      setSpots(n.status === 'fulfilled' ? n.value : [])
      setHeritage(h.status === 'fulfilled' ? h.value : [])
    }).catch((e) => setError(e.message)).finally(() => setLoading(false))
  }, [id])

  if (loading) return <Loading />
  if (error) return <ErrorAlert error={error} />
  if (!course) return <Empty text="없는 코스예요" />

  const now = weather[0]
  const walkable = now && now.rain === '없음' && now.pop < 40
  const route = `${course.start}${course.end && course.end !== course.start ? ` → ${course.end}` : ''}`
  const question = `${course.course} ${course.name} 코스를 걸으려는데 오늘 날씨랑 주변에서 볼 만한 곳 알려줘`

  return (
    <>
      <PageHeader title={`${course.course} · ${course.name}`} subtitle={`${course.area} — ${route}`} />

      <Row className="g-4 mb-5">
        <Col md={5}>
          <div className="stat-grid">
            <div><div className="eyebrow">거리</div><div className="serif stat">{course.distance}</div></div>
            <div><div className="eyebrow">소요시간</div><div className="serif stat">{course.duration}</div></div>
            <div><div className="eyebrow">난이도(거리 기준)</div><div className="serif stat">{course.level}</div></div>
          </div>
          <div className="d-flex flex-wrap gap-3 mt-4">
            <button className="link-underline" onClick={() => addFavorite({ source: 'olle', id: course.id, title: `${course.course} ${course.name}` })}>올레 수첩에 담기</button>
            <Link to={`/agent?q=${encodeURIComponent(question)}`} className="link-underline">걷기 도우미에게 묻기</Link>
          </div>
        </Col>
        <Col md={7}>
          <div className="eyebrow">오늘의 걷기 날씨 · {course.weatherPlace} 기준</div>
          {now ? (
            <>
              <h3 className="serif" style={{ fontSize: '1.5rem' }}>{walkable ? '걷기 좋은 날씨예요' : '날씨를 확인하고 출발하세요'}</h3>
              <p className="small text-muted mb-3">{now.temp}℃ · {now.sky} · 강수확률 {now.pop}%{now.rain !== '없음' ? ` · ${now.rain}` : ''}</p>
              <div className="forecast">
                {weather.map((w) => (
                  <div key={w.time}><div className="small text-muted">{w.time.slice(9, 11)}시</div><div>{w.temp}℃</div><div className="small text-muted">{w.pop}%</div></div>
                ))}
              </div>
              <p className="small text-muted mt-2 mb-0">기상청 단기예보는 제주시·서귀포시 기준이라 해안·산지 날씨와 다를 수 있어요.</p>
            </>
          ) : <p className="text-muted small">날씨를 불러오지 못했어요.</p>}
        </Col>
      </Row>

      <h3 className="serif mb-3" style={{ fontSize: '1.4rem' }}>코스 주변 명소</h3>
      <p className="small text-muted mb-3">코스가 지나는 권역의 중심에서 가까운 순으로 보여드려요 (대략적인 위치 기준).</p>
      {spots.length === 0 ? <Empty text="주변 명소 검색 결과가 없어요" /> : (
        <Row xs={1} sm={2} lg={3} className="g-4">
          {spots.map((p) => (
            <Col key={p.id}>
              <ItemCard title={p.title} subtitle={p.addr} image={p.image} badge="관광지"
                onSave={() => addFavorite({ source: 'tour', id: p.id, title: p.title })} />
            </Col>
          ))}
        </Row>
      )}
      <h3 className="serif mt-5 mb-1" style={{ fontSize: '1.4rem' }}>코스 주변 문화유산</h3>
      <p className="small text-muted mb-3">국가유산청 자료에서 권역 중심 반경 약 8km 안의 문화유산을 가까운 순으로 보여드려요.</p>
      {heritage.length === 0 ? <Empty text="주변 문화유산이 없어요" /> : (
        <div className="heritage-list">
          {heritage.map((h) => (
            <div key={`${h.name}-${h.dist}`} className="heritage-row">
              <div>
                <div className="eyebrow mb-1">{h.kind}</div>
                <div className="item-title serif">{h.name}</div>
                <div className="item-sub mb-0">{h.city} · 약 {(h.dist / 1000).toFixed(1)}km</div>
              </div>
              <button type="button" className="link-underline" onClick={() => addFavorite({ source: 'heritage', id: h.name, title: h.name })}>올레 수첩에 담기</button>
            </div>
          ))}
        </div>
      )}
      <p className="small mt-5"><Link to="/olle" className="link-underline">← 코스 목록</Link></p>
    </>
  )
}
