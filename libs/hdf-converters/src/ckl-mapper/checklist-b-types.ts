export interface Cklb {
    $schema:              string;
    title:                string;
    description:          string;
    additionalProperties: boolean;
    required:             string[];
    properties:           CklbProperties;
    $defs:                Defs;
}

export interface Defs {
    target_data: DefsTargetData;
    stig:        Stig;
    stig_rule:   StigRule;
}

export interface Stig {
    description:          string;
    type:                 string;
    additionalProperties: boolean;
    required:             string[];
    properties:           StigProperties;
}

export interface StigProperties {
    stig_name:            Active;
    display_name:         Active;
    stig_id:              Active;
    release_info:         Active;
    uuid:                 ID;
    reference_identifier: ReferenceIdentifier;
    size:                 Active;
    rules:                Stigs;
}

export interface Active {
    description: string;
    type:        Type;
}

export enum Type {
    Boolean = "boolean",
    Integer = "integer",
    Number = "number",
    String = "string",
}

export interface ReferenceIdentifier {
    description: string;
    type:        string[];
}

export interface Stigs {
    description: string;
    type:        string;
    items:       StigsItems;
}

export interface StigsItems {
    $ref: string;
}

export interface ID {
    type:        Type;
    description: string;
    format:      string;
}

export interface StigRule {
    description:          string;
    additionalProperties: boolean;
    properties:           StigRuleProperties;
}

export interface StigRuleProperties {
    uuid:                       Active;
    stig_uuid:                  Active;
    group_id:                   Active;
    group_id_src:               Active;
    rule_id:                    Active;
    rule_id_src:                Active;
    target_key:                 ReferenceIdentifier;
    stig_ref:                   StigRef;
    weight:                     Active;
    classification:             Active;
    severity:                   Severity;
    rule_version:               Active;
    rule_title:                 Active;
    fix_text:                   Active;
    reference_identifier:       ReferenceIdentifier;
    group_title:                Active;
    false_positives:            Active;
    false_negatives:            Active;
    discussion:                 Active;
    check_content:              ReferenceIdentifier;
    documentable:               Active;
    mitigations:                Active;
    potential_impacts:          Active;
    third_party_tools:          Active;
    mitigation_control:         Active;
    responsibility:             Active;
    security_override_guidance: Active;
    ia_controls:                Active;
    check_content_ref:          CheckContentRef;
    legacy_ids:                 Ccis;
    ccis:                       Ccis;
    group_tree:                 GroupTree;
    createdAt:                  Active;
    updatedAt:                  Active;
    status:                     Severity;
    overrides:                  Overrides;
    comments:                   Active;
    finding_details:            Active;
    STIGUuid:                   Active;
}

export interface Ccis {
    description: string;
    type:        string;
    items:       HrefClass;
}

export interface HrefClass {
    type: Type;
}

export interface CheckContentRef {
    description: string;
    type:        string[];
    properties:  CheckContentRefProperties;
}

export interface CheckContentRefProperties {
    name: HrefClass;
    href: HrefClass;
}

export interface GroupTree {
    description: string;
    type:        string;
    items:       GroupTreeItems;
}

export interface GroupTreeItems {
    description: string;
    type:        string;
    properties:  ItemsProperties;
}

export interface ItemsProperties {
    id:          HrefClass;
    title:       HrefClass;
    description: HrefClass;
}

export interface Overrides {
    Description:          string;
    additionalProperties: boolean;
    patternProperties:    OverridesPatternProperties;
}

export interface OverridesPatternProperties {
    "^[a-zA-Z_]+$": AZAZ;
}

export interface AZAZ {
    type:                 string;
    additionalProperties: boolean;
    properties:           AZAZProperties;
    patternProperties:    AZAZPatternProperties;
}

export interface AZAZPatternProperties {
    "^[a-zA-Z_]+$": HrefClass;
}

export interface AZAZProperties {
    reason: Active;
}

export interface Severity {
    description: string;
    type:        Type;
    enum:        string[];
}

export interface StigRef {
    type: string[];
}

export interface DefsTargetData {
    description:          string;
    type:                 string;
    additionalProperties: boolean;
    required:             any[];
    properties:           { [key: string]: Active };
}

export interface CklbProperties {
    title:        Active;
    cklb_version: CklbVersion;
    id:           ID;
    active:       Active;
    mode:         Active;
    has_path:     Active;
    target_data:  PropertiesTargetData;
    stigs:        Stigs;
}

export interface CklbVersion {
    description: string;
    type:        Type;
    const:       string;
}

export interface PropertiesTargetData {
    description: string;
    $ref:        string;
}