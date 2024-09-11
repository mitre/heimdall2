export type CycloneDXSoftwareBillOfMaterialSpecification = {
    /**
     * Specifies the format of the BOM. This helps to identify the file as CycloneDX since BOMs
     * do not have a filename convention nor does JSON schema support namespaces.
     */
    bomFormat:   BOMFormat;
    components?: ComponentObject[];
    /**
     * Compositions describe constituent parts (including components, services, and dependency
     * relationships) and their completeness.
     */
    compositions?: CompositionObject[];
    /**
     * Provides the ability to document dependency relationships.
     */
    dependencies?: DependencyObject[];
    /**
     * External references provide a way to document systems, sites, and information that may be
     * relevant but which are not included with the BOM.
     */
    externalReferences?: ExternalReferenceObject[];
    /**
     * Provides additional information about a BOM.
     */
    metadata?: MetadataObject;
    /**
     * Every BOM generated should have a unique serial number, even if the contents of the BOM
     * being generated have not changed over time. The process or tool responsible for creating
     * the BOM should create random UUID's for every BOM generated.
     */
    serialNumber?: string;
    services?:     ServiceObject[];
    /**
     * The version of the CycloneDX specification a BOM is written to (starting at version 1.2)
     */
    specVersion: string;
    /**
     * The version allows component publishers/authors to make changes to existing BOMs to
     * update various aspects of the document such as description or licenses. When a system is
     * presented with multiple BOMs for the same component, the system should use the most
     * recent version of the BOM. The default version is '1' and should be incremented for each
     * version of the BOM that is published. Each version of a component should have a unique
     * BOM and if no changes are made to the BOMs, then each BOM will have a version of '1'.
     */
    version: number;
    [property: string]: any;
}

/**
 * Specifies the format of the BOM. This helps to identify the file as CycloneDX since BOMs
 * do not have a filename convention nor does JSON schema support namespaces.
 *
 * Specifies the format of the BOM. This helps to identify the file as CycloneDX since BOMs
 * do not have a filename convention nor does JSON schema support namespaces. This value
 * MUST be "CycloneDX".
 *
 * Specifies the format of the BOM. This helps to identify the file as CycloneDX since BOMs
 * do not have a filename convention, nor does JSON schema support namespaces. This value
 * must be "CycloneDX".
 */
export type BOMFormat = "CycloneDX";

/**
 * Component pedigree is a way to document complex supply chain scenarios where components
 * are created, distributed, modified, redistributed, combined with other components, etc.
 * Pedigree supports viewing this complex chain from the beginning, the end, or anywhere in
 * the middle. It also provides a way to document variants where the exact relation may not
 * be known.
 */
export type PedigreeObject = {
    /**
     * Describes zero or more components in which a component is derived from. This is commonly
     * used to describe forks from existing projects where the forked version contains a
     * ancestor node containing the original component it was forked from. For example,
     * Component A is the original component. Component B is the component being used and
     * documented in the BOM. However, Component B contains a pedigree node with a single
     * ancestor documenting Component A - the original component from which Component B is
     * derived from.
     */
    ancestors?: ComponentObject[];
    /**
     * A list of zero or more commits which provide a trail describing how the component
     * deviates from an ancestor, descendant, or variant.
     */
    commits?: CommitObject[];
    /**
     * Descendants are the exact opposite of ancestors. This provides a way to document all
     * forks (and their forks) of an original or root component.
     */
    descendants?: ComponentObject[];
    /**
     * Notes, observations, and other non-structured commentary describing the components
     * pedigree.
     */
    notes?: string;
    /**
     * >A list of zero or more patches describing how the component deviates from an ancestor,
     * descendant, or variant. Patches may be complimentary to commits or may be used in place
     * of commits.
     */
    patches?: PatchObject[];
    /**
     * Variants describe relations where the relationship between the components are not known.
     * For example, if Component A contains nearly identical code to Component B. They are both
     * related, but it is unclear if one is derived from the other, or if they share a common
     * ancestor.
     */
    variants?: ComponentObject[];
    [property: string]: any;
}

/**
 * The component that the BOM describes.
 */
export type ComponentObject = {
    /**
     * The person(s) or organization(s) that authored the component
     */
    author?: string;
    /**
     * An optional identifier which can be used to reference the component elsewhere in the BOM.
     * Every bom-ref should be unique.
     */
    "bom-ref"?:  string;
    components?: ComponentObject[];
    /**
     * An optional copyright notice informing users of the underlying claims to copyright
     * ownership in a published work.
     */
    copyright?: string;
    /**
     * DEPRECATED - DO NOT USE. This will be removed in a future version. Specifies a
     * well-formed CPE name. See https://nvd.nist.gov/products/cpe
     */
    cpe?: string;
    /**
     * Specifies a description for the component
     */
    description?: string;
    /**
     * Provides the ability to document evidence collected through various forms of extraction
     * or analysis.
     */
    evidence?:           EvidenceObject;
    externalReferences?: ExternalReferenceObject[];
    /**
     * The grouping name or identifier. This will often be a shortened, single name of the
     * company or project that produced the component, or the source package or domain name.
     * Whitespace and special characters should be avoided. Examples include: apache,
     * org.apache.commons, and apache.org.
     */
    group?:    string;
    hashes?:   HashObject[];
    licenses?: LicenseS[];
    /**
     * The optional mime-type of the component. When used on file components, the mime-type can
     * provide additional context about the kind of file being represented such as an image,
     * font, or executable. Some library or framework components may also have an associated
     * mime-type.
     */
    "mime-type"?: string;
    /**
     * DEPRECATED - DO NOT USE. This will be removed in a future version. Use the pedigree
     * element instead to supply information on exactly how the component was modified. A
     * boolean value indicating is the component has been modified from the original. A value of
     * true indicates the component is a derivative of the original. A value of false indicates
     * the component has not been modified from the original.
     */
    modified?: boolean;
    /**
     * The name of the component. This will often be a shortened, single name of the component.
     * Examples: commons-lang3 and jquery
     */
    name: string;
    /**
     * Component pedigree is a way to document complex supply chain scenarios where components
     * are created, distributed, modified, redistributed, combined with other components, etc.
     * Pedigree supports viewing this complex chain from the beginning, the end, or anywhere in
     * the middle. It also provides a way to document variants where the exact relation may not
     * be known.
     */
    pedigree?: PedigreeObject;
    /**
     * Provides the ability to document properties in a name-value store. This provides
     * flexibility to include data not officially supported in the standard without having to
     * use additional namespaces or create extensions. Unlike key-value stores, properties
     * support duplicate names, each potentially having different values.
     */
    properties?: LightweightNameValuePair[];
    /**
     * The person(s) or organization(s) that published the component
     */
    publisher?: string;
    purl?:      string;
    /**
     * Specifies the scope of the component. If scope is not specified, 'required' scope should
     * be assumed by the consumer of the BOM
     */
    scope?: ComponentScope;
    /**
     * The organization that supplied the component. The supplier may often be the manufacturer,
     * but may also be a distributor or repackager.
     */
    supplier?: ManufactureObject;
    /**
     * Specifies metadata and content for ISO-IEC 19770-2 Software Identification (SWID) Tags.
     */
    swid?: SwidObject;
    /**
     * Specifies the type of component. For software components, classify as application if no
     * more specific appropriate classification is available or cannot be determined for the
     * component.
     */
    type: PurpleComponentType;
    /**
     * The component version. The version should ideally comply with semantic versioning but is
     * not enforced.
     */
    version: string;
    [property: string]: any;
}

/**
 * Specifies an individual commit
 */
export type CommitObject = {
    /**
     * The author who created the changes in the commit
     */
    author?: AuthorObject;
    /**
     * The person who committed or pushed the commit
     */
    committer?: AuthorObject;
    /**
     * The text description of the contents of the commit
     */
    message?: string;
    /**
     * A unique identifier of the commit. This may be version control specific. For example,
     * Subversion uses revision numbers whereas git uses commit hashes.
     */
    uid?: string;
    /**
     * The URL to the commit. This URL will typically point to a commit in a version control
     * system.
     */
    url?: string;
    [property: string]: any;
}

/**
 * The author who created the changes in the commit
 *
 * Specifies an individual commit
 *
 * The person who committed or pushed the commit
 */
export type AuthorObject = {
    /**
     * The email address of the individual who performed the action
     */
    email?: string;
    /**
     * The name of the individual who performed the action
     */
    name?: string;
    /**
     * The timestamp in which the action occurred
     */
    timestamp?: Date;
    [property: string]: any;
}

/**
 * Specifies an individual patch
 */
export type PatchObject = {
    /**
     * The patch file (or diff) that show changes. Refer to https://en.wikipedia.org/wiki/Diff
     */
    diff?: DiffObject;
    /**
     * A collection of issues the patch resolves
     */
    resolves?: ResolveObject[];
    /**
     * Specifies the purpose for the patch including the resolution of defects, security issues,
     * or new behavior or functionality
     */
    type: PatchType;
    [property: string]: any;
}

/**
 * The patch file (or diff) that show changes. Refer to https://en.wikipedia.org/wiki/Diff
 */
export type DiffObject = {
    /**
     * Specifies the optional text of the diff
     */
    text?: TextObject;
    /**
     * Specifies the URL to the diff
     */
    url?: string;
    [property: string]: any;
}

/**
 * An optional way to include the textual content of a license.
 *
 * Specifies the metadata and content for an attachment.
 *
 * Specifies the optional text of the diff
 *
 * Specifies the metadata and content of the SWID tag.
 */
export type TextObject = {
    /**
     * The attachment data
     */
    content: string;
    /**
     * Specifies the content type of the text. Defaults to text/plain if not specified.
     */
    contentType?: string;
    /**
     * Specifies the optional encoding the text is represented in.
     */
    encoding?: Encoding;
    [property: string]: any;
}

/**
 * Specifies the optional encoding the text is represented in.
 */
export type Encoding = "base64";

/**
 * The patch file (or diff) that show changes. Refer to https://en.wikipedia.org/wiki/Diff
 */
export type ResolveObject = {
    /**
     * A description of the issue
     */
    description?: string;
    /**
     * The identifier of the issue assigned by the source of the issue
     */
    id?: string;
    /**
     * The name of the issue
     */
    name?: string;
    /**
     * A collection of URL's for reference. Multiple URLs are allowed.
     */
    references?: string[];
    /**
     * The source of the issue where it is documented
     */
    source?: SourceObject;
    /**
     * Specifies the type of issue
     */
    type: ResolveType;
    [property: string]: any;
}

/**
 * The source of the issue where it is documented
 */
export type SourceObject = {
    /**
     * The name of the source. For example 'National Vulnerability Database', 'NVD', and 'Apache'
     */
    name?: string;
    /**
     * The url of the issue documentation as provided by the source
     */
    url?: string;
    [property: string]: any;
}

/**
 * Specifies the type of issue
 */
export type ResolveType = "defect" | "enhancement" | "security";

/**
 * Specifies the purpose for the patch including the resolution of defects, security issues,
 * or new behavior or functionality
 *
 * Specifies the purpose for the patch including the resolution of defects, security issues,
 * or new behavior or functionality.
 *
 * * __unofficial__ = A patch which is not developed by the creators or maintainers of the
 * software being patched. Refer to
 * [https://en.wikipedia.org/wiki/Unofficial_patch](https://en.wikipedia.org/wiki/Unofficial_patch)
 * * __monkey__ = A patch which dynamically modifies runtime behavior. Refer to
 * [https://en.wikipedia.org/wiki/Monkey_patch](https://en.wikipedia.org/wiki/Monkey_patch)
 * * __backport__ = A patch which takes code from a newer version of software and applies it
 * to older versions of the same software. Refer to
 * [https://en.wikipedia.org/wiki/Backporting](https://en.wikipedia.org/wiki/Backporting)
 * * __cherry-pick__ = A patch created by selectively applying commits from other versions
 * or branches of the same software.
 *
 * Specifies the purpose for the patch including the resolution of defects, security issues,
 * or new behavior or functionality.
 */
export type PatchType = "unofficial" | "monkey" | "backport" | "cherry-pick";

/**
 * Provides the ability to document evidence collected through various forms of extraction
 * or analysis.
 */
export type EvidenceObject = {
    copyright?: CopyrightObject[];
    licenses?:  LicenseS[];
    [property: string]: any;
}

export type CopyrightObject = {
    text: string;
    [property: string]: any;
}

export type LicenseS = {
    expression?: string;
    license?:    LicenseObjectObject;
    [property: string]: any;
}

export type LicenseObjectObject = {
    /**
     * A valid SPDX license ID
     */
    id?: SpdxSchema;
    /**
     * If SPDX does not define the license used, this field may be used to provide the license
     * name
     */
    name?: string;
    /**
     * An optional way to include the textual content of a license.
     */
    text?: TextObject;
    /**
     * The URL to the license file. If specified, a 'license' externalReference should also be
     * specified for completeness
     */
    url?: string;
    [property: string]: any;
}

/**
 * A valid SPDX license ID
 *
 * A valid SPDX license identifier. If specified, this value must be one of the enumeration
 * of valid SPDX license identifiers defined in the spdx.schema.json (or spdx.xml) subschema
 * which is synchronized with the official SPDX license list.
 */
export type SpdxSchema = "0BSD" | "3D-Slicer-1.0" | "AAL" | "Abstyles" | "AdaCore-doc" | "Adobe-2006" | "Adobe-Display-PostScript" | "Adobe-Glyph" | "Adobe-Utopia" | "ADSL" | "AFL-1.1" | "AFL-1.2" | "AFL-2.0" | "AFL-2.1" | "AFL-3.0" | "Afmparse" | "AGPL-1.0" | "AGPL-1.0-only" | "AGPL-1.0-or-later" | "AGPL-3.0" | "AGPL-3.0-only" | "AGPL-3.0-or-later" | "Aladdin" | "AMD-newlib" | "AMDPLPA" | "AML" | "AML-glslang" | "AMPAS" | "ANTLR-PD" | "ANTLR-PD-fallback" | "any-OSI" | "Apache-1.0" | "Apache-1.1" | "Apache-2.0" | "APAFML" | "APL-1.0" | "App-s2p" | "APSL-1.0" | "APSL-1.1" | "APSL-1.2" | "APSL-2.0" | "Arphic-1999" | "Artistic-1.0" | "Artistic-1.0-cl8" | "Artistic-1.0-Perl" | "Artistic-2.0" | "ASWF-Digital-Assets-1.0" | "ASWF-Digital-Assets-1.1" | "Baekmuk" | "Bahyph" | "Barr" | "bcrypt-Solar-Designer" | "Beerware" | "Bitstream-Charter" | "Bitstream-Vera" | "BitTorrent-1.0" | "BitTorrent-1.1" | "blessing" | "BlueOak-1.0.0" | "Boehm-GC" | "Borceux" | "Brian-Gladman-2-Clause" | "Brian-Gladman-3-Clause" | "BSD-1-Clause" | "BSD-2-Clause" | "BSD-2-Clause-Darwin" | "BSD-2-Clause-first-lines" | "BSD-2-Clause-FreeBSD" | "BSD-2-Clause-NetBSD" | "BSD-2-Clause-Patent" | "BSD-2-Clause-Views" | "BSD-3-Clause" | "BSD-3-Clause-acpica" | "BSD-3-Clause-Attribution" | "BSD-3-Clause-Clear" | "BSD-3-Clause-flex" | "BSD-3-Clause-HP" | "BSD-3-Clause-LBNL" | "BSD-3-Clause-Modification" | "BSD-3-Clause-No-Military-License" | "BSD-3-Clause-No-Nuclear-License" | "BSD-3-Clause-No-Nuclear-License-2014" | "BSD-3-Clause-No-Nuclear-Warranty" | "BSD-3-Clause-Open-MPI" | "BSD-3-Clause-Sun" | "BSD-4-Clause" | "BSD-4-Clause-Shortened" | "BSD-4-Clause-UC" | "BSD-4.3RENO" | "BSD-4.3TAHOE" | "BSD-Advertising-Acknowledgement" | "BSD-Attribution-HPND-disclaimer" | "BSD-Inferno-Nettverk" | "BSD-Protection" | "BSD-Source-beginning-file" | "BSD-Source-Code" | "BSD-Systemics" | "BSD-Systemics-W3Works" | "BSL-1.0" | "BUSL-1.1" | "bzip2-1.0.5" | "bzip2-1.0.6" | "C-UDA-1.0" | "CAL-1.0" | "CAL-1.0-Combined-Work-Exception" | "Caldera" | "Caldera-no-preamble" | "Catharon" | "CATOSL-1.1" | "CC-BY-1.0" | "CC-BY-2.0" | "CC-BY-2.5" | "CC-BY-2.5-AU" | "CC-BY-3.0" | "CC-BY-3.0-AT" | "CC-BY-3.0-AU" | "CC-BY-3.0-DE" | "CC-BY-3.0-IGO" | "CC-BY-3.0-NL" | "CC-BY-3.0-US" | "CC-BY-4.0" | "CC-BY-NC-1.0" | "CC-BY-NC-2.0" | "CC-BY-NC-2.5" | "CC-BY-NC-3.0" | "CC-BY-NC-3.0-DE" | "CC-BY-NC-4.0" | "CC-BY-NC-ND-1.0" | "CC-BY-NC-ND-2.0" | "CC-BY-NC-ND-2.5" | "CC-BY-NC-ND-3.0" | "CC-BY-NC-ND-3.0-DE" | "CC-BY-NC-ND-3.0-IGO" | "CC-BY-NC-ND-4.0" | "CC-BY-NC-SA-1.0" | "CC-BY-NC-SA-2.0" | "CC-BY-NC-SA-2.0-DE" | "CC-BY-NC-SA-2.0-FR" | "CC-BY-NC-SA-2.0-UK" | "CC-BY-NC-SA-2.5" | "CC-BY-NC-SA-3.0" | "CC-BY-NC-SA-3.0-DE" | "CC-BY-NC-SA-3.0-IGO" | "CC-BY-NC-SA-4.0" | "CC-BY-ND-1.0" | "CC-BY-ND-2.0" | "CC-BY-ND-2.5" | "CC-BY-ND-3.0" | "CC-BY-ND-3.0-DE" | "CC-BY-ND-4.0" | "CC-BY-SA-1.0" | "CC-BY-SA-2.0" | "CC-BY-SA-2.0-UK" | "CC-BY-SA-2.1-JP" | "CC-BY-SA-2.5" | "CC-BY-SA-3.0" | "CC-BY-SA-3.0-AT" | "CC-BY-SA-3.0-DE" | "CC-BY-SA-3.0-IGO" | "CC-BY-SA-4.0" | "CC-PDDC" | "CC0-1.0" | "CDDL-1.0" | "CDDL-1.1" | "CDL-1.0" | "CDLA-Permissive-1.0" | "CDLA-Permissive-2.0" | "CDLA-Sharing-1.0" | "CECILL-1.0" | "CECILL-1.1" | "CECILL-2.0" | "CECILL-2.1" | "CECILL-B" | "CECILL-C" | "CERN-OHL-1.1" | "CERN-OHL-1.2" | "CERN-OHL-P-2.0" | "CERN-OHL-S-2.0" | "CERN-OHL-W-2.0" | "CFITSIO" | "check-cvs" | "checkmk" | "ClArtistic" | "Clips" | "CMU-Mach" | "CMU-Mach-nodoc" | "CNRI-Jython" | "CNRI-Python" | "CNRI-Python-GPL-Compatible" | "COIL-1.0" | "Community-Spec-1.0" | "Condor-1.1" | "copyleft-next-0.3.0" | "copyleft-next-0.3.1" | "Cornell-Lossless-JPEG" | "CPAL-1.0" | "CPL-1.0" | "CPOL-1.02" | "Cronyx" | "Crossword" | "CrystalStacker" | "CUA-OPL-1.0" | "Cube" | "curl" | "cve-tou" | "D-FSL-1.0" | "DEC-3-Clause" | "diffmark" | "DL-DE-BY-2.0" | "DL-DE-ZERO-2.0" | "DOC" | "Dotseqn" | "DRL-1.0" | "DRL-1.1" | "DSDP" | "dtoa" | "dvipdfm" | "ECL-1.0" | "ECL-2.0" | "eCos-2.0" | "EFL-1.0" | "EFL-2.0" | "eGenix" | "Elastic-2.0" | "Entessa" | "EPICS" | "EPL-1.0" | "EPL-2.0" | "ErlPL-1.1" | "etalab-2.0" | "EUDatagrid" | "EUPL-1.0" | "EUPL-1.1" | "EUPL-1.2" | "Eurosym" | "Fair" | "FBM" | "FDK-AAC" | "Ferguson-Twofish" | "Frameworx-1.0" | "FreeBSD-DOC" | "FreeImage" | "FSFAP" | "FSFAP-no-warranty-disclaimer" | "FSFUL" | "FSFULLR" | "FSFULLRWD" | "FTL" | "Furuseth" | "fwlw" | "GCR-docs" | "GD" | "GFDL-1.1" | "GFDL-1.1-invariants-only" | "GFDL-1.1-invariants-or-later" | "GFDL-1.1-no-invariants-only" | "GFDL-1.1-no-invariants-or-later" | "GFDL-1.1-only" | "GFDL-1.1-or-later" | "GFDL-1.2" | "GFDL-1.2-invariants-only" | "GFDL-1.2-invariants-or-later" | "GFDL-1.2-no-invariants-only" | "GFDL-1.2-no-invariants-or-later" | "GFDL-1.2-only" | "GFDL-1.2-or-later" | "GFDL-1.3" | "GFDL-1.3-invariants-only" | "GFDL-1.3-invariants-or-later" | "GFDL-1.3-no-invariants-only" | "GFDL-1.3-no-invariants-or-later" | "GFDL-1.3-only" | "GFDL-1.3-or-later" | "Giftware" | "GL2PS" | "Glide" | "Glulxe" | "GLWTPL" | "gnuplot" | "GPL-1.0" | "GPL-1.0+" | "GPL-1.0-only" | "GPL-1.0-or-later" | "GPL-2.0" | "GPL-2.0+" | "GPL-2.0-only" | "GPL-2.0-or-later" | "GPL-2.0-with-autoconf-exception" | "GPL-2.0-with-bison-exception" | "GPL-2.0-with-classpath-exception" | "GPL-2.0-with-font-exception" | "GPL-2.0-with-GCC-exception" | "GPL-3.0" | "GPL-3.0+" | "GPL-3.0-only" | "GPL-3.0-or-later" | "GPL-3.0-with-autoconf-exception" | "GPL-3.0-with-GCC-exception" | "Graphics-Gems" | "gSOAP-1.3b" | "gtkbook" | "Gutmann" | "HaskellReport" | "hdparm" | "Hippocratic-2.1" | "HP-1986" | "HP-1989" | "HPND" | "HPND-DEC" | "HPND-doc" | "HPND-doc-sell" | "HPND-export-US" | "HPND-export-US-acknowledgement" | "HPND-export-US-modify" | "HPND-export2-US" | "HPND-Fenneberg-Livingston" | "HPND-INRIA-IMAG" | "HPND-Intel" | "HPND-Kevlin-Henney" | "HPND-Markus-Kuhn" | "HPND-merchantability-variant" | "HPND-MIT-disclaimer" | "HPND-Pbmplus" | "HPND-sell-MIT-disclaimer-xserver" | "HPND-sell-regexpr" | "HPND-sell-variant" | "HPND-sell-variant-MIT-disclaimer" | "HPND-sell-variant-MIT-disclaimer-rev" | "HPND-UC" | "HPND-UC-export-US" | "HTMLTIDY" | "IBM-pibs" | "ICU" | "IEC-Code-Components-EULA" | "IJG" | "IJG-short" | "ImageMagick" | "iMatix" | "Imlib2" | "Info-ZIP" | "Inner-Net-2.0" | "Intel" | "Intel-ACPI" | "Interbase-1.0" | "IPA" | "IPL-1.0" | "ISC" | "ISC-Veillard" | "Jam" | "JasPer-2.0" | "JPL-image" | "JPNIC" | "JSON" | "Kastrup" | "Kazlib" | "Knuth-CTAN" | "LAL-1.2" | "LAL-1.3" | "Latex2e" | "Latex2e-translated-notice" | "Leptonica" | "LGPL-2.0" | "LGPL-2.0+" | "LGPL-2.0-only" | "LGPL-2.0-or-later" | "LGPL-2.1" | "LGPL-2.1+" | "LGPL-2.1-only" | "LGPL-2.1-or-later" | "LGPL-3.0" | "LGPL-3.0+" | "LGPL-3.0-only" | "LGPL-3.0-or-later" | "LGPLLR" | "Libpng" | "libpng-2.0" | "libselinux-1.0" | "libtiff" | "libutil-David-Nugent" | "LiLiQ-P-1.1" | "LiLiQ-R-1.1" | "LiLiQ-Rplus-1.1" | "Linux-man-pages-1-para" | "Linux-man-pages-copyleft" | "Linux-man-pages-copyleft-2-para" | "Linux-man-pages-copyleft-var" | "Linux-OpenIB" | "LOOP" | "LPD-document" | "LPL-1.0" | "LPL-1.02" | "LPPL-1.0" | "LPPL-1.1" | "LPPL-1.2" | "LPPL-1.3a" | "LPPL-1.3c" | "lsof" | "Lucida-Bitmap-Fonts" | "LZMA-SDK-9.11-to-9.20" | "LZMA-SDK-9.22" | "Mackerras-3-Clause" | "Mackerras-3-Clause-acknowledgment" | "magaz" | "mailprio" | "MakeIndex" | "Martin-Birgmeier" | "McPhee-slideshow" | "metamail" | "Minpack" | "MirOS" | "MIT" | "MIT-0" | "MIT-advertising" | "MIT-CMU" | "MIT-enna" | "MIT-feh" | "MIT-Festival" | "MIT-Khronos-old" | "MIT-Modern-Variant" | "MIT-open-group" | "MIT-testregex" | "MIT-Wu" | "MITNFA" | "MMIXware" | "Motosoto" | "MPEG-SSG" | "mpi-permissive" | "mpich2" | "MPL-1.0" | "MPL-1.1" | "MPL-2.0" | "MPL-2.0-no-copyleft-exception" | "mplus" | "MS-LPL" | "MS-PL" | "MS-RL" | "MTLL" | "MulanPSL-1.0" | "MulanPSL-2.0" | "Multics" | "Mup" | "NAIST-2003" | "NASA-1.3" | "Naumen" | "NBPL-1.0" | "NCBI-PD" | "NCGL-UK-2.0" | "NCL" | "NCSA" | "Net-SNMP" | "NetCDF" | "Newsletr" | "NGPL" | "NICTA-1.0" | "NIST-PD" | "NIST-PD-fallback" | "NIST-Software" | "NLOD-1.0" | "NLOD-2.0" | "NLPL" | "Nokia" | "NOSL" | "Noweb" | "NPL-1.0" | "NPL-1.1" | "NPOSL-3.0" | "NRL" | "NTP" | "NTP-0" | "Nunit" | "O-UDA-1.0" | "OAR" | "OCCT-PL" | "OCLC-2.0" | "ODbL-1.0" | "ODC-By-1.0" | "OFFIS" | "OFL-1.0" | "OFL-1.0-no-RFN" | "OFL-1.0-RFN" | "OFL-1.1" | "OFL-1.1-no-RFN" | "OFL-1.1-RFN" | "OGC-1.0" | "OGDL-Taiwan-1.0" | "OGL-Canada-2.0" | "OGL-UK-1.0" | "OGL-UK-2.0" | "OGL-UK-3.0" | "OGTSL" | "OLDAP-1.1" | "OLDAP-1.2" | "OLDAP-1.3" | "OLDAP-1.4" | "OLDAP-2.0" | "OLDAP-2.0.1" | "OLDAP-2.1" | "OLDAP-2.2" | "OLDAP-2.2.1" | "OLDAP-2.2.2" | "OLDAP-2.3" | "OLDAP-2.4" | "OLDAP-2.5" | "OLDAP-2.6" | "OLDAP-2.7" | "OLDAP-2.8" | "OLFL-1.3" | "OML" | "OpenPBS-2.3" | "OpenSSL" | "OpenSSL-standalone" | "OpenVision" | "OPL-1.0" | "OPL-UK-3.0" | "OPUBL-1.0" | "OSET-PL-2.1" | "OSL-1.0" | "OSL-1.1" | "OSL-2.0" | "OSL-2.1" | "OSL-3.0" | "PADL" | "Parity-6.0.0" | "Parity-7.0.0" | "PDDL-1.0" | "PHP-3.0" | "PHP-3.01" | "Pixar" | "pkgconf" | "Plexus" | "pnmstitch" | "PolyForm-Noncommercial-1.0.0" | "PolyForm-Small-Business-1.0.0" | "PostgreSQL" | "PPL" | "PSF-2.0" | "psfrag" | "psutils" | "Python-2.0" | "Python-2.0.1" | "python-ldap" | "Qhull" | "QPL-1.0" | "QPL-1.0-INRIA-2004" | "radvd" | "Rdisc" | "RHeCos-1.1" | "RPL-1.1" | "RPL-1.5" | "RPSL-1.0" | "RSA-MD" | "RSCPL" | "Ruby" | "SAX-PD" | "SAX-PD-2.0" | "Saxpath" | "SCEA" | "SchemeReport" | "Sendmail" | "Sendmail-8.23" | "SGI-B-1.0" | "SGI-B-1.1" | "SGI-B-2.0" | "SGI-OpenGL" | "SGP4" | "SHL-0.5" | "SHL-0.51" | "SimPL-2.0" | "SISSL" | "SISSL-1.2" | "SL" | "Sleepycat" | "SMLNJ" | "SMPPL" | "SNIA" | "snprintf" | "softSurfer" | "Soundex" | "Spencer-86" | "Spencer-94" | "Spencer-99" | "SPL-1.0" | "ssh-keyscan" | "SSH-OpenSSH" | "SSH-short" | "SSLeay-standalone" | "SSPL-1.0" | "StandardML-NJ" | "SugarCRM-1.1.3" | "Sun-PPP" | "Sun-PPP-2000" | "SunPro" | "SWL" | "swrule" | "Symlinks" | "TAPR-OHL-1.0" | "TCL" | "TCP-wrappers" | "TermReadKey" | "TGPPL-1.0" | "threeparttable" | "TMate" | "TORQUE-1.1" | "TOSL" | "TPDL" | "TPL-1.0" | "TTWL" | "TTYP0" | "TU-Berlin-1.0" | "TU-Berlin-2.0" | "UCAR" | "UCL-1.0" | "ulem" | "UMich-Merit" | "Unicode-3.0" | "Unicode-DFS-2015" | "Unicode-DFS-2016" | "Unicode-TOU" | "UnixCrypt" | "Unlicense" | "UPL-1.0" | "URT-RLE" | "Vim" | "VOSTROM" | "VSL-1.0" | "W3C" | "W3C-19980720" | "W3C-20150513" | "w3m" | "Watcom-1.0" | "Widget-Workshop" | "Wsuipa" | "WTFPL" | "wxWindows" | "X11" | "X11-distribute-modifications-variant" | "Xdebug-1.03" | "Xerox" | "Xfig" | "XFree86-1.1" | "xinetd" | "xkeyboard-config-Zinoviev" | "xlock" | "Xnet" | "xpp" | "XSkat" | "xzoom" | "YPL-1.0" | "YPL-1.1" | "Zed" | "Zeeff" | "Zend-2.0" | "Zimbra-1.3" | "Zimbra-1.4" | "Zlib" | "zlib-acknowledgement" | "ZPL-1.1" | "ZPL-2.0" | "ZPL-2.1" | "389-exception" | "Asterisk-exception" | "Asterisk-linking-protocols-exception" | "Autoconf-exception-2.0" | "Autoconf-exception-3.0" | "Autoconf-exception-generic" | "Autoconf-exception-generic-3.0" | "Autoconf-exception-macro" | "Bison-exception-1.24" | "Bison-exception-2.2" | "Bootloader-exception" | "Classpath-exception-2.0" | "CLISP-exception-2.0" | "cryptsetup-OpenSSL-exception" | "DigiRule-FOSS-exception" | "eCos-exception-2.0" | "Fawkes-Runtime-exception" | "FLTK-exception" | "fmt-exception" | "Font-exception-2.0" | "freertos-exception-2.0" | "GCC-exception-2.0" | "GCC-exception-2.0-note" | "GCC-exception-3.1" | "Gmsh-exception" | "GNAT-exception" | "GNOME-examples-exception" | "GNU-compiler-exception" | "gnu-javamail-exception" | "GPL-3.0-interface-exception" | "GPL-3.0-linking-exception" | "GPL-3.0-linking-source-exception" | "GPL-CC-1.0" | "GStreamer-exception-2005" | "GStreamer-exception-2008" | "i2p-gpl-java-exception" | "KiCad-libraries-exception" | "LGPL-3.0-linking-exception" | "libpri-OpenH323-exception" | "Libtool-exception" | "Linux-syscall-note" | "LLGPL" | "LLVM-exception" | "LZMA-exception" | "mif-exception" | "Nokia-Qt-exception-1.1" | "OCaml-LGPL-linking-exception" | "OCCT-exception-1.0" | "OpenJDK-assembly-exception-1.0" | "openvpn-openssl-exception" | "PCRE2-exception" | "PS-or-PDF-font-exception-20170817" | "QPL-1.0-INRIA-2004-exception" | "Qt-GPL-exception-1.0" | "Qt-LGPL-exception-1.1" | "Qwt-exception-1.0" | "RRDtool-FLOSS-exception-2.0" | "SANE-exception" | "SHL-2.0" | "SHL-2.1" | "stunnel-exception" | "SWI-exception" | "Swift-exception" | "Texinfo-exception" | "u-boot-exception-2.0" | "UBDL-exception" | "Universal-FOSS-exception-1.0" | "vsftpd-openssl-exception" | "WxWindows-exception-3.1" | "x11vnc-openssl-exception";

