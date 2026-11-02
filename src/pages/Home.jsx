import { useEffect, useMemo, useState } from 'react'
import { Card, Col, Form, Row } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import { fetchOlle, fetchPlaces, ping } from '../api/client'
import { isSupabaseReady, supabase } from '../lib/supabase'
import { secure } from '../lib/img'
import { useAppStore } from '../store/useAppStore'
import WeatherBadge from '../components/WeatherBadge'
import NatureCard from '../components/NatureCard'
import OlleCard from '../components/OlleCard'
import { SCENES } from '../data/scenes'
import { COURSE_PHOTOS } from '../data/olle-photos'
import { distanceText, durationText, groupCourses, keyFromId, routeText } from '../lib/olle'

// 홈 = 에디토리얼 소개 + 맨 아래 "동작 체크" 대시보드
// STEP 0~1 에서 아래 점검이 모두 초록색이 되어야 다음 단계로 넘어갑니다.
const FIRST = ['1', '7', '10']      // 처음 보여줄 대표 코스 (이후 10초마다 다른 코스로 바뀜)
const ROTATE_MS = 10000

// 목록에서 n개를 골라요. tick 이 올라갈 때마다 다음 n개로 넘어가고, 끝나면 처음으로 돌아갑니다
const pick = (list, n, tick) => list.length ? Array.from({ length: Math.min(n, list.length) }, (_, i) => list[(tick * n + i) % list.length]) : []

// 일정 시간(ms)마다 숫자가 하나씩 올라가는 타이머. setTick 으로 직접 넘기면 시간이 다시 시작돼요
function useRotation(ms) {
  const [tick, setTick] = useState(0)
  useEffect(() => { const id = setInterval(() => setTick((t) => t + 1), ms); return () => clearInterval(id) }, [ms, tick])
  return [tick, setTick]
}

