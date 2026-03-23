type PaginationProps = {
  page: number
  totalPages: number
  totalItems: number
  onPageChange: (page: number) => void
}

export function Pagination({ page, totalPages, totalItems, onPageChange }: PaginationProps) {
  if (totalItems === 0) return null

  return (
    <div className="pagination-bar" role="navigation" aria-label="Paginacao">
      <button type="button" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
        Anterior
      </button>
      <span>
        Pagina {page} de {totalPages}
      </span>
      <button
        type="button"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        Proxima
      </button>
    </div>
  )
}
