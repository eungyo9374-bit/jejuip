import { useState } from 'react'
import { Button, Card, Form, InputGroup, Spinner } from 'react-bootstrap'
import PageHeader from '../components/PageHeader'
import { useAppStore } from '../store/useAppStore'

export default function Agent() {
  const messages = useAppStore((s) => s.messages)
  const loading = useAppStore((s) => s.chatLoading)
  const sendMessage = useAppStore((s) => s.sendMessage)
  const [input, setInput] = useState('')

  function onSubmit(e) {
    e.preventDefault()
    if (!input.trim() || loading) return
    sendMessage(input)
    setInput('')
  }

  return (
    <>
      <PageHeader title="걷기 도우미" subtitle="날씨와 자연 명소 데이터를 직접 조회해 걸을 곳을 골라 드려요" />
      <Card className="chat-box mb-3">
        <Card.Body>
          {messages.length === 0 && <div className="text-muted">예) 내일 서귀포 날씨 보고 걷기 좋은 오름 추천해줘</div>}
          {messages.map((m, i) => (
            <div key={i} className={`msg ${m.role}`}>
              {m.steps?.length > 0 && (
                <div className="small text-muted mb-1">
                  <i className="bi bi-tools me-1" />
                  {m.steps.map((s) => `${s.tool}(${JSON.stringify(s.args)}) → ${s.count}건`).join(' · ')}
                </div>
              )}
              {m.text}
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