/**
 * Specifies an individual external reference
 */
export type ExternalReferenceObject = {
    /**
     * An optional comment describing the external reference
     */
    comment?: string;
    /**
     * The hashes of the external reference (if applicable).
     */
    hashes?: HashObject[];
    /**
     * Specifies the type of external reference. There are built-in types to describe common
     * references. If a type does not exist for the reference being referred to, use the "other"
     * type.
     */
    type: PurpleType;
    /**
     * The URL to the external reference
     */
    url: string;
    [property: string]: any;
}

export type HashObject = {
    alg:     HashAlgorithm;
    content: string;
    [property: string]: any;
}

/**
 * The algorithm that generated the hash value.
 */
export type HashAlgorithm = "MD5" | "SHA-1" | "SHA-256" | "SHA-384" | "SHA-512" | "SHA3-256" | "SHA3-384" | "SHA3-512" | "BLAKE2b-256" | "BLAKE2b-384" | "BLAKE2b-512" | "BLAKE3";

/**
 * Specifies the type of external reference. There are built-in types to describe common
 * references. If a type does not exist for the reference being referred to, use the "other"
 * type.
 */
export type PurpleType = "vcs" | "issue-tracker" | "website" | "advisories" | "bom" | "mailing-list" | "social" | "chat" | "documentation" | "support" | "distribution" | "license" | "build-meta" | "build-system" | "other";

export type LightweightNameValuePair = {
    /**
     * The name of the property. Duplicate names are allowed, each potentially having a
     * different value.
     */
    name?: string;
    /**
     * The value of the property.
     */
    value?: string;
    [property: string]: any;
}

/**
 * Specifies the scope of the component. If scope is not specified, 'required' scope should
 * be assumed by the consumer of the BOM
 *
 * Specifies the scope of the component. If scope is not specified, 'required' scope SHOULD
 * be assumed by the consumer of the BOM.
 */
export type ComponentScope = "required" | "optional" | "excluded";

/**
 * The organization that supplied the component. The supplier may often be the manufacturer,
 * but may also be a distributor or repackager.
 *
 *
 *
 * The organization that manufactured the component that the BOM describes.
 *
 * The organization that supplied the component that the BOM describes. The supplier may
 * often be the manufacturer, but may also be a distributor or repackager.
 *
 * The organization that provides the service.
 */
export type ManufactureObject = {
    /**
     * A contact at the organization. Multiple contacts are allowed.
     */
    contact?: ContactObject[];
    /**
     * The name of the organization
     */
    name?: string;
    /**
     * The URL of the organization. Multiple URLs are allowed.
     */
    url?: string[];
    [property: string]: any;
}

export type ContactObject = {
    /**
     * The email address of the contact.
     */
    email?: string;
    /**
     * The name of a contact
     */
    name?: string;
    /**
     * The phone number of the contact.
     */
    phone?: string;
    [property: string]: any;
}

/**
 * Specifies metadata and content for ISO-IEC 19770-2 Software Identification (SWID) Tags.
 */
export type SwidObject = {
    /**
     * Maps to the name of a SoftwareIdentity.
     */
    name: string;
    /**
     * Maps to the patch of a SoftwareIdentity.
     */
    patch?: boolean;
    /**
     * Maps to the tagId of a SoftwareIdentity.
     */
    tagId: string;
    /**
     * Maps to the tagVersion of a SoftwareIdentity.
     */
    tagVersion?: number;
    /**
     * Specifies the metadata and content of the SWID tag.
     */
    text?: TextObject;
    /**
     * The URL to the SWID file.
     */
    url?: string;
    /**
     * Maps to the version of a SoftwareIdentity.
     */
    version?: string;
    [property: string]: any;
}

/**
 * Specifies the type of component. For software components, classify as application if no
 * more specific appropriate classification is available or cannot be determined for the
 * component.
 */
export type PurpleComponentType = "application" | "framework" | "library" | "container" | "operating-system" | "device" | "firmware" | "file";

export type CompositionObject = {
    /**
     * Specifies an aggregate type that describe how complete a relationship is.
     */
    aggregate: PurpleAggregateType;
    /**
     * The bom-ref identifiers of the components or services being described. Assemblies refer
     * to nested relationships whereby a constituent part may include other constituent parts.
     * References do not cascade to child parts. References are explicit for the specified
     * constituent part only.
     */
    assemblies?: string[];
    /**
     * The bom-ref identifiers of the components or services being described. Dependencies refer
     * to a relationship whereby an independent constituent part requires another independent
     * constituent part. References do not cascade to transitive dependencies. References are
     * explicit for the specified dependency only.
     */
    dependencies?: string[];
    [property: string]: any;
}

/**
 * Specifies an aggregate type that describe how complete a relationship is.
 */
export type PurpleAggregateType = "complete" | "incomplete" | "incomplete_first_party_only" | "incomplete_third_party_only" | "unknown" | "not_specified";

/**
 * Defines the direct dependencies of a component. Components that do not have their own
 * dependencies MUST be declared as empty elements within the graph. Components that are not
 * represented in the dependency graph MAY have unknown dependencies. It is RECOMMENDED that
 * implementations assume this to be opaque and not an indicator of a component being
 * dependency-free.
 */
export type DependencyObject = {
    /**
     * The bom-ref identifiers of the components that are dependencies of this dependency object.
     */
    dependsOn?: string[];
    /**
     * References a component by the components bom-ref attribute
     */
    ref: string;
    [property: string]: any;
}

/**
 * Provides additional information about a BOM.
 */
export type MetadataObject = {
    /**
     * The person(s) who created the BOM. Authors are common in BOMs created through manual
     * processes. BOMs created through automated means may not have authors.
     */
    authors?: ContactObject[];
    /**
     * The component that the BOM describes.
     */
    component?: ComponentObject;
    licenses?:  LicenseS[];
    /**
     * The organization that manufactured the component that the BOM describes.
     */
    manufacture?: ManufactureObject;
    /**
     * Provides the ability to document properties in a name-value store. This provides
     * flexibility to include data not officially supported in the standard without having to
     * use additional namespaces or create extensions. Unlike key-value stores, properties
     * support duplicate names, each potentially having different values.
     */
    properties?: LightweightNameValuePair[];
    /**
     * The organization that supplied the component that the BOM describes. The supplier may
     * often be the manufacturer, but may also be a distributor or repackager.
     */
    supplier?: ManufactureObject;
    /**
     * The date and time (timestamp) when the document was created.
     */
    timestamp?: Date;
    /**
     * The tool(s) used in the creation of the BOM.
     */
    tools?: ToolElement[];
    [property: string]: any;
}

/**
 * The tool used to create the BOM.
 */
export type ToolElement = {
    /**
     * The hashes of the tool (if applicable).
     */
    hashes?: HashObject[];
    /**
     * The date and time (timestamp) when the document was created.
     */
    name?: string;
    /**
     * The date and time (timestamp) when the document was created.
     */
    vendor?: string;
    /**
     * The date and time (timestamp) when the document was created.
     */
    version?: string;
    [property: string]: any;
}

export type ServiceObject = {
    /**
     * A boolean value indicating if the service requires authentication. A value of true
     * indicates the service requires authentication prior to use. A value of false indicates
     * the service does not require authentication.
     */
    authenticated?: boolean;
    /**
     * An optional identifier which can be used to reference the service elsewhere in the BOM.
     * Every bom-ref should be unique.
     */
    "bom-ref"?: string;
    /**
     * Specifies the data classification.
     */
    data?: DatumObject[];
    /**
     * Specifies a description for the service
     */
    description?: string;
    /**
     * The endpoint URIs of the service. Multiple endpoints are allowed.
     */
    endpoints?:          string[];
    externalReferences?: ExternalReferenceObject[];
    /**
     * The grouping name, namespace, or identifier. This will often be a shortened, single name
     * of the company or project that produced the service or domain name. Whitespace and
     * special characters should be avoided.
     */
    group?:    string;
    licenses?: LicenseS[];
    /**
     * The name of the service. This will often be a shortened, single name of the service.
     */
    name: string;
    /**
     * Provides the ability to document properties in a name-value store. This provides
     * flexibility to include data not officially supported in the standard without having to
     * use additional namespaces or create extensions. Unlike key-value stores, properties
     * support duplicate names, each potentially having different values.
     */
    properties?: LightweightNameValuePair[];
    /**
     * The organization that provides the service.
     */
    provider?: ManufactureObject;
    services?: ServiceObject[];
    /**
     * The service version.
     */
    version?: string;
    /**
     * A boolean value indicating if use of the service crosses a trust zone or boundary. A
     * value of true indicates that by using the service, a trust boundary is crossed. A value
     * of false indicates that by using the service, a trust boundary is not crossed.
     */
    "x-trust-boundary"?: boolean;
    [property: string]: any;
}

export type DatumObject = {
    classification: string;
    flow:           DataFlowDirection;
    [property: string]: any;
}

/**
 * Specifies the flow direction of the data. Direction is relative to the service. Inbound
 * flow states that data enters the service. Outbound flow states that data leaves the
 * service. Bi-directional states that data flows both ways, and unknown states that the
 * direction is not known.
 *
 * Specifies the flow direction of the data. Direction is relative to the service. Inbound
 * flow states that data enters the service. Outbound flow states that data leaves the
 * service. Bi-directional states that data flows both ways and unknown states that the
 * direction is not known.
 *
 * Specifies the flow direction of the data. Direction is relative to the service.
 */
export type DataFlowDirection = "inbound" | "outbound" | "bi-directional" | "unknown";

export type CycloneDXSoftwareBillOfMaterialsStandard = {
    $schema?: Schema;
    /**
     * Comments made by people, organizations, or tools about any object with a bom-ref, such as
     * components, services, vulnerabilities, or the BOM itself. Unlike inventory information,
     * annotations may contain opinion or commentary from various stakeholders. Annotations may
     * be inline (with inventory) or externalized via BOM-Link, and may optionally be signed.
     */
    annotations?: CycloneDXSoftwareBillOfMaterialsStandardAnnotation[];
    /**
     * Specifies the format of the BOM. This helps to identify the file as CycloneDX since BOMs
     * do not have a filename convention nor does JSON schema support namespaces. This value
     * MUST be "CycloneDX".
     */
    bomFormat: BOMFormat;
    /**
     * A list of software and hardware components.
     */
    components?: ComponentClass[];
    /**
     * Compositions describe constituent parts (including components, services, and dependency
     * relationships) and their completeness. The completeness of vulnerabilities expressed in a
     * BOM may also be described.
     */
    compositions?: CycloneDXSoftwareBillOfMaterialsStandardComposition[];
    /**
     * Provides the ability to document dependency relationships.
     */
    dependencies?: CycloneDXSoftwareBillOfMaterialsStandardDependency[];
    /**
     * External references provide a way to document systems, sites, and information that may be
     * relevant, but are not included with the BOM. They may also establish specific
     * relationships within or external to the BOM.
     */
    externalReferences?: CycloneDXSoftwareBillOfMaterialsStandardExternalReference[];
    /**
     * Describes how a component or service was manufactured or deployed. This is achieved
     * through the use of formulas, workflows, tasks, and steps, which declare the precise steps
     * to reproduce along with the observed formulas describing the steps which transpired in
     * the manufacturing process.
     */
    formulation?: CycloneDXSoftwareBillOfMaterialsStandardFormulation[];
    /**
     * Provides additional information about a BOM.
     */
    metadata?: MetadataClass;
    /**
     * Provides the ability to document properties in a name-value store. This provides
     * flexibility to include data not officially supported in the standard without having to
     * use additional namespaces or create extensions. Unlike key-value stores, properties
     * support duplicate names, each potentially having different values. Property names of
     * interest to the general public are encouraged to be registered in the [CycloneDX Property
     * Taxonomy](https://github.com/CycloneDX/cyclonedx-property-taxonomy). Formal registration
     * is OPTIONAL.
     */
    properties?: LightweightNameValuePairObject[];
    /**
     * Every BOM generated SHOULD have a unique serial number, even if the contents of the BOM
     * have not changed over time. If specified, the serial number MUST conform to RFC-4122. Use
     * of serial numbers are RECOMMENDED.
     */
    serialNumber?: string;
    /**
     * A list of services. This may include microservices, function-as-a-service, and other
     * types of network or intra-process services.
     */
    services?: ServiceClass[];
    /**
     * Enveloped signature in [JSON Signature Format
     * (JSF)](https://cyberphone.github.io/doc/security/jsf.html).
     */
    signature?: Signature;
    /**
     * The version of the CycloneDX specification a BOM conforms to (starting at version 1.2).
     */
    specVersion: string;
    /**
     * Whenever an existing BOM is modified, either manually or through automated processes, the
     * version of the BOM SHOULD be incremented by 1. When a system is presented with multiple
     * BOMs with identical serial numbers, the system SHOULD use the most recent version of the
     * BOM. The default version is '1'.
     */
    version?: number;
    /**
     * Vulnerabilities identified in components or services.
     */
    vulnerabilities?: CycloneDXSoftwareBillOfMaterialsStandardVulnerability[];
}

export type Schema = "http://cyclonedx.org/schema/bom-1.5.schema.json";

/**
 * A comment, note, explanation, or similar textual content which provides additional
 * context to the object(s) being annotated.
 */
export type CycloneDXSoftwareBillOfMaterialsStandardAnnotation = {
    /**
     * The organization, person, component, or service which created the textual content of the
     * annotation.
     */
    annotator: PurpleAnnotator;
    /**
     * An optional identifier which can be used to reference the annotation elsewhere in the
     * BOM. Every bom-ref MUST be unique within the BOM.
     */
    "bom-ref"?: string;
    /**
     * Enveloped signature in [JSON Signature Format
     * (JSF)](https://cyberphone.github.io/doc/security/jsf.html).
     */
    signature?: Signature;
    /**
     * The object in the BOM identified by its bom-ref. This is often a component or service,
     * but may be any object type supporting bom-refs.
     */
    subjects: string[];
    /**
     * The textual content of the annotation.
     */
    text: string;
    /**
     * The date and time (timestamp) when the annotation was created.
     */
    timestamp: Date;
}

/**
 * The organization, person, component, or service which created the textual content of the
 * annotation.
 */
export type PurpleAnnotator = {
    /**
     * The tool or component that created the annotation
     */
    component?: ComponentClass;
    /**
     * The person that created the annotation
     */
    individual?: IndividualElement;
    /**
     * The organization that created the annotation
     */
    organization?: ManufactureElement;
    /**
     * The service that created the annotation
     */
    service?: ServiceClass;
}

/**
 * Component pedigree is a way to document complex supply chain scenarios where components
 * are created, distributed, modified, redistributed, combined with other components, etc.
 * Pedigree supports viewing this complex chain from the beginning, the end, or anywhere in
 * the middle. It also provides a way to document variants where the exact relation may not
 * be known.
 */
export type PurpleComponentPedigree = {
    /**
     * Describes zero or more components in which a component is derived from. This is commonly
     * used to describe forks from existing projects where the forked version contains a
     * ancestor node containing the original component it was forked from. For example,
     * Component A is the original component. Component B is the component being used and
     * documented in the BOM. However, Component B contains a pedigree node with a single
     * ancestor documenting Component A - the original component from which Component B is
     * derived from.
     */
    ancestors?: ComponentClass[];
    /**
     * A list of zero or more commits which provide a trail describing how the component
     * deviates from an ancestor, descendant, or variant.
     */
    commits?: PurpleCommit[];
    /**
     * Descendants are the exact opposite of ancestors. This provides a way to document all
     * forks (and their forks) of an original or root component.
     */
    descendants?: ComponentClass[];
    /**
     * Notes, observations, and other non-structured commentary describing the components
     * pedigree.
     */
    notes?: string;
    /**
     * >A list of zero or more patches describing how the component deviates from an ancestor,
     * descendant, or variant. Patches may be complimentary to commits or may be used in place
     * of commits.
     */
    patches?: PurplePatch[];
    /**
     * Variants describe relations where the relationship between the components are not known.
     * For example, if Component A contains nearly identical code to Component B. They are both
     * related, but it is unclear if one is derived from the other, or if they share a common
     * ancestor.
     */
    variants?: ComponentClass[];
}

/**
 * The tool or component that created the annotation
 *
 * The component that the BOM describes.
 */
export type ComponentClass = {
    /**
     * The person(s) or organization(s) that authored the component
     */
    author?: string;
    /**
     * An optional identifier which can be used to reference the component elsewhere in the BOM.
     * Every bom-ref MUST be unique within the BOM.
     */
    "bom-ref"?: string;
    /**
     * A list of software and hardware components included in the parent component. This is not
     * a dependency tree. It provides a way to specify a hierarchical representation of
     * component assemblies, similar to system &#8594; subsystem &#8594; parts assembly in
     * physical supply chains.
     */
    components?: ComponentClass[];
    /**
     * A copyright notice informing users of the underlying claims to copyright ownership in a
     * published work.
     */
    copyright?: string;
    /**
     * Specifies a well-formed CPE name that conforms to the CPE 2.2 or 2.3 specification. See
     * [https://nvd.nist.gov/products/cpe](https://nvd.nist.gov/products/cpe)
     */
    cpe?: string;
    /**
     * This object SHOULD be specified for any component of type `data` and MUST NOT be
     * specified for other component types.
     */
    data?: PurpleComponentData[];
    /**
     * Specifies a description for the component
     */
    description?: string;
    /**
     * Provides the ability to document evidence collected through various forms of extraction
     * or analysis.
     */
    evidence?: PurpleEvidence;
    /**
     * External references provide a way to document systems, sites, and information that may be
     * relevant, but are not included with the BOM. They may also establish specific
     * relationships within or external to the BOM.
     */
    externalReferences?: CycloneDXSoftwareBillOfMaterialsStandardExternalReference[];
    /**
     * The grouping name or identifier. This will often be a shortened, single name of the
     * company or project that produced the component, or the source package or domain name.
     * Whitespace and special characters should be avoided. Examples include: apache,
     * org.apache.commons, and apache.org.
     */
    group?:    string;
    hashes?:   HashClass[];
    licenses?: MultipleLicense[];
    /**
     * The optional mime-type of the component. When used on file components, the mime-type can
     * provide additional context about the kind of file being represented such as an image,
     * font, or executable. Some library or framework components may also have an associated
     * mime-type.
     */
    "mime-type"?: string;
    modelCard?:   PurpleModelCard;
    /**
     * [Deprecated] - DO NOT USE. This will be removed in a future version. Use the pedigree
     * element instead to supply information on exactly how the component was modified. A
     * boolean value indicating if the component has been modified from the original. A value of
     * true indicates the component is a derivative of the original. A value of false indicates
     * the component has not been modified from the original.
     */
    modified?: boolean;
    /**
     * The name of the component. This will often be a shortened, single name of the component.
     * Examples: commons-lang3 and jquery
     */
    name: string;
    /**
     * Component pedigree is a way to document complex supply chain scenarios where components
     * are created, distributed, modified, redistributed, combined with other components, etc.
     * Pedigree supports viewing this complex chain from the beginning, the end, or anywhere in
     * the middle. It also provides a way to document variants where the exact relation may not
     * be known.
     */
    pedigree?: PurpleComponentPedigree;
    /**
     * Provides the ability to document properties in a name-value store. This provides
     * flexibility to include data not officially supported in the standard without having to
     * use additional namespaces or create extensions. Unlike key-value stores, properties
     * support duplicate names, each potentially having different values. Property names of
     * interest to the general public are encouraged to be registered in the [CycloneDX Property
     * Taxonomy](https://github.com/CycloneDX/cyclonedx-property-taxonomy). Formal registration
     * is OPTIONAL.
     */
    properties?: LightweightNameValuePairObject[];
    /**
     * The person(s) or organization(s) that published the component
     */
    publisher?: string;
    /**
     * Specifies the package-url (purl). The purl, if specified, MUST be valid and conform to
     * the specification defined at:
     * [https://github.com/package-url/purl-spec](https://github.com/package-url/purl-spec)
     */
    purl?: string;
    /**
     * Specifies optional release notes.
     */
    releaseNotes?: PurpleReleaseNotes;
    /**
     * Specifies the scope of the component. If scope is not specified, 'required' scope SHOULD
     * be assumed by the consumer of the BOM.
     */
    scope?: ComponentScope;
    /**
     * Enveloped signature in [JSON Signature Format
     * (JSF)](https://cyberphone.github.io/doc/security/jsf.html).
     */
    signature?: Signature;
    /**
     * The organization that supplied the component. The supplier may often be the manufacturer,
     * but may also be a distributor or repackager.
     */
    supplier?: ManufactureElement;
    /**
     * Specifies metadata and content for [ISO-IEC 19770-2 Software Identification (SWID)
     * Tags](https://www.iso.org/standard/65666.html).
     */
    swid?: PurpleSWIDTag;
    /**
     * Specifies the type of component. For software components, classify as application if no
     * more specific appropriate classification is available or cannot be determined for the
     * component. Types include:
     *
     * * __application__ = A software application. Refer to
     * [https://en.wikipedia.org/wiki/Application_software](https://en.wikipedia.org/wiki/Application_software)
     * for information about applications.
     * * __framework__ = A software framework. Refer to
     * [https://en.wikipedia.org/wiki/Software_framework](https://en.wikipedia.org/wiki/Software_framework)
     * for information on how frameworks vary slightly from libraries.
     * * __library__ = A software library. Refer to
     * [https://en.wikipedia.org/wiki/Library_(computing)](https://en.wikipedia.org/wiki/Library_(computing))
     * for information about libraries. All third-party and open source reusable components will
     * likely be a library. If the library also has key features of a framework, then it should
     * be classified as a framework. If not, or is unknown, then specifying library is
     * RECOMMENDED.
     * * __container__ = A packaging and/or runtime format, not specific to any particular
     * technology, which isolates software inside the container from software outside of a
     * container through virtualization technology. Refer to
     * [https://en.wikipedia.org/wiki/OS-level_virtualization](https://en.wikipedia.org/wiki/OS-level_virtualization)
     * * __platform__ = A runtime environment which interprets or executes software. This may
     * include runtimes such as those that execute bytecode or low-code/no-code application
     * platforms.
     * * __operating-system__ = A software operating system without regard to deployment model
     * (i.e. installed on physical hardware, virtual machine, image, etc) Refer to
     * [https://en.wikipedia.org/wiki/Operating_system](https://en.wikipedia.org/wiki/Operating_system)
     * * __device__ = A hardware device such as a processor, or chip-set. A hardware device
     * containing firmware SHOULD include a component for the physical hardware itself, and
     * another component of type 'firmware' or 'operating-system' (whichever is relevant),
     * describing information about the software running on the device.
     * See also the list of [known device
     * properties](https://github.com/CycloneDX/cyclonedx-property-taxonomy/blob/main/cdx/device.md).
     * * __device-driver__ = A special type of software that operates or controls a particular
     * type of device. Refer to
     * [https://en.wikipedia.org/wiki/Device_driver](https://en.wikipedia.org/wiki/Device_driver)
     * * __firmware__ = A special type of software that provides low-level control over a
     * devices hardware. Refer to
     * [https://en.wikipedia.org/wiki/Firmware](https://en.wikipedia.org/wiki/Firmware)
     * * __file__ = A computer file. Refer to
     * [https://en.wikipedia.org/wiki/Computer_file](https://en.wikipedia.org/wiki/Computer_file)
     * for information about files.
     * * __machine-learning-model__ = A model based on training data that can make predictions
     * or decisions without being explicitly programmed to do so.
     * * __data__ = A collection of discrete values that convey information.
     */
    type: FluffyComponentType;
    /**
     * The component version. The version should ideally comply with semantic versioning but is
     * not enforced.
     */
    version?: string;
}

/**
 * Specifies an individual commit
 */
export type PurpleCommit = {
    /**
     * The author who created the changes in the commit
     */
    author?: PurpleIdentifiableAction;
    /**
     * The person who committed or pushed the commit
     */
    committer?: PurpleIdentifiableAction;
    /**
     * The text description of the contents of the commit
     */
    message?: string;
    /**
     * A unique identifier of the commit. This may be version control specific. For example,
     * Subversion uses revision numbers whereas git uses commit hashes.
     */
    uid?: string;
    /**
     * The URL to the commit. This URL will typically point to a commit in a version control
     * system.
     */
    url?: string;
}

/**
 * The author who created the changes in the commit
 *
 * Specifies an individual commit
 *
 * The person who committed or pushed the commit
 */
export type PurpleIdentifiableAction = {
    /**
     * The email address of the individual who performed the action
     */
    email?: string;
    /**
     * The name of the individual who performed the action
     */
    name?: string;
    /**
     * The timestamp in which the action occurred
     */
    timestamp?: Date;
}

/**
 * Specifies an individual patch
 */
export type PurplePatch = {
    /**
     * The patch file (or diff) that show changes. Refer to
     * [https://en.wikipedia.org/wiki/Diff](https://en.wikipedia.org/wiki/Diff)
     */
    diff?: PurpleDiff;
    /**
     * A collection of issues the patch resolves
     */
    resolves?: ResolveClass[];
    /**
     * Specifies the purpose for the patch including the resolution of defects, security issues,
     * or new behavior or functionality.
     *
     * * __unofficial__ = A patch which is not developed by the creators or maintainers of the
     * software being patched. Refer to
     * [https://en.wikipedia.org/wiki/Unofficial_patch](https://en.wikipedia.org/wiki/Unofficial_patch)
     * * __monkey__ = A patch which dynamically modifies runtime behavior. Refer to
     * [https://en.wikipedia.org/wiki/Monkey_patch](https://en.wikipedia.org/wiki/Monkey_patch)
     * * __backport__ = A patch which takes code from a newer version of software and applies it
     * to older versions of the same software. Refer to
     * [https://en.wikipedia.org/wiki/Backporting](https://en.wikipedia.org/wiki/Backporting)
     * * __cherry-pick__ = A patch created by selectively applying commits from other versions
     * or branches of the same software.
     */
    type: PatchType;
}

/**
 * The patch file (or diff) that show changes. Refer to
 * [https://en.wikipedia.org/wiki/Diff](https://en.wikipedia.org/wiki/Diff)
 *
 * The patch file (or diff) that show changes. Refer to https://en.wikipedia.org/wiki/Diff
 */
export type PurpleDiff = {
    /**
     * Specifies the optional text of the diff
     */
    text?: LicenseObjectTextClass;
    /**
     * Specifies the URL to the diff
     */
    url?: string;
}

/**
 * An optional way to include textual or encoded data.
 *
 * Specifies the metadata and content for an attachment.
 *
 * The graphic (vector or raster). Base64 encoding MUST be specified for binary images.
 *
 * An optional way to include the textual content of a license.
 *
 * Specifies the optional text of the diff
 *
 * Specifies the full content of the release note.
 *
 * Specifies the metadata and content of the SWID tag.
 *
 * Inputs that have the form of data.
 *
 * Outputs that have the form of data.
 *
 * Encoding of the raw event data.
 */
export type LicenseObjectTextClass = {
    /**
     * The attachment data. Proactive controls such as input validation and sanitization should
     * be employed to prevent misuse of attachment text.
     */
    content: string;
    /**
     * Specifies the content type of the text. Defaults to text/plain if not specified.
     */
    contentType?: string;
    /**
     * Specifies the optional encoding the text is represented in.
     */
    encoding?: Encoding;
}

/**
 * An individual issue that has been resolved.
 */
export type ResolveClass = {
    /**
     * A description of the issue
     */
    description?: string;
    /**
     * The identifier of the issue assigned by the source of the issue
     */
    id?: string;
    /**
     * The name of the issue
     */
    name?: string;
    /**
     * A collection of URL's for reference. Multiple URLs are allowed.
     */
    references?: string[];
    /**
     * The source of the issue where it is documented
     */
    source?: PurpleSource;
    /**
     * Specifies the type of issue
     */
    type: ResolveType;
}

/**
 * The source of the issue where it is documented
 */
export type PurpleSource = {
    /**
     * The name of the source. For example 'National Vulnerability Database', 'NVD', and 'Apache'
     */
    name?: string;
    /**
     * The url of the issue documentation as provided by the source
     */
    url?: string;
}

export type PurpleComponentData = {
    /**
     * An optional identifier which can be used to reference the dataset elsewhere in the BOM.
     * Every bom-ref MUST be unique within the BOM.
     */
    "bom-ref"?:      string;
    classification?: string;
    /**
     * The contents or references to the contents of the data being described.
     */
    contents?: PurpleDataContents;
    /**
     * A description of the dataset. Can describe size of dataset, whether it's used for source
     * code, training, testing, or validation, etc.
     */
    description?: string;
    governance?:  PurpleDataGovernance;
    graphics?:    PurpleGraphicsCollection;
    /**
     * The name of the dataset.
     */
    name?: string;
    /**
     * A description of any sensitive data in a dataset.
     */
    sensitiveData?: string[];
    /**
     * The general theme or subject matter of the data being specified.
     *
     * * __source-code__ = Any type of code, code snippet, or data-as-code.
     * * __configuration__ = Parameters or settings that may be used by other components.
     * * __dataset__ = A collection of data.
     * * __definition__ = Data that can be used to create new instances of what the definition
     * defines.
     * * __other__ = Any other type of data that does not fit into existing definitions.
     */
    type: TypeOfData;
}

/**
 * The contents or references to the contents of the data being described.
 */
export type PurpleDataContents = {
    /**
     * An optional way to include textual or encoded data.
     */
    attachment?: LicenseObjectTextClass;
    /**
     * Provides the ability to document name-value parameters used for configuration.
     */
    properties?: LightweightNameValuePairObject[];
    /**
     * The URL to where the data can be retrieved.
     */
    url?: string;
}

/**
 * Provides the ability to document properties in a name-value store. This provides
 * flexibility to include data not officially supported in the standard without having to
 * use additional namespaces or create extensions. Unlike key-value stores, properties
 * support duplicate names, each potentially having different values. Property names of
 * interest to the general public are encouraged to be registered in the [CycloneDX Property
 * Taxonomy](https://github.com/CycloneDX/cyclonedx-property-taxonomy). Formal registration
 * is OPTIONAL.
 */
