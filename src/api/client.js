// React 화면이 우리 서버 함수(/api/...)를 부를 때 쓰는 함수 모음
// 공공데이터 API를 브라우저에서 직접 부르지 않습니다 (키 노출 + CORS 문제) → 반드시 /api 를 거칩니다.

// 응답을 JSON으로 읽고, 실패하면 에러를 던집니다
async function readJson(r) {
  let data
  try { data = await r.json() }
  catch { throw new Error(`서버 응답이 JSON이 아님 (${r.status}) — vercel dev 로 실행했는지 확인`) }
  if (!r.ok) throw new Error(data.error || r.statusText)
  return data
}

export async function get(path) {
  return readJson(await fetch(path))
}

export async function post(path, body) {
  return readJson(await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }))
}

// 동작 확인용
export const ping = () => get('/api/hello')

// STEP 2~4: 공공데이터 API
export const fetchPlaces = (keyword = '', type = '12') =>
  get(`/api/tour?keyword=${encodeURIComponent(keyword)}&type=${type}`)

// 좌표 주변 관광지 (올레 코스 권역 주변 명소)
export const fetchNearby = (lat, lng, type = '12') => get(`/api/tour?lat=${lat}&lng=${lng}&type=${type}`)
export const fetchWeather = (place = '제주시') =>
  get(`/api/weather?place=${encodeURIComponent(place)}`)
export const fetchHeritage = (keyword = '') =>
  get(`/api/heritage?keyword=${encodeURIComponent(keyword)}`)

// 좌표 주변 국가유산 (올레 코스 권역 주변 문화유산)
export const fetchHeritageNear = (lat, lng) => get(`/api/heritage?lat=${lat}&lng=${lng}`)

// STEP 6: 에이전트
export const askAgent = (message, history) => post('/api/agent', { message, history })

// 올레 코스 현황 (제주특별자치도_올레코스현황)
export const fetchOlle = (keyword = '') => get(`/api/olle?keyword=${encodeURIComponent(keyword)}`)