export default function Home() {
  const nickname = useAppStore((s) => s.nickname)
  const setNickname = useAppStore((s) => s.setNickname)
  const addFavorite = useAppStore((s) => s.addFavorite)
  const [db, setDb] = useState(isSupabaseReady
    ? { state: 'wait', msg: '확인 중...' }
    : { state: 'fail', msg: '.env.local 에 VITE_SUPABASE_URL / ANON_KEY 를 넣으세요' })
  const [api, setApi] = useState({ state: 'wait', msg: '확인 중...' })
  const [hero, setHero] = useState('')
  const [all, setAll] = useState([])
  const [tick, setTick] = useRotation(ROTATE_MS)

  useEffect(() => {
    // ① Supabase 연결 확인
    if (isSupabaseReady) supabase.from('favorites').select('id').limit(1).then(({ error }) =>
      setDb(error ? { state: 'fail', msg: error.message } : { state: 'ok', msg: '연결 OK' }))

    // ② 서버 함수(/api) 확인
    ping()
      .then((d) => setApi({ state: 'ok', msg: `OK · 공공데이터 키 ${d.hasDataKey ? '있음' : '없음'} · Claude 키 ${d.hasClaudeKey ? '있음' : '없음'}` }))
      .catch(() => setApi({ state: 'fail', msg: 'npm run dev 가 아니라 vercel dev 로 실행했는지 확인' }))

    // ③ 대표 코스 — 올레코스현황 API
    fetchOlle().then(setAll).catch(() => {})

    // ④ 첫 화면 사진 — 실패하면 그라데이션 배경으로 대신 보여줍니다
    fetchPlaces('하도', '12').then((list) => setHero(list.find((p) => p.image)?.image ?? '')).catch(() => {})
  }, [])

  // 같은 번호의 갈래(3코스 A/B 등)는 한 코스로 묶고, 처음 보여줄 코스가 맨 앞에 오도록 정렬
  const groups = useMemo(() => groupCourses(all)
    .sort((x, y) => (FIRST.includes(x.key) ? FIRST.indexOf(x.key) : 99) - (FIRST.includes(y.key) ? FIRST.indexOf(y.key) : 99)), [all])
  const featured = pick(groups, 3, tick)

  // 갤러리: 직접 설명을 쓴 풍경 7장 + 나머지 코스의 대표 사진(코스 정보로 설명을 자동 생성)
  const pool = useMemo(() => {
    const curated = Object.values(SCENES)
    const have = new Set(curated.map((x) => keyFromId(x.to.replace('/olle/', ''))))
    const extra = groups.filter((cg) => COURSE_PHOTOS[cg.key] && !have.has(cg.key)).map((cg) => ({
      to: `/olle/${cg.key}`,
      kind: `${cg.course} · ${cg.name}`,
      name: COURSE_PHOTOS[cg.key].spot,
      desc: `${cg.course}(${routeText(cg)}) 가까이에 있는 명소예요. 코스 거리 ${distanceText(cg)}, 걷는 데 ${durationText(cg)} 걸려요.`,
      image: COURSE_PHOTOS[cg.key].image,
    }))
    return [...curated, ...extra]
  }, [groups])
  const g = pick(pool, 7, tick)   // g[0]~g[6]: 갤러리 칸 7개

  return (
    <>
      <section className="mt-2">
        <div className="hero-media">
          {hero && <img src={secure(hero)} alt="제주 올레길" />}
          <div className="hero-title">
            <small>WALK JEJU OLLE</small>
            <h1 className="serif">제주를 걷다</h1>
          </div>
        </div>
        <div className="hero-caption mt-3">
          <div className="eyebrow">트레킹을 좋아하는 여행자를 위한 올레길 추천</div>
          <h2>오늘은 어디를 걸을까?</h2>
          <p className="text-muted small mb-3">날씨를 보고 올레길 코스를 골라 드려요</p>
          <div className="d-flex flex-wrap align-items-center gap-3">
            <WeatherBadge place="서귀포시" />
            <Link to="/map" className="link-underline">올레 지도 보기</Link>
            <Link to="/olle" className="link-underline">올레 코스 둘러보기</Link>
            <Link to="/agent" className="link-underline">걷기 도우미에게 묻기</Link>
          </div>
        </div>
      </section>

      <section className="section-gap">
        <Row className="g-4">
          <Col lg={4}>
            <h3 className="serif" style={{ fontSize: '1.7rem' }}>올레길,<br />이런 코스가 있어요</h3>
            <p className="text-muted small">제주 해안과 마을을 잇는 길. 거리와 소요시간으로 오늘 걸을 코스를 골라 보세요.</p>
            <div className="d-flex flex-wrap gap-3 align-items-center">
              <Link to="/olle" className="link-underline">전체 코스 보기</Link>
              <button type="button" className="link-underline" onClick={() => setTick((t) => t + 1)}>다른 코스 보기 ↻</button>
            </div>
            <p className="small text-muted mt-2 mb-0">추천 코스와 사진은 10초마다 바뀌어요.</p>
          </Col>
          <Col lg={8}>
            <Row xs={1} md={3} className="g-4">
              {featured.map((c) => (
                <Col key={c.id}>
                  <OlleCard g={c} onSave={() => addFavorite({ source: 'olle', id: c.key, title: `${c.course} ${c.name}` })} />
                </Col>
              ))}
            </Row>
          </Col>
        </Row>
      </section>

      <section className="section-gap">
        <Row className="g-4 g-lg-5">
          <Col md={7}><NatureCard key={g[0]?.name} item={g[0] ?? SCENES.jongdal} /></Col>
          <Col md={5}><NatureCard key={g[1]?.name} item={g[1] ?? SCENES.daepo} ratio="1 / 1.05" /></Col>
        </Row>
      </section>

      <section className="section-gap">
        <Row className="g-4">
          <Col lg={4}>
            <h3 className="serif" style={{ fontSize: '1.7rem' }}>걷다 보면<br />만나는 풍경</h3>
            <p className="text-muted small">코스마다 다른 바다와 마을의 풍경을 이름과 함께 소개해요.</p>
          </Col>
          <Col lg={8}>
            <Row xs={1} md={3} className="g-4">
              <Col><NatureCard key={g[2]?.name} item={g[2] ?? SCENES.oedolgae} ratio="3 / 4" /></Col>
              <Col><NatureCard key={g[3]?.name} item={g[3] ?? SCENES.keunyeong} ratio="3 / 4" /></Col>
              <Col><NatureCard key={g[4]?.name} item={g[4] ?? SCENES.udo} ratio="3 / 4" /></Col>
            </Row>
          </Col>
        </Row>
      </section>

      <div className="band">
        <div>
          <Row className="g-4 g-lg-5">
            <Col md={7}><NatureCard key={g[5]?.name} item={g[5] ?? SCENES.hyeongje} /></Col>
            <Col md={5}><NatureCard key={g[6]?.name} item={g[6] ?? SCENES.hamdeok} ratio="1 / 1.05" /></Col>
          </Row>
          <div className="photo-credit">사진 · 한국관광공사 TourAPI</div>
        </div>
      </div>

      <section className="section-gap">
        <Row className="g-4">
          <Col lg={4}>
            <h3 className="serif" style={{ fontSize: '1.7rem' }}>걷기 전에,<br />이렇게 준비해요</h3>
            <p className="text-muted small">네 가지 공공데이터를 걷기 도우미가 직접 조회해서 알려 드립니다.</p>
          </Col>
          <Col lg={8}>
            <Row xs={1} md={3} className="g-4">
              <Col><div className="step-num">01</div><h3 className="fs-6 mt-2">코스 고르기</h3><p className="small text-muted">제주올레 코스 현황으로 거리·소요시간을 비교해요.</p></Col>
              <Col><div className="step-num">02</div><h3 className="fs-6 mt-2">날씨 확인</h3><p className="small text-muted">기상청 예보로 오늘 걷기 좋은지 먼저 확인해요.</p></Col>
              <Col><div className="step-num">03</div><h3 className="fs-6 mt-2">길 위에서 즐기기</h3><p className="small text-muted">주변 명소와 문화유산을 찾고, 마음에 든 곳은 올레 수첩에 담아요.</p></Col>
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
