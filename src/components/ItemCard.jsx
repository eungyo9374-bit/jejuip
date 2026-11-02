import { secure } from '../lib/img'

// 관광지·유산·즐겨찾기 등 "목록의 한 칸"을 모두 이 카드 하나로 표시합니다 (재사용 컴포넌트)
export default function ItemCard({ title, subtitle, image, badge, onSave, onRemove, art, desc }) {
  return (
    <article className="item-card h-100 d-flex flex-column">
      <div className="media">
        {image ? <img src={secure(image)} alt={title} loading="lazy" />
          : art ? <svg className="card-art" viewBox="-60 -78 120 90" role="img" aria-label={title}><g transform="translate(0 -2) scale(1.05)"><use href={`#${art}`} /></g></svg>
            : <i className="bi bi-image" />}
      </div>
      {badge && <div className="eyebrow">{badge}</div>}
      <h3 className="item-title">{title}</h3>
      {subtitle && <p className="item-sub">{subtitle}</p>}
      {desc && <p className="item-desc">{desc}</p>}
      {onRemove && (
        <div className="mt-auto">
          <button type="button" className="link-underline link-danger-soft" onClick={onRemove}>수첩에서 빼기</button>
        </div>
      )}
      {onSave && (
        <div className="mt-auto">
          <button type="button" className="link-underline" onClick={onSave}>올레 수첩에 담기</button>
        </div>
      )}
    </article>
  )
}
