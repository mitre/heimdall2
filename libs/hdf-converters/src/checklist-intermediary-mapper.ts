import { Jsonix } from '@mitre/jsonix';
import _ from 'lodash';

export type ChecklistFile = {
  /**
   * Unique identifier for this file. Used to encode which file is currently selected, etc.
   *
   * Note that in general one can assume that if a file A is loaded AFTER a file B, then
   * A.unique_id > B.unique_id.
   * Using this property, one might order files by order in which they were added.
   */
  uniqueId: string;
  /** The filename that this file was uploaded under. */
  filename: string;

  database_id?: string;

  asset: ChecklistAsset;
  stigs: ChecklistStig[];
  raw: Object;
};

export type ChecklistAsset = {
  role: string;
  assettype: string;
  hostname: string;
  hostip: string;
  hostmac: string;
  hostfqdn: string;
  marking: string;
  targetcomment: string;
  techarea: string;
  targetkey: string;
  webordatabase: boolean;
  webdbsite: string;
  webdbinstance: string;
};

export type ChecklistStig = {
  header: StigHeader;
  vulns: ChecklistVuln[];
};

export type StigHeader = {
  version: string;
  classification: string;
  customname?: string;
  stigid: string;
  description: string;
  filename: string;
  releaseinfo?: string;
  title: string;
  uuid: string;
  notice?: string;
  source?: string;
};

export type ChecklistVuln = {
  status: string | undefined; // Look into alternate way of mapping.  Shouldn't be undefined
  findingDetails: string;
  comments: string;
  severityOverride: string;
  severityJustification: string;
  vulnNum: string;
  severity: string;
  groupTitle: string;
  ruleId: string;
  ruleVersion: string;
  ruleTitle: string;
  vulnDiscuss: string;
  iaControls: string;
  checkContent: string;
  fixText: string;
  falsePositives: string;
  falseNegatives: string;
  documentable: string;
  mitigations: string;
  potentialImpact: string;
  thirdPartyTools: string;
  mitigationControl: string;
  responsibility: string;
  securityOverrideGuidance: string;
  checkContentRef: string;
  weight: string;
  class: string;
  stigRef: string;
  targetKey: string;
  stigUuid: string;
  legacyId: string;
  cciRef: string;
};

function getAttributeData(stigdata: unknown[], tag: string): string {
  const results = stigdata.filter((attribute: unknown) => {
    return _.get(attribute, 'vulnattribute') === tag;
  });
  if (results.length === 1) {
    return _.get(results[0], 'attributedata');
  } else {
    return results
      .map((result: unknown) => _.get(result, 'attributedata'))
      .join('; ');
  }
}

function getSiData(stiginfo: unknown[], tag: string): string {
  const results = stiginfo.filter((attribute: unknown) => {
    return _.get(attribute, 'sidname') === tag;
  });
  if (results.length === 1) {
    return _.get(results[0], 'siddata');
  } else {
    return results
      .map((result: unknown) => _.get(result, 'siddata'))
      .join('; ');
  }
}

