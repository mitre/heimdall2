import _ from 'lodash';
import {
  HANDCRAFTED_DEFAULT_NIST_TO_CCI,
  NIST_TO_CCI
} from '../mappings/NistCciMappingData';
import {is_control, parse_nist} from 'inspecjs';
import {CCI_TO_NIST} from './CciNistMappingData';
import {CCIS_KEY} from '../../data/converters/cciListXml2json';

export function CCI2NIST(
  identifiers: string[],
  defaultCci2Nist: string[]
): string[] {
  const DEFAULT_NIST_TAGS = defaultCci2Nist;
  const nists: string[] = _.uniq(
    identifiers.flatMap((cci) => _.get(CCI_TO_NIST, cci, []))
  );
  return nists.length > 0 ? nists : DEFAULT_NIST_TAGS;
}

export function NIST2CCI(
  identifiers: string[],
  defaultNist2Cci?: string[]
): string[] {
  const DEFAULT_CCI_TAGS = defaultNist2Cci || [];

  const paths = identifiers
    .map(parse_nist)
    .filter(is_control)
    .map((control) => [
      control.subSpecifiers.slice(0, 2).join('-'),
      ...control.subSpecifiers.slice(2)
    ]);

  const ccis = _.uniq(
    paths.flatMap((specifiers) => {
      const parentSpecifier = specifiers[0];

      // See if the given path maps to CCIs, otherwise back up a specifier.
      for (let i = 0; i < specifiers.length; i++) {
        const path = [
          parentSpecifier,
          ...specifiers.slice(1, specifiers.length - i),
          CCIS_KEY
        ];
        const ccis = _.get(NIST_TO_CCI, path);
        if (ccis) {
          return ccis;
        }
      }

      // If there is no official NIST->CCI mapping for this NIST control, then check the handcrafted mapping.
      return _.get(HANDCRAFTED_DEFAULT_NIST_TO_CCI, parentSpecifier, []);
    })
  );

  return ccis.length > 0 ? ccis : DEFAULT_CCI_TAGS;
}
