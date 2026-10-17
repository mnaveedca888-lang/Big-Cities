import { useEffect, useRef, useState } from 'react';

export function useInfiniteScroll<T>(items: T[], pageSize = 6) {
  const [visibleCount, setVisibleCount] = useState(pageSize);
  const loaderRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (visibleCount >= items.length) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) {
        setVisibleCount((current) => Math.min(current + pageSize, items.length));
      }
    });

    const node = loaderRef.current;
    if (node) observer.observe(node);

    return () => observer.disconnect();
  }, [items.length, pageSize, visibleCount]);

  return { loaderRef, visibleItems: items.slice(0, visibleCount) };
}
