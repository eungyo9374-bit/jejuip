// 3D 지도 핀 — 장소를 22가지 종류로 나누고, 종류마다 그것을 닮은 작은 모형(배·파라솔·탑 등)을 만들어요.
// 분류는 이름(과 문화유산 종류)에 들어 있는 낱말로 정해요. 위에 있는 규칙이 먼저 적용돼요.
import * as THREE from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'

// ── 종류와 색 ──
export const CATEGORIES = {
  oreum: { label: '오름', color: '#6fa05a' },
  mountain: { label: '산·기암', color: '#8a8478' },
  harbor: { label: '항·포구·등대', color: '#2b8fd9' },
  beach: { label: '바다·해안', color: '#e8884a' },
  waterfall: { label: '폭포·계곡', color: '#4aa3c7' },
  cave: { label: '동굴', color: '#7a6a5a' },
  forest: { label: '숲·나무', color: '#3f8f5a' },
  geology: { label: '지질·생태', color: '#8d7fb3' },
  temple: { label: '사찰·종교', color: '#c0614a' },
  castle: { label: '성곽·연대', color: '#8c7b6a' },
  statue: { label: '돌하르방·석상', color: '#75736c' },
  bangsatap: { label: '방사탑', color: '#7d7466' },
  dolmen: { label: '고인돌·유적', color: '#9a8f7a' },
  house: { label: '초가·민속', color: '#b5833f' },
  pavilion: { label: '향교·누정', color: '#a0522d' },
  modern: { label: '근현대 유산', color: '#6f7f8f' },
  relic: { label: '유물·문헌', color: '#b58f4a' },
  museum: { label: '박물관·전시', color: '#d28a3b' },
  park: { label: '공원·체험', color: '#e0a030' },
  view: { label: '길·전망·기념', color: '#c9573e' },
  flag: { label: '기타 관광지', color: '#f2a93b' },
  stele: { label: '기타 문화유산', color: '#7b5ea7' },
}

const RULES = [
  ['harbor', /유람선|여객선/],
  ['modern', /일제|군사시설|비행|격납|훈련|병원|도청|면사무소|강병대교회|기관차|별장|연구소|관개수로|대정여자고등학교/],
  ['relic', /소장|일괄|전적|표해록|효열록|연방록|용방록|급제선생안|탐라지도|삼읍도|홍화각기|군병도안|보초등록|속오군적부|제구|무신도|물옷|유물/],
  ['cave', /굴|동굴/],
  ['statue', /돌하르방|동자복|서자복|복신미륵|석물원/],
  ['bangsatap', /방사탑/],
  ['pavilion', /향교|관덕정|연북정|명월대|향사|일관헌|오현단|관아|사당|해신사|삼성혈|혼인지|삼사석|정$/],
  ['mountain', /한라산|산방산|영실|백록담|선작지왓|일출봉|용머리|외돌개|기암/],
  ['view', /기념탑/],
  ['oreum', /오름|굼부리|어승생|고근산|영주산|별도봉|사라봉|삼매봉|수악|봉$|봉\)$/],
  ['geology', /산호|서식|번식|화석|분화구|화산쇄설|호니토|천연보호구역|암벽식물|홍조단괴|주상절리|생태|노루|제주마/],
  ['forest', /숲|곶자왈|휴양림|수목원|습지|동백동산|나무|곰솔|왕벚|군락|자생지|팽나무|귤|유자|동백|조록|비자|난대림|수림|초령목|한란|선인장|먼나무|담팔수|파초|느티|곶$/],
  ['waterfall', /폭포|계곡|못(\([^)]*\))?$|무수천|천지연|천제연|구시물|용연|쇠소깍|방선문/],
  ['harbor', /(항|포구|항구|등대)$|여객선|유람선/],
  ['beach', /해변|해수욕장|해안|논짓물|소남머리|형제섬|섬$|추자도|큰엉|연안|해빈/],
  ['castle', /성지$|읍성|환해장성|진성|연대$|별방진|진지$|항파두리|명월성/],
  ['dolmen', /지석묘|고인돌|유적|패총|선사|묘역|묘비|왕자묘|묘$|방묘|도요지/],
  ['museum', /박물관|미술관|갤러리|문학관|기념관|명예전당|과학탐구체험관|천문과학문화관/],
  ['house', /가옥|고택|초가|민속|성읍마을|유배지|적거지|당$|종손|객주집|대장간/],
  ['temple', /천주교|김대건|법정사|사(\([^)]*\))?$|사지|정사|선원|불탑|미륵|탑$|존자암|대적광전|목조|석조|좌상|입상|여래|보살/],
  ['park', /공원|정원|농원|목장|유채|꽃|테마|랜드|파크|공화국|리조트|카페|체험|마을/],
  ['view', /도로|터널|골목|다리|교$|망대|전망|기념탑|비석거리/],
]

