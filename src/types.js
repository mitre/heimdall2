class Result {
    constructor(jsonObject) {
        // No parent; this is a top level type
        // Get what we need from the json object 
        const { version, controls, other_checks, profiles, 
            platform, statistics} = jsonObject;

        // Save these to properties
        this.version = version;
        this.controls = controls;
        this.other_checks = other_checks;
        this.profiles = profiles;
        this.platform = platform;
        this.statistics = statistics;
    }
}



class Profile {
    constructor(parent, jsonObject) {
        // Save our parent. Would be of type result
        // Note: can be null, in case of loading a profile independently
        self.parent = parent;
        
        // Get what we need from the json object 
        const {name, title, maintainer, copyright, 
            copyright_email, license, summary, version, 
            depends, supports, controls, groups, attributes, 
            sha256, generator} = jsonObject;

        // These we assign immediately
        this.name = name;
        this.title = title;
        this.maintainer = maintainer;
        this.copyright = copyright;
        this.copyright_email = copyright_email;
        this.license = license;
        this.summary = summary;
        this.version = version;
        this.depends = depends;
        this.supports = supports;
        this.sha256 = sha256;

        // These we break out of their nesting
        this.generator_name = generator["name"]
        this.generator_version = generator["version"]
        
        // Get controls, groups, and attributes. Require class relations
        this.controls = map(c => new Control(this, c), controls);
        this.groups = map(g => new Group(this, g), groups);
        this.attributes = map(a => new Attribute(this, a), attributes);
    }
}


class Control {
    constructor(parent, jsonObject) {
        // Set the parent. Would be of type Profile
        this.parent = parent;

        // Extract rest from json
        const {title, description, impact, refs, tags, 
            code, source_location, id} = jsonObject;

        // These we copy directly
        this.title = title;
        this.description = description;
        this.impact = impact;
        this.refs = refs;
        this.tags = tags;
        this.code = code;
        this.id = id;

        // Have to pull these out but not terribly difficult
        this.source_file = source_location["ref"];
        this.source_line = source_location["line"];
    }
}


class Group {
    constructor(parent, jsonObject) {
        // Set the parent. Would be of type Profile
        self.parent = parent;

        // Extract rest from json
        const { title, controls, id} = jsonObject;
        this.title = title;
        this.controls = controls;
        this.id = id;
    }
}

class Attribute {
    constructor(parent, jsonObject) {
        // Set the parent. Would be of type Profile
        this.parent = parent;

        // Extract rest from json
        const {name, options} = jsonObject;
        this.name = name;
        this.options_description = options["description"];
        this.options_default = options["default"];
    }
}