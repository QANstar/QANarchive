import { useState } from 'react';

export function CopyButton({
  text,
  label = '复制',
  inline = true,
}: {
  text: string;
  label?: string;
  inline?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <button type="button" className={inline ? 'btn btn-plain btn-sm' : 'copy-btn'} onClick={copy}>
      {copied ? '✓ 已复制' : label}
    </button>
  );
}

export function PromptBlock({ text, label = '复制 prompt' }: { text: string; label?: string }) {
  return (
    <div className="prompt-block">
      <div className="prompt-block-top">
        <CopyButton inline text={text} label={label} />
      </div>
      <div className="prompt-block-text">{text}</div>
    </div>
  );
}
