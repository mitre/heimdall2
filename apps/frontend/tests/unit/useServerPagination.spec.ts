import {describe, expect, it, vi, beforeEach} from 'vitest';
import {nextTick, ref} from 'vue';
import {useServerPagination} from '@/composables/useServerPagination';

function createMockFetch(responseData: unknown[] = [], total = 0) {
  return vi.fn().mockResolvedValue({
    data: responseData,
    meta: {total, page: 1, perPage: 25, totalPages: Math.ceil(total / 25) || 1},
  });
}

describe('useServerPagination', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('exposes all required reactive refs', () => {
    const fetchFn = createMockFetch();
    const result = useServerPagination(fetchFn);

    expect(result.page).toBeDefined();
    expect(result.perPage).toBeDefined();
    expect(result.sort).toBeDefined();
    expect(result.order).toBeDefined();
    expect(result.search).toBeDefined();
    expect(result.loading).toBeDefined();
    expect(result.items).toBeDefined();
    expect(result.total).toBeDefined();
    expect(result.totalPages).toBeDefined();
    expect(result.error).toBeDefined();
    expect(typeof result.fetch).toBe('function');
  });

  it('applies default config values', () => {
    const fetchFn = createMockFetch();
    const {page, perPage, sort, order} = useServerPagination(fetchFn);

    expect(page.value).toBe(1);
    expect(perPage.value).toBe(25);
    expect(sort.value).toBe('createdAt');
    expect(order.value).toBe('desc');
  });

  it('accepts custom config overrides', () => {
    const fetchFn = createMockFetch();
    const {page, perPage, sort, order} = useServerPagination(fetchFn, {
      defaultPerPage: 50,
      defaultSort: 'filename',
      defaultOrder: 'asc',
    });

    expect(perPage.value).toBe(50);
    expect(sort.value).toBe('filename');
    expect(order.value).toBe('asc');
  });

  it('fetch calls fetchFn with correct params and populates items', async () => {
    const mockItems = [{id: 1, filename: 'a.json'}, {id: 2, filename: 'b.json'}];
    const fetchFn = vi.fn().mockResolvedValue({
      data: mockItems,
      meta: {total: 10, page: 1, perPage: 25, totalPages: 1},
    });

    const {fetch, items, total} = useServerPagination(fetchFn);
    await fetch();

    expect(fetchFn).toHaveBeenCalledWith({
      page: 1, perPage: 25, sort: 'createdAt', order: 'desc', q: undefined,
    });
    expect(items.value).toEqual(mockItems);
    expect(total.value).toBe(10);
  });

  it('sets loading true during fetch and false after', async () => {
    let resolvePromise: (v: unknown) => void;
    const fetchFn = vi.fn().mockReturnValue(
      new Promise((resolve) => { resolvePromise = resolve; }),
    );

    const {fetch, loading} = useServerPagination(fetchFn);
    expect(loading.value).toBe(false);

    const fetchPromise = fetch();
    expect(loading.value).toBe(true);

    resolvePromise!({data: [], meta: {total: 0, page: 1, perPage: 25, totalPages: 1}});
    await fetchPromise;
    expect(loading.value).toBe(false);
  });

  it('sets loading false even on error', async () => {
    const fetchFn = vi.fn().mockRejectedValue(new Error('Network error'));
    const {fetch, loading, error} = useServerPagination(fetchFn);

    await fetch();

    expect(loading.value).toBe(false);
    expect(error.value).toBe('Network error');
  });

  it('totalPages is computed from total and perPage', async () => {
    const fetchFn = vi.fn().mockResolvedValue({
      data: [],
      meta: {total: 73, page: 1, perPage: 25, totalPages: 3},
    });
    const {fetch, totalPages} = useServerPagination(fetchFn);
    await fetch();
    expect(totalPages.value).toBe(3);
  });

  it('auto-fetches when page changes', async () => {
    const fetchFn = createMockFetch([], 50);
    const {page, fetch} = useServerPagination(fetchFn);
    await fetch();
    expect(fetchFn).toHaveBeenCalledTimes(1);

    page.value = 2;
    await nextTick();
    await vi.runAllTimersAsync();
    await nextTick();

    expect(fetchFn).toHaveBeenCalledTimes(2);
    expect(fetchFn).toHaveBeenLastCalledWith(
      expect.objectContaining({page: 2}),
    );
  });

  it('auto-fetches when perPage changes', async () => {
    const fetchFn = createMockFetch([], 50);
    const {perPage, fetch} = useServerPagination(fetchFn);
    await fetch();

    perPage.value = 50;
    await nextTick();
    await vi.runAllTimersAsync();
    await nextTick();

    expect(fetchFn).toHaveBeenCalledTimes(2);
    expect(fetchFn).toHaveBeenLastCalledWith(
      expect.objectContaining({perPage: 50}),
    );
  });

  it('auto-fetches when sort changes', async () => {
    const fetchFn = createMockFetch([], 50);
    const {sort, fetch} = useServerPagination(fetchFn);
    await fetch();

    sort.value = 'filename';
    await nextTick();
    await vi.runAllTimersAsync();
    await nextTick();

    expect(fetchFn).toHaveBeenCalledTimes(2);
    expect(fetchFn).toHaveBeenLastCalledWith(
      expect.objectContaining({sort: 'filename'}),
    );
  });

  it('debounces search and resets page to 1', async () => {
    const fetchFn = createMockFetch([], 50);
    const {search, page, fetch} = useServerPagination(fetchFn);
    await fetch();

    page.value = 3;
    await nextTick();
    await vi.runAllTimersAsync();
    await nextTick();
    const callsBeforeSearch = fetchFn.mock.calls.length;

    search.value = 'rhel';
    await nextTick();

    expect(fetchFn).toHaveBeenCalledTimes(callsBeforeSearch);

    await vi.advanceTimersByTimeAsync(300);
    await nextTick();

    expect(page.value).toBe(1);
    expect(fetchFn).toHaveBeenCalledTimes(callsBeforeSearch + 1);
    expect(fetchFn).toHaveBeenLastCalledWith(
      expect.objectContaining({q: 'rhel', page: 1}),
    );
  });

  it('does not fetch with search term before debounce period', async () => {
    const fetchFn = createMockFetch([], 50);
    const {search} = useServerPagination(fetchFn);

    search.value = 'test';
    await nextTick();
    await vi.advanceTimersByTimeAsync(200);
    await nextTick();

    const callsWithSearch = fetchFn.mock.calls.filter(
      (call) => (call[0] as {q?: string})?.q === 'test',
    );
    expect(callsWithSearch).toHaveLength(0);

    await vi.advanceTimersByTimeAsync(100);
    await nextTick();

    const callsAfterDebounce = fetchFn.mock.calls.filter(
      (call) => (call[0] as {q?: string})?.q === 'test',
    );
    expect(callsAfterDebounce).toHaveLength(1);
  });

  it('clears error on successful fetch after previous error', async () => {
    const fetchFn = vi.fn()
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValueOnce({data: [{id: 1}], meta: {total: 1, page: 1, perPage: 25, totalPages: 1}});

    const {fetch, error, items} = useServerPagination(fetchFn);

    await fetch();
    expect(error.value).toBe('fail');

    await fetch();
    expect(error.value).toBeNull();
    expect(items.value).toHaveLength(1);
  });
});