export type LightweightNameValuePairObject = {
    /**
     * The name of the property. Duplicate names are allowed, each potentially having a
     * different value.
     */
    name?: string;
    /**
     * The value of the property.
     */
    value?: string;
    [property: string]: any;
}

export type PurpleDataGovernance = {
    /**
     * Data custodians are responsible for the safe custody, transport, and storage of data.
     */
    custodians?: PurpleDataGovernanceResponsibleParty[];
    /**
     * Data owners are concerned with risk and appropriate access to data.
     */
    owners?: PurpleDataGovernanceResponsibleParty[];
    /**
     * Data stewards are responsible for data content, context, and associated business rules.
     */
    stewards?: PurpleDataGovernanceResponsibleParty[];
}

export type PurpleDataGovernanceResponsibleParty = {
    contact?:      IndividualElement;
    organization?: ManufactureElement;
}

/**
 * The individual, not associated with an organization, that was granted the license
 *
 * The individual, not associated with an organization, that granted the license
 *
 * The individual, not associated with an organization, that purchased the license
 *
 * The person that created the annotation
 */
export type IndividualElement = {
    /**
     * An optional identifier which can be used to reference the object elsewhere in the BOM.
     * Every bom-ref MUST be unique within the BOM.
     */
    "bom-ref"?: string;
    /**
     * The email address of the contact.
     */
    email?: string;
    /**
     * The name of a contact
     */
    name?: string;
    /**
     * The phone number of the contact.
     */
    phone?: string;
}

/**
 * The organization that was granted the license
 *
 * The organization that granted the license
 *
 * The organization that purchased the license
 *
 * The organization that supplied the component. The supplier may often be the manufacturer,
 * but may also be a distributor or repackager.
 *
 * The organization that created the annotation
 *
 * The organization that provides the service.
 *
 * The organization that manufactured the component that the BOM describes.
 *
 * The organization that supplied the component that the BOM describes. The supplier may
 * often be the manufacturer, but may also be a distributor or repackager.
 */
export type ManufactureElement = {
    /**
     * An optional identifier which can be used to reference the object elsewhere in the BOM.
     * Every bom-ref MUST be unique within the BOM.
     */
    "bom-ref"?: string;
    /**
     * A contact at the organization. Multiple contacts are allowed.
     */
    contact?: IndividualElement[];
    /**
     * The name of the organization
     */
    name?: string;
    /**
     * The URL of the organization. Multiple URLs are allowed.
     */
    url?: string[];
}

/**
 * A collection of graphics that represent various measurements.
 */
export type PurpleGraphicsCollection = {
    /**
     * A collection of graphics.
     */
    collection?: Graphic[];
    /**
     * A description of this collection of graphics.
     */
    description?: string;
}

export type Graphic = {
    /**
     * The graphic (vector or raster). Base64 encoding MUST be specified for binary images.
     */
    image?: LicenseObjectTextClass;
    /**
     * The name of the graphic.
     */
    name?: string;
}

/**
 * The general theme or subject matter of the data being specified.
 *
 * * __source-code__ = Any type of code, code snippet, or data-as-code.
 * * __configuration__ = Parameters or settings that may be used by other components.
 * * __dataset__ = A collection of data.
 * * __definition__ = Data that can be used to create new instances of what the definition
 * defines.
 * * __other__ = Any other type of data that does not fit into existing definitions.
 *
 * The general theme or subject matter of the data being specified.
 */
export type TypeOfData = "source-code" | "configuration" | "dataset" | "definition" | "other";

/**
 * Provides the ability to document evidence collected through various forms of extraction
 * or analysis.
 */
export type PurpleEvidence = {
    /**
     * Evidence of the components use through the callstack.
     */
    callstack?: Callstack;
    copyright?: PurpleCopyright[];
    /**
     * Evidence that substantiates the identity of a component.
     */
    identity?: Identity;
    licenses?: MultipleLicense[];
    /**
     * Evidence of individual instances of a component spread across multiple locations.
     */
    occurrences?: PurpleOccurrence[];
}

/**
 * Evidence of the components use through the callstack.
 */
export type Callstack = {
    frames?: FrameElement[];
}

export type FrameElement = {
    /**
     * The column the code that is called resides.
     */
    column?: number;
    /**
     * The full path and filename of the module.
     */
    fullFilename?: string;
    /**
     * A block of code designed to perform a particular task.
     */
    function?: string;
    /**
     * The line number the code that is called resides on.
     */
    line?: number;
    /**
     * A module or class that encloses functions/methods and other code.
     */
    module: string;
    /**
     * A package organizes modules into namespaces, providing a unique namespace for each type
     * it contains.
     */
    package?: string;
    /**
     * Optional arguments that are passed to the module or function.
     */
    parameters?: string[];
}

export type PurpleCopyright = {
    text: string;
}

/**
 * Evidence that substantiates the identity of a component.
 */
export type Identity = {
    /**
     * The overall confidence of the evidence from 0 - 1, where 1 is 100% confidence.
     */
    confidence?: number;
    /**
     * The identity field of the component which the evidence describes.
     */
    field: IdentityField;
    /**
     * The methods used to extract and/or analyze the evidence.
     */
    methods?: IdentityMethod[];
    /**
     * The object in the BOM identified by its bom-ref. This is often a component or service,
     * but may be any object type supporting bom-refs. Tools used for analysis should already be
     * defined in the BOM, either in the metadata/tools, components, or formulation.
     */
    tools?: string[];
}

/**
 * The identity field of the component which the evidence describes.
 */
export type IdentityField = "group" | "name" | "version" | "purl" | "cpe" | "swid" | "hash";

export type IdentityMethod = {
    /**
     * The confidence of the evidence from 0 - 1, where 1 is 100% confidence. Confidence is
     * specific to the technique used. Each technique of analysis can have independent
     * confidence.
     */
    confidence: number;
    /**
     * The technique used in this method of analysis.
     */
    technique: Technique;
    /**
     * The value or contents of the evidence.
     */
    value?: string;
}

/**
 * The technique used in this method of analysis.
 */
export type Technique = "source-code-analysis" | "binary-analysis" | "manifest-analysis" | "ast-fingerprint" | "hash-comparison" | "instrumentation" | "dynamic-analysis" | "filename" | "attestation" | "other";

/**
 * A list of SPDX licenses and/or named licenses.
 *
 * A tuple of exactly one SPDX License Expression.
 */
export type MultipleLicense = {
    license?: LicenseObjectClass;
    /**
     * An optional identifier which can be used to reference the license elsewhere in the BOM.
     * Every bom-ref MUST be unique within the BOM.
     */
    "bom-ref"?:  string;
    expression?: string;
}

export type LicenseObjectClass = {
    /**
     * An optional identifier which can be used to reference the license elsewhere in the BOM.
     * Every bom-ref MUST be unique within the BOM.
     */
    "bom-ref"?: string;
    /**
     * A valid SPDX license ID
     */
    id?: SpdxSchema;
    /**
     * Licensing details describing the licensor/licensee, license type, renewal and expiration
     * dates, and other important metadata
     */
    licensing?: LicenseObjectLicensing;
    /**
     * If SPDX does not define the license used, this field may be used to provide the license
     * name
     */
    name?: string;
    /**
     * Provides the ability to document properties in a name-value store. This provides
     * flexibility to include data not officially supported in the standard without having to
     * use additional namespaces or create extensions. Unlike key-value stores, properties
     * support duplicate names, each potentially having different values. Property names of
     * interest to the general public are encouraged to be registered in the [CycloneDX Property
     * Taxonomy](https://github.com/CycloneDX/cyclonedx-property-taxonomy). Formal registration
     * is OPTIONAL.
     */
    properties?: LightweightNameValuePairObject[];
    /**
     * An optional way to include the textual content of a license.
     */
    text?: LicenseObjectTextClass;
    /**
     * The URL to the license file. If specified, a 'license' externalReference should also be
     * specified for completeness
     */
    url?: string;
}

/**
 * Licensing details describing the licensor/licensee, license type, renewal and expiration
 * dates, and other important metadata
 */
export type LicenseObjectLicensing = {
    /**
     * License identifiers that may be used to manage licenses and their lifecycle
     */
    altIds?: string[];
    /**
     * The timestamp indicating when the current license expires (if applicable).
     */
    expiration?: Date;
    /**
     * The timestamp indicating when the license was last renewed. For new purchases, this is
     * often the purchase or acquisition date. For non-perpetual licenses or subscriptions, this
     * is the timestamp of when the license was last renewed.
     */
    lastRenewal?: Date;
    /**
     * The individual or organization for which a license was granted to
     */
    licensee?: PurpleLicensee;
    /**
     * The type of license(s) that was granted to the licensee
     *
     * * __academic__ = A license that grants use of software solely for the purpose of
     * education or research.
     * * __appliance__ = A license covering use of software embedded in a specific piece of
     * hardware.
     * * __client-access__ = A Client Access License (CAL) allows client computers to access
     * services provided by server software.
     * * __concurrent-user__ = A Concurrent User license (aka floating license) limits the
     * number of licenses for a software application and licenses are shared among a larger
     * number of users.
     * * __core-points__ = A license where the core of a computer's processor is assigned a
     * specific number of points.
     * * __custom-metric__ = A license for which consumption is measured by non-standard
     * metrics.
     * * __device__ = A license that covers a defined number of installations on computers and
     * other types of devices.
     * * __evaluation__ = A license that grants permission to install and use software for trial
     * purposes.
     * * __named-user__ = A license that grants access to the software to one or more
     * pre-defined users.
     * * __node-locked__ = A license that grants access to the software on one or more
     * pre-defined computers or devices.
     * * __oem__ = An Original Equipment Manufacturer license that is delivered with hardware,
     * cannot be transferred to other hardware, and is valid for the life of the hardware.
     * * __perpetual__ = A license where the software is sold on a one-time basis and the
     * licensee can use a copy of the software indefinitely.
     * * __processor-points__ = A license where each installation consumes points per processor.
     * * __subscription__ = A license where the licensee pays a fee to use the software or
     * service.
     * * __user__ = A license that grants access to the software or service by a specified
     * number of users.
     * * __other__ = Another license type.
     */
    licenseTypes?: LicenseType[];
    /**
     * The individual or organization that grants a license to another individual or organization
     */
    licensor?: PurpleLicensor;
    /**
     * The purchase order identifier the purchaser sent to a supplier or vendor to authorize a
     * purchase
     */
    purchaseOrder?: string;
    /**
     * The individual or organization that purchased the license
     */
    purchaser?: PurplePurchaser;
}

export type LicenseType = "academic" | "appliance" | "client-access" | "concurrent-user" | "core-points" | "custom-metric" | "device" | "evaluation" | "named-user" | "node-locked" | "oem" | "perpetual" | "processor-points" | "subscription" | "user" | "other";

/**
 * The individual or organization for which a license was granted to
 */
export type PurpleLicensee = {
    /**
     * The individual, not associated with an organization, that was granted the license
     */
    individual?: IndividualElement;
    /**
     * The organization that was granted the license
     */
    organization?: ManufactureElement;
}

/**
 * The individual or organization that grants a license to another individual or organization
 */
export type PurpleLicensor = {
    /**
     * The individual, not associated with an organization, that granted the license
     */
    individual?: IndividualElement;
    /**
     * The organization that granted the license
     */
    organization?: ManufactureElement;
}

/**
 * The individual or organization that purchased the license
 */
export type PurplePurchaser = {
    /**
     * The individual, not associated with an organization, that purchased the license
     */
    individual?: IndividualElement;
    /**
     * The organization that purchased the license
     */
    organization?: ManufactureElement;
}

export type PurpleOccurrence = {
    /**
     * An optional identifier which can be used to reference the occurrence elsewhere in the
     * BOM. Every bom-ref MUST be unique within the BOM.
     */
    "bom-ref"?: string;
    /**
     * The location or path to where the component was found.
     */
    location: string;
}

/**
 * External references provide a way to document systems, sites, and information that may be
 * relevant, but are not included with the BOM. They may also establish specific
 * relationships within or external to the BOM.
 *
 * Reference to an externally accessible resource.
 */
export type CycloneDXSoftwareBillOfMaterialsStandardExternalReference = {
    /**
     * An optional comment describing the external reference
     */
    comment?: string;
    /**
     * The hashes of the external reference (if applicable).
     */
    hashes?: HashClass[];
    /**
     * Specifies the type of external reference.
     *
     * * __vcs__ = Version Control System
     * * __issue-tracker__ = Issue or defect tracking system, or an Application Lifecycle
     * Management (ALM) system
     * * __website__ = Website
     * * __advisories__ = Security advisories
     * * __bom__ = Bill of Materials (SBOM, OBOM, HBOM, SaaSBOM, etc)
     * * __mailing-list__ = Mailing list or discussion group
     * * __social__ = Social media account
     * * __chat__ = Real-time chat platform
     * * __documentation__ = Documentation, guides, or how-to instructions
     * * __support__ = Community or commercial support
     * * __distribution__ = Direct or repository download location
     * * __distribution-intake__ = The location where a component was published to. This is
     * often the same as "distribution" but may also include specialized publishing processes
     * that act as an intermediary
     * * __license__ = The URL to the license file. If a license URL has been defined in the
     * license node, it should also be defined as an external reference for completeness
     * * __build-meta__ = Build-system specific meta file (i.e. pom.xml, package.json, .nuspec,
     * etc)
     * * __build-system__ = URL to an automated build system
     * * __release-notes__ = URL to release notes
     * * __security-contact__ = Specifies a way to contact the maintainer, supplier, or provider
     * in the event of a security incident. Common URIs include links to a disclosure procedure,
     * a mailto (RFC-2368) that specifies an email address, a tel (RFC-3966) that specifies a
     * phone number, or dns (RFC-4501) that specifies the records containing DNS Security TXT
     * * __model-card__ = A model card describes the intended uses of a machine learning model,
     * potential limitations, biases, ethical considerations, training parameters, datasets used
     * to train the model, performance metrics, and other relevant data useful for ML
     * transparency
     * * __log__ = A record of events that occurred in a computer system or application, such as
     * problems, errors, or information on current operations
     * * __configuration__ = Parameters or settings that may be used by other components or
     * services
     * * __evidence__ = Information used to substantiate a claim
     * * __formulation__ = Describes how a component or service was manufactured or deployed
     * * __attestation__ = Human or machine-readable statements containing facts, evidence, or
     * testimony
     * * __threat-model__ = An enumeration of identified weaknesses, threats, and
     * countermeasures, dataflow diagram (DFD), attack tree, and other supporting documentation
     * in human-readable or machine-readable format
     * * __adversary-model__ = The defined assumptions, goals, and capabilities of an adversary.
     * * __risk-assessment__ = Identifies and analyzes the potential of future events that may
     * negatively impact individuals, assets, and/or the environment. Risk assessments may also
     * include judgments on the tolerability of each risk.
     * * __vulnerability-assertion__ = A Vulnerability Disclosure Report (VDR) which asserts the
     * known and previously unknown vulnerabilities that affect a component, service, or product
     * including the analysis and findings describing the impact (or lack of impact) that the
     * reported vulnerability has on a component, service, or product.
     * * __exploitability-statement__ = A Vulnerability Exploitability eXchange (VEX) which
     * asserts the known vulnerabilities that do not affect a product, product family, or
     * organization, and optionally the ones that do. The VEX should include the analysis and
     * findings describing the impact (or lack of impact) that the reported vulnerability has on
     * the product, product family, or organization.
     * * __pentest-report__ = Results from an authorized simulated cyberattack on a component or
     * service, otherwise known as a penetration test
     * * __static-analysis-report__ = SARIF or proprietary machine or human-readable report for
     * which static analysis has identified code quality, security, and other potential issues
     * with the source code
     * * __dynamic-analysis-report__ = Dynamic analysis report that has identified issues such
     * as vulnerabilities and misconfigurations
     * * __runtime-analysis-report__ = Report generated by analyzing the call stack of a running
     * application
     * * __component-analysis-report__ = Report generated by Software Composition Analysis
     * (SCA), container analysis, or other forms of component analysis
     * * __maturity-report__ = Report containing a formal assessment of an organization,
     * business unit, or team against a maturity model
     * * __certification-report__ = Industry, regulatory, or other certification from an
     * accredited (if applicable) certification body
     * * __quality-metrics__ = Report or system in which quality metrics can be obtained
     * * __codified-infrastructure__ = Code or configuration that defines and provisions
     * virtualized infrastructure, commonly referred to as Infrastructure as Code (IaC)
     * * __poam__ = Plans of Action and Milestones (POAM) compliment an "attestation" external
     * reference. POAM is defined by NIST as a "document that identifies tasks needing to be
     * accomplished. It details resources required to accomplish the elements of the plan, any
     * milestones in meeting the tasks and scheduled completion dates for the milestones".
     * * __other__ = Use this if no other types accurately describe the purpose of the external
     * reference
     */
    type: FluffyType;
    /**
     * The URI (URL or URN) to the external reference. External references are URIs and
     * therefore can accept any URL scheme including https
     * ([RFC-7230](https://www.ietf.org/rfc/rfc7230.txt)), mailto
     * ([RFC-2368](https://www.ietf.org/rfc/rfc2368.txt)), tel
     * ([RFC-3966](https://www.ietf.org/rfc/rfc3966.txt)), and dns
     * ([RFC-4501](https://www.ietf.org/rfc/rfc4501.txt)). External references may also include
     * formally registered URNs such as [CycloneDX
     * BOM-Link](https://cyclonedx.org/capabilities/bomlink/) to reference CycloneDX BOMs or any
     * object within a BOM. BOM-Link transforms applicable external references into
     * relationships that can be expressed in a BOM or across BOMs.
     */
    url: string;
}

export type HashClass = {
    alg:     HashAlgorithm;
    content: string;
}

/**
 * Specifies the type of external reference.
 *
 * * __vcs__ = Version Control System
 * * __issue-tracker__ = Issue or defect tracking system, or an Application Lifecycle
 * Management (ALM) system
 * * __website__ = Website
 * * __advisories__ = Security advisories
 * * __bom__ = Bill of Materials (SBOM, OBOM, HBOM, SaaSBOM, etc)
 * * __mailing-list__ = Mailing list or discussion group
 * * __social__ = Social media account
 * * __chat__ = Real-time chat platform
 * * __documentation__ = Documentation, guides, or how-to instructions
 * * __support__ = Community or commercial support
 * * __distribution__ = Direct or repository download location
 * * __distribution-intake__ = The location where a component was published to. This is
 * often the same as "distribution" but may also include specialized publishing processes
 * that act as an intermediary
 * * __license__ = The URL to the license file. If a license URL has been defined in the
 * license node, it should also be defined as an external reference for completeness
 * * __build-meta__ = Build-system specific meta file (i.e. pom.xml, package.json, .nuspec,
 * etc)
 * * __build-system__ = URL to an automated build system
 * * __release-notes__ = URL to release notes
 * * __security-contact__ = Specifies a way to contact the maintainer, supplier, or provider
 * in the event of a security incident. Common URIs include links to a disclosure procedure,
 * a mailto (RFC-2368) that specifies an email address, a tel (RFC-3966) that specifies a
 * phone number, or dns (RFC-4501) that specifies the records containing DNS Security TXT
 * * __model-card__ = A model card describes the intended uses of a machine learning model,
 * potential limitations, biases, ethical considerations, training parameters, datasets used
 * to train the model, performance metrics, and other relevant data useful for ML
 * transparency
 * * __log__ = A record of events that occurred in a computer system or application, such as
 * problems, errors, or information on current operations
 * * __configuration__ = Parameters or settings that may be used by other components or
 * services
 * * __evidence__ = Information used to substantiate a claim
 * * __formulation__ = Describes how a component or service was manufactured or deployed
 * * __attestation__ = Human or machine-readable statements containing facts, evidence, or
 * testimony
 * * __threat-model__ = An enumeration of identified weaknesses, threats, and
 * countermeasures, dataflow diagram (DFD), attack tree, and other supporting documentation
 * in human-readable or machine-readable format
 * * __adversary-model__ = The defined assumptions, goals, and capabilities of an adversary.
 * * __risk-assessment__ = Identifies and analyzes the potential of future events that may
 * negatively impact individuals, assets, and/or the environment. Risk assessments may also
 * include judgments on the tolerability of each risk.
 * * __vulnerability-assertion__ = A Vulnerability Disclosure Report (VDR) which asserts the
 * known and previously unknown vulnerabilities that affect a component, service, or product
 * including the analysis and findings describing the impact (or lack of impact) that the
 * reported vulnerability has on a component, service, or product.
 * * __exploitability-statement__ = A Vulnerability Exploitability eXchange (VEX) which
 * asserts the known vulnerabilities that do not affect a product, product family, or
 * organization, and optionally the ones that do. The VEX should include the analysis and
 * findings describing the impact (or lack of impact) that the reported vulnerability has on
 * the product, product family, or organization.
 * * __pentest-report__ = Results from an authorized simulated cyberattack on a component or
 * service, otherwise known as a penetration test
 * * __static-analysis-report__ = SARIF or proprietary machine or human-readable report for
 * which static analysis has identified code quality, security, and other potential issues
 * with the source code
 * * __dynamic-analysis-report__ = Dynamic analysis report that has identified issues such
 * as vulnerabilities and misconfigurations
 * * __runtime-analysis-report__ = Report generated by analyzing the call stack of a running
 * application
 * * __component-analysis-report__ = Report generated by Software Composition Analysis
 * (SCA), container analysis, or other forms of component analysis
 * * __maturity-report__ = Report containing a formal assessment of an organization,
 * business unit, or team against a maturity model
 * * __certification-report__ = Industry, regulatory, or other certification from an
 * accredited (if applicable) certification body
 * * __quality-metrics__ = Report or system in which quality metrics can be obtained
 * * __codified-infrastructure__ = Code or configuration that defines and provisions
 * virtualized infrastructure, commonly referred to as Infrastructure as Code (IaC)
 * * __poam__ = Plans of Action and Milestones (POAM) compliment an "attestation" external
 * reference. POAM is defined by NIST as a "document that identifies tasks needing to be
 * accomplished. It details resources required to accomplish the elements of the plan, any
 * milestones in meeting the tasks and scheduled completion dates for the milestones".
 * * __other__ = Use this if no other types accurately describe the purpose of the external
 * reference
 */
export type FluffyType = "vcs" | "issue-tracker" | "website" | "advisories" | "bom" | "mailing-list" | "social" | "chat" | "documentation" | "support" | "distribution" | "distribution-intake" | "license" | "build-meta" | "build-system" | "release-notes" | "security-contact" | "model-card" | "log" | "configuration" | "evidence" | "formulation" | "attestation" | "threat-model" | "adversary-model" | "risk-assessment" | "vulnerability-assertion" | "exploitability-statement" | "pentest-report" | "static-analysis-report" | "dynamic-analysis-report" | "runtime-analysis-report" | "component-analysis-report" | "maturity-report" | "certification-report" | "codified-infrastructure" | "quality-metrics" | "poam" | "other";

/**
 * A model card describes the intended uses of a machine learning model and potential
 * limitations, including biases and ethical considerations. Model cards typically contain
 * the training parameters, which datasets were used to train the model, performance
 * metrics, and other relevant data useful for ML transparency. This object SHOULD be
 * specified for any component of type `machine-learning-model` and MUST NOT be specified
 * for other component types.
 */
export type PurpleModelCard = {
    /**
     * An optional identifier which can be used to reference the model card elsewhere in the
     * BOM. Every bom-ref MUST be unique within the BOM.
     */
    "bom-ref"?: string;
    /**
     * What considerations should be taken into account regarding the model's construction,
     * training, and application?
     */
    considerations?: PurpleConsiderations;
    /**
     * Hyper-parameters for construction of the model.
     */
    modelParameters?: PurpleModelParameters;
    /**
     * Provides the ability to document properties in a name-value store. This provides
     * flexibility to include data not officially supported in the standard without having to
     * use additional namespaces or create extensions. Unlike key-value stores, properties
     * support duplicate names, each potentially having different values. Property names of
     * interest to the general public are encouraged to be registered in the [CycloneDX Property
     * Taxonomy](https://github.com/CycloneDX/cyclonedx-property-taxonomy). Formal registration
     * is OPTIONAL.
     */
    properties?: LightweightNameValuePairObject[];
    /**
     * A quantitative analysis of the model
     */
    quantitativeAnalysis?: PurpleQuantitativeAnalysis;
}

/**
 * What considerations should be taken into account regarding the model's construction,
 * training, and application?
 */
export type PurpleConsiderations = {
    /**
     * What are the ethical (or environmental) risks involved in the application of this model?
     */
    ethicalConsiderations?: Risk[];
    /**
     * How does the model affect groups at risk of being systematically disadvantaged? What are
     * the harms and benefits to the various affected groups?
     */
    fairnessAssessments?: PurpleFairnessAssessment[];
    /**
     * What are the known tradeoffs in accuracy/performance of the model?
     */
    performanceTradeoffs?: string[];
    /**
     * What are the known technical limitations of the model? E.g. What kind(s) of data should
     * the model be expected not to perform well on? What are the factors that might degrade
     * model performance?
     */
    technicalLimitations?: string[];
    /**
     * What are the intended use cases of the model?
     */
    useCases?: string[];
    /**
     * Who are the intended users of the model?
     */
    users?: string[];
}

export type Risk = {
    /**
     * Strategy used to address this risk.
     */
    mitigationStrategy?: string;
    /**
     * The name of the risk.
     */
    name?: string;
}

/**
 * Information about the benefits and harms of the model to an identified at risk group.
 */
export type PurpleFairnessAssessment = {
    /**
     * Expected benefits to the identified groups.
     */
    benefits?: string;
    /**
     * The groups or individuals at risk of being systematically disadvantaged by the model.
     */
    groupAtRisk?: string;
    /**
     * Expected harms to the identified groups.
     */
    harms?: string;
    /**
     * With respect to the benefits and harms outlined, please describe any mitigation strategy
     * implemented.
     */
    mitigationStrategy?: string;
}

/**
 * Hyper-parameters for construction of the model.
 */
export type PurpleModelParameters = {
    /**
     * The overall approach to learning used by the model for problem solving.
     */
    approach?: PurpleApproach;
    /**
     * The model architecture family such as transformer network, convolutional neural network,
     * residual neural network, LSTM neural network, etc.
     */
    architectureFamily?: string;
    /**
     * The datasets used to train and evaluate the model.
     */
    datasets?: PurpleDataset[];
    /**
     * The input format(s) of the model
     */
    inputs?: PurpleInputAndOutputParameters[];
    /**
     * The specific architecture of the model such as GPT-1, ResNet-50, YOLOv3, etc.
     */
    modelArchitecture?: string;
    /**
     * The output format(s) from the model
     */
    outputs?: PurpleInputAndOutputParameters[];
    /**
     * Directly influences the input and/or output. Examples include classification, regression,
     * clustering, etc.
     */
    task?: string;
}

/**
 * The overall approach to learning used by the model for problem solving.
 */
export type PurpleApproach = {
    /**
     * Learning types describing the learning problem or hybrid learning problem.
     */
    type?: LearningType;
}

/**
 * Learning types describing the learning problem or hybrid learning problem.
 */
export type LearningType = "supervised" | "unsupervised" | "reinforcement-learning" | "semi-supervised" | "self-supervised";

export type PurpleDataset = {
    /**
     * An optional identifier which can be used to reference the dataset elsewhere in the BOM.
     * Every bom-ref MUST be unique within the BOM.
     */
    "bom-ref"?:      string;
    classification?: string;
    /**
     * The contents or references to the contents of the data being described.
     */
    contents?: PurpleDataContents;
    /**
     * A description of the dataset. Can describe size of dataset, whether it's used for source
     * code, training, testing, or validation, etc.
     */
    description?: string;
    governance?:  PurpleDataGovernance;
    graphics?:    PurpleGraphicsCollection;
    /**
     * The name of the dataset.
     */
    name?: string;
    /**
     * A description of any sensitive data in a dataset.
     */
    sensitiveData?: string[];
    /**
     * The general theme or subject matter of the data being specified.
     *
     * * __source-code__ = Any type of code, code snippet, or data-as-code.
     * * __configuration__ = Parameters or settings that may be used by other components.
     * * __dataset__ = A collection of data.
     * * __definition__ = Data that can be used to create new instances of what the definition
     * defines.
     * * __other__ = Any other type of data that does not fit into existing definitions.
     */
    type?: TypeOfData;
    /**
     * References a data component by the components bom-ref attribute
     */
    ref?: string;
}

export type PurpleInputAndOutputParameters = {
    /**
     * The data format for input/output to the model. Example formats include string, image,
     * time-series
     */
    format?: string;
}

/**
 * A quantitative analysis of the model
 */
export type PurpleQuantitativeAnalysis = {
    graphics?: PurpleGraphicsCollection;
    /**
     * The model performance metrics being reported. Examples may include accuracy, F1 score,
     * precision, top-3 error rates, MSC, etc.
     */
    performanceMetrics?: PerformanceMetric[];
}

export type PerformanceMetric = {
    /**
     * The confidence interval of the metric.
     */
    confidenceInterval?: ConfidenceInterval;
    /**
     * The name of the slice this metric was computed on. By default, assume this metric is not
     * sliced.
     */
    slice?: string;
    /**
     * The type of performance metric.
     */
    type?: string;
    /**
     * The value of the performance metric.
     */
    value?: string;
}

/**
 * The confidence interval of the metric.
 */
export type ConfidenceInterval = {
    /**
     * The lower bound of the confidence interval.
     */
    lowerBound?: string;
    /**
     * The upper bound of the confidence interval.
     */
    upperBound?: string;
}

/**
 * Specifies optional release notes.
 */
export type PurpleReleaseNotes = {
    /**
     * One or more alternate names the release may be referred to. This may include unofficial
     * terms used by development and marketing teams (e.g. code names).
     */
    aliases?: string[];
    /**
     * A short description of the release.
     */
    description?: string;
    /**
     * The URL to an image that may be prominently displayed with the release note.
     */
    featuredImage?: string;
    /**
     * Zero or more release notes containing the locale and content. Multiple note objects may
     * be specified to support release notes in a wide variety of languages.
     */
    notes?: PurpleNote[];
    /**
     * Provides the ability to document properties in a name-value store. This provides
     * flexibility to include data not officially supported in the standard without having to
     * use additional namespaces or create extensions. Unlike key-value stores, properties
     * support duplicate names, each potentially having different values. Property names of
     * interest to the general public are encouraged to be registered in the [CycloneDX Property
     * Taxonomy](https://github.com/CycloneDX/cyclonedx-property-taxonomy). Formal registration
     * is OPTIONAL.
     */
    properties?: LightweightNameValuePairObject[];
    /**
     * A collection of issues that have been resolved.
     */
    resolves?: ResolveClass[];
    /**
     * The URL to an image that may be used in messaging on social media platforms.
     */
    socialImage?: string;
    /**
     * One or more tags that may aid in search or retrieval of the release note.
     */
    tags?: string[];
    /**
     * The date and time (timestamp) when the release note was created.
     */
    timestamp?: Date;
    /**
     * The title of the release.
     */
    title?: string;
    /**
     * The software versioning type the release note describes.
     */
    type: string;
}

/**
 * A note containing the locale and content.
 */
export type PurpleNote = {
    /**
     * The ISO-639 (or higher) language code and optional ISO-3166 (or higher) country code.
     * Examples include: "en", "en-US", "fr" and "fr-CA"
     */
    locale?: string;
    /**
     * Specifies the full content of the release note.
     */
    text: LicenseObjectTextClass;
}

/**
 * Enveloped signature in [JSON Signature Format
 * (JSF)](https://cyberphone.github.io/doc/security/jsf.html).
 *
 * Unique top level property for simple signatures. (signaturecore)
 */
