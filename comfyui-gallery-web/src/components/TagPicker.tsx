import { useState } from 'react';

interface TagPickerProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
}

export default function TagPicker({ value, onChange, placeholder = '输入标签后回车' }: TagPickerProps) {
  const [input, setInput] = useState('');

  const add = (raw: string) => {
    const tag = raw.trim();
    if (!tag) return;
    if (!value.some((t) => t.toLowerCase() === tag.toLowerCase())) {
      onChange([...value, tag]);
    }
    setInput('');
  };

  const remove = (tag: string) => onChange(value.filter((t) => t !== tag));

  return (
    <div className="tag-picker">
      {value.map((tag) => (
        <button
          key={tag}
          type="button"
          className="chip chip-pink"
          onClick={() => remove(tag)}
          title="点击移除"
        >
          {tag} ✕
        </button>
      ))}
      <input
        value={input}
        placeholder={placeholder}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            add(input);
          } else if (e.key === 'Backspace' && !input && value.length) {
            onChange(value.slice(0, -1));
          }
        }}
        onBlur={() => add(input)}
      />
    </div>
  );
}
