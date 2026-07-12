import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ page, totalPages, onPageChange, totalItems, pageSize }) {
  if (totalPages <= 1) return null;

  const startItem = (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, totalItems);

  return (
    <nav
      className="flex items-center justify-between px-4 py-3 border-t border-stone-200"
      aria-label="Pagination"
    >
      <p className="text-xs text-stone-500 data-num">
        Showing {startItem}–{endItem} of {totalItems}
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="p-1.5 rounded-md text-stone-500 hover:bg-stone-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
          aria-label="Previous page"
        >
          <ChevronLeft className="w-4 h-4" strokeWidth={2} />
        </button>
        <span className="text-xs text-stone-600 px-2 data-num">
          {page} / {totalPages}
        </span>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          className="p-1.5 rounded-md text-stone-500 hover:bg-stone-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
          aria-label="Next page"
        >
          <ChevronRight className="w-4 h-4" strokeWidth={2} />
        </button>
      </div>
    </nav>
  );
}