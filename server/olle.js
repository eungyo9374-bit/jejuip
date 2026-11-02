// 제주특별자치도_올레코스현황 (공공데이터포털 파일데이터 → 오픈API, odcloud)
// ※ 데이터가 갱신되면 경로의 uddi:... 값이 새 버전으로 바뀝니다. 목록은
//   https://infuser.odcloud.kr/oas/docs?namespace=15043496/v1 에서 확인하세요.
const URL = 'https://api.odcloud.kr/api/15043496/v1/uddi:5e0b77df-759d-4378-a74f-bd393051521b';

// 코스 번호 → 날씨 조회 기준(기상청 격자는 제주시/서귀포시만 지원) · 권역
const JEJUSI = new Set(['1-1', '12', '13', '14', '14-1', '15', '16', '17', '18', '18-1', '18-2', '19', '20', '21']);
const AREA = {
  '1': '동부 · 성산', '2': '동부 · 성산·표선', '3': '동부 · 표선', '4': '남부 · 표선·남원', '5': '남부 · 남원',
  '6': '남부 · 서귀포', '7': '남부 · 서귀포', '7-1': '남부 · 서귀포', '8': '남부 · 중문', '9': '남서부 · 안덕',
  '10': '남서부 · 대정', '10-1': '남서부 · 가파도', '11': '서부 · 대정', '12': '서부 · 한경', '13': '서부 · 한경',
  '14': '서부 · 한림', '14-1': '서부 · 한경', '15': '서부 · 한림·애월', '16': '북서부 · 애월', '17': '북부 · 제주시',
  '18': '북부 · 제주시', '19': '북동부 · 조천', '20': '북동부 · 구좌', '21': '동부 · 구좌', '1-1': '섬 · 우도',
  '18-1': '섬 · 추자도', '18-2': '섬 · 추자도',
};

// 코스가 지나는 권역의 대략적인 중심 좌표 [위도, 경도] — 올레코스현황에는 좌표가 없어서 직접 지정했습니다 (주변 명소 검색용, 수 km 오차 가능)
const CENTER = {
  '1': [33.466, 126.93], '2': [33.44, 126.92], '3': [33.39, 126.88], '4': [33.3, 126.78], '5': [33.26, 126.63],
  '6': [33.25, 126.57], '7': [33.24, 126.51], '7-1': [33.25, 126.53], '8': [33.243, 126.43], '9': [33.23, 126.35],
  '10': [33.22, 126.3], '10-1': [33.17, 126.27], '11': [33.23, 126.22], '12': [33.29, 126.17], '13': [33.32, 126.2],
  '14': [33.39, 126.24], '14-1': [33.35, 126.23], '15': [33.44, 126.28], '16': [33.46, 126.37], '17': [33.49, 126.47],
  '18': [33.52, 126.58], '19': [33.54, 126.67], '20': [33.54, 126.8], '21': [33.52, 126.88], '1-1': [33.5, 126.95],
  '18-1': [33.95, 126.3], '18-2': [33.95, 126.3],
};

let cache = { at: 0, list: null };   // 1년에 한 번 바뀌는 자료라 1시간 캐시

export async function getOlleCourses({ keyword = '', maxKm = 0 } = {}) {
  if (!cache.list || Date.now() - cache.at > 3600e3) {
    const params = new URLSearchParams({ serviceKey: process.env.DATA_GO_KR_KEY, page: '1', perPage: '100' });
    const r = await fetch(`${URL}?${params}`);
    const text = await r.text();
    let data;
    try { data = JSON.parse(text); }
    catch { throw new Error('올레코스 응답이 JSON이 아님: ' + text.slice(0, 120)); }
    if (!Array.isArray(data.data)) throw new Error('올레코스 응답 오류: ' + text.slice(0, 120));

    cache = { at: Date.now(), list: data.data.map(toCourse) };
  }
  let list = cache.list;
  if (keyword) list = list.filter((c) => `${c.course} ${c.name} ${c.start} ${c.end}`.includes(keyword));
  if (Number(maxKm) > 0) list = list.filter((c) => c.km <= Number(maxKm));
  return list;
}

function toCourse(row, i) {
  const key = String(row['코스별']).replace('코스', '')              // '1코스' → '1', '1-1코스' → '1-1'
  const name = String(row['코스명']).replaceAll('?', '-')              // 원본의 '?' 는 '-' 가 깨진 글자
  const variant = /\(([AB])\)/.exec(name)?.[1]?.toLowerCase() ?? ''     // 3코스 (A)/(B) 처럼 갈래가 있는 경우
  const [start, end] = String(row['시종점정보']).split('-').length === 2 ? String(row['시종점정보']).split('-') : [row['시종점정보'], '']
  const km = parseFloat(row['거리']) || 0
  return {
    id: key + variant,
    course: `${key}코스`,
    name,
    km,
    distance: row['거리'],
    duration: row['소요시간정보'],
    start, end,
    area: AREA[key] ?? '제주',
    lat: CENTER[key]?.[0], lng: CENTER[key]?.[1],
    weatherPlace: JEJUSI.has(key) ? '제주시' : '서귀포시',   // 기상청 예보 기준 지역
    level: km <= 12 ? '가볍게' : km <= 17 ? '보통' : '도전',   // 거리 기준으로 직접 나눈 난이도
    order: i,
  }
}
