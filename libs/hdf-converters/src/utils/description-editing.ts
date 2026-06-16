import {ExecJSON} from 'inspecjs';
import {ChecklistVuln} from '../ckl-mapper/checklist-jsonix-converter';

type DescriptionsInput =
  | ExecJSON.ControlDescription[]
  | Record<string, string>;

const CKL_SECTION_MARKER_RE = /^(CAVEAT|JUSTIFICATION|RATIONALE|COMMENTS) ::/;

/**
 * Write-side complement to getDescription (read-side) in global.ts.
 * Handles both array-form (evaluation controls) and object-form (profile controls).
 */
export function setControlDescription(
  descriptions: DescriptionsInput,
  label: string,
  value: string
): void {
  if (Array.isArray(descriptions)) {
    const existing = descriptions.find(
      (d: ExecJSON.ControlDescription) =>
        d.label.toLowerCase() === label.toLowerCase()
    );
    if (existing) {
      existing.data = value;
    } else {
      descriptions.push({label, data: value});
    }
  } else {
    descriptions[label] = value;
  }
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
  return text.replace(
    /\n(CAVEAT|JUSTIFICATION|RATIONALE|COMMENTS) ::/g,
    '\n[$1] ::'
  );
}

type DescriptionEdits = {
  comments?: string;
  caveat?: string;
  justification?: string;
  rationale?: string;
};

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
  edits: Map<string, DescriptionEdits>
): void {
  for (const vuln of vulns) {
    const controlEdits = edits.get(vuln.vulnNum);
    if (!controlEdits) {
      continue;
    }

    const currentComments =
      typeof vuln.comments === 'string' ? vuln.comments : '';
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
  commentString: string
): Map<string, string> {
  const sections = new Map<string, string>();

  if (!commentString || !commentString.includes(' :: ')) {
    if (commentString.trim()) {
      sections.set('_plain', commentString);
    }
    return sections;
  }

  for (const section of commentString.split(/\n(?=[A-Z]+ ::)/)) {
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
  sections: Map<string, string>
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
