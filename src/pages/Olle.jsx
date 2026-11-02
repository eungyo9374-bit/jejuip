import { useEffect, useMemo, useState } from 'react'
import { Col, Form, Row } from 'react-bootstrap'
import PageHeader from '../components/PageHeader'
import OlleCard from '../components/OlleCard'
import { Empty, ErrorAlert, Loading } from '../components/Status'
import { fetchOlle } from '../api/client'
import { useAppStore } from '../store/useAppStore'

const LEVELS = ['전체', '가볍게', '보통', '도전']
const REGIONS = ['전체', '동부', '남부', '남서부', '서부', '북서부', '북부', '북동부', '섬']

// 올레 코스 목록 — 제주특별자치도_올레코스현황 API
export default function Olle() {
  const addFavorite = useAppStore((s) => s.addFavorite)
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [q, setQ] = useState('')
  const [level, setLevel] = useState('전체')
  const [region, setRegion] = useState('전체')

  useEffect(() => {
    fetchOlle().then(setCourses).catch((e) => setError(e.message)).finally(() => setLoading(false))
  }, [])

  const shown = useMemo(() => courses.filter((c) =>
    (level === '전체' || c.level === level) &&
    (region === '전체' || c.area.startsWith(region)) &&
    (!q || `${c.course} ${c.name} ${c.start} ${c.end}`.includes(q.trim()))), [courses, level, region, q])

  return (
    <>
      <PageHeader title="올레 코스" subtitle="제주특별자치도 올레코스현황 — 전체 코스를 거리·소요시간과 함께 살펴보세요" />
      <div className="filters mb-4">
        <Form.Control value={q} onChange={(e) => setQ(e.target.value)} placeholder="코스 번호·지명 검색 (예: 7코스, 광치기, 쇠소깍)" className="mb-3" style={{ maxWidth: 420 }} />
        <Chips label="난이도(거리 기준)" items={LEVELS} value={level} onChange={setLevel} />
        <Chips label="권역" items={REGIONS} value={region} onChange={setRegion} />
      </div>
      <ErrorAlert error={error} />
      {loading ? <Loading /> : shown.length === 0 ? <Empty text="조건에 맞는 코스가 없어요" /> : (
        <>
          <p className="small text-muted">{shown.length}개 코스</p>
          <Row xs={1} sm={2} lg={3} xl={4} className="g-4">
            {shown.map((c) => (
              <Col key={c.id}>
                <OlleCard c={c} onSave={() => addFavorite({ source: 'olle', id: c.id, title: `${c.course} ${c.name}` })} />
              </Col>
            ))}
          </Row>
        </>
      )}
    </>
  )
}

function Chips({ label, items, value, onChange }) {
  return (
    <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
      <span className="eyebrow mb-0 me-2" style={{ minWidth: 110 }}>{label}</span>
      {items.map((it) => (
        <button key={it} type="button" className={`chip ${value === it ? 'on' : ''}`} onClick={() => onChange(it)}>{it}</button>
      ))}
    </div>
  )
}
