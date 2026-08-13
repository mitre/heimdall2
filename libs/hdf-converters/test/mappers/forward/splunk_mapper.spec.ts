import {AxiosHeaders, type AxiosResponse} from 'axios';
import {describe, expect, it, vi} from 'vitest';
import {SplunkMapper} from '../../../src/splunk-mapper';

// queryData awaits trackJob before fetching results, so trackJob must not
// resolve until Splunk reports the search job DONE. Before the fix these
// tests pin, trackJob resolved immediately while a detached setInterval kept
// polling — results could be fetched for an unfinished job, and every error
// thrown inside the timer callbacks was an unhandled rejection instead of a
// failure the caller could see.

function jobStatus(dispatchState: string, isDone = false): AxiosResponse {
  return {
    config: {headers: new AxiosHeaders()},
    data: {entry: [{content: {dispatchState, isDone}}]},
    headers: {},
    status: 200,
    statusText: 'OK'
  };
}

function buildMapper() {
  const mapper = new SplunkMapper({
    host: 'localhost',
    index: 'main',
    scheme: 'http'
  });
  return {get: vi.spyOn(mapper.axiosInstance, 'get'), mapper};
}

describe('SplunkMapper trackJob', () => {
  it('resolves only after the search job reports DONE', async () => {
    const {get, mapper} = buildMapper();
    get
      .mockResolvedValueOnce(jobStatus('RUNNING'))
      .mockResolvedValueOnce(jobStatus('RUNNING'))
      .mockResolvedValueOnce(jobStatus('DONE', true));

    await mapper.trackJob('SID123');

    expect(get).toHaveBeenCalledTimes(3);
    expect(get).toHaveBeenLastCalledWith(
      'http://localhost:8089/services/search/jobs/SID123',
      expect.objectContaining({timeout: expect.any(Number)})
    );
  });

  it('rejects when the job reports a failed dispatch state', async () => {
    const {get, mapper} = buildMapper();
    get
      .mockResolvedValueOnce(jobStatus('RUNNING'))
      .mockResolvedValueOnce(jobStatus('FAILED'));

    await expect(mapper.trackJob('SID123')).rejects.toThrow(
      'Failed search job - Detected dispatch state FAILED'
    );
  });

  it('rejects when the status response is malformed', async () => {
    const {get, mapper} = buildMapper();
    get.mockResolvedValueOnce({
      config: {headers: new AxiosHeaders()},
      data: {},
      headers: {},
      status: 200,
      statusText: 'OK'
    });

    await expect(mapper.trackJob('SID123')).rejects.toThrow(
      'Failed search job - Malformed search job response received'
    );
  });

  it('rejects when the polling request itself fails', async () => {
    const {get, mapper} = buildMapper();
    get.mockRejectedValueOnce(new Error('connect ECONNREFUSED'));

    await expect(mapper.trackJob('SID123')).rejects.toThrow(
      'Failed search job - '
    );
  });

  it('maps a timed-out polling request to the search job timeout error', async () => {
    const {get, mapper} = buildMapper();
    get.mockRejectedValueOnce(
      Object.assign(new Error('timeout of 120000ms exceeded'), {
        code: 'ECONNABORTED'
      })
    );

    await expect(mapper.trackJob('SID123')).rejects.toThrow(
      'Search job timed out - Unable to retrieve query'
    );
  });
});
