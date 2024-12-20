import cciToNistData from './U_CCI_List.nist.json';
import cciToDefinitionData from './U_CCI_List.defs.json';
import {HANDCRAFTED_DEFAULT_NIST_TO_CCI} from '../mappings/NistCciMappingData';
import {NistReference} from '../../data/converters/cciListXml2json';

export const CCI_TO_NIST: Record<string, NistReference[]> = cciToNistData;
export const CCI_TO_DEFINITION: Record<string, string> = cciToDefinitionData;
export const DEFAULT_NIST_REFERENCE: Omit<NistReference, 'nist'> = {
  version: '5',
  title: 'NIST SP 800-53 Revision 5'
};

// DEFAULT_NIST_TAG is applicable to all automated configuration tests.
// SA-11 (DEVELOPER SECURITY TESTING AND EVALUATION) - RA-5 (VULNERABILITY SCANNING)
export const DEFAULT_STATIC_CODE_ANALYSIS_NIST_TAGS = ['SA-11', 'RA-5'];

export const DEFAULT_STATIC_CODE_ANALYSIS_CCI_TAGS =
  DEFAULT_STATIC_CODE_ANALYSIS_NIST_TAGS.map(
    (tag) => HANDCRAFTED_DEFAULT_NIST_TO_CCI[tag]
  ).flat();

// REMEDIATION_NIST_TAG the set of default applicable NIST 800-53 controls for ensuring up-to-date packages.
// SI-2 (FLAW REMEDIATION) - 	RA-5 (VULNERABILITY SCANNING)
export const DEFAULT_UPDATE_REMEDIATION_NIST_TAGS = ['SI-2', 'RA-5'];

// Applicable to dependency management
export const DEFAULT_INFORMATION_SYSTEM_COMPONENT_MANAGEMENT_NIST_TAGS = [
  'CM-8'
];
