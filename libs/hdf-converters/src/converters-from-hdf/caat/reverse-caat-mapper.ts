import {ContextualizedEvaluation, ExecJSON} from 'inspecjs';
import _ from 'lodash';
import {ensureContextualizedEvaluation} from '../../utils/global';
import {version as HeimdallToolsVersion} from '../../../package.json';

export class FromHDFToCAATMapper {
  data: ContextualizedEvaluation;

  constructor(data: string | ExecJSON.Execution | ContextualizedEvaluation) {
    if (_.isString(data)) {
      data = ExecJSON.Convert.toExecJSON(data)
    }
    this.data = ensureContextualizedEvaluation(data);
  }

  toCAAT() {
    const passthrough = _.get(this.data, 'passthrough');
    let passthroughString = '';
    if (typeof passthrough === 'object') {
      passthroughString = JSON.stringify(passthrough);
    } else if (typeof passthrough !== 'undefined') {
      passthroughString = String(passthrough);
    }

    const mappedData: MappedXCCDFtoHDF = {
      Benchmark: {
        id: 'xccdf_mitre.hdf-converters.xccdf_benchmark_hdf2xccdf',
        title: this.data.profiles[0].title || 'HDF to XCCDF Benchmark',
        date: this.dateOverride
          ? TESTING_DATE_OVERRIDE
          : this.getExecutionTime(),
        metadata: {
          copyright: this.data.profiles[0].copyright || '',
          maintainer: this.data.profiles[0].maintainer || ''
        },
        passthrough: passthroughString,
        version: HeimdallToolsVersion,
        Profile: [],
        Rule: [],
        TestResult: {
          endTime: this.dateOverride
            ? TESTING_DATETIME_OVERRIDE
            : this.getExecutionTime(true),
          hasAttributes: false,
          attributes: [],
          results: []
        }
      }
    };

    this.data.profiles.forEach((profile) => {
      // Add Profile to Profile list
      mappedData.Benchmark.Profile.push({
        id:
          'xccdf_mitre.hdf-converters_profile_hdf2xccdf_' +
          // Replace all non-word characters and spaces with underscores
          (profile.title?.replace(/[^\w-.]/g, '_') || 'profile_missing_title'),
        title: profile.title || '',
        description: profile.description || '',
        // All control IDs
        select: profile.controls.map(
          (control) =>
            'xccdf_hdf_rule_' +
            (control.tags.rid ||
              control.id.replace(/_/g, '-').replace(/[^\w-.]/g, '_') + '_rule')
        )
      });
      mappedData.Benchmark.TestResult.attributes.push(
        ...(profile.attributes || [])
      );
      if (mappedData.Benchmark.TestResult.attributes.length > 0) {
        mappedData.Benchmark.TestResult.hasAttributes = true;
      }

      profile.controls.forEach((control) => {
        if (control.results) {
          // Add results info
          mappedData.Benchmark.TestResult.results.push(
            this.getControlResultsInfo(control)
          );
        }
      });
    });

    // Add the control metadata for the top-level profile
    this.data.profiles[0].controls.forEach((control) => {
      mappedData.Benchmark.Rule.push(this.getControlInfo(control));
    });

    return Mustache.render(this.xccdfTemplate, mappedData);
  }
}
