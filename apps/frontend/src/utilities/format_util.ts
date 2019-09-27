/**
 * Functions for formatting items to have unique keys. Principally used for vuex v-for key generation.
 */

import {
  ContextualizedControl,
  ContextualizedProfile,
  ContextualizedExecution
} from "@/store/data_store";
import { isInspecFile } from "@/store/report_intake";

export function execution_unique_key(
  exec: Readonly<ContextualizedExecution>
): string {
  return `exec_${exec.sourced_from.unique_id}`;
}

/**
 * Generates a unique key for the given profile
 * @param profile
 */
export function profile_unique_key(
  profile: Readonly<ContextualizedProfile>
): string {
  if (isInspecFile(profile.sourced_from)) {
    return `profile_${profile.sourced_from.unique_id}`;
  } else {
    return execution_unique_key(profile.sourced_from) + "-" + profile.data.name;
  }
}

/**
 * Generates a unique key for the given control
 * @param ctrl The control to generate the key for
 */
export function control_unique_key(
  ctrl: Readonly<ContextualizedControl>
): string {
  return profile_unique_key(ctrl.sourced_from) + "-" + ctrl.data.id;
}
