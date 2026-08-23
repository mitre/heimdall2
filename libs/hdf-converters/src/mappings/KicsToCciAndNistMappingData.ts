// CCI + NIST Mappings for KICS queries, keyed on query_id.
//
// Mapping Methodology:
//   KICS ships its full query catalog as data — 1,811 metadata.json files under
//   /app/bin/assets/queries/ in the distributed image — so every query is known
//   ahead of a scan rather than discovered from one.
//
//   Candidate controls are proposed by ranking each query's name, description
//   and category against the NIST SP 800-53 Rev 5 catalog at sub-part
//   granularity, then adjudicated by a qualified reviewer. Rank order is a
//   review queue, not a mapping; nothing enters this table unreviewed.
//
//   Total queries in catalog: 1,811
//   Total queries mapped: 0 (adjudication in progress)
//
// Until a query appears here the converter falls back to its CWE, and then to
// the static-analysis defaults, recording which tier answered in the
// `nistMapping` tag so a resolved mapping stays distinguishable from a guess.
//
// See mitre/hdf-libs#239 for the adjudication process and the candidate set.

export type KicsMappingEntry = {cci: string[]; nist: string[]};

export const data: Record<string, KicsMappingEntry> = {};
