import {readFileSync} from 'fs';
import * as _ from 'lodash';
import {describe, expect, it} from 'vitest';
import {InspecDataModule} from '@/store/data_store';
import {InspecIntakeModule} from '@/store/report_intake';
import {ControlStatusHash, StatusCountModule} from '@/store/status_counts';
import {AllRaw} from '../util/fs';

describe('Parsing', async () => {
  it('Report intake can read every raw file in hdf_data', async () => {
    const raw = AllRaw();

    const promises = Object.values(raw).map((fileResult) => {
      // Do intake
      return InspecIntakeModule.loadText({
        filename: fileResult.name,
        text: fileResult.content
      });
    });

    // Done!
    await Promise.all(
      promises.map((p) => expect(p).resolves.toBeTypeOf('string'))
    );
  });

  // Note that the above side effect has LOADED THESE FILES! WE CAN USE THEM IN OTHER TESTS

  it('Counts statuses correctly', () => {
    // Get the exec files
    const execFiles = InspecDataModule.executionFiles;

    // For each, we will filter then count
    execFiles.forEach((file) => {
      // Get the corresponding count file
      const countFilename = `tests/hdf_data/counts/${file.filename}.info.counts`;
      const countFileContent = readFileSync(countFilename, 'utf-8');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const counts: Record<string, any> = JSON.parse(countFileContent);

      // Get the expected counts
      const expected: ControlStatusHash = {
        Failed: counts.failed.total,
        Passed: counts.passed.total,
        'From Profile': 0,
        'Profile Error': counts.error.total,
        'Not Reviewed': counts.skipped.total,
        'Not Applicable': counts.no_impact.total,
        Waived: 0
      };

      const expectedWithFilename = {
        filename: file.filename,
        ...expected
      };

      // Get the actual
      const actualWithFilename = {
        filename: file.filename,
        ...StatusCountModule.hash({
          omit_overlayed_controls: true,
          fromFile: [file.uniqueId]
        })
      };

      const strippedActualWithFilename = _.omit(
        actualWithFilename,
        'PassedTests',
        'FailedTests',
        'PassingTestsFailedControl'
      );

      // Compare 'em
      expect(strippedActualWithFilename).toEqual(expectedWithFilename);
    });
  });
});
