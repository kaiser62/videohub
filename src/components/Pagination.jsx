import { IconChevronLeft, IconChevronRight } from './Icons';

export default function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  const pages = [];
  const maxVisible = 7;

  if (totalPages <= maxVisible) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    let start = Math.max(2, page - 2);
    let end = Math.min(totalPages - 1, page + 2);
    if (start > 2) pages.push('...');
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < totalPages - 1) pages.push('...');
    pages.push(totalPages);
  }

  return (
    <nav className="pagination-wrap" aria-label="Pagination Navigation">
      <div className="pagination">
        <button
          className="page-btn page-arrow"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label="Previous page"
        >
          <IconChevronLeft size={16} />
          <span>Prev</span>
        </button>

        <div className="page-numbers">
          {pages.map((p, i) =>
            p === '...' ? (
              <span key={`ellipsis-${i}`} className="page-ellipsis">…</span>
            ) : (
              <button
                key={p}
                className={`page-btn page-num tnum ${p === page ? 'page-active' : ''}`}
                onClick={() => onPageChange(p)}
                aria-current={p === page ? 'page' : undefined}
              >
                {p}
              </button>
            )
          )}
        </div>

        <button
          className="page-btn page-arrow"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          aria-label="Next page"
        >
          <span>Next</span>
          <IconChevronRight size={16} />
        </button>
      </div>

      <div className="page-status tnum">
        Page {page} of {totalPages}
      </div>
    </nav>
  );
}
