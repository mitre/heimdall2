export interface CCI_Item {
  def: string;
  nist: string[];
}
export const CCI_DESCRIPTIONS: {[tag: string]: CCI_Item} = {
  'CCI-001545': {
    def: 'The organization defines a frequency for reviewing and updating the access control policy.',
    nist: ['AC-1 a', 'AC-1.2 (i)', 'AC-1 b 1']
  },
  'CCI-001546': {
    def: 'The organization defines a frequency for reviewing and updating the access control procedures.',
    nist: ['AC-1 b', 'AC-1.2 (iii)', 'AC-1 b 2']
  },
  'CCI-000001': {
    def: 'The organization develops an access control policy that addresses purpose, scope, roles, responsibilities, management commitment, coordination among organizational entities, and compliance.',
    nist: ['AC-1 a', 'AC-1.1 (i and ii)', 'AC-1 a 1']
  },
  'CCI-000004': {
    def: 'The organization develops procedures to facilitate the implementation of the access control policy and associated access controls.',
    nist: ['AC-1 b', 'AC-1.1 (iv  and  v)', 'AC-1 a 2']
  },
  'CCI-000002': {
    def: 'The organization disseminates the access control policy to organization-defined personnel or roles.',
    nist: ['AC-1 a', 'AC-1.1 (iii)', 'AC-1 a 1']
  },
  'CCI-000003': {
    def: 'The organization reviews and updates the access control policy in accordance with organization-defined frequency.',
    nist: ['AC-1 a', 'AC-1.2 (ii)', 'AC-1 b 1']
  },
  'CCI-000005': {
    def: 'The organization disseminates the procedures to facilitate access control policy and associated access controls to the organization-defined personnel or roles.',
    nist: ['AC-1 b', 'AC-1.1 (vi)', 'AC-1 a 2']
  },
  'CCI-000006': {
    def: 'The organization reviews and updates the access control procedures in accordance with organization-defined frequency.',
    nist: ['AC-1 b', 'AC-1.2 (iv)', 'AC-1 b 2']
  },
  'CCI-001547': {
    def: 'The organization defines the frequency on which it will review information system accounts for compliance with account management requirements.',
    nist: ['AC-2 j', 'AC-2.1 (i)', 'AC-2 j']
  },
  'CCI-000007': {
    def: 'The organization manages information system accounts by identifying account types (i.e., individual, group, system, application, guest/anonymous, and temporary).',
    nist: ['AC-2 a', 'AC-2.1 (i)']
  },
  'CCI-000008': {
    def: 'The organization establishes conditions for group membership.',
    nist: ['AC-2 b', 'AC-2.1 (i)', 'AC-2 c']
  },
  'CCI-000009': {
    def: 'The organization manages information system accounts by identifying authorized users of the information system and specifying access privileges.',
    nist: ['AC-2 c', 'AC-2.1 (i)']
  },
  'CCI-000010': {
    def: 'The organization requires approvals by organization-defined personnel or roles for requests to create information system accounts.',
    nist: ['AC-2 d', 'AC-2.1 (i)', 'AC-2 e']
  },
  'CCI-000011': {
    def: 'The organization creates, enables, modifies, disables, and removes information system accounts in accordance with organization-defined procedures or conditions.',
    nist: ['AC-2 e', 'AC-2.1 (i)', 'AC-2 f']
  },
  'CCI-000012': {
    def: 'The organization reviews information system accounts for compliance with account management requirements per organization-defined frequency.',
    nist: ['AC-2 j', 'AC-2.1 (i)', 'AC-2 j']
  },
  'CCI-000013': {
    def: 'The organization manages information system accounts by notifying account managers when temporary accounts are no longer required and when information system users are terminated, transferred, or information system usage or need-to-know/need-to-share changes.',
    nist: ['AC-2 g', 'AC-2.1 (i)']
  },
  'CCI-000014': {
    def: 'The organization manages information system accounts by granting access to the system based on a valid access authorization; intended system usage; and other attributes as required by the organization or associated missions/business functions.',
    nist: ['AC-2 i', 'AC-2.1 (i)']
  },
  'CCI-000015': {
    def: 'The organization employs automated mechanisms to support the information system account management functions.',
    nist: ['AC-2 (1)', 'AC-2 (1).1', 'AC-2 (1)']
  },
  'CCI-000016': {
    def: 'The information system automatically removes or disables temporary accounts after an organization-defined time period for each type of account.',
    nist: ['AC-2 (2)', 'AC-2 (2).1 (ii)', 'AC-2 (2)']
  },
  'CCI-000017': {
    def: 'The information system automatically disables inactive accounts after an organization-defined time period.',
    nist: ['AC-2 (3)', 'AC-2 (3).1 (ii)', 'AC-2 (3)']
  },
  'CCI-000018': {
    def: 'The information system automatically audits account creation actions.',
    nist: ['AC-2 (4)', 'AC-2 (4).1 (i and ii)', 'AC-2 (4)']
  },
  'CCI-000019': {
    def: 'The organization requires that users log out in accordance with the organization-defined time period of inactivity or description of when to log out.',
    nist: ['AC-2 (5) (a)', 'AC-2 (5).1 (ii)', 'AC-2 (5)']
  },
  'CCI-000020': {
    def: 'The information system dynamically manages user privileges and associated access authorizations.',
    nist: ['AC-2 (6)', 'AC-2 (6).1']
  },
  'CCI-000237': {
    def: 'The organization manages information system accounts by specifically authorizing and monitoring the use of guest/anonymous accounts and temporary accounts.',
    nist: ['AC-2 f', 'AC-2.1 (i)']
  },
  'CCI-000208': {
    def: 'The organization determines normal time-of-day and duration usage for information system accounts.',
    nist: ['AC-2 (5) (b)', 'AC-2 (5).1 (iii)']
  },
  'CCI-001361': {
    def: 'The organization defines a time period after which temporary accounts are automatically terminated.',
    nist: ['AC-2 (2)', 'AC-2 (2).1 (i)', 'AC-2 (2)']
  },
  'CCI-001365': {
    def: 'The organization defines a time period after which emergency accounts are automatically terminated.',
    nist: ['AC-2 (2)', 'AC-2 (2).1 (i)', 'AC-2 (2)']
  },
  'CCI-000217': {
    def: 'The organization defines a time period after which inactive accounts are automatically disabled.',
    nist: ['AC-2 (3)', 'AC-2 (3).1 (i)', 'AC-2 (3)']
  },
  'CCI-001403': {
    def: 'The information system automatically audits account modification actions.',
    nist: ['AC-2 (4)', 'AC-2 (4).1 (i and ii)', 'AC-2 (4)']
  },
  'CCI-001404': {
    def: 'The information system automatically audits account disabling actions.',
    nist: ['AC-2 (4)', 'AC-2 (4).1 (i and ii)', 'AC-2 (4)']
  },
  'CCI-001405': {
    def: 'The information system automatically audits account removal actions.',
    nist: ['AC-2 (4)', 'AC-2 (4).1 (i and ii)', 'AC-2 (4)']
  },
  'CCI-001406': {
    def: 'The organization defines a time period of expected inactivity when users are required to log out.',
    nist: ['AC-2 (5) (a)', 'AC-2 (5).1 (i)', 'AC-2 (5)']
  },
  'CCI-001407': {
    def: 'The organization administers privileged user accounts in accordance with a role-based access scheme that organizes allowed information system access and privileges into roles.',
    nist: ['AC-2 (7) (a)', 'AC-2 (7).1 (i)', 'AC-2 (7) (a)']
  },
  'CCI-001354': {
    def: 'The organization manages information system accounts by deactivating temporary accounts that are no longer required.',
    nist: ['AC-2 h', 'AC-2.1 (i)']
  },
  'CCI-001355': {
    def: 'The organization manages information system accounts by deactivating accounts of terminated or transferred users.',
    nist: ['AC-2 h', 'AC-2.1 (i)']
  },
  'CCI-001356': {
    def: 'The organization monitors for atypical usage of information system accounts.',
    nist: ['AC-2 (5) (c)', 'AC-2 (5).1 (iv)']
  },
  'CCI-001357': {
    def: 'The organization reports atypical usage to designated organizational officials.',
    nist: ['AC-2 (5) (d)', 'AC-2 (5).1 (v)']
  },
  'CCI-001358': {
    def: 'The organization establishes privileged user accounts in accordance with a role-based access scheme that organizes allowed information system access and privileges into roles.',
    nist: ['AC-2 (7) (a)', 'AC-2 (7).1 (i)', 'AC-2 (7) (a)']
  },
  'CCI-001359': {
    def: 'The organization tracks privileged role assignments.',
    nist: ['AC-2 (7) (b)', 'AC-2 (7).1 (ii)']
  },
  'CCI-001360': {
    def: 'The organization monitors privileged role assignments.',
    nist: ['AC-2 (7) (b)', 'AC-2 (7).1 (ii)', 'AC-2 (7) (b)']
  },
  'CCI-001682': {
    def: 'The information system automatically removes or disables emergency accounts after an organization-defined time period for each type of account.',
    nist: ['AC-2 (2)', 'AC-2 (2).1 (ii)', 'AC-2 (2)']
  },
  'CCI-001683': {
    def: 'The information system notifies organization-defined personnel or roles for account creation actions.',
    nist: ['AC-2 (4)', 'AC-2 (4).1 (i and ii)', 'AC-2 (4)']
  },
  'CCI-001684': {
    def: 'The information system notifies organization-defined personnel or roles for account modification actions.',
    nist: ['AC-2 (4)', 'AC-2 (4).1 (i and ii)', 'AC-2 (4)']
  },
  'CCI-001685': {
    def: 'The information system notifies organization-defined personnel or roles for account disabling actions.',
    nist: ['AC-2 (4)', 'AC-2 (4).1 (i and ii)', 'AC-2 (4)']
  },
  'CCI-001686': {
    def: 'The information system notifies organization-defined personnel or roles for account removal actions.',
    nist: ['AC-2 (4)', 'AC-2 (4).1 (i and ii)', 'AC-2 (4)']
  },
  'CCI-001548': {
    def: 'The organization defines the information flow control policies for controlling the flow of information within the system.',
    nist: ['AC-4', 'AC-4.1 (i)', 'AC-4']
  },
  'CCI-001549': {
    def: 'The organization defines the information flow control policies for controlling the flow of information between interconnected systems.',
    nist: ['AC-4', 'AC-4.1 (i)', 'AC-4']
  },
  'CCI-001550': {
    def: 'The organization defines approved authorizations for controlling the flow of information within the system.',
    nist: ['AC-4', 'AC-4.1 (ii)', 'AC-4']
  },
  'CCI-001551': {
    def: 'The organization defines approved authorizations for controlling the flow of information between interconnected systems.',
    nist: ['AC-4', 'AC-4.1 (ii)', 'AC-4']
  },
  'CCI-001552': {
    def: 'The organization defines policy that allows or disallows information flows based on changing conditions or operational considerations.',
    nist: ['AC-4 (3)', 'AC-4 (3).1 (i)']
  },
  'CCI-001553': {
    def: 'The organization defines the security policy filters that privileged administrators have the capability to enable/disable.',
    nist: ['AC-4 (10)', 'AC-4 (10).1 (i)', 'AC-4 (10)']
  },
  'CCI-001554': {
    def: 'The organization defines the security policy filters that privileged administrators have the capability to configure.',
    nist: ['AC-4 (11)', 'AC-4 (11).1 (i)', 'AC-4 (11)']
  },
  'CCI-001555': {
    def: 'The information system uniquely identifies destination domains for information transfer.',
    nist: ['AC-4 (17) (a)', 'AC-4 (17).1 (iii)']
  },
  'CCI-001556': {
    def: 'The information system uniquely authenticates destination domains for information transfer.',
    nist: ['AC-4 (17) (a)', 'AC-4 (17).1 (iv)']
  },
  'CCI-001557': {
    def: 'The information system tracks problems associated with the information transfer.',
    nist: ['AC-4 (17) c', 'AC-4 (17).1 (vii)']
  },
  'CCI-000025': {
    def: 'The information system enforces information flow control using explicit security attributes on information, source, and destination objects as a basis for flow control decisions.',
    nist: ['AC-4 (1)', 'AC-4 (1).1']
  },
  'CCI-000026': {
    def: 'The information system uses protected processing domains to enforce organization-defined information flow control policies as a basis for flow control decisions.',
    nist: ['AC-4 (2)', 'AC-4 (2).1', 'AC-4 (2)']
  },
  'CCI-000027': {
    def: 'The information system enforces dynamic information flow control based on organization-defined policies.',
    nist: ['AC-4 (3)', 'AC-4 (3).1 (ii)', 'AC-4 (3)']
  },
  'CCI-000028': {
    def: 'The information system prevents encrypted information from bypassing content-checking mechanisms by employing organization-defined procedures or methods.',
    nist: ['AC-4 (4)', 'AC-4 (4).1', 'AC-4 (4)']
  },
  'CCI-000029': {
    def: 'The information system enforces organization-defined limitations on the embedding of data types within other data types.',
    nist: ['AC-4 (5)', 'AC-4 (5).1 (ii)', 'AC-4 (5)']
  },
  'CCI-000030': {
    def: 'The information system enforces information flow control based on organization-defined metadata.',
    nist: ['AC-4 (6)', 'AC-4 (6).1', 'AC-4 (6)']
  },
  'CCI-000031': {
    def: 'The information system enforces organization-defined one-way flows using hardware mechanisms.',
    nist: ['AC-4 (7)', 'AC-4 (7).1 (ii)', 'AC-4 (7)']
  },
  'CCI-000032': {
    def: 'The information system enforces information flow control using organization-defined security policy filters as a basis for flow control decisions for organization-defined information flows.',
    nist: ['AC-4 (8)', 'AC-4 (8).1 (ii)', 'AC-4 (8)']
  },
  'CCI-000033': {
    def: 'The information system enforces the use of human review for organization-defined security policy filters when the system is not capable of making an information flow control decision.',
    nist: ['AC-4 (9)', 'AC-4 (9).1 (ii)']
  },
  'CCI-000034': {
    def: 'The information system provides the capability for a privileged administrator to enable/disable organization-defined security policy filters under organization-defined conditions.',
    nist: ['AC-4 (10)', 'AC-4 (1).1 (ii)', 'AC-4 (10)']
  },
  'CCI-000035': {
    def: 'The information system provides the capability for privileged administrators to configure the organization-defined security policy filters to support different security policies.',
    nist: ['AC-4 (11)', 'AC-4 (11).1 (ii)', 'AC-4 (11)']
  },
  'CCI-000218': {
    def: 'The information system, when transferring information between different security domains, identifies information flows by data type specification and usage.',
    nist: ['AC-4 (12)', 'AC-4 (12).1']
  },
  'CCI-000219': {
    def: 'The information system, when transferring information between different security domains, decomposes information into organization-defined policy-relevant subcomponents for submission to policy enforcement mechanisms.',
    nist: ['AC-4 (13)', 'AC-4 (13).1', 'AC-4 (13)']
  },
  'CCI-000221': {
    def: 'The information system enforces security policies regarding information on interconnected systems.',
    nist: ['AC-4 (16)', 'AC-4 (16).1']
  },
  'CCI-000223': {
    def: 'The information system binds security attributes to information to facilitate information flow policy enforcement.',
    nist: ['AC-4 (17) (b)', 'AC-4 (17).1 (v)']
  },
  'CCI-000224': {
    def: 'The information system tracks problems associated with the security attribute binding.',
    nist: ['AC-4 (17) (c)', 'AC-4 (17).1 (vi)']
  },
  'CCI-001414': {
    def: 'The information system enforces approved authorizations for controlling the flow of information between interconnected systems based on organization-defined information flow control policies.',
    nist: ['AC-4', 'AC-4.1 (iii)', 'AC-4']
  },
  'CCI-001415': {
    def: 'The organization defines limitations for the embedding of data types within other data types.',
    nist: ['AC-4 (5)', 'AC-4 (5).1 (i)', 'AC-4 (5)']
  },
  'CCI-001416': {
    def: 'The organization defines one-way information flows to be enforced by the information system.',
    nist: ['AC-4 (7)', 'AC-4 (7).1 (i)', 'AC-4 (7)']
  },
  'CCI-001417': {
    def: 'The organization defines security policy filters to be enforced by the information system and used as a basis for flow control decisions.',
    nist: ['AC-4 (8)', 'AC-4 (8).1 (i)', 'AC-4 (8)']
  },
  'CCI-001418': {
    def: 'The organization defines security policy filters for which the information system enforces the use of human review.',
    nist: ['AC-4 (9)', 'AC-4 (9).1 (i)']
  },
  'CCI-001368': {
    def: 'The information system enforces approved authorizations for controlling the flow of information within the system based on organization-defined information flow control policies.',
    nist: ['AC-4', 'AC-4.1 (iii)', 'AC-4']
  },
  'CCI-001371': {
    def: 'The organization defines information security policy filters requiring fully enumerated formats which are to be implemented when transferring information between different security domains.',
    nist: ['AC-4 (14)', 'AC-4 (14).1 (i)', 'AC-4 (14)']
  },
  'CCI-001372': {
    def: 'The information system, when transferring information between different security domains, implements organization-defined security policy filters requiring fully enumerated formats that restrict data structure and content.',
    nist: ['AC-4 (14)', 'AC-4 (14).1 (ii)', 'AC-4 (14)']
  },
  'CCI-001373': {
    def: 'The information system, when transferring information between different security domains, examines the information for the presence of organization-defined unsanctioned information.',
    nist: ['AC-4 (15)', 'AC-4 (15).1 (i)', 'AC-4 (15)']
  },
  'CCI-001374': {
    def: 'The information system, when transferring information between different security domains, prohibits the transfer of organization-defined unsanctioned information in accordance with the organization-defined security policy.',
    nist: ['AC-4 (15)', 'AC-4 (15).1 (ii)', 'AC-4 (15)']
  },
  'CCI-001376': {
    def: 'The information system uniquely identifies source domains for information transfer.',
    nist: ['AC-4 (17) (a)', 'AC-4 (17).1 (i)']
  },
  'CCI-001377': {
    def: 'The information system uniquely authenticates source domains for information transfer.',
    nist: ['AC-4 (17) (a)', 'AC-4 (17).1 (ii)']
  },
  'CCI-001558': {
    def: 'The organization defines the security functions (deployed in hardware, software, and firmware) for which access must be explicitly authorized.',
    nist: ['AC-6 (1)', 'AC-6 (1).1 (i)', 'AC-6 (1)']
  },
  'CCI-000038': {
    def: 'The organization explicitly authorizes access to organization-defined security functions and security-relevant information.',
    nist: ['AC-6 (1)', 'AC-6 (1).1 (ii)']
  },
  'CCI-000039': {
    def: 'The organization requires that users of information system accounts or roles, with access to organization-defined security functions or security-relevant information, use non-privileged accounts, or roles, when accessing nonsecurity functions.',
    nist: ['AC-6 (2)', 'AC-6 (2).1 (ii)', 'AC-6 (2)']
  },
  'CCI-000040': {
    def: 'The organization audits any use of privileged accounts, or roles, with access to organization-defined security functions or security-relevant information, when accessing other system functions.',
    nist: ['AC-6 (2)', 'AC-6 (2).1 (iii)']
  },
  'CCI-000041': {
    def: 'The organization authorizes network access to organization-defined privileged commands only for organization-defined compelling operational needs.',
    nist: ['AC-6 (3)', 'AC-6 (3).1 (ii)', 'AC-6 (3)']
  },
  'CCI-000042': {
    def: 'The organization documents the rationale for authorized network access to organization-defined privileged commands in the security plan for the information system.',
    nist: ['AC-6 (3)', 'AC-6 (3).1 (iii)', 'AC-6 (3)']
  },
  'CCI-000225': {
    def: 'The organization employs the concept of least privilege, allowing only authorized accesses for users (and processes acting on behalf of users) which are necessary to accomplish assigned tasks in accordance with organizational missions and business functions.',
    nist: ['AC-6', 'AC-6.1', 'AC-6']
  },
  'CCI-000226': {
    def: 'The information system provides the capability for a privileged administrator to configure organization-defined security policy filters to support different security policies.',
    nist: ['AC-6 (4)', 'AC-6 (4).1']
  },
  'CCI-001419': {
    def: 'The organization defines the security functions or security-relevant information to which users of information system accounts, or roles, have access.',
    nist: ['AC-6 (2)', 'AC-6 (2).1 (i)', 'AC-6 (2)']
  },
  'CCI-001420': {
    def: 'The organization defines the privileged commands to which network access is to be authorized only for organization-defined compelling operational needs.',
    nist: ['AC-6 (3)', 'AC-6 (3).1 (i)', 'AC-6 (3)']
  },
  'CCI-001421': {
    def: 'The organization limits authorization to super user accounts on the information system to designated system administration personnel.',
    nist: ['AC-6 (5)', 'AC-6 (5).1']
  },
  'CCI-001422': {
    def: 'The organization prohibits privileged access to the information system by non-organizational users.',
    nist: ['AC-6 (6)', 'AC-6 (6).1', 'AC-6 (6)']
  },
  'CCI-001559': {
    def: 'The organization identifies the individuals authorized to change the value of associated security attributes.',
    nist: ['AC-16 (2)', 'AC-16 (2).1 (i)', 'AC-16 (2)']
  },
  'CCI-001560': {
    def: 'The organization identifies individuals (or processes acting on behalf of individuals) authorized to associate organization-defined security attributes with organization-defined objects.',
    nist: ['AC-16 (4)', 'AC-16 (4).1 (i)', 'AC-16 (4)']
  },
  'CCI-001424': {
    def: 'The information system dynamically associates security attributes with organization-defined subjects in accordance with organization-defined security policies as information is created and combined.',
    nist: ['AC-16 (1)', 'AC-16 (1).1', 'AC-16 (1)']
  },
  'CCI-001425': {
    def: 'The information system provides authorized individuals (or processes acting on behalf of individuals) the capability to change the value of associated security attributes.',
    nist: ['AC-16 (2)', 'AC-16 (2).1 (ii)', 'AC-16 (2)']
  },
  'CCI-001426': {
    def: 'The information system maintains the binding of security attributes to information with sufficient assurance that the information--attribute association can be used as the basis for automated policy actions.',
    nist: ['AC-16 (3)', 'AC-16 (3).1']
  },
  'CCI-001427': {
    def: 'The information system allows authorized users to associate security attributes with information.',
    nist: ['AC-16 (4)', 'AC-16 (4).1 (ii)']
  },
  'CCI-001428': {
    def: 'The information system displays security attributes in human-readable form on each object that the system transmits to output devices to identify organization-identified special dissemination, handling, or distribution instructions using organization-identified human-readable, standard naming conventions.',
    nist: ['AC-16 (5)', 'AC-16 (5).1 (iii)', 'AC-16 (5)']
  },
  'CCI-001429': {
    def: 'The organization identifies special dissemination, handling, or distribution instructions for identifying security attributes on output.',
    nist: ['AC-16 (5)', 'AC-16 (5).1 (i)', 'AC-16 (5)']
  },
  'CCI-001430': {
    def: 'The organization identifies human-readable, standard naming conventions for identifying security attributes on output.',
    nist: ['AC-16 (5)', 'AC-16 (5).1 (ii)', 'AC-16 (5)']
  },
  'CCI-001396': {
    def: 'The organization defines security attributes for which the information system supports and maintains the bindings for information in storage.',
    nist: ['AC-16', 'AC-16.1 (i)']
  },
  'CCI-001397': {
    def: 'The organization defines security attributes for which the information system supports and maintains the bindings for information in process.',
    nist: ['AC-16', 'AC-16.1 (i)']
  },
  'CCI-001398': {
    def: 'The organization defines security attributes for which the information system supports and maintains the bindings for information in transmission.',
    nist: ['AC-16', 'AC-16.1 (i)']
  },
  'CCI-001399': {
    def: 'The information system supports and maintains the binding of organization-defined security attributes to information in storage.',
    nist: ['AC-16', 'AC-16.1 (ii)']
  },
  'CCI-001400': {
    def: 'The information system supports and maintains the binding of organization-defined security attributes to information in process.',
    nist: ['AC-16', 'AC-16.1 (ii)']
  },
  'CCI-001401': {
    def: 'The information system supports and maintains the binding of organization-defined security attributes to information in transmission.',
    nist: ['AC-16', 'AC-16.1 (ii)']
  },
  'CCI-001561': {
    def: 'The organization defines managed access control points for remote access to the information system.',
    nist: ['AC-17 (3)', 'AC-17 (3).1 (i)', 'AC-17 (3)']
  },
  'CCI-001562': {
    def: 'The organization defines the appropriate action(s) to be taken if an unauthorized remote connection is discovered.',
    nist: ['AC-17 (5)', 'AC-17 (5).1 (iii)']
  },
  'CCI-000063': {
    def: 'The organization defines allowed methods of remote access to the information system.',
    nist: ['AC-17 a', 'AC-17.1 (i)', 'AC-17 a']
  },
  'CCI-000064': {
    def: 'The organization establishes usage restrictions and implementation guidance for each allowed remote access method.',
    nist: ['AC-17 b', 'AC-17.1 (ii)']
  },
  'CCI-000065': {
    def: 'The organization authorizes remote access to the information system prior to allowing such connections.',
    nist: ['AC-17 d', 'AC-17.1 (iv)', 'AC-17 b']
  },
  'CCI-000066': {
    def: 'The organization enforces requirements for remote connections to the information system.',
    nist: ['AC-17 e', 'AC-17.1 (v)']
  },
  'CCI-000067': {
    def: 'The information system monitors remote access methods.',
    nist: ['AC-17 (1)', 'AC-17 (1).1', 'AC-17 (1)']
  },
  'CCI-000068': {
    def: 'The information system implements cryptographic mechanisms to protect the confidentiality of remote access sessions.',
    nist: ['AC-17 (2)', 'AC-17 (2).1', 'AC-17 (2)']
  },
  'CCI-000069': {
    def: 'The information system routes all remote accesses through an organization-defined number of managed network access control points.',
    nist: ['AC-17 (3)', 'AC-17 (3).1 (ii)', 'AC-17 (3)']
  },
  'CCI-000070': {
    def: 'The organization authorizes the execution of privileged commands via remote access only for organization-defined needs.',
    nist: ['AC-17 (4)', 'AC-17 (4).1 (i)', 'AC-17 (4) (a)']
  },
  'CCI-000071': {
    def: 'The organization monitors for unauthorized remote connections to the information system on an organization-defined frequency.',
    nist: ['AC-17 (5)', 'AC-17 (5).1 (ii)']
  },
  'CCI-000072': {
    def: 'The organization ensures that users protect information about remote access mechanisms from unauthorized use and disclosure.',
    nist: ['AC-17 (6)', 'AC-17 (6).1', 'AC-17 (6)']
  },
  'CCI-000079': {
    def: 'The organization ensures that remote sessions for accessing an organization-defined list of security functions and security-relevant information employ organization-defined additional security measures.',
    nist: ['AC-17 (7)', 'AC-17 (7).1 (iii)']
  },
  'CCI-001431': {
    def: 'The organization defines a frequency for monitoring for unauthorized remote connections to the information system.',
    nist: ['AC-17 (5)', 'AC-17 (5).1 (i)']
  },
  'CCI-001432': {
    def: 'The organization takes appropriate action if an unauthorized remote connection to the information system is discovered.',
    nist: ['AC-17 (5)', 'AC-17 (5).1 (iv)']
  },
  'CCI-001433': {
    def: 'The organization defines a list of security functions and security-relevant information that for remote access sessions have organization-defined security measures employed and are audited.',
    nist: ['AC-17 (7)', 'AC-17 (7).1 (i)']
  },
  'CCI-001434': {
    def: 'The organization defines additional security measures to be employed when an organization-defined list of security functions and security-relevant information is accessed remotely.',
    nist: ['AC-17 (7)', 'AC-17 (7).1 (ii)']
  },
  'CCI-001435': {
    def: 'The organization defines networking protocols within the information system deemed to be nonsecure.',
    nist: ['AC-17 (8)', 'AC-17 (8).1 (i)']
  },
  'CCI-001436': {
    def: 'The organization disables organization-defined networking protocols within the information system deemed to be nonsecure except for explicitly identified components in support of specific operational requirements.',
    nist: ['AC-17 (8)', 'AC-17 (8).1 (ii)']
  },
  'CCI-001437': {
    def: 'The organization documents the rationale for the execution of privileged commands and access to security-relevant information in the security plan for the information system.',
    nist: ['AC-17 (4)', 'AC-17 (4).1 (ii)']
  },
  'CCI-001453': {
    def: 'The information system implements cryptographic mechanisms to protect the integrity of remote access sessions.',
    nist: ['AC-17 (2)', 'AC-17 (2).1', 'AC-17 (2)']
  },
  'CCI-001454': {
    def: 'The organization ensures that remote sessions for accessing an organization-defined list of security functions and security-relevant information are audited.',
    nist: ['AC-17 (7)', 'AC-17 (7).1 (iv)']
  },
  'CCI-001455': {
    def: 'The organization explicitly identifies components needed in support of specific operational requirements.',
    nist: ['AC-17 (8)', 'AC-17 (8).1 (ii)']
  },
  'CCI-001402': {
    def: 'The organization monitors for unauthorized remote access to the information system.',
    nist: ['AC-17 c', 'AC-17.1 (iii)']
  },
  'CCI-001563': {
    def: 'The organization defines the appropriate action(s) to be taken if an unauthorized wireless connection is discovered.',
    nist: ['AC-18 (2)', 'AC-18 (2).1 (iii)']
  },
  'CCI-001438': {
    def: 'The organization establishes usage restrictions for wireless access.',
    nist: ['AC-18 a', 'AC-18.1 (i)', 'AC-18 a']
  },
  'CCI-001439': {
    def: 'The organization establishes implementation guidance for wireless access.',
    nist: ['AC-18 a', 'AC-18.1 (i)', 'AC-18 a']
  },
  'CCI-001440': {
    def: 'The organization monitors for unauthorized wireless access to the information system.',
    nist: ['AC-18 b', 'AC-18.1 (ii)']
  },
  'CCI-001441': {
    def: 'The organization authorizes wireless access to the information system prior to allowing such connections.',
    nist: ['AC-18 c', 'AC-18.1 (iii)', 'AC-18 b']
  },
  'CCI-001442': {
    def: 'The organization enforces requirements for wireless connections to the information system.',
    nist: ['AC-18 d', 'AC-18.1 (iv)']
  },
  'CCI-001443': {
    def: 'The information system protects wireless access to the system using authentication of users and/or devices.',
    nist: ['AC-18 (1)', 'AC-18 (1).1', 'AC-18 (1)']
  },
  'CCI-001444': {
    def: 'The information system protects wireless access to the system using encryption.',
    nist: ['AC-18 (1)', 'AC-18 (1).1', 'AC-18 (1)']
  },
  'CCI-001445': {
    def: 'The organization monitors for unauthorized wireless connections to the information system on an organization-defined frequency.',
    nist: ['AC-18 (2)', 'AC-18 (2).1 (ii)']
  },
  'CCI-001446': {
    def: 'The organization scans for unauthorized wireless access points on an organization-defined frequency.',
    nist: ['AC-18 (2)', 'AC-18 (2).1 (ii)']
  },
  'CCI-001447': {
    def: 'The organization defines a frequency of monitoring for unauthorized wireless connections to information system, including scans for unauthorized wireless access points.',
    nist: ['AC-18 (2)', 'AC-18 (2).1 (i)']
  },
  'CCI-001448': {
    def: 'The organization takes appropriate action if an unauthorized wireless connection is discovered.',
    nist: ['AC-18 (2)', 'AC-18 (2).1 (iv)']
  },
  'CCI-001449': {
    def: 'The organization disables, when not intended for use, wireless networking capabilities internally embedded within information system components prior to issuance and deployment.',
    nist: ['AC-18 (3)', 'AC-18 (3).1', 'AC-18 (3)']
  },
  'CCI-001450': {
    def: 'The organization does not allow users to independently configure wireless networking capabilities.',
    nist: ['AC-18 (4)', 'AC-18 (4).1']
  },
  'CCI-001451': {
    def: 'The organization selects radio antennas and calibrates transmission power levels to reduce the probability that usable signals can be received outside of organization-controlled boundaries.',
    nist: ['AC-18 (5)', 'AC-18 (5).1', 'AC-18 (5)']
  },
  'CCI-001564': {
    def: 'The organization defines the frequency of security awareness and training policy reviews and updates.',
    nist: ['AT-1 a', 'AT-1.2 (i)', 'AT-1 b 1']
  },
  'CCI-001565': {
    def: 'The organization defines the frequency of security awareness and training procedure reviews and updates.',
    nist: ['AT-1 b', 'AT-1.2 (iii)', 'AT-1 b 2']
  },
  'CCI-000100': {
    def: 'The organization develops and documents a security awareness and training policy that addresses purpose, scope, roles, responsibilities, management commitment, coordination among organizational entities, and compliance.',
    nist: ['AT-1 a', 'AT-1.1 (i and ii)', 'AT-1 a 1']
  },
  'CCI-000101': {
    def: 'The organization disseminates a security awareness and training policy to organization-defined personnel or roles.',
    nist: ['AT-1 a', 'AT-1.1 (iii)', 'AT-1 a 1']
  },
  'CCI-000102': {
    def: 'The organization reviews and updates the current security awareness and training policy in accordance with organization-defined frequency.',
    nist: ['AT-1 a', 'AT-1.2 (ii)', 'AT-1 b 1']
  },
  'CCI-000103': {
    def: 'The organization develops and documents procedures to facilitate the implementation of the security awareness and training policy and associated security awareness and training controls.',
    nist: ['AT-1 b', 'AT-1.1 (iv and v)', 'AT-1 a 2']
  },
  'CCI-000104': {
    def: 'The organization disseminates security awareness and training procedures to organization-defined personnel or roles.',
    nist: ['AT-1 b', 'AT-1.1 (vi)', 'AT-1 a 2']
  },
  'CCI-000105': {
    def: 'The organization reviews and updates the current security awareness and training procedures in accordance with an organization-defined frequency.',
    nist: ['AT-1 b', 'AT-1.2 (iii)', 'AT-1 b 2']
  },
  'CCI-001566': {
    def: 'The organization provides organization-defined personnel or roles with initial training in the employment and operation of physical security controls.',
    nist: ['AT-3 (2)', 'AT-3 (2).1 (i)', 'AT-3 (2)']
  },
  'CCI-001567': {
    def: 'The organization provides organization-defined personnel or roles with refresher training in the employment and operation of physical security controls in accordance with the organization-defined frequency.',
    nist: ['AT-3 (2)', 'AT-3 (2).1 (iii)', 'AT-3 (2)']
  },
  'CCI-001568': {
    def: 'The organization defines a frequency for providing employees with refresher training in the employment and operation of physical security controls.',
    nist: ['AT-3 (2)', 'AT-3 (2).1 (ii)', 'AT-3 (2)']
  },
  'CCI-000108': {
    def: 'The organization provides role-based security training to personnel with assigned security roles and responsibilities before authorizing access to the information system or performing assigned duties.',
    nist: ['AT-3', 'AT-3.1 (i)', 'AT-3 a']
  },
  'CCI-000109': {
    def: 'The organization provides role-based security training to personnel with assigned security roles and responsibilities when required by information system changes.',
    nist: ['AT-3', 'AT-3.1 (i)', 'AT-3 b']
  },
  'CCI-000110': {
    def: 'The organization provides refresher role-based security training to personnel with assigned security roles and responsibilities in accordance with organization-defined frequency.',
    nist: ['AT-3', 'AT-3.1 (iii)', 'AT-3 c']
  },
  'CCI-000111': {
    def: 'The organization defines a frequency for providing refresher role-based security training.',
    nist: ['AT-3', 'AT-3.1 (ii)', 'AT-3 c']
  },
  'CCI-001481': {
    def: 'The organization provides organization-defined personnel or roles with initial training in the employment and operation of environmental controls.',
    nist: ['AT-3 (1)', 'AT-3 (1).1 (i)', 'AT-3 (1)']
  },
  'CCI-001482': {
    def: 'The organization provides organization-defined personnel or roles with refresher training in the employment and operation of environmental controls in accordance with the organization-defined frequency.',
    nist: ['AT-3 (1)', 'AT-3 (1).1 (iii)', 'AT-3 (1)']
  },
  'CCI-001483': {
    def: 'The organization defines a frequency for providing employees with refresher training in the employment and operation of environmental controls.',
    nist: ['AT-3 (1)', 'AT-3 (1).1 (ii)', 'AT-3 (1)']
  },
  'CCI-001569': {
    def: 'The organization defines the frequency on which it will review and update the audit and accountability policy.',
    nist: ['AU-1 a', 'AU-1.2 (i)', 'AU-1 b 1']
  },
  'CCI-001570': {
    def: 'The organization defines the frequency on which it will review and update the audit and accountability procedures.',
    nist: ['AU-1 b', 'AU-1.2 (iii)', 'AU-1 b 2']
  },
  'CCI-000117': {
    def: 'The organization develops and documents an audit and accountability policy that addresses purpose, scope, roles, responsibilities, management commitment, coordination among organizational entities, and compliance.',
    nist: ['AU-1 a', 'AU-1.1 (I  and  ii)', 'AU-1 a 1']
  },
  'CCI-000118': {
    def: 'The organization disseminates a formal, documented, audit and accountability policy to elements within the organization having associated audit and accountability roles and responsibilities.',
    nist: ['AU-1 a', 'AU-1.1 (iii)']
  },
  'CCI-000119': {
    def: 'The organization reviews and updates the audit and accountability policy on an organization-defined frequency.',
    nist: ['AU-1 a', 'AU-1.2 (ii)', 'AU-1 b 1']
  },
  'CCI-000120': {
    def: 'The organization develops and documents procedures to facilitate the implementation of the audit and accountability policy and associated audit and accountability controls.',
    nist: ['AU-1 b', 'AU-1.1 (iv and v)', 'AU-1 a 2']
  },
  'CCI-000121': {
    def: 'The organization disseminates formal, documented, procedures to elements within the organization having associated audit and accountability roles and responsibilities.',
    nist: ['AU-1 b', 'AU-1.1 (vi)']
  },
  'CCI-000122': {
    def: 'The organization reviews and updates the audit and accountability procedures on an organization-defined frequency.',
    nist: ['AU-1 b', 'AU-1.2 (iv)', 'AU-1 b 2']
  },
  'CCI-001571': {
    def: 'The organization defines the information system auditable events.',
    nist: ['AU-2 a', 'AU-2.1 (i)', 'AU-2 a']
  },
  'CCI-000123': {
    def: 'The organization determines the information system must be capable of auditing an organization-defined list of auditable events.',
    nist: ['AU-2 a', 'AU-2.1 (ii)', 'AU-2 a']
  },
  'CCI-000124': {
    def: 'The organization coordinates the security audit function with other organizational entities requiring audit-related information to enhance mutual support and to help guide the selection of auditable events.',
    nist: ['AU-2 b', 'AU-2.1 (iii)', 'AU-2 b']
  },
  'CCI-000125': {
    def: 'The organization provides a rationale for why the list of auditable events is deemed to be adequate to support after-the-fact investigations of security incidents.',
    nist: ['AU-2 c', 'AU-2.1 (iv)', 'AU-2 c']
  },
  'CCI-000126': {
    def: 'The organization determines that the organization-defined subset of the auditable events defined in AU-2 are to be audited within the information system.',
    nist: ['AU-2 d', 'AU-2.1 (v)', 'AU-2 d']
  },
  'CCI-000127': {
    def: 'The organization reviews and updates the list of organization-defined audited events on an organization-defined frequency.',
    nist: ['AU-2 (3)', 'AU-2 (3).1 (ii)', 'AU-2 (3)']
  },
  'CCI-000128': {
    def: 'The organization includes execution of privileged functions in the list of events to be audited by the information system.',
    nist: ['AU-2 (4)', 'AU-2 (4).1']
  },
  'CCI-000129': {
    def: 'The organization defines in the auditable events that the information system must be capable of auditing based on a risk assessment and mission/business needs.',
    nist: ['AU-2 a', 'AU-2.1 (ii)']
  },
  'CCI-001484': {
    def: 'The organization defines frequency of (or situation requiring) auditing for each identified event.',
    nist: ['AU-2 d', 'AU-2.1 (v)', 'AU-2 d']
  },
  'CCI-001485': {
    def: 'The organization defines the events which are to be audited on the information system on an organization-defined frequency of (or situation requiring) auditing for each identified event.',
    nist: ['AU-2 d', 'AU-2.1 (vi)', 'AU-2 d']
  },
  'CCI-001486': {
    def: 'The organization defines a frequency for reviewing and updating the list of organization-defined auditable events.',
    nist: ['AU-2 (3)', 'AU-2 (3).1 (i)', 'AU-2 (3)']
  },
  'CCI-001572': {
    def: 'The organization defines the personnel or roles to be alerted in the event of an audit processing failure.',
    nist: ['AU-5 a', 'AU-5.1 (i)', 'AU-5 a']
  },
  'CCI-001573': {
    def: 'The organization defines whether to reject or delay network traffic that exceeds organization-defined thresholds.',
    nist: ['AU-5 (3)', 'AU-5 (3).1 (ii)', 'AU-5 (3)']
  },
  'CCI-001574': {
    def: 'The information system rejects or delays, as defined by the organization, network traffic which exceed the organization-defined thresholds.',
    nist: ['AU-5 (3)', 'AU-5 (3).1 (iii)']
  },
  'CCI-000139': {
    def: 'The information system alerts designated organization-defined personnel or roles in the event of an audit processing failure.',
    nist: ['AU-5 a', 'AU-5.1 (ii)', 'AU-5 a']
  },
  'CCI-000140': {
    def: 'The information system takes organization-defined actions upon audit failure (e.g., shut down information system, overwrite oldest audit records, stop generating audit records).',
    nist: ['AU-5 b', 'AU-5.1 (iv)', 'AU-5 b']
  },
  'CCI-000143': {
    def: 'The information system provides a warning when allocated audit record storage volume reaches an organization-defined percentage of maximum audit record storage capacity.',
    nist: ['AU-5 (1)', 'AU-5 (1).1 (ii)']
  },
  'CCI-000144': {
    def: 'The information system provides a real-time alert when organization-defined audit failure events occur.',
    nist: ['AU-5 (2)', 'AU-5 (2).1 (ii)']
  },
  'CCI-000145': {
    def: 'The information system enforces configurable network communications traffic volume thresholds reflecting limits on auditing capacity by delaying or rejecting network traffic which exceeds the organization-defined thresholds.',
    nist: ['AU-5 (3)', 'AU-5 (3).1 (i)', 'AU-5 (3)']
  },
  'CCI-000146': {
    def: 'The organization defines the percentage of maximum audit record storage capacity that when exceeded, a warning is provided.',
    nist: ['AU-5 (1)', 'AU-5 (1).1 (i)']
  },
  'CCI-000147': {
    def: 'The organization defines the audit failure events requiring real-time alerts.',
    nist: ['AU-5 (2)', 'AU-5 (2).1 (i)', 'AU-5 (2)']
  },
  'CCI-001343': {
    def: 'The information system invokes a system shutdown in the event of an audit failure, unless an alternative audit capability exists.',
    nist: ['AU-5 (4)', 'AU-5 (4).1']
  },
  'CCI-001490': {
    def: 'The organization defines actions to be taken by the information system upon audit failure (e.g., shut down information system, overwrite oldest audit records, stop generating audit records).',
    nist: ['AU-5 b', 'AU-5.1 (iii)', 'AU-5 b']
  },
  'CCI-001575': {
    def: 'The organization defines the system or system component for storing audit records that is a different system or system component than the system or component being audited.',
    nist: ['AU-9 (2)', 'AU-9 (2).1 (i)', 'AU-9 (2)']
  },
  'CCI-000162': {
    def: 'The information system protects audit information from unauthorized access.',
    nist: ['AU-9', 'AU-9.1', 'AU-9']
  },
  'CCI-000163': {
    def: 'The information system protects audit information from unauthorized modification.',
    nist: ['AU-9', 'AU-9.1', 'AU-9']
  },
  'CCI-000164': {
    def: 'The information system protects audit information from unauthorized deletion.',
    nist: ['AU-9', 'AU-9.1', 'AU-9']
  },
  'CCI-000165': {
    def: 'The information system writes audit records to hardware-enforced, write-once media.',
    nist: ['AU-9 (1)', 'AU-9 (1).1', 'AU-9 (1)']
  },
  'CCI-001348': {
    def: 'The information system backs up audit records on an organization-defined frequency onto a different system or system component than the system or component being audited.',
    nist: ['AU-9 (2)', 'AU-9 (2).1 (iii)', 'AU-9 (2)']
  },
  'CCI-001349': {
    def: 'The organization defines a frequency for backing up system audit records onto a different system or system component than the system or component being audited.',
    nist: ['AU-9 (2)', 'AU-9 (2).1 (ii)', 'AU-9 (2)']
  },
  'CCI-001350': {
    def: 'The information system implements cryptographic mechanisms to protect the integrity of audit information.',
    nist: ['AU-9 (3)', 'AU-9 (3).1', 'AU-9 (3)']
  },
  'CCI-001351': {
    def: 'The organization authorizes access to management of audit functionality to only an organization-defined subset of privileged users.',
    nist: ['AU-9 (4) (a)', 'AU-9 (4).1 (i)', 'AU-9 (4)']
  },
  'CCI-001352': {
    def: 'The organization protects the audit records of non-local accesses to privileged accounts and the execution of privileged functions.',
    nist: ['AU-9 (4) (b)', 'AU-9 (4).1 (ii)']
  },
  'CCI-001493': {
    def: 'The information system protects audit tools from unauthorized access.',
    nist: ['AU-9', 'AU-9.1', 'AU-9']
  },
  'CCI-001494': {
    def: 'The information system protects audit tools from unauthorized modification.',
    nist: ['AU-9', 'AU-9.1', 'AU-9']
  },
  'CCI-001495': {
    def: 'The information system protects audit tools from unauthorized deletion.',
    nist: ['AU-9', 'AU-9.1', 'AU-9']
  },
  'CCI-001496': {
    def: 'The information system implements cryptographic mechanisms to protect the integrity of audit tools.',
    nist: ['AU-9 (3)', 'AU-9 (3).1', 'AU-9 (3)']
  },
  'CCI-001576': {
    def: 'The information system produces a system-wide (logical or physical) audit trail of information system audit records.',
    nist: ['AU-12 (1)', 'AU-12 (1).1 (i)', 'AU-12 (1)']
  },
  'CCI-001577': {
    def: 'The organization defines the information system components from which audit records are to be compiled into the system-wide audit trail.',
    nist: ['AU-12 (1)', 'AU-12 (1).1 (ii)', 'AU-12 (1)']
  },
  'CCI-000169': {
    def: 'The information system provides audit record generation capability for the auditable events defined in AU-2 a. at organization-defined information system components.',
    nist: ['AU-12 a', 'AU-12.1 (ii)', 'AU-12 a']
  },
  'CCI-000171': {
    def: 'The information system allows organization-defined personnel or roles to select which auditable events are to be audited by specific components of the information system.',
    nist: ['AU-12 b', 'AU-12.1 (iii)', 'AU-12 b']
  },
  'CCI-000172': {
    def: 'The information system generates audit records for the events defined in AU-2 d. with the content defined in AU-3.',
    nist: ['AU-12 c', 'AU-12.1 (iv)', 'AU-12 c']
  },
  'CCI-000173': {
    def: 'The organization defines the level of tolerance for relationship between time stamps of individual records in the audit trail that will be used for correlation.',
    nist: ['AU-12 (1)', 'AU-12 (1).1 (iv)', 'AU-12 (1)']
  },
  'CCI-000174': {
    def: 'The information system compiles audit records from organization-defined information system components into a system-wide (logical or physical) audit trail that is time-correlated to within an organization-defined level of tolerance for relationship between time stamps of individual records in the audit trail.',
    nist: ['AU-12 (1)', 'AU-12 (1).1 (iii and v)', 'AU-12 (1)']
  },
  'CCI-001459': {
    def: 'The organization defines information system components that provide audit record generation capability.',
    nist: ['AU-12 a', 'AU-12.1 (i)', 'AU-12 a']
  },
  'CCI-001353': {
    def: 'The information system produces a system-wide (logical or physical) audit trail composed of audit records in a standardized format.',
    nist: ['AU-12 (2)', 'AU-12 (2).1', 'AU-12 (2)']
  },
  'CCI-001578': {
    def: 'The organization defines the frequency to review and update the current security assessment and authorization procedures.',
    nist: ['CA-1 b', 'CA-1.2 (iii)', 'CA-1 b 2']
  },
  'CCI-000238': {
    def: 'The organization defines the frequency to review and update the current security assessment and authorization policy.',
    nist: ['CA-1', 'CA-1.2 (i)', 'CA-1 b 1']
  },
  'CCI-000239': {
    def: 'The organization develops and documents a security assessment and authorization policy that addresses purpose, scope, roles, responsibilities, management commitment, coordination among organizational entities, and compliance.',
    nist: ['CA-1 a', 'CA-1.1 (i and ii)', 'CA-1 a 1']
  },
  'CCI-000240': {
    def: 'The organization disseminates to organization-defined personnel or roles a security assessment and authorization policy.',
    nist: ['CA-1 a', 'CA-1.1 (iii)', 'CA-1 a 1', 'CA-1 a 1']
  },
  'CCI-000241': {
    def: 'The organization reviews and updates the current security assessment and authorization policy in accordance with organization-defined frequency.',
    nist: ['CA-1 a', 'CA-1.2 (ii)', 'CA-1 b 1']
  },
  'CCI-000242': {
    def: 'The organization develops and documents procedures to facilitate the implementation of the security assessment and authorization policy and associated security assessment and authorization controls.',
    nist: ['CA-1 b', 'CA-1.1 (iv and v)', 'CA-1 a 2']
  },
  'CCI-000243': {
    def: 'The organization disseminates to organization-defined personnel or roles procedures to facilitate the implementation of the security assessment and authorization policy and associated security assessment and authorization controls.',
    nist: ['CA-1 b', 'CA-1.1 (vi)', 'CA-1 a 2']
  },
  'CCI-000244': {
    def: 'The organization reviews and updates the current security assessment and authorization procedures in accordance with organization-defined frequency.',
    nist: ['CA-1 b', 'CA-1.2 (iv)', 'CA-1 b 2']
  },
  'CCI-001579': {
    def: 'The organization conducts security control assessments using organization-defined forms of testing in accordance with organization-defined frequency and assessment techniques.',
    nist: ['CA-2 (2)', 'CA-2 (2).1 (ii)']
  },
  'CCI-000245': {
    def: 'The organization develops a security assessment plan for the information system and its environment of operation.',
    nist: ['CA-2 a', 'CA-2.1 (i)', 'CA-2 a']
  },
  'CCI-000246': {
    def: "The organization's security assessment plan describes the security controls and control enhancements under assessment.",
    nist: ['CA-2 a', 'CA-2.1 (ii)', 'CA-2 a 1']
  },
  'CCI-000247': {
    def: "The organization's security assessment plan describes assessment procedures to be used to determine security control effectiveness.",
    nist: ['CA-2 a', 'CA-2.1 (ii)', 'CA-2 a 2']
  },
  'CCI-000248': {
    def: "The organization's security assessment plan describes assessment environment.",
    nist: ['CA-2 a', 'CA-2.1 (ii)', 'CA-2 a 3']
  },
  'CCI-000249': {
    def: 'The organizations security assessment plan describes the assessment team.',
    nist: ['CA-2 a', 'CA-2.1 (ii)']
  },
  'CCI-000250': {
    def: "The organization's security assessment plan describes assessment roles and responsibilities.",
    nist: ['CA-2 a', 'CA-2.1 (ii)']
  },
  'CCI-000251': {
    def: 'The organization assesses, on an organization-defined frequency, the security controls in the information system and its environment of operation to determine the extent to which the controls are implemented correctly, operating as intended, and producing the desired outcome with respect to meeting the security requirements.',
    nist: ['CA-2 b', 'CA-2.2 (ii)', 'CA-2 b']
  },
  'CCI-000252': {
    def: 'The organization defines the frequency on which the security controls in the information system and its environment of operation are assessed.',
    nist: ['CA-2 b', 'CA-2.2 (i)', 'CA-2 b']
  },
  'CCI-000253': {
    def: 'The organization produces a security assessment report that documents the results of the assessment against the information system and its environment of operation.',
    nist: ['CA-2 c', 'CA-2.2 (iii)', 'CA-2 c']
  },
  'CCI-000254': {
    def: 'The organization provides the results of the security control assessment against the information system and its environment of operation to organization-defined individuals or roles.',
    nist: ['CA-2 d', 'CA-2.2 (iv)', 'CA-2 d']
  },
  'CCI-000255': {
    def: 'The organization employs assessors or assessment teams with an organization-defined level of independence to conduct security control assessments of organizational information systems.',
    nist: ['CA-2 (1)', 'CA-2 (1).1', 'CA-2 (1)']
  },
  'CCI-000256': {
    def: 'The organization includes, as part of security control assessments announced or unannounced, one or more of the following: in-depth monitoring; vulnerability scanning; malicious user testing; insider threat assessment; performance/load testing; and organization-defined other forms of security assessment on an organization-defined frequency.',
    nist: ['CA-2 (2)', 'CA-2 (2).1 (i)', 'CA-2 (2)']
  },
  'CCI-001580': {
    def: 'The organization identifies connections to external information systems (i.e., information systems outside of the authorization boundary).',
    nist: ['CA-3 b', 'CA-3.1 (i)']
  },
  'CCI-000257': {
    def: 'The organization authorizes connections from the information system to other information systems through the use of Interconnection Security Agreements.',
    nist: ['CA-3 a', 'CA-3.1 (ii)', 'CA-3 a']
  },
  'CCI-000258': {
    def: 'The organization documents, for each interconnection, the interface characteristics.',
    nist: ['CA-3 b', 'CA-3.1 (iii)', 'CA-3 b']
  },
  'CCI-000259': {
    def: 'The organization documents, for each interconnection, the security requirements.',
    nist: ['CA-3 b', 'CA-3.1 (iii)', 'CA-3 b']
  },
  'CCI-000260': {
    def: 'The organization documents, for each interconnection, the nature of the information communicated.',
    nist: ['CA-3 b', 'CA-3.1 (iii)', 'CA-3 b']
  },
  'CCI-000261': {
    def: 'The organization monitors the information system connections on an ongoing basis to verify enforcement of security requirements.',
    nist: ['CA-3 c', 'CA-3.1 (iv)']
  },
  'CCI-000262': {
    def: 'The organization prohibits the direct connection of an organization-defined unclassified, national security system to an external network without the use of an organization-defined boundary protection device.',
    nist: ['CA-3 (1)', 'CA-3 (1).1', 'CA-3 (1)']
  },
  'CCI-000263': {
    def: 'The organization prohibits the direct connection of a classified, national security system to an external network without the use of organization-defined boundary protection device.',
    nist: ['CA-3 (2)', 'CA-3 (2).1', 'CA-3 (2)']
  },
  'CCI-001581': {
    def: 'The organization defines personnel or roles to whom the security status of the organization and the information system should be reported.',
    nist: ['CA-7 a', 'CA-7.1 (iii)', 'CA-7 g']
  },
  'CCI-001582': {
    def: 'The organization defines other forms of security assessments other than in-depth monitoring; vulnerability scanning; malicious user testing; insider threat assessment; and performance/load testing that should be included as part of security control assessments.',
    nist: ['CA-7 (2)', 'CA-7 (2).1 (i)', 'CA-2 (2)']
  },
  'CCI-001583': {
    def: 'The organization selects announced or unannounced assessments for each form of security control assessment.',
    nist: ['CA-7 (2)', 'CA-7 (2).1 (i)', 'CA-2 (2)']
  },
  'CCI-000274': {
    def: 'The organization develops a continuous monitoring strategy.',
    nist: ['CA-7', 'CA-7.1 (i)', 'CA-7']
  },
  'CCI-000275': {
    def: 'The organization implements a continuous monitoring program that includes a configuration management process for the information system.',
    nist: ['CA-7 a', 'CA-7.1 (iv)']
  },
  'CCI-000276': {
    def: 'The organization implements a continuous monitoring program that includes a configuration management process for the information system constituent components.',
    nist: ['CA-7 a', 'CA-7.1 (iv)']
  },
  'CCI-000277': {
    def: 'The organization implements a continuous monitoring program that includes a determination of the security impact of changes to the information system.',
    nist: ['CA-7 b', 'CA-7.1 (iv)']
  },
  'CCI-000278': {
    def: 'The organization implements a continuous monitoring program that includes a determination of the security impact of changes to the environment of operation.',
    nist: ['CA-7 b', 'CA-7.1 (iv)']
  },
  'CCI-000279': {
    def: 'The organization implements a continuous monitoring program that includes ongoing security control assessments in accordance with the organizational continuous monitoring strategy.',
    nist: ['CA-7 c', 'CA-7.1 (iv)', 'CA-7 c']
  },
  'CCI-000280': {
    def: 'The organization implements a continuous monitoring program that includes reporting the security status of the organization and the information system to organization-defined personnel or roles on an organization-defined frequency.',
    nist: ['CA-7 d', 'CA-7.1 (iv)', 'CA-7 g']
  },
  'CCI-000281': {
    def: 'The organization defines the frequency with which to report the security status of the organization and the information system to organization-defined personnel or roles.',
    nist: ['CA-7 d', 'CA-7.1 (ii)', 'CA-7 g']
  },
  'CCI-000282': {
    def: 'The organization employs assessors or assessment teams with an organization-defined level of independence to monitor the security controls in the information system on an ongoing basis.',
    nist: ['CA-7 (1)', 'CA-7 (1).1', 'CA-7 (1)']
  },
  'CCI-000283': {
    def: 'The organization plans announced or unannounced assessments (in-depth monitoring, malicious user testing, penetration testing, red team exercises, or other organization-defined forms of security assessment), on an organization-defined frequency, to ensure compliance with all vulnerability mitigation procedures.',
    nist: ['CA-7 (2)', 'CA-7 (2).1 (ii)']
  },
  'CCI-000284': {
    def: 'The organization schedules announced or unannounced assessments (in-depth monitoring, malicious user testing, penetration testing, red team exercises, or other organization-defined forms of security assessment), on an organization-defined frequency, to ensure compliance with all vulnerability mitigation procedures.',
    nist: ['CA-7 (2)', 'CA-7 (2).1 (ii)']
  },
  'CCI-000285': {
    def: 'The organization conducts announced or unannounced assessments (in-depth monitoring, malicious user testing, penetration testing, red team exercises, or other organization-defined forms of security assessment), on an organization-defined frequency, to ensure compliance with all vulnerability mitigation procedures.',
    nist: ['CA-7 (2)', 'CA-7 (2).1 (ii)']
  },
  'CCI-001681': {
    def: 'The organization defines the frequency at which each form of security control assessment should be conducted.',
    nist: ['CA-7 (2)', 'CA-7(2).1 (i)', 'CA-2 (2)']
  },
  'CCI-001584': {
    def: 'The organization defines the frequency with which to review and update configuration management procedures.',
    nist: ['CM-1', 'CM-1.2 (iii)', 'CM-1 b 2']
  },
  'CCI-000286': {
    def: 'The organization defines a frequency with which to review and update the configuration management policies.',
    nist: ['CM-1', 'CM-1.2 (i)', 'CM-1 b 1']
  },
  'CCI-000287': {
    def: 'The organization develops and documents a configuration management policy that addresses purpose, scope, roles, responsibilities, management commitment, coordination among organizational entities, and compliance.',
    nist: ['CM-1 a', 'CM-1.1 (i) (ii)', 'CM-1 a 1']
  },
  'CCI-000288': {
    def: 'The organization disseminates formal, documented configuration management policy to elements within the organization having associated configuration management roles and responsibilities.',
    nist: ['CM-1 a', 'CM-1.1 (iii)']
  },
  'CCI-000289': {
    def: 'The organization reviews and updates, on an organization-defined frequency, the configuration management policy.',
    nist: ['CM-1 a', 'CM-1.2 (ii)', 'CM-1 b 1']
  },
  'CCI-000290': {
    def: 'The organization develops and documents procedures to facilitate the implementation of the configuration management policy and associated configuration management controls.',
    nist: ['CM-1 b', 'CM-1.1 (iv) (v)', 'CM-1 a 2']
  },
  'CCI-000291': {
    def: 'The organization disseminates formal, documented procedures to facilitate the implementation of the configuration management policy and associated configuration management controls.',
    nist: ['CM-1 b', 'CM-1.1 (vi)']
  },
  'CCI-000292': {
    def: 'The organization reviews and updates, on an organization-defined frequency, the procedures to facilitate the implementation of the configuration management policy and associated configuration management controls.',
    nist: ['CM-1 b', 'CM-1.2 (iv)', 'CM-1 b 2']
  },
  'CCI-001585': {
    def: 'The organization defines the circumstances that require reviews and updates to the baseline configuration of the information system.',
    nist: ['CM-2 (1) (b)', 'CM-2 (1).1 (i)', 'CM-2 (1) (b)']
  },
  'CCI-000293': {
    def: 'The organization develops a current baseline configuration of the information system.',
    nist: ['CM-2', 'CM-2.1 (i)', 'CM-2']
  },
  'CCI-000294': {
    def: 'The organization documents a baseline configuration of the information system.',
    nist: ['CM-2', 'CM-2.1 (i)', 'CM-2']
  },
  'CCI-000295': {
    def: 'The organization maintains, under configuration control, a current baseline configuration of the information system.',
    nist: ['CM-2', 'CM-2.1 (ii)', 'CM-2']
  },
  'CCI-000296': {
    def: 'The organization reviews and updates the baseline configuration of the information system at an organization-defined frequency.',
    nist: ['CM-2 (1) (a)', 'CM-2 (1).1 (ii)', 'CM-2 (1) (a)']
  },
  'CCI-000297': {
    def: 'The organization reviews and updates the baseline configuration of the information system when required due to organization-defined circumstances.',
    nist: ['CM-2 (1) (b)', 'CM-2 (1).1 (ii)', 'CM-2 (1) (b)']
  },
  'CCI-000298': {
    def: 'The organization reviews and updates the baseline configuration of the information system as an integral part of information system component installations.',
    nist: ['CM-2 (1) (c)', 'CM-2 (1).1 (ii)', 'CM-2 (1) (c)']
  },
  'CCI-000299': {
    def: 'The organization reviews and updates the baseline configuration of the information system as an integral part of information system component upgrades.',
    nist: ['CM-2 (1) (c)', 'CM-2 (1).1 (ii)', 'CM-2 (1) (c)']
  },
  'CCI-000300': {
    def: 'The organization employs automated mechanisms to maintain a complete baseline configuration of the information system.',
    nist: ['CM-2 (2)', 'CM-2 (2).1', 'CM-2 (2)']
  },
  'CCI-000301': {
    def: 'The organization employs automated mechanisms to maintain an up-to-date baseline configuration of the information system.',
    nist: ['CM-2 (2)', 'CM-2 (2).1', 'CM-2 (2)']
  },
  'CCI-000302': {
    def: 'The organization employs automated mechanisms to maintain an accurate baseline configuration of the information system.',
    nist: ['CM-2 (2)', 'CM-2 (2).1', 'CM-2 (2)']
  },
  'CCI-000303': {
    def: 'The organization employs automated mechanisms to maintain a readily available baseline configuration of the information system.',
    nist: ['CM-2 (2)', 'CM-2 (2).1', 'CM-2 (2)']
  },
  'CCI-000304': {
    def: 'The organization retains organization-defined previous versions of baseline configurations of the information system to support rollback.',
    nist: ['CM-2 (3)', 'CM-2 (3).1', 'CM-2 (3)']
  },
  'CCI-000305': {
    def: 'The organization develops a list of software programs not authorized to execute on the information system.',
    nist: ['CM-2 (4) (a)', 'CM-2 (4).1 (i)', 'CM-7 (2)', 'CM-7 (2).1 (i)']
  },
  'CCI-000306': {
    def: 'The organization maintains the list of software programs not authorized to execute on the information system.',
    nist: ['CM-2 (4) (a)', 'CM-2 (4).1 (i)', 'CM-7 (2)', 'CM-7 (2).1 (i)']
  },
  'CCI-000307': {
    def: 'The organization employs an allow-all, deny-by-exception authorization policy to identify software allowed to execute on the information system.',
    nist: ['CM-2 (4) (b)', 'CM-2 (4).1 (ii)']
  },
  'CCI-000308': {
    def: 'The organization develops the list of software programs authorized to execute on the information system.',
    nist: ['CM-2 (5) (a)', 'CM-2 (5).1 (i)', 'CM-7 (2)', 'CM-7 (2).1 (i)']
  },
  'CCI-000309': {
    def: 'The organization maintains the list of software programs authorized to execute on the information system.',
    nist: ['CM-2 (5) (a)', 'CM-2 (5).1 (i)', 'CM-7 (2)', 'CM-7 (2).1 (i)']
  },
  'CCI-000310': {
    def: 'The organization employs a deny-all, permit-by-exception authorization policy to identify software allowed to execute on the information system.',
    nist: ['CM-2 (5) (b)', 'CM-2 (5).1 (ii)']
  },
  'CCI-000311': {
    def: 'The organization maintains a baseline configuration for information system development environments that is managed separately from the operational baseline configuration.',
    nist: ['CM-2 (6)', 'CM-2 (6).1', 'CM-2 (6)']
  },
  'CCI-000312': {
    def: 'The organization maintains a baseline configuration for information system test environments that is managed separately from the operational baseline configuration.',
    nist: ['CM-2 (6)', 'CM-2 (6).1', 'CM-2 (6)']
  },
  'CCI-001497': {
    def: 'The organization defines a frequency for the reviews and updates to the baseline configuration of the information system.',
    nist: ['CM-2 (1) (a)', 'CM-2 (1).1 (i)', 'CM-2 (1) (a)']
  },
  'CCI-001586': {
    def: 'The organization defines the configuration change control element (e.g., committee, board) responsible for coordinating and providing oversight for configuration change control activities.',
    nist: ['CM-3 f', 'CM-3.1 (vi)', 'CM-3 g', 'CM-3 (4)']
  },
  'CCI-000313': {
    def: 'The organization determines the types of changes to the information system that are configuration controlled.',
    nist: ['CM-3 a', 'CM-3.1 (i)', 'CM-3 a']
  },
  'CCI-000314': {
    def: 'The organization approves or disapproves configuration-controlled changes to the information system, with explicit consideration for security impact analysis.',
    nist: ['CM-3 b', 'CM-3.1 (ii)', 'CM-3 b']
  },
  'CCI-000315': {
    def: 'The organization documents approved configuration-controlled changes to the system.',
    nist: ['CM-3 c', 'CM-3.1 (iii)']
  },
  'CCI-000316': {
    def: 'The organization retains records of configuration-controlled changes to the information system for an organization-defined time period.',
    nist: ['CM-3 d', 'CM-3.1 (iv)', 'CM-3 e']
  },
  'CCI-000317': {
    def: 'The organization reviews records of configuration-controlled changes to the system.',
    nist: ['CM-3 d', 'CM-3.1 (iv)']
  },
  'CCI-000318': {
    def: 'The organization audits and reviews activities associated with configuration-controlled changes to the system.',
    nist: ['CM-3 e', 'CM-3.1 (v)', 'CM-3 f']
  },
  'CCI-000319': {
    def: 'The organization coordinates and provides oversight for configuration change control activities through an organization-defined configuration change control element (e.g., committee, board) that convenes at the organization-defined frequency and/or for any organization-defined configuration change conditions.',
    nist: ['CM-3 f', 'CM-3.1 (vii)', 'CM-3 g']
  },
  'CCI-000320': {
    def: 'The organization defines the frequency with which to convene the configuration change control element.',
    nist: ['CM-3 f', 'CM-3.1 (vi)', 'CM-3 g']
  },
  'CCI-000321': {
    def: 'The organization defines configuration change conditions that prompt the configuration change control element to convene.',
    nist: ['CM-3 f', 'CM-3.1 (vi)', 'CM-3 g']
  },
  'CCI-000322': {
    def: 'The organization employs automated mechanisms to document proposed changes to the information system.',
    nist: ['CM-3 (1) (a)', 'CM-3 (1).1 (ii)', 'CM-3 (1) (a)']
  },
  'CCI-000323': {
    def: 'The organization employs automated mechanisms to notify organization-defined approval authorities of proposed changes to the information system and request change approval.',
    nist: ['CM-3 (1) (b)', 'CM-3 (1).1 (ii)', 'CM-3 (1) (b)']
  },
  'CCI-000324': {
    def: 'The organization employs automated mechanisms to highlight proposed changes to the information system that have not been approved or disapproved by an organization-defined time period.',
    nist: ['CM-3 (1) (c)', 'CM-3 (1).1 (ii)', 'CM-3 (1) (c)']
  },
  'CCI-000325': {
    def: 'The organization employs automated mechanisms to prohibit changes to the information system until designated approvals are received.',
    nist: ['CM-3 (1) (d)', 'CM-3 (1).1 (ii)', 'CM-3 (1) (d)']
  },
  'CCI-000326': {
    def: 'The organization employs automated mechanisms to document all changes to the information system.',
    nist: ['CM-3 (1) (e)', 'CM-3 (1).1 (ii)', 'CM-3 (1) (e)']
  },
  'CCI-000327': {
    def: 'The organization tests changes to the information system before implementing the changes on the operational system.',
    nist: ['CM-3 (2)', 'CM-3 (2).1', 'CM-3 (2)']
  },
  'CCI-000328': {
    def: 'The organization validates changes to the information system before implementing the changes on the operational system.',
    nist: ['CM-3 (2)', 'CM-3 (2).1', 'CM-3 (2)']
  },
  'CCI-000329': {
    def: 'The organization documents changes to the information system before implementing the changes on the operational system.',
    nist: ['CM-3 (2)', 'CM-3 (2).1', 'CM-3 (2)']
  },
  'CCI-000330': {
    def: 'The organization employs automated mechanisms to implement changes to the current information system baseline.',
    nist: ['CM-3 (3)', 'CM-3 (3).1', 'CM-3 (3)']
  },
  'CCI-000331': {
    def: 'The organization deploys the updated information system baseline across the installed base.',
    nist: ['CM-3 (3)', 'CM-3 (3).1', 'CM-3 (3)']
  },
  'CCI-000332': {
    def: 'The organization requires an information security representative to be a member of the organization-defined configuration change control element.',
    nist: ['CM-3 (4)', 'CM-3 (3).1', 'CM-3 (4)']
  },
  'CCI-001498': {
    def: 'The organization defines a time period after which proposed changes to the information system that have not been approved or disapproved are highlighted.',
    nist: ['CM-3 (1) (c)', 'CM-3 (1).1 (i)', 'CM-3 (1) (c)']
  },
  'CCI-001587': {
    def: 'The organization, when analyzing new software in a separate test environment, looks for security impacts due to flaws, weaknesses, incompatibility, or intentional malice.',
    nist: ['CM-4 (1)', 'CM-4 (1).1 (ii)']
  },
  'CCI-000333': {
    def: 'The organization analyzes changes to the information system to determine potential security impacts prior to change implementation.',
    nist: ['CM-4', 'CM-4.1', 'CM-4']
  },
  'CCI-000334': {
    def: 'The organization analyzes new software in a separate test environment before installation in an operational environment.',
    nist: ['CM-4 (1)', 'CM-4 (1).1 (i)']
  },
  'CCI-000335': {
    def: 'The organization, after the information system is changed, checks the security functions to verify the functions are implemented correctly.',
    nist: ['CM-4 (2)', 'CM-4 (2).1', 'CM-4 (2)']
  },
  'CCI-000336': {
    def: 'The organization, after the information system is changed, checks the security functions to verify the functions are operating as intended.',
    nist: ['CM-4 (2)', 'CM-4 (2).1', 'CM-4 (2)']
  },
  'CCI-000337': {
    def: 'The organization, after the information system is changed, checks the security functions to verify the functions are producing the desired outcome with regard to meeting the security requirements for the system.',
    nist: ['CM-4 (2)', 'CM-4 (2).1', 'CM-4 (2)']
  },
  'CCI-001588': {
    def: 'The organization-defined security configuration checklists reflect the most restrictive mode consistent with operational requirements.',
    nist: ['CM-6 a', 'CM-6.1 (ii)', 'CM-6 a']
  },
  'CCI-001589': {
    def: 'The organization incorporates detection of unauthorized, security-relevant configuration changes into the organization’s incident response capability to ensure they are tracked.',
    nist: ['CM-6 (3)', 'CM-6 (3).1 (ii)']
  },
  'CCI-000363': {
    def: 'The organization defines security configuration checklists to be used to establish and document configuration settings for the information system technology products employed.',
    nist: ['CM-6 a', 'CM-6.1 (i)', 'CM-6 a']
  },
  'CCI-000364': {
    def: 'The organization establishes configuration settings for information technology products employed within the information system using organization-defined security configuration checklists.',
    nist: ['CM-6 a', 'CM-6.1 (iii)', 'CM-6 a']
  },
  'CCI-000365': {
    def: 'The organization documents configuration settings for information technology products employed within the information system using organization-defined security configuration checklists that reflect the most restrictive mode consistent with operational requirements.',
    nist: ['CM-6 a', 'CM-6.1 (iii)', 'CM-6 a']
  },
  'CCI-000366': {
    def: 'The organization implements the security configuration settings.',
    nist: ['CM-6 b', 'CM-6.1 (iv)', 'CM-6 b']
  },
  'CCI-000367': {
    def: 'The organization identifies any deviations from the established configuration settings for organization-defined information system components based on organization-defined operational requirements.',
    nist: ['CM-6 c', 'CM-6.1 (v)', 'CM-6 c']
  },
  'CCI-000368': {
    def: 'The organization documents any deviations from the established configuration settings for organization-defined information system components based on organization-defined operational requirements.',
    nist: ['CM-6 c', 'CM-6.1 (v)', 'CM-6 c']
  },
  'CCI-000369': {
    def: 'The organization approves any deviations from the established configuration settings for organization-defined information system components based on organization-defined operational requirements.',
    nist: ['CM-6 c', 'CM-6.1 (v)', 'CM-6 c']
  },
  'CCI-000370': {
    def: 'The organization employs automated mechanisms to centrally manage configuration settings for organization-defined information system components.',
    nist: ['CM-6 (1)', 'CM-6 (1).1', 'CM-6 (1)']
  },
  'CCI-000371': {
    def: 'The organization employs automated mechanisms to centrally apply configuration settings for organization-defined information system components.',
    nist: ['CM-6 (1)', 'CM-6 (1).1', 'CM-6 (1)']
  },
  'CCI-000372': {
    def: 'The organization employs automated mechanisms to centrally verify configuration settings for organization-defined information system components.',
    nist: ['CM-6 (1)', 'CM-6 (1).1', 'CM-6 (1)']
  },
  'CCI-000373': {
    def: 'The organization defines configuration settings for which unauthorized changes are responded to by automated mechanisms.',
    nist: ['CM-6 (2)', 'CM-6 (2).1 (i)']
  },
  'CCI-000374': {
    def: 'The organization employs automated mechanisms to respond to unauthorized changes to organization-defined configuration settings.',
    nist: ['CM-6 (2)', 'CM-6 (2).1 (ii)']
  },
  'CCI-000375': {
    def: 'The organization incorporates detection of unauthorized, security-relevant configuration changes into the organizations incident response capability.',
    nist: ['CM-6 (3)', 'CM-6 (3).1 (i)']
  },
  'CCI-000376': {
    def: 'The organization ensures unauthorized, security-relevant configuration changes detected are monitored.',
    nist: ['CM-6 (3)', 'CM-6 (3).1 (ii)']
  },
  'CCI-000377': {
    def: 'The organization ensures unauthorized, security-relevant configuration changes detected are corrected.',
    nist: ['CM-6 (3)', 'CM-6 (3).1 (ii)']
  },
  'CCI-000378': {
    def: 'The organization ensures unauthorized, security-relevant configuration changes detected are available for historical purposes.',
    nist: ['CM-6 (3)', 'CM-6 (3).1 (ii)']
  },
  'CCI-000379': {
    def: 'The information system (including modifications to the baseline configuration) demonstrates conformance to security configuration guidance (i.e., security checklists) prior to being introduced into a production environment.',
    nist: ['CM-6 (4)', 'CM-6 (4).1']
  },
  'CCI-001502': {
    def: 'The organization monitors changes to the configuration settings in accordance with organizational policies and procedures.',
    nist: ['CM-6 d', 'CM-6.1 (vi)', 'CM-6 d']
  },
  'CCI-001503': {
    def: 'The organization controls changes to the configuration settings in accordance with organizational policies and procedures.',
    nist: ['CM-6 d', 'CM-6.1 (vi)', 'CM-6 d']
  },
  'CCI-001590': {
    def: 'The organization develops a list of software programs authorized to execute on the information system.',
    nist: ['CM-7 (2)', 'CM-7 (2).1 (i)']
  },
  'CCI-001591': {
    def: 'The organization develops a list of software programs not authorized to execute on the information system.',
    nist: ['CM-7 (2)', 'CM-7 (2).1 (i)']
  },
  'CCI-001592': {
    def: 'The organization defines the rules authorizing the terms and conditions of software program usage on the information system.',
    nist: ['CM-7 (2)', 'CM-7 (2).1 (i)', 'CM-7 (2)']
  },
  'CCI-001593': {
    def: 'The organization maintains a list of software programs authorized to execute on the information system.',
    nist: ['CM-7 (2)', 'CM-7 (2).1 (i)']
  },
  'CCI-001594': {
    def: 'The organization maintains a list of software programs not authorized to execute on the information system.',
    nist: ['CM-7 (2)', 'CM-7 (2).1 (i)']
  },
  'CCI-001595': {
    def: 'The organization maintains rules authorizing the terms and conditions of software program usage on the information system.',
    nist: ['CM-7 (2)', 'CM-7 (2).1 (i)']
  },
  'CCI-000380': {
    def: 'The organization defines prohibited or restricted functions, ports, protocols, and/or services for the information system.',
    nist: ['CM-7', 'CM-7.1 (i)', 'CM-7 b']
  },
  'CCI-000381': {
    def: 'The organization configures the information system to provide only essential capabilities.',
    nist: ['CM-7', 'CM-7.1 (ii)', 'CM-7 a']
  },
  'CCI-000382': {
    def: 'The organization configures the information system to prohibit or restrict the use of organization-defined functions, ports, protocols, and/or services.',
    nist: ['CM-7', 'CM-7.1 (iii)', 'CM-7 b']
  },
  'CCI-000383': {
    def: 'The organization defines the frequency of information system reviews to identify and eliminate unnecessary functions, ports, protocols and/or services.',
    nist: ['CM-7 (1)', 'CM-7 (1).1 (i)']
  },
  'CCI-000384': {
    def: 'The organization reviews the information system per organization-defined frequency to identify unnecessary and nonsecure functions, ports, protocols, and services.',
    nist: ['CM-7 (1)', 'CM-7 (1).1 (i)', 'CM-7 (1) (a)']
  },
  'CCI-000385': {
    def: 'The organization reviews the information system per organization-defined frequency to eliminate unnecessary functions, ports, protocols, and/or services.',
    nist: ['CM-7 (1)', 'CM-7 (1).1 (ii)']
  },
  'CCI-000386': {
    def: 'The organization employs automated mechanisms to prevent program execution on the information system in accordance with the organization-defined specifications.',
    nist: ['CM-7 (2)', 'CM-7 (2).1 (ii)']
  },
  'CCI-000387': {
    def: 'The organization defines registration requirements for functions, ports, protocols, and services.',
    nist: ['CM-7 (3)', 'CM- 7(3).1 (i)', 'CM-7 (3)']
  },
  'CCI-000388': {
    def: 'The organization ensures compliance with organization-defined registration requirements for functions, ports, protocols, and services.',
    nist: ['CM-7 (3)', 'CM-7 (3).1 (ii)', 'CM-7 (3)']
  },
  'CCI-001596': {
    def: 'The organization defines the frequency with which to review and update the current contingency planning procedures.',
    nist: ['CP-1', 'CP-1.2 (iii)', 'CP-1 b 2']
  },
  'CCI-001597': {
    def: 'The organization disseminates contingency planning procedures to organization-defined personnel or roles.',
    nist: ['CP-1', 'CP-1.1 (vi)', 'CP-1 a 2']
  },
  'CCI-001598': {
    def: 'The organization reviews and updates the current contingency planning procedures in accordance with the organization-defined frequency.',
    nist: ['CP-1', 'CP-1.2 (iv)', 'CP-1 b 2']
  },
  'CCI-000437': {
    def: 'The organization defines the frequency with which to review and update the current contingency planning policy.',
    nist: ['CP-1', 'CP-1.2 (i)', 'CP-1 b 1']
  },
  'CCI-000438': {
    def: 'The organization develops and documents a contingency planning policy that addresses purpose, scope, roles, responsibilities, management commitment, coordination among organizational entities, and compliance.',
    nist: ['CP-1 a', 'CP-1.1 (i) (ii)', 'CP-1 a 1']
  },
  'CCI-000439': {
    def: 'The organization disseminates a contingency planning policy to organization-defined personnel or roles.',
    nist: ['CP-1 a', 'CP-1.1 (iii)', 'CP-1 a 1']
  },
  'CCI-000440': {
    def: 'The organization reviews and updates the current contingency planning policy in accordance with an organization-defined frequency.',
    nist: ['CP-1 a', 'CP-1.2 (ii)', 'CP-1 b 1']
  },
  'CCI-000441': {
    def: 'The organization develops and documents procedures to facilitate the implementation of the contingency planning policy and associated contingency planning controls.',
    nist: ['CP-1 b', 'CP-1.1 (iv) (v)', 'CP-1 a 2']
  },
  'CCI-001599': {
    def: 'The organization sustains operational continuity of essential missions until full information system restoration at primary processing and/or storage sites.',
    nist: ['CP-2 (5)', 'CP-2 (5).1 (b)', 'CP-2 (5)']
  },
  'CCI-001600': {
    def: 'The organization sustains operational continuity of essential business functions until full information system restoration at primary processing and/or storage sites.',
    nist: ['CP-2 (5)', 'CP-2 (5).1 (b)', 'CP-2 (5)']
  },
  'CCI-001601': {
    def: 'The organization sustains operational continuity of essential missions at alternate processing and/or storage sites until information system restoration at primary processing and/or storage sites.',
    nist: ['CP-2 (6)', 'CP-2 (6).1 (ii)', 'CP-2 (6)']
  },
  'CCI-001602': {
    def: 'The organization sustains operational continuity of essential business functions at alternate processing and/or storage sites until information system restoration at primary processing and/or storage sites.',
    nist: ['CP-2 (6)', 'CP-2 (6).1 (ii)', 'CP-2 (6)']
  },
  'CCI-000443': {
    def: 'The organization develops a contingency plan for the information system that identifies essential missions.',
    nist: ['CP-2 a', 'CP-2.1 (i)', 'CP-2 a 1']
  },
  'CCI-000444': {
    def: 'The organization develops a contingency plan for the information system that identifies essential business functions.',
    nist: ['CP-2 a', 'CP-2.1 (i)', 'CP-2 a 1']
  },
  'CCI-000445': {
    def: 'The organization develops a contingency plan for the information system that identifies associated contingency requirements.',
    nist: ['CP-2 a', 'CP-2.1 (i)', 'CP-2 a 1']
  },
  'CCI-000446': {
    def: 'The organization develops a contingency plan for the information system that provides recovery objectives.',
    nist: ['CP-2 a', 'CP-2.1 (i)', 'CP-2 a 2']
  },
  'CCI-000447': {
    def: 'The organization develops a contingency plan for the information system that provides restoration priorities.',
    nist: ['CP-2 a', 'CP-2.1 (i)', 'CP-2 a 2']
  },
  'CCI-000448': {
    def: 'The organization develops a contingency plan for the information system that provides metrics.',
    nist: ['CP-2 a', 'CP-2.1 (i)', 'CP-2 a 2']
  },
  'CCI-000449': {
    def: 'The organization develops a contingency plan for the information system that addresses contingency roles, responsibilities, assigned individuals with contact information.',
    nist: ['CP-2 a', 'CP-2.1 (i)', 'CP-2 a 3']
  },
  'CCI-000450': {
    def: 'The organization develops a contingency plan for the information system that addresses maintaining essential missions despite an information system disruption.',
    nist: ['CP-2 a', 'CP-2.1 (i)', 'CP-2 a 4']
  },
  'CCI-000451': {
    def: 'The organization develops a contingency plan for the information system that addresses maintaining essential business functions despite an information system disruption.',
    nist: ['CP-2 a', 'CP-2.1 I)', 'CP-2 a 4']
  },
  'CCI-000452': {
    def: 'The organization develops a contingency plan for the information system that addresses maintaining essential missions despite an information system compromise.',
    nist: ['CP-2 a', 'CP-2.1 (i)', 'CP-2 a 4']
  },
  'CCI-000453': {
    def: 'The organization develops a contingency plan for the information system that addresses maintaining essential business functions despite an information system compromise.',
    nist: ['CP-2 a', 'CP-2.1 (i)', 'CP-2 a 4']
  },
  'CCI-000454': {
    def: 'The organization develops a contingency plan for the information system that addresses maintaining essential missions despite an information system failure.',
    nist: ['CP-2 a', 'CP-2.1 (i)', 'CP-2 a 4']
  },
  'CCI-000455': {
    def: 'The organization develops a contingency plan for the information system that addresses maintaining essential business functions despite an information system failure.',
    nist: ['CP-2 a', 'CP-2.1 (i)', 'CP-2 a 4']
  },
  'CCI-000456': {
    def: 'The organization develops a contingency plan for the information system that addresses eventual, full information system restoration without deterioration of the security safeguards originally planned and implemented.',
    nist: ['CP-2 a', 'CP-2.1 (i)', 'CP-2 a 5']
  },
  'CCI-000457': {
    def: 'The organization develops a contingency plan for the information system that is reviewed and approved by organization-defined personnel or roles.',
    nist: ['CP-2 a', 'CP-2.1 (i)', 'CP-2 a 6']
  },
  'CCI-000458': {
    def: 'The organization defines a list of key contingency personnel (identified by name and/or by role) and organizational elements designated to receive copies of the contingency plan.',
    nist: ['CP-2 b', 'CP-2.1 (ii)', 'CP-2 b']
  },
  'CCI-000459': {
    def: 'The organization distributes copies of the contingency plan to an organization-defined list of key contingency personnel (identified by name and/or by role) and organizational elements.',
    nist: ['CP-2 b', 'CP-2.1 (iii)', 'CP-2 b']
  },
  'CCI-000460': {
    def: 'The organization coordinates contingency planning activities with incident handling activities.',
    nist: ['CP-2 c', 'CP-2.2 (i)', 'CP-2 c']
  },
  'CCI-000461': {
    def: 'The organization defines the frequency with which to review the contingency plan for the information system.',
    nist: ['CP-2 c', 'CP-2.2 (ii)', 'CP-2 d']
  },
  'CCI-000462': {
    def: 'The organization reviews the contingency plan for the information system in accordance with organization-defined frequency.',
    nist: ['CP-2 c', 'CP-2.2 (iii)', 'CP-2 d']
  },
  'CCI-000463': {
    def: 'The organization updates the contingency plan to address changes to the organization.',
    nist: ['CP-2 e', 'CP-2.2 (iv)', 'CP-2 e']
  },
  'CCI-000464': {
    def: 'The organization updates the contingency plan to address changes to the information system.',
    nist: ['CP-2 e', 'CP-2.2 (iv)', 'CP-2 e']
  },
  'CCI-000465': {
    def: 'The organization updates the contingency plan to address changes to the environment of operation.',
    nist: ['CP-2 e', 'CP-2.2 (iv)', 'CP-2 e']
  },
  'CCI-000466': {
    def: 'The organization updates the contingency plan to address problems encountered during contingency plan implementation, execution, or testing.',
    nist: ['CP-2 e', 'CP-2.2 (iv)', 'CP-2 e']
  },
  'CCI-000468': {
    def: 'The organization communicates contingency plan changes to an organization-defined list of key contingency personnel (identified by name and/or by role) and organizational elements.',
    nist: ['CP-2 f', 'CP-2.2 (v)', 'CP-2 f']
  },
  'CCI-000469': {
    def: 'The organization coordinates contingency plan development with organizational elements responsible for related plans.',
    nist: ['CP-2 (1)', 'CP-2 (1).1', 'CP-2 (1)']
  },
  'CCI-000470': {
    def: 'The organization conducts capacity planning so that necessary capacity for information processing exists during contingency operations.',
    nist: ['CP-2 (2)', 'CP-2 (2).1', 'CP-2 (2)']
  },
  'CCI-000471': {
    def: 'The organization conducts capacity planning so that necessary capacity for telecommunications exists during contingency operations.',
    nist: ['CP-2 (2)', 'CP-2 (2).1', 'CP-2 (2)']
  },
  'CCI-000472': {
    def: 'The organization conducts capacity planning so that necessary capacity for environmental support exists during contingency operations.',
    nist: ['CP-2 (2)', 'CP-2 (2).1', 'CP-2 (2)']
  },
  'CCI-000473': {
    def: 'The organization defines the time period for planning the resumption of essential missions as a result of contingency plan activation.',
    nist: ['CP-2 (3)', 'CP-2 (3).1 (i)', 'CP-2 (3)']
  },
  'CCI-000474': {
    def: 'The organization defines the time period for planning the resumption of essential business functions as a result of contingency plan activation.',
    nist: ['CP-2 (3)', 'CP-2 (3).1 (i)', 'CP-2 (3)']
  },
  'CCI-000475': {
    def: 'The organization plans for the resumption of essential missions within the organization-defined time period of contingency plan activation.',
    nist: ['CP-2 (3)', 'CP-2 (3).1 (ii)', 'CP-2 (3)']
  },
  'CCI-000476': {
    def: 'The organization plans for the resumption of essential business functions within the organization-defined time period of contingency plan activation.',
    nist: ['CP-2 (3)', 'CP-2 (3).1 (ii)', 'CP-2 (3)']
  },
  'CCI-000477': {
    def: 'The organization defines the time period for planning the resumption of all missions as a result of contingency plan activation.',
    nist: ['CP-2 (4)', 'CP-2 (4).1 (i)', 'CP-2 (4)']
  },
  'CCI-000478': {
    def: 'The organization defines the time period for planning the resumption of all business functions as a result of contingency plan activation.',
    nist: ['CP-2 (4)', 'CP-2 (4).1 (i)', 'CP-2 (4)']
  },
  'CCI-000479': {
    def: 'The organization plans for the resumption of all missions within an organization-defined time period of contingency plan activation.',
    nist: ['CP-2 (4)', 'CP-2 (4).1 (ii)', 'CP-2 (4)']
  },
  'CCI-000480': {
    def: 'The organization plans for the resumption of all business functions within an organization-defined time period of contingency plan activation.',
    nist: ['CP-2 (4)', 'CP-2 (4).1 (ii)', 'CP-2 (4)']
  },
  'CCI-000481': {
    def: 'The organization plans for the continuance of essential missions with little or no loss of operational continuity.',
    nist: ['CP-2 (5)', 'CP-2 (5).1 (a)', 'CP-2 (5)']
  },
  'CCI-000482': {
    def: 'The organization plans for the continuance of essential business functions with little or no loss of operational continuity.',
    nist: ['CP-2 (5)', 'CP-2 (5).1 (a)', 'CP-2 (5)']
  },
  'CCI-000483': {
    def: 'The organization plans for the transfer of essential missions to alternate processing and/or storage sites with little or no loss of operational continuity.',
    nist: ['CP-2 (6)', 'CP-2 (6).1 (i)', 'CP-2 (6)']
  },
  'CCI-000484': {
    def: 'The organization plans for the transfer of essential business functions to alternate processing and/or storage sites with little or no loss of operational continuity.',
    nist: ['CP-2 (6)', 'CP-2 (6).1 (i)', 'CP-2 (6)']
  },
  'CCI-001603': {
    def: 'The contingency plan identifies the primary storage site hazards.',
    nist: ['CP-6 (1)', 'CP-6 (1).1 (i)']
  },
  'CCI-001604': {
    def: 'The organization outlines explicit mitigation actions for organization identified accessibility problems to the alternate storage site in the event of an area-wide disruption or disaster.',
    nist: ['CP-6 (3)', 'CP-6 (3).1 (ii)', 'CP-6 (3)']
  },
  'CCI-000505': {
    def: 'The organization establishes an alternate storage site including necessary agreements to permit the storage and retrieval of information system backup information.',
    nist: ['CP-6', 'CP-6.1 (i)', 'CP-6 a']
  },
  'CCI-000506': {
    def: 'The organization initiates necessary alternate storage site agreements to permit the storage and recovery of information system backup information.',
    nist: ['CP-6', 'CP-6.1 (ii)']
  },
  'CCI-000507': {
    def: 'The organization identifies an alternate storage site that is separated from the primary storage site to reduce susceptibility to the same threats.',
    nist: ['CP-6 (1)', 'CP-6 (1).1 (ii)', 'CP-6 (1)']
  },
  'CCI-000508': {
    def: 'The organization configures the alternate storage site to facilitate recovery operations in accordance with recovery time and recovery point objectives.',
    nist: ['CP-6 (2)', 'CP-6 (2).1', 'CP-6 (2)']
  },
  'CCI-000509': {
    def: 'The organization identifies potential accessibility problems to the alternate storage site in the event of an area-wide disruption or disaster.',
    nist: ['CP-6 (3)', 'CP-6 (3).1 (i)', 'CP-6 (3)']
  },
  'CCI-001605': {
    def: 'The contingency plan identifies the primary processing site hazards.',
    nist: ['CP-7 (1)', 'CP-7 (1).1 (i)']
  },
  'CCI-001606': {
    def: 'The organization outlines explicit mitigation actions for organization-identified potential accessibility problems to the alternate processing site in the event of an area-wide disruption or disaster.',
    nist: ['CP-7 (2)', 'CP-7 (2).1 (ii)', 'CP-7 (2)']
  },
  'CCI-000510': {
    def: 'The organization defines the time period consistent with recovery time and recovery point objectives for essential missions/business functions to permit the transfer and resumption of organization-defined information system operations at an alternate processing site when the primary processing capabilities are unavailable.',
    nist: ['CP-7', 'CP-7.1 (ii)', 'CP-7 a']
  },
  'CCI-000511': {
    def: 'The organization defines the time period for achieving the recovery time objectives for business functions within which processing must be resumed at the alternate processing site.',
    nist: ['CP-7', 'CP-7.1 (ii)']
  },
  'CCI-000512': {
    def: 'The organization establishes an alternate processing site.',
    nist: ['CP-7 a', 'CP-7.1 (i)']
  },
  'CCI-000513': {
    def: 'The organization establishes an alternate processing site including necessary agreements to permit the transfer and resumption of organization-defined information system operations for essential missions within an organization-defined time period consistent with recovery time and recovery point objectives when the primary processing capabilities are unavailable.',
    nist: ['CP-7 a', 'CP-7.1 (iii)', 'CP-7 a']
  },
  'CCI-000514': {
    def: 'The organization establishes an alternate processing site including necessary agreements to permit the transfer and resumption of organization-defined information system operations for essential business functions within an organization-defined time period consistent with recovery time and recovery point objectives when the primary processing capabilities are unavailable.',
    nist: ['CP-7 a', 'CP-7.1 (iii)', 'CP-7 a']
  },
  'CCI-000515': {
    def: 'The organization ensures that equipment and supplies required to transfer and resume operations are available at the alternate processing site or contracts are in place to support delivery to the site within the organization-defined time period for transfer/resumption.',
    nist: ['CP-7 b', 'CP-7.1 (iv)', 'CP-7 b']
  },
  'CCI-000516': {
    def: 'The organization identifies an alternate processing site that is separated from the primary processing site to reduce susceptibility to the same threats.',
    nist: ['CP-7 (1)', 'CP-7 (1).1 (ii)', 'CP-7 (1)']
  },
  'CCI-000517': {
    def: 'The organization identifies potential accessibility problems to the alternate processing site in the event of an area-wide disruption or disaster.',
    nist: ['CP-7 (2)', 'CP-7 (2).1 (i)', 'CP-7 (2)']
  },
  'CCI-000518': {
    def: 'The organization develops alternate processing site agreements that contain priority-of-service provisions in accordance with the organizational availability requirements (including recovery time objectives).',
    nist: ['CP-7 (3)', 'CP-7 (3).1', 'CP-7 (3)']
  },
  'CCI-000519': {
    def: 'The organization prepares the alternate processing site so that it is ready to be used as the operational site supporting essential missions.',
    nist: ['CP-7 (4)', 'CP-7 (4).1', 'CP-7 (4)']
  },
  'CCI-000520': {
    def: 'The organization prepares the alternate processing site so that it is ready to be used as the operational site supporting essential business functions.',
    nist: ['CP-7 (4)', 'CP-7 (4).1', 'CP-7 (4)']
  },
  'CCI-000521': {
    def: 'The organization ensures that the alternate processing site provides information security safeguards equivalent to that of the primary site.',
    nist: ['CP-7 (5)', 'CP-7 (5).1', 'CP-7 c']
  },
  'CCI-001607': {
    def: 'The organization establishes alternate telecommunications services to support the information system.',
    nist: ['CP-8 (2)', 'CP-8.1 (i)']
  },
  'CCI-001608': {
    def: "The organization identifies the primary provider's telecommunications service hazards.",
    nist: ['CP-8 (3)', 'CP-8 (3).1 (i)']
  },
  'CCI-000522': {
    def: 'The organization defines the time period within which to permit the resumption of organization-defined information system operations for essential missions when the primary telecommunications capabilities are unavailable at either the primary or alternate processing or storage sites.',
    nist: ['CP-8', 'CP-8.1 (ii)', 'CP-8']
  },
  'CCI-000523': {
    def: 'The organization defines the time period within which to permit the resumption of organization-defined information system operations for essential business functions when the primary telecommunications capabilities are unavailable at either the primary or alternate processing or storage sites.',
    nist: ['CP-8', 'CP-8.1 (ii)', 'CP-8']
  },
  'CCI-000524': {
    def: 'The organization establishes alternate telecommunication services including necessary agreements to permit the resumption of organization-defined information system operations for essential missions within an organization-defined time period when the primary telecommunications capabilities are unavailable at either the primary or alternate processing or storage sites.',
    nist: ['CP-8', 'CP-8.1 (iii)', 'CP-8']
  },
  'CCI-000525': {
    def: 'The organization establishes alternate telecommunication services including necessary agreements to permit the resumption of organization-defined information system operations for essential business functions within an organization-defined time period when the primary telecommunications capabilities are unavailable at either the primary or alternate processing or storage sites.',
    nist: ['CP-8', 'CP-8.1 (iii)', 'CP-8']
  },
  'CCI-000526': {
    def: 'The organization develops primary telecommunications service agreements that contain priority-of-service provisions in accordance with the organization^s availability requirements (including recovery time objectives).',
    nist: ['CP-8 (1) (a)', 'CP-8 (1).1 (i)', 'CP-8 (1) (a)']
  },
  'CCI-000527': {
    def: 'The organization develops alternate telecommunications service agreements that contain priority-of-service provisions in accordance with the organization^s availability requirements (including recovery time objectives).',
    nist: ['CP-8 (1) (a)', 'CP-8 (1).1 (i)', 'CP-8 (1) (a)']
  },
  'CCI-000528': {
    def: 'The organization requests Telecommunications Service Priority for all telecommunications services used for national security emergency preparedness in the event that the primary telecommunications services are provided by a common carrier.',
    nist: ['CP-8 (1) (b)', 'CP-8 (1).1 (ii)', 'CP-8 (1) (b)']
  },
  'CCI-000529': {
    def: 'The organization requests Telecommunications Service Priority for all telecommunications services used for national security emergency preparedness in the event that the alternate telecommunications services are provided by a common carrier.',
    nist: ['CP-8 (1) (b)', 'CP-8 (1).1 (ii)', 'CP-8 (1) (b)']
  },
  'CCI-000530': {
    def: 'The organization obtains alternate telecommunications services to reduce the likelihood of sharing a single point of failure with primary telecommunications services.',
    nist: ['CP-8 (2)', 'CP-8 (2).1', 'CP-8 (2)']
  },
  'CCI-000531': {
    def: 'The organization obtains alternate telecommunications services from providers that are separated from primary service providers to reduce susceptibility to the same threats.',
    nist: ['CP-8 (3)', 'CP-8 (3).1 (ii)', 'CP-8 (3)']
  },
  'CCI-000532': {
    def: 'The organization requires primary telecommunications service providers to have contingency plans.',
    nist: ['CP-8 (4)', 'CP-8 (4).1', 'CP-8 (4) (a)']
  },
  'CCI-000533': {
    def: 'The organization requires alternate telecommunications service providers to have contingency plans.',
    nist: ['CP-8 (4)', 'CP-8 (4).1', 'CP-8 (4) (a)']
  },
  'CCI-001609': {
    def: 'The organization can activate the redundant secondary information system that is not collocated with the primary system without loss of information or disruption to operations.',
    nist: ['CP-9 (6)', 'CP-9 (6).1 (ii)', 'CP-9 (6)']
  },
  'CCI-000534': {
    def: 'The organization defines the frequency of conducting user-level information backups to support recovery time objectives and recovery point objectives.',
    nist: ['CP-9 (a)', 'CP-9 (6).1 (ii)', 'CP-9 (a)']
  },
  'CCI-000535': {
    def: 'The organization conducts backups of user-level information contained in the information system per organization-defined frequency that is consistent with recovery time and recovery point objectives.',
    nist: ['CP-9 (a)', 'CP-9.1 (iv)', 'CP-9 (a)']
  },
  'CCI-000536': {
    def: 'The organization defines the frequency of conducting system-level information backups to support recovery time objectives and recovery point objectives.',
    nist: ['CP-9 (b)', 'CP-9.1 (ii)', 'CP-9 (b)']
  },
  'CCI-000537': {
    def: 'The organization conducts backups of system-level information contained in the information system per organization-defined frequency that is consistent with recovery time and recovery point objectives.',
    nist: ['CP-9 (b)', 'CP-9.1 (v)', 'CP-9 (b)']
  },
  'CCI-000538': {
    def: 'The organization defines the frequency of conducting information system documentation backups, including security-related documentation, to support recovery time objectives and recovery point objectives.',
    nist: ['CP-9 (c)', 'CP-9.1 (iii)', 'CP-9 (c)  ']
  },
  'CCI-000539': {
    def: 'The organization conducts backups of information system documentation, including security-related documentation, per an organization-defined frequency that is consistent with recovery time and recovery point objectives.',
    nist: ['CP-9 (c)', 'CP-9.1 (vi)', 'CP-9 (c)  ']
  },
  'CCI-000540': {
    def: 'The organization protects the confidentiality, integrity, and availability of backup information at storage locations.',
    nist: ['CP-9 (d)', 'CP-9.2', 'CP-9 (d)']
  },
  'CCI-000541': {
    def: 'The organization defines the frequency with which to test backup information to verify media reliability and information integrity.',
    nist: ['CP-9 (1)', 'CP-9 (1).1 (i)', 'CP-9 (1)']
  },
  'CCI-000542': {
    def: 'The organization tests backup information per an organization-defined frequency to verify media reliability and information integrity.',
    nist: ['CP-9 (1)', 'CP-9 (1).1 (ii)', 'CP-9 (1)']
  },
  'CCI-000543': {
    def: 'The organization uses a sample of backup information in the restoration of selected information system functions as part of contingency plan testing.',
    nist: ['CP-9 (2)', 'CP-9 (2).1', 'CP-9 (2)']
  },
  'CCI-000544': {
    def: 'The organization stores backup copies of the operating system in a separate facility or in a fire-rated container that is not colocated with the operational system.',
    nist: ['CP-9 (3)', 'CP-9 (3).1']
  },
  'CCI-000545': {
    def: 'The organization stores backup copies of critical information system software in a separate facility or in a fire-rated container that is not colocated with the operational system.',
    nist: ['CP-9 (3)', 'CP-9 (3).1']
  },
  'CCI-000546': {
    def: 'The organization stores backup copies of the information system inventory (including hardware, software, and firmware components) in a separate facility or in a fire-rated container that is not colocated with the operational system.',
    nist: ['CP-9 (3)', 'CP-9 (3).1']
  },
  'CCI-000547': {
    def: 'The organization defines the time period and transfer rate of the information system backup information to the alternate storage site consistent with the recovery time and recovery point objectives.',
    nist: ['CP-9 (5)', 'CP-9 (5).1 (i)', 'CP-9 (5)']
  },
  'CCI-000548': {
    def: 'The organization transfers information system backup information to the alternate storage site in accordance with the organization-defined time period and transfer rate consistent with the recovery time and recovery point objectives.',
    nist: ['CP-9 (5)', 'CP-9 (5).1 (ii)', 'CP-9 (5)']
  },
  'CCI-000549': {
    def: 'The organization maintains a redundant secondary information system that is not collocated with the primary system.',
    nist: ['CP-9 (6)', 'CP-9 (6).1 (i)', 'CP-9 (6)']
  },
  'CCI-001610': {
    def: 'The organization defines the time period (by authenticator type) for changing/refreshing authenticators.',
    nist: ['IA-5 g', 'IA-5.1 (i)', 'IA-5 g']
  },
  'CCI-001611': {
    def: 'The organization defines the minimum number of special characters for password complexity enforcement.',
    nist: ['IA-5 (1) (a)', 'IA-5 (1).1 (i)', 'IA-5 (1) (a)']
  },
  'CCI-001612': {
    def: 'The organization defines the minimum number of upper case characters for password complexity enforcement.',
    nist: ['IA-5 (1) (a)', 'IA-5 (1).1 (i)', 'IA-5 (1) (a)']
  },
  'CCI-001613': {
    def: 'The organization defines the minimum number of lower case characters for password complexity enforcement.',
    nist: ['IA-5 (1) (a)', 'IA-5 (1).1 (i)', 'IA-5 (1) (a)']
  },
  'CCI-001614': {
    def: 'The organization defines the minimum number of numeric characters for password complexity enforcement.',
    nist: ['IA-5 (1) (a)', 'IA-5 (1).1 (i)', 'IA-5 (1) (a)']
  },
  'CCI-001615': {
    def: 'The organization defines the minimum number of characters that are changed when new passwords are created.',
    nist: ['IA-5 (1) (b)', 'IA-5 (1).1 (ii)', 'IA-5 (1) (b)']
  },
  'CCI-001616': {
    def: 'The organization defines minimum password lifetime restrictions.',
    nist: ['IA-5 (1) (b)', 'IA-5 (1).1 (ii)', 'IA-5 (1) (d)']
  },
  'CCI-001617': {
    def: 'The organization defines maximum password lifetime restrictions.',
    nist: ['IA-5 (1) (d)', 'IA-5 (1).1 (iii)', 'IA-5 (1) (d)']
  },
  'CCI-001618': {
    def: 'The organization defines the number of generations for which password reuse is prohibited.',
    nist: ['IA-5 (1) (d)', 'IA-5 (1).1 (iv)', 'IA-5 (1) (e)']
  },
  'CCI-001619': {
    def: 'The information system enforces password complexity by the minimum number of special characters used.',
    nist: ['IA-5 (1) (a)', 'IA-5 (1).1 (v)', 'IA-5 (1) (a)']
  },
  'CCI-001620': {
    def: 'The organization defines the types of and/or specific authenticators for which the registration process must be carried out in person before a designated registration authority with authorization by a designated organizational official (e.g., a supervisor).',
    nist: ['IA-5 (3)', 'IA-5 (3).1 (i)']
  },
  'CCI-001621': {
    def: 'The organization implements organization-defined security safeguards to manage the risk of compromise due to individuals having accounts on multiple information systems.',
    nist: ['IA-5 (8)', 'IA-5 (8).1 (ii)', 'IA-5 (8)']
  },
  'CCI-000175': {
    def: 'The organization manages information system authenticators for users and devices by verifying, as part of the initial authenticator distribution, the identity of the individual and/or device receiving the authenticator.',
    nist: ['IA-5 a', 'IA-5.1 (ii)']
  },
  'CCI-000176': {
    def: 'The organization manages information system authenticators by establishing initial authenticator content for authenticators defined by the organization.',
    nist: ['IA-5 b', 'IA-5.1 (ii)', 'IA-5 b']
  },
  'CCI-000177': {
    def: 'The organization manages information system authenticators for users and devices by establishing and implementing administrative procedures for initial authenticator distribution, for lost/compromised, or damaged authenticators, and for revoking authenticators.',
    nist: ['IA-5 d', 'IA-5.1 (ii)']
  },
  'CCI-000178': {
    def: 'The organization manages information system authenticators for users and devices by changing default content of authenticators upon information system installation.',
    nist: ['IA-5 e', 'IA-5.1 (ii)']
  },
  'CCI-000179': {
    def: 'The organization manages information system authenticators by establishing minimum lifetime restrictions for authenticators.',
    nist: ['IA-5 f', 'IA-5.1 (ii)', 'IA-5 f']
  },
  'CCI-000180': {
    def: 'The organization manages information system authenticators by establishing maximum lifetime restrictions for authenticators.',
    nist: ['IA-5 f', 'IA-5.1 (ii)', 'IA-5 f']
  },
  'CCI-000181': {
    def: 'The organization manages information system authenticators by establishing reuse conditions for authenticators.',
    nist: ['IA-5 f', 'IA-5.1 (ii)', 'IA-5 f']
  },
  'CCI-000182': {
    def: 'The organization manages information system authenticators by changing/refreshing authenticators in accordance with the organization-defined time period by authenticator type.',
    nist: ['IA-5 g', 'IA-5.1 (ii)', 'IA-5 g']
  },
  'CCI-000183': {
    def: 'The organization manages information system authenticators by protecting authenticator content from unauthorized disclosure.',
    nist: ['IA-5 h', 'IA-5.1 (ii)', 'IA-5 h']
  },
  'CCI-000184': {
    def: 'The organization manages information system authenticators by requiring individuals to take, and having devices implement, specific security safeguards to protect authenticators.',
    nist: ['IA-5 i', 'IA-5.1 (ii)', 'IA-5 i']
  },
  'CCI-000185': {
    def: 'The information system, for PKI-based authentication, validates certifications by constructing and verifying a certification path to an accepted trust anchor including checking certificate status information.',
    nist: ['IA-5 (2)', 'IA-5 (2).1', 'IA-5 (2) (a)']
  },
  'CCI-000186': {
    def: 'The information system, for PKI-based authentication, enforces authorized access to the corresponding private key.',
    nist: ['IA-5 (2)', 'IA-5 (2).1', 'IA-5 (2) (b)']
  },
  'CCI-000187': {
    def: 'The information system, for PKI-based authentication, maps the authenticated identity to the account of the individual or group.',
    nist: ['IA-5 (2)', 'IA-5 (2).1', 'IA-5 (2) (c)']
  },
  'CCI-000188': {
    def: 'The organization requires that the registration process to receive an organizational-defined type of authenticator be carried out in person before a designated registration authority with authorization by a designated organizational official (e.g., a supervisor).',
    nist: ['IA-5 (3)', 'IA-5 (3).1 (ii)']
  },
  'CCI-000189': {
    def: 'The organization employs automated tools to determine if authenticators are sufficiently strong to resist attacks intended to discover or otherwise compromise the authenticators.',
    nist: ['IA-5 (4)', 'IA-5 (4).1']
  },
  'CCI-000190': {
    def: 'The organization requires vendors/manufacturers of information system components to provide unique authenticators or change default authenticators prior to delivery.',
    nist: ['IA-5 (5)', 'IA-5 (5).1']
  },
  'CCI-000191': {
    def: 'The organization enforces password complexity by the number of special characters used.',
    nist: ['IA-5 (1) (a)', 'IA-5 (1).1 (v)']
  },
  'CCI-000201': {
    def: 'The organization protects authenticators commensurate with the security category of the information to which use of the authenticator permits access.',
    nist: ['IA-5 (6)', 'IA-5 (6).1', 'IA-5 (6)']
  },
  'CCI-000202': {
    def: 'The organization ensures unencrypted static authenticators are not embedded in access scripts.',
    nist: ['IA-5 (7)', 'IA-5 (7).1', 'IA-5 (7)']
  },
  'CCI-000204': {
    def: 'The organization defines the security safeguards required to manage the risk of compromise due to individuals having accounts on multiple information systems.',
    nist: ['IA-5 (8)', 'IA-5 (8).1 (i)', 'IA-5 (8)']
  },
  'CCI-000192': {
    def: 'The information system enforces password complexity by the minimum number of upper case characters used.',
    nist: ['IA-5 (1) (a)', 'IA-5 (1).1 (v)', 'IA-5 (1) (a)']
  },
  'CCI-000193': {
    def: 'The information system enforces password complexity by the minimum number of lower case characters used.',
    nist: ['IA-5 (1) (a)', 'IA-5 (1).1 (v)', 'IA-5 (1) (a)']
  },
  'CCI-000194': {
    def: 'The information system enforces password complexity by the minimum number of numeric characters used.',
    nist: ['IA-5 (1) (a)', 'IA-5 (1).1 (v)', 'IA-5 (1) (a)']
  },
  'CCI-000195': {
    def: 'The information system, for password-based authentication, when new passwords are created, enforces that at least an organization-defined number of characters are changed.',
    nist: ['IA-5 (1) (b)', 'IA-5 (1).1 (v)', 'IA-5 (1) (b)']
  },
  'CCI-000196': {
    def: 'The information system, for password-based authentication, stores only cryptographically-protected passwords.',
    nist: ['IA-5 (1) (c)', 'IA-5 (1).1 (v)', 'IA-5 (1) (c)']
  },
  'CCI-000197': {
    def: 'The information system, for password-based authentication, transmits only cryptographically-protected passwords.',
    nist: ['IA-5 (1) (c)', 'IA-5 (1).1 (v)', 'IA-5 (1) (c)']
  },
  'CCI-000198': {
    def: 'The information system enforces minimum password lifetime restrictions.',
    nist: ['IA-5 (1) (d)', 'IA-5 (1).1 (v)', 'IA-5 (1) (d)']
  },
  'CCI-000199': {
    def: 'The information system enforces maximum password lifetime restrictions.',
    nist: ['IA-5 (1) (d)', 'IA-5 (1).1 (v)', 'IA-5 (1) (d)']
  },
  'CCI-000200': {
    def: 'The information system prohibits password reuse for the organization-defined number of generations.',
    nist: ['IA-5 (1) (e)', 'IA-5 (1).1 (v)', 'IA-5 (1) (e)']
  },
  'CCI-000203': {
    def: 'The organization ensures unencrypted static authenticators are not stored on function keys.',
    nist: ['IA-5 (7)', 'IA-5 (7).1', 'IA-5 (7)']
  },
  'CCI-000205': {
    def: 'The information system enforces minimum password length.',
    nist: ['IA-5 (1) (a)', 'IA-5 (1).1 (i)', 'IA-5 (1) (a)']
  },
  'CCI-001544': {
    def: 'The organization manages information system authenticators by ensuring that authenticators have sufficient strength of mechanism for their intended use.',
    nist: ['IA-5 c', 'IA-5.1 (ii)', 'IA-5 c']
  },
  'CCI-001622': {
    def: 'The organization identifies personnel with incident response roles and responsibilities with respect to the information system.',
    nist: ['IR-2', 'IR-2.1 (i)']
  },
  'CCI-001623': {
    def: 'The incident response training material addresses the procedures and activities necessary to fulfill identified organizational incident response roles and responsibilities.',
    nist: ['IR-2', 'IR-2.1 (iii)']
  },
  'CCI-000813': {
    def: 'The organization provides incident response training to information system users consistent with assigned roles and responsibilities within an organization-defined time period of assuming an incident response role or responsibility.',
    nist: ['IR-2 a', 'IR-2.1 (ii)', 'IR-2 a']
  },
  'CCI-000814': {
    def: 'The organization provides incident response training in accordance with organization-defined frequency.',
    nist: ['IR-2 b', 'IR-2.1 (v)', 'IR-2 c']
  },
  'CCI-000815': {
    def: 'The organization defines a frequency for incident response training.',
    nist: ['IR-2 b', 'IR-2.1 (iv)', 'IR-2 c']
  },
  'CCI-000816': {
    def: 'The organization incorporates simulated events into incident response training to facilitate effective response by personnel in crisis situations.',
    nist: ['IR-2 (1)', 'IR-2 (1).1', 'IR-2 (1)']
  },
  'CCI-000817': {
    def: 'The organization employs automated mechanisms to provide a more thorough and realistic incident response training environment.',
    nist: ['IR-2 (2)', 'IR-2 (2).1', 'IR-2 (2)']
  },
  'CCI-001624': {
    def: 'The organization documents the results of incident response tests.',
    nist: ['IR-3', 'IR-3.1 (iv)', 'IR-3']
  },
  'CCI-000818': {
    def: 'The organization tests the incident response capability for the information system on an organization-defined frequency using organization-defined tests to determine the incident response effectiveness.',
    nist: ['IR-3', 'IR-3.1 (iii) (v)', 'IR-3']
  },
  'CCI-000819': {
    def: 'The organization defines a frequency for incident response tests.',
    nist: ['IR-3', 'IR-3.1 (ii)', 'IR-3']
  },
  'CCI-000820': {
    def: 'The organization defines tests for incident response.',
    nist: ['IR-3', 'IR-3.1 (i)', 'IR-3']
  },
  'CCI-000821': {
    def: 'The organization employs automated mechanisms to more thoroughly and effectively test the incident response capability.',
    nist: ['IR-3 (1)', 'IR-3 (1).1', 'IR-3 (1)']
  },
  'CCI-001625': {
    def: 'The organization implements the resulting incident handling activity changes to incident response procedures, training, and testing/exercises accordingly.',
    nist: ['IR-4 c', 'IR-4.1 (iv)', 'IR-4 c']
  },
  'CCI-000822': {
    def: 'The organization implements an incident handling capability for security incidents that includes preparation, detection and analysis, containment, eradication, and recovery.',
    nist: ['IR-4 a', 'IR-4.1 (i)', 'IR-4 a']
  },
  'CCI-000823': {
    def: 'The organization coordinates incident handling activities with contingency planning activities.',
    nist: ['IR-4 b', 'IR-4.1 (ii)', 'IR-4 b']
  },
  'CCI-000824': {
    def: 'The organization incorporates lessons learned from ongoing incident handling activities into incident response procedures, training, and testing/exercises.',
    nist: ['IR-4 c', 'IR-4.1 (iii)', 'IR-4 c']
  },
  'CCI-000825': {
    def: 'The organization employs automated mechanisms to support the incident handling process.',
    nist: ['IR-4 (1)', 'IR-4 (1).1', 'IR-4 (1)']
  },
  'CCI-000826': {
    def: 'The organization includes dynamic reconfiguration of organization-defined information system components as part of the incident response capability.',
    nist: ['IR-4 (2)', 'IR-4 (2).1', 'IR-4 (2)']
  },
  'CCI-000827': {
    def: 'The organization defines and identifies classes of incidents for which organization-defined actions are to be taken to ensure continuation of organizational mission and business functions.',
    nist: ['IR-4 (3)', 'IR-4 (3).1 (i)', 'IR-4 (3)']
  },
  'CCI-000828': {
    def: 'The organization defines and identifies actions to take in response to organization-defined classes of incidents to ensure continuation of organizational missions and business functions.',
    nist: ['IR-4 (3)', 'IR-4 (3).1 (ii)', 'IR-4 (3)']
  },
  'CCI-000829': {
    def: 'The organization correlates incident information and individual incident responses to achieve an organization-wide perspective on incident awareness and response.',
    nist: ['IR-4 (4)', 'IR-4 (4).1', 'IR-4 (4)']
  },
  'CCI-000830': {
    def: 'The organization defines security violations that, if detected, initiate a configurable capability to automatically disable the information system.',
    nist: ['IR-4 (5)', 'IR-4 (5).1 (i)', 'IR-4 (5)']
  },
  'CCI-000831': {
    def: 'The organization implements a configurable capability to automatically disable the information system if organization-defined security violations are detected.',
    nist: ['IR-4 (5)', 'IR-4 (5).1 (ii)', 'IR-4 (5)']
  },
  'CCI-001626': {
    def: 'The organization employs automated mechanisms to assist in the collection of security incident information.',
    nist: ['IR-5 (1)', 'IR-5 (1).1 (ii)', 'IR-5 (1)']
  },
  'CCI-001627': {
    def: 'The organization employs automated mechanisms to assist in the analysis of security incident information.',
    nist: ['IR-5 (1)', 'IR-5 (1).1 (iii)', 'IR-5 (1)']
  },
  'CCI-000832': {
    def: 'The organization tracks and documents information system security incidents.',
    nist: ['IR-5', 'IR-5.1', 'IR-5']
  },
  'CCI-000833': {
    def: 'The organization employs automated mechanisms to assist in the tracking of security incidents.',
    nist: ['IR-5 (1)', 'IR-5 (1).1 (i)', 'IR-5 (1)']
  },
  'CCI-001628': {
    def: 'The organization defines a frequency with which to review and update the current system maintenance procedures.',
    nist: ['MA-1', 'MA-1.2 (iii)', 'MA-1 b 2']
  },
  'CCI-000854': {
    def: 'The organization reviews and updates the current system maintenance policy in accordance with organization-defined frequency.',
    nist: ['MA-1 a', 'MA-1.2 (ii)', 'MA-1 b 1']
  },
  'CCI-000855': {
    def: 'The organization develops and documents procedures to facilitate the implementation of the system maintenance policy and associated system maintenance controls.',
    nist: ['MA-1 b', 'MA-1.1 (iv and v)', 'MA-1 a 2']
  },
  'CCI-000856': {
    def: 'The organization disseminates to organization-defined personnel or roles procedures to facilitate the implementation of the system maintenance policy and associated system maintenance controls.',
    nist: ['MA-1 b', 'MA-1.1 (vi)', 'MA-1 a 2']
  },
  'CCI-000857': {
    def: 'The organization reviews and updates the current system maintenance procedures in accordance with organization-defined frequency.',
    nist: ['MA-1 b', 'MA-1.2 (iv)', 'MA-1 b 2']
  },
  'CCI-000851': {
    def: 'The organization defines the frequency with which to review and update the current system maintenance policy.',
    nist: ['MA-1', 'MA-1.2 (i)', 'MA-1 b 1']
  },
  'CCI-000852': {
    def: 'The organization develops and documents a system maintenance policy that addresses purpose, scope, roles, responsibilities, management commitment, coordination among organizational entities, and compliance.',
    nist: ['MA-1 a', 'MA-1.1 (i and ii)', 'MA-1 a 1']
  },
  'CCI-000853': {
    def: 'The organization disseminates to organization-defined personnel or roles a system maintenance policy.',
    nist: ['MA-1 a', 'MA-1.1 (iii)', 'MA-1 a 1']
  },
  'CCI-001629': {
    def: 'The organization employs automated mechanisms to produce up-to-date, accurate, complete, and available records of all maintenance and repair actions needed, in process, and complete.',
    nist: ['MA-2 (2)', 'MA-2 (2).1 (ii)']
  },
  'CCI-000858': {
    def: 'The organization schedules, performs, documents, and reviews records of maintenance and repairs on information system components in accordance with manufacturer or vendor specifications and/or organizational requirements.',
    nist: ['MA-2 a', 'MA-2.1 (i)']
  },
  'CCI-000859': {
    def: 'The organization approves and monitors all maintenance activities, whether performed on site or remotely and whether the equipment is serviced on site or removed to another location.',
    nist: ['MA-2 b', 'MA-2.1 (ii)', 'MA-2 b']
  },
  'CCI-000860': {
    def: 'The organization requires that organization-defined personnel or roles explicitly approve the removal of the information system or system components from organizational facilities for off-site maintenance or repairs.',
    nist: ['MA-2 c', 'MA-2.1 (iii)', 'MA-2 c']
  },
  'CCI-000861': {
    def: 'The organization sanitizes equipment to remove all information from associated media prior to removal from organizational facilities for off-site maintenance or repairs.',
    nist: ['MA-2 d', 'MA-2.1 (iv)', 'MA-2 d']
  },
  'CCI-000862': {
    def: 'The organization checks all potentially impacted security controls to verify that the controls are still functioning properly following maintenance or repair actions.',
    nist: ['MA-2 e', 'MA-2.1 (v)', 'MA-2 e']
  },
  'CCI-000863': {
    def: 'The organization maintains maintenance records for the information system that include the date and time of maintenance, the name of the individual performing the maintenance, the name of escort, if necessary, a description of the maintenance performed, and a list of equipment removed or replaced (including identification numbers, if applicable).',
    nist: ['MA-2 (1) (a)(b)(c)(d)(e)', 'MA-2 (1).1']
  },
  'CCI-000864': {
    def: 'The organization employs automated mechanisms to schedule, conduct, and document maintenance and repairs as required.',
    nist: ['MA-2 (2)', 'MA-2 (2).1(i)']
  },
  'CCI-001630': {
    def: 'Designated organizational personnel review the maintenance records of the non-local maintenance and diagnostic sessions.',
    nist: ['MA-4 (1)', 'MA-4 (1).1 (ii)']
  },
  'CCI-001631': {
    def: 'The organization, before removal from organizational facilities, and after the service is performed, inspects and sanitizes the component (with regard to potentially malicious software) before reconnecting the component to the information system.',
    nist: ['MA-4 (3) (b)', 'MA-4 (3).1 (iii)', 'MA-4 (3) (b)']
  },
  'CCI-001632': {
    def: 'The organization protects nonlocal maintenance sessions by separating the maintenance session from other network sessions with the information system by either physically separated communications paths or logically separated communications paths based upon encryption.',
    nist: ['MA-4 (4) (a) (b)', 'MA-4 (4).1 (ii)', 'MA-4 (4) (b)']
  },
  'CCI-000873': {
    def: 'The organization approves nonlocal maintenance and diagnostic activities.',
    nist: ['MA-4 a', 'MA-4.1 (i)', 'MA-4 a']
  },
  'CCI-000874': {
    def: 'The organization monitors nonlocal maintenance and diagnostic activities.',
    nist: ['MA-4 a', 'MA-4.1 (i)', 'MA-4 a']
  },
  'CCI-000875': {
    def: 'The organization controls non-local maintenance and diagnostic activities.',
    nist: ['MA-4 a', 'MA-4.1 (i)']
  },
  'CCI-000876': {
    def: 'The organization allows the use of nonlocal maintenance and diagnostic tools only as consistent with organizational policy and documented in the security plan for the information system.',
    nist: ['MA-4 b', 'MA-4.1 (iii)', 'MA-4 b']
  },
  'CCI-000877': {
    def: 'The organization employs strong authenticators in the establishment of nonlocal maintenance and diagnostic sessions.',
    nist: ['MA-4 c', 'MA-4.1 (iv)', 'MA-4 c']
  },
  'CCI-000878': {
    def: 'The organization maintains records for nonlocal maintenance and diagnostic activities.',
    nist: ['MA-4 d', 'MA-4.1 (v)', 'MA-4 d']
  },
  'CCI-000879': {
    def: 'The organization terminates sessions and network connections when nonlocal maintenance is completed.',
    nist: ['MA-4 e', 'MA-4.1 (vi)', 'MA-4 e']
  },
  'CCI-000880': {
    def: 'The organization audits non-local maintenance and diagnostic sessions.',
    nist: ['MA-4 (1)', 'MA-4 (1).1 (i)']
  },
  'CCI-000881': {
    def: 'The organization documents, in the security plan for the information system, the policies and procedures for the establishment and use of nonlocal maintenance and diagnostic connections.',
    nist: ['MA-4 (2)', 'MA-4 (2).1', 'MA-4 (2)']
  },
  'CCI-000882': {
    def: 'The organization requires that nonlocal maintenance and diagnostic services be performed from an information system that implements a security capability comparable to the capability implemented on the system being serviced.',
    nist: ['MA-4 (3) (a)', 'MA-4 (3).1 (i)', 'MA-4 (3) (a)']
  },
  'CCI-000883': {
    def: 'The organization removes the component to be serviced from the information system and prior to nonlocal maintenance or diagnostic services, sanitizes the component (with regard to organizational information) before removal from organizational facilities.',
    nist: ['MA-4 (3) (b)', 'MA-4 (3).1 (i)', 'MA-4 (3) (b)']
  },
  'CCI-000884': {
    def: 'The organization protects nonlocal maintenance sessions by employing organization-defined authenticators that are replay resistant.',
    nist: ['MA-4 (4)', 'MA-4 (4).1 (i)', 'MA-4 (4) (a)']
  },
  'CCI-000885': {
    def: 'The organization requires that maintenance personnel notify organization-defined personnel when non-local maintenance is planned (i.e., date/time).',
    nist: ['MA-4 (5) (a)', 'MA-4 (5).1 (ii)']
  },
  'CCI-000886': {
    def: 'The organization defines the personnel or roles to be notified of the date and time of planned nonlocal maintenance.',
    nist: ['MA-4 (5) (a)', 'MA-4 (5).1 (ii)', 'MA-4 (5) (b)']
  },
  'CCI-000887': {
    def: 'The organization requires the approval of each nonlocal maintenance session by organization-defined personnel or roles.',
    nist: ['MA-4 (5) (b)', 'MA-4 (5).1 (iii)', 'MA-4 (5) (a)']
  },
  'CCI-000888': {
    def: 'The organization employs cryptographic mechanisms to protect the integrity and confidentiality of non-local maintenance and diagnostic communications.',
    nist: ['MA-4 (6)', 'MA-4 (6).1']
  },
  'CCI-000889': {
    def: 'The organization employs remote disconnect verification at the termination of non-local maintenance and diagnostic sessions.',
    nist: ['MA-4 (7)', 'MA-4 (7).1']
  },
  'CCI-001633': {
    def: 'The organization defines removable media types and information output requiring marking.',
    nist: ['MP-3 a', 'MP-3.1 (i)']
  },
  'CCI-001010': {
    def: 'The organization marks information system media indicating the distribution limitations, handling caveats, and applicable security markings (if any) of the information.',
    nist: ['MP-3 a', 'MP-3.1 (ii)', 'MP-3 a']
  },
  'CCI-001011': {
    def: 'The organization exempts organization-defined types of information system media from marking as long as the media remain within organization-defined controlled areas.',
    nist: ['MP-3 b', 'MP-3.1 (iv)', 'MP-3 b']
  },
  'CCI-001012': {
    def: 'The organization defines types of information system media to exempt from marking as long as the media remain within organization-defined controlled areas.',
    nist: ['MP-3 b', 'MP-3.1 (iii)', 'MP-3 b']
  },
  'CCI-001013': {
    def: 'The organization defines controlled areas where organization-defined types of information system media are exempt from being marked.',
    nist: ['MP-3 b', 'MP-3.1 (iii)', 'MP-3 b']
  },
  'CCI-001634': {
    def: 'The organization identifies authorized personnel with appropriate clearances and access authorizations for gaining physical access to the facility containing an information system that processes classified information.',
    nist: ['PE-2 (3)', 'PE-2 (3).1 (i)']
  },
  'CCI-001635': {
    def: 'The organization removes individuals from the facility access list when access is no longer required.',
    nist: ['PE-2 c', 'PE-2.2 (iii)', 'PE-2 d']
  },
  'CCI-000912': {
    def: 'The organization develops a list of individuals with authorized access to the facility where the information system resides.',
    nist: ['PE-2 a', 'PE-2 (1).1 (i)', 'PE-2 a']
  },
  'CCI-000913': {
    def: 'The organization issues authorization credentials for facility access.',
    nist: ['PE-2 b', 'PE-2.1 (iii)', 'PE-2 b']
  },
  'CCI-000914': {
    def: 'The organization reviews the access list detailing authorized facility access by individuals in accordance with organization-defined frequency.',
    nist: ['PE-2 c', 'PE-2.2 (ii)', 'PE-2 c']
  },
  'CCI-000915': {
    def: 'The organization defines the frequency with which to review the access list detailing authorized facility access by individuals.',
    nist: ['PE-2 c', 'PE-2.2 (i)', 'PE-2 c']
  },
  'CCI-000916': {
    def: 'The organization authorizes physical access to the facility where the information system resides based on position or role.',
    nist: ['PE-2 (1)', 'PE-2 (1).1 (ii)', 'PE-2 (1)']
  },
  'CCI-000917': {
    def: 'The organization requires two forms of identification from an organization-defined list of acceptable forms of identification for visitor access to the facility where the information system resides.',
    nist: ['PE-2 (2)', 'PE-2 (2).1', 'PE-2 (2)']
  },
  'CCI-000918': {
    def: 'The organization restricts physical access to the facility containing an information system that processes classified information to authorized personnel with appropriate clearances and access authorizations.',
    nist: ['PE-2 (3)', 'PE-2 (3).1 (ii)']
  },
  'CCI-001636': {
    def: 'The organization defines the frequency with which to review and update the current security planning policy.',
    nist: ['PL-1', 'PL-1.2 (i)', 'PL-1 b 1']
  },
  'CCI-001637': {
    def: 'The organization reviews and updates the current security planning policy in accordance with organization-defined frequency.',
    nist: ['PL-1 b', 'PL-1.2 (ii)', 'PL-1 b 1']
  },
  'CCI-001638': {
    def: 'The organization defines the frequency with which to review and update the current security planning procedures.',
    nist: ['PL-1 b', 'PL-1.2 (iii)', 'PL-1 b 2']
  },
  'CCI-000563': {
    def: 'The organization develops and documents a security planning policy that addresses purpose, scope, roles, responsibilities, management commitment, coordination among organizational entities, and compliance.',
    nist: ['PL-1 a', 'PL-1.1 (i) (ii)', 'PL-1 a 1']
  },
  'CCI-000564': {
    def: 'The organization disseminates a security planning policy to organization-defined personnel or roles.',
    nist: ['PL-1 a', 'PL-1.1 (iii)', 'PL-1 a 1']
  },
  'CCI-000565': {
    def: 'The organization reviews/updates, per organization-defined frequency, a formal, documented security planning policy.',
    nist: ['PL-1 a', 'PL-1.2 (ii)']
  },
  'CCI-000566': {
    def: 'The organization develops and documents procedures to facilitate the implementation of the security planning policy and associated security planning controls.',
    nist: ['PL-1 b', 'PL-1.1 (iv) (v)', 'PL-1 a 2']
  },
  'CCI-000567': {
    def: 'The organization disseminates security planning procedures to organization-defined personnel or roles.',
    nist: ['PL-1 b', 'PL-1.1 (vi)', 'PL-1 a 2']
  },
  'CCI-000568': {
    def: 'The organization reviews and updates the current security planning procedures in accordance with organization-defined frequency.',
    nist: ['PL-1 b', 'PL-1.2 (iv)', 'PL-1 b 2']
  },
  'CCI-001639': {
    def: 'The organization makes readily available to individuals requiring access to the information system the rules that describe their responsibilities and expected behavior with regard to information and information system usage.',
    nist: ['PL-4 a', 'PL-4.1 (ii)', 'PL-4 a']
  },
  'CCI-000592': {
    def: 'The organization establishes the rules describing the responsibilities and expected behavior, with regard to information and information system usage, for individuals requiring access to the information system.',
    nist: ['PL-4 a', 'PL-4.1 (i)', 'PL-4 a']
  },
  'CCI-000593': {
    def: 'The organization receives a signed acknowledgment from individuals requiring access to the information system, indicating that they have read, understand, and agree to abide by the rules of behavior, before authorizing access to information and the information system.',
    nist: ['PL-4 b', 'PL-4.1 (iii)', 'PL-4 b']
  },
  'CCI-000594': {
    def: 'The organization includes in the rules of behavior explicit restrictions on the use of social media/networking sites.',
    nist: ['PL-4 (1)', 'PL-4 (1).1', 'PL-4 (1)']
  },
  'CCI-000595': {
    def: 'The organization includes in the rules of behavior explicit restrictions on posting organizational information on public websites.',
    nist: ['PL-4 (1)', 'PL-4 (1).1', 'PL-4 (1)']
  },
  'CCI-000596': {
    def: 'The organization includes in the rules of behavior, explicit restrictions on sharing information system account information.',
    nist: ['PL-4 (1)', 'PL-4 (1).1']
  },
  'CCI-001640': {
    def: 'The organization updates the critical infrastructure and key resources protection plan that addresses information security issues.',
    nist: ['PM-8', 'PM-8.1 (ii)', 'PM-8']
  },
  'CCI-000216': {
    def: 'The organization develops and documents a critical infrastructure and key resource protection plan that addresses information security issues.',
    nist: ['PM-8', 'PM-8.1 (I  and  iii)', 'PM-8']
  },
  'CCI-001641': {
    def: 'The organization defines the process for conducting random vulnerability scans on the information system and hosted applications.',
    nist: ['RA-5 a', 'RA-5.1 (i)', 'RA-5 a']
  },
  'CCI-001643': {
    def: 'The organization scans for vulnerabilities in the information system and hosted applications in accordance with the organization-defined process for random scans.',
    nist: ['RA-5 b', 'RA-5.1 (ii)', 'RA-5 a']
  },
  'CCI-001644': {
    def: 'The organization employs vulnerability scanning procedures that can demonstrate the depth of coverage (i.e., vulnerabilities checked).',
    nist: ['RA-5 (3)', 'RA-5 (3).1 (ii)']
  },
  'CCI-001645': {
    def: 'The organization identifies the information system components to which privileged access is authorized for selected organization-defined vulnerability scanning activities.',
    nist: ['RA-5 (5)', 'RA-5 (5).1 (i)', 'RA-5 (5)']
  },
  'CCI-001054': {
    def: 'The organization scans for vulnerabilities in the information system and hosted applications on an organization-defined frequency.',
    nist: ['RA-5 a', 'RA-5.1 (ii)', 'RA-5 a']
  },
  'CCI-001055': {
    def: 'The organization defines a frequency for scanning for vulnerabilities in the information system and hosted applications.',
    nist: ['RA-5 a', 'RA-5.1 (i)', 'RA-5 a']
  },
  'CCI-001056': {
    def: 'The organization scans for vulnerabilities in the information system and hosted applications when new vulnerabilities potentially affecting the system/applications are identified and reported.',
    nist: ['RA-5 a', 'RA-5.1 (iii)', 'RA-5 a']
  },
  'CCI-001057': {
    def: 'The organization employs vulnerability scanning tools and techniques that facilitate interoperability among tools and automate parts of the vulnerability management process by using standards for: enumerating platforms, software flaws, and improper configurations; formatting checklists and test procedures; and measuring vulnerability impact.',
    nist: ['RA-5 b', 'RA-5.1 (iv)', 'RA-5 b']
  },
  'CCI-001058': {
    def: 'The organization analyzes vulnerability scan reports and results from security control assessments.',
    nist: ['RA-5 c', 'RA-5.1 (v)', 'RA-5 c']
  },
  'CCI-001059': {
    def: 'The organization remediates legitimate vulnerabilities in organization-defined response times in accordance with an organizational assessment risk.',
    nist: ['RA-5 d', 'RA-5.2 (ii)', 'RA-5 d']
  },
  'CCI-001060': {
    def: 'The organization defines response times for remediating legitimate vulnerabilities in accordance with an organization assessment of risk.',
    nist: ['RA-5 d', 'RA-5.2 (i)', 'RA-5 d']
  },
  'CCI-001061': {
    def: 'The organization shares information obtained from the vulnerability scanning process and security control assessments with organization-defined personnel or roles to help eliminate similar vulnerabilities in other information systems (i.e., systemic weaknesses or deficiencies).',
    nist: ['RA-5 e', 'RA-5.2 (iii)', 'RA-5 e']
  },
  'CCI-001062': {
    def: 'The organization employs vulnerability scanning tools that include the capability to readily update the information system vulnerabilities to be scanned.',
    nist: ['RA-5 (1)', 'RA-5  (1).1', 'RA-5 (1)']
  },
  'CCI-001063': {
    def: 'The organization updates the information system vulnerabilities scanned on an organization-defined frequency, prior to a new scan, and/or when new vulnerabilities are identified and reported.',
    nist: ['RA-5 (2)', 'RA-5 (2).1 (ii)', 'RA-5 (2)']
  },
  'CCI-001064': {
    def: 'The organization defines a frequency for updating the information system vulnerabilities scanned.',
    nist: ['RA-5 (2)', 'RA-5 (2).1 (i)', 'RA-5 (2)']
  },
  'CCI-001065': {
    def: 'The organization employs vulnerability scanning procedures that can demonstrate the breadth of coverage (i.e., information system components scanned).',
    nist: ['RA-5 (3)', 'RA-5 (3).1 (i)']
  },
  'CCI-001066': {
    def: 'The organization determines what information about the information system is discoverable by adversaries.',
    nist: ['RA-5 (4)', 'RA-5 (4).1', 'RA-5 (4)']
  },
  'CCI-001067': {
    def: 'The information system implements privileged access authorization to organization-identified information system components for selected organization-defined vulnerability scanning activities.',
    nist: ['RA-5 (5)', 'RA-5 (5).1 (ii)', 'RA-5 (5)']
  },
  'CCI-001068': {
    def: 'The organization employs automated mechanisms to compare the results of vulnerability scans over time to determine trends in information system vulnerabilities.',
    nist: ['RA-5 (6)', 'RA-5 (6).1', 'RA-5 (6)']
  },
  'CCI-001069': {
    def: 'The organization employs automated mechanisms to detect the presence of unauthorized software on organizational information systems and notify designated organizational officials in accordance with the organization-defined frequency.',
    nist: ['RA-5 (7)', 'RA-5 (7).1 (ii)']
  },
  'CCI-001070': {
    def: 'The organization defines a frequency for employing automated mechanisms to detect the presence of unauthorized software on organizational information systems and notify designated organizational officials.',
    nist: ['RA-5 (7)', 'RA-5 (7).1 (i)']
  },
  'CCI-001071': {
    def: 'The organization reviews historic audit logs to determine if a vulnerability identified in the information system has been previously exploited.',
    nist: ['RA-5 (8)', 'RA-5 (8).1', 'RA-5 (8)']
  },
  'CCI-001072': {
    def: 'The organization employs an independent penetration agent or penetration team to conduct a vulnerability analysis on the information system.',
    nist: ['RA-5 (9) (a)', 'RA-5 (9).1']
  },
  'CCI-001073': {
    def: 'The organization employs an independent penetration agent or penetration team to perform penetration testing on the information system based on the vulnerability analysis to determine the exploitability of identified vulnerabilities.',
    nist: ['RA-5 (9) (b)', 'RA-5 (9).1']
  },
  'CCI-001642': {
    def: 'The organization defines the organizational document in which risk assessment results are documented (e.g., security plan, risk assessment report).',
    nist: ['RA-3 b', 'RA-3.1 (ii)', 'RA-3 b']
  },
  'CCI-001048': {
    def: 'The organization conducts an assessment of risk of the information system and the information it processes, stores, or transmits that includes the likelihood and magnitude of harm from the unauthorized access, use, disclosure, disruption, modification, or destruction.',
    nist: ['RA-3 a', 'RA-3.1 (i)', 'RA-3 a']
  },
  'CCI-001049': {
    def: 'The organization documents risk assessment results in the organization-defined document.',
    nist: ['RA-3 b', 'RA-3.1 (iii)', 'RA-3 b']
  },
  'CCI-001050': {
    def: 'The organization reviews risk assessment results on an organization-defined frequency.',
    nist: ['RA-3 c', 'RA-3.1 (v)', 'RA-3 c']
  },
  'CCI-001051': {
    def: 'The organization defines a frequency for reviewing risk assessment results.',
    nist: ['RA-3 c', 'RA-3.1 (iv)', 'RA-3 c']
  },
  'CCI-001052': {
    def: 'The organization updates the risk assessment on an organization-defined frequency or whenever there are significant changes to the information system or environment of operation (including the identification of new threats and vulnerabilities), or other conditions that may impact the security state of the system.',
    nist: ['RA-3 d', 'RA-3', 'RA-3 e']
  },
  'CCI-001053': {
    def: 'The organization defines a frequency for updating the risk assessment.',
    nist: ['RA-3 d', 'RA-3', 'RA-3 e']
  },
  'CCI-000608': {
    def: 'The organization includes a determination of information security requirements for the information system in mission process planning.',
    nist: ['SA-2 a', 'SA-2.1 (i)']
  },
  'CCI-000609': {
    def: 'The organization includes a determination of information security requirements for the information system in business process planning.',
    nist: ['SA-2 a', 'SA-2.1 (i)']
  },
  'CCI-000610': {
    def: 'The organization determines the resources required to protect the information system or information system service as part of its capital planning and investment control process.',
    nist: ['SA-2 b', 'SA-2.1 (ii)', 'SA-2 b']
  },
  'CCI-000611': {
    def: 'The organization documents the resources required to protect the information system or information system service as part of its capital planning and investment control process.',
    nist: ['SA-2 b', 'SA-2.1 (ii)', 'SA-2 b']
  },
  'CCI-000612': {
    def: 'The organization allocates the resources required to protect the information system or information system service as part of its capital planning and investment control process.',
    nist: ['SA-2 b', 'SA-2.1 (ii)', 'SA-2 b']
  },
  'CCI-000613': {
    def: 'The organization establishes a discrete line item for information security in organizational programming documentation.',
    nist: ['SA-2 c', 'SA-2.1 (iii)', 'SA-2 c']
  },
  'CCI-000614': {
    def: 'The organization establishes a discrete line item for information security in organizational budgeting documentation.',
    nist: ['SA-2 c', 'SA-2.1 (iii)', 'SA-2 c']
  },
  'CCI-001647': {
    def: 'The organization requires the use of a FIPS-validated, cryptographic module for a technology product that relies on cryptographic functionality to enforce its security policy when no U.S. Government Protection Profile exists for such a specific technology type.',
    nist: ['SA-4 (7) (b)', 'SA-4 (7).1 (iii)']
  },
  'CCI-000619': {
    def: 'The organization includes security functional requirements/specifications, explicitly or by reference, in information system acquisition contracts based on an assessment of risk and in accordance with applicable federal laws, Executive Orders, directives, policies, regulations, and standards.',
    nist: ['SA-4 a', 'SA-4.1']
  },
  'CCI-000620': {
    def: 'The organization includes security-related documentation requirements, explicitly or by reference, in information system acquisition contracts based on an assessment of risk and in accordance with applicable federal laws, Executive Orders, directives, policies, regulations, and standards.',
    nist: ['SA-4 b', 'SA-4.1']
  },
  'CCI-000621': {
    def: 'The organization includes developmental and evaluation-related assurance requirements, explicitly or by reference, in information system acquisition contracts based on an assessment of risk and in accordance with applicable federal laws, Executive Orders, directives, policies, regulations, and standards.',
    nist: ['SA-4 c', 'SA-4.1']
  },
  'CCI-000623': {
    def: 'The organization requires the developer of the information system, system component, or information system service to provide a description of the functional properties of the security controls to be employed.',
    nist: ['SA-4 (1)', 'SA-4 (1).1', 'SA-4 (1)']
  },
  'CCI-000624': {
    def: 'The organization requires in acquisition documents that vendors/contractors provide information describing the design details of the security controls to be employed within the information system, information system components, or information system services (including functional interfaces among control components) in sufficient detail to permit analysis and testing of the controls.',
    nist: ['SA-4 (2)', 'SA-4 (2).1']
  },
  'CCI-000625': {
    def: 'The organization requires in acquisition documents that vendors/contractors provide information describing the implementation details of the security controls to be employed within the information system, information system components, or information system services (including functional interfaces among control components) in sufficient detail to permit analysis and testing of the controls.',
    nist: ['SA-4 (2)', 'SA-4 (2).1']
  },
  'CCI-000626': {
    def: 'The organization requires software vendors/manufacturers to minimize flawed or malformed software by demonstrating that their software development process employs state-of-the-practice software and security engineering methods.',
    nist: ['SA-4 (3)', 'SA-4 (3).1']
  },
  'CCI-000627': {
    def: 'The organization requires software vendors/manufacturers to minimize flawed or malformed software by demonstrating that their software development process employs quality control processes.',
    nist: ['SA-4 (3)', 'SA-4 (3).1']
  },
  'CCI-000628': {
    def: 'The organization requires software vendors/manufacturers to minimize flawed or malformed software by demonstrating that their software development processes employ validation techniques.',
    nist: ['SA-4 (3)', 'SA-4 (3).1']
  },
  'CCI-000629': {
    def: 'The organization ensures each information system component acquired is explicitly assigned to an information system, and that the owner of the system acknowledges this assignment.',
    nist: ['SA-4 (4)', 'SA-4 (4).1 (i) (ii)']
  },
  'CCI-000630': {
    def: 'The organization requires in acquisition documents, that information system components are delivered in a secure, documented configuration, and that the secure configuration is the default configuration for any software reinstalls or upgrades.',
    nist: ['SA-4 (5)', 'SA-4 (5).1 (i) (ii)']
  },
  'CCI-000631': {
    def: 'The organization employs only government off-the-shelf (GOTS) or commercial off-the-shelf (COTS) information assurance (IA) and IA-enabled information technology products that compose an NSA-approved solution to protect classified information when the networks used to transmit the information are at a lower classification level than the information being transmitted.',
    nist: ['SA-4 (6) (a)', 'SA-4 (6).1 (i)', 'SA-4 (6) (a)']
  },
  'CCI-000632': {
    def: 'The organization employs only commercial off-the-shelf (COTS) information assurance (IA) and IA-enabled information technology products that compose an NSA-approved solution to protect classified information when the networks used to transmit the information are at a lower classification level than the information being transmitted.',
    nist: ['SA-4 (6) (a)', 'SA-4 (6).1 (i)']
  },
  'CCI-000633': {
    def: 'The organization ensures that government off-the-shelf (GOTS) or commercial-off-the-shelf(COTS) information assurance (IA) and IA-enabled information technology products have been evaluated and/or validated by the NSA or in accordance with NSA-approved procedures.',
    nist: ['SA-4 (6) (b)', 'SA-4 (6).1 (ii)', 'SA-4 (6) (b)']
  },
  'CCI-000634': {
    def: 'The organization limits the use of commercially provided information assurance (IA) and IA-enabled information technology products to those products that have been successfully evaluated against a National Information Assurance Partnership (NIAP)-approved Protection Profile for a specific technology type, if such a profile exists.',
    nist: ['SA-4 (7) (a)', 'SA-4 (7).1 (i)', 'SA-4 (7) (a)']
  },
  'CCI-000635': {
    def: 'The organization requires, if no NIAP-approved Protection Profile exists for a specific technology type but a commercially provided information technology product relies on cryptographic functionality to enforce its security policy, that the cryptographic module is FIPS-validated.',
    nist: ['SA-4 (7) (b)', 'SA-4 (7).1 (ii)', 'SA-4 (7) (b)']
  },
  'CCI-001648': {
    def: 'The organization makes available to authorized personnel the source code for the information system to permit analysis and testing.',
    nist: ['SA-5 (5)', 'SA-5 (5).1']
  },
  'CCI-000636': {
    def: 'The organization obtains administrator documentation for the information system that describes secure configuration, installation, and operation of the information system; effective use and maintenance of the security features/functions; and known vulnerabilities regarding configuration and use of administrative (i.e., privileged) functions.',
    nist: ['SA-5 a', 'SA-5.1 (i)']
  },
  'CCI-000637': {
    def: 'The organization protects, as required, administrator documentation for the information system that describes secure configuration, installation, and operation of the information system; effective use and maintenance of the security features/functions; and known vulnerabilities regarding configuration and use of administrative (i.e., privileged) functions.',
    nist: ['SA-5 a', 'SA-5.1 (i)']
  },
  'CCI-000638': {
    def: 'The organization makes available to authorized personnel administrator documentation for the information system that describes secure configuration, installation, and operation of the information system; effective use and maintenance of the security features/functions; and known vulnerabilities regarding configuration and use of administrative (i.e., privileged) functions.',
    nist: ['SA-5 a', 'SA-5.1 (i)']
  },
  'CCI-000639': {
    def: 'The organization obtains user documentation for the information system that describes user-accessible security features/functions and how to effectively use those security features/functions; methods for user interaction with the information system, which enables individuals to use the system in a more secure manner; and user responsibilities in maintaining the security of the information and information system.',
    nist: ['SA-5 b', 'SA-5.1 (ii)']
  },
  'CCI-000640': {
    def: 'The organization protects, as required, user documentation for the information system that describes user-accessible security features/functions and how to effectively use those security features/functions; methods for user interaction with the information system, which enables individuals to use the system in a more secure manner; and user responsibilities in maintaining the security of the information and information system.',
    nist: ['SA-5 b', 'SA-5.1 (ii)']
  },
  'CCI-000641': {
    def: 'The organization makes available to authorized personnel user documentation for the information system that describes user-accessible security features/functions and how to effectively use those security features/functions; methods for user interaction with the information system, which enables individuals to use the system in a more secure manner; and user responsibilities in maintaining the security of the information and information system.',
    nist: ['SA-5 b', 'SA-5.1 (ii)']
  },
  'CCI-000642': {
    def: 'The organization documents attempts to obtain information system, system component, or information system service documentation when such documentation is either unavailable or nonexistent.',
    nist: ['SA-5 b', 'SA-5.1 (iii)', 'SA-5 c']
  },
  'CCI-000643': {
    def: 'The organization obtains vendor/manufacturer documentation that describes the functional properties of the security controls employed within the information system with sufficient detail to permit analysis and testing.',
    nist: ['SA-5 (1)', 'SA-5 (1).1 (i) SA-5(2).1 (i)']
  },
  'CCI-000644': {
    def: 'The organization protects, as required, vendor/manufacturer documentation that describes the functional properties of the security controls employed within the information system.',
    nist: ['SA-5 (1)', 'SA-5 (1).1 (i) SA-5(2).1 (i)']
  },
  'CCI-000645': {
    def: 'The organization makes available to authorized personnel vendor/manufacturer documentation that describes the functional properties of the security controls employed within the information system with sufficient detail to permit analysis and testing.',
    nist: ['SA-5 (2)', 'SA-5 (1).1 SA-5(2).1 SA-5(3).1 SA-5(4).1 (i)s']
  },
  'CCI-000646': {
    def: 'The organization obtains vendor/manufacturer documentation that describes the security-relevant external interfaces to the information system with sufficient detail to permit analysis and testing.',
    nist: ['SA-5 (2)', 'SA-5 (1).1 SA-5(2).1 SA-5(3).1 SA-5(4) (ii)s']
  },
  'CCI-000647': {
    def: 'The organization obtains vendor/manufacturer documentation that describes the high-level design of the information system in terms of subsystems and implementation details of the security controls employed within the system with sufficient detail to permit analysis and testing.',
    nist: ['SA-5 (3)', 'SA-5 (3).1 (ii)']
  },
  'CCI-000648': {
    def: 'The organization protects, as required, vendor/manufacturer documentation that describes the high-level design of the information system in terms of subsystems and implementation details of the security controls employed within the system.',
    nist: ['SA-5 (3)', 'SA-5 (3).1 (ii)']
  },
  'CCI-000650': {
    def: 'The organization obtains vendor/manufacturer documentation that describes the low-level design of the information system in terms of modules and implementation details of the security controls employed within the system with sufficient detail to permit analysis and testing.',
    nist: ['SA-5 (4)', 'SA-5 (4).1 (ii)']
  },
  'CCI-000651': {
    def: 'The organization protects, as required, vendor/manufacturer documentation that describes the low-level design of the information system in terms of modules and implementation details of the security controls employed within the system.',
    nist: ['SA-5 (4)', 'SA-5 (4).1 (ii)']
  },
  'CCI-000653': {
    def: 'The organization obtains the source code for the information system to permit analysis and testing.',
    nist: ['SA-5 (5)', 'SA-5 (5).1']
  },
  'CCI-000654': {
    def: 'The organization protects, as required, the source code for the information system to permit analysis and testing.',
    nist: ['SA-5 (5)', 'SA-5 (5).1']
  },
  'CCI-001690': {
    def: 'The organization protects, as required, vendor/manufacturer documentation that describes the security-relevant external interfaces to the information system.',
    nist: ['SA-5 (1)', 'SA-5 (1).1 (i)']
  },
  'CCI-001691': {
    def: 'The organization makes available to authorized personnel vendor/manufacturer documentation that describes the security-relevant external interfaces to the information system with sufficient detail to permit analysis and testing.',
    nist: ['SA-5 (1)', 'SA-5 (1).1 (i)']
  },
  'CCI-001692': {
    def: 'The organization makes available to authorized personnel vendor/manufacturer documentation that describes the low-level design of the information system in terms of modules and implementation details of the security controls employed within the system with sufficient detail to permit analysis and testing.',
    nist: ['SA-5 (4)', 'SA-5 (4).1']
  },
  'CCI-001649': {
    def: 'The organization identifies and documents (as appropriate) explicit rules to be enforced when governing the installation of software by users.',
    nist: ['SA-7', 'SA-7.1 (i)']
  },
  'CCI-000663': {
    def: 'The organization (or information system) enforces explicit rules governing the installation of software by users.',
    nist: ['SA-7', 'SA-7.1 (ii)']
  },
  'CCI-001650': {
    def: 'The organization requires the information system developers to manage and control changes to the information system during development.',
    nist: ['SA-10 (b)', 'SA-10.1 (ii)']
  },
  'CCI-001651': {
    def: 'The organization requires the information system integrators to manage and control changes to the information system during development.',
    nist: ['SA-10 (b)', 'SA-10.1 (ii)']
  },
  'CCI-001652': {
    def: 'The organization requires the information system developers to manage and control changes to the information system during implementation.',
    nist: ['SA-10 (b)', 'SA-10.1 (ii)']
  },
  'CCI-001653': {
    def: 'The organization requires the information system integrators to manage and control changes to the information system during implementation.',
    nist: ['SA-10 (b)', 'SA-10.1 (ii)']
  },
  'CCI-001654': {
    def: 'The organization requires the information system developers to manage and control changes to the information system during modification.',
    nist: ['SA-10 (b)', 'SA-10.1 (ii)']
  },
  'CCI-001655': {
    def: 'The organization requires the information system integrators to manage and control changes to the information system during modification.',
    nist: ['SA-10 (b)', 'SA-10.1 (ii)']
  },
  'CCI-000682': {
    def: 'The organization requires information system developers to perform configuration management during information system design.',
    nist: ['SA-10 (a)', 'SA-10.1 (i)']
  },
  'CCI-000683': {
    def: 'The organization requires information system developers to perform configuration management during information system development.',
    nist: ['SA-10 (a)', 'SA-10.1 (i)']
  },
  'CCI-000684': {
    def: 'The organization requires information system developers to perform configuration management during information system implementation.',
    nist: ['SA-10 (a)', 'SA-10.1 (i)']
  },
  'CCI-000685': {
    def: 'The organization requires information system developers to perform configuration management during information system operation.',
    nist: ['SA-10 (a)', 'SA-10.1 (i)']
  },
  'CCI-000686': {
    def: 'The organization requires information system integrators to perform configuration management during information system design.',
    nist: ['SA-10 (a)', 'SA-10.1 (i)']
  },
  'CCI-000687': {
    def: 'The organization requires information system integrators to perform configuration management during information system development.',
    nist: ['SA-10 (a)', 'SA-10.1 (i)']
  },
  'CCI-000688': {
    def: 'The organization requires information system integrators to perform configuration management during information system implementation.',
    nist: ['SA-10 (a)', 'SA-10.1 (i)']
  },
  'CCI-000689': {
    def: 'The organization requires information system integrators to perform configuration management during information system operation.',
    nist: ['SA-10 (a)', 'SA-10.1 (i)']
  },
  'CCI-000690': {
    def: 'The organization requires information system developers to manage and control changes to the information system during design.',
    nist: ['SA-10 (b)', 'SA-10.1 (ii)']
  },
  'CCI-000691': {
    def: 'The organization requires information system integrators to manage and control changes to the information system during design.',
    nist: ['SA-10 (b)', 'SA-10.1 (ii)']
  },
  'CCI-000692': {
    def: 'The organization requires the developer of the information system, system component, or information system service to implement only organization-approved changes to the system, component, or service.',
    nist: ['SA-10 (c)', 'SA-10.1 (iii)', 'SA-10 c']
  },
  'CCI-000693': {
    def: 'The organization requires information system integrators to implement only organization-approved changes.',
    nist: ['SA-10 (c)', 'SA-10.1 (iii)']
  },
  'CCI-000694': {
    def: 'The organization requires the developer of the information system, system component, or information system service to document approved changes to the system, component, or service.',
    nist: ['SA-10 (d)', 'SA-10.1 (iv)', 'SA-10 d']
  },
  'CCI-000695': {
    def: 'The organization requires information system integrators to document approved changes to the information system.',
    nist: ['SA-10 (d)', 'SA-10.1 (iv)']
  },
  'CCI-000696': {
    def: 'The organization requires that information system developers track security flaws and flaw resolution.',
    nist: ['SA-10 (e)', 'SA-10.1 (v)']
  },
  'CCI-000697': {
    def: 'The organization requires information system integrators to track security flaws and flaw resolution.',
    nist: ['SA-10 (e)', 'SA-10.1 (v)']
  },
  'CCI-000698': {
    def: 'The organization requires the developer of the information system, system component, or information system service to enable integrity verification of software and firmware components.',
    nist: ['SA-10 (1)', 'SA-10 (1).1', 'SA-10 (1)']
  },
  'CCI-000699': {
    def: 'The organization requires information system integrators to provide an integrity check of software to facilitate organizational verification of software integrity after delivery.',
    nist: ['SA-10 (1)', 'SA-10 (1).1']
  },
  'CCI-000700': {
    def: 'The organization provides an alternate configuration management process using organizational personnel in the absence of a dedicated developer configuration management team.',
    nist: ['SA-10 (2)', 'SA-10 (2).1', 'SA-10 (2)']
  },
  'CCI-000701': {
    def: 'The organization provides an alternative configuration management process with organizational personnel in the absence of a dedicated integrator configuration management team.',
    nist: ['SA-10 (2)', 'SA-10 (2).1']
  },
  'CCI-001656': {
    def: 'The organization defines the security functions of the information system to be isolated from nonsecurity functions.',
    nist: ['SC-3', 'SC-3.1 (i)']
  },
  'CCI-001084': {
    def: 'The information system isolates security functions from nonsecurity functions.',
    nist: ['SC-3', 'SC-3.1 (ii)', 'SC-3']
  },
  'CCI-001085': {
    def: 'The information system utilizes underlying hardware separation mechanisms to implement security function isolation.',
    nist: ['SC-3 (1)', 'SC-3 (1).1', 'SC-3 (1)']
  },
  'CCI-001086': {
    def: 'The information system isolates security functions enforcing access and information flow control from both nonsecurity functions and from other security functions.',
    nist: ['SC-3 (2)', 'SC-3 (2).1', 'SC-3 (2)']
  },
  'CCI-001087': {
    def: 'The organization implements an information system isolation boundary to minimize the number of nonsecurity functions included within the boundary containing security functions.',
    nist: ['SC-3 (3)', 'SC-3 (3).1']
  },
  'CCI-001088': {
    def: 'The organization implements security functions as largely independent modules that avoid unnecessary interactions between modules.',
    nist: ['SC-3 (4)', 'SC-3 (4).1']
  },
  'CCI-001089': {
    def: 'The organization implements security functions as a layered structure minimizing interactions between layers of the design and avoiding any dependence by lower layers on the functionality or correctness of higher layers.',
    nist: ['SC-3 (5)', 'SC-3 (5).1', 'SC-3 (5)']
  },
  'CCI-001657': {
    def: 'The organization defines the external boundary of the information system.',
    nist: ['SC-7 a', 'SC-7.1 (i)']
  },
  'CCI-001658': {
    def: 'The organization defines key internal boundaries of the information system.',
    nist: ['SC-7 a', 'SC-7.1 (ii)']
  },
  'CCI-001659': {
    def: "The organization defines the mediation necessary for public access to the organization's internal networks.",
    nist: ['SC-7 (2)', 'SC-7 (2).1 (i)']
  },
  'CCI-001660': {
    def: 'The organization defines the measures to protect against unauthorized physical connections across boundary protections implemented at organization-defined managed interfaces.',
    nist: ['SC-7 (14)', 'SC-7 (14).1 (ii)']
  },
  'CCI-001097': {
    def: 'The information system monitors and controls communications at the external boundary of the information system and at key internal boundaries within the system.',
    nist: ['SC-7 a', 'SC-7.1 (iii)', 'SC-7 a']
  },
  'CCI-001098': {
    def: 'The information system connects to external networks or information systems only through managed interfaces consisting of boundary protection devices arranged in accordance with an organizational security architecture.',
    nist: ['SC-7 b', 'SC-7.1 (iv)', 'SC-7 c']
  },
  'CCI-001099': {
    def: 'The organization physically allocates publicly accessible information system components to separate subnetworks with separate physical network interfaces.',
    nist: ['SC-7 (1)', 'SC-7 (1).1']
  },
  'CCI-001100': {
    def: "The information system prevents public access into the organization's internal networks except as appropriately mediated by managed interfaces employing boundary protection devices.",
    nist: ['SC-7 (2)', 'SC-7 (2).1 (ii)']
  },
  'CCI-001101': {
    def: 'The organization limits the number of external network connections to the information system.',
    nist: ['SC-7 (3)', 'SC-7 (3).1', 'SC-7 (3)']
  },
  'CCI-001102': {
    def: 'The organization implements a managed interface for each external telecommunication service.',
    nist: ['SC-7 (4) (a)', 'SC-7 (4).1 (ii)', 'SC-7 (4) (a)']
  },
  'CCI-001103': {
    def: 'The organization establishes a traffic flow policy for each managed interface for each external telecommunication service.',
    nist: ['SC-7 (4) (b)', 'SC-7 (4).1 (iii)', 'SC-7 (4) (b)']
  },
  'CCI-001104': {
    def: 'The organization employs security controls as needed to protect the confidentiality and integrity of the information being transmitted.',
    nist: ['SC-7 (4) (c)', 'SC-7 (4).1 (iv)']
  },
  'CCI-001105': {
    def: 'The organization documents each exception to the traffic flow policy with a supporting mission/business need and duration of that need for each external telecommunication service.',
    nist: ['SC-7 (4) (d)', 'SC-7 (4).1 (v)', 'SC-7 (4) (d)']
  },
  'CCI-001106': {
    def: 'The organization reviews exceptions to the traffic flow policy on an organization-defined frequency for each external telecommunication service.',
    nist: ['SC-7 (4) (e)', 'SC-7 (4).1 (vi)', 'SC-7 (4) (e)']
  },
  'CCI-001107': {
    def: 'The organization defines a frequency for the review of exceptions to the traffic flow policy for each external telecommunication service.',
    nist: ['SC-7 (4) (e)', 'SC-7 (4).1 (i)', 'SC-7 (4) (e)']
  },
  'CCI-001108': {
    def: 'The organization removes traffic flow policy exceptions that are no longer supported by an explicit mission/business need for each external telecommunication service.',
    nist: ['SC-7 (4) (f)', 'SC-7 (4).1 (vii)', 'SC-7 (4) (e)']
  },
  'CCI-001109': {
    def: 'The information system at managed interfaces denies network communications traffic by default and allows network communications traffic by exception (i.e., deny all, permit by exception).',
    nist: ['SC-7 (5)', 'SC-7 (5).1 (i) (ii)', 'SC-7 (5)']
  },
  'CCI-001110': {
    def: 'The organization prevents the unauthorized release of information outside of the information system boundary or any unauthorized communication through the information system boundary when there is an operational failure of the boundary protection mechanisms.',
    nist: ['SC-7 (6)', 'SC-7 (6).1 (i) (ii)']
  },
  'CCI-001111': {
    def: 'The information system prevents remote devices that have established a non-remote connection with the system from communicating outside of that communications path with resources in external networks.',
    nist: ['SC-7 (7)', 'SC-7 (7).1']
  },
  'CCI-001112': {
    def: 'The information system routes organization-defined internal communications traffic to organization-defined external networks through authenticated proxy servers at managed interfaces.',
    nist: ['SC-7 (8)', 'SC-7 (8).1 (iii)', 'SC-7 (8)']
  },
  'CCI-001113': {
    def: 'The organization defines the internal communications traffic to be routed to external networks.',
    nist: ['SC-7 (8)', 'SC-7 (8).1 (i)', 'SC-7 (8)']
  },
  'CCI-001114': {
    def: 'The organization defines the external networks to which organization-defined internal communications traffic should be routed.',
    nist: ['SC-7 (8)', 'SC-7 (8).1 (ii)', 'SC-7 (8)']
  },
  'CCI-001115': {
    def: 'The information system, at managed interfaces, denies network traffic and audits internal users (or malicious code) posing a threat to external information systems.',
    nist: ['SC-7 (9)', 'SC-7 (9).1 (i) (ii)']
  },
  'CCI-001116': {
    def: 'The organization prevents the unauthorized exfiltration of information across managed interfaces.',
    nist: ['SC-7 (10)', 'SC-7 (10).1', 'SC-7 (10)']
  },
  'CCI-001117': {
    def: 'The information system checks incoming communications to ensure the communications are coming from an authorized source and routed to an authorized destination.',
    nist: ['SC-7 (11)', 'SC-7 (11).1']
  },
  'CCI-001118': {
    def: 'The information system implements host-based boundary protection mechanisms for servers, workstations, and mobile devices.',
    nist: ['SC-7 (12)', 'SC-7 (12).1']
  },
  'CCI-001119': {
    def: 'The organization isolates organization-defined information security tools, mechanisms, and support components from other internal information system components by implementing physically separate subnetworks with managed interfaces to other components of the system.',
    nist: ['SC-7 (13)', 'SC-7 (13).1 (ii)', 'SC-7 (13)']
  },
  'CCI-001120': {
    def: 'The organization defines key information security tools, mechanisms, and support components to be isolated.',
    nist: ['SC-7 (13)', 'SC-7 (13).1 (iii)', 'SC-7 (13)']
  },
  'CCI-001121': {
    def: 'The organization protects against unauthorized physical connections at organization-defined managed interfaces.',
    nist: ['SC-7 (14)', 'SC-7 (14).1 (iii)', 'SC-7 (14)']
  },
  'CCI-001122': {
    def: 'The organization defines the managed interfaces where boundary protections against unauthorized physical connections are to be implemented.',
    nist: ['SC-7 (14)', 'SC-7 (14).1 (i)', 'SC-7 (14)']
  },
  'CCI-001123': {
    def: 'The information system routes all networked, privileged accesses through a dedicated, managed interface for purposes of access control and auditing.',
    nist: ['SC-7 (15)', 'SC-7 (15).1 (i) (ii)', 'SC-7 (15)']
  },
  'CCI-001124': {
    def: 'The information system prevents discovery of specific system components composing a managed interface.',
    nist: ['SC-7 (16)', 'SC-7 (16).1', 'SC-7 (16)']
  },
  'CCI-001125': {
    def: 'The information system enforces adherence to protocol format.',
    nist: ['SC-7 (17)', 'SC-7 (17).1', 'SC-7 (17)']
  },
  'CCI-001126': {
    def: 'The information system fails securely in the event of an operational failure of a boundary protection device.',
    nist: ['SC-7 (18)', 'SC-7 (18)', 'SC-7 (18)']
  },
  'CCI-001661': {
    def: 'The organization defines the security functions, to minimally include information system authentication and re-authentication, within the information system to be included in a trusted communications path.',
    nist: ['SC-11', 'SC-11.1 (i)', 'SC-11']
  },
  'CCI-001135': {
    def: 'The information system establishes a trusted communications path between the user and organization-defined security functions within the information system.',
    nist: ['SC-11', 'SC-11.1 (iii)', 'SC-11']
  },
  'CCI-001136': {
    def: 'The organization defines security functions include information system authentication and reauthentication.',
    nist: ['SC-11', 'SC-11.1 (ii)']
  },
  'CCI-001662': {
    def: 'The information system takes organization-defined corrective action when organization-defined unacceptable mobile code is identified.',
    nist: ['SC-18 (1)', 'SC-18 (1).1 (ii)', 'SC-18 (1)']
  },
  'CCI-001162': {
    def: 'The organization establishes implementation guidance for acceptable mobile code and mobile code technologies.',
    nist: ['SC-18 b', 'SC-18.1 (ii)', 'SC-18 b']
  },
  'CCI-001163': {
    def: 'The organization authorizes the use of mobile code within the information system.',
    nist: ['SC-18 c', 'SC-18.1 (iii)', 'SC-18 c']
  },
  'CCI-001164': {
    def: 'The organization monitors the use of mobile code within the information system.',
    nist: ['SC-18 c', 'SC-18.1 (iii)', 'SC-18 c']
  },
  'CCI-001165': {
    def: 'The organization controls the use of mobile code within the information system.',
    nist: ['SC-18 c', 'SC-18.1 (iii)', 'SC-18 c']
  },
  'CCI-001166': {
    def: 'The information system identifies organization-defined unacceptable mobile code.',
    nist: ['SC-18 (1)', 'SC-18 (1).1 (i)', 'SC-18 (1)']
  },
  'CCI-001167': {
    def: 'The organization ensures the development of mobile code to be deployed in information systems meets organization-defined mobile code requirements.',
    nist: ['SC-18 (2)', 'SC-18 (2).1 (ii)', 'SC-18 (2)']
  },
  'CCI-001168': {
    def: 'The organization defines requirements for the acquisition, development, and use of mobile code.',
    nist: ['SC-18 (2)', 'SC-18 (2).1 (i)', 'SC-18 (2)']
  },
  'CCI-001169': {
    def: 'The information system prevents the download of organization-defined unacceptable mobile code.',
    nist: ['SC-18 (3)', 'SC-18 (3).1', 'SC-18 (3)']
  },
  'CCI-001170': {
    def: 'The information system prevents the automatic execution of mobile code in organization-defined software applications.',
    nist: ['SC-18 (4)', 'SC-18 (4).1 (iii) (iv)', 'SC-18 (4)']
  },
  'CCI-001171': {
    def: 'The organization defines software applications in which automatic mobile code execution is to be prohibited.',
    nist: ['SC-18 (4)', 'SC-18 (4).1 (i)', 'SC-18 (4)']
  },
  'CCI-001172': {
    def: 'The organization defines actions to be enforced by the information system before executing mobile code.',
    nist: ['SC-18 (4)', 'SC-18 (4).1 (ii)', 'SC-18 (4)']
  },
  'CCI-001160': {
    def: 'The organization defines acceptable and unacceptable mobile code and mobile code technologies.',
    nist: ['SC-18 a', 'SC-18.1 (i)', 'SC-18 a']
  },
  'CCI-001161': {
    def: 'The organization establishes usage restrictions for acceptable mobile code and mobile code technologies.',
    nist: ['SC-18 b', 'SC-18.1 (ii)', 'SC-18 b']
  },
  'CCI-001687': {
    def: 'The organization ensures the use of mobile code to be deployed in information systems meets organization-defined mobile code requirements.',
    nist: ['SC-18 (2)', 'SC-18 (2).1 (ii)', 'SC-18 (2)']
  },
  'CCI-001688': {
    def: 'The organization ensures the acquisition of mobile code to be deployed in information systems meets organization-defined mobile code requirements.',
    nist: ['SC-18 (2)', 'SC-18 (2).1 (ii)', 'SC-18 (2)']
  },
  'CCI-001695': {
    def: 'The information system prevents the execution of organization-defined unacceptable mobile code.',
    nist: ['SC-18 (3)', 'SC-18 (3).1', 'SC-18 (3)']
  },
  'CCI-001663': {
    def: 'The information system, when operating as part of a distributed, hierarchical namespace, provides the means to enable verification of a chain of trust among parent and child domains (if the child supports secure resolution services).',
    nist: ['SC-20 (1)', 'SC-20 (1).1 (ii)', 'SC-20 b']
  },
  'CCI-001178': {
    def: 'The information system provides additional data origin authentication artifacts along with the authoritative name resolution data the system returns in response to external name/address resolution queries.',
    nist: ['SC-20', 'SC-20.1', 'SC-20 a']
  },
  'CCI-001179': {
    def: 'The information system, when operating as part of a distributed, hierarchical namespace, provides the means to indicate the security status of child zones.',
    nist: ['SC-20 (1)', 'SC-20 (1).1 (i)', 'SC-20 b']
  },
  'CCI-001664': {
    def: 'The information system recognizes only session identifiers that are system-generated.',
    nist: ['SC-23 (3)', 'SC-23 (3).1 (ii)', 'SC-23 (3)']
  },
  'CCI-001184': {
    def: 'The information system protects the authenticity of communications sessions.',
    nist: ['SC-23', 'SC-23.1', 'SC-23']
  },
  'CCI-001185': {
    def: 'The information system invalidates session identifiers upon user logout or other session termination.',
    nist: ['SC-23 (1)', 'SC-23 (1).1', 'SC-23 (1)']
  },
  'CCI-001186': {
    def: 'The information system provides a readily observable logout capability whenever authentication is used to gain access to web pages.',
    nist: ['SC-23 (2)', 'SC-23 (2).1']
  },
  'CCI-001187': {
    def: 'The information system generates a unique session identifier for each session.',
    nist: ['SC-23 (3)', 'SC-23 (3).1 (i)']
  },
  'CCI-001188': {
    def: 'The information system generates unique session identifiers for each session with organization-defined randomness requirements.',
    nist: ['SC-23 (4)', 'SC-23 (4).1 (ii)', 'SC-23 (3)']
  },
  'CCI-001189': {
    def: 'The organization defines randomness requirements for generating unique session identifiers.',
    nist: ['SC-23 (4)', 'SC-23 (4).1 (i)', 'SC-23 (3)']
  },
  'CCI-001665': {
    def: 'The information system preserves organization-defined system state information in the event of a system failure.',
    nist: ['SC-24', 'SC-24.1 (v)', 'SC-24']
  },
  'CCI-001190': {
    def: 'The information system fails to an organization-defined known-state for organization-defined types of failures.',
    nist: ['SC-24', 'SC-24.1 (iv)', 'SC-24']
  },
  'CCI-001191': {
    def: 'The organization defines the known states the information system should fail to in the event of an organization-defined system failure.',
    nist: ['SC-24', 'SC-24.1 (i)', 'SC-24']
  },
  'CCI-001192': {
    def: 'The organization defines types of failures for which the information system should fail to an organization-defined known state.',
    nist: ['SC-24', 'SC-24.1 (ii)', 'SC-24']
  },
  'CCI-001193': {
    def: 'The organization defines system state information that should be preserved in the event of a system failure.',
    nist: ['SC-24', 'SC-24.1 (iii)', 'SC-24']
  },
  'CCI-001666': {
    def: 'The organization employs cryptographic mechanisms to prevent unauthorized modification of information at rest unless otherwise protected by alternative physical measures.',
    nist: ['SC-28 (1)', 'SC-28 (1).1 (ii)']
  },
  'CCI-001199': {
    def: 'The information system protects the confidentiality and/or integrity of organization-defined information at rest.',
    nist: ['SC-28', 'SC-28.1', 'SC-28']
  },
  'CCI-001200': {
    def: 'The organization employs cryptographic mechanisms to prevent unauthorized disclosure of information at rest unless otherwise protected by alternative physical measures.',
    nist: ['SC-28 (1)', 'SC-28 (1).1 (i)']
  },
  'CCI-001667': {
    def: 'The organization compares the time measured between flaw identification and flaw remediation with organization-defined benchmarks.',
    nist: ['SI-2 (3)', 'SI-2 (3).1 (iii)']
  },
  'CCI-001225': {
    def: 'The organization identifies information system flaws.',
    nist: ['SI-2 a', 'SI-2.1 (i)', 'SI-2 a']
  },
  'CCI-001226': {
    def: 'The organization reports information system flaws.',
    nist: ['SI-2 a', 'SI-2.1 (i)', 'SI-2 a']
  },
  'CCI-001227': {
    def: 'The organization corrects information system flaws.',
    nist: ['SI-2 a', 'SI-2.1 (i)', 'SI-2 a']
  },
  'CCI-001228': {
    def: 'The organization tests software updates related to flaw remediation for effectiveness before installation.',
    nist: ['SI-2 b', 'SI-2.1 (ii)', 'SI-2 b']
  },
  'CCI-001229': {
    def: 'The organization tests software updates related to flaw remediation for potential side effects before installation.',
    nist: ['SI-2 b', 'SI-2.1 (iii)', 'SI-2 b']
  },
  'CCI-001230': {
    def: 'The organization incorporates flaw remediation into the organizational configuration management process.',
    nist: ['SI-2 c', 'SI-2.1 (iv)', 'SI-2 d']
  },
  'CCI-001231': {
    def: 'The organization centrally manages the flaw remediation process.',
    nist: ['SI-2 (1)', 'SI-2 (1).1', 'SI-2 (1)']
  },
  'CCI-001232': {
    def: 'The organization installs software updates automatically.',
    nist: ['SI-2 (1)', 'SI-2 (1).1']
  },
  'CCI-001233': {
    def: 'The organization employs automated mechanisms on an organization-defined frequency to determine the state of information system components with regard to flaw remediation.',
    nist: ['SI-2 (2)', 'SI-2 (2).1 (ii)', 'SI-2 (2)']
  },
  'CCI-001234': {
    def: 'The organization defines a frequency for employing automated mechanisms to determine the state of information system components with regard to flaw remediation.',
    nist: ['SI-2 (2)', 'SI-2 (2).1 (i)', 'SI-2 (2)']
  },
  'CCI-001235': {
    def: 'The organization measures the time between flaw identification and flaw remediation.',
    nist: ['SI-2 (3)', 'SI-2 (3).1 (ii)', 'SI-2 (3) (a)']
  },
  'CCI-001236': {
    def: 'The organization defines benchmarks for the time taken to apply corrective actions after flaw identification.',
    nist: ['SI-2 (3)', 'SI-2 (3).1 (i)', 'SI-2 (3) (b)']
  },
  'CCI-001237': {
    def: 'The organization employs automated patch management tools to facilitate flaw remediation to organization-defined information system components.',
    nist: ['SI-2 (4)', 'SI-2 (4).1 (ii)']
  },
  'CCI-001238': {
    def: 'The organization defines information system components for which automated patch management tools are to be employed to facilitate flaw remediation.',
    nist: ['SI-2 (4)', 'SI-2 (4).1 (i)']
  },
  'CCI-001668': {
    def: 'The organization employs malicious code protection mechanisms at workstations, servers, or mobile computing devices on the network to detect and eradicate malicious code transported by electronic mail, electronic mail attachments, web accesses, removable media, or other common means or inserted through the exploitation of information system vulnerabilities.',
    nist: ['SI-3 a', 'SI-3.1 (ii)']
  },
  'CCI-001669': {
    def: 'The organization defines the frequency of testing malicious code protection mechanisms.',
    nist: ['SI-3 (6)', 'SI-3 (6).1 (i)', 'SI-3 (6) (a)']
  },
  'CCI-001239': {
    def: 'The organization employs malicious code protection mechanisms at information system entry and exit points to detect and eradicate malicious code transported by electronic mail, electronic mail attachments, web accesses, removable media, or other common means or inserted through the exploitation of information system vulnerabilities.',
    nist: ['SI-3 a', 'SI-3.1 (i)']
  },
  'CCI-001240': {
    def: 'The organization updates malicious code protection mechanisms whenever new releases are available in accordance with organizational configuration management policy and procedures.',
    nist: ['SI-3 b', 'SI-3.1 (iii)', 'SI-3 b']
  },
  'CCI-001241': {
    def: 'The organization configures malicious code protection mechanisms to perform periodic scans of the information system on an organization-defined frequency.',
    nist: ['SI-3 c', 'SI-3.1 (vi)', 'SI-3 c 1']
  },
  'CCI-001242': {
    def: 'The organization configures malicious code protection mechanisms to perform real-time scans of files from external sources at endpoints as the files are downloaded, opened, or executed in accordance with organizational security policy.',
    nist: ['SI-3 c', 'SI-3.1 (vi)', 'SI-3 c 1']
  },
  'CCI-001243': {
    def: 'The organization configures malicious code protection mechanisms to perform organization-defined action(s) in response to malicious code detection.',
    nist: ['SI-3 c', 'SI-3.1 (vi)', 'SI-3 c 2']
  },
  'CCI-001244': {
    def: 'The organization defines one or more actions to perform in response to malicious code detection, such as blocking malicious code, quarantining malicious code, or sending alerts to administrators.',
    nist: ['SI-3 c', 'SI-3.1 (v)', 'SI-3 c 2']
  },
  'CCI-001245': {
    def: 'The organization addresses the receipt of false positives during malicious code detection and eradication, and the resulting potential impact on the availability of the information system.',
    nist: ['SI-3 d', 'SI-3.1 (vii)', 'SI-3 d']
  },
  'CCI-001246': {
    def: 'The organization centrally manages malicious code protection mechanisms.',
    nist: ['SI-3 (1)', 'SI-3 (1).1', 'SI-3 (1)']
  },
  'CCI-001247': {
    def: 'The information system automatically updates malicious code protection mechanisms.',
    nist: ['SI-3 (2)', 'SI-3 (2).1', 'SI-3 (2)']
  },
  'CCI-001248': {
    def: 'The information system prevents non-privileged users from circumventing malicious code protection capabilities.',
    nist: ['SI-3 (3)', 'SI-3 (3).1']
  },
  'CCI-001249': {
    def: 'The information system updates malicious code protection mechanisms only when directed by a privileged user.',
    nist: ['SI-3 (4)', 'SI-3 (4).1', 'SI-3 (4)']
  },
  'CCI-001250': {
    def: 'The organization does not allow users to introduce removable media into the information system.',
    nist: ['SI-3 (5)', 'SI-3 (5).1']
  },
  'CCI-001251': {
    def: 'The organization tests malicious code protection mechanisms on an organization-defined frequency by introducing a known benign, non-spreading test case into the information system.',
    nist: ['SI-3 (6)', 'SI-3 (6).1 (ii)', 'SI-3 (6) (a)']
  },
  'CCI-001670': {
    def: 'The information system takes organization-defined least-disruptive actions to terminate suspicious events.',
    nist: ['SI-4 (7)', 'SI-4 (7).1 (iv)', 'SI-4 (7)']
  },
  'CCI-001671': {
    def: 'The organization analyzes outbound communications traffic at selected organization-defined interior points within the system (e.g., subnetworks, subsystems) to discover anomalies.',
    nist: ['SI-4 (11)', 'SI-4 ( 11).1', 'SI-4 (11)']
  },
  'CCI-001672': {
    def: 'The organization employs a wireless intrusion detection system to identify rogue wireless devices.',
    nist: ['SI-4 (14)', 'SI-4 (14).1 (ii)']
  },
  'CCI-001673': {
    def: 'The organization employs a wireless intrusion detection system to identify rogue wireless devices and to detect attack attempts and potential compromises/breaches to the information system.',
    nist: ['SI-4 (14)', 'SI-4 (14).1 (iii)', 'SI-4 (14)']
  },
  'CCI-001252': {
    def: 'The organization monitors events on the information system in accordance with organization-defined monitoring objectives and detects information system attacks.',
    nist: ['SI-4 a', 'SI-4.1 (ii)']
  },
  'CCI-001253': {
    def: 'The organization defines the objectives of monitoring for attacks and indicators of potential attacks on the information system.',
    nist: ['SI-4 a', 'SI-4.1 (i)', 'SI-4 a 1']
  },
  'CCI-001254': {
    def: 'The organization identifies unauthorized use of the information system.',
    nist: ['SI-4 b', 'SI-4.1 (iii)']
  },
  'CCI-001255': {
    def: 'The organization deploys monitoring devices strategically within the information system to collect organization-determined essential information.',
    nist: ['SI-4 c', 'SI-4.1 (iv)', 'SI-4 c']
  },
  'CCI-001256': {
    def: 'The organization deploys monitoring devices at ad hoc locations within the system to track specific types of transactions of interest to the organization.',
    nist: ['SI-4 c', 'SI-4.1 (iv)', 'SI-4 c']
  },
  'CCI-001257': {
    def: 'The organization heightens the level of information system monitoring activity whenever there is an indication of increased risk to organizational operations and assets, individuals, other organizations, or the Nation based on law enforcement information, intelligence information, or other credible sources of information.',
    nist: ['SI-4 d', 'SI-4.1 (v)', 'SI-4 e']
  },
  'CCI-001258': {
    def: 'The organization obtains legal opinion with regard to information system monitoring activities in accordance with applicable federal laws, Executive Orders, directives, policies, or regulations.',
    nist: ['SI-4 e', 'SI-4.1 (vi)', 'SI-4 f']
  },
  'CCI-001259': {
    def: 'The organization interconnects and configures individual intrusion detection tools into a systemwide intrusion detection system using common protocols.',
    nist: ['SI-4 (1)', 'SI-4 (1).1']
  },
  'CCI-001260': {
    def: 'The organization employs automated tools to support near real-time analysis of events.',
    nist: ['SI-4 (2)', 'SI-4 (2).1', 'SI-4 (2)']
  },
  'CCI-001261': {
    def: 'The organization employs automated tools to integrate intrusion detection tools into access control and flow control mechanisms for rapid response to attacks by enabling reconfiguration of these mechanisms in support of attack isolation and elimination.',
    nist: ['SI-4 (3)', 'SI-4 (3).1']
  },
  'CCI-001262': {
    def: 'The information system monitors inbound and outbound communications for unusual or unauthorized activities or conditions.',
    nist: ['SI-4 (4)', 'SI-4']
  },
  'CCI-001263': {
    def: 'The information system provides near real-time alerts when any of the organization-defined list of compromise or potential compromise indicators occurs.',
    nist: ['SI-4 (5)', 'SI-4 (5).1 (ii)']
  },
  'CCI-001264': {
    def: 'The organization defines indicators of compromise or potential compromise to the security of the information system which will result in information system alerts being provided to organization-defined personnel or roles.',
    nist: ['SI-4 (5)', 'SI-4 (5).1 (i)', 'SI-4 (5)']
  },
  'CCI-001265': {
    def: 'The information system prevents non-privileged users from circumventing intrusion detection and prevention capabilities.',
    nist: ['SI-4 (6)', 'SI-4 (6).1']
  },
  'CCI-001266': {
    def: 'The information system notifies an organization-defined list of incident response personnel (identified by name and/or by role) of detected suspicious events.',
    nist: ['SI-4 (7)', 'SI-4 (7).1 (iii)', 'SI-4 (7)']
  },
  'CCI-001267': {
    def: 'The organization defines a list of incident response personnel (identified by name and/or by role) to be notified of detected suspicious events.',
    nist: ['SI-4 (7)', 'SI-4 (7).1 (i)', 'SI-4 (7)']
  },
  'CCI-001268': {
    def: 'The organization defines a list of least-disruptive actions to be taken by the information system to terminate suspicious events.',
    nist: ['SI-4 (7)', 'SI-4 (7).1 (ii)', 'SI-4 (7)']
  },
  'CCI-001269': {
    def: 'The organization protects information obtained from intrusion monitoring tools from unauthorized access, modification, and deletion.',
    nist: ['SI-4 (8)', 'SI-4 (8).1']
  },
  'CCI-001270': {
    def: 'The organization tests intrusion monitoring tools at an organization-defined frequency.',
    nist: ['SI-4 (9)', 'SI-4 (9).1 (ii)', 'SI-4 (9)']
  },
  'CCI-001271': {
    def: 'The organization defines the frequency for testing intrusion monitoring tools.',
    nist: ['SI-4 (9)', 'SI-4 (9).1 (i)', 'SI-4 (9)']
  },
  'CCI-001272': {
    def: 'The organization makes provisions so encrypted traffic is visible to information system monitoring tools.',
    nist: ['SI-4 (10)', 'SI-4 (10).1']
  },
  'CCI-001273': {
    def: 'The organization analyzes outbound communications traffic at the external boundary of the information system to discover anomalies.',
    nist: ['SI-4 (11)', 'SI-4 (11).1', 'SI-4 (11)']
  },
  'CCI-001274': {
    def: 'The organization employs automated mechanisms to alert security personnel of organization-defined inappropriate or unusual activities with security implications.',
    nist: ['SI-4 (12)', 'SI-4 (12).1 (ii)', 'SI-4 (12)']
  },
  'CCI-001275': {
    def: 'The organization defines the activities which will trigger alerts to security personnel of inappropriate or unusual activities.',
    nist: ['SI-4 (12)', 'SI-4 (12).1 (i)', 'SI-4 (12)']
  },
  'CCI-001276': {
    def: 'The organization analyzes communications traffic/event patterns for the information system.',
    nist: ['SI-4 (13) (a)', 'SI-4 (13).1 (i)', 'SI-4 (13) (a)']
  },
  'CCI-001277': {
    def: 'The organization develops profiles representing common traffic patterns and/or events.',
    nist: ['SI-4 (13) (b)', 'SI-4 (13).1 (ii)', 'SI-4 (13) (b)']
  },
  'CCI-001278': {
    def: 'The organization uses the traffic/event profiles in tuning system monitoring devices to reduce the number of false positives to an organization-defined measure of false positives and the number of false negatives to an organization-defined measure of false negatives.',
    nist: ['SI-4 (13) (c)', 'SI-4 (13).1 (iv)']
  },
  'CCI-001279': {
    def: 'The organization defines the respective measurements to which the organization must tune system monitoring devices to reduce the number of false positives.',
    nist: ['SI-4 (13) (c)', 'SI-4 (13).1 (iii)']
  },
  'CCI-001280': {
    def: 'The organization defines the respective measurements to which the organization must tune system monitoring devices to reduce the number of false negatives.',
    nist: ['SI-4 (13) (c)', 'SI-4 (13).1 (iii)']
  },
  'CCI-001281': {
    def: 'The organization employs a wireless intrusion detection system.',
    nist: ['SI-4 (14)', 'SI-4 (14).1 (i)']
  },
  'CCI-001282': {
    def: 'The organization employs an intrusion detection system to monitor wireless communications traffic as the traffic passes from wireless to wireline networks.',
    nist: ['SI-4 (15)', 'SI-4 (15).1', 'SI-4 (15)']
  },
  'CCI-001283': {
    def: 'The organization correlates information from monitoring tools employed throughout the information system.',
    nist: ['SI-4 (16)', 'SI-4 (16).1', 'SI-4 (16)']
  },
  'CCI-001284': {
    def: 'The organization correlates information from monitoring physical, cyber, and supply chain activities to achieve integrated, organization-wide situational awareness.',
    nist: ['SI-4 (17)', 'SI-4 (17).1', 'SI-4 (17)']
  },
  'CCI-001674': {
    def: 'The information system responds to security function anomalies in accordance with organization-defined responses and alternative action(s).',
    nist: ['SI-6', 'SI-6.1 (v)']
  },
  'CCI-001675': {
    def: 'The organization defines the personnel or roles that are to receive reports on the results of security function verification.',
    nist: ['SI-6 (3)', 'SI-6 (3).1 (i)', 'SI-6 (3)']
  },
  'CCI-001676': {
    def: 'The organization defines, for periodic security function verification, the frequency of the verifications.',
    nist: ['SI-6', 'SI-6.1 (ii)']
  },
  'CCI-001291': {
    def: 'The information system verifies the correct operation of security functions in accordance with organization-defined conditions and in accordance with organization-defined frequency (if periodic verification).',
    nist: ['SI-6', 'SI-6.1 (iv)']
  },
  'CCI-001292': {
    def: 'The organization defines the appropriate conditions, including the system transitional states if applicable, for verifying the correct operation of security functions.',
    nist: ['SI-6', 'SI-6.1 (i)']
  },
  'CCI-001293': {
    def: 'The organization defines the information system responses and alternative action(s) to anomalies discovered during security function verification.',
    nist: ['SI-6', 'SI-6.1 (iii)']
  },
  'CCI-001294': {
    def: 'The information system notifies organization-defined personnel or roles of failed security verification tests.',
    nist: ['SI-6 (1)', 'SI-6 (1).1', 'SI-6 c']
  },
  'CCI-001295': {
    def: 'The information system implements automated mechanisms to support the management of distributed security testing.',
    nist: ['SI-6 (2)', 'SI-6 (2).1', 'SI-6 (2)']
  },
  'CCI-001296': {
    def: 'The organization reports the results of security function verification to organization-defined personnel or roles.',
    nist: ['SI-6 (3)', 'SI-6 (3).1 (ii)', 'SI-6 (3)']
  },
  'CCI-001677': {
    def: 'The organization employs spam protection mechanisms at workstations, servers, or mobile computing devices on the network to detect and take action on unsolicited messages transported by electronic mail, electronic mail attachments, web accesses, removable media, or other common means.',
    nist: ['SI-8 a', 'SI-8.1 (ii)']
  },
  'CCI-001305': {
    def: 'The organization employs spam protection mechanisms at information system entry and exit points to detect and take action on unsolicited messages transported by electronic mail, electronic mail attachments, web accesses, removable media, or other common means.',
    nist: ['SI-8 a', 'SI-8.1 (i)']
  },
  'CCI-001306': {
    def: 'The organization updates spam protection mechanisms when new releases are available in accordance with organizational configuration management policy and procedures.',
    nist: ['SI-8 b', 'SI-8.1 (iii)', 'SI-8 b']
  },
  'CCI-001307': {
    def: 'The organization centrally manages spam protection mechanisms.',
    nist: ['SI-8 (1)', 'SI-8 (1).1', 'SI-8 (1)']
  },
  'CCI-001308': {
    def: 'The information system automatically updates spam protection mechanisms.',
    nist: ['SI-8 (2)', 'SI-8 (2).1', 'SI-8 (2)']
  },
  'CCI-001678': {
    def: 'The organization retains information within the information system and information output from the system in accordance with applicable federal laws, Executive Orders, directives, policies, regulations, standards, and operational requirements.',
    nist: ['SI-12', 'SI-12.1 (ii)', 'SI-12']
  },
  'CCI-001315': {
    def: 'The organization handles information within the information system and information output from the system in accordance with applicable federal laws, Executive Orders, directives, policies, regulations, standards, and operational requirements.',
    nist: ['SI-12', 'SI-12.1 (i)', 'SI-12']
  },
  'CCI-001679': {
    def: 'The organization provides a mechanism to exchange active and standby roles of the components.',
    nist: ['SI-13 b', 'SI-13.1 (iv)']
  },
  'CCI-001316': {
    def: 'The organization protects the information system from harm by considering mean time to failure rates for an organization-defined list of information system components in specific environments of operation.',
    nist: ['SI-13 a', 'SI-13.1 (ii)']
  },
  'CCI-001317': {
    def: 'The organization defines a list of information system components for which mean time to failure rates should be considered to protect the information system from harm.',
    nist: ['SI-13 a', 'SI-13.1 (i)']
  },
  'CCI-001318': {
    def: 'The organization provides substitute information system components.',
    nist: ['SI-13 b', 'SI-13.1 (iii)', 'SI-13 b']
  },
  'CCI-001319': {
    def: 'The organization takes information system components out of service by transferring component responsibilities to a substitute component no later than an organization-defined fraction or percentage of mean time to failure (MTTF).',
    nist: ['SI-13 (1)', 'SI-13 (1).1 (ii)', 'SI-13 (1)']
  },
  'CCI-001320': {
    def: 'The organization defines the maximum fraction or percentage of mean time to failure (MTTF) used to determine when information system components are taken out of service by transferring component responsibilities to substitute components.',
    nist: ['SI-13 (1)', 'SI-13 (1).1 (i)', 'SI-13 (1)']
  },
  'CCI-001321': {
    def: 'The organization does not allow a process to execute without supervision for more than an organization-defined time period.',
    nist: ['SI-13 (2)', 'SI-13 (2).1 (ii)', 'SI-7 (16)']
  },
  'CCI-001322': {
    def: 'The organization defines a time period that is the longest a process is allowed to execute without supervision.',
    nist: ['SI-13 (2)', 'SI-13 (2).1 (i)', 'SI-7 (16)']
  },
  'CCI-001323': {
    def: 'The organization manually initiates a transfer between active and standby information system components in accordance with organization-defined frequency if the mean time to failure (MTTF) exceeds an organization-defined time period.',
    nist: ['SI-13 (3)', 'SI-13 (3).1 (iii)', 'SI-13 (3)']
  },
  'CCI-001324': {
    def: 'The organization defines the minimum frequency at which the organization manually initiates a transfer between active and standby information system components if the mean time to failure (MTTF) exceeds the organization-defined time period.',
    nist: ['SI-13 (3)', 'SI-13 (3).1 (i)', 'SI-13 (3)']
  },
  'CCI-001325': {
    def: 'The organization defines a time period that the mean time to failure (MTTF) must exceed before the organization manually initiates a transfer between active and standby information system components.',
    nist: ['SI-13 (3)', 'SI-13 (3).1 (ii)', 'SI-13 (3)']
  },
  'CCI-001326': {
    def: 'The organization, if information system component failures are detected, ensures standby components are successfully and transparently installed within an organization-defined time period.',
    nist: ['SI-13 (4) (a)', 'SI-13 (4).1 (iii)', 'SI-13 (4) (a)']
  },
  'CCI-001327': {
    def: 'The organization defines a time period for a standby information system component to be successfully and transparently installed for the information system component that has failed.',
    nist: ['SI-13 (4) (a)', 'SI-13 (4).1 (i)', 'SI-13 (4) (a)']
  },
  'CCI-001328': {
    def: 'The organization, if an information system component failure is detected, activates an organization-defined alarm and/or automatically shuts down the information system.',
    nist: ['SI-13 (4) (b)', 'SI-13 (4).1 (iii)', 'SI-13 (4) (b)']
  },
  'CCI-001329': {
    def: 'The organization defines the alarm to be activated when an information system component failure is detected.',
    nist: ['SI-13 (4) (b)', 'SI-13 (4).1 (ii)', 'SI-13 (4) (b)']
  },
  'CCI-001689': {
    def: 'The organization, if an information system component failure is detected, automatically shuts down the information system.',
    nist: ['SI-13 (4) (b)', 'SI-13 (4).1 (iii)']
  },
  'CCI-001680': {
    def: 'The organization develops an organization-wide information security program plan that includes the identification and assignment of roles, responsibilities, management commitment, coordination among organizational entities, and compliance.',
    nist: ['PM-1 a', 'PM-1.1 (i)', 'PM-1 a 2']
  },
  'CCI-000023': {
    def: 'The organization develops an organization-wide information security program plan that provides sufficient information about the program management controls and common controls (including specification of parameters for any assignment and selection operations either explicitly or by reference) to enable an implementation that is unambiguously compliant with the intent of the plan, and a determination of the risk to be incurred if the plan is implemented as intended.',
    nist: ['PM-1 a', 'PM-1.1 (i)']
  },
  'CCI-000073': {
    def: 'The organization develops an organization-wide information security program plan that provides an overview of the requirements for the security program and a description of the security program management controls and common controls in place or planned for meeting those requirements.',
    nist: ['PM-1 a', 'PM-1.1 (i)', 'PM-1 a 1']
  },
  'CCI-000074': {
    def: 'The organization develops an organization-wide information security program plan that is approved by a senior official with responsibility and accountability for the risk being incurred to organizational operations (including mission, functions, image, and reputation), organizational assets, individuals, other organizations, and the Nation.',
    nist: ['PM-1 a', 'PM-1.1 (i)', 'PM-1 a 4']
  },
  'CCI-000075': {
    def: 'The organization reviews the organization-wide information security program plan on an organization-defined frequency.',
    nist: ['PM-1 b', 'PM-1.1 (iii)', 'PM-1 b']
  },
  'CCI-000076': {
    def: 'The organization defines the frequency with which to review the organization-wide information security program plan.',
    nist: ['PM-1 b', 'PM-1.1 (ii)', 'PM-1 b']
  },
  'CCI-000077': {
    def: 'The organization updates the plan to address organizational changes and problems identified during plan implementation or security control assessments.',
    nist: ['PM-1 c', 'PM-1.1 (iv)', 'PM-1 c']
  },
  'CCI-001543': {
    def: 'The organization disseminates the most recent information security program plan to appropriate entities in the organization that includes roles, responsibilities, management commitment, coordination among organizational entities, and compliance.',
    nist: ['PM-1 a', 'PM-1.1 (v)']
  },
  'CCI-000021': {
    def: 'The information system enforces dual authorization for organization-defined privileged commands and/or other organization-defined actions.',
    nist: ['AC-3 (2)', 'AC-3 (2).1 (ii)', 'AC-3 (2)']
  },
  'CCI-000022': {
    def: 'The information system enforces one or more organization-defined nondiscretionary access control policies over an organization-defined set of users and resources.',
    nist: ['AC-3 (3) (a)', 'AC-3 (3).1 (iii)']
  },
  'CCI-000024': {
    def: 'The information system prevents access to organization-defined security-relevant information except during secure, non-operable system states.',
    nist: ['AC-3 (5)', 'AC-3 (5).1 (ii)', 'AC-3 (5)']
  },
  'CCI-000213': {
    def: 'The information system enforces approved authorizations for logical access to information and system resources in accordance with applicable access control policies.',
    nist: ['AC-3', 'AC-3.1', 'AC-3']
  },
  'CCI-000214': {
    def: 'The organization establishes a Discretionary Access Control (DAC) policy that limits propagation of access rights.',
    nist: ['AC-3 (4) (b)', 'AC-3 (4).1']
  },
  'CCI-000215': {
    def: 'The organization establishes a Discretionary Access Control (DAC) policy that includes or excludes access to the granularity of a single user.',
    nist: ['AC-3 (4) (c)', 'AC-3 (4).1']
  },
  'CCI-001408': {
    def: 'The organization defines privileged commands for which dual authorization is to be enforced.',
    nist: ['AC-3 (2)', 'AC-3', 'AC-3 (2)']
  },
  'CCI-001409': {
    def: 'The organization defines nondiscretionary access control policies to be enforced over the organization-defined set of users and resources, where the rule set for each policy specifies access control information employed by the policy rule set (e.g., position, nationality, age, project, time of day) and required relationships among the access control information to permit access.',
    nist: ['AC-3 (3)', 'AC-3 (3).1 (ii)']
  },
  'CCI-001410': {
    def: 'The organization defines the set of users and resources over which the information system is to enforce nondiscretionary access control policies.',
    nist: ['AC-3 (3)', 'AC-3 (3).1 (i)']
  },
  'CCI-001411': {
    def: 'The organization defines security-relevant information to which the information system prevents access except during secure, non-operable system states.',
    nist: ['AC-3 (5)', 'AC-3 (5).1 (i)', 'AC-3 (5)']
  },
  'CCI-001412': {
    def: 'The organization encrypts or stores off-line, in a secure location, organization-defined user information.',
    nist: ['AC-3 (6)', 'AC-3 (6).1 (ii)']
  },
  'CCI-001413': {
    def: 'The organization encrypts or stores off-line, in a secure location, organization-defined system information.',
    nist: ['AC-3 (6)', 'AC-3 (6).1 (ii)']
  },
  'CCI-001362': {
    def: 'The information system enforces a Discretionary Access Control (DAC) policy that allows users to specify and control sharing by named individuals or groups of individuals, or by both.',
    nist: ['AC-3 (4)', 'AC-3 (4).1']
  },
  'CCI-001363': {
    def: 'The organization establishes a Discretionary Access Control (DAC) policy that allows users to specify and control sharing by named individuals or groups of individuals, or by both.',
    nist: ['AC-3 (4) (a)', 'AC-3 (4).1']
  },
  'CCI-001366': {
    def: 'The organization defines user information to be encrypted or stored off-line in a secure location.',
    nist: ['AC-3 (6)', 'AC-3 (6).1 (i)']
  },
  'CCI-001367': {
    def: 'The organization defines system information to be encrypted or stored off-line in a secure location.',
    nist: ['AC-3 (6)', 'AC-3 (6).1 (i)']
  },
  'CCI-001693': {
    def: 'The information system enforces a Discretionary Access Control (DAC) policy that limits propagation of access rights.',
    nist: ['AC-3 (4)', 'AC-3 (4).1']
  },
  'CCI-001694': {
    def: 'The information system enforces a Discretionary Access Control (DAC) policy that includes or excludes access to the granularity of a single user.',
    nist: ['AC-3 (4)', 'AC-3 (4).1']
  },
  'CCI-000036': {
    def: 'The organization separates organization-defined duties of individuals.',
    nist: ['AC-5 a', 'AC-5.1 (i)', 'AC-5 a']
  },
  'CCI-000037': {
    def: 'The organization implements separation of duties through assigned information system access authorizations.',
    nist: ['AC-5 c', 'AC-5.1 (iii)']
  },
  'CCI-001380': {
    def: 'The organization documents separation of duties of individuals.',
    nist: ['AC-5 b', 'AC-5.1 (ii)', 'AC-5 b']
  },
  'CCI-000043': {
    def: 'The organization defines the maximum number of consecutive invalid logon attempts to the information system by a user during an organization-defined time period.',
    nist: ['AC-7', 'AC-7.1 (i)', 'AC-7']
  },
  'CCI-000044': {
    def: 'The information system enforces the organization-defined limit of consecutive invalid logon attempts by a user during the organization-defined time period.',
    nist: ['AC-7 a', 'AC-7.1 (ii)', 'AC-7 a']
  },
  'CCI-000045': {
    def: 'The organization defines in the security plan, explicitly or by reference, the time period for lock out mode or delay period.',
    nist: ['AC-7 b', 'AC-7.1 (iii)']
  },
  'CCI-000046': {
    def: 'The organization selects either a lock out mode for the organization-defined time period or delays the next login prompt for the organization-defined delay period for information system responses to consecutive invalid access attempts.',
    nist: ['AC-7 b', 'AC-7.1 (iv)']
  },
  'CCI-000047': {
    def: 'The information system delays next login prompt according to the organization-defined delay algorithm, when the maximum number of unsuccessful attempts is exceeded, automatically locks the account/node for an organization-defined time period or locks the account/node until released by an Administrator IAW organizational policy.',
    nist: ['AC-7 b', 'AC-7.1 (iv)']
  },
  'CCI-001423': {
    def: 'The organization defines the time period in which the organization-defined maximum number of consecutive invalid logon attempts occur.',
    nist: ['AC-7', 'AC-7.1 (i)', 'AC-7']
  },
  'CCI-001452': {
    def: 'The information system enforces the organization-defined time period during which the limit of consecutive invalid access attempts by a user is counted.',
    nist: ['AC-7 a', 'AC-7.1 (ii)']
  },
  'CCI-001382': {
    def: 'The organization defines the number of consecutive, unsuccessful login attempts to the mobile device.',
    nist: ['AC-7 (2)', 'AC-7 (2).1 (i)']
  },
  'CCI-001383': {
    def: 'The information system provides additional protection for mobile devices accessed via login by purging information from the device after an organization-defined number of consecutive, unsuccessful login attempts to the mobile device.',
    nist: ['AC-7 (2)', 'AC-7 (2).1 (i)']
  },
  'CCI-000048': {
    def: 'The information system displays an organization-defined system use notification message or banner before granting access to the system that provides privacy and security notices consistent with applicable federal laws, Executive Orders, directives, policies, regulations, standards, and guidance.',
    nist: ['AC-8 a', 'AC-8.1 (ii)', 'AC-8 a']
  },
  'CCI-000049': {
    def: 'The organization defines a system use notification message or banner displayed before granting access to the system that provides privacy and security notices consistent with applicable federal laws, Executive Orders, directives, policies, regulations, standards, and guidance and states that: (i) users are accessing a U.S. Government information system; (ii) system usage may be monitored, recorded, and subject to audit; (iii) unauthorized use of the system is prohibited and subject to criminal and civil penalties; and (iv) use of the system indicates consent to monitoring and recording.',
    nist: ['AC-8 a', 'AC-8.1 (i)']
  },
  'CCI-000050': {
    def: 'The information system retains the notification message or banner on the screen until users acknowledge the usage conditions and take explicit actions to log on to or further access the information system.',
    nist: ['AC-8 b', 'AC-8.1 (iii)', 'AC-8 b']
  },
  'CCI-000051': {
    def: 'The organization approves the information system use notification message before its use.',
    nist: ['AC-8 a', 'AC-8.1 (i)']
  },
  'CCI-001384': {
    def: 'The information system, for publicly accessible systems, displays system use information organization-defined conditions before granting further access.',
    nist: ['AC-8 c', 'AC-8.2 (i)', 'AC-8 c 1']
  },
  'CCI-001385': {
    def: 'The information system, for publicly accessible systems, displays references, if any, to monitoring that are consistent with privacy accommodations for such systems that generally prohibit those activities.',
    nist: ['AC-8 c', 'AC-8.2 (ii)', 'AC-8 c 2']
  },
  'CCI-001386': {
    def: 'The information system, for publicly accessible systems, displays references, if any, to recording that are consistent with privacy accommodations for such systems that generally prohibit those activities.',
    nist: ['AC-8 c', 'AC-8.2 (ii)', 'AC-8 c 2']
  },
  'CCI-001387': {
    def: 'The information system, for publicly accessible systems, displays references, if any, to auditing that are consistent with privacy accommodations for such systems that generally prohibit those activities.',
    nist: ['AC-8 c', 'AC-8.2 (ii)', 'AC-8 c 2']
  },
  'CCI-001388': {
    def: 'The information system, for publicly accessible systems, includes a description of the authorized uses of the system.',
    nist: ['AC-8 c', 'AC-8.2 (iii)', 'AC-8 c 3']
  },
  'CCI-000052': {
    def: 'The information system notifies the user, upon successful logon (access) to the system, of the date and time of the last logon (access).',
    nist: ['AC-9', 'AC-9.1', 'AC-9']
  },
  'CCI-000053': {
    def: 'The information system notifies the user, upon successful logon/access, of the number of unsuccessful logon/access attempts since the last successful logon/access.',
    nist: ['AC-9 (1)', 'AC-9 (1).1', 'AC-9 (1)']
  },
  'CCI-001389': {
    def: 'The organization defines the time period that the information system notifies the user of the number of successful logon/access attempts.',
    nist: ['AC-9 (2)', 'AC-9 (2).1 (i)', 'AC-9 (2)']
  },
  'CCI-001390': {
    def: 'The organization defines the time period that the information system notifies the user of the number of unsuccessful logon/access attempts.',
    nist: ['AC-9 (2)', 'AC-9 (2).1 (i)', 'AC-9 (2)']
  },
  'CCI-001391': {
    def: 'The information system notifies the user of the number of successful logins/accesses that occur during the organization-defined time period.',
    nist: ['AC-9 (2)', 'AC-9 (2).1 (ii)', 'AC-9 (2)']
  },
  'CCI-001392': {
    def: 'The information system notifies the user of the number of unsuccessful login/access attempts that occur during organization-defined time period.',
    nist: ['AC-9 (2)', 'AC-9 (2).1 (ii)', 'AC-9 (2)']
  },
  'CCI-001393': {
    def: 'The organization defines the security-related characteristics/parameters of the user^s account which, when changed, will result in a notification being provided to the user during the organization-defined time period.',
    nist: ['AC-9 (3)', 'AC-9 (3).1 (ii)', 'AC-9 (3)']
  },
  'CCI-001394': {
    def: 'The organization defines the time period during which organization-defined security-related changes to the user^s account are to be tracked.',
    nist: ['AC-9 (3)', 'AC-9 (3).1 (i)', 'AC-9 (3)']
  },
  'CCI-001395': {
    def: 'The information system notifies the user of changes to organization-defined security-related characteristics/parameters of the user^s account that occur during the organization-defined time period.',
    nist: ['AC-9 (3)', 'AC-9 (3).1 (ii)', 'AC-9 (3)']
  },
  'CCI-000054': {
    def: 'The information system limits the number of concurrent sessions for each organization-defined account and/or account type to an organization-defined number of sessions.',
    nist: ['AC-10', 'AC-10.1 (ii)', 'AC-10']
  },
  'CCI-000055': {
    def: 'The organization defines the maximum number of concurrent sessions to be allowed for each organization-defined account and/or account type.',
    nist: ['AC-10', 'AC-10.1 (i)', 'AC-10']
  },
  'CCI-000056': {
    def: 'The information system retains the session lock until the user reestablishes access using established identification and authentication procedures.',
    nist: ['AC-11 b', 'AC-11.1 (iii)', 'AC-11 b']
  },
  'CCI-000057': {
    def: 'The information system initiates a session lock after the organization-defined time period of inactivity.',
    nist: ['AC-11 a', 'AC-11.1 (ii)', 'AC-11 a']
  },
  'CCI-000058': {
    def: 'The information system provides the capability for users to directly initiate session lock mechanisms.',
    nist: ['AC-11 a', 'AC-11', 'AC-11 a']
  },
  'CCI-000059': {
    def: 'The organization defines the time period of inactivity after which the information system initiates a session lock.',
    nist: ['AC-11 a', 'AC-11.1 (i)', 'AC-11 a']
  },
  'CCI-000060': {
    def: 'The information system conceals, via the session lock, information previously visible on the display with a publicly viewable image.',
    nist: ['AC-11 (1)', 'AC-11 (1).1', 'AC-11 (1)']
  },
  'CCI-000061': {
    def: 'The organization identifies and defines organization-defined user actions that can be performed on the information system without identification or authentication consistent with organizational missions/business functions.',
    nist: ['AC-14 a', 'AC-14.1 (i)', 'AC-14 a']
  },
  'CCI-000062': {
    def: 'The organization permits actions to be performed without identification and authentication only to the extent necessary to accomplish mission/business objectives.',
    nist: ['AC-14 (1)', 'AC-14 (1).1']
  },
  'CCI-000232': {
    def: 'The organization documents and provides supporting rationale in the security plan for the information system, user actions not requiring identification and authentication.',
    nist: ['AC-14 b', 'AC-14.1 (ii)', 'AC-14 b']
  },
  'CCI-000264': {
    def: 'The organization develops a plan of action and milestones for the information system to document the organization^s planned remedial actions to correct weaknesses or deficiencies noted during the assessment of the security controls and to reduce or eliminate known vulnerabilities in the system.',
    nist: ['CA-5 a', 'CA-5-1 (i)  and  (ii)', 'CA-5 a']
  },
  'CCI-000265': {
    def: 'The organization defines the frequency with which to update the existing plan of action and milestones for the information system.',
    nist: ['CA-5 b', 'CA-5-1 (iii)', 'CA-5 b']
  },
  'CCI-000266': {
    def: 'The organization updates, on an organization-defined frequency, the existing plan of action and milestones for the information system based on the findings from security controls assessments, security impact analyses, and continuous monitoring activities.',
    nist: ['CA-5 b', 'CA-5-1 (iv)', 'CA-5 b']
  },
  'CCI-000267': {
    def: 'The organization employs automated mechanisms to help ensure the plan of action and milestones for the information system is accurate.',
    nist: ['CA-5 (1)', 'CA-5 (1).1', 'CA-5 (1)']
  },
  'CCI-000268': {
    def: 'The organization employs automated mechanisms to help ensure the plan of action and milestones for the information system is up to date.',
    nist: ['CA-5 (1)', 'CA-5 (1).1', 'CA-5 (1)']
  },
  'CCI-000269': {
    def: 'The organization employs automated mechanisms to help ensure the plan of action and milestones for the information system is readily available.',
    nist: ['CA-5 (1)', 'CA-5 (1).1', 'CA-5 (1)']
  },
  'CCI-000270': {
    def: 'The organization assigns a senior-level executive or manager as the authorizing official for the information system.',
    nist: ['CA-6 a', 'CA-6.1 (i)', 'CA-6 a']
  },
  'CCI-000271': {
    def: 'The organization ensures the authorizing official authorizes the information system for processing before commencing operations.',
    nist: ['CA-6 b', 'CA-6.1 (ii)', 'CA-6 b']
  },
  'CCI-000272': {
    def: 'The organization updates the security authorization on an organization-defined frequency.',
    nist: ['CA-6 c', 'CA-6.1 (iv)', 'CA-6 c']
  },
  'CCI-000273': {
    def: 'The organization defines the frequency with which to update the security authorization.',
    nist: ['CA-6 c', 'CA-6.1 (iii)', 'CA-6 c']
  },
  'CCI-000082': {
    def: 'The organization establishes usage restrictions for organization-controlled mobile devices.',
    nist: ['AC-19 a', 'AC-19.1 (i)', 'AC-19 a']
  },
  'CCI-000083': {
    def: 'The organization establishes implementation guidance for organization-controlled mobile devices.',
    nist: ['AC-19 a', 'AC-19.1 (i)', 'AC-19 a']
  },
  'CCI-000084': {
    def: 'The organization authorizes connection of mobile devices to organizational information systems.',
    nist: ['AC-19 b', 'AC-19.1 (ii)', 'AC-19 b']
  },
  'CCI-000085': {
    def: 'The organization monitors for unauthorized connections of mobile devices to organizational information systems.',
    nist: ['AC-19 c', 'AC-19.1 (iii)']
  },
  'CCI-000086': {
    def: 'The organization enforces requirements for the connection of mobile devices to organizational information systems.',
    nist: ['AC-19 d', 'AC-19.1 (iv)']
  },
  'CCI-000087': {
    def: 'The organization disables information system functionality that provides the capability for automatic execution of code on mobile devices without user direction.',
    nist: ['AC-19 e', 'AC-19.1 (v)']
  },
  'CCI-000088': {
    def: 'The organization issues specially configured mobile devices to individuals traveling to locations that the organization deems to be of significant risk in accordance with organizational policies and procedures.',
    nist: ['AC-19 f', 'AC-19.1 (vi)']
  },
  'CCI-000089': {
    def: 'The organization applies organization-defined inspection and preventative measures to mobile devices returning from locations that the organization deems to be of significant risk in accordance with organizational policies and procedures.',
    nist: ['AC-19 g', 'AC-19.1 (viii)']
  },
  'CCI-000090': {
    def: 'The organization restricts the use of writable, removable media in organizational information systems.',
    nist: ['AC-19 (1)', 'AC-19 (1).1']
  },
  'CCI-000091': {
    def: 'The organization prohibits the use of personally-owned, removable media in organizational information systems.',
    nist: ['AC-19 (2)', 'AC-19 (2).1']
  },
  'CCI-000092': {
    def: 'The organization prohibits the use of removable media in organizational information systems when the media has no identifiable owner.',
    nist: ['AC-19 (3)', 'AC-19 (3).1']
  },
  'CCI-001456': {
    def: 'The organization defines locations that the organization deems to be of significant risk in accordance with organizational policies and procedures.',
    nist: ['AC-19 f', 'AC-19.1 (vi)']
  },
  'CCI-001457': {
    def: 'The organization defines inspection and preventative measures to be applied on mobile devices returning from locations that the organization deems to be of significant risk in accordance with organizational policies and procedures.',
    nist: ['AC-19 g', 'AC-19.1 (vii)']
  },
  'CCI-001458': {
    def: 'The organization requires that if classified information is found on mobile devices, the incident handling policy be followed.',
    nist: ['AC-19 (4) (b)', 'AC-19 (4).1 (iii)', 'AC-19 (4) (b) (4)']
  },
  'CCI-001330': {
    def: 'The organization prohibits the use of unclassified mobile devices in facilities containing information systems processing, storing, or transmitting classified information unless specifically permitted by the authorizing official.',
    nist: ['AC-19 (4) (a)', 'AC-19 (4).1 (i)', 'AC-19 (4) (a)']
  },
  'CCI-001331': {
    def: 'The organization prohibits connection of unclassified mobile devices to classified information systems.',
    nist: ['AC-19 (4) (b)', 'AC-19 (4).1 (iii)', 'AC-19 (4) (b) (1)']
  },
  'CCI-001332': {
    def: 'The organization requires approval from the authorizing official for the connection of unclassified mobile devices to unclassified information systems.',
    nist: ['AC-19 (4) (b)', 'AC-19 (4).1 (iii)', 'AC-19 (4) (b) (2)']
  },
  'CCI-001333': {
    def: 'The organization prohibits use of internal or external modems or wireless interfaces within unclassified mobile devices in facilities containing information systems processing, storing, or transmitting classified information.',
    nist: ['AC-19 (4) (b)', 'AC-19 (4).1 (iii)', 'AC-19 (4) (b) (3)']
  },
  'CCI-001334': {
    def: 'The organization requires that unclassified mobile devices used in facilities containing information systems processing, storing, or transmitting classified information and the information stored on those devices be subject to random reviews and inspections by organization-defined security officials.',
    nist: ['AC-19 (4) (b)', 'AC-19 (4).1 (iii)', 'AC-19 (4) (b) (4)']
  },
  'CCI-001335': {
    def: 'The organization defines security officials to perform reviews and inspections of unclassified mobile devices in facilities containing information systems processing, storing, or transmitting classified information.',
    nist: ['AC-19 (4) (b)', 'AC-19 (4).1 (ii)', 'AC-19 (4) (b) (4)']
  },
  'CCI-000093': {
    def: 'The organization establishes terms and conditions, consistent with any trust relationships established with other organizations owning, operating, and/or maintaining external information systems, allowing authorized individuals to access the information system from the external information systems.',
    nist: ['AC-20 a', 'AC-20.1', 'AC-20 a']
  },
  'CCI-000094': {
    def: 'The organization establishes terms and conditions, consistent with any trust relationships established with other organizations owning, operating, and/or maintaining external information systems, allowing authorized individuals to process organization-controlled information using the external information systems.',
    nist: ['AC-20 b', 'AC-20.1']
  },
  'CCI-000095': {
    def: 'The organization prohibits authorized individuals from using an external information system to access the information system except in situations where the organization can verify the implementation of required security controls on the external system as specified in the organization^s information security policy and security plan.',
    nist: ['AC-20 (1) (a)', 'AC-20 (1).1']
  },
  'CCI-000096': {
    def: 'The organization prohibits authorized individuals from using an external information system to access the information system or to process, store, or transmit organization-controlled information except in situations where the organization has approved information system connection or processing agreements with the organizational entity hosting the external information system.',
    nist: ['AC-20 (1) (b)', 'AC-20 (1).1']
  },
  'CCI-000097': {
    def: 'The organization restricts or prohibits the use of organization-controlled portable storage devices by authorized individuals on external information systems.',
    nist: ['AC-20 (2)', 'AC-20 (2).1', 'AC-20 (2)']
  },
  'CCI-001465': {
    def: 'The organization establishes terms and conditions, consistent with any trust relationships established with other organizations owning, operating, and/or maintaining external information systems, allowing authorized individuals to store organization-controlled information using the external information systems.',
    nist: ['AC-20 b', 'AC-20.1']
  },
  'CCI-001466': {
    def: 'The organization establishes terms and conditions, consistent with any trust relationships established with other organizations owning, operating, and/or maintaining external information systems, allowing authorized individuals to transmit organization-controlled information using the external information systems.',
    nist: ['AC-20 b', 'AC-20.1']
  },
  'CCI-001467': {
    def: 'The organization prohibits authorized individuals from using an external information system to process organization-controlled information except in situations where the organization can verify the implementation of required security controls on the external system as specified in the organization^s information security policy and security plan.',
    nist: ['AC-20 (1) (a)', 'AC-20 (1).1']
  },
  'CCI-001468': {
    def: 'The organization prohibits authorized individuals from using an external information system to store organization-controlled information except in situations where the organization can verify the implementation of required security controls on the external system as specified in the organization^s information security policy and security plan.',
    nist: ['AC-20 (1) (a)', 'AC-20 (1).1']
  },
  'CCI-001469': {
    def: 'The organization prohibits authorized individuals from using an external information system to transmit organization-controlled information except in situations where the organization can verify the implementation of required security controls on the external system as specified in the organization^s information security policy and security plan.',
    nist: ['AC-20 (1) (a)', 'AC-20 (1).1']
  },
  'CCI-000098': {
    def: 'The organization facilitates information sharing by enabling authorized users to determine whether access authorizations assigned to the sharing partner match the access restrictions on the information for organization-defined information circumstances where user discretion is required.',
    nist: ['AC-21 a', 'AC-21.1 (ii)', 'AC-21 a']
  },
  'CCI-000099': {
    def: 'The information system enforces information-sharing decisions by authorized users based on access authorizations of sharing partners and access restrictions on information to be shared.',
    nist: ['AC-21 (1)', 'AC-21 (1).1', 'AC-21 (1)']
  },
  'CCI-001470': {
    def: 'The organization defines information sharing circumstances where user discretion is required.',
    nist: ['AC-21 a', 'AC-21.1 (i)', 'AC-21 a']
  },
  'CCI-001471': {
    def: 'The organization employs organization-defined automated mechanisms or manual processes required to assist users in making information sharing/collaboration decisions.',
    nist: ['AC-21 b', 'AC-21.1 (iv)', 'AC-21 b']
  },
  'CCI-001472': {
    def: 'The organization defines the automated mechanisms or manual processes required to assist users in making information sharing/collaboration decisions.',
    nist: ['AC-21 b', 'AC-21.1 (iii)', 'AC-21 b']
  },
  'CCI-000106': {
    def: 'The organization provides basic security awareness training to information system users (including managers, senior executives, and contractors) as part of initial training for new users.',
    nist: ['AT-2', 'AT-2.1 (i)', 'AT-2 a']
  },
  'CCI-000107': {
    def: 'The organization includes practical exercises in security awareness training that simulate actual cyber attacks.',
    nist: ['AT-2 (1)', 'AT-2 (1).1', 'AT-2 (1)']
  },
  'CCI-000112': {
    def: 'The organization provides basic security awareness training to information system users (including managers, senior executives, and contractors) when required by information system changes.',
    nist: ['AT-2', 'AT-2.1 (i)', 'AT-2 b']
  },
  'CCI-001479': {
    def: 'The organization provides refresher security awareness training to all information system users (including managers, senior executives, and contractors) in accordance with the organization-defined frequency.',
    nist: ['AT-2', 'AT-2.1 (iii)', 'AT-2 c']
  },
  'CCI-001480': {
    def: 'The organization defines the frequency for providing refresher security awareness training to all information system users (including managers, senior executives, and contractors).',
    nist: ['AT-2', 'AT-2.1 (ii)', 'AT-2']
  },
  'CCI-000113': {
    def: 'The organization documents individual information system security training activities, including basic security awareness training and specific information system security training.',
    nist: ['AT-4 a', 'AT-4.1 (i)', 'AT-4 a']
  },
  'CCI-000114': {
    def: 'The organization monitors individual information system security training activities, including basic security awareness training and specific information system security training.',
    nist: ['AT-4 a', 'AT-4.1 (i)', 'AT-4 a']
  },
  'CCI-001336': {
    def: 'The organization retains individual training records for an organization-defined time period.',
    nist: ['AT-4 b', 'AT-4.1 (iii)', 'AT-4 b']
  },
  'CCI-001337': {
    def: 'The organization defines a time period for retaining individual training records.',
    nist: ['AT-4 b', 'AT-4.1 (ii)', 'AT-4 b']
  },
  'CCI-000115': {
    def: 'The organization establishes contact with selected groups and associations within the security community to facilitate ongoing security education and training; to stay up to date with the latest recommended security practices, techniques, and technologies; and to share current security-related information including threats, vulnerabilities, and incidents.',
    nist: ['AT-5', 'AT-5.1']
  },
  'CCI-000116': {
    def: 'The organization institutionalizes contact with selected groups and associations within the security community to facilitate ongoing security education and training; to stay up to date with the latest recommended security practices, techniques, and technologies; and to share current security-related information including threats, vulnerabilities, and incidents.',
    nist: ['AT-5', 'AT-5.1']
  },
  'CCI-000130': {
    def: 'The information system generates audit records containing information that establishes what type of event occurred.',
    nist: ['AU-3', 'AU-3.1', 'AU-3']
  },
  'CCI-000131': {
    def: 'The information system generates audit records containing information that establishes when an event occurred.',
    nist: ['AU-3', 'AU-3.1', 'AU-3']
  },
  'CCI-000132': {
    def: 'The information system generates audit records containing information that establishes where the event occurred.',
    nist: ['AU-3', 'AU-3.1', 'AU-3']
  },
  'CCI-000133': {
    def: 'The information system generates audit records containing information that establishes the source of the event.',
    nist: ['AU-3', 'AU-3.1', 'AU-3']
  },
  'CCI-000134': {
    def: 'The information system generates audit records containing information that establishes the outcome of the event.',
    nist: ['AU-3', 'AU-3.1', 'AU-3']
  },
  'CCI-000135': {
    def: 'The information system generates audit records containing the organization-defined additional, more detailed information that is to be included in the audit records.',
    nist: ['AU-3 (1)', 'AU-3 (1).1 (ii)', 'AU-3 (1)']
  },
  'CCI-000136': {
    def: 'The organization centrally manages the content of audit records generated by organization-defined information system components.',
    nist: ['AU-3 (2)', 'AU-3 (2).1 (ii)']
  },
  'CCI-001487': {
    def: 'The information system generates audit records containing information that establishes the identity of any individuals or subjects associated with the event.',
    nist: ['AU-3', 'AU-3.1', 'AU-3']
  },
  'CCI-001488': {
    def: 'The organization defines additional, more detailed information to be included in the audit records.',
    nist: ['AU-3 (1)', 'AU-3 (1).1 (i)', 'AU-3 (1)']
  },
  'CCI-001489': {
    def: 'The organization defines information system components for which generated audit records are centrally managed by the organization.',
    nist: ['AU-3 (2)', 'AU-3 (2).1 (i)']
  },
  'CCI-000137': {
    def: 'The organization allocates audit record storage capacity.',
    nist: ['AU-4', 'AU-4.1 (i)']
  },
  'CCI-000138': {
    def: 'The organization configures auditing to reduce the likelihood of storage capacity being exceeded.',
    nist: ['AU-4', 'AU-4.1 (ii)']
  },
  'CCI-000148': {
    def: 'The organization reviews and analyzes information system audit records on an organization-defined frequency for indications of organization-defined inappropriate or unusual activity.',
    nist: ['AU-6 a', 'AU-6.1 (ii)', 'AU-6 a']
  },
  'CCI-000149': {
    def: 'The organization reports any findings to organization-defined personnel or roles for indications of organization-defined inappropriate or unusual activity.',
    nist: ['AU-6 a', 'AU-6.1 (iii)', 'AU-6 b']
  },
  'CCI-000150': {
    def: 'The organization adjusts the level of audit review, analysis, and reporting within the information system when there is a change in risk to organizational operations, organizational assets, individuals, other organizations, or the Nation based on law enforcement information, intelligence information, or other credible sources of information.',
    nist: ['AU-6 b', 'AU-6.2']
  },
  'CCI-000151': {
    def: 'The organization defines the frequency for the review and analysis of information system audit records for organization-defined inappropriate or unusual activity.',
    nist: ['AU-6 a', 'AU-6.1 (i)', 'AU-6 a']
  },
  'CCI-000152': {
    def: 'The information system integrates audit review, analysis, and reporting processes to support organizational processes for investigation and response to suspicious activities.',
    nist: ['AU-6 (1)', 'AU-6 (1).1']
  },
  'CCI-000153': {
    def: 'The organization analyzes and correlates audit records across different repositories to gain organization-wide situational awareness.',
    nist: ['AU-6 (3)', 'AU-6 (3).1', 'AU-6 (3)']
  },
  'CCI-000154': {
    def: 'The information system provides the capability to centrally review and analyze audit records from multiple components within the system.',
    nist: ['AU-6 (4)', 'AU-6 (4).1', 'AU-6 (4)']
  },
  'CCI-000155': {
    def: 'The organization integrates analysis of audit records with analysis of vulnerability scanning information, performance data, and network monitoring information to further enhance the ability to identify inappropriate or unusual activity.',
    nist: ['AU-6 (5)', 'AU-6 (5).1']
  },
  'CCI-001344': {
    def: 'The organization specifies the permitted actions for each authorized information system process, role, and/or user in the audit and accountability policy.',
    nist: ['AU-6 (7)', 'AU-6 (7).1']
  },
  'CCI-001345': {
    def: 'The organization employs automated mechanisms to alert security personnel of any organization-defined inappropriate or unusual activities with security implications.',
    nist: ['AU-6 (8)', 'AU-6 (8).1 (ii)']
  },
  'CCI-001346': {
    def: 'The organization defines a list of inappropriate or unusual activities with security implications that are to result in alerts to security personnel.',
    nist: ['AU-6 (8)', 'AU-6 (8).1 (i)']
  },
  'CCI-001347': {
    def: 'The organization performs, in a physically dedicated information system, full-text analysis of privileged functions executed.',
    nist: ['AU-6 (9)', 'AU-6 (9).1']
  },
  'CCI-001491': {
    def: 'The organization correlates information from audit records with information obtained from monitoring physical access to further enhance the ability to identify suspicious, inappropriate, unusual, or malevolent activity.',
    nist: ['AU-6 (6)', 'AU-6 (6).1', 'AU-6 (6)']
  },
  'CCI-000156': {
    def: 'The information system provides an audit reduction capability.',
    nist: ['AU-7', 'AU-7.1']
  },
  'CCI-000157': {
    def: 'The information system provides a report generation capability.',
    nist: ['AU-7', 'AU-7.1']
  },
  'CCI-000158': {
    def: 'The information system provides the capability to process audit records for events of interest based on organization-defined audit fields within audit records.',
    nist: ['AU-7 (1)', 'AU-7 (1).1', 'AU-7 (1)']
  },
  'CCI-000159': {
    def: 'The information system uses internal system clocks to generate time stamps for audit records.',
    nist: ['AU-8', 'AU-8.1', 'AU-8 a']
  },
  'CCI-000160': {
    def: 'The information system synchronizes internal information system clocks on an organization-defined frequency with an organization-defined authoritative time source.',
    nist: ['AU-8 (1)', 'AU-8 (1).1 (iii)']
  },
  'CCI-000161': {
    def: 'The organization defines the frequency for the synchronization of internal information system clocks.',
    nist: ['AU-8 (1)', 'AU-8 (1).1 (i)', 'AU-8 (1) (a)']
  },
  'CCI-001492': {
    def: 'The organization defines an authoritative time source for the synchronization of internal information system clocks.',
    nist: ['AU-8 (1)', 'AU-8 (1).1 (ii)', 'AU-8 (1) (a)']
  },
  'CCI-000166': {
    def: 'The information system protects against an individual (or process acting on behalf of an individual) falsely denying having performed organization-defined actions to be covered by non-repudiation.',
    nist: ['AU-10', 'AU-10.1', 'AU-10']
  },
  'CCI-001338': {
    def: 'The information system associates the identity of the information producer with the information.',
    nist: ['AU-10 (1)', 'AU-10 (1).1']
  },
  'CCI-001339': {
    def: "The information system validates the binding of the information producer's identity to the information.",
    nist: ['AU-10 (2)', 'AU-10 (2).1']
  },
  'CCI-001340': {
    def: 'The information system maintains reviewer/releaser identity and credentials within the established chain of custody for all information reviewed or released.',
    nist: ['AU-10 (3)', 'AU-10 (3).1', 'AU-10 (3)']
  },
  'CCI-001341': {
    def: 'The information system validates the binding of the information reviewer identity to the information at the transfer or release points prior to release/transfer between organization-defined security domains.',
    nist: ['AU-10 (4)', 'AU-10 (4).1', 'AU-10 (4) (a)']
  },
  'CCI-001342': {
    def: 'The organization employs either FIPS-validated or NSA-approved cryptography to implement digital signatures.',
    nist: ['AU-10 (5)', 'AU-10 (5).1']
  },
  'CCI-001148': {
    def: 'The organization employs FIPS-validated or NSA-approved cryptography to implement digital signatures.',
    nist: ['SC-13 (4)', 'SC-13 (4).1', 'AU-10 (5)', 'AU-10 (5).1 (ii)']
  },
  'CCI-000167': {
    def: 'The organization retains audit records for an organization-defined time period to provide support for after-the-fact investigations of security incidents and to meet regulatory and organizational information retention requirements.',
    nist: ['AU-11', 'AU-11.1 (iii)', 'AU-11']
  },
  'CCI-000168': {
    def: 'The organization defines the time period for retention of audit records, which is consistent with its records retention policy, to provide support for after-the-fact investigations of security incidents and meet regulatory and organizational information retention requirements.',
    nist: ['AU-11', 'AU-11.1 (i and ii)', 'AU-11']
  },
  'CCI-000206': {
    def: 'The information system obscures feedback of authentication information during the authentication process to protect the information from possible exploitation/use by unauthorized individuals.',
    nist: ['IA-6', 'IA-6.1', 'IA-6']
  },
  'CCI-000209': {
    def: 'The organization develops the results of information security measures of performance.',
    nist: ['PM-6', 'PM-6.1 (i)', 'PM-6']
  },
  'CCI-000210': {
    def: 'The organization monitors the results of information security measures of performance.',
    nist: ['PM-6', 'PM-6.1 (ii)', 'PM-6']
  },
  'CCI-000211': {
    def: 'The organization reports on the results of information security measures of performance.',
    nist: ['PM-6', 'PM-6.1 (iii)', 'PM-6']
  },
  'CCI-000212': {
    def: 'The organization develops an enterprise architecture with consideration for information security and the resulting risk to organizational operations, organizational assets, individuals, other organizations, and the Nation.',
    nist: ['PM-7', 'PM-7.1', 'PM-7']
  },
  'CCI-000078': {
    def: 'The organization appoints a senior information security officer with the mission and resources to coordinate, develop, implement, and maintain an organization-wide information security program.',
    nist: ['PM-2', 'PM-2.1 (i and ii)', 'PM-2']
  },
  'CCI-000080': {
    def: 'The organization ensures that all capital planning and investment requests include the resources needed to implement the information security program and documents all exceptions to this requirement.',
    nist: ['PM-3 a', 'PM-3.1 (i and ii)', 'PM-3 a']
  },
  'CCI-000081': {
    def: 'The organization employs a business case/Exhibit 300/Exhibit 53 to record the resources required.',
    nist: ['PM-3 b', 'PM-3.1 (iii)', 'PM-3 b']
  },
  'CCI-000141': {
    def: 'The organization ensures that information security resources are available for expenditure as planned.',
    nist: ['PM-3 c', 'PM-3.1 (iv)', 'PM-3 c']
  },
  'CCI-000142': {
    def: 'The organization implements a process for ensuring that plans of action and milestones for the security program and the associated organizational information systems are maintained.',
    nist: ['PM-4', 'PM-4.1 (i)', 'PM-4 a 1']
  },
  'CCI-000170': {
    def: 'The organization implements a process for ensuring that plans of action and milestones for the security program and associated organizational information systems document the remedial information security actions to adequately respond to risk to organizational operations and assets, individuals, other organizations, and the Nation.',
    nist: ['PM-4', 'PM-4.1 (ii)', 'PM-4 a 2']
  },
  'CCI-000207': {
    def: 'The organization develops and maintains an inventory of its information systems.',
    nist: ['PM-5', 'PM-5.1 (i and ii)', 'PM-5']
  },
  'CCI-000227': {
    def: 'The organization develops a comprehensive strategy to manage risk to organizational operations and assets, individuals, other organizations, and the Nation associated with the operation and use of information systems.',
    nist: ['PM-9 a', 'PM-9.1 (i)', 'PM-9 a']
  },
  'CCI-000228': {
    def: 'The organization implements a comprehensive strategy to manage risk to organization operations and assets, individuals, other organizations, and the Nation associated with the operation and use of information systems consistently across the organization.',
    nist: ['PM-9 b', 'PM-9.1 (ii)', 'PM-9 b']
  },
  'CCI-000229': {
    def: 'The organization documents the security state of organizational information systems and the environments in which those systems operate through security authorization processes.',
    nist: ['PM-10 a', 'PM-10.1 (i)', 'PM-10 a']
  },
  'CCI-000230': {
    def: 'The organization tracks the security state of organizational information systems and the environments in which those systems operate through security authorization processes.',
    nist: ['PM-10 a', 'PM-10.1 (i)', 'PM-10 a']
  },
  'CCI-000231': {
    def: 'The organization reports the security state of organizational information systems and the environments in which those systems operate through security authorization processes.',
    nist: ['PM-10 a', 'PM-10.1 (i)', 'PM-10 a']
  },
  'CCI-000233': {
    def: 'The organization designates individuals to fulfill specific roles and responsibilities within the organizational risk management process.',
    nist: ['PM-10 b', 'PM-10.1 (ii)', 'PM-10 b']
  },
  'CCI-000234': {
    def: 'The organization fully integrates the security authorization processes into an organization-wide risk management program.',
    nist: ['PM-10 c', 'PM-10.1 (iii)', 'PM-10 c']
  },
  'CCI-000235': {
    def: 'The organization defines mission/business processes with consideration for information security and the resulting risk to organizational operations, organizational assets, individuals, other organizations, and the Nation.',
    nist: ['PM-11 a', 'PM-11.1 (i)', 'PM-11 a']
  },
  'CCI-000236': {
    def: 'The organization determines information protection needs arising from the defined mission/business processes and revises the processes as necessary, until an achievable set of protection needs are obtained.',
    nist: ['PM-11 b', 'PM-11.1 (ii)', 'PM-11 b']
  },
  'CCI-001460': {
    def: 'The organization monitors organization-defined open source information and/or information sites per organization-defined frequency for evidence of unauthorized exfiltration or disclosure of organizational information.',
    nist: ['AU-13', 'AU-13.1 (ii)', 'AU-13']
  },
  'CCI-001461': {
    def: 'The organization defines a frequency for monitoring open source information and/or information sites for evidence of unauthorized exfiltration or disclosure of organizational information.',
    nist: ['AU-13', 'AU-13.1 (i)', 'AU-13']
  },
  'CCI-000338': {
    def: 'The organization defines physical access restrictions associated with changes to the information system.',
    nist: ['CM-5', 'CM-5.1', 'CM-5']
  },
  'CCI-000339': {
    def: 'The organization documents physical access restrictions associated with changes to the information system.',
    nist: ['CM-5', 'CM-5.1', 'CM-5']
  },
  'CCI-000340': {
    def: 'The organization approves physical access restrictions associated with changes to the information system.',
    nist: ['CM-5', 'CM-5.1', 'CM-5']
  },
  'CCI-000341': {
    def: 'The organization enforces physical access restrictions associated with changes to the information system.',
    nist: ['CM-5', 'CM-5.1', 'CM-5']
  },
  'CCI-000342': {
    def: 'The organization defines logical access restrictions associated with changes to the information system.',
    nist: ['CM-5', 'CM-5.1', 'CM-5']
  },
  'CCI-000343': {
    def: 'The organization documents logical access restrictions associated with changes to the information system.',
    nist: ['CM-5', 'CM-5.1', 'CM-5']
  },
  'CCI-000344': {
    def: 'The organization approves logical access restrictions associated with changes to the information system.',
    nist: ['CM-5', 'CM-5.1', 'CM-5']
  },
  'CCI-000345': {
    def: 'The organization enforces logical access restrictions associated with changes to the information system.',
    nist: ['CM-5', 'CM-5.1', 'CM-5']
  },
  'CCI-000346': {
    def: 'The organization employs automated mechanisms to enforce access restrictions.',
    nist: ['CM-5 (1)', 'CM-5 (1).1']
  },
  'CCI-000347': {
    def: 'The organization employs automated mechanisms to support auditing of the enforcement actions.',
    nist: ['CM-5 (1)', 'CM-5 (1).1']
  },
  'CCI-000348': {
    def: 'The organization defines a frequency with which to conduct reviews of information system changes.',
    nist: ['CM-5 (2)', 'CM-5 (2).1 (i)', 'CM-5 (2)']
  },
  'CCI-000349': {
    def: 'The organization reviews information system changes per organization-defined frequency to determine whether unauthorized changes have occurred.',
    nist: ['CM-5 (2)', 'CM-5 (2).1 (ii)', 'CM-5 (2)']
  },
  'CCI-000350': {
    def: 'The organization reviews information system changes upon organization-defined circumstances to determine whether unauthorized changes have occurred.',
    nist: ['CM-5 (2)', 'CM-5 (2).1 (ii)', 'CM-5 (2)']
  },
  'CCI-000351': {
    def: 'The organization defines critical software programs that the information system will prevent from being installed if such software programs are not signed with a recognized and approved certificate.',
    nist: ['CM-5 (3)', 'CM-5 (3).1 (i)']
  },
  'CCI-000352': {
    def: 'The information system prevents the installation of organization-defined critical software programs that are not signed with a certificate that is recognized and approved by the organization.',
    nist: ['CM-5 (3)', 'CM-5 (3).1 (ii)']
  },
  'CCI-000353': {
    def: 'The organization defines information system components requiring enforcement of a dual authorization for information system changes.',
    nist: ['CM-5 (4)', 'CM-5 (4).1 (i)', 'CM-5 (4)']
  },
  'CCI-000354': {
    def: 'The organization enforces dual authorization for changes to organization-defined information system components.',
    nist: ['CM-5 (4)', 'CM-5 (4).1 (ii)', 'CM-5 (4)']
  },
  'CCI-000355': {
    def: 'The organization limits information system developer/integrator privileges to change hardware components directly within a production environment.',
    nist: ['CM-5 (5) (a)', 'CM-5 (5).1 (i)']
  },
  'CCI-000356': {
    def: 'The organization limits information system developer/integrator privileges to change software components directly within a production environment.',
    nist: ['CM-5 (5) (a)', 'CM-5 (5).1 (i)']
  },
  'CCI-000357': {
    def: 'The organization limits information system developer/integrator privileges to change firmware components directly within a production environment.',
    nist: ['CM-5 (5) (a)', 'CM-5 (5).1 (i)']
  },
  'CCI-000358': {
    def: 'The organization limits information system developer/integrator privileges to change system information directly within a production environment.',
    nist: ['CM-5 (5) (a)', 'CM-5 (5).1 (i)']
  },
  'CCI-000359': {
    def: 'The organization defines the frequency to review information system developer/integrator privileges.',
    nist: ['CM-5 (5) (b)', 'CM-5 (5).1 (ii)']
  },
  'CCI-000360': {
    def: 'The organization defines the frequency to reevaluate information system developer/integrator privileges.',
    nist: ['CM-5 (5) (b)', 'CM-5 (5).1 (ii)']
  },
  'CCI-000361': {
    def: 'The organization reviews information system developer/integrator privileges per organization-defined frequency.',
    nist: ['CM-5 (5) (b)', 'CM-5 (5).1 (iii)']
  },
  'CCI-000362': {
    def: 'The organization reevaluates information system developer/integrator privileges per organization-defined frequency.',
    nist: ['CM-5 (5) (b)', 'CM-5 (5).1 (iii)']
  },
  'CCI-001499': {
    def: 'The organization limits privileges to change software resident within software libraries.',
    nist: ['CM-5 (6)', 'CM-5 (6).1', 'CM-5 (6)']
  },
  'CCI-001500': {
    def: 'The information system automatically implements organization-defined safeguards and countermeasures if security functions (or mechanisms) are changed inappropriately.',
    nist: ['CM-5 (7)', 'CM-5 (7).1 (ii)']
  },
  'CCI-001501': {
    def: 'The organization defines safeguards and countermeasures to be employed by the information system if security functions (or mechanisms) are changed inappropriately.',
    nist: ['CM-5 (7)', 'CM-5 (7).1 (i)']
  },
  'CCI-000389': {
    def: 'The organization develops an inventory of information system components that accurately reflects the current information system.',
    nist: ['CM-8 a', 'CM-8.1 (ii)', 'CM-8 a 1']
  },
  'CCI-000390': {
    def: 'The organization documents an inventory of information system components that accurately reflects the current information system.',
    nist: ['CM-8 a', 'CM-8.1 (ii)', 'CM-8 a 1']
  },
  'CCI-000391': {
    def: 'The organization maintains an inventory of information system components that accurately reflects the current information system.',
    nist: ['CM-8 a', 'CM-8.1 (ii)']
  },
  'CCI-000392': {
    def: 'The organization develops an inventory of information system components that includes all components within the authorization boundary of the information system.',
    nist: ['CM-8 b', 'CM-8.1 (ii)', 'CM-8 a 2']
  },
  'CCI-000393': {
    def: 'The organization documents an inventory of information system components that includes all components within the authorization boundary of the information system.',
    nist: ['CM-8 b', 'CM-8.1 (ii)', 'CM-8 a 2']
  },
  'CCI-000394': {
    def: 'The organization maintains an inventory of information system components that is consistent with the authorization boundary of the information system.',
    nist: ['CM-8 b', 'CM-8.1 (ii)']
  },
  'CCI-000395': {
    def: 'The organization develops an inventory of information system components that is at the level of granularity deemed necessary for tracking and reporting.',
    nist: ['CM-8 c', 'CM-8.1 (ii)', 'CM-8 a 3']
  },
  'CCI-000396': {
    def: 'The organization documents an inventory of information system components that is at the level of granularity deemed necessary for tracking and reporting.',
    nist: ['CM-8 c', 'CM-8.1 (ii)', 'CM-8 a 3']
  },
  'CCI-000397': {
    def: 'The organization maintains an inventory of information system components that is at the level of granularity deemed necessary for tracking and reporting.',
    nist: ['CM-8 c', 'CM-8.1 (i)']
  },
  'CCI-000398': {
    def: 'The organization defines information deemed necessary to achieve effective information system component accountability.',
    nist: ['CM-8 d', 'CM-8.1 (i)', 'CM-8 a 4']
  },
  'CCI-000399': {
    def: 'The organization develops an inventory of information system components that includes organization-defined information deemed necessary to achieve effective information system component accountability.',
    nist: ['CM-8 d', 'CM-8.1 (ii)', 'CM-8 a 4']
  },
  'CCI-000400': {
    def: 'The organization documents an inventory of information system components that includes organization-defined information deemed necessary to achieve effective information system component accountability.',
    nist: ['CM-8 d', 'CM-8.1 (ii)', 'CM-8 a 4']
  },
  'CCI-000401': {
    def: 'The organization maintains an inventory of information system components that includes organization-defined information deemed necessary to achieve effective property accountability.',
    nist: ['CM-8 d', 'CM-8.1 (ii)']
  },
  'CCI-000402': {
    def: 'The organization develops an inventory of information system components that is available for review by designated organizational officials.',
    nist: ['CM-8 e', 'CM-8.1 (ii)']
  },
  'CCI-000403': {
    def: 'The organization documents an inventory of information system components that is available for review by designated organizational officials.',
    nist: ['CM-8 e', 'CM-8.1 (ii)']
  },
  'CCI-000404': {
    def: 'The organization maintains an inventory of information system components that is available for review by designated organizational officials.',
    nist: ['CM-8 e', 'CM-8.1 (ii)']
  },
  'CCI-000405': {
    def: 'The organization develops an inventory of information system components that is available for audit by designated organizational officials.',
    nist: ['CM-8 e', 'CM-8.1 (ii)']
  },
  'CCI-000406': {
    def: 'The organization documents an inventory of information system components that is available for audit by designated organizational officials.',
    nist: ['CM-8 e', 'CM-8.1 (ii)']
  },
  'CCI-000407': {
    def: 'The organization maintains an inventory of information system components that is available for audit by designated organizational officials.',
    nist: ['CM-8 e', 'CM-8.1 (ii)']
  },
  'CCI-000408': {
    def: 'The organization updates the inventory of information system components as an integral part of component installations.',
    nist: ['CM-8 (1)', 'CM-8 (1).1', 'CM-8 (1)']
  },
  'CCI-000409': {
    def: 'The organization updates the inventory of information system components as an integral part of component removals.',
    nist: ['CM-8 (1)', 'CM-8 (1).1', 'CM-8 (1)']
  },
  'CCI-000410': {
    def: 'The organization updates the inventory of information system components as an integral part of information system updates.',
    nist: ['CM-8 (1)', 'CM-8 (1).1', 'CM-8 (1)']
  },
  'CCI-000411': {
    def: 'The organization employs automated mechanisms to help maintain an up-to-date inventory of information system components.',
    nist: ['CM-8 (2)', 'CM-8 (2).1', 'CM-8 (2)']
  },
  'CCI-000412': {
    def: 'The organization employs automated mechanisms to help maintain a complete inventory of information system components.',
    nist: ['CM-8 (2)', 'CM-8 (2).1', 'CM-8 (2)']
  },
  'CCI-000413': {
    def: 'The organization employs automated mechanisms to help maintain an accurate inventory of information system components.',
    nist: ['CM-8 (2)', 'CM-8 (2).1', 'CM-8 (2)']
  },
  'CCI-000414': {
    def: 'The organization employs automated mechanisms to help maintain a readily available inventory of information system components.',
    nist: ['CM-8 (2)', 'CM-8 (2).1', 'CM-8 (2)']
  },
  'CCI-000415': {
    def: 'The organization defines the frequency of employing automated mechanisms to detect the presence of unauthorized hardware, software, and firmware components within the information system.',
    nist: ['CM-8 (3) (a)', 'CM-8 (3).1 (i)', 'CM-8 (3) (a)']
  },
  'CCI-000416': {
    def: 'The organization employs automated mechanisms, per organization-defined frequency, to detect the presence of unauthorized hardware, software, and firmware components within the information system.',
    nist: ['CM-8 (3) (a)', 'CM-8 (3).1 (ii)', 'CM-8 (3) (a)']
  },
  'CCI-000417': {
    def: 'The organization disables network access by unauthorized components/devices or notifies designated organizational officials.',
    nist: ['CM-8 (3) (b)', 'CM-8 (3).1 (iii)']
  },
  'CCI-000418': {
    def: 'The organization includes, in the information system component inventory information, a means for identifying by name, position, and/or role, individuals responsible/accountable for administering those components.',
    nist: ['CM-8 (4)', 'CM-8 (4).1', 'CM-8 (4)']
  },
  'CCI-000419': {
    def: 'The organization verifies that all components within the authorization boundary of the information system are not duplicated in other information system component inventories.',
    nist: ['CM-8 (5)', 'CM-8 (5).1', 'CM-8 (5)']
  },
  'CCI-000420': {
    def: 'The organization includes assessed component configurations and any approved deviations to current deployed configurations in the information system component inventory.',
    nist: ['CM-8 (6)', 'CM-8 (6).1', 'CM-8 (6)']
  },
  'CCI-000421': {
    def: 'The organization develops a configuration management plan for the information system that addresses roles, responsibilities, and configuration management processes and procedures.',
    nist: ['CM-9 a', 'CM-9.1 (i)', 'CM-9 a']
  },
  'CCI-000422': {
    def: 'The organization documents a configuration management plan for the information system that addresses roles, responsibilities, and configuration management processes and procedures.',
    nist: ['CM-9 a', 'CM-9.1 (i)', 'CM-9 a']
  },
  'CCI-000423': {
    def: 'The organization implements a configuration management plan for the information system that addresses roles, responsibilities, and configuration management processes and procedures.',
    nist: ['CM-9 a', 'CM-9.1 (i)', 'CM-9 a']
  },
  'CCI-000424': {
    def: 'The organization develops a configuration management plan for the information system that defines the configuration items for the information system.',
    nist: ['CM-9 b', 'CM-9.1 (i)', 'CM-9 c']
  },
  'CCI-000425': {
    def: 'The organization documents a configuration management plan for the information system that defines the configuration items for the information system.',
    nist: ['CM-9 b', 'CM-9.1 (i)', 'CM-9 c']
  },
  'CCI-000426': {
    def: 'The organization implements a configuration management plan for the information system that defines the configuration items for the information system.',
    nist: ['CM-9 b', 'CM-9.1 (i)', 'CM-9 c']
  },
  'CCI-000427': {
    def: 'The organization develops a configuration management plan for the information system when in the system development life cycle the configuration items are placed under configuration management.',
    nist: ['CM-9 b', 'CM-9.1 (i)']
  },
  'CCI-000428': {
    def: 'The organization documents a configuration management plan for the information system when in the system development life cycle the configuration items are placed under configuration management.',
    nist: ['CM-9 b', 'CM-9.1 (i)']
  },
  'CCI-000429': {
    def: 'The organization implements a configuration management plan for the information system when in the system development life cycle the configuration items are placed under configuration management.',
    nist: ['CM-9 b', 'CM-9.1 (i)']
  },
  'CCI-000430': {
    def: 'The organization develops a configuration management plan for the information system that establishes the means for identifying configuration items throughout the system development life cycle.',
    nist: ['CM-9 c', 'CM-9.1 (i)']
  },
  'CCI-000431': {
    def: 'The organization documents a configuration management plan for the information system that establishes the means for identifying configuration items throughout the system development life cycle.',
    nist: ['CM-9 c', 'CM-9.1 (i)']
  },
  'CCI-000432': {
    def: 'The organization implements a configuration management plan for the information system that establishes the means for identifying configuration items throughout the system development life cycle.',
    nist: ['CM-9 c', 'CM-9.1 (i)']
  },
  'CCI-000433': {
    def: 'The organization develops a configuration management plan for the information system that establishes a process for managing the configuration of the configuration items.',
    nist: ['CM-9 c', 'CM-9.1 (i)']
  },
  'CCI-000434': {
    def: 'The organization documents a configuration management plan for the information system that establishes a process for managing the configuration of the configuration items.',
    nist: ['CM-9 c', 'CM-9.1 (i)']
  },
  'CCI-000435': {
    def: 'The organization implements a configuration management plan for the information system that establishes a process for managing the configuration of the configuration items.',
    nist: ['CM-9 c', 'CM-9.1 (i)']
  },
  'CCI-000436': {
    def: 'The organization assigns responsibility for developing the configuration management process to organizational personnel that are not directly involved in information system development.',
    nist: ['CM-9 (1)', 'CM-9 (1).1', 'CM-9 (1)']
  },
  'CCI-000485': {
    def: 'The organization defines the frequency of refresher contingency training to information system users.',
    nist: ['CP-3', 'CP-3.1 (ii)', 'CP-3 c']
  },
  'CCI-000486': {
    def: 'The organization provides contingency training to information system users consistent with assigned roles and responsibilities within an organization-defined time period of assuming a contingency role or responsibility.',
    nist: ['CP-3', 'CP-3.1 (i)', 'CP-3 a']
  },
  'CCI-000487': {
    def: 'The organization provides refresher contingency training to information system users consistent with assigned roles and responsibilities in accordance with organization-defined frequency.',
    nist: ['CP-3', 'CP-3.1 (iii)', 'CP-3 c']
  },
  'CCI-000488': {
    def: 'The organization incorporates simulated events into contingency training to facilitate effective response by personnel in crisis situations.',
    nist: ['CP-3 (1)', 'CP-3 (1).1 (i) (ii)', 'CP-3 (1)']
  },
  'CCI-000489': {
    def: 'The organization employs automated mechanisms to provide a more thorough and realistic contingency training environment.',
    nist: ['CP-3 (2)', 'CP-3 (2).1', 'CP-3 (2)']
  },
  'CCI-000490': {
    def: 'The organization defines the frequency with which to test the contingency plan for the information system.',
    nist: ['CP-4', 'CP-4.1 (ii)', 'CP-4 a']
  },
  'CCI-000491': {
    def: 'The organization defines the frequency to exercise the contingency plan for the information system.',
    nist: ['CP-4', 'CP-4.1 (ii)']
  },
  'CCI-000492': {
    def: 'The organization defines contingency plan tests to be conducted for the information system.',
    nist: ['CP-4', 'CP-4.1 (i)', 'CP-4 a']
  },
  'CCI-000493': {
    def: 'The organization defines contingency plan exercises to be conducted for the information system.',
    nist: ['CP-4', 'CP-4.1 (i)']
  },
  'CCI-000494': {
    def: 'The organization tests the contingency plan for the information system in accordance with organization-defined frequency using organization-defined tests to determine the effectiveness of the plan and the organizational readiness to execute the plan.',
    nist: ['CP-4 a', 'CP-4.1 (iii)', 'CP-4 a']
  },
  'CCI-000495': {
    def: 'The organization exercises the contingency plan using organization-defined exercises in accordance with organization-defined frequency.',
    nist: ['CP-4 a', 'CP-4.1 (iii)']
  },
  'CCI-000496': {
    def: 'The organization reviews the contingency plan test results.',
    nist: ['CP-4 b', 'CP-4.1 (iv)', 'CP-4 b']
  },
  'CCI-000497': {
    def: 'The organization initiates corrective actions, if needed, after reviewing the contingency plan test results.',
    nist: ['CP-4 b', 'CP-4.1 (iv)', 'CP-4 c']
  },
  'CCI-000498': {
    def: 'The organization coordinates contingency plan testing with organizational elements responsible for related plans.',
    nist: ['CP-4 (1)', 'CP-4 (1).1', 'CP-4 (1)']
  },
  'CCI-000499': {
    def: 'The organization coordinates contingency plan exercises with organizational elements responsible for related plans.',
    nist: ['CP-4 (1)', 'CP-4 (1).1']
  },
  'CCI-000500': {
    def: 'The organization tests the contingency plan at the alternate processing site to familiarize contingency personnel with the facility and available resources.',
    nist: ['CP-4 (2)', 'CP-4 (2).1', 'CP-4 (2) (a)']
  },
  'CCI-000501': {
    def: 'The organization exercises the contingency plan at the alternate processing site to familiarize contingency personnel with the facility and available resources and to evaluate the site^s capabilities to support contingency operations.',
    nist: ['CP-4 (2)', 'CP-4 (2).1']
  },
  'CCI-000502': {
    def: 'The organization employs automated mechanisms to more thoroughly and effectively test the contingency plan.',
    nist: ['CP-4 (3)', 'CP-4 (3).1', 'CP-4 (3)']
  },
  'CCI-000503': {
    def: 'The organization employs automated mechanisms to more thoroughly and effectively exercise the contingency plan by providing more complete coverage of contingency issues, selecting more realistic exercise scenarios and environments, and more effectively stressing the information and supported missions.',
    nist: ['CP-4 (3)', 'CP-4 (3).1']
  },
  'CCI-000504': {
    def: 'The organization includes a full recovery and reconstitution of the information system to a known state as part of contingency plan testing.',
    nist: ['CP-4 (4)', 'CP-4 (4).1', 'CP-4 (4)4']
  },
  'CCI-000968': {
    def: 'The organization employs an automatic fire suppression capability for the information system when the facility is not staffed on a continuous basis.',
    nist: ['PE-13 (3)', 'PE-13 (3).1', 'PE-13 (3)']
  },
  'CCI-000969': {
    def: 'The organization ensures that the facility undergoes, on an organization-defined frequency, fire marshal inspections and promptly resolves identified deficiencies.',
    nist: ['PE-13 (4)', 'PE-13 (4).1 (ii and iii)']
  },
  'CCI-000970': {
    def: 'The organization defines a frequency for fire marshal inspections.',
    nist: ['PE-13 (4)', 'PE-13 (4).1 (i)']
  },
  'CCI-000965': {
    def: 'The organization employs and maintains fire suppression and detection devices/systems for the information system that are supported by an independent energy source.',
    nist: ['PE-13', 'PE-13.1 (i) (ii)', 'PE-13']
  },
  'CCI-000966': {
    def: 'The organization employs fire detection devices/systems for the information system that activate automatically and notify the organization and emergency responders in the event of a fire.',
    nist: ['PE-13 (1)', 'PE-13 (1).1']
  },
  'CCI-000967': {
    def: 'The organization employs fire suppression devices/systems for the information system that provide automatic notification of any activation to the organization and emergency responders.',
    nist: ['PE-13 (2)', 'PE-13 (2).1']
  },
  'CCI-000971': {
    def: 'The organization maintains temperature and humidity levels within the facility where the information system resides at organization-defined acceptable levels.',
    nist: ['PE-14 a', 'PE-14.1 (ii)', 'PE-14 a']
  },
  'CCI-000972': {
    def: 'The organization defines acceptable temperature and humidity levels to be maintained within the facility where the information system resides.',
    nist: ['PE-14 a', 'PE-14.1 (i)', 'PE-14 a']
  },
  'CCI-000973': {
    def: 'The organization monitors temperature and humidity levels in accordance with organization-defined frequency.',
    nist: ['PE-14 b', 'PE-14.1 (iv)', 'PE-14 b']
  },
  'CCI-000974': {
    def: 'The organization defines a frequency for monitoring temperature and humidity levels.',
    nist: ['PE-14 b', 'PE-14.1 (iii)', 'PE-14 b']
  },
  'CCI-000975': {
    def: 'The organization employs automatic temperature and humidity controls in the facility to prevent fluctuations potentially harmful to the information system.',
    nist: ['PE-14 (1)', 'PE-14 (1).1', 'PE-14 (1)']
  },
  'CCI-000976': {
    def: 'The organization employs temperature and humidity monitoring that provides an alarm or notification of changes potentially harmful to personnel or equipment.',
    nist: ['PE-14 (2)', 'PE-14 (2).1', 'PE-14 (2)']
  },
  'CCI-000977': {
    def: 'The organization protects the information system from damage resulting from water leakage by providing master shutoff or isolation valves that are accessible.',
    nist: ['PE-15', 'PE-15.1 (i)', 'PE-15']
  },
  'CCI-000978': {
    def: 'The organization protects the information system from damage resulting from water leakage by providing master shutoff or isolation valves that are working properly.',
    nist: ['PE-15', 'PE-15.1 (i)', 'PE-15']
  },
  'CCI-000979': {
    def: 'Key personnel have knowledge of the master water shutoff or isolation valves.',
    nist: ['PE-15', 'PE-15.1 (ii)', 'PE-15']
  },
  'CCI-000980': {
    def: 'The organization employs mechanisms that, without the need for manual intervention, protect the information system from water damage in the event of a water leak.',
    nist: ['PE-15 (1)', 'PE-15 (1).1']
  },
  'CCI-001182': {
    def: 'The information systems that collectively provide name/address resolution service for an organization are fault-tolerant.',
    nist: ['SC-22', 'SC-22.1 (i)', 'SC-22']
  },
  'CCI-001183': {
    def: 'The information systems that collectively provide name/address resolution service for an organization implement internal/external role separation.',
    nist: ['SC-22', 'SC-22.1 (ii)', 'SC-22']
  },
  'CCI-001173': {
    def: 'The organization establishes usage restrictions for Voice over Internet Protocol (VoIP) technologies based on the potential to cause damage to the information system if used maliciously.',
    nist: ['SC-19 a', 'SC-19.1 (i)', 'SC-19 a']
  },
  'CCI-001174': {
    def: 'The organization establishes implementation guidance for Voice over Internet Protocol (VoIP) technologies based on the potential to cause damage to the information system if used maliciously.',
    nist: ['SC-19 a', 'SC-19.1 (i)', 'SC-19 a']
  },
  'CCI-001175': {
    def: 'The organization authorizes the use of VoIP within the information system.',
    nist: ['SC-19 b', 'SC-19.1 (ii)', 'SC-19 b']
  },
  'CCI-001176': {
    def: 'The organization monitors the use of VoIP within the information system.',
    nist: ['SC-19 b', 'SC-19.1 (ii)', 'SC-19 b']
  },
  'CCI-001177': {
    def: 'The organization controls the use of VoIP within the information system.',
    nist: ['SC-19 b', 'SC-19.1 (ii)', 'SC-19 b']
  },
  'CCI-000550': {
    def: 'The organization provides for the recovery and reconstitution of the information system to a known state after a disruption.',
    nist: ['CP-10', 'CP-10.1', 'CP-10']
  },
  'CCI-000551': {
    def: 'The organization provides for the recovery and reconstitution of the information system to a known state after a compromise.',
    nist: ['CP-10', 'CP-10.1', 'CP-10']
  },
  'CCI-000552': {
    def: 'The organization provides for the recovery and reconstitution of the information system to a known state after a failure.',
    nist: ['CP-10', 'CP-10.1', 'CP-10']
  },
  'CCI-000553': {
    def: 'The information system implements transaction recovery for systems that are transaction-based.',
    nist: ['CP-10 (2)', 'CP-10 (2).1', 'CP-10 (2)']
  },
  'CCI-000554': {
    def: 'The organization defines in the security plan, explicitly or by reference, the circumstances that can inhibit recovery and reconstitution of the information system to a known state.',
    nist: ['CP-10 (3)', 'CP-10 (3).1 (i)']
  },
  'CCI-000555': {
    def: 'The organization provides compensating security controls for organization-defined circumstances that can inhibit recovery and reconstitution of the information system to a known state.',
    nist: ['CP-10 (3)', 'CP-10 (3).1 (ii)']
  },
  'CCI-000556': {
    def: 'The organization defines restoration time periods within which to restore information system components from configuration-controlled and integrity-protected information representing a known, operational state for the components.',
    nist: ['CP-10 (4)', 'CP-10 (4).1', 'CP-10 (4)']
  },
  'CCI-000557': {
    def: 'The organization provides the capability to restore information system components within organization-defined restoration time periods from configuration-controlled and integrity-protected information representing a known, operational state for the components.',
    nist: ['CP-10 (4)', 'CP-10 (4).1', 'CP-10 (4)']
  },
  'CCI-000558': {
    def: 'The organization defines the real-time or near-real-time failover capability to be provided for the information system.',
    nist: ['CP-10 (5)', 'CP-10 (5).1 (i)', 'SI-13 (5)']
  },
  'CCI-000559': {
    def: 'The organization provides real-time or near-real-time organization-defined failover capability for the information system.',
    nist: ['CP-10 (5)', 'CP-10 (5).1 (ii)', 'SI-13 (5)']
  },
  'CCI-000560': {
    def: 'The organization protects backup and restoration hardware.',
    nist: ['CP-10 (6)', 'CP-10 (6).1', 'CP-10 (6)']
  },
  'CCI-000561': {
    def: 'The organization protects backup and restoration firmware.',
    nist: ['CP-10 (6)', 'CP-10 (6).1', 'CP-10 (6)']
  },
  'CCI-000562': {
    def: 'The organization protects backup and restoration software.',
    nist: ['CP-10 (6)', 'CP-10 (6).1', 'CP-10 (6)']
  },
  'CCI-000570': {
    def: 'The organization develops a security plan for the information system that is consistent with the organization^s enterprise architecture; explicitly defines the authorization boundary for the system; describes the operational context of the information system in terms of mission and business processes; provides the security category and impact level of the information system, including supporting rationale; describes the operational environment for the information system; describes relationships with, or connections to, other information systems; provides an overview of the security requirements for the system; and describes the security controls in place or planned for meeting those requirements, including a rationale for the tailoring and supplemental decisions.',
    nist: ['PL-2 a', 'PL-2.1 (i)']
  },
  'CCI-000571': {
    def: 'The organization^s security plan for the information system is reviewed and approved by the authorizing official or designated representative prior to plan implementation.',
    nist: ['PL-2 a', 'PL-2.1 (i)', 'PL-2 a 9']
  },
  'CCI-000572': {
    def: 'The organization defines the frequency for reviewing the security plan for the information system.',
    nist: ['PL-2 b', 'PL-2.1 (ii)', 'PL-2 c']
  },
  'CCI-000573': {
    def: 'The organization reviews the security plan for the information system in accordance with organization-defined frequency.',
    nist: ['PL-2 b', 'PL-2.1 (iii)', 'PL-2 c']
  },
  'CCI-000574': {
    def: 'The organization updates the plan to address changes to the information system/environment of operation or problems identified during plan implementation or security control assessments.',
    nist: ['PL-2 c', 'PL-2.1 (iv)', 'PL-2 d']
  },
  'CCI-000576': {
    def: 'The organization develops a security Concept of Operations (CONOPS) for the information system containing, at a minimum: the purpose of the system; a description of the system architecture; the security authorization schedule; and the security categorization and associated factors considered in determining the categorization.',
    nist: ['PL-2 (1) (a)', 'PL-2 (1).1 (i) (ii) (iii) (iv) (v)']
  },
  'CCI-000577': {
    def: 'The organization defines the frequency with which to review and update the security CONOPS.',
    nist: ['PL-2 (1) (b)', 'PL-2 (1).1 (iii)', 'PL-7 b']
  },
  'CCI-000578': {
    def: 'The organization reviews and updates the security CONOPS in accordance with organization-defined frequency.',
    nist: ['PL-2 (1) (b)', 'PL-2 (1).1 (iv)', 'PL-7 b']
  },
  'CCI-000580': {
    def: 'The organization develops a functional architecture for the information system that identifies and maintains external interfaces.',
    nist: ['PL-2 (2) (a)', 'PL-2 (2).1']
  },
  'CCI-000581': {
    def: 'The organization develops a functional architecture for the information system that identifies and maintains the information being exchanged across the interfaces.',
    nist: ['PL-2 (2) (a)', 'PL-2 (2).1']
  },
  'CCI-000582': {
    def: 'The organization develops a functional architecture for the information system that identifies and maintains the protection mechanisms associated with each interface.',
    nist: ['PL-2 (2) (a)', 'PL-2 (2).1']
  },
  'CCI-000583': {
    def: 'The organization develops a functional architecture for the information system that identifies and maintains user roles.',
    nist: ['PL-2 (2) (b)', 'PL-2 (2).1']
  },
  'CCI-000584': {
    def: 'The organization develops a functional architecture for the information system that identifies and maintains the access privileges assigned to each role.',
    nist: ['PL-2 (2) (b)', 'PL-2 (2).1']
  },
  'CCI-000585': {
    def: 'The organization develops a functional architecture for the information system that identifies and maintains unique security requirements.',
    nist: ['PL-2 (2) (c)', 'PL-2 (2).1']
  },
  'CCI-000586': {
    def: 'The organization develops a functional architecture for the information system that identifies and maintains types of information processed by the information system.',
    nist: ['PL-2 (2) (d)', 'PL-2 (2).1']
  },
  'CCI-000587': {
    def: 'The organization develops a functional architecture for the information system that identifies and maintains types of information stored by the information system.',
    nist: ['PL-2 (2) (d)', 'PL-2 (2).1']
  },
  'CCI-000588': {
    def: 'The organization develops a functional architecture for the information system that identifies and maintains types of information transmitted by the information system.',
    nist: ['PL-2 (2) (d)', 'PL-2 (2).1']
  },
  'CCI-000589': {
    def: 'The organization develops a functional architecture for the information system that identifies and maintains any specific protection needs in accordance with applicable federal laws, Executive Orders, directives, policies, regulations, standards, and guidance.',
    nist: ['PL-2 (2) (d)', 'PL-2 (2).1']
  },
  'CCI-000590': {
    def: 'The organization develops a functional architecture for the information system that identifies and maintains restoration priority of information.',
    nist: ['PL-2 (2) (e)', 'PL-2 (2).1']
  },
  'CCI-000591': {
    def: 'The organization develops a functional architecture for the information system that identifies and maintains restoration priority of information system services.',
    nist: ['PL-2 (2) (e)', 'PL-2 (2).1']
  },
  'CCI-000597': {
    def: 'The organization conducts a privacy impact assessment on the information system in accordance with OMB policy.',
    nist: ['PL-5', 'PL-5.1 (i) (ii)']
  },
  'CCI-000598': {
    def: 'The organization plans and coordinates security-related activities affecting the information system before conducting such activities in order to reduce the impact on organizational operations (i.e., mission, functions, image, and reputation).',
    nist: ['PL-6', 'PL-6.1']
  },
  'CCI-000599': {
    def: 'The organization plans and coordinates security-related activities affecting the information system before conducting such activities in order to reduce the impact on organizational assets.',
    nist: ['PL-6', 'PL-6.1']
  },
  'CCI-000600': {
    def: 'The organization plans and coordinates security-related activities affecting the information system before conducting such activities in order to reduce the impact on organizational individuals.',
    nist: ['PL-6', 'PL-6.1']
  },
  'CCI-001646': {
    def: 'The organization defines the frequency with which to review and update the current system and services acquisition procedures.',
    nist: ['SA-1', 'SA-1.2 (iii)', 'SA-1 b 2']
  },
  'CCI-000601': {
    def: 'The organization defines the frequency with which to review and update the current system and services acquisition policy.',
    nist: ['SA-1', 'SA-1.2 (i)', 'SA-1 b 1']
  },
  'CCI-000602': {
    def: 'The organization develops and documents a system and services acquisition policy that addresses purpose, scope, roles, responsibilities, management commitment, coordination among organizational entities, and compliance.',
    nist: ['SA-1 a', 'SA-1.1 (i) (ii)', 'SA-1 a 1']
  },
  'CCI-000603': {
    def: 'The organization disseminates to organization-defined personnel or roles a system and services acquisition policy.',
    nist: ['SA-1 a', 'SA-1.1 (iii)', 'SA-1 a 1']
  },
  'CCI-000604': {
    def: 'The organization reviews and updates the current system and services acquisition policy in accordance with organization-defined frequency.',
    nist: ['SA-1 a', 'SA-1.2 (ii)', 'SA-1 b 1']
  },
  'CCI-000605': {
    def: 'The organization develops and documents procedures to facilitate the implementation of the system and services acquisition policy and associated system and services acquisition controls.',
    nist: ['SA-1 b', 'SA-1.1 (iv) (v)', 'SA-1 a 2']
  },
  'CCI-000606': {
    def: 'The organization disseminates to organization-defined personnel or roles procedures to facilitate the implementation of the system and services acquisition policy and associated system and services acquisition controls.',
    nist: ['SA-1 b', 'SA-1.1 (vi)', 'SA-1 a 2']
  },
  'CCI-000607': {
    def: 'The organization reviews and updates the current system and services acquisition procedures in accordance with organization-defined frequency.',
    nist: ['SA-1 b', 'SA-1.2 (iv)', 'SA-1 b 2']
  },
  'CCI-000615': {
    def: 'The organization manages the information system using an organization-defined system development life cycle that incorporates information security considerations.',
    nist: ['SA-3 a', 'SA-3.1 (i)', 'SA-3 a']
  },
  'CCI-000616': {
    def: 'The organization defines and documents information system security roles and responsibilities throughout the system development life cycle.',
    nist: ['SA-3 b', 'SA-3.1 (ii)', 'SA-3 b']
  },
  'CCI-000617': {
    def: 'The organization documents information system security roles and responsibilities throughout the system development life cycle.',
    nist: ['SA-3 b', 'SA-3.1 (ii)']
  },
  'CCI-000618': {
    def: 'The organization identifies individuals having information system security roles and responsibilities.',
    nist: ['SA-3 c', 'SA-3.1 (iii)', 'SA-3 c']
  },
  'CCI-000655': {
    def: 'The organization uses software and associated documentation in accordance with contract agreements and copyright laws.',
    nist: ['SA-6 a', 'SA-6.1 (i)']
  },
  'CCI-000656': {
    def: 'The organization employs tracking systems for software and associated documentation protected by quantity licenses to control copying and distribution.',
    nist: ['SA-6 b', 'SA-6.1 (ii)']
  },
  'CCI-000657': {
    def: 'The organization controls the use of peer-to-peer file sharing technology to ensure this capability is not used for the unauthorized distribution, display, performance, or reproduction of copyrighted work.',
    nist: ['SA-6 c', 'SA-6.1 (iii)']
  },
  'CCI-000658': {
    def: 'The organization documents the use of peer-to-peer file sharing technology to ensure this capability is not used for the unauthorized distribution, display, performance, or reproduction of copyrighted work.',
    nist: ['SA-6 c', 'SA-6.1 (iii)']
  },
  'CCI-000659': {
    def: 'The organization prohibits the use of binary executable code from sources with limited or no warranty without accompanying source code.',
    nist: ['SA-6 (1) (a)', 'SA-6 (1).1 (i)']
  },
  'CCI-000660': {
    def: 'The organization prohibits the use of machine executable code from sources with limited or no warranty without accompanying source code.',
    nist: ['SA-6 (1) (a)', 'SA-6 (1).1 (i)']
  },
  'CCI-000661': {
    def: 'The organization provides exceptions to the source code requirement only when no alternative solutions are available to support compelling mission/operational requirements.',
    nist: ['SA-6 (1) (b)', 'SA-6 (1).1 (ii)']
  },
  'CCI-000662': {
    def: 'The organization obtains express written consent of the authorizing official for exceptions to the source code requirement.',
    nist: ['SA-6 (1) (b)', 'SA-6 (1).1 (iii)']
  },
  'CCI-000664': {
    def: 'The organization applies information system security engineering principles in the specification of the information system.',
    nist: ['SA-8', 'SA-8.1 (i)', 'SA-8']
  },
  'CCI-000665': {
    def: 'The organization applies information system security engineering principles in the design of the information system.',
    nist: ['SA-8', 'SA-8.1 (ii)', 'SA-8']
  },
  'CCI-000666': {
    def: 'The organization applies information system security engineering principles in the development of the information system.',
    nist: ['SA-8', 'SA-8.1 (iii)', 'SA-8']
  },
  'CCI-000667': {
    def: 'The organization applies information system security engineering principles in the implementation of the information system.',
    nist: ['SA-8', 'SA-8.1 (iv)', 'SA-8']
  },
  'CCI-000668': {
    def: 'The organization applies information system security engineering principles in the modification of the information system.',
    nist: ['SA-8', 'SA-8.1 (v)', 'SA-8']
  },
  'CCI-000669': {
    def: 'The organization requires that providers of external information system services comply with organizational information security requirements.',
    nist: ['SA-9 a', 'SA-9.1 (i)', 'SA-9 a']
  },
  'CCI-000670': {
    def: 'The organization requires that providers of external information system services employ organization-defined security controls in accordance with applicable federal laws, Executive Orders, directives, policies, regulations, standards, and guidance.',
    nist: ['SA-9 a', 'SA-9.1 (i)', 'SA-9 a']
  },
  'CCI-000671': {
    def: 'The organization defines government oversight with regard to external information system services.',
    nist: ['SA-9 b', 'SA-9.1 (ii)', 'SA-9 b']
  },
  'CCI-000672': {
    def: 'The organization documents government oversight with regard to external information system services.',
    nist: ['SA-9 b', 'SA-9.1 (ii)', 'SA-9 b']
  },
  'CCI-000673': {
    def: 'The organization defines user roles and responsibilities with regard to external information system services.',
    nist: ['SA-9 b', 'SA-9.1 (ii)', 'SA-9 b']
  },
  'CCI-000674': {
    def: 'The organization documents user roles and responsibilities with regard to external information system services.',
    nist: ['SA-9 b', 'SA-9.1 (ii)', 'SA-9 b']
  },
  'CCI-000675': {
    def: 'The organization monitors security control compliance by external service providers.',
    nist: ['SA-9 c', 'SA-9.1 (iii)']
  },
  'CCI-000676': {
    def: 'The organization conducts an organizational assessment of risk prior to the acquisition of dedicated information security services.',
    nist: ['SA-9 (1) (a)', 'SA-9 (1).1 (i)']
  },
  'CCI-000677': {
    def: 'The organization conducts an organizational assessment of risk prior to the outsourcing of dedicated information security services.',
    nist: ['SA-9 (1) (a)', 'SA-9 (1).1 (i)']
  },
  'CCI-000678': {
    def: 'The organization defines the senior organizational official designated to approve acquisition of dedicated information security services.',
    nist: ['SA-9 (1) (b)', 'SA-9 (1).1 (ii)']
  },
  'CCI-000679': {
    def: 'The organization defines the senior organizational official designated to approve outsourcing of dedicated information security services.',
    nist: ['SA-9 (1) (b)', 'SA-9 (1).1 (ii)']
  },
  'CCI-000680': {
    def: 'The organization ensures the acquisition of dedicated information security services is approved by an organization-designated senior organizational official.',
    nist: ['SA-9 (1) (b)', 'SA-9 (1).1 (iii)']
  },
  'CCI-000681': {
    def: 'The organization ensures the outsourcing of dedicated information security services is approved by an organization-designated senior organizational official.',
    nist: ['SA-9 (1) (b)', 'SA-9 (1).1 (iii)']
  },
  'CCI-000702': {
    def: 'The organization requires information system developers, in consultation with associated security personnel (including security engineers), to create a security test and evaluation plan.',
    nist: ['SA-11 (a)', 'SA-11.1 SA-11(3).1 (i)']
  },
  'CCI-000703': {
    def: 'The organization requires information system developers, in consultation with associated security personnel (including security engineers), to implement a security test and evaluation plan.',
    nist: ['SA-11 (a)', 'SA-11.1']
  },
  'CCI-000704': {
    def: 'The organization requires information system integrators, in consultation with associated security personnel (including security engineers), to create a security test and evaluation plan.',
    nist: ['SA-11 (a)', 'SA-11.1 SA-11(3).1 (i)']
  },
  'CCI-000705': {
    def: 'The organization requires information system integrators, in consultation with associated security personnel (including security engineers), to implement a security test and evaluation plan.',
    nist: ['SA-11 (a)', 'SA-11.1']
  },
  'CCI-000706': {
    def: 'The organization requires information system developers, in consultation with associated security personnel (including security engineers), to implement a verifiable flaw remediation process to correct weaknesses and deficiencies identified during the security testing and evaluation process.',
    nist: ['SA-11 (b)', 'SA-11.1']
  },
  'CCI-000707': {
    def: 'The organization requires information system integrators, in consultation with associated security personnel (including security engineers), to implement a verifiable flaw remediation process to correct weaknesses and deficiencies identified during the security testing and evaluation process.',
    nist: ['SA-11 (b)', 'SA-11.1']
  },
  'CCI-000708': {
    def: 'The organization requires information system developers, in consultation with associated security personnel (including security engineers), to document the results of the security testing/evaluation processes.',
    nist: ['SA-11 (c)', 'SA-11.1']
  },
  'CCI-000709': {
    def: 'The organization requires information system developers, in consultation with associated security personnel (including security engineers), to document the results of the security flaw remediation processes.',
    nist: ['SA-11 (c)', 'SA-11.1']
  },
  'CCI-000710': {
    def: 'The organization requires information system integrators, in consultation with associated security personnel (including security engineers), to document the results of the security testing/evaluation processes.',
    nist: ['SA-11 (c)', 'SA-11.1']
  },
  'CCI-000711': {
    def: 'The organization requires information system integrators, in consultation with associated security personnel (including security engineers), to document the results of the security flaw remediation processes.',
    nist: ['SA-11 (c)', 'SA-11.1']
  },
  'CCI-000712': {
    def: 'The organization requires information system developers to employ code analysis tools to examine software for common flaws and document the results of the analysis.',
    nist: ['SA-11 (1)', 'SA-11 (1).1 (i) (ii)']
  },
  'CCI-000713': {
    def: 'The organization requires information system integrators to employ code analysis tools to examine software for common flaws and document the results of the analysis.',
    nist: ['SA-11 (1)', 'SA-11 (1).1 (i) (ii)']
  },
  'CCI-000714': {
    def: 'The organization requires information system developers to perform a vulnerability analysis to document vulnerabilities.',
    nist: ['SA-11 (2)', 'SA-11 (*2).1']
  },
  'CCI-000715': {
    def: 'The organization requires information system developers to perform a vulnerability analysis to document exploitation potential.',
    nist: ['SA-11 (2)', 'SA-11 (2).1']
  },
  'CCI-000716': {
    def: 'The organization requires information system developers to perform a vulnerability analysis to document risk mitigations.',
    nist: ['SA-11 (2)', 'SA-11 (2).1']
  },
  'CCI-000717': {
    def: 'The organization requires information system integrators to perform a vulnerability analysis to document vulnerabilities.',
    nist: ['SA-11 (2)', 'SA-11 (2).1']
  },
  'CCI-000718': {
    def: 'The organization requires information system integrators to perform a vulnerability analysis to document exploitation potential.',
    nist: ['SA-11 (2)', 'SA-11 (2).1']
  },
  'CCI-000719': {
    def: 'The organization requires information system integrators perform a vulnerability analysis to document risk mitigations.',
    nist: ['SA-11 (2)', 'SA-11 (2).1']
  },
  'CCI-000720': {
    def: 'The organization requires information system developers implement the security test and evaluation plan under the witness of an independent verification and validation agent.',
    nist: ['SA-11 (3)', 'SA-1 1(3).1 (ii)']
  },
  'CCI-000721': {
    def: 'The organization requires information system integrators to implement the security test and evaluation plan under the witness of an independent verification and validation agent.',
    nist: ['SA-11 (3)', 'SA-1 1(3).1 (ii)']
  },
  'CCI-000722': {
    def: 'The organization defines the security safeguards to employ to protect against supply chain threats to the information system, system component, or information system service.',
    nist: ['SA-12', 'SA-12.1 (i)', 'SA-12']
  },
  'CCI-000723': {
    def: 'The organization protects against supply chain threats to the information system, system component, or information system service by employing organization-defined security safeguards as part of a comprehensive, defense-in-breadth information security strategy.',
    nist: ['SA-12', 'SA-12.1 (ii)', 'SA-12']
  },
  'CCI-000724': {
    def: 'The organization purchases all anticipated information system components and spares in the initial acquisition.',
    nist: ['SA-12 (1)', 'SA-12 (1).1']
  },
  'CCI-000725': {
    def: 'The organization conducts a due diligence review of suppliers prior to entering into contractual agreements to acquire information system hardware.',
    nist: ['SA-12 (2)', 'SA-12 (2).1']
  },
  'CCI-000726': {
    def: 'The organization conducts a due diligence review of suppliers prior to entering into contractual agreements to acquire information system software.',
    nist: ['SA-12 (2)', 'SA-12 (2).1']
  },
  'CCI-000727': {
    def: 'The organization conducts a due diligence review of suppliers prior to entering into contractual agreements to acquire information system firmware.',
    nist: ['SA-12 (2)', 'SA-12 (2).1']
  },
  'CCI-000728': {
    def: 'The organization conducts a due diligence review of suppliers prior to entering into contractual agreements to acquire information system services.',
    nist: ['SA-12 (2)', 'SA-12 (2).1']
  },
  'CCI-000729': {
    def: 'The organization uses trusted shipping for information systems.',
    nist: ['SA-12 (3)', 'SA-12 (3).1']
  },
  'CCI-000730': {
    def: 'The organization uses trusted shipping for information system components.',
    nist: ['SA-12 (3)', 'SA-12 (3).1']
  },
  'CCI-000731': {
    def: 'The organization uses trusted shipping for information technology products.',
    nist: ['SA-12 (3)', 'SA-12 (3).1']
  },
  'CCI-000732': {
    def: 'The organization uses trusted warehousing for information systems.',
    nist: ['SA-12 (3)', 'SA-12 (3).1']
  },
  'CCI-000733': {
    def: 'The organization uses trusted warehousing for information system components.',
    nist: ['SA-12 (3)', 'SA-12 (3).1']
  },
  'CCI-000734': {
    def: 'The organization uses trusted warehousing for information technology products.',
    nist: ['SA-12 (3)', 'SA-12 (3).1']
  },
  'CCI-000735': {
    def: 'The organization employs a diverse set of suppliers for information systems.',
    nist: ['SA-12 (4)', 'SA-12 (4).1']
  },
  'CCI-000736': {
    def: 'The organization employs a diverse set of suppliers for information system components.',
    nist: ['SA-12 (4)', 'SA-12 (4).1']
  },
  'CCI-000737': {
    def: 'The organization employs a diverse set of suppliers for information technology products.',
    nist: ['SA-12 (4)', 'SA-12 (4).1']
  },
  'CCI-000738': {
    def: 'The organization employs a diverse set of suppliers for information system services.',
    nist: ['SA-12 (4)', 'SA-12 (4).1']
  },
  'CCI-000739': {
    def: 'The organization employs standard configurations for information systems.',
    nist: ['SA-12 (5)', 'SA-12 (5).1']
  },
  'CCI-000740': {
    def: 'The organization employs standard configurations for information system components.',
    nist: ['SA-12 (5)', 'SA-12 (5).1']
  },
  'CCI-000741': {
    def: 'The organization employs standard configurations for information technology products.',
    nist: ['SA-12 (5)', 'SA-12 (5).1']
  },
  'CCI-000742': {
    def: 'The organization minimizes the time between purchase decisions and delivery of information systems.',
    nist: ['SA-12 (6)', 'SA-12 (6).1']
  },
  'CCI-000743': {
    def: 'The organization minimizes the time between purchase decisions and delivery of information system components.',
    nist: ['SA-12 (6)', 'SA-12 (6).1']
  },
  'CCI-000744': {
    def: 'The organization minimizes the time between purchase decisions and delivery of information technology products.',
    nist: ['SA-12 (6)', 'SA-12 (6).1']
  },
  'CCI-000745': {
    def: 'The organization employs independent analysis and penetration testing against delivered information systems.',
    nist: ['SA-12 (7)', 'SA-12 (7).1']
  },
  'CCI-000746': {
    def: 'The organization employs independent analysis and penetration testing against delivered information system components.',
    nist: ['SA-12 (7)', 'SA-12 (7).1']
  },
  'CCI-000747': {
    def: 'The organization employs independent analysis and penetration testing against delivered information technology products.',
    nist: ['SA-12 (7)', 'SA-12 (7).1']
  },
  'CCI-000748': {
    def: 'The organization defines level of trustworthiness for the information system.',
    nist: ['SA-13', 'SA-13.1 (i)']
  },
  'CCI-000749': {
    def: 'The organization requires that the information system meets the organization-defined level of trustworthiness.',
    nist: ['SA-13', 'SA-13.1 (ii)']
  },
  'CCI-000750': {
    def: 'The organization defines the list of critical information system components that require re-implementation.',
    nist: ['SA-14', 'SA-14.1 (i)']
  },
  'CCI-000751': {
    def: 'The organization determines the organization-defined list of critical information system components that require re-implementation.',
    nist: ['SA-14 a', 'SA-14']
  },
  'CCI-000752': {
    def: 'The organization re-implements organization-defined critical information system components.',
    nist: ['SA-14 b', 'SA-14.1 (ii)']
  },
  'CCI-000753': {
    def: 'The organization identifies information system components for which alternative sourcing is not viable.',
    nist: ['SA-14 (1) (a)', 'SA-14 (1).1 (i)']
  },
  'CCI-000754': {
    def: 'The organization defines measures to be employed to prevent critical security controls for information system components from being compromised.',
    nist: ['SA-14 (1) (b)', 'SA-14 (1).1 (ii)']
  },
  'CCI-000755': {
    def: 'The organization employs organization-defined measures to ensure critical security controls for the information system components are not compromised.',
    nist: ['SA-14 (1) (b)', 'SA-14 (1).1 (iii)']
  },
  'CCI-000756': {
    def: 'The organization develops an identification and authentication policy that addresses purpose, scope, roles, responsibilities, management commitment, coordination among organizational entities, and compliance.',
    nist: ['IA-1 a', 'IA-1.1 (i) (ii)', 'IA-1 a 1']
  },
  'CCI-000757': {
    def: 'The organization disseminates to organization-defined personnel or roles an identification and authentication policy that addresses purpose, scope, roles, responsibilities, management commitment, coordination among organizational entities, and compliance.',
    nist: ['IA-1 a', 'IA-1.1 (iii)', 'IA-1 a 1']
  },
  'CCI-000758': {
    def: 'The organization reviews and updates identification and authentication policy in accordance with the organization-defined frequency.',
    nist: ['IA-1 a', 'IA-1.2 (ii)', 'IA-1 b 1']
  },
  'CCI-000759': {
    def: 'The organization defines a frequency for reviewing and updating the identification and authentication policy.',
    nist: ['IA-1 a', 'IA-1.2 (i)', 'IA-1 b 1']
  },
  'CCI-000760': {
    def: 'The organization develops procedures to facilitate the implementation of the identification and authentication policy and associated identification and authentication controls.',
    nist: ['IA-1 b', 'IA-1.1 (v)', 'IA-1 a 2']
  },
  'CCI-000761': {
    def: 'The organization disseminates to organization-defined personnel or roles procedures to facilitate the implementation of the identification and authentication policy and associated identification and authentication controls.',
    nist: ['IA-1 b', 'IA-1.1 (vi)', 'IA-1 a 2']
  },
  'CCI-000762': {
    def: 'The organization reviews and updates identification and authentication procedures in accordance with the organization-defined frequency.',
    nist: ['IA-1 b', 'IA-1.2 (iv)', 'IA-1 b 2']
  },
  'CCI-000763': {
    def: 'The organization defines a frequency for reviewing and updating the identification and authentication procedures.',
    nist: ['IA-1 b', 'IA-1.2 (iii)', 'IA-1 b 2']
  },
  'CCI-000764': {
    def: 'The information system uniquely identifies and authenticates organizational users (or processes acting on behalf of organizational users).',
    nist: ['IA-2', 'IA-2.1', 'IA-2']
  },
  'CCI-000765': {
    def: 'The information system implements multifactor authentication for network access to privileged accounts.',
    nist: ['IA-2 (1)', 'IA-2 (1).1', 'IA-2 (1)']
  },
  'CCI-000766': {
    def: 'The information system implements multifactor authentication for network access to non-privileged accounts.',
    nist: ['IA-2 (2)', 'IA-2 (2).1', 'IA-2 (2)']
  },
  'CCI-000767': {
    def: 'The information system implements multifactor authentication for local access to privileged accounts.',
    nist: ['IA-2 (3)', 'IA-2 (3).1', 'IA-2 (3)']
  },
  'CCI-000768': {
    def: 'The information system implements multifactor authentication for local access to non-privileged accounts.',
    nist: ['IA-2 (4)', 'IA-2 (4).1', 'IA-2 (4)']
  },
  'CCI-000769': {
    def: 'The organization allows the use of group authenticators only when used in conjunction with an individual/unique authenticator.',
    nist: ['IA-2 (5) (a)', 'IA-2 (5).1 (i)']
  },
  'CCI-000770': {
    def: 'The organization requires individuals to be authenticated with an individual authenticator when a group authenticator is employed.',
    nist: ['IA-2 (5) (b)', 'IA-2 (5).2 (ii)', 'IA-2 (5)']
  },
  'CCI-000771': {
    def: 'The information system uses multifactor authentication for network access to privileged accounts where one of the factors is provided by a device separate from the information system being accessed.',
    nist: ['IA-2 (6)', 'IA-2 (6).1']
  },
  'CCI-000772': {
    def: 'The information system uses multifactor authentication for network access to non-privileged accounts where one of the factors is provided by a device separate from the information system being accessed.',
    nist: ['IA-2 (7)', 'IA-2 (7).1']
  },
  'CCI-000773': {
    def: 'The organization defines replay-resistant authentication mechanisms to be used for network access to privileged accounts.',
    nist: ['IA-2 (8)', 'IA-2 (8).1 (i)']
  },
  'CCI-000774': {
    def: 'The information system uses organization-defined replay-resistant authentication mechanisms for network access to privileged accounts.',
    nist: ['IA-2 (8)', 'IA-2 (8).1 (ii)']
  },
  'CCI-000775': {
    def: 'The organization defines replay-resistant authentication mechanisms to be used for network access to non-privileged accounts.',
    nist: ['IA-2 (9)', 'IA-2 (9).1 (i)']
  },
  'CCI-000776': {
    def: 'The information system uses organization-defined replay-resistant authentication mechanisms for network access to non-privileged accounts.',
    nist: ['IA-2 (9)', 'IA-2 (9).1 (ii)']
  },
  'CCI-000777': {
    def: 'The organization defines a list of specific and/or types of devices for which identification and authentication is required before establishing a connection to the information system.',
    nist: ['IA-3', 'IA-3.1 (i)', 'IA-3']
  },
  'CCI-000778': {
    def: 'The information system uniquely identifies an organization-defined list of specific and/or types of devices before establishing a local, remote, or network connection.',
    nist: ['IA-3', 'IA-3.1 (ii)', 'IA-3']
  },
  'CCI-000779': {
    def: 'The information system authenticates devices before establishing remote network connections using bidirectional authentication between devices that is cryptographically based.',
    nist: ['IA-3 (1)', 'IA-3 (1).1 (i)']
  },
  'CCI-000780': {
    def: 'The information system authenticates devices before establishing wireless network connections using bidirectional authentication between devices that is cryptographically based.',
    nist: ['IA-3 (1)', 'IA-3 (1).1 (ii)']
  },
  'CCI-000781': {
    def: 'The information system authenticates devices before establishing network connections using bidirectional authentication between devices that is cryptographically based.',
    nist: ['IA-3 (2)', 'IA-3 (2).1']
  },
  'CCI-000782': {
    def: 'The organization standardizes, with regard to dynamic address allocation, Dynamic Host Control Protocol (DHCP) lease information and the time assigned to DHCP-enabled devices.',
    nist: ['IA-3 (3)', 'IA-3 (3).1 (i)']
  },
  'CCI-000783': {
    def: 'The organization audits lease information when assigned to a device.',
    nist: ['IA-3 (3)', 'IA-3 (3).1 (ii)', 'IA-3 (3) (b)']
  },
  'CCI-000784': {
    def: 'The organization manages information system identifiers for users and devices by receiving authorization from a designated organizational official to assign a user identifier.',
    nist: ['IA-4 a', 'IA-4.1 (iii)']
  },
  'CCI-000785': {
    def: 'The organization manages information system identifiers for users and devices by receiving authorization from a designated organizational official to assign a device identifier.',
    nist: ['IA-4 a', 'IA-4.1 (iii)']
  },
  'CCI-000786': {
    def: 'The organization manages information system identifiers for users and devices by selecting an identifier that uniquely identifies an individual.',
    nist: ['IA-4 b', 'IA-4.1 (iii)']
  },
  'CCI-000787': {
    def: 'The organization manages information system identifiers for users and devices by selecting an identifier that uniquely identifies a device.',
    nist: ['IA-4 b', 'IA-4.1 (iii)']
  },
  'CCI-000788': {
    def: 'The organization manages information system identifiers for users and devices by assigning the user identifier to the intended party.',
    nist: ['IA-4 c', 'IA-4.1 (iii)']
  },
  'CCI-000789': {
    def: 'The organization manages information system identifiers for users and devices by assigning the device identifier to the intended device.',
    nist: ['IA-4 c', 'IA-4.1 (iii)']
  },
  'CCI-000790': {
    def: 'The organization defines a time period for which the reuse of user identifiers is prohibited.',
    nist: ['IA-4 d', 'IA-4.1 (i)']
  },
  'CCI-000791': {
    def: 'The organization defines a time period for which the reuse of device identifiers is prohibited.',
    nist: ['IA-4 d', 'IA-4.1 (i)']
  },
  'CCI-000792': {
    def: 'The organization manages information system identifiers for users and devices by preventing reuse of user identifiers for an organization-defined time period.',
    nist: ['IA-4 d', 'IA-4.1 (iii)']
  },
  'CCI-000793': {
    def: 'The organization manages information system identifiers for users and devices by preventing reuse of device identifiers for an organization-defined time period.',
    nist: ['IA-4 d', 'IA-4.1 (iii)']
  },
  'CCI-000794': {
    def: 'The organization defines a time period of inactivity after which the identifier is disabled.',
    nist: ['IA-4 e', 'IA-4.1 (ii)', 'IA-4 e']
  },
  'CCI-000795': {
    def: 'The organization manages information system identifiers by disabling the identifier after an organization-defined time period of inactivity.',
    nist: ['IA-4 e', 'IA-4.1 (iii)', 'IA-4 e']
  },
  'CCI-000796': {
    def: 'The organization prohibits the use of information system account identifiers that are the same as public identifiers for individual electronic mail accounts.',
    nist: ['IA-4 (1)', 'IA-4 (1).1', 'IA-4 (1)']
  },
  'CCI-000797': {
    def: 'The organization requires that registration to receive a user ID and password include authorization by a supervisor.',
    nist: ['IA-4 (2)', 'IA-4 (2) (i)']
  },
  'CCI-000798': {
    def: 'The organization requires that registration to receive a user ID and password be done in person before a designated registration authority.',
    nist: ['IA-4 (2)', 'IA-4 (2) (ii)']
  },
  'CCI-000799': {
    def: 'The organization requires multiple forms of certification of individual identification, such as documentary evidence or a combination of documents and biometrics, be presented to the registration authority.',
    nist: ['IA-4 (3)', 'IA-4 (3).1', 'IA-4 (3)']
  },
  'CCI-000800': {
    def: 'The organization defines characteristics for identifying individual status.',
    nist: ['IA-4 (4)', 'IA-4 (4).1 (i)', 'IA-4 (4)']
  },
  'CCI-000801': {
    def: 'The organization manages individual identifiers by uniquely identifying each individual by organization-defined characteristics identifying individual status.',
    nist: ['IA-4 (4)', 'IA-4 (4).1 (ii)', 'IA-4 (4)']
  },
  'CCI-000802': {
    def: 'The information system dynamically manages identifiers, attributes, and associated access authorizations.',
    nist: ['IA-4 (5)', 'IA-4 (5).1']
  },
  'CCI-000803': {
    def: 'The information system implements mechanisms for authentication to a cryptographic module that meet the requirements of applicable federal laws, Executive Orders, directives, policies, regulations, standards, and guidance for such authentication.',
    nist: ['IA-7', 'IA-7.1', 'IA-7']
  },
  'CCI-000804': {
    def: 'The information system uniquely identifies and authenticates non-organizational users (or processes acting on behalf of non-organizational users).',
    nist: ['IA-8', 'IA-8.1', 'IA-8']
  },
  'CCI-000805': {
    def: 'The organization develops and documents an incident response policy that addresses purpose, scope, roles, responsibilities, management commitment, coordination among organizational entities, and compliance.',
    nist: ['IR-1 a', 'IR-1.1 (i) (ii)', 'IR-1 a 1']
  },
  'CCI-000806': {
    def: 'The organization disseminates an incident response policy to organization-defined personnel or roles.',
    nist: ['IR-1 a', 'IR-1.1 (iii)', 'IR-1 a 1']
  },
  'CCI-000807': {
    def: 'The organization reviews and updates the current incident response policy in accordance with organization-defined frequency.',
    nist: ['IR-1 a', 'IR-1.2 (ii)', 'IR-1 b 1']
  },
  'CCI-000808': {
    def: 'The organization defines the frequency with which to review and update the current incident response policy.',
    nist: ['IR-1 a', 'IR-1.2 (i)', 'IR-1 b 1']
  },
  'CCI-000809': {
    def: 'The organization develops and documents procedures to facilitate the implementation of the incident response policy and associated incident response controls.',
    nist: ['IR-1 b', 'IR-1.1 (iv) (v)', 'IR-1 a 2']
  },
  'CCI-000810': {
    def: 'The organization disseminates incident response procedures to organization-defined personnel or roles.',
    nist: ['IR-1 b', 'IR-1.1 (vi)', 'IR-1 a 2']
  },
  'CCI-000811': {
    def: 'The organization reviews and updates the current incident response procedures in accordance with organization-defined frequency.',
    nist: ['IR-1 b', 'IR-1.2 (iv)', 'IR-1 b 2']
  },
  'CCI-000812': {
    def: 'The organization defines the frequency with which to review and update the current incident response procedures.',
    nist: ['IR-1 b', 'IR-1.2 (iii)', 'IR-1 b 2']
  },
  'CCI-000834': {
    def: 'The organization defines a time period for personnel to report suspected security incidents to the organizational incident response capability.',
    nist: ['IR-6 a', 'IR-6.1 (i)', 'IR-6 a']
  },
  'CCI-000835': {
    def: 'The organization requires personnel to report suspected security incidents to the organizational incident response capability within the organization-defined time period.',
    nist: ['IR-6 a', 'IR-6.1 (ii)', 'IR-6 a']
  },
  'CCI-000836': {
    def: 'The organization reports security incident information to organization-defined authorities.',
    nist: ['IR-6 b', 'IR-6.1 (iii)', 'IR-6 b']
  },
  'CCI-000837': {
    def: 'The organization employs automated mechanisms to assist in the reporting of security incidents.',
    nist: ['IR-6 (1)', 'IR-6 (1).1', 'IR-6 (1)']
  },
  'CCI-000838': {
    def: 'The organization reports information system vulnerabilities associated with reported security incidents to organization-defined personnel or roles.',
    nist: ['IR-6 (2)', 'IR-6 (2).1', 'IR-6 (2)']
  },
  'CCI-000839': {
    def: 'The organization provides an incident response support resource, integral to the organizational incident response capability, that offers advice and assistance to users of the information system for the handling and reporting of security incidents.',
    nist: ['IR-7', 'IR-7.1 (i) (ii)', 'IR-7']
  },
  'CCI-000840': {
    def: 'The organization employs automated mechanisms to increase the availability of incident response-related information and support.',
    nist: ['IR-7 (1)', 'IR-7 (1).1', 'IR-7 (1)']
  },
  'CCI-000841': {
    def: 'The organization establishes a direct, cooperative relationship between its incident response capability and external providers of information system protection capability.',
    nist: ['IR-7 (2) (a)', 'IR-7 (2).1 (i)', 'IR-7 (2) (a)']
  },
  'CCI-000842': {
    def: 'The organization identifies organizational incident response team members to the external providers.',
    nist: ['IR-7 (2) (b)', 'IR-7 (2).1 (ii)', 'IR-7 (2) (b)']
  },
  'CCI-000843': {
    def: 'The organization develops an incident response plan that provides the organization with a roadmap for implementing its incident response capability; describes the structure and organization of the incident response capability; provides a high-level approach for how the incident response capability fits into the overall organization; meets the unique requirements of the organization, which relate to mission, size, structure, and functions; defines reportable incidents; provides metrics for measuring the incident response capability within the organization; and defines the resources and management support needed to effectively maintain and mature an incident response capability.',
    nist: ['IR-8 a', 'IR-8.1']
  },
  'CCI-000844': {
    def: 'The organization develops an incident response plan that is reviewed and approved by organization-defined personnel or roles.',
    nist: ['IR-8 a', 'IR-8.1', 'IR-8 a 8']
  },
  'CCI-000845': {
    def: 'The organization defines incident response personnel (identified by name and/or by role) and organizational elements to whom copies of the incident response plan are distributed.',
    nist: ['IR-8 b', 'IR-8.2 (i)', 'IR-8 b']
  },
  'CCI-000846': {
    def: 'The organization distributes copies of the incident response plan to organization-defined incident response personnel (identified by name and/or by role) and organizational elements.',
    nist: ['IR-8 b', 'IR-8.2 (ii)', 'IR-8 b']
  },
  'CCI-000847': {
    def: 'The organization defines the frequency for reviewing the incident response plan.',
    nist: ['IR-8 c', 'IR-8.2 (iii)', 'IR-8 c']
  },
  'CCI-000848': {
    def: 'The organization reviews the incident response plan on an organization-defined frequency.',
    nist: ['IR-8 c', 'IR-8.2 (iv)', 'IR-8 c']
  },
  'CCI-000849': {
    def: 'The organization updates the incident response plan to address system/organizational changes or problems encountered during plan implementation, execution, or testing.',
    nist: ['IR-8 d', 'IR-8.2 (v)', 'IR-8 d']
  },
  'CCI-000850': {
    def: 'The organization communicates incident response plan changes to organization-defined incident response personnel (identified by name and/or by role) and organizational elements.',
    nist: ['IR-8 e', 'IR-8.2 (vi)', 'IR-8 e']
  },
  'CCI-000865': {
    def: 'The organization approves information system maintenance tools.',
    nist: ['MA-3', 'MA-3.1 (i)', 'MA-3']
  },
  'CCI-000866': {
    def: 'The organization controls information system maintenance tools.',
    nist: ['MA-3', 'MA-3.1 (i)', 'MA-3']
  },
  'CCI-000867': {
    def: 'The organization monitors information system maintenance tools.',
    nist: ['MA-3', 'MA-3.1 (i)', 'MA-3']
  },
  'CCI-000868': {
    def: 'The organization maintains, on an ongoing basis, information system maintenance tools.',
    nist: ['MA-3', 'MA-3.1 (ii)']
  },
  'CCI-000869': {
    def: 'The organization inspects the maintenance tools carried into a facility by maintenance personnel for improper or unauthorized modifications.',
    nist: ['MA-3 (1)', 'MA-3 (1).1', 'MA-3 (1)']
  },
  'CCI-000870': {
    def: 'The organization checks media containing diagnostic and test programs for malicious code before the media are used in the information system.',
    nist: ['MA-3 (2)', 'MA-3 (2).1', 'MA-3 (2)']
  },
  'CCI-000871': {
    def: 'The organization prevents the unauthorized removal of maintenance equipment containing organizational information by: (a) verifying that there is no organizational information contained on the equipment; (b) sanitizing or destroying the equipment; (c) retaining the equipment within the facility; or (d) obtaining an exemption from organization-defined personnel or roles explicitly authorizing removal of the equipment from the facility.',
    nist: ['MA-3 (3)', 'MA-3 (3).1', 'MA-3 (3)']
  },
  'CCI-000872': {
    def: 'The organization employs automated mechanisms to restrict the use of maintenance tools to authorized personnel only.',
    nist: ['MA-3 (4)', 'MA-3 (4).1']
  },
  'CCI-000890': {
    def: 'The organization establishes a process for maintenance personnel authorization.',
    nist: ['MA-5 a', 'MA-5.1 (i)', 'MA-5 a']
  },
  'CCI-000891': {
    def: 'The organization maintains a list of authorized maintenance organizations or personnel.',
    nist: ['MA-5 a', 'MA-5.1 (ii)', 'MA-5 a']
  },
  'CCI-000892': {
    def: 'The organization ensures that personnel performing maintenance on the information system have required access authorizations or designates organizational personnel with required access authorizations and technical competence deemed necessary to supervise information system maintenance.',
    nist: ['MA-5 b', 'MA-5.1 (iii)']
  },
  'CCI-000893': {
    def: 'The organization implements procedures for the use of maintenance personnel that lack appropriate security clearances or are not U.S. citizens.',
    nist: ['MA-5 (1)', 'MA-5 (1).1', 'MA-5 (1) (a)']
  },
  'CCI-000894': {
    def: 'The organization requires maintenance personnel who do not have needed access authorizations, clearances, or formal access approvals to be escorted and supervised during the performance of maintenance and diagnostic activities on the information system by approved organizational personnel who are fully cleared, have appropriate access authorizations, and are technically qualified.',
    nist: ['MA-5 (1) (a)', 'MA-5 (1).1', 'MA-5 (1) (a) (1)']
  },
  'CCI-000895': {
    def: 'The organization requires that, prior to initiating maintenance or diagnostic activities by personnel who do not have needed access authorizations, clearances or formal access approvals, all volatile information storage components within the information system be sanitized and all nonvolatile storage media be removed or physically disconnected from the system and secured.',
    nist: ['MA-5 (1) (b)', 'MA-5 (1).1', 'MA-5 (1) (a) (2)']
  },
  'CCI-000896': {
    def: 'The organization requires that in the event an information system component cannot be sanitized, the procedures contained in the security plan for the system be enforced.',
    nist: ['MA-5 (1) (c)', 'MA-5 (1).1']
  },
  'CCI-000897': {
    def: 'The organization ensures that personnel performing maintenance and diagnostic activities on an information system processing, storing, or transmitting classified information possess security clearances and formal access approvals for at least the highest classification level and for all compartments of information on the system.',
    nist: ['MA-5 (2)', 'MA-5 (2).1', 'MA-5 (2)']
  },
  'CCI-000898': {
    def: 'The organization ensures that personnel performing maintenance and diagnostic activities on an information system processing, storing, or transmitting classified information are U.S. citizens.',
    nist: ['MA-5 (3)', 'MA-5 (3).1', 'MA-5 (3)']
  },
  'CCI-000899': {
    def: 'The organization ensures that cleared foreign nationals (i.e., foreign nationals with appropriate security clearances) are used to conduct maintenance and diagnostic activities on classified information systems only when the systems are jointly owned and operated by the United States and foreign allied governments, or owned and operated solely by foreign allied governments.',
    nist: ['MA-5 (4) (a)', 'MA-5 (4).1 (i)', 'MA-5 (4) (a)']
  },
  'CCI-000900': {
    def: 'The organization ensures that approvals, consents, and detailed operational conditions regarding the use of foreign nationals to conduct maintenance and diagnostic activities on classified information systems are fully documented within Memoranda of Agreements.',
    nist: ['MA-5 (4) (b)', 'MA-5 (4).1 (ii)', 'MA-5 (4) (b)']
  },
  'CCI-000901': {
    def: 'The organization defines a list of security-critical information system components and/or key information technology components for which it will obtain maintenance support and/or spare parts.',
    nist: ['MA-6', 'MA-6.1 (i)']
  },
  'CCI-000902': {
    def: 'The organization defines a time period for obtaining maintenance support and/or spare parts for security-critical information system components and/or key information technology components.',
    nist: ['MA-6', 'MA-6.1 (ii)']
  },
  'CCI-000903': {
    def: 'The organization obtains maintenance support and/or spare parts for organization-defined information system components within an organization-defined time period of failure.',
    nist: ['MA-6', 'MA-6.1 (iii)', 'MA-6']
  },
  'CCI-000904': {
    def: 'The organization develops and documents a physical and environmental protection policy that addresses purpose, scope, roles, responsibilities, management commitment, coordination among organizational entities, and compliance.',
    nist: ['PE-1 a', 'PE-1.1 (i and ii)', 'PE-1 a 1']
  },
  'CCI-000905': {
    def: 'The organization disseminates a physical and environmental protection policy to organization-defined personnel or roles.',
    nist: ['PE-1 a', 'PE-1.1 (iii)', 'PE-1 a 1']
  },
  'CCI-000906': {
    def: 'The organization reviews and updates the current physical and environmental protection policy in accordance with organization-defined frequency.',
    nist: ['PE-1 a', 'PE-1.2 (ii)', 'PE-1 b 1']
  },
  'CCI-000907': {
    def: 'The organization defines the frequency with which to review and update the physical and environmental protection policy.',
    nist: ['PE-1 a', 'PE-1.2 (i)', 'PE-1 b 1']
  },
  'CCI-000908': {
    def: 'The organization develops and documents procedures to facilitate the implementation of the physical and environmental protection policy and associated physical and environmental protection controls.',
    nist: ['PE-1 b', 'PE-1.1 (iv and v)', 'PE-1 a 2']
  },
  'CCI-000909': {
    def: 'The organization disseminates physical and environmental protection procedures to organization-defined personnel or roles.',
    nist: ['PE-1 b', 'PE-1.1 (vi)', 'PE-1 a 2']
  },
  'CCI-000910': {
    def: 'The organization reviews and updates the current physical and environmental protection procedures in accordance with organization-defined frequency.',
    nist: ['PE-1 b', 'PE-1.2 (iv)', 'PE-1 b 2']
  },
  'CCI-000911': {
    def: 'The organization defines the frequency with which to review and update the physical and environmental protection procedures.',
    nist: ['PE-1 b', 'PE-1.2 (iii)', 'PE-1 b 2']
  },
  'CCI-000919': {
    def: 'The organization enforces physical access authorizations at organization-defined entry/exit points to the facility where the information system resides.',
    nist: ['PE-3 a', 'PE-3.1 (i)', 'PE-3 a']
  },
  'CCI-000920': {
    def: 'The organization verifies individual access authorizations before granting access to the facility.',
    nist: ['PE-3 b', 'PE-3.1 (ii)', 'PE-3 a 1']
  },
  'CCI-000921': {
    def: 'The organization controls ingress/egress to the facility where the information system resides using one or more organization-defined physical access control systems/devices or guards.',
    nist: ['PE-3 c', 'PE-3.1 (iii)', 'PE-3 a 2']
  },
  'CCI-000922': {
    def: 'The organization controls access to areas officially designated as publicly accessible in accordance with the organization^s assessment of risk.',
    nist: ['PE-3 d', 'PE-3.1 (iv)']
  },
  'CCI-000923': {
    def: 'The organization secures keys, combinations, and other physical access devices.',
    nist: ['PE-3 e', 'PE-3.1 (v)', 'PE-3 e']
  },
  'CCI-000924': {
    def: 'The organization inventories organization-defined physical access devices on an organization-defined frequency.',
    nist: ['PE-3 f', 'PE-3.2 (ii)', 'PE-3 f']
  },
  'CCI-000925': {
    def: 'The organization defines the frequency for conducting inventories of organization-defined physical access devices.',
    nist: ['PE-3 f', 'PE-3.2 (i)', 'PE-3 f']
  },
  'CCI-000926': {
    def: 'The organization changes combinations and keys in accordance with organization-defined frequency and/or when keys are lost, combinations are compromised, or individuals are transferred or terminated.',
    nist: ['PE-3 g', 'PE-3.2 (iv)', 'PE-3 g']
  },
  'CCI-000927': {
    def: 'The organization defines a frequency for changing combinations and keys.',
    nist: ['PE-3 g', 'PE-3.2 (iii)', 'PE-3 g']
  },
  'CCI-000928': {
    def: 'The organization enforces physical access authorizations to the information system in addition to the physical access controls for the facility where the information system resides at organization-defined physical spaces containing one or more components of the information system.',
    nist: ['PE-3 (1)', 'PE-3 (1).1', 'PE-3 (1)']
  },
  'CCI-000929': {
    def: 'The organization performs security checks in accordance with organization-defined frequency at the physical boundary of the facility or information system for unauthorized exfiltration of information or removal of information system components.',
    nist: ['PE-3 (2)', 'PE-3 (2).1', 'PE-3 (2)']
  },
  'CCI-000930': {
    def: 'The organization employs guards and/or alarms to monitor every physical access point to the facility where the information system resides 24 hours per day, 7 days per week.',
    nist: ['PE-3 (3)', 'PE-3 (3).1', 'PE-3 (3)']
  },
  'CCI-000931': {
    def: 'The organization uses lockable physical casings to protect organization-defined information system components from unauthorized physical access.',
    nist: ['PE-3 (4)', 'PE-3 (4).1 (ii)', 'PE-3 (4)']
  },
  'CCI-000932': {
    def: 'The organization defines information system components to be protected from unauthorized physical access using lockable physical casings.',
    nist: ['PE-3 (4)', 'PE-3 (4).1 (i)', 'PE-3 (4)']
  },
  'CCI-000933': {
    def: 'The organization employs organization-defined security safeguards to deter and/or prevent physical tampering or alteration of organization-defined hardware components within the information system.',
    nist: ['PE-3 (5)', 'PE-3 (5).1', 'PE-3 (5)']
  },
  'CCI-000934': {
    def: 'The organization employs a penetration testing process that includes unannounced attempts to bypass or circumvent security controls associated with physical access points to the facility on an organization-defined frequency.',
    nist: ['PE-3 (6)', 'PE-3 (6).1 (ii)', 'PE-3 (6)']
  },
  'CCI-000935': {
    def: 'The organization defines the frequency of unannounced attempts to be included in a penetration testing process to bypass or circumvent security controls associated with physical access points to the facility.',
    nist: ['PE-3 (6)', 'PE-3 (6).1 (i)', 'PE-3 (6)']
  },
  'CCI-000936': {
    def: 'The organization controls physical access to organization-defined information system distribution and transmission lines within organizational facilities using organization-defined security safeguards.',
    nist: ['PE-4', 'PE-4.1', 'PE-4']
  },
  'CCI-000937': {
    def: 'The organization controls physical access to information system output devices to prevent unauthorized individuals from obtaining the output.',
    nist: ['PE-5', 'PE-5.1', 'PE-5']
  },
  'CCI-000938': {
    def: 'The organization monitors physical access to the information system to detect and respond to physical security incidents.',
    nist: ['PE-6 a', 'PE-6.1 (i)']
  },
  'CCI-000939': {
    def: 'The organization reviews physical access logs in accordance with organization-defined frequency.',
    nist: ['PE-6 b', 'PE-6.1 (iii)', 'PE-6 b']
  },
  'CCI-000940': {
    def: 'The organization defines a frequency for reviewing physical access logs.',
    nist: ['PE-6 b', 'PE-6.1 (ii)', 'PE-6 b']
  },
  'CCI-000941': {
    def: 'The organization coordinates results of reviews and investigations with the organization^s incident response capability.',
    nist: ['PE-6 c', 'PE-6.1 (iv)', 'PE-6 c']
  },
  'CCI-000942': {
    def: 'The organization monitors physical intrusion alarms and surveillance equipment.',
    nist: ['PE-6 (1)', 'PE-6 (1).1', 'PE-6 (1)']
  },
  'CCI-000943': {
    def: 'The organization employs automated mechanisms to recognize potential intrusions and initiate designated response actions.',
    nist: ['PE-6 (2)', 'PE-6 (2).1']
  },
  'CCI-000944': {
    def: 'The organization controls physical access to the information system by authenticating visitors before authorizing access to the facility where the information system resides other than areas designated as publicly accessible.',
    nist: ['PE-7', 'PE-7.1']
  },
  'CCI-000945': {
    def: 'The organization escorts visitors and monitors visitor activity, when required.',
    nist: ['PE-7 (1)', 'PE-7 (1).1']
  },
  'CCI-000946': {
    def: 'The organization requires two forms of identification for visitor access to the facility.',
    nist: ['PE-7 (2)', 'PE-7 (2).1']
  },
  'CCI-000947': {
    def: 'The organization maintains visitor access records to the facility where the information system resides for an organization-defined time period.',
    nist: ['PE-8 a', 'PE-8.1 (i)', 'PE-8 a']
  },
  'CCI-000948': {
    def: 'The organization reviews visitor access records in accordance with organization-defined frequency.',
    nist: ['PE-8 b', 'PE-8.1 (ii)', 'PE-8 b']
  },
  'CCI-000949': {
    def: 'The organization defines the frequency with which to review the visitor access records for the facility where the information system resides.',
    nist: ['PE-8 b', 'PE-8.1 (ii)', 'PE-8 b']
  },
  'CCI-000950': {
    def: 'The organization employs automated mechanisms to facilitate the maintenance and review of access records.',
    nist: ['PE-8 (1)', 'PE-8 (1).1', 'PE-8 (1)']
  },
  'CCI-000951': {
    def: 'The organization maintains a record of all physical access, both visitor and authorized individuals.',
    nist: ['PE-8 (2)', 'PE-8 (2).1']
  },
  'CCI-000952': {
    def: 'The organization protects power equipment and power cabling for the information system from damage and destruction.',
    nist: ['PE-9', 'PE-9.1', 'PE-9']
  },
  'CCI-000953': {
    def: 'The organization employs redundant and parallel power cabling paths.',
    nist: ['PE-9 (1)', 'PE-9 (1).1']
  },
  'CCI-000954': {
    def: 'The organization employs automatic voltage controls for organization-defined critical information system components.',
    nist: ['PE-9 (2)', 'PE-9 (2).1 (ii)', 'PE-9 (2)']
  },
  'CCI-000955': {
    def: 'The organization defines critical information system components that require automatic voltage controls.',
    nist: ['PE-9 (2)', 'PE-9 (2).1 (i)', 'PE-9 (2)']
  },
  'CCI-000956': {
    def: 'The organization provides the capability of shutting off power to the information system or individual system components in emergency situations.',
    nist: ['PE-10 a', 'PE-10.1 (i)', 'PE-10 a']
  },
  'CCI-000957': {
    def: 'The organization places emergency shutoff switches or devices in an organization-defined location by information system or system component to facilitate safe and easy access for personnel.',
    nist: ['PE-10 b', 'PE-10.1 (iii)', 'PE-10 b']
  },
  'CCI-000958': {
    def: 'The organization defines a location for emergency shutoff switches or devices by information system or system component.',
    nist: ['PE-10 b', 'PE-10.1 (ii)', 'PE-10 b']
  },
  'CCI-000959': {
    def: 'The organization protects emergency power shutoff capability from unauthorized activation.',
    nist: ['PE-10 c', 'PE-10.1 (iv)', 'PE-10 c']
  },
  'CCI-000960': {
    def: 'The organization provides a short-term uninterruptible power supply to facilitate an orderly shutdown of the information system in the event of a primary power source loss.',
    nist: ['PE-11', 'PE-11.1']
  },
  'CCI-000961': {
    def: 'The organization provides a long-term alternate power supply for the information system that is capable of maintaining minimally required operational capability in the event of an extended loss of the primary power source.',
    nist: ['PE-11 (1)', 'PE-11 (1).1', 'PE-11 (1)']
  },
  'CCI-000962': {
    def: 'The organization provides a long-term alternate power supply for the information system that is self-contained and not reliant on external power generation.',
    nist: ['PE-11 (2)', 'PE-11 (2).1']
  },
  'CCI-000963': {
    def: 'The organization employs and maintains automatic emergency lighting for the information system that activates in the event of a power outage or disruption and that covers emergency exits and evacuation routes within the facility.',
    nist: ['PE-12', 'PE-12.1 (i) (ii)(iii)', 'PE-12']
  },
  'CCI-000964': {
    def: 'The organization provides emergency lighting for all areas within the facility supporting essential missions and business functions.',
    nist: ['PE-12 (1)', 'PE-12 (1).1']
  },
  'CCI-000981': {
    def: 'The organization authorizes organization-defined types of information system components entering and exiting the facility.',
    nist: ['PE-16', 'PE-16.1 (ii)', 'PE-16']
  },
  'CCI-000982': {
    def: 'The organization monitors organization-defined types of information system components entering and exiting the facility.',
    nist: ['PE-16', 'PE-16.1 (ii)', 'PE-16']
  },
  'CCI-000983': {
    def: 'The organization controls organization-defined types of information system components entering and exiting the facility.',
    nist: ['PE-16', 'PE-16.1 (ii)', 'PE-16']
  },
  'CCI-000984': {
    def: 'The organization maintains records of information system components entering and exiting the facility.',
    nist: ['PE-16', 'PE-16.1 (iii)', 'PE-16']
  },
  'CCI-000985': {
    def: 'The organization employs organization-defined security controls at alternate work sites.',
    nist: ['PE-17 a', 'PE-17.1 (ii)', 'PE-17 a']
  },
  'CCI-000986': {
    def: 'The organization defines management, operational, and technical information system security controls to be employed at alternate work sites.',
    nist: ['PE-17 a', 'PE-17.1 (i)']
  },
  'CCI-000987': {
    def: 'The organization assesses as feasible, the effectiveness of security controls at alternate work sites.',
    nist: ['PE-17 b', 'PE-17.1 (iii)', 'PE-17 b']
  },
  'CCI-000988': {
    def: 'The organization provides a means for employees to communicate with information security personnel in case of security incidents or problems.',
    nist: ['PE-17 c', 'PE-17.1 (iv)', 'PE-17 c']
  },
  'CCI-000989': {
    def: 'The organization positions information system components within the facility to minimize potential damage from organization-defined physical and environmental hazards.',
    nist: ['PE-18', 'PE-18.1 (i)', 'PE-18']
  },
  'CCI-000990': {
    def: 'The organization positions information system components within the facility to minimize potential damage from environmental hazards.',
    nist: ['PE-18', 'PE-18.1 (i)']
  },
  'CCI-000991': {
    def: 'The organization positions information system components within the facility to minimize the opportunity for unauthorized access.',
    nist: ['PE-18', 'PE-18.1 (ii)', 'PE-18']
  },
  'CCI-000992': {
    def: 'The organization plans the location or site of the facility where the information system resides with regard to physical and environmental hazards, and for existing facilities, considers the physical and environmental hazards in its risk mitigation strategy.',
    nist: ['PE-18 (1)', 'PE-18 (1).1 (i and ii)']
  },
  'CCI-000993': {
    def: 'The organization protects the information system from information leakage due to electromagnetic signals emanations.',
    nist: ['PE-19', 'PE-19.1', 'PE-19']
  },
  'CCI-000994': {
    def: 'The organization ensures that information system components, associated data communications, and networks are protected in accordance with national emissions and TEMPEST policies and procedures based on the security category or classification of the information.',
    nist: ['PE-19 (1)', 'PE-19 (1).1', 'PE-19 (1)']
  },
  'CCI-000995': {
    def: 'The organization develops and documents a media protection policy that addresses purpose, scope, roles, responsibilities, management commitment, coordination among organizational entities, and compliance.',
    nist: ['MP-1 a', 'MP-1.1 (i and ii)', 'MP-1 a 1']
  },
  'CCI-000996': {
    def: 'The organization disseminates to organization-defined personnel or roles a media protection policy.',
    nist: ['MP-1 a', 'MP-1.1 (iii)', 'MP-1 a 1']
  },
  'CCI-000997': {
    def: 'The organization reviews and updates the current media protection policy in accordance with organization-defined frequency.',
    nist: ['MP-1 a', 'MP-1.2 (ii)', 'MP-1 b 1']
  },
  'CCI-000998': {
    def: 'The organization defines a frequency for reviewing and updating the current media protection policy.',
    nist: ['MP-1 a', 'MP-1.2 (i)', 'MP-1 b 1']
  },
  'CCI-000999': {
    def: 'The organization develops and documents procedures to facilitate the implementation of the media protection policy and associated media protection controls.',
    nist: ['MP-1 b', 'MP-1.1 (iv and v)', 'MP-1 a 2']
  },
  'CCI-001000': {
    def: 'The organization disseminates to organization-defined personnel or roles procedures to facilitate the implementation of the media protection policy and associated media protection controls.',
    nist: ['MP-1 b', 'MP-1.1 (vi)', 'MP-1 a 2']
  },
  'CCI-001001': {
    def: 'The organization reviews and updates the current media protection procedures in accordance with organization-defined frequency.',
    nist: ['MP-1 b', 'MP-1.2 (iv)', 'MP-1 b 2']
  },
  'CCI-001002': {
    def: 'The organization defines a frequency for reviewing and updating the current media protection procedures.',
    nist: ['MP-1 b', 'MP-1.2 (iii)', 'MP-1 b 2']
  },
  'CCI-001003': {
    def: 'The organization restricts access to organization-defined types of digital and/or non-digital media to organization-defined personnel or roles.',
    nist: ['MP-2', 'MP-2.1 (ii)', 'MP-2']
  },
  'CCI-001004': {
    def: 'The organization defines types of digital and/or non-digital media for which the organization restricts access.',
    nist: ['MP-2', 'MP-2.1 (i)', 'MP-2']
  },
  'CCI-001005': {
    def: 'The organization defines personnel or roles from which to restrict access to organization-defined types of digital and/or non-digital media.',
    nist: ['MP-2', 'MP-2.1 (i)', 'MP-2']
  },
  'CCI-001006': {
    def: 'The organization defines security measures for restricting access to media.',
    nist: ['MP-2', 'MP-2.1 (i)']
  },
  'CCI-001007': {
    def: 'The organization employs automated mechanisms to restrict access to media storage areas.',
    nist: ['MP-2 (1)', 'MP-2 (1).1 (i)', 'MP-4 (2)']
  },
  'CCI-001008': {
    def: 'The organization employs automated mechanisms to audit access attempts and access granted to media storage areas.',
    nist: ['MP-2 (1)', 'MP-2 (1).1 (ii)', 'MP-4 (2)']
  },
  'CCI-001009': {
    def: 'The information system uses cryptographic mechanisms to protect and restrict access to information on portable digital media.',
    nist: ['MP-2 (2)', 'MP-2 (2).1']
  },
  'CCI-001014': {
    def: 'The organization physically controls and securely stores organization-defined types of digital and/or non-digital media within organization-defined controlled areas.',
    nist: ['MP-4 a', 'MP-4.1 (ii)', 'MP-4 a']
  },
  'CCI-001015': {
    def: 'The organization defines types of digital and/or non-digital media to physically control and securely store within organization-defined controlled areas.',
    nist: ['MP-4 a', 'MP-4.1 (i)', 'MP-4 a']
  },
  'CCI-001016': {
    def: 'The organization defines controlled areas where organization-defined types of digital and/or non-digital media are physically controlled and securely stored.',
    nist: ['MP-4 a', 'MP-4.1 (i)', 'MP-4 a']
  },
  'CCI-001017': {
    def: 'The organization defines security measures for securing media storage.',
    nist: ['MP-4 a', 'MP-4.1 (i)']
  },
  'CCI-001018': {
    def: 'The organization protects information system media until the media are destroyed or sanitized using approved equipment, techniques, and procedures.',
    nist: ['MP-4 b', 'MP-4.1 (iii)', 'MP-4 b']
  },
  'CCI-001019': {
    def: 'The organization employs cryptographic mechanisms to protect information in storage.',
    nist: ['MP-4 (1)', 'MP-4 (1).1']
  },
  'CCI-001020': {
    def: 'The organization protects and controls organization-defined types of information system media during transport outside of controlled areas using organization-defined security safeguards.',
    nist: ['MP-5 a', 'MP-5.1 (ii)', 'MP-5 a']
  },
  'CCI-001021': {
    def: 'The organization defines types of information system media protected and controlled during transport outside of controlled areas.',
    nist: ['MP-5 a', 'MP-5', 'MP-5 a']
  },
  'CCI-001022': {
    def: 'The organization defines security safeguards to be used to protect and control organization-defined types of information system media during transport outside of controlled areas.',
    nist: ['MP-5 a', 'MP-5.1 (i)', 'MP-5 a']
  },
  'CCI-001023': {
    def: 'The organization maintains accountability for information system media during transport outside of controlled areas.',
    nist: ['MP-5 b', 'MP-5.1 (iii)', 'MP-5 b']
  },
  'CCI-001024': {
    def: 'The organization restricts the activities associated with the transport of information system media to authorized personnel.',
    nist: ['MP-5 c', 'MP-5.1 (v)', 'MP-5 d']
  },
  'CCI-001025': {
    def: 'The organization documents activities associated with the transport of information system media.',
    nist: ['MP-5 (2)', 'MP-5 (2).1', 'MP-5 c']
  },
  'CCI-001026': {
    def: 'The organization employs an identified custodian during transport of information system media outside of controlled areas.',
    nist: ['MP-5 (3)', 'MP-5 (3).1', 'MP-5 (3)']
  },
  'CCI-001027': {
    def: 'The information system implements cryptographic mechanisms to protect the confidentiality and integrity of information stored on digital media during transport outside of controlled areas.',
    nist: ['MP-5 (4)', 'MP-5 (4).1', 'MP-5 (4)']
  },
  'CCI-001028': {
    def: 'The organization sanitizes organization-defined information system media prior to disposal, release out of organizational control, or release for reuse using organization-defined sanitization techniques and procedures in accordance with applicable federal and organizational standards and policies.',
    nist: ['MP-6', 'MP-6.1 (ii)', 'MP-6 a']
  },
  'CCI-001029': {
    def: 'The organization tracks, documents, and verifies media sanitization and disposal actions.',
    nist: ['MP-6 (1)', 'MP-6 (1).1']
  },
  'CCI-001030': {
    def: 'The organization tests sanitization equipment and procedures in accordance with the organization-defined frequency to verify that the intended sanitization is being achieved.',
    nist: ['MP-6 (2)', 'MP-6 (2).1 (ii)', 'MP-6 (2)']
  },
  'CCI-001031': {
    def: 'The organization defines a frequency for testing sanitization equipment and procedures to verify that the intended sanitization is being achieved.',
    nist: ['MP-6 (2)', 'MP-6 (2).1 (i)', 'MP-6 (2)']
  },
  'CCI-001032': {
    def: 'The organization applies nondestructive sanitization techniques to portable storage devices prior to connecting such devices to the information system in accordance with organization-defined circumstances requiring sanitization of portable storage devices.',
    nist: ['MP-6 (3)', 'MP-6 (3).1 (ii)', 'MP-6 (3)']
  },
  'CCI-001033': {
    def: 'The organization defines circumstances requiring sanitization of portable storage devices prior to connecting such devices to the information system.',
    nist: ['MP-6 (3)', 'MP-6 (3).1 (i)', 'MP-6 (3)']
  },
  'CCI-001034': {
    def: 'The organization sanitizes information system media containing Controlled Unclassified Information (CUI) or other sensitive information in accordance with applicable organizational and/or federal standards and policies.',
    nist: ['MP-6 (4)', 'MP-6 (4).1 (ii)']
  },
  'CCI-001035': {
    def: 'The organization sanitizes information system media containing classified information in accordance with NSA standards and policies.',
    nist: ['MP-6 (5)', 'MP-6 (5).1 (ii)']
  },
  'CCI-001036': {
    def: 'The organization destroys information system media that cannot be sanitized.',
    nist: ['MP-6 (6)', 'MP-6 (6).1 (ii)']
  },
  'CCI-001037': {
    def: 'The organization develops and documents a risk assessment policy that addresses purpose, scope, roles, responsibilities, management commitment, coordination among organizational entities, and compliance.',
    nist: ['RA-1 a', 'RA-1.1 (i) (ii)', 'RA-1 a 1']
  },
  'CCI-001038': {
    def: 'The organization disseminates a risk assessment policy that addresses purpose, scope, roles, responsibilities, management commitment, coordination among organizational entities, and compliance to organization-defined personnel or roles.',
    nist: ['RA-1 a', 'RA-1.1 (iii)', 'RA-1 a 1']
  },
  'CCI-001039': {
    def: 'The organization reviews and updates the current risk assessment policy in accordance with organization-defined frequency.',
    nist: ['RA-1 a', 'RA-1.2 (ii)', 'RA-1 b 1']
  },
  'CCI-001040': {
    def: 'The organization defines the frequency with which to review and update the current risk assessment policy.',
    nist: ['RA-1 a', 'RA-1.2 (i)', 'RA-1 b 1']
  },
  'CCI-001041': {
    def: 'The organization develops and documents procedures to facilitate the implementation of the risk assessment policy and associated risk assessment controls.',
    nist: ['RA-1 b', 'RA-1.1 (iv) (v)', 'RA-1 a 2']
  },
  'CCI-001042': {
    def: 'The organization disseminates risk assessment procedures to facilitate the implementation of the risk assessment policy and associated risk assessment controls to organization-defined personnel or roles.',
    nist: ['RA-1 b', 'RA-1.1 (vi)', 'RA-1 a 2']
  },
  'CCI-001043': {
    def: 'The organization reviews and updates the current risk assessment procedures in accordance with organization-defined frequency.',
    nist: ['RA-1 b', 'RA-1.2 (iv)', 'RA-1 b 2']
  },
  'CCI-001044': {
    def: 'The organization defines the frequency with which to review and update the current risk assessment procedures.',
    nist: ['RA-1 b', 'RA-1.2 (iii)', 'RA-1 b 2']
  },
  'CCI-001045': {
    def: 'The organization categorizes information and the information system in accordance with applicable federal laws, Executive Orders, directives, policies, regulations, standards, and guidance.',
    nist: ['RA-2 a', 'RA-2.1 (i)', 'RA-2 a']
  },
  'CCI-001046': {
    def: 'The organization documents the security categorization results (including supporting rationale) in the security plan for the information system.',
    nist: ['RA-2 b', 'RA-2.1 (ii)', 'RA-2 b']
  },
  'CCI-001047': {
    def: 'The organization ensures the security categorization decision is reviewed and approved by the authorizing official or authorizing official designated representative.',
    nist: ['RA-2 c', 'RA-2.1 (iii)', 'RA-2 c']
  },
  'CCI-001074': {
    def: 'The organization develops a system and communications protection policy that addresses purpose, scope, roles, responsibilities, management commitment, coordination among organizational entities, and compliance.',
    nist: ['SC-1 a', 'SC-1.1 (i) (ii)', 'SC-1 a 1']
  },
  'CCI-001075': {
    def: 'The organization disseminates to organization-defined personnel or roles the system and communications protection policy.',
    nist: ['SC-1 a', 'SC-1.1 (iii)', 'SC-1 a 1']
  },
  'CCI-001076': {
    def: 'The organization reviews and updates the system and communications protection policy in accordance with organization-defined frequency.',
    nist: ['SC-1 a', 'SC-1.2 (ii)', 'SC-1 b 1']
  },
  'CCI-001077': {
    def: 'The organization defines the frequency for reviewing and updating the system and communications protection policy.',
    nist: ['SC-1 a', 'SC-1.2 (i)', 'SC-1 b 1']
  },
  'CCI-001078': {
    def: 'The organization develops system and communications protection procedures to facilitate the implementation of the system and communications protection policy and associated system and communications protection controls.',
    nist: ['SC-1 b', 'SC-1.1 (iv) (v)', 'SC-1 a 2']
  },
  'CCI-001079': {
    def: 'The organization disseminates to organization-defined personnel or roles the procedures to facilitate the implementation of the system and communications protection policy and associated system and communications protection controls.',
    nist: ['SC-1 b', 'SC-1.1 (vi)', 'SC-1 a 2']
  },
  'CCI-001080': {
    def: 'The organization reviews and updates the system and communications protection procedures in accordance with organization-defined frequency.',
    nist: ['SC-1 b', 'SC-1.2 (iv)', 'SC-1 b 2']
  },
  'CCI-001081': {
    def: 'The organization defines the frequency of system and communications protection procedure reviews and updates.',
    nist: ['SC-1 b', 'SC-1.2 (iii)', 'SC-1 b 2']
  },
  'CCI-001082': {
    def: 'The information system separates user functionality (including user interface services) from information system management functionality.',
    nist: ['SC-2', 'SC-2.1', 'SC-2']
  },
  'CCI-001083': {
    def: 'The information system prevents the presentation of information system management-related functionality at an interface for non-privileged users.',
    nist: ['SC-2 (1)', 'SC-2 (1).1', 'SC-2 (1)']
  },
  'CCI-001090': {
    def: 'The information system prevents unauthorized and unintended information transfer via shared system resources.',
    nist: ['SC-4', 'SC-4.1', 'SC-4']
  },
  'CCI-001091': {
    def: 'The information system does not share resources that are used to interface with systems operating at different security levels.',
    nist: ['SC-4 (1)', 'SC-4 (1).1']
  },
  'CCI-001092': {
    def: 'The information system protects against or limits the effects of the organization-defined or referenced types of denial of service attacks.',
    nist: ['SC-5', 'SC-5.1 (ii)']
  },
  'CCI-001093': {
    def: 'The organization defines the types of denial of service attacks (or provides references to sources of current denial of service attacks) that can be addressed by the information system.',
    nist: ['SC-5', 'SC-5.1 (i)', 'SC-5']
  },
  'CCI-001094': {
    def: 'The information system restricts the ability of individuals to launch organization-defined denial of service attacks against other information systems.',
    nist: ['SC-5 (1)', 'SC-5 (1).1', 'SC-5 (1)']
  },
  'CCI-001095': {
    def: 'The information system manages excess capacity, bandwidth, or other redundancy to limit the effects of information flooding types of denial of service attacks.',
    nist: ['SC-5 (2)', 'SC-5 (2).1', 'SC-5 (2)']
  },
  'CCI-001096': {
    def: 'The information system limits the use of resources by priority.',
    nist: ['SC-6', 'SC-6.1']
  },
  'CCI-001127': {
    def: 'The information system protects the integrity of transmitted information.',
    nist: ['SC-8', 'SC-8.1']
  },
  'CCI-001128': {
    def: 'The organization employs cryptographic mechanisms to recognize changes to information during transmission unless otherwise protected by alternative physical measures.',
    nist: ['SC-8 (1)', 'SC-8 (1).1']
  },
  'CCI-001129': {
    def: 'The information system maintains the integrity of information during aggregation, packaging, and transformation in preparation for transmission.',
    nist: ['SC-8 (2)', 'SC-8 (2).1']
  },
  'CCI-001130': {
    def: 'The information system protects the confidentiality of transmitted information.',
    nist: ['SC-9', 'SC-9.1']
  },
  'CCI-001131': {
    def: 'The organization employs cryptographic mechanisms to prevent unauthorized disclosure of information during transmission unless otherwise protected by alternative physical measures.',
    nist: ['SC-9 (1)', 'SC-9 (1).1']
  },
  'CCI-001132': {
    def: 'The information system maintains the confidentiality of information during aggregation, packaging, and transformation in preparation for transmission.',
    nist: ['SC-9 (2)', 'SC-9 (2).1']
  },
  'CCI-001133': {
    def: 'The information system terminates the network connection associated with a communications session at the end of the session or after an organization-defined time period of inactivity.',
    nist: ['SC-10', 'SC-10.1 (ii)', 'SC-10']
  },
  'CCI-001134': {
    def: 'The organization defines the time period of inactivity after which the information system terminates a network connection associated with a communications session.',
    nist: ['SC-10', 'SC-10.1 (i)', 'SC-10']
  },
  'CCI-001137': {
    def: 'The organization establishes cryptographic keys for required cryptography employed within the information system.',
    nist: ['SC-12', 'SC-12.1']
  },
  'CCI-001138': {
    def: 'The organization manages cryptographic keys for required cryptography employed within the information system.',
    nist: ['SC-12', 'SC-12.1']
  },
  'CCI-001139': {
    def: 'The organization maintains availability of information in the event of the loss of cryptographic keys by users.',
    nist: ['SC-12 (1)', 'SC-12 (1).1', 'SC-12 (1)']
  },
  'CCI-001140': {
    def: 'The organization produces, controls, and distributes symmetric cryptographic keys using NIST-approved or NSA-approved key management technology and processes.',
    nist: ['SC-12 (2)', 'SC-12 (2).1']
  },
  'CCI-001141': {
    def: 'The organization produces, controls, and distributes symmetric and asymmetric cryptographic keys using NSA-approved key management technology and processes.',
    nist: ['SC-12 (3)', 'SC-12 (3).1']
  },
  'CCI-001142': {
    def: 'The organization produces, controls, and distributes asymmetric cryptographic keys using approved PKI Class 3 certificates or prepositioned keying material.',
    nist: ['SC-12 (4)', 'SC-12 (4).1']
  },
  'CCI-001143': {
    def: "The organization produces, controls, and distributes asymmetric cryptographic keys using approved PKI Class 3 or Class 4 certificates and hardware security tokens that protect the user's private key.",
    nist: ['SC-12 (5)', 'SC-12 (5).1']
  },
  'CCI-001144': {
    def: 'The information system implements required cryptographic protections using cryptographic modules that comply with applicable federal laws, Executive Orders, directives, policies, regulations, standards, and guidance.',
    nist: ['SC-13', 'SC-13.1']
  },
  'CCI-001145': {
    def: 'The organization employs, at a minimum, FIPS-validated cryptography to protect unclassified information.',
    nist: ['SC-13 (1)', 'SC-13 (1).1']
  },
  'CCI-001146': {
    def: 'The organization employs NSA-approved cryptography to protect classified information.',
    nist: ['SC-13 (2)', 'SC013 (2(.1']
  },
  'CCI-001147': {
    def: 'The organization employs, at a minimum, FIPS-validated cryptography to protect information when such information must be separated from individuals who have the necessary clearances yet lack the necessary access approvals.',
    nist: ['SC-13 (3)', 'SC-13 (3).1']
  },
  'CCI-001149': {
    def: 'The information system protects the integrity and availability of publicly available information and applications.',
    nist: ['SC-14', 'SC-14.1']
  },
  'CCI-001150': {
    def: 'The information system prohibits remote activation of collaborative computing devices, excluding the organization-defined exceptions where remote activation is to be allowed.',
    nist: ['SC-15 a', 'SC-15.1 (ii)', 'SC-15 a']
  },
  'CCI-001151': {
    def: 'The organization defines exceptions to the prohibition of collaborative computing devices where remote activation is to be allowed.',
    nist: ['SC-15 a', 'SC-15.1 (i)', 'SC-15 a']
  },
  'CCI-001152': {
    def: 'The information system provides an explicit indication of use to users physically present at collaborative computing devices.',
    nist: ['SC-15 b', 'SC-15.1 (iii)', 'SC-15 b']
  },
  'CCI-001153': {
    def: 'The information system provides physical disconnect of collaborative computing devices in a manner that supports ease of use.',
    nist: ['SC-15 (1)', 'SC-15 (1).1', 'SC-15 (1)']
  },
  'CCI-001154': {
    def: 'The information system or supporting environment blocks both inbound and outbound traffic between instant messaging clients that are independently configured by end users and external service providers.',
    nist: ['SC-15 (2)', 'SC-15 (2).1']
  },
  'CCI-001155': {
    def: 'The organization disables or removes collaborative computing devices from organization-defined information systems or information system components in organization-defined secure work areas.',
    nist: ['SC-15 (3)', 'SC-15 (3).1 (ii)', 'SC-15 (3)']
  },
  'CCI-001156': {
    def: 'The organization defines secure work areas where collaborative computing devices are to be disabled or removed.',
    nist: ['SC-15 (3)', 'SC-15 (3).1 (i)', 'SC-15 (3)']
  },
  'CCI-001157': {
    def: 'The information system associates organization-defined security attributes with information exchanged between information systems.',
    nist: ['SC-16', 'SC-16.1', 'SC-16']
  },
  'CCI-001158': {
    def: 'The information system validates the integrity of transmitted security attributes.',
    nist: ['SC-16 (1)', 'SC-16 (1).1', 'SC-16 (1)']
  },
  'CCI-001159': {
    def: 'The organization issues public key certificates under an organization-defined certificate policy or obtains public key certificates from an approved service provider.',
    nist: ['SC-17', 'SC-17.1', 'SC-17']
  },
  'CCI-001180': {
    def: 'The information system performs data origin authentication and data integrity verification on the name/address resolution responses the system receives from authoritative sources when requested by client systems.',
    nist: ['SC-21', 'SC-21.1']
  },
  'CCI-001181': {
    def: 'The information system performs data origin authentication and data integrity verification on all resolution responses received whether or not local client systems explicitly request this service.',
    nist: ['SC-21 (1)', 'SC-21 (1).1']
  },
  'CCI-001194': {
    def: 'The information system employs organization-defined information system components with minimal functionality and information storage.',
    nist: ['SC-25', 'SC-25.1', 'SC-25']
  },
  'CCI-001195': {
    def: 'The information system includes components specifically designed to be the target of malicious attacks for the purpose of detecting, deflecting, and analyzing such attacks.',
    nist: ['SC-26', 'SC-26.1', 'SC-26']
  },
  'CCI-001196': {
    def: 'The information system includes components that proactively seek to identify malicious websites and/or web-based malicious code.',
    nist: ['SC-26 (1)', 'SC-26 (1).1', 'SC-35']
  },
  'CCI-001197': {
    def: 'The information system includes organization-defined platform-independent applications.',
    nist: ['SC-27', 'SC-27.1 (ii)', 'SC-27']
  },
  'CCI-001198': {
    def: 'The organization defines applications that are platform independent.',
    nist: ['SC-27', 'SC-27.1 (i)', 'SC-27']
  },
  'CCI-001201': {
    def: 'The organization employs a diverse set of information technologies for organization-defined information system components in the implementation of the information system.',
    nist: ['SC-29', 'SC-29.1', 'SC-29']
  },
  'CCI-001202': {
    def: 'The organization employs virtualization techniques to present information system components as other types of components, or components with differing configurations.',
    nist: ['SC-30', 'SC-30.1']
  },
  'CCI-001203': {
    def: 'The organization employs virtualization techniques to support the deployment of a diversity of operating systems that are changed on an organization-defined frequency.',
    nist: ['SC-30 (1)', 'SC-30 (1).1 (ii)', 'SC-29 (1)']
  },
  'CCI-001204': {
    def: 'The organization defines the frequency of changes to operating systems and applications to support a diversity of deployments.',
    nist: ['SC-30 (1)', 'SC-30 (1).1 (i)', 'SC-29 (1)']
  },
  'CCI-001205': {
    def: 'The organization employs randomness in the implementation of the virtualization techniques.',
    nist: ['SC-30 (2)', 'SC-30 (2).1']
  },
  'CCI-001206': {
    def: 'The organization requires that information system developers/integrators perform a covert channel analysis to identify those aspects of system communication that are potential avenues for covert storage and timing channels.',
    nist: ['SC-31', 'SC-31.1']
  },
  'CCI-001207': {
    def: 'The organization tests a subset of the identified covert channels to determine which channels are exploitable.',
    nist: ['SC-31 (1)', 'SC-31 (1).1', 'SC-31 (1)']
  },
  'CCI-001208': {
    def: 'The organization partitions the information system into components residing in separate physical domains (or environments) as deemed necessary.',
    nist: ['SC-32', 'SC-32.1']
  },
  'CCI-001209': {
    def: 'The information system protects the integrity of information during the processes of data aggregation, packaging, and transformation in preparation for transmission.',
    nist: ['SC-33', 'SC-33.1']
  },
  'CCI-001210': {
    def: 'The information system, at organization-defined information system components, loads and executes the operating environment from hardware-enforced, read-only media.',
    nist: ['SC-34 a', 'SC-34.1 (iii)', 'SC-34 a']
  },
  'CCI-001211': {
    def: 'The information system, at organization-defined information system components, loads and executes organization-defined applications from hardware-enforced, read-only media.',
    nist: ['SC-34 b', 'SC-34.1 (iii)', 'SC-34 b']
  },
  'CCI-001212': {
    def: 'The organization defines information system components on which the operating environment and organization-defined applications are loaded and executed from hardware-enforced, read-only media.',
    nist: ['SC-34', 'SC-34.1 (ii)', 'SC-34']
  },
  'CCI-001213': {
    def: 'The organization defines applications that will be loaded and executed from hardware-enforced, read-only media.',
    nist: ['SC-34 b', 'SC-34.1 (i)', 'SC-34 b']
  },
  'CCI-001214': {
    def: 'The organization employs organization-defined information system components with no writeable storage that are persistent across component restart or power on/off.',
    nist: ['SC-34 (1)', 'SC-34 (1).1 (ii)', 'SC-34 (1)']
  },
  'CCI-001215': {
    def: 'The organization defines the information system components to be employed with no writeable storage.',
    nist: ['SC-34 (1)', 'SC-34 (1).1 (i)', 'SC-34 (1)']
  },
  'CCI-001216': {
    def: 'The organization protects the integrity of information prior to storage on read-only media.',
    nist: ['SC-34 (2)', 'SC-34 (2).1', 'SC-34 (2)']
  },
  'CCI-001217': {
    def: 'The organization develops and documents a system and information integrity policy that addresses purpose, scope, roles, responsibilities, management commitment, coordination among organizational entities, and compliance.',
    nist: ['SI-1 a', 'SI-1.1 (i) (ii)', 'SI-1 a 1']
  },
  'CCI-001218': {
    def: 'The organization disseminates the system and information integrity policy to organization-defined personnel or roles.',
    nist: ['SI-1 a', 'SI-1.1 (iii)', 'SI-1 a 1']
  },
  'CCI-001219': {
    def: 'The organization reviews and updates system and information integrity policy in accordance with organization-defined frequency.',
    nist: ['SI-1 a', 'SI-1.2 (ii)', 'SI-1 b 1']
  },
  'CCI-001220': {
    def: 'The organization develops and documents procedures to facilitate the implementation of the system and information integrity policy and associated system integrity controls.',
    nist: ['SI-1 b', 'SI-1.1 (iv) (v)', 'SI-1 a 2']
  },
  'CCI-001221': {
    def: 'The organization disseminates to organization-defined personnel or roles procedures to facilitate the implementation of the system and information integrity policy and associated system integrity controls.',
    nist: ['SI-1 b', 'SI-1.1 (vi)', 'SI-1 a 2']
  },
  'CCI-001222': {
    def: 'The organization reviews and updates system and information integrity procedures in accordance with organization-defined frequency.',
    nist: ['SI-1 b', 'SI-1.2 (iv)', 'SI-1 b 2']
  },
  'CCI-001223': {
    def: 'The organization defines the frequency of system and information integrity policy reviews and updates.',
    nist: ['SI-1 a', 'SI-1.2 (i)', 'SI-1 b 1']
  },
  'CCI-001224': {
    def: 'The organization defines the frequency of system and information integrity procedure reviews and updates.',
    nist: ['SI-1 b', 'SI-1.2 (iii)', 'SI-1 b 2']
  },
  'CCI-001285': {
    def: 'The organization receives information system security alerts, advisories, and directives from organization-defined external organizations on an ongoing basis.',
    nist: ['SI-5 a', 'SI-5.1 (i)', 'SI-5 a']
  },
  'CCI-001286': {
    def: 'The organization generates internal security alerts, advisories, and directives as deemed necessary.',
    nist: ['SI-5 b', 'SI-5.1 (ii)', 'SI-5 b']
  },
  'CCI-001287': {
    def: 'The organization disseminates security alerts, advisories, and directives to organization-defined personnel or roles, organization-defined elements within the organization, and/or organization-defined external organizations.',
    nist: ['SI-5 c', 'SI-5.1 (iv)', 'SI-5 c']
  },
  'CCI-001288': {
    def: 'The organization defines the personnel or roles to whom the organization will disseminate security alerts, advisories, and directives.',
    nist: ['SI-5 c', 'SI-5.1 (iii)', 'SI-5 c']
  },
  'CCI-001289': {
    def: 'The organization implements security directives in accordance with established time frames, or notifies the issuing organization of the degree of noncompliance.',
    nist: ['SI-5 d', 'SI-5.1 (v)', 'SI-5 d']
  },
  'CCI-001290': {
    def: 'The organization employs automated mechanisms to make security alert and advisory information available throughout the organization.',
    nist: ['SI-5 (1)', 'SI-5 (1).1', 'SI-5 (1)']
  },
  'CCI-001297': {
    def: 'The information system detects unauthorized changes to software and information.',
    nist: ['SI-7', 'SI-7.1']
  },
  'CCI-001298': {
    def: 'The organization reassesses the integrity of software and information by performing, on an organization-defined frequency, integrity scans of the information system.',
    nist: ['SI-7 (1)', 'SI-7 (1).1 (ii)']
  },
  'CCI-001299': {
    def: 'The organization defines the frequency of integrity scans to be performed on the information system.',
    nist: ['SI-7 (1)', 'SI-7 (1).1 (i)']
  },
  'CCI-001300': {
    def: 'The organization employs automated tools that provide notification to organization-defined personnel or roles upon discovering discrepancies during integrity verification.',
    nist: ['SI-7 (2)', 'SI-7 (2).1', 'SI-7 (2)']
  },
  'CCI-001301': {
    def: 'The organization employs centrally managed integrity verification tools.',
    nist: ['SI-7 (3)', 'SI-7 (3).1', 'SI-7 (3)']
  },
  'CCI-001302': {
    def: 'The organization requires use of tamper-evident packaging for organization-defined information system components during organization-defined conditions.',
    nist: ['SI-7 (4)', 'SI-7 (4).1 (iii)']
  },
  'CCI-001303': {
    def: 'The organization defines information system components that require tamper-evident packaging.',
    nist: ['SI-7 (4)', 'SI-7 (4).1 (i)']
  },
  'CCI-001304': {
    def: 'The organization defines conditions (i.e., transportation from vendor to operational site, during operation, both) under which tamper-evident packaging must be used for organization-defined information system components.',
    nist: ['SI-7 (4)', 'SI-7 (4).1 (ii)']
  },
  'CCI-001309': {
    def: 'The organization restricts the capability to input information to the information system to authorized personnel.',
    nist: ['SI-9', 'SI-9.1']
  },
  'CCI-001310': {
    def: 'The information system checks the validity of organization-defined inputs.',
    nist: ['SI-10', 'SI-10.1', 'SI-10']
  },
  'CCI-001311': {
    def: 'The information system identifies potentially security-relevant error conditions.',
    nist: ['SI-11 a', 'SI-11.1 (i)']
  },
  'CCI-001312': {
    def: 'The information system generates error messages that provide information necessary for corrective actions without revealing information that could be exploited by adversaries.',
    nist: ['SI-11 b', 'SI-11.1 (iii)', 'SI-11 a']
  },
  'CCI-001313': {
    def: 'The organization defines sensitive or potentially harmful information that should not be contained in error logs and administrative messages.',
    nist: ['SI-11 b', 'SI-11.1 (ii)']
  },
  'CCI-001314': {
    def: 'The information system reveals error messages only to organization-defined personnel or roles.',
    nist: ['SI-11 c', 'SI-11.1 (iv)', 'SI-11 b']
  },
  'CCI-001462': {
    def: 'The information system provides the capability for authorized users to capture/record and log content related to a user session.',
    nist: ['AU-14 a', 'AU-14.1 (i)', 'AU-14 (2)']
  },
  'CCI-001463': {
    def: 'The information system provides the capability to remotely view/hear all content related to an established user session in real time.',
    nist: ['AU-14 b', 'AU-14.1 (ii)']
  },
  'CCI-001464': {
    def: 'The information system initiates session audits at system start-up.',
    nist: ['AU-14 (1)', 'AU-14 (1).1', 'AU-14 (1)']
  },
  'CCI-001473': {
    def: 'The organization designates individuals authorized to post information onto a publicly accessible information system.',
    nist: ['AC-22 a', 'AC-22.1 (i)', 'AC-22 a']
  },
  'CCI-001474': {
    def: 'The organization trains authorized individuals to ensure that publicly accessible information does not contain nonpublic information.',
    nist: ['AC-22 b', 'AC-22.1 (ii)', 'AC-22 b']
  },
  'CCI-001475': {
    def: 'The organization reviews the proposed content of information prior to posting onto the publicly accessible information system to ensure that nonpublic information is not included.',
    nist: ['AC-22 c', 'AC-22.1 (iii)', 'AC-22 c']
  },
  'CCI-001476': {
    def: 'The organization reviews the content on the publicly accessible information system for nonpublic information on an organization-defined frequency.',
    nist: ['AC-22 d', 'AC-22.1 (iv)', 'AC-22 d']
  },
  'CCI-001477': {
    def: 'The organization defines a frequency for reviewing the content on the publicly accessible information system for nonpublic information.',
    nist: ['AC-22 d', 'AC-22.1 (ii)', 'AC-22 d']
  },
  'CCI-001478': {
    def: 'The organization removes nonpublic information from the publicly accessible information system, if discovered.',
    nist: ['AC-22 e', 'AC-22.1 (v)', 'AC-22 d']
  },
  'CCI-001504': {
    def: 'The organization develops and documents a personnel security policy that addresses purpose, scope, roles, responsibilities, management commitment, coordination among organizational entities, and compliance.',
    nist: ['PS-1 a', 'PS-1.1 (i) (ii)', 'PS-1 a 1']
  },
  'CCI-001505': {
    def: 'The organization disseminates a personnel security policy to organization-defined personnel or roles.',
    nist: ['PS-1 a', 'PS-1.1 (iii)', 'PS-1 a 1']
  },
  'CCI-001506': {
    def: 'The organization reviews and updates the current personnel security policy in accordance with organization-defined frequency.',
    nist: ['PS-1 a', 'PS-1.2 (ii)', 'PS-1 b 2']
  },
  'CCI-001507': {
    def: 'The organization defines the frequency with which to review and update the current personnel security policy.',
    nist: ['PS-1 a', 'PS-1.2 (i)', 'PS-1 b 1']
  },
  'CCI-001508': {
    def: 'The organization defines the frequency with which to review and update the current personnel security procedures.',
    nist: ['PS-1 b', 'PS-1.2 (iii)', 'PS-1 b 2']
  },
  'CCI-001509': {
    def: 'The organization develops and documents procedures to facilitate the implementation of the personnel security policy and associated personnel security controls.',
    nist: ['PS-1 b', 'PS-1.1 (iv) (v)', 'PS-1 a 2']
  },
  'CCI-001510': {
    def: 'The organization disseminates personnel security procedures to organization-defined personnel or roles.',
    nist: ['PS-1 b', 'PS-1.1 (vi)', 'PS-1 a 2']
  },
  'CCI-001511': {
    def: 'The organization reviews and updates the current personnel security procedures in accordance with organization-defined frequency.',
    nist: ['PS-1 b', 'PS-1.2 (iv)', 'PS-1 b 2']
  },
  'CCI-001512': {
    def: 'The organization assigns a risk designation to all organizational positions.',
    nist: ['PS-2 a', 'PS-2.1 (i)', 'PS-2 a']
  },
  'CCI-001513': {
    def: 'The organization establishes screening criteria for individuals filling organizational positions.',
    nist: ['PS-2 b', 'PS-2.1 (ii)', 'PS-2 b']
  },
  'CCI-001514': {
    def: 'The organization reviews and updates position risk designations in accordance with organization-defined frequency.',
    nist: ['PS-2 c', 'PS-2.1 (iv)', 'PS-2 c']
  },
  'CCI-001515': {
    def: 'The organization defines the frequency with which to review and update position risk designations.',
    nist: ['PS-2 c', 'PS-2.1 (iii)', 'PS-2 c']
  },
  'CCI-001516': {
    def: 'The organization screens individuals prior to authorizing access to the information system.',
    nist: ['PS-3 a', 'PS-3.1 (i)', 'PS-3 a']
  },
  'CCI-001517': {
    def: 'The organization rescreens individuals with authorized access to the information system according to organization-defined conditions requiring rescreening, and where rescreening is so indicated, on the organization-defined frequency of such rescreening.',
    nist: ['PS-3 b', 'PS-3.1 (iii)', 'PS-3 b']
  },
  'CCI-001518': {
    def: 'The organization defines the conditions requiring rescreening of individuals with authorized access to the information system.',
    nist: ['PS-3 b', 'PS-3.1 (ii)', 'PS-3 b']
  },
  'CCI-001519': {
    def: 'The organization defines the frequency for rescreening individuals with authorized access to the information system when organization-defined conditions requiring rescreening are met.',
    nist: ['PS-3 b', 'PS-3.1 (ii)', 'PS-3 b']
  },
  'CCI-001520': {
    def: 'The organization ensures that individuals accessing an information system processing, storing, or transmitting classified information are cleared and indoctrinated to the highest classification level of the information to which they have access on the system.',
    nist: ['PS-3 (1)', 'PS-3 (1).1 (i) (ii)', 'PS-3 (1)']
  },
  'CCI-001521': {
    def: 'The organization ensures that individuals accessing an information system processing, storing, or transmitting types of classified information which require formal indoctrination, are formally indoctrinated for all of the relevant types of information to which they have access on the system.',
    nist: ['PS-3 (2)', 'PS-3 (2).1', 'PS-3 (2)']
  },
  'CCI-001522': {
    def: 'The organization, upon termination of individual employment, disables information system access within an organization-defined time period.',
    nist: ['PS-4 a', 'PS-4.1 (i)', 'PS-4 a']
  },
  'CCI-001523': {
    def: 'The organization, upon termination of individual employment, conducts exit interviews that include a discussion of organization-defined information security topics.',
    nist: ['PS-4 b', 'PS-4.1 (ii)', 'PS-4 c']
  },
  'CCI-001524': {
    def: 'The organization, upon termination of individual employment, retrieves all security-related organizational information system-related property.',
    nist: ['PS-4 c', 'PS-4.1 (iii)', 'PS-4 d']
  },
  'CCI-001525': {
    def: 'The organization, upon termination of individual employment, retains access to organizational information formerly controlled by the terminated individual.',
    nist: ['PS-4 d', 'PS-4.1 (iv)', 'PS-4 e']
  },
  'CCI-001526': {
    def: 'The organization, upon termination of individual employment, retains access to organizational information systems formerly controlled by the terminated individual.',
    nist: ['PS-4 d', 'PS-4.1 (iv)', 'PS-4 e']
  },
  'CCI-001527': {
    def: 'The organization reviews and confirms the ongoing operational need for current logical and physical access authorizations to information systems/facilities when individuals are reassigned or transferred to other positions within the organization.',
    nist: ['PS-5', 'PS-5.1 (i)', 'PS-5 a']
  },
  'CCI-001528': {
    def: 'The organization initiates organization-defined transfer or reassignment actions within an organization-defined time period following the formal personnel transfer action.',
    nist: ['PS-5', 'PS-5.1 (iii)', 'PS-5 b']
  },
  'CCI-001529': {
    def: 'The organization defines transfer or reassignment actions to initiate within an organization-defined time period following the formal personnel transfer action.',
    nist: ['PS-5', 'PS-5.1 (ii)', 'PS-5 b']
  },
  'CCI-001530': {
    def: 'The organization defines the time period within which the organization initiates organization-defined transfer or reassignment actions following the formal personnel transfer action.',
    nist: ['PS-5', 'PS-5.1 (ii)', 'PS-5 b']
  },
  'CCI-001531': {
    def: 'The organization ensures that individuals requiring access to organizational information and information systems sign appropriate access agreements prior to being granted access.',
    nist: ['PS-6 a', 'PS-6.1 (i) (ii)', 'PS-6 c 1']
  },
  'CCI-001532': {
    def: 'The organization reviews and updates access agreements for organizational information systems in accordance with organization-defined frequency.',
    nist: ['PS-6 b', 'PS-6.1 (iv)', 'PS-6 b']
  },
  'CCI-001533': {
    def: 'The organization defines the frequency with which to review and update access agreements for organizational information systems.',
    nist: ['PS-6 b', 'PS-6.1 (iii)', 'PS-6 b']
  },
  'CCI-001534': {
    def: 'The organization ensures that access to information with special protection measures is granted only to individuals who have a valid access authorization that is demonstrated by assigned official government duties.',
    nist: ['PS-6 (1) (a)', 'PS-6 (1).1']
  },
  'CCI-001535': {
    def: 'The organization ensures that access to information with special protection measures is granted only to individuals who satisfy associated personnel security criteria.',
    nist: ['PS-6 (1) (b)', 'PS-6 (1).1']
  },
  'CCI-001536': {
    def: 'The organization ensures that access to classified information requiring special protection is granted only to individuals who have a valid access authorization that is demonstrated by assigned official government duties.',
    nist: ['PS-6 (2) (a)', 'PS-6 (2).1', 'PS-6 (2) (a)']
  },
  'CCI-001537': {
    def: 'The organization ensures that access to classified information requiring special protection is granted only to individuals who satisfy associated personnel security criteria.',
    nist: ['PS-6 (2) (b)', 'PS-6 (2).1', 'PS-6 (2) (b)']
  },
  'CCI-001538': {
    def: 'The organization ensures that access to classified information requiring special protection is granted only to individuals who have read, understood, and signed a nondisclosure agreement.',
    nist: ['PS-6 (2) (c)', 'PS-6 (2).1', 'PS-6 (2) (c)']
  },
  'CCI-001539': {
    def: 'The organization establishes personnel security requirements including security roles and responsibilities for third-party providers.',
    nist: ['PS-7 a', 'PS-7.1 (i)', 'PS-7 a']
  },
  'CCI-001540': {
    def: 'The organization documents personnel security requirements for third-party providers.',
    nist: ['PS-7 b', 'PS-7.1 (ii)', 'PS-7 c']
  },
  'CCI-001541': {
    def: 'The organization monitors third-party provider compliance with personnel security requirements.',
    nist: ['PS-7 c', 'PS-7.1 (iii)', 'PS-7 e']
  },
  'CCI-001542': {
    def: 'The organization employs a formal sanctions process for individuals failing to comply with established information security policies and procedures.',
    nist: ['PS-8', 'PS-8.1', 'PS-8 a']
  },
  'CCI-002106': {
    def: 'The organization documents the access control policy.',
    nist: ['AC-1 a 1']
  },
  'CCI-002107': {
    def: 'The organization defines the personnel or roles to be recipients of the access control policy necessary to facilitate the implementation of the access control policy and associated access controls.',
    nist: ['AC-1 a 1']
  },
  'CCI-002108': {
    def: 'The organization defines the personnel or roles to be recipients of the procedures necessary to facilitate the implementation of the access control policy and associated access controls.',
    nist: ['AC-1 a 1']
  },
  'CCI-002109': {
    def: 'The organization documents procedures to facilitate the implementation of the access control policy and associated access controls.',
    nist: ['AC-1 a 2']
  },
  'CCI-002110': {
    def: 'The organization defines the information system account types that support the organizational missions/business functions.',
    nist: ['AC-2 a']
  },
  'CCI-002111': {
    def: 'The organization identifies and selects the organization-defined information system account types of information system accounts which support organizational missions/business functions.',
    nist: ['AC-2 a']
  },
  'CCI-002112': {
    def: 'The organization assigns account managers for information system accounts.',
    nist: ['AC-2 b']
  },
  'CCI-002113': {
    def: 'The organization establishes conditions for role membership.',
    nist: ['AC-2 c']
  },
  'CCI-002114': {
    def: 'The organization specifies authorized users of the information system for each account.',
    nist: ['AC-2 d']
  },
  'CCI-002115': {
    def: 'The organization specifies authorized users of the information system.',
    nist: ['AC-2 d']
  },
  'CCI-002116': {
    def: 'The organization specifies authorized group membership on the information system.',
    nist: ['AC-2 d']
  },
  'CCI-002117': {
    def: 'The organization specifies authorized role membership on the information system.',
    nist: ['AC-2 d']
  },
  'CCI-002118': {
    def: 'The organization specifies access authorizations (i.e., privileges) for each account on the information system.',
    nist: ['AC-2 d']
  },
  'CCI-002119': {
    def: 'The organization specifies other attributes for each account on the information system.',
    nist: ['AC-2 d']
  },
  'CCI-002120': {
    def: 'The organization defines the personnel or roles authorized to approve the creation of information system accounts.',
    nist: ['AC-2 e']
  },
  'CCI-002121': {
    def: 'The organization defines the procedures or conditions to be employed when creating, enabling, modifying, disabling, and removing information system accounts.',
    nist: ['AC-2 f']
  },
  'CCI-002122': {
    def: 'The organization monitors the use of information system accounts.',
    nist: ['AC-2 g']
  },
  'CCI-002123': {
    def: 'The organization notifies account managers when accounts are no longer required.',
    nist: ['AC-2 h 1']
  },
  'CCI-002124': {
    def: 'The organization notifies account managers when users are terminated or transferred.',
    nist: ['AC-2 h 2']
  },
  'CCI-002125': {
    def: 'The organization notifies account managers when individual information system usage or need-to-know changes.',
    nist: ['AC-2 h 3']
  },
  'CCI-002126': {
    def: 'The organization authorizes access to the information system based on a valid access authorization.',
    nist: ['AC-2 i 1 ']
  },
  'CCI-002127': {
    def: 'The organization authorizes access to the information system based on intended system usage.',
    nist: ['AC-2 i 2 ']
  },
  'CCI-002128': {
    def: 'The organization authorizes access to the information system based on other attributes as required by the organization or associated missions/business functions.',
    nist: ['AC-2 i 3 ']
  },
  'CCI-002129': {
    def: 'The organization establishes a process for reissuing shared/group account credentials (if deployed) when individuals are removed from the group.',
    nist: ['AC-2 k']
  },
  'CCI-002130': {
    def: 'The information system automatically audits account enabling actions.',
    nist: ['AC-2 (4)']
  },
  'CCI-002131': {
    def: 'The organization defines the personnel or roles to be notified on account creation, modification, enabling, disabling, and removal actions.',
    nist: ['AC-2 (4)']
  },
  'CCI-002132': {
    def: 'The information system notifies organization-defined personnel or roles for account enabling actions.',
    nist: ['AC-2 (4)']
  },
  'CCI-002133': {
    def: 'The organization defines other conditions when users are required to log out.',
    nist: ['AC-2 (5)']
  },
  'CCI-002134': {
    def: 'The organization defines a list of dynamic privilege management capabilities to be implemented by the information system.',
    nist: ['AC-2 (6)']
  },
  'CCI-002135': {
    def: 'The information system implements the organization-defined list of dynamic privilege management capabilities.',
    nist: ['AC-2 (6)']
  },
  'CCI-002136': {
    def: 'The organization defines the actions to be taken when privileged role assignments are no longer appropriate.',
    nist: ['AC-2 (7) (c)']
  },
  'CCI-002137': {
    def: 'The organization takes organization-defined actions when privileged role assignments are no longer appropriate.',
    nist: ['AC-2 (7) (c)']
  },
  'CCI-002138': {
    def: 'The organization defines the information system accounts that can be dynamically created.',
    nist: ['AC-2 (8)']
  },
  'CCI-002139': {
    def: 'The information system creates organization-defined information system accounts dynamically.',
    nist: ['AC-2 (8)']
  },
  'CCI-002140': {
    def: 'The organization defines the conditions for establishing shared/group accounts.',
    nist: ['AC-2 (9)']
  },
  'CCI-002141': {
    def: 'The organization only permits the use of shared/group accounts that meet organization-defined conditions for establishing shared/group accounts.',
    nist: ['AC-2 (9)']
  },
  'CCI-002142': {
    def: 'The information system terminates shared/group account credentials when members leave the group.',
    nist: ['AC-2 (10)']
  },
  'CCI-002143': {
    def: 'The organization defines the circumstances and/or usage conditions that are to be enforced for organization-defined information system accounts.',
    nist: ['AC-2 (11)']
  },
  'CCI-002144': {
    def: 'The organization defines the information system accounts that are to be subject to the enforcement of organization-defined circumstances and/or usage conditions.',
    nist: ['AC-2 (11)']
  },
  'CCI-002145': {
    def: 'The information system enforces organization-defined circumstances and/or usage conditions for organization-defined information system accounts.',
    nist: ['AC-2 (11)']
  },
  'CCI-002146': {
    def: 'The organization defines atypical usage for which the information system accounts are to be monitored.',
    nist: ['AC-2 (12) (a)']
  },
  'CCI-002147': {
    def: 'The organization monitors information system accounts for organization-defined atypical use.',
    nist: ['AC-2 (12) (a)']
  },
  'CCI-002148': {
    def: 'The organization defines the personnel or roles to whom atypical usage of information system accounts are to be reported.',
    nist: ['AC-2 (12) (b)']
  },
  'CCI-002149': {
    def: 'The organization reports atypical usage of information system accounts to organization-defined personnel or roles.',
    nist: ['AC-2 (12) (b)']
  },
  'CCI-002150': {
    def: 'The organization defines the time period within which the accounts of users posing a significant risk are to be disabled after discovery of the risk.',
    nist: ['AC-2 (13)']
  },
  'CCI-002151': {
    def: 'The organization disables accounts of users posing a significant risk within an organization-defined time period of discovery of the risk.',
    nist: ['AC-2 (13)']
  },
  'CCI-002152': {
    def: 'The organization defines other actions necessary for which dual authorization is to be enforced.',
    nist: ['AC-3 (2)']
  },
  'CCI-002153': {
    def: 'The organization defines the mandatory access control policies that are to be enforced over all subjects and objects.',
    nist: ['AC-3 (3)']
  },
  'CCI-002154': {
    def: 'The mandatory access control policy specifies that the policy is uniformly enforced across all subjects and objects within the boundary of the information system.',
    nist: ['AC-3 (3) (a)']
  },
  'CCI-002155': {
    def: 'The mandatory access control policy specifies that a subject that has been granted access to information is constrained from passing the information to unauthorized subjects or objects.',
    nist: ['AC-3 (3) (b) (1)']
  },
  'CCI-002156': {
    def: 'The mandatory access control policy specifies that a subject that has been granted access to information is constrained from granting its privileges to other subjects.',
    nist: ['AC-3 (3) (b) (2)']
  },
  'CCI-002157': {
    def: 'The mandatory access control policy specifies that a subject that has been granted access to information is constrained from changing one or more security attributes on subjects, objects, the information system, or information system components.',
    nist: ['AC-3 (3) (b) (3)']
  },
  'CCI-002158': {
    def: 'The mandatory access control policy specifies that a subject that has been granted access to information is constrained from choosing the security attributes to be associated with newly created or modified objects.',
    nist: ['AC-3 (3) (b) (4)']
  },
  'CCI-002159': {
    def: 'The mandatory access control policy specifies that a subject that has been granted access to information is constrained from choosing the attribute values to be associated with newly created or modified objects.',
    nist: ['AC-3 (3) (b) (4)']
  },
  'CCI-002160': {
    def: 'The mandatory access control policy specifies that a subject that has been granted access to information is constrained from changing the rules governing access control.',
    nist: ['AC-3 (3) (b) (5)']
  },
  'CCI-002161': {
    def: 'The organization defines subjects which may explicitly be granted organization-defined privileges such that they are not limited by some or all of the mandatory access control constraints.',
    nist: ['AC-3 (3) (c)']
  },
  'CCI-002162': {
    def: 'The organization defines the privileges that may explicitly be granted to organization-defined subjects such that they are not limited by some or all of the mandatory access control constraints.',
    nist: ['AC-3 (3) (c)']
  },
  'CCI-002163': {
    def: 'The organization defines the discretionary access control policies the information system is to enforce over subjects and objects.',
    nist: ['AC-3 (4)']
  },
  'CCI-002164': {
    def: 'The organization specifies in the discretionary access control policies that a subject that has been granted access to information can do one or more of the following: pass the information to any other subjects or objects; grant its privileges to other subjects; change security attributes on subjects, objects, the information system, or the information system^s components; choose the security attributes to be associated with newly created or revised objects; and/or change the rules governing access control.',
    nist: ['AC-3 (4) ']
  },
  'CCI-002165': {
    def: 'The information system enforces organization-defined discretionary access control policies over defined subjects and objects.',
    nist: ['AC-3 (4)']
  },
  'CCI-002166': {
    def: 'The organization defines the role-based access control policies the information system is to enforce over all subjects and objects.',
    nist: ['AC-3 (7)']
  },
  'CCI-002167': {
    def: 'The organization defines the subjects over which the information system will enforce a role-based access control policy.',
    nist: ['AC-3 (7)']
  },
  'CCI-002168': {
    def: 'The organization defines the objects over which the information system will enforce a role-based access control policy.',
    nist: ['AC-3 (7)']
  },
  'CCI-002169': {
    def: 'The information system enforces a role-based access control policy over defined subjects and objects.',
    nist: ['AC-3 (7)']
  },
  'CCI-002170': {
    def: 'The information system controls access based upon organization-defined roles and users authorized to assume such roles.',
    nist: ['AC-3 (7)']
  },
  'CCI-002171': {
    def: 'The information system enforces a role-based access control policy over organization-defined subjects.',
    nist: ['AC-3 (7)']
  },
  'CCI-002172': {
    def: 'The information system enforces a role-based access control policy over organization-defined objects.',
    nist: ['AC-3 (7)']
  },
  'CCI-002173': {
    def: 'The organization defines the roles for which the information system will control access based upon the organization-defined role-based access control policy.',
    nist: ['AC-3 (7)']
  },
  'CCI-002174': {
    def: 'The organization defines the users for which the information system will control access based upon the organization-defined role-based access control policy.',
    nist: ['AC-3 (7)']
  },
  'CCI-002175': {
    def: 'The information system controls access based upon organization-defined roles authorized to assume such roles, employing the organization-defined role-based access control policy.',
    nist: ['AC-3 (7)']
  },
  'CCI-002176': {
    def: 'The information system controls access based upon organization-defined users authorized to assume such roles, employing the organization-defined role-based access control policy.',
    nist: ['AC-3 (7)']
  },
  'CCI-002177': {
    def: 'The organization defines the rules which will govern the timing of revocation of access authorizations.',
    nist: ['AC-3 (8)']
  },
  'CCI-002178': {
    def: 'The information system enforces the revocation of access authorizations resulting from changes to the security attributes of subjects based on organization-defined rules governing the timing of revocations of access authorizations.',
    nist: ['AC-3 (8)']
  },
  'CCI-002179': {
    def: 'The information system enforces the revocation of access authorizations resulting from changes to the security attributes of objects based on organization-defined rules governing the timing of revocations of access authorizations.',
    nist: ['AC-3 (8)']
  },
  'CCI-002180': {
    def: 'The organization defines the security safeguards the organization-defined information system or system component is to provide to protect information released outside the established system boundary.',
    nist: ['AC-3 (9) (a)']
  },
  'CCI-002181': {
    def: 'The organization defines information systems or system components that are to provide organization-defined security safeguards to protect information received outside the established system boundary.',
    nist: ['AC-3 (9) (a)']
  },
  'CCI-002182': {
    def: 'The information system does not release information outside of the established system boundary unless the receiving organization-defined information system or system component provides organization-defined security safeguards.',
    nist: ['AC-3 (9) (a)']
  },
  'CCI-002183': {
    def: 'The organization defines the security safeguards to be used to validate the appropriateness of the information designated for release.',
    nist: ['AC-3 (9) (b)']
  },
  'CCI-002184': {
    def: 'The information system does not release information outside of the established system boundary unless organization-defined security safeguards are used to validate the appropriateness of the information designated for release.',
    nist: ['AC-3 (9) (b)']
  },
  'CCI-002185': {
    def: 'The organization defines the conditions on which it will employ an audited override of automated access control mechanisms.',
    nist: ['AC-3 (10)']
  },
  'CCI-002186': {
    def: 'The organization employs an audited override of automated access control mechanisms under organization-defined conditions.',
    nist: ['AC-3 (10)']
  },
  'CCI-003014': {
    def: 'The information system enforces organization-defined mandatory access control policies over all subjects and objects.',
    nist: ['AC-3 (3)']
  },
  'CCI-003015': {
    def: 'The mandatory access control policy specifies that organization-defined subjects may explicitly be granted organization-defined privileges such that they are not limited by some or all of the mandatory access control constraints.',
    nist: ['AC-3 (3) (c)']
  },
  'CCI-002187': {
    def: 'The organization defines the security attributes to be used to enforce organization-defined information flow control policies.',
    nist: ['AC-4 (1)']
  },
  'CCI-002188': {
    def: 'The organization defines the information, source, and destination objects with which the organization-defined security attributes are to be associated.',
    nist: ['AC-4 (1)']
  },
  'CCI-002189': {
    def: 'The organization defines the information flow control policies to be enforced for flow control decisions.',
    nist: ['AC-4 (1)']
  },
  'CCI-002190': {
    def: 'The information system uses organization-defined security attributes associated with organization-defined information, source, and destination objects to enforce organization-defined information flow control policies as a basis for flow control decisions.',
    nist: ['AC-4 (1)']
  },
  'CCI-002191': {
    def: 'The organization defines the information flow control policies to be enforced by the information system using protected processing domains.',
    nist: ['AC-4 (2)']
  },
  'CCI-002192': {
    def: 'The organization defines the policies the information system is to enforce to achieve dynamic information flow control.',
    nist: ['AC-4 (3)']
  },
  'CCI-002193': {
    def: 'The organization defines procedures or methods to be employed by the information system to prevent encrypted information from bypassing content-checking mechanisms, such as decrypting the information, blocking the flow of the encrypted information, and/or terminating communications sessions attempting to pass encrypted information.',
    nist: ['AC-4 (4)']
  },
  'CCI-002194': {
    def: 'The organization defines the metadata the information system uses to enforce information flow control.',
    nist: ['AC-4 (6)']
  },
  'CCI-002195': {
    def: 'The organization defines the information flows against which the organization-defined security policy filters are to be enforced.',
    nist: ['AC-4 (8)']
  },
  'CCI-002196': {
    def: 'The organization defines the information flows for which the information system will enforce the use of human reviews under organization-defined conditions.',
    nist: ['AC-4 (9)']
  },
  'CCI-002197': {
    def: 'The organization defines the conditions which will require the use of human reviews of organization-defined information flows.',
    nist: ['AC-4 (9)']
  },
  'CCI-002198': {
    def: 'The information system enforces the use of human reviews for organization-defined information flows under organization-defined conditions.',
    nist: ['AC-4 (9)']
  },
  'CCI-002199': {
    def: 'The organization defines the conditions under which the information system provides the capability for privileged administrators to enable/disable organization-defined security policy filters.',
    nist: ['AC-4 (10)']
  },
  'CCI-002200': {
    def: 'The organization defines the data type identifiers to be used to validate data being transferred between different security domains.',
    nist: ['AC-4 (12)']
  },
  'CCI-002201': {
    def: 'The information system, when transferring information between different security domains, uses organization-defined data type identifiers to validate data essential for information flow decisions.',
    nist: ['AC-4 (12)']
  },
  'CCI-002202': {
    def: 'The organization defines the policy-relevant subcomponents into which information being transferred between different security domains is to be decomposed for submission to policy enforcement mechanisms.',
    nist: ['AC-4 (13)']
  },
  'CCI-002203': {
    def: 'The organization defines the unsanctioned information the information system is to examine when transferring information between different security domains.',
    nist: ['AC-4 (15)']
  },
  'CCI-002204': {
    def: 'The organization defines a security policy which prohibits the transfer of unsanctioned information between different security domains.',
    nist: ['AC-4 (15)']
  },
  'CCI-002205': {
    def: 'The information system uniquely identifies and authenticates source by organization, system, application, and/or individual for information transfer.',
    nist: ['AC-4 (17)']
  },
  'CCI-002206': {
    def: 'The information system uniquely authenticates source by organization, system, application, and/or individual for information transfer.',
    nist: ['AC-4 (17)']
  },
  'CCI-002207': {
    def: 'The information system uniquely identifies and authenticates destination by organization, system, application, and/or individual for information transfer.',
    nist: ['AC-4 (17)']
  },
  'CCI-002208': {
    def: 'The information system uniquely authenticates destination by organization, system, application, and/or individual for information transfer.',
    nist: ['AC-4 (17)']
  },
  'CCI-002209': {
    def: 'The organization defines the techniques to be used to bind security attributes to information.',
    nist: ['AC-4 (18)']
  },
  'CCI-002210': {
    def: 'The information system binds security attributes to information using organization-defined binding techniques to facilitate information flow policy enforcement.',
    nist: ['AC-4 (18)']
  },
  'CCI-002211': {
    def: 'The information system, when transferring information between different security domains, applies the same security policy filtering to metadata as it applies to data payloads.',
    nist: ['AC-4 (19)']
  },
  'CCI-002212': {
    def: 'The organization defines the solutions in approved configurations to be employed to control the flow of organization-defined information across security domains.',
    nist: ['AC-4 (20)']
  },
  'CCI-002213': {
    def: 'The organization defines the information to be subjected to flow control across security domains.',
    nist: ['AC-4 (20)']
  },
  'CCI-002214': {
    def: 'The organization employs organization-defined solutions in approved configurations to control the flow of organization-defined information across security domains.',
    nist: ['AC-4 (20)']
  },
  'CCI-002215': {
    def: 'The organization defines the mechanisms and/or techniques to be used to logically or physically separate information flows.',
    nist: ['AC-4 (21)']
  },
  'CCI-002216': {
    def: 'The organization defines the types of information required to accomplish logical or physical separation of information flows.',
    nist: ['AC-4 (21)']
  },
  'CCI-002217': {
    def: 'The information system separates information flows logically or physically using organization-defined mechanisms and/or techniques to accomplish organization-defined required separations by types of information.',
    nist: ['AC-4 (21)']
  },
  'CCI-002218': {
    def: 'The information system provides access from a single device to computing platforms, applications, or data residing on multiple different security domains, while preventing any information flow between the different security domains.',
    nist: ['AC-4 (22)']
  },
  'CCI-002219': {
    def: 'The organization defines the duties of individuals that are to be separated.',
    nist: ['AC-5 a']
  },
  'CCI-002220': {
    def: 'The organization defines information system access authorizations to support separation of duties.',
    nist: ['AC-5 c']
  },
  'CCI-002221': {
    def: 'The organization defines the security-relevant information for which access must be explicitly authorized.',
    nist: ['AC-6 (1)']
  },
  'CCI-002222': {
    def: 'The organization explicitly authorizes access to organization-defined security functions.',
    nist: ['AC-6 (1)']
  },
  'CCI-002223': {
    def: 'The organization explicitly authorizes access to organization-defined security-relevant information.',
    nist: ['AC-6 (1)']
  },
  'CCI-002224': {
    def: 'The organization defines the compelling operational needs that must be met in order to be authorized network access to organization-defined privileged commands.',
    nist: ['AC-6 (3)']
  },
  'CCI-002225': {
    def: 'The information system provides separate processing domains to enable finer-grained allocation of user privileges.',
    nist: ['AC-6 (4)']
  },
  'CCI-002226': {
    def: 'The organization defines the personnel or roles to whom privileged accounts are to be restricted on the information system.',
    nist: ['AC-6 (5)']
  },
  'CCI-002227': {
    def: 'The organization restricts privileged accounts on the information system to organization-defined personnel or roles.',
    nist: ['AC-6 (5)']
  },
  'CCI-002228': {
    def: 'The organization defines the frequency on which it conducts reviews of the privileges assigned to organization-defined roles or classes of users.',
    nist: ['AC-6 (7) (a)']
  },
  'CCI-002229': {
    def: 'The organization defines the roles or classes of users that are to have their privileges reviewed on an organization-defined frequency.',
    nist: ['AC-6 (7) (a)']
  },
  'CCI-002230': {
    def: 'The organization reviews the privileges assigned to organization-defined roles or classes of users on an organization-defined frequency to validate the need for such privileges.',
    nist: ['AC-6 (7) (a)']
  },
  'CCI-002231': {
    def: 'The organization reassigns or removes privileges, if necessary, to correctly reflect organizational mission/business needs.',
    nist: ['AC-6 (7) (b)']
  },
  'CCI-002232': {
    def: 'The organization defines software that is restricted from executing at a higher privilege than users executing the software.',
    nist: ['AC-6 (8)']
  },
  'CCI-002233': {
    def: 'The information system prevents organization-defined software from executing at higher privilege levels than users executing the software.',
    nist: ['AC-6 (8)']
  },
  'CCI-002234': {
    def: 'The information system audits the execution of privileged functions.',
    nist: ['AC-6 (9)']
  },
  'CCI-002235': {
    def: 'The information system prevents non-privileged users from executing privileged functions to include disabling, circumventing, or altering implemented security safeguards/countermeasures.',
    nist: ['AC-6 (10)']
  },
  'CCI-002236': {
    def: 'The organization defines the time period the information system will automatically lock the account or node when the maximum number of unsuccessful logon attempts is exceeded.',
    nist: ['AC-7 b']
  },
  'CCI-002237': {
    def: 'The organization defines the delay algorithm to be employed by the information system to delay the next logon prompt when the maximum number of unsuccessful logon attempts is exceeded.',
    nist: ['AC-7 b']
  },
  'CCI-002238': {
    def: 'The information system automatically locks the account or node for either an organization-defined time period, until the locked account or node is released by an administrator, or delays the next logon prompt according to the organization-defined delay algorithm when the maximum number of unsuccessful logon attempts is exceeded.',
    nist: ['AC-7 b']
  },
  'CCI-002239': {
    def: 'The organization defines the mobile devices that are to be purged/wiped by the information system after an organization-defined number of consecutive, unsuccessful device logon attempts.',
    nist: ['AC-7 (2)']
  },
  'CCI-002240': {
    def: 'The organization defines the purging/wiping requirements/techniques to be used by the information system on organization-defined mobile devices after an organization-defined number of consecutive, unsuccessful device logon attempts.',
    nist: ['AC-7 (2)']
  },
  'CCI-002241': {
    def: 'The organization defines the number of consecutive, unsuccessful device logon attempts after which the information system will purge/wipe organization-defined mobile devices.',
    nist: ['AC-7 (2)']
  },
  'CCI-002242': {
    def: 'The information system purges/wipes information from organization-defined mobile devices based on organization-defined purging/wiping requirements/techniques after an organization-defined number of consecutive, unsuccessful device logon attempts.',
    nist: ['AC-7 (2)']
  },
  'CCI-002243': {
    def: 'The organization-defined information system use notification message or banner is to state that users are accessing a U.S. Government information system.',
    nist: ['AC-8 a 1']
  },
  'CCI-002244': {
    def: 'The organization-defined information system use notification message or banner is to state that information system usage may be monitored, recorded, and subject to audit.',
    nist: ['AC-8 a 2']
  },
  'CCI-002245': {
    def: 'The organization-defined information system use notification message or banner is to state that unauthorized use of the information system is prohibited and subject to criminal and civil penalties.',
    nist: ['AC-8 a 3']
  },
  'CCI-002246': {
    def: 'The organization-defined information system use notification message or banner is to state that use of the information system indicates consent to monitoring and recording.',
    nist: ['AC-8 a 4']
  },
  'CCI-002247': {
    def: 'The organization defines the use notification message or banner the information system displays to users before granting access to the system.',
    nist: ['AC-8 a']
  },
  'CCI-002248': {
    def: 'The organization defines the conditions of use which are to be displayed to users of the information system before granting further access.',
    nist: ['AC-8 c 1']
  },
  'CCI-002249': {
    def: 'The organization defines the information, in addition to the date and time of the last logon (access), to be included in the notification to the user upon successful logon (access).',
    nist: ['AC-9 (4)']
  },
  'CCI-002250': {
    def: 'The information system notifies the user, upon successful logon (access), of the organization-defined information to be included in addition to the date and time of the last logon (access).',
    nist: ['AC-9 (4)']
  },
  'CCI-002251': {
    def: 'The information system notifies the user, upon successful logon (access), of the date and time of the last logon (access).',
    nist: ['AC-9 (4)']
  },
  'CCI-002252': {
    def: 'The organization defines the accounts and/or account types for which the information system will limit the number of concurrent sessions.',
    nist: ['AC-10']
  },
  'CCI-002253': {
    def: 'The organization defines the account types for which the information system will limit the number of concurrent sessions.',
    nist: ['AC-10']
  },
  'CCI-002255': {
    def: 'The organization defines the user actions that can be performed on the information system without identification and authentication.',
    nist: ['AC-14 a']
  },
  'CCI-002256': {
    def: 'The organization defines security attributes having organization-defined types of security attribute values which are associated with information in storage.',
    nist: ['AC-16 a']
  },
  'CCI-002257': {
    def: 'The organization defines security attributes having organization-defined types of security attribute values which are associated with information in process.',
    nist: ['AC-16 a']
  },
  'CCI-002258': {
    def: 'The organization defines security attributes, having organization-defined types of security attribute values, which are associated with information in transmission.',
    nist: ['AC-16 a']
  },
  'CCI-002259': {
    def: 'The organization defines security attribute values associated with organization-defined types of security attributes for information in storage.',
    nist: ['AC-16 a']
  },
  'CCI-002260': {
    def: 'The organization defines security attribute values associated with organization-defined types of security attributes for information in process.',
    nist: ['AC-16 a']
  },
  'CCI-002261': {
    def: 'The organization defines security attribute values associated with organization-defined types of security attributes for information in transmission.',
    nist: ['AC-16 a']
  },
  'CCI-002262': {
    def: 'The organization provides the means to associate organization-defined types of security attributes having organization-defined security attribute values with information in storage.',
    nist: ['AC-16 a']
  },
  'CCI-002263': {
    def: 'The organization provides the means to associate organization-defined types of security attributes having organization-defined security attribute values with information in process.',
    nist: ['AC-16 a']
  },
  'CCI-002264': {
    def: 'The organization provides the means to associate organization-defined types of security attributes having organization-defined security attribute values with information in transmission.',
    nist: ['AC-16 a']
  },
  'CCI-002265': {
    def: 'The organization ensures that the security attribute associations are made with the information.',
    nist: ['AC-16 b']
  },
  'CCI-002266': {
    def: 'The organization ensures that the security attribute associations are retained with the information.',
    nist: ['AC-16 b']
  },
  'CCI-002267': {
    def: 'The organization defines the security attributes that are permitted for organization-defined information systems.',
    nist: ['AC-16 c']
  },
  'CCI-002268': {
    def: 'The organization defines the information systems for which permitted organization-defined attributes are to be established.',
    nist: ['AC-16 c']
  },
  'CCI-002269': {
    def: 'The organization establishes the permitted organization-defined security attributes for organization-defined information systems.',
    nist: ['AC-16 c']
  },
  'CCI-002270': {
    def: 'The organization defines the values or ranges permitted for each of the established security attributes.',
    nist: ['AC-16 d']
  },
  'CCI-002271': {
    def: 'The organization determines the permitted organization-defined values or ranges for each of the established security attributes.',
    nist: ['AC-16 d']
  },
  'CCI-002272': {
    def: 'The information system dynamically associates security attributes with organization-defined objects in accordance with organization-defined security policies as information is created and combined.',
    nist: ['AC-16 (1)']
  },
  'CCI-002273': {
    def: 'The organization defines the security policies the information system is to adhere to when dynamically associating security attributes with organization-defined subjects and objects.',
    nist: ['AC-16 (1)']
  },
  'CCI-002274': {
    def: 'The organization defines the subjects with which the information system is to dynamically associate security attributes as information is created and combined.',
    nist: ['AC-16 (1)']
  },
  'CCI-002275': {
    def: 'The organization defines the objects with which the information system is to dynamically associate security attributes as information is created and combined.',
    nist: ['AC-16 (1)']
  },
  'CCI-002276': {
    def: 'The organization identifies the individuals authorized to define the value of associated security attributes.',
    nist: ['AC-16 (2)']
  },
  'CCI-002277': {
    def: 'The information system provides authorized individuals (or processes acting on behalf of individuals) the capability to define the value of associated security attributes.',
    nist: ['AC-16 (2)']
  },
  'CCI-002278': {
    def: 'The organization defines security attributes for which the association and integrity to organization-defined subjects and objects is maintained by the information system.',
    nist: ['AC-16 (3)']
  },
  'CCI-002279': {
    def: 'The organization defines subjects for which the association and integrity of organization-defined security attributes is maintained by the information system.',
    nist: ['AC-16 (3)']
  },
  'CCI-002280': {
    def: 'The organization defines objects for which the association and integrity of organization-defined security attributes is maintained by the information system.',
    nist: ['AC-16 (3)']
  },
  'CCI-002281': {
    def: 'The information system maintains the association of organization-defined security attributes to organization-defined subjects.',
    nist: ['AC-16 (3)']
  },
  'CCI-002282': {
    def: 'The information system maintains the association of organization-defined security attributes to organization-defined objects.',
    nist: ['AC-16 (3)']
  },
  'CCI-002283': {
    def: 'The information system maintains the integrity of organization-defined security attributes associated with organization-defined subjects.',
    nist: ['AC-16 (3)']
  },
  'CCI-002284': {
    def: 'The information system maintains the integrity of organization-defined security attributes associated with organization-defined objects.',
    nist: ['AC-16 (3)']
  },
  'CCI-002285': {
    def: 'The organization identifies individuals (or processes acting on behalf of individuals) authorized to associate organization-defined security attributes with organization-defined subjects.',
    nist: ['AC-16 (4)']
  },
  'CCI-002286': {
    def: 'The organization defines the subjects with which organization-defined security attributes may be associated by authorized individuals (or processes acting on behalf of individuals).',
    nist: ['AC-16 (4)']
  },
  'CCI-002287': {
    def: 'The organization defines the objects with which organization-defined security attributes may be associated by authorized individuals (or processes acting on behalf of individuals).',
    nist: ['AC-16 (4)']
  },
  'CCI-002288': {
    def: 'The organization defines the security attributes authorized individuals (or processes acting on behalf of individuals) are permitted to associate with organization-defined subjects and objects.',
    nist: ['AC-16 (4)']
  },
  'CCI-002289': {
    def: 'The information system supports the association of organization-defined security attributes with organization-defined subjects by authorized individuals (or processes acting on behalf of individuals).',
    nist: ['AC-16 (4)']
  },
  'CCI-002290': {
    def: 'The information system supports the association of organization-defined security attributes with organization-defined objects by authorized individuals (or processes acting on behalf of individuals).',
    nist: ['AC-16 (4)']
  },
  'CCI-002291': {
    def: 'The organization defines the security policies to be followed by personnel when associating organization-defined security attributes with organization-defined subjects and objects.',
    nist: ['AC-16 (6)']
  },
  'CCI-002292': {
    def: 'The organization defines the security attributes which are to be associated with organization-defined subjects and objects.',
    nist: ['AC-16 (6)']
  },
  'CCI-002293': {
    def: 'The organization defines the subjects to be associated, and that association maintained, with organization-defined security attributes in accordance with organization-defined security policies.',
    nist: ['AC-16 (6)']
  },
  'CCI-002294': {
    def: 'The organization defines the objects to be associated, and that association maintained, with organization-defined security attributes in accordance with organization-defined security policies.',
    nist: ['AC-16 (6)']
  },
  'CCI-002295': {
    def: 'The organization allows personnel to associate organization-defined security attributes with organization-defined subjects in accordance with organization-defined security policies.',
    nist: ['AC-16 (6)']
  },
  'CCI-002296': {
    def: 'The organization allows personnel to associate organization-defined security attributes with organization-defined objects in accordance with organization-defined security policies.',
    nist: ['AC-16 (6)']
  },
  'CCI-002297': {
    def: 'The organization allows personnel to maintain the association of organization-defined security attributes with organization-defined subjects in accordance with organization-defined security policies.',
    nist: ['AC-16 (6)']
  },
  'CCI-002298': {
    def: 'The organization allows personnel to maintain the association of organization-defined security attributes with organization-defined objects in accordance with organization-defined security policies.',
    nist: ['AC-16 (6)']
  },
  'CCI-002299': {
    def: 'The organization provides a consistent interpretation of security attributes transmitted between distributed information system components.',
    nist: ['AC-16 (7)']
  },
  'CCI-002300': {
    def: 'The organization defines the techniques or technologies to be implemented when associating security attributes with information.',
    nist: ['AC-16 (8)']
  },
  'CCI-002301': {
    def: 'The organization defines the level of assurance to be provided when implementing organization-defined techniques or technologies in associating security attributes to information.',
    nist: ['AC-16 (8)']
  },
  'CCI-002302': {
    def: 'The information system implements organization-defined techniques or technologies with an organization-defined level of assurance in associating security attributes to information.',
    nist: ['AC-16 (8)']
  },
  'CCI-002303': {
    def: 'The organization defines the techniques or procedures to be employed to validate re-grading mechanisms.',
    nist: ['AC-16 (9)']
  },
  'CCI-002304': {
    def: 'The organization ensures security attributes associated with information are reassigned only via re-grading mechanisms validated using organization-defined techniques or procedures.',
    nist: ['AC-16 (9)']
  },
  'CCI-002305': {
    def: 'The organization identifies individuals authorized to define or change the type and value of security attributes available for association with subjects and objects.',
    nist: ['AC-16 (10)']
  },
  'CCI-002306': {
    def: 'The information system provides authorized individuals the capability to define or change the type of security attributes available for association with subjects.',
    nist: ['AC-16 (10)']
  },
  'CCI-002307': {
    def: 'The information system provides authorized individuals the capability to define or change the value of security attributes available for association with subjects.',
    nist: ['AC-16 (10)']
  },
  'CCI-002308': {
    def: 'The information system provides authorized individuals the capability to define or change the type of security attributes available for association with objects.',
    nist: ['AC-16 (10)']
  },
  'CCI-002309': {
    def: 'The information system provides authorized individuals the capability to define or change the value of security attributes available for association with objects.',
    nist: ['AC-16 (10)']
  },
  'CCI-002310': {
    def: 'The organization establishes and documents usage restrictions for each type of remote access allowed.',
    nist: ['AC-17 a']
  },
  'CCI-002311': {
    def: 'The organization establishes and documents configuration/connection requirements for each type of remote access allowed.',
    nist: ['AC-17 a']
  },
  'CCI-002312': {
    def: 'The organization establishes and documents implementation guidance for each type of remote access allowed.',
    nist: ['AC-17 a']
  },
  'CCI-002313': {
    def: 'The information system controls remote access methods.',
    nist: ['AC-17 (1)']
  },
  'CCI-002314': {
    def: 'The information system controls remote access methods.',
    nist: ['AC-17 (1)']
  },
  'CCI-002315': {
    def: 'The organization defines the number of managed network access control points through which the information system routes all remote access.',
    nist: ['AC-17 (3)']
  },
  'CCI-002316': {
    def: 'The organization authorizes access to security-relevant information via remote access only for organization-defined needs.',
    nist: ['AC-17 (4) (a)']
  },
  'CCI-002317': {
    def: 'The organization defines the operational needs for when the execution of privileged commands via remote access is to be authorized.',
    nist: ['AC-17 (4) (a)']
  },
  'CCI-002318': {
    def: 'The organization defines the operational needs for when access to security-relevant information via remote access is to be authorized.',
    nist: ['AC-17 (4) (a)']
  },
  'CCI-002319': {
    def: 'The organization documents in the security plan for the information system the rationale for authorization of the execution of privilege commands via remote access.',
    nist: ['AC-17 (4) (b)']
  },
  'CCI-002320': {
    def: 'The organization documents in the security plan for the information system the rationale for authorization of access to security-relevant information via remote access.',
    nist: ['AC-17 (4) (b)']
  },
  'CCI-002321': {
    def: 'The organization defines the time period within which it disconnects or disables remote access to the information system.',
    nist: ['AC-17 (9)']
  },
  'CCI-002322': {
    def: 'The organization provides the capability to expeditiously disconnect or disable remote access to the information system within the organization-defined time period.',
    nist: ['AC-17 (9)']
  },
  'CCI-002323': {
    def: 'The organization establishes configuration/connection requirements for wireless access.',
    nist: ['AC-18 a']
  },
  'CCI-002324': {
    def: 'The organization identifies and explicitly authorizes users allowed to independently configure wireless networking capabilities.',
    nist: ['AC-18 (4)']
  },
  'CCI-002325': {
    def: 'The organization establishes configuration requirements for organization-controlled mobile devices.',
    nist: ['AC-19 a']
  },
  'CCI-002326': {
    def: 'The organization establishes connection requirements for organization-controlled mobile devices.',
    nist: ['AC-19 a']
  },
  'CCI-002327': {
    def: 'The organization defines the security policies which restrict the connection of classified mobile devices to classified information systems.',
    nist: ['AC-19 (4) (c)']
  },
  'CCI-002328': {
    def: 'The organization restricts the connection of classified mobile devices to classified information systems in accordance with organization-defined security policies.',
    nist: ['AC-19 (4) (c)']
  },
  'CCI-002329': {
    def: 'The organization defines the mobile devices that are to employ full-device or container encryption to protect the confidentiality and integrity of the information on the device.',
    nist: ['AC-19 (5)']
  },
  'CCI-002330': {
    def: 'The organization employs full-device encryption or container encryption to protect the confidentiality of information on organization-defined mobile devices.',
    nist: ['AC-19 (5)']
  },
  'CCI-002331': {
    def: 'The organization employs full-device encryption or container encryption to protect the integrity of information on organization-defined mobile devices.',
    nist: ['AC-19 (5)']
  },
  'CCI-002332': {
    def: 'The organization establishes terms and conditions, consistent with any trust relationships established with other organizations owning, operating, and/or maintaining external information systems, allowing authorized individuals to process, store, or transmit organization-controlled information using the external information systems.',
    nist: ['AC-20 b']
  },
  'CCI-002333': {
    def: 'The organization permits authorized individuals to use an external information system to access the information system only when the organization verifies the implementation of required security controls on the external system as specified in the organization^s information security policy and security plan.',
    nist: ['AC-20 (1) (a)']
  },
  'CCI-002334': {
    def: 'The organization permits authorized individuals to use an external information system to process organization-controlled information only when the organization verifies the implementation of required security controls on the external system as specified in the organization^s information security policy and security plan.',
    nist: ['AC-20 (1) (a)']
  },
  'CCI-002335': {
    def: 'The organization permits authorized individuals to use an external information system to store organization-controlled information only when the organization verifies the implementation of required security controls on the external system as specified in the organization^s information security policy and security plan.',
    nist: ['AC-20 (1) (a)']
  },
  'CCI-002336': {
    def: 'The organization permits authorized individuals to use an external information system to transmit organization-controlled information only when the organization verifies the implementation of required security controls on the external system as specified in the organization^s information security policy and security plan.',
    nist: ['AC-20 (1) (a)']
  },
  'CCI-002337': {
    def: 'The organization permits authorized individuals to use an external information system to access the information system or to process, store, or transmit organization-controlled information only when the organization retains approved information system connection or processing agreements with the organizational entity hosting the external information system.',
    nist: ['AC-20 (1) (b)']
  },
  'CCI-002338': {
    def: 'The organization restricts or prohibits the use of non-organizationally owned information systems, system components, or devices to process, store, or transmit organizational information.',
    nist: ['AC-20 (3)']
  },
  'CCI-002339': {
    def: 'The organization defines the network accessible storage devices that are to be prohibited from being used in external information systems.',
    nist: ['AC-20 (4)']
  },
  'CCI-002340': {
    def: 'The organization prohibits the use of organization-defined network accessible storage devices in external information systems.',
    nist: ['AC-20 (4)']
  },
  'CCI-002341': {
    def: 'The organization defines the information sharing restrictions to be enforced by the information system for information search and retrieval services.',
    nist: ['AC-21 (2)']
  },
  'CCI-002342': {
    def: 'The information system implements information search and retrieval services that enforce organization-defined information sharing restrictions.',
    nist: ['AC-21 (2)']
  },
  'CCI-002343': {
    def: 'The organization defines the data mining prevention techniques to be employed to adequately protect organization-defined data storage objects against data mining.',
    nist: ['AC-23']
  },
  'CCI-002344': {
    def: 'The organization defines the data mining detection techniques to be employed to adequately detect data mining attempts against organization-defined data storage objects.',
    nist: ['AC-23']
  },
  'CCI-002345': {
    def: 'The organization defines the data storage objects that are to be protected against data mining attempts.',
    nist: ['AC-23']
  },
  'CCI-002346': {
    def: 'The organization employs organization-defined data mining prevention techniques for organization-defined data storage objects to adequately protect against data mining.',
    nist: ['AC-23']
  },
  'CCI-002347': {
    def: 'The organization employs organization-defined data mining detection techniques for organization-defined data storage objects to adequately detect data mining attempts.',
    nist: ['AC-23']
  },
  'CCI-002348': {
    def: 'The organization defines the access control decisions that are to be applied to each access request prior to access enforcement.',
    nist: ['AC-24']
  },
  'CCI-002349': {
    def: 'The organization establishes procedures to ensure organization-defined access control decisions are applied to each access request prior to access enforcement.',
    nist: ['AC-24']
  },
  'CCI-002350': {
    def: 'The organization defines the access authorization information that is to be transmitted using organization-defined security safeguards to organization-defined information systems that enforce access control decisions.',
    nist: ['AC-24 (1)']
  },
  'CCI-002351': {
    def: 'The organization defines the security safeguards to be employed when transmitting organization-defined access authorization information to organization-defined information systems that enforce access control decisions.',
    nist: ['AC-24 (1)']
  },
  'CCI-002352': {
    def: 'The organization defines the information systems that are to be recipients of organization-defined access authorization information using organization-defined security safeguards.',
    nist: ['AC-24 (1)']
  },
  'CCI-002353': {
    def: 'The information system transmits organization-defined access authorization information using organization-defined security safeguards to organization-defined information systems which enforce access control decisions.',
    nist: ['AC-24 (1)']
  },
  'CCI-002354': {
    def: 'The organization defines the security attributes, not to include the identity of the user or process acting on behalf of the user, to be used as the basis for enforcing access control decisions.',
    nist: ['AC-24 (2)']
  },
  'CCI-002355': {
    def: 'The information system enforces access control decisions based on organization-defined security attributes that do not include the identity of the user or process acting on behalf of the user.',
    nist: ['AC-24 (2)']
  },
  'CCI-002356': {
    def: 'The organization defines the access control policies to be implemented by the information system^s reference monitor.',
    nist: ['AC-25']
  },
  'CCI-002357': {
    def: 'The information system implements a reference monitor for organization-defined access control policies that is tamperproof.',
    nist: ['AC-25']
  },
  'CCI-002358': {
    def: 'The information system implements a reference monitor for organization-defined access control policies that is always invoked.',
    nist: ['AC-25']
  },
  'CCI-002359': {
    def: 'The information system implements a reference monitor for organization-defined access control policies that is small enough to be subject to analysis and testing, the completeness of which can be assured.',
    nist: ['AC-25']
  },
  'CCI-002048': {
    def: 'The organization defines the personnel or roles to whom the security awareness and training policy is disseminated.',
    nist: ['AT-1 a 1']
  },
  'CCI-002049': {
    def: 'The organization defines the personnel or roles to whom the security awareness and training procedures are disseminated.',
    nist: ['AT-1 a 2']
  },
  'CCI-002055': {
    def: 'The organization includes security awareness training on recognizing and reporting potential indicators of insider threat.',
    nist: ['AT-2 (2)']
  },
  'CCI-002050': {
    def: 'The organization defines the personnel or roles to whom initial and refresher training in the employment and operation of environmental controls is to be provided.',
    nist: ['AT-3 (1)']
  },
  'CCI-002051': {
    def: 'The organization defines the personnel or roles to whom initial and refresher training in the employment and operation of physical security controls is to be provided.',
    nist: ['AT-3 (2)']
  },
  'CCI-002052': {
    def: 'The organization includes practical exercises in security training that reinforce training objectives.',
    nist: ['AT-3 (3)']
  },
  'CCI-002053': {
    def: 'The organization provides training to its personnel on organization-defined indicators of malicious code to recognize suspicious communications and anomalous behavior in organizational information systems.',
    nist: ['AT-3 (4)']
  },
  'CCI-002054': {
    def: 'The organization defines indicators of malicious code to recognize suspicious communications and anomalous behavior in organizational information systems.',
    nist: ['AT-3 (4)']
  },
  'CCI-001831': {
    def: 'The organization documents an audit and accountability policy that addresses purpose, scope, roles, responsibilities, management commitment, coordination among organizational entities, and compliance.',
    nist: ['AU-1 a 1']
  },
  'CCI-001832': {
    def: 'The organization disseminates the audit and accountability policy to organization-defined personnel or roles.',
    nist: ['AU-1 a 1']
  },
  'CCI-001833': {
    def: 'The organization documents procedures to facilitate the implementation of the audit and accountability policy and associated audit and accountability controls.',
    nist: ['AU-1 a 2']
  },
  'CCI-001834': {
    def: 'The organization disseminates to organization-defined personnel or roles procedures to facilitate the implementation of the audit and accountability policy and associated audit and accountability controls.',
    nist: ['AU-1 a 2']
  },
  'CCI-001835': {
    def: 'The organization defines the frequency on which it will review the audit and accountability policy.',
    nist: ['AU-1 b 1']
  },
  'CCI-001836': {
    def: 'The organization defines the frequency on which it will update the audit and accountability policy.',
    nist: ['AU-1 b 1']
  },
  'CCI-001837': {
    def: 'The organization reviews the audit and accountability policy on an organization-defined frequency.',
    nist: ['AU-1 b 1']
  },
  'CCI-001838': {
    def: 'The organization updates the audit and accountability policy on an organization-defined frequency.',
    nist: ['AU-1 b 1']
  },
  'CCI-001839': {
    def: 'The organization defines the frequency on which it will review the audit and accountability procedures.',
    nist: ['AU-1 b 2']
  },
  'CCI-001840': {
    def: 'The organization defines the frequency on which it will update the audit and accountability procedures.',
    nist: ['AU-1 b 2']
  },
  'CCI-001841': {
    def: 'The organization reviews the audit and accountability procedures on an organization-defined frequency.',
    nist: ['AU-1 b 2']
  },
  'CCI-001842': {
    def: 'The organization updates the audit and accountability procedures on an organization-defined frequency.',
    nist: ['AU-1 b 2']
  },
  'CCI-001930': {
    def: 'The organization defines the organizational personnel or roles to whom the audit and accountability policy is to be disseminated.',
    nist: ['AU-1 a 1']
  },
  'CCI-001931': {
    def: 'The organization defines the organizational personnel or roles to whom the audit and accountability procedures are to be disseminated.',
    nist: ['AU-1 a 2']
  },
  'CCI-001843': {
    def: 'The organization defines a frequency for updating the list of organization-defined auditable events.',
    nist: ['AU-2 (3)']
  },
  'CCI-001844': {
    def: 'The information system provides centralized management and configuration of the content to be captured in audit records generated by organization-defined information system components.',
    nist: ['AU-3 (2)']
  },
  'CCI-001845': {
    def: 'The information system provides centralized configuration of the content to be captured in audit records generated by organization-defined information system components.',
    nist: ['AU-3 (2)']
  },
  'CCI-001846': {
    def: 'The organization defines information system components that will generate the audit records which are to be captured for centralized management of the content.',
    nist: ['AU-3 (2)']
  },
  'CCI-001847': {
    def: 'The organization defines information system components that will generate the audit records which are to be captured for centralized configuration of the content.',
    nist: ['AU-3 (2)']
  },
  'CCI-001848': {
    def: 'The organization defines the audit record storage requirements.',
    nist: ['AU-4']
  },
  'CCI-001849': {
    def: 'The organization allocates audit record storage capacity in accordance with organization-defined audit record storage requirements.',
    nist: ['AU-4']
  },
  'CCI-001850': {
    def: 'The organization defines the frequency on which the information system off-loads audit records onto a different system or media than the system being audited.',
    nist: ['AU-4 (1)']
  },
  'CCI-001851': {
    def: 'The information system off-loads audit records per organization-defined frequency onto a different system or media than the system being audited.',
    nist: ['AU-4 (1)']
  },
  'CCI-001852': {
    def: 'The organization defines the personnel, roles and/or locations to receive a warning when allocated audit record storage volume reaches a defined percentage of maximum audit records storage capacity.',
    nist: ['AU-5 (1)']
  },
  'CCI-001853': {
    def: 'The organization defines the time period within which organization-defined personnel, roles, and/or locations are to receive warnings when allocated audit record storage volume reaches an organization-defined percentage of maximum audit records storage capacity.',
    nist: ['AU-5 (1)']
  },
  'CCI-001854': {
    def: 'The organization defines the percentage of maximum audit record storage capacity that is to be reached, at which time the information system will provide a warning to organization-defined personnel, roles, and/or locations.',
    nist: ['AU-5 (1)']
  },
  'CCI-001855': {
    def: 'The information system provides a warning to organization-defined personnel, roles, and/or locations within an organization-defined time period when allocated audit record storage volume reaches an organization-defined percentage of repository maximum audit record storage capacity.',
    nist: ['AU-5 (1)']
  },
  'CCI-001856': {
    def: 'The organization defines the real-time period within which the information system is to provide an alert when organization-defined audit failure events occur.',
    nist: ['AU-5 (2)']
  },
  'CCI-001857': {
    def: 'The organization defines the personnel, roles, and/or locations to receive alerts when organization-defined audit failure events occur.',
    nist: ['AU-5 (2)']
  },
  'CCI-001858': {
    def: 'The information system provides a real-time alert in an organization-defined real-time period to organization-defined personnel, roles, and/or locations when organization-defined audit failure events requiring real-time alerts occur.',
    nist: ['AU-5 (2)']
  },
  'CCI-001859': {
    def: 'The organization defines the network communication traffic volume thresholds reflecting limits on auditing capacity, specifying when the information system will reject or delay network traffic that exceed those thresholds.',
    nist: ['AU-5 (3)']
  },
  'CCI-001860': {
    def: 'The organization defines the audit failures which, should they occur, will invoke an organization-defined system mode.',
    nist: ['AU-5 (4)']
  },
  'CCI-001861': {
    def: 'The information system invokes an organization-defined system mode, in the event of organization-defined audit failures, unless an alternate audit capability exists.',
    nist: ['AU-5 (4)']
  },
  'CCI-002907': {
    def: 'The organization defines the system mode to be invoked, such as a full system shutdown, a partial system shutdown, or a degraded operational mode with limited mission/business functionality available, in the event of organization-defined audit failures.',
    nist: ['AU-5 (4)']
  },
  'CCI-001862': {
    def: 'The organization defines the types of inappropriate or unusual activity to be reviewed and analyzed in the audit records.',
    nist: ['AU-6 a']
  },
  'CCI-001863': {
    def: 'The organization defines the personnel or roles to receive the reports of organization-defined inappropriate or unusual activity.',
    nist: ['AU-6 b']
  },
  'CCI-001864': {
    def: 'The organization employs automated mechanisms to integrate audit review and analysis to support organizational processes for investigation of and response to suspicious activities.',
    nist: ['AU-6 (1)']
  },
  'CCI-001865': {
    def: 'The organization employs automated mechanisms to integrate reporting processes to support organizational investigation of and response to suspicious activities.',
    nist: ['AU-6 (1)']
  },
  'CCI-001866': {
    def: 'The organization defines the data/information to be collected from other sources to enhance its ability to identify inappropriate or unusual activity.',
    nist: ['AU-6 (5)']
  },
  'CCI-001867': {
    def: 'The organization integrates analysis of audit records with analysis of vulnerability scanning information, performance data, information system monitoring information, and/or organization-defined data/information collected from other sources to further enhance its ability to identify inappropriate or unusual activity.',
    nist: ['AU-6 (5)']
  },
  'CCI-001868': {
    def: 'The organization specifies the permitted actions for each information system process, role, and/or user associated with the review and analysis of audit information.',
    nist: ['AU-6 (7)']
  },
  'CCI-001869': {
    def: 'The organization specifies the permitted actions for each information system process, role, and/or user associated with the reporting of audit information.',
    nist: ['AU-6 (7)']
  },
  'CCI-001870': {
    def: 'The organization performs a full-text analysis of audited privileged commands in a physically-distinct component or subsystem of the information system, or other information system that is dedicated to that analysis.',
    nist: ['AU-6 (8)']
  },
  'CCI-001871': {
    def: 'The organization correlates information from non-technical sources with audit information to enhance organization-wide situational awareness.',
    nist: ['AU-6 (9)']
  },
  'CCI-001872': {
    def: 'The organization adjusts the level of audit review and analysis within the information system when there is a change in risk based on law enforcement information, intelligence information, or other credible sources of information.',
    nist: ['AU-6 (10)']
  },
  'CCI-001873': {
    def: 'The organization adjusts the level of audit analysis within the information system when there is a change in risk based on law enforcement information, intelligence information, or other credible sources of information.',
    nist: ['AU-6 (10)']
  },
  'CCI-001874': {
    def: 'The organization adjusts the level of audit reporting within the information system when there is a change in risk based on law enforcement information, intelligence information, or other credible sources of information.',
    nist: ['AU-6 (10)']
  },
  'CCI-001875': {
    def: 'The information system provides an audit reduction capability that supports on-demand audit review and analysis.',
    nist: ['AU-7 a']
  },
  'CCI-001876': {
    def: 'The information system provides an audit reduction capability that supports on-demand reporting requirements.',
    nist: ['AU-7 a']
  },
  'CCI-001877': {
    def: 'The information system provides an audit reduction capability that supports after-the-fact investigations of security incidents.',
    nist: ['AU-7 a']
  },
  'CCI-001878': {
    def: 'The information system provides a report generation capability that supports on-demand audit review and analysis.',
    nist: ['AU-7 a']
  },
  'CCI-001879': {
    def: 'The information system provides a report generation capability that supports on-demand reporting requirements.',
    nist: ['AU-7 a']
  },
  'CCI-001880': {
    def: 'The information system provides a report generation capability that supports after-the-fact investigations of security incidents.',
    nist: ['AU-7 a']
  },
  'CCI-001881': {
    def: 'The information system provides an audit reduction capability that does not alter original content or time ordering of audit records.',
    nist: ['AU-7 b']
  },
  'CCI-001882': {
    def: 'The information system provides a report generation capability that does not alter original content or time ordering of audit records.',
    nist: ['AU-7 b']
  },
  'CCI-001883': {
    def: 'The organization defines the audit fields within audit records to be processed for events of interest by the information system.',
    nist: ['AU-7 (1)']
  },
  'CCI-001884': {
    def: 'The organization defines the audit fields within audit records to be sorted for events of interest by the information system.',
    nist: ['AU-7 (2)']
  },
  'CCI-001885': {
    def: 'The organization defines the audit fields within audit records to be searched for events of interest by the information system.',
    nist: ['AU-7 (2)']
  },
  'CCI-001886': {
    def: 'The information system provides the capability to sort audit records for events of interest based on the content of organization-defined audit fields within audit records.',
    nist: ['AU-7 (2)']
  },
  'CCI-001887': {
    def: 'The information system provides the capability to search audit records for events of interest based on the content of organization-defined audit fields within audit records.',
    nist: ['AU-7 (2)']
  },
  'CCI-001888': {
    def: 'The organization defines the granularity of time measurement for time stamps generated for audit records.',
    nist: ['AU-8 b']
  },
  'CCI-001889': {
    def: 'The information system records time stamps for audit records that meet organization-defined granularity of time measurement.',
    nist: ['AU-8 b']
  },
  'CCI-001890': {
    def: 'The information system records time stamps for audit records that can be mapped to Coordinated Universal Time (UTC) or Greenwich Mean Time (GMT).',
    nist: ['AU-8 b']
  },
  'CCI-001891': {
    def: 'The information system compares internal information system clocks on an organization-defined frequency with an organization-defined authoritative time source.',
    nist: ['AU-8 (1) (a)']
  },
  'CCI-001892': {
    def: 'The organization defines the time difference which, when exceeded, will require the information system to synchronize the internal information system clocks to the organization-defined authoritative time source.',
    nist: ['AU-8 (1) (b)']
  },
  'CCI-001893': {
    def: 'The information system identifies a secondary authoritative time source that is located in a different geographic region than the primary authoritative time source.',
    nist: ['AU-8 (2)']
  },
  'CCI-002046': {
    def: 'The information system synchronizes the internal system clocks to the authoritative time source when the time difference is greater than the organization-defined time period.',
    nist: ['AU-8 (1) (b)']
  },
  'CCI-001894': {
    def: 'The organization defines the subset of privileged users who will be authorized access to the management of audit functionality.',
    nist: ['AU-9 (4)']
  },
  'CCI-001895': {
    def: 'The organization defines the audit information requiring dual authorization for movement or deletion actions.',
    nist: ['AU-9 (5)']
  },
  'CCI-001896': {
    def: 'The organization enforces dual authorization for movement and/or deletion of organization-defined audit information.',
    nist: ['AU-9 (5)']
  },
  'CCI-001897': {
    def: 'The organization defines the subset of privileged users who will be authorized read-only access to audit information.',
    nist: ['AU-9 (6)']
  },
  'CCI-001898': {
    def: 'The organization authorizes read-only access to audit information to an organization-defined subset of privileged users.',
    nist: ['AU-9 (6)']
  },
  'CCI-001899': {
    def: 'The organization defines the actions to be covered by non-repudiation.',
    nist: ['AU-10']
  },
  'CCI-001900': {
    def: 'The organization defines the strength of binding to be applied to the binding of the identity of the information producer with the information.',
    nist: ['AU-10 (1) (a)']
  },
  'CCI-001901': {
    def: 'The information system binds the identity of the information producer with the information to an organization-defined strength of binding.',
    nist: ['AU-10 (1) (a)']
  },
  'CCI-001902': {
    def: 'The information system provides the means for authorized individuals to determine the identity of the producer of the information.',
    nist: ['AU-10 (1) (b)']
  },
  'CCI-001903': {
    def: 'The organization defines the frequency on which the information system is to validate the binding of the information producer identity to the information.',
    nist: ['AU-10 (2) (a)']
  },
  'CCI-001904': {
    def: 'The information system validates the binding of the information producer identity to the information at an organization-defined frequency.',
    nist: ['AU-10 (2) (a)']
  },
  'CCI-001905': {
    def: 'The organization defines the actions to be performed in the event of an error when validating the binding of the information producer identity to the information.',
    nist: ['AU-10 (2) (b)']
  },
  'CCI-001906': {
    def: 'The information system performs organization-defined actions in the event of an error when validating the binding of the information producer identity to the information.',
    nist: ['AU-10 (2) (b)']
  },
  'CCI-001907': {
    def: 'The organization defines the security domains which will require the information system validate the binding of the information reviewer identity to the information at the transfer or release points prior to release/transfer.',
    nist: ['AU-10 (4) (a)']
  },
  'CCI-001908': {
    def: 'The organization defines the action the information system is to perform in the event of an information reviewer identity binding validation error.',
    nist: ['AU-10 (4) (b)']
  },
  'CCI-001909': {
    def: 'The information system performs organization-defined actions in the event of an information reviewer identity binding validation error.',
    nist: ['AU-10 (4) (b)']
  },
  'CCI-002044': {
    def: 'The organization defines measures to be employed to ensure that long-term audit records generated by the information system can be retrieved.',
    nist: ['AU-11 (1)']
  },
  'CCI-002045': {
    def: 'The organization employs organization-defined measures to ensure that long-term audit records generated by the information system can be retrieved.',
    nist: ['AU-11 (1)']
  },
  'CCI-001910': {
    def: 'The organization defines the personnel or roles allowed to select which auditable events are to be audited by specific components of the information system.',
    nist: ['AU-12 b']
  },
  'CCI-001911': {
    def: 'The organization defines the selectable event criteria to be used as the basis for changes to the auditing to be performed on organization-defined information system components, by organization-defined individuals or roles, within organization-defined time thresholds.',
    nist: ['AU-12 (3)']
  },
  'CCI-001912': {
    def: 'The organization defines the time thresholds for organization-defined individuals or roles to change the auditing to be performed based on organization-defined selectable event criteria.',
    nist: ['AU-12 (3)']
  },
  'CCI-001913': {
    def: 'The organization defines the individuals or roles that are to be provided the capability to change the auditing to be performed based on organization-defined selectable event criteria, within organization-defined time thresholds.',
    nist: ['AU-12 (3)']
  },
  'CCI-001914': {
    def: 'The information system provides the capability for organization-defined individuals or roles to change the auditing to be performed on organization-defined information system components based on organization-defined selectable event criteria within organization-defined time thresholds.',
    nist: ['AU-12 (3)']
  },
  'CCI-002047': {
    def: 'The organization defines the information system components on which the auditing that is to be performed can be changed by organization-defined individuals or roles.',
    nist: ['AU-12 (3)']
  },
  'CCI-001915': {
    def: 'The organization defines the open source information and/or information sites to be monitored for evidence of unauthorized exfiltration or disclosure of organizational information.',
    nist: ['AU-13']
  },
  'CCI-001916': {
    def: 'The organization employs automated mechanisms to determine if organizational information has been disclosed in an unauthorized manner.',
    nist: ['AU-13 (1)']
  },
  'CCI-001917': {
    def: 'The organization defines the frequency for reviewing the open source information sites being monitored.',
    nist: ['AU-13 (2)']
  },
  'CCI-001918': {
    def: 'The organization reviews the open source information sites being monitored per organization-defined frequency.',
    nist: ['AU-13 (2)']
  },
  'CCI-001919': {
    def: 'The information system provides the capability for authorized users to select a user session to capture/record or view/hear.',
    nist: ['AU-14']
  },
  'CCI-001920': {
    def: 'The information system provides the capability for authorized users to remotely view/hear all content related to an established user session in real time.',
    nist: ['AU-14 (3)']
  },
  'CCI-001921': {
    def: 'The organization defines the alternative audit functionality to be provided in the event of a failure in the primary audit capability.',
    nist: ['AU-15']
  },
  'CCI-001922': {
    def: 'The organization provides an alternative audit capability in the event of a failure in primary audit capability that provides organization-defined alternative audit functionality.',
    nist: ['AU-15']
  },
  'CCI-001923': {
    def: 'The organization defines the audit information to be coordinated among external organizations when audit information is transmitted across organizational boundaries.',
    nist: ['AU-16']
  },
  'CCI-001924': {
    def: 'The organization defines the methods to be employed when coordinating audit information among external organizations when audit information is transmitted across organizational boundaries.',
    nist: ['AU-16']
  },
  'CCI-001925': {
    def: 'The organization employs organization-defined methods for coordinating organization-defined audit information among external organizations when audit information is transmitted across organizational boundaries.',
    nist: ['AU-16']
  },
  'CCI-001926': {
    def: 'The organization requires that the identity of individuals be preserved in cross-organizational audit trails.',
    nist: ['AU-16 (1)']
  },
  'CCI-001927': {
    def: 'The organization defines the organizations that will be provided cross-organizational audit information.',
    nist: ['AU-16 (2)']
  },
  'CCI-001928': {
    def: 'The organization defines the cross-organizational sharing agreements to be established with organization-defined organizations authorized to be provided cross-organizational sharing of audit information.',
    nist: ['AU-16 (2)']
  },
  'CCI-001929': {
    def: 'The organization provides cross-organizational audit information to organization-defined organizations based on organization-defined cross organizational sharing agreements.',
    nist: ['AU-16 (2)']
  },
  'CCI-002060': {
    def: 'The organization develops and documents a security assessment and authorization policy that addresses purpose, scope, roles, responsibilities, management commitment, coordination among organizational entities, and compliance.',
    nist: ['CA-1 a 1']
  },
  'CCI-002061': {
    def: 'The organization defines the personnel or roles to whom security assessment and authorization policy is to be disseminated.',
    nist: ['CA-1 a 1']
  },
  'CCI-002062': {
    def: 'The organization defines the personnel or roles to whom the security assessment and authorization procedures are to be disseminated.',
    nist: ['CA-1 a 2']
  },
  'CCI-002063': {
    def: 'The organization defines the level of independence for assessors or assessment teams to conduct security control assessments of organizational information systems.',
    nist: ['CA-2 (1)']
  },
  'CCI-002064': {
    def: 'The organization selects one or more security assessment techniques to be conducted.',
    nist: ['CA-2 (2)']
  },
  'CCI-002065': {
    def: 'The organization defines the frequency at which to conduct security control assessments.',
    nist: ['CA-2 (2)']
  },
  'CCI-002066': {
    def: 'The organization accepts the results of an assessment of the organization-defined information system performed by an organization-defined external organization when the assessment meets organization-defined requirements.',
    nist: ['CA-2 (3)']
  },
  'CCI-002067': {
    def: 'The organization defines the information systems for which they will accept the results of an assessment performed by an external organization.',
    nist: ['CA-2 (3)']
  },
  'CCI-002068': {
    def: 'The organization defines the external organizations from which assessment results for organization-defined information systems will be accepted.',
    nist: ['CA-2 (3)']
  },
  'CCI-002069': {
    def: 'The organization defines the requirements the assessments for organization-defined information systems from organization-defined external organizations must meet.',
    nist: ['CA-2 (3)']
  },
  'CCI-002070': {
    def: 'The organization^s security assessment plan describes the assessment team, and assessment roles and responsibilities.',
    nist: ['CA-2 a 3']
  },
  'CCI-002071': {
    def: 'The organization defines the individuals or roles to whom the results of the security control assessment are to be provided.',
    nist: ['CA-2 d']
  },
  'CCI-002072': {
    def: 'The organization defines the unclassified, national security systems that are prohibited from directly connecting to an external network without the use of an organization-defined boundary protection device.',
    nist: ['CA-3 (1)']
  },
  'CCI-002073': {
    def: 'The organization defines the boundary protection device to be used to connect organization-defined unclassified, national security systems to an external network.',
    nist: ['CA-3 (1)']
  },
  'CCI-002074': {
    def: 'The organization defines the boundary protection device to be used for the direct connection of classified, national security system to an external network.',
    nist: ['CA-3 (2)']
  },
  'CCI-002075': {
    def: 'The organization prohibits the direct connection of an organization-defined unclassified, non-national security system to an external network without the use of organization-defined boundary protection device.',
    nist: ['CA-3 (3)']
  },
  'CCI-002076': {
    def: 'The organization defines the unclassified, non-national security system that is prohibited from directly connecting to an external network without the use of an organization-defined boundary protection device.',
    nist: ['CA-3 (3)']
  },
  'CCI-002077': {
    def: 'The organization defines the boundary protection device to be used to directly connect an organization-defined unclassified, non-national security system to an external network.',
    nist: ['CA-3 (3)']
  },
  'CCI-002078': {
    def: 'The organization prohibits the direct connection of an organization-defined information system to a public network.',
    nist: ['CA-3 (4)']
  },
  'CCI-002079': {
    def: 'The organization defines the information system that is prohibited from directly connecting to a public network.',
    nist: ['CA-3 (4)']
  },
  'CCI-002080': {
    def: 'The organization employs either an allow-all, deny-by-exception or a deny-all, permit-by-exception policy for allowing organization-defined information systems to connect to external information systems.',
    nist: ['CA-3 (5)']
  },
  'CCI-002081': {
    def: 'The organization defines the information systems that employ either an allow-all, deny-by-exception or a deny-all, permit-by-exception policy for allowing connections to external information systems.',
    nist: ['CA-3 (5)']
  },
  'CCI-002082': {
    def: 'The organization selects either an allow-all, deny-by-exception or a deny-all, permit-by-exception policy for allowing organization-defined information systems to connect to external information systems.',
    nist: ['CA-3 (5)']
  },
  'CCI-002083': {
    def: 'The organization reviews and updates Interconnection Security Agreements on an organization-defined frequency.',
    nist: ['CA-3 c']
  },
  'CCI-002084': {
    def: 'The organization defines the frequency at which reviews and updates to the Interconnection Security Agreements must be conducted.',
    nist: ['CA-3 c']
  },
  'CCI-002085': {
    def: 'The organization defines the level of independence the assessors or assessment teams must have to monitor the security controls in the information system on an ongoing basis.',
    nist: ['CA-7 (1)']
  },
  'CCI-002086': {
    def: 'The organization employs trend analyses to determine if security control implementations, the frequency of continuous monitoring activities, and/or the types of activities used in the continuous monitoring process need to be modified based on empirical data.',
    nist: ['CA-7 (3)']
  },
  'CCI-002087': {
    def: 'The organization establishes and defines the metrics to be monitored for the continuous monitoring program.',
    nist: ['CA-7 a']
  },
  'CCI-002088': {
    def: 'The organization establishes and defines the frequencies for continuous monitoring.',
    nist: ['CA-7 b']
  },
  'CCI-002089': {
    def: 'The organization establishes and defines the frequencies for assessments supporting continuous monitoring.',
    nist: ['CA-7 b']
  },
  'CCI-002090': {
    def: 'The organization implements a continuous monitoring program that includes ongoing security status monitoring of organization-defined metrics in accordance with the organizational continuous monitoring strategy.',
    nist: ['CA-7 d']
  },
  'CCI-002091': {
    def: 'The organization implements a continuous monitoring program that includes correlation and analysis of security-related information generated by assessments and monitoring.',
    nist: ['CA-7 e']
  },
  'CCI-002092': {
    def: 'The organization implements a continuous monitoring program that includes response actions to address results of the analysis of security-related information.',
    nist: ['CA-7 f']
  },
  'CCI-002093': {
    def: 'The organization conducts penetration testing in accordance with organization-defined frequency on organization-defined information systems or system components.',
    nist: ['CA-8']
  },
  'CCI-002094': {
    def: 'The organization defines the frequency for conducting penetration testing on organization-defined information systems or system components.',
    nist: ['CA-8']
  },
  'CCI-002095': {
    def: 'The organization defines the information systems or system components on which penetration testing will be conducted.',
    nist: ['CA-8']
  },
  'CCI-002096': {
    def: 'The organization employs an independent penetration agent or penetration team to perform penetration testing on the information system or system components.',
    nist: ['CA-8 (1)']
  },
  'CCI-002097': {
    def: 'The organization defines red team exercises to simulate attempts by adversaries to compromise organizational information systems.',
    nist: ['CA-8 (2)']
  },
  'CCI-002098': {
    def: 'The organization defines rules of engagement for red team exercises to simulate attempts by adversaries to compromise organizational information systems.',
    nist: ['CA-8 (2)']
  },
  'CCI-002099': {
    def: 'The organization employs organization-defined red team exercises to simulate attempts by adversaries to compromise organizational information systems in accordance with organization-defined rules of engagement.',
    nist: ['CA-8 (2)']
  },
  'CCI-002100': {
    def: 'The information system performs security compliance checks on constituent components prior to the establishment of the internal connection.',
    nist: ['CA-9 (1)']
  },
  'CCI-002101': {
    def: 'The organization authorizes internal connections of organization-defined information system components or classes of components to the information system.',
    nist: ['CA-9 (a)']
  },
  'CCI-002102': {
    def: 'The organization defines the information system components or classes of components that are authorized internal connections to the information system.',
    nist: ['CA-9 (a)']
  },
  'CCI-002103': {
    def: 'The organization documents, for each internal connection, the interface characteristics.',
    nist: ['CA-9 (b)']
  },
  'CCI-002104': {
    def: 'The organization documents, for each internal connection, the security requirements.',
    nist: ['CA-9 (b)']
  },
  'CCI-002105': {
    def: 'The organization documents, for each internal connection, the nature of the information communicated.',
    nist: ['CA-9 (b)']
  },
  'CCI-001820': {
    def: 'The organization documents a configuration management policy that addresses purpose, scope, roles, responsibilities, management commitment, coordination among organizational entities, and compliance.',
    nist: ['CM-1 a 1']
  },
  'CCI-001821': {
    def: 'The organization defines the organizational personnel or roles to whom the configuration management policy is to be disseminated.',
    nist: ['CM-1 a 1']
  },
  'CCI-001822': {
    def: 'The organization disseminates the configuration management policy to organization-defined personnel or roles.',
    nist: ['CM-1 a 1']
  },
  'CCI-001823': {
    def: 'The organization documents the procedures to facilitate the implementation of the configuration management policy and associated configuration management controls.',
    nist: ['CM-1 a 2']
  },
  'CCI-001824': {
    def: 'The organization defines the organizational personnel or roles to whom the configuration management procedures are to be disseminated.',
    nist: ['CM-1 a 2']
  },
  'CCI-001825': {
    def: 'The organization disseminates to organization-defined personnel or roles the procedures to facilitate the implementation of the configuration management policy and associated configuration management controls.',
    nist: ['CM-1 a 2']
  },
  'CCI-001736': {
    def: 'The organization defines the previous versions of the baseline configuration of the information system required to support rollback.',
    nist: ['CM-2 (3)']
  },
  'CCI-001737': {
    def: 'The organization defines the information systems, system components, or devices that are to have organization-defined configurations applied when located in areas of significant risk.',
    nist: ['CM-2 (7) (a)']
  },
  'CCI-001738': {
    def: 'The organization defines the security configurations to be implemented on information systems, system components, or devices when they are located in areas of significant risk.',
    nist: ['CM-2 (7) (a)']
  },
  'CCI-001739': {
    def: 'The organization issues organization-defined information systems, system components, or devices with organization-defined configurations to individuals traveling to locations the organization deems to be of significant risk.',
    nist: ['CM-2 (7) (a)']
  },
  'CCI-001815': {
    def: 'The organization defines the security safeguards to be applied to devices when they return from areas of significant risk.',
    nist: ['CM-2 (7) (b)']
  },
  'CCI-001816': {
    def: 'The organization applies organization-defined security safeguards to devices when individuals return from areas of significant risk.',
    nist: ['CM-2 (7) (b)']
  },
  'CCI-001740': {
    def: 'The organization reviews proposed configuration-controlled changes to the information system.',
    nist: ['CM-3 b']
  },
  'CCI-001741': {
    def: 'The organization documents configuration change decisions associated with the information system.',
    nist: ['CM-3 c']
  },
  'CCI-001742': {
    def: 'The organization defines the approval authorities to be notified when proposed changes to the information system are received.',
    nist: ['CM-3 (1) (b)']
  },
  'CCI-001743': {
    def: 'The organization defines the security responses to be automatically implemented by the information system if baseline configurations are changed in an unauthorized manner.',
    nist: ['CM-3 (5)']
  },
  'CCI-001744': {
    def: 'The information system implements organization-defined security responses automatically if baseline configurations are changed in an unauthorized manner.',
    nist: ['CM-3 (5)']
  },
  'CCI-001745': {
    def: 'The organization defines the security safeguards that are to be provided by the cryptographic mechanisms which are employed by the organization.',
    nist: ['CM-3 (6)']
  },
  'CCI-001746': {
    def: 'The organization ensures that cryptographic mechanisms used to provide organization-defined security safeguards are under configuration management.',
    nist: ['CM-3 (6)']
  },
  'CCI-001819': {
    def: 'The organization implements approved configuration-controlled changes to the information system.',
    nist: ['CM-3 d']
  },
  'CCI-002056': {
    def: 'The organization defines the time period the records of configuration-controlled changes are to be retained.',
    nist: ['CM-3 e']
  },
  'CCI-002057': {
    def: 'The organization defines the personnel to be notified when approved changes to the information system are completed.',
    nist: ['CM-3 (1) (f)']
  },
  'CCI-002058': {
    def: 'The organization employs automated mechanisms to notify organization-defined personnel when approved changes to the information system are completed.',
    nist: ['CM-3 (1) (f)']
  },
  'CCI-001817': {
    def: 'The organization, when analyzing changes to the information system, looks for security impacts due to flaws, weaknesses, incompatibility, or intentional malice.',
    nist: ['CM-4 (1)']
  },
  'CCI-001818': {
    def: 'The organization analyzes changes to the information system in a separate test environment before installation in an operational environment.',
    nist: ['CM-4 (1)']
  },
  'CCI-001747': {
    def: 'The organization defines critical software components the information system will prevent from being installed without verification the component has been digitally signed using a certificate that is recognized and approved by the organization.',
    nist: ['CM-5 (3)']
  },
  'CCI-001748': {
    def: 'The organization defines critical firmware components the information system will prevent from being installed without verification the component has been digitally signed using a certificate that is recognized and approved by the organization.',
    nist: ['CM-5 (3)']
  },
  'CCI-001749': {
    def: 'The information system prevents the installation of organization-defined software components without verification the software component has been digitally signed using a certificate that is recognized and approved by the organization.',
    nist: ['CM-5 (3)']
  },
  'CCI-001750': {
    def: 'The information system prevents the installation of organization-defined firmware components without verification the firmware component has been digitally signed using a certificate that is recognized and approved by the organization.',
    nist: ['CM-5 (3)']
  },
  'CCI-001751': {
    def: 'The organization defines system-level information requiring enforcement of a dual authorization for information system changes.',
    nist: ['CM-5 (4)']
  },
  'CCI-001752': {
    def: 'The organization enforces dual authorization for changes to organization-defined system-level information.',
    nist: ['CM-5 (4)']
  },
  'CCI-001753': {
    def: 'The organization limits privileges to change information system components within a production or operational environment.',
    nist: ['CM-5 (5) (a)']
  },
  'CCI-001754': {
    def: 'The organization limits privileges to change system-related information within a production or operational environment.',
    nist: ['CM-5 (5) (a)']
  },
  'CCI-001813': {
    def: 'The information system enforces access restrictions.',
    nist: ['CM-5 (1)']
  },
  'CCI-001814': {
    def: 'The Information system supports auditing of the enforcement actions.',
    nist: ['CM-5 (1)']
  },
  'CCI-001826': {
    def: 'The organization defines the circumstances upon which the organization reviews the information system changes to determine whether unauthorized changes have occurred.',
    nist: ['CM-5 (2)']
  },
  'CCI-001827': {
    def: 'The organization defines the frequency with which to review information system privileges.',
    nist: ['CM-5 (5) (b)']
  },
  'CCI-001828': {
    def: 'The organization defines the frequency with which to reevaluate information system privileges.',
    nist: ['CM-5 (5) (b)']
  },
  'CCI-001829': {
    def: 'The organization reviews information system privileges per an organization-defined frequency.',
    nist: ['CM-5 (5) (b)']
  },
  'CCI-001830': {
    def: 'The organization reevaluates information system privileges per an organization-defined frequency.',
    nist: ['CM-5 (5) (b)']
  },
  'CCI-001755': {
    def: 'The organization defines the information system components for which any deviation from the established configuration settings are to be identified, documented, and approved.',
    nist: ['CM-6 c']
  },
  'CCI-001756': {
    def: 'The organization defines the operational requirements on which the configuration settings for the organization-defined information system components are to be based.',
    nist: ['CM-6 c']
  },
  'CCI-001757': {
    def: 'The organization defines the security safeguards the organization is to employ when responding to unauthorized changes to the organization-defined configuration settings.',
    nist: ['CM-6 (2)']
  },
  'CCI-001758': {
    def: 'The organization defines configuration settings for which the organization will employ organization-defined security safeguards in response to unauthorized changes.',
    nist: ['CM-6 (2)']
  },
  'CCI-001759': {
    def: 'The organization employs organization-defined security safeguards to respond to unauthorized changes to organization-defined configuration settings.',
    nist: ['CM-6 (2)']
  },
  'CCI-002059': {
    def: 'The organization defines the information system components for which the organization will employ automated mechanisms to centrally manage, apply, and verify configuration settings.',
    nist: ['CM-6 (1)']
  },
  'CCI-001760': {
    def: 'The organization defines the frequency of information system reviews to identify unnecessary and/or nonsecure functions, ports, protocols, and services.',
    nist: ['CM-7 (1) (a)']
  },
  'CCI-001761': {
    def: 'The organization defines the functions, ports, protocols, and services within the information system that are to be disabled when deemed unnecessary and/or nonsecure.',
    nist: ['CM-7 (1) (b)']
  },
  'CCI-001762': {
    def: 'The organization disables organization-defined functions, ports, protocols, and services within the information system deemed to be unnecessary and/or nonsecure.',
    nist: ['CM-7 (1) (b)']
  },
  'CCI-001763': {
    def: 'The organization defines the policies regarding software program usage and restrictions.',
    nist: ['CM-7 (2)']
  },
  'CCI-001764': {
    def: 'The information system prevents program execution in accordance with organization-defined policies regarding software program usage and restrictions, and/or rules authorizing the terms and conditions of software program usage.',
    nist: ['CM-7 (2)']
  },
  'CCI-001765': {
    def: 'The organization defines the software programs not authorized to execute on the information system.',
    nist: ['CM-7 (4) (a)']
  },
  'CCI-001766': {
    def: 'The organization identifies the organization-defined software programs not authorized to execute on the information system.',
    nist: ['CM-7 (4) (a)']
  },
  'CCI-001767': {
    def: 'The organization employs an allow-all, deny-by-exception policy to prohibit the execution of unauthorized software programs on the information system.',
    nist: ['CM-7 (4) (b)']
  },
  'CCI-001768': {
    def: 'The organization defines the frequency on which it will review and update the list of unauthorized software programs.',
    nist: ['CM-7 (4) (c)']
  },
  'CCI-001769': {
    def: 'The organization defines the frequency on which it will update the list of unauthorized software programs.',
    nist: ['CM-7 (4) (c)']
  },
  'CCI-001770': {
    def: 'The organization reviews and updates the list of unauthorized software programs per organization-defined frequency.',
    nist: ['CM-7 (4) (c)']
  },
  'CCI-001771': {
    def: 'The organization updates the list of unauthorized software programs per organization-defined frequency.',
    nist: ['CM-7 (4) (c)']
  },
  'CCI-001772': {
    def: 'The organization defines the software programs authorized to execute on the information system.',
    nist: ['CM-7 (5) (a)']
  },
  'CCI-001773': {
    def: 'The organization identifies the organization-defined software programs authorized to execute on the information system.',
    nist: ['CM-7 (5) (a)']
  },
  'CCI-001774': {
    def: 'The organization employs a deny-all, permit-by-exception policy to allow the execution of authorized software programs on the information system.',
    nist: ['CM-7 (5) (b)']
  },
  'CCI-001775': {
    def: 'The organization defines the frequency on which it will review and update the list of authorized software programs.',
    nist: ['CM-7 (5) (c)']
  },
  'CCI-001776': {
    def: 'The organization defines the frequency on which it will update the list of authorized software programs.',
    nist: ['CM-7 (5) (c)']
  },
  'CCI-001777': {
    def: 'The organization reviews and updates the list of authorized software programs per organization-defined frequency.',
    nist: ['CM-7 (5) (c)']
  },
  'CCI-001778': {
    def: 'The organization updates the list of authorized software programs per organization-defined frequency.',
    nist: ['CM-7 (5) (c)']
  },
  'CCI-001779': {
    def: 'The organization defines the frequency on which the information system component inventory is to be reviewed and updated.',
    nist: ['CM-8 b']
  },
  'CCI-001780': {
    def: 'The organization reviews and updates the information system component inventory per organization-defined frequency.',
    nist: ['CM-8 b']
  },
  'CCI-001781': {
    def: 'The organization defines the frequency on which the information system component inventory is to be updated.',
    nist: ['CM-8 b']
  },
  'CCI-001782': {
    def: 'The organization updates the information system component inventory per organization-defined frequency.',
    nist: ['CM-8 b']
  },
  'CCI-001783': {
    def: 'The organization defines the personnel or roles to be notified when unauthorized hardware, software, and firmware components are detected within the information system.',
    nist: ['CM-8 (3) (b)']
  },
  'CCI-001784': {
    def: 'When unauthorized hardware, software, and firmware components are detected within the information system, the organization takes action to disable network access by such components, isolates the components, and/or notifies organization-defined personnel or roles.',
    nist: ['CM-8 (3) (b)']
  },
  'CCI-001785': {
    def: 'The organization provides a centralized repository for the inventory of information system components.',
    nist: ['CM-8 (7)']
  },
  'CCI-001786': {
    def: 'The organization employs automated mechanisms to support tracking of information system components by geographic location.',
    nist: ['CM-8 (8)']
  },
  'CCI-001787': {
    def: 'The organization defines the acquired information system components that are to be assigned to an information system.',
    nist: ['CM-8 (9) (a)']
  },
  'CCI-001788': {
    def: 'The organization assigns organization-defined acquired information system components to an information system.',
    nist: ['CM-8 (9) (a)']
  },
  'CCI-001789': {
    def: 'The organization receives an acknowledgement from the information system owner of the assignment of the acquired information system components to an information system.',
    nist: ['CM-8 (9) (b)']
  },
  'CCI-001790': {
    def: 'The organization develops a configuration management plan for the information system that establishes a process for identifying configuration items throughout the system development life cycle.',
    nist: ['CM-9 b']
  },
  'CCI-001791': {
    def: 'The organization documents a configuration management plan for the information system that establishes a process for identifying configuration items throughout the system development life cycle.',
    nist: ['CM-9 b']
  },
  'CCI-001792': {
    def: 'The organization implements a configuration management plan for the information system that establishes a process for identifying configuration items throughout the system development life cycle.',
    nist: ['CM-9 b']
  },
  'CCI-001793': {
    def: 'The organization develops a configuration management plan for the information system that establishes a process for managing the configuration of the configuration items.',
    nist: ['CM-9 b']
  },
  'CCI-001794': {
    def: 'The organization documents a configuration management plan for the information system that establishes a process for managing the configuration of the configuration items.',
    nist: ['CM-9 b']
  },
  'CCI-001795': {
    def: 'The organization implements a configuration management plan for the information system that establishes a process for managing the configuration of the configuration items.',
    nist: ['CM-9 b']
  },
  'CCI-001796': {
    def: 'The organization develops a configuration management plan for the information system that places the configuration items under configuration management.',
    nist: ['CM-9 c']
  },
  'CCI-001797': {
    def: 'The organization documents a configuration management plan for the information system that places the configuration items under configuration management.',
    nist: ['CM-9 c']
  },
  'CCI-001798': {
    def: 'The organization implements a configuration management plan for the information system that places the configuration items under configuration management.',
    nist: ['CM-9 c']
  },
  'CCI-001799': {
    def: 'The organization develops and documents a configuration management plan for the information system that protects the configuration management plan from unauthorized disclosure and modification.',
    nist: ['CM-9 d']
  },
  'CCI-001800': {
    def: 'The organization documents a configuration management plan for the information system that protects the configuration management plan from unauthorized disclosure and modification.',
    nist: ['CM-9 d']
  },
  'CCI-001801': {
    def: 'The organization implements a configuration management plan for the information system that protects the configuration management plan from unauthorized disclosure and modification.',
    nist: ['CM-9 d']
  },
  'CCI-001726': {
    def: 'The organization uses software in accordance with contract agreements.',
    nist: ['CM-10 a']
  },
  'CCI-001727': {
    def: 'The organization uses software documentation in accordance with contract agreements.',
    nist: ['CM-10 a']
  },
  'CCI-001728': {
    def: 'The organization uses software in accordance with copyright laws.',
    nist: ['CM-10 a']
  },
  'CCI-001729': {
    def: 'The organization uses software documentation in accordance with copyright laws.',
    nist: ['CM-10 a']
  },
  'CCI-001730': {
    def: 'The organization tracks the use of software protected by quantity licenses to control copying of the software.',
    nist: ['CM-10 b']
  },
  'CCI-001731': {
    def: 'The organization tracks the use of software documentation protected by quantity licenses to control distribution of the software documentation.',
    nist: ['CM-10 b']
  },
  'CCI-001732': {
    def: 'The organization controls the use of peer-to-peer file sharing technology to ensure that this capability is not used for the unauthorized distribution, display, performance, or reproduction of copyrighted work.',
    nist: ['CM-10 c']
  },
  'CCI-001733': {
    def: 'The organization documents the use of peer-to-peer file sharing technology to ensure that this capability is not used for the unauthorized distribution, display, performance, or reproduction of copyrighted work.',
    nist: ['CM-10 c']
  },
  'CCI-001734': {
    def: 'The organization defines the restrictions to be followed on the use of open source software.',
    nist: ['CM-10 (1)']
  },
  'CCI-001735': {
    def: 'The organization establishes organization-defined restrictions on the use of open source software.',
    nist: ['CM-10 (1)']
  },
  'CCI-001802': {
    def: 'The organization tracks the use of software documentation protected by quantity licenses to control copying of the software documentation.',
    nist: ['CM-10 b']
  },
  'CCI-001803': {
    def: 'The organization tracks the use of software protected by quantity licenses to control distribution of the software.',
    nist: ['CM-10 b']
  },
  'CCI-001804': {
    def: 'The organization defines the policies for governing the installation of software by users.',
    nist: ['CM-11 a']
  },
  'CCI-001805': {
    def: 'The organization establishes organization-defined policies governing the installation of software by users.',
    nist: ['CM-11 a']
  },
  'CCI-001806': {
    def: 'The organization defines methods to be employed to enforce the software installation policies.',
    nist: ['CM-11 b']
  },
  'CCI-001807': {
    def: 'The organization enforces software installation policies through organization-defined methods.',
    nist: ['CM-11 b']
  },
  'CCI-001808': {
    def: 'The organization defines the frequency on which it will monitor software installation policy compliance.',
    nist: ['CM-11 c']
  },
  'CCI-001809': {
    def: 'The organization monitors software installation policy compliance per an organization-defined frequency.',
    nist: ['CM-11 c']
  },
  'CCI-001810': {
    def: 'The organization defines the personnel or roles to be notified when unauthorized software is detected.',
    nist: ['CM-11 (1)']
  },
  'CCI-001811': {
    def: 'The information system alerts organization-defined personnel or roles when the unauthorized installation of software is detected.',
    nist: ['CM-11 (1)']
  },
  'CCI-001812': {
    def: 'The information system prohibits user installation of software without explicit privileged status.',
    nist: ['CM-11 (2)']
  },
  'CCI-002825': {
    def: 'The organization defines personnel or roles to whom the contingency planning policy is to be disseminated.',
    nist: ['CP-1 a 1']
  },
  'CCI-002826': {
    def: 'The organization defines personnel or roles to whom the contingency planning procedures are disseminated.',
    nist: ['CP-1 a 2']
  },
  'CCI-002827': {
    def: 'The organization coordinates its contingency plan with the contingency plans of external service providers to ensure that contingency requirements can be satisfied.',
    nist: ['CP-2 (7)']
  },
  'CCI-002828': {
    def: 'The organization identifies critical information system assets supporting essential missions.',
    nist: ['CP-2 (8)']
  },
  'CCI-002829': {
    def: 'The organization identifies critical information system assets supporting essential business functions.',
    nist: ['CP-2 (8)']
  },
  'CCI-002830': {
    def: 'The organization defines the personnel or roles who review and approve the contingency plan for the information system.',
    nist: ['CP-2 a 6']
  },
  'CCI-002831': {
    def: 'The organization defines a list of key contingency personnel (identified by name and/or by role) and organizational elements to whom contingency plan changes are to be communicated.',
    nist: ['CP-2 f']
  },
  'CCI-002832': {
    def: 'The organization protects the contingency plan from unauthorized disclosure and modification.',
    nist: ['CP-2 g']
  },
  'CCI-002833': {
    def: 'The organization defines the time period that contingency training is to be provided to information system users consistent with assigned roles and responsibilities within assuming a contingency role or responsibility.',
    nist: ['CP-3 a']
  },
  'CCI-002834': {
    def: 'The organization provides contingency training to information system users consistent with assigned roles and responsibilities when required by information system changes.',
    nist: ['CP-3 b']
  },
  'CCI-002835': {
    def: 'The organization tests the contingency plan at the alternate processing site to evaluate the capabilities of the alternate processing site to support contingency operations.',
    nist: ['CP-4 (2) (b)']
  },
  'CCI-002836': {
    def: 'The organization ensures that the alternate storage site provides information security safeguards equivalent to that of the primary site.',
    nist: ['CP-6 b']
  },
  'CCI-002837': {
    def: 'The organization plans for circumstances that preclude returning to the primary processing site.',
    nist: ['CP-7 (6)']
  },
  'CCI-002838': {
    def: 'The organization prepares for circumstances that preclude returning to the primary processing site.',
    nist: ['CP-7 (6)']
  },
  'CCI-002839': {
    def: 'The organization defines information system operations that are permitted to transfer and resume at an alternate processing site for essential missions/business functions when the primary processing capabilities are unavailable.',
    nist: ['CP-7 a']
  },
  'CCI-002840': {
    def: 'The organization defines the information system operations to be resumed for essential missions within the organization-defined time period when the primary telecommunications capabilities are unavailable at either the primary or alternate processing or storage sites.',
    nist: ['CP-8']
  },
  'CCI-002841': {
    def: 'The organization defines the information system operations to be resumed for essential business functions within the organization-defined time period when the primary telecommunications capabilities are unavailable at either the primary or alternate processing or storage sites.',
    nist: ['CP-8']
  },
  'CCI-002842': {
    def: 'The organization reviews provider contingency plans to ensure that the plans meet organizational contingency requirements.',
    nist: ['CP-8 (4) (b)']
  },
  'CCI-002843': {
    def: 'The organization defines the frequency with which to obtain evidence of contingency testing by providers.',
    nist: ['CP-8 (4) (c)  ']
  },
  'CCI-002844': {
    def: 'The organization defines the frequency with which to obtain evidence of contingency training by providers.',
    nist: ['CP-8 (4) (c)  ']
  },
  'CCI-002845': {
    def: 'The organization obtains evidence of contingency testing by providers in accordance with organization-defined frequency.',
    nist: ['CP-8 (4) (c)  ']
  },
  'CCI-002846': {
    def: 'The organization obtains evidence of contingency training by providers in accordance with organization-defined frequency.',
    nist: ['CP-8 (4) (c)  ']
  },
  'CCI-002847': {
    def: 'The organization defines the frequency with which to test alternate telecommunication services.',
    nist: ['CP-8 (5)']
  },
  'CCI-002848': {
    def: 'The organization tests alternate telecommunication services per organization-defined frequency.',
    nist: ['CP-8 (5)']
  },
  'CCI-002849': {
    def: 'The organization defines critical information system software and other security-related information, of which backup copies must be stored in a separate facility or in a fire-rated container.',
    nist: ['CP-9 (3)']
  },
  'CCI-002850': {
    def: 'The organization stores backup copies of organization-defined critical information system software and other security-related information in a separate facility or in a fire-rated container that is not collocated with the operational system.',
    nist: ['CP-9 (3)']
  },
  'CCI-002851': {
    def: 'The organization defines the backup information that requires dual authorization for deletion or destruction.',
    nist: ['CP-9 (7)']
  },
  'CCI-002852': {
    def: 'The organization enforces dual authorization for the deletion or destruction of organization-defined backup information.',
    nist: ['CP-9 (7)']
  },
  'CCI-002853': {
    def: 'The information system provides the capability to employ organization-defined alternative communications protocols in support of maintaining continuity of operations.',
    nist: ['CP-11']
  },
  'CCI-002854': {
    def: 'The organization defines the alternative communications protocols the information system must be capable of providing in support of maintaining continuity of operations.',
    nist: ['CP-11']
  },
  'CCI-002855': {
    def: 'The information system, when organization-defined conditions are detected, enters a safe mode of operation with organization-defined restrictions of safe mode of operation.',
    nist: ['CP-12']
  },
  'CCI-002856': {
    def: 'The organization defines the conditions that, when detected, the information system enters a safe mode of operation with organization-defined restrictions of safe mode of operation.',
    nist: ['CP-12']
  },
  'CCI-002857': {
    def: 'The organization defines the restrictions of the safe mode of operation that the information system will enter when organization-defined conditions are detected.',
    nist: ['CP-12']
  },
  'CCI-002858': {
    def: 'The organization employs organization-defined alternative or supplemental security mechanisms for satisfying organization-defined security functions when the primary means of implementing the security function is unavailable or compromised.',
    nist: ['CP-13']
  },
  'CCI-002859': {
    def: 'The organization defines the alternative or supplemental security mechanisms that will be employed for satisfying organization-defined security functions when the primary means of implementing the security function is unavailable or compromised.',
    nist: ['CP-13']
  },
  'CCI-002860': {
    def: 'The organization defines the security functions that must be satisfied when the primary means of implementing the security function is unavailable or compromised.',
    nist: ['CP-13']
  },
  'CCI-001932': {
    def: 'The organization documents an identification and authentication policy that addresses purpose, scope, roles, responsibilities, management commitment, coordination among organizational entities, and compliance.',
    nist: ['IA-1 a 1']
  },
  'CCI-001933': {
    def: 'The organization defines the personnel or roles to be recipients of the identification and authentication policy and the procedures to facilitate the implementation of the identification and authentication policy and associated identification and authentication controls.',
    nist: ['IA-1 a 1']
  },
  'CCI-001934': {
    def: 'The organization documents procedures to facilitate the implementation of the identification and authentication policy and associated identification and authentication controls.',
    nist: ['IA-1 a 2']
  },
  'CCI-001935': {
    def: 'The organization defines the strength of mechanism requirements for the device that is separate from the system gaining access to privileged accounts.',
    nist: ['IA-2 (6)']
  },
  'CCI-001936': {
    def: 'The information system implements multifactor authentication for network access to privileged accounts such that one of the factors is provided by a device separate from the system gaining access.',
    nist: ['IA-2 (6)']
  },
  'CCI-001937': {
    def: 'The device used in the information system implementation of multifactor authentication for network access to privileged accounts meets organization-defined strength of mechanism requirements.',
    nist: ['IA-2 (6)']
  },
  'CCI-001938': {
    def: 'The organization defines the strength of mechanism requirements for the device that is separate from the system gaining access to non-privileged accounts.',
    nist: ['IA-2 (7)']
  },
  'CCI-001939': {
    def: 'The information system implements multifactor authentication for network access to non-privileged accounts such that one of the factors is provided by a device separate from the system gaining access.',
    nist: ['IA-2 (7)']
  },
  'CCI-001940': {
    def: 'The device used in the information system implementation of multifactor authentication for network access to non-privileged accounts meets organization-defined strength of mechanism requirements.',
    nist: ['IA-2 (7)']
  },
  'CCI-001941': {
    def: 'The information system implements replay-resistant authentication mechanisms for network access to privileged accounts.',
    nist: ['IA-2 (8)']
  },
  'CCI-001942': {
    def: 'The information system implements replay-resistant authentication mechanisms for network access to non-privileged accounts.',
    nist: ['IA-2 (9)']
  },
  'CCI-001943': {
    def: 'The organization defines the information system accounts for which single sign-on capability will be provided.',
    nist: ['IA-2 (10)']
  },
  'CCI-001944': {
    def: 'The organization defines the information system services for which single sign-on capability will be provided.',
    nist: ['IA-2 (10)']
  },
  'CCI-001945': {
    def: 'The information system provides a single sign-on capability for an organization-defined list of information system accounts.',
    nist: ['IA-2 (10)']
  },
  'CCI-001946': {
    def: 'The information system provides a single sign-on capability for an organization-defined list of information system services.',
    nist: ['IA-2 (10)']
  },
  'CCI-001947': {
    def: 'The organization defines the strength of mechanism requirements for the device that is separate from the system gaining access and is to provide one factor of a multifactor authentication for remote access to privileged accounts.',
    nist: ['IA-2 (11)']
  },
  'CCI-001948': {
    def: 'The information system implements multifactor authentication for remote access to privileged accounts such that one of the factors is provided by a device separate from the system gaining access.',
    nist: ['IA-2 (11)']
  },
  'CCI-001949': {
    def: 'The device used in the information system implementation of multifactor authentication for remote access to privileged accounts meets organization-defined strength of mechanism requirements.',
    nist: ['IA-2 (11)']
  },
  'CCI-001950': {
    def: 'The organization defines the strength of mechanism requirements for the device that is separate from the system gaining access and is to provide one factor of a multifactor authentication for remote access to non-privileged accounts.',
    nist: ['IA-2 (11)']
  },
  'CCI-001951': {
    def: 'The information system implements multifactor authentication for remote access to non-privileged accounts such that one of the factors is provided by a device separate from the system gaining access.',
    nist: ['IA-2 (11)']
  },
  'CCI-001952': {
    def: 'The device used in the information system implementation of multifactor authentication for remote access to non-privileged accounts meets organization-defined strength of mechanism requirements.',
    nist: ['IA-2 (11)']
  },
  'CCI-001953': {
    def: 'The information system accepts Personal Identity Verification (PIV) credentials.',
    nist: ['IA-2 (12)']
  },
  'CCI-001954': {
    def: 'The information system electronically verifies Personal Identity Verification (PIV) credentials.',
    nist: ['IA-2 (12)']
  },
  'CCI-001955': {
    def: 'The organization defines the out-of-band authentication to be implemented by the information system under organization-defined conditions.',
    nist: ['IA-2 (13)']
  },
  'CCI-001956': {
    def: 'The organization defines the conditions for which the information system implements organization-defined out-of-band authentication.',
    nist: ['IA-2 (13)']
  },
  'CCI-001957': {
    def: 'The information system implements organization-defined out-of-band authentication under organization-defined conditions.',
    nist: ['IA-2 (13)']
  },
  'CCI-001958': {
    def: 'The information system authenticates an organization-defined list of specific and/or types of devices before establishing a local, remote, or network connection.',
    nist: ['IA-3']
  },
  'CCI-001959': {
    def: 'The organization defines the specific devices and/or type of devices the information system is to authenticate before establishing a connection.',
    nist: ['IA-3 (1)']
  },
  'CCI-001960': {
    def: 'The organization defines the lease information to be assigned to devices.',
    nist: ['IA-3 (3) (a)']
  },
  'CCI-001961': {
    def: 'The organization defines the lease duration to be assigned to devices.',
    nist: ['IA-3 (3) (a)']
  },
  'CCI-001962': {
    def: 'The organization standardizes dynamic address allocation lease information assigned to devices in accordance with organization-defined lease information.',
    nist: ['IA-3 (3) (a)']
  },
  'CCI-001963': {
    def: 'The organization standardizes dynamic address allocation lease duration assigned to devices in accordance with organization-defined lease duration.',
    nist: ['IA-3 (3) (a)']
  },
  'CCI-001964': {
    def: 'The organization defines the configuration management process that is to handle the device identification procedures.',
    nist: ['IA-3 (4)']
  },
  'CCI-001965': {
    def: 'The organization defines the configuration management process that is to handle the device authentication procedures.',
    nist: ['IA-3 (4)']
  },
  'CCI-001966': {
    def: 'The organization ensures that device identification based on attestation is handled by the organization-defined configuration management process.',
    nist: ['IA-3 (4)']
  },
  'CCI-001967': {
    def: 'The information system authenticates organization-defined devices and/or types of devices before establishing a local, remote, and/or network connection using bidirectional authentication that is cryptographically based.',
    nist: ['IA-3 (1)']
  },
  'CCI-001968': {
    def: 'The organization defines the configuration management process that is to handle the device identification procedures.',
    nist: ['IA-3 (4)']
  },
  'CCI-001969': {
    def: 'The organization ensures that device authentication based on attestation is handled by the organization-defined configuration management process.',
    nist: ['IA-3 (4)']
  },
  'CCI-001970': {
    def: 'The organization defines the personnel or roles that authorize the assignment of individual, group, role, and device identifiers.',
    nist: ['IA-4 a']
  },
  'CCI-001971': {
    def: 'The organization manages information system identifiers by receiving authorization from organization-defined personnel or roles to assign an individual, group, role, or device identifier.',
    nist: ['IA-4 a']
  },
  'CCI-001972': {
    def: 'The organization manages information system identifiers by selecting an identifier that identifies an individual, group, role, or device.',
    nist: ['IA-4 b']
  },
  'CCI-001973': {
    def: 'The organization manages information system identifiers by assigning the identifier to the intended individual, group, role, or device.',
    nist: ['IA-4 c']
  },
  'CCI-001974': {
    def: 'The organization defines the time period for which the reuse of identifiers is prohibited.',
    nist: ['IA-4 d']
  },
  'CCI-001975': {
    def: 'The organization manages information system identifiers by preventing reuse of identifiers for an organization-defined time period.',
    nist: ['IA-4 d']
  },
  'CCI-001976': {
    def: 'The information system dynamically manages identifiers.',
    nist: ['IA-4 (5)']
  },
  'CCI-001977': {
    def: 'The organization defines the external organizations with which it will coordinate for cross-management of identifiers.',
    nist: ['IA-4 (6)']
  },
  'CCI-001978': {
    def: 'The organization coordinates with organization-defined external organizations for cross-organization management of identifiers.',
    nist: ['IA-4 (6)']
  },
  'CCI-001979': {
    def: 'The organization requires the registration process to receive an individual identifier be conducted in person before a designated registration authority.',
    nist: ['IA-4 (7)']
  },
  'CCI-002040': {
    def: 'The organization requires that the registration process to receive an individual identifier includes supervisor authorization.',
    nist: ['IA-4 (2)']
  },
  'CCI-001980': {
    def: 'The organization manages information system authenticators by verifying, as part of the initial authenticator distribution, the identity of the individual, group, role, or device receiving the authenticator.',
    nist: ['IA-5 a']
  },
  'CCI-001981': {
    def: 'The organization manages information system authenticators by establishing administrative procedures for initial authenticator distribution.',
    nist: ['IA-5 d']
  },
  'CCI-001982': {
    def: 'The organization manages information system authenticators by establishing administrative procedures for lost/compromised authenticators.',
    nist: ['IA-5 d']
  },
  'CCI-001983': {
    def: 'The organization manages information system authenticators by establishing administrative procedures for damaged authenticators.',
    nist: ['IA-5 d']
  },
  'CCI-001984': {
    def: 'The organization manages information system authenticators by establishing administrative procedures for revoking authenticators.',
    nist: ['IA-5 d']
  },
  'CCI-001985': {
    def: 'The organization manages information system authenticators by implementing administrative procedures for initial authenticator distribution.',
    nist: ['IA-5 d']
  },
  'CCI-001986': {
    def: 'The organization manages information system authenticators by implementing administrative procedures for lost/compromised authenticators.',
    nist: ['IA-5 d']
  },
  'CCI-001987': {
    def: 'The organization manages information system authenticators by implementing administrative procedures for damaged authenticators.',
    nist: ['IA-5 d']
  },
  'CCI-001988': {
    def: 'The organization manages information system authenticators by implementing administrative procedures for revoking authenticators.',
    nist: ['IA-5 d']
  },
  'CCI-001989': {
    def: 'The organization manages information system authenticators by changing default content of authenticators prior to information system installation.',
    nist: ['IA-5 e']
  },
  'CCI-001990': {
    def: 'The organization manages information system authenticators by changing authenticators for group/role accounts when membership to those accounts changes.',
    nist: ['IA-5 j']
  },
  'CCI-001991': {
    def: 'The information system, for PKI-based authentication, implements a local cache of revocation data to support path discovery and validation in case of inability to access revocation information via the network.',
    nist: ['IA-5 (2) (d)']
  },
  'CCI-001992': {
    def: 'The organization defines the personnel or roles responsible for authorizing the organization^s registration authority accountable for the authenticator registration process.',
    nist: ['IA-5 (3)']
  },
  'CCI-001993': {
    def: 'The organization defines the registration authority accountable for the authenticator registration process.',
    nist: ['IA-5 (3)']
  },
  'CCI-001994': {
    def: 'The organization defines the types of and/or specific authenticators that are subject to the authenticator registration process.',
    nist: ['IA-5 (3)']
  },
  'CCI-001995': {
    def: 'The organization requires that the registration process, to receive organization-defined types of and/or specific authenticators, be conducted in person, or by a trusted third-party, before an organization-defined registration authority with authorization by organization-defined personnel or roles.',
    nist: ['IA-5 (3)']
  },
  'CCI-001996': {
    def: 'The organization defines the requirements required by the automated tools to determine if password authenticators are sufficiently strong.',
    nist: ['IA-5 (4)']
  },
  'CCI-001997': {
    def: 'The organization employs automated tools to determine if password authenticators are sufficiently strong to satisfy organization-defined requirements.',
    nist: ['IA-5 (4)']
  },
  'CCI-001998': {
    def: 'The organization requires developers/installers of information system components to provide unique authenticators or change default authenticators prior to delivery/installation.',
    nist: ['IA-5 (5)']
  },
  'CCI-001999': {
    def: 'The organization defines the external organizations to be coordinated with for cross-organization management of credentials.',
    nist: ['IA-5 (9)']
  },
  'CCI-002000': {
    def: 'The organization coordinates with organization-defined external organizations for cross-organization management of credentials.',
    nist: ['IA-5 (9)']
  },
  'CCI-002001': {
    def: 'The information system dynamically provisions identities.',
    nist: ['IA-5 (10)']
  },
  'CCI-002002': {
    def: 'The organization defines the token quality requirements to be employed by the information system mechanisms for token-based authentication.',
    nist: ['IA-5 (11)']
  },
  'CCI-002003': {
    def: 'The information system, for token-based authentication, employs mechanisms that satisfy organization-defined token quality requirements.',
    nist: ['IA-5 (11)']
  },
  'CCI-002004': {
    def: 'The organization defines the biometric quality requirements to be employed by the information system mechanisms for biometric-based authentication.',
    nist: ['IA-5 (12)']
  },
  'CCI-002005': {
    def: 'The information system, for biometric-based authentication, employs mechanisms that satisfy organization-defined biometric quality requirements.',
    nist: ['IA-5 (12)']
  },
  'CCI-002006': {
    def: 'The organization defines the time period after which the use of cached authenticators is prohibited.',
    nist: ['IA-5 (13)']
  },
  'CCI-002007': {
    def: 'The information system prohibits the use of cached authenticators after an organization-defined time period.',
    nist: ['IA-5 (13)']
  },
  'CCI-002008': {
    def: 'The organization, for PKI-based authentication, employs a deliberate organization-wide methodology for managing the content of PKI trust stores installed across all platforms including networks, operating systems, browsers, and applications.',
    nist: ['IA-5 (14)']
  },
  'CCI-002041': {
    def: 'The information system allows the use of a temporary password for system logons with an immediate change to a permanent password.',
    nist: ['IA-5 (1) (f)']
  },
  'CCI-002042': {
    def: 'The organization manages information system authenticators by protecting authenticator content from unauthorized modification.',
    nist: ['IA-5 h']
  },
  'CCI-002043': {
    def: 'The organization uses only FICAM-approved path discovery and validation products and services.',
    nist: ['IA-5 (15)']
  },
  'CCI-002365': {
    def: 'The organization manages information system authenticators by requiring individuals to take specific security safeguards to protect authenticators.',
    nist: ['IA-5 i']
  },
  'CCI-002366': {
    def: 'The organization manages information system authenticators by having devices implement specific security safeguards to protect authenticators.',
    nist: ['IA-5 i']
  },
  'CCI-002367': {
    def: 'The organization ensures unencrypted static authenticators are not embedded in applications.',
    nist: ['IA-5 (7)']
  },
  'CCI-002009': {
    def: 'The information system accepts Personal Identity Verification (PIV) credentials from other federal agencies.',
    nist: ['IA-8 (1)']
  },
  'CCI-002010': {
    def: 'The information system electronically verifies Personal Identity Verification (PIV) credentials from other federal agencies.',
    nist: ['IA-8 (1)']
  },
  'CCI-002011': {
    def: 'The information system accepts FICAM-approved third-party credentials.',
    nist: ['IA-8 (2)']
  },
  'CCI-002012': {
    def: 'The organization defines the information systems which will employ only FICAM-approved information system components.',
    nist: ['IA-8 (3)']
  },
  'CCI-002013': {
    def: 'The organization employs only FICAM-approved information system components in organization-defined information systems to accept third-party credentials.',
    nist: ['IA-8 (3)']
  },
  'CCI-002014': {
    def: 'The information system conforms to FICAM-issued profiles.',
    nist: ['IA-8 (4)']
  },
  'CCI-002015': {
    def: 'The information system accepts Personal Identity Verification-I (PIV-I) credentials.',
    nist: ['IA-8 (5)']
  },
  'CCI-002016': {
    def: 'The information system electronically verifies Personal Identity Verification-I (PIV-I) credentials.',
    nist: ['IA-8 (5)']
  },
  'CCI-002017': {
    def: 'The organization defines the information system services requiring identification.',
    nist: ['IA-9']
  },
  'CCI-002018': {
    def: 'The organization defines the information system services requiring authentication.',
    nist: ['IA-9']
  },
  'CCI-002019': {
    def: 'The organization defines the security safeguards to be used when identifying information system services.',
    nist: ['IA-9']
  },
  'CCI-002020': {
    def: 'The organization defines the security safeguards to be used when authenticating information system services.',
    nist: ['IA-9']
  },
  'CCI-002021': {
    def: 'The organization identifies organization-defined information system services using organization-defined security safeguards.',
    nist: ['IA-9']
  },
  'CCI-002022': {
    def: 'The organization authenticates organization-defined information system services using organization-defined security safeguards.',
    nist: ['IA-9']
  },
  'CCI-002023': {
    def: 'The organization ensures that service providers receive identification information.',
    nist: ['IA-9 (1)']
  },
  'CCI-002024': {
    def: 'The organization ensures that service providers validate identification information.',
    nist: ['IA-9 (1)']
  },
  'CCI-002025': {
    def: 'The organization ensures that service providers transmit identification information.',
    nist: ['IA-9 (1)']
  },
  'CCI-002026': {
    def: 'The organization ensures that service providers receive authentication information.',
    nist: ['IA-9 (1)']
  },
  'CCI-002027': {
    def: 'The organization ensures that service providers validate authentication information.',
    nist: ['IA-9 (1)']
  },
  'CCI-002028': {
    def: 'The organization ensures that service providers transmit authentication information.',
    nist: ['IA-9 (1)']
  },
  'CCI-002029': {
    def: 'The organization defines the services between which identification decisions are to be transmitted.',
    nist: ['IA-9 (2)']
  },
  'CCI-002030': {
    def: 'The organization defines the services between which authentication decisions are to be transmitted.',
    nist: ['IA-9 (2)']
  },
  'CCI-002031': {
    def: 'The organization ensures that identification decisions are transmitted between organization-defined services consistent with organizational policies.',
    nist: ['IA-9 (2)']
  },
  'CCI-002032': {
    def: 'The organization ensures that authentication decisions are transmitted between organization-defined services consistent with organizational policies.',
    nist: ['IA-9 (2)']
  },
  'CCI-002033': {
    def: 'The organization defines the specific circumstances or situations when individuals accessing an information system employ organization-defined supplemental authentication techniques or mechanisms.',
    nist: ['IA-10']
  },
  'CCI-002034': {
    def: 'The organization defines the supplemental authentication techniques or mechanisms to be employed in specific organization-defined circumstances or situations by individuals accessing the information system.',
    nist: ['IA-10']
  },
  'CCI-002035': {
    def: 'The organization requires that individuals accessing the information system employ organization-defined supplemental authentication techniques or mechanisms under specific organization-defined circumstances or situations.',
    nist: ['IA-10']
  },
  'CCI-002036': {
    def: 'The organization defines the circumstances or situations under which users will be required to reauthenticate.',
    nist: ['IA-11']
  },
  'CCI-002037': {
    def: 'The organization defines the circumstances or situations under which devices will be required to reauthenticate.',
    nist: ['IA-11']
  },
  'CCI-002038': {
    def: 'The organization requires users to reauthenticate upon organization-defined circumstances or situations requiring reauthentication.',
    nist: ['IA-11']
  },
  'CCI-002039': {
    def: 'The organization requires devices to reauthenticate upon organization-defined circumstances or situations requiring reauthentication.',
    nist: ['IA-11']
  },
  'CCI-002776': {
    def: 'The organization defines the personnel or roles to whom the incident response policy is disseminated.',
    nist: ['IR-1 a 1']
  },
  'CCI-002777': {
    def: 'The organization defines the personnel or roles to whom the incident response procedures are disseminated.',
    nist: ['IR-1 a 2']
  },
  'CCI-002778': {
    def: 'The organization defines the time period in which information system users who assume an incident response role or responsibility receive incident response training.',
    nist: ['IR-2 a']
  },
  'CCI-002779': {
    def: 'The organization provides incident response training to information system users consistent with assigned roles and responsibilities when required by information system changes.',
    nist: ['IR-2 b']
  },
  'CCI-002780': {
    def: 'The organization coordinates incident response testing with organizational elements responsible for related plans.',
    nist: ['IR-3 (2)']
  },
  'CCI-002781': {
    def: 'The organization defines the information system components for dynamic reconfiguration as part of the incident response capability.',
    nist: ['IR-4 (2)']
  },
  'CCI-002782': {
    def: 'The organization implements an incident handling capability for insider threats.',
    nist: ['IR-4 (6)']
  },
  'CCI-002783': {
    def: 'The organization coordinates an incident handling capability for insider threats across organization-defined components or elements of the organization.',
    nist: ['IR-4 (7)']
  },
  'CCI-002784': {
    def: 'The organization defines components or elements of the organization across which an incident handling capability for insider threats will be coordinated.',
    nist: ['IR-4 (7)']
  },
  'CCI-002785': {
    def: 'The organization coordinates with organization-defined external organizations to correlate and share organization-defined incident information to achieve a cross-organization perspective on incident awareness and more effective incident responses.',
    nist: ['IR-4 (8)']
  },
  'CCI-002786': {
    def: 'The organization defines external organizations with which to correlate and share organization-defined incident information.',
    nist: ['IR-4 (8)']
  },
  'CCI-002787': {
    def: 'The organization defines incident information to correlate and share with organization-defined external organizations.',
    nist: ['IR-4 (8)']
  },
  'CCI-002788': {
    def: 'The organization employs organization-defined dynamic response capabilities to effectively respond to security incidents.',
    nist: ['IR-4 (9)']
  },
  'CCI-002789': {
    def: 'The organization defines dynamic response capabilities to effectively respond to security incidents.',
    nist: ['IR-4 (9)']
  },
  'CCI-002790': {
    def: 'The organization coordinates incident handling activities involving supply chain events with other organizations involved in the supply chain.',
    nist: ['IR-4 (10)']
  },
  'CCI-002791': {
    def: 'The organization defines authorities to whom security incident information is reported.',
    nist: ['IR-6 b']
  },
  'CCI-002792': {
    def: 'The organization defines personnel or roles to whom information system vulnerabilities associated with reported security incident information are reported.',
    nist: ['IR-6 (2)']
  },
  'CCI-002793': {
    def: 'The organization provides security incident information to other organizations involved in the supply chain for information systems or information system components related to the incident.',
    nist: ['IR-6 (3)']
  },
  'CCI-002794': {
    def: 'The organization develops an incident response plan.',
    nist: ['IR-8 a']
  },
  'CCI-002795': {
    def: 'The organization^s incident response plan provides the organization with a roadmap for implementing its incident response capability.',
    nist: ['IR-8 a 1']
  },
  'CCI-002796': {
    def: 'The organization^s incident response plan describes the structure and organization of the incident response capability.',
    nist: ['IR-8 a 2']
  },
  'CCI-002797': {
    def: 'The organization^s incident response plan provides a high-level approach for how the incident response capability fits into the overall organization.',
    nist: ['IR-8 a 3']
  },
  'CCI-002798': {
    def: 'The organization^s incident response plan meets the unique requirements of the organization, which relate to mission, size, structure, and functions.',
    nist: ['IR-8 a 4']
  },
  'CCI-002799': {
    def: 'The organization^s incident response plan defines reportable incidents.',
    nist: ['IR-8 a 5']
  },
  'CCI-002800': {
    def: 'The organization^s incident response plan provides metrics for measuring the incident response capability within the organization.',
    nist: ['IR-8 a 6']
  },
  'CCI-002801': {
    def: 'The organization^s incident response plan defines the resources and management support needed to effectively maintain and mature an incident response capability.',
    nist: ['IR-8 a 7']
  },
  'CCI-002802': {
    def: 'The organization defines personnel or roles to review and approve the incident response plan.',
    nist: ['IR-8 a 8']
  },
  'CCI-002803': {
    def: 'The organization defines incident response personnel (identified by name and/or by role) and organizational elements to whom incident response plan changes will be communicated.',
    nist: ['IR-8 e']
  },
  'CCI-002804': {
    def: 'The organization protects the incident response plan from unauthorized disclosure and modification.',
    nist: ['IR-8 f']
  },
  'CCI-002805': {
    def: 'The organization responds to information spills by identifying the specific information involved in the information system contamination.',
    nist: ['IR-9 a']
  },
  'CCI-002806': {
    def: 'The organization responds to information spills by alerting organization-defined personnel or roles of the information spill using a method of communication not associated with the spill.',
    nist: ['IR-9 b']
  },
  'CCI-002807': {
    def: 'The organization defines personnel or roles to be alerted of information spills using a method of communication not associated with the spill.',
    nist: ['IR-9 b']
  },
  'CCI-002808': {
    def: 'The organization responds to information spills by isolating the contaminated information system or system component.',
    nist: ['IR-9 c']
  },
  'CCI-002809': {
    def: 'The organization responds to information spills by eradicating the information from the contaminated information system or component.',
    nist: ['IR-9 d']
  },
  'CCI-002810': {
    def: 'The organization responds to information spills by identifying other information systems or system components that may have been subsequently contaminated.',
    nist: ['IR-9 e']
  },
  'CCI-002811': {
    def: 'The organization responds to information spills by performing other organization-defined actions.',
    nist: ['IR-9 f']
  },
  'CCI-002812': {
    def: 'The organization defines other actions required to respond to information spills.',
    nist: ['IR-9 f']
  },
  'CCI-002813': {
    def: 'The organization assigns organization-defined personnel or roles with responsibility for responding to information spills.',
    nist: ['IR-9 (1)']
  },
  'CCI-002814': {
    def: 'The organization assigns organization-defined personnel or roles with responsibility for responding to information spills.',
    nist: ['IR-9 (1)']
  },
  'CCI-002815': {
    def: 'The organization defines personnel or roles to whom responsibility for responding to information spills will be assigned.',
    nist: ['IR-9 (1)']
  },
  'CCI-002816': {
    def: 'The organization provides information spillage response training according to an organization-defined frequency.',
    nist: ['IR-9 (2)']
  },
  'CCI-002817': {
    def: 'The organization defines the frequency with which to provide information spillage response training.',
    nist: ['IR-9 (2)']
  },
  'CCI-002818': {
    def: 'The organization implements organization-defined procedures to ensure that organizational personnel impacted by information spills can continue to carry out assigned tasks while contaminated systems are undergoing corrective actions.',
    nist: ['IR-9 (3)']
  },
  'CCI-002819': {
    def: 'The organization defines procedures to implement to ensure that organizational personnel impacted by information spills can continue to carry out assigned tasks while contaminated systems are undergoing corrective actions.',
    nist: ['IR-9 (3)']
  },
  'CCI-002820': {
    def: 'The organization employs organization-defined security safeguards for personnel exposed to information not within assigned access authorizations.',
    nist: ['IR-9 (4)']
  },
  'CCI-002821': {
    def: 'The organization defines security safeguards to employ for personnel exposed to information not within assigned access authorizations.',
    nist: ['IR-9 (4)']
  },
  'CCI-002822': {
    def: 'The organization establishes an integrated team of forensic/malicious code analysts, tool developers, and real-time operations personnel.',
    nist: ['IR-10']
  },
  'CCI-002861': {
    def: 'The organization defines the personnel or roles to whom a system maintenance policy is disseminated.',
    nist: ['MA-1 a 1']
  },
  'CCI-002862': {
    def: 'The organization defines the personnel or roles to whom system maintenance procedures are to be disseminated.',
    nist: ['MA-1 a 2']
  },
  'CCI-002863': {
    def: 'The organization employs automated mechanisms to schedule, conduct, and document repairs.',
    nist: ['MA-2 (2) (a)']
  },
  'CCI-002864': {
    def: 'The organization produces up-to date, accurate, and complete records of all maintenance requested, scheduled, in process, and completed.',
    nist: ['MA-2 (2) (b)']
  },
  'CCI-002865': {
    def: 'The organization produces up-to date, accurate, and complete records of all repair actions requested, scheduled, in process, and completed.',
    nist: ['MA-2 (2) (b)']
  },
  'CCI-002866': {
    def: 'The organization schedules maintenance on information system components in accordance with manufacturer or vendor specifications and/or organizational requirements.',
    nist: ['MA-2 a']
  },
  'CCI-002867': {
    def: 'The organization performs maintenance on information system components in accordance with manufacturer or vendor specifications and/or organizational requirements.',
    nist: ['MA-2 a ']
  },
  'CCI-002868': {
    def: 'The organization documents maintenance on information system components in accordance with manufacturer or vendor specifications and/or organizational requirements.',
    nist: ['MA-2 a']
  },
  'CCI-002869': {
    def: 'The organization reviews records of maintenance on information system components in accordance with manufacturer or vendor specifications and/or organizational requirements.',
    nist: ['MA-2 a']
  },
  'CCI-002870': {
    def: 'The organization schedules repairs on information system components in accordance with manufacturer or vendor specifications and/or organizational requirements.',
    nist: ['MA-2 a']
  },
  'CCI-002871': {
    def: 'The organization performs repairs on information system components in accordance with manufacturer or vendor specifications and/or organizational requirements.',
    nist: ['MA-2 a']
  },
  'CCI-002872': {
    def: 'The organization documents repairs on information system components in accordance with manufacturer or vendor specifications and/or organizational requirements.',
    nist: ['MA-2 a']
  },
  'CCI-002873': {
    def: 'The organization reviews records of repairs on information system components in accordance with manufacturer or vendor specifications and/or organizational requirements.',
    nist: ['MA-2 a']
  },
  'CCI-002874': {
    def: 'The organization defines the personnel or roles who can explicitly approve the removal of the information system or system components from organizational facilities for off-site maintenance or repairs.',
    nist: ['MA-2 c']
  },
  'CCI-002875': {
    def: 'The organization includes organization-defined maintenance-related information in organizational maintenance records.',
    nist: ['MA-2 f']
  },
  'CCI-002876': {
    def: 'The organization defines the maintenance-related information to include in organizational maintenance records.',
    nist: ['MA-2 f']
  },
  'CCI-002905': {
    def: 'The organization employs automated mechanisms to schedule, conduct, and document maintenance.',
    nist: ['MA-2 (2) (a)']
  },
  'CCI-002877': {
    def: 'The organization prevents the unauthorized removal of maintenance equipment containing organizational information by verifying that there is no organizational information contained on the equipment.',
    nist: ['MA-3 (3) (a)']
  },
  'CCI-002878': {
    def: 'The organization prevents the unauthorized removal of maintenance equipment containing organizational information by sanitizing or destroying the equipment.',
    nist: ['MA-3 (3) (b)']
  },
  'CCI-002879': {
    def: 'The organization prevents the unauthorized removal of maintenance equipment containing organizational information by retaining the equipment within the facility.',
    nist: ['MA-3 (3) (c)']
  },
  'CCI-002880': {
    def: 'The organization prevents the unauthorized removal of maintenance equipment containing organizational information by retaining the equipment within the facility.',
    nist: ['MA-3 (3) (c)']
  },
  'CCI-002881': {
    def: 'The organization prevents the unauthorized removal of maintenance equipment containing organizational information by obtaining an exemption from organization-defined personnel or roles explicitly authorizing removal of the equipment from the facility.',
    nist: ['MA-3 (3) (d)']
  },
  'CCI-002882': {
    def: 'The organization defines the personnel or roles who can provide an exemption that explicitly authorizes removal of equipment from the facility.',
    nist: ['MA-3 (3) (d)']
  },
  'CCI-002883': {
    def: 'The information system restricts the use of maintenance tools to authorized personnel only.',
    nist: ['MA-3 (4)']
  },
  'CCI-002884': {
    def: 'The organization audits nonlocal maintenance and diagnostic sessions^ organization-defined audit events.',
    nist: ['MA-4 (1) (a)']
  },
  'CCI-002885': {
    def: 'The organization defines the nonlocal maintenance and diagnostic session audit events to audit.',
    nist: ['MA-4 (1) (a)']
  },
  'CCI-002886': {
    def: 'The organization reviews the records of the nonlocal maintenance and diagnostic sessions.',
    nist: ['MA-4 (1) (b)']
  },
  'CCI-002887': {
    def: 'The organization defines the authenticators that are replay resistant which will be employed to protect nonlocal maintenance sessions.',
    nist: ['MA-4 (4) (a)']
  },
  'CCI-002888': {
    def: 'The organization defines the personnel or roles authorized to approve each nonlocal maintenance session.',
    nist: ['MA-4 (5) (a)']
  },
  'CCI-002889': {
    def: 'The organization notifies organization-defined personnel or roles of the date and time of planned nonlocal maintenance.',
    nist: ['MA-4 (5) (b)']
  },
  'CCI-002890': {
    def: 'The information system implements cryptographic mechanisms to protect the integrity of nonlocal maintenance and diagnostic communications.',
    nist: ['MA-4 (6)']
  },
  'CCI-002891': {
    def: 'The information system implements remote disconnect verification at the termination of nonlocal maintenance and diagnostic sessions.',
    nist: ['MA-4 (7)']
  },
  'CCI-003123': {
    def: 'The information system implements cryptographic mechanisms to protect the confidentiality of nonlocal maintenance and diagnostic communications.',
    nist: ['MA-4 (6)']
  },
  'CCI-002892': {
    def: 'The organization develops and implements alternate security safeguards in the event an information system component cannot be sanitized, removed, or disconnected from the system.',
    nist: ['MA-5 (1) (b)']
  },
  'CCI-002893': {
    def: 'The organization ensures that non-escorted personnel performing maintenance activities not directly associated with the information system but in the physical proximity of the system, have required access authorization.',
    nist: ['MA-5 (5)']
  },
  'CCI-002894': {
    def: 'The organization ensures that non-escorted personnel performing maintenance on the information system have required access authorizations.',
    nist: ['MA-5 b']
  },
  'CCI-002895': {
    def: 'The organization designates organizational personnel with required access authorizations and technical competence to supervise the maintenance activities of personnel who do not possess the required access authorizations.',
    nist: ['MA-5 c']
  },
  'CCI-002896': {
    def: 'The organization defines the information system components for which it obtains maintenance support and/or spare parts.',
    nist: ['MA-6']
  },
  'CCI-002897': {
    def: 'The organization defines a time period for obtaining maintenance support and/or spare parts for organization-defined information system components after a failure.',
    nist: ['MA-6']
  },
  'CCI-002898': {
    def: 'The organization performs preventive maintenance on organization-defined information system components at organization-defined time intervals.',
    nist: ['MA-6 (1)']
  },
  'CCI-002899': {
    def: 'The organization defines information system components on which to perform preventive maintenance.',
    nist: ['MA-6 (1)']
  },
  'CCI-002900': {
    def: 'The organization defines time intervals at which to perform preventive maintenance on organization-defined information system components.',
    nist: ['MA-6 (1)']
  },
  'CCI-002901': {
    def: 'The organization performs predictive maintenance on organization-defined information system components at organization-defined intervals.',
    nist: ['MA-6 (2)']
  },
  'CCI-002902': {
    def: 'The organization defines information system components on which to perform predictive maintenance.',
    nist: ['MA-6 (2)']
  },
  'CCI-002903': {
    def: 'The organization defines time intervals at which to perform predictive maintenance on organization-defined information system components.',
    nist: ['MA-6 (2)']
  },
  'CCI-002904': {
    def: 'The organization employs automated mechanisms to transfer predictive maintenance data to a computerized maintenance management system.',
    nist: ['MA-6 (3)']
  },
  'CCI-002566': {
    def: 'The organization defines personnel or roles to whom a documented media protection policy and procedures will be disseminated.',
    nist: ['MP-1 a 1']
  },
  'CCI-002567': {
    def: 'The organization reviews and approves media sanitization.',
    nist: ['MP-6 (1)']
  },
  'CCI-002568': {
    def: 'The organization tracks and documents media sanitization.',
    nist: ['MP-6 (1)']
  },
  'CCI-002569': {
    def: 'The organization verifies media sanitization.',
    nist: ['MP-6 (1)']
  },
  'CCI-002570': {
    def: 'The organization reviews and approves media disposal actions.',
    nist: ['MP-6 (1)']
  },
  'CCI-002571': {
    def: 'The organization tracks and documents media disposal actions.',
    nist: ['MP-6 (1)']
  },
  'CCI-002572': {
    def: 'The organization verifies media disposal actions.',
    nist: ['MP-6 (1)']
  },
  'CCI-002573': {
    def: 'The organization enforces dual authorization for the sanitization of organization-defined information system media.',
    nist: ['MP-6 (7)']
  },
  'CCI-002574': {
    def: 'The organization defines the information system media that dual authorization is enforced for sanitization.',
    nist: ['MP-6 (7)']
  },
  'CCI-002575': {
    def: 'The organization defines information systems, system components, or devices from which information is to be purged/wiped, either remotely or under the organization-defined conditions.',
    nist: ['MP-6 (8)']
  },
  'CCI-002576': {
    def: 'The organization defines conditions under which information from organization-defined information systems, system components, or devices should be purged/wiped.',
    nist: ['MP-6 (8)']
  },
  'CCI-002577': {
    def: 'The organization provides the capability to purge/wipe information from organization-defined information systems, system components, or devices either remotely or under organization-defined conditions.',
    nist: ['MP-6 (8)']
  },
  'CCI-002578': {
    def: 'The organization defines information system media to sanitize prior to disposal, release out of organizational control, or release for reuse using organization-defined sanitization techniques and procedures in accordance with applicable federal and organizational standards and policies.',
    nist: ['MP-6 a']
  },
  'CCI-002579': {
    def: 'The organization defines the sanitization techniques and procedures to be used to sanitize organization-defined information system media prior to disposal, release out of organizational control, or release for reuse in accordance with applicable federal and organization standards and policies.',
    nist: ['MP-6 a']
  },
  'CCI-002580': {
    def: 'The organization employs sanitization mechanisms with the strength and integrity commensurate with the security category or classification of the information.',
    nist: ['MP-6 b']
  },
  'CCI-002581': {
    def: 'The organization defines the types of information system media to restrict or prohibit on organization-defined information systems or system components using organization-defined security safeguards.',
    nist: ['MP-7']
  },
  'CCI-002582': {
    def: 'The organization defines the information systems or system components on which to restrict or prohibit the use of organization-defined types of information system media using organization-defined security safeguards.',
    nist: ['MP-7']
  },
  'CCI-002583': {
    def: 'The organization defines the security safeguards to use for restricting or prohibiting the use of organization-defined types of information system media on organization-defined information systems or system components.',
    nist: ['MP-7']
  },
  'CCI-002584': {
    def: 'The organization restricts or prohibits the use of organization-defined types of information system media on organization-defined information systems or system components using organization-defined security safeguards.',
    nist: ['MP-7']
  },
  'CCI-002585': {
    def: 'The organization prohibits the use of portable storage devices in organizational information systems when such devices have no identifiable owner.',
    nist: ['MP-7 (1)']
  },
  'CCI-002586': {
    def: 'The organization prohibits the use of sanitization-resistant media in organizational information systems.',
    nist: ['MP-7 (2)']
  },
  'CCI-002587': {
    def: 'The organization documents information system media downgrading actions.',
    nist: ['MP-8 (1)']
  },
  'CCI-002588': {
    def: 'The organization employs organization-defined tests of downgrading equipment in accordance with organization-defined frequency.',
    nist: ['MP-8 (2)']
  },
  'CCI-002589': {
    def: 'The organization employs procedures to verify correct performance of organization-defined tests of downgrading equipment in accordance with organization-defined frequency.',
    nist: ['MP-8 (2)']
  },
  'CCI-002590': {
    def: 'The organization defines tests to employ for downgrading equipment.',
    nist: ['MP-8 (2)']
  },
  'CCI-002591': {
    def: 'The organization defines the frequency with which to employ tests of downgrading equipment and procedures to verify correct performance.',
    nist: ['MP-8 (2)']
  },
  'CCI-002592': {
    def: 'The organization defines Controlled Unclassified Information (CUI).',
    nist: ['MP-8 (3)']
  },
  'CCI-002593': {
    def: 'The organization downgrades information system media containing organization-defined Controlled Unclassified Information (CUI) prior to public release in accordance with applicable federal and organizational standards and policies.',
    nist: ['MP-8 (3)']
  },
  'CCI-002594': {
    def: 'The organization downgrades information system media containing classified information prior to release to individuals without required access authorizations in accordance with NSA standards and policies.',
    nist: ['MP-8 (4)']
  },
  'CCI-002595': {
    def: 'The organization establishes an organization-defined information system media downgrading process that includes employing downgrading mechanisms with organization-defined strength and integrity.',
    nist: ['MP-8 a']
  },
  'CCI-002596': {
    def: 'The organization establishes and defines an information system media downgrading process that includes employing downgrading mechanisms with organization-defined strength and integrity.',
    nist: ['MP-8 a']
  },
  'CCI-002597': {
    def: 'The organization defines strength and integrity for downgrading mechanisms to establish an organization-defined information system media downgrading process.',
    nist: ['MP-8 a']
  },
  'CCI-002598': {
    def: 'The organization ensures that the information system media downgrading process is commensurate with the security category and/or classification level of the information to be removed and the access authorizations of the potential recipients of the downgraded information.',
    nist: ['MP-8 b']
  },
  'CCI-002599': {
    def: 'The organization defines and identifies the information system media requiring downgrading.',
    nist: ['MP-8 c']
  },
  'CCI-002600': {
    def: 'The organization downgrades the identified information system media using the established process.',
    nist: ['MP-8 d']
  },
  'CCI-002908': {
    def: 'The organization defines the personnel or roles to whom a physical and environmental protection policy is disseminated.',
    nist: ['PE-1 a 1']
  },
  'CCI-002909': {
    def: 'The organization defines the personnel or roles to whom the physical and environmental protection procedures are disseminated.',
    nist: ['PE-1 a 2']
  },
  'CCI-002910': {
    def: 'The organization approves a list of individuals with authorized access to the facility where the information system resides.',
    nist: ['PE-2 a']
  },
  'CCI-002911': {
    def: 'The organization maintains a list of individuals with authorized access to the facility where the information system resides.',
    nist: ['PE-2 a']
  },
  'CCI-002912': {
    def: 'The organization defines a list of acceptable forms of identification for visitor access to the facility where the information system resides.',
    nist: ['PE-2 (2)']
  },
  'CCI-002913': {
    def: 'The organization restricts unescorted access to the facility where the information system resides to personnel with one or more of the following: security clearances for all information contained within the system; formal access authorizations for all information contained within the system; need for access to all information contained within the system; organization-defined credentials.',
    nist: ['PE-2 (3)']
  },
  'CCI-002914': {
    def: 'The organization defines the credentials required for personnel to have unescorted access to the facility where the information system resides.',
    nist: ['PE-2 (3)']
  },
  'CCI-002915': {
    def: 'The organization defines the entry/exit points to the facility where the information system resides.',
    nist: ['PE-3 a']
  },
  'CCI-002916': {
    def: 'The organization defines the physical access control systems/devices or guards that control ingress/egress to the facility where the information system resides.',
    nist: ['PE-3 a 2']
  },
  'CCI-002917': {
    def: 'The organization maintains physical access audit logs for organization-defined entry/exit points to the facility where the information system resides.',
    nist: ['PE-3 b']
  },
  'CCI-002918': {
    def: 'The organization defines entry/exit points to the facility where the information system resides that require physical access audit logs be maintained.',
    nist: ['PE-3 b']
  },
  'CCI-002919': {
    def: 'The organization provides organization-defined security safeguards to control access to areas within the facility where the information system resides officially designated as publicly accessible.',
    nist: ['PE-3 c']
  },
  'CCI-002920': {
    def: 'The organization defines security safeguards to control access to areas within the facility where the information system resides officially designated as publicly accessible.',
    nist: ['PE-3 c']
  },
  'CCI-002921': {
    def: 'The organization escorts visitors in the facility where the information system resides during organization-defined circumstances requiring visitor escorts.',
    nist: ['PE-3 d']
  },
  'CCI-002922': {
    def: 'The organization defines circumstances requiring visitor escorts in the facility where the information system resides.',
    nist: ['PE-3 d']
  },
  'CCI-002923': {
    def: 'The organization monitors visitor activity in the facility where the information system resides during organization-defined circumstances requiring visitor monitoring.',
    nist: ['PE-3 d']
  },
  'CCI-002924': {
    def: 'The organization defines circumstances requiring visitor monitoring in the facility where the information system resides.',
    nist: ['PE-3 d']
  },
  'CCI-002925': {
    def: 'The organization defines the physical access devices to inventory.',
    nist: ['PE-3 f']
  },
  'CCI-002926': {
    def: 'The organization defines the physical spaces containing one or more components of the information system that require physical access authorizations and controls at the facility where the information system resides.',
    nist: ['PE-3 (1)']
  },
  'CCI-002927': {
    def: 'The organization defines the frequency with which to perform security checks at the physical boundary of the facility or information system for unauthorized exfiltration of information or removal of information system components.',
    nist: ['PE-3 (2)']
  },
  'CCI-002928': {
    def: 'The organization defines security safeguards to detect and prevent physical tampering or alteration of organization-defined hardware components within the information system.',
    nist: ['PE-3 (5)']
  },
  'CCI-002929': {
    def: 'The organization defines hardware components within the information system for which to employ organization-defined security safeguards to detect and prevent physical tampering or alteration.',
    nist: ['PE-3 (5)']
  },
  'CCI-002930': {
    def: 'The organization defines information system distribution and transmission lines within organizational facilities to control physical access to using organization-defined security safeguards.',
    nist: ['PE-4']
  },
  'CCI-002931': {
    def: 'The organization defines security safeguards to control physical access to organization-defined information system distribution and transmission lines within organizational facilities.',
    nist: ['PE-4']
  },
  'CCI-002932': {
    def: 'The organization controls physical access to output from organization-defined output devices.',
    nist: ['PE-5 (1) (a)']
  },
  'CCI-002933': {
    def: 'The organization defines output devices for which physical access to output is controlled.',
    nist: ['PE-5 (1) (a)']
  },
  'CCI-002934': {
    def: 'The organization ensures that only authorized individuals receive output from organization-defined output devices.',
    nist: ['PE-5 (1) (b)']
  },
  'CCI-002935': {
    def: 'The information system controls physical access to output from organization-defined output devices.',
    nist: ['PE-5 (2) (a)']
  },
  'CCI-002936': {
    def: 'The information system links individual identity to receipt of output from organization-defined output devices.',
    nist: ['PE-5 (2) (b)']
  },
  'CCI-002937': {
    def: 'The organization marks organization-defined information system output devices indicating the appropriate security marking of the information permitted to be output from the device.',
    nist: ['PE-5 (3)']
  },
  'CCI-002938': {
    def: 'The organization defines the information system output devices marked indicating the appropriate security marking of the information permitted to be output from the device.',
    nist: ['PE-5 (3)']
  },
  'CCI-002939': {
    def: 'The organization monitors physical access to the facility where the information system resides to detect and respond to physical security incidents.',
    nist: ['PE-6 a']
  },
  'CCI-002940': {
    def: 'The organization reviews physical access logs upon occurrence of organization-defined events or potential indications of events.',
    nist: ['PE-6 b']
  },
  'CCI-002941': {
    def: 'The organization defines events or potential indications of events requiring review of physical access logs.',
    nist: ['PE-6 b']
  },
  'CCI-002942': {
    def: 'The organization employs automated mechanisms to recognize organization-defined classes/types of intrusions.',
    nist: ['PE-6 (2)']
  },
  'CCI-002943': {
    def: 'The organization defines classes/types of intrusions to recognize using automated mechanisms.',
    nist: ['PE-6 (2)']
  },
  'CCI-002944': {
    def: 'The organization employs automated mechanisms to initiate organization-defined response actions to organization-defined classes/types of intrusions.',
    nist: ['PE-6 (2)']
  },
  'CCI-002945': {
    def: 'The organization defines response actions to initiate when organization-defined classes/types of intrusions are recognized.',
    nist: ['PE-6 (2)']
  },
  'CCI-002946': {
    def: 'The organization employs video surveillance of organization-defined operational areas.',
    nist: ['PE-6 (3)']
  },
  'CCI-002947': {
    def: 'The organization defines the operational areas in which to employ video surveillance.',
    nist: ['PE-6 (3)']
  },
  'CCI-002948': {
    def: 'The organization retains video surveillance recordings for an organization-defined time period.',
    nist: ['PE-6 (3)']
  },
  'CCI-002949': {
    def: 'The organization defines the time period to retain video surveillance recordings.',
    nist: ['PE-6 (3)']
  },
  'CCI-002950': {
    def: 'The organization monitors physical access to the information system in addition to the physical access monitoring of the facility as organization-defined physical spaces containing one or more components of the information system.',
    nist: ['PE-6 (4)']
  },
  'CCI-002951': {
    def: 'The organization defines physical spaces containing one or more components of the information system in which physical access is monitored.',
    nist: ['PE-6 (4)']
  },
  'CCI-002952': {
    def: 'The organization defines the time period to maintain visitor access records to the facility where the information system resides.',
    nist: ['PE-8 a']
  },
  'CCI-002953': {
    def: 'The organization employs redundant power cabling paths that are physically separated by an organization-defined distance.',
    nist: ['PE-9 (1)']
  },
  'CCI-002954': {
    def: 'The organization defines the distance by which to physically separate redundant power cabling paths.',
    nist: ['PE-9 (1)']
  },
  'CCI-002955': {
    def: 'The organization provides a short-term uninterruptible power supply to facilitate an orderly shutdown of the information system and/or transition of the information system to long-term alternate power in the event of a primary power source loss.',
    nist: ['PE-11']
  },
  'CCI-002956': {
    def: 'The organization provides a long-term alternate power supply for the information system that is self-contained.',
    nist: ['PE-11 (2) (a)']
  },
  'CCI-002957': {
    def: 'The organization provides a long-term alternate power supply for the information system that is not reliant on external power generation.',
    nist: ['PE-11 (2) (b)']
  },
  'CCI-002958': {
    def: 'The organization provides a long-term alternate power supply for the information system that is capable of maintaining minimally required operational capability or full operational capability in the event of an extended loss of the primary power source.',
    nist: ['PE-11 (2) (c)']
  },
  'CCI-002959': {
    def: 'The organization provides emergency lighting for all areas within the facility supporting essential missions.',
    nist: ['PE-12 (1)']
  },
  'CCI-002960': {
    def: 'The organization provides emergency lighting for all areas within the facility supporting essential business functions.',
    nist: ['PE-12 (1)']
  },
  'CCI-002961': {
    def: 'The organization employs fire detection devices/systems for the information system that activate automatically.',
    nist: ['PE-13 (1)']
  },
  'CCI-002962': {
    def: 'The organization employs fire detection devices/systems for the information system that automatically activate to notify organization-defined personnel or roles and organization-defined emergency responders in the event of a fire.',
    nist: ['PE-13 (1)']
  },
  'CCI-002963': {
    def: 'The organization defines the personnel or roles to be notified in the event of a fire.',
    nist: ['PE-13 (1)']
  },
  'CCI-002964': {
    def: 'The organization defines the emergency responders to be notified in the event of a fire.',
    nist: ['PE-13 (1)']
  },
  'CCI-002965': {
    def: 'The organization employs fire suppression devices/systems for the information system that provide automatic notification of any activation to organization-defined personnel or roles and organization-defined emergency responders.',
    nist: ['PE-13 (2)']
  },
  'CCI-002966': {
    def: 'The organization defines the personnel or roles to be automatically notified of any activation of fire suppression devices/systems for the information system.',
    nist: ['PE-13 (2)']
  },
  'CCI-002967': {
    def: 'The organization defines the emergency responders to be automatically notified of any activation of fire suppression devices/systems for the information system.',
    nist: ['PE-13 (2)']
  },
  'CCI-002968': {
    def: 'The organization ensures that the facility undergoes, on an organization-defined frequency, fire protection inspections by authorized and qualified inspectors.',
    nist: ['PE-13 (4)']
  },
  'CCI-002969': {
    def: 'The organization defines a frequency with which the facility undergoes fire protection inspections.',
    nist: ['PE-13 (4)']
  },
  'CCI-002970': {
    def: 'The organization resolves deficiencies identified during facility fire protection inspections within an organization-defined time period.',
    nist: ['PE-13 (4)']
  },
  'CCI-002971': {
    def: 'The organization defines the time period within which to resolve deficiencies identified during facility fire protection inspections.',
    nist: ['PE-13 (4)']
  },
  'CCI-002972': {
    def: 'The organization employs automated mechanisms to detect the presence of water in the vicinity of the information system and alerts organization-defined personnel or roles.',
    nist: ['PE-15 (1)']
  },
  'CCI-002973': {
    def: 'The organization defines the personnel or roles to be alerted when automated mechanisms detect the presence of water in the vicinity of the information system.',
    nist: ['PE-15 (1)']
  },
  'CCI-002974': {
    def: 'The organization defines types of information system components to authorize, monitor, and control entering and exiting the facility and to maintain records.',
    nist: ['PE-16']
  },
  'CCI-002975': {
    def: 'The organization defines security controls to employ at alternate work sites.',
    nist: ['PE-17 a']
  },
  'CCI-002976': {
    def: 'The organization defines physical and environmental hazards that could cause potential damage to information system components within the facility.',
    nist: ['PE-18']
  },
  'CCI-002977': {
    def: 'The organization plans the location or site of the facility where the information system resides with regard to physical and environmental hazards.',
    nist: ['PE-18 (1)']
  },
  'CCI-002978': {
    def: 'The organization considers the physical and environmental hazards in its risk mitigation strategy for existing facilities.',
    nist: ['PE-18 (1)']
  },
  'CCI-003047': {
    def: 'The organization defines the personnel or roles to whom a security planning policy is disseminated.',
    nist: ['PL-1 a 1']
  },
  'CCI-003048': {
    def: 'The organization defines the personnel or roles to whom the security planning procedures are disseminated.',
    nist: ['PL-1 a 2']
  },
  'CCI-003049': {
    def: 'The organization develops a security plan for the information system.',
    nist: ['PL-2 a']
  },
  'CCI-003050': {
    def: 'The organization^s security plan for the information system is consistent with the organization^s enterprise architecture.',
    nist: ['PL-2 a 1']
  },
  'CCI-003051': {
    def: 'The organization^s security plan for the information system explicitly defines the authorization boundary for the system.',
    nist: ['PL-2 a 2']
  },
  'CCI-003052': {
    def: 'The organization^s security plan for the information system describes the operational context of the information system in terms of missions and business processes.',
    nist: ['PL-2 a 3']
  },
  'CCI-003053': {
    def: 'The organization^s security plan for the information system provides the security categorization of the information system, including supporting rationale.',
    nist: ['PL-2 a 4']
  },
  'CCI-003054': {
    def: 'The organization^s security plan for the information system describes the operational environment for the information system and relationships with, or connections to, other information systems.',
    nist: ['PL-2 a 5']
  },
  'CCI-003055': {
    def: 'The organization^s security plan for the information system provides an overview of the security requirements for the system.',
    nist: ['PL-2 a 6']
  },
  'CCI-003056': {
    def: 'The organization^s security plan for the information system identifies any relevant overlays, if applicable.',
    nist: ['PL-2 a 7']
  },
  'CCI-003057': {
    def: 'The organization^s security plan for the information system describes the security controls in place or planned for meeting those requirements, including a rationale for the tailoring decisions.',
    nist: ['PL-2 a 8']
  },
  'CCI-003058': {
    def: 'The organization distributes copies of the security plan to organization-defined personnel or roles.',
    nist: ['PL-2 b']
  },
  'CCI-003059': {
    def: 'The organization distributes copies of the security plan to organization-defined personnel or roles.',
    nist: ['PL-2 b']
  },
  'CCI-003060': {
    def: 'The organization defines the personnel or roles to whom copies of the security plan are distributed.',
    nist: ['PL-2 b']
  },
  'CCI-003061': {
    def: 'The organization communicates subsequent changes to the security plan to organization-defined personnel or roles.',
    nist: ['PL-2 b']
  },
  'CCI-003062': {
    def: 'The organization defines the personnel or roles to whom changes to the security plan are communicated.',
    nist: ['PL-2 b']
  },
  'CCI-003063': {
    def: 'The organization protects the security plan from unauthorized disclosure.',
    nist: ['PL-2 e']
  },
  'CCI-003064': {
    def: 'The organization protects the security plan from unauthorized modification.',
    nist: ['PL-2 e']
  },
  'CCI-003065': {
    def: 'The organization plans and coordinates security-related activities affecting the information system with organization-defined individuals or groups before conducting such activities in order to reduce the impact on other organizational entities.',
    nist: ['PL-2 (3)']
  },
  'CCI-003066': {
    def: 'The organization defines the individuals or groups with whom security-related activities are planned and coordinated.',
    nist: ['PL-2 (3)']
  },
  'CCI-003067': {
    def: 'The organization defines the individuals or groups with whom security-related activities are planned and coordinated.',
    nist: ['PL-2 (3)']
  },
  'CCI-003068': {
    def: 'The organization reviews and updates the rules of behavior in accordance with organization-defined frequency.',
    nist: ['PL-4 c']
  },
  'CCI-003069': {
    def: 'The organization defines the frequency with which to review and update the rules of behavior.',
    nist: ['PL-4 c']
  },
  'CCI-003070': {
    def: 'The organization requires individuals who have signed a previous version of the rules of behavior to read and resign when the rules of behavior are revised/updated.',
    nist: ['PL-4 d']
  },
  'CCI-003071': {
    def: 'The organization develops a security Concept of Operations (CONOPS) for the information system containing, at a minimum, how the organization intends to operate the system from the perspective of information security.',
    nist: ['PL-7 a']
  },
  'CCI-003072': {
    def: 'The organization develops an information security architecture for the information system.',
    nist: ['PL-8 a']
  },
  'CCI-003073': {
    def: 'The organization^s information security architecture for the information system describes the overall philosophy, requirements, and approach to be taken with regard to protecting the confidentiality, integrity, and availability of organizational information.',
    nist: ['PL-8 a 1']
  },
  'CCI-003074': {
    def: 'The organization^s information security architecture for the information system describes how the information security architecture is integrated into and supports the enterprise architecture.',
    nist: ['PL-8 a 2']
  },
  'CCI-003075': {
    def: 'The organization^s information security architecture for the information system describes any information security assumptions about, and dependencies on, external services.',
    nist: ['PL-8 a 3']
  },
  'CCI-003076': {
    def: 'The organization reviews and updates the information security architecture in accordance with organization-defined frequency to reflect updates in the enterprise architecture.',
    nist: ['PL-8 b']
  },
  'CCI-003077': {
    def: 'The organization defines the frequency with which to review and update the information system architecture.',
    nist: ['PL-8 b']
  },
  'CCI-003078': {
    def: 'The organization ensures that planned information security architecture changes are reflected in the security plan.',
    nist: ['PL-8 c']
  },
  'CCI-003079': {
    def: 'The organization ensures that planned information security architecture changes are reflected in the security Concept of Operations (CONOPS).',
    nist: ['PL-8 c']
  },
  'CCI-003080': {
    def: 'The organization ensures that planned information security architecture changes are reflected in organizational procurements/acquisitions.',
    nist: ['PL-8 c']
  },
  'CCI-003081': {
    def: 'The organization designs its security architecture using a defense-in-depth approach that allocates organization-defined security safeguards to organization-defined locations.',
    nist: ['PL-8 (1) (a)']
  },
  'CCI-003082': {
    def: 'The organization designs its security architecture using a defense-in-depth approach that allocates organization-defined security safeguards to organization-defined architectural layers.',
    nist: ['PL-8 (1) (a)']
  },
  'CCI-003083': {
    def: 'The organization defines the security safeguards to be allocated to organization-defined locations.',
    nist: ['PL-8 (1) (a)']
  },
  'CCI-003084': {
    def: 'The organization defines the security safeguards to be allocated to organization-defined architectural layers.',
    nist: ['PL-8 (1) (a)']
  },
  'CCI-003085': {
    def: 'The organization defines the locations to which it allocates organization-defined security safeguards in the security architecture.',
    nist: ['PL-8 (1) (a)']
  },
  'CCI-003086': {
    def: 'The organization defines the architectural layers to which it allocates organization-defined security safeguards in the security architecture.',
    nist: ['PL-8 (1) (a)']
  },
  'CCI-003087': {
    def: 'The organization designs its security architecture using a defense-in-depth approach that ensures that the allocated security safeguards operate in a coordinated and mutually reinforcing manner.',
    nist: ['PL-8 (1) (b)']
  },
  'CCI-003088': {
    def: 'The organization requires that organization-defined security safeguards allocated to organization-defined locations and architectural layers be obtained from different suppliers.',
    nist: ['PL-8 (2)']
  },
  'CCI-003017': {
    def: 'The organization defines the personnel or roles to whom a personnel security policy is disseminated.',
    nist: ['PS-1 a 1']
  },
  'CCI-003018': {
    def: 'The organization defines the personnel or roles to whom the personnel security procedures are disseminated.',
    nist: ['PS-1 a 2']
  },
  'CCI-003019': {
    def: 'The organization ensures that individuals accessing an information system processing, storing, or transmitting information requiring special protection have valid access authorizations that are demonstrated by assigned official government duties.',
    nist: ['PS-3 (3) (a)']
  },
  'CCI-003020': {
    def: 'The organization ensures that individuals accessing an information system processing, storing, or transmitting information requiring special protection satisfy organization-defined additional personnel screening criteria.',
    nist: ['PS-3 (3) (b)']
  },
  'CCI-003021': {
    def: 'The organization defines additional personnel screening criteria that individuals accessing an information system processing, storing, or transmitting information requiring protection must satisfy.',
    nist: ['PS-3 (3) (b)']
  },
  'CCI-003016': {
    def: 'The organization, upon termination of individual employment, notifies organization-defined personnel or roles within an organization-defined time period.',
    nist: ['PS-4 f']
  },
  'CCI-003022': {
    def: 'The organization defines the time period within which to disable information system access upon termination of individual employment.',
    nist: ['PS-4 a']
  },
  'CCI-003023': {
    def: 'The organization, upon termination of individual employment, terminates/revokes any authenticators/credentials associated with the individual.',
    nist: ['PS-4 b']
  },
  'CCI-003024': {
    def: 'The organization defines information security topics to be discussed while conducting exit interviews.',
    nist: ['PS-4 c']
  },
  'CCI-003025': {
    def: 'The organization defines personnel or roles to notify upon termination of individual employment.',
    nist: ['PS-4 f']
  },
  'CCI-003026': {
    def: 'The organization defines the time period within which to notify organization-defined personnel or roles upon termination of individual employment.',
    nist: ['PS-4 f']
  },
  'CCI-003027': {
    def: 'The organization notifies terminated individuals of applicable, legally binding post-employment requirements for the protection of organizational information.',
    nist: ['PS-4 (1) (a)']
  },
  'CCI-003028': {
    def: 'The organization requires terminated individuals to sign an acknowledgment of post-employment requirements as part of the organizational termination process.',
    nist: ['PS-4 (1) (b)']
  },
  'CCI-003029': {
    def: 'The organization employs automated mechanisms to notify organization-defined personnel or roles upon termination of an individual.',
    nist: ['PS-4 (2)']
  },
  'CCI-003030': {
    def: 'The organization defines the personnel or roles to be notified by automated mechanism upon termination of an individual.',
    nist: ['PS-4 (2)']
  },
  'CCI-003031': {
    def: 'The organization modifies access authorization as needed to correspond with any changes in operational need due to reassignment or transfer.',
    nist: ['PS-5 c']
  },
  'CCI-003032': {
    def: 'The organization notifies organization-defined personnel or roles within an organization-defined time period when individuals are transferred or reassigned to other positions within the organization.',
    nist: ['PS-5 d']
  },
  'CCI-003033': {
    def: 'The organization defines personnel or roles to be notified when individuals are transferred or reassigned to other positions within the organization.',
    nist: ['PS-5 d']
  },
  'CCI-003034': {
    def: 'The organization defines the time period within which organization-defined personnel or roles are to be notified when individuals are transferred or reassigned to other positions within the organization.',
    nist: ['PS-5 d']
  },
  'CCI-003035': {
    def: 'The organization develops and documents access agreements for organizational information systems.',
    nist: ['PS-6 a']
  },
  'CCI-003036': {
    def: 'The organization ensures that individuals requiring access to organizational information and information systems re-sign access agreements to maintain access to organizational information systems when access agreements have been updated or in accordance with organization-defined frequency.',
    nist: ['PS-6 c 2']
  },
  'CCI-003037': {
    def: 'The organization defines the frequency for individuals requiring access to organization information and information systems to re-sign access agreements.',
    nist: ['PS-6 c 2']
  },
  'CCI-003038': {
    def: 'The organization notifies individuals of applicable, legally binding post-employment requirements for protection of organizational information.',
    nist: ['PS-6 (3) (a)']
  },
  'CCI-003039': {
    def: 'The organization requires individuals to sign an acknowledgement of legally binding post-employment requirements for protection of organizational information, if applicable, as part of granting initial access to covered information.',
    nist: ['PS-6 (3) (b)']
  },
  'CCI-003040': {
    def: 'The organization requires third-party providers to comply with personnel security policies and procedures established by the organization.',
    nist: ['PS-7 b']
  },
  'CCI-003041': {
    def: 'The organization requires third-party providers to notify organization-defined personnel or roles of any personnel transfers or terminations of third-party personnel who possess organizational credentials and/or badges, or who have information system privileges within an organization-defined time period.',
    nist: ['PS-7 d']
  },
  'CCI-003042': {
    def: 'The organization defines personnel or roles whom third-party providers are to notify when third-party personnel who possess organizational credentials and /or badges or who have information system privileges are transferred or terminated.',
    nist: ['PS-7 d']
  },
  'CCI-003043': {
    def: 'The organization defines the time period for third-party providers to notify organization-defined personnel or roles when third-party personnel who possess organizational credentials and /or badges or who have information system privileges are transferred or terminated.',
    nist: ['PS-7 d']
  },
  'CCI-003044': {
    def: 'The organization notifies organization-defined personnel or roles within an organization-defined time period when a formal employee sanctions process is initiated, identifying the individual sanctioned and the reason for the sanction.',
    nist: ['PS-8 b']
  },
  'CCI-003045': {
    def: 'The organization defines personnel or roles who are to be notified when a formal employee sanctions process is initiated.',
    nist: ['PS-8 b']
  },
  'CCI-003046': {
    def: 'The organization defines the time period within which to notify organization-defined personnel or roles when a formal employee sanctions process is initiated.',
    nist: ['PS-8 b']
  },
  'CCI-002368': {
    def: 'The organization defines the personnel or roles to whom the risk assessment policy is disseminated.',
    nist: ['RA-1 a 1']
  },
  'CCI-002369': {
    def: 'The organization defines the personnel or roles to whom the risk assessment procedures are disseminated.',
    nist: ['RA-1 a 2']
  },
  'CCI-002370': {
    def: 'The organization disseminates risk assessment results to organization-defined personnel or roles.',
    nist: ['RA-3 d']
  },
  'CCI-002371': {
    def: 'The organization defines the personnel or roles to whom the risk assessment results will be disseminated.',
    nist: ['RA-3 d']
  },
  'CCI-002372': {
    def: 'The organization correlates the output from vulnerability scanning tools to determine the presence of multi-vulnerability/multi-hop attack vectors.',
    nist: ['RA-5 (10)']
  },
  'CCI-002373': {
    def: 'The organization employs vulnerability scanning procedures that can identify the breadth and depth of coverage (i.e., information system components scanned and vulnerabilities checked).',
    nist: ['RA-5 (3)']
  },
  'CCI-002374': {
    def: 'The organization defines the corrective actions when information about the information system is discoverable by adversaries.',
    nist: ['RA-5 (4)']
  },
  'CCI-002375': {
    def: 'The organization takes organization-defined corrective actions when information about the information system is discoverable by adversaries.',
    nist: ['RA-5 (4)']
  },
  'CCI-002376': {
    def: 'The organization defines the personnel or roles with whom the information obtained from the vulnerability scanning process and security control assessments will be shared.',
    nist: ['RA-5 e']
  },
  'CCI-002906': {
    def: 'The organization defines the vulnerability scanning activities in which the information system implements privileged access authorization to organization-identified information system components.',
    nist: ['RA-5 (5)']
  },
  'CCI-003119': {
    def: 'The organization employs a technical surveillance countermeasures survey at organization-defined locations on an organization-defined frequency or when organization-defined events or indicators occur.',
    nist: ['RA-6']
  },
  'CCI-003120': {
    def: 'The organization defines the locations where technical surveillance countermeasures surveys are to be employed.',
    nist: ['RA-6']
  },
  'CCI-003121': {
    def: 'The organization defines the frequency on which to employ technical surveillance countermeasures surveys.',
    nist: ['RA-6']
  },
  'CCI-003122': {
    def: 'The organization defines the events or indicators upon which technical surveillance countermeasures surveys are to be employed.',
    nist: ['RA-6']
  },
  'CCI-003089': {
    def: 'The organization defines the personnel or roles to whom the system and services acquisition policy is disseminated.',
    nist: ['SA-1 a 1']
  },
  'CCI-003090': {
    def: 'The organization defines the personnel or roles to whom procedures to facilitate the implementation of the system and services acquisition policy and associated system and services acquisition controls are disseminated.',
    nist: ['SA-1 a 2']
  },
  'CCI-003091': {
    def: 'The organization determines information security requirements for the information system or information system service in mission/business process planning.',
    nist: ['SA-2 a ']
  },
  'CCI-003092': {
    def: 'The organization defines a system development life cycle that is used to manage the information system.',
    nist: ['SA-3 a']
  },
  'CCI-003093': {
    def: 'The organization integrates the organizational information security risk management process into system development life cycle activities.',
    nist: ['SA-3 d']
  },
  'CCI-003094': {
    def: 'The organization includes the security functional requirements, explicitly or by reference, in the acquisition contract for the information system, system component, or information system service in accordance with applicable federal laws, Executive Orders, directives, policies, regulations, standards, guidelines, and organizational mission/business needs.',
    nist: ['SA-4 a']
  },
  'CCI-003095': {
    def: 'The organization includes the security strength requirements, explicitly or by reference, in the acquisition contract for the information system, system component, or information system service in accordance with applicable federal laws, Executive Orders, directives, policies, regulations, standards, guidelines, and organizational mission/business needs.',
    nist: ['SA-4 b']
  },
  'CCI-003096': {
    def: 'The organization includes the security assurance requirements, explicitly or by reference, in the acquisition contract for the information system, system component, or information system service in accordance with applicable federal laws, Executive Orders, directives, policies, regulations, standards, guidelines, and organizational mission/business needs.',
    nist: ['SA-4 c']
  },
  'CCI-003097': {
    def: 'The organization includes the security-related documentation requirements, explicitly or by reference, in the acquisition contract for the information system, system component, or information system service in accordance with applicable federal laws, Executive Orders, directives, policies, regulations, standards, guidelines, and organizational mission/business needs.',
    nist: ['SA-4 d']
  },
  'CCI-003098': {
    def: 'The organization includes requirements for protecting security-related documentation, explicitly or by reference, in the acquisition contract for the information system, system component, or information system service in accordance with applicable federal laws, Executive Orders, directives, policies, regulations, standards, guidelines, and organizational mission/business needs.',
    nist: ['SA-4 e']
  },
  'CCI-003099': {
    def: 'The organization includes description of the information system development environment and environment in which the system is intended to operate, explicitly or by reference, in the acquisition contract for the information system, system component, or information system service in accordance with applicable federal laws, Executive Orders, directives, policies, regulations, standards, guidelines, and organizational mission/business needs.',
    nist: ['SA-4 f']
  },
  'CCI-003100': {
    def: 'The organization includes acceptance criteria, explicitly or by reference, in the acquisition contract for the information system, system component, or information system service in accordance with applicable federal laws, Executive Orders, directives, policies, regulations, standards, guidelines, and organizational mission/business needs.',
    nist: ['SA-4 g']
  },
  'CCI-003101': {
    def: 'The organization requires the developer of the information system, system component, or information system service to provide design information for the security controls to be employed that includes security-relevant external system interfaces, high-level design, low-level design, source code, hardware schematics, and/or organization-defined design information at an organization-defined level of detail.',
    nist: ['SA-4 (2)']
  },
  'CCI-003102': {
    def: 'The organization requires the developer of the information system, system component, or information system service to provide implementation information for the security controls to be employed that includes security-relevant external system interfaces, high-level design, low-level design, source code, hardware schematics, and/or organization-defined implementation information at an organization-defined level of detail.',
    nist: ['SA-4 (2)']
  },
  'CCI-003103': {
    def: 'The organization defines the design information that the developer of the information system, system component, or information system service is required to provide for the security controls to be employed.',
    nist: ['SA-4 (2)']
  },
  'CCI-003104': {
    def: 'The organization defines the implementation information that the developer of the information system, system component, or information system service is required to provide for the security controls to be employed.',
    nist: ['SA-4 (2)']
  },
  'CCI-003105': {
    def: 'The organization defines the level of detail for the design information of the security controls that is required to be provided by the developer of the information system, system component, or information system services.',
    nist: ['SA-4 (2)']
  },
  'CCI-003106': {
    def: 'The organization defines the level of detail for the implementation information of the security controls that is required to be provided by the developer of the information system, system component, or information system services.',
    nist: ['SA-4 (2)']
  },
  'CCI-003107': {
    def: 'The organization requires the developer of the information system, system component, or information system service to demonstrate the use of a system development life cycle that includes organization-defined state-of-the-practice system/security engineering methods, software development methods, testing/evaluation/validation techniques, and quality control processes.',
    nist: ['SA-4 (3)']
  },
  'CCI-003108': {
    def: 'The organization defines the state-of-the-practice system/security engineering methods, software development methods, testing/evaluation/validation techniques, and quality control processes that the developer of the information system, system component, or information system service is required to include when demonstrating the use of a system development life cycle.',
    nist: ['SA-4 (3)']
  },
  'CCI-003109': {
    def: 'The organization requires the developer of the information system, system component, or information system service to deliver the system, component, or service with organization-defined security configurations implemented.',
    nist: ['SA-4 (5) (a)']
  },
  'CCI-003110': {
    def: 'The organization defines the security configurations required to be implemented when the developer delivers the information system, system component, or information system service.',
    nist: ['SA-4 (5) (a)']
  },
  'CCI-003111': {
    def: 'The organization requires the developer of the information system, system component, or information system service to use the organization-defined security configurations as the default for any subsequent system, component, or service reinstallation or upgrade.',
    nist: ['SA-4 (5) (b)']
  },
  'CCI-003112': {
    def: 'The organization requires the developer of the information system, system component, or information system service to produce a plan for the continuous monitoring of security control effectiveness that contains an organization-defined level of detail.',
    nist: ['SA-4 (8)']
  },
  'CCI-003113': {
    def: 'The organization defines the level of detail to be contained in the plan for the continuous monitoring of security control effectiveness that the developer of the information system, system component, or information system services is required to produce.',
    nist: ['SA-4 (8)']
  },
  'CCI-003114': {
    def: 'The organization requires the developer of the information system, system component, or information system service to identify early in the system development life cycle, the functions, ports, protocols, and services intended for organizational use.',
    nist: ['SA-4 (9)']
  },
  'CCI-003115': {
    def: 'The organization requires the developer of the information system, system component, or information system service to identify early in the system development life cycle, the functions, ports, protocols, and services intended for organizational use.',
    nist: ['SA-4 (9)']
  },
  'CCI-003116': {
    def: 'The organization employs only information technology products on the FIPS 201-approved products list for Personal Identity Verification (PIV) capability implemented within organizational information systems.',
    nist: ['SA-4 (10)']
  },
  'CCI-003124': {
    def: 'The organization obtains administrator documentation for the information system, system component, or information system service that describes secure configuration of the system, component, or service.',
    nist: ['SA-5 a 1']
  },
  'CCI-003125': {
    def: 'The organization obtains administrator documentation for the information system, system component, or information system service that describes secure installation of the system, component, or service.',
    nist: ['SA-5 a 1']
  },
  'CCI-003126': {
    def: 'The organization obtains administrator documentation for the information system, system component, or information system service that describes secure operation of the system, component, or service.',
    nist: ['SA-5 a 1']
  },
  'CCI-003127': {
    def: 'The organization obtains administrator documentation for the information system, system component, or information system services that describes effective use and maintenance of security functions/mechanisms.',
    nist: ['SA-5 a 2']
  },
  'CCI-003128': {
    def: 'The organization obtains administrator documentation for the information system, system component, or information system service that describes known vulnerabilities regarding configuration and use of administrative (i.e., privileged) functions.',
    nist: ['SA-5 a 3']
  },
  'CCI-003129': {
    def: 'The organization obtains user documentation for the information system, system component, or information system service that describes user-accessible security functions/mechanisms and how to effectively use those security functions/mechanisms.',
    nist: ['SA-5 b 1']
  },
  'CCI-003130': {
    def: 'The organization obtains user documentation for the information system, system component, or information system service that describes methods for user interaction which enables individuals to use the system, component, or service in a more secure manner.',
    nist: ['SA-5 b 2']
  },
  'CCI-003131': {
    def: 'The organization obtains user documentation for the information system, system component, or information system service that describes user responsibilities in maintaining the security of the system, component, or service.',
    nist: ['SA-5 b 3']
  },
  'CCI-003132': {
    def: 'The organization takes organization-defined actions in response to attempts to obtain either unavailable or nonexistent documentation for the information system, system component, or information system service.',
    nist: ['SA-5 c']
  },
  'CCI-003133': {
    def: 'The organization defines actions to be taken in response to attempts to obtain either unavailable or nonexistent documentation for the information system, system component, or information system service.',
    nist: ['SA-5 c']
  },
  'CCI-003134': {
    def: 'The organization protects information system, system component, or information system service documentation as required, in accordance with the risk management strategy.',
    nist: ['SA-5 d']
  },
  'CCI-003135': {
    def: 'The organization distributes information system, system component, or information system service documentation to organization-defined personnel or roles.',
    nist: ['SA-5 e']
  },
  'CCI-003136': {
    def: 'The organization defines the personnel or roles to whom information system, system component, or information system service documentation is to be distributed.',
    nist: ['SA-5 e']
  },
  'CCI-003137': {
    def: 'The organization defines security controls that providers of external information system services employ in accordance with applicable federal laws, Executive Orders, directives, policies, regulations, standards, and guidance.',
    nist: ['SA-9 a']
  },
  'CCI-003138': {
    def: 'The organization employs organization-defined processes, methods, and techniques to monitor security control compliance by external service providers on an ongoing basis.',
    nist: ['SA-9 c']
  },
  'CCI-003139': {
    def: 'The organization defines processes, methods, and techniques to employ to monitor security control compliance by external service providers on an ongoing basis.',
    nist: ['SA-9 c']
  },
  'CCI-003140': {
    def: 'The organization conducts an organizational assessment of risk prior to the acquisition or outsourcing of dedicated information security services.',
    nist: ['SA-9  (1) (a)']
  },
  'CCI-003141': {
    def: 'The organization ensures that the acquisition or outsourcing of dedicated information security services is approved by organization-defined personnel or roles.',
    nist: ['SA-9 (1) (b)']
  },
  'CCI-003142': {
    def: 'The organization defines the personnel or roles authorized to approve the acquisition or outsourcing of dedicated information security services.',
    nist: ['SA-9 (1) (b)']
  },
  'CCI-003143': {
    def: 'The organization requires providers of organization-defined external information system services to identify the functions, ports, protocols, and other services required for the use of such services.',
    nist: ['SA-9 (2)']
  },
  'CCI-003144': {
    def: 'The organization defines the external information system services for which the providers are required to identify the functions, ports, protocols, and other services required for the use of such services.',
    nist: ['SA-9 (2)']
  },
  'CCI-003145': {
    def: 'The organization establishes trust relationships with external service providers based on organization-defined security requirements, properties, factors, or conditions defining acceptable trust relationships.',
    nist: ['SA-9 (3)']
  },
  'CCI-003146': {
    def: 'The organization documents trust relationships with external service providers based on organization-defined security requirements, properties, factors, or conditions defining acceptable trust relationships.',
    nist: ['SA-9 (3)']
  },
  'CCI-003147': {
    def: 'The organization maintains trust relationships with external service providers based on organization-defined security requirements, properties, factors, or conditions defining acceptable trust relationships.',
    nist: ['SA-9 (3)']
  },
  'CCI-003148': {
    def: 'The organization defines security requirements, properties, factors, or conditions defining acceptable trust relationships with external service providers.',
    nist: ['SA-9 (3)']
  },
  'CCI-003149': {
    def: 'The organization employs organization-defined security safeguards to ensure that the interests of organization-defined external service providers are consistent with and reflect organizational interests.',
    nist: ['SA-9 (4)']
  },
  'CCI-003150': {
    def: 'The organization defines security safeguards to employ to ensure that the interests of organization-defined external service providers are consistent with and reflect organizational interests.',
    nist: ['SA-9 (4)']
  },
  'CCI-003151': {
    def: 'The organization defines external service providers whose interests are consistent with and reflect organizational interests.',
    nist: ['SA-9 (4)']
  },
  'CCI-003152': {
    def: 'The organization restricts the location of information processing, information/data, and/or information system services to organization-defined locations based on organization-defined requirements or conditions.',
    nist: ['SA-9 (5)']
  },
  'CCI-003153': {
    def: 'The organization defines the locations for which to restrict information processing, information/data, and/or information system services based on organization-defined requirements or conditions.',
    nist: ['SA-9 (5)']
  },
  'CCI-003154': {
    def: 'The organization defines the requirements or conditions on which to base restricting the location of information processing, information/data, and/or information system services to organization-defined locations.',
    nist: ['SA-9 (5)']
  },
  'CCI-003155': {
    def: 'The organization requires the developer of the information system, system component, or information system service to perform configuration management during system, component, or service design, development, implementation and/or operation.',
    nist: ['SA-10 a']
  },
  'CCI-003156': {
    def: 'The organization requires the developer of the information system, system component, or information system service to document the integrity of changes to organization-defined configuration items under configuration management.',
    nist: ['SA-10 b']
  },
  'CCI-003157': {
    def: 'The organization requires the developer of the information system, system component, or information system service to manage the integrity of changes to organization-defined configuration items under configuration management.',
    nist: ['SA-10 b']
  },
  'CCI-003158': {
    def: 'The organization requires the developer of the information system, system component, or information system service to control the integrity of changes to organization-defined configuration items under configuration management.',
    nist: ['SA-10 b']
  },
  'CCI-003159': {
    def: 'The organization defines the configuration items under configuration management that require the integrity of changes to be documented, managed and controlled.',
    nist: ['SA-10 b']
  },
  'CCI-003160': {
    def: 'The organization requires the developer of the information system, system component, or information system service to document the potential security impacts of approved changes to the system, component, or service.',
    nist: ['SA-10 d']
  },
  'CCI-003161': {
    def: 'The organization requires the developer of the information system, system component, or information system service to track security flaws within the system, component, or service.',
    nist: ['SA-10 e']
  },
  'CCI-003162': {
    def: 'The organization requires the developer of the information system, system component, or information system service to track flaw resolution within the system, component, or service.',
    nist: ['SA-10 e']
  },
  'CCI-003163': {
    def: 'The organization requires the developer of the information system, system component, or information system service to report findings of security flaws and flaw resolution within the system, component, or service to organization-defined personnel.',
    nist: ['SA-10 e']
  },
  'CCI-003164': {
    def: 'The organization defines the personnel to whom security flaw findings and flaw resolution within the system, component, or service are reported.',
    nist: ['SA-10 e']
  },
  'CCI-003165': {
    def: 'The organization requires the developer of the information system, system component, or information system service to enable integrity verification of hardware components.',
    nist: ['SA-10 (3)']
  },
  'CCI-003166': {
    def: 'The organization requires the developer of the information system, system component, or information system service to employ tools for comparing newly generated versions of security-relevant hardware descriptions with previous versions.',
    nist: ['SA-10 (4)']
  },
  'CCI-003167': {
    def: 'The organization requires the developer of the information system, system component, or information system service to employ tools for comparing newly generated versions of software/firmware source code with previous versions.',
    nist: ['SA-10 (4)']
  },
  'CCI-003168': {
    def: 'The organization requires the developer of the information system, system component, or information system service to employ tools for comparing newly generated versions of object code with previous versions.',
    nist: ['SA-10 (4)']
  },
  'CCI-003169': {
    def: 'The organization requires the developer of the information system, system component, or information system service to maintain the integrity of the mapping between the master build data (hardware drawings and software/firmware code) describing the current version of security-relevant hardware, software, and firmware and the on-site master copy of the data for the current version.',
    nist: ['SA-10 (5)']
  },
  'CCI-003170': {
    def: 'The organization requires the developer of the information system, system component, or information system service to execute procedures for ensuring that security-relevant hardware, software, and firmware updates distributed to the organization are exactly as specified by the master copies.',
    nist: ['SA-10 (6)']
  },
  'CCI-003171': {
    def: 'The organization requires the developer of the information system, system component, or information system service to create a security assessment plan.',
    nist: ['SA-11 a']
  },
  'CCI-003172': {
    def: 'The organization requires the developer of the information system, system component, or information system service to implement a security assessment plan.',
    nist: ['SA-11 a']
  },
  'CCI-003173': {
    def: 'The organization requires the developer of the information system, system component, or information system service to perform unit, integration, system, and/or regression testing/evaluation at an organization-defined depth and coverage.',
    nist: ['SA-11 b']
  },
  'CCI-003174': {
    def: 'The organization defines the depth and coverage at which to perform unit, integration, system, and/or regression testing/evaluation.',
    nist: ['SA-11 b']
  },
  'CCI-003175': {
    def: 'The organization requires the developer of the information system, system component, or information system service to produce evidence of the execution of the security assessment plan.',
    nist: ['SA-11 c']
  },
  'CCI-003176': {
    def: 'The organization requires the developer of the information system, system component, or information system service to produce the results of the security testing/evaluation.',
    nist: ['SA-11 c']
  },
  'CCI-003177': {
    def: 'The organization requires the developer of the information system, system component, or information system service to implement a verifiable flaw remediation process.',
    nist: ['SA-11 d']
  },
  'CCI-003178': {
    def: 'The organization requires the developer of the information system, system component, or information system service to correct flaws identified during security testing/evaluation.',
    nist: ['SA-11 e']
  },
  'CCI-003179': {
    def: 'The organization requires the developer of the information system, system component, or information system service to employ static code analysis tools to identify common flaws.',
    nist: ['SA-11 (1)']
  },
  'CCI-003180': {
    def: 'The organization requires the developer of the information system, system component, or information system service to document the results of static code analysis.',
    nist: ['SA-11 (1)']
  },
  'CCI-003181': {
    def: 'The organization requires the developer of the information system, system component, or information system service to perform threat and vulnerability analysis.',
    nist: ['SA-11 (2)']
  },
  'CCI-003182': {
    def: 'The organization requires the developer of the information system, system component, or information system service to perform testing/evaluation of the as-built system, component, or service subsequent to threat and vulnerability analysis.',
    nist: ['SA-11 (2)']
  },
  'CCI-003183': {
    def: 'The organization requires an independent agent satisfying organization-defined independence criteria to verify the correct implementation of the developer security assessment plan.',
    nist: ['SA-11 (3) (a)']
  },
  'CCI-003184': {
    def: 'The organization requires an independent agent satisfying organization-defined independence criteria to verify the evidence produced during security testing/evaluation.',
    nist: ['SA-11 (3) (a)']
  },
  'CCI-003185': {
    def: 'The organization defines the independence criteria the independent agent must satisfy prior to verifying the correct implementation of the developer security assessment plan and the evidence produced during security testing/evaluation.',
    nist: ['SA-11 (3) (a)']
  },
  'CCI-003186': {
    def: 'The organization ensures that the independent agent either is provided with sufficient information to complete the verification process or has been granted the authority to obtain such information.',
    nist: ['SA-11 (3) (b)']
  },
  'CCI-003187': {
    def: 'The organization requires the developer of the information system, system component, or information system service to perform a manual code review of organization-defined specific code using organization-defined processes, procedures, and/or techniques.',
    nist: ['SA-11 (4)']
  },
  'CCI-003188': {
    def: 'The organization defines the specific code for which the developer of the information system, system component, or information system service is required to perform a manual code review using organization-defined process, procedures, and/or techniques.',
    nist: ['SA-11 (4)']
  },
  'CCI-003189': {
    def: 'The organization defines the processes, procedures, and/or techniques to be used by the developer of the information system, system component, or information system service to perform a manual code review of organization-defined specific code.',
    nist: ['SA-11 (4)']
  },
  'CCI-003190': {
    def: 'The organization requires the developer of the information system, system component, or information system service to perform penetration testing at an organization-defined breadth/depth and with organization-defined constraints.',
    nist: ['SA-11 (5)']
  },
  'CCI-003191': {
    def: 'The organization defines the breadth/depth at which the developer of the information system, system component, or information system service is required to perform penetration testing.',
    nist: ['SA-11 (5)']
  },
  'CCI-003192': {
    def: 'The organization defines the constraints on penetration testing performed by the developer of the information system, system component, or information system service.',
    nist: ['SA-11 (5)']
  },
  'CCI-003193': {
    def: 'The organization requires the developer of the information system, system component, or information system service to perform attack surface reviews.',
    nist: ['SA-11 (6)']
  },
  'CCI-003194': {
    def: 'The organization requires the developer of the information system, system component, or information system service to verify that the scope of security testing/evaluation provides complete coverage of required security controls at an organization-defined depth of testing/evaluation.',
    nist: ['SA-11 (7)']
  },
  'CCI-003195': {
    def: 'The organization defines the depth of testing/evaluation to which the developer of the information system, system component, or information system service is required to verify that the scope of security testing/evaluation provides complete coverage of the required security controls.',
    nist: ['SA-11 (7)']
  },
  'CCI-003196': {
    def: 'The organization requires the developer of the information system, system component, or information system service to employ dynamic code analysis tools to identify common flaws.',
    nist: ['SA-11 (8)']
  },
  'CCI-003197': {
    def: 'The organization requires the developer of the information system, system component, or information system service to document the results of the dynamic code analysis.',
    nist: ['SA-11 (8)']
  },
  'CCI-003198': {
    def: 'The organization employs organization-defined tailored acquisition strategies, contract tools, and procurement methods for the purchase of the information system, system component, or information system service from suppliers.',
    nist: ['SA-12 (1)']
  },
  'CCI-003199': {
    def: 'The organization defines tailored acquisition strategies, contract tools, and procurement methods to employ for the purchase of the information system, system component, or information system service from suppliers.',
    nist: ['SA-12 (1)']
  },
  'CCI-003200': {
    def: 'The organization conducts a supplier review prior to entering into a contractual agreement to acquire the information system, system component, or information system service.',
    nist: ['SA-12 (2)']
  },
  'CCI-003201': {
    def: 'The organization employs organization-defined security safeguards to limit harm from potential adversaries identifying and targeting the organizational supply chain.',
    nist: ['SA-12 (5)']
  },
  'CCI-003202': {
    def: 'The organization defines security safeguards to employ to limit harm from potential adversaries identifying and targeting the organizational supply chain.',
    nist: ['SA-12 (5)']
  },
  'CCI-003203': {
    def: 'The organization conducts an assessment of the information system, system component, or information system service prior to selection, acceptance, or update.',
    nist: ['SA-12 (7)']
  },
  'CCI-003204': {
    def: 'The organization conducts an assessment of the information system, system component, or information system service prior to selection, acceptance, or update.',
    nist: ['SA-12 (7)']
  },
  'CCI-003205': {
    def: 'The organization uses all-source intelligence analysis of suppliers and potential suppliers of the information system, system component, or information system service.',
    nist: ['SA-12 (8)']
  },
  'CCI-003206': {
    def: 'The organization employs organization-defined Operations Security (OPSEC) safeguards in accordance with classification guides to protect supply chain-related information for the information system, system component, or information system service.',
    nist: ['SA-12 (9)']
  },
  'CCI-003207': {
    def: 'The organization employs organization-defined tailored acquisition strategies, contract tools, and procurement methods for the purchase of the information system, system component, or information system service from suppliers.',
    nist: ['SA-12 (1)']
  },
  'CCI-003208': {
    def: 'The organization employs organization-defined tailored acquisition strategies, contract tools, and procurement methods for the purchase of the information system, system component, or information system service from suppliers.',
    nist: ['SA-12 (1)']
  },
  'CCI-003209': {
    def: 'The organization employs organization-defined tailored acquisition strategies, contract tools, and procurement methods for the purchase of the information system, system component, or information system service from suppliers.',
    nist: ['SA-12 (1)']
  },
  'CCI-003210': {
    def: 'The organization defines the Operations Security (OPSEC) safeguards to be employed in accordance with classification guides to protect supply chain-related information for the information system, system component, or information system service.',
    nist: ['SA-12 (9)']
  },
  'CCI-003211': {
    def: 'The organization defines the Operations Security (OPSEC) safeguards to be employed in accordance with classification guides to protect supply chain-related information for the information system, system component, or information system service.',
    nist: ['SA-12 (9)']
  },
  'CCI-003212': {
    def: 'The organization employs organization-defined security safeguards to validate that the information system or system component received is genuine and has not been altered.',
    nist: ['SA-12 (10)']
  },
  'CCI-003213': {
    def: 'The organization defines the security safeguards to be employed to validate that the information system or system component received is genuine and has not been altered.',
    nist: ['SA-12 (10)']
  },
  'CCI-003214': {
    def: 'The organization employs organizational analysis, independent third-party analysis, organizational penetration testing and/or independent third-party penetration testing of organization-defined supply chain elements, processes, and actors associated with the information system, system component, or information system service.',
    nist: ['SA-12 (11)']
  },
  'CCI-003215': {
    def: 'The organization defines the supply chain elements, processes, and actors associated with the information system, system component, or information system service for organizational analysis, independent third-party analysis, organizational penetration testing and/or independent third-party penetration testing.',
    nist: ['SA-12 (11)']
  },
  'CCI-003216': {
    def: 'The organization establishes inter-organizational agreements with entities involved in the supply chain for the information system, system component, or information system service.',
    nist: ['SA-12 (12)']
  },
  'CCI-003217': {
    def: 'The organization establishes inter-organizational procedures with entities involved in the supply chain for the information system, system component, or information system service.',
    nist: ['SA-12 (12)']
  },
  'CCI-003218': {
    def: 'The organization employs organization-defined security safeguards to ensure an adequate supply of organization-defined critical information system components.',
    nist: ['SA-12 (13)']
  },
  'CCI-003219': {
    def: 'The organization defines the security safeguards to be employed to ensure an adequate supply of organization-defined critical information system components.',
    nist: ['SA-12 (13)']
  },
  'CCI-003220': {
    def: 'The organization defines the critical information system components for which organization-defined security safeguards are employed to ensure adequate supply.',
    nist: ['SA-12 (13)']
  },
  'CCI-003221': {
    def: 'The organization establishes unique identification of organization-defined supply chain elements, processes, and actors for the information system, system component, or information system service.',
    nist: ['SA-12 (14)']
  },
  'CCI-003222': {
    def: 'The organization retains unique identification of organization-defined supply chain elements, processes, and actors for the information system, system component, or information system service.',
    nist: ['SA-12 (14)']
  },
  'CCI-003223': {
    def: 'The organization defines the supply chain elements, processes, and actors for the information system, system component, or information system service to establish and retain unique identification.',
    nist: ['SA-12 (14)']
  },
  'CCI-003224': {
    def: 'The organization establishes a process to address weaknesses or deficiencies in supply chain elements identified during independent or organizational assessments of such elements.',
    nist: ['SA-12 (15)']
  },
  'CCI-003225': {
    def: 'The organization describes the trustworthiness required in the organization-defined information system, information system component, or information system service supporting its critical missions/business functions.',
    nist: ['SA-13 a']
  },
  'CCI-003226': {
    def: 'The organization defines the information system, information system component, or information system service supporting its critical missions/business functions in which the trustworthiness must be described.',
    nist: ['SA-13 a']
  },
  'CCI-003227': {
    def: 'The organization implements an organization-defined assurance overlay to achieve trustworthiness required to support its critical missions/business functions.',
    nist: ['SA-13 b']
  },
  'CCI-003228': {
    def: 'The organization defines an assurance overlay to be implemented to achieve trustworthiness required to support its critical missions/business functions.',
    nist: ['SA-13 b']
  },
  'CCI-003229': {
    def: 'The organization identifies critical information system components by performing a criticality analysis for organization-defined information systems, information system components, or information system services at organization-defined decision points in the system development life cycle.',
    nist: ['SA-14']
  },
  'CCI-003230': {
    def: 'The organization identifies critical information system functions by performing a criticality analysis for organization-defined information systems, information system components, or information system services at organization-defined decision points in the system development life cycle.',
    nist: ['SA-14']
  },
  'CCI-003231': {
    def: 'The organization defines the information systems, information system components, or information system services for which the organization identifies critical information system components and functions for criticality analysis.',
    nist: ['SA-14']
  },
  'CCI-003232': {
    def: 'The organization defines the decision points in the system development life cycle at which to perform a criticality analysis to identify critical information system components and functions for organization-defined information systems, information system components, or information system services.',
    nist: ['SA-14']
  },
  'CCI-003233': {
    def: 'The organization requires the developer of the information system, system component, or information system service to follow a documented development process.',
    nist: ['SA-15']
  },
  'CCI-003234': {
    def: 'The documented information system, system component, or information system service development process explicitly addresses security requirements.',
    nist: ['SA-15 a 1']
  },
  'CCI-003235': {
    def: 'The documented information system, system component, or information system service development process identifies the standards used in the development process.',
    nist: ['SA-15 a 2']
  },
  'CCI-003236': {
    def: 'The documented information system, system component, or information system service development process identifies the tools used in the development process.',
    nist: ['SA-15 a 2']
  },
  'CCI-003237': {
    def: 'The documented information system, system component, or information system service development process documents the specific tool options and tool configurations used in the development process.',
    nist: ['SA-15 a 3']
  },
  'CCI-003238': {
    def: 'The documented information system, system component, or information system service development process documents changes to the process and/or tools used in development.',
    nist: ['SA-15 a 4']
  },
  'CCI-003239': {
    def: 'The documented information system, system component, or information system service development process manages changes to the process and/or tools used in development.',
    nist: ['SA-15 a 4']
  },
  'CCI-003240': {
    def: 'The documented information system, system component, or information system service development process ensures the integrity of changes to the process and/or tools used in development.',
    nist: ['SA-15 a 4']
  },
  'CCI-003241': {
    def: 'The organization reviews the development process in accordance with organization-defined frequency to determine if the development process selected and employed can satisfy organization-defined security requirements.',
    nist: ['SA-15 b']
  },
  'CCI-003242': {
    def: 'The organization reviews the development standards in accordance with organization-defined frequency to determine if the development standards selected and employed can satisfy organization-defined security requirements.',
    nist: ['SA-15 b']
  },
  'CCI-003243': {
    def: 'The organization reviews the development tools in accordance with organization-defined frequency to determine if the development tools selected and employed can satisfy organization-defined security requirements.',
    nist: ['SA-15 b']
  },
  'CCI-003244': {
    def: 'The organization reviews the development tool options/configurations in accordance with organization-defined frequency to determine if the development tool options/configurations selected and employed can satisfy organization-defined security requirements.',
    nist: ['SA-15 b']
  },
  'CCI-003245': {
    def: 'The organization defines the frequency on which to review the development process, standards, tools, and tool options/configurations to determine if the process, standards, tools, and tool options/configurations selected and employed can satisfy organization-defined security requirements.',
    nist: ['SA-15 b']
  },
  'CCI-003246': {
    def: 'The organization defines the security requirements that must be satisfied by conducting a review of the development process, standards, tools, and tool options/configurations.',
    nist: ['SA-15 b']
  },
  'CCI-003247': {
    def: 'The organization requires the developer of the information system, system component, or information system service to define quality metrics at the beginning of the development process.',
    nist: ['SA-15 (1) (a)']
  },
  'CCI-003248': {
    def: 'The organization requires the developer of the information system, system component, or information system service to provide evidence of meeting the quality metrics in accordance with organization-defined frequency, organization-defined program review milestones and/or upon delivery.',
    nist: ['SA-15 (1) (b)']
  },
  'CCI-003249': {
    def: 'The organization defines the frequency on which the developer of the information system, system component, or information system service is required to provide evidence of meeting the quality metrics.',
    nist: ['SA-15 (1) (b)']
  },
  'CCI-003250': {
    def: 'The organization defines the program review milestones at which the developer of the information system, system component, or information system service is required to provide evidence of meeting the quality metrics.',
    nist: ['SA-15 (1) (b)']
  },
  'CCI-003251': {
    def: 'The organization requires the developer of the information system, system component, or information system service to select a security tracking tool for use during the development process.',
    nist: ['SA-15 (2)']
  },
  'CCI-003252': {
    def: 'The organization requires the developer of the information system, system component, or information system service to employ a security tracking tool for use during the development process.',
    nist: ['SA-15 (2)']
  },
  'CCI-003253': {
    def: 'The organization requires the developer of the information system, system component, or information system service to perform a criticality analysis at an organization-defined breadth/depth and at organization-defined decision points in the system development life cycle.',
    nist: ['SA-15 (3)']
  },
  'CCI-003254': {
    def: 'The organization defines the breadth/depth at which the developer of the information system, system component, or information system service is required to perform a criticality analysis.',
    nist: ['SA-15 (3)']
  },
  'CCI-003255': {
    def: 'The organization defines decision points in the system development life cycle at which the developer of the information system, system component, or information system service is required to perform a criticality analysis.',
    nist: ['SA-15 (3)']
  },
  'CCI-003256': {
    def: 'The organization requires that developers perform threat modeling for the information system at an organization-defined breadth/depth.',
    nist: ['SA-15 (4)']
  },
  'CCI-003257': {
    def: 'The organization requires that developers perform a vulnerability analysis for the information system at an organization-defined breadth/depth.',
    nist: ['SA-15 (4)']
  },
  'CCI-003258': {
    def: 'The organization defines the breadth/depth at which threat modeling for the information system must be performed by developers.',
    nist: ['SA-15 (4)']
  },
  'CCI-003259': {
    def: 'The organization defines the breadth/depth at which vulnerability analysis for the information system must be performed by developers.',
    nist: ['SA-15 (4)']
  },
  'CCI-003260': {
    def: 'Threat modeling performed by the developer for the information system uses organization-defined information concerning impact, environment of operations, known or assumed threats, and acceptable risk levels.',
    nist: ['SA-15 (4) (a)']
  },
  'CCI-003261': {
    def: 'Vulnerability analysis performed by the developer for the information system uses organization-defined information concerning impact, environment of operations, known or assumed threats, and acceptable risk levels.',
    nist: ['SA-15 (4) (a)']
  },
  'CCI-003262': {
    def: 'The organization defines information concerning impact, environment of operations, known or assumed threats, and acceptable risk levels to be used to perform threat modeling for the information system by the developer.',
    nist: ['SA-15 (4) (a)']
  },
  'CCI-003263': {
    def: 'The organization defines information concerning impact, environment of operations, known or assumed threats, and acceptable risk levels to be used to perform a vulnerability analysis for the information system by the developer.',
    nist: ['SA-15 (4) (a)']
  },
  'CCI-003264': {
    def: 'The organization requires the threat modeling performed by the developers employ organization-defined tools and methods.',
    nist: ['SA-15 (4) (b)']
  },
  'CCI-003265': {
    def: 'The organization requires the vulnerability analysis performed by the developers employ organization-defined tools and methods.',
    nist: ['SA-15 (4) (b)']
  },
  'CCI-003266': {
    def: 'The organization defines tools and methods to be employed to perform threat modeling for the information system by the developer.',
    nist: ['SA-15 (4) (b)']
  },
  'CCI-003267': {
    def: 'The organization defines tools and methods to be employed to perform a vulnerability analysis for the information system by the developer.',
    nist: ['SA-15 (4) (b)']
  },
  'CCI-003268': {
    def: 'The organization requires that developers performing threat modeling for the information system produce evidence that meets organization-defined acceptance criteria.',
    nist: ['SA-15 (4) (c)']
  },
  'CCI-003269': {
    def: 'The organization requires that developers performing vulnerability analysis for the information system produce evidence that meets organization-defined acceptance criteria.',
    nist: ['SA-15 (4) (c)']
  },
  'CCI-003270': {
    def: 'The organization defines the acceptance criteria that must be met when threat modeling of the information system is performed by the developer.',
    nist: ['SA-15 (4) (c)']
  },
  'CCI-003271': {
    def: 'The organization defines the acceptance criteria that must be met when vulnerability analysis of the information system is performed by the developer.',
    nist: ['SA-15 (4) (c)']
  },
  'CCI-003272': {
    def: 'The organization requires the developer of the information system, system component, or information system service to reduce attack surfaces to organization-defined thresholds.',
    nist: ['SA-15 (5)']
  },
  'CCI-003273': {
    def: 'The organization defines the thresholds to which the developer of the information system, system component, or information system service is required to reduce attack surfaces.',
    nist: ['SA-15 (5)']
  },
  'CCI-003274': {
    def: 'The organization requires the developer of the information system, system component, or information system service to implement an explicit process to continuously improve the development process.',
    nist: ['SA-15 (6)']
  },
  'CCI-003275': {
    def: 'The organization requires the developer of the information system, system component, or information system services to perform an automated vulnerability analysis using organization-defined tools.',
    nist: ['SA-15 (7) (a)']
  },
  'CCI-003276': {
    def: 'The organization defines the tools the developer of the information system, system component, or information system services uses to perform an automated vulnerability analysis.',
    nist: ['SA-15 (7) (a)']
  },
  'CCI-003277': {
    def: 'The organization requires the developer of the information system, system component, or information system services to determine the exploitation potential for discovered vulnerabilities.',
    nist: ['SA-15 (7) (b)']
  },
  'CCI-003278': {
    def: 'The organization requires the developer of the information system, system component, or information system services to determine potential risk mitigations for delivered vulnerabilities.',
    nist: ['SA-15 (7) (c)']
  },
  'CCI-003279': {
    def: 'The organization requires the developer of the information system, system component, or information system services to deliver the outputs of the tools and results of the vulnerability analysis to organization-defined personnel or roles.',
    nist: ['SA-15 (7) (d)']
  },
  'CCI-003280': {
    def: 'The organization defines the personnel or roles to whom the outputs of the tools and results of the vulnerability analysis are delivered.',
    nist: ['SA-15 (7) (d)']
  },
  'CCI-003281': {
    def: 'The organization requires the developer of the information system, system component, or information system service to use threat modeling from similar systems, components, or services to inform the current development process.',
    nist: ['SA-15 (8)']
  },
  'CCI-003282': {
    def: 'The organization requires the developer of the information system, system component, or information system service to use vulnerability analysis from similar systems, components, or services to inform the current development process.',
    nist: ['SA-15 (8)']
  },
  'CCI-003283': {
    def: 'The organization approves the use of live data in development environments for the information system, system component, or information system service.',
    nist: ['SA-15 (9)']
  },
  'CCI-003284': {
    def: 'The organization approves the use of live data in test environments for the information system, system component, or information system service.',
    nist: ['SA-15 (9)']
  },
  'CCI-003285': {
    def: 'The organization documents the use of live data in development environments for the information system, system component, or information system service.',
    nist: ['SA-15 (9)']
  },
  'CCI-003286': {
    def: 'The organization documents the use of live data in test environments for the information system, system component, or information system service.',
    nist: ['SA-15 (9)']
  },
  'CCI-003287': {
    def: 'The organization controls the use of live data in development environments for the information system, system component, or information system service.',
    nist: ['SA-15 (9)']
  },
  'CCI-003288': {
    def: 'The organization controls the use of live data in test environments for the information system, system component, or information system service.',
    nist: ['SA-15 (9)']
  },
  'CCI-003289': {
    def: 'The organization requires the developer of the information system, system component, or information system service to provide an incident response plan.',
    nist: ['SA-15 (10)']
  },
  'CCI-003290': {
    def: 'The organization requires the developer of the information system or system component to archive the system or component to be released or delivered together with the corresponding evidence supporting the final security review.',
    nist: ['SA-15 (11)']
  },
  'CCI-003291': {
    def: 'The organization requires the developer of the information system, system component, or information system service to provide organization-defined training on the correct use and operation of the implemented security functions, controls, and/or mechanisms.',
    nist: ['SA-16']
  },
  'CCI-003292': {
    def: 'The organization defines the training the developer of the information system, system component, or information system service is required to provide on the correct use and operation of the implemented security functions, controls, and/or mechanisms.',
    nist: ['SA-16']
  },
  'CCI-003293': {
    def: 'The organization requires the developer of the information system, system component, or information system service to produce a design specification and security architecture.',
    nist: ['SA-17']
  },
  'CCI-003294': {
    def: 'The design specification and security architecture is consistent with and supportive of the organization^s security architecture which is established within and is an integrated part of the organization^s enterprise architecture.',
    nist: ['SA-17 a']
  },
  'CCI-003295': {
    def: 'The design specification and security architecture accurately and completely describes the required security functionality.',
    nist: ['SA-17 b']
  },
  'CCI-003296': {
    def: 'The design specification and security architecture accurately and completely describes the allocation of security controls among physical and logical components.',
    nist: ['SA-17 b']
  },
  'CCI-003297': {
    def: 'The design specification and security architecture expresses how individual security functions, mechanisms, and services work together to provide required security capabilities and a unified approach to protection.',
    nist: ['SA-17 c']
  },
  'CCI-003298': {
    def: 'The organization requires the developer of the information system, system component, or information system to produce, as an integral part of the development process, a formal policy model describing the organization-defined elements of organizational security policy to be enforced.',
    nist: ['SA-17 (1) (a)']
  },
  'CCI-003299': {
    def: 'The organization defines the elements of organization security policy to be described in the formal policy model for enforcement on the information system, system component, or information system service.',
    nist: ['SA-17 (1) (a)']
  },
  'CCI-003300': {
    def: 'The organization requires the developer of the information system, system component, or information system service to prove that the formal policy model is internally consistent and sufficient to enforce the defined elements of the organizational security policy when implemented.',
    nist: ['SA-17 (1) (b)']
  },
  'CCI-003301': {
    def: 'The organization requires the developer of the information system, system component, or information system service to define security-relevant hardware.',
    nist: ['SA-17 (2) (a)']
  },
  'CCI-003302': {
    def: 'The organization requires the developer of the information system, system component, or information system service to define security-relevant hardware.',
    nist: ['SA-17 (2) (a)']
  },
  'CCI-003303': {
    def: 'The organization requires the developer of the information system, system component, or information system service to define security-relevant software.',
    nist: ['SA-17 (2) (a)']
  },
  'CCI-003304': {
    def: 'The organization requires the developer of the information system, system component, or information system service to define security-relevant firmware.',
    nist: ['SA-17 (2) (a)']
  },
  'CCI-003305': {
    def: 'The organization requires the developer of the information system, system component, or information system service to provide a rationale that the definition for security-relevant hardware is complete.',
    nist: ['SA-17 (2) (a)']
  },
  'CCI-003306': {
    def: 'The organization requires the developer of the information system, system component, or information system service to provide a rationale that the definition for security-relevant software is complete.',
    nist: ['SA-17 (2) (b)']
  },
  'CCI-003307': {
    def: 'The organization requires the developer of the information system, system component, or information system service to provide a rationale that the definition for security-relevant firmware is complete.',
    nist: ['SA-17 (2) (b)']
  },
  'CCI-003308': {
    def: 'The organization requires the developer of the information system, system component, or information system service to produce, as an integral part of the development process, a formal top-level specification that specifies the interfaces to security-relevant hardware in terms of exceptions, error messages, and effects.',
    nist: ['SA-17 (3) (a)']
  },
  'CCI-003309': {
    def: 'The organization requires the developer of the information system, system component, or information system service to produce, as an integral part of the development process, a formal top-level specification that specifies the interfaces to security-relevant software in terms of exceptions, error messages, and effects.',
    nist: ['SA-17 (3) (a)']
  },
  'CCI-003310': {
    def: 'The organization requires the developer of the information system, system component, or information system service to produce, as an integral part of the development process, a formal top-level specification that specifies the interfaces to security-relevant firmware in terms of exceptions, error messages, and effects.',
    nist: ['SA-17 (3) (a)']
  },
  'CCI-003311': {
    def: 'The organization requires the developer of the information system, system component, or information system service to show via proof to the extent feasible with additional informal demonstration as necessary, that the formal top-level specification is consistent with the formal policy model.',
    nist: ['SA-17 (3) (b)']
  },
  'CCI-003312': {
    def: 'The organization requires the developer of the information system, system component, or information system service to show via informal demonstration, that the formal top-level specification completely covers the interfaces to security-relevant hardware.',
    nist: ['SA-17 (3) (c)']
  },
  'CCI-003313': {
    def: 'The organization requires the developer of the information system, system component, or information system service to show via informal demonstration, that the formal top-level specification completely covers the interfaces to security-relevant software.',
    nist: ['SA-17 (3) (c)']
  },
  'CCI-003314': {
    def: 'The organization requires the developer of the information system, system component, or information system service to show via informal demonstration, that the formal top-level specification completely covers the interfaces to security-relevant firmware.',
    nist: ['SA-17 (3) (c)']
  },
  'CCI-003315': {
    def: 'The organization requires the developer of the information system, system component, or information system service to show that the formal top-level specification is an accurate description of the implemented security-relevant hardware.',
    nist: ['SA-17 (3) (d)']
  },
  'CCI-003316': {
    def: 'The organization requires the developer of the information system, system component, or information system service to show that the formal top-level specification is an accurate description of the implemented security-relevant software.',
    nist: ['SA-17 (3) (d)']
  },
  'CCI-003317': {
    def: 'The organization requires the developer of the information system, system component, or information system service to show that the formal top-level specification is an accurate description of the implemented security-relevant firmware.',
    nist: ['SA-17 (3) (d)']
  },
  'CCI-003318': {
    def: 'The organization requires the developer of the information system, system component, or information system service to describe the security-relevant hardware mechanisms not addressed in the formal top-level specification but strictly internal to the security-relevant hardware.',
    nist: ['SA-17 (3) (e)']
  },
  'CCI-003319': {
    def: 'The organization requires the developer of the information system, system component, or information system service to describe the security-relevant software mechanisms not addressed in the formal top-level specification but strictly internal to the security-relevant software.',
    nist: ['SA-17 (3) (e)']
  },
  'CCI-003320': {
    def: 'The organization requires the developer of the information system, system component, or information system service to describe the security-relevant firmware mechanisms not addressed in the formal top-level specification but strictly internal to the security-relevant firmware.',
    nist: ['SA-17 (3) (e)']
  },
  'CCI-003321': {
    def: 'The organization requires the developer of the information system, system component, or information system service to produce, as an integral part of the development process, an informal descriptive top-level specification that specifies the interfaces to security-relevant hardware in terms of exceptions, error messages, and effects.',
    nist: ['SA-17 (4) (a)']
  },
  'CCI-003322': {
    def: 'The organization requires the developer of the information system, system component, or information system service to produce, as an integral part of the development process, an informal descriptive top-level specification that specifies the interfaces to security-relevant software in terms of exceptions, error messages, and effects.',
    nist: ['SA-17 (4) (a)']
  },
  'CCI-003323': {
    def: 'The organization requires the developer of the information system, system component, or information system service to produce, as an integral part of the development process, an informal descriptive top-level specification that specifies the interfaces to security-relevant firmware in terms of exceptions, error messages, and effects.',
    nist: ['SA-17 (4) (a)']
  },
  'CCI-003324': {
    def: 'The organization requires the developer of the information system, system component, or information system service to show via informal demonstration or convincing argument with formal methods as feasible that the descriptive top-level specification is consistent with the formal policy model.',
    nist: ['SA-17 (4) (b)']
  },
  'CCI-003325': {
    def: 'The organization requires the developer of the information system, system component, or information system service to show via informal demonstration, that the descriptive top-level specification completely covers the interfaces to security-relevant hardware.',
    nist: ['SA-17 (4) (c)']
  },
  'CCI-003326': {
    def: 'The organization requires the developer of the information system, system component, or information system service to show via informal demonstration, that the descriptive top-level specification completely covers the interfaces to security-relevant software.',
    nist: ['SA-17 (4) (c)']
  },
  'CCI-003327': {
    def: 'The organization requires the developer of the information system, system component, or information system service to show via informal demonstration, that the descriptive top-level specification completely covers the interfaces to security-relevant firmware.',
    nist: ['SA-17 (4) (c)']
  },
  'CCI-003328': {
    def: 'The organization requires the developer of the information system, system component, or information system service to show that the descriptive top-level specification is an accurate description of the interfaces to security-relevant hardware.',
    nist: ['SA-17 (4) (d)']
  },
  'CCI-003329': {
    def: 'The organization requires the developer of the information system, system component, or information system service to show that the descriptive top-level specification is an accurate description of the interfaces to security-relevant software.',
    nist: ['SA-17 (4) (d)']
  },
  'CCI-003330': {
    def: 'The organization requires the developer of the information system, system component, or information system service to show that the descriptive top-level specification is an accurate description of the interfaces to security-relevant firmware.',
    nist: ['SA-17 (4) (d)']
  },
  'CCI-003331': {
    def: 'The organization requires the developer of the information system, system component, or information system service to describe the security-relevant hardware mechanisms not addressed in the descriptive top-level specification but strictly internal to the security-relevant hardware.',
    nist: ['SA-17 (4) (e)']
  },
  'CCI-003332': {
    def: 'The organization requires the developer of the information system, system component, or information system service to describe the security-relevant software mechanisms not addressed in the descriptive top-level specification but strictly internal to the security-relevant software.',
    nist: ['SA-17 (4) (e)']
  },
  'CCI-003333': {
    def: 'The organization requires the developer of the information system, system component, or information system service to describe the security-relevant firmware mechanisms not addressed in the descriptive top-level specification but strictly internal to the security-relevant firmware.',
    nist: ['SA-17 (4) (e)']
  },
  'CCI-003334': {
    def: 'The organization requires the developer of the information system, system component, or information system service to design and structure the security-relevant hardware to use a complete, conceptually simple protection mechanism with precisely defined semantics.',
    nist: ['SA-17 (5) (a)']
  },
  'CCI-003335': {
    def: 'The organization requires the developer of the information system, system component, or information system service to design and structure the security-relevant software to use a complete, conceptually simple protection mechanism with precisely defined semantics.',
    nist: ['SA-17 (5) (a)']
  },
  'CCI-003336': {
    def: 'The organization requires the developer of the information system, system component, or information system service to design and structure the security-relevant firmware to use a complete, conceptually simple protection mechanism with precisely defined semantics.',
    nist: ['SA-17 (5) (a)']
  },
  'CCI-003337': {
    def: 'The organization requires the developer of the information system, system component, or information system service to internally structure the security-relevant hardware with specific regard for the complete, conceptually simple protection mechanism with precisely defined semantics.',
    nist: ['SA-17 (5) (b)']
  },
  'CCI-003338': {
    def: 'The organization requires the developer of the information system, system component, or information system service to internally structure the security-relevant software with specific regard for the complete, conceptually simple protection mechanism with precisely defined semantics.',
    nist: ['SA-17 (5) (b)']
  },
  'CCI-003339': {
    def: 'The organization requires the developer of the information system, system component, or information system service to internally structure the security-relevant firmware with specific regard for the complete, conceptually simple protection mechanism with precisely defined semantics.',
    nist: ['SA-17 (5) (b)']
  },
  'CCI-003340': {
    def: 'The organization requires the developer of the information system, component, or information system service to structure security-relevant hardware to facilitate testing.',
    nist: ['SA-17 (6)']
  },
  'CCI-003341': {
    def: 'The organization requires the developer of the information system, component, or information system service to structure security-relevant software to facilitate testing.',
    nist: ['SA-17 (6)']
  },
  'CCI-003342': {
    def: 'The organization requires the developer of the information system, component, or information system service to structure security-relevant firmware to facilitate testing.',
    nist: ['SA-17 (6)']
  },
  'CCI-003343': {
    def: 'The organization requires the developer of the information system, component, or information system service to structure security-relevant hardware to facilitate controlling access with least privilege.',
    nist: ['SA-17 (7)']
  },
  'CCI-003344': {
    def: 'The organization requires the developer of the information system, component, or information system service to structure security-relevant software to facilitate controlling access with least privilege.',
    nist: ['SA-17 (7)']
  },
  'CCI-003345': {
    def: 'The organization requires the developer of the information system, component, or information system service to structure security-relevant firmware to facilitate controlling access with least privilege.',
    nist: ['SA-17 (7)']
  },
  'CCI-003346': {
    def: 'The organization implements a tamper protection program for the information system, system component, or information system service.',
    nist: ['SA-18']
  },
  'CCI-003347': {
    def: 'The organization employs anti-tamper technologies and techniques during multiple phases in the system development life cycle including design.',
    nist: ['SA-18 (1)']
  },
  'CCI-003348': {
    def: 'The organization employs anti-tamper technologies and techniques during multiple phases in the system development life cycle including development.',
    nist: ['SA-18 (1)']
  },
  'CCI-003349': {
    def: 'The organization employs anti-tamper technologies and techniques during multiple phases in the system development life cycle including integration.',
    nist: ['SA-18 (1)']
  },
  'CCI-003350': {
    def: 'The organization employs anti-tamper technologies and techniques during multiple phases in the system development life cycle including operations.',
    nist: ['SA-18 (1)']
  },
  'CCI-003351': {
    def: 'The organization employs anti-tamper technologies and techniques during multiple phases in the system development life cycle including maintenance.',
    nist: ['SA-18 (1)']
  },
  'CCI-003352': {
    def: 'The organization inspects organization-defined information systems, system components, or devices at random, at an organization-defined frequency, and/or upon organization-defined indications of need for inspection to detect tampering.',
    nist: ['SA-18 (2)']
  },
  'CCI-003353': {
    def: 'The organization defines the information systems, system components, or devices to inspect at random, at an organization-defined frequency, and/or upon organization-defined indications of need for inspection to detect tampering.',
    nist: ['SA-18 (2)']
  },
  'CCI-003354': {
    def: 'The organization defines the frequency on which to inspect organization-defined information systems, system components, or devices to detect tampering.',
    nist: ['SA-18 (2)']
  },
  'CCI-003355': {
    def: 'The organization defines indications of need for inspection to detect tampering during inspections of organization-defined information systems, system components, or devices.',
    nist: ['SA-18 (2)']
  },
  'CCI-003356': {
    def: 'The organization develops an anti-counterfeit policy that includes the means to detect counterfeit components from entering the information system.',
    nist: ['SA-19 a']
  },
  'CCI-003357': {
    def: 'The organization develops an anti-counterfeit policy that includes the means to prevent counterfeit components from entering the information system.',
    nist: ['SA-19 a']
  },
  'CCI-003358': {
    def: 'The organization develops anti-counterfeit procedures that include the means to detect counterfeit components from entering the information system.',
    nist: ['SA-19 a']
  },
  'CCI-003359': {
    def: 'The organization develops anti-counterfeit procedures that include the means to prevent counterfeit components from entering the information system.',
    nist: ['SA-19 a']
  },
  'CCI-003360': {
    def: 'The organization implements an anti-counterfeit policy that includes the means to detect counterfeit components from entering the information system.',
    nist: ['SA-19 a']
  },
  'CCI-003361': {
    def: 'The organization implements an anti-counterfeit policy that includes the means to prevent counterfeit components from entering the information system.',
    nist: ['SA-19 a']
  },
  'CCI-003362': {
    def: 'The organization implements anti-counterfeit procedures that include the means to detect counterfeit components from entering the information system.',
    nist: ['SA-19 a']
  },
  'CCI-003363': {
    def: 'The organization implements anti-counterfeit procedures that include the means to prevent counterfeit components from entering the information system.',
    nist: ['SA-19 a']
  },
  'CCI-003364': {
    def: 'The organization reports counterfeit information system components to the source of the counterfeit component, organization-defined external reporting organizations, and/or organization-defined personnel or roles.',
    nist: ['SA-19 b']
  },
  'CCI-003365': {
    def: 'The organization defines the external reporting organizations to which counterfeit information system components are to be reported.',
    nist: ['SA-19 b']
  },
  'CCI-003366': {
    def: 'The organization defines the personnel or roles to whom counterfeit information system components are to be reported.',
    nist: ['SA-19 b']
  },
  'CCI-003367': {
    def: 'The organization trains organization-defined personnel or roles to detect counterfeit information system components (including hardware, software, and firmware).',
    nist: ['SA-19 (1)']
  },
  'CCI-003368': {
    def: 'The organization defines the personnel or roles to be trained to detect counterfeit information system components (including hardware, software, and firmware).',
    nist: ['SA-19 (1)']
  },
  'CCI-003369': {
    def: 'The organization maintains configuration control over organization-defined information system components awaiting service/repair.',
    nist: ['SA-19 (2)']
  },
  'CCI-003370': {
    def: 'The organization defines the information system components awaiting service/repair over which configuration control must be maintained.',
    nist: ['SA-19 (2)']
  },
  'CCI-003371': {
    def: 'The organization maintains configuration control over serviced/repaired components awaiting return to service.',
    nist: ['SA-19 (2)']
  },
  'CCI-003388': {
    def: 'The organization defines the frequency on which to scan for counterfeit information system components.',
    nist: ['SA-19 (4)']
  },
  'CCI-003389': {
    def: 'The organization scans for counterfeit information system components in accordance with organization-defined frequency.',
    nist: ['SA-19 (4)']
  },
  'CCI-003390': {
    def: 'The organization defines the techniques and methods used to dispose of information system components.',
    nist: ['SA-19 (3)']
  },
  'CCI-003391': {
    def: 'The organization disposes of information system components using organization-defined techniques and methods.',
    nist: ['SA-19 (3)']
  },
  'CCI-003386': {
    def: 'The organization defines the critical information system components to re-implement or custom develop.',
    nist: ['SA-20']
  },
  'CCI-003387': {
    def: 'The organization re-implements or custom develops organization-defined critical information system components.',
    nist: ['SA-20']
  },
  'CCI-003377': {
    def: 'The organization defines the actions the developer of the information system, system component, or information system service must take to ensure the required screening criteria are satisfied.',
    nist: ['SA-21 (1)']
  },
  'CCI-003378': {
    def: 'The organization defines the actions the developer of the information system, system component, or information system service must take to ensure the required access authorizations are satisfied.',
    nist: ['SA-21 (1)']
  },
  'CCI-003379': {
    def: 'The organization requires the developer of the information system, system component, or information system service take organization-defined actions to ensure the required screening criteria are satisfied.',
    nist: ['SA-21 (1)']
  },
  'CCI-003380': {
    def: 'The organization requires the developer of the information system, system component, or information system service take organization-defined actions to ensure the required access authorizations are satisfied.',
    nist: ['SA-21 (1)']
  },
  'CCI-003381': {
    def: 'The organization defines additional personnel screening criteria that must be satisfied by the developer of an organization-defined information system, system component, or information system service.',
    nist: ['SA-21 b']
  },
  'CCI-003382': {
    def: 'The organization requires that the developer of an organization-defined information system, system component, or information system service satisfy organization-defined additional personnel screening criteria.',
    nist: ['SA-21 b']
  },
  'CCI-003383': {
    def: 'The organization defines the official government duties to be assigned to the developer of an organization-defined information system, system component, or information system service.',
    nist: ['SA-21 a']
  },
  'CCI-003384': {
    def: 'The organization defines the information system, system component, or information system service which requires the information system developer to have appropriate access authorizations and satisfy additional personnel screening criteria.',
    nist: ['SA-21  ']
  },
  'CCI-003385': {
    def: 'The organization requires that the developer of an organization-defined information system, system component, or information system service have appropriate access authorizations as determined by assigned organization-defined official government duties.',
    nist: ['SA-21 a']
  },
  'CCI-002377': {
    def: 'The organization documents the system and communications protection policy.',
    nist: ['SC-1 a 1']
  },
  'CCI-002378': {
    def: 'The organization defines the personnel or roles to be recipients of the system and communications protection policy.',
    nist: ['SC-1 a 1']
  },
  'CCI-002379': {
    def: 'The organization documents procedures to facilitate the implementation of the system and communications protection policy and associated system and communications protection controls.',
    nist: ['SC-1 a 2']
  },
  'CCI-002380': {
    def: 'The organization defines the personnel or roles to be recipients of the procedures to facilitate the implementation of the system and communications protection policy and associated system and communications protection controls.',
    nist: ['SC-1 a 2']
  },
  'CCI-002381': {
    def: 'The organization minimizes the number of nonsecurity functions included within the isolation boundary containing security functions.',
    nist: ['SC-3 (3)']
  },
  'CCI-002382': {
    def: 'The organization implements security functions as largely independent modules that maximize internal cohesiveness within modules and minimize coupling between modules.',
    nist: ['SC-3 (4)']
  },
  'CCI-002383': {
    def: 'The organization defines the procedures to be employed to prevent unauthorized information transfer via shared resources when system processing explicitly switches between different information classification levels or security categories.',
    nist: ['SC-4 (2)']
  },
  'CCI-002384': {
    def: 'The information system prevents unauthorized information transfer via shared resources in accordance with organization-defined procedures when system processing explicitly switches between different information classification levels or security categories.',
    nist: ['SC-4 (2)']
  },
  'CCI-002385': {
    def: 'The information system protects against or limits the effects of organization-defined types of denial of service attacks by employing organization-defined security safeguards.',
    nist: ['SC-5']
  },
  'CCI-002386': {
    def: 'The organization defines the security safeguards to be employed to protect the information system against, or limit the effects of, denial of service attacks.',
    nist: ['SC-5']
  },
  'CCI-002387': {
    def: 'The organization defines the denial of service attacks against other information systems that the information system is to restrict the ability of individuals to launch.',
    nist: ['SC-5 (1)']
  },
  'CCI-002388': {
    def: 'The organization defines a list of monitoring tools to be employed to detect indicators of denial of service attacks against the information system.',
    nist: ['SC-5 (3) (a)']
  },
  'CCI-002389': {
    def: 'The organization employs an organization-defined list of monitoring tools to detect indicators of denial of service attacks against the information system.',
    nist: ['SC-5 (3) (a)']
  },
  'CCI-002390': {
    def: 'The organization defines the information system resources to be monitored to determine if sufficient resources exist to prevent effective denial of service attacks.',
    nist: ['SC-5 (3) (b)']
  },
  'CCI-002391': {
    def: 'The organization monitors organization-defined information system resources to determine if sufficient resources exist to prevent effective denial of service attacks.',
    nist: ['SC-5 (3) (b)']
  },
  'CCI-002392': {
    def: 'The organization defines the resources to be allocated to protect the availability of information system resources.',
    nist: ['SC-6']
  },
  'CCI-002393': {
    def: 'The organization defines the security safeguards to be employed to protect the availability of information system resources.',
    nist: ['SC-6']
  },
  'CCI-002394': {
    def: 'The information system protects the availability of resources by allocating organization-defined resources based on priority, quota, and/or organization-defined security safeguards.',
    nist: ['SC-6']
  },
  'CCI-002395': {
    def: 'The information system implements subnetworks for publicly accessible system components that are physically and/or logically separated from internal organizational networks.',
    nist: ['SC-7 b']
  },
  'CCI-002396': {
    def: 'The organization protects the confidentiality and integrity of the information being transmitted across each interface for each external telecommunication service.',
    nist: ['SC-7 (4) (c)']
  },
  'CCI-002397': {
    def: 'The information system, in conjunction with a remote device, prevents the device from simultaneously establishing non-remote connections with the system and communicating via some other connection to resources in external networks.',
    nist: ['SC-7 (7)']
  },
  'CCI-002398': {
    def: 'The information system detects outgoing communications traffic posing a threat to external information systems.',
    nist: ['SC-7 (9) (a)']
  },
  'CCI-002399': {
    def: 'The information system denies outgoing communications traffic posing a threat to external information systems.',
    nist: ['SC-7 (9) (a)']
  },
  'CCI-002400': {
    def: 'The information system audits the identity of internal users associated with denied outgoing communications traffic posing a threat to external information systems.',
    nist: ['SC-7 (9) (b)']
  },
  'CCI-002401': {
    def: 'The organization defines the authorized sources from which the information system will allow incoming communications.',
    nist: ['SC-7 (11)']
  },
  'CCI-002402': {
    def: 'The organization defines the authorized destinations for routing inbound communications.',
    nist: ['SC-7 (11)']
  },
  'CCI-002403': {
    def: 'The information system only allows incoming communications from organization-defined authorized sources routed to organization-defined authorized destinations.',
    nist: ['SC-7 (11)']
  },
  'CCI-002404': {
    def: 'The organization defines the host-based boundary protection mechanisms that are to be implemented at organization-defined information system components.',
    nist: ['SC-7 (12)']
  },
  'CCI-002405': {
    def: 'The organization defines the information system components at which organization-defined host-based boundary protection mechanisms will be implemented.',
    nist: ['SC-7 (12)']
  },
  'CCI-002406': {
    def: 'The organization implements organization-defined host-based boundary protection mechanisms at organization-defined information system components.',
    nist: ['SC-7 (12)']
  },
  'CCI-002407': {
    def: 'The organization defines the managed interfaces at which the organization protects against unauthorized physical connections.',
    nist: ['SC-7 (14)']
  },
  'CCI-002408': {
    def: 'The organization defines the independently configured communication clients, which are configured by end users and external service providers, between which the information system will block both inbound and outbound communications traffic.',
    nist: ['SC-7 (19)']
  },
  'CCI-002409': {
    def: 'The information system blocks both inbound and outbound communications traffic between organization-defined communication clients that are independently configured by end users and external service providers.',
    nist: ['SC-7 (19)']
  },
  'CCI-002410': {
    def: 'The organization defines information system components that are to be dynamically isolated/segregated from other components of the information system.',
    nist: ['SC-7 (20)']
  },
  'CCI-002411': {
    def: 'The information system provides the capability to dynamically isolate/segregate organization-defined information system components from other components of the system.',
    nist: ['SC-7 (20)']
  },
  'CCI-002412': {
    def: 'The organization defines the information system components supporting organization-defined missions and/or business functions that are to be separated using boundary protection mechanisms.',
    nist: ['SC-7 (21)']
  },
  'CCI-002413': {
    def: 'The organization defines the information system components supporting organization-defined missions and/or business functions that are to be separated using boundary protection mechanisms.',
    nist: ['SC-7 (21)']
  },
  'CCI-002414': {
    def: 'The organization defines the missions and/or business functions for which boundary protection mechanisms will be employed to separate the supporting organization-defined information system components.',
    nist: ['SC-7 (21)']
  },
  'CCI-002415': {
    def: 'The organization employs boundary protection mechanisms to separate organization-defined information system components supporting organization-defined missions and/or business functions.',
    nist: ['SC-7 (21)']
  },
  'CCI-002416': {
    def: 'The information system implements separate network addresses (i.e., different subnets) to connect to systems in different security domains.',
    nist: ['SC-7 (22)']
  },
  'CCI-002417': {
    def: 'The information system disables feedback to senders on protocol format validation failure.',
    nist: ['SC-7 (23)']
  },
  'CCI-002418': {
    def: 'The information system protects the confidentiality and/or integrity of transmitted information.',
    nist: ['SC-8']
  },
  'CCI-002419': {
    def: 'The organization defines the alternative physical safeguards to be employed when cryptographic mechanisms are not implemented to protect information during transmission.',
    nist: ['SC-8 (1)']
  },
  'CCI-002420': {
    def: 'The information system maintains the confidentiality and/or integrity of information during preparation for transmission.',
    nist: ['SC-8 (2)']
  },
  'CCI-002421': {
    def: 'The information system implements cryptographic mechanisms to prevent unauthorized disclosure of information and/or detect changes to information during transmission unless otherwise protected by organization-defined alternative physical safeguards.',
    nist: ['SC-8 (1)']
  },
  'CCI-002422': {
    def: 'The information system maintains the confidentiality and/or integrity of information during reception.',
    nist: ['SC-8 (2)']
  },
  'CCI-002423': {
    def: 'The information system implements cryptographic mechanisms to protect message externals (e.g., message headers and routing information) unless otherwise protected by organization-defined alternative physical safeguards.',
    nist: ['SC-8 (3)']
  },
  'CCI-002424': {
    def: 'The organization defines the alternative physical safeguards to be employed when cryptographic mechanisms are not implemented by the information system.',
    nist: ['SC-8 (4)']
  },
  'CCI-002425': {
    def: 'The information system implements cryptographic mechanisms to conceal or randomize communication patterns unless otherwise protected by organization-defined alternative physical safeguards.',
    nist: ['SC-8 (4)']
  },
  'CCI-002427': {
    def: 'The organization defines the alternative physical safeguards to be employed to protect message externals (e.g., message headers and routing information) when cryptographic mechanisms are not implemented.',
    nist: ['SC-8 (3)']
  },
  'CCI-002426': {
    def: 'The information system provides a trusted communications path that is logically isolated and distinguishable from other paths.',
    nist: ['SC-11 (1)']
  },
  'CCI-002428': {
    def: 'The organization defines the requirements for cryptographic key generation to be employed within the information system.',
    nist: ['SC-12']
  },
  'CCI-002429': {
    def: 'The organization defines the requirements for cryptographic key distribution to be employed within the information system.',
    nist: ['SC-12']
  },
  'CCI-002430': {
    def: 'The organization defines the requirements for cryptographic key storage to be employed within the information system.',
    nist: ['SC-12']
  },
  'CCI-002431': {
    def: 'The organization defines the requirements for cryptographic key access to be employed within the information system.',
    nist: ['SC-12']
  },
  'CCI-002432': {
    def: 'The organization defines the requirements for cryptographic key destruction to be employed within the information system.',
    nist: ['SC-12']
  },
  'CCI-002433': {
    def: 'The organization establishes cryptographic keys for required cryptography employed within the information system in accordance with organization-defined requirements for key generation.',
    nist: ['SC-12']
  },
  'CCI-002434': {
    def: 'The organization establishes cryptographic keys for required cryptography employed within the information system in accordance with organization-defined requirements for key distribution.',
    nist: ['SC-12']
  },
  'CCI-002435': {
    def: 'The organization establishes cryptographic keys for required cryptography employed within the information system in accordance with organization-defined requirements for key storage.',
    nist: ['SC-12']
  },
  'CCI-002436': {
    def: 'The organization establishes cryptographic keys for required cryptography employed within the information system in accordance with organization-defined requirements for key access.',
    nist: ['SC-12']
  },
  'CCI-002437': {
    def: 'The organization establishes cryptographic keys for required cryptography employed within the information system in accordance with organization-defined requirements for key destruction.',
    nist: ['SC-12']
  },
  'CCI-002438': {
    def: 'The organization manages cryptographic keys for required cryptography employed within the information system in accordance with organization-defined requirements for key generation.',
    nist: ['SC-12']
  },
  'CCI-002439': {
    def: 'The organization manages cryptographic keys for required cryptography employed within the information system in accordance with organization-defined requirements for key distribution.',
    nist: ['SC-12']
  },
  'CCI-002440': {
    def: 'The organization manages cryptographic keys for required cryptography employed within the information system in accordance with organization-defined requirements for key storage.',
    nist: ['SC-12']
  },
  'CCI-002441': {
    def: 'The organization manages cryptographic keys for required cryptography employed within the information system in accordance with organization-defined requirements for key access.',
    nist: ['SC-12']
  },
  'CCI-002442': {
    def: 'The organization manages cryptographic keys for required cryptography employed within the information system in accordance with organization-defined requirements for key destruction.',
    nist: ['SC-12']
  },
  'CCI-002443': {
    def: 'The organization produces symmetric cryptographic keys using NIST FIPS-compliant or NSA-approved key management technology and processes.',
    nist: ['SC-12 (2)']
  },
  'CCI-002444': {
    def: 'The organization controls symmetric cryptographic keys using NIST FIPS-compliant or NSA-approved key management technology and processes.',
    nist: ['SC-12 (2)']
  },
  'CCI-002445': {
    def: 'The organization distributes symmetric cryptographic keys using NIST FIPS-compliant or NSA-approved key management technology and processes.',
    nist: ['SC-12 (2)']
  },
  'CCI-002446': {
    def: 'The organization produces asymmetric cryptographic keys using: NSA-approved key management technology and processes; approved PKI Class 3 certificates or prepositioned keying material; or approved PKI Class 3 or Class 4 certificates and hardware security tokens that protect the user^s private key.',
    nist: ['SC-12 (3)']
  },
  'CCI-002447': {
    def: 'The organization controls asymmetric cryptographic keys using: NSA-approved key management technology and processes; approved PKI Class 3 certificates or prepositioned keying material; or approved PKI Class 3 or Class 4 certificates and hardware security tokens that protect the user^s private key.',
    nist: ['SC-12 (3)']
  },
  'CCI-002448': {
    def: 'The organization distributes asymmetric cryptographic keys using: NSA-approved key management technology and processes; approved PKI Class 3 certificates or prepositioned keying material; or approved PKI Class 3 or Class 4 certificates and hardware security tokens that protect the user^s private key.',
    nist: ['SC-12 (3)']
  },
  'CCI-002449': {
    def: 'The organization defines the cryptographic uses, and type of cryptography required for each use, to be implemented by the information system.',
    nist: ['SC-13']
  },
  'CCI-002450': {
    def: 'The information system implements organization-defined cryptographic uses and type of cryptography required for each use in accordance with applicable federal laws, Executive Orders, directives, policies, regulations, and standards.',
    nist: ['SC-13']
  },
  'CCI-002451': {
    def: 'The organization defines the information systems or information system components from which collaborative computing devices in organization-defined secure work areas are to be disabled or removed.',
    nist: ['SC-15 (3)']
  },
  'CCI-002452': {
    def: 'The organization defines the online meetings and teleconferences for which the information system provides an explicit indication of current participants.',
    nist: ['SC-15 (4)']
  },
  'CCI-002453': {
    def: 'The information system provides an explicit indication of current participants in organization-defined online meetings and teleconferences.',
    nist: ['SC-15 (4)']
  },
  'CCI-002454': {
    def: 'The organization defines the security attributes the information system is to associate with the information being exchanged between information systems and between information system components.',
    nist: ['SC-16']
  },
  'CCI-002455': {
    def: 'The information system associates organization-defined security attributes with information exchanged between information system components.',
    nist: ['SC-16']
  },
  'CCI-002456': {
    def: 'The organization defines the certificate policy employed to issue public key certificates.',
    nist: ['SC-17']
  },
  'CCI-002457': {
    def: 'The organization defines the corrective actions to be taken when organization-defined unacceptable mobile code is identified.',
    nist: ['SC-18 (1)']
  },
  'CCI-002458': {
    def: 'The organization defines what constitutes unacceptable mobile code for its information systems.',
    nist: ['SC-18 (1)']
  },
  'CCI-002459': {
    def: 'The organization defines the unacceptable mobile code of which the information system is to prevent download and execution.',
    nist: ['SC-18 (3)']
  },
  'CCI-002460': {
    def: 'The information system enforces organization-defined actions prior to executing mobile code.',
    nist: ['SC-18 (4)']
  },
  'CCI-002461': {
    def: 'The organization allows execution of permitted mobile code only in confined virtual machine environments.',
    nist: ['SC-18 (5)']
  },
  'CCI-002462': {
    def: 'The information system provides additional data integrity verification artifacts along with the authoritative name resolution data the system returns in response to external name/address resolution queries.',
    nist: ['SC-20 a']
  },
  'CCI-002463': {
    def: 'The information system provides data origin artifacts for internal name/address resolution queries.',
    nist: ['SC-20 (2)']
  },
  'CCI-002464': {
    def: 'The information system provides data integrity protection artifacts for internal name/address resolution queries.',
    nist: ['SC-20 (2)']
  },
  'CCI-002465': {
    def: 'The information system requests data origin authentication verification on the name/address resolution responses the system receives from authoritative sources.',
    nist: ['SC-21']
  },
  'CCI-002466': {
    def: 'The information system requests data integrity verification on the name/address resolution responses the system receives from authoritative sources.',
    nist: ['SC-21']
  },
  'CCI-002467': {
    def: 'The information system performs data integrity verification on the name/address resolution responses the system receives from authoritative sources.',
    nist: ['SC-21']
  },
  'CCI-002468': {
    def: 'The information system performs data origin verification authentication on the name/address resolution responses the system receives from authoritative sources.',
    nist: ['SC-21']
  },
  'CCI-002469': {
    def: 'The organization defines the certificate authorities the information system will allow to be used on the information system.',
    nist: ['SC-23 (5)']
  },
  'CCI-002470': {
    def: 'The information system only allows the use of organization-defined certificate authorities for verification of the establishment of protected sessions.',
    nist: ['SC-23 (5)']
  },
  'CCI-002471': {
    def: 'The organization defines the information system components, with minimal functionality and information storage, to be employed.',
    nist: ['SC-25']
  },
  'CCI-002472': {
    def: 'The organization defines the information at rest that is to be protected by the information system.',
    nist: ['SC-28']
  },
  'CCI-002473': {
    def: 'The organization defines the information at rest for which cryptographic mechanisms will be implemented.',
    nist: ['SC-28 (1)']
  },
  'CCI-002474': {
    def: 'The organization defines the information system components which require the implementation of cryptographic mechanisms to prevent unauthorized disclosure and modification of organization-defined information at rest.',
    nist: ['SC-28 (1)']
  },
  'CCI-002475': {
    def: 'The information system implements cryptographic mechanisms to prevent unauthorized modification of organization-defined information at rest on organization-defined information system components.',
    nist: ['SC-28 (1)']
  },
  'CCI-002476': {
    def: 'The information system implements cryptographic mechanisms to prevent unauthorized disclosure of organization-defined information at rest on organization-defined information system components.',
    nist: ['SC-28 (1)']
  },
  'CCI-002477': {
    def: 'The organization defines the information at rest to be removed from online storage and stored in an off-line secure location.',
    nist: ['SC-28 (2)']
  },
  'CCI-002478': {
    def: 'The organization removes organization-defined information at rest from online storage.',
    nist: ['SC-28 (2)']
  },
  'CCI-002479': {
    def: 'The organization stores organization-defined information at rest in an off-line secure location.',
    nist: ['SC-28 (2)']
  },
  'CCI-002480': {
    def: 'The organization defines the information system components for which a diverse set of information technologies are to be employed.',
    nist: ['SC-29']
  },
  'CCI-002481': {
    def: 'The organization employs virtualization techniques to support the deployment of a diversity of applications that are changed per organization-defined frequency.',
    nist: ['SC-29 (1)']
  },
  'CCI-002482': {
    def: 'The organization defines the concealment and misdirection techniques employed for organization-defined information systems to confuse and mislead adversaries.',
    nist: ['SC-30']
  },
  'CCI-002483': {
    def: 'The organization defines the information systems for which organization-defined concealment and misdirection techniques are to be employed.',
    nist: ['SC-30']
  },
  'CCI-002484': {
    def: 'The organization defines the time periods at which it will employ organization-defined concealment and misdirection techniques on organization-defined information systems.',
    nist: ['SC-30']
  },
  'CCI-002485': {
    def: 'The organization employs organization-defined concealment and misdirection techniques for organization-defined information systems at organization-defined time periods to confuse and mislead adversaries.',
    nist: ['SC-30']
  },
  'CCI-002486': {
    def: 'The organization defines the techniques to be employed to introduce randomness into organizational operations and assets.',
    nist: ['SC-30 (2)']
  },
  'CCI-002487': {
    def: 'The organization employs organization-defined techniques to introduce randomness into organizational operations.',
    nist: ['SC-30 (2)']
  },
  'CCI-002488': {
    def: 'The organization employs organization-defined techniques to introduce randomness into organizational assets.',
    nist: ['SC-30 (2)']
  },
  'CCI-002489': {
    def: 'The organization defines the processing and/or storage locations to be changed at random intervals or at an organization-defined frequency.',
    nist: ['SC-30 (3)']
  },
  'CCI-002490': {
    def: 'The organization defines the frequency at which it changes the location of organization-defined processing and/or storage.',
    nist: ['SC-30 (3)']
  },
  'CCI-002491': {
    def: 'The organization changes the location of organization-defined processing and/or storage at an organization-defined time frequency or at random time intervals.',
    nist: ['SC-30 (3)']
  },
  'CCI-002492': {
    def: 'The organization changes the location of organization-defined processing and/or storage at an organization-defined time frequency or at random time intervals.',
    nist: ['SC-30 (3)']
  },
  'CCI-002493': {
    def: 'The organization defines the information system components in which it will employ realistic but misleading information regarding its security state or posture.',
    nist: ['SC-30 (4)']
  },
  'CCI-002494': {
    def: 'The organization employs realistic, but misleading, information in organization-defined information system components with regard to its security state or posture.',
    nist: ['SC-30 (4)']
  },
  'CCI-002495': {
    def: 'The organization defines the techniques to be employed to hide or conceal organization-defined information system components.',
    nist: ['SC-30 (5)']
  },
  'CCI-002496': {
    def: 'The organization defines the information system components to be hidden or concealed.',
    nist: ['SC-30 (5)']
  },
  'CCI-002497': {
    def: 'The organization employs organization-defined techniques to hide or conceal organization-defined information system components.',
    nist: ['SC-30 (5)']
  },
  'CCI-002498': {
    def: 'The organization performs a covert channel analysis to identify those aspects of communications within the information system that are potential avenues for covert storage and/or timing channels.',
    nist: ['SC-31 a']
  },
  'CCI-002499': {
    def: 'The organization estimates the maximum bandwidth of the covert storage and timing channels.',
    nist: ['SC-31 b']
  },
  'CCI-002500': {
    def: 'The organization defines the maximum bandwidth values to which covert storage and/or timing channels are to be reduced.',
    nist: ['SC-31 (2)']
  },
  'CCI-002501': {
    def: 'The organization reduces the maximum bandwidth for identified covert storage and/or timing channels to organization-defined values.',
    nist: ['SC-31 (2)']
  },
  'CCI-002502': {
    def: 'The organization defines the subset of identified covert channels in the operational environment of the information system that are to have the bandwidth measured.',
    nist: ['SC-31 (3)']
  },
  'CCI-002503': {
    def: 'The organization measures the bandwidth of an organization-defined subset of identified covert channels in the operational environment of the information system.',
    nist: ['SC-31 (3)']
  },
  'CCI-002504': {
    def: 'The organization defines the information system components into which the information system is partitioned.',
    nist: ['SC-32']
  },
  'CCI-002505': {
    def: 'The organization defines the circumstances under which the information system components are to be physically separated to support partitioning.',
    nist: ['SC-32']
  },
  'CCI-002506': {
    def: 'The organization partitions the information system into organization-defined information system components residing in separate physical domains or environments based on organization-defined circumstances for physical separation of components.',
    nist: ['SC-32']
  },
  'CCI-002507': {
    def: 'The organization controls read-only media after information has been recorded onto the media.',
    nist: ['SC-34 (2)']
  },
  'CCI-002508': {
    def: 'The organization defines the information system firmware components for which hardware-based, write-protect is employed.',
    nist: ['SC-34 (3) (a)']
  },
  'CCI-002509': {
    def: 'The organization employs hardware-based, write-protect for organization-defined information system firmware components.',
    nist: ['SC-34 (3) (a)']
  },
  'CCI-002510': {
    def: 'The organization defines the individuals authorized to manually disable hardware-based, write-protect for firmware modifications and re-enable the write-protect prior to returning to operational mode.',
    nist: ['SC-34 (3) (b)']
  },
  'CCI-002511': {
    def: 'The organization implements specific procedures for organization-defined authorized individuals to manually disable hardware-based, write-protect for firmware modifications.',
    nist: ['SC-34 (3) (b)']
  },
  'CCI-002512': {
    def: 'The organization implements specific procedures for organization-defined authorized individuals to manually re-enable hardware write-protect prior to returning to operational mode.',
    nist: ['SC-34 (3) (b)']
  },
  'CCI-002513': {
    def: 'The organization defines the processing that is to be distributed across multiple physical locations.',
    nist: ['SC-36']
  },
  'CCI-002514': {
    def: 'The organization defines the storage that is to be distributed across multiple physical locations.',
    nist: ['SC-36']
  },
  'CCI-002515': {
    def: 'The organization distributes organization-defined processing across multiple physical locations.',
    nist: ['SC-36']
  },
  'CCI-002516': {
    def: 'The organization distributes organization-defined storage across multiple physical locations.',
    nist: ['SC-36']
  },
  'CCI-002517': {
    def: 'The organization defines the distributed processing components that are to be polled to identify potential faults, errors, or compromises.',
    nist: ['SC-36 (1)']
  },
  'CCI-002518': {
    def: 'The organization defines the distributed storage components that are to be polled to identify potential faults, errors, or compromises.',
    nist: ['SC-36 (1)']
  },
  'CCI-002519': {
    def: 'The organization employs polling techniques to identify potential faults, errors, or compromises to organization-defined distributed processing components.',
    nist: ['SC-36 (1)']
  },
  'CCI-002520': {
    def: 'The organization employs polling techniques to identify potential faults, errors, or compromises to organization-defined distributed storage components.',
    nist: ['SC-36 (1)']
  },
  'CCI-002521': {
    def: 'The organization defines the out-of-band channels to be employed for the physical delivery or electronic transmission of organization-defined information, information system components, or devices.',
    nist: ['SC-37']
  },
  'CCI-002522': {
    def: 'The organization defines the information, information system components, or devices that are to be electronically transmitted or physically delivered via organization-defined out-of-band channels.',
    nist: ['SC-37']
  },
  'CCI-002523': {
    def: 'The organization defines the individuals or information systems authorized to be recipients of organization-defined information, information system components, or devices to be delivered by employing organization-defined out-of-band channels for electronic transmission or physical delivery.',
    nist: ['SC-37']
  },
  'CCI-002524': {
    def: 'The organization employs organization-defined out-of-band channels for the electronic transmission or physical delivery of organization-defined information, information system components, or devices to organization-defined individuals or information systems.',
    nist: ['SC-37']
  },
  'CCI-002525': {
    def: 'The organization defines the security safeguards to be employed to ensure only organization-defined individuals or information systems receive organization-defined information, information system components, or devices.',
    nist: ['SC-37 (1)']
  },
  'CCI-002526': {
    def: 'The organization defines the information, information system components, or devices which are to be received only by organization-defined individuals or information systems.',
    nist: ['SC-37 (1)']
  },
  'CCI-002527': {
    def: 'The organization employs organization-defined security safeguards to ensure only organization-defined individuals or information systems receive the organization-defined information, information system components, or devices.',
    nist: ['SC-37 (1)']
  },
  'CCI-003599': {
    def: 'The organization defines the individuals or information systems to be the only recipients of organization-defined information, information system components, or devices, by employing organization-defined security safeguards.',
    nist: ['SC-37 (1)']
  },
  'CCI-002528': {
    def: 'The organization defines the operations security safeguards to be employed to protect key organizational information throughout the system development life cycle.',
    nist: ['SC-38']
  },
  'CCI-002529': {
    def: 'The organization employs organization-defined operations security safeguards to protect key organizational information throughout the system development life cycle.',
    nist: ['SC-38']
  },
  'CCI-002530': {
    def: 'The information system maintains a separate execution domain for each executing process.',
    nist: ['SC-39']
  },
  'CCI-002531': {
    def: 'The information system implements underlying hardware separation mechanisms to facilitate process separation.',
    nist: ['SC-39 (1)']
  },
  'CCI-002532': {
    def: 'The organization defines the multi-threaded processing in which a separate execution domain is maintained by the information system for each thread.',
    nist: ['SC-39 (2)']
  },
  'CCI-002533': {
    def: 'The information system maintains a separate execution domain for each thread in organization-defined multi-threaded processing.',
    nist: ['SC-39 (2)']
  },
  'CCI-002534': {
    def: 'The organization defines types of signal parameter attacks or references to sources for such attacks from which the information system protects organization-defined wireless links.',
    nist: ['SC-40']
  },
  'CCI-002535': {
    def: 'The organization defines the external and internal wireless links the information system is to protect from organization-defined types of signal parameter attacks or references to sources for such attacks.',
    nist: ['SC-40']
  },
  'CCI-002536': {
    def: 'The information system protects organization-defined external and internal wireless links from organization-defined types of signal parameter attacks or references to sources for such attacks.',
    nist: ['SC-40']
  },
  'CCI-002537': {
    def: 'The organization defines the level of protection against the effects of intentional electromagnetic interference to be achieved by implemented cryptographic mechanisms.',
    nist: ['SC-40 (1)']
  },
  'CCI-002538': {
    def: 'The information system implements cryptographic mechanisms that achieve an organization-defined level of protection against the effects of intentional electromagnetic interference.',
    nist: ['SC-40 (1)']
  },
  'CCI-002539': {
    def: 'The organization defines the level of reduction the information system is to implement to reduce the detection potential of wireless links.',
    nist: ['SC-40 (2)']
  },
  'CCI-002540': {
    def: 'The information system implements cryptographic mechanisms to reduce the detection potential of wireless links to an organization-defined level of reduction.',
    nist: ['SC-40 (2)']
  },
  'CCI-002541': {
    def: 'The information system implements cryptographic mechanisms to identify and reject wireless transmissions that are deliberate attempts to achieve imitative or manipulative communications deception based on signal parameters.',
    nist: ['SC-40 (3)']
  },
  'CCI-002542': {
    def: 'The organization defines the wireless transmitters that are to have cryptographic mechanisms implemented by the information system to prevent the identification of the wireless transmitters.',
    nist: ['SC-40 (4)']
  },
  'CCI-002543': {
    def: 'The information system implements cryptographic mechanisms to prevent the identification of organization-defined wireless transmitters by using the transmitter signal parameters.',
    nist: ['SC-40 (4)']
  },
  'CCI-002544': {
    def: 'The organization defines the information systems or information system components on which organization-defined connection ports or input/output devices are to be physically disabled or removed.',
    nist: ['SC-41']
  },
  'CCI-002545': {
    def: 'The organization defines the connection ports or input/output devices that are to be physically disabled or removed from organization-defined information systems or information system components.',
    nist: ['SC-41']
  },
  'CCI-002546': {
    def: 'The organization physically disables or removes organization-defined connection ports or input/output devices on organization-defined information systems or information system components.',
    nist: ['SC-41']
  },
  'CCI-002547': {
    def: 'The organization defines the exceptions where remote activation of sensors is allowed.',
    nist: ['SC-42 a']
  },
  'CCI-002548': {
    def: 'The information system prohibits the remote activation of environmental sensing capabilities except for the organization-defined exceptions where remote activation of sensors is allowed.',
    nist: ['SC-42 a']
  },
  'CCI-002549': {
    def: 'The organization defines the class of users to receive explicit indication of sensor use.',
    nist: ['SC-42 b']
  },
  'CCI-002550': {
    def: 'The information system provides an explicit indication of sensor use to the organization-defined class of users.',
    nist: ['SC-42 b']
  },
  'CCI-002551': {
    def: 'The organization defines the sensors to be configured so that collected data or information is reported only to authorized individuals or roles.',
    nist: ['SC-42 (1)']
  },
  'CCI-002552': {
    def: 'The organization ensures that the information system is configured so that data or information collected by the organization-defined sensors is only reported to authorized individuals or roles.',
    nist: ['SC-42 (1)']
  },
  'CCI-002553': {
    def: 'The organization defines the measures to be employed to ensure data or information collected by organization-defined sensors is used only for authorized purposes.',
    nist: ['SC-42 (2)']
  },
  'CCI-002554': {
    def: 'The organization defines the sensors that are to collect data or information for authorized purposes.',
    nist: ['SC-42 (2)']
  },
  'CCI-002555': {
    def: 'The organization employs organization-defined measures, so that data or information collected by organization-defined sensors is only used for authorized purposes.',
    nist: ['SC-42 (2)']
  },
  'CCI-002556': {
    def: 'The organization defines the environmental sensing capabilities prohibited on devices used in organization-defined facilities, areas, or systems.',
    nist: ['SC-42 (3)']
  },
  'CCI-002557': {
    def: 'The organization defines the facilities, areas, or systems where devices processing organization-defined environmental sensing capabilities are prohibited.',
    nist: ['SC-42 (3)']
  },
  'CCI-002558': {
    def: 'The organization prohibits the use of devices possessing organization-defined environmental sensing capabilities in organization-defined facilities, areas, or systems.',
    nist: ['SC-42 (3)']
  },
  'CCI-002559': {
    def: 'The organization defines the information system components for which usage restrictions and implementation guidance are to be established.',
    nist: ['SC-43 a']
  },
  'CCI-002560': {
    def: 'The organization establishes usage restrictions and implementation guidance for organization-defined information system components based on the potential to cause damage to the information system if used maliciously.',
    nist: ['SC-43 a']
  },
  'CCI-002561': {
    def: 'The organization authorizes the use of organization-defined information system components which have the potential to cause damage to the information system if used maliciously.',
    nist: ['SC-43 b']
  },
  'CCI-002562': {
    def: 'The organization monitors the use of organization-defined information system components which have the potential to cause damage to the information system if used maliciously.',
    nist: ['SC-43 b']
  },
  'CCI-002563': {
    def: 'The organization controls the use of organization-defined information system components which have the potential to cause damage to the information system if used maliciously.',
    nist: ['SC-43 b']
  },
  'CCI-002564': {
    def: 'The organization defines the information system, system component, or location where a detonation chamber (i.e., dynamic execution environments) capability is employed.',
    nist: ['SC-44']
  },
  'CCI-002565': {
    def: 'The organization employs a detonation chamber (i.e., dynamic execution environments) capability within an organization-defined information system, system component, or location.',
    nist: ['SC-44']
  },
  'CCI-002601': {
    def: 'The organization defines the personnel or roles to whom the system and information integrity policy and procedures are to be disseminated.',
    nist: ['SI-1 a']
  },
  'CCI-002602': {
    def: 'The organization tests firmware updates related to flaw remediation for effectiveness before installation.',
    nist: ['SI-2 b']
  },
  'CCI-002603': {
    def: 'The organization tests firmware updates related to flaw remediation for potential side effects before installation.',
    nist: ['SI-2 b']
  },
  'CCI-002604': {
    def: 'The organization defines the time period following the release of updates within which security-related software updates are to be installed.',
    nist: ['SI-2 c']
  },
  'CCI-002605': {
    def: 'The organization installs security-relevant software updates within an organization-defined time period of the release of the updates.',
    nist: ['SI-2 c']
  },
  'CCI-002606': {
    def: 'The organization defines the time period following the release of updates within which security-related firmware updates are to be installed.',
    nist: ['SI-2 c']
  },
  'CCI-002607': {
    def: 'The organization installs security-relevant firmware updates within an organization-defined time period of the release of the updates.',
    nist: ['SI-2 c']
  },
  'CCI-002608': {
    def: 'The organization establishes organization-defined benchmarks for the time taken to apply corrective actions after flaw identification.',
    nist: ['SI-2 (3) (b)']
  },
  'CCI-002609': {
    def: 'The organization defines the information system components on which organization-defined security-relevant software updates will be automatically installed.',
    nist: ['SI-2 (5)']
  },
  'CCI-002610': {
    def: 'The organization defines the information system components on which organization-defined security-relevant firmware updates will be automatically installed.',
    nist: ['SI-2 (5)']
  },
  'CCI-002611': {
    def: 'The organization defines the security-relevant software updates to be automatically installed on organization-defined information system components.',
    nist: ['SI-2 (5)']
  },
  'CCI-002612': {
    def: 'The organization defines the security-relevant firmware updates to be automatically installed on organization-defined information system components.',
    nist: ['SI-2 (5)']
  },
  'CCI-002613': {
    def: 'The organization installs organization-defined security-relevant software updates automatically to organization-defined information system components.',
    nist: ['SI-2 (5)']
  },
  'CCI-002614': {
    def: 'The organization installs organization-defined security-relevant firmware updates automatically to organization-defined information system components.',
    nist: ['SI-2 (5)']
  },
  'CCI-002615': {
    def: 'The organization defines the software components to be removed (e.g., previous versions) after updated versions have been installed.',
    nist: ['SI-2 (6)']
  },
  'CCI-002616': {
    def: 'The organization defines the firmware components to be removed (e.g., previous versions) after updated versions have been installed.',
    nist: ['SI-2 (6)']
  },
  'CCI-002617': {
    def: 'The organization removes organization-defined software components (e.g., previous versions) after updated versions have been installed.',
    nist: ['SI-2 (6)']
  },
  'CCI-002618': {
    def: 'The organization removes organization-defined firmware components (e.g., previous versions) after updated versions have been installed.',
    nist: ['SI-2 (6)']
  },
  'CCI-002619': {
    def: 'The organization employs malicious code protection mechanisms at information system entry points to detect malicious code.',
    nist: ['SI-3 a']
  },
  'CCI-002620': {
    def: 'The organization employs malicious code protection mechanisms at information system exit points to detect malicious code.',
    nist: ['SI-3 a']
  },
  'CCI-002621': {
    def: 'The organization employs malicious code protection mechanisms at information system entry points to eradicate malicious code.',
    nist: ['SI-3 a']
  },
  'CCI-002622': {
    def: 'The organization employs malicious code protection mechanisms at information system exit points to eradicate malicious code.',
    nist: ['SI-3 a']
  },
  'CCI-002623': {
    def: 'The organization defines the frequency for performing periodic scans of the information system for malicious code.',
    nist: ['SI-3 c 1']
  },
  'CCI-002624': {
    def: 'The organization configures malicious code protection mechanisms to perform real-time scans of files from external sources at network entry/exit points as the files are downloaded, opened, or executed in accordance with organizational security policy.',
    nist: ['SI-3 c 1']
  },
  'CCI-002625': {
    def: 'The organization, when testing malicious code protection mechanisms, verifies the detection of the test case occurs.',
    nist: ['SI-3 (6) (b)']
  },
  'CCI-002626': {
    def: 'The organization, when testing malicious code protection mechanisms, verifies the incident reporting of the test case occurs.',
    nist: ['SI-3 (6) (b)']
  },
  'CCI-002627': {
    def: 'The information system implements nonsignature-based malicious code detection mechanisms.',
    nist: ['SI-3 (7)']
  },
  'CCI-002628': {
    def: 'The organization defines the unauthorized operating system commands that are to be detected through the kernel application programming interface by organization-defined information system hardware components.',
    nist: ['SI-3 (8)']
  },
  'CCI-002629': {
    def: 'The organization defines the information system hardware components that are to detect organization-defined unauthorized operating system commands through the kernel programming application interface.',
    nist: ['SI-3 (8)']
  },
  'CCI-002630': {
    def: 'The information system detects organization-defined unauthorized operating system commands through the kernel application programming interface at organization-defined information system hardware components.',
    nist: ['SI-3 (8)']
  },
  'CCI-002631': {
    def: 'The information system issues a warning, audits the command execution, or prevents the execution of the command when organization-defined unauthorized operating system commands are detected.',
    nist: ['SI-3 (8)']
  },
  'CCI-002632': {
    def: 'The organization defines the remote commands that are to be authenticated using organization-defined safeguards for malicious code protection.',
    nist: ['SI-3 (9)']
  },
  'CCI-002633': {
    def: 'The organization defines the security safeguards to be implemented to authenticate organization-defined remote commands for malicious code protection.',
    nist: ['SI-3 (9)']
  },
  'CCI-002634': {
    def: 'The organization defines the tools to be employed to analyze the characteristics and behavior of malicious code.',
    nist: ['SI-3 (10) (a)']
  },
  'CCI-002635': {
    def: 'The organization defines the techniques to be employed to analyze the characteristics and behavior of malicious code.',
    nist: ['SI-3 (10) (a)']
  },
  'CCI-002636': {
    def: 'The organization employs organization-defined tools to analyze the characteristics and behavior of malicious code.',
    nist: ['SI-3 (10) (a)']
  },
  'CCI-002637': {
    def: 'The information system implements organization-defined security safeguards to authenticate organization-defined remote commands for malicious code protection.',
    nist: ['SI-3 (9)']
  },
  'CCI-002638': {
    def: 'The organization employs organization-defined techniques to analyze the characteristics and behavior of malicious code.',
    nist: ['SI-3 (10) (a)']
  },
  'CCI-002639': {
    def: 'The organization incorporates the results from malicious code analysis into organizational incident response processes.',
    nist: ['SI-3 (10) (b)']
  },
  'CCI-002640': {
    def: 'The organization incorporates the results from malicious code analysis into organizational flaw remediation processes.',
    nist: ['SI-3 (10) (b)']
  },
  'CCI-002641': {
    def: 'The organization monitors the information system to detect attacks and indicators of potential attacks in accordance with organization-defined monitoring objectives.',
    nist: ['SI-4 a 1']
  },
  'CCI-002642': {
    def: 'The organization monitors the information system to detect unauthorized local connections.',
    nist: ['SI-4 a 2']
  },
  'CCI-002643': {
    def: 'The organization monitors the information system to detect unauthorized network connections.',
    nist: ['SI-4 a 2']
  },
  'CCI-002644': {
    def: 'The organization monitors the information system to detect unauthorized remote connections.',
    nist: ['SI-4 a 2']
  },
  'CCI-002645': {
    def: 'The organization defines the techniques and methods to be used to identify unauthorized use of the information system.',
    nist: ['SI-4 b']
  },
  'CCI-002646': {
    def: 'The organization identifies unauthorized use of the information system through organization-defined techniques and methods.',
    nist: ['SI-4 b']
  },
  'CCI-002647': {
    def: 'The organization protects information obtained from intrusion-monitoring tools from unauthorized access.',
    nist: ['SI-4 d']
  },
  'CCI-002648': {
    def: 'The organization protects information obtained from intrusion-monitoring tools from unauthorized modification.',
    nist: ['SI-4 d']
  },
  'CCI-002649': {
    def: 'The organization protects information obtained from intrusion-monitoring tools from unauthorized deletion.',
    nist: ['SI-4 d']
  },
  'CCI-002650': {
    def: 'The organization defines the information system monitoring information that is to be provided the organization-defined personnel or roles.',
    nist: ['SI-4 g']
  },
  'CCI-002651': {
    def: 'The organization defines the personnel or roles that are to be provided organization-defined information system monitoring information.',
    nist: ['SI-4 g']
  },
  'CCI-002652': {
    def: 'The organization defines the frequency at which the organization will provide the organization-defined information system monitoring information to organization-defined personnel or roles.',
    nist: ['SI-4 g']
  },
  'CCI-002653': {
    def: 'The organization provides organization-defined information system monitoring information to organization-defined personnel or roles as needed or per organization-defined frequency.',
    nist: ['SI-4']
  },
  'CCI-002654': {
    def: 'The organization provides organization-defined information system monitoring information to organization-defined personnel or roles as needed or per organization-defined frequency.',
    nist: ['SI-4 g']
  },
  'CCI-002655': {
    def: 'The organization connects individual intrusion detection tools into an information system-wide intrusion detection system.',
    nist: ['SI-4 (1)']
  },
  'CCI-002656': {
    def: 'The organization configures individual intrusion detection tools into an information system-wide intrusion detection system.',
    nist: ['SI-4 (1)']
  },
  'CCI-002657': {
    def: 'The organization employs automated tools to integrate intrusion detection tools into access control mechanisms for rapid response to attacks by enabling reconfiguration of these mechanisms in support of attack isolation and elimination.',
    nist: ['SI-4 (3)']
  },
  'CCI-002658': {
    def: 'The organization employs automated tools to integrate intrusion detection tools into flow control mechanisms for rapid response to attacks by enabling reconfiguration of these mechanisms in support of attack isolation and elimination.',
    nist: ['SI-4 (3)']
  },
  'CCI-002659': {
    def: 'The organization defines the frequency on which it will monitor inbound communications for unusual or unauthorized activities or conditions.',
    nist: ['SI-4 (4)']
  },
  'CCI-002660': {
    def: 'The organization defines the frequency on which it will monitor outbound communications for unusual or unauthorized activities or conditions.',
    nist: ['SI-4 (4)']
  },
  'CCI-002661': {
    def: 'The information system monitors inbound communications traffic per organization-defined frequency for unusual or unauthorized activities or conditions.',
    nist: ['SI-4 (4)']
  },
  'CCI-002662': {
    def: 'The information system monitors outbound communications traffic per organization-defined frequency for unusual or unauthorized activities or conditions.',
    nist: ['SI-4 (4)']
  },
  'CCI-002663': {
    def: 'The organization defines the personnel or roles to receive information system alerts when organization-defined indicators of compromise or potential compromise occur.',
    nist: ['SI-4 (5)']
  },
  'CCI-002664': {
    def: 'The information system alerts organization-defined personnel or roles when organization-defined compromise indicators reflect the occurrence of a compromise or a potential compromise.',
    nist: ['SI-4 (5)']
  },
  'CCI-002665': {
    def: 'The organization defines the encrypted communications traffic that is to be visible to organization-defined information system monitoring tools.',
    nist: ['SI-4 (10)']
  },
  'CCI-002666': {
    def: 'The organization defines the information system monitoring tools that will have visibility into organization-defined encrypted communications traffic.',
    nist: ['SI-4 (10)']
  },
  'CCI-002667': {
    def: 'The organization makes provisions so that organization-defined encrypted communications traffic is visible to organization-defined information system monitoring tools.',
    nist: ['SI-4 (10)']
  },
  'CCI-002668': {
    def: 'The organization defines the interior points within the information system (e.g., subnetworks, subsystems) where outbound communications will be analyzed to discover anomalies.',
    nist: ['SI-4 (11)']
  },
  'CCI-002669': {
    def: 'The organization uses the traffic/event profiles in tuning system-monitoring devices to reduce the number of false positives and false negatives.',
    nist: ['SI-4 (13) (c)']
  },
  'CCI-002670': {
    def: 'The organization defines the interior points within the system (e.g., subsystems, subnetworks) where outbound communications will be analyzed to detect covert exfiltration of information.',
    nist: ['SI-4 (18)']
  },
  'CCI-002671': {
    def: 'The organization analyzes outbound communications traffic at the external boundary of the information system (i.e., system perimeter) to detect covert exfiltration of information.',
    nist: ['SI-4 (18)']
  },
  'CCI-002672': {
    def: 'The organization analyzes outbound communications traffic at organization-defined interior points within the system (e.g., subsystems, subnetworks) to detect covert exfiltration of information.',
    nist: ['SI-4 (18)']
  },
  'CCI-002673': {
    def: 'The organization defines the additional monitoring to be implemented for individuals identified as posing an increased level of risk.',
    nist: ['SI-4 (19)']
  },
  'CCI-002674': {
    def: 'The organization defines the sources that may be used to identify individuals who pose an increased level of risk.',
    nist: ['SI-4 (19)']
  },
  'CCI-002675': {
    def: 'The organization implements organization-defined additional monitoring of individuals who have been identified by organization-defined sources as posing an increased level of risk.',
    nist: ['SI-4 (19)']
  },
  'CCI-002676': {
    def: 'The organization defines additional monitoring to be implemented for privileged users.',
    nist: ['SI-4 (20)']
  },
  'CCI-002677': {
    def: 'The organization implements organization-defined additional monitoring of privileged users.',
    nist: ['SI-4 (20)']
  },
  'CCI-002678': {
    def: 'The organization defines additional monitoring to be implemented for individuals during an organization-defined probationary period.',
    nist: ['SI-4 (21)']
  },
  'CCI-002679': {
    def: 'The organization defines the probationary period during which additional monitoring will be implemented for individuals.',
    nist: ['SI-4 (21)']
  },
  'CCI-002680': {
    def: 'The organization implements organization-defined additional monitoring of individuals during an organization-defined probationary period.',
    nist: ['SI-4 (21)']
  },
  'CCI-002681': {
    def: 'The organization defines the authorization or approval process for network services.',
    nist: ['SI-4 (22)']
  },
  'CCI-002682': {
    def: 'The organization defines the personnel or roles to be alerted when unauthorized or unapproved network services are detected.',
    nist: ['SI-4 (22)']
  },
  'CCI-002683': {
    def: 'The information system detects network services that have not been authorized or approved by the organization-defined authorization or approval processes.',
    nist: ['SI-4 (22)']
  },
  'CCI-002684': {
    def: 'The information system audits and/or alerts organization-defined personnel when unauthorized network services are detected.',
    nist: ['SI-4 (22)']
  },
  'CCI-002685': {
    def: 'The organization defines the host-based monitoring mechanisms to be implemented at organization-defined information system components.',
    nist: ['SI-4 (23)']
  },
  'CCI-002686': {
    def: 'The organization defines the information system components at which organization-defined host-based monitoring mechanisms are to be implemented.',
    nist: ['SI-4 (23)']
  },
  'CCI-002687': {
    def: 'The organization implements organization-defined host-based monitoring mechanisms at organization-defined information system components.',
    nist: ['SI-4 (23)']
  },
  'CCI-002688': {
    def: 'The information system discovers indicators of compromise.',
    nist: ['SI-4 (24)']
  },
  'CCI-002689': {
    def: 'The information system collects indicators of compromise.',
    nist: ['SI-4 (24)']
  },
  'CCI-002690': {
    def: 'The information system distributes indicators of compromise.',
    nist: ['SI-4 (24)']
  },
  'CCI-002691': {
    def: 'The information system uses indicators of compromise.',
    nist: ['SI-4 (24)']
  },
  'CCI-002692': {
    def: 'The organization defines the external organizations from which it receives information system security alerts, advisories, and directives.',
    nist: ['SI-5 a']
  },
  'CCI-002693': {
    def: 'The organization defines the elements within the organization to whom the organization will disseminate security alerts, advisories, and directives.',
    nist: ['SI-5 c']
  },
  'CCI-002694': {
    def: 'The organization defines the external organizations to which the organization will disseminate security alerts, advisories, and directives.',
    nist: ['SI-5 c']
  },
  'CCI-002695': {
    def: 'The organization defines the security functions that require verification of correct operation.',
    nist: ['SI-6 a']
  },
  'CCI-002696': {
    def: 'The information system verifies correct operation of organization-defined security functions.',
    nist: ['SI-6 a']
  },
  'CCI-002697': {
    def: 'The organization defines the frequency at which it will verify correct operation of organization-defined security functions.',
    nist: ['SI-6 b']
  },
  'CCI-002698': {
    def: 'The organization defines the system transitional states when the information system will verify correct operation of organization-defined security functions.',
    nist: ['SI-6 b']
  },
  'CCI-002699': {
    def: 'The information system performs verification of the correct operation of organization-defined security functions: when the system is in an organization-defined transitional state; upon command by a user with appropriate privileges; and/or on an organization-defined frequency.',
    nist: ['SI-6 b']
  },
  'CCI-002700': {
    def: 'The organization defines the personnel or roles to be notified when security verification tests fail.',
    nist: ['SI-6 c']
  },
  'CCI-002701': {
    def: 'The organization defines alternative action(s) to be taken when the information system discovers anomalies in the operation of organization-defined security functions.',
    nist: ['SI-6 d']
  },
  'CCI-002702': {
    def: 'The information system shuts the information system down, restarts the information system, and/or initiates organization-defined alternative action(s) when anomalies in the operation of the organization-defined security functions are discovered.',
    nist: ['SI-6 d']
  },
  'CCI-002703': {
    def: 'The organization defines the software, firmware, and information which will be subjected to integrity verification tools to detect unauthorized changes.',
    nist: ['SI-7']
  },
  'CCI-002704': {
    def: 'The organization employs integrity verification tools to detect unauthorized changes to organization-defined software, firmware, and information.',
    nist: ['SI-7']
  },
  'CCI-002705': {
    def: 'The organization defines the software on which integrity checks will be performed.',
    nist: ['SI-7 (1)']
  },
  'CCI-002706': {
    def: 'The organization defines the firmware on which integrity checks will be performed.',
    nist: ['SI-7 (1)']
  },
  'CCI-002707': {
    def: 'The organization defines the information on which integrity checks will be performed.',
    nist: ['SI-7 (1)']
  },
  'CCI-002708': {
    def: 'The organization defines the transitional state or security-relevant events when the information system will perform integrity checks on software, firmware, and information.',
    nist: ['SI-7 (1)']
  },
  'CCI-002709': {
    def: 'The organization defines the frequency at which it will perform integrity checks of software, firmware, and information.',
    nist: ['SI-7 (1)']
  },
  'CCI-002710': {
    def: 'The information system performs an integrity check of organization-defined software at startup, at organization-defined transitional states or security-relevant events, or on an organization-defined frequency.',
    nist: ['SI-7 (1)']
  },
  'CCI-002711': {
    def: 'The information system performs an integrity check of organization-defined firmware at startup, at organization-defined transitional states or security-relevant events, or on an organization-defined frequency.',
    nist: ['SI-7 (1)']
  },
  'CCI-002712': {
    def: 'The information system performs an integrity check of organization-defined information at startup, at organization-defined transitional states or security-relevant events, or on an organization-defined frequency.',
    nist: ['SI-7 (1)']
  },
  'CCI-002713': {
    def: 'The organization defines the personnel or roles to be notified when discrepancies are discovered during integrity verification.',
    nist: ['SI-7 (2)']
  },
  'CCI-002714': {
    def: 'The organization defines the security safeguards that are to be employed when integrity violations are discovered.',
    nist: ['SI-7 (5)']
  },
  'CCI-002715': {
    def: 'The information system automatically shuts the information system down, restarts the information system, and/or implements organization-defined security safeguards when integrity violations are discovered.',
    nist: ['SI-7 (5)']
  },
  'CCI-002716': {
    def: 'The information system implements cryptographic mechanisms to detect unauthorized changes to software.',
    nist: ['SI-7 (6)']
  },
  'CCI-002717': {
    def: 'The information system implements cryptographic mechanisms to detect unauthorized changes to firmware.',
    nist: ['SI-7 (6)']
  },
  'CCI-002718': {
    def: 'The information system implements cryptographic mechanisms to detect unauthorized changes to information.',
    nist: ['SI-7 (6)']
  },
  'CCI-002719': {
    def: 'The organization defines the unauthorized security-relevant changes to the information system that are to be incorporated into the organizational incident response capability.',
    nist: ['SI-7 (7)']
  },
  'CCI-002720': {
    def: 'The organization incorporates the detection of unauthorized organization-defined security-relevant changes to the information system into the organizational incident response capability.',
    nist: ['SI-7 (7)']
  },
  'CCI-002721': {
    def: 'The organization defines the personnel or roles that are to be alerted by the information system when it detects a potential integrity violation.',
    nist: ['SI-7 (8)']
  },
  'CCI-002722': {
    def: 'The organization defines other actions that can be taken when the information system detects a potential integrity violation.',
    nist: ['SI-7 (8)']
  },
  'CCI-002723': {
    def: 'The information system, upon detection of a potential integrity violation, provides the capability to audit the event.',
    nist: ['SI-7 (8)']
  },
  'CCI-002724': {
    def: 'The information system, upon detection of a potential integrity violation, initiates one or more of the following actions: generates an audit record; alerts the current user; alerts organization-defined personnel or roles; and/or organization-defined other actions.',
    nist: ['SI-7 (8)']
  },
  'CCI-002725': {
    def: 'The organization defines the devices which will have the integrity of the boot process verified.',
    nist: ['SI-7 (9)']
  },
  'CCI-002726': {
    def: 'The information system verifies the integrity of the boot process of organization-defined devices.',
    nist: ['SI-7 (9)']
  },
  'CCI-002727': {
    def: 'The organization defines the security safeguards to be implemented to protect the integrity of the boot firmware in organization-defined devices.',
    nist: ['SI-7 (10)']
  },
  'CCI-002728': {
    def: 'The organization defines the devices on which organization-defined security safeguards will be implemented to protect the integrity of the boot firmware.',
    nist: ['SI-7 (10)']
  },
  'CCI-002729': {
    def: 'The information system implements organization-defined security safeguards to protect the integrity of boot firmware in organization-defined devices.',
    nist: ['SI-7 (10)']
  },
  'CCI-002730': {
    def: 'The organization defines the user-installed software that is to be executed in a confined physical or virtual machine environment with limited privileges.',
    nist: ['SI-7 (11)']
  },
  'CCI-002731': {
    def: 'The organization requires that organization-defined user-installed software execute in a confined physical or virtual machine environment with limited privileges.',
    nist: ['SI-7 (11)']
  },
  'CCI-002732': {
    def: 'The organization defines the user-installed software that is to have its integrity verified prior to execution.',
    nist: ['SI-7 (12)']
  },
  'CCI-002733': {
    def: 'The organization requires that the integrity of organization-defined user-installed software be verified prior to execution.',
    nist: ['SI-7 (12)']
  },
  'CCI-002734': {
    def: 'The organization defines the personnel or roles which have the authority to explicitly approve binary or machine-executable code.',
    nist: ['SI-7 (13)']
  },
  'CCI-002735': {
    def: 'The organization allows execution of binary or machine-executable code obtained from sources with limited or no warranty and without the provision of source code only in confined physical or virtual machine environments.',
    nist: ['SI-7 (13)']
  },
  'CCI-002736': {
    def: 'The organization allows execution of binary or machine-executable code obtained from sources with limited or no warranty and without the provision of source code only with the explicit approval of organization-defined personnel or roles.',
    nist: ['SI-7 (13)']
  },
  'CCI-002737': {
    def: 'The organization prohibits the use of binary or machine-executable code from sources with limited or no warranty and without the provision of source code.',
    nist: ['SI-7 (14) (a)']
  },
  'CCI-002738': {
    def: 'The organization provides exceptions to the source code requirement only for compelling mission/operational requirements and with the approval of the authorizing official.',
    nist: ['SI-7 (14) (b)']
  },
  'CCI-002739': {
    def: 'The organization defines the software or firmware components on which cryptographic mechanisms are to be implemented to support authentication prior to installation.',
    nist: ['SI-7 (15)']
  },
  'CCI-002740': {
    def: 'The information system implements cryptographic mechanisms to authenticate organization-defined software or firmware components prior to installation.',
    nist: ['SI-7 (15)']
  },
  'CCI-002741': {
    def: 'The organization employs spam protection mechanisms at information system entry points to detect and take action on unsolicited messages.',
    nist: ['SI-8 a']
  },
  'CCI-002742': {
    def: 'The organization employs spam protection mechanisms at information system exit points to detect and take action on unsolicited messages.',
    nist: ['SI-8 a']
  },
  'CCI-002743': {
    def: 'The information system implements spam protection mechanisms with a learning capability to more effectively identify legitimate communications traffic.',
    nist: ['SI-8 (3)']
  },
  'CCI-002744': {
    def: 'The organization defines the inputs on which the information system is to conduct validity checks.',
    nist: ['SI-10']
  },
  'CCI-002745': {
    def: 'The organization defines the inputs for which the information system provides a manual override capability for input validation.',
    nist: ['SI-10 (1) (a)']
  },
  'CCI-002746': {
    def: 'The information system provides a manual override capability for input validation of organization-defined inputs.',
    nist: ['SI-10 (1) (a)']
  },
  'CCI-002747': {
    def: 'The organization defines the individuals who have the authorization to use the manual override capability for input validation.',
    nist: ['SI-10 (1) (b)']
  },
  'CCI-002748': {
    def: 'The information system restricts the use of the manual override capability to only organization-defined authorized individuals.',
    nist: ['SI-10 (1) (b)']
  },
  'CCI-002749': {
    def: 'The information system audits the use of the manual override capability.',
    nist: ['SI-10 (1) (c)']
  },
  'CCI-002750': {
    def: 'The organization defines the time period within which input validation errors are to be reviewed.',
    nist: ['SI-10 (2)']
  },
  'CCI-002751': {
    def: 'The organization defines the time period within which input validation errors are to be resolved.',
    nist: ['SI-10 (2)']
  },
  'CCI-002752': {
    def: 'The organization ensures that input validation errors are reviewed within an organization-defined time period.',
    nist: ['SI-10 (2)']
  },
  'CCI-002753': {
    def: 'The organization ensures that input validation errors are resolved within an organization-defined time period.',
    nist: ['SI-10 (2)']
  },
  'CCI-002754': {
    def: 'The information system behaves in a predictable and documented manner that reflects organizational and system objectives when invalid inputs are received.',
    nist: ['SI-10 (3)']
  },
  'CCI-002755': {
    def: 'The organization accounts for timing interactions among information system components in determining appropriate responses for invalid inputs.',
    nist: ['SI-10 (4)']
  },
  'CCI-002756': {
    def: 'The organization defines the trusted sources to which the usage of information inputs will be restricted (e.g., whitelisting).',
    nist: ['SI-10 (5)']
  },
  'CCI-002757': {
    def: 'The organization defines the acceptable formats to which information inputs are restricted.',
    nist: ['SI-10 (5)']
  },
  'CCI-002758': {
    def: 'The organization restricts the use of information inputs to organization-defined trusted sources and/or organization-defined formats.',
    nist: ['SI-10 (5)']
  },
  'CCI-002759': {
    def: 'The organization defines the personnel or roles to whom error messages are to be revealed.',
    nist: ['SI-11 b']
  },
  'CCI-002760': {
    def: 'The organization determines mean time to failure (MTTF) for organization-defined information system components in specific environments of operation.',
    nist: ['SI-13 a']
  },
  'CCI-002761': {
    def: 'The organization defines the system components in specific environments of operation for which the mean time to failure (MTTF) is to be determined.',
    nist: ['SI-13 a']
  },
  'CCI-002762': {
    def: 'The organization defines the mean time to failure (MTTF) substitution criteria to be employed as a means to determine the need to exchange active and standby components.',
    nist: ['SI-13 b']
  },
  'CCI-002763': {
    def: 'The organization provides a means to exchange active and standby components in accordance with the organization-defined mean time to failure (MTTF) substitution criteria.',
    nist: ['SI-13 b']
  },
  'CCI-002764': {
    def: 'The organization defines non-persistent information system components and services to be implemented.',
    nist: ['SI-14']
  },
  'CCI-002765': {
    def: 'The organization defines the frequency at which it will terminate organization-defined non-persistent information system components and services.',
    nist: ['SI-14']
  },
  'CCI-002766': {
    def: 'The organization implements organization-defined non-persistence information system components and services that are initiated in a known state.',
    nist: ['SI-14']
  },
  'CCI-002767': {
    def: 'The organization implements organization-defined non-persistence information system components and services that are terminated upon end of session of use and/or periodically at an organization-defined frequency.',
    nist: ['SI-14']
  },
  'CCI-002768': {
    def: 'The organization defines the trusted sources from which it obtains software and data employed during the refreshing of non-persistent information system components and services.',
    nist: ['SI-14 (1)']
  },
  'CCI-002769': {
    def: 'The organization ensures that software and data employed during non-persistent information system component and service refreshes are obtained from organization-defined trusted sources.',
    nist: ['SI-14 (1)']
  },
  'CCI-002770': {
    def: 'The organization defines the software programs and/or applications from which the information system is to validate the information output to ensure the information is consistent with expected content.',
    nist: ['SI-15']
  },
  'CCI-002771': {
    def: 'The information system validates information output from organization-defined software programs and/or applications to ensure that the information is consistent with the expected content.',
    nist: ['SI-15']
  },
  'CCI-002772': {
    def: 'The organization defines the security safeguards to be implemented to protect the information system^s memory from unauthorized code execution.',
    nist: ['SI-15']
  },
  'CCI-002984': {
    def: 'The organization develops an organization-wide information security program plan that reflects coordination among organizational entities responsible for the different aspects of information security (i.e., technical, physical, personnel, cyber-physical).',
    nist: ['PM-1 a 3']
  },
  'CCI-002985': {
    def: 'The organization disseminates an organization-wide information security program plan that provides an overview of the requirements for the security program and a description of the security program management controls and common controls in place or planned for meeting those requirements.',
    nist: ['PM-1 a 1']
  },
  'CCI-002986': {
    def: 'The organization disseminates an organization-wide information security program plan that includes the identification and assignment of roles, responsibilities, management commitment, coordination among organizational entities, and compliance.',
    nist: ['PM-1 a 2']
  },
  'CCI-002987': {
    def: 'The organization disseminates an organization-wide information security program plan that reflects coordination among organizational entities responsible for the different aspects of information security (i.e., technical, physical, personnel, cyber-physical).',
    nist: ['PM-1 a 3']
  },
  'CCI-002988': {
    def: 'The organization disseminates an organization-wide information security program plan that is approved by a senior official with responsibility and accountability for the risk being incurred to organizational operations (including mission, functions, image, and reputation), organizational assets, individuals, other organizations, and the Nation.',
    nist: ['PM-1 a 4']
  },
  'CCI-002989': {
    def: 'The organization protects the information security program plan from unauthorized disclosure.',
    nist: ['PM-1 d']
  },
  'CCI-002990': {
    def: 'The organization protects the information security program plan from unauthorized modification.',
    nist: ['PM-1 d']
  },
  'CCI-002991': {
    def: 'The organization implements a process for ensuring that plans of action and milestones for the security program and associated organizational information systems are developed.',
    nist: ['PM-4 a 1']
  },
  'CCI-002992': {
    def: 'The organization implements a process for ensuring that plans of action and milestones for the security program and associated organizational information systems are reported in accordance with OMB FISMA reporting requirements.',
    nist: ['PM-4 a 3']
  },
  'CCI-002993': {
    def: 'The organization reviews plans of action and milestones for the security program and associated organization information systems for consistency with the organizational risk management strategy and organization-wide priorities for risk response actions.',
    nist: ['PM-4 b']
  },
  'CCI-002994': {
    def: 'The organization reviews and updates the risk management strategy in accordance with organization-defined frequency or as required, to address organizational changes.',
    nist: ['PM-9 c']
  },
  'CCI-002995': {
    def: 'The organization defines the frequency with which to review and update the risk management strategy to address organizational changes.',
    nist: ['PM-9 c']
  },
  'CCI-002996': {
    def: 'The organization implements an insider threat program that includes a cross-discipline insider threat incident handling team.',
    nist: ['PM-12']
  },
  'CCI-002997': {
    def: 'The organization establishes an information security workforce development and improvement program.',
    nist: ['PM-13']
  },
  'CCI-002998': {
    def: 'The organization implements a process for ensuring that organizational plans for conducting security testing activities associated with organizational information systems are developed.',
    nist: ['PM-14 a 1']
  },
  'CCI-002999': {
    def: 'The organization implements a process for ensuring that organizational plans for conducting security testing activities associated with organizational information systems are maintained.',
    nist: ['PM-14 a 1']
  },
  'CCI-003000': {
    def: 'The organization implements a process for ensuring that organizational plans for conducting security training activities associated with organizational information systems are developed.',
    nist: ['PM-14 a 1']
  },
  'CCI-003001': {
    def: 'The organization implements a process for ensuring that organizational plans for conducting security training activities associated with organizational information systems are maintained.',
    nist: ['PM-14 a 1']
  },
  'CCI-003002': {
    def: 'The organization implements a process for ensuring that organizational plans for conducting security monitoring activities associated with organizational information systems are developed.',
    nist: ['PM-14 a 1']
  },
  'CCI-003003': {
    def: 'The organization implements a process for ensuring that organizational plans for conducting security monitoring activities associated with organizational information systems are maintained.',
    nist: ['PM-14 a 1']
  },
  'CCI-003004': {
    def: 'The organization implements a process for ensuring that organizational plans for conducting security testing associated with organizational information systems continue to be executed in a timely manner.',
    nist: ['PM-14 a 2']
  },
  'CCI-003005': {
    def: 'The organization implements a process for ensuring that organizational plans for conducting security training associated with organizational information systems continue to be executed in a timely manner.',
    nist: ['PM-14 a 2']
  },
  'CCI-003006': {
    def: 'The organization implements a process for ensuring that organizational plans for conducting security monitoring activities associated with organizational information systems continue to be executed in a timely manner.',
    nist: ['PM-14 a 2']
  },
  'CCI-003007': {
    def: 'The organization reviews testing plans for consistency with the organizational risk management strategy and organization-wide priorities for risk response actions.',
    nist: ['PM-14 b']
  },
  'CCI-003008': {
    def: 'The organization reviews training plans for consistency with the organizational risk management strategy and organization-wide priorities for risk response actions.',
    nist: ['PM-14 b']
  },
  'CCI-003009': {
    def: 'The organization reviews monitoring plans for consistency with the organizational risk management strategy and organization-wide priorities for risk response actions.',
    nist: ['PM-14 b']
  },
  'CCI-003010': {
    def: 'The organization establishes and institutionalizes contact with selected groups and associations within the security community to facilitate ongoing security education and training for organizational personnel.',
    nist: ['PM-15 a']
  },
  'CCI-003011': {
    def: 'The organization establishes and institutionalizes contact with selected groups and associations within the security community to maintain currency with recommended security practices, techniques, and technologies.',
    nist: ['PM-15 b']
  },
  'CCI-003012': {
    def: 'The organization establishes and institutionalizes contact with selected groups and associations within the security community to share current security-related information including threats, vulnerabilities, and incidents.',
    nist: ['PM-15 c']
  },
  'CCI-003013': {
    def: 'The organization implements a threat awareness program that includes a cross-organization information-sharing capability.',
    nist: ['PM-16']
  },
  'CCI-003392': {
    def: 'The organization determines and documents the legal authority that permits the collection of personally identifiable information (PII), either generally or in support of a specific program or information system need.',
    nist: ['AP-1']
  },
  'CCI-003393': {
    def: 'The organization determines and documents the legal authority that permits the use of personally identifiable information (PII), either generally or in support of a specific program or information system need.',
    nist: ['AP-1']
  },
  'CCI-003394': {
    def: 'The organization determines and documents the legal authority that permits the maintenance of personally identifiable information (PII), either generally or in support of a specific program or information system need.',
    nist: ['AP-1']
  },
  'CCI-003395': {
    def: 'The organization determines and documents the legal authority that permits the sharing of personally identifiable information (PII), either generally or in support of a specific program or information system need.',
    nist: ['AP-1']
  },
  'CCI-003396': {
    def: 'The organization describes, in its privacy notices, the purpose(s) for which personally identifiable information (PII) is collected.',
    nist: ['AP-2']
  },
  'CCI-003398': {
    def: 'The organization describes, in its privacy notices, the purpose(s) for which personally identifiable information (PII) is used.',
    nist: ['AP-2']
  },
  'CCI-003399': {
    def: 'The organization describes, in its privacy notices, the purpose(s) for which personally identifiable information (PII) is maintained.',
    nist: ['AP-2']
  },
  'CCI-003400': {
    def: 'The organization describes, in its privacy notices, the purpose(s) for which personally identifiable information (PII) is shared.',
    nist: ['AP-2']
  },
  'CCI-003397': {
    def: 'The organization appoints a Senior Agency Official for Privacy (SAOP)/Chief Privacy Officer (CPO) accountable for developing, implementing, and maintaining an organization-wide governance and privacy program to ensure compliance with all applicable laws and regulations regarding the collection, use, maintenance, sharing, and disposal of personally identifiable information (PII) by programs and information systems.',
    nist: ['AR-1 a']
  },
  'CCI-003401': {
    def: 'The organization monitors federal privacy laws and policy for changes that affect the privacy program.',
    nist: ['AR-1 b']
  },
  'CCI-003402': {
    def: 'The organization defines the allocation of budget resources sufficient to implement and operate the organization-wide privacy program.',
    nist: ['AR-1 c']
  },
  'CCI-003403': {
    def: 'The organization defines the allocation of staffing resources sufficient to implement and operate the organization-wide privacy program.',
    nist: ['AR-1 c']
  },
  'CCI-003404': {
    def: 'The organization allocates sufficient organization-defined budget resources to implement and operate the organization-wide privacy program.',
    nist: ['AR-1 c']
  },
  'CCI-003405': {
    def: 'The organization allocates sufficient organization-defined staffing resources to implement and operate the organization-wide privacy program.',
    nist: ['AR-1 c']
  },
  'CCI-003406': {
    def: 'The organization develops a strategic organizational privacy plan for implementing applicable privacy controls, policies, and procedures.',
    nist: ['AR-1 d']
  },
  'CCI-003407': {
    def: 'The organization develops operational privacy policies which govern the appropriate privacy and security controls for programs, information systems, or technologies involving personally identifiable information (PII).',
    nist: ['AR-1 e']
  },
  'CCI-003408': {
    def: 'The organization disseminates operational privacy policies which govern the appropriate privacy and security controls for programs, information systems, or technologies involving personally identifiable information (PII).',
    nist: ['AR-1 e']
  },
  'CCI-003409': {
    def: 'The organization implements operational privacy policies which govern the appropriate privacy and security controls for programs, information systems, or technologies involving personally identifiable information (PII).',
    nist: ['AR-1 e']
  },
  'CCI-003410': {
    def: 'The organization develops operational privacy procedures which govern the appropriate privacy and security controls for programs, information systems, or technologies involving personally identifiable information (PII).',
    nist: ['AR-1 e']
  },
  'CCI-003411': {
    def: 'The organization disseminates operational privacy procedures which govern the appropriate privacy and security controls for programs, information systems, or technologies involving personally identifiable information (PII).',
    nist: ['AR-1 e']
  },
  'CCI-003412': {
    def: 'The organization implements operational privacy procedures which govern the appropriate privacy and security controls for programs, information systems, or technologies involving personally identifiable information (PII).',
    nist: ['AR-1 e']
  },
  'CCI-003413': {
    def: 'The organization defines the frequency, minimally biennially, on which the privacy plan, policies, and procedures are to be updated.',
    nist: ['AR-1 f']
  },
  'CCI-003414': {
    def: 'The organization updates the privacy plan per organization-defined frequency.',
    nist: ['AR-1 f']
  },
  'CCI-003415': {
    def: 'The organization updates the privacy policies per organization-defined frequency.',
    nist: ['AR-1 f']
  },
  'CCI-003416': {
    def: 'The organization updates the privacy procedures per organization-defined frequency.',
    nist: ['AR-1 f']
  },
  'CCI-003417': {
    def: 'The organization documents a privacy risk management process which assesses the privacy risk to individuals.',
    nist: ['AR-2 a']
  },
  'CCI-003418': {
    def: 'The organization implements a privacy risk management process which assesses the privacy risk to individuals.',
    nist: ['AR-2 a']
  },
  'CCI-003419': {
    def: 'The organization^s privacy risk management process assesses the privacy risk to individuals resulting from the collection of personally identifiable information (PII).',
    nist: ['AR-2 a']
  },
  'CCI-003420': {
    def: 'The organization^s privacy risk management process assesses the privacy risk to individuals resulting from the sharing of personally identifiable information (PII).',
    nist: ['AR-2 a']
  },
  'CCI-003421': {
    def: 'The organization^s privacy risk management process assesses the privacy risk to individuals resulting from the storing of personally identifiable information (PII).',
    nist: ['AR-2 a']
  },
  'CCI-003422': {
    def: 'The organization^s privacy risk management process assesses the privacy risk to individuals resulting from the transmitting of personally identifiable information (PII).',
    nist: ['AR-2 a']
  },
  'CCI-003423': {
    def: 'The organization^s privacy risk management process assesses the privacy risk to individuals resulting from the use of personally identifiable information (PII).',
    nist: ['AR-2 a']
  },
  'CCI-003424': {
    def: 'The organization^s privacy risk management process assesses the privacy risk to individuals resulting from the disposal of personally identifiable information (PII).',
    nist: ['AR-2 a']
  },
  'CCI-003425': {
    def: 'The organization conducts Privacy Impact Assessments (PIAs) for information systems, programs, or other activities that pose a privacy risk in accordance with applicable law, OMB policy, or any existing organizational policies and procedures.',
    nist: ['AR-2 b']
  },
  'CCI-003426': {
    def: 'The organization establishes privacy roles for contractors.',
    nist: ['AR-3 a']
  },
  'CCI-003427': {
    def: 'The organization establishes privacy responsibilities for contractors.',
    nist: ['AR-3 a']
  },
  'CCI-003428': {
    def: 'The organization establishes access requirements for contractors.',
    nist: ['AR-3 a']
  },
  'CCI-003429': {
    def: 'The organization establishes privacy roles for service providers.',
    nist: ['AR-3 a']
  },
  'CCI-003430': {
    def: 'The organization establishes privacy responsibilities for service providers.',
    nist: ['AR-3 a']
  },
  'CCI-003431': {
    def: 'The organization establishes access requirements for service providers.',
    nist: ['AR-3 a']
  },
  'CCI-003432': {
    def: 'The organization includes privacy requirements in contracts.',
    nist: ['AR-3 b']
  },
  'CCI-003433': {
    def: 'The organization includes privacy requirements in other acquisition-related documents.',
    nist: ['AR-3 b']
  },
  'CCI-003434': {
    def: 'The organization defines the frequency for monitoring privacy controls and internal privacy policy to ensure effective implementation.',
    nist: ['AR-4']
  },
  'CCI-003435': {
    def: 'The organization defines the frequency for auditing privacy controls and internal privacy policy to ensure effective implementation.',
    nist: ['AR-4']
  },
  'CCI-003436': {
    def: 'The organization monitors privacy controls, per organization-defined frequency, to ensure effective implementation.',
    nist: ['AR-4']
  },
  'CCI-003437': {
    def: 'The organization monitors internal privacy policy to ensure effective implementation.',
    nist: ['AR-4']
  },
  'CCI-003438': {
    def: 'The organization audits privacy controls, per organization-defined frequency, to ensure effective implementation.',
    nist: ['AR-4']
  },
  'CCI-003439': {
    def: 'The organization audits internal privacy policy, per organization-defined frequency, to ensure effective implementation.',
    nist: ['AR-4']
  },
  'CCI-003440': {
    def: 'The organization develops a comprehensive training and awareness strategy aimed at ensuring that personnel understand privacy responsibilities and procedures.',
    nist: ['AR-5 a']
  },
  'CCI-003441': {
    def: 'The organization implements a comprehensive training and awareness strategy aimed at ensuring that personnel understand privacy responsibilities and procedures.',
    nist: ['AR-5 a']
  },
  'CCI-003442': {
    def: 'The organization updates a comprehensive training and awareness strategy aimed at ensuring that personnel understand privacy responsibilities and procedures.',
    nist: ['AR-5 a']
  },
  'CCI-003443': {
    def: 'The organization defines the frequency, minimally annually, for administering its basic privacy training.',
    nist: ['AR-5 b']
  },
  'CCI-003444': {
    def: 'The organization defines the frequency, minimally annually, for administering the targeted, role-based privacy training for personnel having responsibility for personally identifiable information (PII) or for activities that involve PII.',
    nist: ['AR-5 b']
  },
  'CCI-003445': {
    def: 'The organization administers basic privacy training per the organization-defined frequency.',
    nist: ['AR-5 b']
  },
  'CCI-003446': {
    def: 'The organization administers, per organization-defined frequency, targeted, role-based privacy training for personnel having responsibility for personally identifiable information (PII) or for activities that involve PII.',
    nist: ['AR-5 b']
  },
  'CCI-003447': {
    def: 'The organization defines the frequency, minimally annually, on which personnel certify acceptance of responsibilities for privacy requirements.',
    nist: ['AR-5 c']
  },
  'CCI-003448': {
    def: 'The organization ensures personnel certify (manually or electronically) acceptance of responsibilities for privacy requirements per organization-defined frequency.',
    nist: ['AR-5 c']
  },
  'CCI-003449': {
    def: 'The organization develops reports for the Office of Management and Budget (OMB), Congress, and other oversight bodies, as appropriate, to demonstrate accountability with specific statutory and regulatory privacy program mandates.',
    nist: ['AR-6']
  },
  'CCI-003450': {
    def: 'The organization disseminates reports to the Office of Management and Budget (OMB), Congress, and other oversight bodies, as appropriate, to demonstrate accountability with specific statutory and regulatory privacy program mandates.',
    nist: ['AR-6']
  },
  'CCI-003451': {
    def: 'The organization updates reports for the Office of Management and Budget (OMB), Congress, and other oversight bodies, as appropriate, to demonstrate accountability with specific statutory and regulatory privacy program mandates.',
    nist: ['AR-6']
  },
  'CCI-003452': {
    def: 'The organization develops reports for senior management and other personnel with responsibility for monitoring privacy program progress and compliance.',
    nist: ['AR-6']
  },
  'CCI-003453': {
    def: 'The organization disseminates reports to senior management and other personnel with responsibility for monitoring privacy program progress and compliance.',
    nist: ['AR-6']
  },
  'CCI-003454': {
    def: 'The organization updates reports for senior management and other personnel with responsibility for monitoring privacy program progress and compliance.',
    nist: ['AR-6']
  },
  'CCI-003455': {
    def: 'The organization designs information systems to support privacy by automating privacy controls.',
    nist: ['AR-7']
  },
  'CCI-003456': {
    def: 'The organization, as part of the accurate accounting of disclosures of Privacy Act information held in each system of records under its control, includes the date of each disclosure of a record.',
    nist: ['AR-8 a (1)']
  },
  'CCI-003457': {
    def: 'The organization, as part of the accurate accounting of disclosures of Privacy Act information held in each system of records under its control, includes the nature of each disclosure of a record.',
    nist: ['AR-8 a (1)']
  },
  'CCI-003458': {
    def: 'The organization, as part of the accurate accounting of disclosures of Privacy Act information held in each system of records under its control, includes the purpose of each disclosure of a record.',
    nist: ['AR-8 a (1)']
  },
  'CCI-003459': {
    def: 'The organization keeps an accurate accounting of disclosures of Privacy Act information held in each system of records under its control.',
    nist: ['AR-8 a (1)']
  },
  'CCI-003460': {
    def: 'The organization, as part of the accurate accounting of disclosures of Privacy Act information held in each system of records under its control, includes the name and address of the person or agency to which the disclosure was made.',
    nist: ['AR-8 a (2)']
  },
  'CCI-003461': {
    def: 'The organization retains the accounting of disclosures for the life of the record or five years after the disclosure is made, whichever is longer.',
    nist: ['AR-8 b']
  },
  'CCI-003462': {
    def: 'The organization makes the accounting of disclosures available to the person named in the record upon request.',
    nist: ['AR-8 c']
  },
  'CCI-003463': {
    def: 'The organization confirms to the greatest extent practicable upon collection or creation of personally identifiable information (PII), the accuracy of that information.',
    nist: ['DI-1 a']
  },
  'CCI-003464': {
    def: 'The organization confirms to the greatest extent practicable upon collection or creation of personally identifiable information (PII), the relevancy of that information.',
    nist: ['DI-1 a']
  },
  'CCI-003465': {
    def: 'The organization confirms to the greatest extent practicable upon collection or creation of personally identifiable information (PII), the timeliness of that information.',
    nist: ['DI-1 a']
  },
  'CCI-003466': {
    def: 'The organization confirms to the greatest extent practicable upon collection or creation of personally identifiable information (PII), the completeness of that information.',
    nist: ['DI-1 a']
  },
  'CCI-003467': {
    def: 'The organization collects personally identifiable information (PII) directly from the individual to the greatest extent practicable.',
    nist: ['DI-1 b']
  },
  'CCI-003468': {
    def: 'The organization defines the frequency on which it will check for, and correct as necessary, inaccurate or outdated personally identifiable information (PII) used by its programs or systems.',
    nist: ['DI-1 c']
  },
  'CCI-003469': {
    def: 'The organization checks for, and corrects as necessary, any inaccurate or outdated personally identifiable information (PII) used by its programs or systems on an organization-defined frequency.',
    nist: ['DI-1 c']
  },
  'CCI-003470': {
    def: 'The organization issues guidelines ensuring the quality of disseminated Privacy Act information.',
    nist: ['DI-1 d']
  },
  'CCI-003471': {
    def: 'The organization issues guidelines ensuring the utility of disseminated Privacy Act information.',
    nist: ['DI-1 d']
  },
  'CCI-003472': {
    def: 'The organization issues guidelines ensuring the objectivity of disseminated Privacy Act information.',
    nist: ['DI-1 d']
  },
  'CCI-003473': {
    def: 'The organization issues guidelines ensuring the integrity of disseminated Privacy Act information.',
    nist: ['DI-1 d']
  },
  'CCI-003474': {
    def: 'The organization issues guidelines maximizing the quality of disseminated Privacy Act information.',
    nist: ['DI-1 d']
  },
  'CCI-003475': {
    def: 'The organization issues guidelines maximizing the utility of disseminated Privacy Act information.',
    nist: ['DI-1 d']
  },
  'CCI-003476': {
    def: 'The organization issues guidelines maximizing the objectivity of disseminated Privacy Act information.',
    nist: ['DI-1 d']
  },
  'CCI-003477': {
    def: 'The organization issues guidelines maximizing the integrity of disseminated Privacy Act information.',
    nist: ['DI-1 d']
  },
  'CCI-003478': {
    def: 'The organization requests the individual or individual^s authorized representative validate personally identifiable information (PII) during the collection process.',
    nist: ['DI-1 (1)']
  },
  'CCI-003479': {
    def: 'The organization defines the frequency on which it will request the individual, or individual^s authorized representative, revalidate that personally identifiable information (PII) collected is still accurate.',
    nist: ['DI-1 (2)']
  },
  'CCI-003480': {
    def: 'On an organization-defined frequency, the organization requests the individual, or individual^s authorized representative, revalidate that personally identifiable information (PII) collected is still accurate.',
    nist: ['DI-1 (2)']
  },
  'CCI-003481': {
    def: 'The organization documents processes to ensure the integrity of personally identifiable information (PII) through existing security controls.',
    nist: ['DI-2 a']
  },
  'CCI-003482': {
    def: 'The organization, when appropriate, establishes a Data Integrity Board.',
    nist: ['DI-2 b']
  },
  'CCI-003483': {
    def: 'The organization^s Data Integrity Board oversees the organizational Computer Matching Agreements.',
    nist: ['DI-2 b']
  },
  'CCI-003484': {
    def: 'The organization^s Data Integrity Board ensures the Computer Matching Agreements comply with the computer matching provisions of the Privacy Act.',
    nist: ['DI-2 b']
  },
  'CCI-003485': {
    def: 'The organization publishes Computer Matching Agreements on its public website.',
    nist: ['DI-2 (1)']
  },
  'CCI-003486': {
    def: 'The organization identifies the minimum personally identifiable information (PII) elements that are relevant and necessary to accomplish the legally authorized purpose of collection.',
    nist: ['DM-1 a']
  },
  'CCI-003487': {
    def: 'The organization limits the collection and retention of personally identifiable information (PII) to the minimum elements identified for the purposes described in the published privacy notice.',
    nist: ['DM-1 b']
  },
  'CCI-003488': {
    def: 'The organization limits the collection and retention of personally identifiable information (PII) to the minimum elements identified for the purposes which the individual has provided consent.',
    nist: ['DM-1 b']
  },
  'CCI-003489': {
    def: 'The organization defines the frequency, minimally annually, for conducting reviews of its personally identifiable information (PII) holdings.',
    nist: ['DM-1 c']
  },
  'CCI-003490': {
    def: 'The organization conducts an initial evaluation of personally identifiable information (PII) holdings.',
    nist: ['DM-1 c']
  },
  'CCI-003491': {
    def: 'The organization establishes a schedule for regularly reviewing the personally identifiable information (PII) holdings on an organization-defined frequency to ensure that only PII identified in the notice is collected and retained.',
    nist: ['DM-1 c']
  },
  'CCI-003492': {
    def: 'The organization follows a schedule for regularly reviewing the personally identifiable information (PII) holdings on an organization-defined frequency to ensure that only PII identified in the notice is collected and retained.',
    nist: ['DM-1 c']
  },
  'CCI-003493': {
    def: 'The organization establishes a schedule for regularly reviewing the personally identifiable information (PII) holdings on an organization-defined frequency to ensure the PII continues to be necessary to accomplish the legally authorized purpose.',
    nist: ['DM-1 c']
  },
  'CCI-003494': {
    def: 'The organization follows a schedule for regularly reviewing the personally identifiable information (PII) holdings on an organization-defined frequency to ensure the PII continues to be necessary to accomplish the legally authorized purpose.',
    nist: ['DM-1 c']
  },
  'CCI-003495': {
    def: 'The organization, where feasible and within the limits of technology, locates and removes/redacts specified personally identifiable information (PII).',
    nist: ['DM-1 (1)']
  },
  'CCI-003496': {
    def: 'The organization, where feasible and within the limits of technology, uses anonymization and de-identification techniques to permit use of the retained Privacy Act information while reducing its sensitivity and reducing the risk resulting from disclosure.',
    nist: ['DM-1 (1)']
  },
  'CCI-003497': {
    def: 'The organization defines the time period for retaining each collection of personally identifiable information (PII) that is required to fulfill the purpose(s) identified in the published privacy notice or required by law.',
    nist: ['DM-2 a']
  },
  'CCI-003498': {
    def: 'The organization retains each collection of personally identifiable information (PII) for the organization-defined time period to fulfill the purpose(s) identified in the published privacy notice or as required by law.',
    nist: ['DM-2 a']
  },
  'CCI-003499': {
    def: 'The organization disposes of, destroys, erases, and/or anonymizes the personally identifiable information (PII), regardless of the method of storage, in accordance with a NARA-approved record retention schedule.',
    nist: ['DM-2 b']
  },
  'CCI-003500': {
    def: 'The organization disposes of, destroys, erases, and/or anonymizes the personally identifiable information (PII), regardless of the method of storage, in a manner that prevents loss, theft, misuse, or unauthorized access.',
    nist: ['DM-2 b']
  },
  'CCI-003501': {
    def: 'The organization defines the techniques or methods to be employed to ensure the secure deletion or destruction of personally identifiable information (PII) (including originals, copies, and archived records).',
    nist: ['DM-2 c']
  },
  'CCI-003502': {
    def: 'The organization uses organization-defined techniques or methods to ensure secure deletion or destruction of personally identifiable information (PII) (including originals, copies, and archived records).',
    nist: ['DM-2 c']
  },
  'CCI-003503': {
    def: 'The organization, where feasible, configures its information systems to record the date personally identifiable information (PII) is collected, created, or updated.',
    nist: ['DM-2 (1)']
  },
  'CCI-003504': {
    def: 'The organization, where feasible, configures its information systems to record the date personally identifiable information (PII) is created.',
    nist: ['DM-2 (1)']
  },
  'CCI-003505': {
    def: 'The organization, where feasible, configures its information systems to record the date personally identifiable information (PII) is updated.',
    nist: ['DM-2 (1)']
  },
  'CCI-003506': {
    def: 'The organization, where feasible, configures its information systems to record when personally identifiable information (PII) is to be deleted or archived under an approved record retention schedule.',
    nist: ['DM-2 (1)']
  },
  'CCI-003507': {
    def: 'The organization develops policies that minimize the use of personally identifiable information (PII) for testing.',
    nist: ['DM-3 a']
  },
  'CCI-003508': {
    def: 'The organization develops policies that minimize the use of personally identifiable information (PII) for training.',
    nist: ['DM-3 a']
  },
  'CCI-003509': {
    def: 'The organization develops policies that minimize the use of personally identifiable information (PII) for research.',
    nist: ['DM-3 a']
  },
  'CCI-003510': {
    def: 'The organization develops procedures that minimize the use of personally identifiable information (PII) for testing.',
    nist: ['DM-3 a']
  },
  'CCI-003511': {
    def: 'The organization develops procedures that minimize the use of personally identifiable information (PII) for training.',
    nist: ['DM-3 a']
  },
  'CCI-003512': {
    def: 'The organization develops procedures that minimize the use of personally identifiable information (PII) for research.',
    nist: ['DM-3 a']
  },
  'CCI-003513': {
    def: 'The organization implements controls to protect personally identifiable information (PII) used for testing.',
    nist: ['DM-3 b']
  },
  'CCI-003514': {
    def: 'The organization implements controls to protect personally identifiable information (PII) used for training.',
    nist: ['DM-3 b']
  },
  'CCI-003515': {
    def: 'The organization implements controls to protect personally identifiable information (PII) used for research.',
    nist: ['DM-3 b']
  },
  'CCI-003516': {
    def: 'The organization, where feasible, uses techniques to minimize the risk to privacy of using personally identifiable information (PII) for research.',
    nist: ['DM-3 (1)']
  },
  'CCI-003517': {
    def: 'The organization, where feasible, uses techniques to minimize the risk to privacy of using personally identifiable information (PII) for testing.',
    nist: ['DM-3 (1)']
  },
  'CCI-003518': {
    def: 'The organization, where feasible, uses techniques to minimize the risk to privacy of using personally identifiable information (PII) for training.',
    nist: ['DM-3 (1)']
  },
  'CCI-003519': {
    def: 'The organization provides means, where feasible and appropriate, for individuals to authorize the collection of personally identifiable information (PII) prior to its collection.',
    nist: ['IP-1 a']
  },
  'CCI-003520': {
    def: 'The organization provides means, where feasible and appropriate, for individuals to authorize the use of personally identifiable information (PII) prior to its collection.',
    nist: ['IP-1 a']
  },
  'CCI-003521': {
    def: 'The organization provides means, where feasible and appropriate, for individuals to authorize the maintaining of personally identifiable information (PII) prior to its collection.',
    nist: ['IP-1 a']
  },
  'CCI-003522': {
    def: 'The organization provides means, where feasible and appropriate, for individuals to authorize sharing of personally identifiable information (PII) prior to its collection.',
    nist: ['IP-1 a']
  },
  'CCI-003523': {
    def: 'The organization provides appropriate means for individuals to understand the consequences of decisions to approve or decline the authorization of the collection of personally identifiable information (PII).',
    nist: ['IP-1 b']
  },
  'CCI-003524': {
    def: 'The organization provides appropriate means for individuals to understand the consequences of decisions to approve or decline the authorization of the use of personally identifiable information (PII).',
    nist: ['IP-1 b']
  },
  'CCI-003525': {
    def: 'The organization provides appropriate means for individuals to understand the consequences of decisions to approve or decline the authorization of the dissemination of personally identifiable information (PII).',
    nist: ['IP-1 b']
  },
  'CCI-003526': {
    def: 'The organization provides appropriate means for individuals to understand the consequences of decisions to approve or decline the authorization of the retention of personally identifiable information (PII).',
    nist: ['IP-1 b']
  },
  'CCI-003527': {
    def: 'The organization obtains consent, where feasible and appropriate, from individuals prior to any new uses or disclosure of previously collected personally identifiable information (PII).',
    nist: ['IP-1 c']
  },
  'CCI-003528': {
    def: 'The organization ensures that individuals are aware of all uses of personally identifiable information (PII) not initially described in the public notice that was in effect at the time the organization collected the PII.',
    nist: ['IP-1 d']
  },
  'CCI-003529': {
    def: 'The organization ensures that individuals, where feasible, consent to all uses of personally identifiable information (PII) not initially described in the public notice that was in effect at the time the organization collected the PII.',
    nist: ['IP-1 d']
  },
  'CCI-003530': {
    def: 'The organization implements mechanisms to support itemized or tiered consent for specific uses of personally identifiable information (PII) data.',
    nist: ['IP-1 (1)']
  },
  'CCI-003531': {
    def: 'The organization provides individuals the ability to have access to their personally identifiable information (PII) maintained in its system(s) of records.',
    nist: ['IP-2 a']
  },
  'CCI-003532': {
    def: 'The organization publishes rules and regulations governing how individuals may request access to records maintained in a Privacy Act system of records.',
    nist: ['IP-2 b']
  },
  'CCI-003533': {
    def: 'The organization publishes regulations governing how individuals may request access to records maintained in a Privacy Act system of records.',
    nist: ['IP-2 b']
  },
  'CCI-003534': {
    def: 'The organization publishes access procedures for Privacy Act systems of records in System of Records Notices (SORNs).',
    nist: ['IP-2 c']
  },
  'CCI-003535': {
    def: 'The organization adheres to Privacy Act requirements for the proper processing of Privacy Act requests.',
    nist: ['IP-2 d']
  },
  'CCI-003536': {
    def: 'The organization adheres to OMB policies and guidance for the proper processing of Privacy Act requests.',
    nist: ['IP-2 d']
  },
  'CCI-003537': {
    def: 'The organization provides a process for individuals to have inaccurate personally identifiable information (PII) maintained by the organization corrected or amended, as appropriate.',
    nist: ['IP-3 a']
  },
  'CCI-003538': {
    def: 'The organization establishes a process for disseminating corrections or amendments of the personally identifiable information (PII) to other authorized users of the PII, such as external information-sharing partners.',
    nist: ['IP-3 b']
  },
  'CCI-003539': {
    def: 'The organization establishes a process, where feasible and appropriate, to notify affected individuals that their personally identifiable information (PII) information has been corrected or amended.',
    nist: ['IP-3 b']
  },
  'CCI-003540': {
    def: 'The organization implements a process for receiving complaints, concerns, or questions from individuals about the organizational privacy practices.',
    nist: ['IP-4']
  },
  'CCI-003541': {
    def: 'The organization implements a process for responding to complaints, concerns, or questions from individuals about the organizational privacy practices.',
    nist: ['IP-4']
  },
  'CCI-003542': {
    def: 'The organization defines the time period within which it must respond to complaints, concerns, or questions from individuals about the organizational privacy practices.',
    nist: ['IP-4 (1)']
  },
  'CCI-003543': {
    def: 'The organization responds to complaints, concerns, or questions from individuals about the organizational privacy practices within the organization-defined time period.',
    nist: ['IP-4 (1)']
  },
  'CCI-003544': {
    def: 'The organization defines the frequency on which it will update the inventory that contains a listing of all programs and information systems identified as collecting, using, maintaining, or sharing personally identifiable information (PII).',
    nist: ['SE-1 a']
  },
  'CCI-003545': {
    def: 'The organization establishes an inventory that contains a listing of all programs identified as collecting, using, maintaining, or sharing personally identifiable information (PII).',
    nist: ['SE-1 a']
  },
  'CCI-003546': {
    def: 'The organization establishes an inventory that contains a listing of all information systems identified as collecting, using, maintaining, or sharing personally identifiable information (PII).',
    nist: ['SE-1 a']
  },
  'CCI-003547': {
    def: 'The organization maintains an inventory that contains a listing of all programs identified as collecting, using, maintaining, or sharing personally identifiable information (PII).',
    nist: ['SE-1 a']
  },
  'CCI-003548': {
    def: 'The organization maintains an inventory that contains a listing of all information systems identified as collecting, using, maintaining, or sharing personally identifiable information (PII).',
    nist: ['SE-1 a']
  },
  'CCI-003549': {
    def: 'The organization updates, per organization-defined frequency, an inventory that contains a listing of all programs identified as collecting, using, maintaining, or sharing personally identifiable information (PII).',
    nist: ['SE-1 a']
  },
  'CCI-003550': {
    def: 'The organization updates, per organization-defined frequency, an inventory that contains a listing of all information systems identified as collecting, using, maintaining, or sharing personally identifiable information (PII).',
    nist: ['SE-1 a']
  },
  'CCI-003551': {
    def: 'The organization defines the frequency for providing each update of the personally identifiable information (PII) inventory to the CIO or information security official.',
    nist: ['SE-1 b']
  },
  'CCI-003552': {
    def: 'The organization provides each update of the personally identifiable information (PII) inventory to the CIO or information security official, per organization-defined frequency, to support the establishment of information security requirements for all new or modified information systems containing PII.',
    nist: ['SE-1 b']
  },
  'CCI-003553': {
    def: 'The organization develops a Privacy Incident Response Plan.',
    nist: ['SE-2 a']
  },
  'CCI-003554': {
    def: 'The organization implements a Privacy Incident Response Plan.',
    nist: ['SE-2 a']
  },
  'CCI-003555': {
    def: 'The organization provides an organized and effective response to privacy incidents in accordance with the organizational Privacy Incident Response Plan.',
    nist: ['SE-2 b']
  },
  'CCI-003556': {
    def: 'The organization provides effective notice to the public regarding its activities that impact privacy, including its collection, use, sharing, safeguarding, maintenance, and disposal of personally identifiable information (PII).',
    nist: ['TR-1 a']
  },
  'CCI-003557': {
    def: 'The organization provides effective notice to individuals regarding its activities that impact privacy, including its collection, use, sharing, safeguarding, maintenance, and disposal of personally identifiable information (PII).',
    nist: ['TR-1 a']
  },
  'CCI-003558': {
    def: 'The organization provides effective notice to the public regarding its authority for collecting personally identifiable information (PII).',
    nist: ['TR-1 a']
  },
  'CCI-003559': {
    def: 'The organization provides effective notice to individuals regarding its authority for collecting personally identifiable information (PII).',
    nist: ['TR-1 a']
  },
  'CCI-003560': {
    def: 'The organization provides effective notice to the public regarding the choices, if any, individuals may have regarding how the organization uses personally identifiable information (PII).',
    nist: ['TR-1 a']
  },
  'CCI-003561': {
    def: 'The organization provides effective notice to individuals regarding the choices, if any, individuals may have regarding how the organization uses personally identifiable information (PII).',
    nist: ['TR-1 a']
  },
  'CCI-003562': {
    def: 'The organization provides effective notice to the public regarding the consequences of exercising or not exercising the choices regarding how the organization uses personally identifiable information (PII).',
    nist: ['TR-1 a']
  },
  'CCI-003563': {
    def: 'The organization provides effective notice to individuals regarding the consequences of exercising or not exercising the choices regarding how the organization uses personally identifiable information (PII).',
    nist: ['TR-1 a']
  },
  'CCI-003564': {
    def: 'The organization provides effective notice to the public regarding the ability of individuals to access personally identifiable information (PII).',
    nist: ['TR-1 a']
  },
  'CCI-003565': {
    def: 'The organization provides effective notice to individuals regarding the ability to access personally identifiable information (PII).',
    nist: ['TR-1 a']
  },
  'CCI-003566': {
    def: 'The organization provides effective notice to the public regarding the ability to have personally identifiable information (PII) amended or corrected if necessary.',
    nist: ['TR-1 a']
  },
  'CCI-003567': {
    def: 'The organization provides effective notice to individuals regarding the ability to have personally identifiable information (PII) amended or corrected if necessary.',
    nist: ['TR-1 a']
  },
  'CCI-003568': {
    def: 'The organization describes the personally identifiable information (PII) the organization collects.',
    nist: ['TR-1 b']
  },
  'CCI-003569': {
    def: 'The organization describes the purpose(s) for which it collects the personally identifiable information (PII).',
    nist: ['TR-1 b']
  },
  'CCI-003570': {
    def: 'The organization describes how the organization uses personally identifiable information (PII) internally.',
    nist: ['TR-1 b']
  },
  'CCI-003571': {
    def: 'The organization describes whether the organization shares personally identifiable information (PII) with external entities.',
    nist: ['TR-1 b']
  },
  'CCI-003572': {
    def: 'The organization describes the categories of those external entities with whom personally identifiable information (PII) is shared.',
    nist: ['TR-1 b']
  },
  'CCI-003573': {
    def: 'The organization describes the purposes for sharing personally identifiable information (PII) with external entities.',
    nist: ['TR-1 b']
  },
  'CCI-003574': {
    def: 'The organization describes whether individuals have the ability to consent to specific uses or sharing of personally identifiable information (PII).',
    nist: ['TR-1 b']
  },
  'CCI-003575': {
    def: 'The organization describes how individuals may exercise their consent regarding specific uses or sharing of personally identifiable information (PII).',
    nist: ['TR-1 b']
  },
  'CCI-003576': {
    def: 'The organization describes how individuals may obtain access to personally identifiable information (PII).',
    nist: ['TR-1 b']
  },
  'CCI-003577': {
    def: 'The organization describes how the personally identifiable information (PII) will be protected.',
    nist: ['TR-1 b']
  },
  'CCI-003578': {
    def: 'The organization revises its public notices to reflect changes in practice or policy that affect personally identifiable information (PII), before or as soon as practicable after the change.',
    nist: ['TR-1 c']
  },
  'CCI-003579': {
    def: 'The organization revises its public notices to reflect changes in practice or policy that impact privacy, before or as soon as practicable after the change.',
    nist: ['TR-1 c']
  },
  'CCI-003580': {
    def: 'The organization provides real-time notice and/or layered notice when it collects personally identifiable information (PII).',
    nist: ['TR-1 (1)']
  },
  'CCI-003581': {
    def: 'The organization publishes System of Records Notices (SORNs) in the Federal Register, subject to required oversight processes, for systems containing personally identifiable information (PII).',
    nist: ['TR-2 a']
  },
  'CCI-003582': {
    def: 'The organization keeps System of Records Notices (SORNs) current.',
    nist: ['TR-2 b']
  },
  'CCI-003583': {
    def: 'The organization includes Privacy Act Statements on its forms that collect personally identifiable information (PII), or on separate forms that can be retained by individuals, to provide additional formal notice to individuals from whom the information is being collected.',
    nist: ['TR-2 c']
  },
  'CCI-003584': {
    def: 'The organization publishes System of Records Notices (SORNs) on its public website.',
    nist: ['TR-2 (1)']
  },
  'CCI-003585': {
    def: 'The organization ensures the public has access to information about its privacy activities.',
    nist: ['TR-3 a']
  },
  'CCI-003586': {
    def: 'The organization ensures the public is able to communicate with its Senior Agency Official for Privacy (SAOP)/Chief Privacy Officer (CPO).',
    nist: ['TR-3 a']
  },
  'CCI-003587': {
    def: 'The organization ensures its privacy practices are publicly available through organizational websites or otherwise.',
    nist: ['TR-3 b']
  },
  'CCI-003588': {
    def: 'The organization uses personally identifiable information (PII) internally only for the authorized purpose(s) identified in the Privacy Act and/or in public notices.',
    nist: ['UL-1']
  },
  'CCI-003589': {
    def: 'The organization shares personally identifiable information (PII) externally, only for the authorized purposes identified in the Privacy Act and/or described in its notice(s) or for a purpose that is compatible with those purposes.',
    nist: ['UL-2 a']
  },
  'CCI-003590': {
    def: 'The organization, where appropriate, enters into Memoranda of Understanding, Memoranda of Agreement, Letters of Intent, Computer Matching Agreements, or similar agreements, with third parties that specifically describe the personally identifiable information (PII) covered.',
    nist: ['UL-2 b']
  },
  'CCI-003591': {
    def: 'The organization, where appropriate, enters into Memoranda of Understanding, Memoranda of Agreement, Letters of Intent, Computer Matching Agreements, or similar agreements, with third parties that specifically enumerate the purposes for which the personally identifiable information (PII) may be used.',
    nist: ['UL-2 b']
  },
  'CCI-003592': {
    def: 'The organization monitors its staff on the authorized sharing of personally identifiable information (PII) with third parties.',
    nist: ['UL-2 c']
  },
  'CCI-003593': {
    def: 'The organization audits its staff on the authorized sharing of personally identifiable information (PII) with third parties.',
    nist: ['UL-2 c']
  },
  'CCI-003594': {
    def: 'The organization trains its staff on the authorized sharing of personally identifiable information (PII) with third parties.',
    nist: ['UL-2 c']
  },
  'CCI-003595': {
    def: 'The organization trains its staff on the consequences of unauthorized use or sharing of personally identifiable information (PII).',
    nist: ['UL-2 c']
  },
  'CCI-003596': {
    def: 'The organization evaluates any proposed new instances of sharing personally identifiable information (PII) with third parties to assess whether the sharing is authorized.',
    nist: ['UL-2 d']
  },
  'CCI-003597': {
    def: 'The organization evaluates any proposed new instances of sharing personally identifiable information (PII) with third parties to assess whether additional or new public notice is required.',
    nist: ['UL-2 d']
  },
  'CCI-002254': {
    def: 'The organization defines the conditions or trigger events requiring session disconnect to be employed by the information system when automatically terminating a user session.',
    nist: ['AC-12']
  },
  'CCI-002360': {
    def: 'The organization defines the conditions or trigger events requiring session disconnect to be employed by the information system when automatically terminating a user session.',
    nist: ['AC-12']
  },
  'CCI-002361': {
    def: 'The information system automatically terminates a user session after organization-defined conditions or trigger events requiring session disconnect.',
    nist: ['AC-12']
  },
  'CCI-002362': {
    def: 'The organization defines the resources requiring information system authentication in order to gain access.',
    nist: ['AC-12 (1)']
  },
  'CCI-002363': {
    def: 'The information system provides a logout capability for user-initiated communications sessions whenever authentication is used to gain access to organization-defined information resources.',
    nist: ['AC-12 (1)']
  },
  'CCI-002364': {
    def: 'The information system displays an explicit logout message to users indicating the reliable termination of authenticated communications sessions.',
    nist: ['AC-12 (1)']
  },
  'CCI-002979': {
    def: 'The organization employs organization-defined asset location technologies to track and monitor the location and movement of organization-defined assets within organization-defined controlled areas.',
    nist: ['PE-20 a']
  },
  'CCI-002980': {
    def: 'The organization defines asset location technologies to track and monitor the location and movement of organization-defined assets within organization-defined controlled areas.',
    nist: ['PE-20 a']
  },
  'CCI-002981': {
    def: 'The organization defines the assets within the organization-defined controlled areas which are to be tracked and monitored for their location and movement.',
    nist: ['PE-20 a']
  },
  'CCI-002982': {
    def: 'The organization defines controlled areas where the location and movement of organization-defined assets are tracked and monitored.',
    nist: ['PE-20 a']
  },
  'CCI-002983': {
    def: 'The organization ensures that asset location technologies are employed in accordance with applicable federal laws, Executive Orders, directives, regulations, policies, standards, and guidance.',
    nist: ['PE-20 b']
  },
  'CCI-003372': {
    def: 'The organization defines the support from external providers to be provided for unsupported information system components.',
    nist: ['SA-22 (1)']
  },
  'CCI-003373': {
    def: 'The organization provides in-house support and/or organization-defined support from external providers for unsupported information system components.',
    nist: ['SA-22 (1)']
  },
  'CCI-003374': {
    def: 'The organization documents approval for the continued use of unsupported system components required to satisfy mission/business needs.',
    nist: ['SA-22 b']
  },
  'CCI-003375': {
    def: 'The organization provides justification for the continued use of unsupported system components required to satisfy mission/business needs.',
    nist: ['SA-22 b']
  },
  'CCI-003376': {
    def: 'The organization replaces information system components when support for the components is no longer available from the developer, vendor, or manufacturer.',
    nist: ['SA-22 a']
  },
  'CCI-002773': {
    def: 'The organization defines the fail-safe procedures to be implemented by the information system when organization-defined failure conditions occur.',
    nist: ['SI-17']
  },
  'CCI-002774': {
    def: 'The organization defines the failure conditions which, when they occur, will result in the information system implementing organization-defined fail-safe procedures.',
    nist: ['SI-17']
  },
  'CCI-002775': {
    def: 'The information system implements organization-defined fail-safe procedures when organization-defined failure conditions occur.',
    nist: ['SI-17']
  },
  'CCI-002823': {
    def: 'The organization defines the security safeguards to be implemented to protect the information system^s memory from unauthorized code execution.',
    nist: ['SI-16']
  },
  'CCI-002824': {
    def: 'The information system implements organization-defined security safeguards to protect its memory from unauthorized code execution.',
    nist: ['SI-16']
  },
  'CCI-003117': {
    def: 'The organization centrally manages organization-defined security controls and related processes.',
    nist: ['PL-9']
  },
  'CCI-003118': {
    def: 'The organization defines security controls and related processes to be centrally managed.',
    nist: ['PL-9']
  }
};
