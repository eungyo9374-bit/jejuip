// 코스 번호 → 마스코트 [그림 id, 이름, 크기]
// 그림 id 는 components/JejuArt.jsx 의 ICONS 와 data/mascotIcons.js 에 정의돼 있어요.
// 코스가 지나는 지역·풍경에서 제주다운 특징을 하나씩 골랐습니다.
export const COURSE_MASCOT = {
  '1': ['a-ilchul', '성산일출봉', 1.35],
  '1-1': ['m-cow', '우도의 소', 1.25],
  '2': ['m-canola', '유채꽃', 1.2],
  '3': ['m-horse', '조랑말', 1.2],
  '4': ['a-tang', '감귤', 2.0],
  '5': ['m-camellia', '동백꽃', 1.25],
  '6': ['m-waterfall', '정방폭포', 1.15],
  '7': ['m-rock', '외돌개', 1.2],
  '7-1': ['m-oreum', '오름', 1.3],
  '8': ['m-columns', '주상절리', 1.15],
  '9': ['m-tewak', '해녀의 테왁', 1.4],
  '10': ['a-sanbang', '산방산', 1.4],
  '10-1': ['m-barley', '청보리', 1.1],
  '11': ['m-dolphin', '남방큰돌고래', 1.3],
  '12': ['m-sunset', '차귀도 노을', 1.3],
  '13': ['m-fern', '고사리', 1.1],
  '14': ['m-cactus', '월령 선인장', 1.25],
  '14-1': ['m-tea', '녹차', 1.45],
  '15': ['m-biyang', '비양도', 1.35],
  '16': ['m-wall', '제주 돌담', 1.3],
  '17': ['a-hare', '돌하르방', 1.9],
  '18': ['a-light', '산지등대', 1.4],
  '18-1': ['m-fish', '추자 굴비', 1.3],
  '18-2': ['m-fishboat', '낚싯배', 1.3],
  '19': ['m-parasol', '해변 파라솔', 1.2],
  '20': ['a-wind', '풍력발전기', 0.95],
  '21': ['m-egret', '하도 백로', 1.25],
}
export const mascotOf = (course) => COURSE_MASCOT[String(course).replace('코스', '')]
