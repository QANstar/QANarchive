import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import type { PagedResponse, HotTag, Tab } from '../api/types';
import { WorkCard, CharacterCard, PartCard } from '../components/Cards';
import Waterfall from '../components/Waterfall';
import TagChips from '../components/TagChips';
import { useAuth } from '../auth/AuthContext';

const TABS: { key: Tab; label: string; create: string }[] = [
  { key: 'works', label: '作品', create: '/work/new' },
  { key: 'characters', label: '角色', create: '/character/new' },
  { key: 'parts', label: '部件', create: '/part/new' },
];

interface AnyItem { id: string; [key: string]: unknown }

export default function Home() {
  const [params, setParams] = useSearchParams();
  const tab = (params.get('tab') as Tab) || 'works';
  const search = params.get('q') ?? '';
  const selectedTags = (params.get('tags') ?? '').split(',').filter(Boolean);

  const [hotTags, setHotTags] = useState<HotTag[]>([]);
  const [items, setItems] = useState<AnyItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [category, setCategory] = useState('');
  const { user } = useAuth();
  const requestIdRef = useRef(0);

  // 热门标签
  useEffect(() => {
    api.get<HotTag[]>('/tags/hot').then((res) => setHotTags(res.data)).catch(() => {});
  }, [tab]);

  // 查询参数变化 → 重置并加载第一页
  useEffect(() => {
    setItems([]);
    setCategory('');
    setPage(1);
    const rid = ++requestIdRef.current;
    setLoading(true);
    api
      .get<PagedResponse<AnyItem>>('/gallery', {
        params: {
          tab,
          search: search || undefined,
          tags: selectedTags.length ? selectedTags.join(',') : undefined,
          page: 1,
          pageSize: 20,
        },
      })
      .then((res) => {
        if (requestIdRef.current !== rid) return;
        setItems(res.data.items);
        setHasMore(res.data.hasMore);
        if (tab === 'parts') {
          const cats = new Set<string>();
          res.data.items.forEach((i) => {
            const c = i.category as string;
            if (c) cats.add(c);
          });
          setCategories(Array.from(cats));
        }
      })
      .catch(() => {})
      .finally(() => {
        if (requestIdRef.current === rid) setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  const loadMore = useCallback(() => {
    const next = page + 1;
    setPage(next);
    setLoading(true);
    api
      .get<PagedResponse<AnyItem>>('/gallery', {
        params: {
          tab,
          search: search || undefined,
          tags: selectedTags.length ? selectedTags.join(',') : undefined,
          category: category || undefined,
          page: next,
          pageSize: 20,
        },
      })
      .then((res) => {
        setItems((prev) => [...prev, ...res.data.items]);
        setHasMore(res.data.hasMore);
        if (tab === 'parts') {
          setCategories((prev) => {
            const cats = new Set(prev);
            res.data.items.forEach((i) => {
              const c = i.category as string;
              if (c) cats.add(c);
            });
            return Array.from(cats);
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, tab, search, selectedTags, category]);

  const syncUrl = (t: Tab, tags: string[], s: string) => {
    const p = new URLSearchParams();
    if (t !== 'works') p.set('tab', t);
    if (s) p.set('q', s);
    if (tags.length) p.set('tags', tags.join(','));
    setParams(p, { replace: true });
  };

  const changeTab = (t: Tab) => syncUrl(t, selectedTags, search);

  const toggleTag = (tag: string) => {
    const next = selectedTags.includes(tag)
      ? selectedTags.filter((x) => x !== tag)
      : [...selectedTags, tag];
    syncUrl(tab, next, search);
  };

  const changeCategory = (c: string) => {
    const next = category === c ? '' : c;
    setCategory(next);
    setPage(1);
    setItems([]);
    setLoading(true);
    api
      .get<PagedResponse<AnyItem>>('/gallery', {
        params: {
          tab,
          search: search || undefined,
          tags: selectedTags.length ? selectedTags.join(',') : undefined,
          category: next || undefined,
          page: 1,
          pageSize: 20,
        },
      })
      .then((res) => {
        setItems(res.data.items);
        setHasMore(res.data.hasMore);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const clearSearch = () => {
    const p = new URLSearchParams(params);
    p.delete('q');
    setParams(p, { replace: true });
  };

  const currentTab = TABS.find((t) => t.key === tab)!;

  return (
    <div className="container fade-in">
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', marginBottom: 18 }}>
        <div className="tabs">
          {TABS.map((t) => (
            <button key={t.key} className={`tab ${tab === t.key ? 'active' : ''}`} onClick={() => changeTab(t.key)}>
              {t.label}
            </button>
          ))}
        </div>
        {user && (
          <Link to={currentTab.create} className="btn btn-primary btn-sm">
            ＋ 新建{currentTab.label}
          </Link>
        )}
      </div>

      {search && (
        <div style={{ marginBottom: 14, fontSize: 14, color: 'var(--ink-soft)' }}>
          搜索 “<b style={{ color: 'var(--blue-deep)' }}>{search}</b>” 的结果:
          <button className="btn btn-ghost btn-sm" style={{ marginLeft: 10 }} onClick={clearSearch}>
            清除
          </button>
        </div>
      )}

      {hotTags.length > 0 && (
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontSize: 12.5, color: 'var(--ink-faint)', fontWeight: 700, letterSpacing: 1, marginBottom: 10 }}>
            🔥 热门标签
          </div>
          <TagChips tags={hotTags.map((t) => t.name)} selected={selectedTags} onToggle={toggleTag} color="pink" />
        </div>
      )}

      {tab === 'parts' && categories.length > 0 && (
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontSize: 12.5, color: 'var(--ink-faint)', fontWeight: 700, letterSpacing: 1, marginBottom: 10 }}>
            🗂️ 分类
          </div>
          <div className="chips">
            {categories.map((c) => (
              <button
                key={c}
                type="button"
                className={`chip ${category === c ? 'selected' : 'chip-lavender'} selectable`}
                onClick={() => changeCategory(c)}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      )}

      <Waterfall hasMore={hasMore} loading={loading} onLoadMore={loadMore}>
        {items.map((item) => {
          if (tab === 'works') return <WorkCard key={item.id} work={item as never} />;
          if (tab === 'characters') return <CharacterCard key={item.id} character={item as never} />;
          return <PartCard key={item.id} part={item as never} />;
        })}
      </Waterfall>
    </div>
  );
}
