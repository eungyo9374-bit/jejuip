import { secure } from '../lib/img'

// 홈 갤러리의 한 칸 — 큰 사진 + 분류 라벨 + 이름 + 짧은 설명
export default function NatureCard({ item, ratio = '4 / 3', className = '' }) {
  return (
    <article className={`feature ${className}`}>
      <div className="media" style={{ aspectRatio: ratio }}>
        <img src={secure(item.image)} alt={item.name} loading="lazy" onError={(e) => { e.currentTarget.style.display = 'none' }} />
      </div>
      <div className="eyebrow">{item.kind}</div>
      <h3>{item.name}</h3>
      <p>{item.desc}</p>
    </article>
  )
}
