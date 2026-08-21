import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SplunkMapper } from '../../../src/splunk-mapper';
import type { SplunkConfig } from '../../../types/splunk-config-types';

const mockConfig: SplunkConfig = {
  host: 'localhost',
  index: 'main',
  password: 'changeme',
  port: 8089,
  scheme: 'https',
  username: 'admin',
};

function makeJobResponse(
  dispatchState: string,
  isDone: boolean,
): { data: { entry: { content: { dispatchState: string; isDone: boolean } }[] } } {
  return { data: { entry: [{ content: { dispatchState, isDone } }] } };
}

describe('SplunkMapper.trackJob', () => {
  let mapper: SplunkMapper;
  let mockGet: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mapper = new SplunkMapper(mockConfig);
    mockGet = vi.spyOn(mapper.axiosInstance, 'get').mockImplementation(vi.fn());
    vi.spyOn(mapper as any, 'delay').mockResolvedValue(undefined);
  });

  it('resolves when dispatchState is DONE and isDone is true', async () => {
    mockGet.mockResolvedValueOnce(makeJobResponse('DONE', true));

    await expect(mapper.trackJob('test-sid')).resolves.toBeUndefined();
    expect(mockGet).toHaveBeenCalledWith(
      'https://localhost:8089/services/search/jobs/test-sid',
    );
  });

  it('polls until DONE when initial state is RUNNING', async () => {
    mockGet
      .mockResolvedValueOnce(makeJobResponse('RUNNING', false))
      .mockResolvedValueOnce(makeJobResponse('RUNNING', false))
      .mockResolvedValueOnce(makeJobResponse('DONE', true));

    await expect(mapper.trackJob('test-sid')).resolves.toBeUndefined();
    expect(mockGet).toHaveBeenCalledWith(
      'https://localhost:8089/services/search/jobs/test-sid',
    );
  });

  describe('throws on bad dispatch states', () => {
    const badStates = [
      'BAD_INPUT_CANCEL',
      'FAILED',
      'INTERNAL_CANCEL',
      'PAUSE',
      'QUIT',
      'USER_CANCEL',
    ];

    for (const state of badStates) {
      it(`throws on ${state}`, async () => {
        mockGet.mockResolvedValueOnce(makeJobResponse(state, false));

        await expect(mapper.trackJob('test-sid')).rejects.toThrow(
          `Failed search job - Detected dispatch state ${state}`,
        );
      });
    }
  });

  it('throws on timeout when deadline exceeded', async () => {
    let callCount = 0;
    vi.spyOn(Date, 'now').mockImplementation(() => {
      callCount++;
      if (callCount <= 1) {
        return 1000;
      }
      return 1000 + 120_001;
    });

    try {
      await expect(mapper.trackJob('test-sid')).rejects.toThrow(
        'Search job timed out',
      );
    } finally {
      vi.spyOn(Date, 'now').mockRestore();
    }
  });

  it('throws with cause when axios request fails', async () => {
    const axiosError = new Error('Network Error');
    (axiosError as any).response = { status: 500 };
    mockGet.mockRejectedValueOnce(axiosError);

    let thrownError: Error | undefined;
    try {
      await mapper.trackJob('test-sid');
    } catch (error) {
      thrownError = error as Error;
    }

    expect(thrownError).toBeInstanceOf(Error);
    expect(thrownError!.message).toBe(
      'Failed search job - Internal server error',
    );
    expect(thrownError!.cause).toBe(axiosError);
  });

  it('throws on malformed response missing entry[0].content', async () => {
    mockGet.mockResolvedValueOnce({ data: {} });

    await expect(mapper.trackJob('test-sid')).rejects.toThrow(
      'Failed search job - Malformed search job response received',
    );
  });

  it('throws on empty entry array', async () => {
    mockGet.mockResolvedValueOnce({ data: { entry: [] } });

    await expect(mapper.trackJob('test-sid')).rejects.toThrow(
      'Failed search job - Malformed search job response received',
    );
  });

  it('throws on entry array with wrong length', async () => {
    mockGet.mockResolvedValueOnce({
      data: {
        entry: [
          { content: { dispatchState: 'RUNNING', isDone: false } },
          { content: { dispatchState: 'RUNNING', isDone: false } },
        ],
      },
    });

    await expect(mapper.trackJob('test-sid')).rejects.toThrow(
      'Failed search job - Detected malformed entry field length 2',
    );
  });

  it('propagates axios error codes through handleSplunkErrorResponse', async () => {
    const error401 = new Error('Unauthorized');
    (error401 as any).response = { status: 401 };
    mockGet.mockRejectedValueOnce(error401);

    await expect(mapper.trackJob('test-sid')).rejects.toThrow(
      'Failed search job - Incorrect username or password',
    );
  });

  it('throws "Unexpected error" for unrecognized status codes', async () => {
    const error418 = new Error("I'm a teapot");
    (error418 as any).response = { status: 418 };
    mockGet.mockRejectedValueOnce(error418);

    await expect(mapper.trackJob('test-sid')).rejects.toThrow(
      'Failed search job - Unexpected error',
    );
  });
});
