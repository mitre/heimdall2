import { readFileSync } from 'fs';
import { InspecDataModule } from '@/store/data_store';
import { InspecIntakeModule } from '@/store/report_intake';
import type { Sample } from '@/utilities/sample_util';
import { samples } from '@/utilities/sample_util';
import { AllRaw } from './fs';

export enum DataLoadApproach {
  File,
  Text,
}

// When using Vuetify v-dialog's this is necessary in order to avoid a
// warning on the console when running tests.
export function addElemWithDataAppToBody() {
  const app = document.createElement('div');
  app.dataset.app = 'true';
  document.body.append(app);
}

export function expectedCount(
  status: 'failed' | 'notApplicable' | 'notReviewed' | 'passed' | 'profileError',
) {
  const statuses = {
    failed: 0,
    notApplicable: 0,
    notReviewed: 0,
    passed: 0,
    profileError: 0,
  };

  // For each, we will filter then count
  for (const file of InspecDataModule.executionFiles) {
    // Get the corresponding count file
    const countFilename = `tests/hdf_data/counts/${file.filename}.info.counts`;
    const countFileContent = readFileSync(countFilename, 'utf-8');

    const counts: Record<string, any> = JSON.parse(countFileContent);

    statuses.failed += counts.failed.total;
    statuses.passed += counts.passed.total;
    statuses.notReviewed += counts.skipped.total;
    statuses.notApplicable += counts.no_impact.total;
    statuses.profileError += counts.error.total;
  }

  return statuses[status];
}

export function loadAll(): void {
  const data = AllRaw();
  for (const fileResult of Object.values(data)) {
    // Do intake
    InspecIntakeModule.loadText({
      filename: fileResult.name,
      text: fileResult.content,
    });
  }
}

export function loadSample(
  sampleName: string,
  dataLoadApproach: DataLoadApproach = DataLoadApproach.Text,
) {
  const sample: Sample | undefined = samples.find(
    samp => samp.filename === sampleName,
  );
  if (sample === undefined) {
    return null;
  }
  const data: string = require(`../../public${sample.path}`);
  return dataLoadApproach === DataLoadApproach.Text
    ? InspecIntakeModule.loadText({
      filename: sampleName,
      text: JSON.stringify(data),
    })
    : InspecIntakeModule.loadFile({
      data: JSON.stringify(data),
      filename: sampleName,
    });
}

export function removeAllFiles(): void {
  const ids = InspecDataModule.allFiles.map(f => f.uniqueId);
  for (const id of ids) {
    InspecDataModule.removeFile(id);
  }
}
