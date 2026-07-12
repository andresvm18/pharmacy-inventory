import { useState, useMemo, useEffect } from 'react';

export function usePagination(items, pageSize = 10) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const clampedPage = Math.min(page, totalPages);

  // Reset to page 1 whenever the underlying list changes size (new filter/search)
  useEffect(() => {
    setPage(1);
  }, [items.length]);

  const paginated = useMemo(() => {
    const start = (clampedPage - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, clampedPage, pageSize]);

  return { page: clampedPage, setPage, totalPages, paginated };
}