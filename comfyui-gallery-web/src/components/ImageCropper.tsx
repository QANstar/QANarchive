import { useEffect, useRef, useState } from 'react';

interface ImageCropperProps {
  /** 图片源(一般为 object URL 或远程地址) */
  src: string;
  /** 裁剪框宽高比 = width / height,例如 3/4 表示竖版 */
  aspectRatio?: number;
  /** 裁剪弹窗标题 */
  title?: string;
  onCancel: () => void;
  /** 裁剪完成后把裁剪区域导出为图片 */
  onConfirm: (blob: Blob) => void;
}

const MIN_W = 48; // 裁剪框最小宽度(显示像素)
const MAX_BOX = 520; // 图片最大显示尺寸

export default function ImageCropper({ src, aspectRatio = 3 / 4, title = '裁剪预览图', onCancel, onConfirm }: ImageCropperProps) {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [view, setView] = useState<{ w: number; h: number }>({ w: 0, h: 0 });
  const [crop, setCrop] = useState({ x: 0, y: 0, w: 0 });
  const [drag, setDrag] = useState<'move' | 'resize' | null>(null);

  const boxRef = useRef<HTMLDivElement>(null);
  const startRef = useRef({ x: 0, y: 0, cropX: 0, cropY: 0, cropW: 0 });

  const cropH = crop.w / aspectRatio;

  useEffect(() => {
    const image = new Image();
    image.onload = () => {
      const nw = image.naturalWidth;
      const nh = image.naturalHeight;
      const scale = Math.min(MAX_BOX / nw, MAX_BOX / nh, 1);
      const dw = Math.max(1, Math.round(nw * scale));
      const dh = Math.max(1, Math.round(nh * scale));
      setImg(image);
      setView({ w: dw, h: dh });
      // 初始:居中、尽可能大的裁剪框
      let cw = dw;
      let ch = cw / aspectRatio;
      if (ch > dh) { ch = dh; cw = ch * aspectRatio; }
      setCrop({ x: (dw - cw) / 2, y: (dh - ch) / 2, w: cw });
    };
    image.onerror = () => onCancel();
    image.src = src;
  }, [src, aspectRatio]);

  const clampX = (x: number) => Math.min(Math.max(0, x), view.w - crop.w);
  const clampY = (y: number) => Math.min(Math.max(0, y), view.h - cropH);

  const startDrag = (e: React.PointerEvent, mode: 'move' | 'resize') => {
    e.preventDefault();
    e.stopPropagation();
    boxRef.current?.setPointerCapture(e.pointerId);
    setDrag(mode);
    startRef.current = { x: e.clientX, y: e.clientY, cropX: crop.x, cropY: crop.y, cropW: crop.w };
  };

  const onMove = (e: React.PointerEvent) => {
    if (!drag || !view.w) return;
    const dx = e.clientX - startRef.current.x;
    const dy = e.clientY - startRef.current.y;
    if (drag === 'move') {
      setCrop((c) => ({ ...c, x: clampX(startRef.current.cropX + dx), y: clampY(startRef.current.cropY + dy) }));
    } else {
      // 从右下角缩放:左上角固定,宽高比锁定
      const maxWByY = (view.h - startRef.current.cropY) * aspectRatio;
      const maxWByX = view.w - startRef.current.cropX;
      const maxW = Math.min(maxWByY, maxWByX);
      const nextW = Math.max(MIN_W, Math.min(startRef.current.cropW + dx, maxW));
      setCrop({ x: startRef.current.cropX, y: startRef.current.cropY, w: nextW });
    }
  };

  const endDrag = (e: React.PointerEvent) => {
    setDrag(null);
    try { boxRef.current?.releasePointerCapture(e.pointerId); } catch { /* noop */ }
  };

  const confirm = () => {
    if (!img || !view.w) return;
    const scale = view.w / img.naturalWidth;
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(crop.w / scale));
    canvas.height = Math.max(1, Math.round(cropH / scale));
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(
      img,
      crop.x / scale, crop.y / scale, crop.w / scale, cropH / scale,
      0, 0, canvas.width, canvas.height,
    );
    canvas.toBlob((blob) => { if (blob) onConfirm(blob); }, 'image/jpeg', 0.92);
  };

  return (
    <div className="crop-overlay">
      <div className="crop-card">
        <div className="crop-head">{title}</div>
        <div className="crop-body">
          {!img ? (
            <div className="loading-row"><div className="spinner" /></div>
          ) : (
            <div ref={boxRef} className="crop-box" style={{ width: view.w, height: view.h }} onPointerMove={onMove} onPointerUp={endDrag} onPointerCancel={endDrag}>
              <img src={src} alt="" style={{ width: view.w, height: view.h }} />
              <div
                className="crop-selection"
                style={{
                  left: crop.x, top: crop.y, width: crop.w, height: cropH,
                }}
                onPointerDown={(e) => startDrag(e, 'move')}
              >
                <span className="crop-grid" />
                <span className="crop-handle" onPointerDown={(e) => startDrag(e, 'resize')} />
              </div>
            </div>
          )}
        </div>
        <div className="crop-foot">
          <div className="hint">拖动选择预览区域 · 拖动右下角调整大小</div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" className="btn btn-ghost" onClick={onCancel}>取消</button>
            <button type="button" className="btn btn-primary" onClick={confirm} disabled={!img}>确认裁剪</button>
          </div>
        </div>
      </div>
    </div>
  );
}
