import {ExecJSON} from 'inspecjs';
import _ from 'lodash';
import { stringify } from 'querystring';
import {version as HeimdallToolsVersion} from '../package.json';
import {
  BaseConverter,
  ILookupPath,
  MappedTransform,
  parseXml
} from './base-converter';
import {CweNistMapping} from './mappings/CweNistMapping';
import {getCCIsForNISTTags} from './utils/global';
import { updateMappedTypeNode } from 'typescript';
const FILE_PATH_VALUE = 'file_paths.file_path.value';
const CWE_NIST_MAPPING = new CweNistMapping();
const DEFAULT_NIST_TAG = ['SI-2', 'RA-5'];
const IMPACT_MAPPING: Map<string, number> = new Map([
  ['5', 0.9],
  ['4', 0.7],
  ['3', 0.5],
  ['2', 0.3],
  ['1', 0.1],
  ['0', 0.0]
]);

/*const SPECIAL_CASE_MAPPING: Map<
  SpecialCasing,
  // eslint-disable-next-line @typescript-eslint/ban-types
  Record<string, Function>
> = new Map([
  //[SpecialCasing.FirewallManager, getFirewallManager()],
]);*/

function createDescription(data: Record<string, unknown>, type: string): string {
  if(type == 'Moldy'){
    return "body:" + _.get(data, 'sections[0].body') as string + 
           "\nbody_format:" + _.get(data, 'sections[0].body_format') as string + 
           "\nclassificaton:" + _.get(data, 'sections[0].body_classification') as string + "\n"
  }
  if(type == 'Stigma'){
    let desc ="body0:" + _.get(data, 'sections[0].body') as string + 
    "\nbody_format0:" + _.get(data, 'sections[0].body_format') as string + 
    "\ntitle_text0:" + _.get(data, 'sections[0].title_text') as string + 
    "\nclassificaton0:" + _.get(data, 'sections[0].body_classification') as string + 
    "\nbody1:" + _.get(data, 'sections[1].body') as string + 
    "\ntitle_text1:" + _.get(data, 'sections[1].title_text') as string + "\n"
    console.log(desc)
    return desc
  }
    return JSON.stringify(_.get(data, 'sections[0]') as string)
}

function childrenfinder(
  output: Record<string, unknown>
): string[][] {
  let arr: string[][] = []
  _.forEach(output, function(value, key) {
    if(_.has(value, 'name')){
      arr.push([key, _.get(value, 'name[0]')])
    }
    if(_.has(value, 'children')){
      _.forEach(childrenfinder(_.get(value, 'children')), function(value){
        arr.push(value)
      })
    }
  })
  return arr
}
function shafileMapper(
  output: Record<string, unknown>
): Record<string, unknown> {
  let toplevel = _.get(output, 'api_response.file_tree') as Record<string, unknown>
  let shamappings = {}
  _.forEach(toplevel, function(value, key) {
    if(_.has(value, 'name')){
    _.set(shamappings,_.get(value, 'name[0]'), _.get(value, 'sha256'))
    }
    if(_.has(value, 'children')){
      let arr = childrenfinder(_.get(value, 'children'))
      _.forEach(arr, function(value){
        _.set(shamappings, value[0], value[1])
      })
    }
  })
  return shamappings
}
function arrayifyObject(
    output: Record<string, unknown>,
    mapped: Record<string, unknown>
  ): unknown{
    let res = _.get(output, 'api_response.results') as Record<string, unknown>
    let newout : Record<string, unknown>[] = []
    _.forEach(res, function(value, key) {
        let temp = value as Record<string, unknown> 
        _.set(temp, 'filename', _.get(mapped, _.get(value, 'sha256')))
        let description = createDescription(_.get(temp, 'result') as Record<string, unknown>, _.get(temp, 'response.service_name') as string)
        _.set(temp, 'result.sections[0].body', description)
        newout.push(temp)
    } )
    let groups = _.groupBy(newout, function(value) {
      return _.get(value, 'response.service_name')
    })
    return groups;
  }

function controlMappingConveyor(): MappedTransform<
  ExecJSON.Control & ILookupPath,
  ILookupPath
> {
  return {
    id: {path: 'sha256'},
    title: {path: 'filename'},
    desc: {path: 'cve_summary'},
    impact: {
      path: 'result.score',
      transformer: (value) => {
        return value/100
      }
      },
    refs: [],
    tags: {
      nist: DEFAULT_NIST_TAG
    },
    source_location: {
      ref: ''
    },
    results: [
      {
        status: ExecJSON.ControlResultStatus.Failed,
        code_desc: {path: 'result.sections[0].body'},
        start_time: {path: 'response.milestones.service_started'},
        run_time: {path: 'response.milestones.service_completed'}
      }
    ]
  };
}

export class ConveyorMapper extends BaseConverter {
  data: Record<string,unknown>;
  type: string;
  defaultMapping(
    withRaw = false
  ): MappedTransform<ExecJSON.Execution, ILookupPath> {
    return {
      platform: {
        name: 'Heimdall Tools',
        release: HeimdallToolsVersion
      },
      version: HeimdallToolsVersion,
      statistics: {},
      profiles: [
        {
          name: this.type,
          version: 'tbd',
          title: {path: 'api_response.params.description'},
          supports: [],
          attributes: [],
          groups: [],
          status: 'loaded',
          controls: [
            {
              path: 'api_response.results',
              ...controlMappingConveyor()
            }
          ],
          sha256: ''
        }
      ]
    };
  }
  constructor(conveyor: Record<string,unknown>, meta:Record<string,unknown>, type: string, withRaw = false) {
    const data = meta
    _.set(data, 'api_response.results', conveyor)
    super(data);
    this.type = type
    this.data = data
    this.setMappings(this.defaultMapping(withRaw));
  }
}



export class ConveyorResults {
  data: unknown;
  meta: Record<string, unknown>
  constructor(
    ConveyorJson: string,
  ) {
    const data = JSON.parse(ConveyorJson)
    const mapped = shafileMapper(data)
    const newres = arrayifyObject(data, mapped)
    this.data = newres
    this.meta = _.omit(data, 'api_response.results')
  }

  toHdf(): Record<string, ExecJSON.Execution> {
    const mapped = _.mapValues(this.data as Record<string, unknown>, (val, key) => {
      return new ConveyorMapper(
        val as Record<string, unknown>,
        this.meta,
        key
      ).toHdf();
    });
    return mapped;
  }
}