import {is_control, parse_nist} from 'inspecjs';
import {CCI_DESCRIPTIONS} from './cci_util';

export function nistTag(cci: string): string {
  return CCI_DESCRIPTIONS[cci].nist.slice(-1)[0];
}

export function nistDisplay(cci: string): string {
  const tag = [nistTag(cci)].map(parse_nist).filter(is_control)[0];
  const display = tag.canonize();
  return display;
}

export const CCI_REF_DELIMITER = '; ';
