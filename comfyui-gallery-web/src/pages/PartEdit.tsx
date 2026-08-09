import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api, errorMessage } from '../api/client';
import type { PartDetail } from '../api/types';
import TagPicker from '../components/TagPicker';
import Uploader from '../components/Uploader';

const CATEGORIES = ['发型', '服装', '配饰', '表情', '场景', '姿势', '画风', '其他'];

export default function PartEdit() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [category, setCategory] = useState(CATEGORIES[0]);
  const [name, setName] = useState('');
  const [prompt, setPrompt] = useState('');
  const [intro, setIntro] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [preview, setPreview] = useState<string | null>(null);
  const [pendingPreview, setPendingPreview] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [loaded, setLoaded] = useState(!isEdit);
  const idRef = useRef<string | null>(id ?? null);

  useEffect(() => {
    if (!id) return;
    api.get<PartDetail>(`/parts/${id}`)
      .then((res) => {
        const p = res.data;
        setCategory(p.category);
        setName(p.name);
        setPrompt(p.prompt);
        setIntro(p.intro ?? '');
        setTags(p.tags);
        setPreview(p.previewUrl ?? null);
        setLoaded(true);
      })
      .catch(() => navigate('/'));
  }, [id, navigate]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg('');
    try {
      const payload = { category, name, prompt, intro: intro || null, tags };
      let partId = idRef.current;
      if (isEdit && partId) {
        await api.put(`/parts/${partId}`, payload);
        if (pendingPreview) {
          const fd = new FormData();
          fd.append('file', pendingPreview);
          await api.post(`/parts/${partId}/preview`, fd);
        }
      } else {
        const res = await api.post<{ id: string }>('/parts', payload);
        partId = res.data.id;
        idRef.current = partId;
        if (pendingPreview) {
          const fd = new FormData();
          fd.append('file', pendingPreview);
          await api.post(`/parts/${partId}/preview`, fd);
        }
      }
      navigate(`/part/${partId}`);
    } catch (err) {
      setMsg(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (!loaded) return <div className="container loading-row"><div className="spinner" /></div>;

  return (
    <div className="container fade-in">
      <form className="form-card" onSubmit={handleSave}>
        <div className="form-title">{isEdit ? '编辑部件' : '新建部件'}</div>
        <div className="form-sub">部件是可复用的提示词片段(发型、服装、配饰…),以后拼 prompt 直接抄{msg && <span className="toast-msg error"> · {msg}</span>}</div>

        <div className="field">
          <label>分类 <span className="req">*</span></label>
          <div className="chips">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                className={`chip ${category === c ? 'selected' : 'chip-lavender'} selectable`}
                onClick={() => setCategory(c)}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <label>部件名 <span className="req">*</span></label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="例如:双马尾" maxLength={100} required />
        </div>

        <div className="field">
          <label>提示词片段 <span className="req">*</span></label>
          <textarea className="textarea" value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="例如: twin tails, long hair, hair ornaments" required />
        </div>

        <div className="field">
          <label>简介</label>
          <textarea className="textarea" value={intro} onChange={(e) => setIntro(e.target.value)} placeholder="什么时候用、搭配什么…" />
        </div>

        <div className="field">
          <label>标签</label>
          <TagPicker value={tags} onChange={setTags} />
        </div>

        <div className="field">
          <label>预览图</label>
          {(preview || pendingPreview) && (
            <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
              <img
                src={pendingPreview ? URL.createObjectURL(pendingPreview) : preview!}
                alt="预览"
                style={{ width: 96, height: 96, objectFit: 'cover', borderRadius: 12, border: '1px solid var(--hairline)' }}
              />
            </div>
          )}
          <Uploader accept="image/*" multiple={false} hint="图片 ≤50MB" onFiles={(f) => setPendingPreview(f[0] ?? null)} />
        </div>

        <div className="form-actions">
          <button type="button" className="btn btn-ghost" onClick={() => navigate(-1)}>取消</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? '保存中…' : (isEdit ? '保存修改' : '创建部件')}
          </button>
        </div>
      </form>
    </div>
  );
}
