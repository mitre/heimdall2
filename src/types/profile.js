class Profile {
    constructor(
        name,
        title,
        maintainer,
        copright,
        copyright_email,
        license,
        summary,
        version,
        depends,
        supports,
        controls,
        groups,
        attributes,
        sha256,
        generator_name,
        generator_version) {

        // Get the metadata from the r
        this.name = name;
        this.title = title;
        this.maintainer = maintainer;
        this.copyright = copyright;
        this.copyright_email = copyright_email;
        this.license = license;
        this.summary = summary;
        this.version = version;

        // Get relations
        //TODO: Figure out if this is never not null
        this.depends = depends;
        this.supports = supports;

        // Get controls, groups, and attributes
        this.controls = controls;
        this.groups = groups;
        this.attributes = attributes;

        // Get hash/gen info
        this.sha256 = sha256;
        this.generator_name = generator_name;
        this.generator_version = generator_version;
    }
}
