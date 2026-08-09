import React from 'react';
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
  const [q, setQ] = React.useState('');

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(q.trim() ? `/?q=${encodeURIComponent(q.trim())}` : '/');
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
            <>
              <Link to="/work/new" className="btn btn-primary btn-sm">＋ 新建作品</Link>
              <div className="avatar ring" title={user.userName}>
                {user.userName.slice(0, 1).toUpperCase()}
              </div>
              <button className="btn btn-plain btn-sm" onClick={logout}>退出</button>
            </>
          ) : (
            <>
              <NavLink to="/login" className="btn btn-plain btn-sm">登录</NavLink>
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
