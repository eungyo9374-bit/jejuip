import { Link } from 'react-router-dom'
import Mascot from './Mascot'
import { routeText } from '../lib/olle'

// 올레 코스 한 칸 — 큰 코스 번호 + 마스코트 + 이름 + 시종점 + 거리·시간
// g: lib/olle.js 의 groupCourses() 가 만든 코스 묶음 (A/B 갈래는 한 카드에 같이 보여줘요)
export default function OlleCard({ g, onSave }) {
  const v = g.variants[0]
  return (
    <article className="olle-card fade-in h-100 d-flex flex-column">
      <Link to={`/olle/${g.key}`} className="olle-card-link">
        <div className="olle-top">
          <div className="olle-num serif">{g.key}<small>코스</small></div>
          <Mascot course={g.course} size={92} />
        </div>
        <div className="eyebrow">{g.area}</div>
        <h3 className="item-title">{g.name}</h3>
        <p className="item-sub">{routeText(g)}</p>
        <div className="olle-tags">
          {g.multi
            ? g.variants.map((x) => <span key={x.id}>{x.label}코스 {x.distance} · {x.duration} · {x.level}</span>)
            : <><span>{v.distance}</span><span>{v.duration}</span><span>{v.level}</span></>}
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