export function categorize(kind, title) {
  for (const [cat, re] of RULES) if (re.test(title)) return cat
  return kind === 'heritage' ? 'stele' : 'flag'
}

// ── 모형: 작은 도형 몇 개를 모아 한 덩어리로 (높이 약 0.3) ──
const cyl = (rt, rb, h, s = 10) => new THREE.CylinderGeometry(rt, rb, h, s)
const box = (w, h, d) => new THREE.BoxGeometry(w, h, d)
const cone = (r, h, s = 10) => new THREE.ConeGeometry(r, h, s)
const sph = (r) => new THREE.SphereGeometry(r, 12, 9)
const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(), P = new THREE.Vector3(), S = new THREE.Vector3()
function part(geo, color, pos = [0, 0, 0], scl = [1, 1, 1], rot = [0, 0, 0]) {
  const g = geo.index ? geo.toNonIndexed() : geo.clone()
  g.deleteAttribute('uv')
  g.applyMatrix4(M.compose(P.set(...pos), Q.setFromEuler(E.set(...rot)), S.set(...scl)))
  const c = new THREE.Color(color), n = g.attributes.position.count, arr = new Float32Array(n * 3)
  for (let i = 0; i < n; i++) arr.set([c.r, c.g, c.b], i * 3)
  g.setAttribute('color', new THREE.BufferAttribute(arr, 3))
  return g
}
const Q4 = Math.PI / 4
const INK = '#4a4743', WHITE = '#fffdf8', STONE = '#8f8a7e'

