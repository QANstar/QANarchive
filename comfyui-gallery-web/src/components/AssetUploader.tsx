import { useRef, useState } from 'react';

interface AssetUploaderProps {
  onFiles: (asset: File) => void;
}

const ASSET_ACCEPT = '.fbx,.blend,.zip';

export default function AssetUploader({ onFiles }: AssetUploaderProps) {
  const assetRef = useRef<HTMLInputElement>(null);
  const [asset, setAsset] = useState<File | null>(null);

  const reset = () => {
    setAsset(null);
    if (assetRef.current) assetRef.current.value = '';
  };

  const submit = () => {
    if (!asset) return;
    onFiles(asset);
    reset();
  };

  return (
    <div className="asset-uploader">
      <div className="asset-uploader-row">
        <button type="button" className="btn btn-plain btn-sm" onClick={() => assetRef.current?.click()}>
          {asset ? `已选: ${asset.name}` : '选择 3D 文件 (.fbx/.blend/.zip)'}
        </button>
      </div>
      <div className="asset-uploader-actions">
        <button type="button" className="btn btn-primary btn-sm" disabled={!asset} onClick={submit}>
          添加资源
        </button>
        <span className="hint">fbx ≤200MB · blend/zip ≤900MB · 封面使用作品自身的图片/视频裁剪</span>
      </div>
      <input ref={assetRef} type="file" accept={ASSET_ACCEPT} hidden onChange={(e) => setAsset(e.target.files?.[0] ?? null)} />
    </div>
  );
}
