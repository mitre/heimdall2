import {ref, computed, watch, type Ref} from 'vue';

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  };
}

export interface UseServerPaginationConfig {
  defaultPerPage?: number;
  defaultSort?: string;
  defaultOrder?: 'asc' | 'desc';
  debounceMs?: number;
}

export interface UseServerPaginationReturn<T> {
  page: Ref<number>;
  perPage: Ref<number>;
  sort: Ref<string>;
  order: Ref<'asc' | 'desc'>;
  search: Ref<string>;
  loading: Ref<boolean>;
  items: Ref<T[]>;
  total: Ref<number>;
  totalPages: Ref<number>;
  error: Ref<string | null>;
  fetch: () => Promise<void>;
}

type FetchFn<T> = (params: {
  page: number;
  perPage: number;
  sort: string;
  order: 'asc' | 'desc';
  q: string | undefined;
}) => Promise<PaginatedResponse<T>>;

export function useServerPagination<T = unknown>(
  fetchFn: FetchFn<T>,
  config?: UseServerPaginationConfig,
): UseServerPaginationReturn<T> {
  const page = ref(1) as Ref<number>;
  const perPage = ref(config?.defaultPerPage ?? 25) as Ref<number>;
  const sort = ref(config?.defaultSort ?? 'createdAt') as Ref<string>;
  const order = ref<'asc' | 'desc'>(config?.defaultOrder ?? 'desc') as Ref<'asc' | 'desc'>;
  const search = ref('') as Ref<string>;
  const loading = ref(false) as Ref<boolean>;
  const items = ref<T[]>([]) as Ref<T[]>;
  const total = ref(0) as Ref<number>;
  const error = ref<string | null>(null) as Ref<string | null>;

  const totalPages = computed(() => {
    const meta = Math.ceil(total.value / perPage.value);
    return meta || 1;
  });

  async function fetch() {
    loading.value = true;
    error.value = null;
    try {
      const result = await fetchFn({
        page: page.value,
        perPage: perPage.value,
        sort: sort.value,
        order: order.value,
        q: search.value || undefined,
      });
      items.value = result.data;
      total.value = result.meta.total;
    } catch (e) {
      error.value = e instanceof Error ? e.message : String(e);
    } finally {
      loading.value = false;
    }
  }

  let suppressPageWatch = false;

  watch([page, perPage, sort, order], () => {
    if (suppressPageWatch) {
      suppressPageWatch = false;
      return;
    }
    fetch();
  });

  let searchTimer: ReturnType<typeof setTimeout> | null = null;
  const debounceMs = config?.debounceMs ?? 300;

  watch(search, () => {
    if (searchTimer) clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      if (page.value !== 1) {
        suppressPageWatch = true;
        page.value = 1;
      }
      fetch();
    }, debounceMs);
  });

  return {
    page,
    perPage,
    sort,
    order,
    search,
    loading,
    items,
    total,
    totalPages,
    error,
    fetch,
  };
}