const BUILD = {
  oreum: () => [part(sph(0.15), '#6fa05a', [0, 0.04, 0], [1, 0.7, 1]), part(cyl(0.05, 0.05, 0.012), '#4f7f43', [0, 0.143, 0])],
  mountain: () => [part(cone(0.16, 0.3), '#8a8478', [0, 0.15, 0]), part(cone(0.06, 0.1), WHITE, [0, 0.255, 0])],
  harbor: () => [part(cyl(0.12, 0.12, 0.01), '#8cc4dc', [0, 0.005, 0]), part(box(0.2, 0.05, 0.07), '#2b6fb0', [0, 0.04, 0]), part(cyl(0.006, 0.006, 0.2), INK, [0, 0.15, 0]), part(box(0.012, 0.14, 0.09), WHITE, [0, 0.18, 0.05])],
  beach: () => [part(cyl(0.1, 0.1, 0.012), '#ecd9a8', [0, 0.006, 0]), part(cyl(0.007, 0.007, 0.26), '#8a5a3a', [0, 0.13, 0]), part(cone(0.14, 0.07), '#e4572e', [0, 0.275, 0])],
  waterfall: () => [part(sph(0.075), '#4aa3c7', [0, 0.085, 0]), part(cone(0.066, 0.16), '#4aa3c7', [0, 0.2, 0])],
  cave: () => [part(sph(0.13), '#7a6a5a', [0, 0.05, 0], [1, 0.8, 1]), part(cyl(0.05, 0.05, 0.02), '#2b2926', [0, 0.06, 0.115], [1, 1, 1], [Math.PI / 2, 0, 0])],
  forest: () => [part(cyl(0.015, 0.02, 0.12), '#7a5a3a', [0, 0.06, 0]), part(cone(0.1, 0.15), '#3f8f5a', [0, 0.19, 0]), part(cone(0.075, 0.12), '#4aa069', [0, 0.28, 0])],
  geology: () => [part(new THREE.IcosahedronGeometry(0.1), '#8d7fb3', [0, 0.09, 0], [1, 0.85, 1]), part(cone(0.03, 0.09, 5), '#c9bde6', [0.04, 0.2, 0])],
  temple: () => [part(box(0.14, 0.03, 0.14), '#9a8f7a', [0, 0.015, 0]), part(box(0.09, 0.06, 0.09), '#d8c49a', [0, 0.06, 0]), part(cone(0.12, 0.05, 4), '#c0614a', [0, 0.115, 0], [1, 1, 1], [0, Q4, 0]), part(box(0.065, 0.05, 0.065), '#d8c49a', [0, 0.16, 0]), part(cone(0.09, 0.045, 4), '#c0614a', [0, 0.2, 0], [1, 1, 1], [0, Q4, 0]), part(cyl(0.006, 0.006, 0.1), '#d9a441', [0, 0.27, 0])],
  castle: () => [part(box(0.1, 0.2, 0.1), '#8c7b6a', [0, 0.1, 0]), ...[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([x, z]) => part(box(0.03, 0.04, 0.03), '#7a6a5a', [x * 0.035, 0.22, z * 0.035]))],
  statue: () => [part(cyl(0.045, 0.055, 0.16), '#75736c', [0, 0.08, 0]), part(sph(0.05), '#75736c', [0, 0.19, 0]), part(cyl(0.07, 0.07, 0.012), '#5f5d57', [0, 0.235, 0]), part(cyl(0.035, 0.04, 0.045), '#5f5d57', [0, 0.26, 0])],
  bangsatap: () => [part(cyl(0.07, 0.085, 0.08), '#7d7466', [0, 0.04, 0]), part(cyl(0.055, 0.07, 0.07), '#8a8070', [0, 0.115, 0]), part(cyl(0.04, 0.055, 0.06), '#7d7466', [0, 0.18, 0]), part(cyl(0.005, 0.005, 0.1), INK, [0, 0.26, 0]), part(sph(0.02), INK, [0, 0.315, 0])],
  dolmen: () => [part(box(0.03, 0.1, 0.06), STONE, [-0.055, 0.05, 0]), part(box(0.03, 0.1, 0.06), STONE, [0.055, 0.05, 0]), part(box(0.21, 0.035, 0.12), '#9a8f7a', [0, 0.117, 0], [1, 1, 1], [0, 0, 0.06])],
  house: () => [part(box(0.14, 0.08, 0.1), '#d8c49a', [0, 0.04, 0]), part(cone(0.12, 0.1, 4), '#b5833f', [0, 0.13, 0], [1.1, 1, 0.8], [0, Q4, 0]), part(box(0.03, 0.045, 0.012), '#5a4a3a', [0, 0.025, 0.052])],
  pavilion: () => [part(box(0.15, 0.02, 0.15), '#bfb6a3', [0, 0.01, 0]), ...[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([x, z]) => part(cyl(0.01, 0.01, 0.1), '#a0522d', [x * 0.06, 0.07, z * 0.06])), part(cone(0.16, 0.08, 4), INK, [0, 0.16, 0], [1, 1, 1], [0, Q4, 0])],
  modern: () => [part(box(0.12, 0.1, 0.1), '#6f7f8f', [0, 0.05, 0]), part(box(0.14, 0.015, 0.12), '#4a5560', [0, 0.108, 0]), part(box(0.03, 0.05, 0.012), '#2b2926', [0, 0.03, 0.052]), part(cyl(0.012, 0.012, 0.07), '#4a5560', [0.04, 0.15, 0])],
  relic: () => [part(new THREE.LatheGeometry([[0.001, 0], [0.05, 0], [0.07, 0.06], [0.05, 0.13], [0.03, 0.16], [0.045, 0.19]].map(([x, y]) => new THREE.Vector2(x, y)), 14), '#b58f4a')],
  museum: () => [part(box(0.16, 0.02, 0.12), '#bfb6a3', [0, 0.01, 0]), part(box(0.14, 0.08, 0.1), '#e9dfc9', [0, 0.06, 0]), part(cone(0.11, 0.06, 4), '#d28a3b', [0, 0.13, 0], [1.1, 1, 0.8], [0, Q4, 0]), ...[-0.045, 0, 0.045].map((x) => part(cyl(0.008, 0.008, 0.08), WHITE, [x, 0.06, 0.055]))],
  park: () => [part(cyl(0.008, 0.008, 0.2), '#4f8f4a', [0, 0.1, 0]), part(sph(0.032), '#f2a93b', [0, 0.215, 0]), ...[0, 1, 2, 3, 4].map((i) => part(sph(0.036), '#f28ab0', [Math.cos((i * Math.PI * 2) / 5) * 0.055, 0.215, Math.sin((i * Math.PI * 2) / 5) * 0.055]))],
  view: () => [part(cyl(0.01, 0.01, 0.3), INK, [0, 0.15, 0]), part(box(0.11, 0.04, 0.01), '#c9573e', [0.04, 0.26, 0]), part(box(0.09, 0.035, 0.01), WHITE, [-0.035, 0.2, 0])],
  flag: () => [part(cyl(0.008, 0.008, 0.3), INK, [0, 0.15, 0]), part(box(0.11, 0.07, 0.01), '#f2a93b', [0.055, 0.26, 0])],
  stele: () => [part(cone(0.05, 0.24, 4), '#7b5ea7', [0, 0.12, 0], [1, 1, 1], [0, Q4, 0]), part(box(0.1, 0.02, 0.1), '#9a8f7a', [0, 0.01, 0])],
}

// 종류별 한 덩어리 모형 (처음 쓸 때 만들어 기억)
const cache = {}
export function pinGeometry(cat) {
  if (!cache[cat]) {
    const g = mergeGeometries(BUILD[cat]())
    g.computeBoundingSphere()
    cache[cat] = g
  }
  return cache[cat]
}
export const PIN_SCALE = 1.5
