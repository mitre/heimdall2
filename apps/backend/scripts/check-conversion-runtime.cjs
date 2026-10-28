// Run with plain Node after building the workspace packages (also runs in Docker).
const assert = require('node:assert/strict');
const {convertFile} = require('inspecjs');
const {fingerprint, INPUT_TYPES} = require('@mitre/hdf-converters');
const {convertReport} = require('../dist/src/evaluations/report-conversion.js');

const report = `<NessusClientData_v2>
  <Policy><policyName>Runtime check</policyName><Preferences><ServerPreferences>
    <preference><name>sc_version</name><value>1</value></preference>
    <preference><name>other</name><value>1</value></preference>
  </ServerPreferences></Preferences></Policy>
  <Report><ReportHost name="localhost">
    <HostProperties><tag name="HOST_START">Tue Oct 27 00:00:00 2026</tag></HostProperties>
    <ReportItem pluginID="1" pluginName="Runtime check" severity="0" port="0">
      <description>Runtime check</description><solution>None</solution>
      <plugin_output>Runtime check</plugin_output><risk_factor>None</risk_factor>
    </ReportItem>
    <ReportItem pluginID="2" pluginName="Second runtime check" severity="0" port="0">
      <description>Second runtime check</description><solution>None</solution>
      <plugin_output>Runtime check</plugin_output><risk_factor>None</risk_factor>
    </ReportItem>
  </ReportHost></Report>
</NessusClientData_v2>`;

async function check() {
  assert(require.resolve('inspecjs').endsWith('.js'));
  assert(require.resolve('@mitre/hdf-converters').endsWith('.js'));
  assert.equal(fingerprint({data: report, filename: 'check.nessus'}), INPUT_TYPES.NESSUS);
  // This mapper dynamically imports htmlparser2, exercising native ESM resolution too.
  const evaluations = await convertReport(report, 'check.nessus');
  assert.equal(evaluations.length, 1);
  const hdf = convertFile(JSON.stringify(evaluations[0]), true)['1_0_ExecJson'];
  assert(hdf, 'Converter output must validate as HDF');
  assert.equal(hdf.profiles[0].controls.length, 2);
  await assert.rejects(convertReport('{}', 'bad.json'), (error) => error.getStatus() === 400);
  console.log('Compiled backend, converter packages, asynchronous XML conversion and API errors passed.');
}

check().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
