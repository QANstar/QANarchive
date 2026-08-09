import React, { useEffect, useRef, useState } from 'react';
import { Routes, Route, NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from './auth/AuthContext';
import Home from './pages/Home';
import WorkDetail from './pages/WorkDetail';
import WorkEdit from './pages/WorkEdit';
import CharacterDetail from './pages/CharacterDetail';
import CharacterEdit from './pages/CharacterEdit';
import PartDetail from './pages/PartDetail';
import PartEdit from './pages/PartEdit';
import Auth from './pages/Auth';

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // 点击菜单外部关闭
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(q.trim() ? `/?q=${encodeURIComponent(q.trim())}` : '/');
  };

  const go = (path: string) => {
    setMenuOpen(false);
    navigate(path);
  };

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="logo">
          <span className="logo-mark">◆</span>
          QAN&nbsp;Gallery
        </Link>
        <form className="nav-search" onSubmit={submitSearch}>
          <span className="search-icon">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
          </span>
          <input
            placeholder="搜索标题 / prompt / 描述…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </form>
        <nav className="nav-actions">
          {user ? (
            <div className="user-menu" ref={menuRef}>
              <button
                type="button"
                className="avatar-wrap"
                onClick={() => setMenuOpen((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
              >
                <div className="avatar ring">{user.userName.slice(0, 1).toUpperCase()}</div>
                <span>{user.userName}</span>
                <svg
                  width="10" height="10" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                  style={{ transform: menuOpen ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>

              {menuOpen && (
                <div className="user-dropdown" role="menu">
                  <div className="user-dropdown-header">
                    <div className="user-dropdown-name">{user.userName}</div>
                    <div className="user-dropdown-sub">@{user.account}</div>
                  </div>
                  <div className="user-dropdown-group">
                    <button role="menuitem" onClick={() => go('/work/new')}>＋ 新建作品</button>
                    <button role="menuitem" onClick={() => go('/character/new')}>＋ 新建角色</button>
                    <button role="menuitem" onClick={() => go('/part/new')}>＋ 新建部件</button>
                  </div>
                  <div className="user-dropdown-group">
                    <button role="menuitem" onClick={() => go('/?mine=1')}>我的内容</button>
                  </div>
                  <div className="user-dropdown-group">
                    <button role="menuitem" className="danger" onClick={logout}>退出登录</button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <NavLink to="/login" className="btn btn-sm">登录</NavLink>
              <NavLink to="/register" className="btn btn-primary btn-sm">注册</NavLink>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

export default function App() {
  return (
    <>
      <Navbar />
      <main className="page">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/work/new" element={<WorkEdit />} />
          <Route path="/work/:id/edit" element={<WorkEdit />} />
          <Route path="/work/:id" element={<WorkDetail />} />
          <Route path="/character/new" element={<CharacterEdit />} />
          <Route path="/character/:id/edit" element={<CharacterEdit />} />
          <Route path="/character/:id" element={<CharacterDetail />} />
          <Route path="/part/new" element={<PartEdit />} />
          <Route path="/part/:id/edit" element={<PartEdit />} />
          <Route path="/part/:id" element={<PartDetail />} />
          <Route path="/login" element={<Auth mode="login" />} />
          <Route path="/register" element={<Auth mode="register" />} />
        </Routes>
      </main>
    </>
  );
}
