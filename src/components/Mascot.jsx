import { mascotOf } from '../data/mascots'

// 코스 마스코트 — 지도와 같은 손그림 스타일 그림 (그림 정의는 RootLayout 의 숨은 SVG 에 있어요)
export default function Mascot({ course, size = 96, title = true }) {
  const m = mascotOf(course)
  if (!m) return null
  const [id, name, scale] = m
  return (
    <svg className="mascot" width={size} height={size * 0.9} viewBox="-60 -78 120 90" role="img" aria-label={`${name} 마스코트`}>
      {title && <title>{name}</title>}
      <g transform={`translate(0 6) scale(${scale})`}><use href={`#${id}`} /></g>
    </svg>
  )
}
