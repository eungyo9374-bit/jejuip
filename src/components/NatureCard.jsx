import { Link } from 'react-router-dom'
import { secure } from '../lib/img'

// 홈 갤러리의 한 칸 — 큰 사진 + 분류 라벨 + 이름 + 짧은 설명 (item.to 가 있으면 눌러서 해당 코스로 이동)
export default function NatureCard({ item, ratio = '4 / 3', className = '' }) {
  const body = (
    <>
      <div className="media" style={{ aspectRatio: ratio }}>
        <img src={secure(item.image)} alt={item.name} loading="lazy" onError={(e) => { e.currentTarget.style.display = 'none' }} />
        {item.to && <span className="media-cta">코스 보기 →</span>}
      </div>
      <div className="eyebrow">{item.kind}</div>
      <h3>{item.name}</h3>
      <p>{item.desc}</p>
    </>
  )
  return (
    <article className={`feature ${className}`}>
      {item.to ? <Link to={item.to} className="feature-link">{body}</Link> : body}
    </article>
  )
}
