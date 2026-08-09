interface TagChipsProps {
  tags: string[];
  selected?: string[];
  onToggle?: (tag: string) => void;
  color?: 'blue' | 'pink' | 'lavender';
}

const COLOR_CLASS = { blue: 'chip-blue', pink: 'chip-pink', lavender: 'chip-lavender' };

export default function TagChips({ tags, selected = [], onToggle, color = 'pink' }: TagChipsProps) {
  if (!tags.length) return null;
  return (
    <div className="chips">
      {tags.slice(0, 8).map((tag) => {
        const isSel = selected.includes(tag);
        const cls = [isSel ? 'selected' : COLOR_CLASS[color], onToggle ? 'selectable' : '']
          .filter(Boolean).join(' ');
        return (
          <button
            key={tag}
            type="button"
            className={`chip ${cls}`}
            onClick={onToggle ? () => onToggle(tag) : undefined}
          >
            {tag}
          </button>
        );
      })}
    </div>
  );
}
