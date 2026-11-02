import { useEffect } from 'react'
import { Col, Form, Row } from 'react-bootstrap'
import PageHeader from '../components/PageHeader'
import ItemCard from '../components/ItemCard'
import { Empty, Loading } from '../components/Status'
import { COURSE_MASCOT } from '../data/mascots'
import { useAppStore } from '../store/useAppStore'

// 사진이 없는 항목은 종류에 맞는 손그림을 보여줘요 (올레 코스는 코스 마스코트)
const artOf = (f) => (f.source === 'olle' ? COURSE_MASCOT[String(f.item_id).replace(/[ab]$/, '')]?.[0] : f.source === 'heritage' ? 'a-hare' : 'm-oreum')

// 올레 수첩 — store 의 favorites 를 그대로 보여주고, "수첩에서 빼기"로 취소할 수 있어요 (STEP 5)
export default function My() {
  const { nickname, setNickname, favorites, favLoading, loadFavorites, removeFavorite } = useAppStore()

  useEffect(() => { loadFavorites() }, [nickname, loadFavorites])

  return (
    <>
      <PageHeader title="내 올레 수첩" subtitle="가고 싶은 올레 코스와 명소를 저장해 두세요" />
      <Form.Control className="mb-4" style={{ maxWidth: 320 }} placeholder="닉네임"
        value={nickname} onChange={(e) => setNickname(e.target.value)} />
      {favLoading ? <Loading /> : favorites.length === 0 ? <Empty text="아직 저장한 항목이 없어요" /> : (
        <Row xs={1} sm={2} lg={3} className="g-3">
          {favorites.map((f) => (
            <Col key={f.id}>
              <ItemCard title={f.title} image={f.image} art={artOf(f)} badge={{ olle: '올레 코스', tour: '주변 명소', heritage: '문화유산' }[f.source] ?? f.source}
                subtitle={new Date(f.created_at).toLocaleString('ko-KR')} onRemove={() => removeFavorite(f.id)} />
            </Col>
          ))}
        </Row>
      )}
    </>
  )
}
