import fs from 'fs';
import {ExecJSON} from 'inspecjs';
import {BurpSuiteMapper} from '../src/burpsuite-mapper';
import {JfrogXrayMapper} from '../src/jfrog-xray-mapper';
import {NiktoMapper} from '../src/nikto-mapper';
import {SarifMapper} from '../src/sarif-mapper';
import {ScoutsuiteMapper} from '../src/scoutsuite-mapper';
import {XCCDFResultsMapper} from '../src/xccdf-results-mapper';
import {ZapMapper} from '../src/zap-mapper';

test('Returns proper Hdf output from Burpsuite', () => {
  const mapper = new BurpSuiteMapper(
    fs.readFileSync(
      '/Users/rlin/Desktop/Repositories/heimdall_tools/sample_jsons/burpsuite_mapper/sample_input_report/zero.webappsecurity.com.min',
      {encoding: 'utf-8'}
    )
  );
  const result: ExecJSON.Execution = mapper.toHdf();
  fs.writeFileSync(
    'libs/hdf_converters/outputs/burpsuite.json',
    JSON.stringify(mapper.toHdf())
  );
  if (result !== undefined) {
    expect(result).toEqual(
      JSON.parse(
        fs.readFileSync(
          '/Users/rlin/Desktop/Repositories/heimdall_tools/sample_jsons/burpsuite_mapper/zero.webappsecurity.json',
          {encoding: 'utf-8'}
        )
      )
    );
  }
});

test('Returns proper Hdf output from JFrog', () => {
  const mapper = new JfrogXrayMapper(
    fs.readFileSync(
      '/Users/rlin/Desktop/Repositories/heimdall_tools/sample_jsons/jfrog_xray_mapper/sample_input_report/jfrog_xray_sample.json',
      {encoding: 'utf-8'}
    )
  );
  const result: ExecJSON.Execution = mapper.toHdf();
  if (result !== undefined) {
    expect(result).toEqual(
      JSON.parse(
        fs.readFileSync(
          '/Users/rlin/Desktop/Repositories/heimdall_tools/sample_jsons/jfrog_xray_mapper/jfrog_xray_hdf.json',
          {encoding: 'utf-8'}
        )
      )
    );
  }
});
test('Returns proper Hdf output from Nikto', () => {
  const mapper = new NiktoMapper(
    fs.readFileSync(
      '/Users/rlin/Desktop/Repositories/heimdall_tools/sample_jsons/nikto_mapper/sample_input_jsons/zero.webappsecurity.json',
      {encoding: 'utf-8'}
    )
  );
  const result: ExecJSON.Execution = mapper.toHdf();
  if (result !== undefined) {
    expect(result).toEqual(
      JSON.parse(
        fs.readFileSync(
          '/Users/rlin/Desktop/Repositories/heimdall_tools/sample_jsons/nikto_mapper/zero.webappsecurity.json',
          {encoding: 'utf-8'}
        )
      )
    );
  }
});
test('Returns proper Hdf output from Sarif', () => {
  const mapper = new SarifMapper(
    fs.readFileSync(
      '/Users/rlin/Desktop/Repositories/heimdall_tools/sample_jsons/sarif_mapper/sample_input_jsons/sarif_input.sarif',
      {encoding: 'utf-8'}
    )
  );
  const result: ExecJSON.Execution = mapper.toHdf();
  if (result !== undefined) {
    expect(result).toEqual(
      JSON.parse(
        fs.readFileSync(
          '/Users/rlin/Desktop/Repositories/heimdall_tools/sample_jsons/sarif_mapper/sarif_output.json',
          {encoding: 'utf-8'}
        )
      )
    );
  }
});
test('Returns proper Hdf output from Scoutsuite', () => {
  const mapper = new ScoutsuiteMapper(
    fs.readFileSync(
      '/Users/rlin/Desktop/Repositories/heimdall_tools/sample_jsons/scoutsuite_mapper/sample_input_jsons/scoutsuite_sample.js',
      {encoding: 'utf-8'}
    )
  );
  const result: ExecJSON.Execution = mapper.toHdf();
  if (result !== undefined) {
    expect(result).toEqual(
      JSON.parse(
        fs.readFileSync(
          '/Users/rlin/Desktop/Repositories/heimdall_tools/sample_jsons/scoutsuite_mapper/scoutsuite_hdf.json',
          {encoding: 'utf-8'}
        )
      )
    );
  }
});
test('Returns proper Hdf output from Xccdf Results', () => {
  const mapper = new XCCDFResultsMapper(
    fs.readFileSync(
      '/Users/rlin/Desktop/Repositories/heimdall_tools/sample_jsons/xccdf_results_mapper/sample_input_report/xccdf-results.xml',
      {encoding: 'utf-8'}
    )
  );
  const result: ExecJSON.Execution = mapper.toHdf();
  if (result !== undefined) {
    expect(result).toEqual(
      JSON.parse(
        fs.readFileSync(
          '/Users/rlin/Desktop/Repositories/heimdall_tools/sample_jsons/xccdf_results_mapper/xccdf-hdf.json',
          {encoding: 'utf-8'}
        )
      )
    );
  }
});
test('Returns proper Hdf output from Zap', () => {
  const mapper = new ZapMapper(
    fs.readFileSync(
      '/Users/rlin/Desktop/Repositories/heimdall_tools/sample_jsons/zap_mapper/sample_input_jsons/zero.webappsecurity.json',
      {encoding: 'utf-8'}
    ),
    'http://mymac.com:8191'
  );
  const result: ExecJSON.Execution = mapper.toHdf();
  if (result !== undefined) {
    expect(result).toEqual(
      JSON.parse(
        fs.readFileSync(
          '/Users/rlin/Desktop/Repositories/heimdall_tools/sample_jsons/zap_mapper/zero.webappsecurity.json',
          {encoding: 'utf-8'}
        )
      )
    );
  }
});
