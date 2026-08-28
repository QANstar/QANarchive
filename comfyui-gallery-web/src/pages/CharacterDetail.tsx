import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, errorMessage } from '../api/client';
import type { CharacterDetail as CharacterDetailType, WorkListItem } from '../api/types';
import { PromptBlock } from '../components/PromptBlock';
import TagChips from '../components/TagChips';
import { WorkCard } from '../components/Cards';
import { useAuth } from '../auth/AuthContext';

export default function CharacterDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [char, setChar] = useState<CharacterDetailType | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [candidates, setCandidates] = useState<WorkListItem[]>([]);
  const [candSearch, setCandSearch] = useState('');
  const [msg, setMsg] = useState('');

  const load = () => {
    api.get<CharacterDetailType>(`/characters/${id}`)
      .then((res) => setChar(res.data))
      .catch(() => setNotFound(true));
  };

  useEffect(load, [id]);

  useEffect(() => {
    if (!addOpen) return;
    api.get<{ items: WorkListItem[] }>('/gallery', {
      params: { tab: 'works', search: candSearch || undefined, pageSize: 50 },
    }).then((res) => {
      const inSet = new Set(char?.works.map((w) => w.id));
      setCandidates(res.data.items.filter((w) => !inSet?.has(w.id)));
    }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addOpen, candSearch]);

  if (notFound) return <div className="container empty"><div className="empty-emoji">✦</div><p>角色不存在</p></div>;
  if (!char) return <div className="container loading-row"><div className="spinner" /></div>;

  const isOwner = user?.id === char.author.id;

  const handleDelete = async () => {
    if (!window.confirm('删除这个角色?关联的作品不会被删除。')) return;
    try {
      await api.delete(`/characters/${char.id}`);
      navigate('/?tab=characters');
    } catch (err) {
      setMsg(errorMessage(err));
    }
  };

  const addWork = async (workId: string) => {
    try {
      await api.post(`/characters/${char.id}/works`, { workIds: [workId] });
      setAddOpen(false);
      load();
    } catch (err) {
      setMsg(errorMessage(err));
    }
  };

  const removeWork = async (workId: string) => {
    if (!window.confirm('从该合集移除这个作品?')) return;
    try {
      await api.delete(`/characters/${char.id}/works/${workId}`);
      load();
    } catch (err) {
      setMsg(errorMessage(err));
    }
  };

  return (
    <div className="container fade-in">
      <div className="char-hero">
        <div className="char-cover">
          {char.previewUrl ? (
            <img src={char.previewUrl} alt={char.name} />
          ) : (
            <div className="grad-ph" style={{ width: '100%', minHeight: 320, fontSize: 56 }}>✦</div>
          )}
        </div>
        <div className="side-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 12 }}>
            <h1>{char.name}</h1>
            {isOwner && (
              <div style={{ display: 'flex', gap: 8 }}>
                <Link to={`/character/${char.id}/edit`} className="btn btn-ghost btn-sm">编辑</Link>
                <button className="btn btn-danger btn-sm" onClick={handleDelete}>删除</button>
              </div>
            )}
          </div>
          {msg && <div className="toast-msg error">{msg}</div>}

          <div className="panel-section">
            <h3>角色设定 Prompt</h3>
            <PromptBlock text={char.prompt} />
          </div>

          {char.intro && (
            <div className="panel-section">
              <h3>简介</h3>
              <div style={{ fontSize: 13.5, lineHeight: 1.7 }}>{char.intro}</div>
            </div>
          )}

          {char.tags.length > 0 && (
            <div className="panel-section">
              <h3>标签</h3>
              <TagChips tags={char.tags} color="lavender" />
            </div>
          )}

          <div className="panel-section">
            <h3>合集信息</h3>
            <div style={{ fontSize: 13.5, color: 'var(--ink-3)' }}>
              共 {char.works.length} 个作品 · 创建于 {new Date(char.createdAt).toLocaleDateString('zh-CN')}
            </div>
          </div>
        </div>
      </div>

      <div className="section-head">
        <h2>合集作品({char.works.length})</h2>
        <div style={{ display: 'flex', gap: 10 }}>
          {user && (
            <>
              <button className="btn btn-plain btn-sm" onClick={() => setAddOpen(!addOpen)}>
                {addOpen ? '收起' : '＋ 追加已有作品'}
              </button>
              <Link to={`/work/new?character=${char.id}`} className="btn btn-primary btn-sm">＋ 新建作品</Link>
            </>
          )}
        </div>
      </div>

      {addOpen && (
        <div className="form-card" style={{ marginBottom: 26, padding: 20 }}>
          <input
            className="input"
            placeholder="搜索要追加的作品…"
            value={candSearch}
            onChange={(e) => setCandSearch(e.target.value)}
          />
          <div style={{ marginTop: 12 }}>
            {candidates.length === 0 ? (
              <div className="hint">没有可追加的作品</div>
            ) : (
              <div className="chips">
                {candidates.map((w) => (
                  <button key={w.id} type="button" className="chip chip-blue selectable" onClick={() => addWork(w.id)}>
                    ＋ {w.title}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {char.works.length === 0 ? (
        <div className="empty"><div className="empty-emoji">✦</div><p>这个角色还没有作品,点击「新建作品」开始吧</p></div>
      ) : (
        <div className="waterfall stagger">
          {char.works.map((w) => (
            <div key={w.id} style={{ position: 'relative' }}>
              <WorkCard work={w} />
              {isOwner && (
                <button
                  className="btn btn-danger btn-sm"
                  style={{ position: 'absolute', top: 8, right: 8, opacity: 0.92 }}
                  onClick={(e) => { e.preventDefault(); removeWork(w.id); }}
                >
                  移除
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
