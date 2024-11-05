import _ from 'lodash';
import {NIST_TO_CCI} from '../mappings/NistCciMappingData';
import {is_control, parse_nist} from 'inspecjs';
import {CCI_TO_NIST} from './CciNistMappingData';
import {
  CCIS_KEY,
  DELIMITER,
  removeParentheses
} from '../../data/converters/cciListXml2json';

export function CCI2NIST(
  identifiers: string[],
  defaultCci2Nist: string[],
  collapse = true
): string[] {
  const DEFAULT_NIST_TAGS = defaultCci2Nist;
  let matches: string[] = [];
  for (const id of identifiers) {
    const nistRef = CCI_TO_NIST[id];
    if (nistRef) {
      matches.push(nistRef);
    }
  }
  if (collapse) {
    matches = _.uniq(matches);
  }
  return matches.length > 0 ? matches : DEFAULT_NIST_TAGS;
}

export function NIST2CCI(
  identifiers: string[],
  defaultNist2Cci?: string[],
  collapse = true
): string[] {
  const DEFAULT_CCI_TAGS = defaultNist2Cci || [];
  const createPath = (nist: string) => [...nist.split(DELIMITER), CCIS_KEY];
  const nists = identifiers.map(parse_nist);
  const controls = nists.filter(is_control);
  const paths = controls.map((control) =>
    createPath(removeParentheses(control.canonize({add_spaces: true})))
  );
  const ccis = paths.flatMap((path) => _.get(NIST_TO_CCI, path, []));
  if (collapse) {
    const uniques = _.uniq(ccis);
    return uniques.length > 0 ? uniques : DEFAULT_CCI_TAGS;
  }
  return ccis.length > 0 ? ccis : DEFAULT_CCI_TAGS;
}
