/**
 * Provides general utilities for articulating associations between evaluations, profiles, and controls.
 * Especially useful for handling overlay/wrapper profiles.
 */

import {HDFControl, hdfWrapControl} from './compat_wrappers';
import {
  AnyControl,
  AnyEval,
  AnyEvalControl,
  AnyEvalProfile,
  AnyProfile
} from './fileparse';


/**
 * Mixin type to express that this type wraps another data type to add additional fields,
 * without modifying the inner type.
 */
interface WrapsType<Data> {
  data: Data;
}

/**
 * Mixin type to express that this type has some sort "parent".
 * Sort of an inverse to the Contains mixin.
 * E.g. A control is sourced from a profile, and an execution is from a file.
 */
interface Sourced<From> {
  sourcedFrom: From;
}

/**
 * Mixin type to express that this type has some sort of directional dependency-graph with members of a (usually the same) type.
 * For instance, profiles overlay/are overlayed by profiles.
 * Controls override behavior/are overrideen by other controls
 */
interface Extendable<By> {
  /**
   * What is this data extended by?
   * E.g. a profile that overlays this profile.
   * Can be empty.
   */
  extendedBy: By[];

  /**
   * What data is this node extending?
   * E.g. is this overlaying a profile? Another control?
   * Can be empty.
   */
  extendsFrom: By[];
}

/**
 * Mixin type to express that this type is primarily a parent to some other data.
 * For instance, profiles are most directly a parent of controls .
 * What objects/resources does this item contain?
 */
interface Contains<Item> {
  contains: Item;
}

interface userGuidance<mappings> {
  has: mappings
}

// Create our three primary data types from the above mixins
// Essentially this is just describing the parent/child relationships each type has
export interface ContextualizedEvaluation
  extends WrapsType<AnyEval>,
    Contains<ContextualizedProfile[]>,
    userGuidance<string[]> {}

export interface ContextualizedProfile
  extends WrapsType<AnyProfile>,
    Sourced<ContextualizedEvaluation | null>,
    Contains<ContextualizedControl[]>,
    Extendable<ContextualizedProfile>,
    userGuidance<string[]> {}
export interface ContextualizedControl
  extends WrapsType<AnyControl>,
    Sourced<ContextualizedProfile>,
    Extendable<ContextualizedControl> {
  /** The HDF version of this particular control */
  hdf: HDFControl;

  /** Drills down to this controls root CC. In general you should use this for all data operations */
  root: ContextualizedControl;

  /** Yields the full code of this control, by concatenating overlay code. */
  full_code: string;
}

class ContextualizedControlImp implements ContextualizedControl {
  // Imp stuff
  data: AnyControl;
  sourcedFrom: ContextualizedProfile;
  extendsFrom: ContextualizedControl[];
  extendedBy: ContextualizedControl[];
  hdf: HDFControl;

  constructor(
    data: AnyControl,
    sourcedFrom: ContextualizedProfile,
    extendedBy: ContextualizedControl[],
    extendsFrom: ContextualizedControl[]
  ) {
    // Simple save
    this.data = data;
    this.sourcedFrom = sourcedFrom;
    this.hdf = hdfWrapControl(data);
    this.extendedBy = extendedBy;
    this.extendsFrom = extendsFrom;
  }

  get root(): ContextualizedControl {
    if (this.extendsFrom.length) {
      return this.extendsFrom[0].root;
    }
    return this;
  }

  /** Returns whether this control is just a duplicate of base/root (but is not itself root) */
  get is_redundant(): boolean {
    return (
      !this.data.code ||
      this.data.code.trim() === '' ||
      (this.extendsFrom.length > 0 && this.data.code === this.root.data.code)
    );
  }

  get full_code(): string {
    // If we extend from something, we behave slightly differently
    if (this.extendsFrom.length) {
      const ancestor = this.extendsFrom[0];
      if (this.is_redundant) {
        return ancestor.full_code;
      } else {
        return `\
=========================================================
# Profile name: ${this.sourcedFrom.data.name}
=========================================================

${this.data.code}

${this.extendsFrom[0].full_code}`.trim();
      }
    } else {
      // We are the endpoint
      return `\
=========================================================
# Profile name: ${this.sourcedFrom.data.name}
=========================================================

${this.data.code}`.trim();
    }
  }
}

export function contextualizeEvaluation(
  evaluation: AnyEval,
  additionalStrings: string[]
): ContextualizedEvaluation {
  const evalContext: ContextualizedEvaluation = {
    data: evaluation,
    contains: [],
    has: additionalStrings // Add the array of strings to the has property
  };
  for (const profile of evaluation.profiles) {
    const evalProfileContext: ContextualizedProfile = {
      data: profile,
      sourcedFrom: evalContext,
      extendedBy: [],
      extendsFrom: [],
      contains: [],
      has: additionalStrings // Add the array of strings to the has property
    };
    evalContext.contains.push(evalProfileContext);
  }
  for (const profile of evalContext.contains) {
    const asExec = profile.data as AnyEvalProfile;
    if (asExec.parent_profile !== undefined) {
      const parent = evalContext.contains.find(
        (p) => p.data.name === asExec.parent_profile
      );
      if (parent) {
        parent.extendsFrom.push(profile);
        profile.extendedBy.push(parent);
      }
    }
  }
  const allControls: ContextualizedControl[] = [];
  for (const profile of evalContext.contains) {
    const pControls = profile.data.controls as AnyEvalControl[];
    profile.contains = pControls.map((c) => {
      return new ContextualizedControlImp(c, profile, [], []);
    });
    allControls.push(...profile.contains);
  }
  for (const cc of allControls) {
    if (cc.sourcedFrom.extendsFrom.length || cc.sourcedFrom.extendedBy.length) {
      if (cc.sourcedFrom.extendsFrom.length === 0) {
        continue;
      }
      for (const extendedProfile of cc.sourcedFrom.extendsFrom) {
        const ancestor = extendedProfile.contains.find(
          (c) => c.data.id === cc.data.id
        );
        if (ancestor) {
          ancestor.extendedBy.push(cc);
          cc.extendsFrom.push(ancestor);
          break;
        }
      }
    } else {
      const sameId = allControls.filter((c) => c.data.id === cc.data.id);
      let sameIdPopulated = sameId.find(
        (c) => c.hdf.segments && c.hdf.segments.length
      );
      if (!sameIdPopulated) {
        sameIdPopulated = sameId[0];
      }
      if (Object.is(cc, sameIdPopulated)) {
        continue;
      } else {
        sameIdPopulated.extendedBy.push(cc);
        cc.extendsFrom.push(sameIdPopulated);
      }
    }
  }
  return evalContext;
}
export function contextualizeProfile(
  profile: AnyProfile,
  additionalStrings: string[]
): ContextualizedProfile {
  const profileContext: ContextualizedProfile = {
    data: profile,
    extendedBy: [],
    extendsFrom: [],
    contains: [],
    sourcedFrom: null,
    has: additionalStrings // Add the array of strings to the has property
  };
  for (const c of profile.controls) {
    const result = new ContextualizedControlImp(c, profileContext, [], []);
    profileContext.contains.push(result);
  }
  return profileContext;
}