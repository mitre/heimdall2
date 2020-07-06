export const NIST_DESCRIPTIONS: {[tag: string]: string} = {
  'AC-1': 'ACCESS CONTROL POLICY AND PROCEDURES',
  'AC-1 a':
    'Develops, documents, and disseminates to [Assignment: organization-defined personnel or roles]:',
  'AC-1 a 1':
    'An access control policy that addresses purpose, scope, roles, responsibilities, management commitment, coordination among organizational entities, and compliance; and',
  'AC-1 a 2':
    'Procedures to facilitate the implementation of the access control policy and associated access controls; and',
  'AC-1 b': 'Reviews and updates the current:',
  'AC-1 b 1':
    'Access control policy [Assignment: organization-defined frequency]; and',
  'AC-1 b 2':
    'Access control procedures [Assignment: organization-defined frequency].',
  'AC-2': 'ACCOUNT MANAGEMENT',
  'AC-2 a':
    'Identifies and selects the following types of information system accounts to support organizational missions/business functions: [Assignment: organization-defined information system account types];',
  'AC-2 b': 'Assigns account managers for information system accounts;',
  'AC-2 c': 'Establishes conditions for group and role membership;',
  'AC-2 d':
    'Specifies authorized users of the information system, group and role membership, and access authorizations (i.e., privileges) and other attributes (as required) for each account;',
  'AC-2 e':
    'Requires approvals by [Assignment: organization-defined personnel or roles] for requests to create information system accounts;',
  'AC-2 f':
    'Creates, enables, modifies, disables, and removes information system accounts in accordance with [Assignment: organization-defined procedures or conditions];',
  'AC-2 g': 'Monitors the use of information system accounts;',
  'AC-2 h': 'Notifies account managers:',
  'AC-2 h 1': 'When accounts are no longer required;',
  'AC-2 h 2': 'When users are terminated or transferred; and',
  'AC-2 h 3':
    'When individual information system usage or need-to-know changes;',
  'AC-2 i': 'Authorizes access to the information system based on:',
  'AC-2 i 1': 'A valid access authorization;',
  'AC-2 i 2': 'Intended system usage; and',
  'AC-2 i 3':
    'Other attributes as required by the organization or associated missions/business functions;',
  'AC-2 j':
    'Reviews accounts for compliance with account management requirements [Assignment: organization-defined frequency]; and',
  'AC-2 k':
    'Establishes a process for reissuing shared/group account credentials (if deployed) when individuals are removed from the group.',
  'AC-2 (1)':
    'The organization employs automated mechanisms to support the management of information system accounts.',
  'AC-2 (2)':
    'The information system automatically [Selection: removes; disables] temporary and emergency accounts after [Assignment: organization-defined time period for each type of account].',
  'AC-2 (3)':
    'The information system automatically disables inactive accounts after [Assignment: organization-defined time period].',
  'AC-2 (4)':
    'The information system automatically audits account creation, modification, enabling, disabling, and removal actions, and notifies [Assignment: organization-defined personnel or roles].',
  'AC-2 (5)':
    'The organization requires that users log out when [Assignment: organization-defined time-period of expected inactivity or description of when to log out].',
  'AC-2 (6)':
    'The information system implements the following dynamic privilege management capabilities: [Assignment: organization-defined list of dynamic privilege management capabilities].',
  'AC-2 (7)': 'ROLE-BASED SCHEMES',
  'AC-2 (7) (a)':
    'Establishes and administers privileged user accounts in accordance with a role-based access scheme that organizes allowed information system access and privileges into roles;',
  'AC-2 (7) (b)': 'Monitors privileged role assignments; and',
  'AC-2 (7) (c)':
    'Takes [Assignment: organization-defined actions] when privileged role assignments are no longer appropriate.',
  'AC-2 (8)':
    'The information system creates [Assignment: organization-defined information system accounts] dynamically.',
  'AC-2 (9)':
    'The organization only permits the use of shared/group accounts that meet [Assignment: organization-defined conditions for establishing shared/group accounts].',
  'AC-2 (10)':
    'The information system terminates shared/group account credentials when members leave the group.',
  'AC-2 (11)':
    'The information system enforces [Assignment: organization-defined circumstances and/or usage conditions] for [Assignment: organization-defined information system accounts].',
  'AC-2 (12)': 'ACCOUNT MONITORING / ATYPICAL USAGE',
  'AC-2 (12) (a)':
    'Monitors information system accounts for [Assignment: organization-defined atypical usage]; and',
  'AC-2 (12) (b)':
    'Reports atypical usage of information system accounts to [Assignment: organization-defined personnel or roles].',
  'AC-2 (13)':
    'The organization disables accounts of users posing a significant risk within [Assignment: organization-defined time period] of discovery of the risk.',
  'AC-3':
    'The information system enforces approved authorizations for logical access to information           and system resources in accordance with applicable access control policies.',
  'AC-3 (1)': '[Withdrawn: Incorporated into AC-6].',
  'AC-3 (2)':
    'The information system enforces dual authorization for [Assignment: organization-defined privileged commands and/or other organization-defined actions].',
  'AC-3 (3)':
    'The information system enforces [Assignment: organization-defined mandatory access control policy] over all subjects and objects where the policy:',
  'AC-3 (3) (a)':
    'Is uniformly enforced across all subjects and objects within the boundary of the information system;',
  'AC-3 (3) (b)':
    'Specifies that a subject that has been granted access to information is constrained from doing any of the following;',
  'AC-3 (3) (b) (1)':
    'Passing the information to unauthorized subjects or objects;',
  'AC-3 (3) (b) (2)': 'Granting its privileges to other subjects;',
  'AC-3 (3) (b) (3)':
    'Changing one or more security attributes on subjects, objects, the information system, or information system components;',
  'AC-3 (3) (b) (4)':
    'Choosing the security attributes and attribute values to be associated with newly created or modified objects; or',
  'AC-3 (3) (b) (5)': 'Changing the rules governing access control; and',
  'AC-3 (3) (c)':
    'Specifies that [Assignment: organization-defined subjects] may explicitly be granted [Assignment: organization-defined privileges (i.e., they are trusted subjects)] such that they are not limited by some or all of the above constraints.',
  'AC-3 (4)':
    'The information system enforces [Assignment: organization-defined discretionary access control policy] over defined subjects and objects where the policy specifies that a subject that has been granted access to information can do one or more of the following:',
  'AC-3 (4) (a)': 'Pass the  information to any other subjects or objects;',
  'AC-3 (4) (b)': 'Grant its privileges to other subjects;',
  'AC-3 (4) (c)':
    "Change security attributes on subjects, objects, the information system, or the information system's components;",
  'AC-3 (4) (d)':
    'Choose the security attributes to be associated with newly created or revised objects; or',
  'AC-3 (4) (e)': 'Change the rules governing access control.',
  'AC-3 (5)':
    'The information system prevents access to [Assignment: organization-defined security-relevant information] except during secure, non-operable system states.',
  'AC-3 (6)': '[Withdrawn: Incorporated into MP-4 and SC-28].',
  'AC-3 (7)':
    'The information system enforces a role-based access control policy over defined subjects and objects and controls access based upon [Assignment: organization-defined roles and users authorized to assume such roles].',
  'AC-3 (8)':
    'The information system enforces the revocation of access authorizations resulting from changes to the security attributes of subjects and objects based on [Assignment: organization-defined rules governing the timing of revocations of access authorizations].',
  'AC-3 (9)':
    'The information system does not release information outside of the established system boundary unless:',
  'AC-3 (9) (a)':
    'The receiving [Assignment: organization-defined information system or system component] provides [Assignment: organization-defined security safeguards]; and',
  'AC-3 (9) (b)':
    '[Assignment: organization-defined security safeguards] are used to validate the appropriateness of the information designated for release.',
  'AC-3 (10)':
    'The organization employs an audited override of automated access control mechanisms under [Assignment: organization-defined conditions].',
  'AC-4':
    'The information system enforces approved authorizations for controlling the flow of information within the system and between interconnected systems based on [Assignment: organization-defined information flow control policies].',
  'AC-4 (1)':
    'The information system uses [Assignment: organization-defined security attributes] associated with [Assignment: organization-defined information, source, and destination objects] to enforce [Assignment: organization-defined information flow control policies] as a basis for flow control decisions.',
  'AC-4 (2)':
    'The information system uses protected processing domains to enforce [Assignment: organization-defined information flow control policies] as a basis for flow control decisions.',
  'AC-4 (3)':
    'The information system enforces dynamic information flow control based on [Assignment: organization-defined policies].',
  'AC-4 (4)':
    'The information system prevents encrypted information from bypassing content-checking mechanisms by [Selection (one or more): decrypting the information; blocking the flow of the encrypted information; terminating communications sessions attempting to pass encrypted information; [Assignment: organization-defined procedure or method]].',
  'AC-4 (5)':
    'The information system enforces [Assignment: organization-defined limitations] on embedding data types within other data types.',
  'AC-4 (6)':
    'The information system enforces information flow control based on [Assignment: organization-defined metadata].',
  'AC-4 (7)':
    'The information system enforces [Assignment: organization-defined one-way information flows] using hardware mechanisms.',
  'AC-4 (8)':
    'The information system enforces information flow control using [Assignment: organization-defined security policy filters] as a basis for flow control decisions for [Assignment: organization-defined information flows].',
  'AC-4 (9)':
    'The information system enforces the use of human reviews for [Assignment: organization-defined information flows] under the following conditions: [Assignment: organization-defined conditions].',
  'AC-4 (10)':
    'The information system provides the capability for privileged administrators to enable/disable [Assignment: organization-defined security policy filters] under the following conditions: [Assignment: organization-defined conditions].',
  'AC-4 (11)':
    'The information system provides the capability for privileged administrators to configure [Assignment: organization-defined security policy filters] to support different security policies.',
  'AC-4 (12)':
    'The information system, when transferring information between different security domains, uses [Assignment: organization-defined data type identifiers] to validate data essential for information flow decisions.',
  'AC-4 (13)':
    'The information system, when transferring information between different security domains, decomposes information into [Assignment: organization-defined policy-relevant subcomponents] for submission to policy enforcement mechanisms.',
  'AC-4 (14)':
    'The information system, when transferring information between different security domains, implements [Assignment: organization-defined security policy filters] requiring fully enumerated formats that restrict data structure and content.',
  'AC-4 (15)':
    'The information system, when transferring information between different security domains, examines the information for the presence of [Assignment: organized-defined unsanctioned information] and prohibits the transfer of such information in accordance with the [Assignment: organization-defined security policy].',
  'AC-4 (16)': '[Withdrawn: Incorporated into AC-4].',
  'AC-4 (17)':
    'The information system uniquely identifies and authenticates source and destination points by [Selection (one or more): organization, system, application, individual] for information transfer.',
  'AC-4 (18)':
    'The information system binds security attributes to information using [Assignment: organization-defined binding techniques] to facilitate information flow policy enforcement.',
  'AC-4 (19)':
    'The information system, when transferring information between different security domains, applies the same security policy filtering to metadata as it applies to data payloads.',
  'AC-4 (20)':
    'The organization employs [Assignment: organization-defined solutions in approved configurations] to control the flow of [Assignment: organization-defined information] across security domains.',
  'AC-4 (21)':
    'The information system separates information flows logically or physically using [Assignment: organization-defined mechanisms and/or techniques] to accomplish [Assignment: organization-defined required separations by types of information].',
  'AC-4 (22)':
    'The information system provides access from a single device to computing platforms, applications, or data residing on multiple different security domains, while preventing any information flow between the different security domains.',
  'AC-5': 'SEPARATION OF DUTIES',
  'AC-5 a':
    'Separates [Assignment: organization-defined duties of individuals];',
  'AC-5 b': 'Documents separation of duties of individuals; and',
  'AC-5 c':
    'Defines information system access authorizations to support separation of duties.',
  'AC-6':
    'The organization employs the principle of least privilege, allowing only authorized accesses for users (or processes acting on behalf of users) which are necessary to accomplish assigned tasks in accordance with organizational missions and business functions.',
  'AC-6 (1)':
    'The organization explicitly authorizes access to [Assignment: organization-defined security functions (deployed in hardware, software, and firmware) and security-relevant information].',
  'AC-6 (2)':
    'The organization requires that users of information system accounts, or roles, with access to [Assignment: organization-defined security functions or security-relevant information], use non-privileged accounts or roles, when accessing nonsecurity functions.',
  'AC-6 (3)':
    'The organization authorizes network access to [Assignment: organization-defined privileged commands] only for [Assignment: organization-defined compelling operational needs] and documents the rationale for such access in the security plan for the information system.',
  'AC-6 (4)':
    'The information system provides separate processing domains to enable finer-grained allocation of user privileges.',
  'AC-6 (5)':
    'The organization restricts privileged accounts on the information system to [Assignment: organization-defined personnel or roles].',
  'AC-6 (6)':
    'The organization prohibits privileged access to the information system by non-organizational users.',
  'AC-6 (7)': 'REVIEW OF USER PRIVILEGES',
  'AC-6 (7) (a)':
    'Reviews [Assignment: organization-defined frequency] the privileges assigned to [Assignment: organization-defined roles or classes of users] to validate the need for such privileges; and',
  'AC-6 (7) (b)':
    'Reassigns or removes privileges, if necessary, to correctly reflect organizational mission/business needs.',
  'AC-6 (8)':
    'The information system prevents [Assignment: organization-defined software] from executing at higher privilege levels than users executing the software.',
  'AC-6 (9)':
    'The information system audits the execution of privileged functions.',
  'AC-6 (10)':
    'The information system prevents non-privileged users from executing privileged functions to include disabling, circumventing, or altering implemented security safeguards/countermeasures.',
  'AC-7': 'The information system:',
  'AC-7 a':
    'Enforces a limit of [Assignment: organization-defined number] consecutive invalid logon attempts by a user during a [Assignment: organization-defined time period]; and',
  'AC-7 b':
    'Automatically [Selection: locks the account/node for an [Assignment: organization-defined time period]; locks the account/node until released by an administrator; delays next logon prompt according to [Assignment: organization-defined delay algorithm]] when the maximum number of unsuccessful attempts is exceeded.',
  'AC-7 (1)': '[Withdrawn: Incorporated into AC-7].',
  'AC-7 (2)':
    'The information system purges/wipes information from [Assignment: organization-defined mobile devices] based on [Assignment: organization-defined purging/wiping requirements/techniques] after [Assignment: organization-defined number] consecutive, unsuccessful device logon attempts.',
  'AC-8': 'The information system:',
  'AC-8 a':
    'Displays to users [Assignment: organization-defined system use notification message or banner] before granting access to the system that provides privacy and security notices consistent with applicable federal laws, Executive Orders, directives, policies, regulations, standards, and guidance and states that:',
  'AC-8 a 1': 'Users are accessing a U.S. Government information system;',
  'AC-8 a 2':
    'Information system usage may be monitored, recorded, and subject to audit;',
  'AC-8 a 3':
    'Unauthorized use of the information system is prohibited and subject to criminal and civil penalties; and',
  'AC-8 a 4':
    'Use of the information system indicates consent to monitoring and recording;',
  'AC-8 b':
    'Retains the notification message or banner on the screen until users acknowledge the usage conditions and take explicit actions to log on to or further access the information system; and',
  'AC-8 c': 'For publicly accessible systems:',
  'AC-8 c 1':
    'Displays system use information [Assignment: organization-defined conditions], before granting further access;',
  'AC-8 c 2':
    'Displays references, if any, to monitoring, recording, or auditing that are consistent with privacy accommodations for such systems that generally prohibit those activities; and',
  'AC-8 c 3': 'Includes a description of the authorized uses of the system.',
  'AC-9':
    'The information system notifies the user, upon successful logon (access) to the system, of the date and time of the last logon (access).',
  'AC-9 (1)':
    'The information system notifies the user, upon successful logon/access, of the number of unsuccessful logon/access attempts since the last successful logon/access.',
  'AC-9 (2)':
    'The information system notifies the user of the number of [Selection: successful logons/accesses; unsuccessful logon/access attempts; both] during [Assignment: organization-defined time period].',
  'AC-9 (3)':
    "The information system notifies the user of changes to [Assignment: organization-defined security-related characteristics/parameters of the user's account] during [Assignment: organization-defined time period].",
  'AC-9 (4)':
    'The information system notifies the user, upon successful logon (access), of the following additional information: [Assignment: organization-defined information to be included in addition to the date and time of the last logon (access)].',
  'AC-10':
    'The information system limits the number of concurrent sessions for each [Assignment: organization-defined account and/or account type] to [Assignment: organization-defined number].',
  'AC-11': 'The information system:',
  'AC-11 a':
    'Prevents further access to the system by initiating a session lock after [Assignment: organization-defined time period] of inactivity or upon receiving a request from a user; and',
  'AC-11 b':
    'Retains the session lock until the user reestablishes access using established identification and authentication procedures.',
  'AC-11 (1)':
    'The information system conceals, via the session lock, information previously visible on the display with a publicly viewable image.',
  'AC-12':
    'The information system automatically terminates a user session after [Assignment: organization-defined conditions or trigger events requiring session disconnect].',
  'AC-12 (1)': 'The information system:',
  'AC-12 (1) (a)':
    'Provides a logout capability for user-initiated communications sessions whenever authentication is used to gain access to [Assignment: organization-defined information resources]; and',
  'AC-12 (1) (b)':
    'Displays an explicit logout message to users indicating the reliable termination of authenticated communications sessions.',
  'AC-13': '[Withdrawn: Incorporated into AC-2 and AU-6].',
  'AC-14': 'PERMITTED ACTIONS WITHOUT IDENTIFICATION OR AUTHENTICATION',
  'AC-14 a':
    'Identifies [Assignment: organization-defined user actions] that can be performed on the information system without identification or authentication consistent with organizational missions/business functions; and',
  'AC-14 b':
    'Documents and provides supporting rationale in the security plan for the information system, user actions not requiring identification or authentication.',
  'AC-14 (1)': '[Withdrawn: Incorporated into AC-14].',
  'AC-15': '[Withdrawn: Incorporated into MP-3].',
  'AC-16': 'SECURITY ATTRIBUTES',
  'AC-16 a':
    'Provides the means to associate [Assignment: organization-defined types of security attributes] having [Assignment: organization-defined security attribute values] with information in storage, in process, and/or in transmission;',
  'AC-16 b':
    'Ensures that the security attribute associations are made and retained with the information;',
  'AC-16 c':
    'Establishes the permitted [Assignment: organization-defined security attributes] for [Assignment: organization-defined information systems]; and',
  'AC-16 d':
    'Determines the permitted [Assignment: organization-defined values or ranges] for each of the established security attributes.',
  'AC-16 (1)':
    'The information system dynamically associates security attributes with [Assignment: organization-defined subjects and objects] in accordance with [Assignment: organization-defined security policies] as information is created and combined.',
  'AC-16 (2)':
    'The information system provides authorized individuals (or processes acting on behalf of individuals) the capability to define or change the value of associated security attributes.',
  'AC-16 (3)':
    'The information system maintains the association and integrity of [Assignment: organization-defined security attributes] to [Assignment: organization-defined subjects and objects].',
  'AC-16 (4)':
    'The information system supports the association of [Assignment: organization-defined security attributes] with [Assignment: organization-defined subjects and objects] by authorized individuals (or processes acting on behalf of individuals).',
  'AC-16 (5)':
    'The information system displays security attributes in human-readable form on each object that the system transmits to output devices to identify [Assignment: organization-identified special dissemination, handling, or distribution instructions] using [Assignment: organization-identified human-readable, standard naming conventions].',
  'AC-16 (6)':
    'The organization allows personnel to associate, and maintain the association of [Assignment: organization-defined security attributes] with [Assignment: organization-defined subjects and objects] in accordance with [Assignment: organization-defined security policies].',
  'AC-16 (7)':
    'The organization provides a consistent interpretation of security attributes transmitted between distributed information system components.',
  'AC-16 (8)':
    'The information system implements [Assignment: organization-defined techniques or technologies] with [Assignment: organization-defined level of assurance] in associating security attributes to information.',
  'AC-16 (9)':
    'The organization ensures that security attributes associated with information are reassigned only via re-grading mechanisms validated using [Assignment: organization-defined techniques or procedures].',
  'AC-16 (10)':
    'The information system provides authorized individuals the capability to define or change the type and value of security attributes available for association with subjects and objects.',
  'AC-17': 'REMOTE ACCESS',
  'AC-17 a':
    'Establishes and documents usage restrictions, configuration/connection requirements, and implementation guidance for each type of remote access allowed; and',
  'AC-17 b':
    'Authorizes remote access to the information system prior to allowing such connections.',
  'AC-17 (1)':
    'The information system monitors and controls remote access methods.',
  'AC-17 (2)':
    'The information system implements cryptographic mechanisms to protect the confidentiality and integrity of remote access sessions.',
  'AC-17 (3)':
    'The information system routes all remote accesses through [Assignment: organization-defined number] managed network access control points.',
  'AC-17 (4)': 'PRIVILEGED COMMANDS / ACCESS',
  'AC-17 (4) (a)':
    'Authorizes the execution of privileged commands and access to security-relevant information via remote access only for [Assignment: organization-defined needs]; and',
  'AC-17 (4) (b)':
    'Documents the rationale for such access in the security plan for the information system.',
  'AC-17 (5)': '[Withdrawn: Incorporated into SI-4].',
  'AC-17 (6)':
    'The organization ensures that users protect information about remote access mechanisms from unauthorized use and disclosure.',
  'AC-17 (7)': '[Withdrawn: Incorporated into AC-3 (10)].',
  'AC-17 (8)': '[Withdrawn: Incorporated into CM-7].',
  'AC-17 (9)':
    'The organization provides the capability to expeditiously disconnect or disable remote access to the information system within [Assignment: organization-defined time period].',
  'AC-18': 'WIRELESS ACCESS',
  'AC-18 a':
    'Establishes usage restrictions, configuration/connection requirements, and implementation guidance for wireless access; and',
  'AC-18 b':
    'Authorizes wireless access to the information system prior to allowing such connections.',
  'AC-18 (1)':
    'The information system protects wireless access to the system using authentication of [Selection (one or more): users; devices] and encryption.',
  'AC-18 (2)': '[Withdrawn: Incorporated into SI-4].',
  'AC-18 (3)':
    'The organization disables, when not intended for use, wireless networking capabilities internally embedded within information system components prior to issuance and deployment.',
  'AC-18 (4)':
    'The organization identifies and explicitly authorizes users allowed to independently configure wireless networking capabilities.',
  'AC-18 (5)':
    'The organization selects radio antennas and calibrates transmission power levels to reduce the probability that usable signals can be received outside of organization-controlled boundaries.',
  'AC-19': 'ACCESS CONTROL FOR MOBILE DEVICES',
  'AC-19 a':
    'Establishes usage restrictions, configuration requirements, connection requirements, and implementation guidance for organization-controlled mobile devices; and',
  'AC-19 b':
    'Authorizes the connection of mobile devices to organizational information systems.',
  'AC-19 (1)': '[Withdrawn: Incorporated into MP-7].',
  'AC-19 (2)': '[Withdrawn: Incorporated into MP-7].',
  'AC-19 (3)': '[Withdrawn: Incorporated into MP-7].',
  'AC-19 (4)': 'RESTRICTIONS FOR CLASSIFIED INFORMATION',
  'AC-19 (4) (a)':
    'Prohibits the use of unclassified mobile devices in facilities containing information systems processing, storing, or transmitting classified information unless specifically permitted by the authorizing official; and',
  'AC-19 (4) (b)':
    'Enforces the following restrictions on individuals permitted by the authorizing official to use unclassified mobile devices in facilities containing information systems processing, storing, or transmitting classified information:',
  'AC-19 (4) (b) (1)':
    'Connection of unclassified mobile devices to classified information systems is prohibited;',
  'AC-19 (4) (b) (2)':
    'Connection of unclassified mobile devices to unclassified information systems requires approval from the authorizing official;',
  'AC-19 (4) (b) (3)':
    'Use of internal or external modems or wireless interfaces within the unclassified mobile devices is prohibited; and',
  'AC-19 (4) (b) (4)':
    'Unclassified mobile devices and the information stored on those devices are subject to random reviews and inspections by [Assignment: organization-defined security officials], and if classified information is found, the incident handling policy is followed.',
  'AC-19 (4) (c)':
    'Restricts the connection of classified mobile devices to classified information systems in accordance with [Assignment: organization-defined security policies].',
  'AC-19 (5)':
    'The organization employs [Selection: full-device encryption; container encryption] to protect the confidentiality and integrity of information on [Assignment: organization-defined mobile devices].',
  'AC-20':
    'The organization establishes terms and conditions, consistent with any trust relationships established with other organizations owning, operating, and/or maintaining external information systems, allowing authorized individuals to:',
  'AC-20 a':
    'Access the information system from external information systems; and',
  'AC-20 b':
    'Process, store, or transmit organization-controlled information using external information systems.',
  'AC-20 (1)':
    'The organization permits authorized individuals to use an external information system to access the information system or to process, store, or transmit organization-controlled information only when the organization:',
  'AC-20 (1) (a)':
    "Verifies the implementation of required security controls on the external system as specified in the organization's information security policy and security plan; or",
  'AC-20 (1) (b)':
    'Retains approved information system connection or processing agreements with the organizational entity hosting the external information system.',
  'AC-20 (2)':
    'The organization [Selection: restricts; prohibits] the use of organization-controlled portable storage devices by authorized individuals on external information systems.',
  'AC-20 (3)':
    'The organization [Selection: restricts; prohibits] the use of non-organizationally owned information systems, system components, or devices to process, store, or transmit organizational information.',
  'AC-20 (4)':
    'The organization prohibits the use of [Assignment: organization-defined network accessible storage devices] in external information systems.',
  'AC-21': 'INFORMATION SHARING',
  'AC-21 a':
    'Facilitates information sharing by enabling authorized users to determine whether access authorizations assigned to the sharing partner match the access restrictions on the information for [Assignment: organization-defined information sharing circumstances where user discretion is required]; and',
  'AC-21 b':
    'Employs [Assignment: organization-defined automated mechanisms or manual processes] to assist users in making information sharing/collaboration decisions.',
  'AC-21 (1)':
    'The information system enforces information-sharing decisions by authorized users based on access authorizations of sharing partners and access restrictions on information to be shared.',
  'AC-21 (2)':
    'The information system implements information search and retrieval services that enforce [Assignment: organization-defined information sharing restrictions].',
  'AC-22': 'PUBLICLY ACCESSIBLE CONTENT',
  'AC-22 a':
    'Designates individuals authorized to post information onto a publicly accessible information system;',
  'AC-22 b':
    'Trains authorized individuals to ensure that publicly accessible information does not contain nonpublic information;',
  'AC-22 c':
    'Reviews the proposed content of information prior to posting onto the publicly accessible information system to ensure that nonpublic information is not included; and',
  'AC-22 d':
    'Reviews the content on the publicly accessible information system for nonpublic information [Assignment: organization-defined frequency] and removes such information, if discovered.',
  'AC-23':
    'The organization employs [Assignment: organization-defined data mining prevention and detection techniques] for [Assignment: organization-defined data storage objects] to adequately detect and protect against data mining.',
  'AC-24':
    'The organization establishes procedures to ensure [Assignment: organization-defined access control decisions] are applied to each access request prior to access enforcement.',
  'AC-24 (1)':
    'The information system transmits [Assignment: organization-defined access authorization information] using [Assignment: organization-defined security safeguards] to [Assignment: organization-defined information systems] that enforce access control decisions.',
  'AC-24 (2)':
    'The information system enforces access control decisions based on [Assignment: organization-defined security attributes] that do not include the identity of the user or process acting on behalf of the user.',
  'AC-25':
    'The information system implements a reference monitor for [Assignment: organization-defined access control policies] that is tamperproof, always invoked, and small enough to be subject to analysis and testing, the completeness of which can be assured.',
  'AT-1': 'SECURITY AWARENESS AND TRAINING POLICY AND PROCEDURES',
  'AT-1 a':
    'Develops, documents, and disseminates to [Assignment: organization-defined personnel or roles]:',
  'AT-1 a 1':
    'A security awareness and training policy that addresses purpose, scope, roles, responsibilities, management commitment, coordination among organizational entities, and compliance; and',
  'AT-1 a 2':
    'Procedures to facilitate the implementation of the security awareness and training policy and associated security awareness and training controls; and',
  'AT-1 b': 'Reviews and updates the current:',
  'AT-1 b 1':
    'Security awareness and training policy [Assignment: organization-defined frequency]; and',
  'AT-1 b 2':
    'Security awareness and training procedures [Assignment: organization-defined frequency].',
  'AT-2':
    'The organization provides basic security awareness training to information system users (including managers, senior executives, and contractors):',
  'AT-2 a': 'As part of initial training for new users;',
  'AT-2 b': 'When required by information system changes; and',
  'AT-2 c': '[Assignment: organization-defined frequency] thereafter.',
  'AT-2 (1)':
    'The organization includes practical exercises in security awareness training that simulate actual cyber attacks.',
  'AT-2 (2)':
    'The organization includes security awareness training on recognizing and reporting potential indicators of insider threat.',
  'AT-3':
    'The organization provides role-based security training to personnel with assigned security roles and responsibilities:',
  'AT-3 a':
    'Before authorizing access to the information system or performing assigned duties;',
  'AT-3 b': 'When required by information system changes; and',
  'AT-3 c': '[Assignment: organization-defined frequency] thereafter.',
  'AT-3 (1)':
    'The organization provides [Assignment: organization-defined personnel or roles] with initial and [Assignment: organization-defined frequency] training in the employment and operation of environmental controls.',
  'AT-3 (2)':
    'The organization provides [Assignment: organization-defined personnel or roles] with initial and [Assignment: organization-defined frequency] training in the employment and operation of physical security controls.',
  'AT-3 (3)':
    'The organization includes practical exercises in security training that reinforce training objectives.',
  'AT-3 (4)':
    'The organization provides training to its personnel on [Assignment: organization-defined indicators of malicious code] to recognize suspicious communications and anomalous behavior in organizational information systems.',
  'AT-4': 'SECURITY TRAINING RECORDS',
  'AT-4 a':
    'Documents and monitors individual information system security training activities including basic security awareness training and specific information system security training; and',
  'AT-4 b':
    'Retains individual training records for [Assignment: organization-defined time period].',
  'AT-5': '[Withdrawn: Incorporated into PM-15].',
  'AU-1': 'AUDIT AND ACCOUNTABILITY POLICY AND PROCEDURES',
  'AU-1 a':
    'Develops, documents, and disseminates to [Assignment: organization-defined personnel or roles]:',
  'AU-1 a 1':
    'An audit and accountability policy that addresses purpose, scope, roles, responsibilities, management commitment, coordination among organizational entities, and compliance; and',
  'AU-1 a 2':
    'Procedures to facilitate the implementation of the audit and accountability policy and associated audit and accountability controls; and',
  'AU-1 b': 'Reviews and updates the current:',
  'AU-1 b 1':
    'Audit and accountability policy [Assignment: organization-defined frequency]; and',
  'AU-1 b 2':
    'Audit and accountability procedures [Assignment: organization-defined frequency].',
  'AU-2': 'AUDIT EVENTS',
  'AU-2 a':
    'Determines that the information system is capable of auditing the following events: [Assignment: organization-defined auditable events];',
  'AU-2 b':
    'Coordinates the security audit function with other organizational entities requiring audit-related information to enhance mutual support and to help guide the selection of auditable events;',
  'AU-2 c':
    'Provides a rationale for why the auditable events are deemed to be adequate to support after-the-fact investigations of security incidents; and',
  'AU-2 d':
    'Determines that the following events are to be audited within the information system: [Assignment: organization-defined audited events (the subset of the auditable events defined in AU-2 a.) along with the frequency of (or situation requiring) auditing for each identified event].',
  'AU-2 (1)': '[Withdrawn: Incorporated into AU-12].',
  'AU-2 (2)': '[Withdrawn: Incorporated into AU-12].',
  'AU-2 (3)':
    'The organization reviews and updates the audited events [Assignment: organization-defined frequency].',
  'AU-2 (4)': '[Withdrawn: Incorporated into AC-6 (9)].',
  'AU-3':
    'The information system generates audit records containing information that establishes what type of event occurred, when the event occurred, where the event occurred, the source of the event, the outcome of the event, and the identity of any individuals or subjects associated with the event.',
  'AU-3 (1)':
    'The information system generates audit records containing the following additional information: [Assignment: organization-defined additional, more detailed information].',
  'AU-3 (2)':
    'The information system provides centralized management and configuration of the content to be captured in audit records generated by [Assignment: organization-defined information system components].',
  'AU-4':
    'The organization allocates audit record storage capacity in accordance with [Assignment: organization-defined audit record storage requirements].',
  'AU-4 (1)':
    'The information system off-loads audit records [Assignment: organization-defined frequency] onto a different system or media than the system being audited.',
  'AU-5': 'The information system:',
  'AU-5 a':
    'Alerts [Assignment: organization-defined personnel or roles] in the event of an audit processing failure; and',
  'AU-5 b':
    'Takes the following additional actions: [Assignment: organization-defined actions to be taken (e.g., shut down information system, overwrite oldest audit records, stop generating audit records)].',
  'AU-5 (1)':
    'The information system provides a warning to [Assignment: organization-defined personnel, roles, and/or locations] within [Assignment: organization-defined time period] when allocated audit record storage volume reaches [Assignment: organization-defined percentage] of repository maximum audit record storage capacity.',
  'AU-5 (2)':
    'The information system provides an alert in [Assignment: organization-defined real-time period] to [Assignment: organization-defined personnel, roles, and/or locations] when the following audit failure events occur: [Assignment: organization-defined audit failure events requiring real-time alerts].',
  'AU-5 (3)':
    'The information system enforces configurable network communications traffic volume thresholds reflecting limits on auditing capacity and [Selection: rejects; delays] network traffic above those thresholds.',
  'AU-5 (4)':
    'The information system invokes a [Selection: full system shutdown; partial system shutdown; degraded operational mode with limited mission/business functionality available] in the event of [Assignment: organization-defined audit failures], unless an alternate audit capability exists.',
  'AU-6': 'AUDIT REVIEW, ANALYSIS, AND REPORTING',
  'AU-6 a':
    'Reviews and analyzes information system audit records [Assignment: organization-defined frequency] for indications of [Assignment: organization-defined inappropriate or unusual activity]; and',
  'AU-6 b':
    'Reports findings to [Assignment: organization-defined personnel or roles].',
  'AU-6 (1)':
    'The organization employs automated mechanisms to integrate audit review, analysis, and reporting processes to support organizational processes for investigation and response to suspicious activities.',
  'AU-6 (2)': '[Withdrawn: Incorporated into SI-4].',
  'AU-6 (3)':
    'The organization analyzes and correlates audit records across different repositories to gain organization-wide situational awareness.',
  'AU-6 (4)':
    'The information system provides the capability to centrally review and analyze audit records from multiple components within the system.',
  'AU-6 (5)':
    'The organization integrates analysis of audit records with analysis of [Selection (one or more): vulnerability scanning information; performance data; information system monitoring information; [Assignment: organization-defined data/information collected from other sources]] to further enhance the ability to identify inappropriate or unusual activity.',
  'AU-6 (6)':
    'The organization correlates information from audit records with information obtained from monitoring physical access to further enhance the ability to identify suspicious, inappropriate, unusual, or malevolent activity.',
  'AU-6 (7)':
    'The organization specifies the permitted actions for each [Selection (one or more): information system process; role; user] associated with the review, analysis, and reporting of audit information.',
  'AU-6 (8)':
    'The organization performs a full text analysis of audited privileged commands in a physically distinct component or subsystem of the information system, or other information system that is dedicated to that analysis.',
  'AU-6 (9)':
    'The organization correlates information from nontechnical sources with audit information to enhance organization-wide situational awareness.',
  'AU-6 (10)':
    'The organization adjusts the level of audit review, analysis, and reporting within the information system when there is a change in risk based on law enforcement information, intelligence information, or other credible sources of information.',
  'AU-7':
    'The information system provides an audit reduction and report generation capability that:',
  'AU-7 a':
    'Supports on-demand audit review, analysis, and reporting requirements and after-the-fact investigations of security incidents; and',
  'AU-7 b':
    'Does not alter the original content or time ordering of audit records.',
  'AU-7 (1)':
    'The information system provides the capability to process audit records for events of interest based on [Assignment: organization-defined audit fields within audit records].',
  'AU-7 (2)':
    'The information system provides the capability to sort and search audit records for events of interest based on the content of [Assignment: organization-defined audit fields within audit records].',
  'AU-8': 'The information system:',
  'AU-8 a':
    'Uses internal system clocks to generate time stamps for audit records; and',
  'AU-8 b':
    'Records time stamps for audit records that can be mapped to Coordinated Universal Time (UTC) or Greenwich Mean Time (GMT) and meets [Assignment: organization-defined granularity of time measurement].',
  'AU-8 (1)': 'The information system:',
  'AU-8 (1) (a)':
    'Compares the internal information system clocks [Assignment: organization-defined frequency] with [Assignment: organization-defined authoritative time source]; and',
  'AU-8 (1) (b)':
    'Synchronizes the internal system clocks to the authoritative time source when the time difference is greater than [Assignment: organization-defined time period].',
  'AU-8 (2)':
    'The information system identifies a secondary authoritative time source that is located in a different geographic region than the primary authoritative time source.',
  'AU-9':
    'The information system protects audit information and audit tools from unauthorized access, modification, and deletion.',
  'AU-9 (1)':
    'The information system writes audit trails to hardware-enforced, write-once media.',
  'AU-9 (2)':
    'The information system backs up audit records [Assignment: organization-defined frequency] onto a physically different system or system component than the system or component being audited.',
  'AU-9 (3)':
    'The information system implements cryptographic mechanisms to protect the integrity of audit information and audit tools.',
  'AU-9 (4)':
    'The organization authorizes access to management of audit functionality to only [Assignment: organization-defined subset of privileged users].',
  'AU-9 (5)':
    'The organization enforces dual authorization for [Selection (one or more): movement; deletion] of [Assignment: organization-defined audit information].',
  'AU-9 (6)':
    'The organization authorizes read-only access to audit information to [Assignment: organization-defined subset of privileged users].',
  'AU-10':
    'The information system protects against an individual (or process acting on behalf of an individual) falsely denying having performed [Assignment: organization-defined actions to be covered by non-repudiation].',
  'AU-10 (1)': 'The information system:',
  'AU-10 (1) (a)':
    'Binds the identity of the information producer with the information to [Assignment: organization-defined strength of binding]; and',
  'AU-10 (1) (b)':
    'Provides the means for authorized individuals to determine the identity of the producer of the information.',
  'AU-10 (2)': 'The information system:',
  'AU-10 (2) (a)':
    'Validates the binding of the information producer identity to the information at [Assignment: organization-defined frequency]; and',
  'AU-10 (2) (b)':
    'Performs [Assignment: organization-defined actions] in the event of a validation error.',
  'AU-10 (3)':
    'The information system maintains reviewer/releaser identity and credentials within the established chain of custody for all information reviewed or released.',
  'AU-10 (4)': 'The information system:',
  'AU-10 (4) (a)':
    'Validates the binding of the information reviewer identity to the information at the transfer or release points prior to release/transfer between [Assignment: organization-defined security domains]; and',
  'AU-10 (4) (b)':
    'Performs [Assignment: organization-defined actions] in the event of a validation error.',
  'AU-10 (5)': '[Withdrawn: Incorporated into SI-7].',
  'AU-11':
    'The organization retains audit records for [Assignment: organization-defined time period consistent with records retention policy] to provide support for after-the-fact investigations of security incidents and to meet regulatory and organizational information retention requirements.',
  'AU-11 (1)':
    'The organization employs [Assignment: organization-defined measures] to ensure that long-term audit records generated by the information system can be retrieved.',
  'AU-12': 'The information system:',
  'AU-12 a':
    'Provides audit record generation capability for the auditable events defined in AU-2 a. at [Assignment: organization-defined information system components];',
  'AU-12 b':
    'Allows [Assignment: organization-defined personnel or roles] to select which auditable events are to be audited by specific components of the information system; and',
  'AU-12 c':
    'Generates audit records for the events defined in AU-2 d. with the content defined in AU-3.',
  'AU-12 (1)':
    'The information system compiles audit records from [Assignment: organization-defined information system components] into a system-wide (logical or physical) audit trail that is time-correlated to within [Assignment: organization-defined level of tolerance for the relationship between time stamps of individual records in the audit trail].',
  'AU-12 (2)':
    'The information system produces a system-wide (logical or physical) audit trail composed of audit records in a standardized format.',
  'AU-12 (3)':
    'The information system provides the capability for [Assignment: organization-defined individuals or roles] to change the auditing to be performed on [Assignment: organization-defined information system components] based on [Assignment: organization-defined selectable event criteria] within [Assignment: organization-defined time thresholds].',
  'AU-13':
    'The organization monitors [Assignment: organization-defined open source information and/or information sites] [Assignment: organization-defined frequency] for evidence of unauthorized disclosure of organizational information.',
  'AU-13 (1)':
    'The organization employs automated mechanisms to determine if organizational information has been disclosed in an unauthorized manner.',
  'AU-13 (2)':
    'The organization reviews the open source information sites being monitored [Assignment: organization-defined frequency].',
  'AU-14':
    'The information system provides the capability for authorized users to select a user session to capture/record or view/hear.',
  'AU-14 (1)':
    'The information system initiates session audits at system start-up.',
  'AU-14 (2)':
    'The information system provides the capability for authorized users to capture/record and log content related to a user session.',
  'AU-14 (3)':
    'The information system provides the capability for authorized users to remotely view/hear all content related to an established user session in real time.',
  'AU-15':
    'The organization provides an alternate audit capability in the event of a failure in primary audit capability that provides [Assignment: organization-defined alternate audit functionality].',
  'AU-16':
    'The organization employs [Assignment: organization-defined methods] for coordinating [Assignment: organization-defined audit information] among external organizations when audit information is transmitted across organizational boundaries.',
  'AU-16 (1)':
    'The organization requires that the identity of individuals be preserved in cross-organizational audit trails.',
  'AU-16 (2)':
    'The organization provides cross-organizational audit information to [Assignment: organization-defined organizations] based on [Assignment: organization-defined cross-organizational sharing agreements].',
  'CA-1': 'SECURITY ASSESSMENT AND AUTHORIZATION POLICY AND PROCEDURES',
  'CA-1 a':
    'Develops, documents, and disseminates to [Assignment: organization-defined personnel or roles]:',
  'CA-1 a 1':
    'A security assessment and authorization policy that addresses purpose, scope, roles, responsibilities, management commitment, coordination among organizational entities, and compliance; and',
  'CA-1 a 2':
    'Procedures to facilitate the implementation of the security assessment and authorization policy and associated security assessment and authorization controls; and',
  'CA-1 b': 'Reviews and updates the current:',
  'CA-1 b 1':
    'Security assessment and authorization policy [Assignment: organization-defined frequency]; and',
  'CA-1 b 2':
    'Security assessment and authorization procedures [Assignment: organization-defined frequency].',
  'CA-2': 'SECURITY ASSESSMENTS',
  'CA-2 a':
    'Develops a security assessment plan that describes the scope of the assessment including:',
  'CA-2 a 1': 'Security controls and control enhancements under assessment;',
  'CA-2 a 2':
    'Assessment procedures to be used to determine security control effectiveness; and',
  'CA-2 a 3':
    'Assessment environment, assessment team, and assessment roles and responsibilities;',
  'CA-2 b':
    'Assesses the security controls in the information system and its environment of operation [Assignment: organization-defined frequency] to determine the extent to which the controls are implemented correctly, operating as intended, and producing the desired outcome with respect to meeting established security requirements;',
  'CA-2 c':
    'Produces a security assessment report that documents the results of the assessment; and',
  'CA-2 d':
    'Provides the results of the security control assessment to [Assignment: organization-defined individuals or roles].',
  'CA-2 (1)':
    'The organization employs assessors or assessment teams with [Assignment: organization-defined level of independence] to conduct security control assessments.',
  'CA-2 (2)':
    'The organization includes as part of security control assessments, [Assignment: organization-defined frequency], [Selection: announced; unannounced], [Selection (one or more): in-depth monitoring; vulnerability scanning; malicious user testing; insider threat assessment; performance/load testing; [Assignment: organization-defined other forms of security assessment]].',
  'CA-2 (3)':
    'The organization accepts the results of an assessment of [Assignment: organization-defined information system] performed by [Assignment: organization-defined external organization] when the assessment meets [Assignment: organization-defined requirements].',
  'CA-3': 'SYSTEM INTERCONNECTIONS',
  'CA-3 a':
    'Authorizes connections from the information system to other information systems through the use of Interconnection Security Agreements;',
  'CA-3 b':
    'Documents, for each interconnection, the interface characteristics, security requirements, and the nature of the information communicated; and',
  'CA-3 c':
    'Reviews and updates Interconnection Security Agreements [Assignment: organization-defined frequency].',
  'CA-3 (1)':
    'The organization prohibits the direct connection of an [Assignment: organization-defined unclassified, national security system] to an external network without the use of [Assignment: organization-defined boundary protection device].',
  'CA-3 (2)':
    'The organization prohibits the direct connection of a classified, national security system to an external network without the use of [Assignment: organization-defined boundary protection device].',
  'CA-3 (3)':
    'The organization prohibits the direct connection of an [Assignment: organization-defined unclassified, non-national security system] to an external network without the use of [Assignment; organization-defined boundary protection device].',
  'CA-3 (4)':
    'The organization prohibits the direct connection of an [Assignment: organization-defined information system] to a public network.',
  'CA-3 (5)':
    'The organization employs [Selection: allow-all, deny-by-exception; deny-all, permit-by-exception] policy for allowing [Assignment: organization-defined information systems] to connect to external information systems.',
  'CA-4': '[Withdrawn: Incorporated into CA-2].',
  'CA-5': 'PLAN OF ACTION AND MILESTONES',
  'CA-5 a':
    "Develops a plan of action and milestones for the information system to document the organization's planned remedial actions to correct weaknesses or deficiencies noted during the assessment of the security controls and to reduce or eliminate known vulnerabilities in the system; and",
  'CA-5 b':
    'Updates existing plan of action and milestones [Assignment: organization-defined frequency] based on the findings from security controls assessments, security impact analyses, and continuous monitoring activities.',
  'CA-5 (1)':
    'The organization employs automated mechanisms to help ensure that the plan of action and milestones for the information system is accurate, up to date, and readily available.',
  'CA-6': 'SECURITY AUTHORIZATION',
  'CA-6 a':
    'Assigns a senior-level executive or manager as the authorizing official for the information system;',
  'CA-6 b':
    'Ensures that the authorizing official authorizes the information system for processing before commencing operations; and',
  'CA-6 c':
    'Updates the security authorization [Assignment: organization-defined frequency].',
  'CA-7':
    'The organization develops a continuous monitoring strategy and implements a continuous monitoring program that includes:',
  'CA-7 a':
    'Establishment of [Assignment: organization-defined metrics] to be monitored;',
  'CA-7 b':
    'Establishment of [Assignment: organization-defined frequencies] for monitoring and [Assignment: organization-defined frequencies] for assessments supporting such monitoring;',
  'CA-7 c':
    'Ongoing security control assessments in accordance with the organizational continuous monitoring strategy;',
  'CA-7 d':
    'Ongoing security status monitoring of organization-defined metrics in accordance with the organizational continuous monitoring strategy;',
  'CA-7 e':
    'Correlation and analysis of security-related information generated by assessments and monitoring;',
  'CA-7 f':
    'Response actions to address results of the analysis of security-related information; and',
  'CA-7 g':
    'Reporting the security status of organization and the information system to [Assignment: organization-defined personnel or roles] [Assignment: organization-defined frequency].',
  'CA-7 (1)':
    'The organization employs assessors or assessment teams with [Assignment: organization-defined level of independence] to monitor the security controls in the information system on an ongoing basis.',
  'CA-7 (2)': '[Withdrawn: Incorporated into CA-2].',
  'CA-7 (3)':
    'The organization employs trend analyses to determine if security control implementations, the frequency of continuous monitoring activities, and/or the types of activities used in the continuous monitoring process need to be modified based on empirical data.',
  'CA-8':
    'The organization conducts penetration testing [Assignment: organization-defined frequency] on [Assignment: organization-defined information systems or system components].',
  'CA-8 (1)':
    'The organization employs an independent penetration agent or penetration team to perform penetration testing on the information system or system components.',
  'CA-8 (2)':
    'The organization employs [Assignment: organization-defined red team exercises] to simulate attempts by adversaries to compromise organizational information systems in accordance with [Assignment: organization-defined rules of engagement].',
  'CA-9': 'INTERNAL SYSTEM CONNECTIONS',
  'CA-9 a':
    'Authorizes internal connections of [Assignment: organization-defined information system components or classes of components] to the information system; and',
  'CA-9 b':
    'Documents, for each internal connection, the interface characteristics, security requirements, and the nature of the information communicated.',
  'CA-9 (1)':
    'The information system performs security compliance checks on constituent system components prior to the establishment of the internal connection.',
  'CM-1': 'CONFIGURATION MANAGEMENT POLICY AND PROCEDURES',
  'CM-1 a':
    'Develops, documents, and disseminates to [Assignment: organization-defined personnel or roles]:',
  'CM-1 a 1':
    'A configuration management policy that addresses purpose, scope, roles, responsibilities, management commitment, coordination among organizational entities, and compliance; and',
  'CM-1 a 2':
    'Procedures to facilitate the implementation of the configuration management policy and associated configuration management controls; and',
  'CM-1 b': 'Reviews and updates the current:',
  'CM-1 b 1':
    'Configuration management policy [Assignment: organization-defined frequency]; and',
  'CM-1 b 2':
    'Configuration management procedures [Assignment: organization-defined frequency].',
  'CM-2':
    'The organization develops, documents, and maintains under configuration control, a current baseline configuration of the information system.',
  'CM-2 (1)':
    'The organization reviews and updates the baseline configuration of the information system:',
  'CM-2 (1) (a)': '[Assignment: organization-defined frequency];',
  'CM-2 (1) (b)':
    'When required due to [Assignment organization-defined circumstances]; and',
  'CM-2 (1) (c)':
    'As an integral part of information system component installations and upgrades.',
  'CM-2 (2)':
    'The organization employs automated mechanisms to maintain an up-to-date, complete, accurate, and readily available baseline configuration of the information system.',
  'CM-2 (3)':
    'The organization retains [Assignment: organization-defined previous versions of baseline configurations of the information system] to support rollback.',
  'CM-2 (4)': '[Withdrawn: Incorporated into CM-7].',
  'CM-2 (5)': '[Withdrawn: Incorporated into CM-7].',
  'CM-2 (6)':
    'The organization maintains a baseline configuration for information system development and test environments that is managed separately from the operational baseline configuration.',
  'CM-2 (7)': 'CONFIGURE SYSTEMS, COMPONENTS, OR DEVICES FOR HIGH-RISK AREAS',
  'CM-2 (7) (a)':
    'Issues [Assignment: organization-defined information systems, system components, or devices] with [Assignment: organization-defined configurations] to individuals traveling to locations that the organization deems to be of significant risk; and',
  'CM-2 (7) (b)':
    'Applies [Assignment: organization-defined security safeguards] to the devices when the individuals return.',
  'CM-3': 'CONFIGURATION CHANGE CONTROL',
  'CM-3 a':
    'Determines the types of changes to the information system that are configuration-controlled;',
  'CM-3 b':
    'Reviews proposed configuration-controlled changes to the information system and approves or disapproves such changes with explicit consideration for security impact analyses;',
  'CM-3 c':
    'Documents configuration change decisions associated with the information system;',
  'CM-3 d':
    'Implements approved configuration-controlled changes to the information system;',
  'CM-3 e':
    'Retains records of configuration-controlled changes to the information system for [Assignment: organization-defined time period];',
  'CM-3 f':
    'Audits and reviews activities associated with configuration-controlled changes to the information system; and',
  'CM-3 g':
    'Coordinates and provides oversight for configuration change control activities through [Assignment: organization-defined configuration change control element (e.g., committee, board)] that convenes [Selection (one or more): [Assignment: organization-defined frequency]; [Assignment: organization-defined configuration change conditions]].',
  'CM-3 (1)': 'The organization employs automated mechanisms to:',
  'CM-3 (1) (a)': 'Document proposed changes to the information system;',
  'CM-3 (1) (b)':
    'Notify [Assignment: organized-defined approval authorities] of proposed changes to the information system and request change approval;',
  'CM-3 (1) (c)':
    'Highlight proposed changes to the information system that have not been approved or disapproved by [Assignment: organization-defined time period];',
  'CM-3 (1) (d)':
    'Prohibit changes to the information system until designated approvals are received;',
  'CM-3 (1) (e)': 'Document all changes to the information system; and',
  'CM-3 (1) (f)':
    'Notify [Assignment: organization-defined personnel] when approved changes to the information system are completed.',
  'CM-3 (2)':
    'The organization tests, validates, and documents changes to the information system before implementing the changes on the operational system.',
  'CM-3 (3)':
    'The organization employs automated mechanisms to implement changes to the current information system baseline and deploys the updated baseline across the installed base.',
  'CM-3 (4)':
    'The organization requires an information security representative to be a member of the [Assignment: organization-defined configuration change control element].',
  'CM-3 (5)':
    'The information system implements [Assignment: organization-defined security responses] automatically if baseline configurations are changed in an unauthorized manner.',
  'CM-3 (6)':
    'The organization ensures that cryptographic mechanisms used to provide [Assignment: organization-defined security safeguards] are under configuration management.',
  'CM-4':
    'The organization analyzes changes to the information system to determine potential security impacts prior to change implementation.',
  'CM-4 (1)':
    'The organization analyzes changes to the information system in a separate test environment before implementation in an operational environment, looking for security impacts due to flaws, weaknesses, incompatibility, or intentional malice.',
  'CM-4 (2)':
    'The organization, after the information system is changed, checks the security functions to verify that the functions are implemented correctly, operating as intended, and producing the desired outcome with regard to meeting the security requirements for the system.',
  'CM-5':
    'The organization defines, documents, approves, and enforces physical and logical access restrictions associated with changes to the information system.',
  'CM-5 (1)':
    'The information system enforces access restrictions and supports auditing of the enforcement actions.',
  'CM-5 (2)':
    'The organization reviews information system changes [Assignment: organization-defined frequency] and [Assignment: organization-defined circumstances] to determine whether unauthorized changes have occurred.',
  'CM-5 (3)':
    'The information system prevents the installation of [Assignment: organization-defined software and firmware components] without verification that the component has been digitally signed using a certificate that is recognized and approved by the organization.',
  'CM-5 (4)':
    'The organization enforces dual authorization for implementing changes to [Assignment: organization-defined information system components and system-level information].',
  'CM-5 (5)': 'LIMIT PRODUCTION / OPERATIONAL PRIVILEGES',
  'CM-5 (5) (a)':
    'Limits privileges to change information system components and system-related information within a production or operational environment; and',
  'CM-5 (5) (b)':
    'Reviews and reevaluates privileges [Assignment: organization-defined frequency].',
  'CM-5 (6)':
    'The organization limits privileges to change software resident within software libraries.',
  'CM-5 (7)': '[Withdrawn: Incorporated into SI-7].',
  'CM-6': 'CONFIGURATION SETTINGS',
  'CM-6 a':
    'Establishes and documents configuration settings for information technology products employed within the information system using [Assignment: organization-defined security configuration checklists] that reflect the most restrictive mode consistent with operational requirements;',
  'CM-6 b': 'Implements the configuration settings;',
  'CM-6 c':
    'Identifies, documents, and approves any deviations from established configuration settings for [Assignment: organization-defined information system components] based on [Assignment: organization-defined operational requirements]; and',
  'CM-6 d':
    'Monitors and controls changes to the configuration settings in accordance with organizational policies and procedures.',
  'CM-6 (1)':
    'The organization employs automated mechanisms to centrally manage, apply, and verify configuration settings for [Assignment: organization-defined information system components].',
  'CM-6 (2)':
    'The organization employs [Assignment: organization-defined security safeguards] to respond to unauthorized changes to [Assignment: organization-defined configuration settings].',
  'CM-6 (3)': '[Withdrawn: Incorporated into SI-7].',
  'CM-6 (4)': '[Withdrawn: Incorporated into CM-4].',
  'CM-7': 'LEAST FUNCTIONALITY',
  'CM-7 a':
    'Configures the information system to provide only essential capabilities; and',
  'CM-7 b':
    'Prohibits or restricts the use of the following functions, ports, protocols, and/or services: [Assignment: organization-defined prohibited or restricted functions, ports, protocols, and/or services].',
  'CM-7 (1)': 'PERIODIC REVIEW',
  'CM-7 (1) (a)':
    'Reviews the information system [Assignment: organization-defined frequency] to identify unnecessary and/or nonsecure functions, ports, protocols, and services; and',
  'CM-7 (1) (b)':
    'Disables [Assignment: organization-defined functions, ports, protocols, and services within the information system deemed to be unnecessary and/or nonsecure].',
  'CM-7 (2)':
    'The information system prevents program execution in accordance with [Selection (one or more): [Assignment: organization-defined policies regarding software program usage and restrictions]; rules authorizing the terms and conditions of software program usage].',
  'CM-7 (3)':
    'The organization ensures compliance with [Assignment: organization-defined registration requirements for functions, ports, protocols, and services].',
  'CM-7 (4)': 'UNAUTHORIZED SOFTWARE / BLACKLISTING',
  'CM-7 (4) (a)':
    'Identifies [Assignment: organization-defined software programs not authorized to execute on the information system];',
  'CM-7 (4) (b)':
    'Employs an allow-all, deny-by-exception policy to prohibit the execution of unauthorized software programs on the information system; and',
  'CM-7 (4) (c)':
    'Reviews and updates the list of unauthorized software programs [Assignment: organization-defined frequency].',
  'CM-7 (5)': 'AUTHORIZED SOFTWARE / WHITELISTING',
  'CM-7 (5) (a)':
    'Identifies [Assignment: organization-defined software programs authorized to execute on the information system];',
  'CM-7 (5) (b)':
    'Employs a deny-all, permit-by-exception policy to allow the execution of authorized software programs on the information system; and',
  'CM-7 (5) (c)':
    'Reviews and updates the list of authorized software programs [Assignment: organization-defined frequency].',
  'CM-8': 'INFORMATION SYSTEM COMPONENT INVENTORY',
  'CM-8 a':
    'Develops and documents an inventory of information system components that:',
  'CM-8 a 1': 'Accurately reflects the current information system;',
  'CM-8 a 2':
    'Includes all components within the authorization boundary of the information system;',
  'CM-8 a 3':
    'Is at the level of granularity deemed necessary for tracking and reporting; and',
  'CM-8 a 4':
    'Includes [Assignment: organization-defined information deemed necessary to achieve effective information system component accountability]; and',
  'CM-8 b':
    'Reviews and updates the information system component inventory [Assignment: organization-defined frequency].',
  'CM-8 (1)':
    'The organization updates the inventory of information system components as an integral part of component installations, removals, and information system updates.',
  'CM-8 (2)':
    'The organization employs automated mechanisms to help maintain an up-to-date, complete, accurate, and readily available inventory of information system components.',
  'CM-8 (3)': 'AUTOMATED UNAUTHORIZED COMPONENT DETECTION',
  'CM-8 (3) (a)':
    'Employs automated mechanisms [Assignment: organization-defined frequency] to detect the presence of unauthorized hardware, software, and firmware components within the information system; and',
  'CM-8 (3) (b)':
    'Takes the following actions when unauthorized components are detected: [Selection (one or more): disables network access by such components; isolates the components; notifies [Assignment: organization-defined personnel or roles]].',
  'CM-8 (4)':
    'The organization includes in the information system component inventory information, a means for identifying by [Selection (one or more): name; position; role], individuals responsible/accountable for administering those components.',
  'CM-8 (5)':
    'The organization verifies that all components within the authorization boundary of the information system are not duplicated in other information system component inventories.',
  'CM-8 (6)':
    'The organization includes assessed component configurations and any approved deviations to current deployed configurations in the information system component inventory.',
  'CM-8 (7)':
    'The organization provides a centralized repository for the inventory of information system components.',
  'CM-8 (8)':
    'The organization employs automated mechanisms to support tracking of information system components by geographic location.',
  'CM-8 (9)': 'ASSIGNMENT OF COMPONENTS TO SYSTEMS',
  'CM-8 (9) (a)':
    'Assigns [Assignment: organization-defined acquired information system components] to an information system; and',
  'CM-8 (9) (b)':
    'Receives an acknowledgement from the information system owner of this assignment.',
  'CM-9':
    'The organization develops, documents, and implements a configuration management plan for the information system that:',
  'CM-9 a':
    'Addresses roles, responsibilities, and configuration management processes and procedures;',
  'CM-9 b':
    'Establishes a process for identifying configuration items throughout the system development life cycle and for managing the configuration of the configuration items;',
  'CM-9 c':
    'Defines the configuration items for the information system and places the configuration items under configuration management; and',
  'CM-9 d':
    'Protects the configuration management plan from unauthorized disclosure and modification.',
  'CM-9 (1)':
    'The organization assigns responsibility for developing the configuration management process to organizational personnel that are not directly involved in information system development.',
  'CM-10': 'SOFTWARE USAGE RESTRICTIONS',
  'CM-10 a':
    'Uses software and associated documentation in accordance with contract agreements and copyright laws;',
  'CM-10 b':
    'Tracks the use of software and associated documentation protected by quantity licenses to control copying and distribution; and',
  'CM-10 c':
    'Controls and documents the use of peer-to-peer file sharing technology to ensure that this capability is not used for the unauthorized distribution, display, performance, or reproduction of copyrighted work.',
  'CM-10 (1)':
    'The organization establishes the following restrictions on the use of open source software: [Assignment: organization-defined restrictions].',
  'CM-11': 'USER-INSTALLED SOFTWARE',
  'CM-11 a':
    'Establishes [Assignment: organization-defined policies] governing the installation of software by users;',
  'CM-11 b':
    'Enforces software installation policies through [Assignment: organization-defined methods]; and',
  'CM-11 c':
    'Monitors policy compliance at [Assignment: organization-defined frequency].',
  'CM-11 (1)':
    'The information system alerts [Assignment: organization-defined personnel or roles] when the unauthorized installation of software is detected.',
  'CM-11 (2)':
    'The information system prohibits user installation of software without explicit privileged status.',
  'CP-1': 'CONTINGENCY PLANNING POLICY AND PROCEDURES',
  'CP-1 a':
    'Develops, documents, and disseminates to [Assignment: organization-defined personnel or roles]:',
  'CP-1 a 1':
    'A contingency planning policy that addresses purpose, scope, roles, responsibilities, management commitment, coordination among organizational entities, and compliance; and',
  'CP-1 a 2':
    'Procedures to facilitate the implementation of the contingency planning policy and associated contingency planning controls; and',
  'CP-1 b': 'Reviews and updates the current:',
  'CP-1 b 1':
    'Contingency planning policy [Assignment: organization-defined frequency]; and',
  'CP-1 b 2':
    'Contingency planning procedures [Assignment: organization-defined frequency].',
  'CP-2': 'CONTINGENCY PLAN',
  'CP-2 a': 'Develops a contingency plan for the information system that:',
  'CP-2 a 1':
    'Identifies essential missions and business functions and associated contingency requirements;',
  'CP-2 a 2':
    'Provides recovery objectives, restoration priorities, and metrics;',
  'CP-2 a 3':
    'Addresses contingency roles, responsibilities, assigned individuals with contact information;',
  'CP-2 a 4':
    'Addresses maintaining essential missions and business functions despite an information system disruption, compromise, or failure;',
  'CP-2 a 5':
    'Addresses eventual, full information system restoration without deterioration of the security safeguards originally planned and implemented; and',
  'CP-2 a 6':
    'Is reviewed and approved by [Assignment: organization-defined personnel or roles];',
  'CP-2 b':
    'Distributes copies of the contingency plan to [Assignment: organization-defined key contingency personnel (identified by name and/or by role) and organizational elements];',
  'CP-2 c':
    'Coordinates contingency planning activities with incident handling activities;',
  'CP-2 d':
    'Reviews the contingency plan for the information system [Assignment: organization-defined frequency];',
  'CP-2 e':
    'Updates the contingency plan to address changes to the organization, information system, or environment of operation and problems encountered during contingency plan implementation, execution, or testing;',
  'CP-2 f':
    'Communicates contingency plan changes to [Assignment: organization-defined key contingency personnel (identified by name and/or by role) and organizational elements]; and',
  'CP-2 g':
    'Protects the contingency plan from unauthorized disclosure and modification.',
  'CP-2 (1)':
    'The organization coordinates contingency plan development with organizational elements responsible for related plans.',
  'CP-2 (2)':
    'The organization conducts capacity planning so that necessary capacity for information processing, telecommunications, and environmental support exists during contingency operations.',
  'CP-2 (3)':
    'The organization plans for the resumption of essential missions and business functions within [Assignment: organization-defined time period] of contingency plan activation.',
  'CP-2 (4)':
    'The organization plans for the resumption of all missions and business functions within [Assignment: organization-defined time period] of contingency plan activation.',
  'CP-2 (5)':
    'The organization plans for the continuance of essential missions and business functions with little or no loss of operational continuity and sustains that continuity until full information system restoration at primary processing and/or storage sites.',
  'CP-2 (6)':
    'The organization plans for the transfer of essential missions and business functions to alternate processing and/or storage sites with little or no loss of operational continuity and sustains that continuity through information system restoration to primary processing and/or storage sites.',
  'CP-2 (7)':
    'The organization coordinates its contingency plan with the contingency plans of external service providers to ensure that contingency requirements can be satisfied.',
  'CP-2 (8)':
    'The organization identifies critical information system assets supporting essential missions and business functions.',
  'CP-3':
    'The organization provides contingency training to information system users consistent with assigned roles and responsibilities:',
  'CP-3 a':
    'Within [Assignment: organization-defined time period] of assuming a contingency role or responsibility;',
  'CP-3 b': 'When required by information system changes; and',
  'CP-3 c': '[Assignment: organization-defined frequency] thereafter.',
  'CP-3 (1)':
    'The organization incorporates simulated events into contingency training to facilitate effective response by personnel in crisis situations.',
  'CP-3 (2)':
    'The organization employs automated mechanisms to provide a more thorough and realistic contingency training environment.',
  'CP-4': 'CONTINGENCY PLAN TESTING',
  'CP-4 a':
    'Tests the contingency plan for the information system [Assignment: organization-defined frequency] using [Assignment: organization-defined tests] to determine the effectiveness of the plan and the organizational readiness to execute the plan;',
  'CP-4 b': 'Reviews the contingency plan test results; and',
  'CP-4 c': 'Initiates corrective actions, if needed.',
  'CP-4 (1)':
    'The organization coordinates contingency plan testing with organizational elements responsible for related plans.',
  'CP-4 (2)':
    'The organization tests the contingency plan at the alternate processing site:',
  'CP-4 (2) (a)':
    'To familiarize contingency personnel with the facility and available resources; and',
  'CP-4 (2) (b)':
    'To evaluate the capabilities of the alternate processing site to support contingency operations.',
  'CP-4 (3)':
    'The organization employs automated mechanisms to more thoroughly and effectively test the contingency plan.',
  'CP-4 (4)':
    'The organization includes a full recovery and reconstitution of the information system to a known state as part of contingency plan testing.',
  'CP-5': '[Withdrawn: Incorporated into CP-2].',
  'CP-6': 'ALTERNATE STORAGE SITE',
  'CP-6 a':
    'Establishes an alternate storage site including necessary agreements to permit the storage and retrieval of information system backup information; and',
  'CP-6 b':
    'Ensures that the alternate storage site provides information security safeguards equivalent to that of the primary site.',
  'CP-6 (1)':
    'The organization identifies an alternate storage site that is separated from the primary storage site to reduce susceptibility to the same threats.',
  'CP-6 (2)':
    'The organization configures the alternate storage site to facilitate recovery operations in accordance with recovery time and recovery point objectives.',
  'CP-6 (3)':
    'The organization identifies potential accessibility problems to the alternate storage site in the event of an area-wide disruption or disaster and outlines explicit mitigation actions.',
  'CP-7': 'ALTERNATE PROCESSING SITE',
  'CP-7 a':
    'Establishes an alternate processing site including necessary agreements to permit the transfer and resumption of [Assignment: organization-defined information system operations] for essential missions/business functions within [Assignment: organization-defined time period consistent with recovery time and recovery point objectives] when the primary processing capabilities are unavailable;',
  'CP-7 b':
    'Ensures that equipment and supplies required to transfer and resume operations are available at the alternate processing site or contracts are in place to support delivery to the site within the organization-defined time period for transfer/resumption; and',
  'CP-7 c':
    'Ensures that the alternate processing site provides information security safeguards equivalent to those of the primary site.',
  'CP-7 (1)':
    'The organization identifies an alternate processing site that is separated from the primary processing site to reduce susceptibility to the same threats.',
  'CP-7 (2)':
    'The organization identifies potential accessibility problems to the alternate processing site in the event of an area-wide disruption or disaster and outlines explicit mitigation actions.',
  'CP-7 (3)':
    'The organization develops alternate processing site agreements that contain priority-of-service provisions in accordance with organizational availability requirements (including recovery time objectives).',
  'CP-7 (4)':
    'The organization prepares the alternate processing site so that the site is ready to be used as the operational site supporting essential missions and business functions.',
  'CP-7 (5)': '[Withdrawn: Incorporated into CP-7].',
  'CP-7 (6)':
    'The organization plans and prepares for circumstances that preclude returning to the primary processing site.',
  'CP-8':
    'The organization establishes alternate telecommunications services including necessary agreements to permit the resumption of [Assignment: organization-defined information system operations] for essential missions and business functions within [Assignment: organization-defined time period] when the primary telecommunications capabilities are unavailable at either the primary or alternate processing or storage sites.',
  'CP-8 (1)': 'PRIORITY OF SERVICE PROVISIONS',
  'CP-8 (1) (a)':
    'Develops primary and alternate telecommunications service agreements that contain priority-of-service provisions in accordance with organizational availability requirements (including recovery time objectives); and',
  'CP-8 (1) (b)':
    'Requests Telecommunications Service Priority for all telecommunications services used for national security emergency preparedness in the event that the primary and/or alternate telecommunications services are provided by a common carrier.',
  'CP-8 (2)':
    'The organization obtains alternate telecommunications services to reduce the likelihood of sharing a single point of failure with primary telecommunications services.',
  'CP-8 (3)':
    'The organization obtains alternate telecommunications services from providers that are separated from primary service providers to reduce susceptibility to the same threats.',
  'CP-8 (4)': 'PROVIDER CONTINGENCY PLAN',
  'CP-8 (4) (a)':
    'Requires primary and alternate telecommunications service providers to have contingency plans;',
  'CP-8 (4) (b)':
    'Reviews provider contingency plans to ensure that the plans meet organizational contingency requirements; and',
  'CP-8 (4) (c)':
    'Obtains evidence of contingency testing/training by providers [Assignment: organization-defined frequency].',
  'CP-8 (5)':
    'The organization tests alternate telecommunication services [Assignment: organization-defined frequency].',
  'CP-9': 'INFORMATION SYSTEM BACKUP',
  'CP-9 a':
    'Conducts backups of user-level information contained in the information system [Assignment: organization-defined frequency consistent with recovery time and recovery point objectives];',
  'CP-9 b':
    'Conducts backups of system-level information contained in the information system [Assignment: organization-defined frequency consistent with recovery time and recovery point objectives];',
  'CP-9 c':
    'Conducts backups of information system documentation including security-related documentation [Assignment: organization-defined frequency consistent with recovery time and recovery point objectives]; and',
  'CP-9 d':
    'Protects the confidentiality, integrity, and availability of backup information at storage locations.',
  'CP-9 (1)':
    'The organization tests backup information [Assignment: organization-defined frequency] to verify media reliability and information integrity.',
  'CP-9 (2)':
    'The organization uses a sample of backup information in the restoration of selected information system functions as part of contingency plan testing.',
  'CP-9 (3)':
    'The organization stores backup copies of [Assignment: organization-defined critical information system software and other security-related information] in a separate facility or in a fire-rated container that is not collocated with the operational system.',
  'CP-9 (4)': '[Withdrawn: Incorporated into CP-9].',
  'CP-9 (5)':
    'The organization transfers information system backup information to the alternate storage site [Assignment: organization-defined time period and transfer rate consistent with the recovery time and recovery point objectives].',
  'CP-9 (6)':
    'The organization accomplishes information system backup by maintaining a redundant secondary system that is not collocated with the primary system and that can be activated without loss of information or disruption to operations.',
  'CP-9 (7)':
    'The organization enforces dual authorization for the deletion or destruction of [Assignment: organization-defined backup information].',
  'CP-10':
    'The organization provides for the recovery and reconstitution of the information system to a known state after a disruption, compromise, or failure.',
  'CP-10 (1)': '[Withdrawn: Incorporated into CP-4].',
  'CP-10 (2)':
    'The information system implements transaction recovery for systems that are transaction-based.',
  'CP-10 (3)': '[Withdrawn: Addressed through tailoring procedures].',
  'CP-10 (4)':
    'The organization provides the capability to restore information system components within [Assignment: organization-defined restoration time-periods] from configuration-controlled and integrity-protected information representing a known, operational state for the components.',
  'CP-10 (5)': '[Withdrawn: Incorporated into SI-13].',
  'CP-10 (6)':
    'The organization protects backup and restoration hardware, firmware, and software.',
  'CP-11':
    'The information system provides the capability to employ [Assignment: organization-defined alternative communications protocols] in support of maintaining continuity of operations.',
  'CP-12':
    'The information system, when [Assignment: organization-defined conditions] are detected, enters a safe mode of operation with [Assignment: organization-defined restrictions of safe mode of operation].',
  'CP-13':
    'The organization employs [Assignment: organization-defined alternative or supplemental security mechanisms] for satisfying [Assignment: organization-defined security functions] when the primary means of implementing the security function is unavailable or compromised.',
  'IA-1': 'IDENTIFICATION AND AUTHENTICATION POLICY AND PROCEDURES',
  'IA-1 a':
    'Develops, documents, and disseminates to [Assignment: organization-defined personnel or roles]:',
  'IA-1 a 1':
    'An identification and authentication policy that addresses purpose, scope, roles, responsibilities, management commitment, coordination among organizational entities, and compliance; and',
  'IA-1 a 2':
    'Procedures to facilitate the implementation of the identification and authentication policy and associated identification and authentication controls; and',
  'IA-1 b': 'Reviews and updates the current:',
  'IA-1 b 1':
    'Identification and authentication policy [Assignment: organization-defined frequency]; and',
  'IA-1 b 2':
    'Identification and authentication procedures [Assignment: organization-defined frequency].',
  'IA-2':
    'The information system uniquely identifies and authenticates organizational users (or processes acting on behalf of organizational users).',
  'IA-2 (1)':
    'The information system implements multifactor authentication for network access to privileged accounts.',
  'IA-2 (2)':
    'The information system implements multifactor authentication for network access to non-privileged accounts.',
  'IA-2 (3)':
    'The information system implements multifactor authentication for local access to privileged accounts.',
  'IA-2 (4)':
    'The information system implements multifactor authentication for local access to non-privileged accounts.',
  'IA-2 (5)':
    'The organization requires individuals to be authenticated with an individual authenticator when a group authenticator is employed.',
  'IA-2 (6)':
    'The information system implements multifactor authentication for network access to privileged accounts such that one of the factors is provided by a device separate from the system gaining access and the device meets [Assignment: organization-defined strength of mechanism requirements].',
  'IA-2 (7)':
    'The information system implements multifactor authentication for network access to non-privileged accounts such that one of the factors is provided by a device separate from the system gaining access and the device meets [Assignment: organization-defined strength of mechanism requirements].',
  'IA-2 (8)':
    'The information system implements replay-resistant authentication mechanisms for network access to privileged accounts.',
  'IA-2 (9)':
    'The information system implements replay-resistant authentication mechanisms for network access to non-privileged accounts.',
  'IA-2 (10)':
    'The information system provides a single sign-on capability for [Assignment: organization-defined information system accounts and services].',
  'IA-2 (11)':
    'The information system implements multifactor authentication for remote access to privileged and non-privileged accounts such that one of the factors is provided by a device separate from the system gaining access and the device meets [Assignment: organization-defined strength of mechanism requirements].',
  'IA-2 (12)':
    'The information system accepts and electronically verifies Personal Identity Verification (PIV) credentials.',
  'IA-2 (13)':
    'The information system implements [Assignment: organization-defined out-of-band authentication] under [Assignment: organization-defined conditions].',
  'IA-3':
    'The information system uniquely identifies and authenticates [Assignment: organization-defined specific and/or types of devices] before establishing a [Selection (one or more): local; remote; network] connection.',
  'IA-3 (1)':
    'The information system authenticates [Assignment: organization-defined specific devices and/or types of devices] before establishing [Selection (one or more): local; remote; network] connection using bidirectional authentication that is cryptographically based.',
  'IA-3 (2)': '[Withdrawn: Incorporated into IA-3 (1)].',
  'IA-3 (3)': 'DYNAMIC ADDRESS ALLOCATION',
  'IA-3 (3) (a)':
    'Standardizes dynamic address allocation lease information and the lease duration assigned to devices in accordance with [Assignment: organization-defined lease information and lease duration]; and',
  'IA-3 (3) (b)': 'Audits lease information when assigned to a device.',
  'IA-3 (4)':
    'The organization ensures that device identification and authentication based on attestation is handled by [Assignment: organization-defined configuration management process].',
  'IA-4': 'The organization manages information system identifiers by:',
  'IA-4 a':
    'Receiving authorization from [Assignment: organization-defined personnel or roles] to assign an individual, group, role, or device identifier;',
  'IA-4 b':
    'Selecting an identifier that identifies an individual, group, role, or device;',
  'IA-4 c':
    'Assigning the identifier to the intended individual, group, role, or device;',
  'IA-4 d':
    'Preventing reuse of identifiers for [Assignment: organization-defined time period]; and',
  'IA-4 e':
    'Disabling the identifier after [Assignment: organization-defined time period of inactivity].',
  'IA-4 (1)':
    'The organization prohibits the use of information system account identifiers that are the same as public identifiers for individual electronic mail accounts.',
  'IA-4 (2)':
    'The organization requires that the registration process to receive an individual identifier includes supervisor authorization.',
  'IA-4 (3)':
    'The organization requires multiple forms of certification of individual identification be presented to the registration authority.',
  'IA-4 (4)':
    'The organization manages individual identifiers by uniquely identifying each individual as [Assignment: organization-defined characteristic identifying individual status].',
  'IA-4 (5)': 'The information system dynamically manages identifiers.',
  'IA-4 (6)':
    'The organization coordinates with [Assignment: organization-defined external organizations] for cross-organization management of identifiers.',
  'IA-4 (7)':
    'The organization requires that the registration process to receive an individual identifier be conducted in person before a designated registration authority.',
  'IA-5': 'The organization manages information system authenticators by:',
  'IA-5 a':
    'Verifying, as part of the initial authenticator distribution, the identity of the individual, group, role, or device receiving the authenticator;',
  'IA-5 b':
    'Establishing initial authenticator content for authenticators defined by the organization;',
  'IA-5 c':
    'Ensuring that authenticators have sufficient strength of mechanism for their intended use;',
  'IA-5 d':
    'Establishing and implementing administrative procedures for initial authenticator distribution, for lost/compromised or damaged authenticators, and for revoking authenticators;',
  'IA-5 e':
    'Changing default content of authenticators prior to information system installation;',
  'IA-5 f':
    'Establishing minimum and maximum lifetime restrictions and reuse conditions for authenticators;',
  'IA-5 g':
    'Changing/refreshing authenticators [Assignment: organization-defined time period by authenticator type];',
  'IA-5 h':
    'Protecting authenticator content from unauthorized disclosure and modification;',
  'IA-5 i':
    'Requiring individuals to take, and having devices implement, specific security safeguards to protect authenticators; and',
  'IA-5 j':
    'Changing authenticators for group/role accounts when membership to those accounts changes.',
  'IA-5 (1)': 'The information system, for password-based authentication:',
  'IA-5 (1) (a)':
    'Enforces minimum password complexity of [Assignment: organization-defined requirements for case sensitivity, number of characters, mix of upper-case letters, lower-case letters, numbers, and special characters, including minimum requirements for each type];',
  'IA-5 (1) (b)':
    'Enforces at least the following number of changed characters when new passwords are created: [Assignment: organization-defined number];',
  'IA-5 (1) (c)':
    'Stores and transmits only cryptographically-protected passwords;',
  'IA-5 (1) (d)':
    'Enforces password minimum and maximum lifetime restrictions of [Assignment: organization-defined numbers for lifetime minimum, lifetime maximum];',
  'IA-5 (1) (e)':
    'Prohibits password reuse for [Assignment: organization-defined number] generations; and',
  'IA-5 (1) (f)':
    'Allows the use of a temporary password for system logons with an immediate change to a permanent password.',
  'IA-5 (2)': 'The information system, for PKI-based authentication:',
  'IA-5 (2) (a)':
    'Validates certifications by constructing and verifying a certification path to an accepted trust anchor including checking certificate status information;',
  'IA-5 (2) (b)':
    'Enforces authorized access to the corresponding private key;',
  'IA-5 (2) (c)':
    'Maps the authenticated identity to the account of the individual or group; and',
  'IA-5 (2) (d)':
    'Implements a local cache of revocation data to support path discovery and validation in case of inability to access revocation information via the network.',
  'IA-5 (3)':
    'The organization requires that the registration process to receive [Assignment: organization-defined types of and/or specific authenticators] be conducted [Selection: in person; by a trusted third party] before [Assignment: organization-defined registration authority] with authorization by [Assignment: organization-defined personnel or roles].',
  'IA-5 (4)':
    'The organization employs automated tools to determine if password authenticators are sufficiently strong to satisfy [Assignment: organization-defined requirements].',
  'IA-5 (5)':
    'The organization requires developers/installers of information system components to provide unique authenticators or change default authenticators prior to delivery/installation.',
  'IA-5 (6)':
    'The organization protects authenticators commensurate with the security category of the information to which use of the authenticator permits access.',
  'IA-5 (7)':
    'The organization ensures that unencrypted static authenticators are not embedded in applications or access scripts or stored on function keys.',
  'IA-5 (8)':
    'The organization implements [Assignment: organization-defined security safeguards] to manage the risk of compromise due to individuals having accounts on multiple information systems.',
  'IA-5 (9)':
    'The organization coordinates with [Assignment: organization-defined external organizations] for cross-organization management of credentials.',
  'IA-5 (10)': 'The information system dynamically provisions identities.',
  'IA-5 (11)':
    'The information system, for hardware token-based authentication, employs mechanisms that satisfy [Assignment: organization-defined token quality requirements].',
  'IA-5 (12)':
    'The information system, for biometric-based authentication, employs mechanisms that satisfy [Assignment: organization-defined biometric quality requirements].',
  'IA-5 (13)':
    'The information system prohibits the use of cached authenticators after [Assignment: organization-defined time period].',
  'IA-5 (14)':
    'The organization, for PKI-based authentication, employs a deliberate organization-wide methodology for managing the content of PKI trust stores installed across all platforms including networks, operating systems, browsers, and applications.',
  'IA-5 (15)':
    'The organization uses only FICAM-approved path discovery and validation products and services.',
  'IA-6':
    'The information system obscures feedback of authentication information during the authentication process to protect the information from possible exploitation/use by unauthorized individuals.',
  'IA-7':
    'The information system implements mechanisms for authentication to a cryptographic module that meet the requirements of applicable federal laws, Executive Orders, directives, policies, regulations, standards, and guidance for such authentication.',
  'IA-8':
    'The information system uniquely identifies and authenticates non-organizational users (or processes acting on behalf of non-organizational users).',
  'IA-8 (1)':
    'The information system accepts and electronically verifies Personal Identity Verification (PIV) credentials from other federal agencies.',
  'IA-8 (2)':
    'The information system accepts only FICAM-approved third-party credentials.',
  'IA-8 (3)':
    'The organization employs only FICAM-approved information system components in [Assignment: organization-defined information systems] to accept third-party credentials.',
  'IA-8 (4)': 'The information system conforms to FICAM-issued profiles.',
  'IA-8 (5)':
    'The information system accepts and electronically verifies Personal Identity Verification-I (PIV-I) credentials.',
  'IA-9':
    'The organization identifies and authenticates [Assignment: organization-defined information system services] using [Assignment: organization-defined security safeguards].',
  'IA-9 (1)':
    'The organization ensures that service providers receive, validate, and transmit identification and authentication information.',
  'IA-9 (2)':
    'The organization ensures that identification and authentication decisions are transmitted between [Assignment: organization-defined services] consistent with organizational policies.',
  'IA-10':
    'The organization requires that individuals accessing the information system employ [Assignment: organization-defined supplemental authentication techniques or mechanisms] under specific [Assignment: organization-defined circumstances or situations].',
  'IA-11':
    'The organization requires users and devices to re-authenticate when [Assignment: organization-defined circumstances or situations requiring re-authentication].',
  'IR-1': 'INCIDENT RESPONSE POLICY AND PROCEDURES',
  'IR-1 a':
    'Develops, documents, and disseminates to [Assignment: organization-defined personnel or roles]:',
  'IR-1 a 1':
    'An incident response policy that addresses purpose, scope, roles, responsibilities, management commitment, coordination among organizational entities, and compliance; and',
  'IR-1 a 2':
    'Procedures to facilitate the implementation of the incident response policy and associated incident response controls; and',
  'IR-1 b': 'Reviews and updates the current:',
  'IR-1 b 1':
    'Incident response policy [Assignment: organization-defined frequency]; and',
  'IR-1 b 2':
    'Incident response procedures [Assignment: organization-defined frequency].',
  'IR-2':
    'The organization provides incident response training to information system users consistent with assigned roles and responsibilities:',
  'IR-2 a':
    'Within [Assignment: organization-defined time period] of assuming an incident response role or responsibility;',
  'IR-2 b': 'When required by information system changes; and',
  'IR-2 c': '[Assignment: organization-defined frequency] thereafter.',
  'IR-2 (1)':
    'The organization incorporates simulated events into incident response training to facilitate effective response by personnel in crisis situations.',
  'IR-2 (2)':
    'The organization employs automated mechanisms to provide a more thorough and realistic incident response training environment.',
  'IR-3':
    'The organization tests the incident response capability for the information system [Assignment: organization-defined frequency] using [Assignment: organization-defined tests] to determine the incident response effectiveness and documents the results.',
  'IR-3 (1)':
    'The organization employs automated mechanisms to more thoroughly and effectively test the incident response capability.',
  'IR-3 (2)':
    'The organization coordinates incident response testing with organizational elements responsible for related plans.',
  'IR-4': 'INCIDENT HANDLING',
  'IR-4 a':
    'Implements an incident handling capability for security incidents that includes preparation, detection and analysis, containment, eradication, and recovery;',
  'IR-4 b':
    'Coordinates incident handling activities with contingency planning activities; and',
  'IR-4 c':
    'Incorporates lessons learned from ongoing incident handling activities into incident response procedures, training, and testing, and implements the resulting changes accordingly.',
  'IR-4 (1)':
    'The organization employs automated mechanisms to support the incident handling process.',
  'IR-4 (2)':
    'The organization includes dynamic reconfiguration of [Assignment: organization-defined information system components] as part of the incident response capability.',
  'IR-4 (3)':
    'The organization identifies [Assignment: organization-defined classes of incidents] and [Assignment: organization-defined actions to take in response to classes of incidents] to ensure continuation of organizational missions and business functions.',
  'IR-4 (4)':
    'The organization correlates incident information and individual incident responses to achieve an organization-wide perspective on incident awareness and response.',
  'IR-4 (5)':
    'The organization implements a configurable capability to automatically disable the information system if [Assignment: organization-defined security violations] are detected.',
  'IR-4 (6)':
    'The organization implements incident handling capability for insider threats.',
  'IR-4 (7)':
    'The organization coordinates incident handling capability for insider threats across [Assignment: organization-defined components or elements of the organization].',
  'IR-4 (8)':
    'The organization coordinates with [Assignment: organization-defined external organizations] to correlate and share [Assignment: organization-defined incident information] to achieve a cross-organization perspective on incident awareness and more effective incident responses.',
  'IR-4 (9)':
    'The organization employs [Assignment: organization-defined dynamic response capabilities] to effectively respond to security incidents.',
  'IR-4 (10)':
    'The organization coordinates incident handling activities involving supply chain events with other organizations involved in the supply chain.',
  'IR-5':
    'The organization tracks and documents information system security incidents.',
  'IR-5 (1)':
    'The organization employs automated mechanisms to assist in the tracking of security incidents and in the collection and analysis of incident information.',
  'IR-6': 'INCIDENT REPORTING',
  'IR-6 a':
    'Requires personnel to report suspected security incidents to the organizational incident response capability within [Assignment: organization-defined time period]; and',
  'IR-6 b':
    'Reports security incident information to [Assignment: organization-defined authorities].',
  'IR-6 (1)':
    'The organization employs automated mechanisms to assist in the reporting of security incidents.',
  'IR-6 (2)':
    'The organization reports information system vulnerabilities associated with reported security incidents to [Assignment: organization-defined personnel or roles].',
  'IR-6 (3)':
    'The organization provides security incident information to other organizations involved in the supply chain for information systems or information system components related to the incident.',
  'IR-7':
    'The organization provides an incident response support resource, integral to the organizational incident response capability that offers advice and assistance to users of the information system for the handling and reporting of security incidents.',
  'IR-7 (1)':
    'The organization employs automated mechanisms to increase the availability of incident response-related information and support.',
  'IR-7 (2)': 'COORDINATION WITH EXTERNAL PROVIDERS',
  'IR-7 (2) (a)':
    'Establishes a direct, cooperative relationship between its incident response capability and external providers of information system protection capability; and',
  'IR-7 (2) (b)':
    'Identifies organizational incident response team members to the external providers.',
  'IR-8': 'INCIDENT RESPONSE PLAN',
  'IR-8 a': 'Develops an incident response plan that:',
  'IR-8 a 1':
    'Provides the organization with a roadmap for implementing its incident response capability;',
  'IR-8 a 2':
    'Describes the structure and organization of the incident response capability;',
  'IR-8 a 3':
    'Provides a high-level approach for how the incident response capability fits into the overall organization;',
  'IR-8 a 4':
    'Meets the unique requirements of the organization, which relate to mission, size, structure, and functions;',
  'IR-8 a 5': 'Defines reportable incidents;',
  'IR-8 a 6':
    'Provides metrics for measuring the incident response capability within the organization;',
  'IR-8 a 7':
    'Defines the resources and management support needed to effectively maintain and mature an incident response capability; and',
  'IR-8 a 8':
    'Is reviewed and approved by [Assignment: organization-defined personnel or roles];',
  'IR-8 b':
    'Distributes copies of the incident response plan to [Assignment: organization-defined incident response personnel (identified by name and/or by role) and organizational elements];',
  'IR-8 c':
    'Reviews the incident response plan [Assignment: organization-defined frequency];',
  'IR-8 d':
    'Updates the incident response plan to address system/organizational changes or problems encountered during plan implementation, execution, or testing;',
  'IR-8 e':
    'Communicates incident response plan changes to [Assignment: organization-defined incident response personnel (identified by name and/or by role) and organizational elements]; and',
  'IR-8 f':
    'Protects the incident response plan from unauthorized disclosure and modification.',
  'IR-9': 'The organization responds to information spills by:',
  'IR-9 a':
    'Identifying the specific information involved in the information system contamination;',
  'IR-9 b':
    'Alerting [Assignment: organization-defined personnel or roles] of the information spill using a method of communication not associated with the spill;',
  'IR-9 c':
    'Isolating the contaminated information system or system component;',
  'IR-9 d':
    'Eradicating the information from the contaminated information system or component;',
  'IR-9 e':
    'Identifying other information systems or system components that may have been subsequently contaminated; and',
  'IR-9 f': 'Performing other [Assignment: organization-defined actions].',
  'IR-9 (1)':
    'The organization assigns [Assignment: organization-defined personnel or roles] with responsibility for responding to information spills.',
  'IR-9 (2)':
    'The organization provides information spillage response training [Assignment: organization-defined frequency].',
  'IR-9 (3)':
    'The organization implements [Assignment: organization-defined procedures] to ensure that organizational personnel impacted by information spills can continue to carry out assigned tasks while contaminated systems are undergoing corrective actions.',
  'IR-9 (4)':
    'The organization employs [Assignment: organization-defined security safeguards] for personnel exposed to information not within assigned access authorizations.',
  'IR-10':
    'The organization establishes an integrated team of forensic/malicious code analysts, tool developers, and real-time operations personnel.',
  'MA-1': 'SYSTEM MAINTENANCE POLICY AND PROCEDURES',
  'MA-1 a':
    'Develops, documents, and disseminates to [Assignment: organization-defined personnel or roles]:',
  'MA-1 a 1':
    'A system maintenance policy that addresses purpose, scope, roles, responsibilities, management commitment, coordination among organizational entities, and compliance; and',
  'MA-1 a 2':
    'Procedures to facilitate the implementation of the system maintenance policy and associated system maintenance controls; and',
  'MA-1 b': 'Reviews and updates the current:',
  'MA-1 b 1':
    'System maintenance policy [Assignment: organization-defined frequency]; and',
  'MA-1 b 2':
    'System maintenance procedures [Assignment: organization-defined frequency].',
  'MA-2': 'CONTROLLED MAINTENANCE',
  'MA-2 a':
    'Schedules, performs, documents, and reviews records of maintenance and repairs on information system components in accordance with manufacturer or vendor specifications and/or organizational requirements;',
  'MA-2 b':
    'Approves and monitors all maintenance activities, whether performed on site or remotely and whether the equipment is serviced on site or removed to another location;',
  'MA-2 c':
    'Requires that [Assignment: organization-defined personnel or roles] explicitly approve the removal of the information system or system components from organizational facilities for off-site maintenance or repairs;',
  'MA-2 d':
    'Sanitizes equipment to remove all information from associated media prior to removal from organizational facilities for off-site maintenance or repairs;',
  'MA-2 e':
    'Checks all potentially impacted security controls to verify that the controls are still functioning properly following maintenance or repair actions; and',
  'MA-2 f':
    'Includes [Assignment: organization-defined maintenance-related information] in organizational maintenance records.',
  'MA-2 (1)': '[Withdrawn: Incorporated into MA-2].',
  'MA-2 (2)': 'AUTOMATED MAINTENANCE ACTIVITIES',
  'MA-2 (2) (a)':
    'Employs automated mechanisms to schedule, conduct, and document maintenance and repairs; and',
  'MA-2 (2) (b)':
    'Produces up-to date, accurate, and complete records of all maintenance and repair actions requested, scheduled, in process, and completed.',
  'MA-3':
    'The organization approves, controls, and monitors information system maintenance tools.',
  'MA-3 (1)':
    'The organization inspects the maintenance tools carried into a facility by maintenance personnel for improper or unauthorized modifications.',
  'MA-3 (2)':
    'The organization checks media containing diagnostic and test programs for malicious code before the media are used in the information system.',
  'MA-3 (3)':
    'The organization prevents the unauthorized removal of maintenance equipment containing organizational information by:',
  'MA-3 (3) (a)':
    'Verifying that there is no organizational information contained on the equipment;',
  'MA-3 (3) (b)': 'Sanitizing or destroying the equipment;',
  'MA-3 (3) (c)': 'Retaining the equipment within the facility; or',
  'MA-3 (3) (d)':
    'Obtaining an exemption from [Assignment: organization-defined personnel or roles] explicitly authorizing removal of the equipment from the facility.',
  'MA-3 (4)':
    'The information system restricts the use of maintenance tools to authorized personnel only.',
  'MA-4': 'NONLOCAL MAINTENANCE',
  'MA-4 a':
    'Approves and monitors nonlocal maintenance and diagnostic activities;',
  'MA-4 b':
    'Allows the use of nonlocal maintenance and diagnostic tools only as consistent with organizational policy and documented in the security plan for the information system;',
  'MA-4 c':
    'Employs strong authenticators in the establishment of nonlocal maintenance and diagnostic sessions;',
  'MA-4 d':
    'Maintains records for nonlocal maintenance and diagnostic activities; and',
  'MA-4 e':
    'Terminates session and network connections when nonlocal maintenance is completed.',
  'MA-4 (1)': 'AUDITING AND REVIEW',
  'MA-4 (1) (a)':
    'Audits nonlocal maintenance and diagnostic sessions [Assignment: organization-defined audit events]; and',
  'MA-4 (1) (b)':
    'Reviews the records of the maintenance and diagnostic sessions.',
  'MA-4 (2)':
    'The organization documents in the security plan for the information system, the policies and procedures for the establishment and use of nonlocal maintenance and diagnostic connections.',
  'MA-4 (3)': 'COMPARABLE SECURITY / SANITIZATION',
  'MA-4 (3) (a)':
    'Requires that nonlocal maintenance and diagnostic services be performed from an information system that implements a security capability comparable to the capability implemented on the system being serviced; or',
  'MA-4 (3) (b)':
    'Removes the component to be serviced from the information system prior to nonlocal maintenance or diagnostic services, sanitizes the component (with regard to organizational information) before removal from organizational facilities, and after the service is performed, inspects and sanitizes the component (with regard to potentially malicious software) before reconnecting the component to the information system.',
  'MA-4 (4)': 'The organization protects nonlocal maintenance sessions by:',
  'MA-4 (4) (a)':
    'Employing [Assignment: organization-defined authenticators that are replay resistant]; and',
  'MA-4 (4) (b)':
    'Separating the maintenance sessions from other network sessions with the information system by either:',
  'MA-4 (4) (b) (1)': 'Physically separated communications paths; or',
  'MA-4 (4) (b) (2)':
    'Logically separated communications paths based upon encryption.',
  'MA-4 (5)': 'APPROVALS AND NOTIFICATIONS',
  'MA-4 (5) (a)':
    'Requires the approval of each nonlocal maintenance session by [Assignment: organization-defined personnel or roles]; and',
  'MA-4 (5) (b)':
    'Notifies [Assignment: organization-defined personnel or roles] of the date and time of planned nonlocal maintenance.',
  'MA-4 (6)':
    'The information system implements cryptographic mechanisms to protect the integrity and confidentiality of nonlocal maintenance and diagnostic communications.',
  'MA-4 (7)':
    'The information system implements remote disconnect verification at the termination of nonlocal maintenance and diagnostic sessions.',
  'MA-5': 'MAINTENANCE PERSONNEL',
  'MA-5 a':
    'Establishes a process for maintenance personnel authorization and maintains a list of authorized maintenance organizations or personnel;',
  'MA-5 b':
    'Ensures that non-escorted personnel performing maintenance on the information system have required access authorizations; and',
  'MA-5 c':
    'Designates organizational personnel with required access authorizations and technical competence to supervise the maintenance activities of personnel who do not possess the required access authorizations.',
  'MA-5 (1)': 'INDIVIDUALS WITHOUT APPROPRIATE ACCESS',
  'MA-5 (1) (a)':
    'Implements procedures for the use of maintenance personnel that lack appropriate security clearances or are not U.S. citizens, that include the following requirements:',
  'MA-5 (1) (a) (1)':
    'Maintenance personnel who do not have needed access authorizations, clearances, or formal access approvals are escorted and supervised during the performance of maintenance and diagnostic activities on the information system by approved organizational personnel who are fully cleared, have appropriate access authorizations, and are technically qualified;',
  'MA-5 (1) (a) (2)':
    'Prior to initiating maintenance or diagnostic activities by personnel who do not have needed access authorizations, clearances or formal access approvals, all volatile information storage components within the information system are sanitized and all nonvolatile storage media are removed or physically disconnected from the system and secured; and',
  'MA-5 (1) (b)':
    'Develops and implements alternate security safeguards in the event an information system component cannot be sanitized, removed, or disconnected from the system.',
  'MA-5 (2)':
    'The organization ensures that personnel performing maintenance and diagnostic activities on an information system processing, storing, or transmitting classified information possess security clearances and formal access approvals for at least the highest classification level and for all compartments of information on the system.',
  'MA-5 (3)':
    'The organization ensures that personnel performing maintenance and diagnostic activities on an information system processing, storing, or transmitting classified information are U.S. citizens.',
  'MA-5 (4)': 'The organization ensures that:',
  'MA-5 (4) (a)':
    'Cleared foreign nationals (i.e., foreign nationals with appropriate security clearances), are used to conduct maintenance and diagnostic activities on classified information systems only when the systems are jointly owned and operated by the United States and foreign allied governments, or owned and operated solely by foreign allied governments; and',
  'MA-5 (4) (b)':
    'Approvals, consents, and detailed operational conditions regarding the use of foreign nationals to conduct maintenance and diagnostic activities on classified information systems are fully documented within Memoranda of Agreements.',
  'MA-5 (5)':
    'The organization ensures that non-escorted personnel performing maintenance activities not directly associated with the information system but in the physical proximity of the system, have required access authorizations.',
  'MA-6':
    'The organization obtains maintenance support and/or spare parts for [Assignment: organization-defined information system components] within [Assignment: organization-defined time period] of failure.',
  'MA-6 (1)':
    'The organization performs preventive maintenance on [Assignment: organization-defined information system components] at [Assignment: organization-defined time intervals].',
  'MA-6 (2)':
    'The organization performs predictive maintenance on [Assignment: organization-defined information system components] at [Assignment: organization-defined time intervals].',
  'MA-6 (3)':
    'The organization employs automated mechanisms to transfer predictive maintenance data to a computerized maintenance management system.',
  'MP-1': 'MEDIA PROTECTION POLICY AND PROCEDURES',
  'MP-1 a':
    'Develops, documents, and disseminates to [Assignment: organization-defined personnel or roles]:',
  'MP-1 a 1':
    'A media protection policy that addresses purpose, scope, roles, responsibilities, management commitment, coordination among organizational entities, and compliance; and',
  'MP-1 a 2':
    'Procedures to facilitate the implementation of the media protection policy and associated media protection controls; and',
  'MP-1 b': 'Reviews and updates the current:',
  'MP-1 b 1':
    'Media protection policy [Assignment: organization-defined frequency]; and',
  'MP-1 b 2':
    'Media protection procedures [Assignment: organization-defined frequency].',
  'MP-2':
    'The organization restricts access to [Assignment: organization-defined types of digital and/or non-digital media] to [Assignment: organization-defined personnel or roles].',
  'MP-2 (1)': '[Withdrawn: Incorporated into MP-4 (2)].',
  'MP-2 (2)': '[Withdrawn: Incorporated into SC-28 (1)].',
  'MP-3': 'MEDIA MARKING',
  'MP-3 a':
    'Marks information system media indicating the distribution limitations, handling caveats, and applicable security markings (if any) of the information; and',
  'MP-3 b':
    'Exempts [Assignment: organization-defined types of information system media] from marking as long as the media remain within [Assignment: organization-defined controlled areas].',
  'MP-4': 'MEDIA STORAGE',
  'MP-4 a':
    'Physically controls and securely stores [Assignment: organization-defined types of digital and/or non-digital media] within [Assignment: organization-defined controlled areas]; and',
  'MP-4 b':
    'Protects information system media until the media are destroyed or sanitized using approved equipment, techniques, and procedures.',
  'MP-4 (1)': '[Withdrawn: Incorporated into SC-28 (1)].',
  'MP-4 (2)':
    'The organization employs automated mechanisms to restrict access to media storage areas and to audit access attempts and access granted.',
  'MP-5': 'MEDIA TRANSPORT',
  'MP-5 a':
    'Protects and controls [Assignment: organization-defined types of information system media] during transport outside of controlled areas using [Assignment: organization-defined security safeguards];',
  'MP-5 b':
    'Maintains accountability for information system media during transport outside of controlled areas;',
  'MP-5 c':
    'Documents activities associated with the transport of information system media; and',
  'MP-5 d':
    'Restricts the activities associated with the transport of information system media to authorized personnel.',
  'MP-5 (1)': '[Withdrawn: Incorporated into MP-5].',
  'MP-5 (2)': '[Withdrawn: Incorporated into MP-5].',
  'MP-5 (3)':
    'The organization employs an identified custodian during transport of information system media outside of controlled areas.',
  'MP-5 (4)':
    'The information system implements cryptographic mechanisms to protect the confidentiality and integrity of information stored on digital media during transport outside of controlled areas.',
  'MP-6': 'MEDIA SANITIZATION',
  'MP-6 a':
    'Sanitizes [Assignment: organization-defined information system media] prior to disposal, release out of organizational control, or release for reuse using [Assignment: organization-defined sanitization techniques and procedures] in accordance with applicable federal and organizational standards and policies; and',
  'MP-6 b':
    'Employs sanitization mechanisms with the strength and integrity commensurate with the security category or classification of the information.',
  'MP-6 (1)':
    'The organization reviews, approves, tracks, documents, and verifies media sanitization and disposal actions.',
  'MP-6 (2)':
    'The organization tests sanitization equipment and procedures [Assignment: organization-defined frequency] to verify that the intended sanitization is being achieved.',
  'MP-6 (3)':
    'The organization applies nondestructive sanitization techniques to portable storage devices prior to connecting such devices to the information system under the following circumstances: [Assignment: organization-defined circumstances requiring sanitization of portable storage devices].',
  'MP-6 (4)': '[Withdrawn: Incorporated into MP-6].',
  'MP-6 (5)': '[Withdrawn: Incorporated into MP-6].',
  'MP-6 (6)': '[Withdrawn: Incorporated into MP-6].',
  'MP-6 (7)':
    'The organization enforces dual authorization for the sanitization of [Assignment: organization-defined information system media].',
  'MP-6 (8)':
    'The organization provides the capability to purge/wipe information from [Assignment: organization-defined information systems, system components, or devices] either remotely or under the following conditions: [Assignment: organization-defined conditions].',
  'MP-7':
    'The organization [Selection: restricts; prohibits] the use of [Assignment: organization-defined types of information system media] on [Assignment: organization-defined information systems or system components] using [Assignment: organization-defined security safeguards].',
  'MP-7 (1)':
    'The organization prohibits the use of portable storage devices in organizational information systems when such devices have no identifiable owner.',
  'MP-7 (2)':
    'The organization prohibits the use of sanitization-resistant media in organizational information systems.',
  'MP-8': 'MEDIA DOWNGRADING',
  'MP-8 a':
    'Establishes [Assignment: organization-defined information system media downgrading process] that includes employing downgrading mechanisms with [Assignment: organization-defined strength and integrity];',
  'MP-8 b':
    'Ensures that the information system media downgrading process is commensurate with the security category and/or classification level of the information to be removed and the access authorizations of the potential recipients of the downgraded information;',
  'MP-8 c':
    'Identifies [Assignment: organization-defined information system media requiring downgrading]; and',
  'MP-8 d':
    'Downgrades the identified information system media using the established process.',
  'MP-8 (1)':
    'The organization documents information system media downgrading actions.',
  'MP-8 (2)':
    'The organization employs [Assignment: organization-defined tests] of downgrading equipment and procedures to verify correct performance [Assignment: organization-defined frequency].',
  'MP-8 (3)':
    'The organization downgrades information system media containing [Assignment: organization-defined Controlled Unclassified Information (CUI)] prior to public release in accordance with applicable federal and organizational standards and policies.',
  'MP-8 (4)':
    'The organization downgrades information system media containing classified information prior to release to individuals without required access authorizations in accordance with NSA standards and policies.',
  'PE-1': 'PHYSICAL AND ENVIRONMENTAL PROTECTION POLICY AND PROCEDURES',
  'PE-1 a':
    'Develops, documents, and disseminates to [Assignment: organization-defined personnel or roles]:',
  'PE-1 a 1':
    'A physical and environmental protection policy that addresses purpose, scope, roles, responsibilities, management commitment, coordination among organizational entities, and compliance; and',
  'PE-1 a 2':
    'Procedures to facilitate the implementation of the physical and environmental protection policy and associated physical and environmental protection controls; and',
  'PE-1 b': 'Reviews and updates the current:',
  'PE-1 b 1':
    'Physical and environmental protection  policy [Assignment: organization-defined frequency]; and',
  'PE-1 b 2':
    'Physical and environmental protection procedures [Assignment: organization-defined frequency].',
  'PE-2': 'PHYSICAL ACCESS AUTHORIZATIONS',
  'PE-2 a':
    'Develops, approves, and maintains a list of individuals with authorized access to the facility where the information system resides;',
  'PE-2 b': 'Issues authorization credentials for facility access;',
  'PE-2 c':
    'Reviews the access list detailing authorized facility access by individuals [Assignment: organization-defined frequency]; and',
  'PE-2 d':
    'Removes individuals from the facility access list when access is no longer required.',
  'PE-2 (1)':
    'The organization authorizes physical access to the facility where the information system resides based on position or role.',
  'PE-2 (2)':
    'The organization requires two forms of identification from [Assignment: organization-defined list of acceptable forms of identification] for visitor access to the facility where the information system resides.',
  'PE-2 (3)':
    'The organization restricts unescorted access to the facility where the information system resides to personnel with [Selection (one or more): security clearances for all information contained within the system; formal access authorizations for all information contained within the system; need for access to all information contained within the system; [Assignment: organization-defined credentials]].',
  'PE-3': 'PHYSICAL ACCESS CONTROL',
  'PE-3 a':
    'Enforces physical access authorizations at [Assignment: organization-defined entry/exit points to the facility where the information system resides] by;',
  'PE-3 a 1':
    'Verifying individual access authorizations before granting access to the facility; and',
  'PE-3 a 2':
    'Controlling ingress/egress to the facility using [Selection (one or more): [Assignment: organization-defined physical access control systems/devices]; guards];',
  'PE-3 b':
    'Maintains physical access audit logs for [Assignment: organization-defined entry/exit points];',
  'PE-3 c':
    'Provides [Assignment: organization-defined security safeguards] to control access to areas within the facility officially designated as publicly accessible;',
  'PE-3 d':
    'Escorts visitors and monitors visitor activity [Assignment: organization-defined circumstances requiring visitor escorts and monitoring];',
  'PE-3 e': 'Secures keys, combinations, and other physical access devices;',
  'PE-3 f':
    'Inventories [Assignment: organization-defined physical access devices] every [Assignment: organization-defined frequency]; and',
  'PE-3 g':
    'Changes combinations and keys [Assignment: organization-defined frequency] and/or when keys are lost, combinations are compromised, or individuals are transferred or terminated.',
  'PE-3 (1)':
    'The organization enforces physical access authorizations to the information system in addition to the physical access controls for the facility at [Assignment: organization-defined physical spaces containing one or more components of the information system].',
  'PE-3 (2)':
    'The organization performs security checks [Assignment: organization-defined frequency] at the physical boundary of the facility or information system for unauthorized exfiltration of information or removal of information system components.',
  'PE-3 (3)':
    'The organization employs guards and/or alarms to monitor every physical access point to the facility where the information system resides 24 hours per day, 7 days per week.',
  'PE-3 (4)':
    'The organization uses lockable physical casings to protect [Assignment: organization-defined information system components] from unauthorized physical access.',
  'PE-3 (5)':
    'The organization employs [Assignment: organization-defined security safeguards] to [Selection (one or more): detect; prevent] physical tampering or alteration of [Assignment: organization-defined hardware components] within the information system.',
  'PE-3 (6)':
    'The organization employs a penetration testing process that includes [Assignment: organization-defined frequency], unannounced attempts to bypass or circumvent security controls associated with physical access points to the facility.',
  'PE-4':
    'The organization controls physical access to [Assignment: organization-defined information system distribution and transmission lines] within organizational facilities using [Assignment: organization-defined security safeguards].',
  'PE-5':
    'The organization controls physical access to information system output devices to prevent unauthorized individuals from obtaining the output.',
  'PE-5 (1)': 'ACCESS TO OUTPUT BY AUTHORIZED INDIVIDUALS',
  'PE-5 (1) (a)':
    'Controls physical access to output from [Assignment: organization-defined output devices]; and',
  'PE-5 (1) (b)':
    'Ensures that only authorized individuals receive output from the device.',
  'PE-5 (2)': 'The information system:',
  'PE-5 (2) (a)':
    'Controls physical access to output from [Assignment: organization-defined output devices]; and',
  'PE-5 (2) (b)':
    'Links individual identity to receipt of the output from the device.',
  'PE-5 (3)':
    'The organization marks [Assignment: organization-defined information system output devices] indicating the appropriate security marking of the information permitted to be output from the device.',
  'PE-6': 'MONITORING PHYSICAL ACCESS',
  'PE-6 a':
    'Monitors physical access to the facility where the information system resides to detect and respond to physical security incidents;',
  'PE-6 b':
    'Reviews physical access logs [Assignment: organization-defined frequency] and upon occurrence of [Assignment: organization-defined events or potential indications of events]; and',
  'PE-6 c':
    'Coordinates results of reviews and investigations with the organizational incident response capability.',
  'PE-6 (1)':
    'The organization monitors physical intrusion alarms and surveillance equipment.',
  'PE-6 (2)':
    'The organization employs automated mechanisms to recognize [Assignment: organization-defined classes/types of intrusions] and initiate [Assignment: organization-defined response actions].',
  'PE-6 (3)':
    'The organization employs video surveillance of [Assignment: organization-defined operational areas] and retains video recordings for [Assignment: organization-defined time period].',
  'PE-6 (4)':
    'The organization monitors physical access to the information system in addition to the physical access monitoring of the facility as [Assignment: organization-defined physical spaces containing one or more components of the information system].',
  'PE-7': '[Withdrawn: Incorporated into PE-2 and PE-3].',
  'PE-8': 'VISITOR ACCESS RECORDS',
  'PE-8 a':
    'Maintains visitor access records to the facility where the information system resides for [Assignment: organization-defined time period]; and',
  'PE-8 b':
    'Reviews visitor access records [Assignment: organization-defined frequency].',
  'PE-8 (1)':
    'The organization employs automated mechanisms to facilitate the maintenance and review of visitor access records.',
  'PE-8 (2)': '[Withdrawn: Incorporated into PE-2].',
  'PE-9':
    'The organization protects power equipment and power cabling for the information system from damage and destruction.',
  'PE-9 (1)':
    'The organization employs redundant power cabling paths that are physically separated by [Assignment: organization-defined distance].',
  'PE-9 (2)':
    'The organization employs automatic voltage controls for [Assignment: organization-defined critical information system components].',
  'PE-10': 'EMERGENCY SHUTOFF',
  'PE-10 a':
    'Provides the capability of shutting off power to the information system or individual system components in emergency situations;',
  'PE-10 b':
    'Places emergency shutoff switches or devices in [Assignment: organization-defined location by information system or system component] to facilitate safe and easy access for personnel; and',
  'PE-10 c':
    'Protects emergency power shutoff capability from unauthorized activation.',
  'PE-10 (1)': '[Withdrawn: Incorporated into PE-10].',
  'PE-11':
    'The organization provides a short-term uninterruptible power supply to facilitate [Selection (one or more): an orderly shutdown of the information system; transition of the information system to long-term alternate power] in the event of a primary power source loss.',
  'PE-11 (1)':
    'The organization provides a long-term alternate power supply for the information system that is capable of maintaining minimally required operational capability in the event of an extended loss of the primary power source.',
  'PE-11 (2)':
    'The organization provides a long-term alternate power supply for the information system that is:',
  'PE-11 (2) (a)': 'Self-contained;',
  'PE-11 (2) (b)': 'Not reliant on external power generation; and',
  'PE-11 (2) (c)':
    'Capable of maintaining [Selection: minimally required operational capability; full operational capability] in the event of an extended loss of the primary power source.',
  'PE-12':
    'The organization employs and maintains automatic emergency lighting for the information system that activates in the event of a power outage or disruption and that covers emergency exits and evacuation routes within the facility.',
  'PE-12 (1)':
    'The organization provides emergency lighting for all areas within the facility supporting essential missions and business functions.',
  'PE-13':
    'The organization employs and maintains fire suppression and detection devices/systems for the information system that are supported by an independent energy source.',
  'PE-13 (1)':
    'The organization employs fire detection devices/systems for the information system that activate automatically and notify [Assignment: organization-defined personnel or roles] and [Assignment: organization-defined emergency responders] in the event of a fire.',
  'PE-13 (2)':
    'The organization employs fire suppression devices/systems for the information system that provide automatic notification of any activation to Assignment: organization-defined personnel or roles] and [Assignment: organization-defined emergency responders].',
  'PE-13 (3)':
    'The organization employs an automatic fire suppression capability for the information system when the facility is not staffed on a continuous basis.',
  'PE-13 (4)':
    'The organization ensures that the facility undergoes [Assignment: organization-defined frequency] inspections by authorized and qualified inspectors and resolves identified deficiencies within [Assignment: organization-defined time period].',
  'PE-14': 'TEMPERATURE AND HUMIDITY CONTROLS',
  'PE-14 a':
    'Maintains temperature and humidity levels within the facility where the information system resides at [Assignment: organization-defined acceptable levels]; and',
  'PE-14 b':
    'Monitors temperature and humidity levels [Assignment: organization-defined frequency].',
  'PE-14 (1)':
    'The organization employs automatic temperature and humidity controls in the facility to prevent fluctuations potentially harmful to the information system.',
  'PE-14 (2)':
    'The organization employs temperature and humidity monitoring that provides an alarm or notification of changes potentially harmful to personnel or equipment.',
  'PE-15':
    'The organization protects the information system from damage resulting from water leakage by providing master shutoff or isolation valves that are accessible, working properly, and known to key personnel.',
  'PE-15 (1)':
    'The organization employs automated mechanisms to detect the presence of water in the vicinity of the information system and alerts [Assignment: organization-defined personnel or roles].',
  'PE-16':
    'The organization authorizes, monitors, and controls [Assignment: organization-defined types of information system components] entering and exiting the facility and maintains records of those items.',
  'PE-17': 'ALTERNATE WORK SITE',
  'PE-17 a':
    'Employs [Assignment: organization-defined security controls] at alternate work sites;',
  'PE-17 b':
    'Assesses as feasible, the effectiveness of security controls at alternate work sites; and',
  'PE-17 c':
    'Provides a means for employees to communicate with information security personnel in case of security incidents or problems.',
  'PE-18':
    'The organization positions information system components within the facility to minimize potential damage from [Assignment: organization-defined physical and environmental hazards] and to minimize the opportunity for unauthorized access.',
  'PE-18 (1)':
    'The organization plans the location or site of the facility where the information system resides with regard to physical and environmental hazards and for existing facilities, considers the physical and environmental hazards in its risk mitigation strategy.',
  'PE-19':
    'The organization protects the information system from information leakage due to electromagnetic signals emanations.',
  'PE-19 (1)':
    'The organization ensures that information system components, associated data communications, and networks are protected in accordance with national emissions and TEMPEST policies and procedures based on the security category or classification of the information.',
  'PE-20': 'ASSET MONITORING AND TRACKING',
  'PE-20 a':
    'Employs [Assignment: organization-defined asset location technologies] to track and monitor the location and movement of [Assignment: organization-defined assets] within [Assignment: organization-defined controlled areas]; and',
  'PE-20 b':
    'Ensures that asset location technologies are employed in accordance with applicable federal laws, Executive Orders, directives, regulations, policies, standards, and guidance.',
  'PL-1': 'SECURITY PLANNING POLICY AND PROCEDURES',
  'PL-1 a':
    'Develops, documents, and disseminates to [Assignment: organization-defined personnel or roles]:',
  'PL-1 a 1':
    'A security planning policy that addresses purpose, scope, roles, responsibilities, management commitment, coordination among organizational entities, and compliance; and',
  'PL-1 a 2':
    'Procedures to facilitate the implementation of the security planning policy and associated security planning controls; and',
  'PL-1 b': 'Reviews and updates the current:',
  'PL-1 b 1':
    'Security planning policy [Assignment: organization-defined frequency]; and',
  'PL-1 b 2':
    'Security planning procedures [Assignment: organization-defined frequency].',
  'PL-2': 'SYSTEM SECURITY PLAN',
  'PL-2 a': 'Develops a security plan for the information system that:',
  'PL-2 a 1': "Is consistent with the organization's enterprise architecture;",
  'PL-2 a 2': 'Explicitly defines the authorization boundary for the system;',
  'PL-2 a 3':
    'Describes the operational context of the information system in terms of missions and business processes;',
  'PL-2 a 4':
    'Provides the security categorization of the information system including supporting rationale;',
  'PL-2 a 5':
    'Describes the operational environment for the information system and relationships with or connections to other information systems;',
  'PL-2 a 6':
    'Provides an overview of the security requirements for the system;',
  'PL-2 a 7': 'Identifies any relevant overlays, if applicable;',
  'PL-2 a 8':
    'Describes the security controls in place or planned for meeting those requirements including a rationale for the tailoring decisions; and',
  'PL-2 a 9':
    'Is reviewed and approved by the authorizing official or designated representative prior to plan implementation;',
  'PL-2 b':
    'Distributes copies of the security plan and communicates subsequent changes to the plan to [Assignment: organization-defined personnel or roles];',
  'PL-2 c':
    'Reviews the security plan for the information system [Assignment: organization-defined frequency];',
  'PL-2 d':
    'Updates the plan to address changes to the information system/environment of operation or problems identified during plan implementation or security control assessments; and',
  'PL-2 e':
    'Protects the security plan from unauthorized disclosure and modification.',
  'PL-2 (1)': '[Withdrawn: Incorporated into PL-7].',
  'PL-2 (2)': '[Withdrawn: Incorporated into PL-8].',
  'PL-2 (3)':
    'The organization plans and coordinates security-related activities affecting the information system with [Assignment: organization-defined individuals or groups] before conducting such activities in order to reduce the impact on other organizational entities.',
  'PL-3': '[Withdrawn: Incorporated into PL-2].',
  'PL-4': 'RULES OF BEHAVIOR',
  'PL-4 a':
    'Establishes and makes readily available to individuals requiring access to the information system, the rules that describe their responsibilities and expected behavior with regard to information and information system usage;',
  'PL-4 b':
    'Receives a signed acknowledgment from such individuals, indicating that they have read, understand, and agree to abide by the rules of behavior, before authorizing access to information and the information system;',
  'PL-4 c':
    'Reviews and updates the rules of behavior [Assignment: organization-defined frequency]; and',
  'PL-4 d':
    'Requires individuals who have signed a previous version of the rules of behavior to read and re-sign when the rules of behavior are revised/updated.',
  'PL-4 (1)':
    'The organization includes in the rules of behavior, explicit restrictions on the use of social media/networking sites and posting organizational information on public websites.',
  'PL-5': '[Withdrawn: Incorporated into Appendix J, AR-2].',
  'PL-6': '[Withdrawn: Incorporated into PL-2].',
  'PL-7': 'SECURITY CONCEPT OF OPERATIONS',
  'PL-7 a':
    'Develops a security Concept of Operations (CONOPS) for the information system containing at a minimum, how the organization intends to operate the system from the perspective of information security; and',
  'PL-7 b':
    'Reviews and updates the CONOPS [Assignment: organization-defined frequency].',
  'PL-8': 'INFORMATION SECURITY ARCHITECTURE',
  'PL-8 a':
    'Develops an information security architecture for the information system that:',
  'PL-8 a 1':
    'Describes the overall philosophy, requirements, and approach to be taken with regard to protecting the confidentiality, integrity, and availability of organizational information;',
  'PL-8 a 2':
    'Describes how the information security architecture is integrated into and supports the enterprise architecture; and',
  'PL-8 a 3':
    'Describes any information security assumptions about, and dependencies on, external services;',
  'PL-8 b':
    'Reviews and updates the information security architecture [Assignment: organization-defined frequency] to reflect updates in the enterprise architecture; and',
  'PL-8 c':
    'Ensures that planned information security architecture changes are reflected in the security plan, the security Concept of Operations (CONOPS), and organizational procurements/acquisitions.',
  'PL-8 (1)':
    'The organization designs its security architecture using a defense-in-depth approach that:',
  'PL-8 (1) (a)':
    'Allocates [Assignment: organization-defined security safeguards] to [Assignment: organization-defined locations and architectural layers]; and',
  'PL-8 (1) (b)':
    'Ensures that the allocated security safeguards operate in a coordinated and mutually reinforcing manner.',
  'PL-8 (2)':
    'The organization requires that [Assignment: organization-defined security safeguards] allocated to [Assignment: organization-defined locations and architectural layers] are obtained from different suppliers.',
  'PL-9':
    'The organization centrally manages [Assignment: organization-defined security controls and related processes].',
  'PS-1': 'PERSONNEL SECURITY POLICY AND PROCEDURES',
  'PS-1 a':
    'Develops, documents, and disseminates to [Assignment: organization-defined personnel or roles]:',
  'PS-1 a 1':
    'A personnel security policy that addresses purpose, scope, roles, responsibilities, management commitment, coordination among organizational entities, and compliance; and',
  'PS-1 a 2':
    'Procedures to facilitate the implementation of the personnel security policy and associated personnel security controls; and',
  'PS-1 b': 'Reviews and updates the current:',
  'PS-1 b 1':
    'Personnel security policy [Assignment: organization-defined frequency]; and',
  'PS-1 b 2':
    'Personnel security procedures [Assignment: organization-defined frequency].',
  'PS-2': 'POSITION RISK DESIGNATION',
  'PS-2 a': 'Assigns a risk designation to all organizational positions;',
  'PS-2 b':
    'Establishes screening criteria for individuals filling those positions; and',
  'PS-2 c':
    'Reviews and updates position risk designations [Assignment: organization-defined frequency].',
  'PS-3': 'PERSONNEL SCREENING',
  'PS-3 a':
    'Screens individuals prior to authorizing access to the information system; and',
  'PS-3 b':
    'Rescreens individuals according to [Assignment: organization-defined conditions requiring rescreening and, where rescreening is so indicated, the frequency of such rescreening].',
  'PS-3 (1)':
    'The organization ensures that individuals accessing an information system processing, storing, or transmitting classified information are cleared and indoctrinated to the highest classification level of the information to which they have access on the system.',
  'PS-3 (2)':
    'The organization ensures that individuals accessing an information system processing, storing, or transmitting types of classified information which require formal indoctrination, are formally indoctrinated for all of the relevant types of information to which they have access on the system.',
  'PS-3 (3)':
    'The organization ensures that individuals accessing an information system processing, storing, or transmitting information requiring special protection:',
  'PS-3 (3) (a)':
    'Have valid access authorizations that are demonstrated by assigned official government duties; and',
  'PS-3 (3) (b)':
    'Satisfy [Assignment: organization-defined additional personnel screening criteria].',
  'PS-4': 'The organization, upon termination of individual employment:',
  'PS-4 a':
    'Disables information system access within [Assignment: organization-defined time period];',
  'PS-4 b':
    'Terminates/revokes any authenticators/credentials associated with the individual;',
  'PS-4 c':
    'Conducts exit interviews that include a discussion of [Assignment: organization-defined information security topics];',
  'PS-4 d':
    'Retrieves all security-related organizational information system-related property;',
  'PS-4 e':
    'Retains access to organizational information and information systems formerly controlled by terminated individual; and',
  'PS-4 f':
    'Notifies [Assignment: organization-defined personnel or roles] within [Assignment: organization-defined time period].',
  'PS-4 (1)': 'POST-EMPLOYMENT REQUIREMENTS',
  'PS-4 (1) (a)':
    'Notifies terminated individuals of applicable, legally binding post-employment requirements for the protection of organizational information; and',
  'PS-4 (1) (b)':
    'Requires terminated individuals to sign an acknowledgment of post-employment requirements as part of the organizational termination process.',
  'PS-4 (2)':
    'The organization employs automated mechanisms to notify [Assignment: organization-defined personnel or roles] upon termination of an individual.',
  'PS-5': 'PERSONNEL TRANSFER',
  'PS-5 a':
    'Reviews and confirms ongoing operational need for current logical and physical access authorizations to information systems/facilities when individuals are reassigned or transferred to other positions within the organization;',
  'PS-5 b':
    'Initiates [Assignment: organization-defined transfer or reassignment actions] within [Assignment: organization-defined time period following the formal transfer action];',
  'PS-5 c':
    'Modifies access authorization as needed to correspond with any changes in operational need due to reassignment or transfer; and',
  'PS-5 d':
    'Notifies [Assignment: organization-defined personnel or roles] within [Assignment: organization-defined time period].',
  'PS-6': 'ACCESS AGREEMENTS',
  'PS-6 a':
    'Develops and documents access agreements for organizational information systems;',
  'PS-6 b':
    'Reviews and updates the access agreements [Assignment: organization-defined frequency]; and',
  'PS-6 c':
    'Ensures that individuals requiring access to organizational information and information systems:',
  'PS-6 c 1':
    'Sign appropriate access agreements prior to being granted access; and',
  'PS-6 c 2':
    'Re-sign access agreements to maintain access to organizational information systems when access agreements have been updated or [Assignment: organization-defined frequency].',
  'PS-6 (1)': '[Withdrawn: Incorporated into PS-3].',
  'PS-6 (2)':
    'The organization ensures that access to classified information requiring special protection is granted only to individuals who:',
  'PS-6 (2) (a)':
    'Have a valid access authorization that is demonstrated by assigned official government duties;',
  'PS-6 (2) (b)': 'Satisfy associated personnel security criteria; and',
  'PS-6 (2) (c)':
    'Have read, understood, and signed a nondisclosure agreement.',
  'PS-6 (3)': 'POST-EMPLOYMENT REQUIREMENTS',
  'PS-6 (3) (a)':
    'Notifies individuals of applicable, legally binding post-employment requirements for protection of organizational information; and',
  'PS-6 (3) (b)':
    'Requires individuals to sign an acknowledgment of these requirements, if applicable, as part of granting initial access to covered information.',
  'PS-7': 'THIRD-PARTY PERSONNEL SECURITY',
  'PS-7 a':
    'Establishes personnel security requirements including security roles and responsibilities for third-party providers;',
  'PS-7 b':
    'Requires third-party providers to comply with personnel security policies and procedures established by the organization;',
  'PS-7 c': 'Documents personnel security requirements;',
  'PS-7 d':
    'Requires third-party providers to notify [Assignment: organization-defined personnel or roles] of any personnel transfers or terminations of third-party personnel who possess organizational credentials and/or badges, or who have information system privileges within [Assignment: organization-defined time period]; and',
  'PS-7 e': 'Monitors provider compliance.',
  'PS-8': 'PERSONNEL SANCTIONS',
  'PS-8 a':
    'Employs a formal sanctions process for individuals failing to comply with established information security policies and procedures; and',
  'PS-8 b':
    'Notifies [Assignment: organization-defined personnel or roles] within [Assignment: organization-defined time period] when a formal employee sanctions process is initiated, identifying the individual sanctioned and the reason for the sanction.',
  'RA-1': 'RISK ASSESSMENT POLICY AND PROCEDURES',
  'RA-1 a':
    'Develops, documents, and disseminates to [Assignment: organization-defined personnel or roles]:',
  'RA-1 a 1':
    'A risk assessment policy that addresses purpose, scope, roles, responsibilities, management commitment, coordination among organizational entities, and compliance; and',
  'RA-1 a 2':
    'Procedures to facilitate the implementation of the risk assessment policy and associated risk assessment controls; and',
  'RA-1 b': 'Reviews and updates the current:',
  'RA-1 b 1':
    'Risk assessment policy [Assignment: organization-defined frequency]; and',
  'RA-1 b 2':
    'Risk assessment procedures [Assignment: organization-defined frequency].',
  'RA-2': 'SECURITY CATEGORIZATION',
  'RA-2 a':
    'Categorizes information and the information system in accordance with applicable federal laws, Executive Orders, directives, policies, regulations, standards, and guidance;',
  'RA-2 b':
    'Documents the security categorization results (including supporting rationale) in the security plan for the information system; and',
  'RA-2 c':
    'Ensures that the authorizing official or authorizing official designated representative reviews and approves the security categorization decision.',
  'RA-3': 'RISK ASSESSMENT',
  'RA-3 a':
    'Conducts an assessment of risk, including the likelihood and magnitude of harm, from the unauthorized access, use, disclosure, disruption, modification, or destruction of the information system and the information it processes, stores, or transmits;',
  'RA-3 b':
    'Documents risk assessment results in [Selection: security plan; risk assessment report; [Assignment: organization-defined document]];',
  'RA-3 c':
    'Reviews risk assessment results [Assignment: organization-defined frequency];',
  'RA-3 d':
    'Disseminates risk assessment results to [Assignment: organization-defined personnel or roles]; and',
  'RA-3 e':
    'Updates the risk assessment [Assignment: organization-defined frequency] or whenever there are significant changes to the information system or environment of operation (including the identification of new threats and vulnerabilities), or other conditions that may impact the security state of the system.',
  'RA-4': '[Withdrawn: Incorporated into RA-3].',
  'RA-5': 'VULNERABILITY SCANNING',
  'RA-5 a':
    'Scans for vulnerabilities in the information system and hosted applications [Assignment: organization-defined frequency and/or randomly in accordance with organization-defined process] and when new vulnerabilities potentially affecting the system/applications are identified and reported;',
  'RA-5 b':
    'Employs vulnerability scanning tools and techniques that facilitate interoperability among tools and automate parts of the vulnerability management process by using standards for:',
  'RA-5 b 1':
    'Enumerating platforms, software flaws, and improper configurations;',
  'RA-5 b 2': 'Formatting checklists and test procedures; and',
  'RA-5 b 3': 'Measuring vulnerability impact;',
  'RA-5 c':
    'Analyzes vulnerability scan reports and results from security control assessments;',
  'RA-5 d':
    'Remediates legitimate vulnerabilities [Assignment: organization-defined response times] in accordance with an organizational assessment of risk; and',
  'RA-5 e':
    'Shares information obtained from the vulnerability scanning process and security control assessments with [Assignment: organization-defined personnel or roles] to help eliminate similar vulnerabilities in other information systems (i.e., systemic weaknesses or deficiencies).',
  'RA-5 (1)':
    'The organization employs vulnerability scanning tools that include the capability to readily update the information system vulnerabilities to be scanned.',
  'RA-5 (2)':
    'The organization updates the information system vulnerabilities scanned [Selection (one or more): [Assignment: organization-defined frequency]; prior to a new scan; when new vulnerabilities are identified and reported].',
  'RA-5 (3)':
    'The organization employs vulnerability scanning procedures that can identify the breadth and depth of coverage (i.e., information system components scanned and vulnerabilities checked).',
  'RA-5 (4)':
    'The organization determines what information about the information system is discoverable by adversaries and subsequently takes [Assignment: organization-defined corrective actions].',
  'RA-5 (5)':
    'The information system implements privileged access authorization to [Assignment: organization-identified information system components] for selected [Assignment: organization-defined vulnerability scanning activities].',
  'RA-5 (6)':
    'The organization employs automated mechanisms to compare the results of vulnerability scans over time to determine trends in information system vulnerabilities.',
  'RA-5 (7)': '[Withdrawn: Incorporated into CM-8].',
  'RA-5 (8)':
    'The organization reviews historic audit logs to determine if a vulnerability identified in the information system has been previously exploited.',
  'RA-5 (9)': '[Withdrawn: Incorporated into CA-8].',
  'RA-5 (10)':
    'The organization correlates the output from vulnerability scanning tools to determine the presence of multi-vulnerability/multi-hop attack vectors.',
  'RA-6':
    'The organization employs a technical surveillance countermeasures survey at [Assignment: organization-defined locations] [Selection (one or more): [Assignment: organization-defined frequency]; [Assignment: organization-defined events or indicators occur]].',
  'SA-1': 'SYSTEM AND SERVICES ACQUISITION POLICY AND PROCEDURES',
  'SA-1 a':
    'Develops, documents, and disseminates to [Assignment: organization-defined personnel or roles]:',
  'SA-1 a 1':
    'A system and services acquisition policy that addresses purpose, scope, roles, responsibilities, management commitment, coordination among organizational entities, and compliance; and',
  'SA-1 a 2':
    'Procedures to facilitate the implementation of the system and services acquisition policy and associated system and services acquisition controls; and',
  'SA-1 b': 'Reviews and updates the current:',
  'SA-1 b 1':
    'System and services acquisition policy [Assignment: organization-defined frequency]; and',
  'SA-1 b 2':
    'System and services acquisition procedures [Assignment: organization-defined frequency].',
  'SA-2': 'ALLOCATION OF RESOURCES',
  'SA-2 a':
    'Determines information security requirements for the information system or information system service in mission/business process planning;',
  'SA-2 b':
    'Determines, documents, and allocates the resources required to protect the information system or information system service as part of its capital planning and investment control process; and',
  'SA-2 c':
    'Establishes a discrete line item for information security in organizational programming and budgeting documentation.',
  'SA-3': 'SYSTEM DEVELOPMENT LIFE CYCLE',
  'SA-3 a':
    'Manages the information system using [Assignment: organization-defined system development life cycle] that incorporates information security considerations;',
  'SA-3 b':
    'Defines and documents information security roles and responsibilities throughout the system development life cycle;',
  'SA-3 c':
    'Identifies individuals having information security roles and responsibilities; and',
  'SA-3 d':
    'Integrates the organizational information security risk management process into system development life cycle activities.',
  'SA-4':
    'The organization includes the following requirements, descriptions, and criteria, explicitly or by reference, in the acquisition contract for the information system, system component, or information system service in accordance with applicable federal laws, Executive Orders, directives, policies, regulations, standards, guidelines, and organizational mission/business needs:',
  'SA-4 a': 'Security functional requirements;',
  'SA-4 b': 'Security strength requirements;',
  'SA-4 c': 'Security assurance requirements;',
  'SA-4 d': 'Security-related documentation requirements;',
  'SA-4 e': 'Requirements for protecting security-related documentation;',
  'SA-4 f':
    'Description of the information system development environment and environment in which the system is intended to operate; and',
  'SA-4 g': 'Acceptance criteria.',
  'SA-4 (1)':
    'The organization requires the developer of the information system, system component, or information system service to provide a description of the functional properties of the security controls to be employed.',
  'SA-4 (2)':
    'The organization requires the developer of the information system, system component, or information system service to provide design and implementation information for the security controls to be employed that includes: [Selection (one or more): security-relevant external system interfaces; high-level design; low-level design; source code or hardware schematics; [Assignment: organization-defined design/implementation information]] at [Assignment: organization-defined level of detail].',
  'SA-4 (3)':
    'The organization requires the developer of the information system, system component, or information system service to demonstrate the use of a system development life cycle that includes [Assignment: organization-defined state-of-the-practice system/security engineering methods, software development methods, testing/evaluation/validation techniques, and quality control processes].',
  'SA-4 (4)': '[Withdrawn: Incorporated into CM-8 (9)].',
  'SA-4 (5)':
    'The organization requires the developer of the information system, system component, or information system service to:',
  'SA-4 (5) (a)':
    'Deliver the system, component, or service with [Assignment: organization-defined security configurations] implemented; and',
  'SA-4 (5) (b)':
    'Use the configurations as the default for any subsequent system, component, or service reinstallation or upgrade.',
  'SA-4 (6)': 'USE OF INFORMATION ASSURANCE PRODUCTS',
  'SA-4 (6) (a)':
    'Employs only government off-the-shelf (GOTS) or commercial off-the-shelf (COTS) information assurance (IA) and IA-enabled information technology products that compose an NSA-approved solution to protect classified information when the networks used to transmit the information are at a lower classification level than the information being transmitted; and',
  'SA-4 (6) (b)':
    'Ensures that these products have been evaluated and/or validated by NSA or in accordance with NSA-approved procedures.',
  'SA-4 (7)': 'NIAP-APPROVED  PROTECTION PROFILES',
  'SA-4 (7) (a)':
    'Limits the use of commercially provided information assurance (IA) and IA-enabled information technology products to those products that have been successfully evaluated against a National Information Assurance partnership (NIAP)-approved Protection Profile for a specific technology type, if such a profile exists; and',
  'SA-4 (7) (b)':
    'Requires, if no NIAP-approved Protection Profile exists for a specific technology type but a commercially provided information technology product relies on cryptographic functionality to enforce its security policy, that the cryptographic module is FIPS-validated.',
  'SA-4 (8)':
    'The organization requires the developer of the information system, system component, or information system service to produce a plan for the continuous monitoring of security control effectiveness that contains [Assignment: organization-defined level of detail].',
  'SA-4 (9)':
    'The organization requires the developer of the information system, system component, or information system service to identify early in the system development life cycle, the functions, ports, protocols, and services intended for organizational use.',
  'SA-4 (10)':
    'The organization employs only information technology products on the FIPS 201-approved products list for Personal Identity Verification (PIV) capability implemented within organizational information systems.',
  'SA-5': 'INFORMATION SYSTEM DOCUMENTATION',
  'SA-5 a':
    'Obtains administrator documentation for the information system, system component, or information system service that describes:',
  'SA-5 a 1':
    'Secure configuration, installation, and operation of the system, component, or service;',
  'SA-5 a 2':
    'Effective use and maintenance of security functions/mechanisms; and',
  'SA-5 a 3':
    'Known vulnerabilities regarding configuration and use of administrative (i.e., privileged) functions;',
  'SA-5 b':
    'Obtains user documentation for the information system, system component, or information system service that describes:',
  'SA-5 b 1':
    'User-accessible security functions/mechanisms and how to effectively use those security functions/mechanisms;',
  'SA-5 b 2':
    'Methods for user interaction, which enables individuals to use the system, component, or service in a more secure manner; and',
  'SA-5 b 3':
    'User responsibilities in maintaining the security of the system, component, or service;',
  'SA-5 c':
    'Documents attempts to obtain information system, system component, or information system service documentation when such documentation is either unavailable or nonexistent and takes [Assignment: organization-defined actions] in response;',
  'SA-5 d':
    'Protects documentation as required, in accordance with the risk management strategy; and',
  'SA-5 e':
    'Distributes documentation to [Assignment: organization-defined personnel or roles].',
  'SA-5 (1)': '[Withdrawn: Incorporated into SA-4 (1)].',
  'SA-5 (2)': '[Withdrawn: Incorporated into SA-4 (2)].',
  'SA-5 (3)': '[Withdrawn: Incorporated into SA-4 (2)].',
  'SA-5 (4)': '[Withdrawn: Incorporated into SA-4 (2)].',
  'SA-5 (5)': '[Withdrawn: Incorporated into SA-4 (2)].',
  'SA-6': '[Withdrawn: Incorporated into CM-10 and SI-7].',
  'SA-7': '[Withdrawn: Incorporated into CM-11 and SI-7].',
  'SA-8':
    'The organization applies information system security engineering principles in the specification, design, development, implementation, and modification of the information system.',
  'SA-9': 'EXTERNAL INFORMATION SYSTEM SERVICES',
  'SA-9 a':
    'Requires that providers of external information system services comply with organizational information security requirements and employ [Assignment: organization-defined security controls] in accordance with applicable federal laws, Executive Orders, directives, policies, regulations, standards, and guidance;',
  'SA-9 b':
    'Defines and documents government oversight and user roles and responsibilities with regard  to external information system services; and',
  'SA-9 c':
    'Employs [Assignment: organization-defined processes, methods, and techniques] to monitor security control compliance by external service providers on an ongoing basis.',
  'SA-9 (1)': 'RISK ASSESSMENTS / ORGANIZATIONAL APPROVALS',
  'SA-9 (1) (a)':
    'Conducts an organizational assessment of risk prior to the acquisition or outsourcing of dedicated information security services; and',
  'SA-9 (1) (b)':
    'Ensures that the acquisition or outsourcing of dedicated information security services is approved by [Assignment: organization-defined personnel or roles].',
  'SA-9 (2)':
    'The organization requires providers of [Assignment: organization-defined external information system services] to identify the functions, ports, protocols, and other services required for the use of such services.',
  'SA-9 (3)':
    'The organization establishes, documents, and maintains trust relationships with external service providers based on [Assignment: organization-defined security requirements, properties, factors, or conditions defining acceptable trust relationships].',
  'SA-9 (4)':
    'The organization employs [Assignment: organization-defined security safeguards] to ensure that the interests of [Assignment: organization-defined external service providers] are consistent with and reflect organizational interests.',
  'SA-9 (5)':
    'The organization restricts the location of [Selection (one or more): information processing; information/data; information system services] to [Assignment: organization-defined locations] based on [Assignment: organization-defined requirements or conditions].',
  'SA-10':
    'The organization requires the developer of the information system, system component, or information system service to:',
  'SA-10 a':
    'Perform configuration management during system, component, or service [Selection (one or more): design; development; implementation; operation];',
  'SA-10 b':
    'Document, manage, and control the integrity of changes to [Assignment: organization-defined configuration items under configuration management];',
  'SA-10 c':
    'Implement only organization-approved changes to the system, component, or service;',
  'SA-10 d':
    'Document approved changes to the system, component, or service and the potential security impacts of such changes; and',
  'SA-10 e':
    'Track security flaws and flaw resolution within the system, component, or service and report findings to [Assignment: organization-defined personnel].',
  'SA-10 (1)':
    'The organization requires the developer of the information system, system component, or information system service to enable integrity verification of software and firmware components.',
  'SA-10 (2)':
    'The organization provides an alternate configuration management process using organizational personnel in the absence of a dedicated developer configuration management team.',
  'SA-10 (3)':
    'The organization requires the developer of the information system, system component, or information system service to enable integrity verification of hardware components.',
  'SA-10 (4)':
    'The organization requires the developer of the information system, system component, or information system service to employ tools for comparing newly generated versions of security-relevant hardware descriptions and software/firmware source and object code with previous versions.',
  'SA-10 (5)':
    'The organization requires the developer of the information system, system component, or information system service to maintain the integrity of the mapping between the  master build data (hardware drawings and software/firmware code) describing the current version of security-relevant hardware, software, and firmware and the on-site master copy of the data for the current version.',
  'SA-10 (6)':
    'The organization requires the developer of the information system, system component, or information system service to execute procedures for ensuring that security-relevant hardware, software, and firmware updates distributed to the organization are exactly as specified by the master copies.',
  'SA-11':
    'The organization requires the developer of the information system, system component, or information system service to:',
  'SA-11 a': 'Create and implement a security assessment plan;',
  'SA-11 b':
    'Perform [Selection (one or more): unit; integration; system; regression] testing/evaluation at [Assignment: organization-defined depth and coverage];',
  'SA-11 c':
    'Produce evidence of the execution of the security assessment plan and the results of the security testing/evaluation;',
  'SA-11 d': 'Implement a verifiable flaw remediation process; and',
  'SA-11 e': 'Correct flaws identified during security testing/evaluation.',
  'SA-11 (1)':
    'The organization requires the developer of the information system, system component, or information system service to employ static code analysis tools to identify common flaws and document the results of the analysis.',
  'SA-11 (2)':
    'The organization requires the developer of the information system, system component, or information system service to perform threat and vulnerability analyses and subsequent testing/evaluation of the as-built system, component, or service.',
  'SA-11 (3)': 'INDEPENDENT VERIFICATION OF ASSESSMENT PLANS / EVIDENCE',
  'SA-11 (3) (a)':
    'Requires an independent agent satisfying [Assignment: organization-defined independence criteria] to verify the correct implementation of the developer security assessment plan and the evidence produced during security testing/evaluation; and',
  'SA-11 (3) (b)':
    'Ensures that the independent agent is either provided with sufficient information to complete the verification process or granted the authority to obtain such information.',
  'SA-11 (4)':
    'The organization requires the developer of the information system, system component, or information system service to perform a manual code review of [Assignment: organization-defined specific code] using [Assignment: organization-defined processes, procedures, and/or techniques].',
  'SA-11 (5)':
    'The organization requires the developer of the information system, system component, or information system service to perform penetration testing at [Assignment: organization-defined breadth/depth] and with [Assignment: organization-defined constraints].',
  'SA-11 (6)':
    'The organization requires the developer of the information system, system component, or information system service to perform attack surface reviews.',
  'SA-11 (7)':
    'The organization requires the developer of the information system, system component, or information system service to verify that the scope of security testing/evaluation provides complete coverage of required security controls at [Assignment: organization-defined depth of testing/evaluation].',
  'SA-11 (8)':
    'The organization requires the developer of the information system, system component, or information system service to employ dynamic code analysis tools to identify common flaws and document the results of the analysis.',
  'SA-12':
    'The organization protects against supply chain threats to the information system, system component, or information system service by employing [Assignment: organization-defined security safeguards] as part of a comprehensive, defense-in-breadth information security strategy.',
  'SA-12 (1)':
    'The organization employs [Assignment: organization-defined tailored acquisition strategies, contract tools, and procurement methods] for the purchase of the information system, system component, or information system service from suppliers.',
  'SA-12 (2)':
    'The organization conducts a supplier review prior to entering into a contractual agreement to acquire the information system, system component, or information system service.',
  'SA-12 (3)': '[Withdrawn: Incorporated into SA-12 (1)].',
  'SA-12 (4)': '[Withdrawn: Incorporated into SA-12 (13)].',
  'SA-12 (5)':
    'The organization employs [Assignment: organization-defined security safeguards] to limit harm from potential adversaries identifying and targeting the organizational supply chain.',
  'SA-12 (6)': '[Withdrawn: Incorporated into SA-12 (1)].',
  'SA-12 (7)':
    'The organization conducts an assessment of the information system, system component, or information system service prior to selection, acceptance, or update.',
  'SA-12 (8)':
    'The organization uses all-source intelligence analysis of suppliers and potential suppliers of the information system, system component, or information system service.',
  'SA-12 (9)':
    'The organization employs [Assignment: organization-defined Operations Security (OPSEC) safeguards] in accordance with classification guides to protect supply chain-related information for the information system, system component, or information system service.',
  'SA-12 (10)':
    'The organization employs [Assignment: organization-defined security safeguards] to validate that the information system or system component received is genuine and has not been altered.',
  'SA-12 (11)':
    'The organization employs [Selection (one or more): organizational analysis, independent third-party analysis, organizational penetration testing, independent third-party penetration testing] of [Assignment: organization-defined supply chain elements, processes, and actors] associated with the information system, system component, or information system service.',
  'SA-12 (12)':
    'The organization establishes inter-organizational agreements and procedures with entities involved in the supply chain for the information system, system component, or information system service.',
  'SA-12 (13)':
    'The organization employs [Assignment: organization-defined security safeguards] to ensure an adequate supply of [Assignment: organization-defined critical information system components].',
  'SA-12 (14)':
    'The organization establishes and retains unique identification of [Assignment: organization-defined supply chain elements, processes, and actors] for the information system, system component, or information system service.',
  'SA-12 (15)':
    'The organization establishes a process to address weaknesses or deficiencies in supply chain elements identified during independent or organizational assessments of such elements.',
  'SA-13': 'TRUSTWORTHINESS',
  'SA-13 a':
    'Describes the trustworthiness required in the [Assignment: organization-defined information system, information system component, or information system service] supporting its critical missions/business functions; and',
  'SA-13 b':
    'Implements [Assignment: organization-defined assurance overlay] to achieve such trustworthiness.',
  'SA-14':
    'The organization identifies critical information system components and functions by performing a criticality analysis for [Assignment: organization-defined information systems, information system components, or information system services] at [Assignment: organization-defined decision points in the system development life cycle].',
  'SA-14 (1)': '[Withdrawn: Incorporated into SA-20].',
  'SA-15': 'DEVELOPMENT PROCESS, STANDARDS, AND TOOLS',
  'SA-15 a':
    'Requires the developer of the information system, system component, or information system service to follow a documented development process that:',
  'SA-15 a 1': 'Explicitly addresses security requirements;',
  'SA-15 a 2':
    'Identifies the standards and tools used in the development process;',
  'SA-15 a 3':
    'Documents the specific tool options and tool configurations used in the development process; and',
  'SA-15 a 4':
    'Documents, manages, and ensures the integrity of changes to the process and/or tools used in development; and',
  'SA-15 b':
    'Reviews the development process, standards, tools, and tool options/configurations [Assignment: organization-defined frequency] to determine if the process, standards, tools, and tool options/configurations selected and employed can satisfy [Assignment: organization-defined security requirements].',
  'SA-15 (1)':
    'The organization requires the developer of the information system, system component, or information system service to:',
  'SA-15 (1) (a)':
    'Define quality metrics at the beginning of the development process; and',
  'SA-15 (1) (b)':
    'Provide evidence of meeting the quality metrics [Selection (one or more): [Assignment: organization-defined frequency]; [Assignment: organization-defined program review milestones]; upon delivery].',
  'SA-15 (2)':
    'The organization requires the developer of the information system, system component, or information system service to select and employ a security tracking tool for use during the development process.',
  'SA-15 (3)':
    'The organization requires the developer of the information system, system component, or information system service to perform a criticality analysis at [Assignment: organization-defined breadth/depth] and at [Assignment: organization-defined decision points in the system development life cycle].',
  'SA-15 (4)':
    'The organization requires that developers perform threat modeling and a vulnerability analysis for the information system at [Assignment: organization-defined breadth/depth] that:',
  'SA-15 (4) (a)':
    'Uses [Assignment: organization-defined information concerning impact, environment of operations, known or assumed threats, and acceptable risk levels];',
  'SA-15 (4) (b)':
    'Employs [Assignment: organization-defined tools and methods]; and',
  'SA-15 (4) (c)':
    'Produces evidence that meets [Assignment: organization-defined acceptance criteria].',
  'SA-15 (5)':
    'The organization requires the developer of the information system, system component, or information system service to reduce attack surfaces to [Assignment: organization-defined thresholds].',
  'SA-15 (6)':
    'The organization requires the developer of the information system, system component, or information system service to implement an explicit process to continuously improve the development process.',
  'SA-15 (7)':
    'The organization requires the developer of the information system, system component, or information system service to:',
  'SA-15 (7) (a)':
    'Perform an automated vulnerability analysis using [Assignment: organization-defined tools];',
  'SA-15 (7) (b)':
    'Determine the exploitation potential for discovered vulnerabilities;',
  'SA-15 (7) (c)':
    'Determine potential risk mitigations for delivered vulnerabilities; and',
  'SA-15 (7) (d)':
    'Deliver the outputs of the tools and results of the analysis to [Assignment: organization-defined personnel or roles].',
  'SA-15 (8)':
    'The organization requires the developer of the information system, system component, or information system service to use threat modeling and vulnerability analyses from similar systems, components, or services to inform the current development process.',
  'SA-15 (9)':
    'The organization approves, documents, and controls the use of live data in development and test environments for the information system, system component, or information system service.',
  'SA-15 (10)':
    'The organization requires the developer of the information system, system component, or information system service to provide an incident response plan.',
  'SA-15 (11)':
    'The organization requires the developer of the information system or system component to archive the system or component to be released or delivered together with the corresponding evidence supporting the final security review.',
  'SA-16':
    'The organization requires the developer of the information system, system component, or information system service to provide [Assignment: organization-defined training] on the correct use and operation of the implemented security functions, controls, and/or mechanisms.',
  'SA-17':
    'The organization requires the developer of the information system, system component, or information system service to produce a design specification and security architecture that:',
  'SA-17 a':
    "Is consistent with and supportive of the organization's security architecture which is established within and is an integrated part of the organization's enterprise architecture;",
  'SA-17 b':
    'Accurately and completely describes the required security functionality, and the allocation of security controls among physical and logical components; and',
  'SA-17 c':
    'Expresses how individual security functions, mechanisms, and services work together to provide required security capabilities and a unified approach to protection.',
  'SA-17 (1)':
    'The organization requires the developer of the information system, system component, or information system service to:',
  'SA-17 (1) (a)':
    'Produce, as an integral part of the development process, a formal policy model describing the [Assignment: organization-defined elements of organizational security policy] to be enforced; and',
  'SA-17 (1) (b)':
    'Prove that the formal policy model is internally consistent and sufficient to enforce the defined elements of the organizational security policy when implemented.',
  'SA-17 (2)':
    'The organization requires the developer of the information system, system component, or information system service to:',
  'SA-17 (2) (a)':
    'Define security-relevant hardware, software, and firmware; and',
  'SA-17 (2) (b)':
    'Provide a rationale that the definition for security-relevant hardware, software, and firmware is complete.',
  'SA-17 (3)':
    'The organization requires the developer of the information system, system component, or information system service to:',
  'SA-17 (3) (a)':
    'Produce, as an integral part of the development process, a formal top-level specification that specifies the interfaces to security-relevant hardware, software, and firmware in terms of exceptions, error messages, and effects;',
  'SA-17 (3) (b)':
    'Show via proof to the extent feasible with additional informal demonstration as necessary, that the formal top-level specification is consistent with the formal policy model;',
  'SA-17 (3) (c)':
    'Show via informal demonstration, that the formal top-level specification completely covers the interfaces to security-relevant hardware, software, and firmware;',
  'SA-17 (3) (d)':
    'Show that the formal top-level specification is an accurate description of the implemented security-relevant hardware, software, and firmware; and',
  'SA-17 (3) (e)':
    'Describe the security-relevant hardware, software, and firmware mechanisms not addressed in the formal top-level specification but strictly internal to the security-relevant hardware, software, and firmware.',
  'SA-17 (4)':
    'The organization requires the developer of the information system, system component, or information system service to:',
  'SA-17 (4) (a)':
    'Produce, as an integral part of the development process, an informal descriptive top-level specification that specifies the interfaces to security-relevant hardware, software, and firmware in terms of exceptions, error messages, and effects;',
  'SA-17 (4) (b)':
    'Show via [Selection: informal demonstration, convincing argument with formal methods as feasible] that the descriptive top-level specification is consistent with the formal policy model;',
  'SA-17 (4) (c)':
    'Show via informal demonstration, that the descriptive top-level specification completely  covers the interfaces to security-relevant hardware, software, and firmware;',
  'SA-17 (4) (d)':
    'Show that the descriptive top-level specification is an accurate description of the interfaces to security-relevant hardware, software, and firmware; and',
  'SA-17 (4) (e)':
    'Describe the security-relevant hardware, software, and firmware mechanisms not addressed in the descriptive top-level specification but strictly internal to the security-relevant hardware, software, and firmware.',
  'SA-17 (5)':
    'The organization requires the developer of the information system, system component, or information system service to:',
  'SA-17 (5) (a)':
    'Design and structure the security-relevant hardware, software, and firmware to use a complete, conceptually simple protection mechanism with precisely defined semantics; and',
  'SA-17 (5) (b)':
    'Internally structure the security-relevant hardware, software, and firmware with specific regard for this mechanism.',
  'SA-17 (6)':
    'The organization requires the developer of the information system, system component, or information system service to structure security-relevant hardware, software, and firmware to facilitate testing.',
  'SA-17 (7)':
    'The organization requires the developer of the information system, system component, or information system service to structure security-relevant hardware, software, and firmware to facilitate controlling access with least privilege.',
  'SA-18':
    'The organization implements a tamper protection program for the information system, system component, or information system service.',
  'SA-18 (1)':
    'The organization employs anti-tamper technologies and techniques during multiple phases in the system development life cycle including design, development, integration, operations, and maintenance.',
  'SA-18 (2)':
    'The organization inspects [Assignment: organization-defined information systems, system components, or devices] [Selection (one or more): at random; at [Assignment: organization-defined frequency], upon [Assignment: organization-defined indications of need for inspection]] to detect tampering.',
  'SA-19': 'COMPONENT AUTHENTICITY',
  'SA-19 a':
    'Develops and implements anti-counterfeit policy and procedures that include the means to detect and prevent counterfeit components from entering the information system; and',
  'SA-19 b':
    'Reports counterfeit information system components to [Selection (one or more): source of counterfeit component; [Assignment: organization-defined external reporting organizations]; [Assignment: organization-defined personnel or roles]].',
  'SA-19 (1)':
    'The organization trains [Assignment: organization-defined personnel or roles] to detect counterfeit information system components (including hardware, software, and firmware).',
  'SA-19 (2)':
    'The organization maintains configuration control over [Assignment: organization-defined information system components] awaiting service/repair and serviced/repaired components awaiting return to service.',
  'SA-19 (3)':
    'The organization disposes of information system components using [Assignment: organization-defined techniques and methods].',
  'SA-19 (4)':
    'The organization scans for counterfeit information system components [Assignment: organization-defined frequency].',
  'SA-20':
    'The organization re-implements or custom develops [Assignment: organization-defined critical information system components].',
  'SA-21':
    'The organization requires that the developer of [Assignment: organization-defined information system, system component, or information system service]:',
  'SA-21 a':
    'Have appropriate access authorizations as determined by assigned [Assignment: organization-defined official government duties]; and',
  'SA-21 b':
    'Satisfy [Assignment: organization-defined additional personnel screening criteria].',
  'SA-21 (1)':
    'The organization requires the developer of the information system, system component, or information system service take [Assignment: organization-defined actions] to ensure that the required access authorizations and screening criteria are satisfied.',
  'SA-22': 'UNSUPPORTED SYSTEM COMPONENTS',
  'SA-22 a':
    'Replaces information system components when support for the components is no longer available from the developer, vendor, or manufacturer; and',
  'SA-22 b':
    'Provides justification and documents approval for the continued use of unsupported system components required to satisfy mission/business needs.',
  'SA-22 (1)':
    'The organization provides [Selection (one or more): in-house support; [Assignment: organization-defined support from external providers]] for unsupported information system components.',
  'SC-1': 'SYSTEM AND COMMUNICATIONS PROTECTION POLICY AND PROCEDURES',
  'SC-1 a':
    'Develops, documents, and disseminates to [Assignment: organization-defined personnel or roles]:',
  'SC-1 a 1':
    'A system and communications protection policy that addresses purpose, scope, roles, responsibilities, management commitment, coordination among organizational entities, and compliance; and',
  'SC-1 a 2':
    'Procedures to facilitate the implementation of the system and communications protection policy and associated system and communications protection controls; and',
  'SC-1 b': 'Reviews and updates the current:',
  'SC-1 b 1':
    'System and communications protection policy [Assignment: organization-defined frequency]; and',
  'SC-1 b 2':
    'System and communications protection procedures [Assignment: organization-defined frequency].',
  'SC-2':
    'The information system separates user functionality (including user interface services) from information system management functionality.',
  'SC-2 (1)':
    'The information system prevents the presentation of information system management-related functionality at an interface for non-privileged users.',
  'SC-3':
    'The information system isolates security functions from nonsecurity functions.',
  'SC-3 (1)':
    'The information system utilizes underlying hardware separation mechanisms to implement security function isolation.',
  'SC-3 (2)':
    'The information system isolates security functions enforcing access and information flow control from nonsecurity functions and from other security functions.',
  'SC-3 (3)':
    'The organization minimizes the number of nonsecurity functions included within the isolation boundary containing security functions.',
  'SC-3 (4)':
    'The organization implements security functions as largely independent modules that maximize internal cohesiveness within modules and minimize coupling between modules.',
  'SC-3 (5)':
    'The organization implements security functions as a layered structure minimizing interactions between layers of the design and avoiding any dependence by lower layers on the functionality or correctness of higher layers.',
  'SC-4':
    'The information system prevents unauthorized and unintended information transfer via shared system resources.',
  'SC-4 (1)': '[Withdrawn: Incorporated into SC-4].',
  'SC-4 (2)':
    'The information system prevents unauthorized information transfer via shared resources in accordance with [Assignment: organization-defined procedures] when system processing explicitly switches between different information classification levels or security categories.',
  'SC-5':
    'The information system protects against or limits the effects of the following types of denial of service attacks: [Assignment: organization-defined types of denial of service attacks or references to sources for such information] by employing [Assignment: organization-defined security safeguards].',
  'SC-5 (1)':
    'The information system restricts the ability of individuals to launch [Assignment: organization-defined denial of service attacks] against other information systems.',
  'SC-5 (2)':
    'The information system manages excess capacity, bandwidth, or other redundancy to limit the effects of information flooding denial of service attacks.',
  'SC-5 (3)': 'DETECTION / MONITORING',
  'SC-5 (3) (a)':
    'Employs [Assignment: organization-defined monitoring tools] to detect indicators of denial of service attacks against the information system; and',
  'SC-5 (3) (b)':
    'Monitors [Assignment: organization-defined information system resources] to determine if sufficient resources exist to prevent effective denial of service attacks.',
  'SC-6':
    'The information system protects the availability of resources by allocating [Assignment: organization-defined resources] by [Selection (one or more); priority; quota; [Assignment: organization-defined security safeguards]].',
  'SC-7': 'The information system:',
  'SC-7 a':
    'Monitors and controls communications at the external boundary of the system and at key internal boundaries within the system;',
  'SC-7 b':
    'Implements subnetworks for publicly accessible system components that are [Selection: physically; logically] separated from internal organizational networks; and',
  'SC-7 c':
    'Connects to external networks or information systems only through managed interfaces consisting of boundary protection devices arranged in accordance with an organizational security architecture.',
  'SC-7 (1)': '[Withdrawn: Incorporated into SC-7].',
  'SC-7 (2)': '[Withdrawn: Incorporated into SC-7].',
  'SC-7 (3)':
    'The organization limits the number of external network connections to the information system.',
  'SC-7 (4)': 'EXTERNAL TELECOMMUNICATIONS SERVICES',
  'SC-7 (4) (a)':
    'Implements a managed interface for each external telecommunication service;',
  'SC-7 (4) (b)':
    'Establishes a traffic flow policy for each managed interface;',
  'SC-7 (4) (c)':
    'Protects the confidentiality and integrity of the information being transmitted across each interface;',
  'SC-7 (4) (d)':
    'Documents each exception to the traffic flow policy with a supporting mission/business need and duration of that need; and',
  'SC-7 (4) (e)':
    'Reviews exceptions to the traffic flow policy [Assignment: organization-defined frequency] and removes exceptions that are no longer supported by an explicit mission/business need.',
  'SC-7 (5)':
    'The information system at managed interfaces denies network communications traffic by default and allows network communications traffic by exception (i.e., deny all, permit by exception).',
  'SC-7 (6)': '[Withdrawn: Incorporated into SC-7 (18)].',
  'SC-7 (7)':
    'The information system, in conjunction with a remote device, prevents the device from simultaneously establishing non-remote connections with the system and communicating via some other connection to resources in external networks.',
  'SC-7 (8)':
    'The information system routes [Assignment: organization-defined internal communications traffic] to [Assignment: organization-defined external networks] through authenticated proxy servers at managed interfaces.',
  'SC-7 (9)': 'The information system:',
  'SC-7 (9) (a)':
    'Detects and denies outgoing communications traffic posing a threat to external information systems; and',
  'SC-7 (9) (b)':
    'Audits the identity of internal users associated with denied communications.',
  'SC-7 (10)':
    'The organization prevents the unauthorized exfiltration of information across managed interfaces.',
  'SC-7 (11)':
    'The information system only allows incoming communications from [Assignment: organization-defined authorized sources] to be routed to [Assignment: organization-defined authorized destinations].',
  'SC-7 (12)':
    'The organization implements [Assignment: organization-defined host-based boundary protection mechanisms] at [Assignment: organization-defined information system components].',
  'SC-7 (13)':
    'The organization isolates [Assignment: organization-defined information security tools, mechanisms, and support components] from other internal information system components by implementing physically separate subnetworks with managed interfaces to other components of the system.',
  'SC-7 (14)':
    'The organization protects against unauthorized physical connections at [Assignment: organization-defined managed interfaces].',
  'SC-7 (15)':
    'The information system routes all networked, privileged accesses through a dedicated, managed interface for purposes of access control and auditing.',
  'SC-7 (16)':
    'The information system prevents discovery of specific system components composing a managed interface.',
  'SC-7 (17)': 'The information system enforces adherence to protocol formats.',
  'SC-7 (18)':
    'The information system fails securely in the event of an operational failure of a boundary protection device.',
  'SC-7 (19)':
    'The information system blocks both inbound and outbound communications traffic between [Assignment: organization-defined communication clients] that are independently configured by end users and external service providers.',
  'SC-7 (20)':
    'The information system provides the capability to dynamically isolate/segregate [Assignment: organization-defined information system components] from other components of the system.',
  'SC-7 (21)':
    'The organization employs boundary protection mechanisms to separate [Assignment: organization-defined information system components] supporting [Assignment: organization-defined missions and/or business functions].',
  'SC-7 (22)':
    'The information system implements separate network addresses (i.e., different subnets) to connect to systems in different security domains.',
  'SC-7 (23)':
    'The information system disables feedback to senders on protocol format validation failure.',
  'SC-8':
    'The information system protects the [Selection (one or more): confidentiality; integrity] of transmitted information.',
  'SC-8 (1)':
    'The information system implements cryptographic mechanisms to [Selection (one or more): prevent unauthorized disclosure of information; detect changes to information] during transmission unless otherwise protected by [Assignment: organization-defined alternative physical safeguards].',
  'SC-8 (2)':
    'The information system maintains the [Selection (one or more): confidentiality; integrity] of information during preparation for transmission and during reception.',
  'SC-8 (3)':
    'The information system implements cryptographic mechanisms to protect message externals unless otherwise protected by [Assignment: organization-defined alternative physical safeguards].',
  'SC-8 (4)':
    'The information system implements cryptographic mechanisms to conceal or randomize communication patterns unless otherwise protected by [Assignment: organization-defined alternative physical safeguards].',
  'SC-9': '[Withdrawn: Incorporated into SC-8].',
  'SC-10':
    'The information system terminates the network connection associated with a communications session at the end of the session or after [Assignment: organization-defined time period] of inactivity.',
  'SC-11':
    'The information system establishes a trusted communications path between the user and the following security functions of the system: [Assignment: organization-defined security functions to include at a minimum, information system authentication and re-authentication].',
  'SC-11 (1)':
    'The information system provides a trusted communications path that is logically isolated and distinguishable from other paths.',
  'SC-12':
    'The organization establishes and manages cryptographic keys for required cryptography employed within the information system in accordance with [Assignment: organization-defined requirements for key generation, distribution, storage, access, and destruction].',
  'SC-12 (1)':
    'The organization maintains availability of information in the event of the loss of cryptographic keys by users.',
  'SC-12 (2)':
    'The organization produces, controls, and distributes symmetric cryptographic keys using [Selection: NIST FIPS-compliant; NSA-approved] key management technology and processes.',
  'SC-12 (3)':
    "The organization produces, controls, and distributes asymmetric cryptographic keys using [Selection: NSA-approved key management technology and processes; approved PKI Class 3 certificates or prepositioned keying material; approved PKI Class 3 or Class 4 certificates and hardware security tokens that protect the user's private key].",
  'SC-12 (4)': '[Withdrawn: Incorporated into SC-12].',
  'SC-12 (5)': '[Withdrawn: Incorporated into SC-12].',
  'SC-13':
    'The information system implements [Assignment: organization-defined cryptographic uses and type of cryptography required for each use] in accordance with applicable federal laws, Executive Orders, directives, policies, regulations, and standards.',
  'SC-13 (1)': '[Withdrawn: Incorporated into SC-13].',
  'SC-13 (2)': '[Withdrawn: Incorporated into SC-13].',
  'SC-13 (3)': '[Withdrawn: Incorporated into SC-13].',
  'SC-13 (4)': '[Withdrawn: Incorporated into SC-13].',
  'SC-14':
    '[Withdrawn: Capability provided by AC-2, AC-3, AC-5, AC-6, SI-3, SI-4, SI-5, SI-7, SI-10].',
  'SC-15': 'The information system:',
  'SC-15 a':
    'Prohibits remote activation of collaborative computing devices with the following exceptions: [Assignment: organization-defined exceptions where remote activation is to be allowed]; and',
  'SC-15 b':
    'Provides an explicit indication of use to users physically present at the devices.',
  'SC-15 (1)':
    'The information system provides physical disconnect of collaborative computing devices in a manner that supports ease of use.',
  'SC-15 (2)': '[Withdrawn: Incorporated into SC-7].',
  'SC-15 (3)':
    'The organization disables or removes collaborative computing devices from [Assignment: organization-defined information systems or information system components] in [Assignment: organization-defined secure work areas].',
  'SC-15 (4)':
    'The information system provides an explicit indication of current participants in [Assignment: organization-defined online meetings and teleconferences].',
  'SC-16':
    'The information system associates [Assignment: organization-defined security attributes] with information exchanged between information systems and between system components.',
  'SC-16 (1)':
    'The information system validates the integrity of transmitted security attributes.',
  'SC-17':
    'The organization issues public key certificates under an [Assignment: organization-defined certificate policy] or obtains public key certificates from an approved service provider.',
  'SC-18': 'MOBILE CODE',
  'SC-18 a':
    'Defines acceptable and unacceptable mobile code and mobile code technologies;',
  'SC-18 b':
    'Establishes usage restrictions and implementation guidance for acceptable mobile code and mobile code technologies; and',
  'SC-18 c':
    'Authorizes, monitors, and controls the use of mobile code within the information system.',
  'SC-18 (1)':
    'The information system identifies [Assignment: organization-defined unacceptable mobile code] and takes [Assignment: organization-defined corrective actions].',
  'SC-18 (2)':
    'The organization ensures that the acquisition, development, and use of mobile code to be deployed in the information system meets [Assignment: organization-defined mobile code requirements].',
  'SC-18 (3)':
    'The information system prevents the download and execution of [Assignment: organization-defined unacceptable mobile code].',
  'SC-18 (4)':
    'The information system prevents the automatic execution of mobile code in [Assignment: organization-defined software applications] and enforces [Assignment: organization-defined actions] prior to executing the code.',
  'SC-18 (5)':
    'The organization allows execution of permitted mobile code only in confined virtual machine environments.',
  'SC-19': 'VOICE OVER INTERNET PROTOCOL',
  'SC-19 a':
    'Establishes usage restrictions and implementation guidance for Voice over Internet Protocol (VoIP) technologies based on the potential to cause damage to the information system if used maliciously; and',
  'SC-19 b':
    'Authorizes, monitors, and controls the use of VoIP within the information system.',
  'SC-20': 'The information system:',
  'SC-20 a':
    'Provides additional data origin authentication and integrity verification artifacts along with the authoritative name resolution data the system returns in response to external name/address resolution queries; and',
  'SC-20 b':
    'Provides the means to indicate the security status of child zones and (if the child supports secure resolution services) to enable verification of a chain of trust among parent and child domains, when operating as part of a distributed, hierarchical namespace.',
  'SC-20 (1)': '[Withdrawn: Incorporated into SC-20].',
  'SC-20 (2)':
    'The information system provides data origin and integrity protection artifacts for internal name/address resolution queries.',
  'SC-21':
    'The information system requests and performs data origin authentication and data integrity verification on the name/address resolution responses the system receives from authoritative sources.',
  'SC-21 (1)': '[Withdrawn: Incorporated into SC-21].',
  'SC-22':
    'The information systems that collectively provide name/address resolution service for an organization are fault-tolerant and implement internal/external role separation.',
  'SC-23':
    'The information system protects the authenticity of communications sessions.',
  'SC-23 (1)':
    'The information system invalidates session identifiers upon user logout or other session termination.',
  'SC-23 (2)': '[Withdrawn: Incorporated into AC-12 (1)].',
  'SC-23 (3)':
    'The information system generates a unique session identifier for each session with [Assignment: organization-defined randomness requirements] and recognizes only session identifiers that are system-generated.',
  'SC-23 (4)': '[Withdrawn: Incorporated into SC-23 (3)].',
  'SC-23 (5)':
    'The information system only allows the use of [Assignment: organization-defined certificate authorities] for verification of the establishment of protected sessions.',
  'SC-24':
    'The information system fails to a [Assignment: organization-defined known-state] for [Assignment: organization-defined types of failures] preserving [Assignment: organization-defined system state information] in failure.',
  'SC-25':
    'The organization employs [Assignment: organization-defined information system components] with minimal functionality and information storage.',
  'SC-26':
    'The information system includes components specifically designed to be the target of malicious attacks for the purpose of detecting, deflecting, and analyzing such attacks.',
  'SC-26 (1)': '[Withdrawn: Incorporated into SC-35].',
  'SC-27':
    'The information system includes: [Assignment: organization-defined platform-independent applications].',
  'SC-28':
    'The information system protects the [Selection (one or more): confidentiality; integrity] of [Assignment: organization-defined information at rest].',
  'SC-28 (1)':
    'The information system implements cryptographic mechanisms to prevent unauthorized disclosure and modification of [Assignment: organization-defined information] on [Assignment: organization-defined information system components].',
  'SC-28 (2)':
    'The organization removes from online storage and stores off-line in a secure location [Assignment: organization-defined information].',
  'SC-29':
    'The organization employs a diverse set of information technologies for [Assignment: organization-defined information system components] in the implementation of the information system.',
  'SC-29 (1)':
    'The organization employs virtualization techniques to support the deployment of a diversity of operating systems and applications that are changed [Assignment: organization-defined frequency].',
  'SC-30':
    'The organization employs [Assignment: organization-defined concealment and misdirection techniques] for [Assignment: organization-defined information systems] at [Assignment: organization-defined time periods] to confuse and mislead adversaries.',
  'SC-30 (1)': '[Withdrawn: Incorporated into SC-29 (1)].',
  'SC-30 (2)':
    'The organization employs [Assignment: organization-defined techniques] to introduce randomness into organizational operations and assets.',
  'SC-30 (3)':
    'The organization changes the location of [Assignment: organization-defined processing and/or storage] [Selection: [Assignment: organization-defined time frequency]; at random time intervals]].',
  'SC-30 (4)':
    'The organization employs realistic, but misleading information in [Assignment: organization-defined information system components] with regard to its security state or posture.',
  'SC-30 (5)':
    'The organization employs [Assignment: organization-defined techniques] to hide or conceal [Assignment: organization-defined information system components].',
  'SC-31': 'COVERT CHANNEL ANALYSIS',
  'SC-31 a':
    'Performs a covert channel analysis to identify those aspects of communications within the information system that are potential avenues for covert [Selection (one or more): storage; timing] channels; and',
  'SC-31 b': 'Estimates the maximum bandwidth of those channels.',
  'SC-31 (1)':
    'The organization tests a subset of the identified covert channels to determine which channels are exploitable.',
  'SC-31 (2)':
    'The organization reduces the maximum bandwidth for identified covert [Selection (one or more); storage; timing] channels to [Assignment: organization-defined values].',
  'SC-31 (3)':
    'The organization measures the bandwidth of [Assignment: organization-defined subset of identified covert channels] in the operational environment of the information system.',
  'SC-32':
    'The organization partitions the information system into [Assignment: organization-defined information system components] residing in separate physical domains or environments based on [Assignment: organization-defined circumstances for physical separation of components].',
  'SC-33': '[Withdrawn: Incorporated into SC-8].',
  'SC-34':
    'The information system at [Assignment: organization-defined information system components]:',
  'SC-34 a':
    'Loads and executes the operating environment from hardware-enforced, read-only media; and',
  'SC-34 b':
    'Loads and executes [Assignment: organization-defined applications] from hardware-enforced, read-only media.',
  'SC-34 (1)':
    'The organization employs [Assignment: organization-defined information system components] with no writeable storage that is persistent across component restart or power on/off.',
  'SC-34 (2)':
    'The organization protects the integrity of information prior to storage on read-only media and controls the media after such information has been recorded onto the media.',
  'SC-34 (3)': 'HARDWARE-BASED PROTECTION',
  'SC-34 (3) (a)':
    'Employs hardware-based, write-protect for [Assignment: organization-defined information system firmware components]; and',
  'SC-34 (3) (b)':
    'Implements specific procedures for [Assignment: organization-defined authorized individuals] to manually disable hardware write-protect for firmware modifications and re-enable the write-protect prior to returning to operational mode.',
  'SC-35':
    'The information system includes components that proactively seek to identify malicious websites and/or web-based malicious code.',
  'SC-36':
    'The organization distributes [Assignment: organization-defined processing and storage] across multiple physical locations.',
  'SC-36 (1)':
    'The organization employs polling techniques to identify potential faults, errors, or compromises to [Assignment: organization-defined distributed processing and storage components].',
  'SC-37':
    'The organization employs [Assignment: organization-defined out-of-band channels] for the physical delivery or electronic transmission of [Assignment: organization-defined information, information system components, or devices] to [Assignment: organization-defined individuals or information systems].',
  'SC-37 (1)':
    'The organization employs [Assignment: organization-defined security safeguards] to ensure that only [Assignment: organization-defined individuals or information systems] receive the [Assignment: organization-defined information, information system components, or devices].',
  'SC-38':
    'The organization employs [Assignment: organization-defined operations security safeguards] to protect key organizational information throughout the system development life cycle.',
  'SC-39':
    'The information system maintains a separate execution domain for each executing process.',
  'SC-39 (1)':
    'The information system implements underlying hardware separation mechanisms to facilitate process separation.',
  'SC-39 (2)':
    'The information system maintains a separate execution domain for each thread in [Assignment: organization-defined multi-threaded processing].',
  'SC-40':
    'The information system protects external and internal [Assignment: organization-defined wireless links] from [Assignment: organization-defined types of signal parameter attacks or references to sources for such attacks].',
  'SC-40 (1)':
    'The information system implements cryptographic mechanisms that achieve [Assignment: organization-defined level of protection] against the effects of intentional electromagnetic interference.',
  'SC-40 (2)':
    'The information system implements cryptographic mechanisms to reduce the detection potential of wireless links to [Assignment: organization-defined level of reduction].',
  'SC-40 (3)':
    'The information system implements cryptographic mechanisms to identify and reject wireless transmissions that are deliberate attempts to achieve imitative or manipulative communications deception based on signal parameters.',
  'SC-40 (4)':
    'The information system implements cryptographic mechanisms to prevent the identification of [Assignment: organization-defined wireless transmitters] by using the transmitter signal parameters.',
  'SC-41':
    'The organization physically disables or removes [Assignment: organization-defined connection ports or input/output devices] on [Assignment: organization-defined information systems or information system components].',
  'SC-42': 'The information system:',
  'SC-42 a':
    'Prohibits the remote activation of environmental sensing capabilities with the following exceptions: [Assignment: organization-defined exceptions where remote activation of sensors is allowed]; and',
  'SC-42 b':
    'Provides an explicit indication of sensor use to [Assignment: organization-defined class of users].',
  'SC-42 (1)':
    'The organization ensures that the information system is configured so that data or information collected by the [Assignment: organization-defined sensors] is only reported to authorized individuals or roles.',
  'SC-42 (2)':
    'The organization employs the following measures: [Assignment: organization-defined measures], so that data or information collected by [Assignment: organization-defined sensors] is only used for authorized purposes.',
  'SC-42 (3)':
    'The organization prohibits the use of devices possessing [Assignment: organization-defined environmental sensing capabilities] in [Assignment: organization-defined facilities, areas, or systems].',
  'SC-43': 'USAGE RESTRICTIONS',
  'SC-43 a':
    'Establishes usage restrictions and implementation guidance for [Assignment: organization-defined information system components] based on the potential to cause damage to the information system if used maliciously; and',
  'SC-43 b':
    'Authorizes, monitors, and controls the use of such components within the information system.',
  'SC-44':
    'The organization employs a detonation chamber capability within [Assignment: organization-defined information system, system component, or location].',
  'SI-1': 'SYSTEM AND INFORMATION INTEGRITY POLICY AND PROCEDURES',
  'SI-1 a':
    'Develops, documents, and disseminates to [Assignment: organization-defined personnel or roles]:',
  'SI-1 a 1':
    'A system and information integrity policy that addresses purpose, scope, roles, responsibilities, management commitment, coordination among organizational entities, and compliance; and',
  'SI-1 a 2':
    'Procedures to facilitate the implementation of the system and information integrity policy and associated system and information integrity controls; and',
  'SI-1 b': 'Reviews and updates the current:',
  'SI-1 b 1':
    'System and information integrity policy [Assignment: organization-defined frequency]; and',
  'SI-1 b 2':
    'System and information integrity procedures [Assignment: organization-defined frequency].',
  'SI-2': 'FLAW REMEDIATION',
  'SI-2 a': 'Identifies, reports, and corrects information system flaws;',
  'SI-2 b':
    'Tests software and firmware updates related to flaw remediation for effectiveness and potential side effects before installation;',
  'SI-2 c':
    'Installs security-relevant software and firmware updates within [Assignment: organization-defined time period] of the release of the updates; and',
  'SI-2 d':
    'Incorporates flaw remediation into the organizational configuration management process.',
  'SI-2 (1)':
    'The organization centrally manages the flaw remediation process.',
  'SI-2 (2)':
    'The organization employs automated mechanisms [Assignment: organization-defined frequency] to determine the state of information system components with regard to flaw remediation.',
  'SI-2 (3)': 'TIME TO REMEDIATE FLAWS / BENCHMARKS FOR CORRECTIVE ACTIONS',
  'SI-2 (3) (a)':
    'Measures the time between flaw identification and flaw remediation; and',
  'SI-2 (3) (b)':
    'Establishes [Assignment: organization-defined benchmarks] for taking corrective actions.',
  'SI-2 (4)': '[Withdrawn: Incorporated into SI-2].',
  'SI-2 (5)':
    'The organization installs [Assignment: organization-defined security-relevant software and firmware updates] automatically to [Assignment: organization-defined information system components].',
  'SI-2 (6)':
    'The organization removes [Assignment: organization-defined software and firmware components] after updated versions have been installed.',
  'SI-3': 'MALICIOUS CODE PROTECTION',
  'SI-3 a':
    'Employs malicious code protection mechanisms at information system entry and exit points to detect and eradicate malicious code;',
  'SI-3 b':
    'Updates malicious code protection mechanisms whenever new releases are available in accordance with organizational configuration management policy and procedures;',
  'SI-3 c': 'Configures malicious code protection mechanisms to:',
  'SI-3 c 1':
    'Perform periodic scans of the information system [Assignment: organization-defined frequency] and real-time scans of files from external sources at [Selection (one or more); endpoint; network entry/exit points] as the files are downloaded, opened, or executed in accordance with organizational security policy; and',
  'SI-3 c 2':
    '[Selection (one or more): block malicious code; quarantine malicious code;  send alert to administrator; [Assignment: organization-defined action]] in response to malicious code detection; and',
  'SI-3 d':
    'Addresses the receipt of false positives during malicious code detection and eradication and the resulting potential impact on the availability of the information system.',
  'SI-3 (1)':
    'The organization centrally manages malicious code protection mechanisms.',
  'SI-3 (2)':
    'The information system automatically updates malicious code protection mechanisms.',
  'SI-3 (3)': '[Withdrawn: Incorporated into AC-6 (10)].',
  'SI-3 (4)':
    'The information system updates malicious code protection mechanisms only when directed by a privileged user.',
  'SI-3 (5)': '[Withdrawn: Incorporated into MP-7].',
  'SI-3 (6)': 'TESTING / VERIFICATION',
  'SI-3 (6) (a)':
    'Tests malicious code protection mechanisms [Assignment: organization-defined frequency] by introducing a known benign, non-spreading test case into the information system; and',
  'SI-3 (6) (b)':
    'Verifies that both detection of the test case and associated incident reporting occur.',
  'SI-3 (7)':
    'The information system implements nonsignature-based malicious code detection mechanisms.',
  'SI-3 (8)':
    'The information system detects [Assignment: organization-defined unauthorized operating system commands] through the kernel application programming interface at [Assignment: organization-defined information system hardware components] and [Selection (one or more): issues a warning; audits the command execution; prevents the execution of the command].',
  'SI-3 (9)':
    'The information system implements [Assignment: organization-defined security safeguards] to authenticate [Assignment: organization-defined remote commands].',
  'SI-3 (10)': 'MALICIOUS CODE ANALYSIS',
  'SI-3 (10) (a)':
    'Employs [Assignment: organization-defined tools and techniques] to analyze the characteristics and behavior of malicious code; and',
  'SI-3 (10) (b)':
    'Incorporates the results from malicious code analysis into organizational incident response and flaw remediation processes.',
  'SI-4': 'INFORMATION SYSTEM MONITORING',
  'SI-4 a': 'Monitors the information system to detect:',
  'SI-4 a 1':
    'Attacks and indicators of potential attacks in accordance with [Assignment: organization-defined monitoring objectives]; and',
  'SI-4 a 2': 'Unauthorized local, network, and remote connections;',
  'SI-4 b':
    'Identifies unauthorized use of the information system through [Assignment: organization-defined techniques and methods];',
  'SI-4 c': 'Deploys monitoring devices:',
  'SI-4 c 1':
    'Strategically within the information system to collect organization-determined essential information; and',
  'SI-4 c 2':
    'At ad hoc locations within the system to track specific types of transactions of interest to the organization;',
  'SI-4 d':
    'Protects information obtained from intrusion-monitoring tools from unauthorized access, modification, and deletion;',
  'SI-4 e':
    'Heightens the level of information system monitoring activity whenever there is an indication of increased risk to organizational operations and assets, individuals, other organizations, or the Nation based on law enforcement information, intelligence information, or other credible sources of information;',
  'SI-4 f':
    'Obtains legal opinion with regard to information system monitoring activities in accordance with applicable federal laws, Executive Orders, directives, policies, or regulations; and',
  'SI-4 g':
    'Provides [Assignment: organization-defined information system monitoring information] to [Assignment: organization-defined personnel or roles] [Selection (one or more): as needed; [Assignment: organization-defined frequency]].',
  'SI-4 (1)':
    'The organization connects and configures individual intrusion detection tools into an information system-wide intrusion detection system.',
  'SI-4 (2)':
    'The organization employs automated tools to support near real-time analysis of events.',
  'SI-4 (3)':
    'The organization employs automated tools to integrate intrusion detection tools into access control and flow control mechanisms for rapid response to attacks by enabling reconfiguration of these mechanisms in support of attack isolation and elimination.',
  'SI-4 (4)':
    'The information system monitors inbound and outbound communications traffic [Assignment: organization-defined frequency] for unusual or unauthorized activities or conditions.',
  'SI-4 (5)':
    'The information system alerts [Assignment: organization-defined personnel or roles] when the following indications of compromise or potential compromise occur: [Assignment: organization-defined compromise indicators].',
  'SI-4 (6)': '[Withdrawn: Incorporated into AC-6 (10)].',
  'SI-4 (7)':
    'The information system notifies [Assignment: organization-defined incident response personnel (identified by name and/or by role)] of detected suspicious events and takes [Assignment: organization-defined least-disruptive actions to terminate suspicious events].',
  'SI-4 (8)': '[Withdrawn: Incorporated into SI-4].',
  'SI-4 (9)':
    'The organization tests intrusion-monitoring tools [Assignment: organization-defined frequency].',
  'SI-4 (10)':
    'The organization makes provisions so that [Assignment: organization-defined encrypted communications traffic] is visible to [Assignment: organization-defined information system monitoring tools].',
  'SI-4 (11)':
    'The organization analyzes outbound communications traffic at the external boundary of the information system and selected [Assignment: organization-defined interior points within the system (e.g., subnetworks, subsystems)] to discover anomalies.',
  'SI-4 (12)':
    'The organization employs automated mechanisms to alert security personnel of the following inappropriate or unusual activities with security implications: [Assignment: organization-defined activities that trigger alerts].',
  'SI-4 (13)': 'ANALYZE TRAFFIC / EVENT PATTERNS',
  'SI-4 (13) (a)':
    'Analyzes communications traffic/event patterns for the information system;',
  'SI-4 (13) (b)':
    'Develops profiles representing common traffic patterns and/or events; and',
  'SI-4 (13) (c)':
    'Uses the traffic/event profiles in tuning system-monitoring devices to reduce the number of false positives and the number of false negatives.',
  'SI-4 (14)':
    'The organization employs a wireless intrusion detection system to identify rogue wireless devices and to detect attack attempts and potential compromises/breaches to the information system.',
  'SI-4 (15)':
    'The organization employs an intrusion detection system to monitor wireless communications traffic as the traffic passes from wireless to wireline networks.',
  'SI-4 (16)':
    'The organization correlates information from monitoring tools employed throughout the information system.',
  'SI-4 (17)':
    'The organization correlates information from monitoring physical, cyber, and supply chain activities to achieve integrated, organization-wide situational awareness.',
  'SI-4 (18)':
    'The organization analyzes outbound communications traffic at the external boundary of the information system (i.e., system perimeter) and at [Assignment: organization-defined interior points within the system (e.g., subsystems, subnetworks)] to detect covert exfiltration of information.',
  'SI-4 (19)':
    'The organization implements [Assignment: organization-defined additional monitoring] of individuals who have been identified by [Assignment: organization-defined sources] as posing an increased level of risk.',
  'SI-4 (20)':
    'The organization implements [Assignment: organization-defined additional monitoring] of privileged users.',
  'SI-4 (21)':
    'The organization implements [Assignment: organization-defined additional monitoring] of individuals during [Assignment: organization-defined probationary period].',
  'SI-4 (22)':
    'The information system detects network services that have not been authorized or approved by [Assignment: organization-defined authorization or approval processes] and [Selection (one or more): audits; alerts [Assignment: organization-defined personnel or roles]].',
  'SI-4 (23)':
    'The organization implements [Assignment: organization-defined host-based monitoring mechanisms] at [Assignment: organization-defined information system components].',
  'SI-4 (24)':
    'The information system discovers, collects, distributes, and uses indicators of compromise.',
  'SI-5': 'SECURITY ALERTS, ADVISORIES, AND DIRECTIVES',
  'SI-5 a':
    'Receives information system security alerts, advisories, and directives from [Assignment: organization-defined external organizations] on an ongoing basis;',
  'SI-5 b':
    'Generates internal security alerts, advisories, and directives as deemed necessary;',
  'SI-5 c':
    'Disseminates security alerts, advisories, and directives to: [Selection (one or more): [Assignment: organization-defined personnel or roles]; [Assignment: organization-defined elements within the organization]; [Assignment: organization-defined external organizations]]; and',
  'SI-5 d':
    'Implements security directives in accordance with established time frames, or notifies the issuing organization of the degree of noncompliance.',
  'SI-5 (1)':
    'The organization employs automated mechanisms to make security alert and advisory information available throughout the organization.',
  'SI-6': 'The information system:',
  'SI-6 a':
    'Verifies the correct operation of [Assignment: organization-defined security functions];',
  'SI-6 b':
    'Performs this verification [Selection (one or more): [Assignment: organization-defined system transitional states]; upon command by user with appropriate privilege; [Assignment: organization-defined frequency]];',
  'SI-6 c':
    'Notifies [Assignment: organization-defined personnel or roles] of failed security verification tests; and',
  'SI-6 d':
    '[Selection (one or more): shuts the information system down; restarts the information system; [Assignment: organization-defined alternative action(s)]] when anomalies are discovered.',
  'SI-6 (1)': '[Withdrawn: Incorporated into SI-6].',
  'SI-6 (2)':
    'The information system implements automated mechanisms to support the management of distributed security testing.',
  'SI-6 (3)':
    'The organization reports the results of security function verification to [Assignment: organization-defined personnel or roles].',
  'SI-7':
    'The organization employs integrity verification tools to detect unauthorized changes to [Assignment: organization-defined software, firmware, and information].',
  'SI-7 (1)':
    'The information system performs an integrity check of [Assignment: organization-defined software, firmware, and information] [Selection (one or more): at startup; at [Assignment: organization-defined transitional states or security-relevant events]; [Assignment: organization-defined frequency]].',
  'SI-7 (2)':
    'The organization employs automated tools that provide notification to [Assignment: organization-defined personnel or roles] upon discovering discrepancies during integrity verification.',
  'SI-7 (3)':
    'The organization employs centrally managed integrity verification tools.',
  'SI-7 (4)': '[Withdrawn: Incorporated into SA-12].',
  'SI-7 (5)':
    'The information system automatically [Selection (one or more): shuts the information system down; restarts the information system; implements [Assignment: organization-defined security safeguards]] when integrity violations are discovered.',
  'SI-7 (6)':
    'The information system implements cryptographic mechanisms to detect unauthorized changes to software, firmware, and information.',
  'SI-7 (7)':
    'The organization incorporates the detection of unauthorized [Assignment: organization-defined security-relevant changes to the information system] into the organizational incident response capability.',
  'SI-7 (8)':
    'The information system, upon detection of a potential integrity violation, provides the capability to audit the event and initiates the following actions: [Selection (one or more): generates an audit record; alerts current user; alerts [Assignment: organization-defined personnel or roles]; [Assignment: organization-defined other actions]].',
  'SI-7 (9)':
    'The information system verifies the integrity of the boot process of [Assignment: organization-defined devices].',
  'SI-7 (10)':
    'The information system implements [Assignment: organization-defined security safeguards] to protect the integrity of boot firmware in [Assignment: organization-defined devices].',
  'SI-7 (11)':
    'The organization requires that [Assignment: organization-defined user-installed software] execute in a confined physical or virtual machine environment with limited privileges.',
  'SI-7 (12)':
    'The organization requires that the integrity of [Assignment: organization-defined user-installed software] be verified prior to execution.',
  'SI-7 (13)':
    'The organization allows execution of binary or machine-executable code obtained from sources with limited or no warranty and without the provision of source code only in confined physical or virtual machine environments and with the explicit approval of [Assignment: organization-defined personnel or roles].',
  'SI-7 (14)': 'BINARY OR MACHINE EXECUTABLE CODE',
  'SI-7 (14) (a)':
    'Prohibits the use of binary or machine-executable code from sources with limited or no warranty and without the provision of source code; and',
  'SI-7 (14) (b)':
    'Provides exceptions to the source code requirement only for compelling mission/operational requirements and with the approval of the authorizing official.',
  'SI-7 (15)':
    'The information system implements cryptographic mechanisms to authenticate [Assignment: organization-defined software or firmware components] prior to installation.',
  'SI-7 (16)':
    'The organization does not allow processes to execute without supervision for more than [Assignment: organization-defined time period].',
  'SI-8': 'SPAM PROTECTION',
  'SI-8 a':
    'Employs spam protection mechanisms at information system entry and exit points to detect and take action on unsolicited messages; and',
  'SI-8 b':
    'Updates spam protection mechanisms when new releases are available in accordance with organizational configuration management policy and procedures.',
  'SI-8 (1)': 'The organization centrally manages spam protection mechanisms.',
  'SI-8 (2)':
    'The information system automatically updates spam protection mechanisms.',
  'SI-8 (3)':
    'The information system implements spam protection mechanisms with a learning capability to more effectively identify legitimate communications traffic.',
  'SI-9': '[Withdrawn: Incorporated into AC-2, AC-3, AC-5, AC-6].',
  'SI-10':
    'The information system checks the validity of [Assignment: organization-defined information inputs].',
  'SI-10 (1)': 'The information system:',
  'SI-10 (1) (a)':
    'Provides a manual override capability for input validation of [Assignment: organization-defined inputs];',
  'SI-10 (1) (b)':
    'Restricts the use of the manual override capability to only [Assignment: organization-defined authorized individuals]; and',
  'SI-10 (1) (c)': 'Audits the use of the manual override capability.',
  'SI-10 (2)':
    'The organization ensures that input validation errors are reviewed and resolved within [Assignment: organization-defined time period].',
  'SI-10 (3)':
    'The information system behaves in a predictable and documented manner that reflects organizational and system objectives when invalid inputs are received.',
  'SI-10 (4)':
    'The organization accounts for timing interactions among information system components in determining appropriate responses for invalid inputs.',
  'SI-10 (5)':
    'The organization restricts the use of information inputs to [Assignment: organization-defined trusted sources] and/or [Assignment: organization-defined formats].',
  'SI-11': 'The information system:',
  'SI-11 a':
    'Generates error messages that provide information necessary for corrective actions without revealing information that could be exploited by adversaries; and',
  'SI-11 b':
    'Reveals error messages only to [Assignment: organization-defined personnel or roles].',
  'SI-12':
    'The organization handles and retains information within the information system and information output from the system in accordance with applicable federal laws, Executive Orders, directives, policies, regulations, standards, and operational requirements.',
  'SI-13': 'PREDICTABLE FAILURE PREVENTION',
  'SI-13 a':
    'Determines mean time to failure (MTTF) for [Assignment: organization-defined information system components] in specific environments of operation; and',
  'SI-13 b':
    'Provides substitute information system components and a means to exchange active and standby components at [Assignment: organization-defined MTTF substitution criteria].',
  'SI-13 (1)':
    'The organization takes information system components out of service by transferring component responsibilities to substitute components no later than [Assignment: organization-defined fraction or percentage] of mean time to failure.',
  'SI-13 (2)': '[Withdrawn: Incorporated into SI-7 (16)].',
  'SI-13 (3)':
    'The organization manually initiates transfers between active and standby information system components [Assignment: organization-defined frequency] if the mean time to failure exceeds [Assignment: organization-defined time period].',
  'SI-13 (4)':
    'The organization, if information system component failures are detected:',
  'SI-13 (4) (a)':
    'Ensures that the standby components are successfully and transparently installed within [Assignment: organization-defined time period]; and',
  'SI-13 (4) (b)':
    '[Selection (one or more): activates [Assignment: organization-defined alarm]; automatically shuts down the information system].',
  'SI-13 (5)':
    'The organization provides [Selection: real-time; near real-time] [Assignment: organization-defined failover capability] for the information system.',
  'SI-14':
    'The organization implements non-persistent [Assignment: organization-defined information system components and services] that are initiated in a known state and terminated [Selection (one or more): upon end of session of use; periodically at [Assignment: organization-defined frequency]].',
  'SI-14 (1)':
    'The organization ensures that software and data employed during information system component and service refreshes are obtained from [Assignment: organization-defined trusted sources].',
  'SI-15':
    'The information system validates information output from [Assignment: organization-defined software programs and/or applications] to ensure that the information is consistent with the expected content.',
  'SI-16':
    'The information system implements [Assignment: organization-defined security safeguards] to protect its memory from unauthorized code execution.',
  'SI-17':
    'The information system implements [Assignment: organization-defined fail-safe procedures] when [Assignment: organization-defined failure conditions occur].',
  'PM-1': 'INFORMATION SECURITY PROGRAM PLAN',
  'PM-1 a':
    'Develops and disseminates an organization-wide information security program plan that:',
  'PM-1 a 1':
    'Provides an overview of the requirements for the security program and a description of the security program management controls and common controls in place or planned for meeting those requirements;',
  'PM-1 a 2':
    'Includes the identification and assignment of roles, responsibilities, management commitment, coordination among organizational entities, and compliance;',
  'PM-1 a 3':
    'Reflects coordination among organizational entities responsible for the different aspects of information security (i.e., technical, physical, personnel, cyber-physical); and',
  'PM-1 a 4':
    'Is approved by a senior official with responsibility and accountability for the risk being incurred to organizational operations (including mission, functions, image, and reputation), organizational assets, individuals, other organizations, and the Nation;',
  'PM-1 b':
    'Reviews the organization-wide information security program plan [Assignment: organization-defined frequency];',
  'PM-1 c':
    'Updates the plan to address organizational changes and problems identified during plan implementation or security control assessments; and',
  'PM-1 d':
    'Protects the information security program plan from unauthorized disclosure and modification.',
  'PM-2':
    'The organization appoints a senior information security officer with the mission and resources to coordinate, develop, implement, and maintain an organization-wide information security program.',
  'PM-3': 'INFORMATION SECURITY RESOURCES',
  'PM-3 a':
    'Ensures that all capital planning and investment requests include the resources needed to implement the information security program and documents all exceptions to this requirement;',
  'PM-3 b':
    'Employs a business case/Exhibit 300/Exhibit 53 to record the resources required; and',
  'PM-3 c':
    'Ensures that information security resources are available for expenditure as planned.',
  'PM-4': 'PLAN OF ACTION AND MILESTONES PROCESS',
  'PM-4 a':
    'Implements a process for ensuring that plans of action and milestones for the security program and associated organizational information systems:',
  'PM-4 a 1': 'Are developed and maintained;',
  'PM-4 a 2':
    'Document the remedial information security actions to adequately respond to risk to organizational operations and assets, individuals, other organizations, and the Nation; and',
  'PM-4 a 3':
    'Are reported in accordance with OMB FISMA reporting requirements.',
  'PM-4 b':
    'Reviews plans of action and milestones for consistency with the organizational risk management strategy and organization-wide priorities for risk response actions.',
  'PM-5':
    'The organization develops and maintains an inventory of its information systems.',
  'PM-6':
    'The organization develops, monitors, and reports on the results of information security measures of performance.',
  'PM-7':
    'The organization develops an enterprise architecture with consideration for information security and the resulting risk to organizational operations, organizational assets, individuals, other organizations, and the Nation.',
  'PM-8':
    'The organization addresses information security issues in the development, documentation, and updating of a critical infrastructure and key resources protection plan.',
  'PM-9': 'RISK MANAGEMENT STRATEGY',
  'PM-9 a':
    'Develops a comprehensive strategy to manage risk to organizational operations and assets, individuals, other organizations, and the Nation associated with the operation and use of information systems;',
  'PM-9 b':
    'Implements the risk management strategy consistently across the organization; and',
  'PM-9 c':
    'Reviews and updates the risk management strategy [Assignment: organization-defined frequency] or as required, to address organizational changes.',
  'PM-10': 'SECURITY AUTHORIZATION PROCESS',
  'PM-10 a':
    'Manages (i.e., documents, tracks, and reports) the security state of organizational information systems and the environments in which those systems operate through security authorization processes;',
  'PM-10 b':
    'Designates individuals to fulfill specific roles and responsibilities within the organizational risk management process; and',
  'PM-10 c':
    'Fully integrates the security authorization processes into an organization-wide risk management program.',
  'PM-11': 'MISSION/BUSINESS PROCESS DEFINITION',
  'PM-11 a':
    'Defines mission/business processes with consideration for information security and the resulting risk to organizational operations, organizational assets, individuals, other organizations, and the Nation; and',
  'PM-11 b':
    'Determines information protection needs arising from the defined mission/business processes and revises the processes as necessary, until achievable protection needs are obtained.',
  'PM-12':
    'The organization implements an insider threat program that includes a cross-discipline insider threat incident handling team.',
  'PM-13':
    'The organization establishes an information security workforce development and improvement program.',
  'PM-14': 'TESTING, TRAINING, AND MONITORING',
  'PM-14 a':
    'Implements a process for ensuring that organizational plans for conducting security testing, training, and monitoring activities associated with organizational information systems:',
  'PM-14 a 1': 'Are developed and maintained; and',
  'PM-14 a 2': 'Continue to be executed in a timely manner;',
  'PM-14 b':
    'Reviews testing, training, and monitoring plans for consistency with the organizational risk management strategy and organization-wide priorities for risk response actions.',
  'PM-15':
    'The organization establishes and institutionalizes contact with selected groups and associations within the security community:',
  'PM-15 a':
    'To facilitate ongoing security education and training for organizational personnel;',
  'PM-15 b':
    'To maintain currency with recommended security practices, techniques, and technologies; and',
  'PM-15 c':
    'To share current security-related information including threats, vulnerabilities, and incidents.',
  'PM-16':
    'The organization implements a threat awareness program that includes a cross-organization information-sharing capability.'
};
