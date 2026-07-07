import * as XLSX from '@e965/xlsx';
import type { AttestationData } from 'inspecjs/src/generated_parsers/v_1_0/exec-json';
import * as yaml from 'yaml';
import type { CommentEntry } from '@/store/annotation_store';

export function toAttestationJson(attestations: AttestationData[]): string {
  return JSON.stringify(attestations, null, 2);
}

export function toAttestationXlsx(
  attestations: AttestationData[],
  comments: CommentEntry[],
): BlobPart {
  const rows: Record<string, string>[] = [];

  for (const a of attestations) {
    rows.push({
      control_id: a.control_id,
      explanation: a.explanation,
      frequency: a.frequency,
      status: a.status,
      type: 'attestation',
      updated: a.updated,
      updated_by: a.updated_by,
    });
  }

  for (const c of comments) {
    rows.push({
      control_id: c.control_id,
      explanation: c.text,
      frequency: '',
      status: '',
      type: 'comment',
      updated: c.updated,
      updated_by: c.updated_by,
    });
  }

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'attestations');
  return XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
}

export function toAttestationYaml(attestations: AttestationData[]): string {
  return yaml.stringify(attestations);
}

export function toHeimdallBundle(
  attestations: AttestationData[],
  comments: CommentEntry[],
): string {
  return JSON.stringify({ attestations, comments }, null, 2);
}