export type Signature = {
    /**
     * Unique top level property for Multiple Signatures. (multisignature)
     */
    signers?: ChainElement[];
    /**
     * Unique top level property for Signature Chains. (signaturechain)
     */
    chain?:     ChainElement[];
    algorithm?: string;
    /**
     * Optional. Sorted array of X.509 [RFC5280] certificates, where the first element must
     * contain the signature certificate. The certificate path must be contiguous but is not
     * required to be complete.
     */
    certificatePath?: string[];
    /**
     * Optional. Array holding the names of one or more application level properties that must
     * be excluded from the signature process. Note that the "excludes" property itself, must
     * also be excluded from the signature process. Since both the "excludes" property and the
     * associated data it points to are unsigned, a conforming JSF implementation must provide
     * options for specifying which properties to accept.
     */
    excludes?: string[];
    /**
     * Optional. Application specific string identifying the signature key.
     */
    keyId?: string;
    /**
     * Optional. Public key object.
     */
    publicKey?: PublicKey;
    /**
     * The signature data. Note that the binary representation must follow the JWA [RFC7518]
     * specifications.
     */
    value?: string;
}

/**
 * Unique top level property for simple signatures. (signaturecore)
 */
export type ChainElement = {
    algorithm: string;
    /**
     * Optional. Sorted array of X.509 [RFC5280] certificates, where the first element must
     * contain the signature certificate. The certificate path must be contiguous but is not
     * required to be complete.
     */
    certificatePath?: string[];
    /**
     * Optional. Array holding the names of one or more application level properties that must
     * be excluded from the signature process. Note that the "excludes" property itself, must
     * also be excluded from the signature process. Since both the "excludes" property and the
     * associated data it points to are unsigned, a conforming JSF implementation must provide
     * options for specifying which properties to accept.
     */
    excludes?: string[];
    /**
     * Optional. Application specific string identifying the signature key.
     */
    keyId?: string;
    /**
     * Optional. Public key object.
     */
    publicKey?: PublicKey;
    /**
     * The signature data. Note that the binary representation must follow the JWA [RFC7518]
     * specifications.
     */
    value: string;
}

/**
 * Optional. Public key object.
 */
export type PublicKey = {
    kty: KeyType;
    [property: string]: any;
}

/**
 * Key type indicator.
 */
export type KeyType = "EC" | "OKP" | "RSA";

/**
 * Specifies metadata and content for [ISO-IEC 19770-2 Software Identification (SWID)
 * Tags](https://www.iso.org/standard/65666.html).
 *
 * Specifies metadata and content for ISO-IEC 19770-2 Software Identification (SWID) Tags.
 */
export type PurpleSWIDTag = {
    /**
     * Maps to the name of a SoftwareIdentity.
     */
    name: string;
    /**
     * Maps to the patch of a SoftwareIdentity.
     */
    patch?: boolean;
    /**
     * Maps to the tagId of a SoftwareIdentity.
     */
    tagId: string;
    /**
     * Maps to the tagVersion of a SoftwareIdentity.
     */
    tagVersion?: number;
    /**
     * Specifies the metadata and content of the SWID tag.
     */
    text?: LicenseObjectTextClass;
    /**
     * The URL to the SWID file.
     */
    url?: string;
    /**
     * Maps to the version of a SoftwareIdentity.
     */
    version?: string;
}

/**
 * Specifies the type of component. For software components, classify as application if no
 * more specific appropriate classification is available or cannot be determined for the
 * component. Types include:
 *
 * * __application__ = A software application. Refer to
 * [https://en.wikipedia.org/wiki/Application_software](https://en.wikipedia.org/wiki/Application_software)
 * for information about applications.
 * * __framework__ = A software framework. Refer to
 * [https://en.wikipedia.org/wiki/Software_framework](https://en.wikipedia.org/wiki/Software_framework)
 * for information on how frameworks vary slightly from libraries.
 * * __library__ = A software library. Refer to
 * [https://en.wikipedia.org/wiki/Library_(computing)](https://en.wikipedia.org/wiki/Library_(computing))
 * for information about libraries. All third-party and open source reusable components will
 * likely be a library. If the library also has key features of a framework, then it should
 * be classified as a framework. If not, or is unknown, then specifying library is
 * RECOMMENDED.
 * * __container__ = A packaging and/or runtime format, not specific to any particular
 * technology, which isolates software inside the container from software outside of a
 * container through virtualization technology. Refer to
 * [https://en.wikipedia.org/wiki/OS-level_virtualization](https://en.wikipedia.org/wiki/OS-level_virtualization)
 * * __platform__ = A runtime environment which interprets or executes software. This may
 * include runtimes such as those that execute bytecode or low-code/no-code application
 * platforms.
 * * __operating-system__ = A software operating system without regard to deployment model
 * (i.e. installed on physical hardware, virtual machine, image, etc) Refer to
 * [https://en.wikipedia.org/wiki/Operating_system](https://en.wikipedia.org/wiki/Operating_system)
 * * __device__ = A hardware device such as a processor, or chip-set. A hardware device
 * containing firmware SHOULD include a component for the physical hardware itself, and
 * another component of type 'firmware' or 'operating-system' (whichever is relevant),
 * describing information about the software running on the device.
 * See also the list of [known device
 * properties](https://github.com/CycloneDX/cyclonedx-property-taxonomy/blob/main/cdx/device.md).
 * * __device-driver__ = A special type of software that operates or controls a particular
 * type of device. Refer to
 * [https://en.wikipedia.org/wiki/Device_driver](https://en.wikipedia.org/wiki/Device_driver)
 * * __firmware__ = A special type of software that provides low-level control over a
 * devices hardware. Refer to
 * [https://en.wikipedia.org/wiki/Firmware](https://en.wikipedia.org/wiki/Firmware)
 * * __file__ = A computer file. Refer to
 * [https://en.wikipedia.org/wiki/Computer_file](https://en.wikipedia.org/wiki/Computer_file)
 * for information about files.
 * * __machine-learning-model__ = A model based on training data that can make predictions
 * or decisions without being explicitly programmed to do so.
 * * __data__ = A collection of discrete values that convey information.
 */
export type FluffyComponentType = "application" | "framework" | "library" | "container" | "platform" | "operating-system" | "device" | "device-driver" | "firmware" | "file" | "machine-learning-model" | "data";

/**
 * The service that created the annotation
 */
export type ServiceClass = {
    /**
     * A boolean value indicating if the service requires authentication. A value of true
     * indicates the service requires authentication prior to use. A value of false indicates
     * the service does not require authentication.
     */
    authenticated?: boolean;
    /**
     * An optional identifier which can be used to reference the service elsewhere in the BOM.
     * Every bom-ref MUST be unique within the BOM.
     */
    "bom-ref"?: string;
    /**
     * Specifies information about the data including the directional flow of data and the data
     * classification.
     */
    data?: PurpleHashObjects[];
    /**
     * Specifies a description for the service
     */
    description?: string;
    /**
     * The endpoint URIs of the service. Multiple endpoints are allowed.
     */
    endpoints?: string[];
    /**
     * External references provide a way to document systems, sites, and information that may be
     * relevant, but are not included with the BOM. They may also establish specific
     * relationships within or external to the BOM.
     */
    externalReferences?: CycloneDXSoftwareBillOfMaterialsStandardExternalReference[];
    /**
     * The grouping name, namespace, or identifier. This will often be a shortened, single name
     * of the company or project that produced the service or domain name. Whitespace and
     * special characters should be avoided.
     */
    group?:    string;
    licenses?: MultipleLicense[];
    /**
     * The name of the service. This will often be a shortened, single name of the service.
     */
    name: string;
    /**
     * Provides the ability to document properties in a name-value store. This provides
     * flexibility to include data not officially supported in the standard without having to
     * use additional namespaces or create extensions. Unlike key-value stores, properties
     * support duplicate names, each potentially having different values. Property names of
     * interest to the general public are encouraged to be registered in the [CycloneDX Property
     * Taxonomy](https://github.com/CycloneDX/cyclonedx-property-taxonomy). Formal registration
     * is OPTIONAL.
     */
    properties?: LightweightNameValuePairObject[];
    /**
     * The organization that provides the service.
     */
    provider?: ManufactureElement;
    /**
     * Specifies optional release notes.
     */
    releaseNotes?: PurpleReleaseNotes;
    /**
     * A list of services included or deployed behind the parent service. This is not a
     * dependency tree. It provides a way to specify a hierarchical representation of service
     * assemblies.
     */
    services?: ServiceClass[];
    /**
     * Enveloped signature in [JSON Signature Format
     * (JSF)](https://cyberphone.github.io/doc/security/jsf.html).
     */
    signature?: Signature;
    /**
     * The name of the trust zone the service resides in.
     */
    trustZone?: string;
    /**
     * The service version.
     */
    version?: string;
    /**
     * A boolean value indicating if use of the service crosses a trust zone or boundary. A
     * value of true indicates that by using the service, a trust boundary is crossed. A value
     * of false indicates that by using the service, a trust boundary is not crossed.
     */
    "x-trust-boundary"?: boolean;
}

export type PurpleHashObjects = {
    classification: string;
    /**
     * Short description of the data content and usage
     */
    description?: string;
    /**
     * The URI, URL, or BOM-Link of the components or services the data is sent to
     */
    destination?: string[];
    /**
     * Specifies the flow direction of the data. Direction is relative to the service. Inbound
     * flow states that data enters the service. Outbound flow states that data leaves the
     * service. Bi-directional states that data flows both ways, and unknown states that the
     * direction is not known.
     */
    flow:        DataFlowDirection;
    governance?: FluffyDataGovernance;
    /**
     * Name for the defined data
     */
    name?: string;
    /**
     * The URI, URL, or BOM-Link of the components or services the data came in from
     */
    source?: string[];
}

export type FluffyDataGovernance = {
    /**
     * Data custodians are responsible for the safe custody, transport, and storage of data.
     */
    custodians?: PurpleDataGovernanceResponsibleParty[];
    /**
     * Data owners are concerned with risk and appropriate access to data.
     */
    owners?: PurpleDataGovernanceResponsibleParty[];
    /**
     * Data stewards are responsible for data content, context, and associated business rules.
     */
    stewards?: PurpleDataGovernanceResponsibleParty[];
}

export type CycloneDXSoftwareBillOfMaterialsStandardComposition = {
    /**
     * Specifies an aggregate type that describe how complete a relationship is.
     *
     * * __complete__ = The relationship is complete. No further relationships including
     * constituent components, services, or dependencies are known to exist.
     * * __incomplete__ = The relationship is incomplete. Additional relationships exist and may
     * include constituent components, services, or dependencies.
     * * __incomplete&#95;first&#95;party&#95;only__ = The relationship is incomplete. Only
     * relationships for first-party components, services, or their dependencies are
     * represented.
     * * __incomplete&#95;first&#95;party&#95;proprietary&#95;only__ = The relationship is
     * incomplete. Only relationships for first-party components, services, or their
     * dependencies are represented, limited specifically to those that are proprietary.
     * * __incomplete&#95;first&#95;party&#95;opensource&#95;only__ = The relationship is
     * incomplete. Only relationships for first-party components, services, or their
     * dependencies are represented, limited specifically to those that are opensource.
     * * __incomplete&#95;third&#95;party&#95;only__ = The relationship is incomplete. Only
     * relationships for third-party components, services, or their dependencies are
     * represented.
     * * __incomplete&#95;third&#95;party&#95;proprietary&#95;only__ = The relationship is
     * incomplete. Only relationships for third-party components, services, or their
     * dependencies are represented, limited specifically to those that are proprietary.
     * * __incomplete&#95;third&#95;party&#95;opensource&#95;only__ = The relationship is
     * incomplete. Only relationships for third-party components, services, or their
     * dependencies are represented, limited specifically to those that are opensource.
     * * __unknown__ = The relationship may be complete or incomplete. This usually signifies a
     * 'best-effort' to obtain constituent components, services, or dependencies but the
     * completeness is inconclusive.
     * * __not&#95;specified__ = The relationship completeness is not specified.
     */
    aggregate: FluffyAggregateType;
    /**
     * The bom-ref identifiers of the components or services being described. Assemblies refer
     * to nested relationships whereby a constituent part may include other constituent parts.
     * References do not cascade to child parts. References are explicit for the specified
     * constituent part only.
     */
    assemblies?: string[];
    /**
     * An optional identifier which can be used to reference the composition elsewhere in the
     * BOM. Every bom-ref MUST be unique within the BOM.
     */
    "bom-ref"?: string;
    /**
     * The bom-ref identifiers of the components or services being described. Dependencies refer
     * to a relationship whereby an independent constituent part requires another independent
     * constituent part. References do not cascade to transitive dependencies. References are
     * explicit for the specified dependency only.
     */
    dependencies?: string[];
    /**
     * Enveloped signature in [JSON Signature Format
     * (JSF)](https://cyberphone.github.io/doc/security/jsf.html).
     */
    signature?: Signature;
    /**
     * The bom-ref identifiers of the vulnerabilities being described.
     */
    vulnerabilities?: string[];
}

/**
 * Specifies an aggregate type that describe how complete a relationship is.
 *
 * * __complete__ = The relationship is complete. No further relationships including
 * constituent components, services, or dependencies are known to exist.
 * * __incomplete__ = The relationship is incomplete. Additional relationships exist and may
 * include constituent components, services, or dependencies.
 * * __incomplete&#95;first&#95;party&#95;only__ = The relationship is incomplete. Only
 * relationships for first-party components, services, or their dependencies are
 * represented.
 * * __incomplete&#95;first&#95;party&#95;proprietary&#95;only__ = The relationship is
 * incomplete. Only relationships for first-party components, services, or their
 * dependencies are represented, limited specifically to those that are proprietary.
 * * __incomplete&#95;first&#95;party&#95;opensource&#95;only__ = The relationship is
 * incomplete. Only relationships for first-party components, services, or their
 * dependencies are represented, limited specifically to those that are opensource.
 * * __incomplete&#95;third&#95;party&#95;only__ = The relationship is incomplete. Only
 * relationships for third-party components, services, or their dependencies are
 * represented.
 * * __incomplete&#95;third&#95;party&#95;proprietary&#95;only__ = The relationship is
 * incomplete. Only relationships for third-party components, services, or their
 * dependencies are represented, limited specifically to those that are proprietary.
 * * __incomplete&#95;third&#95;party&#95;opensource&#95;only__ = The relationship is
 * incomplete. Only relationships for third-party components, services, or their
 * dependencies are represented, limited specifically to those that are opensource.
 * * __unknown__ = The relationship may be complete or incomplete. This usually signifies a
 * 'best-effort' to obtain constituent components, services, or dependencies but the
 * completeness is inconclusive.
 * * __not&#95;specified__ = The relationship completeness is not specified.
 *
 *
 * Specifies an aggregate type that describe how complete a relationship is.
 */
export type FluffyAggregateType = "complete" | "incomplete" | "incomplete_first_party_only" | "incomplete_first_party_proprietary_only" | "incomplete_first_party_opensource_only" | "incomplete_third_party_only" | "incomplete_third_party_proprietary_only" | "incomplete_third_party_opensource_only" | "unknown" | "not_specified";

/**
 * Defines the direct dependencies of a component or service. Components or services that do
 * not have their own dependencies MUST be declared as empty elements within the graph.
 * Components or services that are not represented in the dependency graph MAY have unknown
 * dependencies. It is RECOMMENDED that implementations assume this to be opaque and not an
 * indicator of a object being dependency-free. It is RECOMMENDED to leverage compositions
 * to indicate unknown dependency graphs.
 */
export type CycloneDXSoftwareBillOfMaterialsStandardDependency = {
    /**
     * The bom-ref identifiers of the components or services that are dependencies of this
     * dependency object.
     */
    dependsOn?: string[];
    /**
     * References a component or service by its bom-ref attribute
     */
    ref: string;
}

/**
 * Describes workflows and resources that captures rules and other aspects of how the
 * associated BOM component or service was formed.
 */
export type CycloneDXSoftwareBillOfMaterialsStandardFormulation = {
    /**
     * An optional identifier which can be used to reference the formula elsewhere in the BOM.
     * Every bom-ref MUST be unique within the BOM.
     */
    "bom-ref"?: string;
    /**
     * Transient components that are used in tasks that constitute one or more of this formula's
     * workflows
     */
    components?: ComponentClass[];
    properties?: LightweightNameValuePairObject[];
    /**
     * Transient services that are used in tasks that constitute one or more of this formula's
     * workflows
     */
    services?: ServiceClass[];
    /**
     * List of workflows that can be declared to accomplish specific orchestrated goals and
     * independently triggered.
     */
    workflows?: PurpleWorkflow[];
}

/**
 * A specialized orchestration task.
 */
export type PurpleWorkflow = {
    /**
     * An optional identifier which can be used to reference the workflow elsewhere in the BOM.
     * Every bom-ref MUST be unique within the BOM.
     */
    "bom-ref": string;
    /**
     * A description of the resource instance.
     */
    description?: string;
    /**
     * Represents resources and data brought into a task at runtime by executor or task commands
     */
    inputs?: PurpleInputType[];
    /**
     * The name of the resource instance.
     */
    name?: string;
    /**
     * Represents resources and data output from a task at runtime by executor or task commands
     */
    outputs?:    PurpleOutputType[];
    properties?: LightweightNameValuePairObject[];
    /**
     * References to component or service resources that are used to realize the resource
     * instance.
     */
    resourceReferences?: PurpleResourceReferenceChoice[];
    /**
     * A graph of the component runtime topology for workflow's instance.
     */
    runtimeTopology?: CycloneDXSoftwareBillOfMaterialsStandardDependency[];
    /**
     * The sequence of steps for the task.
     */
    steps?: PurpleStep[];
    /**
     * The graph of dependencies between tasks within the workflow.
     */
    taskDependencies?: CycloneDXSoftwareBillOfMaterialsStandardDependency[];
    /**
     * The tasks that comprise the workflow.
     */
    tasks?: PurpleTask[];
    /**
     * Indicates the types of activities performed by the set of workflow tasks.
     */
    taskTypes: TaskType[];
    /**
     * The date and time (timestamp) when the task ended.
     */
    timeEnd?: Date;
    /**
     * The date and time (timestamp) when the task started.
     */
    timeStart?: Date;
    /**
     * The trigger that initiated the task.
     */
    trigger?: PurpleTrigger;
    /**
     * The unique identifier for the resource instance within its deployment context.
     */
    uid: string;
    /**
     * A set of named filesystem or data resource shareable by workflow tasks.
     */
    workspaces?: PurpleWorkspace[];
}

/**
 * Type that represents various input data types and formats.
 */
export type PurpleInputType = {
    /**
     * Inputs that have the form of data.
     */
    data?: LicenseObjectTextClass;
    /**
     * Inputs that have the form of parameters with names and values.
     */
    environmentVars?: Array<LightweightNameValuePairObject | string>;
    /**
     * Inputs that have the form of parameters with names and values.
     */
    parameters?: PurpleParameter[];
    properties?: LightweightNameValuePairObject[];
    /**
     * A reference to an independent resource provided as an input to a task by the workflow
     * runtime.
     */
    resource?: PurpleResourceReferenceChoice;
    /**
     * A references to the component or service that provided the input to the task (e.g.,
     * reference to a service with data flow value of `inbound`)
     */
    source?: PurpleResourceReferenceChoice;
    /**
     * A reference to the component or service that received or stored the input if not the task
     * itself (e.g., a local, named storage workspace)
     */
    target?: PurpleResourceReferenceChoice;
}

/**
 * A representation of a functional parameter.
 */
export type PurpleParameter = {
    /**
     * The data type of the parameter.
     */
    dataType?: string;
    /**
     * The name of the parameter.
     */
    name?: string;
    /**
     * The value of the parameter.
     */
    value?: string;
}

/**
 * A reference to an independent resource provided as an input to a task by the workflow
 * runtime.
 *
 * A references to the component or service that provided the input to the task (e.g.,
 * reference to a service with data flow value of `inbound`)
 *
 * A reference to the component or service that received or stored the input if not the task
 * itself (e.g., a local, named storage workspace)
 *
 * A reference to an independent resource generated as output by the task.
 *
 * Component or service that generated or provided the output from the task (e.g., a build
 * tool)
 *
 * Component or service that received the output from the task (e.g., reference to an
 * artifactory service with data flow value of `outbound`)
 *
 * References the component or service that was the source of the event
 *
 * References the component or service that was the target of the event
 *
 * A reference to a locally defined resource (e.g., a bom-ref) or an externally accessible
 * resource.
 */
export type PurpleResourceReferenceChoice = {
    /**
     * Reference to an externally accessible resource.
     */
    externalReference?: CycloneDXSoftwareBillOfMaterialsStandardExternalReference;
    /**
     * References an object by its bom-ref attribute
     */
    ref?: string;
}

export type PurpleOutputType = {
    /**
     * Outputs that have the form of data.
     */
    data?: LicenseObjectTextClass;
    /**
     * Outputs that have the form of environment variables.
     */
    environmentVars?: Array<LightweightNameValuePairObject | string>;
    properties?:      LightweightNameValuePairObject[];
    /**
     * A reference to an independent resource generated as output by the task.
     */
    resource?: PurpleResourceReferenceChoice;
    /**
     * Component or service that generated or provided the output from the task (e.g., a build
     * tool)
     */
    source?: PurpleResourceReferenceChoice;
    /**
     * Component or service that received the output from the task (e.g., reference to an
     * artifactory service with data flow value of `outbound`)
     */
    target?: PurpleResourceReferenceChoice;
    /**
     * Describes the type of data output.
     */
    type?: OutputTypeType;
}

/**
 * Describes the type of data output.
 */
export type OutputTypeType = "artifact" | "attestation" | "log" | "evidence" | "metrics" | "other";

/**
 * Executes specific commands or tools in order to accomplish its owning task as part of a
 * sequence.
 */
export type PurpleStep = {
    /**
     * Ordered list of commands or directives for the step
     */
    commands?: PurpleCommand[];
    /**
     * A description of the step.
     */
    description?: string;
    /**
     * A name for the step.
     */
    name?:       string;
    properties?: LightweightNameValuePairObject[];
}

export type PurpleCommand = {
    /**
     * A text representation of the executed command.
     */
    executed?:   string;
    properties?: LightweightNameValuePairObject[];
}

export type TaskType = "copy" | "clone" | "lint" | "scan" | "merge" | "build" | "test" | "deliver" | "deploy" | "release" | "clean" | "other";

/**
 * Describes the inputs, sequence of steps and resources used to accomplish a task and its
 * output.
 */
export type PurpleTask = {
    /**
     * An optional identifier which can be used to reference the task elsewhere in the BOM.
     * Every bom-ref MUST be unique within the BOM.
     */
    "bom-ref": string;
    /**
     * A description of the resource instance.
     */
    description?: string;
    /**
     * Represents resources and data brought into a task at runtime by executor or task commands
     */
    inputs?: PurpleInputType[];
    /**
     * The name of the resource instance.
     */
    name?: string;
    /**
     * Represents resources and data output from a task at runtime by executor or task commands
     */
    outputs?:    PurpleOutputType[];
    properties?: LightweightNameValuePairObject[];
    /**
     * References to component or service resources that are used to realize the resource
     * instance.
     */
    resourceReferences?: PurpleResourceReferenceChoice[];
    /**
     * A graph of the component runtime topology for task's instance.
     */
    runtimeTopology?: CycloneDXSoftwareBillOfMaterialsStandardDependency[];
    /**
     * The sequence of steps for the task.
     */
    steps?: PurpleStep[];
    /**
     * Indicates the types of activities performed by the set of workflow tasks.
     */
    taskTypes: TaskType[];
    /**
     * The date and time (timestamp) when the task ended.
     */
    timeEnd?: Date;
    /**
     * The date and time (timestamp) when the task started.
     */
    timeStart?: Date;
    /**
     * The trigger that initiated the task.
     */
    trigger?: PurpleTrigger;
    /**
     * The unique identifier for the resource instance within its deployment context.
     */
    uid: string;
    /**
     * A set of named filesystem or data resource shareable by workflow tasks.
     */
    workspaces?: PurpleWorkspace[];
}

/**
 * The trigger that initiated the task.
 *
 * Represents a resource that can conditionally activate (or fire) tasks based upon
 * associated events and their data.
 */
export type PurpleTrigger = {
    /**
     * An optional identifier which can be used to reference the trigger elsewhere in the BOM.
     * Every bom-ref MUST be unique within the BOM.
     */
    "bom-ref":   string;
    conditions?: PurpleCondition[];
    /**
     * A description of the resource instance.
     */
    description?: string;
    /**
     * The event data that caused the associated trigger to activate.
     */
    event?: PurpleEvent;
    /**
     * Represents resources and data brought into a task at runtime by executor or task commands
     */
    inputs?: PurpleInputType[];
    /**
     * The name of the resource instance.
     */
    name?: string;
    /**
     * Represents resources and data output from a task at runtime by executor or task commands
     */
    outputs?:    PurpleOutputType[];
    properties?: LightweightNameValuePairObject[];
    /**
     * References to component or service resources that are used to realize the resource
     * instance.
     */
    resourceReferences?: PurpleResourceReferenceChoice[];
    /**
     * The date and time (timestamp) when the trigger was activated.
     */
    timeActivated?: Date;
    /**
     * The source type of event which caused the trigger to fire.
     */
    type: TriggerType;
    /**
     * The unique identifier for the resource instance within its deployment context.
     */
    uid: string;
}

/**
 * A condition that was used to determine a trigger should be activated.
 */
export type PurpleCondition = {
    /**
     * Describes the set of conditions which cause the trigger to activate.
     */
    description?: string;
    /**
     * The logical expression that was evaluated that determined the trigger should be fired.
     */
    expression?: string;
    properties?: LightweightNameValuePairObject[];
}

/**
 * The event data that caused the associated trigger to activate.
 *
 * Represents something that happened that may trigger a response.
 */
export type PurpleEvent = {
    /**
     * Encoding of the raw event data.
     */
    data?: LicenseObjectTextClass;
    /**
     * A description of the event.
     */
    description?: string;
    properties?:  LightweightNameValuePairObject[];
    /**
     * References the component or service that was the source of the event
     */
    source?: PurpleResourceReferenceChoice;
    /**
     * References the component or service that was the target of the event
     */
    target?: PurpleResourceReferenceChoice;
    /**
     * The date and time (timestamp) when the event was received.
     */
    timeReceived?: Date;
    /**
     * The unique identifier of the event.
     */
    uid?: string;
}

/**
 * The source type of event which caused the trigger to fire.
 */
export type TriggerType = "manual" | "api" | "webhook" | "scheduled";

/**
 * A named filesystem or data resource shareable by workflow tasks.
 */
export type PurpleWorkspace = {
    /**
     * Describes the read-write access control for the workspace relative to the owning resource
     * instance.
     */
    accessMode?: AccessMode;
    /**
     * The names for the workspace as referenced by other workflow tasks. Effectively, a name
     * mapping so other tasks can use their own local name in their steps.
     */
    aliases?: string[];
    /**
     * An optional identifier which can be used to reference the workspace elsewhere in the BOM.
     * Every bom-ref MUST be unique within the BOM.
     */
    "bom-ref": string;
    /**
     * A description of the resource instance.
     */
    description?: string;
    /**
     * The name of a domain-specific data type the workspace represents.
     */
    managedDataType?: string;
    /**
     * A path to a location on disk where the workspace will be available to the associated
     * task's steps.
     */
    mountPath?: string;
    /**
     * The name of the resource instance.
     */
    name?:       string;
    properties?: LightweightNameValuePairObject[];
    /**
     * References to component or service resources that are used to realize the resource
     * instance.
     */
    resourceReferences?: PurpleResourceReferenceChoice[];
    /**
     * The unique identifier for the resource instance within its deployment context.
     */
    uid: string;
    /**
     * Information about the actual volume instance allocated to the workspace.
     */
    volume?: PurpleVolume;
    /**
     * Identifies the reference to the request for a specific volume type and parameters.
     */
    volumeRequest?: string;
}

/**
 * Describes the read-write access control for the workspace relative to the owning resource
 * instance.
 */
export type AccessMode = "read-only" | "read-write" | "read-write-once" | "write-once" | "write-only";

/**
 * Information about the actual volume instance allocated to the workspace.
 *
 * An identifiable, logical unit of data storage tied to a physical device.
 */
export type PurpleVolume = {
    /**
     * The mode for the volume instance.
     */
    mode?: VolumeMode;
    /**
     * The name of the volume instance
     */
    name?: string;
    /**
     * The underlying path created from the actual volume.
     */
    path?: string;
    /**
     * Indicates if the volume persists beyond the life of the resource it is associated with.
     */
    persistent?: boolean;
    properties?: LightweightNameValuePairObject[];
    /**
     * Indicates if the volume is remotely (i.e., network) attached.
     */
    remote?: boolean;
    /**
     * The allocated size of the volume accessible to the associated workspace. This should
     * include the scalar size as well as IEC standard unit in either decimal or binary form.
     */
    sizeAllocated?: string;
    /**
     * The unique identifier for the volume instance within its deployment context.
     */
    uid?: string;
}

/**
 * The mode for the volume instance.
 */
export type VolumeMode = "filesystem" | "block";

/**
 * Provides additional information about a BOM.
 */
export type MetadataClass = {
    /**
     * The person(s) who created the BOM. Authors are common in BOMs created through manual
     * processes. BOMs created through automated means may not have authors.
     */
    authors?: IndividualElement[];
    /**
     * The component that the BOM describes.
     */
    component?:  ComponentClass;
    licenses?:   MultipleLicense[];
    lifecycles?: PurpleLifecycle[];
    /**
     * The organization that manufactured the component that the BOM describes.
     */
    manufacture?: ManufactureElement;
    /**
     * Provides the ability to document properties in a name-value store. This provides
     * flexibility to include data not officially supported in the standard without having to
     * use additional namespaces or create extensions. Unlike key-value stores, properties
     * support duplicate names, each potentially having different values. Property names of
     * interest to the general public are encouraged to be registered in the [CycloneDX Property
     * Taxonomy](https://github.com/CycloneDX/cyclonedx-property-taxonomy). Formal registration
     * is OPTIONAL.
     */
    properties?: LightweightNameValuePairObject[];
    /**
     * The organization that supplied the component that the BOM describes. The supplier may
     * often be the manufacturer, but may also be a distributor or repackager.
     */
    supplier?: ManufactureElement;
    /**
     * The date and time (timestamp) when the BOM was created.
     */
    timestamp?: Date;
    tools?:     CreationToolsLegacyElement[] | CreationTools;
}

/**
 * The product lifecycle(s) that this BOM represents.
 */
export type PurpleLifecycle = {
    /**
     * A pre-defined phase in the product lifecycle.
     *
     * * __design__ = BOM produced early in the development lifecycle containing inventory of
     * components and services that are proposed or planned to be used. The inventory may need
     * to be procured, retrieved, or resourced prior to use.
     * * __pre-build__ = BOM consisting of information obtained prior to a build process and may
     * contain source files and development artifacts and manifests. The inventory may need to
     * be resolved and retrieved prior to use.
     * * __build__ = BOM consisting of information obtained during a build process where
     * component inventory is available for use. The precise versions of resolved components are
     * usually available at this time as well as the provenance of where the components were
     * retrieved from.
     * * __post-build__ = BOM consisting of information obtained after a build process has
     * completed and the resulting components(s) are available for further analysis. Built
     * components may exist as the result of a CI/CD process, may have been installed or
     * deployed to a system or device, and may need to be retrieved or extracted from the system
     * or device.
     * * __operations__ = BOM produced that represents inventory that is running and
     * operational. This may include staging or production environments and will generally
     * encompass multiple SBOMs describing the applications and operating system, along with
     * HBOMs describing the hardware that makes up the system. Operations Bill of Materials
     * (OBOM) can provide full-stack inventory of runtime environments, configurations, and
     * additional dependencies.
     * * __discovery__ = BOM consisting of information observed through network discovery
     * providing point-in-time enumeration of embedded, on-premise, and cloud-native services
     * such as server applications, connected devices, microservices, and serverless functions.
     * * __decommission__ = BOM containing inventory that will be, or has been retired from
     * operations.
     */
    phase?: Phase;
    /**
     * The description of the lifecycle phase
     */
    description?: string;
    /**
     * The name of the lifecycle phase
     */
    name?: string;
}

