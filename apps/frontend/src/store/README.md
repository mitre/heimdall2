# How is inspec data read/stored?

## FileReader Component

The entry point to our data flow is the FileReader.vue component.
The file reader doesn't actually do any data handling of its own; it simply accepts files and routes them to an appropraite location.
In this case, it dispatches a "loadFile" action with the file as a payload.
This action is (currently) only handled by the report_intake.ts Vuex module.

## Report Intake Module

Upon receiving a "loadFile" action, the report intake attempts to read the file's text.
When the file is loaded, a callback is fired that attempts to read it as an Inspec data object.
This utilizes the InspecJS module's "convertFile" object which tries to match the provided text against every known Inspec output schema.
From here there are essentially three possible cases:

### InspecJS does not recognize the schema.

This can often happen with outdated versions of the Inspec client generating incompatible schema data.
Though the Inspec team hopes to eventually version the output, for now if you have this issue ensure Inspec is up to date.
A versioned schema would allow more backwards compatibility but for now this is out of our hands.

Anyways, convertFile will throw an error. 
There is little we can do at this point; the file simply isn't compatible, and we must inform the user of this error.

### InspecJS recognizes the schema -- but we don't know what to do with it.

The only case where this currently happens is if the data is in the JSON-MIN output format, in which controls are cut down to a very minimal dataform.
We might eventually add support for it, but for now we just error out.

### InspecJS recognizes and successfully parses the schema.

The success case!
We are left with either an ExecJSON or ProfileJSON object.

 - A ProfileJSON corresponds to the result of calling `inspec json <inspec_folder>`.  
 In essence, it is a "dry" run of a profile, containing only the controls but no results.
 It also will not actually pull in any profile dependencies - only controls from this specific profile are loaded.
 Note that this means the base code of overlayed controls will NOT be present.
 At this point I am uncertain the exact extents of what is properly loaded and what isn't.

 - An ExecJSON corresponds to, as one might guess, the result of calling `inspec exec <inspec_folder> --reporter json`.  
 The primary difference between this and a Profile are simply that this will have results, and will also include profile dependencies.

Since there are multipe versions of the schema, we may end up with a plethora of types to actually deal with.
Fortunately, since Execution/Profile data are for the most part identical across versions, we simply use the AnyExec, AnyProfile, and AnyControl union types to handle general cases.

We bundle these into a dict with the structure designated by the `ExecutionFile` and `ProfileFile` data structures, as found in `data_store.ts`.
If you don't feel like looking, essentially these both contain a `unique_id` property and a `filename` property, as well as a property for ExecJSON data or ProfileJSON data, as appropriate.
Unique id just lets us uniquely referred to the file.
Think of it like a file handle in Unix - an arbitrary but unique number.
Filename is just that; a filename (string).
Finally, depending on the type, they have a `execution` or `profile`, as previously described. 
Now, we build our additional data structures

## Contextual Data

Though we could theoretically at this point just use the data straight out of the ExecJSON/ProfileJSON items, that would be really annoying for several reasons.m

- For one, any time you'd want a control you'd have to trawl through every Execution -> Profile(s) -> Control(s) item, as well as the Profile -> Controls (for ProfileJSON data). Gross!
- Looking up overlay data can become very expensive very quickly if not cached properly.
- Furthermore, it quickly becomes baffling as to what data is coming from where.
You have a control - great. What profile is it coming from? What platform was it run on? These require data from Profile and Execution objects.

One solution would be to pass these as a bundled context of [AnyExec, AnyProfile, AnyControl], but this swiftly becomes unwieldy.
What if there is no Execution (in the case of a ProfileJSON file)?
Our type signature for a list of these things would end up looking like `Array<[null | AnyExec, AnyProfile, AnyControl]>` but I don't think anyone would be particularly happy with that. 

As our solution, we introduce the concept of a `ContextualizedItem` (see typing in data_store).
Essentially, a contextualized item is a simplified graph node wrapper around a type of data with the following elements:
 - `data` is, self-evidently, the wrapped data.
 - `sourced_from` is the object or resource from which a piece of data originates. A control is sourced from a Profile, a Profile an Execution or a File, etc.
 - `contains` is the inverse edge of `sourced_from`. It is what a resource contains as its contextual descendants.
 - `extends_from` is the set of objects that this data builds on. This is more explicitly used to relate Profiles by which overlays which. An overlay profile "extends_from" the base profile. Any controls modified by an overlay have an "extends" relationship with the base profile's corresponding control.
 - `extended_by` is the inverse edge of `extends_from`. A base profile is "extended_by" its overlay.

Contextualized Controls, Profiles, and Executions are accessible in three interconnected array getters in the data_store module.
They can be accessed as a group by the (private) method `getContextStore`, but are better accessed individually via getters `contextualExecutions`, `contextualProfiles`, and `contextualControls`.

The old functionality for filtering still exists, but under a new name: `filteredProfiles` and `filteredControls`. 
See the `Filter` type for possible filter values.

# Examples / common problems and their solutions

> I have a control; how do I know if another control overrides it in an overlay?

Given a ContextualControl `ctrl`, you can check
    if(ctrl.extended_by.length) {}
        // It has been overridden! Access ctrl.extended_by to see which control has done so.
    }

> I plan on accessing \[data\] frequently, using some lookup criteria \[criteria\] and I need to be able to quickly access it! Add this to data_store please!

No.
Haha just kidding. I mean the answer is still no, but only because this doesn't need to be in data_store!
It should instead go in a store module to keep things tidy.
As an example to work off of, see the `lookup_hashes.ts` module. 
Any such module using getters will be handily kept up to date by Vuex, and separating them into modules makes it clearer what files are using what features. 
The data_store module is already fairly crowded - compartmentalization is the best path forward!






