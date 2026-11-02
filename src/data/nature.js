// 홈 "제주의 자연" 갤러리 — 사진은 한국관광공사 TourAPI(관광지 이미지), 이름·설명은 직접 정리했습니다.
// 새 항목을 넣을 때: image 는 /api/tour?keyword=... 결과의 image 주소(https) 를 사용하세요.
const R = 'https://tong.visitkorea.or.kr/cms/resource/'

export const NATURE = {
  halla: {
    kind: '한라산', name: '한라산 영실',
    desc: '병풍바위와 오백나한 기암이 펼쳐지는 한라산 남서쪽 탐방로. 윗세오름까지 이어지는 대표 트레킹 코스예요.',
    image: R + '15/3552115_image2_1.jpg',
  },
  daepo: {
    kind: '바다 · 해안 절벽', name: '대포해안 주상절리',
    desc: '용암이 바닷가에서 빠르게 식으며 기둥 모양으로 갈라진 절벽. 파도가 칠 때 가장 장관이에요.',
    image: R + '55/3550955_image2_1.jpg',
  },
  gae: {
    kind: '오름', name: '개오름',
    desc: '오름은 한라산 기슭에 솟은 작은 화산체로, 제주에 360여 개가 있어요. 완만해서 가볍게 오르기 좋습니다.',
    image: R + '94/3526894_image2_1.jpg',
  },
  hamdeok: {
    kind: '바다 · 해변', name: '함덕해수욕장',
    desc: '에메랄드빛 물빛과 하얀 모래가 서우봉 아래 펼쳐지는 동쪽의 대표 해변이에요.',
    image: R + '00/3354600_image2_1.jpg',
  },
  eongddo: {
    kind: '폭포', name: '엉또폭포',
    desc: '평소엔 물이 거의 없다가 많은 비가 내린 뒤에만 힘차게 쏟아지는, 만나기 어려운 폭포예요.',
    image: R + '58/3536058_image2_1.jpg',
  },
  hyeongje: {
    kind: '바다 · 걷기길', name: '형제해안도로',
    desc: '송악산 아래 바닷길을 따라 걸으며 형제섬을 바라볼 수 있는 서쪽 해안 산책로예요.',
    image: R + '77/3552077_image2_1.jpg',
  },
  gaetgeori: {
    kind: '오름 · 분화구', name: '갯거리오름',
    desc: '위에서 내려다보면 움푹 팬 둥근 굼부리(분화구) 모양이 또렷하게 보이는 오름이에요.',
    image: R + '00/3585200_image2_1.jpg',
  },
}
