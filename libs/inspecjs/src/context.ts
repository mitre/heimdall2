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

// Create our three primary data types from the above mixins
// Essentially this is just describing the parent/child relationships each type has
export interface ContextualizedEvaluation
  extends WrapsType<AnyEval>,
    Contains<ContextualizedProfile[]> {}

export interface ContextualizedProfile
  extends WrapsType<AnyProfile>,
    Sourced<ContextualizedEvaluation | null>,
    Contains<ContextualizedControl[]>,
    Extendable<ContextualizedProfile> {}
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
  evaluation: AnyEval
): ContextualizedEvaluation {
  // To begin, create basic context for profiles and evaluation
  const evalContext: ContextualizedEvaluation = {
    data: evaluation,
    contains: []
  };

  for (const profile of evaluation.profiles) {
    const evalProfileContext: ContextualizedProfile = {
      data: profile,
      sourcedFrom: evalContext,
      extendedBy: [],
      extendsFrom: [],
      contains: []
    };

    // Add it to our parent
    evalContext.contains.push(evalProfileContext);
  }

  // After our initial save of profiles, we go over them again to establish parentage/dependency
  for (const profile of evalContext.contains) {
    // We know these are from a report; label as such
    const asExec = profile.data as AnyEvalProfile;

    // If it has a parent profile then we link them by extendedby/extendsfrom
    if (asExec.parent_profile !== undefined) {
      // Look it up
      const parent = evalContext.contains.find(
        (p) => p.data.name === asExec.parent_profile
      );

      // Link it up
      if (parent) {
        parent.extendsFrom.push(profile);
        profile.extendedBy.push(parent);
      }
    }
  }

  // Next step: Extract controls and connect them
  // Extract the controls and set them as the "contained" data for each profile
  // These ContextualizedControls are basically empty - just have data and from where they were sourced
  const allControls: ContextualizedControl[] = [];
  for (const profile of evalContext.contains) {
    const pControls = profile.data.controls as AnyEvalControl[];
    profile.contains = pControls.map((c) => {
      return new ContextualizedControlImp(c, profile, [], []);
    });
    allControls.push(...profile.contains);
  }

  // Link each contextualized control
  for (const cc of allControls) {
    // Behavior changes based on if we have well-formed or malformed profile dependency
    if (cc.sourcedFrom.extendsFrom.length || cc.sourcedFrom.extendedBy.length) {
      // Our profile is a baseline! No need to continue - children will make connections for us
      // If we aren't extended from something we just drop. Our children will make connections for us
      if (cc.sourcedFrom.extendsFrom.length === 0) {
        continue;
      }

      // Get the profile(s) that this control's owning profile is extending
      // For a wrapper profile, there might be many of these!
      // We don't know which one it will be, so we iterate
      for (const extendedProfile of cc.sourcedFrom.extendsFrom) {
        // Hunt for its ancestor in the extended profile
        const ancestor = extendedProfile.contains.find(
          (c) => c.data.id === cc.data.id
        );
        // First one we find with a matching id we assume is the root (or at least, closer to root)
        if (ancestor) {
          ancestor.extendedBy.push(cc);
          cc.extendsFrom.push(ancestor);
          break; // Note that we're in a nested loop here
        }
      }
      // If it's not found, then we just assume it does not exist!
    } else {
      // If we don't have a normal profile dependency layout, then we have to hunt ye-olde-fashioned-way
      // Unfortunately, if theres more than 2 profiles there's ultimately no way to figure out which one was applied "last".
      // This method leaves them as siblings. However, as a fallback method that is perhaps the best we can hope for
      // First, hunt out all controls from this file that have the same id as cc
      const sameId = allControls.filter((c) => c.data.id === cc.data.id);
      // Find which of them, if any, is populated with results.
      let sameIdPopulated = sameId.find(
        (c) => c.hdf.segments && c.hdf.segments.length
      );

      // If found a populated base, use that. If not, we substitute in the first found element in sameId. This is arbitrary.
      if (!sameIdPopulated) {
        sameIdPopulated = sameId[0];
      }

      // If the object we end up with is "us", then just ignore
      if (Object.is(cc, sameIdPopulated)) {
        continue;
      } else {
        // Otherwise, bind
        sameIdPopulated.extendedBy.push(cc);
        cc.extendsFrom.push(sameIdPopulated);
      }
    }
  }
  return evalContext;
}

// Here we handle the independent profile (IE those in their own files, generated by inspec json).
// These are slightly simpler because they do not actually include their overlays (even if they depend on them)
// as a separate data structure.
// As such, we can just do all the profile and controls from each in one fell swoop
export function contextualizeProfile(
  profile: AnyProfile
): ContextualizedProfile {
  const profileContext: ContextualizedProfile = {
    data: profile,
    extendedBy: [],
    extendsFrom: [],
    contains: [],
    sourcedFrom: null
  };

  // Now give it its controls
  for (const c of profile.controls) {
    const result = new ContextualizedControlImp(c, profileContext, [], []);
    profileContext.contains.push(result);
  }

  return profileContext;
}
