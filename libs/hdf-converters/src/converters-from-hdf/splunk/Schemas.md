# Schemas

Splunk2HDF has the following 3 schemas for importing data into Splunk.

## Previewing Data Within Splunk

An example query to preview data within Splunk is as follows:

```
index="<<YOUR INDEX>>" meta.subtype=control | stats  values(meta.filename) values(meta.filetype) list(meta.profile_sha256) values(meta.hdf_splunk_schema) values(meta.status)  list(meta.is_baseline) list(title) list(code) list(desc) list(descriptions.*)  values(id) values(impact) list(refs{}.*) list(results{}.*) list(source_location{}.*) values(tags.*)  by meta.guid id 
| join  meta.guid 
    [search index="<<YOUR INDEX>>"  meta.subtype=header | stats values(meta.filename) values(meta.filetype) values(meta.hdf_splunk_schema) list(statistics.duration)  list(platform.*) list(version)  by meta.guid] 
| join meta.guid 
    [search index="<<YOUR INDEX>>"  meta.subtype=profile | stats values(meta.filename) values(meta.filetype) values(meta.hdf_splunk_schema) list(meta.profile_sha256) list(meta.is_baseline)  list(summary) list(sha256) list(supports{}.*) list(name) list(copyright) list(maintainer) list(copyright_email) list(version) list(license) list(title) list(parent_profile) list(depends{}.*) list(controls{}.*) list(attributes{}.*) list(status) by meta.guid]
```

### Control
```
{
    "meta": {
        // This field is consistent accross all events per upload, i.e you can get all data related to a results set by querying meta.guid="<<GUID>>"
        "guid": "bXZNMQ3mNOs2PvHFv6Ze48RCdxI2FM",
        // The name of the file that was converted
        "filename": "example.json",
        //  Whether the converted file came from an evaluation file or profile file
        "filetype": "",
        // This identifies this event as a control event. Note the matching meta field in other event types
        "subtype": "control",
        // SHA256 Hash of the profile this control belongs to, to associate back to which layer of the profile this control came from
        "profile_sha256": "4bd9e49391dfd78bec6feeafbe8d212581daac43fcb734473d8eff86c863e219",
        // Schema 1.0 Was the original HDF-JSON-to-Splunk app, 1.1 is the SplunkToHDFMapper
        "hdf_splunk_schema": "1.1",
        // The controls computed status, based on result statuses. See https://github.com/mitre/inspecjs/blob/master/src/compat_wrappers.ts for explanation
        // Note that overlays will inherit the baseline status, instead of the "proper" result which would always just be Profile Error
        "status": "passed | failed | not applicable | not reviewed | profile error",
        // Whether or not this control was waived
        "is_waived": true, // or false
        // Whether this control is the baseline - IE, is it an overlay of a different control in this file?. Can differ from its containing profiles is_baseline
        "is_baseline": true, // or false!
        // How much of an overlay this control is. 0 <==> is_baseline, 1 implies direct overlay to baseline, etc. Will be null if ambiguous
        "overlay_depth": 0, // or 1, 2, 3, ...
    },
    "title": "The control title",
    "code": "The code for the control, not including over/underlays!",
    "desc": "The description of the control",
    "descriptions": {
        "key": "value" // Modified from the original HDF schema from an array of objects to a key/value pair
    },
    "id": "Control id",
    // Control impact, from 0.0 to 1.0
    "impact": 0.0,
    "refs": [
        // Inspec refs, as defined in profile.
    ],
    "results": [
        {
            // Optional: The inspec provided description of this result. Not reliably formatted
            "code_desc": "Auditd Rules with file == \"a.txt\" permissions should not cmp == []",
            // Optional: How many seconds it took to run this result segment
            "run_time": 0.001234, 
            // Required: The start time of this control, in ISO format
            "start_time": "2018-11-21T11:34:45-05:00",
            // Required: The result of the control - did the test pass, fail, or was it ignored?
            "status": "passed | failed | skipped",
            // Optional: The inspec resource that generated this result. See https://www.inspec.io/docs/reference/resources/
            // E.g. if describe(<resource>)
            "resource": "res",
            // Optional: Message describing the result of the test, in words.
            "message": "\nexpected it not to be == []\n     got: []\n\n(compared using `cmp` matcher)\n",
            // Optional: If skipped, a description of why
            "skip_message": "LDAP not enabled using any known mechanisms, this control is Not Applicable.",
            // Optional: If an exception occurred, the content of that exception message
            "exception": "RSpec::Core::MultipleExceptionError",
            // Optional / Nullable: If an exception occurred, the backtrace to that exception
            "backtrace": null // Or an array of strings  ["line1", "line2", ...]

            // There will be as many result objects in this array as there are inspec test blocks
        }
    ],
    "source_location": {
        // The line number at which it was found in the given file
        "line": 0,
        "ref": "The filepath to the .rb file that contains the control"
    },
    "tags": {
        // The check text. Usually present but not guaranteed.
        "check": "Is there \"problem\"?",
        //The fix text. Usually present but again, not guaranteed.
        "fix": "Delete \"problem\"",
        "nist": [
            // The actual nist tag (s). AC-1 provided as an example
            "AC-1",
            // Note that there can be multiple, and they can contain enhancements
            "AT-1 (c)",
            // Typically, the last tag is the revision
            "Rev_4"
        ],
        "other_tag_0": "There can be as many or as few tags as the profile developer wishes",
        "my_tag": "e.x. 1",
        "my_tag_3": "e.x. 2"
        // ... etc.
    }
}
```
### Profile