/**
 * A pre-defined phase in the product lifecycle.
 *
 * * __design__ = BOM produced early in the development lifecycle containing inventory of
 * components and services that are proposed or planned to be used. The inventory may need
 * to be procured, retrieved, or resourced prior to use.
 * * __pre-build__ = BOM consisting of information obtained prior to a build process and may
 * contain source files and development artifacts and manifests. The inventory may need to
 * be resolved and retrieved prior to use.
 * * __build__ = BOM consisting of information obtained during a build process where
 * component inventory is available for use. The precise versions of resolved components are
 * usually available at this time as well as the provenance of where the components were
 * retrieved from.
 * * __post-build__ = BOM consisting of information obtained after a build process has
 * completed and the resulting components(s) are available for further analysis. Built
 * components may exist as the result of a CI/CD process, may have been installed or
 * deployed to a system or device, and may need to be retrieved or extracted from the system
 * or device.
 * * __operations__ = BOM produced that represents inventory that is running and
 * operational. This may include staging or production environments and will generally
 * encompass multiple SBOMs describing the applications and operating system, along with
 * HBOMs describing the hardware that makes up the system. Operations Bill of Materials
 * (OBOM) can provide full-stack inventory of runtime environments, configurations, and
 * additional dependencies.
 * * __discovery__ = BOM consisting of information observed through network discovery
 * providing point-in-time enumeration of embedded, on-premise, and cloud-native services
 * such as server applications, connected devices, microservices, and serverless functions.
 * * __decommission__ = BOM containing inventory that will be, or has been retired from
 * operations.
 *
 * A pre-defined phase in the product lifecycle.
 */
export type Phase = "design" | "pre-build" | "build" | "post-build" | "operations" | "discovery" | "decommission";

/**
 * [Deprecated] The tool(s) used in the creation of the BOM.
 *
 * [Deprecated] - DO NOT USE. This will be removed in a future version. This will be removed
 * in a future version. Use component or service instead. Information about the automated or
 * manual tool used
 *
 * [Deprecated] The tool(s) used to identify, confirm, or score the vulnerability.
 */
export type CreationToolsLegacyElement = {
    /**
     * External references provide a way to document systems, sites, and information that may be
     * relevant, but are not included with the BOM. They may also establish specific
     * relationships within or external to the BOM.
     */
    externalReferences?: CycloneDXSoftwareBillOfMaterialsStandardExternalReference[];
    /**
     * The hashes of the tool (if applicable).
     */
    hashes?: HashClass[];
    /**
     * The name of the tool
     */
    name?: string;
    /**
     * The name of the vendor who created the tool
     */
    vendor?: string;
    /**
     * The version of the tool
     */
    version?: string;
}

/**
 * The tool(s) used in the creation of the BOM.
 */
export type CreationTools = {
    /**
     * A list of software and hardware components used as tools
     */
    components?: ComponentClass[];
    /**
     * A list of services used as tools. This may include microservices, function-as-a-service,
     * and other types of network or intra-process services.
     */
    services?: ServiceClass[];
}

/**
 * Defines a weakness in a component or service that could be exploited or triggered by a
 * threat source.
 */
export type CycloneDXSoftwareBillOfMaterialsStandardVulnerability = {
    /**
     * Published advisories of the vulnerability if provided.
     */
    advisories?: PurpleAdvisory[];
    /**
     * The components or services that are affected by the vulnerability.
     */
    affects?: PurpleAffect[];
    /**
     * An assessment of the impact and exploitability of the vulnerability.
     */
    analysis?: PurpleImpactAnalysis;
    /**
     * An optional identifier which can be used to reference the vulnerability elsewhere in the
     * BOM. Every bom-ref MUST be unique within the BOM.
     */
    "bom-ref"?: string;
    /**
     * The date and time (timestamp) when the vulnerability record was created in the
     * vulnerability database.
     */
    created?: Date;
    /**
     * Individuals or organizations credited with the discovery of the vulnerability.
     */
    credits?: PurpleCredits;
    /**
     * List of Common Weaknesses Enumerations (CWEs) codes that describes this vulnerability.
     * For example 399 (of https://cwe.mitre.org/data/definitions/399.html)
     */
    cwes?: number[];
    /**
     * A description of the vulnerability as provided by the source.
     */
    description?: string;
    /**
     * If available, an in-depth description of the vulnerability as provided by the source
     * organization. Details often include information useful in understanding root cause.
     */
    detail?: string;
    /**
     * The identifier that uniquely identifies the vulnerability.
     */
    id?: string;
    /**
     * Evidence used to reproduce the vulnerability.
     */
    proofOfConcept?: PurpleProofOfConcept;
    /**
     * Provides the ability to document properties in a name-value store. This provides
     * flexibility to include data not officially supported in the standard without having to
     * use additional namespaces or create extensions. Unlike key-value stores, properties
     * support duplicate names, each potentially having different values. Property names of
     * interest to the general public are encouraged to be registered in the [CycloneDX Property
     * Taxonomy](https://github.com/CycloneDX/cyclonedx-property-taxonomy). Formal registration
     * is OPTIONAL.
     */
    properties?: LightweightNameValuePairObject[];
    /**
     * The date and time (timestamp) when the vulnerability record was first published.
     */
    published?: Date;
    /**
     * List of vulnerability ratings
     */
    ratings?: PurpleRating[];
    /**
     * Recommendations of how the vulnerability can be remediated or mitigated.
     */
    recommendation?: string;
    /**
     * Zero or more pointers to vulnerabilities that are the equivalent of the vulnerability
     * specified. Often times, the same vulnerability may exist in multiple sources of
     * vulnerability intelligence, but have different identifiers. References provide a way to
     * correlate vulnerabilities across multiple sources of vulnerability intelligence.
     */
    references?: PurpleReference[];
    /**
     * The date and time (timestamp) when the vulnerability record was rejected (if applicable).
     */
    rejected?: Date;
    /**
     * The source that published the vulnerability.
     */
    source?: FluffySource;
    tools?:  CreationToolsLegacyElement[] | ToolsTools;
    /**
     * The date and time (timestamp) when the vulnerability record was last updated.
     */
    updated?: Date;
    /**
     * A bypass, usually temporary, of the vulnerability that reduces its likelihood and/or
     * impact. Workarounds often involve changes to configuration or deployments.
     */
    workaround?: string;
}

/**
 * Title and location where advisory information can be obtained. An advisory is a
 * notification of a threat to a component, service, or system.
 */
export type PurpleAdvisory = {
    /**
     * An optional name of the advisory.
     */
    title?: string;
    /**
     * Location where the advisory can be obtained.
     */
    url: string;
}

export type PurpleAffect = {
    /**
     * References a component or service by the objects bom-ref
     */
    ref: string;
    /**
     * Zero or more individual versions or range of versions.
     */
    versions?: PurpleVersion[];
}

export type PurpleVersion = {
    /**
     * A version range specified in Package URL Version Range syntax (vers) which is defined at
     * https://github.com/package-url/purl-spec/VERSION-RANGE-SPEC.rst
     */
    range?: string;
    /**
     * The vulnerability status for the version or range of versions.
     */
    status?: AffectedStatus;
    /**
     * A single version of a component or service.
     */
    version?: string;
}

/**
 * The vulnerability status for the version or range of versions.
 *
 * The vulnerability status of a given version or range of versions of a product. The
 * statuses 'affected' and 'unaffected' indicate that the version is affected or unaffected
 * by the vulnerability. The status 'unknown' indicates that it is unknown or unspecified
 * whether the given version is affected. There can be many reasons for an 'unknown' status,
 * including that an investigation has not been undertaken or that a vendor has not
 * disclosed the status.
 */
export type AffectedStatus = "affected" | "unaffected" | "unknown";

/**
 * An assessment of the impact and exploitability of the vulnerability.
 */
export type PurpleImpactAnalysis = {
    /**
     * Detailed description of the impact including methods used during assessment. If a
     * vulnerability is not exploitable, this field should include specific details on why the
     * component or service is not impacted by this vulnerability.
     */
    detail?: string;
    /**
     * The date and time (timestamp) when the analysis was first issued.
     */
    firstIssued?:   Date;
    justification?: ImpactAnalysisJustification;
    /**
     * The date and time (timestamp) when the analysis was last updated.
     */
    lastUpdated?: Date;
    /**
     * A response to the vulnerability by the manufacturer, supplier, or project responsible for
     * the affected component or service. More than one response is allowed. Responses are
     * strongly encouraged for vulnerabilities where the analysis state is exploitable.
     */
    response?: Response[];
    state?:    ImpactAnalysisState;
}

/**
 * The rationale of why the impact analysis state was asserted.
 *
 * * __code\_not\_present__ = the code has been removed or tree-shaked.
 * * __code\_not\_reachable__ = the vulnerable code is not invoked at runtime.
 * * __requires\_configuration__ = exploitability requires a configurable option to be
 * set/unset.
 * * __requires\_dependency__ = exploitability requires a dependency that is not present.
 * * __requires\_environment__ = exploitability requires a certain environment which is not
 * present.
 * * __protected\_by\_compiler__ = exploitability requires a compiler flag to be set/unset.
 * * __protected\_at\_runtime__ = exploits are prevented at runtime.
 * * __protected\_at\_perimeter__ = attacks are blocked at physical, logical, or network
 * perimeter.
 * * __protected\_by\_mitigating\_control__ = preventative measures have been implemented
 * that reduce the likelihood and/or impact of the vulnerability.
 *
 * The rationale of why the impact analysis state was asserted.
 */
export type ImpactAnalysisJustification = "code_not_present" | "code_not_reachable" | "requires_configuration" | "requires_dependency" | "requires_environment" | "protected_by_compiler" | "protected_at_runtime" | "protected_at_perimeter" | "protected_by_mitigating_control";

export type Response = "can_not_fix" | "will_not_fix" | "update" | "rollback" | "workaround_available";

/**
 * Declares the current state of an occurrence of a vulnerability, after automated or manual
 * analysis.
 *
 * * __resolved__ = the vulnerability has been remediated.
 * * __resolved\_with\_pedigree__ = the vulnerability has been remediated and evidence of
 * the changes are provided in the affected components pedigree containing verifiable commit
 * history and/or diff(s).
 * * __exploitable__ = the vulnerability may be directly or indirectly exploitable.
 * * __in\_triage__ = the vulnerability is being investigated.
 * * __false\_positive__ = the vulnerability is not specific to the component or service and
 * was falsely identified or associated.
 * * __not\_affected__ = the component or service is not affected by the vulnerability.
 * Justification should be specified for all not_affected cases.
 *
 * Declares the current state of an occurrence of a vulnerability, after automated or manual
 * analysis.
 */
export type ImpactAnalysisState = "resolved" | "resolved_with_pedigree" | "exploitable" | "in_triage" | "false_positive" | "not_affected";

/**
 * Individuals or organizations credited with the discovery of the vulnerability.
 */
export type PurpleCredits = {
    /**
     * The individuals, not associated with organizations, that are credited with vulnerability
     * discovery.
     */
    individuals?: IndividualElement[];
    /**
     * The organizations credited with vulnerability discovery.
     */
    organizations?: ManufactureElement[];
}

/**
 * Evidence used to reproduce the vulnerability.
 */
export type PurpleProofOfConcept = {
    /**
     * A description of the environment in which reproduction was possible.
     */
    environment?: string;
    /**
     * Precise steps to reproduce the vulnerability.
     */
    reproductionSteps?: string;
    /**
     * Supporting material that helps in reproducing or understanding how reproduction is
     * possible. This may include screenshots, payloads, and PoC exploit code.
     */
    supportingMaterial?: LicenseObjectTextClass[];
    [property: string]: any;
}

/**
 * Defines the severity or risk ratings of a vulnerability.
 */
export type PurpleRating = {
    /**
     * An optional reason for rating the vulnerability as it was
     */
    justification?: string;
    method?:        MethodEnum;
    /**
     * The numerical score of the rating.
     */
    score?: number;
    /**
     * Textual representation of the severity that corresponds to the numerical score of the
     * rating.
     */
    severity?: Severity;
    /**
     * The source that calculated the severity or risk rating of the vulnerability.
     */
    source?: FluffySource;
    /**
     * Textual representation of the metric values used to score the vulnerability
     */
    vector?: string;
}

/**
 * Specifies the severity or risk scoring methodology or standard used.
 *
 * * CVSSv2 - [Common Vulnerability Scoring System v2](https://www.first.org/cvss/v2/)
 * * CVSSv3 - [Common Vulnerability Scoring System v3](https://www.first.org/cvss/v3-0/)
 * * CVSSv31 - [Common Vulnerability Scoring System v3.1](https://www.first.org/cvss/v3-1/)
 * * CVSSv4 - [Common Vulnerability Scoring System v4](https://www.first.org/cvss/v4-0/)
 * * OWASP - [OWASP Risk Rating
 * Methodology](https://owasp.org/www-community/OWASP_Risk_Rating_Methodology)
 * * SSVC - [Stakeholder Specific Vulnerability
 * Categorization](https://github.com/CERTCC/SSVC) (all versions)
 *
 * Specifies the severity or risk scoring methodology or standard used.
 */
export type MethodEnum = "CVSSv2" | "CVSSv3" | "CVSSv31" | "CVSSv4" | "OWASP" | "SSVC" | "other";

/**
 * Textual representation of the severity that corresponds to the numerical score of the
 * rating.
 *
 * Textual representation of the severity of the vulnerability adopted by the analysis
 * method. If the analysis method uses values other than what is provided, the user is
 * expected to translate appropriately.
 */
export type Severity = "critical" | "high" | "medium" | "low" | "info" | "none" | "unknown";

/**
 * The source that calculated the severity or risk rating of the vulnerability.
 *
 * The source of vulnerability information. This is often the organization that published
 * the vulnerability.
 *
 * The source that published the vulnerability.
 */
export type FluffySource = {
    /**
     * The name of the source.
     */
    name?: string;
    /**
     * The url of the vulnerability documentation as provided by the source.
     */
    url?: string;
}

export type PurpleReference = {
    /**
     * An identifier that uniquely identifies the vulnerability.
     */
    id: string;
    /**
     * The source that published the vulnerability.
     */
    source: FluffySource;
}

/**
 * The tool(s) used to identify, confirm, or score the vulnerability.
 */
export type ToolsTools = {
    /**
     * A list of software and hardware components used as tools
     */
    components?: ComponentClass[];
    /**
     * A list of services used as tools. This may include microservices, function-as-a-service,
     * and other types of network or intra-process services.
     */
    services?: ServiceClass[];
}

export type CycloneDXBillOfMaterialsStandard = {
    $schema?: string;
    /**
     * Comments made by people, organizations, or tools about any object with a bom-ref, such as
     * components, services, vulnerabilities, or the BOM itself. Unlike inventory information,
     * annotations may contain opinions or commentary from various stakeholders. Annotations may
     * be inline (with inventory) or externalized via BOM-Link and may optionally be signed.
     */
    annotations?: CycloneDXBillOfMaterialsStandardAnnotation[];
    /**
     * Specifies the format of the BOM. This helps to identify the file as CycloneDX since BOMs
     * do not have a filename convention, nor does JSON schema support namespaces. This value
     * must be "CycloneDX".
     */
    bomFormat: BOMFormat;
    /**
     * A list of software and hardware components.
     */
    components?: Component[];
    /**
     * Compositions describe constituent parts (including components, services, and dependency
     * relationships) and their completeness. The completeness of vulnerabilities expressed in a
     * BOM may also be described.
     */
    compositions?: CycloneDXBillOfMaterialsStandardComposition[];
    /**
     * The list of declarations which describe the conformance to standards. Each declaration
     * may include attestations, claims, and evidence.
     */
    declarations?: Declarations;
    /**
     * A collection of reusable objects that are defined and may be used elsewhere in the BOM.
     */
    definitions?: Definitions;
    /**
     * Provides the ability to document dependency relationships including provided &
     * implemented components.
     */
    dependencies?: CycloneDXBillOfMaterialsStandardDependency[];
    /**
     * External references provide a way to document systems, sites, and information that may be
     * relevant but are not included with the BOM. They may also establish specific
     * relationships within or external to the BOM.
     */
    externalReferences?: EnergyProviderExternalReference[];
    /**
     * Describes how a component or service was manufactured or deployed. This is achieved
     * through the use of formulas, workflows, tasks, and steps, which declare the precise steps
     * to reproduce along with the observed formulas describing the steps which transpired in
     * the manufacturing process.
     */
    formulation?: CycloneDXBillOfMaterialsStandardFormulation[];
    /**
     * Provides additional information about a BOM.
     */
    metadata?: BOMMetadata;
    /**
     * Provides the ability to document properties in a name-value store. This provides
     * flexibility to include data not officially supported in the standard without having to
     * use additional namespaces or create extensions. Unlike key-value stores, properties
     * support duplicate names, each potentially having different values. Property names of
     * interest to the general public are encouraged to be registered in the [CycloneDX Property
     * Taxonomy](https://github.com/CycloneDX/cyclonedx-property-taxonomy). Formal registration
     * is optional.
     */
    properties?: LightweightNameValuePairClass[];
    /**
     * Every BOM generated SHOULD have a unique serial number, even if the contents of the BOM
     * have not changed over time. If specified, the serial number must conform to [RFC
     * 4122](https://www.ietf.org/rfc/rfc4122.html). Use of serial numbers is recommended.
     */
    serialNumber?: string;
    /**
     * A list of services. This may include microservices, function-as-a-service, and other
     * types of network or intra-process services.
     */
    services?: Service[];
    /**
     * Enveloped signature in [JSON Signature Format
     * (JSF)](https://cyberphone.github.io/doc/security/jsf.html).
     */
    signature?: Signature;
    /**
     * The version of the CycloneDX specification the BOM conforms to.
     */
    specVersion: string;
    /**
     * Whenever an existing BOM is modified, either manually or through automated processes, the
     * version of the BOM SHOULD be incremented by 1. When a system is presented with multiple
     * BOMs with identical serial numbers, the system SHOULD use the most recent version of the
     * BOM. The default version is '1'.
     */
    version?: number;
    /**
     * Vulnerabilities identified in components or services.
     */
    vulnerabilities?: CycloneDXBillOfMaterialsStandardVulnerability[];
}

/**
 * A comment, note, explanation, or similar textual content which provides additional
 * context to the object(s) being annotated.
 */
export type CycloneDXBillOfMaterialsStandardAnnotation = {
    /**
     * The organization, person, component, or service which created the textual content of the
     * annotation.
     */
    annotator: FluffyAnnotator;
    /**
     * An optional identifier which can be used to reference the annotation elsewhere in the
     * BOM. Every bom-ref must be unique within the BOM.
     * Value SHOULD not start with the BOM-Link intro 'urn:cdx:' to avoid conflicts with
     * BOM-Links.
     */
    "bom-ref"?: string;
    /**
     * Enveloped signature in [JSON Signature Format
     * (JSF)](https://cyberphone.github.io/doc/security/jsf.html).
     */
    signature?: Signature;
    /**
     * The object in the BOM identified by its bom-ref. This is often a component or service,
     * but may be any object type supporting bom-refs.
     */
    subjects: string[];
    /**
     * The textual content of the annotation.
     */
    text: string;
    /**
     * The date and time (timestamp) when the annotation was created.
     */
    timestamp: Date;
}

/**
 * The organization, person, component, or service which created the textual content of the
 * annotation.
 */
export type FluffyAnnotator = {
    /**
     * The tool or component that created the annotation
     */
    component?: Component;
    /**
     * The person that created the annotation
     */
    individual?: OrganizationalContact;
    /**
     * The organization that created the annotation
     */
    organization?: OrganizationalEntity;
    /**
     * The service that created the annotation
     */
    service?: Service;
}

/**
 * Component pedigree is a way to document complex supply chain scenarios where components
 * are created, distributed, modified, redistributed, combined with other components, etc.
 * Pedigree supports viewing this complex chain from the beginning, the end, or anywhere in
 * the middle. It also provides a way to document variants where the exact relation may not
 * be known.
 */
export type FluffyComponentPedigree = {
    /**
     * Describes zero or more components in which a component is derived from. This is commonly
     * used to describe forks from existing projects where the forked version contains a
     * ancestor node containing the original component it was forked from. For example,
     * Component A is the original component. Component B is the component being used and
     * documented in the BOM. However, Component B contains a pedigree node with a single
     * ancestor documenting Component A - the original component from which Component B is
     * derived from.
     */
    ancestors?: Component[];
    /**
     * A list of zero or more commits which provide a trail describing how the component
     * deviates from an ancestor, descendant, or variant.
     */
    commits?: FluffyCommit[];
    /**
     * Descendants are the exact opposite of ancestors. This provides a way to document all
     * forks (and their forks) of an original or root component.
     */
    descendants?: Component[];
    /**
     * Notes, observations, and other non-structured commentary describing the components
     * pedigree.
     */
    notes?: string;
    /**
     * >A list of zero or more patches describing how the component deviates from an ancestor,
     * descendant, or variant. Patches may be complementary to commits or may be used in place
     * of commits.
     */
    patches?: FluffyPatch[];
    /**
     * Variants describe relations where the relationship between the components is not known.
     * For example, if Component A contains nearly identical code to Component B. They are both
     * related, but it is unclear if one is derived from the other, or if they share a common
     * ancestor.
     */
    variants?: Component[];
}

/**
 * The tool or component that created the annotation
 *
 * The component that the BOM describes.
 */
export type Component = {
    /**
     * [Deprecated] This will be removed in a future version. Use `@.authors` or
     * `@.manufacturer` instead.
     * The person(s) or organization(s) that authored the component
     */
    author?: string;
    /**
     * The person(s) who created the component.
     * Authors are common in components created through manual processes. Components created
     * through automated means may have `@.manufacturer` instead.
     */
    authors?: OrganizationalContact[];
    /**
     * An optional identifier which can be used to reference the component elsewhere in the BOM.
     * Every bom-ref must be unique within the BOM.
     * Value SHOULD not start with the BOM-Link intro 'urn:cdx:' to avoid conflicts with
     * BOM-Links.
     */
    "bom-ref"?: string;
    /**
     * A list of software and hardware components included in the parent component. This is not
     * a dependency tree. It provides a way to specify a hierarchical representation of
     * component assemblies, similar to system &#8594; subsystem &#8594; parts assembly in
     * physical supply chains.
     */
    components?: Component[];
    /**
     * A copyright notice informing users of the underlying claims to copyright ownership in a
     * published work.
     */
    copyright?: string;
    /**
     * Asserts the identity of the component using CPE. The CPE must conform to the CPE 2.2 or
     * 2.3 specification. See
     * [https://nvd.nist.gov/products/cpe](https://nvd.nist.gov/products/cpe). Refer to
     * `@.evidence.identity` to optionally provide evidence that substantiates the assertion of
     * the component's identity.
     */
    cpe?:              string;
    cryptoProperties?: CryptographicProperties;
    /**
     * This object SHOULD be specified for any component of type `data` and must not be
     * specified for other component types.
     */
    data?: FluffyComponentData[];
    /**
     * Specifies a description for the component
     */
    description?: string;
    /**
     * Provides the ability to document evidence collected through various forms of extraction
     * or analysis.
     */
    evidence?: FluffyEvidence;
    /**
     * External references provide a way to document systems, sites, and information that may be
     * relevant but are not included with the BOM. They may also establish specific
     * relationships within or external to the BOM.
     */
    externalReferences?: EnergyProviderExternalReference[];
    /**
     * The grouping name or identifier. This will often be a shortened, single name of the
     * company or project that produced the component, or the source package or domain name.
     * Whitespace and special characters should be avoided. Examples include: apache,
     * org.apache.commons, and apache.org.
     */
    group?: string;
    /**
     * The hashes of the component.
     */
    hashes?:   Hash[];
    licenses?: LicenseChoiceElement[];
    /**
     * The organization that created the component.
     * Manufacturer is common in components created through automated processes. Components
     * created through manual means may have `@.authors` instead.
     */
    manufacturer?: OrganizationalEntity;
    /**
     * The optional mime-type of the component. When used on file components, the mime-type can
     * provide additional context about the kind of file being represented, such as an image,
     * font, or executable. Some library or framework components may also have an associated
     * mime-type.
     */
    "mime-type"?: string;
    modelCard?:   FluffyModelCard;
    /**
     * [Deprecated] This will be removed in a future version. Use the pedigree element instead
     * to supply information on exactly how the component was modified. A boolean value
     * indicating if the component has been modified from the original. A value of true
     * indicates the component is a derivative of the original. A value of false indicates the
     * component has not been modified from the original.
     */
    modified?: boolean;
    /**
     * The name of the component. This will often be a shortened, single name of the component.
     * Examples: commons-lang3 and jquery
     */
    name: string;
    /**
     * Asserts the identity of the component using the OmniBOR Artifact ID. The OmniBOR, if
     * specified, must be valid and conform to the specification defined at:
     * [https://www.iana.org/assignments/uri-schemes/prov/gitoid](https://www.iana.org/assignments/uri-schemes/prov/gitoid).
     * Refer to `@.evidence.identity` to optionally provide evidence that substantiates the
     * assertion of the component's identity.
     */
    omniborId?: string[];
    /**
     * Component pedigree is a way to document complex supply chain scenarios where components
     * are created, distributed, modified, redistributed, combined with other components, etc.
     * Pedigree supports viewing this complex chain from the beginning, the end, or anywhere in
     * the middle. It also provides a way to document variants where the exact relation may not
     * be known.
     */
    pedigree?: FluffyComponentPedigree;
    /**
     * Provides the ability to document properties in a name-value store. This provides
     * flexibility to include data not officially supported in the standard without having to
     * use additional namespaces or create extensions. Unlike key-value stores, properties
     * support duplicate names, each potentially having different values. Property names of
     * interest to the general public are encouraged to be registered in the [CycloneDX Property
     * Taxonomy](https://github.com/CycloneDX/cyclonedx-property-taxonomy). Formal registration
     * is optional.
     */
    properties?: LightweightNameValuePairClass[];
    /**
     * The person(s) or organization(s) that published the component
     */
    publisher?: string;
    /**
     * Asserts the identity of the component using package-url (purl). The purl, if specified,
     * must be valid and conform to the specification defined at:
     * [https://github.com/package-url/purl-spec](https://github.com/package-url/purl-spec).
     * Refer to `@.evidence.identity` to optionally provide evidence that substantiates the
     * assertion of the component's identity.
     */
    purl?: string;
    /**
     * Specifies optional release notes.
     */
    releaseNotes?: FluffyReleaseNotes;
    /**
     * Specifies the scope of the component. If scope is not specified, 'required' scope SHOULD
     * be assumed by the consumer of the BOM.
     */
    scope?: ComponentScope;
    /**
     * Enveloped signature in [JSON Signature Format
     * (JSF)](https://cyberphone.github.io/doc/security/jsf.html).
     */
    signature?: Signature;
    /**
     * The organization that supplied the component. The supplier may often be the manufacturer,
     * but may also be a distributor or repackager.
     */
    supplier?: OrganizationalEntity;
    /**
     * Asserts the identity of the component using the Software Heritage persistent identifier
     * (SWHID). The SWHID, if specified, must be valid and conform to the specification defined
     * at:
     * [https://docs.softwareheritage.org/devel/swh-model/persistent-identifiers.html](https://docs.softwareheritage.org/devel/swh-model/persistent-identifiers.html).
     * Refer to `@.evidence.identity` to optionally provide evidence that substantiates the
     * assertion of the component's identity.
     */
    swhid?: string[];
    /**
     * Asserts the identity of the component using [ISO-IEC 19770-2 Software Identification
     * (SWID) Tags](https://www.iso.org/standard/65666.html). Refer to `@.evidence.identity` to
     * optionally provide evidence that substantiates the assertion of the component's identity.
     */
    swid?: FluffySWIDTag;
    tags?: string[];
    /**
     * Specifies the type of component. For software components, classify as application if no
     * more specific appropriate classification is available or cannot be determined for the
     * component.
     */
    type: TentacledComponentType;
    /**
     * The component version. The version should ideally comply with semantic versioning but is
     * not enforced.
     */
    version?: string;
}

/**
 * Specifies an individual commit
 */
export type FluffyCommit = {
    /**
     * The author who created the changes in the commit
     */
    author?: FluffyIdentifiableAction;
    /**
     * The person who committed or pushed the commit
     */
    committer?: FluffyIdentifiableAction;
    /**
     * The text description of the contents of the commit
     */
    message?: string;
    /**
     * A unique identifier of the commit. This may be version control specific. For example,
     * Subversion uses revision numbers whereas git uses commit hashes.
     */
    uid?: string;
    /**
     * The URL to the commit. This URL will typically point to a commit in a version control
     * system.
     */
    url?: string;
}

/**
 * The author who created the changes in the commit
 *
 * Specifies an individual commit
 *
 * The person who committed or pushed the commit
 */
export type FluffyIdentifiableAction = {
    /**
     * The email address of the individual who performed the action
     */
    email?: string;
    /**
     * The name of the individual who performed the action
     */
    name?: string;
    /**
     * The timestamp in which the action occurred
     */
    timestamp?: Date;
}

/**
 * Specifies an individual patch
 */
export type FluffyPatch = {
    /**
     * The patch file (or diff) that shows changes. Refer to
     * [https://en.wikipedia.org/wiki/Diff](https://en.wikipedia.org/wiki/Diff)
     */
    diff?: FluffyDiff;
    /**
     * A collection of issues the patch resolves
     */
    resolves?: Issue[];
    /**
     * Specifies the purpose for the patch including the resolution of defects, security issues,
     * or new behavior or functionality.
     */
    type: PatchType;
}

/**
 * The patch file (or diff) that shows changes. Refer to
 * [https://en.wikipedia.org/wiki/Diff](https://en.wikipedia.org/wiki/Diff)
 *
 * The patch file (or diff) that shows changes. Refer to https://en.wikipedia.org/wiki/Diff
 */
export type FluffyDiff = {
    /**
     * Specifies the optional text of the diff
     */
    text?: LicenseText;
    /**
     * Specifies the URL to the diff
     */
    url?: string;
}

/**
 * An optional way to include textual or encoded data.
 *
 * Specifies the metadata and content for an attachment.
 *
 * The graphic (vector or raster). Base64 encoding must be specified for binary images.
 *
 * An optional way to include the textual content of a license.
 *
 * Specifies the optional text of the diff
 *
 * Specifies the full content of the release note.
 *
 * Specifies the metadata and content of the SWID tag.
 *
 * Inputs that have the form of data.
 *
 * Outputs that have the form of data.
 *
 * Encoding of the raw event data.
 */
export type LicenseText = {
    /**
     * The attachment data. Proactive controls such as input validation and sanitization should
     * be employed to prevent misuse of attachment text.
     */
    content: string;
    /**
     * Specifies the format and nature of the data being attached, helping systems correctly
     * interpret and process the content. Common content type examples include
     * `application/json` for JSON data and `text/plain` for plan text documents.
     * [RFC 2045 section 5.1](https://www.ietf.org/rfc/rfc2045.html#section-5.1) outlines the
     * structure and use of content types. For a comprehensive list of registered content types,
     * refer to the [IANA media types
     * registry](https://www.iana.org/assignments/media-types/media-types.xhtml).
     */
    contentType?: string;
    /**
     * Specifies the optional encoding the text is represented in.
     */
    encoding?: Encoding;
}

/**
 * An individual issue that has been resolved.
 */
