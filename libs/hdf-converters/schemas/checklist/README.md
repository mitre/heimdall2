# Checklist Schema

## Contents

- [How to Retrieve Latest Version](#how-to-retrieve-latest-version)
  - [Resource Links](#resource-links)
- [StigViewer UI to CKL Mapping](#StigViewer-UI-to-CKL-Mapping)


## How to Retrieve Latest Version

The checklist schema is found within the StigViewer source code. The easiest way to access this file is to crack open the .jar using the jd-gui tool.  

### Resource links

-  The StigViewer jar is located here: https://public.cyber.mil/stigs/srg-stig-tools/
- The jd-gui tool is here: https://mitre.enterprise.slack.com/files/WM4DZRHGD/F04UFGPQ55J/jd-gui-1.6.6.jar


## StigViewer UI to CKL Mapping

<style>
  .tableBox {
    width: 95%;
    height: 700px;
    border: 1px solid;
    overflow: auto
  }
  table {
    text-align: left;
    position: relative;
    border-collapse: collapse;
  }
  th, td {
    padding: 0.25rem;
    border: 1px solid;
  }
  th {
    position: sticky;
    top: 0;
    box-shadow: 0 2px 2px -1px rgba(0, 0, 0, 0.4);
    background: grey; 
  }
</style>

<div class='tableBox'>
  <table>
    <thead>
      <tr>
        <th>Checklist</th>
        <th>ChecklistFile (intermediate Object found in Passthrough)</th>
        <th>Typical Values and/or StigViewer area</th>
        <th>is Searchable?</th>
        <th>HDF</th>
        <th>Notes</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>ASSET</td>
        <td>ChecklistAsset<td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
      </tr>
      <tr>
        <td>ROLE</td>
        <td>role</td>
        <td>Default None |   Workstation | Member Server | Domain Controller</td>
        <td></td>
        <td></td>
        <td></td>
      </tr>
      <tr>
        <td>ASSET_TYPE </td>
        <td>assettype</td>
        <td>Target Data   (Computing | Non-Computing)</td>
        <td></td>
        <td></td>
        <td></td>
      </tr>
      <tr>
        <td>MARKING</td>
        <td>marking</td>
        <td>Target Data   (default CUI)</td>
        <td></td>
        <td></td>
        <td>Hardcoded   to CUI:     private String marking = "CUI";</td>
      </tr>
      <tr>
        <td>HOST_NAME</td>
        <td>hostname</td>
        <td>Target Data</td>
        <td></td>
        <td></td>
        <td></td>
      </tr>
      <tr>
        <td>HOST_IP</td>
        <td>hostip</td>
        <td>Target Data</td>
        <td></td>
        <td></td>
        <td></td>
      </tr>
      <tr>
        <td>HOST_MAC</td>
        <td>hostmac</td>
        <td>Target Data</td>
        <td></td>
        <td></td>
        <td></td>
      </tr>
      <tr>
        <td>HOST_GUID</td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
      </tr>
      <tr>
        <td>HOST_FQDN</td>
        <td>hostfqdn</td>
        <td>Target Data</td>
        <td></td>
        <td></td>
        <td></td>
      </tr>
      <tr>
        <td>TARGET_COMMENT</td>
        <td>targetcomment</td>
        <td>Target Data</td>
        <td></td>
        <td></td>
        <td></td>
      </tr>
      <tr>
        <td>TECH_AREA</td>
        <td>techarea</td>
        <td>Under Technology Area - dropdown</td>
        <td></td>
        <td></td>
        <td>There is a supported spelling error</td>
      </tr>
      <tr>
        <td>TARKET_KEY</td>
        <td>targetkey</td>
        <td>First non-empty vuln attr.TargetKey</td>
        <td></td>
        <td></td>
        <td>if (cs.size() > 0 && ((STIG)cs.get(0)).getVulnList().size() > 0) this.Checklist.setTargetKey(((Vuln)((STIG)cs.get(0)).getVulnList().get(0)).getAttr(Vuln.VulnAttr.TargetKey)); - Code snippet from Program_Tabs/Tab_Checklist/ChecklistDriver.class where cs is an Array of STIGs</td>
      </tr>
      <tr>
        <td>STIG_GUID</td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
      </tr>
      <tr>
        <td>WEB_OR_DATABASE</td>
        <td>webordatabase</td>
        <td>Checkbox Boolean   default False</td>
        <td></td>
        <td></td>
        <td></td>
      </tr>
      <tr>
        <td>WEB_DB_SITE</td>
        <td>webdbsite</td>
        <td>If above is true</td>
        <td></td>
        <td></td>
        <td></td>
      </tr>
      <tr>
        <td>WEB_DB_INSTANCE</td>
        <td>webdbinstance</td>
        <td>If above is true</td>
        <td></td>
        <td></td>
        <td></td>
      </tr>
      <tr>
        <td>STIGS</td>
        <td>ChecklistStig</td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
      </tr>
      <tr>
        <td>iSTIG</td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
      </tr>
      <tr>
        <td>STIG_INFO</td>
        <td>StigHeader</td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
      </tr>
      <tr>
        <td>CLASSIFICATION</td>
        <td>classification</td>
        <td>Default   UNCLASSIFIED | UNCLASSIFIED//FOR OFFICIAL USE ONLY | CUI</td>
        <td></td>
        <td></td>
        <td>This alters Vuln.Class to equal Unclass | FOUO | CUI and this is what appears next to Classification in viewer</td>
      </tr>
      <tr>
        <td>CUSTOMNAME</td>
        <td>customname</td>
        <td>Typically empty</td>
        <td></td>
        <td></td>
        <td>Does not appear to have a viewable component linked</td>
      </tr>
      <tr>
        <td>DESCRIPTION</td>
        <td>description</td>
        <td>Either "This Security Technical Implementation Guide is published as a tool to improve the security of Department of Defense (DoD) information systems. The requirements are derived from the National Institute of Standards and Technology (NIST) 800-53 and related documents. Comments or proposed revisions to this document should be sent via e-mail to the following address: disa.stig_spt@mail.mil." OR  "This Security Requirements Guide is published as a tool to improve the security of Department of Defense (DoD) information systems. The requirements are derived from the National Institute of Standards and Technology (NIST) 800-53 and related documents. Comments or proposed revisions to this document should be sent via email to the following address: disa.stig_spt@mail.mil."</td>
        <td></td>
        <td>profiles.summary</td>
        <td>This can also be blank and appears the Export is using some concatenation of the filename + version + sha256 + maintainer + copyright + copyright_email + number of controls</td>
      </tr>
      <tr>
        <td>FILENAME</td>
        <td>filename</td>
        <td>Specific XXCDF Filename</td>
        <td></td>
        <td></td>
        <td></td>
      </tr>
      <tr>
        <td>NOTICE</td>
        <td>notice</td>
        <td>Only value seen is terms-of-use</td>
        <td>profiles.license</td>
        <td></td>
        <td>Code in source that parses it does not appear in viewer case "notice": this.ImportSTIG.setSTIG_notice(parseXMLAttr("id"));</td>
      </tr>
      <tr>
        <td>RELEASEINFO</td>
        <td>releaseinfo</td>
        <td> Release: # Benchmark Date: dd mon yyyy</td>
        <td></td>
        <td></td>
        <td>Appears in 'title' at top after :: and Version #</td>
      </tr>
      <tr>
        <td>SOURCE</td>
        <td>source</td>
        <td>Only value seen is: STIG.DOD.MIL</td>
        <td></td>
        <td></td>
        <td></td>
      </tr>
      <tr>
        <td>STIGID</td>
        <td>stigid</td>
        <td>Seems to be a duplicate field of title but snake cased</td>
        <td></td>
        <td></td>
        <td></td>
      </tr>
      <tr>
        <td>TITLE</td>
        <td>title</td>
        <td>Title of STIG</td>
        <td></td>
        <td>profiles.title && profiles.name</td>
        <td>This appears as the first element of 'title' at top: {title} :: Version {version}, {releaseinfo}/nThis full title is captured under STIGRef under VULN </td>
      </tr>
      <tr>
        <td>UUID</td>
        <td>uuid</td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
      </tr>
      <tr>
        <td>VERSION</td>
        <td>version</td>
        <td>Version # of the stig typically a number</td>
        <td></td>
        <td>profiles.version</td>
        <td>This appears just after the 'title' and :: Version #</td>
      </tr>
      <tr>
        <td>VULN</td>
        <td>ChecklistVuln</td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
      </tr>
      <tr>
        <td>STIG_DATA</td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
      </tr>
      <tr>
        <td>CCI_REF</td>
        <td>cciRef</td>
        <td>List of CCI numbers</td>
        <td>yes</td>
        <td>profiles.controls.tags.cci   && profiles.controls.tags.nist using transform</td>
        <td>CCI Definitions and NIST Control Maps are down internally with the use of U_CCI_List.xml and displayed under References. Also appears as a column in center</td>
      </tr>
      <tr>
        <td>CHECK_CONTENT</td>
        <td>checkContent</td>
        <td>string appearing as Check Text in center</td>
        <td></td>
        <td>profiles.controls.descriptions as label 'check'</td>
        <td></td>
      </tr>
      <tr>
        <td>CHECK_CONTENT_REF</td>
        <td>checkContentRef</td>
        <td>M always M</td>
        <td></td>
        <td></td>
        <td></td>
      </tr>
      <tr>
        <td>CLASS</td>
        <td>class</td>
        <td>Unclass | FOUO | CUI</td>
        <td></td>
        <td></td>
        <td>This is what appears next to Classification in viewer and seems to be controlled by the CLASSIFICATION value</td>
      </tr>
    </tbody>
  </table>

</div>
 
 |  |  |   |   | 
DOCUMENTABLE | documentable | Boolean |   |   | Only value I have   seen is 'false' and is used during the StigViewer Export to print Yes or No.
FALSE_NEGATIVES | falseNegatives |   |   | profiles.controls.tags.false_negatives |  
FALSE_POSITIVES | falsePositives |   |   | profiles.controls.tags.false_positives |  
FIX_TEXT | fixText | string |   | profiles.controls.descriptions   as fix | Appears as Fix   Text
GROUP_TITLE | groupTitle |   |   | profiles.controls.tags.gtitle | Appears as Rule   Name in center
IA_CONTROLS | iaControls | List of DOD-8500.2   controls | yes | profiles.controls.tags.ia_controls | If existing,   appears under References as MISC Data
MITIGATION_CONTROL | mitigationControls |   |   | profiles.controls.tags.mitigation_controls |  
MITIGATIONS | mitigations |   |   | profiles.controls.tags.mitigations |  
POTENTIAL_IMPACT | potentialImpact |   |   | profiles.controls.tags.potential_impact |  
RESPONSIBILITY | responsibility |   |   | profiles.tags.responsibility |  
RULE_ID | ruleId | Rule ID | yes | profiles.controls.tags.rid | Appears in center   column as Rule ID and as field in header
RULE_TITLE | ruleTitle | Rule Title | yes | profiles.controls.title | Appears as Rule   Title
RULE_VER | ruleVersion | STIG ID | yes | profiles.controls.tags.stigId | Appears in center   column as STIG ID and as field in header
STIGREF | stigRef | Full Title   <title> :: Version <version>, <release_info> |   | profiles.controls.tags.stig_ref | Appears at the top   of the header area
SECURITY_OVERRIDE_GUIDANCE | securityOverrideGuidance |   |   | profiles.controls.tags.security_override_guidance |  
SEVERITY | severity | low \| medium \|   high | yes (as   individuals) | profiles.controls.impact   through transformer | Corresponds with   CAT III \| CAT II \| CAT I
THIRD_PARTY_TOOLS | thirdPartyTools | Typically empty |   |   | When this has a   value it is displayed under MISC Data
VULN_DISCUSS | vulnDiscuss | Discussion |   | profiles.controls.desc | Appears as   Discussion
VULN_NUM | vulnNum | Vul ID | yes | profiles.controls.tags.gid   && profiles.controls.id | Appears as Vul ID
WEIGHT | weight | Unknown but   typically always 10.0 |   | profiles.controls.tags.weight |  
TARGETKEY | targetKey | Defined as   "Asset Posture" under Vuln.class in STIG Viewer and typically a   four digit number |   |   | Each STIG appears   to have their own as each Vuln is the same under the same iSTIG object - not   displayed
STIG_UUID | stigUuid |   |   |   |  
LEGACY_ID | legacyId | Legacy Group ID   THEN Rule ID | yes | profiles.controls.tags.legacy_id | Is displayed as   Legacy IDs: in header
STATUS | status | Not Reviewed \|   Open \| Not a Finding \| Not Applicable | yes (as   individuals) | profiles.controls.results.status   through transformer AND profiles.controls.impact through transformer | Displayed as   dropdown at top
FINDING_DETAILS | findingDetails | Findings |   | profiles.controle.results.code_desc  &&   profiles.controls.results.message through transformer | Displayed as   Finding Details full text area and uses setCHK_Notes as updater
COMMENTS | comments | Comments |   | profiles.controls.descriptions   as comments | Displayed as   Comments full text area and uses setCheckComment as updater
SEVERITY_OVERRIDE | severityOverride | ''\| low \| medium \|   high |   | profiles.controls.impact   through transformer | Does not have a   good display that the original severity was changed
SEVERITY_JUSTIFICATION | severityJustification | Reason for   changing severity |   | profiles.controls.tags.severity_justification | Is not displayed   anywhere
