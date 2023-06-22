var CKL_Module_Factory = function () {
  var CKL = {
    name: 'CKL',
    typeInfos: [{
        localName: 'STIGDATA',
        typeName: null,
        propertyInfos: [{
            name: 'vulnattribute',
            required: true,
            elementName: {
              localPart: 'VULN_ATTRIBUTE'
            },
            values: ['CCI_REF', 'Check_Content', 'Check_Content_Ref', 'Class', 'Documentable', 'False_Negatives', 'False_Positives', 'Fix_Text', 'Group_Title', 'IA_Controls', 'Mitigation_Control', 'Mitigations', 'Potential_Impact', 'Responsibility', 'Rule_ID', 'Rule_Title', 'Rule_Ver', 'STIGRef', 'Security_Override_Guidance', 'Severity', 'Third_Party_Tools', 'Vuln_Discuss', 'Vuln_Num', 'Weight', 'TargetKey', 'STIG_UUID', 'LEGACY_ID']
          }, {
            name: 'attributedata',
            required: true,
            elementName: {
              localPart: 'ATTRIBUTE_DATA'
            }
          }]
      }, {
        localName: 'ASSET',
        typeName: null,
        propertyInfos: [{
            name: 'role',
            required: true,
            elementName: {
              localPart: 'ROLE'
            },
            values: ['None', 'Workstation', 'Member Server', 'Domain Controller']
          }, {
            name: 'assettype',
            required: true,
            elementName: {
              localPart: 'ASSET_TYPE'
            },
            values: ['Computing', 'Non-Computing']
          }, {
            name: 'marking',
            elementName: {
              localPart: 'MARKING'
            }
          }, {
            name: 'hostname',
            required: true,
            elementName: {
              localPart: 'HOST_NAME'
            }
          }, {
            name: 'hostip',
            required: true,
            elementName: {
              localPart: 'HOST_IP'
            }
          }, {
            name: 'hostmac',
            required: true,
            elementName: {
              localPart: 'HOST_MAC'
            }
          }, {
            name: 'hostguid',
            elementName: {
              localPart: 'HOST_GUID'
            }
          }, {
            name: 'hostfqdn',
            required: true,
            elementName: {
              localPart: 'HOST_FQDN'
            }
          }, {
            name: 'targetcomment',
            elementName: {
              localPart: 'TARGET_COMMENT'
            }
          }, {
            name: 'techarea',
            required: true,
            elementName: {
              localPart: 'TECH_AREA'
            },
            values: ['', 'Application Review', 'Boundary Security', 'CDS Admin Review', 'CDS Technical Review', 'Database Review', 'Domain Name System (DNS)', 'Exchange Server', 'Host Based System Security (HBSS)', 'Internal Network', 'Mobility', 'Releasable Networks (REL)', 'Releaseable Networks (REL)', 'Traditional Security', 'UNIX OS', 'VVOIP Review', 'Web Review', 'Windows OS', 'Other Review']
          }, {
            name: 'targetkey',
            required: true,
            elementName: {
              localPart: 'TARGET_KEY'
            }
          }, {
            name: 'stigguid',
            elementName: {
              localPart: 'STIG_GUID'
            }
          }, {
            name: 'webordatabase',
            required: true,
            elementName: {
              localPart: 'WEB_OR_DATABASE'
            },
            typeInfo: 'Boolean'
          }, {
            name: 'webdbsite',
            required: true,
            elementName: {
              localPart: 'WEB_DB_SITE'
            }
          }, {
            name: 'webdbinstance',
            required: true,
            elementName: {
              localPart: 'WEB_DB_INSTANCE'
            }
          }]
      }, {
        localName: 'SIDATA',
        typeName: null,
        propertyInfos: [{
            name: 'sidname',
            required: true,
            elementName: {
              localPart: 'SID_NAME'
            },
            values: ['classification', 'customname', 'description', 'filename', 'notice', 'releaseinfo', 'source', 'stigid', 'title', 'uuid', 'version']
          }, {
            name: 'siddata',
            elementName: {
              localPart: 'SID_DATA'
            }
          }]
      }, {
        localName: 'STIGS',
        typeName: null,
        propertyInfos: [{
            name: 'istig',
            required: true,
            collection: true,
            elementName: {
              localPart: 'iSTIG'
            },
            typeInfo: '.ISTIG'
          }]
      }, {
        localName: 'STIGINFO',
        typeName: null,
        propertyInfos: [{
            name: 'sidata',
            required: true,
            collection: true,
            elementName: {
              localPart: 'SI_DATA'
            },
            typeInfo: '.SIDATA'
          }]
      }, {
        localName: 'CHECKLIST',
        typeName: null,
        propertyInfos: [{
            name: 'asset',
            required: true,
            elementName: {
              localPart: 'ASSET'
            },
            typeInfo: '.ASSET'
          }, {
            name: 'stigs',
            required: true,
            elementName: {
              localPart: 'STIGS'
            },
            typeInfo: '.STIGS'
          }]
      }, {
        localName: 'VULN',
        typeName: null,
        propertyInfos: [{
            name: 'stigdata',
            required: true,
            collection: true,
            elementName: {
              localPart: 'STIG_DATA'
            },
            typeInfo: '.STIGDATA'
          }, {
            name: 'status',
            required: true,
            elementName: {
              localPart: 'STATUS'
            },
            values: ['NotAFinding', 'Open', 'Not_Applicable', 'Not_Reviewed']
          }, {
            name: 'findingdetails',
            required: true,
            elementName: {
              localPart: 'FINDING_DETAILS'
            }
          }, {
            name: 'comments',
            required: true,
            elementName: {
              localPart: 'COMMENTS'
            }
          }, {
            name: 'severityoverride',
            required: true,
            elementName: {
              localPart: 'SEVERITY_OVERRIDE'
            },
            values: ['', 'low', 'medium', 'high']
          }, {
            name: 'severityjustification',
            required: true,
            elementName: {
              localPart: 'SEVERITY_JUSTIFICATION'
            }
          }]
      }, {
        localName: 'ISTIG',
        typeName: null,
        propertyInfos: [{
            name: 'stiginfo',
            required: true,
            elementName: {
              localPart: 'STIG_INFO'
            },
            typeInfo: '.STIGINFO'
          }, {
            name: 'vuln',
            required: true,
            collection: true,
            elementName: {
              localPart: 'VULN'
            },
            typeInfo: '.VULN'
          }]
      }],
    elementInfos: [{
        elementName: {
          localPart: 'WEB_DB_INSTANCE'
        }
      }, {
        elementName: {
          localPart: 'TARGET_KEY'
        }
      }, {
        values: ['None', 'Workstation', 'Member Server', 'Domain Controller'],
        elementName: {
          localPart: 'ROLE'
        }
      }, {
        elementName: {
          localPart: 'MARKING'
        }
      }, {
        values: ['classification', 'customname', 'description', 'filename', 'notice', 'releaseinfo', 'source', 'stigid', 'title', 'uuid', 'version'],
        elementName: {
          localPart: 'SID_NAME'
        }
      }, {
        elementName: {
          localPart: 'HOST_NAME'
        }
      }, {
        values: ['', 'low', 'medium', 'high'],
        elementName: {
          localPart: 'SEVERITY_OVERRIDE'
        }
      }, {
        elementName: {
          localPart: 'HOST_FQDN'
        }
      }, {
        elementName: {
          localPart: 'FINDING_DETAILS'
        }
      }, {
        elementName: {
          localPart: 'SEVERITY_JUSTIFICATION'
        }
      }, {
        typeInfo: '.STIGDATA',
        elementName: {
          localPart: 'STIG_DATA'
        }
      }, {
        elementName: {
          localPart: 'HOST_MAC'
        }
      }, {
        elementName: {
          localPart: 'HOST_GUID'
        }
      }, {
        values: ['NotAFinding', 'Open', 'Not_Applicable', 'Not_Reviewed'],
        elementName: {
          localPart: 'STATUS'
        }
      }, {
        elementName: {
          localPart: 'COMMENTS'
        }
      }, {
        typeInfo: '.VULN',
        elementName: {
          localPart: 'VULN'
        }
      }, {
        typeInfo: '.STIGINFO',
        elementName: {
          localPart: 'STIG_INFO'
        }
      }, {
        typeInfo: '.ASSET',
        elementName: {
          localPart: 'ASSET'
        }
      }, {
        typeInfo: '.CHECKLIST',
        elementName: {
          localPart: 'CHECKLIST'
        }
      }, {
        typeInfo: '.ISTIG',
        elementName: {
          localPart: 'iSTIG'
        }
      }, {
        elementName: {
          localPart: 'HOST_IP'
        }
      }, {
        elementName: {
          localPart: 'STIG_GUID'
        }
      }, {
        typeInfo: 'Boolean',
        elementName: {
          localPart: 'WEB_OR_DATABASE'
        }
      }, {
        elementName: {
          localPart: 'SID_DATA'
        }
      }, {
        values: ['', 'Application Review', 'Boundary Security', 'CDS Admin Review', 'CDS Technical Review', 'Database Review', 'Domain Name System (DNS)', 'Exchange Server', 'Host Based System Security (HBSS)', 'Internal Network', 'Mobility', 'Releasable Networks (REL)', 'Releaseable Networks (REL)', 'Traditional Security', 'UNIX OS', 'VVOIP Review', 'Web Review', 'Windows OS', 'Other Review'],
        elementName: {
          localPart: 'TECH_AREA'
        }
      }, {
        elementName: {
          localPart: 'ATTRIBUTE_DATA'
        }
      }, {
        values: ['Computing', 'Non-Computing'],
        elementName: {
          localPart: 'ASSET_TYPE'
        }
      }, {
        values: ['CCI_REF', 'Check_Content', 'Check_Content_Ref', 'Class', 'Documentable', 'False_Negatives', 'False_Positives', 'Fix_Text', 'Group_Title', 'IA_Controls', 'Mitigation_Control', 'Mitigations', 'Potential_Impact', 'Responsibility', 'Rule_ID', 'Rule_Title', 'Rule_Ver', 'STIGRef', 'Security_Override_Guidance', 'Severity', 'Third_Party_Tools', 'Vuln_Discuss', 'Vuln_Num', 'Weight', 'TargetKey', 'STIG_UUID', 'LEGACY_ID'],
        elementName: {
          localPart: 'VULN_ATTRIBUTE'
        }
      }, {
        elementName: {
          localPart: 'TARGET_COMMENT'
        }
      }, {
        typeInfo: '.SIDATA',
        elementName: {
          localPart: 'SI_DATA'
        }
      }, {
        elementName: {
          localPart: 'WEB_DB_SITE'
        }
      }, {
        typeInfo: '.STIGS',
        elementName: {
          localPart: 'STIGS'
        }
      }]
  };
  return {
    CKL: CKL
  };
};
if (typeof define === 'function' && define.amd) {
  define([], CKL_Module_Factory);
}
else {
  var CKL_Module = CKL_Module_Factory();
  if (typeof module !== 'undefined' && module.exports) {
    module.exports.CKL = CKL_Module.CKL;
  }
  else {
    var CKL = CKL_Module.CKL;
  }
}