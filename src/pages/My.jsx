import { useEffect } from 'react'
import { Col, Form, Row } from 'react-bootstrap'
import PageHeader from '../components/PageHeader'
import ItemCard from '../components/ItemCard'
import { Empty, Loading } from '../components/Status'
import { useAppStore } from '../store/useAppStore'

// 즐겨찾기 — store 의 favorites 를 그대로 보여줍니다 (STEP 5)
export default function My() {
  const { nickname, setNickname, favorites, favLoading, loadFavorites } = useAppStore()

  useEffect(() => { loadFavorites() }, [nickname, loadFavorites])

  return (
    <>
      <PageHeader title="내 탐험 수첩" subtitle="가고 싶은 오름·길을 저장해 두세요" />
      <Form.Control className="mb-4" style={{ maxWidth: 320 }} placeholder="닉네임"
        value={nickname} onChange={(e) => setNickname(e.target.value)} />
      {favLoading ? <Loading /> : favorites.length === 0 ? <Empty text="아직 저장한 항목이 없어요" /> : (
        <Row xs={1} sm={2} lg={3} className="g-3">
          {favorites.map((f) => (
            <Col key={f.id}><ItemCard title={f.title} badge={f.source} subtitle={new Date(f.created_at).toLocaleString('ko-KR')} /></Col>
          ))}
        </Row>
      )}
    </>
  )
}
