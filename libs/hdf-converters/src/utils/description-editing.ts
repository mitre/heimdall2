import type { ExecJSON } from 'inspecjs';
import type { ChecklistVuln } from '../ckl-mapper/checklist-jsonix-converter';
import type { Attestation } from './attestations';
import { addAttestationToHDF } from './attestations';

type DescriptionsInput
  = | ExecJSON.ControlDescription[]
    | Record<string, string>;

const CKL_SECTION_MARKER_RE = /^(?:CAVEAT|COMMENTS|JUSTIFICATION|RATIONALE) ::/v;
const CKL_SECTION_SPLIT_RE = /\n(?=[A-Z]+ ::)/v;

export type DescriptionEdits = {
  caveat?: string;
  comments?: string;
  justification?: string;
  rationale?: string;
};

/**
 * Build a description-edits map from evaluation profiles for CKL export sync.
 * Matches controls by ID (case-insensitive) against the given vuln IDs,
 * extracting comments/caveat/justification/rationale from array-form descriptions.
 *
 * This is the input for syncChecklistVulnComments — call this to build the edits
 * map, then pass it to syncChecklistVulnComments with the passthrough vulns.
 *
 * Format-agnostic: works for CKL and will work for CKLB JSON when added.
 */
export function buildEditsMapFromProfiles(
  profiles: ExecJSON.Profile[],
  vulnNums: string[],
): Map<string, DescriptionEdits> {
  const edits = new Map<string, DescriptionEdits>();

  for (const vulnNum of vulnNums) {
    for (const profile of profiles) {
      const control = profile.controls.find(
        c => c.id.toLowerCase() === vulnNum.toLowerCase(),
      );
      if (!control) {
        continue;
      }

      const descriptions: Record<string, string> = {};
      if (Array.isArray(control.descriptions)) {
        for (const desc of control.descriptions) {
          descriptions[desc.label.toLowerCase()] = desc.data;
        }
      }

      if (
        descriptions.comments
        || descriptions.caveat
        || descriptions.justification
        || descriptions.rationale
      ) {
        edits.set(vulnNum, {
          caveat: descriptions.caveat,
          comments: descriptions.comments,
          justification: descriptions.justification,
          rationale: descriptions.rationale,
        });
      }
      break;
    }
  }

  return edits;
}

/**
 * Prepare evaluation data for CKL (or CKLB) export.
 * Deep-clones the evaluation, applies attestations, and syncs description edits
 * to CKL passthrough vuln comments. The original evaluation data is never modified.
 *
 * This is the single entry point for ADR §5.4.2 steps 2a-2c.
 * Format-agnostic: the clone is suitable for toCkl() or future toCklb().
 */
export function prepareEvaluationForCklExport(
  evaluationData: ExecJSON.Execution,
  attestations: Attestation[],
): ExecJSON.Execution {
  const clone: ExecJSON.Execution = structuredClone(evaluationData);

  if (attestations.length > 0) {
    addAttestationToHDF(clone, attestations);
  }

  const passthrough = (clone as ExecJSON.Execution & { passthrough?: { checklist?: { stigs?: { vulns: ChecklistVuln[] }[] } } }).passthrough;
  const stigs = passthrough?.checklist?.stigs;
  if (stigs) {
    for (const stig of stigs) {
      const vulnNums = stig.vulns.map(v => v.vulnNum);
      const edits = buildEditsMapFromProfiles(clone.profiles, vulnNums);
      if (edits.size > 0) {
        syncChecklistVulnComments(stig.vulns, edits);
      }
    }
  }

  return clone;
}

/**
 * Sanitize user text to prevent CKL section marker injection.
 * Replaces newline-prefixed section markers (e.g. "\nCAVEAT ::") with
 * escaped versions that won't be parsed as structured sections on re-import.
 */
export function sanitizeCklSectionMarkers(text: string): string {
  if (!text) {
    return text;
  }
  return text.replaceAll(
    /\n(?<section>CAVEAT|COMMENTS|JUSTIFICATION|RATIONALE) ::/gv,
    '\n[$<section>] ::',
  );
}

/**
 * Write-side complement to getDescription (read-side) in global.ts.
 * Handles both array-form (evaluation controls) and object-form (profile controls).
 */
export function setControlDescription(
  descriptions: DescriptionsInput,
  label: string,
  value: string,
): void {
  if (Array.isArray(descriptions)) {
    const existing = descriptions.find(
      (d: ExecJSON.ControlDescription) =>
        d.label.toLowerCase() === label.toLowerCase(),
    );
    if (existing) {
      existing.data = value;
    } else {
      descriptions.push({ data: value, label });
    }
  } else {
    descriptions[label] = value;
  }
}

/**
 * Sync edited description fields back into CKL passthrough vuln comments
 * at export time. Uses the same structured comment format as getComments()
 * in checklist-jsonix-converter.ts.
 *
 * @param vulns - The ChecklistVuln array from passthrough.checklist.stigs[].vulns
 * @param edits - Map of controlId → description field edits
 */
export function syncChecklistVulnComments(
  vulns: ChecklistVuln[],
  edits: Map<string, DescriptionEdits>,
): void {
  for (const vuln of vulns) {
    const controlEdits = edits.get(vuln.vulnNum);
    if (!controlEdits) {
      continue;
    }

    const currentComments
      = typeof vuln.comments === 'string' ? vuln.comments : '';
    const sections = parseStructuredComments(currentComments);

    for (const [field, value] of Object.entries(controlEdits)) {
      const sanitized = sanitizeCklSectionMarkers(value ?? '');
      const sectionLabel = field.toUpperCase();

      if (sanitized) {
        sections.set(sectionLabel, sanitized);
      } else {
        sections.delete(sectionLabel);
      }
    }

    vuln.comments = serializeStructuredComments(sections);
  }
}

const SECTION_ORDER = ['CAVEAT', 'JUSTIFICATION', 'RATIONALE', 'COMMENTS'];

function parseStructuredComments(
  commentString: string,
): Map<string, string> {
  const sections = new Map<string, string>();

  if (!commentString?.includes(' :: ')) {
    if (commentString.trim()) {
      sections.set('_plain', commentString);
    }
    return sections;
  }

  for (const section of commentString.split(CKL_SECTION_SPLIT_RE)) {
    const match = CKL_SECTION_MARKER_RE.exec(section);
    if (match) {
      const label = match[1];
      const data = section.slice(match[0].length).trim();
      if (data) {
        sections.set(label, data);
      }
    }
  }

  return sections;
}

function serializeStructuredComments(
  sections: Map<string, string>,
): string {
  if (sections.size === 0) {
    return '';
  }

  if (sections.has('_plain') && sections.size === 1) {
    return sections.get('_plain')!;
  }

  sections.delete('_plain');

  const parts: string[] = [];
  for (const label of SECTION_ORDER) {
    const value = sections.get(label);
    if (value) {
      parts.push(`${label} :: ${value}`);
    }
  }

  for (const [label, value] of sections) {
    if (!SECTION_ORDER.includes(label) && value) {
      parts.push(`${label} :: ${value}`);
    }
  }

  return parts.join('\n');
}
