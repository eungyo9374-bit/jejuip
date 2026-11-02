import { useEffect, useState } from 'react'
import { Card, Col, Form, Row } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import { fetchPlaces, ping } from '../api/client'
import { isSupabaseReady, supabase } from '../lib/supabase'
import { secure } from '../lib/img'
import { useAppStore } from '../store/useAppStore'
import WeatherBadge from '../components/WeatherBadge'
import NatureCard from '../components/NatureCard'
import { NATURE } from '../data/nature'

// 홈 = 에디토리얼 소개 + 맨 아래 "동작 체크" 대시보드
// STEP 0~1 에서 아래 점검이 모두 초록색이 되어야 다음 단계로 넘어갑니다.
const firstImage = (list, n = 0) => list.filter((p) => p.image)[n]?.image

export default function Home() {
  const nickname = useAppStore((s) => s.nickname)
  const setNickname = useAppStore((s) => s.setNickname)
  const [db, setDb] = useState(isSupabaseReady
    ? { state: 'wait', msg: '확인 중...' }
    : { state: 'fail', msg: '.env.local 에 VITE_SUPABASE_URL / ANON_KEY 를 넣으세요' })
  const [api, setApi] = useState({ state: 'wait', msg: '확인 중...' })
  const [pics, setPics] = useState({})   // 홈 사진은 TourAPI 에서 가져옵니다

  useEffect(() => {
    // ① Supabase 연결 확인
    if (isSupabaseReady) supabase.from('favorites').select('id').limit(1).then(({ error }) =>
      setDb(error ? { state: 'fail', msg: error.message } : { state: 'ok', msg: '연결 OK' }))

    // ② 서버 함수(/api) 확인
    ping()
      .then((d) => setApi({ state: 'ok', msg: `OK · 공공데이터 키 ${d.hasDataKey ? '있음' : '없음'} · Claude 키 ${d.hasClaudeKey ? '있음' : '없음'}` }))
      .catch(() => setApi({ state: 'fail', msg: 'npm run dev 가 아니라 vercel dev 로 실행했는지 확인' }))

    // ③ 홈 사진 — 실패하면 그라데이션 배경으로 대신 보여줍니다
    Promise.all([fetchPlaces('오름'), fetchPlaces('한라산')])
      .then(([oreum, halla]) => setPics({ hero: firstImage(halla), oreum: firstImage(oreum, 1), halla: firstImage(halla, 1) ?? firstImage(halla) }))
      .catch(() => {})
  }, [])

  return (
    <>
      <section className="mt-2">
        <div className="hero-media">
          {pics.hero && <img src={secure(pics.hero)} alt="제주 오름" />}
          <div className="hero-title">
            <small>WALK JEJU</small>
            <h1 className="serif">제주를 걷다</h1>
          </div>
        </div>
        <div className="hero-caption mt-3">
          <div className="eyebrow">오름 · 한라산 · 해안길 트레킹 도우미</div>
          <h2>오늘은 어디를 걸을까?</h2>
          <p className="text-muted small mb-3">날씨를 보고 오름·한라산·해안길을 골라 드려요</p>
          <div className="d-flex flex-wrap align-items-center gap-3">
            <WeatherBadge place="서귀포시" />
            <Link to="/agent" className="link-underline">걷기 도우미에게 묻기</Link>
          </div>
        </div>
      </section>

      <section className="section-gap">
        <Row className="g-4 g-lg-5">
          <Col md={7} className="feature">
            <div className="media">{pics.oreum && <img src={secure(pics.oreum)} alt="오름" />}</div>
            <div className="eyebrow">오름 · 걷기길</div>
            <h3>오름에서 시작하는 가벼운 트레킹</h3>
            <p>제주 곳곳의 오름과 걷기 좋은 길을 한국관광공사 데이터로 찾아보세요.</p>
            <Link to="/places" className="link-underline">더 알아보기</Link>
          </Col>
          <Col md={5} className="feature">
            <div className="media">{pics.halla && <img src={secure(pics.halla)} alt="한라산" />}</div>
            <div className="eyebrow">한라산 · 바다</div>
            <h3>한라산과 바다가 만든 자연유산</h3>
            <p>천연기념물과 명승으로 지정된 제주의 자연을 국가유산청 데이터로 살펴봅니다.</p>
            <Link to="/heritage" className="link-underline">더 알아보기</Link>
          </Col>
        </Row>
      </section>

      <section className="section-gap">
        <Row className="g-4 g-lg-5">
          <Col md={7}><NatureCard item={NATURE.halla} /></Col>
          <Col md={5}><NatureCard item={NATURE.daepo} ratio="1 / 1.05" /></Col>
        </Row>
      </section>

      <section className="section-gap">
        <Row className="g-4">
          <Col lg={4}>
            <h3 className="serif" style={{ fontSize: '1.7rem' }}>오름에서 바다까지,<br />제주의 자연</h3>
            <p className="text-muted small">걷다 보면 만나게 되는 풍경들을 이름과 함께 소개해요.</p>
          </Col>
          <Col lg={8}>
            <Row xs={1} md={3} className="g-4">
              <Col><NatureCard item={NATURE.gae} ratio="3 / 4" /></Col>
              <Col><NatureCard item={NATURE.hamdeok} ratio="3 / 4" /></Col>
              <Col><NatureCard item={NATURE.eongddo} ratio="3 / 4" /></Col>
            </Row>
          </Col>
        </Row>
      </section>

      <div className="band">
        <div>
          <Row className="g-4 g-lg-5">
            <Col md={7}><NatureCard item={NATURE.hyeongje} /></Col>
            <Col md={5}><NatureCard item={NATURE.gaetgeori} ratio="1 / 1.05" /></Col>
          </Row>
          <div className="photo-credit">사진 · 한국관광공사 TourAPI</div>
        </div>
      </div>

      <section className="section-gap">
        <Row className="g-4">
          <Col lg={4}>
            <h3 className="serif" style={{ fontSize: '1.7rem' }}>걷기 전에,<br />이렇게 준비해요</h3>
            <p className="text-muted small">세 가지 공공데이터를 AI 도우미가 직접 조회해서 알려 드립니다.</p>
          </Col>
          <Col lg={8}>
            <Row xs={1} md={3} className="g-4">
              <Col><div className="step-num">01</div><h3 className="fs-6 mt-2">날씨 확인</h3><p className="small text-muted">기상청 예보로 오늘 걷기 좋은지 먼저 확인해요.</p></Col>
              <Col><div className="step-num">02</div><h3 className="fs-6 mt-2">길 고르기</h3><p className="small text-muted">오름·한라산·해안길 중 오늘 날씨에 맞는 곳을 추천해요.</p></Col>
              <Col><div className="step-num">03</div><h3 className="fs-6 mt-2">수첩에 담기</h3><p className="small text-muted">가고 싶은 곳은 탐험 수첩에 저장해 두세요.</p></Col>
            </Row>
          </Col>
        </Row>
      </section>

      <section className="section-gap">
        <div className="eyebrow">시스템 점검</div>
        <Row xs={1} md={3} className="g-3">
          <Col><Check title="React · 라우터" state="ok" msg="이 화면이 보이면 OK" /></Col>
          <Col><Check title="Supabase" {...db} /></Col>
          <Col><Check title="서버 함수 /api" {...api} /></Col>
        </Row>

        <Card className="check-card mt-3">
          <Card.Body>
            <Card.Title className="fs-6 fw-bold"><i className="bi bi-database me-2" />Store(Zustand) 확인</Card.Title>
            <Form.Control placeholder="닉네임을 입력하세요" value={nickname}
              onChange={(e) => setNickname(e.target.value)} style={{ maxWidth: 320 }} />
            <Form.Text>입력하면 오른쪽 위 메뉴에도 바로 보이고, 새로고침해도 남아 있습니다.</Form.Text>
          </Card.Body>
        </Card>
      </section>
    </>
  )
}

function Check({ title, state, msg }) {
  const icon = { ok: 'check-circle-fill text-success', fail: 'x-circle-fill text-danger', wait: 'hourglass-split text-muted' }[state]
  return (
    <Card className="check-card h-100">
      <Card.Body>
        <div className="fw-bold mb-1"><i className={`bi bi-${icon} me-2`} />{title}</div>
        <div className="small text-muted">{msg}</div>
      </Card.Body>
    </Card>
  )
}
