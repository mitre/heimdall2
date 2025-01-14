import _ from 'lodash';
import {
  HANDCRAFTED_DEFAULT_NIST_TO_CCI,
  NIST_TO_CCI
} from '../mappings/NistCciMappingData';
import {is_control, parse_nist} from 'inspecjs';
import {CCI_TO_NIST, DEFAULT_NIST_REFERENCE} from './CciNistMappingData';
import {NistReference} from '../../data/converters/cciListXml2json';

export function CCI2NIST(
  identifiers: string[],
  defaultCci2Nist: string[]
): NistReference[] {
  const DEFAULT_NIST_TAGS = defaultCci2Nist.map((nist) => ({
    nist,
    ...DEFAULT_NIST_REFERENCE
  }));
  const nists: NistReference[] = _.uniqBy(
    identifiers.flatMap((cci) => _.get(CCI_TO_NIST, cci, [])),
    (ref) => ref.nist
  );
  return nists.length > 0 ? nists : DEFAULT_NIST_TAGS;
}

export function NIST2CCI(
  identifiers: string[],
  defaultNist2Cci?: string[]
): string[] {
  const DEFAULT_CCI_TAGS = defaultNist2Cci || [];

  const ccis = identifiers
    .map(parse_nist)
    .filter(is_control)
    .map((nist) => nist.canonize())
    .flatMap((nist) => {
      // Get the official NIST->CCI mapping if it exists. Otherwise, get the handcrafted mapping.
      return _.get(
        NIST_TO_CCI,
        nist,
        _.get(HANDCRAFTED_DEFAULT_NIST_TO_CCI, nist, [])
      );
    });

  return ccis.length > 0 ? ccis : DEFAULT_CCI_TAGS;
}
