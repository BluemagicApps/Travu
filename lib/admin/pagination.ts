/** Shared pagination parsing + result shape for admin list endpoints. */
export interface PageParams {
  page: number;
  pageSize: number;
  skip: number;
  take: number;
}

export function parsePage(get: (k: string) => string | null | undefined): PageParams {
  const page = Math.max(1, Number(get("page")) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(get("pageSize")) || 20));
  return { page, pageSize, skip: (page - 1) * pageSize, take: pageSize };
}

export interface Paginated<T> {
  rows: T[];
  total: number;
  page: number;
  pageSize: number;
  pages: number;
}

export function paginated<T>(rows: T[], total: number, p: PageParams): Paginated<T> {
  return { rows, total, page: p.page, pageSize: p.pageSize, pages: Math.max(1, Math.ceil(total / p.pageSize)) };
}
