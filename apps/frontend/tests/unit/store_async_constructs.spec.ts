import {AppInfoModule} from '@/store/app_info';
import {InspecDataModule} from '@/store/data_store';
import {InspecIntakeModule, isHDF} from '@/store/report_intake';
import type {AxiosInstance} from 'axios';
import axios from 'axios';
import {describe, expect, it, vi} from 'vitest';
import {AllRaw} from '../util/fs';

describe('isHDF', () => {
  it('recognizes execution JSON passed as a string', () => {
    expect(isHDF('{"profiles": []}')).toBe(true);
  });

  it('recognizes profile JSON passed as an object', () => {
    expect(isHDF({controls: [], sha256: 'abc123'})).toBe(true);
  });

  it('rejects a string that is not JSON', () => {
    expect(isHDF('definitely not json')).toBe(false);
  });

  it('rejects JSON that is neither an execution nor a profile', () => {
    expect(isHDF('{"some": "other format"}')).toBe(false);
  });

  it('rejects missing data', () => {
    expect(isHDF(undefined)).toBe(false);
  });
});

describe('The data store database-id lookups', () => {
  it('map between file id and database id synchronously once a file is loaded', async () => {
    const fixture = AllRaw()['bad_nginx.json'];
    const fileId = await InspecIntakeModule.loadText({
      filename: 'bad_nginx.json',
      text: fixture.content,
      database_id: '42'
    });

    expect(InspecDataModule.loadedDatabaseIdsForFileId(fileId)).toBe('42');
    expect(InspecDataModule.loadedFileIsForDatabaseIds(42)).toBe(fileId);
  });
});

describe('CheckForUpdates', () => {
  it('completes the version fetch before its promise resolves', async () => {
    const get = vi.fn().mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(resolve, 10, {data: [{name: 'v99.0.0'}]});
        })
    );
    const create = vi
      .spyOn(axios, 'create')
      .mockReturnValue({get} as unknown as AxiosInstance);
    try {
      await AppInfoModule.CheckForUpdates();
      expect(get).toHaveBeenCalledOnce();
      expect(AppInfoModule.latestVersion).toBe('99.0.0');
    } finally {
      create.mockRestore();
    }
  });
});