export type Issue = {
    /**
     * A description of the issue
     */
    description?: string;
    /**
     * The identifier of the issue assigned by the source of the issue
     */
    id?: string;
    /**
     * The name of the issue
     */
    name?: string;
    /**
     * A collection of URL's for reference. Multiple URLs are allowed.
     */
    references?: string[];
    /**
     * The source of the issue where it is documented
     */
    source?: TentacledSource;
    /**
     * Specifies the type of issue
     */
    type: ResolveType;
}

/**
 * The source of the issue where it is documented
 */
export type TentacledSource = {
    /**
     * The name of the source.
     */
    name?: string;
    /**
     * The url of the issue documentation as provided by the source
     */
    url?: string;
}

/**
 * The individual that is responsible for specific data governance role(s).
 *
 * The individual, not associated with an organization, that was granted the license
 *
 * The individual, not associated with an organization, that granted the license
 *
 * The individual, not associated with an organization, that purchased the license
 *
 * The person that created the annotation
 *
 * The author of the evidence.
 *
 * The reviewer of the evidence.
 */
export type OrganizationalContact = {
    /**
     * An optional identifier which can be used to reference the object elsewhere in the BOM.
     * Every bom-ref must be unique within the BOM.
     * Value SHOULD not start with the BOM-Link intro 'urn:cdx:' to avoid conflicts with
     * BOM-Links.
     */
    "bom-ref"?: string;
    /**
     * The email address of the contact.
     */
    email?: string;
    /**
     * The name of a contact
     */
    name?: string;
    /**
     * The phone number of the contact.
     */
    phone?: string;
}

/**
 * Cryptographic assets have properties that uniquely define them and that make them
 * actionable for further reasoning. As an example, it makes a difference if one knows the
 * algorithm family (e.g. AES) or the specific variant or instantiation (e.g. AES-128-GCM).
 * This is because the security level and the algorithm primitive (authenticated encryption)
 * are only defined by the definition of the algorithm variant. The presence of a weak
 * cryptographic algorithm like SHA1 vs. HMAC-SHA1 also makes a difference.
 */
export type CryptographicProperties = {
    /**
     * Additional properties specific to a cryptographic algorithm.
     */
    algorithmProperties?: AlgorithmProperties;
    /**
     * Cryptographic assets occur in several forms. Algorithms and protocols are most commonly
     * implemented in specialized cryptographic libraries. They may, however, also be
     * 'hardcoded' in software components. Certificates and related cryptographic material like
     * keys, tokens, secrets or passwords are other cryptographic assets to be modelled.
     */
    assetType: AssetType;
    /**
     * Properties for cryptographic assets of asset type 'certificate'
     */
    certificateProperties?: CertificateProperties;
    /**
     * The object identifier (OID) of the cryptographic asset.
     */
    oid?: string;
    /**
     * Properties specific to cryptographic assets of type: `protocol`.
     */
    protocolProperties?: ProtocolProperties;
    /**
     * Properties for cryptographic assets of asset type: `related-crypto-material`
     */
    relatedCryptoMaterialProperties?: RelatedCryptographicMaterialProperties;
}

/**
 * Additional properties specific to a cryptographic algorithm.
 */
export type AlgorithmProperties = {
    /**
     * The certification that the implementation of the cryptographic algorithm has received, if
     * any. Certifications include revisions and levels of FIPS 140 or Common Criteria of
     * different Extended Assurance Levels (CC-EAL).
     */
    certificationLevel?: CertificationLevel[];
    /**
     * The classical security level that a cryptographic algorithm provides (in bits).
     */
    classicalSecurityLevel?: number;
    /**
     * The cryptographic functions implemented by the cryptographic algorithm.
     */
    cryptoFunctions?: CryptographicFunction[];
    /**
     * The specific underlying Elliptic Curve (EC) definition employed which is an indicator of
     * the level of security strength, performance and complexity. Absent an authoritative
     * source of curve names, CycloneDX recommends using curve names as defined at
     * [https://neuromancer.sk/std/](https://neuromancer.sk/std/), the source of which can be
     * found at [https://github.com/J08nY/std-curves](https://github.com/J08nY/std-curves).
     */
    curve?: string;
    /**
     * The target and execution environment in which the algorithm is implemented in.
     */
    executionEnvironment?: ExecutionEnvironment;
    /**
     * The target platform for which the algorithm is implemented. The implementation can be
     * 'generic', running on any platform or for a specific platform.
     */
    implementationPlatform?: ImplementationPlatform;
    /**
     * The mode of operation in which the cryptographic algorithm (block cipher) is used.
     */
    mode?: AlgorithmPropertiesMode;
    /**
     * The NIST security strength category as defined in
     * https://csrc.nist.gov/projects/post-quantum-cryptography/post-quantum-cryptography-standardization/evaluation-criteria/security-(evaluation-criteria).
     * A value of 0 indicates that none of the categories are met.
     */
    nistQuantumSecurityLevel?: number;
    /**
     * The padding scheme that is used for the cryptographic algorithm.
     */
    padding?: Padding;
    /**
     * An identifier for the parameter set of the cryptographic algorithm. Examples: in AES128,
     * '128' identifies the key length in bits, in SHA256, '256' identifies the digest length,
     * '128' in SHAKE128 identifies its maximum security level in bits, and 'SHA2-128s'
     * identifies a parameter set used in SLH-DSA (FIPS205).
     */
    parameterSetIdentifier?: string;
    /**
     * Cryptographic building blocks used in higher-level cryptographic systems and protocols.
     * Primitives represent different cryptographic routines: deterministic random bit
     * generators (drbg, e.g. CTR_DRBG from NIST SP800-90A-r1), message authentication codes
     * (mac, e.g. HMAC-SHA-256), blockciphers (e.g. AES), streamciphers (e.g. Salsa20),
     * signatures (e.g. ECDSA), hash functions (e.g. SHA-256), public-key encryption schemes
     * (pke, e.g. RSA), extended output functions (xof, e.g. SHAKE256), key derivation functions
     * (e.g. pbkdf2), key agreement algorithms (e.g. ECDH), key encapsulation mechanisms (e.g.
     * ML-KEM), authenticated encryption (ae, e.g. AES-GCM) and the combination of multiple
     * algorithms (combiner, e.g. SP800-56Cr2).
     */
    primitive?: Primitive;
}

export type CertificationLevel = "none" | "fips140-1-l1" | "fips140-1-l2" | "fips140-1-l3" | "fips140-1-l4" | "fips140-2-l1" | "fips140-2-l2" | "fips140-2-l3" | "fips140-2-l4" | "fips140-3-l1" | "fips140-3-l2" | "fips140-3-l3" | "fips140-3-l4" | "cc-eal1" | "cc-eal1+" | "cc-eal2" | "cc-eal2+" | "cc-eal3" | "cc-eal3+" | "cc-eal4" | "cc-eal4+" | "cc-eal5" | "cc-eal5+" | "cc-eal6" | "cc-eal6+" | "cc-eal7" | "cc-eal7+" | "other" | "unknown";

export type CryptographicFunction = "generate" | "keygen" | "encrypt" | "decrypt" | "digest" | "tag" | "keyderive" | "sign" | "verify" | "encapsulate" | "decapsulate" | "other" | "unknown";

/**
 * The target and execution environment in which the algorithm is implemented in.
 */
export type ExecutionEnvironment = "software-plain-ram" | "software-encrypted-ram" | "software-tee" | "hardware" | "other" | "unknown";

/**
 * The target platform for which the algorithm is implemented. The implementation can be
 * 'generic', running on any platform or for a specific platform.
 */
export type ImplementationPlatform = "generic" | "x86_32" | "x86_64" | "armv7-a" | "armv7-m" | "armv8-a" | "armv8-m" | "armv9-a" | "armv9-m" | "s390x" | "ppc64" | "ppc64le" | "other" | "unknown";

/**
 * The mode of operation in which the cryptographic algorithm (block cipher) is used.
 */
export type AlgorithmPropertiesMode = "cbc" | "ecb" | "ccm" | "gcm" | "cfb" | "ofb" | "ctr" | "other" | "unknown";

/**
 * The padding scheme that is used for the cryptographic algorithm.
 */
export type Padding = "pkcs5" | "pkcs7" | "pkcs1v15" | "oaep" | "raw" | "other" | "unknown";

/**
 * Cryptographic building blocks used in higher-level cryptographic systems and protocols.
 * Primitives represent different cryptographic routines: deterministic random bit
 * generators (drbg, e.g. CTR_DRBG from NIST SP800-90A-r1), message authentication codes
 * (mac, e.g. HMAC-SHA-256), blockciphers (e.g. AES), streamciphers (e.g. Salsa20),
 * signatures (e.g. ECDSA), hash functions (e.g. SHA-256), public-key encryption schemes
 * (pke, e.g. RSA), extended output functions (xof, e.g. SHAKE256), key derivation functions
 * (e.g. pbkdf2), key agreement algorithms (e.g. ECDH), key encapsulation mechanisms (e.g.
 * ML-KEM), authenticated encryption (ae, e.g. AES-GCM) and the combination of multiple
 * algorithms (combiner, e.g. SP800-56Cr2).
 */
export type Primitive = "drbg" | "mac" | "block-cipher" | "stream-cipher" | "signature" | "hash" | "pke" | "xof" | "kdf" | "key-agree" | "kem" | "ae" | "combiner" | "other" | "unknown";

/**
 * Cryptographic assets occur in several forms. Algorithms and protocols are most commonly
 * implemented in specialized cryptographic libraries. They may, however, also be
 * 'hardcoded' in software components. Certificates and related cryptographic material like
 * keys, tokens, secrets or passwords are other cryptographic assets to be modelled.
 */
export type AssetType = "algorithm" | "certificate" | "protocol" | "related-crypto-material";

/**
 * Properties for cryptographic assets of asset type 'certificate'
 */
export type CertificateProperties = {
    /**
     * The file extension of the certificate
     */
    certificateExtension?: string;
    /**
     * The format of the certificate
     */
    certificateFormat?: string;
    /**
     * The issuer name for the certificate
     */
    issuerName?: string;
    /**
     * The date and time according to ISO-8601 standard from which the certificate is not valid
     * anymore
     */
    notValidAfter?: Date;
    /**
     * The date and time according to ISO-8601 standard from which the certificate is valid
     */
    notValidBefore?: Date;
    /**
     * The bom-ref to signature algorithm used by the certificate
     */
    signatureAlgorithmRef?: string;
    /**
     * The subject name for the certificate
     */
    subjectName?: string;
    /**
     * The bom-ref to the public key of the subject
     */
    subjectPublicKeyRef?: string;
}

/**
 * Properties specific to cryptographic assets of type: `protocol`.
 */
export type ProtocolProperties = {
    /**
     * A list of cipher suites related to the protocol.
     */
    cipherSuites?: CipherSuite[];
    /**
     * A list of protocol-related cryptographic assets
     */
    cryptoRefArray?: string[];
    /**
     * The IKEv2 transform types supported (types 1-4), defined in [RFC 7296 section
     * 3.3.2](https://www.ietf.org/rfc/rfc7296.html#section-3.3.2), and additional properties.
     */
    ikev2TransformTypes?: IKEv2TransformTypes;
    /**
     * The concrete protocol type.
     */
    type?: ProtocolPropertiesType;
    /**
     * The version of the protocol.
     */
    version?: string;
}

/**
 * Object representing a cipher suite
 */
export type CipherSuite = {
    /**
     * A list of algorithms related to the cipher suite.
     */
    algorithms?: string[];
    /**
     * A list of common identifiers for the cipher suite.
     */
    identifiers?: string[];
    /**
     * A common name for the cipher suite.
     */
    name?: string;
}

/**
 * The IKEv2 transform types supported (types 1-4), defined in [RFC 7296 section
 * 3.3.2](https://www.ietf.org/rfc/rfc7296.html#section-3.3.2), and additional properties.
 */
export type IKEv2TransformTypes = {
    /**
     * IKEv2 Authentication method
     */
    auth?: string[];
    /**
     * Transform Type 1: encryption algorithms
     */
    encr?: string[];
    /**
     * Specifies if an Extended Sequence Number (ESN) is used.
     */
    esn?: boolean;
    /**
     * Transform Type 3: integrity algorithms
     */
    integ?: string[];
    /**
     * Transform Type 4: Key Exchange Method (KE) per [RFC
     * 9370](https://www.ietf.org/rfc/rfc9370.html), formerly called Diffie-Hellman Group (D-H).
     */
    ke?: string[];
    /**
     * Transform Type 2: pseudorandom functions
     */
    prf?: string[];
}

/**
 * The concrete protocol type.
 */
export type ProtocolPropertiesType = "tls" | "ssh" | "ipsec" | "ike" | "sstp" | "wpa" | "other" | "unknown";

/**
 * Properties for cryptographic assets of asset type: `related-crypto-material`
 */
export type RelatedCryptographicMaterialProperties = {
    /**
     * The date and time (timestamp) when the related cryptographic material was activated.
     */
    activationDate?: Date;
    /**
     * The bom-ref to the algorithm used to generate the related cryptographic material.
     */
    algorithmRef?: string;
    /**
     * The date and time (timestamp) when the related cryptographic material was created.
     */
    creationDate?: Date;
    /**
     * The date and time (timestamp) when the related cryptographic material expires.
     */
    expirationDate?: Date;
    /**
     * The format of the related cryptographic material (e.g. P8, PEM, DER).
     */
    format?: string;
    /**
     * The optional unique identifier for the related cryptographic material.
     */
    id?: string;
    /**
     * The mechanism by which the cryptographic asset is secured by.
     */
    securedBy?: SecuredBy;
    /**
     * The size of the cryptographic asset (in bits).
     */
    size?: number;
    /**
     * The key state as defined by NIST SP 800-57.
     */
    state?: State;
    /**
     * The type for the related cryptographic material
     */
    type?: RelatedCryptoMaterialType;
    /**
     * The date and time (timestamp) when the related cryptographic material was updated.
     */
    updateDate?: Date;
    /**
     * The associated value of the cryptographic material.
     */
    value?: string;
}

/**
 * The mechanism by which the cryptographic asset is secured by.
 *
 * Specifies the mechanism by which the cryptographic asset is secured by
 */
export type SecuredBy = {
    /**
     * The bom-ref to the algorithm.
     */
    algorithmRef?: string;
    /**
     * Specifies the mechanism by which the cryptographic asset is secured by.
     */
    mechanism?: string;
}

/**
 * The key state as defined by NIST SP 800-57.
 */
export type State = "pre-activation" | "active" | "suspended" | "deactivated" | "compromised" | "destroyed";

/**
 * The type for the related cryptographic material
 */
export type RelatedCryptoMaterialType = "private-key" | "public-key" | "secret-key" | "key" | "ciphertext" | "signature" | "digest" | "initialization-vector" | "nonce" | "seed" | "salt" | "shared-secret" | "tag" | "additional-data" | "password" | "credential" | "token" | "other" | "unknown";

export type FluffyComponentData = {
    /**
     * An optional identifier which can be used to reference the dataset elsewhere in the BOM.
     * Every bom-ref must be unique within the BOM.
     * Value SHOULD not start with the BOM-Link intro 'urn:cdx:' to avoid conflicts with
     * BOM-Links.
     */
    "bom-ref"?:      string;
    classification?: string;
    /**
     * The contents or references to the contents of the data being described.
     */
    contents?: FluffyDataContents;
    /**
     * A description of the dataset. Can describe size of dataset, whether it's used for source
     * code, training, testing, or validation, etc.
     */
    description?: string;
    governance?:  TentacledDataGovernance;
    graphics?:    FluffyGraphicsCollection;
    /**
     * The name of the dataset.
     */
    name?: string;
    /**
     * A description of any sensitive data in a dataset.
     */
    sensitiveData?: string[];
    /**
     * The general theme or subject matter of the data being specified.
     */
    type: TypeOfData;
}

/**
 * The contents or references to the contents of the data being described.
 */
export type FluffyDataContents = {
    /**
     * An optional way to include textual or encoded data.
     */
    attachment?: LicenseText;
    /**
     * Provides the ability to document name-value parameters used for configuration.
     */
    properties?: LightweightNameValuePairClass[];
    /**
     * The URL to where the data can be retrieved.
     */
    url?: string;
}

/**
 * Provides the ability to document properties in a name-value store. This provides
 * flexibility to include data not officially supported in the standard without having to
 * use additional namespaces or create extensions. Unlike key-value stores, properties
 * support duplicate names, each potentially having different values. Property names of
 * interest to the general public are encouraged to be registered in the [CycloneDX Property
 * Taxonomy](https://github.com/CycloneDX/cyclonedx-property-taxonomy). Formal registration
 * is optional.
 */
export type LightweightNameValuePairClass = {
    /**
     * The name of the property. Duplicate names are allowed, each potentially having a
     * different value.
     */
    name: string;
    /**
     * The value of the property.
     */
    value?: string;
}

/**
 * Data governance captures information regarding data ownership, stewardship, and
 * custodianship, providing insights into the individuals or entities responsible for
 * managing, overseeing, and safeguarding the data throughout its lifecycle.
 */
export type TentacledDataGovernance = {
    /**
     * Data custodians are responsible for the safe custody, transport, and storage of data.
     */
    custodians?: FluffyDataGovernanceResponsibleParty[];
    /**
     * Data owners are concerned with risk and appropriate access to data.
     */
    owners?: FluffyDataGovernanceResponsibleParty[];
    /**
     * Data stewards are responsible for data content, context, and associated business rules.
     */
    stewards?: FluffyDataGovernanceResponsibleParty[];
}

export type FluffyDataGovernanceResponsibleParty = {
    /**
     * The individual that is responsible for specific data governance role(s).
     */
    contact?: OrganizationalContact;
    /**
     * The organization that is responsible for specific data governance role(s).
     */
    organization?: OrganizationalEntity;
}

/**
 * The organization that is responsible for specific data governance role(s).
 *
 * The organization that was granted the license
 *
 * The organization that granted the license
 *
 * The organization that purchased the license
 *
 * The organization that created the component.
 * Manufacturer is common in components created through automated processes. Components
 * created through manual means may have `@.authors` instead.
 *
 * The organization that supplied the component. The supplier may often be the manufacturer,
 * but may also be a distributor or repackager.
 *
 * The organization that created the annotation
 *
 * The organization that provides the service.
 *
 * The signatory's organization.
 *
 * The entity issuing the assessment.
 *
 * [Deprecated] This will be removed in a future version. Use the `@.component.manufacturer`
 * instead.
 * The organization that manufactured the component that the BOM describes.
 *
 * The organization that created the BOM.
 * Manufacturer is common in BOMs created through automated processes. BOMs created through
 * manual means may have `@.authors` instead.
 *
 * The organization that supplied the component that the BOM describes. The supplier may
 * often be the manufacturer, but may also be a distributor or repackager.
 */
export type OrganizationalEntity = {
    /**
     * The physical address (location) of the organization
     */
    address?: PostalAddress;
    /**
     * An optional identifier which can be used to reference the object elsewhere in the BOM.
     * Every bom-ref must be unique within the BOM.
     * Value SHOULD not start with the BOM-Link intro 'urn:cdx:' to avoid conflicts with
     * BOM-Links.
     */
    "bom-ref"?: string;
    /**
     * A contact at the organization. Multiple contacts are allowed.
     */
    contact?: OrganizationalContact[];
    /**
     * The name of the organization
     */
    name?: string;
    /**
     * The URL of the organization. Multiple URLs are allowed.
     */
    url?: string[];
}

/**
 * The physical address (location) of the organization
 *
 * An address used to identify a contactable location.
 */
export type PostalAddress = {
    /**
     * An optional identifier which can be used to reference the address elsewhere in the BOM.
     * Every bom-ref must be unique within the BOM.
     * Value SHOULD not start with the BOM-Link intro 'urn:cdx:' to avoid conflicts with
     * BOM-Links.
     */
    "bom-ref"?: string;
    /**
     * The country name or the two-letter ISO 3166-1 country code.
     */
    country?: string;
    /**
     * The locality or city within the country.
     */
    locality?: string;
    /**
     * The postal code.
     */
    postalCode?: string;
    /**
     * The post office box number.
     */
    postOfficeBoxNumber?: string;
    /**
     * The region or state in the country.
     */
    region?: string;
    /**
     * The street address.
     */
    streetAddress?: string;
}

/**
 * A collection of graphics that represent various measurements.
 */
export type FluffyGraphicsCollection = {
    /**
     * A collection of graphics.
     */
    collection?: PurpleGraphic[];
    /**
     * A description of this collection of graphics.
     */
    description?: string;
}

export type PurpleGraphic = {
    /**
     * The graphic (vector or raster). Base64 encoding must be specified for binary images.
     */
    image?: LicenseText;
    /**
     * The name of the graphic.
     */
    name?: string;
}

/**
 * Provides the ability to document evidence collected through various forms of extraction
 * or analysis.
 */
export type FluffyEvidence = {
    /**
     * Evidence of the components use through the callstack.
     */
    callstack?: CallStack;
    /**
     * Copyright evidence captures intellectual property assertions, providing evidence of
     * possible ownership and legal protection.
     */
    copyright?: FluffyCopyright[];
    /**
     * Evidence that substantiates the identity of a component. The identity may be an object or
     * an array of identity objects. Support for specifying identity as a single object was
     * introduced in CycloneDX v1.5. Arrays were introduced in v1.6. It is recommended that all
     * implementations use arrays, even if only one identity object is specified.
     */
    identity?: IdentityEvidenceElement[] | IdentityEvidenceElement;
    licenses?: LicenseChoiceElement[];
    /**
     * Evidence of individual instances of a component spread across multiple locations.
     */
    occurrences?: FluffyOccurrence[];
}

/**
 * Evidence of the components use through the callstack.
 */
export type CallStack = {
    /**
     * Within a call stack, a frame is a discrete unit that encapsulates an execution context,
     * including local variables, parameters, and the return address. As function calls are
     * made, frames are pushed onto the stack, forming an array-like structure that orchestrates
     * the flow of program execution and manages the sequence of function invocations.
     */
    frames?: Frame[];
}

export type Frame = {
    /**
     * The column the code that is called resides.
     */
    column?: number;
    /**
     * The full path and filename of the module.
     */
    fullFilename?: string;
    /**
     * A block of code designed to perform a particular task.
     */
    function?: string;
    /**
     * The line number the code that is called resides on.
     */
    line?: number;
    /**
     * A module or class that encloses functions/methods and other code.
     */
    module: string;
    /**
     * A package organizes modules into namespaces, providing a unique namespace for each type
     * it contains.
     */
    package?: string;
    /**
     * Optional arguments that are passed to the module or function.
     */
    parameters?: string[];
}

/**
 * A copyright notice informing users of the underlying claims to copyright ownership in a
 * published work.
 */
export type FluffyCopyright = {
    /**
     * The textual content of the copyright.
     */
    text: string;
}

/**
 * Evidence that substantiates the identity of a component.
 *
 * [Deprecated]
 */
export type IdentityEvidenceElement = {
    /**
     * The value of the field (cpe, purl, etc) that has been concluded based on the aggregate of
     * all methods (if available).
     */
    concludedValue?: string;
    /**
     * The overall confidence of the evidence from 0 - 1, where 1 is 100% confidence.
     */
    confidence?: number;
    /**
     * The identity field of the component which the evidence describes.
     */
    field: IdentityEvidenceField;
    /**
     * The methods used to extract and/or analyze the evidence.
     */
    methods?: IdentityEvidenceMethod[];
    /**
     * The object in the BOM identified by its bom-ref. This is often a component or service but
     * may be any object type supporting bom-refs. Tools used for analysis should already be
     * defined in the BOM, either in the metadata/tools, components, or formulation.
     */
    tools?: string[];
}

/**
 * The identity field of the component which the evidence describes.
 */
export type IdentityEvidenceField = "group" | "name" | "version" | "purl" | "cpe" | "omniborId" | "swhid" | "swid" | "hash";

export type IdentityEvidenceMethod = {
    /**
     * The confidence of the evidence from 0 - 1, where 1 is 100% confidence. Confidence is
     * specific to the technique used. Each technique of analysis can have independent
     * confidence.
     */
    confidence: number;
    /**
     * The technique used in this method of analysis.
     */
    technique: Technique;
    /**
     * The value or contents of the evidence.
     */
    value?: string;
}

/**
 * A list of SPDX licenses and/or named licenses.
 *
 * A tuple of exactly one SPDX License Expression.
 */
export type LicenseChoiceElement = {
    license?:         License;
    acknowledgement?: LicenseAcknowledgement;
    /**
     * An optional identifier which can be used to reference the license elsewhere in the BOM.
     * Every bom-ref must be unique within the BOM.
     * Value SHOULD not start with the BOM-Link intro 'urn:cdx:' to avoid conflicts with
     * BOM-Links.
     */
    "bom-ref"?: string;
    /**
     * A valid SPDX license expression.
     * Refer to https://spdx.org/specifications for syntax requirements
     */
    expression?: string;
}

/**
 * Declared licenses and concluded licenses represent two different stages in the licensing
 * process within software development. Declared licenses refer to the initial intention of
 * the software authors regarding the licensing terms under which their code is released. On
 * the other hand, concluded licenses are the result of a comprehensive analysis of the
 * project's codebase to identify and confirm the actual licenses of the components used,
 * which may differ from the initially declared licenses. While declared licenses provide an
 * upfront indication of the licensing intentions, concluded licenses offer a more thorough
 * understanding of the actual licensing within a project, facilitating proper compliance
 * and risk management. Observed licenses are defined in `@.evidence.licenses`. Observed
 * licenses form the evidence necessary to substantiate a concluded license.
 */
export type LicenseAcknowledgement = "declared" | "concluded";

/**
 * Specifies the details and attributes related to a software license. It can either include
 * a valid SPDX license identifier or a named license, along with additional properties such
 * as license acknowledgment, comprehensive commercial licensing information, and the full
 * text of the license.
 */
export type License = {
    acknowledgement?: LicenseAcknowledgement;
    /**
     * An optional identifier which can be used to reference the license elsewhere in the BOM.
     * Every bom-ref must be unique within the BOM.
     * Value SHOULD not start with the BOM-Link intro 'urn:cdx:' to avoid conflicts with
     * BOM-Links.
     */
    "bom-ref"?: string;
    /**
     * A valid SPDX license identifier. If specified, this value must be one of the enumeration
     * of valid SPDX license identifiers defined in the spdx.schema.json (or spdx.xml) subschema
     * which is synchronized with the official SPDX license list.
     */
    id?: SpdxSchema;
    /**
     * Licensing details describing the licensor/licensee, license type, renewal and expiration
     * dates, and other important metadata
     */
    licensing?: LicenseLicensing;
    /**
     * The name of the license. This may include the name of a commercial or proprietary license
     * or an open source license that may not be defined by SPDX.
     */
    name?: string;
    /**
     * Provides the ability to document properties in a name-value store. This provides
     * flexibility to include data not officially supported in the standard without having to
     * use additional namespaces or create extensions. Unlike key-value stores, properties
     * support duplicate names, each potentially having different values. Property names of
     * interest to the general public are encouraged to be registered in the [CycloneDX Property
     * Taxonomy](https://github.com/CycloneDX/cyclonedx-property-taxonomy). Formal registration
     * is optional.
     */
    properties?: LightweightNameValuePairClass[];
    /**
     * An optional way to include the textual content of a license.
     */
    text?: LicenseText;
    /**
     * The URL to the license file. If specified, a 'license' externalReference should also be
     * specified for completeness
     */
    url?: string;
}

/**
 * Licensing details describing the licensor/licensee, license type, renewal and expiration
 * dates, and other important metadata
 */
export type LicenseLicensing = {
    /**
     * License identifiers that may be used to manage licenses and their lifecycle
     */
    altIds?: string[];
    /**
     * The timestamp indicating when the current license expires (if applicable).
     */
    expiration?: Date;
    /**
     * The timestamp indicating when the license was last renewed. For new purchases, this is
     * often the purchase or acquisition date. For non-perpetual licenses or subscriptions, this
     * is the timestamp of when the license was last renewed.
     */
    lastRenewal?: Date;
    /**
     * The individual or organization for which a license was granted to
     */
    licensee?: FluffyLicensee;
    /**
     * The type of license(s) that was granted to the licensee.
     */
    licenseTypes?: LicenseType[];
    /**
     * The individual or organization that grants a license to another individual or organization
     */
    licensor?: FluffyLicensor;
    /**
     * The purchase order identifier the purchaser sent to a supplier or vendor to authorize a
     * purchase
     */
    purchaseOrder?: string;
    /**
     * The individual or organization that purchased the license
     */
    purchaser?: FluffyPurchaser;
}

/**
 * The individual or organization for which a license was granted to
 */
export type FluffyLicensee = {
    /**
     * The individual, not associated with an organization, that was granted the license
     */
    individual?: OrganizationalContact;
    /**
     * The organization that was granted the license
     */
    organization?: OrganizationalEntity;
}

/**
 * The individual or organization that grants a license to another individual or organization
 */
export type FluffyLicensor = {
    /**
     * The individual, not associated with an organization, that granted the license
     */
    individual?: OrganizationalContact;
    /**
     * The organization that granted the license
     */
    organization?: OrganizationalEntity;
}

/**
 * The individual or organization that purchased the license
 */
export type FluffyPurchaser = {
    /**
     * The individual, not associated with an organization, that purchased the license
     */
    individual?: OrganizationalContact;
    /**
     * The organization that purchased the license
     */
    organization?: OrganizationalEntity;
}

export type FluffyOccurrence = {
    /**
     * Any additional context of the detected component (e.g. a code snippet).
     */
    additionalContext?: string;
    /**
     * An optional identifier which can be used to reference the occurrence elsewhere in the
     * BOM. Every bom-ref must be unique within the BOM.
     * Value SHOULD not start with the BOM-Link intro 'urn:cdx:' to avoid conflicts with
     * BOM-Links.
     */
    "bom-ref"?: string;
    /**
     * The line number where the component was found.
     */
    line?: number;
    /**
     * The location or path to where the component was found.
     */
    location: string;
    /**
     * The offset where the component was found.
     */
    offset?: number;
    /**
     * The symbol name that was found associated with the component.
     */
    symbol?: string;
}

/**
 * External references provide a way to document systems, sites, and information that may be
 * relevant but are not included with the BOM. They may also establish specific
 * relationships within or external to the BOM.
 *
 * Reference to an externally accessible resource.
 */
export type EnergyProviderExternalReference = {
    /**
     * An optional comment describing the external reference
     */
    comment?: string;
    /**
     * The hashes of the external reference (if applicable).
     */
    hashes?: Hash[];
    /**
     * Specifies the type of external reference.
     */
    type: TentacledType;
    /**
     * The URI (URL or URN) to the external reference. External references are URIs and
     * therefore can accept any URL scheme including https
     * ([RFC-7230](https://www.ietf.org/rfc/rfc7230.txt)), mailto
     * ([RFC-2368](https://www.ietf.org/rfc/rfc2368.txt)), tel
     * ([RFC-3966](https://www.ietf.org/rfc/rfc3966.txt)), and dns
     * ([RFC-4501](https://www.ietf.org/rfc/rfc4501.txt)). External references may also include
     * formally registered URNs such as [CycloneDX
     * BOM-Link](https://cyclonedx.org/capabilities/bomlink/) to reference CycloneDX BOMs or any
     * object within a BOM. BOM-Link transforms applicable external references into
     * relationships that can be expressed in a BOM or across BOMs.
     */
    url: string;
}

export type Hash = {
    alg:     HashAlgorithm;
    content: string;
}

/**
 * Specifies the type of external reference.
 */
