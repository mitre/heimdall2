import {
  ContextualizedControl,
  ContextualizedEvaluation,
  ControlStatus,
  convertFileContextual,
  ExecJSON,
  isContextualizedEvaluation
} from 'inspecjs';
import * as _ from 'lodash';
import {ensureContextualizedEvaluation} from '../../utils/global';

export type ControlSummaryInputData = {
  data: string | ExecJSON.Execution | ContextualizedEvaluation;
  filename?: string;
  controls?: ContextualizedControl[];
};

type Data = ControlSummaryInputData & {
  data: ContextualizedEvaluation;
  filename: string;
  controls?: ContextualizedControl[];
};

/*
 * {
 *   "SV-12345": {
 *     "complianceScore": 0.84,
 *     "counts": {
 *       "Passed": 1,
 *       ...
 *     },
 *     "statuses": {
 *       "my-result-set.json": {
 *         "redhat8": "Failed",
 *         ...
 *       },
 *       ...
 *     }
 *   }
 */
export type ControlSummary = Record<
  string,
  {
    complianceScore: number;
    counts: {
      Passed: number;
      Failed: number;
      'Profile Error': number;
      'Not Reviewed': number;
    };
    statuses: Record<string, Record<string, ControlStatus>>;
  }
>;

export class ControlSummaryMapper {
  data: Data[];

  // ensure input is turned into an array of contextualized evaluations with some additional metadata
  constructor(data: ControlSummaryInputData | ControlSummaryInputData[]) {
    if (!Array.isArray(data)) {
      data = [data];
    }
    this.data = data.map((datum, index) => {
      let contextualizedEvaluation = datum.data;
      if (_.isString(contextualizedEvaluation)) {
        const contextualizedFile = convertFileContextual(
          contextualizedEvaluation
        );
        if (!isContextualizedEvaluation(contextualizedFile)) {
          throw new Error('Input string was not an HDF ExecJSON');
        }
        contextualizedEvaluation = contextualizedFile;
      }
      contextualizedEvaluation = ensureContextualizedEvaluation(
        contextualizedEvaluation
      );
      return {
        data: contextualizedEvaluation,
        filename: datum.filename || index.toString(),
        controls: datum.controls
      };
    });
  }

  toControlSummary(): ControlSummary {
    // inverse each result set to go from result pointing at controls to array of controls pointing at the identification info of the result set
    // use that as the baseline to make the controlsummary type
    // calculate the complianceScore ([0,1])
    // return

    const scaffold = _.reduce(
      _.flattenDeep(
        this.data.map((d) =>
          d.data.contains.map((p) =>
            p.extendedBy.length !== 0
              ? []
              : p.contains.map((c) => ({
                  ...(d.controls?.map(con => con.data.id).includes(c.data.id) && {[c.data.id]: {
                    statuses: {[d.filename]: {[p.data.name]: c.hdf.status}}
                  }})
                }))
          )
        ) as Record<string, unknown>[][][]
      ),
      (acc, cur) => {
        _.merge(acc, cur);
        return acc;
      },
      {}
    );
    const withCounts = _.mapValues(
      scaffold,
      (control: {statuses: Record<string, Record<string, ControlStatus>>}) => ({
        ...control,
        ...{
          counts: _.reduce(
            control.statuses,
            (acc, cur) =>
              _.mergeWith(
                acc,
                _.countBy(_.flatMapDeep(cur)),
                (objValue, srcValue) => objValue + srcValue
              ),
            {Passed: 0, Failed: 0, 'Profile Error': 0, 'Not Reviewed': 0}
          )
        }
      })
    );
    const withScore = _.mapValues(
      withCounts,
      (control: {
        counts: {
          Passed: number;
          Failed: number;
          'Profile Error': number;
          'Not Reviewed': number;
        };
        statuses: Record<string, Record<string, ControlStatus>>;
      }) => ({
        ...control,
        ...{
          complianceScore: (() => {
            const passed = control.counts['Passed'];
            const total =
              passed +
              control.counts['Failed'] +
              control.counts['Profile Error'] +
              control.counts['Not Reviewed'];
            if (total === 0) {
              return 0;
            }
            return passed / total;
          })()
        }
      })
    );

    console.log(JSON.stringify(withScore, null, 2));

    return withScore;
  }
}
