// 코스 상세의 "코스 주변 명소"에 직접 추가한 추천 명소 — TourAPI 목록에 없는 곳을 손으로 정리했어요.
// 키: 코스 번호 / art: 카드 그림 id (components/JejuArt.jsx · data/mascotIcons.js 에 정의)
export const CURATED_SPOTS = {
  '2': [
    { id: 'c-sikdaesan', title: '식산봉', addr: '서귀포시 성산읍 오조리', art: 'm-oreum', desc: '오조리 바닷가에 솟은 작은 오름. 정상에 오르면 성산일출봉과 오조 해안이 한눈에 보여요.' },
    { id: 'c-jokjimul', title: '족지물', addr: '서귀포시 성산읍 오조리', art: 'm-spring', desc: '마을 사람들이 오래전부터 쓰던 용천수(샘물). 2코스 길가에서 제주의 물 문화를 만날 수 있어요.' },
    { id: 'c-daesusan', title: '대수산봉 정상', addr: '서귀포시 성산읍', art: 'm-summit', desc: '2코스에서 오름을 오르는 구간의 정상. 성산 일대와 바다가 탁 트여 내려다보여요.' },
  ],
  '20': [
    { id: 'c-woljeong', title: '월정해수욕장', addr: '제주시 구좌읍 월정리', art: 'm-parasol', desc: '에메랄드빛 바다와 하얀 모래, 서핑과 카페 거리로 유명한 월정리의 해변이에요.' },
    { id: 'c-haenyeo-museum', title: '제주해녀박물관', addr: '제주시 구좌읍 해녀박물관길 26', art: 'm-tewak', desc: '해녀의 삶과 물질 문화를 전시로 만나는 박물관. 20코스가 끝나는 도착 지점이에요.' },
  ],
}
