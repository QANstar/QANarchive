import { Link } from 'react-router-dom';
import type { WorkListItem, CharacterListItem, PartListItem } from '../api/types';
import TagChips from './TagChips';

export function WorkCard({ work }: { work: WorkListItem }) {
  return (
    <Link to={`/work/${work.id}`} className="card fade-in">
      <div className="card-thumb">
        {work.coverUrl ? (
          <img src={work.coverUrl} alt={work.title} loading="lazy" />
        ) : (
          <div className="card-placeholder">🖼️</div>
        )}
        {work.hasVideo && <span className="card-video-badge">▶ 视频</span>}
      </div>
      <div className="card-body">
        <div className="card-title">{work.title}</div>
        <TagChips tags={work.tags} color="blue" />
        <div className="card-meta">
          <span className="card-sub">👤 {work.author.name}</span>
          <span className="card-sub">{work.mediaCount} 个媒体</span>
        </div>
      </div>
    </Link>
  );
}

export function CharacterCard({ character }: { character: CharacterListItem }) {
  return (
    <Link to={`/character/${character.id}`} className="card fade-in">
      <div className="card-thumb wide">
        {character.previewUrl ? (
          <img src={character.previewUrl} alt={character.name} loading="lazy" />
        ) : (
          <div className="card-placeholder">👤</div>
        )}
      </div>
      <div className="card-body">
        <div className="card-title">{character.name}</div>
        <TagChips tags={character.tags} color="lavender" />
        <div className="card-meta">
          <span className="card-sub">📁 {character.workCount} 个作品</span>
        </div>
      </div>
    </Link>
  );
}

export function PartCard({ part }: { part: PartListItem }) {
  return (
    <Link to={`/part/${part.id}`} className="card fade-in">
      <div className="card-thumb">
        {part.previewUrl ? (
          <img src={part.previewUrl} alt={part.name} loading="lazy" />
        ) : (
          <div className="card-placeholder">🧩</div>
        )}
      </div>
      <div className="card-body">
        <span className="card-category">{part.category}</span>
        <div className="card-title">{part.name}</div>
        <TagChips tags={part.tags} color="pink" />
        <div className="card-meta">
          <span className="card-sub">🔗 被 {part.usedByCount} 个作品使用</span>
        </div>
      </div>
    </Link>
  );
}
