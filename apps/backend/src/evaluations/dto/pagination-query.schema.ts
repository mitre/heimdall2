import {z} from 'zod';

const VALID_SORT_COLUMNS = ['filename', 'createdAt', 'updatedAt'] as const;
const VALID_ORDER = ['asc', 'desc'] as const;
const MAX_PER_PAGE = 100;

function parseLegacySearchFields(fields: unknown): string | undefined {
  if (!Array.isArray(fields)) return undefined;
  const nonEmpty = fields
    .filter((f): f is string => typeof f === 'string' && f !== '()')
    .map((f) => f.replace(/[()]/g, '').replace(/\|/g, ' ').trim())
    .filter((f) => f.length > 0);
  return nonEmpty.length > 0 ? nonEmpty.join(' ') : undefined;
}

function parseLegacyOrder(order: unknown): {sort?: string; order?: 'asc' | 'desc'} {
  if (!Array.isArray(order)) return {};
  const arr = order.filter((v): v is string => typeof v === 'string');
  if (arr.length < 2) return {};
  const direction = arr[arr.length - 1].toLowerCase() === 'asc' ? 'asc' as const : 'desc' as const;
  const field = arr.length === 3 ? arr[1] : arr[0];
  return {sort: field, order: direction};
}

export const paginationQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).optional(),
    per_page: z.coerce.number().int().min(1).optional(),
    sort: z.enum(VALID_SORT_COLUMNS).optional(),
    order: z.union([z.enum(VALID_ORDER), z.array(z.string())]).optional(),
    q: z.string().optional(),
    offset: z.coerce.number().int().min(0).optional(),
    limit: z.coerce.number().int().min(1).optional(),
    searchFields: z.union([z.array(z.string()), z.string()]).optional(),
    useClause: z.string().optional(),
    operator: z.string().optional(),
  })
  .transform((input) => {
    const legacyOrder = Array.isArray(input.order) ? parseLegacyOrder(input.order) : undefined;
    const legacySearch = input.searchFields ? parseLegacySearchFields(input.searchFields) : undefined;

    const perPage = input.per_page ?? input.limit ?? 25;
    const clampedPerPage = Math.min(perPage, MAX_PER_PAGE);

    let page = input.page;
    if (!page && input.offset !== undefined && input.limit) {
      page = Math.floor(input.offset / input.limit) + 1;
    }

    const orderStr = typeof input.order === 'string' ? input.order as 'asc' | 'desc' : undefined;

    return {
      page: page ?? 1,
      perPage: clampedPerPage,
      sort: input.sort ?? legacyOrder?.sort ?? 'createdAt',
      order: orderStr ?? legacyOrder?.order ?? 'desc' as const,
      q: input.q ?? legacySearch,
    };
  });

export type PaginationQuery = z.output<typeof paginationQuerySchema>;
