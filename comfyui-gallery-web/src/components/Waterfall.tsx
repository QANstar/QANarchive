import React, { useEffect, useRef } from 'react';

interface WaterfallProps {
  hasMore: boolean;
  loading: boolean;
  onLoadMore: () => void;
  children: React.ReactNode;
  empty?: React.ReactNode;
}

export default function Waterfall({ hasMore, loading, onLoadMore, children, empty }: WaterfallProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          onLoadMore();
        }
      },
      { rootMargin: '600px 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loading, onLoadMore]);

  return (
    <div>
      {React.Children.count(children) === 0 && !loading ? (
        empty ?? <div className="empty"><div className="empty-emoji">✦</div><p>这里还没有内容</p></div>
      ) : (
        <div className="waterfall stagger">{children}</div>
      )}
      <div ref={sentinelRef} className="sentinel" />
      {loading && <div className="loading-row"><div className="spinner" /></div>}
      {!hasMore && React.Children.count(children) > 0 && (
        <div className="loading-row">— 已加载全部内容 —</div>
      )}
    </div>
  );
}
