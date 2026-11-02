// 한국관광공사 TourAPI (국문 관광정보 서비스 KorService2)
const BASE = 'https://apis.data.go.kr/B551011/KorService2';

export async function searchTour({ keyword = '', contentTypeId = '12', rows = 10 } = {}) {
  const params = new URLSearchParams({
    serviceKey: process.env.DATA_GO_KR_KEY, // ★ Decoding 키
    MobileOS: 'ETC',
    MobileApp: 'JejuIP',
    _type: 'json',
    numOfRows: String(rows),
    pageNo: '1',
    areaCode: '39', // 39 = 제주
  });
  if (contentTypeId) params.set('contentTypeId', contentTypeId);
  const op = keyword ? 'searchKeyword2' : 'areaBasedList2';
  if (keyword) params.set('keyword', keyword);

  const r = await fetch(`${BASE}/${op}?${params}`);
  const text = await r.text();
  let data;
  try { data = JSON.parse(text); }
  catch { throw new Error('TourAPI 응답이 JSON이 아님: ' + text.slice(0, 120)); }

  const item = data?.response?.body?.items?.item;
  const list = !item ? [] : Array.isArray(item) ? item : [item];
  return list.map((p) => ({
    id: p.contentid, title: p.title, addr: p.addr1,
    image: p.firstimage, lng: p.mapx, lat: p.mapy, type: p.contenttypeid,
  }));
}

// 좌표 주변 관광지 검색 (locationBasedList2) — 올레 코스 권역 주변 명소에 사용
export async function searchNearby({ lat, lng, radius = 5000, contentTypeId = '12', rows = 9 } = {}) {
  if (!lat || !lng) throw new Error('lat, lng 가 필요해요');
  const params = new URLSearchParams({
    serviceKey: process.env.DATA_GO_KR_KEY,
    MobileOS: 'ETC',
    MobileApp: 'JejuIP',
    _type: 'json',
    numOfRows: String(rows),
    pageNo: '1',
    mapX: String(lng),
    mapY: String(lat),
    radius: String(radius),
    arrange: 'E', // 가까운 순
  });
  if (contentTypeId) params.set('contentTypeId', contentTypeId);

  const r = await fetch(`${BASE}/locationBasedList2?${params}`);
  const text = await r.text();
  let data;
  try { data = JSON.parse(text); }
  catch { throw new Error('TourAPI 응답이 JSON이 아님: ' + text.slice(0, 120)); }

  const item = data?.response?.body?.items?.item;
  const list = !item ? [] : Array.isArray(item) ? item : [item];
  return list.map((p) => ({
    id: p.contentid, title: p.title, addr: p.addr1,
    image: p.firstimage, lng: p.mapx, lat: p.mapy, type: p.contenttypeid,
    dist: Math.round(Number(p.dist) || 0),
  }));
}
