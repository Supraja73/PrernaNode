import { useInfiniteQuery } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';

// Wraps React Query's useInfiniteQuery for any paginated "data + pagination.hasMore" endpoint,
// and returns a sentinel ref to drop at the bottom of a list for IntersectionObserver-based
// infinite scroll (a lighter alternative to full list virtualization for feed-sized pages).
export const useInfiniteFeed = (queryKey, fetchPage, options = {}) => {
  const query = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam = 1 }) => fetchPage(pageParam),
    getNextPageParam: (lastPage, allPages) =>
      lastPage?.pagination?.hasMore || (lastPage?.pagination && lastPage.pagination.page < lastPage.pagination.pages)
        ? allPages.length + 1
        : undefined,
    initialPageParam: 1,
    ...options,
  });

  const sentinelRef = useRef(null);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && query.hasNextPage && !query.isFetchingNextPage) {
          query.fetchNextPage();
        }
      },
      { rootMargin: '400px' }
    );
    observer.observe(node);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query.hasNextPage, query.isFetchingNextPage, query.fetchNextPage]);

  const items = (query.data?.pages || []).flatMap((p) => p.data || []);

  return { ...query, items, sentinelRef };
};