const mapping = {
  name: 'mapping',
  typeInfos: [
    {
      localName: 'STIGDATA',
      typeName: null,
      propertyInfos: [
        {
          name: 'vulnattribute',
          required: true,
          elementName: {
            localPart: 'VULN_ATTRIBUTE'
          },
          values: [
            'CCI_REF',
            'Check_Content',
            'Check_Content_Ref',
            'Class',
            'Documentable',
            'False_Negatives',
            'False_Positives',
            'Fix_Text',
            'Group_Title',
            'IA_Controls',
            'Mitigation_Control',
            'Mitigations',
            'Potential_Impact',
            'Responsibility',
            'Rule_ID',
            'Rule_Title',
            'Rule_Ver',
            'STIGRef',
            'Security_Override_Guidance',
            'Severity',
            'Third_Party_Tools',
            'Vuln_Discuss',
            'Vuln_Num',
            'Weight',
            'TargetKey',
            'STIG_UUID',
            'LEGACY_ID'
          ]
        },
        {
          name: 'attributedata',
          required: true,
          elementName: {
            localPart: 'ATTRIBUTE_DATA'
          }
        }
      ]
    },
    {
      localName: 'ASSET',
      typeName: null,
      propertyInfos: [
        {
          name: 'role',
          required: true,
          elementName: {
            localPart: 'ROLE'
          },
          values: ['None', 'Workstation', 'Member Server', 'Domain Controller']
        },
        {
          name: 'assettype',
          required: true,
          elementName: {
            localPart: 'ASSET_TYPE'
          },
          values: ['Computing', 'Non-Computing']
        },
        {
          name: 'marking',
          elementName: {
            localPart: 'MARKING'
          }
        },
        {
          name: 'hostname',
          required: true,
          elementName: {
            localPart: 'HOST_NAME'
          }
        },
        {
          name: 'hostip',
          required: true,
          elementName: {
            localPart: 'HOST_IP'
          }
        },
        {
          name: 'hostmac',
          required: true,
          elementName: {
            localPart: 'HOST_MAC'
          }
        },
        {
          name: 'hostguid',
          elementName: {
            localPart: 'HOST_GUID'
          }
        },
        {
          name: 'hostfqdn',
          required: true,
          elementName: {
            localPart: 'HOST_FQDN'
          }
        },
        {
          name: 'targetcomment',
          elementName: {
            localPart: 'TARGET_COMMENT'
          }
        },
        {
          name: 'techarea',
          required: true,
          elementName: {
            localPart: 'TECH_AREA'
          },
          values: [
            '',
            'Application Review',
            'Boundary Security',
            'CDS Admin Review',
            'CDS Technical Review',
            'Database Review',
            'Domain Name System (DNS)',
            'Exchange Server',
            'Host Based System Security (HBSS)',
            'Internal Network',
            'Mobility',
            'Releasable Networks (REL)',
            'Releaseable Networks (REL)',
            'Traditional Security',
            'UNIX OS',
            'VVOIP Review',
            'Web Review',
            'Windows OS',
            'Other Review'
          ]
        },
        {
          name: 'targetkey',
          required: true,
          elementName: {
            localPart: 'TARGET_KEY'
          }
        },
        {
          name: 'stigguid',
          elementName: {
            localPart: 'STIG_GUID'
          }
        },
        {
          name: 'webordatabase',
          required: true,
          elementName: {
            localPart: 'WEB_OR_DATABASE'
          },
          typeInfo: 'Boolean'
        },
        {
          name: 'webdbsite',
          required: true,
          elementName: {
            localPart: 'WEB_DB_SITE'
          }
        },
        {
          name: 'webdbinstance',
          required: true,
          elementName: {
            localPart: 'WEB_DB_INSTANCE'
          }
        }
      ]
    },
    {
      localName: 'SIDATA',
      typeName: null,
      propertyInfos: [
        {
          name: 'sidname',
          required: true,
          elementName: {
            localPart: 'SID_NAME'
          },
          values: [
            'classification',
            'customname',
            'description',
            'filename',
            'notice',
            'releaseinfo',
            'source',
            'stigid',
            'title',
            'uuid',
            'version'
          ]
        },
        {
          name: 'siddata',
          elementName: {
            localPart: 'SID_DATA'
          }
        }
      ]
    },
    {
      localName: 'STIGS',
      typeName: null,
      propertyInfos: [
        {
          name: 'istig',
          required: true,
          collection: true,
          elementName: {
            localPart: 'iSTIG'
          },
          typeInfo: '.ISTIG'
        }
      ]
    },
    {
      localName: 'STIGINFO',
      typeName: null,
      propertyInfos: [
        {
          name: 'sidata',
          required: true,
          collection: true,
          elementName: {
            localPart: 'SI_DATA'
          },
          typeInfo: '.SIDATA'
        }
      ]
    },
    {
      localName: 'CHECKLIST',
      typeName: null,
      propertyInfos: [
        {
          name: 'asset',
          required: true,
          elementName: {
            localPart: 'ASSET'
          },
          typeInfo: '.ASSET'
        },
        {
          name: 'stigs',
          required: true,
          elementName: {
            localPart: 'STIGS'
          },
          typeInfo: '.STIGS'
        }
      ]
    },
    {
      localName: 'VULN',
      typeName: null,
      propertyInfos: [
        {
          name: 'stigdata',
          required: true,
          collection: true,
          elementName: {
            localPart: 'STIG_DATA'
          },
          typeInfo: '.STIGDATA'
        },
        {
          name: 'status',
          required: true,
          elementName: {
            localPart: 'STATUS'
          },
          values: ['NotAFinding', 'Open', 'Not_Applicable', 'Not_Reviewed']
        },
        {
          name: 'findingdetails',
          required: true,
          elementName: {
            localPart: 'FINDING_DETAILS'
          }
        },
        {
          name: 'comments',
          required: true,
          elementName: {
            localPart: 'COMMENTS'
          }
        },
        {
          name: 'severityoverride',
          required: true,
          elementName: {
            localPart: 'SEVERITY_OVERRIDE'
          },
          values: ['', 'low', 'medium', 'high']
        },
        {
          name: 'severityjustification',
          required: true,
          elementName: {
            localPart: 'SEVERITY_JUSTIFICATION'
          }
        }
      ]
    },
    {
      localName: 'ISTIG',
      typeName: null,
      propertyInfos: [
        {
          name: 'stiginfo',
          required: true,
          elementName: {
            localPart: 'STIG_INFO'
          },
          typeInfo: '.STIGINFO'
        },
        {
          name: 'vuln',
          required: true,
          collection: true,
          elementName: {
            localPart: 'VULN'
          },
          typeInfo: '.VULN'
        }
      ]
    }
  ],
  elementInfos: [
    {
      elementName: {
        localPart: 'WEB_DB_INSTANCE'
      }
    },
    {
      elementName: {
        localPart: 'TARGET_KEY'
      }
    },
    {
      values: ['None', 'Workstation', 'Member Server', 'Domain Controller'],
      elementName: {
        localPart: 'ROLE'
      }
    },
    {
      elementName: {
        localPart: 'MARKING'
      }
    },
    {
      values: [
        'classification',
        'customname',
        'description',
        'filename',
        'notice',
        'releaseinfo',
        'source',
        'stigid',
        'title',
        'uuid',
        'version'
      ],
      elementName: {
        localPart: 'SID_NAME'
      }
    },
    {
      elementName: {
        localPart: 'HOST_NAME'
      }
    },
    {
      values: ['', 'low', 'medium', 'high'],
      elementName: {
        localPart: 'SEVERITY_OVERRIDE'
      }
    },
    {
      elementName: {
        localPart: 'HOST_FQDN'
      }
    },
    {
      elementName: {
        localPart: 'FINDING_DETAILS'
      }
    },
    {
      elementName: {
        localPart: 'SEVERITY_JUSTIFICATION'
      }
    },
    {
      typeInfo: '.STIGDATA',
      elementName: {
        localPart: 'STIG_DATA'
      }
    },
    {
      elementName: {
        localPart: 'HOST_MAC'
      }
    },
    {
      elementName: {
        localPart: 'HOST_GUID'
      }
    },
    {
      values: ['NotAFinding', 'Open', 'Not_Applicable', 'Not_Reviewed'],
      elementName: {
        localPart: 'STATUS'
      }
    },
    {
      elementName: {
        localPart: 'COMMENTS'
      }
    },
    {
      typeInfo: '.VULN',
      elementName: {
        localPart: 'VULN'
      }
    },
    {
      typeInfo: '.STIGINFO',
      elementName: {
        localPart: 'STIG_INFO'
      }
    },
    {
      typeInfo: '.ASSET',
      elementName: {
        localPart: 'ASSET'
      }
    },
    {
      typeInfo: '.CHECKLIST',
      elementName: {
        localPart: 'CHECKLIST'
      }
    },
    {
      typeInfo: '.ISTIG',
      elementName: {
        localPart: 'iSTIG'
      }
    },
    {
      elementName: {
        localPart: 'HOST_IP'
      }
    },
    {
      elementName: {
        localPart: 'STIG_GUID'
      }
    },
    {
      typeInfo: 'Boolean',
      elementName: {
        localPart: 'WEB_OR_DATABASE'
      }
    },
    {
      elementName: {
        localPart: 'SID_DATA'
      }
    },
    {
      values: [
        '',
        'Application Review',
        'Boundary Security',
        'CDS Admin Review',
        'CDS Technical Review',
        'Database Review',
        'Domain Name System (DNS)',
        'Exchange Server',
        'Host Based System Security (HBSS)',
        'Internal Network',
        'Mobility',
        'Releasable Networks (REL)',
        'Releaseable Networks (REL)',
        'Traditional Security',
        'UNIX OS',
        'VVOIP Review',
        'Web Review',
        'Windows OS',
        'Other Review'
      ],
      elementName: {
        localPart: 'TECH_AREA'
      }
    },
    {
      elementName: {
        localPart: 'ATTRIBUTE_DATA'
      }
    },
    {
      values: ['Computing', 'Non-Computing'],
      elementName: {
        localPart: 'ASSET_TYPE'
      }
    },
    {
      values: [
        'CCI_REF',
        'Check_Content',
        'Check_Content_Ref',
        'Class',
        'Documentable',
        'False_Negatives',
        'False_Positives',
        'Fix_Text',
        'Group_Title',
        'IA_Controls',
        'Mitigation_Control',
        'Mitigations',
        'Potential_Impact',
        'Responsibility',
        'Rule_ID',
        'Rule_Title',
        'Rule_Ver',
        'STIGRef',
        'Security_Override_Guidance',
        'Severity',
        'Third_Party_Tools',
        'Vuln_Discuss',
        'Vuln_Num',
        'Weight',
        'TargetKey',
        'STIG_UUID',
        'LEGACY_ID'
      ],
      elementName: {
        localPart: 'VULN_ATTRIBUTE'
      }
    },
    {
      elementName: {
        localPart: 'TARGET_COMMENT'
      }
    },
    {
      typeInfo: '.SIDATA',
      elementName: {
        localPart: 'SI_DATA'
      }
    },
    {
      elementName: {
        localPart: 'WEB_DB_SITE'
      }
    },
    {
      typeInfo: '.STIGS',
      elementName: {
        localPart: 'STIGS'
      }
    }
  ]
};

