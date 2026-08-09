import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { errorMessage } from '../api/client';

export default function Auth({ mode }: { mode: 'login' | 'register' }) {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [account, setAccount] = useState('');
  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      if (mode === 'login') {
        await login(account, password);
      } else {
        await register(account, userName, password, inviteCode);
      }
      navigate('/');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-wrap fade-in">
      <div className="auth-card">
        <div className="auth-logo">QAN Gallery</div>
        <div className="auth-sub">
          {mode === 'login' ? '欢迎回来,继续你的收藏' : '需要邀请码才能加入哦'}
        </div>

        <form onSubmit={submit}>
          <div className="field">
            <label>账号</label>
            <input className="input" value={account} onChange={(e) => setAccount(e.target.value)} placeholder="登录账号" autoComplete="username" required />
          </div>

          {mode === 'register' && (
            <div className="field">
              <label>昵称</label>
              <input className="input" value={userName} onChange={(e) => setUserName(e.target.value)} placeholder="展示给其他人看的名字" maxLength={50} required />
            </div>
          )}

          <div className="field">
            <label>密码</label>
            <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={mode === 'register' ? '至少 6 位' : '输入密码'} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} required />
          </div>

          {mode === 'register' && (
            <div className="field">
              <label>邀请码 <span className="req">*</span></label>
              <input className="input" value={inviteCode} onChange={(e) => setInviteCode(e.target.value)} placeholder="向管理员索取" required />
            </div>
          )}

          {error && <div className="toast-msg error">{error}</div>}

          <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }} disabled={busy}>
            {busy ? '请稍候…' : (mode === 'login' ? '登 录' : '注 册')}
          </button>
        </form>

        <div className="auth-switch">
          {mode === 'login' ? (
            <>还没有账号? <Link to="/register">去注册</Link></>
          ) : (
            <>已有账号? <Link to="/login">去登录</Link></>
          )}
        </div>
      </div>
    </div>
  );
}
