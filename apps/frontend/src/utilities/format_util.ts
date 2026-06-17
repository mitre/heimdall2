/**
 * Functions for formatting items to have unique keys. Principally used for vuex v-for key generation.
 */

import type { ContextualizedControl } from 'inspecjs';
import { isFromProfileFile } from '@/store/data_store';
import type {
  SourcedContextualizedEvaluation,
  SourcedContextualizedProfile,
} from '@/store/report_intake';

/**
 * Generates a unique key for the given control
 * @param ctrl The control to generate the key for
 */
export function control_unique_key(
  ctrl: Readonly<ContextualizedControl>,
): string {
  return `${profile_unique_key(
    ctrl.sourcedFrom as Readonly<SourcedContextualizedProfile>,
  )}-${ctrl.data.id}`;
}

export function execution_unique_key(
  exec: Readonly<SourcedContextualizedEvaluation>,
): string {
  return `exec_${exec.from_file.uniqueId}`;
}

/**
 * Generates a unique key for the given profile
 * @param profile
 */
export function profile_unique_key(
  profile: Readonly<SourcedContextualizedProfile>,
): string {
  return isFromProfileFile(profile)
    ? `profile_${profile.from_file.uniqueId}`
    : `${execution_unique_key(
      profile.sourcedFrom as SourcedContextualizedEvaluation,
    )}-${profile.data.name}`;
}
