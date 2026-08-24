import { useRef, useState } from 'react';

interface AssetUploaderProps {
  onFiles: (asset: File, preview: File | null) => void;
}

const ASSET_ACCEPT = '.fbx,.blend,.zip';
const PREVIEW_ACCEPT = 'image/*';

export default function AssetUploader({ onFiles }: AssetUploaderProps) {
  const assetRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<HTMLInputElement>(null);
  const [asset, setAsset] = useState<File | null>(null);
  const [preview, setPreview] = useState<File | null>(null);

  const reset = () => {
    setAsset(null);
    setPreview(null);
    if (assetRef.current) assetRef.current.value = '';
    if (previewRef.current) previewRef.current.value = '';
  };

  const submit = () => {
    if (!asset) return;
    onFiles(asset, preview);
    reset();
  };

  return (
    <div className="asset-uploader">
      <div className="asset-uploader-row">
        <button type="button" className="btn btn-plain btn-sm" onClick={() => assetRef.current?.click()}>
          {asset ? `已选: ${asset.name}` : '选择 3D 文件 (.fbx/.blend/.zip)'}
        </button>
        <button type="button" className="btn btn-plain btn-sm" onClick={() => previewRef.current?.click()}>
          {preview ? `预览图: ${preview.name}` : '选择预览图'}
        </button>
      </div>
      <div className="asset-uploader-actions">
        <button type="button" className="btn btn-primary btn-sm" disabled={!asset || !preview} onClick={submit}>
          添加资源
        </button>
        <span className="hint">fbx ≤200MB · blend/zip ≤900MB · 预览图必配</span>
      </div>
      <input ref={assetRef} type="file" accept={ASSET_ACCEPT} hidden onChange={(e) => setAsset(e.target.files?.[0] ?? null)} />
      <input ref={previewRef} type="file" accept={PREVIEW_ACCEPT} hidden onChange={(e) => setPreview(e.target.files?.[0] ?? null)} />
    </div>
  );
}
