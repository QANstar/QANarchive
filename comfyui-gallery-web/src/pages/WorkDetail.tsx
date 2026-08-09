import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, errorMessage } from '../api/client';
import type { WorkDetail as WorkDetailType, MediaDto } from '../api/types';
import { PromptBlock, CopyButton } from '../components/PromptBlock';
import TagChips from '../components/TagChips';
import { useAuth } from '../auth/AuthContext';

export default function WorkDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [work, setWork] = useState<WorkDetailType | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [active, setActive] = useState<MediaDto | null>(null);
  const [workflowOpen, setWorkflowOpen] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    api.get<WorkDetailType>(`/works/${id}`)
      .then((res) => {
        setWork(res.data);
        setActive(res.data.mediaItems[0] ?? null);
      })
      .catch(() => setNotFound(true));
  }, [id]);

  if (notFound) {
    return <div className="container empty"><div className="empty-emoji">✦</div><p>作品不存在或已被删除</p></div>;
  }
  if (!work) return <div className="container loading-row"><div className="spinner" /></div>;

  const isOwner = user?.id === work.author.id;

  const handleDelete = async () => {
    if (!window.confirm('确定删除这个作品吗?此操作不可恢复。')) return;
    try {
      await api.delete(`/works/${work.id}`);
      navigate('/');
    } catch (err) {
      setMsg(errorMessage(err));
    }
  };

  const downloadWorkflow = () => {
    const blob = new Blob([work.workflowJson!], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${work.title || 'workflow'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container fade-in">
      <div className="detail-hero">
        {/* 媒体墙 */}
        <div className="media-wall">
          <div className="main-media">
            {active ? (
              active.type === 'video' ? (
                <video src={active.url} controls autoPlay loop />
              ) : (
                <img src={active.url} alt={work.title} />
              )
            ) : (
              <div style={{ padding: 80, textAlign: 'center', color: 'var(--ink-4)' }}>
                还没有媒体文件
              </div>
            )}
          </div>
          {work.mediaItems.length > 1 && (
            <div className="thumbs">
              {work.mediaItems.map((m) => (
                <div
                  key={m.id}
                  className={`thumb ${active?.id === m.id ? 'active' : ''}`}
                  onClick={() => setActive(m)}
                >
                  {m.type === 'video' ? <video src={m.url} muted /> : <img src={m.url} alt="" loading="lazy" />}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 侧栏 */}
        <div className="side-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 12 }}>
            <h1>{work.title}</h1>
            {isOwner && (
              <div style={{ display: 'flex', gap: 8 }}>
                <Link to={`/work/${work.id}/edit`} className="btn btn-ghost btn-sm">编辑</Link>
                <button className="btn btn-danger btn-sm" onClick={handleDelete}>删除</button>
              </div>
            )}
          </div>
          <div className="card-sub" style={{ marginBottom: 14 }}>
            {work.author.name} · {new Date(work.createdAt).toLocaleString('zh-CN')}
          </div>
          {msg && <div className="toast-msg error">{msg}</div>}

          <div className="panel-section">
            <h3>Prompt</h3>
            <PromptBlock text={work.prompt} />
          </div>

          {work.intro && (
            <div className="panel-section">
              <h3>简介</h3>
              <div style={{ fontSize: 13.5, lineHeight: 1.7, color: 'var(--ink)' }}>{work.intro}</div>
            </div>
          )}

          {work.workflowJson && (
            <div className="panel-section">
              <h3>ComfyUI 工作流</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <button className="btn btn-plain btn-sm" onClick={() => setWorkflowOpen(!workflowOpen)}>
                  {workflowOpen ? '收起' : '查看 JSON'}
                </button>
                <CopyButton text={work.workflowJson} label="复制 JSON" />
                <button className="btn btn-plain btn-sm" onClick={downloadWorkflow}>下载</button>
              </div>
              {workflowOpen && (
                <div className="workflow-box">{work.workflowJson}</div>
              )}
            </div>
          )}

          {work.tags.length > 0 && (
            <div className="panel-section">
              <h3>标签</h3>
              <TagChips tags={work.tags} color="pink" />
            </div>
          )}

          {(work.characters.length > 0 || work.parts.length > 0) && (
            <div className="panel-section">
              <h3>关联</h3>
              <div className="link-cards">
                {work.characters.map((c) => (
                  <Link key={c.id} to={`/character/${c.id}`} className="link-card">
                    {c.previewUrl ? (
                      <img src={c.previewUrl} alt="" />
                    ) : (
                      <div className="lc-ph">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                          <circle cx="12" cy="8" r="4" />
                          <path d="M4 20c1.5-3.5 4.5-5 8-5s6.5 1.5 8 5" />
                        </svg>
                      </div>
                    )}
                    <div>
                      <div className="lc-name">{c.name}</div>
                      <div className="lc-sub">角色合集</div>
                    </div>
                  </Link>
                ))}
                {work.parts.map((p) => (
                  <Link key={p.id} to={`/part/${p.id}`} className="link-card">
                    {p.previewUrl ? (
                      <img src={p.previewUrl} alt="" />
                    ) : (
                      <div className="lc-ph">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 3 4 8v8l8 5 8-5V8z" />
                          <path d="M12 3v8" />
                          <path d="m4 8 8 3 8-3" />
                        </svg>
                      </div>
                    )}
                    <div>
                      <div className="lc-name">{p.name}</div>
                      <div className="lc-sub">{p.category} · 部件</div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
