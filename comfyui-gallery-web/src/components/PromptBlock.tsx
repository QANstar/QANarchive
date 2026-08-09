import { useState } from 'react';

const CopyIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="m20 6-11 11-5-5" />
  </svg>
);

export function CopyButton({ text, label = '复制' }: { text: string; label?: string }) {
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
    <span className="icon-btn-wrap" data-tooltip={copied ? '已复制' : label}>
      <button
        type="button"
        className={`icon-btn ${copied ? 'copied' : ''}`}
        onClick={copy}
        aria-label={label}
      >
        {copied ? <CheckIcon /> : <CopyIcon />}
      </button>
    </span>
  );
}

export function PromptBlock({ text, label = '复制 prompt' }: { text: string; label?: string }) {
  return (
    <div className="prompt-block">
      <div className="prompt-block-top">
        <CopyButton text={text} label={label} />
      </div>
      <div className="prompt-block-text">{text}</div>
    </div>
  );
}
