import {InspecDataModule} from '@/store/data_store';
import {InspecIntakeModule} from '@/store/report_intake';
import {ControlStatusHash, StatusCountModule} from '@/store/status_counts';
import chai from 'chai';
import chai_as_promised from 'chai-as-promised';
import {readFileSync} from 'fs';
import _ from 'lodash';
import {AllRaw} from '../util/fs';
chai.use(chai_as_promised);
const expect = chai.expect;

describe('Parsing', () => {
  it('Report intake can read every raw file in hdf_data', function () {
    const raw = AllRaw();

    const promises = Object.values(raw).map((fileResult) => {
      // Do intake
      return InspecIntakeModule.loadText({
        filename: fileResult.name,
        text: fileResult.content
      });
    });

    // Done!
    return Promise.all(promises.map((p) => expect(p).to.eventually.be.string));
  });

  // Note that the above side effect has LOADED THESE FILES! WE CAN USE THEM IN OTHER TESTS

  it('Counts statuses correctly', function () {
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
      expect(strippedActualWithFilename).to.eql(expectedWithFilename);
    });
  });
});
