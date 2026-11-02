// 제주 지도 좌표계와 그리기 도우미 — 올레 지도(OlleMap)와 코스 위치 미니 지도(CourseMiniMap)가 함께 씁니다.
// 위도·경도를 평면(SVG) 좌표로 바꿉니다. 추자도는 본섬에서 멀어서 한 화면에 들어오도록 아래쪽으로 옮겨 그렸어요.
const S = 1500                        // 1도당 픽셀
const KX = Math.cos((33.4 * Math.PI) / 180)
const LNG0 = 126.12
const LAT_TOP = 33.67
const CHUJA_SHIFT = 0.37
export const W = 1110, H = 860        // 처음 보이는 전체 영역

export const pr = ([lng, lat]) => [(lng - LNG0) * KX * S, (LAT_TOP - (lat > 33.8 ? lat - CHUJA_SHIFT : lat)) * S]
export const pathD = (pts, close) => pts.map((p, i) => { const [x, y] = pr(p); return `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}` }).join('') + (close ? 'Z' : '')

// 경로의 한가운데 점 (코스 번호 배지를 놓는 자리)
export function midpoint(pts) {
  const xy = pts.map(pr)
  let total = 0; const seg = []
  for (let i = 1; i < xy.length; i++) { const d = Math.hypot(xy[i][0] - xy[i - 1][0], xy[i][1] - xy[i - 1][1]); seg.push(d); total += d }
  let acc = 0
  for (let i = 0; i < seg.length; i++) {
    if (acc + seg[i] >= total / 2) { const t = (total / 2 - acc) / (seg[i] || 1); return [xy[i][0] + (xy[i + 1][0] - xy[i][0]) * t, xy[i][1] + (xy[i + 1][1] - xy[i][1]) * t] }
    acc += seg[i]
  }
  return xy[0]
}