function convertChecklist(text: string): Object {
  /** Mapping from checklist XSD schema to JS object
   *  (Generated by jsonix-schema-compiler)
   */

  const context = new Jsonix.Context([mapping]);
  const unmarshaller = context.createUnmarshaller();

  return unmarshaller.unmarshalString(text);
}

function revertChecklist(data: Object): string {
  const context = new Jsonix.Context([mapping]);

  const marshaller = context.createMarshaller();
  return marshaller.marshalString(data);
}

export class ChecklistIntermediaryConverter {
  static toIntermediary(options: { text: string; filename: string }) {
    const raw = convertChecklist(options.text);

    const asset: ChecklistAsset = {
      role: _.get(raw, 'value.asset.role'),
      assettype: _.get(raw, 'value.asset.assettype'),
      hostname: _.get(raw, 'value.asset.hostname'),
      hostip: _.get(raw, 'value.asset.hostip'),
      hostmac: _.get(raw, 'value.asset.hostmac'),
      hostfqdn: _.get(raw, 'value.asset.hostfqdn'),
      marking: _.get(raw, 'value.asset.marking'),
      targetcomment: _.get(raw, 'value.asset.targetcomment'),
      techarea: _.get(raw, 'value.asset.techarea'),
      targetkey: _.get(raw, 'value.asset.targetkey'),
      webordatabase: _.get(raw, 'value.asset.webordatabase'),
      webdbsite: _.get(raw, 'value.asset.webdbsite'),
      webdbinstance: _.get(raw, 'value.asset.webdbinstance')
    };

    const rawStigs: unknown[] = _.get(raw, 'value.stigs.istig');
    const stigs: ChecklistStig[] = [];

    rawStigs.forEach((stig: unknown) => {
      const stigInfo = _.get(stig, 'stiginfo.sidata');
      const header: StigHeader = {
        version: getSiData(stigInfo, 'version'),
        classification: getSiData(stigInfo, 'classification'),
        customname: getSiData(stigInfo, 'customname'),
        stigid: getSiData(stigInfo, 'stigid'),
        description: getSiData(stigInfo, 'description'),
        filename: getSiData(stigInfo, 'filename'),
        releaseinfo: getSiData(stigInfo, 'releaseinfo'),
        title: getSiData(stigInfo, 'title'),
        uuid: getSiData(stigInfo, 'uuid'),
        notice: getSiData(stigInfo, 'notice'),
        source: getSiData(stigInfo, 'source')
      };

      const STATUS_MAPPING_FROM: Map<string, string> = new Map([
        ['NotAFinding', 'Passed'],
        ['Open', 'Failed'],
        ['Not_Applicable', 'Not Applicable'],
        ['Not_Reviewed', 'Not Reviewed']
      ]);

      const checklistVulns: ChecklistVuln[] = [];
      const vulns: unknown[] = _.get(stig, 'vuln');
      vulns.forEach((vuln: unknown) => {
        const stigdata: unknown[] = _.get(vuln, 'stigdata');
        const checklistVuln: ChecklistVuln = {
          status: STATUS_MAPPING_FROM.get(_.get(vuln, 'status')),
          findingDetails: _.get(vuln, 'findingdetails'),
          comments: _.get(vuln, 'comments'),
          severityOverride: _.get(vuln, 'severityoverride'),
          severityJustification: _.get(vuln, 'severityjustification'),
          vulnNum: getAttributeData(stigdata, 'Vuln_Num'),
          severity: getAttributeData(stigdata, 'Severity'),
          groupTitle: getAttributeData(stigdata, 'Group_Title'),
          ruleId: getAttributeData(stigdata, 'Rule_ID'),
          ruleVersion: getAttributeData(stigdata, 'Rule_Ver'),
          ruleTitle: getAttributeData(stigdata, 'Rule_Title'),
          vulnDiscuss: getAttributeData(stigdata, 'Vuln_Discuss'),
          iaControls: getAttributeData(stigdata, 'IA_Controls'),
          checkContent: getAttributeData(stigdata, 'Check_Content'),
          fixText: getAttributeData(stigdata, 'Fix_Text'),
          falsePositives: getAttributeData(stigdata, 'False_Positives'),
          falseNegatives: getAttributeData(stigdata, 'False_Negatives'),
          documentable: getAttributeData(stigdata, 'Documentable'),
          mitigations: getAttributeData(stigdata, 'Mitigations'),
          potentialImpact: getAttributeData(stigdata, 'Potential_Impact'),
          thirdPartyTools: getAttributeData(stigdata, 'Third_Party_Tools'),
          mitigationControl: getAttributeData(stigdata, 'Mitigation_Control'),
          responsibility: getAttributeData(stigdata, 'Responsibility'),
          securityOverrideGuidance: getAttributeData(
            stigdata,
            'Security_Override_Guidance'
          ),
          checkContentRef: getAttributeData(stigdata, 'Check_Content_Ref'),
          weight: getAttributeData(stigdata, 'Weight'),
          class: getAttributeData(stigdata, 'Class'),
          stigRef: getAttributeData(stigdata, 'STIGRef'),
          targetKey: getAttributeData(stigdata, 'TargetKey'),
          stigUuid: getAttributeData(stigdata, 'STIG_UUID'),
          legacyId: getAttributeData(stigdata, 'LEGACY_ID'),
          cciRef: getAttributeData(stigdata, 'CCI_REF')
        };
        checklistVulns.push(checklistVuln);
      });

      stigs.push({
        header: header,
        vulns: checklistVulns
      });
    });

    const newChecklist: Omit<ChecklistFile, 'uniqueId'> = {
      filename: options.filename,
      asset: asset,
      stigs: stigs,
      raw: raw
    };

    return newChecklist;
  }
}

