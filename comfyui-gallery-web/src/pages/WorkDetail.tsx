import { Suspense, lazy, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, errorMessage, downloadFile } from '../api/client';
import type { WorkDetail as WorkDetailType, MediaDto, WorkAssetDto } from '../api/types';
import { PromptBlock } from '../components/PromptBlock';
import TagChips from '../components/TagChips';
import { useAuth } from '../auth/AuthContext';

const Model3DViewer = lazy(() => import('../components/Model3DViewer'));

const ASSET_TYPE_LABEL: Record<string, string> = { fbx: 'FBX', blend: 'Blender', zip: '压缩包' };

export default function WorkDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [work, setWork] = useState<WorkDetailType | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [active, setActive] = useState<MediaDto | null>(null);
  const [workflowOpen, setWorkflowOpen] = useState(false);
  const [previewAssetId, setPreviewAssetId] = useState<string | null>(null);
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

  const handleDownloadAsset = async (a: WorkAssetDto) => {
    try {
      await downloadFile(a.downloadUrl, a.originalName);
    } catch (err) {
      setMsg(errorMessage(err) || '下载失败,请确认已登录');
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

          {(work.assets?.length ?? 0) > 0 && (
            <div className="panel-section">
              <h3>3D 资源</h3>
              <div className="asset-list">
                {work.assets!.map((a) => (
                  <div key={a.id}>
                    <div className="asset-row">
                      {a.previewUrl ? (
                        <img className="asset-thumb" src={a.previewUrl} alt={a.originalName} loading="lazy" />
                      ) : (
                        <div className="asset-thumb placeholder">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 3 4 8v8l8 5 8-5V8z" />
                            <path d="M12 3v8" />
                            <path d="m4 8 8 3 8-3" />
                          </svg>
                        </div>
                      )}
                      <div className="asset-info">
                        <div className="asset-name">{a.originalName}</div>
                        <div className="asset-type">{ASSET_TYPE_LABEL[a.type] ?? a.type.toUpperCase()}</div>
                      </div>
                      <div className="asset-actions">
                        {a.type === 'fbx' && (
                          <button
                            className={`btn btn-plain btn-sm ${previewAssetId === a.id ? 'active' : ''}`}
                            onClick={() => setPreviewAssetId(previewAssetId === a.id ? null : a.id)}
                          >
                            {previewAssetId === a.id ? '收起' : '预览'}
                          </button>
                        )}
                        <button className="btn btn-plain btn-sm" onClick={() => handleDownloadAsset(a)}>下载</button>
                      </div>
                    </div>
                    {previewAssetId === a.id && a.type === 'fbx' && (
                      <Suspense fallback={<div className="model3d-status">加载 3D 查看器…</div>}>
                        <Model3DViewer src={a.fileUrl} />
                      </Suspense>
                    )}
                  </div>
                ))}
              </div>
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
