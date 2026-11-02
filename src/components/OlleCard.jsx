import { Link } from 'react-router-dom'
import Mascot from './Mascot'

// 올레 코스 한 칸 — 큰 코스 번호 + 이름 + 시종점 + 거리·시간
export default function OlleCard({ c, onSave }) {
  return (
    <article className="olle-card fade-in h-100 d-flex flex-column">
      <Link to={`/olle/${c.id}`} className="olle-card-link">
        <div className="olle-top">
          <div className="olle-num serif">{c.course.replace('코스', '')}<small>코스</small></div>
          <Mascot course={c.course} size={92} />
        </div>
        <div className="eyebrow">{c.area}</div>
        <h3 className="item-title">{c.name}</h3>
        <p className="item-sub">{c.start}{c.end && c.end !== c.start ? ` → ${c.end}` : ''}</p>
        <div className="olle-tags">
          <span>{c.distance}</span><span>{c.duration}</span><span>{c.level}</span>
        </div>
      </Link>
      {onSave && (
        <div className="mt-auto pt-3">
          <button type="button" className="link-underline" onClick={onSave}>올레 수첩에 담기</button>
        </div>
      )}
    </article>
  )
}