export type TentacledType = "vcs" | "issue-tracker" | "website" | "advisories" | "bom" | "mailing-list" | "social" | "chat" | "documentation" | "support" | "source-distribution" | "distribution" | "distribution-intake" | "license" | "build-meta" | "build-system" | "release-notes" | "security-contact" | "model-card" | "log" | "configuration" | "evidence" | "formulation" | "attestation" | "threat-model" | "adversary-model" | "risk-assessment" | "vulnerability-assertion" | "exploitability-statement" | "pentest-report" | "static-analysis-report" | "dynamic-analysis-report" | "runtime-analysis-report" | "component-analysis-report" | "maturity-report" | "certification-report" | "codified-infrastructure" | "quality-metrics" | "poam" | "electronic-signature" | "digital-signature" | "rfc-9116" | "other";

/**
 * A model card describes the intended uses of a machine learning model and potential
 * limitations, including biases and ethical considerations. Model cards typically contain
 * the training parameters, which datasets were used to train the model, performance
 * metrics, and other relevant data useful for ML transparency. This object SHOULD be
 * specified for any component of type `machine-learning-model` and must not be specified
 * for other component types.
 */
export type FluffyModelCard = {
    /**
     * An optional identifier which can be used to reference the model card elsewhere in the
     * BOM. Every bom-ref must be unique within the BOM.
     * Value SHOULD not start with the BOM-Link intro 'urn:cdx:' to avoid conflicts with
     * BOM-Links.
     */
    "bom-ref"?: string;
    /**
     * What considerations should be taken into account regarding the model's construction,
     * training, and application?
     */
    considerations?: FluffyConsiderations;
    /**
     * Hyper-parameters for construction of the model.
     */
    modelParameters?: FluffyModelParameters;
    /**
     * Provides the ability to document properties in a name-value store. This provides
     * flexibility to include data not officially supported in the standard without having to
     * use additional namespaces or create extensions. Unlike key-value stores, properties
     * support duplicate names, each potentially having different values. Property names of
     * interest to the general public are encouraged to be registered in the [CycloneDX Property
     * Taxonomy](https://github.com/CycloneDX/cyclonedx-property-taxonomy). Formal registration
     * is optional.
     */
    properties?: LightweightNameValuePairClass[];
    /**
     * A quantitative analysis of the model
     */
    quantitativeAnalysis?: FluffyQuantitativeAnalysis;
}

/**
 * What considerations should be taken into account regarding the model's construction,
 * training, and application?
 */
export type FluffyConsiderations = {
    /**
     * What are the various environmental impacts the corresponding machine learning model has
     * exhibited across its lifecycle?
     */
    environmentalConsiderations?: EnvironmentalConsiderations;
    /**
     * What are the ethical risks involved in the application of this model?
     */
    ethicalConsiderations?: PurpleRisk[];
    /**
     * How does the model affect groups at risk of being systematically disadvantaged? What are
     * the harms and benefits to the various affected groups?
     */
    fairnessAssessments?: FluffyFairnessAssessment[];
    /**
     * What are the known tradeoffs in accuracy/performance of the model?
     */
    performanceTradeoffs?: string[];
    /**
     * What are the known technical limitations of the model? E.g. What kind(s) of data should
     * the model be expected not to perform well on? What are the factors that might degrade
     * model performance?
     */
    technicalLimitations?: string[];
    /**
     * What are the intended use cases of the model?
     */
    useCases?: string[];
    /**
     * Who are the intended users of the model?
     */
    users?: string[];
}

/**
 * What are the various environmental impacts the corresponding machine learning model has
 * exhibited across its lifecycle?
 *
 * Describes various environmental impact metrics.
 */
export type EnvironmentalConsiderations = {
    /**
     * Describes energy consumption information incurred for one or more component lifecycle
     * activities.
     */
    energyConsumptions?: EnergyConsumption[];
    /**
     * Provides the ability to document properties in a name-value store. This provides
     * flexibility to include data not officially supported in the standard without having to
     * use additional namespaces or create extensions. Unlike key-value stores, properties
     * support duplicate names, each potentially having different values. Property names of
     * interest to the general public are encouraged to be registered in the [CycloneDX Property
     * Taxonomy](https://github.com/CycloneDX/cyclonedx-property-taxonomy). Formal registration
     * is optional.
     */
    properties?: LightweightNameValuePairClass[];
}

/**
 * Describes energy consumption information incurred for the specified lifecycle activity.
 */
export type EnergyConsumption = {
    /**
     * The type of activity that is part of a machine learning model development or operational
     * lifecycle.
     */
    activity: Activity;
    /**
     * The total energy cost associated with the model lifecycle activity.
     */
    activityEnergyCost: EnergyMeasure;
    /**
     * The CO2 cost (debit) equivalent to the total energy cost.
     */
    co2CostEquivalent?: CO2Measure;
    /**
     * The CO2 offset (credit) for the CO2 equivalent cost.
     */
    co2CostOffset?: CO2Measure;
    /**
     * The provider(s) of the energy consumed by the associated model development lifecycle
     * activity.
     */
    energyProviders: EnergyProvider[];
    /**
     * Provides the ability to document properties in a name-value store. This provides
     * flexibility to include data not officially supported in the standard without having to
     * use additional namespaces or create extensions. Unlike key-value stores, properties
     * support duplicate names, each potentially having different values. Property names of
     * interest to the general public are encouraged to be registered in the [CycloneDX Property
     * Taxonomy](https://github.com/CycloneDX/cyclonedx-property-taxonomy). Formal registration
     * is optional.
     */
    properties?: LightweightNameValuePairClass[];
}

/**
 * The type of activity that is part of a machine learning model development or operational
 * lifecycle.
 */
export type Activity = "design" | "data-collection" | "data-preparation" | "training" | "fine-tuning" | "validation" | "deployment" | "inference" | "other";

/**
 * The total energy cost associated with the model lifecycle activity.
 *
 * A measure of energy.
 *
 * The energy provided by the energy source for an associated activity.
 */
export type EnergyMeasure = {
    /**
     * Unit of energy.
     */
    unit: ActivityEnergyCostUnit;
    /**
     * Quantity of energy.
     */
    value: number;
}

/**
 * Unit of energy.
 */
export type ActivityEnergyCostUnit = "kWh";

/**
 * The CO2 cost (debit) equivalent to the total energy cost.
 *
 * A measure of carbon dioxide (CO2).
 *
 * The CO2 offset (credit) for the CO2 equivalent cost.
 */
export type CO2Measure = {
    /**
     * Unit of carbon dioxide (CO2).
     */
    unit: Co2CostEquivalentUnit;
    /**
     * Quantity of carbon dioxide (CO2).
     */
    value: number;
}

/**
 * Unit of carbon dioxide (CO2).
 */
export type Co2CostEquivalentUnit = "tCO2eq";

/**
 * Describes the physical provider of energy used for model development or operations.
 */
export type EnergyProvider = {
    /**
     * An optional identifier which can be used to reference the energy provider elsewhere in
     * the BOM. Every bom-ref must be unique within the BOM.
     * Value SHOULD not start with the BOM-Link intro 'urn:cdx:' to avoid conflicts with
     * BOM-Links.
     */
    "bom-ref"?: string;
    /**
     * A description of the energy provider.
     */
    description?: string;
    /**
     * The energy provided by the energy source for an associated activity.
     */
    energyProvided: EnergyMeasure;
    /**
     * The energy source for the energy provider.
     */
    energySource: EnergySource;
    /**
     * External references provide a way to document systems, sites, and information that may be
     * relevant but are not included with the BOM. They may also establish specific
     * relationships within or external to the BOM.
     */
    externalReferences?: EnergyProviderExternalReference[];
    /**
     * The organization that provides energy.
     */
    organization: Organization;
}

/**
 * The energy source for the energy provider.
 */
export type EnergySource = "coal" | "oil" | "natural-gas" | "nuclear" | "wind" | "solar" | "geothermal" | "hydropower" | "biofuel" | "unknown" | "other";

/**
 * The organization that provides energy.
 *
 * The organization that is responsible for specific data governance role(s).
 *
 * The organization that was granted the license
 *
 * The organization that granted the license
 *
 * The organization that purchased the license
 *
 * The organization that created the component.
 * Manufacturer is common in components created through automated processes. Components
 * created through manual means may have `@.authors` instead.
 *
 * The organization that supplied the component. The supplier may often be the manufacturer,
 * but may also be a distributor or repackager.
 *
 * The organization that created the annotation
 *
 * The organization that provides the service.
 *
 * The signatory's organization.
 *
 * The entity issuing the assessment.
 *
 * [Deprecated] This will be removed in a future version. Use the `@.component.manufacturer`
 * instead.
 * The organization that manufactured the component that the BOM describes.
 *
 * The organization that created the BOM.
 * Manufacturer is common in BOMs created through automated processes. BOMs created through
 * manual means may have `@.authors` instead.
 *
 * The organization that supplied the component that the BOM describes. The supplier may
 * often be the manufacturer, but may also be a distributor or repackager.
 */
export type Organization = {
    /**
     * The physical address (location) of the organization
     */
    address?: PostalAddress;
    /**
     * An optional identifier which can be used to reference the object elsewhere in the BOM.
     * Every bom-ref must be unique within the BOM.
     * Value SHOULD not start with the BOM-Link intro 'urn:cdx:' to avoid conflicts with
     * BOM-Links.
     */
    "bom-ref"?: string;
    /**
     * A contact at the organization. Multiple contacts are allowed.
     */
    contact?: OrganizationalContact[];
    /**
     * The name of the organization
     */
    name?: string;
    /**
     * The URL of the organization. Multiple URLs are allowed.
     */
    url?: string[];
}

export type PurpleRisk = {
    /**
     * Strategy used to address this risk.
     */
    mitigationStrategy?: string;
    /**
     * The name of the risk.
     */
    name?: string;
}

/**
 * Information about the benefits and harms of the model to an identified at risk group.
 */
export type FluffyFairnessAssessment = {
    /**
     * Expected benefits to the identified groups.
     */
    benefits?: string;
    /**
     * The groups or individuals at risk of being systematically disadvantaged by the model.
     */
    groupAtRisk?: string;
    /**
     * Expected harms to the identified groups.
     */
    harms?: string;
    /**
     * With respect to the benefits and harms outlined, please describe any mitigation strategy
     * implemented.
     */
    mitigationStrategy?: string;
}

/**
 * Hyper-parameters for construction of the model.
 */
export type FluffyModelParameters = {
    /**
     * The overall approach to learning used by the model for problem solving.
     */
    approach?: FluffyApproach;
    /**
     * The model architecture family such as transformer network, convolutional neural network,
     * residual neural network, LSTM neural network, etc.
     */
    architectureFamily?: string;
    /**
     * The datasets used to train and evaluate the model.
     */
    datasets?: FluffyDataset[];
    /**
     * The input format(s) of the model
     */
    inputs?: FluffyInputAndOutputParameters[];
    /**
     * The specific architecture of the model such as GPT-1, ResNet-50, YOLOv3, etc.
     */
    modelArchitecture?: string;
    /**
     * The output format(s) from the model
     */
    outputs?: FluffyInputAndOutputParameters[];
    /**
     * Directly influences the input and/or output. Examples include classification, regression,
     * clustering, etc.
     */
    task?: string;
}

/**
 * The overall approach to learning used by the model for problem solving.
 */
export type FluffyApproach = {
    /**
     * Learning types describing the learning problem or hybrid learning problem.
     */
    type?: LearningType;
}

export type FluffyDataset = {
    /**
     * An optional identifier which can be used to reference the dataset elsewhere in the BOM.
     * Every bom-ref must be unique within the BOM.
     * Value SHOULD not start with the BOM-Link intro 'urn:cdx:' to avoid conflicts with
     * BOM-Links.
     */
    "bom-ref"?:      string;
    classification?: string;
    /**
     * The contents or references to the contents of the data being described.
     */
    contents?: FluffyDataContents;
    /**
     * A description of the dataset. Can describe size of dataset, whether it's used for source
     * code, training, testing, or validation, etc.
     */
    description?: string;
    governance?:  TentacledDataGovernance;
    graphics?:    FluffyGraphicsCollection;
    /**
     * The name of the dataset.
     */
    name?: string;
    /**
     * A description of any sensitive data in a dataset.
     */
    sensitiveData?: string[];
    /**
     * The general theme or subject matter of the data being specified.
     */
    type?: TypeOfData;
    /**
     * References a data component by the components bom-ref attribute
     */
    ref?: string;
}

export type FluffyInputAndOutputParameters = {
    /**
     * The data format for input/output to the model.
     */
    format?: string;
}

/**
 * A quantitative analysis of the model
 */
export type FluffyQuantitativeAnalysis = {
    graphics?: FluffyGraphicsCollection;
    /**
     * The model performance metrics being reported. Examples may include accuracy, F1 score,
     * precision, top-3 error rates, MSC, etc.
     */
    performanceMetrics?: PurplePerformanceMetric[];
}

export type PurplePerformanceMetric = {
    /**
     * The confidence interval of the metric.
     */
    confidenceInterval?: PurpleConfidenceInterval;
    /**
     * The name of the slice this metric was computed on. By default, assume this metric is not
     * sliced.
     */
    slice?: string;
    /**
     * The type of performance metric.
     */
    type?: string;
    /**
     * The value of the performance metric.
     */
    value?: string;
}

/**
 * The confidence interval of the metric.
 */
export type PurpleConfidenceInterval = {
    /**
     * The lower bound of the confidence interval.
     */
    lowerBound?: string;
    /**
     * The upper bound of the confidence interval.
     */
    upperBound?: string;
}

/**
 * Specifies optional release notes.
 */
export type FluffyReleaseNotes = {
    /**
     * One or more alternate names the release may be referred to. This may include unofficial
     * terms used by development and marketing teams (e.g. code names).
     */
    aliases?: string[];
    /**
     * A short description of the release.
     */
    description?: string;
    /**
     * The URL to an image that may be prominently displayed with the release note.
     */
    featuredImage?: string;
    /**
     * Zero or more release notes containing the locale and content. Multiple note objects may
     * be specified to support release notes in a wide variety of languages.
     */
    notes?: FluffyNote[];
    /**
     * Provides the ability to document properties in a name-value store. This provides
     * flexibility to include data not officially supported in the standard without having to
     * use additional namespaces or create extensions. Unlike key-value stores, properties
     * support duplicate names, each potentially having different values. Property names of
     * interest to the general public are encouraged to be registered in the [CycloneDX Property
     * Taxonomy](https://github.com/CycloneDX/cyclonedx-property-taxonomy). Formal registration
     * is optional.
     */
    properties?: LightweightNameValuePairClass[];
    /**
     * A collection of issues that have been resolved.
     */
    resolves?: Issue[];
    /**
     * The URL to an image that may be used in messaging on social media platforms.
     */
    socialImage?: string;
    tags?:        string[];
    /**
     * The date and time (timestamp) when the release note was created.
     */
    timestamp?: Date;
    /**
     * The title of the release.
     */
    title?: string;
    /**
     * The software versioning type the release note describes.
     */
    type: string;
}

/**
 * A note containing the locale and content.
 */
export type FluffyNote = {
    /**
     * The ISO-639 (or higher) language code and optional ISO-3166 (or higher) country code.
     * Examples include: "en", "en-US", "fr" and "fr-CA"
     */
    locale?: string;
    /**
     * Specifies the full content of the release note.
     */
    text: LicenseText;
}

/**
 * Asserts the identity of the component using [ISO-IEC 19770-2 Software Identification
 * (SWID) Tags](https://www.iso.org/standard/65666.html). Refer to `@.evidence.identity` to
 * optionally provide evidence that substantiates the assertion of the component's
 * identity.
 *
 * Specifies metadata and content for ISO-IEC 19770-2 Software Identification (SWID) Tags.
 */
export type FluffySWIDTag = {
    /**
     * Maps to the name of a SoftwareIdentity.
     */
    name: string;
    /**
     * Maps to the patch of a SoftwareIdentity.
     */
    patch?: boolean;
    /**
     * Maps to the tagId of a SoftwareIdentity.
     */
    tagId: string;
    /**
     * Maps to the tagVersion of a SoftwareIdentity.
     */
    tagVersion?: number;
    /**
     * Specifies the metadata and content of the SWID tag.
     */
    text?: LicenseText;
    /**
     * The URL to the SWID file.
     */
    url?: string;
    /**
     * Maps to the version of a SoftwareIdentity.
     */
    version?: string;
}

/**
 * Specifies the type of component. For software components, classify as application if no
 * more specific appropriate classification is available or cannot be determined for the
 * component.
 */
export type TentacledComponentType = "application" | "framework" | "library" | "container" | "platform" | "operating-system" | "device" | "device-driver" | "firmware" | "file" | "machine-learning-model" | "data" | "cryptographic-asset";

/**
 * The service that created the annotation
 */
export type Service = {
    /**
     * A boolean value indicating if the service requires authentication. A value of true
     * indicates the service requires authentication prior to use. A value of false indicates
     * the service does not require authentication.
     */
    authenticated?: boolean;
    /**
     * An optional identifier which can be used to reference the service elsewhere in the BOM.
     * Every bom-ref must be unique within the BOM.
     * Value SHOULD not start with the BOM-Link intro 'urn:cdx:' to avoid conflicts with
     * BOM-Links.
     */
    "bom-ref"?: string;
    /**
     * Specifies information about the data including the directional flow of data and the data
     * classification.
     */
    data?: FluffyHashObjects[];
    /**
     * Specifies a description for the service
     */
    description?: string;
    /**
     * The endpoint URIs of the service. Multiple endpoints are allowed.
     */
    endpoints?: string[];
    /**
     * External references provide a way to document systems, sites, and information that may be
     * relevant but are not included with the BOM. They may also establish specific
     * relationships within or external to the BOM.
     */
    externalReferences?: EnergyProviderExternalReference[];
    /**
     * The grouping name, namespace, or identifier. This will often be a shortened, single name
     * of the company or project that produced the service or domain name. Whitespace and
     * special characters should be avoided.
     */
    group?:    string;
    licenses?: LicenseChoiceElement[];
    /**
     * The name of the service. This will often be a shortened, single name of the service.
     */
    name: string;
    /**
     * Provides the ability to document properties in a name-value store. This provides
     * flexibility to include data not officially supported in the standard without having to
     * use additional namespaces or create extensions. Unlike key-value stores, properties
     * support duplicate names, each potentially having different values. Property names of
     * interest to the general public are encouraged to be registered in the [CycloneDX Property
     * Taxonomy](https://github.com/CycloneDX/cyclonedx-property-taxonomy). Formal registration
     * is optional.
     */
    properties?: LightweightNameValuePairClass[];
    /**
     * The organization that provides the service.
     */
    provider?: OrganizationalEntity;
    /**
     * Specifies optional release notes.
     */
    releaseNotes?: FluffyReleaseNotes;
    /**
     * A list of services included or deployed behind the parent service. This is not a
     * dependency tree. It provides a way to specify a hierarchical representation of service
     * assemblies.
     */
    services?: Service[];
    /**
     * Enveloped signature in [JSON Signature Format
     * (JSF)](https://cyberphone.github.io/doc/security/jsf.html).
     */
    signature?: Signature;
    tags?:      string[];
    /**
     * The name of the trust zone the service resides in.
     */
    trustZone?: string;
    /**
     * The service version.
     */
    version?: string;
    /**
     * A boolean value indicating if use of the service crosses a trust zone or boundary. A
     * value of true indicates that by using the service, a trust boundary is crossed. A value
     * of false indicates that by using the service, a trust boundary is not crossed.
     */
    "x-trust-boundary"?: boolean;
}

export type FluffyHashObjects = {
    classification: string;
    /**
     * Short description of the data content and usage
     */
    description?: string;
    /**
     * The URI, URL, or BOM-Link of the components or services the data is sent to
     */
    destination?: string[];
    /**
     * Specifies the flow direction of the data. Direction is relative to the service. Inbound
     * flow states that data enters the service. Outbound flow states that data leaves the
     * service. Bi-directional states that data flows both ways and unknown states that the
     * direction is not known.
     */
    flow:        DataFlowDirection;
    governance?: TentacledDataGovernance;
    /**
     * Name for the defined data
     */
    name?: string;
    /**
     * The URI, URL, or BOM-Link of the components or services the data came in from
     */
    source?: string[];
}

export type CycloneDXBillOfMaterialsStandardComposition = {
    /**
     * Specifies an aggregate type that describe how complete a relationship is.
     */
    aggregate: FluffyAggregateType;
    /**
     * The bom-ref identifiers of the components or services being described. Assemblies refer
     * to nested relationships whereby a constituent part may include other constituent parts.
     * References do not cascade to child parts. References are explicit for the specified
     * constituent part only.
     */
    assemblies?: string[];
    /**
     * An optional identifier which can be used to reference the composition elsewhere in the
     * BOM. Every bom-ref must be unique within the BOM.
     * Value SHOULD not start with the BOM-Link intro 'urn:cdx:' to avoid conflicts with
     * BOM-Links.
     */
    "bom-ref"?: string;
    /**
     * The bom-ref identifiers of the components or services being described. Dependencies refer
     * to a relationship whereby an independent constituent part requires another independent
     * constituent part. References do not cascade to transitive dependencies. References are
     * explicit for the specified dependency only.
     */
    dependencies?: string[];
    /**
     * Enveloped signature in [JSON Signature Format
     * (JSF)](https://cyberphone.github.io/doc/security/jsf.html).
     */
    signature?: Signature;
    /**
     * The bom-ref identifiers of the vulnerabilities being described.
     */
    vulnerabilities?: string[];
}

/**
 * The list of declarations which describe the conformance to standards. Each declaration
 * may include attestations, claims, and evidence.
 */
export type Declarations = {
    /**
     * A concise statement affirmed by an individual regarding all declarations, often used for
     * third-party auditor acceptance or recipient acknowledgment. It includes a list of
     * authorized signatories who assert the validity of the document on behalf of the
     * organization.
     */
    affirmation?: Affirmation;
    /**
     * The list of assessors evaluating claims and determining conformance to requirements and
     * confidence in that assessment.
     */
    assessors?: Assessor[];
    /**
     * The list of attestations asserted by an assessor that maps requirements to claims.
     */
    attestations?: Attestation[];
    /**
     * The list of claims.
     */
    claims?: Claim[];
    /**
     * The list of evidence
     */
    evidence?: EvidenceElement[];
    /**
     * Enveloped signature in [JSON Signature Format
     * (JSF)](https://cyberphone.github.io/doc/security/jsf.html).
     */
    signature?: Signature;
    /**
     * The list of targets which claims are made against.
     */
    targets?: Targets;
}

/**
 * A concise statement affirmed by an individual regarding all declarations, often used for
 * third-party auditor acceptance or recipient acknowledgment. It includes a list of
 * authorized signatories who assert the validity of the document on behalf of the
 * organization.
 */
export type Affirmation = {
    /**
     * The list of signatories authorized on behalf of an organization to assert validity of
     * this document.
     */
    signatories?: Signatory[];
    /**
     * Enveloped signature in [JSON Signature Format
     * (JSF)](https://cyberphone.github.io/doc/security/jsf.html).
     */
    signature?: Signature;
    /**
     * The brief statement affirmed by an individual regarding all declarations.
     * *- Notes This could be an affirmation of acceptance by a third-party auditor or receiving
     * individual of a file.
     */
    statement?: string;
}

export type Signatory = {
    /**
     * External references provide a way to document systems, sites, and information that may be
     * relevant but are not included with the BOM. They may also establish specific
     * relationships within or external to the BOM.
     */
    externalReference?: EnergyProviderExternalReference;
    /**
     * The signatory's name.
     */
    name?: string;
    /**
     * The signatory's organization.
     */
    organization?: OrganizationalEntity;
    /**
     * The signatory's role within an organization.
     */
    role?: string;
    /**
     * Enveloped signature in [JSON Signature Format
     * (JSF)](https://cyberphone.github.io/doc/security/jsf.html).
     */
    signature?: Signature;
}

/**
 * The assessor who evaluates claims and determines conformance to requirements and
 * confidence in that assessment.
 */
export type Assessor = {
    /**
     * An optional identifier which can be used to reference the object elsewhere in the BOM.
     * Every bom-ref must be unique within the BOM.
     */
    "bom-ref"?: string;
    /**
     * The entity issuing the assessment.
     */
    organization?: OrganizationalEntity;
    /**
     * The boolean indicating if the assessor is outside the organization generating claims. A
     * value of false indicates a self assessor.
     */
    thirdParty?: boolean;
}

export type Attestation = {
    /**
     * The `bom-ref` to the assessor asserting the attestation.
     */
    assessor?: string;
    /**
     * The grouping of requirements to claims and the attestors declared conformance and
     * confidence thereof.
     */
    map?: Map[];
    /**
     * Enveloped signature in [JSON Signature Format
     * (JSF)](https://cyberphone.github.io/doc/security/jsf.html).
     */
    signature?: Signature;
    /**
     * The short description explaining the main points of the attestation.
     */
    summary?: string;
}

export type Map = {
    /**
     * The list of `bom-ref` to the claims being attested to.
     */
    claims?: string[];
    /**
     * The confidence of the claim meeting the requirement.
     */
    confidence?: Confidence;
    /**
     * The conformance of the claim meeting a requirement.
     */
    conformance?: Conformance;
    /**
     * The list of  `bom-ref` to the counter claims being attested to.
     */
    counterClaims?: string[];
    /**
     * The `bom-ref` to the requirement being attested to.
     */
    requirement?: string;
}

/**
 * The confidence of the claim meeting the requirement.
 */
export type Confidence = {
    /**
     * The rationale for the confidence score.
     */
    rationale?: string;
    /**
     * The confidence of the claim between and inclusive of 0 and 1, where 1 is 100% confidence.
     */
    score?: number;
}

/**
 * The conformance of the claim meeting a requirement.
 */
export type Conformance = {
    /**
     * The list of  `bom-ref` to the evidence provided describing the mitigation strategies.
     */
    mitigationStrategies?: string[];
    /**
     * The rationale for the conformance score.
     */
    rationale?: string;
    /**
     * The conformance of the claim between and inclusive of 0 and 1, where 1 is 100%
     * conformance.
     */
    score?: number;
}

export type Claim = {
    /**
     * An optional identifier which can be used to reference the object elsewhere in the BOM.
     * Every bom-ref must be unique within the BOM.
     */
    "bom-ref"?: string;
    /**
     * The list of `bom-ref` to counterEvidence that supports this claim.
     */
    counterEvidence?: string[];
    /**
     * The list of `bom-ref` to evidence that supports this claim.
     */
    evidence?: string[];
    /**
     * External references provide a way to document systems, sites, and information that may be
     * relevant but are not included with the BOM. They may also establish specific
     * relationships within or external to the BOM.
     */
    externalReferences?: EnergyProviderExternalReference[];
    /**
     * The list of  `bom-ref` to the evidence provided describing the mitigation strategies.
     * Each mitigation strategy should include an explanation of how any weaknesses in the
     * evidence will be mitigated.
     */
    mitigationStrategies?: string[];
    /**
     * The specific statement or assertion about the target.
     */
    predicate?: string;
    /**
     * The written explanation of why the evidence provided substantiates the claim.
     */
    reasoning?: string;
    /**
     * Enveloped signature in [JSON Signature Format
     * (JSF)](https://cyberphone.github.io/doc/security/jsf.html).
     */
    signature?: Signature;
    /**
     * The `bom-ref` to a target representing a specific system, application, API, module, team,
     * person, process, business unit, company, etc...  that this claim is being applied to.
     */
    target?: string;
}

export type EvidenceElement = {
    /**
     * The author of the evidence.
     */
    author?: OrganizationalContact;
    /**
     * An optional identifier which can be used to reference the object elsewhere in the BOM.
     * Every bom-ref must be unique within the BOM.
     */
    "bom-ref"?: string;
    /**
     * The date and time (timestamp) when the evidence was created.
     */
    created?: Date;
    /**
     * The output or analysis that supports claims.
     */
    data?: Data[];
    /**
     * The written description of what this evidence is and how it was created.
     */
    description?: string;
    /**
     * The optional date and time (timestamp) when the evidence is no longer valid.
     */
    expires?: Date;
    /**
     * The reference to the property name as defined in the [CycloneDX Property
     * Taxonomy](https://github.com/CycloneDX/cyclonedx-property-taxonomy/).
     */
    propertyName?: string;
    /**
     * The reviewer of the evidence.
     */
    reviewer?: OrganizationalContact;
    /**
     * Enveloped signature in [JSON Signature Format
     * (JSF)](https://cyberphone.github.io/doc/security/jsf.html).
     */
    signature?: Signature;
}

export type Data = {
    classification?: string;
    /**
     * The contents or references to the contents of the data being described.
     */
    contents?:   TentacledDataContents;
    governance?: TentacledDataGovernance;
    /**
     * The name of the data.
     */
    name?: string;
    /**
     * A description of any sensitive data included.
     */
    sensitiveData?: string[];
}

/**
 * The contents or references to the contents of the data being described.
 */
export type TentacledDataContents = {
    /**
     * An optional way to include textual or encoded data.
     */
    attachment?: LicenseText;
    /**
     * The URL to where the data can be retrieved.
     */
    url?: string;
}

/**
 * The list of targets which claims are made against.
 */
export type Targets = {
    /**
     * The list of components which claims are made against.
     */
    components?: Component[];
    /**
     * The list of organizations which claims are made against.
     */
    organizations?: OrganizationalEntity[];
    /**
     * The list of services which claims are made against.
     */
    services?: Service[];
}

/**
 * A collection of reusable objects that are defined and may be used elsewhere in the BOM.
 */
export type Definitions = {
    /**
     * The list of standards which may consist of regulations, industry or
     * organizational-specific standards, maturity models, best practices, or any other
     * requirements which can be evaluated against or attested to.
     */
    standards?: Standard[];
}

/**
 * A standard may consist of regulations, industry or organizational-specific standards,
 * maturity models, best practices, or any other requirements which can be evaluated against
 * or attested to.
 */
export type Standard = {
    /**
     * An optional identifier which can be used to reference the object elsewhere in the BOM.
     * Every bom-ref must be unique within the BOM.
     */
    "bom-ref"?: string;
    /**
     * The description of the standard.
     */
    description?: string;
    /**
     * External references provide a way to document systems, sites, and information that may be
     * relevant but are not included with the BOM. They may also establish specific
     * relationships within or external to the BOM.
     */
    externalReferences?: EnergyProviderExternalReference[];
    /**
     * The list of levels associated with the standard. Some standards have different levels of
     * compliance.
     */
    levels?: Level[];
    /**
     * The name of the standard. This will often be a shortened, single name of the standard.
     */
    name?: string;
    /**
     * The owner of the standard, often the entity responsible for its release.
     */
    owner?: string;
    /**
     * The list of requirements comprising the standard.
     */
    requirements?: Requirement[];
    /**
     * Enveloped signature in [JSON Signature Format
     * (JSF)](https://cyberphone.github.io/doc/security/jsf.html).
     */
    signature?: Signature;
    /**
     * The version of the standard.
     */
    version?: string;
}

export type Level = {
    /**
     * An optional identifier which can be used to reference the object elsewhere in the BOM.
     * Every bom-ref must be unique within the BOM.
     */
    "bom-ref"?: string;
    /**
     * The description of the level.
     */
    description?: string;
    /**
     * The identifier used in the standard to identify a specific level.
     */
    identifier?: string;
    /**
     * The list of requirement `bom-ref`s that comprise the level.
     */
    requirements?: string[];
    /**
     * The title of the level.
     */
    title?: string;
}

