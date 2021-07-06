// import { ExecJSON } from 'inspecjs/dist/generated_parsers/v_1_0/exec-json'
// import { version as HeimdallToolsVersion } from '../package.json'
import parser from 'fast-xml-parser';
import fs from 'fs';

// const objectMap = (obj: Object, fn: Function) =>
//   Object.fromEntries(
//     Object.entries(obj).map(
//       ([k, v], i) => [k, fn(v, k, i)]
//     )
//   )
// type MappedTransform<T, U> = {
//   [K in keyof T]: T[K] extends object ? MappedTransform<T[K], U> : T[K] | U;
// };
// interface LookupPath {
//   path: string;
// }
// function convert(fields: typeof mappings, file: Object) {
//   const result = objectMap(fields, (v: { path: string }) => _.get(file, v.path))
//   return result
// }
// async function generateHash(data: string): Promise<string> {
//   const encoder = new TextEncoder();
//   const encdata = encoder.encode(data);

//   const byteArray = await crypto.subtle.digest('SHA-256', encdata)
//   return Array.prototype.map.call(new Uint8Array(byteArray), x => (('00' + x.toString(16)).slice(-2))).join('');
// }

// const mappings: MappedTransform<ExecJSON, LookupPath> = {
//   platform: {
//     name: 'Heimdall Tools',
//     release: HeimdallToolsVersion,
//   },
//   profiles: [{
//     name: { path: 'cdf:Benchmark.cdf:id' }, //TODO
//     copyright: { path: 'cdf:Benchmark.cdf:metadata.dc:creator' },
//     license: { path: 'cdf:Benchmark.cdf:notice.dc:id' },
//     copyright_email: 'disa.stig_spt@mail.mil',
//     maintainer: { path: 'cdf:Benchmark.cdf:reference.dc:publisher' },
//     version: { path: 'cdf:Benchmarkl.cdf:style' }, //TODO
//     title: `Scout Suite Report using ${'last_run'} ruleset on ${['provider_name']} with account ${''}`, //TODO
//     attributes: [

//     ], //TODO
//     controls: [
//       {
//         id: { path: 'cdf:Benchmark.cdf:Group[INDEXHERE].cdf:Rule.cdf:id' }, //TODO
//         title: { path: 'cdf:Benchmark.cdf:Group[INDEXHERE].cdf:Rule.cdf:title' }, //TODO
//         desc: { path: 'cdf:Benchmark.cdf:Group[INDEXHERE].cdf:Rule.cdf:description' }, //TODO
//         descriptions: [
//           { data: { path: 'cdf:Benchmark.cdf:Group[INDEXHERE].cdf:Rule.cdf:description' }, label: 'default' },
//           { data: 'NA', label: 'rationale' },
//           { data: { path: 'cdf:Benchmark.cdf:Group[INDEXHERE].cdf:Rule.cdf:check.cdf:check-content-ref.cdf:name' }, label: 'check' },
//           { data: { path: 'cdf:Benchmark.cdf:Group[INDEXHERE].cdf:Rule.cdf:fixtext.cdf:text' }, label: 'fix' }
//         ],
//         impact: { path: 'cdf:Benchmark.cdf:Group[INDEXHERE].cdf:Rule.cdf:severity' },
//         refs: [],
//         tags: {
//           severity: null,
//           gtitle: { path: 'cdf:Benchmark.cdf:Group[INDEXHERE].cdf:title' },
//           satisfies: { path: 'cdf:Benchmark.cdf:Group[INDEXHERE].cdf:Rule.cdf:description' }, //TODO
//           gid: { path: 'cdf:Benchmark.cdf:Group[INDEXHERE].cdf:Rule.cdf:id' }, //TODO
//           legacy_id: { path: 'cdf:Benchmark.cdf:Group[INDEXHERE].cdf:Rule.cdf:ident[2]' },
//           rid: { path: 'cdf:Benchmark.cdf:Group[INDEXHERE].cdf:Rule.cdf:ident[1]' },
//           stig_id: { path: 'cdf:Benchmark.cdf:id' },
//           fix_id: { path: 'cdf:Benchmark.cdf:Group[INDEXHERE].cdf:Rule.cdf:fix.cdf:id' },
//           cci: { path: 'cdf:Benchmark.cdf:Group[INDEXHERE].cdf:Rule.cdf:ident' },
//           //nist: {path: }
//           code: '',
//           source_location: {}
//           results: //TBD
//         }
//       }
//     ], //TODO
//     groups: [],
//     summary: { path: 'cdf:Benchmark.cdf:description' },
//     supports: [],
//     sha256: ''
//   }],
//   statistics: {
//     duration: 0.0
//   },
//   version: HeimdallToolsVersion
// }

class XCCDFResultsMapper {
  // fs.readFileSync needs to provide encoding to return a string, suggest using "utf-8"
  scapJson: any;

  constructor(scapXml: string) {
    this.scapJson = parser.parse(scapXml);
  }
}

const file: string = fs.readFileSync(
  '/Users/rlin/Desktop/Repositories/heimdall_tools/sample_jsons/burpsuite_mapper/sample_input_report/zero.webappsecurity.com.min',
  {encoding: 'utf-8'}
);
const mapper: XCCDFResultsMapper = new XCCDFResultsMapper(file);
console.log('hi');
console.log('debug bad');
