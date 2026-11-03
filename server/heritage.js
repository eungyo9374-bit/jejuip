// 국가유산청 국가유산 검색 오픈API (키 불필요, XML 응답)
import { XMLParser } from 'fast-xml-parser';
const parser = new XMLParser();

export async function searchHeritage({ keyword = '', rows = 10 } = {}) {
  const params = new URLSearchParams({ ccbaCtcd: '50', pageUnit: String(rows), pageIndex: '1' }); // 50 = 제주
  if (keyword) params.set('ccbaMnm1', keyword);
  const r = await fetch(`https://www.khs.go.kr/cha/SearchKindOpenapiList.do?${params}`);
  const data = parser.parse(await r.text());
  const item = data?.result?.item;
  const list = !item ? [] : Array.isArray(item) ? item : [item];
  return list.map((h) => ({
    name: h.ccbaMnm1, kind: h.ccmaName, city: h.ccsiName,
    lat: h.latitude, lng: h.longitude,
  }));
}

// 제주 전체 국가유산(약 480건)을 한 번 받아 두고, 좌표가 있는 것만 가까운 순으로 골라 줍니다
let all = { at: 0, list: null };

const distM = (lat1, lng1, lat2, lng2) => {
  const rad = (d) => (d * Math.PI) / 180;
  const a = Math.sin(rad(lat2 - lat1) / 2) ** 2
    + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(rad(lng2 - lng1) / 2) ** 2;
  return 2 * 6371000 * Math.asin(Math.sqrt(a));
};

export async function searchHeritageNear({ lat, lng, radius = 8000, rows = 8 } = {}) {
  if (!lat || !lng) throw new Error('lat, lng 가 필요해요');
  if (!all.list || Date.now() - all.at > 3600e3) {
    all = { at: Date.now(), list: await searchHeritage({ rows: 3000 }) };
  }
  return all.list
    .filter((h) => Number(h.lat) > 0 && Number(h.lng) > 0)
    .map((h) => ({ ...h, dist: Math.round(distM(Number(lat), Number(lng), Number(h.lat), Number(h.lng))) }))
    .filter((h) => h.dist <= Number(radius))
    .sort((a, b) => a.dist - b.dist)
    .slice(0, rows);
}

// 제주 국가유산 전체 중 좌표가 있는 것 (3D 지도용)
export async function listHeritageAll() {
  if (!all.list || Date.now() - all.at > 3600e3) {
    all = { at: Date.now(), list: await searchHeritage({ rows: 3000 }) };
  }
  return all.list.filter((h) => Number(h.lat) > 0 && Number(h.lng) > 0);
}
