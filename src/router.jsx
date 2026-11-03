import { createBrowserRouter } from 'react-router-dom'
import RootLayout from './layouts/RootLayout'
import Home from './pages/Home'
import Olle from './pages/Olle'
import OlleMap from './pages/OlleMap'
import OlleDetail from './pages/OlleDetail'
import Agent from './pages/Agent'
import My from './pages/My'
import NotFound from './pages/NotFound'

// ── 메뉴 목록 ────────────────────────────────────────────
// 페이지를 추가할 때: ① pages/에 파일 만들기 ② 아래 NAV_ITEMS 에 한 줄 추가 ③ routes 에 한 줄 추가
// 아이콘 이름: https://icons.getbootstrap.com
export const NAV_ITEMS = [
  { to: '/', label: '홈', icon: 'house' },
  { to: '/map', label: '올레 지도', icon: 'map' },
  { to: '/olle', label: '올레 코스', icon: 'signpost-split' },
  { to: '/3d', label: '3D 지도', icon: 'badge-3d' },
  { to: '/agent', label: '걷기 도우미', icon: 'robot' },
  { to: '/my', label: '내 올레 수첩', icon: 'journal-bookmark' },
]

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,      // 모든 페이지에 공통으로 보이는 틀(메뉴·푸터)
    errorElement: <NotFound />,   // 없는 주소로 들어오면
    children: [
      { index: true, element: <Home /> },
      { path: 'map', element: <OlleMap /> },
      { path: 'olle', element: <Olle /> },
      { path: '3d', lazy: async () => ({ Component: (await import('./pages/Map3D')).default }) },   // 3D 는 무거워서 열 때만 불러와요
      { path: 'olle/:id', element: <OlleDetail /> },
      { path: 'agent', element: <Agent /> },
      { path: 'my', element: <My /> },
    ],
  },
])
