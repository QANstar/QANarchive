import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, errorMessage } from '../api/client';
import type { PartDetail as PartDetailType } from '../api/types';
import { PromptBlock } from '../components/PromptBlock';
import TagChips from '../components/TagChips';
import { useAuth } from '../auth/AuthContext';

export default function PartDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [part, setPart] = useState<PartDetailType | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    api.get<PartDetailType>(`/parts/${id}`)
      .then((res) => setPart(res.data))
      .catch(() => setNotFound(true));
  }, [id]);

  if (notFound) return <div className="container empty"><div className="empty-emoji">✦</div><p>部件不存在</p></div>;
  if (!part) return <div className="container loading-row"><div className="spinner" /></div>;

  const isOwner = user?.id === part.author.id;

  const handleDelete = async () => {
    if (!window.confirm('删除这个部件?引用它的作品不会受影响。')) return;
    try {
      await api.delete(`/parts/${part.id}`);
      navigate('/?tab=parts');
    } catch (err) {
      setMsg(errorMessage(err));
    }
  };

  return (
    <div className="container fade-in">
      <div className="char-hero">
        <div className="char-cover">
          {part.previewUrl ? (
            <img src={part.previewUrl} alt={part.name} />
          ) : (
            <div className="grad-ph" style={{ width: '100%', height: '100%', fontSize: 56 }}>✦</div>
          )}
        </div>
        <div className="side-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 12 }}>
            <div>
              <span className="card-category">{part.category}</span>
              <h1>{part.name}</h1>
            </div>
            {isOwner && (
              <div style={{ display: 'flex', gap: 8 }}>
                <Link to={`/part/${part.id}/edit`} className="btn btn-ghost btn-sm">编辑</Link>
                <button className="btn btn-danger btn-sm" onClick={handleDelete}>删除</button>
              </div>
            )}
          </div>
          {msg && <div className="toast-msg error">{msg}</div>}

          <div className="panel-section">
            <h3>提示词片段</h3>
            <PromptBlock text={part.prompt} label="复制部件 prompt" />
          </div>

          {part.intro && (
            <div className="panel-section">
              <h3>简介</h3>
              <div style={{ fontSize: 13.5, lineHeight: 1.7 }}>{part.intro}</div>
            </div>
          )}

          {part.tags.length > 0 && (
            <div className="panel-section">
              <h3>标签</h3>
              <TagChips tags={part.tags} color="pink" />
            </div>
          )}

          <div className="panel-section">
            <h3>使用情况</h3>
            <div style={{ fontSize: 13.5, color: 'var(--ink-3)' }}>
              被 {part.usedByCount} 个作品引用 · 创建于 {new Date(part.createdAt).toLocaleDateString('zh-CN')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