export type Requirement = {
    /**
     * An optional identifier which can be used to reference the object elsewhere in the BOM.
     * Every bom-ref must be unique within the BOM.
     */
    "bom-ref"?: string;
    /**
     * The supplemental text that provides additional guidance or context to the requirement,
     * but is not directly part of the requirement.
     */
    descriptions?: string[];
    /**
     * External references provide a way to document systems, sites, and information that may be
     * relevant, but are not included with the BOM. They may also establish specific
     * relationships within or external to the BOM.
     */
    externalReferences?: EnergyProviderExternalReference[];
    /**
     * The unique identifier used in the standard to identify a specific requirement. This
     * should match what is in the standard and should not be the requirements bom-ref.
     */
    identifier?: string;
    /**
     * The Common Requirements Enumeration (CRE) identifier(s). CRE is a structured and
     * standardized framework for uniting security standards and guidelines. CRE links each
     * section of a resource to a shared topic identifier (a Common Requirement). Through this
     * shared topic link, all resources map to each other. Use of CRE promotes clear and
     * unambiguous communication among stakeholders.
     */
    openCre?: string[];
    /**
     * The optional `bom-ref` to a parent requirement. This establishes a hierarchy of
     * requirements. Top-level requirements must not define a parent. Only child requirements
     * should define parents.
     */
    parent?: string;
    /**
     * Provides the ability to document properties in a name-value store. This provides
     * flexibility to include data not officially supported in the standard without having to
     * use additional namespaces or create extensions. Unlike key-value stores, properties
     * support duplicate names, each potentially having different values. Property names of
     * interest to the general public are encouraged to be registered in the [CycloneDX Property
     * Taxonomy](https://github.com/CycloneDX/cyclonedx-property-taxonomy). Formal registration
     * is optional.
     */
    properties?: LightweightNameValuePairClass[];
    /**
     * The textual content of the requirement.
     */
    text?: string;
    /**
     * The title of the requirement.
     */
    title?: string;
}

/**
 * Defines the direct dependencies of a component, service, or the components
 * provided/implemented by a given component. Components or services that do not have their
 * own dependencies must be declared as empty elements within the graph. Components or
 * services that are not represented in the dependency graph may have unknown dependencies.
 * It is recommended that implementations assume this to be opaque and not an indicator of
 * an object being dependency-free. It is recommended to leverage compositions to indicate
 * unknown dependency graphs.
 */
export type CycloneDXBillOfMaterialsStandardDependency = {
    /**
     * The bom-ref identifiers of the components or services that are dependencies of this
     * dependency object.
     */
    dependsOn?: string[];
    /**
     * The bom-ref identifiers of the components or services that define a given specification
     * or standard, which are provided or implemented by this dependency object.
     * For example, a cryptographic library which implements a cryptographic algorithm. A
     * component which implements another component does not imply that the implementation is in
     * use.
     */
    provides?: string[];
    /**
     * References a component or service by its bom-ref attribute
     */
    ref: string;
}

/**
 * Describes workflows and resources that captures rules and other aspects of how the
 * associated BOM component or service was formed.
 */
export type CycloneDXBillOfMaterialsStandardFormulation = {
    /**
     * An optional identifier which can be used to reference the formula elsewhere in the BOM.
     * Every bom-ref must be unique within the BOM.
     * Value SHOULD not start with the BOM-Link intro 'urn:cdx:' to avoid conflicts with
     * BOM-Links.
     */
    "bom-ref"?: string;
    /**
     * Transient components that are used in tasks that constitute one or more of this formula's
     * workflows
     */
    components?: Component[];
    /**
     * Provides the ability to document properties in a name-value store. This provides
     * flexibility to include data not officially supported in the standard without having to
     * use additional namespaces or create extensions. Unlike key-value stores, properties
     * support duplicate names, each potentially having different values. Property names of
     * interest to the general public are encouraged to be registered in the [CycloneDX Property
     * Taxonomy](https://github.com/CycloneDX/cyclonedx-property-taxonomy). Formal registration
     * is optional.
     */
    properties?: LightweightNameValuePairClass[];
    /**
     * Transient services that are used in tasks that constitute one or more of this formula's
     * workflows
     */
    services?: Service[];
    /**
     * List of workflows that can be declared to accomplish specific orchestrated goals and
     * independently triggered.
     */
    workflows?: FluffyWorkflow[];
}

/**
 * A specialized orchestration task.
 */
export type FluffyWorkflow = {
    /**
     * An optional identifier which can be used to reference the workflow elsewhere in the BOM.
     * Every bom-ref must be unique within the BOM.
     * Value SHOULD not start with the BOM-Link intro 'urn:cdx:' to avoid conflicts with
     * BOM-Links.
     */
    "bom-ref": string;
    /**
     * A description of the resource instance.
     */
    description?: string;
    /**
     * Represents resources and data brought into a task at runtime by executor or task commands
     */
    inputs?: FluffyInputType[];
    /**
     * The name of the resource instance.
     */
    name?: string;
    /**
     * Represents resources and data output from a task at runtime by executor or task commands
     */
    outputs?: FluffyOutputType[];
    /**
     * Provides the ability to document properties in a name-value store. This provides
     * flexibility to include data not officially supported in the standard without having to
     * use additional namespaces or create extensions. Unlike key-value stores, properties
     * support duplicate names, each potentially having different values. Property names of
     * interest to the general public are encouraged to be registered in the [CycloneDX Property
     * Taxonomy](https://github.com/CycloneDX/cyclonedx-property-taxonomy). Formal registration
     * is optional.
     */
    properties?: LightweightNameValuePairClass[];
    /**
     * References to component or service resources that are used to realize the resource
     * instance.
     */
    resourceReferences?: FluffyResourceReferenceChoice[];
    /**
     * A graph of the component runtime topology for workflow's instance.
     */
    runtimeTopology?: CycloneDXBillOfMaterialsStandardDependency[];
    /**
     * The sequence of steps for the task.
     */
    steps?: FluffyStep[];
    /**
     * The graph of dependencies between tasks within the workflow.
     */
    taskDependencies?: CycloneDXBillOfMaterialsStandardDependency[];
    /**
     * The tasks that comprise the workflow.
     */
    tasks?: FluffyTask[];
    /**
     * Indicates the types of activities performed by the set of workflow tasks.
     */
    taskTypes: TaskType[];
    /**
     * The date and time (timestamp) when the task ended.
     */
    timeEnd?: Date;
    /**
     * The date and time (timestamp) when the task started.
     */
    timeStart?: Date;
    /**
     * The trigger that initiated the task.
     */
    trigger?: FluffyTrigger;
    /**
     * The unique identifier for the resource instance within its deployment context.
     */
    uid: string;
    /**
     * A set of named filesystem or data resource shareable by workflow tasks.
     */
    workspaces?: FluffyWorkspace[];
}

/**
 * Type that represents various input data types and formats.
 */
export type FluffyInputType = {
    /**
     * Inputs that have the form of data.
     */
    data?: LicenseText;
    /**
     * Inputs that have the form of parameters with names and values.
     */
    environmentVars?: Array<LightweightNameValuePairClass | string>;
    /**
     * Inputs that have the form of parameters with names and values.
     */
    parameters?: FluffyParameter[];
    /**
     * Provides the ability to document properties in a name-value store. This provides
     * flexibility to include data not officially supported in the standard without having to
     * use additional namespaces or create extensions. Unlike key-value stores, properties
     * support duplicate names, each potentially having different values. Property names of
     * interest to the general public are encouraged to be registered in the [CycloneDX Property
     * Taxonomy](https://github.com/CycloneDX/cyclonedx-property-taxonomy). Formal registration
     * is optional.
     */
    properties?: LightweightNameValuePairClass[];
    /**
     * A reference to an independent resource provided as an input to a task by the workflow
     * runtime.
     */
    resource?: FluffyResourceReferenceChoice;
    /**
     * A reference to the component or service that provided the input to the task (e.g.,
     * reference to a service with data flow value of `inbound`)
     */
    source?: FluffyResourceReferenceChoice;
    /**
     * A reference to the component or service that received or stored the input if not the task
     * itself (e.g., a local, named storage workspace)
     */
    target?: FluffyResourceReferenceChoice;
}

/**
 * A representation of a functional parameter.
 */
export type FluffyParameter = {
    /**
     * The data type of the parameter.
     */
    dataType?: string;
    /**
     * The name of the parameter.
     */
    name?: string;
    /**
     * The value of the parameter.
     */
    value?: string;
}

/**
 * A reference to an independent resource provided as an input to a task by the workflow
 * runtime.
 *
 * A reference to the component or service that provided the input to the task (e.g.,
 * reference to a service with data flow value of `inbound`)
 *
 * A reference to the component or service that received or stored the input if not the task
 * itself (e.g., a local, named storage workspace)
 *
 * A reference to an independent resource generated as output by the task.
 *
 * Component or service that generated or provided the output from the task (e.g., a build
 * tool)
 *
 * Component or service that received the output from the task (e.g., reference to an
 * artifactory service with data flow value of `outbound`)
 *
 * References the component or service that was the source of the event
 *
 * References the component or service that was the target of the event
 *
 * A reference to a locally defined resource (e.g., a bom-ref) or an externally accessible
 * resource.
 */
export type FluffyResourceReferenceChoice = {
    /**
     * Reference to an externally accessible resource.
     */
    externalReference?: EnergyProviderExternalReference;
    /**
     * References an object by its bom-ref attribute
     */
    ref?: string;
}

export type FluffyOutputType = {
    /**
     * Outputs that have the form of data.
     */
    data?: LicenseText;
    /**
     * Outputs that have the form of environment variables.
     */
    environmentVars?: Array<LightweightNameValuePairClass | string>;
    /**
     * Provides the ability to document properties in a name-value store. This provides
     * flexibility to include data not officially supported in the standard without having to
     * use additional namespaces or create extensions. Unlike key-value stores, properties
     * support duplicate names, each potentially having different values. Property names of
     * interest to the general public are encouraged to be registered in the [CycloneDX Property
     * Taxonomy](https://github.com/CycloneDX/cyclonedx-property-taxonomy). Formal registration
     * is optional.
     */
    properties?: LightweightNameValuePairClass[];
    /**
     * A reference to an independent resource generated as output by the task.
     */
    resource?: FluffyResourceReferenceChoice;
    /**
     * Component or service that generated or provided the output from the task (e.g., a build
     * tool)
     */
    source?: FluffyResourceReferenceChoice;
    /**
     * Component or service that received the output from the task (e.g., reference to an
     * artifactory service with data flow value of `outbound`)
     */
    target?: FluffyResourceReferenceChoice;
    /**
     * Describes the type of data output.
     */
    type?: OutputTypeType;
}

/**
 * Executes specific commands or tools in order to accomplish its owning task as part of a
 * sequence.
 */
export type FluffyStep = {
    /**
     * Ordered list of commands or directives for the step
     */
    commands?: FluffyCommand[];
    /**
     * A description of the step.
     */
    description?: string;
    /**
     * A name for the step.
     */
    name?: string;
    /**
     * Provides the ability to document properties in a name-value store. This provides
     * flexibility to include data not officially supported in the standard without having to
     * use additional namespaces or create extensions. Unlike key-value stores, properties
     * support duplicate names, each potentially having different values. Property names of
     * interest to the general public are encouraged to be registered in the [CycloneDX Property
     * Taxonomy](https://github.com/CycloneDX/cyclonedx-property-taxonomy). Formal registration
     * is optional.
     */
    properties?: LightweightNameValuePairClass[];
}

export type FluffyCommand = {
    /**
     * A text representation of the executed command.
     */
    executed?: string;
    /**
     * Provides the ability to document properties in a name-value store. This provides
     * flexibility to include data not officially supported in the standard without having to
     * use additional namespaces or create extensions. Unlike key-value stores, properties
     * support duplicate names, each potentially having different values. Property names of
     * interest to the general public are encouraged to be registered in the [CycloneDX Property
     * Taxonomy](https://github.com/CycloneDX/cyclonedx-property-taxonomy). Formal registration
     * is optional.
     */
    properties?: LightweightNameValuePairClass[];
}

/**
 * Describes the inputs, sequence of steps and resources used to accomplish a task and its
 * output.
 */
export type FluffyTask = {
    /**
     * An optional identifier which can be used to reference the task elsewhere in the BOM.
     * Every bom-ref must be unique within the BOM.
     * Value SHOULD not start with the BOM-Link intro 'urn:cdx:' to avoid conflicts with
     * BOM-Links.
     */
    "bom-ref": string;
    /**
     * A description of the resource instance.
     */
    description?: string;
    /**
     * Represents resources and data brought into a task at runtime by executor or task commands
     */
    inputs?: FluffyInputType[];
    /**
     * The name of the resource instance.
     */
    name?: string;
    /**
     * Represents resources and data output from a task at runtime by executor or task commands
     */
    outputs?: FluffyOutputType[];
    /**
     * Provides the ability to document properties in a name-value store. This provides
     * flexibility to include data not officially supported in the standard without having to
     * use additional namespaces or create extensions. Unlike key-value stores, properties
     * support duplicate names, each potentially having different values. Property names of
     * interest to the general public are encouraged to be registered in the [CycloneDX Property
     * Taxonomy](https://github.com/CycloneDX/cyclonedx-property-taxonomy). Formal registration
     * is optional.
     */
    properties?: LightweightNameValuePairClass[];
    /**
     * References to component or service resources that are used to realize the resource
     * instance.
     */
    resourceReferences?: FluffyResourceReferenceChoice[];
    /**
     * A graph of the component runtime topology for task's instance.
     */
    runtimeTopology?: CycloneDXBillOfMaterialsStandardDependency[];
    /**
     * The sequence of steps for the task.
     */
    steps?: FluffyStep[];
    /**
     * Indicates the types of activities performed by the set of workflow tasks.
     */
    taskTypes: TaskType[];
    /**
     * The date and time (timestamp) when the task ended.
     */
    timeEnd?: Date;
    /**
     * The date and time (timestamp) when the task started.
     */
    timeStart?: Date;
    /**
     * The trigger that initiated the task.
     */
    trigger?: FluffyTrigger;
    /**
     * The unique identifier for the resource instance within its deployment context.
     */
    uid: string;
    /**
     * A set of named filesystem or data resource shareable by workflow tasks.
     */
    workspaces?: FluffyWorkspace[];
}

/**
 * The trigger that initiated the task.
 *
 * Represents a resource that can conditionally activate (or fire) tasks based upon
 * associated events and their data.
 */
export type FluffyTrigger = {
    /**
     * An optional identifier which can be used to reference the trigger elsewhere in the BOM.
     * Every bom-ref must be unique within the BOM.
     * Value SHOULD not start with the BOM-Link intro 'urn:cdx:' to avoid conflicts with
     * BOM-Links.
     */
    "bom-ref": string;
    /**
     * A list of conditions used to determine if a trigger should be activated.
     */
    conditions?: FluffyCondition[];
    /**
     * A description of the resource instance.
     */
    description?: string;
    /**
     * The event data that caused the associated trigger to activate.
     */
    event?: FluffyEvent;
    /**
     * Represents resources and data brought into a task at runtime by executor or task commands
     */
    inputs?: FluffyInputType[];
    /**
     * The name of the resource instance.
     */
    name?: string;
    /**
     * Represents resources and data output from a task at runtime by executor or task commands
     */
    outputs?: FluffyOutputType[];
    /**
     * Provides the ability to document properties in a name-value store. This provides
     * flexibility to include data not officially supported in the standard without having to
     * use additional namespaces or create extensions. Unlike key-value stores, properties
     * support duplicate names, each potentially having different values. Property names of
     * interest to the general public are encouraged to be registered in the [CycloneDX Property
     * Taxonomy](https://github.com/CycloneDX/cyclonedx-property-taxonomy). Formal registration
     * is optional.
     */
    properties?: LightweightNameValuePairClass[];
    /**
     * References to component or service resources that are used to realize the resource
     * instance.
     */
    resourceReferences?: FluffyResourceReferenceChoice[];
    /**
     * The date and time (timestamp) when the trigger was activated.
     */
    timeActivated?: Date;
    /**
     * The source type of event which caused the trigger to fire.
     */
    type: TriggerType;
    /**
     * The unique identifier for the resource instance within its deployment context.
     */
    uid: string;
}

/**
 * A condition that was used to determine a trigger should be activated.
 */
export type FluffyCondition = {
    /**
     * Describes the set of conditions which cause the trigger to activate.
     */
    description?: string;
    /**
     * The logical expression that was evaluated that determined the trigger should be fired.
     */
    expression?: string;
    /**
     * Provides the ability to document properties in a name-value store. This provides
     * flexibility to include data not officially supported in the standard without having to
     * use additional namespaces or create extensions. Unlike key-value stores, properties
     * support duplicate names, each potentially having different values. Property names of
     * interest to the general public are encouraged to be registered in the [CycloneDX Property
     * Taxonomy](https://github.com/CycloneDX/cyclonedx-property-taxonomy). Formal registration
     * is optional.
     */
    properties?: LightweightNameValuePairClass[];
}

/**
 * The event data that caused the associated trigger to activate.
 *
 * Represents something that happened that may trigger a response.
 */
export type FluffyEvent = {
    /**
     * Encoding of the raw event data.
     */
    data?: LicenseText;
    /**
     * A description of the event.
     */
    description?: string;
    /**
     * Provides the ability to document properties in a name-value store. This provides
     * flexibility to include data not officially supported in the standard without having to
     * use additional namespaces or create extensions. Unlike key-value stores, properties
     * support duplicate names, each potentially having different values. Property names of
     * interest to the general public are encouraged to be registered in the [CycloneDX Property
     * Taxonomy](https://github.com/CycloneDX/cyclonedx-property-taxonomy). Formal registration
     * is optional.
     */
    properties?: LightweightNameValuePairClass[];
    /**
     * References the component or service that was the source of the event
     */
    source?: FluffyResourceReferenceChoice;
    /**
     * References the component or service that was the target of the event
     */
    target?: FluffyResourceReferenceChoice;
    /**
     * The date and time (timestamp) when the event was received.
     */
    timeReceived?: Date;
    /**
     * The unique identifier of the event.
     */
    uid?: string;
}

/**
 * A named filesystem or data resource shareable by workflow tasks.
 */
export type FluffyWorkspace = {
    /**
     * Describes the read-write access control for the workspace relative to the owning resource
     * instance.
     */
    accessMode?: AccessMode;
    /**
     * The names for the workspace as referenced by other workflow tasks. Effectively, a name
     * mapping so other tasks can use their own local name in their steps.
     */
    aliases?: string[];
    /**
     * An optional identifier which can be used to reference the workspace elsewhere in the BOM.
     * Every bom-ref must be unique within the BOM.
     * Value SHOULD not start with the BOM-Link intro 'urn:cdx:' to avoid conflicts with
     * BOM-Links.
     */
    "bom-ref": string;
    /**
     * A description of the resource instance.
     */
    description?: string;
    /**
     * The name of a domain-specific data type the workspace represents.
     */
    managedDataType?: string;
    /**
     * A path to a location on disk where the workspace will be available to the associated
     * task's steps.
     */
    mountPath?: string;
    /**
     * The name of the resource instance.
     */
    name?: string;
    /**
     * Provides the ability to document properties in a name-value store. This provides
     * flexibility to include data not officially supported in the standard without having to
     * use additional namespaces or create extensions. Unlike key-value stores, properties
     * support duplicate names, each potentially having different values. Property names of
     * interest to the general public are encouraged to be registered in the [CycloneDX Property
     * Taxonomy](https://github.com/CycloneDX/cyclonedx-property-taxonomy). Formal registration
     * is optional.
     */
    properties?: LightweightNameValuePairClass[];
    /**
     * References to component or service resources that are used to realize the resource
     * instance.
     */
    resourceReferences?: FluffyResourceReferenceChoice[];
    /**
     * The unique identifier for the resource instance within its deployment context.
     */
    uid: string;
    /**
     * Information about the actual volume instance allocated to the workspace.
     */
    volume?: FluffyVolume;
    /**
     * Identifies the reference to the request for a specific volume type and parameters.
     */
    volumeRequest?: string;
}

/**
 * Information about the actual volume instance allocated to the workspace.
 *
 * An identifiable, logical unit of data storage tied to a physical device.
 */
export type FluffyVolume = {
    /**
     * The mode for the volume instance.
     */
    mode?: VolumeMode;
    /**
     * The name of the volume instance
     */
    name?: string;
    /**
     * The underlying path created from the actual volume.
     */
    path?: string;
    /**
     * Indicates if the volume persists beyond the life of the resource it is associated with.
     */
    persistent?: boolean;
    /**
     * Provides the ability to document properties in a name-value store. This provides
     * flexibility to include data not officially supported in the standard without having to
     * use additional namespaces or create extensions. Unlike key-value stores, properties
     * support duplicate names, each potentially having different values. Property names of
     * interest to the general public are encouraged to be registered in the [CycloneDX Property
     * Taxonomy](https://github.com/CycloneDX/cyclonedx-property-taxonomy). Formal registration
     * is optional.
     */
    properties?: LightweightNameValuePairClass[];
    /**
     * Indicates if the volume is remotely (i.e., network) attached.
     */
    remote?: boolean;
    /**
     * The allocated size of the volume accessible to the associated workspace. This should
     * include the scalar size as well as IEC standard unit in either decimal or binary form.
     */
    sizeAllocated?: string;
    /**
     * The unique identifier for the volume instance within its deployment context.
     */
    uid?: string;
}

/**
 * Provides additional information about a BOM.
 */
export type BOMMetadata = {
    /**
     * The person(s) who created the BOM.
     * Authors are common in BOMs created through manual processes. BOMs created through
     * automated means may have `@.manufacturer` instead.
     */
    authors?: OrganizationalContact[];
    /**
     * The component that the BOM describes.
     */
    component?: Component;
    /**
     * The license information for the BOM document.
     * This may be different from the license(s) of the component(s) that the BOM describes.
     */
    licenses?: LicenseChoiceElement[];
    /**
     * Lifecycles communicate the stage(s) in which data in the BOM was captured. Different
     * types of data may be available at various phases of a lifecycle, such as the Software
     * Development Lifecycle (SDLC), IT Asset Management (ITAM), and Software Asset Management
     * (SAM). Thus, a BOM may include data specific to or only obtainable in a given lifecycle.
     */
    lifecycles?: FluffyLifecycle[];
    /**
     * [Deprecated] This will be removed in a future version. Use the `@.component.manufacturer`
     * instead.
     * The organization that manufactured the component that the BOM describes.
     */
    manufacture?: OrganizationalEntity;
    /**
     * The organization that created the BOM.
     * Manufacturer is common in BOMs created through automated processes. BOMs created through
     * manual means may have `@.authors` instead.
     */
    manufacturer?: OrganizationalEntity;
    /**
     * Provides the ability to document properties in a name-value store. This provides
     * flexibility to include data not officially supported in the standard without having to
     * use additional namespaces or create extensions. Unlike key-value stores, properties
     * support duplicate names, each potentially having different values. Property names of
     * interest to the general public are encouraged to be registered in the [CycloneDX Property
     * Taxonomy](https://github.com/CycloneDX/cyclonedx-property-taxonomy). Formal registration
     * is optional.
     */
    properties?: LightweightNameValuePairClass[];
    /**
     * The organization that supplied the component that the BOM describes. The supplier may
     * often be the manufacturer, but may also be a distributor or repackager.
     */
    supplier?: OrganizationalEntity;
    /**
     * The date and time (timestamp) when the BOM was created.
     */
    timestamp?: Date;
    /**
     * The tool(s) used in the creation, enrichment, and validation of the BOM.
     */
    tools?: ToolsToolsLegacy[] | PurpleTools;
}

/**
 * The product lifecycle(s) that this BOM represents.
 */
export type FluffyLifecycle = {
    /**
     * A pre-defined phase in the product lifecycle.
     */
    phase?: Phase;
    /**
     * The description of the lifecycle phase
     */
    description?: string;
    /**
     * The name of the lifecycle phase
     */
    name?: string;
}

/**
 * [Deprecated] The tool(s) used in the creation, enrichment, and validation of the BOM.
 *
 * [Deprecated] This will be removed in a future version. Use component or service instead.
 * Information about the automated or manual tool used
 *
 * [Deprecated] The tool(s) used to identify, confirm, or score the vulnerability.
 */
export type ToolsToolsLegacy = {
    /**
     * External references provide a way to document systems, sites, and information that may be
     * relevant, but are not included with the BOM. They may also establish specific
     * relationships within or external to the BOM.
     */
    externalReferences?: EnergyProviderExternalReference[];
    /**
     * The hashes of the tool (if applicable).
     */
    hashes?: Hash[];
    /**
     * The name of the tool
     */
    name?: string;
    /**
     * The name of the vendor who created the tool
     */
    vendor?: string;
    /**
     * The version of the tool
     */
    version?: string;
}

/**
 * The tool(s) used in the creation, enrichment, and validation of the BOM.
 */
export type PurpleTools = {
    /**
     * A list of software and hardware components used as tools.
     */
    components?: Component[];
    /**
     * A list of services used as tools. This may include microservices, function-as-a-service,
     * and other types of network or intra-process services.
     */
    services?: Service[];
}

/**
 * Defines a weakness in a component or service that could be exploited or triggered by a
 * threat source.
 */
export type CycloneDXBillOfMaterialsStandardVulnerability = {
    /**
     * Published advisories of the vulnerability if provided.
     */
    advisories?: FluffyAdvisory[];
    /**
     * The components or services that are affected by the vulnerability.
     */
    affects?: FluffyAffect[];
    /**
     * An assessment of the impact and exploitability of the vulnerability.
     */
    analysis?: FluffyImpactAnalysis;
    /**
     * An optional identifier which can be used to reference the vulnerability elsewhere in the
     * BOM. Every bom-ref must be unique within the BOM.
     * Value SHOULD not start with the BOM-Link intro 'urn:cdx:' to avoid conflicts with
     * BOM-Links.
     */
    "bom-ref"?: string;
    /**
     * The date and time (timestamp) when the vulnerability record was created in the
     * vulnerability database.
     */
    created?: Date;
    /**
     * Individuals or organizations credited with the discovery of the vulnerability.
     */
    credits?: FluffyCredits;
    /**
     * List of Common Weaknesses Enumerations (CWEs) codes that describes this vulnerability.
     */
    cwes?: number[];
    /**
     * A description of the vulnerability as provided by the source.
     */
    description?: string;
    /**
     * If available, an in-depth description of the vulnerability as provided by the source
     * organization. Details often include information useful in understanding root cause.
     */
    detail?: string;
    /**
     * The identifier that uniquely identifies the vulnerability.
     */
    id?: string;
    /**
     * Evidence used to reproduce the vulnerability.
     */
    proofOfConcept?: FluffyProofOfConcept;
    /**
     * Provides the ability to document properties in a name-value store. This provides
     * flexibility to include data not officially supported in the standard without having to
     * use additional namespaces or create extensions. Unlike key-value stores, properties
     * support duplicate names, each potentially having different values. Property names of
     * interest to the general public are encouraged to be registered in the [CycloneDX Property
     * Taxonomy](https://github.com/CycloneDX/cyclonedx-property-taxonomy). Formal registration
     * is optional.
     */
    properties?: LightweightNameValuePairClass[];
    /**
     * The date and time (timestamp) when the vulnerability record was first published.
     */
    published?: Date;
    /**
     * List of vulnerability ratings
     */
    ratings?: FluffyRating[];
    /**
     * Recommendations of how the vulnerability can be remediated or mitigated.
     */
    recommendation?: string;
    /**
     * Zero or more pointers to vulnerabilities that are the equivalent of the vulnerability
     * specified. Often times, the same vulnerability may exist in multiple sources of
     * vulnerability intelligence, but have different identifiers. References provide a way to
     * correlate vulnerabilities across multiple sources of vulnerability intelligence.
     */
    references?: FluffyReference[];
    /**
     * The date and time (timestamp) when the vulnerability record was rejected (if applicable).
     */
    rejected?: Date;
    /**
     * The source that published the vulnerability.
     */
    source?: StickySource;
    /**
     * The tool(s) used to identify, confirm, or score the vulnerability.
     */
    tools?: ToolsToolsLegacy[] | FluffyTools;
    /**
     * The date and time (timestamp) when the vulnerability record was last updated.
     */
    updated?: Date;
    /**
     * A bypass, usually temporary, of the vulnerability that reduces its likelihood and/or
     * impact. Workarounds often involve changes to configuration or deployments.
     */
    workaround?: string;
}

/**
 * Title and location where advisory information can be obtained. An advisory is a
 * notification of a threat to a component, service, or system.
 */
export type FluffyAdvisory = {
    /**
     * An optional name of the advisory.
     */
    title?: string;
    /**
     * Location where the advisory can be obtained.
     */
    url: string;
}

export type FluffyAffect = {
    /**
     * References a component or service by the objects bom-ref
     */
    ref: string;
    /**
     * Zero or more individual versions or range of versions.
     */
    versions?: FluffyVersion[];
}

export type FluffyVersion = {
    /**
     * A version range specified in Package URL Version Range syntax (vers) which is defined at
     * https://github.com/package-url/purl-spec/VERSION-RANGE-SPEC.rst
     */
    range?: string;
    /**
     * The vulnerability status for the version or range of versions.
     */
    status?: AffectedStatus;
    /**
     * A single version of a component or service.
     */
    version?: string;
}

/**
 * An assessment of the impact and exploitability of the vulnerability.
 */
export type FluffyImpactAnalysis = {
    /**
     * Detailed description of the impact including methods used during assessment. If a
     * vulnerability is not exploitable, this field should include specific details on why the
     * component or service is not impacted by this vulnerability.
     */
    detail?: string;
    /**
     * The date and time (timestamp) when the analysis was first issued.
     */
    firstIssued?:   Date;
    justification?: ImpactAnalysisJustification;
    /**
     * The date and time (timestamp) when the analysis was last updated.
     */
    lastUpdated?: Date;
    /**
     * A response to the vulnerability by the manufacturer, supplier, or project responsible for
     * the affected component or service. More than one response is allowed. Responses are
     * strongly encouraged for vulnerabilities where the analysis state is exploitable.
     */
    response?: Response[];
    state?:    ImpactAnalysisState;
}

/**
 * Individuals or organizations credited with the discovery of the vulnerability.
 */
export type FluffyCredits = {
    /**
     * The individuals, not associated with organizations, that are credited with vulnerability
     * discovery.
     */
    individuals?: OrganizationalContact[];
    /**
     * The organizations credited with vulnerability discovery.
     */
    organizations?: OrganizationalEntity[];
}

/**
 * Evidence used to reproduce the vulnerability.
 */
export type FluffyProofOfConcept = {
    /**
     * A description of the environment in which reproduction was possible.
     */
    environment?: string;
    /**
     * Precise steps to reproduce the vulnerability.
     */
    reproductionSteps?: string;
    /**
     * Supporting material that helps in reproducing or understanding how reproduction is
     * possible. This may include screenshots, payloads, and PoC exploit code.
     */
    supportingMaterial?: LicenseText[];
    [property: string]: any;
}

/**
 * Defines the severity or risk ratings of a vulnerability.
 */
export type FluffyRating = {
    /**
     * An optional reason for rating the vulnerability as it was
     */
    justification?: string;
    method?:        MethodEnum;
    /**
     * The numerical score of the rating.
     */
    score?: number;
    /**
     * Textual representation of the severity that corresponds to the numerical score of the
     * rating.
     */
    severity?: Severity;
    /**
     * The source that calculated the severity or risk rating of the vulnerability.
     */
    source?: StickySource;
    /**
     * Textual representation of the metric values used to score the vulnerability
     */
    vector?: string;
}

/**
 * The source that calculated the severity or risk rating of the vulnerability.
 *
 * The source of vulnerability information. This is often the organization that published
 * the vulnerability.
 *
 * The source that published the vulnerability.
 */
export type StickySource = {
    /**
     * The name of the source.
     */
    name?: string;
    /**
     * The url of the vulnerability documentation as provided by the source.
     */
    url?: string;
}

export type FluffyReference = {
    /**
     * An identifier that uniquely identifies the vulnerability.
     */
    id: string;
    /**
     * The source that published the vulnerability.
     */
    source: StickySource;
}

/**
 * The tool(s) used to identify, confirm, or score the vulnerability.
 */
export type FluffyTools = {
    /**
     * A list of software and hardware components used as tools.
     */
    components?: Component[];
    /**
     * A list of services used as tools. This may include microservices, function-as-a-service,
     * and other types of network or intra-process services.
     */
    services?: Service[];
}
