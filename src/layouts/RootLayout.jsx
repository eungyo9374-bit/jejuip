import { useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { Container, Toast, ToastContainer } from 'react-bootstrap'
import { NAV_ITEMS } from '../router'
import { useAppStore } from '../store/useAppStore'
import { ArtDefs } from '../components/JejuArt'

export default function RootLayout() {
  const toasts = useAppStore((s) => s.toasts)
  const nickname = useAppStore((s) => s.nickname)
  const [open, setOpen] = useState(false)   // 모바일 메뉴 펼침

  // 왼쪽 메뉴는 홈·AI 도우미(오른쪽 버튼)를 뺀 나머지
  const sideItems = NAV_ITEMS.filter((i) => i.to !== '/' && i.to !== '/agent')

  return (
    <div className="d-flex flex-column min-vh-100">
      {/* 지도·마스코트 그림 정의 (화면에는 보이지 않음) */}
      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true" focusable="false"><ArtDefs /></svg>
      <header className="site-header">
        <div className="header-inner">
          <button className="menu-btn d-lg-none" aria-label="메뉴" onClick={() => setOpen(!open)}>
            <i className={`bi bi-${open ? 'x-lg' : 'list'}`} />
          </button>
          <nav className="nav-left d-none d-lg-flex">
            {sideItems.map((item) => (
              <NavLink key={item.to} to={item.to}>{item.label}</NavLink>
            ))}
          </nav>
          <Link to="/" className="brand" aria-label="제주를 걷다">JEJU</Link>
          <div className="header-right">
            {nickname && <span className="d-none d-md-inline"><i className="bi bi-person me-1" />{nickname}</span>}
            <Link to="/agent" className="btn-dark-sq">걷기 도우미</Link>
          </div>
        </div>
        {open && (
          <nav className="mobile-nav d-lg-none" onClick={() => setOpen(false)}>
            {NAV_ITEMS.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.to === '/'}>{item.label}</NavLink>
            ))}
          </nav>
        )}
      </header>

      <main className="flex-grow-1 pb-4">
        <Container className="px-4" style={{ maxWidth: 1240 }}>
          <Outlet />   {/* ← 여기에 주소에 맞는 페이지가 들어갑니다 */}
        </Container>
      </main>

      <footer className="site-footer">
        <Container className="px-4" style={{ maxWidth: 1240 }}>
          <Link to="/" className="brand" aria-label="제주를 걷다">JEJU</Link>
          제주대 청년도약 부트캠프 1기 · 데이터 출처: 한국관광공사 · 기상청 · 국가유산청(공공데이터포털)
        </Container>
      </footer>

      {/* 스토어의 toast() 로 띄운 알림 */}
      <ToastContainer position="bottom-end" className="p-3 position-fixed">
        {toasts.map((t) => (
          <Toast key={t.id} bg={t.variant}>
            <Toast.Body className="text-white">{t.message}</Toast.Body>
          </Toast>
        ))}
      </ToastContainer>
    </div>
  )
}
