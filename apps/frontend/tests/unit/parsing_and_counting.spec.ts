import chai from 'chai';
import chai_as_promised from 'chai-as-promised';
chai.use(chai_as_promised);
const expect = chai.expect;

import {InspecIntakeModule} from '@/store/report_intake';
import {InspecDataModule} from '@/store/data_store';
import {AllRaw} from '../util/fs';
import {ControlStatusHash, StatusCountModule} from '@/store/status_counts';
import {readFileSync} from 'fs';

describe('Parsing', () => {
  it('Report intake can read every raw file in hdf_data', function() {
    let raw = AllRaw();

    let promises = Object.values(raw).map(file_result => {
      // Do intake
      return InspecIntakeModule.loadText({
        filename: file_result.name,
        text: file_result.content
      });
    });

    // Done!
    return Promise.all(promises.map(p => expect(p).to.eventually.be.string));
  });

  // Note that the above side effect has LOADED THESE FILES! WE CAN USE THEM IN OTHER TESTS

  it('Counts statuses correctly', function() {
    // Get the exec files
    let exec_files = InspecDataModule.executionFiles;

    // For each, we will filter then count
    exec_files.forEach(file => {
      // Get the corresponding count file
      let count_filename = `tests/hdf_data/counts/${file.filename}.info.counts`;
      let count_file_content = readFileSync(count_filename, 'utf-8');
      let counts: any = JSON.parse(count_file_content);

      // Get the expected counts
      let expected: ControlStatusHash = {
        Failed: counts.failed.total,
        Passed: counts.passed.total,
        'From Profile': 0,
        'Profile Error': counts.error.total,
        'Not Reviewed': counts.skipped.total,
        'Not Applicable': counts.no_impact.total
      };

      let expected_with_filename = {
        filename: file.filename,
        ...expected
      };

      // Get the actual
      let actual = StatusCountModule.hash({
        omit_overlayed_controls: true,
        fromFile: [file.unique_id]
      });

      let {...actual_stripped} = actual;

      let actual_with_filename = {
        filename: file.filename,
        ...actual_stripped
      };

      // Compare 'em
      expect(actual_with_filename).to.eql(expected_with_filename);
    });
  });
});
