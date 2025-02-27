import fs from 'fs';
import { ChecklistResults } from '../../../src/ckl-mapper/checklist-mapper';
import { Stigdata, Checklist } from '../../../src/ckl-mapper/checklistJsonix';
describe('checklist_mapper_severity_mapping', () => {
    it('Maps control V-61867 to correct severity category', () => {
        const hdfData = loadFile('sample_jsons/attestations/triple_overlay_profile_sample.json');
        const mapper = new ChecklistResults(hdfData);
        const jsonixData = mapper.getJsonix();
        const severity = extractSeverity(jsonixData, 2, 1);
        const status = extractStatus(jsonixData, 2);
        expect(severity).toBe('medium');
        expect(status).toBe('Not_Applicable');
        // Optional: Check the final HDF output as well
        // saveCklOutput(mapper, 'sample_jsons/checklist_mapper/triple_overlay_sample_converted_from_hdf_with_overwritten_severity.ckl');
    });
});
/**
 * Load and parse the file.
 * @param filePath Path to the file.
 * @returns Parsed data.
 */
function loadFile(filePath: string): any {
    return JSON.parse(fs.readFileSync(filePath, { encoding: 'utf-8' }));
}
/**
 * Extract the severity string for a specific control from the mapper.
 * @param jsonixData Checklist data in jsonix format.
 * @param vulnIndex Index of the vulnerability in the list.
 * @param stigdataIndex Index of the stigdata element.
 * @returns Severity string.
 */
function extractSeverity(jsonixData: Checklist, vulnIndex: number, stigdataIndex: number): string | undefined {
    const istig = (jsonixData?.value as Stigdata)?.stigs?.istig[0];
    const vuln = istig?.vuln[vulnIndex];
    const stigdataElement = vuln?.stigdata[stigdataIndex];
    return stigdataElement?.attributedata ?? undefined;
}
/**
 * Extract the status string for a specific control from the mapper.
 * @param jsonixData Checklist data in jsonix format.
 * @param vulnIndex Index of the vulnerability in the list.
 * @returns Status string.
 */
function extractStatus(jsonixData: Checklist, vulnIndex: number): string | undefined {
    const istig = (jsonixData?.value as Stigdata)?.stigs?.istig[0];
    const vuln = istig?.vuln[vulnIndex];
    const status = vuln?.status;
    return status;
}
/**
 * Save the CKL output to a file.
 * @param mapper ChecklistResults instance.
 * @param outputPath Path to save the CKL output.
 */
function saveCklOutput(mapper: ChecklistResults, outputPath: string): void {
    const cklOutput = mapper.toCkl();
    fs.writeFileSync(outputPath, cklOutput);
}