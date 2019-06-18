const DATA_NOT_FOUND_MESSAGE = "N/A";
const DEFAULT_IMPACT = -1;

function fixParagraphData(s) {
    // Given a string or undefined s, will return that string/undefined
    // as a paragraph broken up by <br> tags instead of newlines
    if(s) {
        return s.replace(new RegExp("\n", 'g'), '<br>');
    }
    else {
        return DATA_NOT_FOUND_MESSAGE;
    }
}

class InspecOutput {
    /* Contains the result(s) of running one or more inspec profiles */
    constructor(jsonObject) {
        // No parent; this is a top level type
        // Get what we need from the json object 
        const { version, controls, other_checks, profiles, 
            platform, statistics} = jsonObject;

        // Save these to properties
        this.version = version || DATA_NOT_FOUND_MESSAGE;
        this.controls = controls || DATA_NOT_FOUND_MESSAGE;
        this.other_checks = other_checks || DATA_NOT_FOUND_MESSAGE;
        this.profiles = profiles || DATA_NOT_FOUND_MESSAGE;
        this.platform = platform || DATA_NOT_FOUND_MESSAGE;
        this.statistics = statistics || DATA_NOT_FOUND_MESSAGE;
    }
}

class Profile {
    /* The data of an inspec profile. May contain results, if it was part of a run */
    constructor(parent, jsonObject) {
        // Save our parent. Would be of type InspecOutput
        // Note: can be null, in case of loading a profile independently
        this.parent = parent;
        
        // Get what we need from the json object 
        const {name, title, maintainer, copyright, 
            copyright_email, license, summary, version, 
            depends, supports, controls, groups, attributes, 
            sha256, generator} = jsonObject;

        // These we assign immediately
        this.name = name || DATA_NOT_FOUND_MESSAGE;
        this.title = title || DATA_NOT_FOUND_MESSAGE;
        this.maintainer = maintainer || DATA_NOT_FOUND_MESSAGE;
        this.copyright = copyright || DATA_NOT_FOUND_MESSAGE;
        this.copyright_email = copyright_email || DATA_NOT_FOUND_MESSAGE;
        this.license = license || DATA_NOT_FOUND_MESSAGE;
        this.summary = summary || DATA_NOT_FOUND_MESSAGE;
        this.version = version || DATA_NOT_FOUND_MESSAGE;
        this.depends = depends || DATA_NOT_FOUND_MESSAGE;
        this.supports = supports || DATA_NOT_FOUND_MESSAGE;
        this.sha256 = sha256 || DATA_NOT_FOUND_MESSAGE;

        // These we break out of their nesting
        if(generator){
            this.generator_name = generator["name"] || DATA_NOT_FOUND_MESSAGE;
            this.generator_version = generator["version"] || DATA_NOT_FOUND_MESSAGE;
        } else {
            this.generator_name =  DATA_NOT_FOUND_MESSAGE;
            this.generator_version = DATA_NOT_FOUND_MESSAGE;
        }
        
        // Get controls, groups, and attributes. Require class relations
        this.controls = map(c => new Control(this, c), controls);
        this.groups = map(g => new Group(this, g), groups);
        this.attributes = map(a => new Attribute(this, a), attributes);
    }
}


class Control {
    /* The data of an inspec control. May contain results, if it was part of a run */
    constructor(parent, jsonObject) {
        // Set the parent. Would be of type Profile
        this.parent = parent;

        // Extract rest from json
        const {title, desc, impact, refs, tags, 
            code, source_location, id} = jsonObject;

        // Save and rename data to match what was in store
        this.rule_title = title || DATA_NOT_FOUND_MESSAGE;
        this.refs = refs || DATA_NOT_FOUND_MESSAGE;
        this.tags = ControlTags(this, tags);
        this.code = code || DATA_NOT_FOUND_MESSAGE;

        // Need to fix this long-form data
        this.vuln_discuss = fixParagraphData(desc);

        // As numbers, impact and code need to be strings for consistency
        // We keep impact for computing severity
        this.impact_val = control.impact || DEFAULT_IMPACT;
        this.impact = String(control.impact) || DATA_NOT_FOUND_MESSAGE;
        this.code = String(control.code) || DATA_NOT_FOUND_MESSAGE;

        // The id/vuln_num is truncated partially. I don't really know why
        // Wisdom of the elders I guess
        this.vuln_num = id || DATA_NOT_FOUND_MESSAGE;
        if(this.vuln_num.match(/\d+\.\d+/)) { // Taken from store - reason unclear
            this.vuln_num = this.vuln_num.match(/\d+(\.\d+)*/)[0];
        }

        // Have to pull these out but not terribly difficult
        const {ref, line} = source_location;
        this.source_file = ref || DATA_NOT_FOUND_MESSAGE;
        this.source_line = line || DATA_NOT_FOUND_MESSAGE;

        // Next, we handle building message, and interring results
        // Initialize message. If it's of no impact, prefix with what it is
        if(this.impact_val == 0) {
            this.message = this.vuln_discuss + "\n\n";
        } else {
            this.message = "";
        }

        // Track statuses and results as well
        results = results || [];
        this.results = map(r => new ControlResult(r), this.results);

        // Compose our message
        this.results.foreach(r => this.message += r.toMessageLine());
    }

