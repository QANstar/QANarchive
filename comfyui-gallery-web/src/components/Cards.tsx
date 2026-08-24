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
          <div className="card-placeholder">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
              <rect x="3" y="4" width="18" height="16" rx="2.5" />
              <circle cx="8.5" cy="9.5" r="1.5" />
              <path d="m21 15-4.5-4.5L7 20" />
            </svg>
          </div>
        )}
        {(work.has3d || work.hasVideo) && (
          <div className="card-badges">
            {work.has3d && <span className="card-3d-badge">3D</span>}
            {work.hasVideo && <span className="card-video-badge">视频</span>}
          </div>
        )}
      </div>
      <div className="card-body">
        <div className="card-title">{work.title}</div>
        <TagChips tags={work.tags} color="blue" />
        <div className="card-meta">
          <span className="card-sub">{work.author.name}</span>
          <span className="card-sub">{work.mediaCount} 项媒体</span>
        </div>
      </div>
    </Link>
  );
}

export function CharacterCard({ character }: { character: CharacterListItem }) {
  return (
    <Link to={`/character/${character.id}`} className="card fade-in">
      <div className="card-thumb">
        {character.previewUrl ? (
          <img src={character.previewUrl} alt={character.name} loading="lazy" />
        ) : (
          <div className="card-placeholder">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20c1.5-3.5 4.5-5 8-5s6.5 1.5 8 5" />
            </svg>
          </div>
        )}
      </div>
      <div className="card-body">
        <div className="card-title">{character.name}</div>
        <TagChips tags={character.tags} color="lavender" />
        <div className="card-meta">
          <span className="card-sub">{character.workCount} 个作品</span>
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
          <div className="card-placeholder">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3 4 8v8l8 5 8-5V8z" />
              <path d="M12 3v8" />
              <path d="m4 8 8 3 8-3" />
            </svg>
          </div>
        )}
      </div>
      <div className="card-body">
        <span className="card-category">{part.category}</span>
        <div className="card-title">{part.name}</div>
        <TagChips tags={part.tags} color="pink" />
        <div className="card-meta">
          <span className="card-sub">被 {part.usedByCount} 个作品引用</span>
        </div>
      </div>
    </Link>
  );
}
