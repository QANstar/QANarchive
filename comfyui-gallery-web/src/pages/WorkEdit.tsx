import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { api, errorMessage } from '../api/client';
import type { CharacterRef, PartRef, WorkDetail, MediaDto } from '../api/types';
import TagPicker from '../components/TagPicker';
import Uploader from '../components/Uploader';

export default function WorkEdit() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const [title, setTitle] = useState('');
  const [prompt, setPrompt] = useState('');
  const [intro, setIntro] = useState('');
  const [workflowJson, setWorkflowJson] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [characterIds, setCharacterIds] = useState<string[]>([]);
  const [partIds, setPartIds] = useState<string[]>([]);

  const [characters, setCharacters] = useState<CharacterRef[]>([]);
  const [parts, setParts] = useState<PartRef[]>([]);
  const [media, setMedia] = useState<MediaDto[]>([]);
  const [cover, setCover] = useState<string | null>(null);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [loaded, setLoaded] = useState(!isEdit);
  const workIdRef = useRef<string | null>(id ?? null);
  const jsonFileRef = useRef<HTMLInputElement>(null);

  // 加载角色/部件列表
  useEffect(() => {
    api.get<CharacterRef[]>('/characters/all').then((r) => setCharacters(r.data)).catch(() => {});
    api.get<PartRef[]>('/parts/all').then((r) => setParts(r.data)).catch(() => {});
  }, []);

  // 编辑模式:加载作品
  useEffect(() => {
    if (!id) return;
    api.get<WorkDetail>(`/works/${id}`)
      .then((res) => {
        const w = res.data;
        setTitle(w.title);
        setPrompt(w.prompt);
        setIntro(w.intro ?? '');
        setWorkflowJson(w.workflowJson ?? '');
        setTags(w.tags);
        setCharacterIds(w.characters.map((c) => c.id));
        setPartIds(w.parts.map((p) => p.id));
        setMedia(w.mediaItems);
        setCover(w.coverUrl ?? null);
        setLoaded(true);
      })
      .catch(() => { navigate('/'); });
  }, [id, navigate]);

  // 新作品:预选来自 URL 的角色/部件
  useEffect(() => {
    if (isEdit) return;
    const charId = params.get('character');
    const partId = params.get('part');
    if (charId) setCharacterIds((p) => (p.includes(charId) ? p : [...p, charId]));
    if (partId) setPartIds((p) => (p.includes(partId) ? p : [...p, partId]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const uploadPending = async (workId: string) => {
    if (!pendingFiles.length) return;
    const fd = new FormData();
    pendingFiles.forEach((f) => fd.append('files', f));
    await api.post(`/works/${workId}/media`, fd);
  };

  const handleJsonFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1024 * 1024) {
      setMsg('工作流 JSON 超过 1MB 限制');
      return;
    }
    try {
      const text = await file.text();
      JSON.parse(text); // 校验是否为合法 JSON
      setWorkflowJson(text);
      setMsg('');
    } catch {
      setMsg('文件不是有效的 JSON');
    } finally {
      if (jsonFileRef.current) jsonFileRef.current.value = '';
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg('');
    try {
      const payload = {
        title, prompt,
        intro: intro || null,
        workflowJson: workflowJson || null,
        tags,
        characterIds,
        partIds,
      };
      let workId = workIdRef.current;
      if (isEdit && workId) {
        await api.put(`/works/${workId}`, payload);
      } else {
        const res = await api.post<{ id: string }>('/works', payload);
        workId = res.data.id;
        workIdRef.current = workId;
        await uploadPending(workId);
        navigate(`/work/${workId}`, { replace: true });
        return;
      }
      navigate(`/work/${workId}`);
    } catch (err) {
      setMsg(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleUpload = async (files: File[]) => {
    if (!workIdRef.current) {
      // 创建模式下暂存,保存后统一上传
      setPendingFiles((p) => [...p, ...files]);
      return;
    }
    try {
      const fd = new FormData();
      files.forEach((f) => fd.append('files', f));
      const res = await api.post<MediaDto[]>(`/works/${workIdRef.current}/media`, fd);
      setMedia((p) => [...p, ...res.data]);
    } catch (err) {
      setMsg(errorMessage(err));
    }
  };

  const removeMedia = async (m: MediaDto) => {
    if (!workIdRef.current) return;
    try {
      await api.delete(`/works/${workIdRef.current}/media/${m.id}`);
      setMedia((p) => p.filter((x) => x.id !== m.id));
    } catch (err) {
      setMsg(errorMessage(err));
    }
  };

  const setAsCover = async (m: MediaDto) => {
    if (!workIdRef.current || m.type !== 'image') return;
    try {
      const res = await api.put<{ coverUrl: string }>(`/works/${workIdRef.current}/cover/${m.id}`);
      setCover(res.data.coverUrl);
    } catch (err) {
      setMsg(errorMessage(err));
    }
  };

  const uploadCover = async (files: File[]) => {
    if (!workIdRef.current || !files.length) return;
    try {
      const fd = new FormData();
      fd.append('file', files[0]);
      const res = await api.post<{ coverUrl: string }>(`/works/${workIdRef.current}/cover`, fd);
      setCover(res.data.coverUrl);
    } catch (err) {
      setMsg(errorMessage(err));
    }
  };

  const moveMedia = async (index: number, dir: -1 | 1) => {
    if (!workIdRef.current) return;
    const target = index + dir;
    if (target < 0 || target >= media.length) return;
    const next = [...media];
    [next[index], next[target]] = [next[target], next[index]];
    setMedia(next);
    try {
      await api.put(`/works/${workIdRef.current}/media/order`,
        next.map((m, i) => ({ mediaId: m.id, sortOrder: i })));
    } catch (err) {
      setMsg(errorMessage(err));
    }
  };

  if (!loaded) {
    return <div className="container loading-row"><div className="spinner" /></div>;
  }

  return (
    <div className="container fade-in">
      <form className="form-card" onSubmit={handleSave}>
        <div className="form-title">{isEdit ? '编辑作品' : '新建作品'}</div>
        <div className="form-sub">
          {isEdit ? '修改标题、prompt、工作流与关联' : '直接传图:不勾选任何角色即可'}{msg && <span className="toast-msg error"> · {msg}</span>}
        </div>

        <div className="field">
          <label>标题 <span className="req">*</span></label>
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="给作品起个名字" maxLength={100} required />
        </div>

        <div className="field">
          <label>Prompt <span className="req">*</span></label>
          <textarea className="textarea" value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="生成这张图/视频的完整 prompt" required />
        </div>

        <div className="field">
          <label>简介</label>
          <textarea className="textarea" value={intro} onChange={(e) => setIntro(e.target.value)} placeholder="创作思路、满意的地方…" />
        </div>

        <div className="field">
          <label>ComfyUI 工作流 JSON(可选)</label>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <button type="button" className="btn btn-plain btn-sm" onClick={() => jsonFileRef.current?.click()}>
              导入 JSON 文件
            </button>
            {workflowJson && (
              <button type="button" className="btn btn-plain btn-sm" onClick={() => setWorkflowJson('')}>
                清空
              </button>
            )}
          </div>
          <textarea className="textarea code" value={workflowJson} onChange={(e) => setWorkflowJson(e.target.value)} placeholder='导入 .json 文件,或直接粘贴 {"nodes":[...]}' />
          <div className="hint">最大 1MB,保存后可在详情页复制或下载</div>
          <input
            ref={jsonFileRef}
            type="file"
            accept=".json,application/json"
            hidden
            onChange={handleJsonFile}
          />
        </div>

        <div className="field">
          <label>标签</label>
          <TagPicker value={tags} onChange={setTags} />
        </div>

        <div className="field">
          <label>所属角色(合集,可多选)</label>
          {characters.length === 0 ? (
            <div className="hint">还没有角色,先到「角色」tab 新建一个</div>
          ) : (
            <div className="chips">
              {characters.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className={`chip ${characterIds.includes(c.id) ? 'selected' : 'chip-lavender'} selectable`}
                  onClick={() => setCharacterIds((p) => p.includes(c.id) ? p.filter((x) => x !== c.id) : [...p, c.id])}
                >
                  {c.name}
                </button>
              ))}
            </div>
          )}
          <div className="hint">不选择任何角色 = 直接传图</div>
        </div>

        <div className="field">
          <label>用到的部件(可选)</label>
          {parts.length === 0 ? (
            <div className="hint">还没有部件,先到「部件」tab 新建一个</div>
          ) : (
            <div className="chips">
              {parts.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className={`chip ${partIds.includes(p.id) ? 'selected' : 'chip-pink'} selectable`}
                  onClick={() => setPartIds((prev) => prev.includes(p.id) ? prev.filter((x) => x !== p.id) : [...prev, p.id])}
                >
                  {p.category} · {p.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 媒体管理(编辑模式) */}
        {isEdit && (
          <div className="field">
            <label>媒体文件(图片 / 视频)</label>
            {media.length > 0 && (
              <div className="media-grid" style={{ marginBottom: 14 }}>
                {media.map((m, i) => (
                  <div key={m.id} className="media-tile">
                    {m.type === 'video' ? <video src={m.url} muted /> : <img src={m.url} alt="" />}
                    <button type="button" className="tile-remove" onClick={() => removeMedia(m)} title="删除">✕</button>
                    {m.type === 'image' && (
                      <button type="button" className="tile-cover" onClick={() => setAsCover(m)} title="设为封面">
                        {cover === m.url ? '★ 封面' : '设为封面'}
                      </button>
                    )}
                    <span className="tile-type">{m.type === 'video' ? '视频' : '图片'}</span>
                    <div style={{ position: 'absolute', bottom: 6, left: 44, display: 'flex', gap: 4 }}>
                      <button type="button" className="tile-cover" style={{ position: 'static' }} onClick={() => moveMedia(i, -1)}>←</button>
                      <button type="button" className="tile-cover" style={{ position: 'static' }} onClick={() => moveMedia(i, 1)}>→</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <Uploader accept="image/*,video/mp4,video/webm" hint="图片 ≤50MB,视频 ≤500MB,可多选" onFiles={handleUpload} />
            <div style={{ marginTop: 12 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 8 }}>视频封面(纯视频作品需手动上传)</label>
              <Uploader accept="image/*" multiple={false} hint="上传一张图片作为卡片封面" onFiles={uploadCover} />
            </div>
          </div>
        )}

        {/* 创建模式:暂存待上传文件 */}
        {!isEdit && pendingFiles.length > 0 && (
          <div className="field">
            <label>待上传媒体({pendingFiles.length} 个文件)</label>
            <div className="chips">
              {pendingFiles.map((f, i) => (
                <span key={i} className="chip chip-blue">{f.name}</span>
              ))}
            </div>
            <button type="button" className="btn btn-ghost btn-sm" style={{ marginTop: 8 }} onClick={() => setPendingFiles([])}>清空</button>
          </div>
        )}

        <div className="form-actions">
          <button type="button" className="btn btn-ghost" onClick={() => navigate(-1)}>取消</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? '保存中…' : (isEdit ? '保存修改' : '创建作品')}
          </button>
        </div>
      </form>
    </div>
  );
}
