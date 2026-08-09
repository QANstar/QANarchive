import { useRef, useState } from 'react';

interface UploaderProps {
  accept: string;
  multiple?: boolean;
  hint?: string;
  onFiles: (files: File[]) => void;
}

export default function Uploader({ accept, multiple = true, hint, onFiles }: UploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);

  const pick = (files: FileList | null) => {
    if (!files?.length) return;
    onFiles(Array.from(files));
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div
      className={`uploader ${drag ? 'drag' : ''}`}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => { e.preventDefault(); setDrag(false); pick(e.dataTransfer.files); }}
    >
      <div className="upload-icon">⬆️</div>
      <div>点击选择或拖拽文件到此处</div>
      {hint && <div className="hint">{hint}</div>}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        hidden
        onChange={(e) => pick(e.target.files)}
      />
    </div>
  );
}
