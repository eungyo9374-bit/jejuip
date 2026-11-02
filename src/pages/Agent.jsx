import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Button, Card, Form, InputGroup, Spinner } from 'react-bootstrap'
import PageHeader from '../components/PageHeader'
import { useAppStore } from '../store/useAppStore'

// 답변 속 **굵은 글씨** 표시를 실제 굵은 글씨로 보여줘요 (별표 그대로 보이지 않게)
function RichText({ text }) {
  return String(text).split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith('**') && part.endsWith('**') ? <strong key={i}>{part.slice(2, -2)}</strong> : part)
}

export default function Agent() {
  const messages = useAppStore((s) => s.messages)
  const loading = useAppStore((s) => s.chatLoading)
  const sendMessage = useAppStore((s) => s.sendMessage)
  const [params] = useSearchParams()
  const [input, setInput] = useState(params.get('q') ?? '')   // 코스 상세에서 넘어온 질문

  function onSubmit(e) {
    e.preventDefault()
    if (!input.trim() || loading) return
    sendMessage(input)
    setInput('')
  }

  return (
    <>
      <PageHeader title="걷기 도우미" subtitle="올레 코스·날씨·주변 명소 데이터를 직접 조회해 걸을 코스를 골라 드려요" />
      <Card className="chat-box mb-3">
        <Card.Body>
          {messages.length === 0 && <div className="text-muted">예) 오늘 서귀포 날씨 보고 가볍게 걸을 올레 코스 추천해줘</div>}
          {messages.map((m, i) => (
            <div key={i} className={`msg ${m.role}`}>
              {m.steps?.length > 0 && (
                <div className="small text-muted mb-1">
                  <i className="bi bi-tools me-1" />
                  {m.steps.map((s) => `${s.tool}(${JSON.stringify(s.args)}) → ${s.count}건`).join(' · ')}
                </div>
              )}
              <RichText text={m.text} />
            </div>
          ))}
          {loading && <div className="small text-muted"><Spinner size="sm" className="me-2" />에이전트가 도구를 사용하는 중...</div>}
        </Card.Body>
      </Card>
      <Form onSubmit={onSubmit}>
        <InputGroup>
          <Form.Control value={input} onChange={(e) => setInput(e.target.value)} placeholder="질문을 입력하세요" />
          <Button type="submit" disabled={loading}><i className="bi bi-send" /></Button>
        </InputGroup>
      </Form>
    </>
  )
}
