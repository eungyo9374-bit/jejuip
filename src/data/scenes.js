// 홈 "걷다 보면 만나는 풍경" 갤러리 — 사진은 한국관광공사 TourAPI(관광지 이미지), 이름·설명은 직접 정리했습니다.
// 새 항목을 넣을 때: image 는 /api/tour?keyword=... 결과의 image 주소(https) 를 사용하세요.
const R = 'https://tong.visitkorea.or.kr/cms/resource/'

export const SCENES = {
  jongdal: {
    kind: '1코스 · 21코스 · 종달리', name: '종달리 해안도로',
    desc: '성산일출봉 쪽으로 이어지는 동쪽 끝 해안길. 1코스가 지나고 21코스가 끝나는 종달리 바닷가예요.',
    image: R + '71/3368571_image2_1.jpg',
  },
  daepo: {
    kind: '8코스 · 월평-대평', name: '대포해안 주상절리',
    desc: '용암이 바닷가에서 빠르게 식으며 기둥 모양으로 갈라진 절벽. 파도가 칠 때 가장 장관이에요.',
    image: R + '55/3550955_image2_1.jpg',
  },
  oedolgae: {
    kind: '7코스 · 서귀포-월평', name: '외돌개',
    desc: '서귀포 바다에 홀로 솟은 바위 기둥. 7코스에서 가장 먼저 눈에 들어오는 풍경이에요.',
    image: R + '75/3552175_image2_1.jpg',
  },
  keunyeong: {
    kind: '5코스 · 남원-쇠소깍', name: '남원 큰엉해안',
    desc: '바닷가 절벽 위로 이어진 산책로. 남원에서 쇠소깍으로 걷는 길에서 만나요.',
    image: R + '25/3550525_image2_1.jpg',
  },
  udo: {
    kind: '1-1코스 · 우도', name: '우도 등대',
    desc: '섬을 한 바퀴 도는 우도 코스에서 만나는 등대와 해안길이에요.',
    image: R + '35/3554035_image2_1.jpg',
  },
  hyeongje: {
    kind: '10코스 · 화순-모슬포', name: '형제해안도로',
    desc: '송악산 아래 바닷길을 걸으며 형제섬을 바라볼 수 있는 서쪽 해안 구간이에요.',
    image: R + '77/3552077_image2_1.jpg',
  },
  hamdeok: {
    kind: '19코스 · 조천-김녕', name: '함덕해수욕장',
    desc: '에메랄드빛 물빛과 하얀 모래가 서우봉 아래 펼쳐지는 동북쪽의 대표 해변이에요.',
    image: R + '00/3354600_image2_1.jpg',
  },
}