export class ChecklistConverter {
  static toChecklist(data: ChecklistFile): string {
    // Updating assets
    const asset = { ...data.asset, TYPE_NAME: 'Checklist.ASSET' };
    _.set(data, 'raw.value.asset', asset);

    const STATUS_MAPPING_TO: Map<string | undefined, string> = new Map([
      ['Passed', 'NotAFinding'],
      ['Failed', 'Open'],
      ['Not Applicable', 'Not_Applicable'],
      ['Not Reviewed', 'Not_Reviewed']
    ]);

    // Updating marked-up rule data
    _.get(data.raw, 'value.stigs.istig').forEach(
      (stig: any, stig_index: number) => {
        _.get(stig, 'vuln').forEach((vuln: any, vuln_index: number) => {
          _.set(
            vuln,
            'status',
            STATUS_MAPPING_TO.get(data.stigs[stig_index].vulns[vuln_index].status)
          );
          _.set(
            vuln,
            'findingdetails',
            data.stigs[stig_index].vulns[vuln_index].findingDetails
          );
          _.set(
            vuln,
            'comments',
            data.stigs[stig_index].vulns[vuln_index].comments
          );
          _.set(
            vuln,
            'severityoverride',
            data.stigs[stig_index].vulns[vuln_index].severityOverride
          );
          _.set(
            vuln,
            'severityjustification',
            data.stigs[stig_index].vulns[vuln_index].severityJustification
          );
        });
      }
    );

    return revertChecklist(data.raw);
  }
}
