import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api, errorMessage } from '../api/client';
import type { CharacterDetail } from '../api/types';
import TagPicker from '../components/TagPicker';
import Uploader from '../components/Uploader';
import ImageCropper from '../components/ImageCropper';

export default function CharacterEdit() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [prompt, setPrompt] = useState('');
  const [intro, setIntro] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [preview, setPreview] = useState<string | null>(null);      // 当前展示的预览图 URL
  const [originalPreview, setOriginalPreview] = useState<string | null>(null); // 编辑模式下服务器已有的预览 URL
  const [pendingPreview, setPendingPreview] = useState<File | null>(null); // 待上传的裁剪结果
  const [cropSrc, setCropSrc] = useState<string | null>(null);      // 裁剪用原始图片 object URL
  const [cropping, setCropping] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [loaded, setLoaded] = useState(!isEdit);
  const idRef = useRef<string | null>(id ?? null);

  useEffect(() => {
    if (!id) return;
    api.get<CharacterDetail>(`/characters/${id}`)
      .then((res) => {
        const c = res.data;
        setName(c.name);
        setPrompt(c.prompt);
        setIntro(c.intro ?? '');
        setTags(c.tags);
        setPreview(c.previewUrl ?? null);
        setOriginalPreview(c.previewUrl ?? null);
        setLoaded(true);
      })
      .catch(() => navigate('/'));
  }, [id, navigate]);

  const startCrop = (files: File[]) => {
    const file = files[0];
    if (!file) return;
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropSrc(URL.createObjectURL(file));
    setCropping(true);
  };

  const cancelCrop = () => {
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
    setCropping(false);
  };

  const handleCrop = (blob: Blob) => {
    const file = new File([blob], 'preview.jpg', { type: 'image/jpeg' });
    setPendingPreview(file);
    setPreview(URL.createObjectURL(file));
    setCropping(false);
  };

  const clearPending = () => {
    setPendingPreview(null);
    setPreview(originalPreview);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg('');
    try {
      const payload = { name, prompt, intro: intro || null, tags };
      let charId = idRef.current;
      if (isEdit && charId) {
        await api.put(`/characters/${charId}`, payload);
        if (pendingPreview) {
          const fd = new FormData();
          fd.append('file', pendingPreview);
          await api.post(`/characters/${charId}/preview`, fd);
        }
      } else {
        const res = await api.post<{ id: string }>('/characters', payload);
        charId = res.data.id;
        idRef.current = charId;
        if (pendingPreview) {
          const fd = new FormData();
          fd.append('file', pendingPreview);
          await api.post(`/characters/${charId}/preview`, fd);
        }
      }
      navigate(`/character/${charId}`);
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
        <div className="form-title">{isEdit ? '编辑角色' : '新建角色'}</div>
        <div className="form-sub">角色是作品的合集包装,填写角色设定 prompt 后即可往里面放作品{msg && <span className="toast-msg error"> · {msg}</span>}</div>

        <div className="field">
          <label>角色名 <span className="req">*</span></label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="例如:星野爱" maxLength={100} required />
        </div>

        <div className="field">
          <label>角色设定 Prompt <span className="req">*</span></label>
          <textarea className="textarea" value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="这个角色的完整设定 prompt(发型、服装、气质…)" required />
        </div>

        <div className="field">
          <label>简介</label>
          <textarea className="textarea" value={intro} onChange={(e) => setIntro(e.target.value)} placeholder="角色背景、性格…" />
        </div>

        <div className="field">
          <label>标签</label>
          <TagPicker value={tags} onChange={setTags} />
        </div>

        <div className="field">
          <label>角色预览图</label>
          {preview && (
            <div style={{ display: 'flex', gap: 12, marginBottom: 12, alignItems: 'center' }}>
              <img src={preview} alt="预览" className="char-preview-thumb" />
              {cropSrc && (
                <button type="button" className="btn btn-plain btn-sm" onClick={() => setCropping(true)}>重新裁剪</button>
              )}
              {pendingPreview && (
                <button type="button" className="btn btn-ghost btn-sm" onClick={clearPending} title="还原为已保存的预览图">移除</button>
              )}
            </div>
          )}
          <Uploader accept="image/*" multiple={false} hint="图片 ≤50MB" onFiles={startCrop} />
        </div>

        {cropping && cropSrc && (
          <ImageCropper src={cropSrc} aspectRatio={3 / 4} onCancel={cancelCrop} onConfirm={handleCrop} />
        )}

        <div className="form-actions">
          <button type="button" className="btn btn-ghost" onClick={() => navigate(-1)}>取消</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? '保存中…' : (isEdit ? '保存修改' : '创建角色')}
          </button>
        </div>
      </form>
    </div>
  );
}
