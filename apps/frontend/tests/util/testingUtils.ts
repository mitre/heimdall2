import 'jest';
import {AllRaw} from '../util/fs';
import {InspecIntakeModule} from '../../src/store/report_intake';
import {FilteredDataModule} from '@/store/data_filters';
import {StatusCountModule} from '@/store/status_counts';
import {InspecDataModule} from '@/store/data_store';
import {samples, Sample} from '@/utilities/sample_util';
import {readFileSync} from 'fs';

let id = 0;

export function createTestingVue() {}

export function loadSample(sampleName: string) {
  let sample: Sample = {filename: '', data: ''};
  for (let samp of samples) {
    if (samp.filename === sampleName) {
      sample = samp;
    }
  }
  if (sample.filename === '') {
    return;
  }
  return InspecIntakeModule.loadText({
    filename: sampleName,
    text: JSON.stringify(sample.data)
  });
}

export function loadAll(): void {
  let data = AllRaw();
  Object.values(data).map(file_result => {
    // Increment counter
    id += 1;

    // Do intake
    return InspecIntakeModule.loadText({
      filename: file_result.name,
      text: file_result.content
    });
  });
}

export function removeAllFiles(): void {
  let ids = InspecDataModule.allFiles.map(f => f.unique_id);
  for (let id of ids) {
    InspecDataModule.removeFile(id);
  }
}

export function selectAllFiles(): void {
  for (let file of InspecDataModule.allFiles) {
    FilteredDataModule.set_toggle_file_on(file.unique_id);
  }
}

export function fileCompliance(fileId: string) {
  const filter = {fromFile: [fileId]};
  let passed = StatusCountModule.countOf(filter, 'Passed');
  let total =
    passed +
    StatusCountModule.countOf(filter, 'Failed') +
    StatusCountModule.countOf(filter, 'Profile Error') +
    StatusCountModule.countOf(filter, 'Not Reviewed');
  if (total == 0) {
    return 0;
  }
  return Math.round((100.0 * passed) / total);
}

export function expectedCount(
  status: 'failed' | 'passed' | 'notReviewed' | 'notApplicable' | 'profileError'
) {
  let statuses = {
    failed: 0,
    passed: 0,
    notReviewed: 0,
    notApplicable: 0,
    profileError: 0
  };

  // For each, we will filter then count
  InspecDataModule.executionFiles.forEach(file => {
    // Get the corresponding count file
    let count_filename = `tests/hdf_data/counts/${file.filename}.info.counts`;
    let count_file_content = readFileSync(count_filename, 'utf-8');
    let counts: any = JSON.parse(count_file_content);

    statuses['failed'] += counts.failed.total;
    statuses['passed'] += counts.passed.total;
    statuses['notReviewed'] += counts.skipped.total;
    statuses['notApplicable'] += counts.no_impact.total;
    statuses['profileError'] += counts.error.total;
  });

  return statuses[status];
}
