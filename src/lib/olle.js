// 올레 코스 묶음 도우미 — 3코스(A)/(B), 15코스(A)/(B)처럼 갈래가 있는 코스를 하나로 합쳐서 다룹니다.
// 올레코스현황 API 는 갈래마다 한 줄씩 주기 때문에, 화면에서는 코스 번호(key) 기준으로 묶어 써요.

export const keyOf = (c) => c.course.replace('코스', '')

// 상세 주소의 id('3a', '3b', '3')에서 코스 번호만 뽑기
export const keyFromId = (id) => String(id).replace(/[ab]$/, '')

// 줄 목록 → 코스 묶음 목록 (원래 순서 유지)
export function groupCourses(list) {
  const m = new Map()
  list.forEach((c) => { const k = keyOf(c); if (!m.has(k)) m.set(k, []); m.get(k).push(c) })
  return [...m.entries()].map(([key, variants]) => {
    const c = variants[0]
    return {
      key,
      id: key,
      course: c.course,
      name: c.name.replace(/\s*\([AB]\)/, ''),          // '온평-표선(A)' → '온평-표선'
      area: c.area,
      start: c.start,
      end: c.end,
      weatherPlace: c.weatherPlace,
      lat: c.lat, lng: c.lng,
      variants: variants.map((v) => ({ ...v, label: /\(([AB])\)/.exec(v.name)?.[1] ?? '' })),
      multi: variants.length > 1,
    }
  })
}

export const routeText = (g) => `${g.start}${g.end && g.end !== g.start ? ` → ${g.end}` : ''}`
export const levelsOf = (g) => [...new Set(g.variants.map((v) => v.level))]

// 갈래가 있으면 "13.7~19.9km" 처럼 범위로, 시간은 "4~5시간 / 6~7시간" 처럼 이어서
export function distanceText(g) {
  if (!g.multi) return g.variants[0].distance
  const kms = g.variants.map((v) => v.km)
  return `${Math.min(...kms)}~${Math.max(...kms)}km`
}
export const durationText = (g) => [...new Set(g.variants.map((v) => v.duration))].join(' / ')
