import {SourcedContextualizedEvaluation} from '@/store/report_intake';
import _ from 'lodash';

export function isSbom(evaluation: SourcedContextualizedEvaluation): Boolean {
  return _.get(evaluation.data, 'passthrough.auxiliary_data', []).some(
    _.matchesProperty('name', 'SBOM')
  );
}
