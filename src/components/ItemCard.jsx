import { secure } from '../lib/img'

// 관광지·유산·즐겨찾기 등 "목록의 한 칸"을 모두 이 카드 하나로 표시합니다 (재사용 컴포넌트)
export default function ItemCard({ title, subtitle, image, badge, onSave }) {
  return (
    <article className="item-card h-100 d-flex flex-column">
      <div className="media">
        {image ? <img src={secure(image)} alt={title} loading="lazy" /> : <i className="bi bi-image" />}
      </div>
      {badge && <div className="eyebrow">{badge}</div>}
      <h3 className="item-title">{title}</h3>
      {subtitle && <p className="item-sub">{subtitle}</p>}
      {onSave && (
        <div className="mt-auto">
          <button type="button" className="link-underline" onClick={onSave}>탐험 수첩에 담기</button>
        </div>
      )}
    </article>
  )
}
