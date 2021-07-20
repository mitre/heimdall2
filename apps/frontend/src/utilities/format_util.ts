/**
 * Functions for formatting items to have unique keys. Principally used for vuex v-for key generation.
 */

import {isFromProfileFile} from '@/store/data_store';
import {
  SourcedContextualizedEvaluation,
  SourcedContextualizedProfile
} from '@/store/report_intake';
import {context} from 'inspecjs';

export function execution_unique_key(
  exec: Readonly<SourcedContextualizedEvaluation>
): string {
  return `exec_${exec.from_file.uniqueId}`;
}

/**
 * Generates a unique key for the given profile
 * @param profile
 */
export function profile_unique_key(
  profile: Readonly<SourcedContextualizedProfile>
): string {
  if (isFromProfileFile(profile)) {
    return `profile_${profile.from_file.uniqueId}`;
  } else {
    return `${execution_unique_key(
      profile.sourced_from as SourcedContextualizedEvaluation
    )}-${profile.data.name}`;
  }
}

/**
 * Generates a unique key for the given control
 * @param ctrl The control to generate the key for
 */
export function control_unique_key(
  ctrl: Readonly<context.ContextualizedControl>
): string {
  return `${profile_unique_key(
    ctrl.sourced_from as Readonly<SourcedContextualizedProfile>
  )}-${ctrl.data.id}`;
}