    get finding_details() {
        var result = '';
        switch(this.status) {
            case "Failed": 
                return "One or more of the automated tests failed or was inconclusive for the control \n\n " + this.message + "\n";
            case "Passed": 
                return "All Automated tests passed for the control \n\n " + this.message + "\n"; 
            case "Not Reviewed": 
                return "Automated test skipped due to known accepted condition in the control : \n\n" + this.message + "\n"; 
            case "Not Applicable": 
                return "Justification: \n\n" + this.message + "\n"; 
            case "Profile Error":
                if (this.message) {
                    return "Exception: \n\n" + this.message + "\n";
                } else {
                    return "No test available for this control";
                }
        }
    }

    get status() {
        return 5/0;
    }

    get severity() {
        /* Compute the severity of this report as a string */
        if (this.impact_val < 0.1) {
            return 'none';
        } else if (this.impact_val < 0.4) {
            return 'low';
        } else if (this.impact_val < 0.7) {
            return 'medium';
        } else if (this.impact_val < 0.9) {
            return 'high';
        } else if (this.impact_val >= 0.9) {
            return 'critical';
        }
    }

    get profile() {
        /* Returns the programatically determined profile name of this control */
        var prefix;
        if(this.parent) {
            // It's a result - name as such
            prefix = "return;"
        }
        else {
            prefix = "profile;"
        }
        return prefix + this.name + ": " + this.parent.version;
    }

    get start_time() {
        /* Returns the start time of this control's run, as determiend by the time of the first test*/
        if(this.results) {
            return this.results[0].start_time;
        }
        else {
            return DATA_NOT_FOUND_MESSAGE;
        }
    }

    get status_list() {
        return this.results.map(r => r.status);
    }
}


class ControlTags {
    /* Contains data for the tags on a Control.  */
    constructor(parent, jsonObject){
        // Set the parent. Would be of type Control
        this.parent = parent;

        // Extract rest from json
        const {
            gid, gtitle, rid, stig_id, cci, nist, check, fix, rationale,
            cis_family, cis_rid, cis_level, } = jsonObject;

        this.gid = gid || DATA_NOT_FOUND_MESSAGE;
        this.group_title = gtitle || DATA_NOT_FOUND_MESSAGE;
        this.rule_id = rid || DATA_NOT_FOUND_MESSAGE;
        this.rule_ver = stig_id || DATA_NOT_FOUND_MESSAGE;
        this.cci_ref = cci || DATA_NOT_FOUND_MESSAGE;
        this.cis_family = cis_family || DATA_NOT_FOUND_MESSAGE;
        this.cis_rid = cis_rid || DATA_NOT_FOUND_MESSAGE;
        this.cis_level = cis_level || DATA_NOT_FOUND_MESSAGE;

        // This case is slightly special as nist is a list.
        this.nist = nist || ['unmapped'];

        // These need slight correction, as they are paragraphs of data
        this.check_content = fixParagraphData(check);
        this.fix_text = fixParagraphData(fix);
        this.rationale = fixParagraphData(rationale);
    }
}


class ControlResult {
    constructor(parent, jsonObject) {
        // Set the parent. Would be of type Control
        this.parent = parent;

        // Extract relevant fields from json
        const {start_time, backtrace, status, skip_message, code_desc, message, exception} = jsonObject;

        // Rest we copy more or less as normal
        this.start_time = start_time || DATA_NOT_FOUND_MESSAGE;
        this.backtrace = backtrace || DATA_NOT_FOUND_MESSAGE;
        this.status = status || DATA_NOT_FOUND_MESSAGE;
        this.skip_message = skip_message || DATA_NOT_FOUND_MESSAGE;
        this.code_desc = code_desc || DATA_NOT_FOUND_MESSAGE;
        this.message = message || DATA_NOT_FOUND_MESSAGE;
        this.exception = exception;
    }

    toMessageLine() {
        switch(this.status) {
            case "skipped": 
                return "SKIPPED -- " + this.skip_message + '\n';
            case "failed":  
                return "FAILED -- Test: " + result.code_desc + '\nMessage: ' + result.message + '\n';
            case "passed":  
                return "PASSED -- " + result.code_desc + '\n';
            case "error": 
                return "ERROR -- Test: " + result.code_desc + '\nMessage: ' + result.message + '\n';
            default:
                return "Exception: " + result.exception + "\n";
        }
    }
}


class Group {
    constructor(parent, jsonObject) {
        // Set the parent. Would be of type Profile
        this.parent = parent;

        // Extract rest from json
        const { title, controls, id} = jsonObject;
        this.title = title || DATA_NOT_FOUND_MESSAGE;
        this.controls = controls || DATA_NOT_FOUND_MESSAGE; // Note that this is a list of ids.
        this.id = id || DATA_NOT_FOUND_MESSAGE;
    }

    // TODO: Make a function to grab the actual controls via routing thru parent
}

class Attribute {
    constructor(parent, jsonObject) {
        // Set the parent. Would be of type Profile
        this.parent = parent;

        // Extract rest from json
        const {name, options} = jsonObject;
        this.name = name;
        if(options) {
            this.options_description = options["description"];
            this.options_default = options["default"];
        } else {
            this.options_description = options["description"] || DATA_NOT_FOUND_MESSAGE;
            this.options_default = options["default"] || DATA_NOT_FOUND_MESSAGE;
        }
    }
}