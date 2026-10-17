export function buildPagination(page?: number | null, perPage?: number | null, total = 0, maxPerPage = 100) {
  const safePage = Math.max(1, Number(page || 1));
  const safePerPage = Math.min(maxPerPage, Math.max(1, Number(perPage || 20)));
  const totalPages = Math.max(1, Math.ceil(total / safePerPage));

  return {
    page: safePage,
    perPage: safePerPage,
    total,
    totalPages,
  };
}