```
{
    "meta": {
        // This field is consistent across all events per upload, i.e you can get all data related to a results set by querying meta.guid="<<GUID>>"
        "guid": "bXZNMQ3mNOs2PvHFv6Ze48RCdxI2FM",
        //  Whether the converted file came from an evaluation file or profile file
        "filetype": "evaluation | profile",
        // The name of the file that was converted
        "filename": "",
        // This identifies this event as a control event. Note the matching meta field in other event types
        "subtype": "profile"
        // The SHA256 Hash of this profile, as generated by inspec
        "profile_sha256": "4bd9e49391dfd78bec6feeafbe8d212581daac43fcb734473d8eff86c863e219",
        // Schema 1.0 Was the original HDF-JSON-to-Splunk app, 1.1 is the SplunkToHDFMapper
        "hdf_splunk_schema": "1.1",
        // Whether this profile is a baseline - IE, is it being overlayed in this report?
        "is_baseline": true // or false
    },
    "summary": "The profile summary",
    "sha256": "The profile sha hash",
    // What platforms this profile supports.
    "supports": [],
    "name": "the-name-of-the-profile",
    "copyright": "The Authors",
    "maintainer": "The Authors",
    "copyright_email": "you@example.com",
    "version": "0.1.0",
    "license": "License. E.g. Apache-2.0",
    "title": "Profile Title",
    // The name of the parent profile, as would be found in its "name" field. In the case of JSON output, this is the name of the "parent" profile that loaded this "child" profile as a dependency (see below), typically to overlay controls
    "parent_profile": "cms-ars-3.1-moderate-mongodb-enterprise-advanced-3-stig-overlay",
    // List of profiles this profile depends on, either overlaying or combining them (or both). Note that none of these fields are specifically required - all depends on how the dependency is expressed in the profile
    "depends": [
        {
            // The name of the profile this depends on
            "name": "Profile name",
            // A url from which the profile is fetched
            "url": "http://where-the-profile-comes-from.com/data.zip",
            // The git url/uri, if this profile is from a git repository
            "git": "http://github.com/myuser/myprofilerepo.git",
            // The branch that, if this is from github, the build should be cloned from
            "branch": "master",
            // The local path to a profile
            "path": "~/profiles/other_profile",
            // If the profile could not be loaded, why not?
            "skip_message": "We skipped because we could not download!",
            // Whether the profile was "skipped" or "loaded" TODO: verify no other states possible
            "status": "skipped | loaded",
            // The profile supermarket from which this will be fetched
            "supermarket": "Market Name",
            // This field is not well documented in Inspec.
            "compliance": "?"
        }
    ],
    controls: [], // An empty array, for backwards compatibility with versions of Heimdall that assume this is already defined
    // "Inputs" in modern Inspec parlance, Attributes are the parameters specified at runtime for the profile.
    "attributes": [
        {
            "name": "param_name",
            "options": {
                "default": "default_value",
                // Whether or not it is required
                "required": true,
                // Can be string, number, or boolean.
                "type": "string"
            }
        }
        // Repeat as necessary
    ],
    "groups": [
        {
            // The control ids in the group
            "controls": ["contol_id_1", "control_id_2", "etc."],
            "id": "the id of the group"
        }
    ],
    // Whether the profile was "skipped" or "loaded" TODO: verify no other states possible - possibly "error"?
    "status": "skipped | loaded"
}
```

### (Execution) Header
```

{
    "meta": {
        // This field is consistent accross all events per upload, i.e you can get all data related to a results set by querying meta.guid="<<GUID>>"
        "guid": "bXZNMQ3mNOs2PvHFv6Ze48RCdxI2FM",
        // The name of the file that was converted
        "filename": "E.g. my_profile_results.json",
        // Whether this was the result of inspec exec <profile> or inspec json <profile>, respectively.
        "filetype": "evaluation | profile",
        // This identifies this event as a header event. Note the matching meta field in other event types.
        "subtype": "header",
        // Schema 1.0 Was the original HDF-JSON-to-Splunk app, 1.1 is the SplunkToHDFMapper
        "hdf_splunk_schema": "1.1",
    },
    "statistics": {
        // How long this evaluation run took, in seconds
        "duration": 0.501324
    },
    "platform": {
        // The platform release version
        "release": "18.2.0",
        // The platform name
        "name": "mac_os_x"
    },
    // The version of inspec that generated this file
    "version": "3.0.52"
}
```
