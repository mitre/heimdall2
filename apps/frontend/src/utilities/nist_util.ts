export const nist_canon_config = {
  add_spaces: true,
  allow_letters: true,
  max_specifiers: 5,
  pad_zeros: true,
  add_periods: false,
  add_parens: false
};
export const NIST_DESCRIPTIONS: {[tag: string]: string} = {
  'AC-01': 'ACCESS CONTROL POLICY AND PROCEDURES',
  'AC-01 a':
    'Develops, documents, and disseminates to [Assignment: organization-defined personnel or roles]:',
  'AC-01 a 01':
    'An access control policy that addresses purpose, scope, roles, responsibilities, management commitment, coordination among organizational entities, and compliance; and',
  'AC-01 a 02':
    'Procedures to facilitate the implementation of the access control policy and associated access controls; and',
  'AC-01 b': 'Reviews and updates the current:',
  'AC-01 b 01':
    'Access control policy [Assignment: organization-defined frequency]; and',
  'AC-01 b 02':
    'Access control procedures [Assignment: organization-defined frequency].',
  'AC-02': 'ACCOUNT MANAGEMENT',
  'AC-02 a':
    'Identifies and selects the following types of information system accounts to support organizational missions/business functions: [Assignment: organization-defined information system account types];',
  'AC-02 b': 'Assigns account managers for information system accounts;',
  'AC-02 c': 'Establishes conditions for group and role membership;',
  'AC-02 d':
    'Specifies authorized users of the information system, group and role membership, and access authorizations (i.e., privileges) and other attributes (as required) for each account;',
  'AC-02 e':
    'Requires approvals by [Assignment: organization-defined personnel or roles] for requests to create information system accounts;',
  'AC-02 f':
    'Creates, enables, modifies, disables, and removes information system accounts in accordance with [Assignment: organization-defined procedures or conditions];',
  'AC-02 g': 'Monitors the use of information system accounts;',
  'AC-02 h': 'Notifies account managers:',
  'AC-02 h 01': 'When accounts are no longer required;',
  'AC-02 h 02': 'When users are terminated or transferred; and',
  'AC-02 h 03':
    'When individual information system usage or need-to-know changes;',
  'AC-02 i': 'Authorizes access to the information system based on:',
  'AC-02 i 01': 'A valid access authorization;',
  'AC-02 i 02': 'Intended system usage; and',
  'AC-02 i 03':
    'Other attributes as required by the organization or associated missions/business functions;',
  'AC-02 j':
    'Reviews accounts for compliance with account management requirements [Assignment: organization-defined frequency]; and',
  'AC-02 k':
    'Establishes a process for reissuing shared/group account credentials (if deployed) when individuals are removed from the group.',
  'AC-02 01':
    'The organization employs automated mechanisms to support the management of information system accounts.',
  'AC-02 02':
    'The information system automatically [Selection: removes; disables] temporary and emergency accounts after [Assignment: organization-defined time period for each type of account].',
  'AC-02 03':
    'The information system automatically disables inactive accounts after [Assignment: organization-defined time period].',
  'AC-02 04':
    'The information system automatically audits account creation, modification, enabling, disabling, and removal actions, and notifies [Assignment: organization-defined personnel or roles].',
  'AC-02 05':
    'The organization requires that users log out when [Assignment: organization-defined time-period of expected inactivity or description of when to log out].',
  'AC-02 06':
    'The information system implements the following dynamic privilege management capabilities: [Assignment: organization-defined list of dynamic privilege management capabilities].',
  'AC-02 07': 'ROLE-BASED SCHEMES',
  'AC-02 07 a':
    'Establishes and administers privileged user accounts in accordance with a role-based access scheme that organizes allowed information system access and privileges into roles;',
  'AC-02 07 b': 'Monitors privileged role assignments; and',
  'AC-02 07 c':
    'Takes [Assignment: organization-defined actions] when privileged role assignments are no longer appropriate.',
  'AC-02 08':
    'The information system creates [Assignment: organization-defined information system accounts] dynamically.',
  'AC-02 09':
    'The organization only permits the use of shared/group accounts that meet [Assignment: organization-defined conditions for establishing shared/group accounts].',
  'AC-02 10':
    'The information system terminates shared/group account credentials when members leave the group.',
  'AC-02 11':
    'The information system enforces [Assignment: organization-defined circumstances and/or usage conditions] for [Assignment: organization-defined information system accounts].',
  'AC-02 12': 'ACCOUNT MONITORING / ATYPICAL USAGE',
  'AC-02 12 a':
    'Monitors information system accounts for [Assignment: organization-defined atypical usage]; and',
  'AC-02 12 b':
    'Reports atypical usage of information system accounts to [Assignment: organization-defined personnel or roles].',
  'AC-02 13':
    'The organization disables accounts of users posing a significant risk within [Assignment: organization-defined time period] of discovery of the risk.',
  'AC-03':
    'The information system enforces approved authorizations for logical access to information           and system resources in accordance with applicable access control policies.',
  'AC-03 01': '[Withdrawn: Incorporated into AC-6].',
  'AC-03 02':
    'The information system enforces dual authorization for [Assignment: organization-defined privileged commands and/or other organization-defined actions].',
  'AC-03 03':
    'The information system enforces [Assignment: organization-defined mandatory access control policy] over all subjects and objects where the policy:',
  'AC-03 03 a':
    'Is uniformly enforced across all subjects and objects within the boundary of the information system;',
  'AC-03 03 b':
    'Specifies that a subject that has been granted access to information is constrained from doing any of the following;',
  'AC-03 03 b 01':
    'Passing the information to unauthorized subjects or objects;',
  'AC-03 03 b 02': 'Granting its privileges to other subjects;',
  'AC-03 03 b 03':
    'Changing one or more security attributes on subjects, objects, the information system, or information system components;',
  'AC-03 03 b 04':
    'Choosing the security attributes and attribute values to be associated with newly created or modified objects; or',
  'AC-03 03 b 05': 'Changing the rules governing access control; and',
  'AC-03 03 c':
    'Specifies that [Assignment: organization-defined subjects] may explicitly be granted [Assignment: organization-defined privileges (i.e., they are trusted subjects)] such that they are not limited by some or all of the above constraints.',
  'AC-03 04':
    'The information system enforces [Assignment: organization-defined discretionary access control policy] over defined subjects and objects where the policy specifies that a subject that has been granted access to information can do one or more of the following:',
  'AC-03 04 a': 'Pass the  information to any other subjects or objects;',
  'AC-03 04 b': 'Grant its privileges to other subjects;',
  'AC-03 04 c':
    "Change security attributes on subjects, objects, the information system, or the information system's components;",
  'AC-03 04 d':
    'Choose the security attributes to be associated with newly created or revised objects; or',
  'AC-03 04 e': 'Change the rules governing access control.',
  'AC-03 05':
    'The information system prevents access to [Assignment: organization-defined security-relevant information] except during secure, non-operable system states.',
  'AC-03 06': '[Withdrawn: Incorporated into MP-4 and SC-28].',
  'AC-03 07':
    'The information system enforces a role-based access control policy over defined subjects and objects and controls access based upon [Assignment: organization-defined roles and users authorized to assume such roles].',
  'AC-03 08':
    'The information system enforces the revocation of access authorizations resulting from changes to the security attributes of subjects and objects based on [Assignment: organization-defined rules governing the timing of revocations of access authorizations].',
  'AC-03 09':
    'The information system does not release information outside of the established system boundary unless:',
  'AC-03 09 a':
    'The receiving [Assignment: organization-defined information system or system component] provides [Assignment: organization-defined security safeguards]; and',
  'AC-03 09 b':
    '[Assignment: organization-defined security safeguards] are used to validate the appropriateness of the information designated for release.',
  'AC-03 10':
    'The organization employs an audited override of automated access control mechanisms under [Assignment: organization-defined conditions].',
  'AC-04':
    'The information system enforces approved authorizations for controlling the flow of information within the system and between interconnected systems based on [Assignment: organization-defined information flow control policies].',
  'AC-04 01':
    'The information system uses [Assignment: organization-defined security attributes] associated with [Assignment: organization-defined information, source, and destination objects] to enforce [Assignment: organization-defined information flow control policies] as a basis for flow control decisions.',
  'AC-04 02':
    'The information system uses protected processing domains to enforce [Assignment: organization-defined information flow control policies] as a basis for flow control decisions.',
  'AC-04 03':
    'The information system enforces dynamic information flow control based on [Assignment: organization-defined policies].',
  'AC-04 04':
    'The information system prevents encrypted information from bypassing content-checking mechanisms by [Selection (one or more): decrypting the information; blocking the flow of the encrypted information; terminating communications sessions attempting to pass encrypted information; [Assignment: organization-defined procedure or method]].',
  'AC-04 05':
    'The information system enforces [Assignment: organization-defined limitations] on embedding data types within other data types.',
  'AC-04 06':
    'The information system enforces information flow control based on [Assignment: organization-defined metadata].',
  'AC-04 07':
    'The information system enforces [Assignment: organization-defined one-way information flows] using hardware mechanisms.',
  'AC-04 08':
    'The information system enforces information flow control using [Assignment: organization-defined security policy filters] as a basis for flow control decisions for [Assignment: organization-defined information flows].',
  'AC-04 09':
    'The information system enforces the use of human reviews for [Assignment: organization-defined information flows] under the following conditions: [Assignment: organization-defined conditions].',
  'AC-04 10':
    'The information system provides the capability for privileged administrators to enable/disable [Assignment: organization-defined security policy filters] under the following conditions: [Assignment: organization-defined conditions].',
  'AC-04 11':
    'The information system provides the capability for privileged administrators to configure [Assignment: organization-defined security policy filters] to support different security policies.',
  'AC-04 12':
    'The information system, when transferring information between different security domains, uses [Assignment: organization-defined data type identifiers] to validate data essential for information flow decisions.',
  'AC-04 13':
    'The information system, when transferring information between different security domains, decomposes information into [Assignment: organization-defined policy-relevant subcomponents] for submission to policy enforcement mechanisms.',
  'AC-04 14':
    'The information system, when transferring information between different security domains, implements [Assignment: organization-defined security policy filters] requiring fully enumerated formats that restrict data structure and content.',
  'AC-04 15':
    'The information system, when transferring information between different security domains, examines the information for the presence of [Assignment: organized-defined unsanctioned information] and prohibits the transfer of such information in accordance with the [Assignment: organization-defined security policy].',
  'AC-04 16': '[Withdrawn: Incorporated into AC-4].',
  'AC-04 17':
    'The information system uniquely identifies and authenticates source and destination points by [Selection (one or more): organization, system, application, individual] for information transfer.',
  'AC-04 18':
    'The information system binds security attributes to information using [Assignment: organization-defined binding techniques] to facilitate information flow policy enforcement.',
  'AC-04 19':
    'The information system, when transferring information between different security domains, applies the same security policy filtering to metadata as it applies to data payloads.',
  'AC-04 20':
    'The organization employs [Assignment: organization-defined solutions in approved configurations] to control the flow of [Assignment: organization-defined information] across security domains.',
  'AC-04 21':
    'The information system separates information flows logically or physically using [Assignment: organization-defined mechanisms and/or techniques] to accomplish [Assignment: organization-defined required separations by types of information].',
  'AC-04 22':
    'The information system provides access from a single device to computing platforms, applications, or data residing on multiple different security domains, while preventing any information flow between the different security domains.',
  'AC-05': 'SEPARATION OF DUTIES',
  'AC-05 a':
    'Separates [Assignment: organization-defined duties of individuals];',
  'AC-05 b': 'Documents separation of duties of individuals; and',
  'AC-05 c':
    'Defines information system access authorizations to support separation of duties.',
  'AC-06':
    'The organization employs the principle of least privilege, allowing only authorized accesses for users (or processes acting on behalf of users) which are necessary to accomplish assigned tasks in accordance with organizational missions and business functions.',
  'AC-06 01':
    'The organization explicitly authorizes access to [Assignment: organization-defined security functions (deployed in hardware, software, and firmware) and security-relevant information].',
  'AC-06 02':
    'The organization requires that users of information system accounts, or roles, with access to [Assignment: organization-defined security functions or security-relevant information], use non-privileged accounts or roles, when accessing nonsecurity functions.',
  'AC-06 03':
    'The organization authorizes network access to [Assignment: organization-defined privileged commands] only for [Assignment: organization-defined compelling operational needs] and documents the rationale for such access in the security plan for the information system.',
  'AC-06 04':
    'The information system provides separate processing domains to enable finer-grained allocation of user privileges.',
  'AC-06 05':
    'The organization restricts privileged accounts on the information system to [Assignment: organization-defined personnel or roles].',
  'AC-06 06':
    'The organization prohibits privileged access to the information system by non-organizational users.',
  'AC-06 07': 'REVIEW OF USER PRIVILEGES',
  'AC-06 07 a':
    'Reviews [Assignment: organization-defined frequency] the privileges assigned to [Assignment: organization-defined roles or classes of users] to validate the need for such privileges; and',
  'AC-06 07 b':
    'Reassigns or removes privileges, if necessary, to correctly reflect organizational mission/business needs.',
  'AC-06 08':
    'The information system prevents [Assignment: organization-defined software] from executing at higher privilege levels than users executing the software.',
  'AC-06 09':
    'The information system audits the execution of privileged functions.',
  'AC-06 10':
    'The information system prevents non-privileged users from executing privileged functions to include disabling, circumventing, or altering implemented security safeguards/countermeasures.',
  'AC-07': 'The information system:',
  'AC-07 a':
    'Enforces a limit of [Assignment: organization-defined number] consecutive invalid logon attempts by a user during a [Assignment: organization-defined time period]; and',
  'AC-07 b':
    'Automatically [Selection: locks the account/node for an [Assignment: organization-defined time period]; locks the account/node until released by an administrator; delays next logon prompt according to [Assignment: organization-defined delay algorithm]] when the maximum number of unsuccessful attempts is exceeded.',
  'AC-07 01': '[Withdrawn: Incorporated into AC-7].',
  'AC-07 02':
    'The information system purges/wipes information from [Assignment: organization-defined mobile devices] based on [Assignment: organization-defined purging/wiping requirements/techniques] after [Assignment: organization-defined number] consecutive, unsuccessful device logon attempts.',
  'AC-08': 'The information system:',
  'AC-08 a':
    'Displays to users [Assignment: organization-defined system use notification message or banner] before granting access to the system that provides privacy and security notices consistent with applicable federal laws, Executive Orders, directives, policies, regulations, standards, and guidance and states that:',
  'AC-08 a 01': 'Users are accessing a U.S. Government information system;',
  'AC-08 a 02':
    'Information system usage may be monitored, recorded, and subject to audit;',
  'AC-08 a 03':
    'Unauthorized use of the information system is prohibited and subject to criminal and civil penalties; and',
  'AC-08 a 04':
    'Use of the information system indicates consent to monitoring and recording;',
  'AC-08 b':
    'Retains the notification message or banner on the screen until users acknowledge the usage conditions and take explicit actions to log on to or further access the information system; and',
  'AC-08 c': 'For publicly accessible systems:',
  'AC-08 c 01':
    'Displays system use information [Assignment: organization-defined conditions], before granting further access;',
  'AC-08 c 02':
    'Displays references, if any, to monitoring, recording, or auditing that are consistent with privacy accommodations for such systems that generally prohibit those activities; and',
  'AC-08 c 03': 'Includes a description of the authorized uses of the system.',
  'AC-09':
    'The information system notifies the user, upon successful logon (access) to the system, of the date and time of the last logon (access).',
  'AC-09 01':
    'The information system notifies the user, upon successful logon/access, of the number of unsuccessful logon/access attempts since the last successful logon/access.',
  'AC-09 02':
    'The information system notifies the user of the number of [Selection: successful logons/accesses; unsuccessful logon/access attempts; both] during [Assignment: organization-defined time period].',
  'AC-09 03':
    "The information system notifies the user of changes to [Assignment: organization-defined security-related characteristics/parameters of the user's account] during [Assignment: organization-defined time period].",
  'AC-09 04':
    'The information system notifies the user, upon successful logon (access), of the following additional information: [Assignment: organization-defined information to be included in addition to the date and time of the last logon (access)].',
  'AC-10':
    'The information system limits the number of concurrent sessions for each [Assignment: organization-defined account and/or account type] to [Assignment: organization-defined number].',
  'AC-11': 'The information system:',
  'AC-11 a':
    'Prevents further access to the system by initiating a session lock after [Assignment: organization-defined time period] of inactivity or upon receiving a request from a user; and',
  'AC-11 b':
    'Retains the session lock until the user reestablishes access using established identification and authentication procedures.',
  'AC-11 01':
    'The information system conceals, via the session lock, information previously visible on the display with a publicly viewable image.',
  'AC-12':
    'The information system automatically terminates a user session after [Assignment: organization-defined conditions or trigger events requiring session disconnect].',
  'AC-12 01': 'The information system:',
  'AC-12 01 a':
    'Provides a logout capability for user-initiated communications sessions whenever authentication is used to gain access to [Assignment: organization-defined information resources]; and',
  'AC-12 01 b':
    'Displays an explicit logout message to users indicating the reliable termination of authenticated communications sessions.',
  'AC-13': '[Withdrawn: Incorporated into AC-2 and AU-6].',
  'AC-14': 'PERMITTED ACTIONS WITHOUT IDENTIFICATION OR AUTHENTICATION',
  'AC-14 a':
    'Identifies [Assignment: organization-defined user actions] that can be performed on the information system without identification or authentication consistent with organizational missions/business functions; and',
  'AC-14 b':
    'Documents and provides supporting rationale in the security plan for the information system, user actions not requiring identification or authentication.',
  'AC-14 01': '[Withdrawn: Incorporated into AC-14].',
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
  'AC-16 01':
    'The information system dynamically associates security attributes with [Assignment: organization-defined subjects and objects] in accordance with [Assignment: organization-defined security policies] as information is created and combined.',
  'AC-16 02':
    'The information system provides authorized individuals (or processes acting on behalf of individuals) the capability to define or change the value of associated security attributes.',
  'AC-16 03':
    'The information system maintains the association and integrity of [Assignment: organization-defined security attributes] to [Assignment: organization-defined subjects and objects].',
  'AC-16 04':
    'The information system supports the association of [Assignment: organization-defined security attributes] with [Assignment: organization-defined subjects and objects] by authorized individuals (or processes acting on behalf of individuals).',
  'AC-16 05':
    'The information system displays security attributes in human-readable form on each object that the system transmits to output devices to identify [Assignment: organization-identified special dissemination, handling, or distribution instructions] using [Assignment: organization-identified human-readable, standard naming conventions].',
  'AC-16 06':
    'The organization allows personnel to associate, and maintain the association of [Assignment: organization-defined security attributes] with [Assignment: organization-defined subjects and objects] in accordance with [Assignment: organization-defined security policies].',
  'AC-16 07':
    'The organization provides a consistent interpretation of security attributes transmitted between distributed information system components.',
  'AC-16 08':
    'The information system implements [Assignment: organization-defined techniques or technologies] with [Assignment: organization-defined level of assurance] in associating security attributes to information.',
  'AC-16 09':
    'The organization ensures that security attributes associated with information are reassigned only via re-grading mechanisms validated using [Assignment: organization-defined techniques or procedures].',
  'AC-16 10':
    'The information system provides authorized individuals the capability to define or change the type and value of security attributes available for association with subjects and objects.',
  'AC-17': 'REMOTE ACCESS',
  'AC-17 a':
    'Establishes and documents usage restrictions, configuration/connection requirements, and implementation guidance for each type of remote access allowed; and',
  'AC-17 b':
    'Authorizes remote access to the information system prior to allowing such connections.',
  'AC-17 01':
    'The information system monitors and controls remote access methods.',
  'AC-17 02':
    'The information system implements cryptographic mechanisms to protect the confidentiality and integrity of remote access sessions.',
  'AC-17 03':
    'The information system routes all remote accesses through [Assignment: organization-defined number] managed network access control points.',
  'AC-17 04': 'PRIVILEGED COMMANDS / ACCESS',
  'AC-17 04 a':
    'Authorizes the execution of privileged commands and access to security-relevant information via remote access only for [Assignment: organization-defined needs]; and',
  'AC-17 04 b':
    'Documents the rationale for such access in the security plan for the information system.',
  'AC-17 05': '[Withdrawn: Incorporated into SI-4].',
  'AC-17 06':
    'The organization ensures that users protect information about remote access mechanisms from unauthorized use and disclosure.',
  'AC-17 07': '[Withdrawn: Incorporated into AC-3 (10)].',
  'AC-17 08': '[Withdrawn: Incorporated into CM-7].',
  'AC-17 09':
    'The organization provides the capability to expeditiously disconnect or disable remote access to the information system within [Assignment: organization-defined time period].',
  'AC-18': 'WIRELESS ACCESS',
  'AC-18 a':
    'Establishes usage restrictions, configuration/connection requirements, and implementation guidance for wireless access; and',
  'AC-18 b':
    'Authorizes wireless access to the information system prior to allowing such connections.',
  'AC-18 01':
    'The information system protects wireless access to the system using authentication of [Selection (one or more): users; devices] and encryption.',
  'AC-18 02': '[Withdrawn: Incorporated into SI-4].',
  'AC-18 03':
    'The organization disables, when not intended for use, wireless networking capabilities internally embedded within information system components prior to issuance and deployment.',
  'AC-18 04':
    'The organization identifies and explicitly authorizes users allowed to independently configure wireless networking capabilities.',
  'AC-18 05':
    'The organization selects radio antennas and calibrates transmission power levels to reduce the probability that usable signals can be received outside of organization-controlled boundaries.',
  'AC-19': 'ACCESS CONTROL FOR MOBILE DEVICES',
  'AC-19 a':
    'Establishes usage restrictions, configuration requirements, connection requirements, and implementation guidance for organization-controlled mobile devices; and',
  'AC-19 b':
    'Authorizes the connection of mobile devices to organizational information systems.',
  'AC-19 01': '[Withdrawn: Incorporated into MP-7].',
  'AC-19 02': '[Withdrawn: Incorporated into MP-7].',
  'AC-19 03': '[Withdrawn: Incorporated into MP-7].',
  'AC-19 04': 'RESTRICTIONS FOR CLASSIFIED INFORMATION',
  'AC-19 04 a':
    'Prohibits the use of unclassified mobile devices in facilities containing information systems processing, storing, or transmitting classified information unless specifically permitted by the authorizing official; and',
  'AC-19 04 b':
    'Enforces the following restrictions on individuals permitted by the authorizing official to use unclassified mobile devices in facilities containing information systems processing, storing, or transmitting classified information:',
  'AC-19 04 b 01':
    'Connection of unclassified mobile devices to classified information systems is prohibited;',
  'AC-19 04 b 02':
    'Connection of unclassified mobile devices to unclassified information systems requires approval from the authorizing official;',
  'AC-19 04 b 03':
    'Use of internal or external modems or wireless interfaces within the unclassified mobile devices is prohibited; and',
  'AC-19 04 b 04':
    'Unclassified mobile devices and the information stored on those devices are subject to random reviews and inspections by [Assignment: organization-defined security officials], and if classified information is found, the incident handling policy is followed.',
  'AC-19 04 c':
    'Restricts the connection of classified mobile devices to classified information systems in accordance with [Assignment: organization-defined security policies].',
  'AC-19 05':
    'The organization employs [Selection: full-device encryption; container encryption] to protect the confidentiality and integrity of information on [Assignment: organization-defined mobile devices].',
  'AC-20':
    'The organization establishes terms and conditions, consistent with any trust relationships established with other organizations owning, operating, and/or maintaining external information systems, allowing authorized individuals to:',
  'AC-20 a':
    'Access the information system from external information systems; and',
  'AC-20 b':
    'Process, store, or transmit organization-controlled information using external information systems.',
  'AC-20 01':
    'The organization permits authorized individuals to use an external information system to access the information system or to process, store, or transmit organization-controlled information only when the organization:',
  'AC-20 01 a':
    "Verifies the implementation of required security controls on the external system as specified in the organization's information security policy and security plan; or",
  'AC-20 01 b':
    'Retains approved information system connection or processing agreements with the organizational entity hosting the external information system.',
  'AC-20 02':
    'The organization [Selection: restricts; prohibits] the use of organization-controlled portable storage devices by authorized individuals on external information systems.',
  'AC-20 03':
    'The organization [Selection: restricts; prohibits] the use of non-organizationally owned information systems, system components, or devices to process, store, or transmit organizational information.',
  'AC-20 04':
    'The organization prohibits the use of [Assignment: organization-defined network accessible storage devices] in external information systems.',
  'AC-21': 'INFORMATION SHARING',
  'AC-21 a':
    'Facilitates information sharing by enabling authorized users to determine whether access authorizations assigned to the sharing partner match the access restrictions on the information for [Assignment: organization-defined information sharing circumstances where user discretion is required]; and',
  'AC-21 b':
    'Employs [Assignment: organization-defined automated mechanisms or manual processes] to assist users in making information sharing/collaboration decisions.',
  'AC-21 01':
    'The information system enforces information-sharing decisions by authorized users based on access authorizations of sharing partners and access restrictions on information to be shared.',
  'AC-21 02':
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
  'AC-24 01':
    'The information system transmits [Assignment: organization-defined access authorization information] using [Assignment: organization-defined security safeguards] to [Assignment: organization-defined information systems] that enforce access control decisions.',
  'AC-24 02':
    'The information system enforces access control decisions based on [Assignment: organization-defined security attributes] that do not include the identity of the user or process acting on behalf of the user.',
  'AC-25':
    'The information system implements a reference monitor for [Assignment: organization-defined access control policies] that is tamperproof, always invoked, and small enough to be subject to analysis and testing, the completeness of which can be assured.',
  'AT-01': 'SECURITY AWARENESS AND TRAINING POLICY AND PROCEDURES',
  'AT-01 a':
    'Develops, documents, and disseminates to [Assignment: organization-defined personnel or roles]:',
  'AT-01 a 01':
    'A security awareness and training policy that addresses purpose, scope, roles, responsibilities, management commitment, coordination among organizational entities, and compliance; and',
  'AT-01 a 02':
    'Procedures to facilitate the implementation of the security awareness and training policy and associated security awareness and training controls; and',
  'AT-01 b': 'Reviews and updates the current:',
  'AT-01 b 01':
    'Security awareness and training policy [Assignment: organization-defined frequency]; and',
  'AT-01 b 02':
    'Security awareness and training procedures [Assignment: organization-defined frequency].',
  'AT-02':
    'The organization provides basic security awareness training to information system users (including managers, senior executives, and contractors):',
  'AT-02 a': 'As part of initial training for new users;',
  'AT-02 b': 'When required by information system changes; and',
  'AT-02 c': '[Assignment: organization-defined frequency] thereafter.',
  'AT-02 01':
    'The organization includes practical exercises in security awareness training that simulate actual cyber attacks.',
  'AT-02 02':
    'The organization includes security awareness training on recognizing and reporting potential indicators of insider threat.',
  'AT-03':
    'The organization provides role-based security training to personnel with assigned security roles and responsibilities:',
  'AT-03 a':
    'Before authorizing access to the information system or performing assigned duties;',
  'AT-03 b': 'When required by information system changes; and',
  'AT-03 c': '[Assignment: organization-defined frequency] thereafter.',
  'AT-03 01':
    'The organization provides [Assignment: organization-defined personnel or roles] with initial and [Assignment: organization-defined frequency] training in the employment and operation of environmental controls.',
  'AT-03 02':
    'The organization provides [Assignment: organization-defined personnel or roles] with initial and [Assignment: organization-defined frequency] training in the employment and operation of physical security controls.',
  'AT-03 03':
    'The organization includes practical exercises in security training that reinforce training objectives.',
  'AT-03 04':
    'The organization provides training to its personnel on [Assignment: organization-defined indicators of malicious code] to recognize suspicious communications and anomalous behavior in organizational information systems.',
  'AT-04': 'SECURITY TRAINING RECORDS',
  'AT-04 a':
    'Documents and monitors individual information system security training activities including basic security awareness training and specific information system security training; and',
  'AT-04 b':
    'Retains individual training records for [Assignment: organization-defined time period].',
  'AT-05': '[Withdrawn: Incorporated into PM-15].',
  'AU-01': 'AUDIT AND ACCOUNTABILITY POLICY AND PROCEDURES',
  'AU-01 a':
    'Develops, documents, and disseminates to [Assignment: organization-defined personnel or roles]:',
  'AU-01 a 01':
    'An audit and accountability policy that addresses purpose, scope, roles, responsibilities, management commitment, coordination among organizational entities, and compliance; and',
  'AU-01 a 02':
    'Procedures to facilitate the implementation of the audit and accountability policy and associated audit and accountability controls; and',
  'AU-01 b': 'Reviews and updates the current:',
  'AU-01 b 01':
    'Audit and accountability policy [Assignment: organization-defined frequency]; and',
  'AU-01 b 02':
    'Audit and accountability procedures [Assignment: organization-defined frequency].',
  'AU-02': 'AUDIT EVENTS',
  'AU-02 a':
    'Determines that the information system is capable of auditing the following events: [Assignment: organization-defined auditable events];',
  'AU-02 b':
    'Coordinates the security audit function with other organizational entities requiring audit-related information to enhance mutual support and to help guide the selection of auditable events;',
  'AU-02 c':
    'Provides a rationale for why the auditable events are deemed to be adequate to support after-the-fact investigations of security incidents; and',
  'AU-02 d':
    'Determines that the following events are to be audited within the information system: [Assignment: organization-defined audited events (the subset of the auditable events defined in AU-2 a.) along with the frequency of (or situation requiring) auditing for each identified event].',
  'AU-02 01': '[Withdrawn: Incorporated into AU-12].',
  'AU-02 02': '[Withdrawn: Incorporated into AU-12].',
  'AU-02 03':
    'The organization reviews and updates the audited events [Assignment: organization-defined frequency].',
  'AU-02 04': '[Withdrawn: Incorporated into AC-6 (9)].',
  'AU-03':
    'The information system generates audit records containing information that establishes what type of event occurred, when the event occurred, where the event occurred, the source of the event, the outcome of the event, and the identity of any individuals or subjects associated with the event.',
  'AU-03 01':
    'The information system generates audit records containing the following additional information: [Assignment: organization-defined additional, more detailed information].',
  'AU-03 02':
    'The information system provides centralized management and configuration of the content to be captured in audit records generated by [Assignment: organization-defined information system components].',
  'AU-04':
    'The organization allocates audit record storage capacity in accordance with [Assignment: organization-defined audit record storage requirements].',
  'AU-04 01':
    'The information system off-loads audit records [Assignment: organization-defined frequency] onto a different system or media than the system being audited.',
  'AU-05': 'The information system:',
  'AU-05 a':
    'Alerts [Assignment: organization-defined personnel or roles] in the event of an audit processing failure; and',
  'AU-05 b':
    'Takes the following additional actions: [Assignment: organization-defined actions to be taken (e.g., shut down information system, overwrite oldest audit records, stop generating audit records)].',
  'AU-05 01':
    'The information system provides a warning to [Assignment: organization-defined personnel, roles, and/or locations] within [Assignment: organization-defined time period] when allocated audit record storage volume reaches [Assignment: organization-defined percentage] of repository maximum audit record storage capacity.',
  'AU-05 02':
    'The information system provides an alert in [Assignment: organization-defined real-time period] to [Assignment: organization-defined personnel, roles, and/or locations] when the following audit failure events occur: [Assignment: organization-defined audit failure events requiring real-time alerts].',
  'AU-05 03':
    'The information system enforces configurable network communications traffic volume thresholds reflecting limits on auditing capacity and [Selection: rejects; delays] network traffic above those thresholds.',
  'AU-05 04':
    'The information system invokes a [Selection: full system shutdown; partial system shutdown; degraded operational mode with limited mission/business functionality available] in the event of [Assignment: organization-defined audit failures], unless an alternate audit capability exists.',
  'AU-06': 'AUDIT REVIEW, ANALYSIS, AND REPORTING',
  'AU-06 a':
    'Reviews and analyzes information system audit records [Assignment: organization-defined frequency] for indications of [Assignment: organization-defined inappropriate or unusual activity]; and',
  'AU-06 b':
    'Reports findings to [Assignment: organization-defined personnel or roles].',
  'AU-06 01':
    'The organization employs automated mechanisms to integrate audit review, analysis, and reporting processes to support organizational processes for investigation and response to suspicious activities.',
  'AU-06 02': '[Withdrawn: Incorporated into SI-4].',
  'AU-06 03':
    'The organization analyzes and correlates audit records across different repositories to gain organization-wide situational awareness.',
  'AU-06 04':
    'The information system provides the capability to centrally review and analyze audit records from multiple components within the system.',
  'AU-06 05':
    'The organization integrates analysis of audit records with analysis of [Selection (one or more): vulnerability scanning information; performance data; information system monitoring information; [Assignment: organization-defined data/information collected from other sources]] to further enhance the ability to identify inappropriate or unusual activity.',
  'AU-06 06':
    'The organization correlates information from audit records with information obtained from monitoring physical access to further enhance the ability to identify suspicious, inappropriate, unusual, or malevolent activity.',
  'AU-06 07':
    'The organization specifies the permitted actions for each [Selection (one or more): information system process; role; user] associated with the review, analysis, and reporting of audit information.',
  'AU-06 08':
    'The organization performs a full text analysis of audited privileged commands in a physically distinct component or subsystem of the information system, or other information system that is dedicated to that analysis.',
  'AU-06 09':
    'The organization correlates information from nontechnical sources with audit information to enhance organization-wide situational awareness.',
  'AU-06 10':
    'The organization adjusts the level of audit review, analysis, and reporting within the information system when there is a change in risk based on law enforcement information, intelligence information, or other credible sources of information.',
  'AU-07':
    'The information system provides an audit reduction and report generation capability that:',
  'AU-07 a':
    'Supports on-demand audit review, analysis, and reporting requirements and after-the-fact investigations of security incidents; and',
  'AU-07 b':
    'Does not alter the original content or time ordering of audit records.',
  'AU-07 01':
    'The information system provides the capability to process audit records for events of interest based on [Assignment: organization-defined audit fields within audit records].',
  'AU-07 02':
    'The information system provides the capability to sort and search audit records for events of interest based on the content of [Assignment: organization-defined audit fields within audit records].',
  'AU-08': 'The information system:',
  'AU-08 a':
    'Uses internal system clocks to generate time stamps for audit records; and',
  'AU-08 b':
    'Records time stamps for audit records that can be mapped to Coordinated Universal Time (UTC) or Greenwich Mean Time (GMT) and meets [Assignment: organization-defined granularity of time measurement].',
  'AU-08 01': 'The information system:',
  'AU-08 01 a':
    'Compares the internal information system clocks [Assignment: organization-defined frequency] with [Assignment: organization-defined authoritative time source]; and',
  'AU-08 01 b':
    'Synchronizes the internal system clocks to the authoritative time source when the time difference is greater than [Assignment: organization-defined time period].',
  'AU-08 02':
    'The information system identifies a secondary authoritative time source that is located in a different geographic region than the primary authoritative time source.',
  'AU-09':
    'The information system protects audit information and audit tools from unauthorized access, modification, and deletion.',
  'AU-09 01':
    'The information system writes audit trails to hardware-enforced, write-once media.',
  'AU-09 02':
    'The information system backs up audit records [Assignment: organization-defined frequency] onto a physically different system or system component than the system or component being audited.',
  'AU-09 03':
    'The information system implements cryptographic mechanisms to protect the integrity of audit information and audit tools.',
  'AU-09 04':
    'The organization authorizes access to management of audit functionality to only [Assignment: organization-defined subset of privileged users].',
  'AU-09 05':
    'The organization enforces dual authorization for [Selection (one or more): movement; deletion] of [Assignment: organization-defined audit information].',
  'AU-09 06':
    'The organization authorizes read-only access to audit information to [Assignment: organization-defined subset of privileged users].',
  'AU-10':
    'The information system protects against an individual (or process acting on behalf of an individual) falsely denying having performed [Assignment: organization-defined actions to be covered by non-repudiation].',
  'AU-10 01': 'The information system:',
  'AU-10 01 a':
    'Binds the identity of the information producer with the information to [Assignment: organization-defined strength of binding]; and',
  'AU-10 01 b':
    'Provides the means for authorized individuals to determine the identity of the producer of the information.',
  'AU-10 02': 'The information system:',
  'AU-10 02 a':
    'Validates the binding of the information producer identity to the information at [Assignment: organization-defined frequency]; and',
  'AU-10 02 b':
    'Performs [Assignment: organization-defined actions] in the event of a validation error.',
  'AU-10 03':
    'The information system maintains reviewer/releaser identity and credentials within the established chain of custody for all information reviewed or released.',
  'AU-10 04': 'The information system:',
  'AU-10 04 a':
    'Validates the binding of the information reviewer identity to the information at the transfer or release points prior to release/transfer between [Assignment: organization-defined security domains]; and',
  'AU-10 04 b':
    'Performs [Assignment: organization-defined actions] in the event of a validation error.',
  'AU-10 05': '[Withdrawn: Incorporated into SI-7].',
  'AU-11':
    'The organization retains audit records for [Assignment: organization-defined time period consistent with records retention policy] to provide support for after-the-fact investigations of security incidents and to meet regulatory and organizational information retention requirements.',
  'AU-11 01':
    'The organization employs [Assignment: organization-defined measures] to ensure that long-term audit records generated by the information system can be retrieved.',
  'AU-12': 'The information system:',
  'AU-12 a':
    'Provides audit record generation capability for the auditable events defined in AU-2 a. at [Assignment: organization-defined information system components];',
  'AU-12 b':
    'Allows [Assignment: organization-defined personnel or roles] to select which auditable events are to be audited by specific components of the information system; and',
  'AU-12 c':
    'Generates audit records for the events defined in AU-2 d. with the content defined in AU-3.',
  'AU-12 01':
    'The information system compiles audit records from [Assignment: organization-defined information system components] into a system-wide (logical or physical) audit trail that is time-correlated to within [Assignment: organization-defined level of tolerance for the relationship between time stamps of individual records in the audit trail].',
  'AU-12 02':
    'The information system produces a system-wide (logical or physical) audit trail composed of audit records in a standardized format.',
  'AU-12 03':
    'The information system provides the capability for [Assignment: organization-defined individuals or roles] to change the auditing to be performed on [Assignment: organization-defined information system components] based on [Assignment: organization-defined selectable event criteria] within [Assignment: organization-defined time thresholds].',
  'AU-13':
    'The organization monitors [Assignment: organization-defined open source information and/or information sites] [Assignment: organization-defined frequency] for evidence of unauthorized disclosure of organizational information.',
  'AU-13 01':
    'The organization employs automated mechanisms to determine if organizational information has been disclosed in an unauthorized manner.',
  'AU-13 02':
    'The organization reviews the open source information sites being monitored [Assignment: organization-defined frequency].',
  'AU-14':
    'The information system provides the capability for authorized users to select a user session to capture/record or view/hear.',
  'AU-14 01':
    'The information system initiates session audits at system start-up.',
  'AU-14 02':
    'The information system provides the capability for authorized users to capture/record and log content related to a user session.',
  'AU-14 03':
    'The information system provides the capability for authorized users to remotely view/hear all content related to an established user session in real time.',
  'AU-15':
    'The organization provides an alternate audit capability in the event of a failure in primary audit capability that provides [Assignment: organization-defined alternate audit functionality].',
  'AU-16':
    'The organization employs [Assignment: organization-defined methods] for coordinating [Assignment: organization-defined audit information] among external organizations when audit information is transmitted across organizational boundaries.',
  'AU-16 01':
    'The organization requires that the identity of individuals be preserved in cross-organizational audit trails.',
  'AU-16 02':
    'The organization provides cross-organizational audit information to [Assignment: organization-defined organizations] based on [Assignment: organization-defined cross-organizational sharing agreements].',
  'CA-01': 'SECURITY ASSESSMENT AND AUTHORIZATION POLICY AND PROCEDURES',
  'CA-01 a':
    'Develops, documents, and disseminates to [Assignment: organization-defined personnel or roles]:',
  'CA-01 a 01':
    'A security assessment and authorization policy that addresses purpose, scope, roles, responsibilities, management commitment, coordination among organizational entities, and compliance; and',
  'CA-01 a 02':
    'Procedures to facilitate the implementation of the security assessment and authorization policy and associated security assessment and authorization controls; and',
  'CA-01 b': 'Reviews and updates the current:',
  'CA-01 b 01':
    'Security assessment and authorization policy [Assignment: organization-defined frequency]; and',
  'CA-01 b 02':
    'Security assessment and authorization procedures [Assignment: organization-defined frequency].',
  'CA-02': 'SECURITY ASSESSMENTS',
  'CA-02 a':
    'Develops a security assessment plan that describes the scope of the assessment including:',
  'CA-02 a 01': 'Security controls and control enhancements under assessment;',
  'CA-02 a 02':
    'Assessment procedures to be used to determine security control effectiveness; and',
  'CA-02 a 03':
    'Assessment environment, assessment team, and assessment roles and responsibilities;',
  'CA-02 b':
    'Assesses the security controls in the information system and its environment of operation [Assignment: organization-defined frequency] to determine the extent to which the controls are implemented correctly, operating as intended, and producing the desired outcome with respect to meeting established security requirements;',
  'CA-02 c':
    'Produces a security assessment report that documents the results of the assessment; and',
  'CA-02 d':
    'Provides the results of the security control assessment to [Assignment: organization-defined individuals or roles].',
  'CA-02 01':
    'The organization employs assessors or assessment teams with [Assignment: organization-defined level of independence] to conduct security control assessments.',
  'CA-02 02':
    'The organization includes as part of security control assessments, [Assignment: organization-defined frequency], [Selection: announced; unannounced], [Selection (one or more): in-depth monitoring; vulnerability scanning; malicious user testing; insider threat assessment; performance/load testing; [Assignment: organization-defined other forms of security assessment]].',
  'CA-02 03':
    'The organization accepts the results of an assessment of [Assignment: organization-defined information system] performed by [Assignment: organization-defined external organization] when the assessment meets [Assignment: organization-defined requirements].',
  'CA-03': 'SYSTEM INTERCONNECTIONS',
  'CA-03 a':
    'Authorizes connections from the information system to other information systems through the use of Interconnection Security Agreements;',
  'CA-03 b':
    'Documents, for each interconnection, the interface characteristics, security requirements, and the nature of the information communicated; and',
  'CA-03 c':
    'Reviews and updates Interconnection Security Agreements [Assignment: organization-defined frequency].',
  'CA-03 01':
    'The organization prohibits the direct connection of an [Assignment: organization-defined unclassified, national security system] to an external network without the use of [Assignment: organization-defined boundary protection device].',
  'CA-03 02':
    'The organization prohibits the direct connection of a classified, national security system to an external network without the use of [Assignment: organization-defined boundary protection device].',
  'CA-03 03':
    'The organization prohibits the direct connection of an [Assignment: organization-defined unclassified, non-national security system] to an external network without the use of [Assignment; organization-defined boundary protection device].',
  'CA-03 04':
    'The organization prohibits the direct connection of an [Assignment: organization-defined information system] to a public network.',
  'CA-03 05':
    'The organization employs [Selection: allow-all, deny-by-exception; deny-all, permit-by-exception] policy for allowing [Assignment: organization-defined information systems] to connect to external information systems.',
  'CA-04': '[Withdrawn: Incorporated into CA-2].',
  'CA-05': 'PLAN OF ACTION AND MILESTONES',
  'CA-05 a':
    "Develops a plan of action and milestones for the information system to document the organization's planned remedial actions to correct weaknesses or deficiencies noted during the assessment of the security controls and to reduce or eliminate known vulnerabilities in the system; and",
  'CA-05 b':
    'Updates existing plan of action and milestones [Assignment: organization-defined frequency] based on the findings from security controls assessments, security impact analyses, and continuous monitoring activities.',
  'CA-05 01':
    'The organization employs automated mechanisms to help ensure that the plan of action and milestones for the information system is accurate, up to date, and readily available.',
  'CA-06': 'SECURITY AUTHORIZATION',
  'CA-06 a':
    'Assigns a senior-level executive or manager as the authorizing official for the information system;',
  'CA-06 b':
    'Ensures that the authorizing official authorizes the information system for processing before commencing operations; and',
  'CA-06 c':
    'Updates the security authorization [Assignment: organization-defined frequency].',
  'CA-07':
    'The organization develops a continuous monitoring strategy and implements a continuous monitoring program that includes:',
  'CA-07 a':
    'Establishment of [Assignment: organization-defined metrics] to be monitored;',
  'CA-07 b':
    'Establishment of [Assignment: organization-defined frequencies] for monitoring and [Assignment: organization-defined frequencies] for assessments supporting such monitoring;',
  'CA-07 c':
    'Ongoing security control assessments in accordance with the organizational continuous monitoring strategy;',
  'CA-07 d':
    'Ongoing security status monitoring of organization-defined metrics in accordance with the organizational continuous monitoring strategy;',
  'CA-07 e':
    'Correlation and analysis of security-related information generated by assessments and monitoring;',
  'CA-07 f':
    'Response actions to address results of the analysis of security-related information; and',
  'CA-07 g':
    'Reporting the security status of organization and the information system to [Assignment: organization-defined personnel or roles] [Assignment: organization-defined frequency].',
  'CA-07 01':
    'The organization employs assessors or assessment teams with [Assignment: organization-defined level of independence] to monitor the security controls in the information system on an ongoing basis.',
  'CA-07 02': '[Withdrawn: Incorporated into CA-2].',
  'CA-07 03':
    'The organization employs trend analyses to determine if security control implementations, the frequency of continuous monitoring activities, and/or the types of activities used in the continuous monitoring process need to be modified based on empirical data.',
  'CA-08':
    'The organization conducts penetration testing [Assignment: organization-defined frequency] on [Assignment: organization-defined information systems or system components].',
  'CA-08 01':
    'The organization employs an independent penetration agent or penetration team to perform penetration testing on the information system or system components.',
  'CA-08 02':
    'The organization employs [Assignment: organization-defined red team exercises] to simulate attempts by adversaries to compromise organizational information systems in accordance with [Assignment: organization-defined rules of engagement].',
  'CA-09': 'INTERNAL SYSTEM CONNECTIONS',
  'CA-09 a':
    'Authorizes internal connections of [Assignment: organization-defined information system components or classes of components] to the information system; and',
  'CA-09 b':
    'Documents, for each internal connection, the interface characteristics, security requirements, and the nature of the information communicated.',
  'CA-09 01':
    'The information system performs security compliance checks on constituent system components prior to the establishment of the internal connection.',
  'CM-01': 'CONFIGURATION MANAGEMENT POLICY AND PROCEDURES',
  'CM-01 a':
    'Develops, documents, and disseminates to [Assignment: organization-defined personnel or roles]:',
  'CM-01 a 01':
    'A configuration management policy that addresses purpose, scope, roles, responsibilities, management commitment, coordination among organizational entities, and compliance; and',
  'CM-01 a 02':
    'Procedures to facilitate the implementation of the configuration management policy and associated configuration management controls; and',
  'CM-01 b': 'Reviews and updates the current:',
  'CM-01 b 01':
    'Configuration management policy [Assignment: organization-defined frequency]; and',
  'CM-01 b 02':
    'Configuration management procedures [Assignment: organization-defined frequency].',
  'CM-02':
    'The organization develops, documents, and maintains under configuration control, a current baseline configuration of the information system.',
  'CM-02 01':
    'The organization reviews and updates the baseline configuration of the information system:',
  'CM-02 01 a': '[Assignment: organization-defined frequency];',
  'CM-02 01 b':
    'When required due to [Assignment organization-defined circumstances]; and',
  'CM-02 01 c':
    'As an integral part of information system component installations and upgrades.',
  'CM-02 02':
    'The organization employs automated mechanisms to maintain an up-to-date, complete, accurate, and readily available baseline configuration of the information system.',
  'CM-02 03':
    'The organization retains [Assignment: organization-defined previous versions of baseline configurations of the information system] to support rollback.',
  'CM-02 04': '[Withdrawn: Incorporated into CM-7].',
  'CM-02 05': '[Withdrawn: Incorporated into CM-7].',
  'CM-02 06':
    'The organization maintains a baseline configuration for information system development and test environments that is managed separately from the operational baseline configuration.',
  'CM-02 07': 'CONFIGURE SYSTEMS, COMPONENTS, OR DEVICES FOR HIGH-RISK AREAS',
  'CM-02 07 a':
    'Issues [Assignment: organization-defined information systems, system components, or devices] with [Assignment: organization-defined configurations] to individuals traveling to locations that the organization deems to be of significant risk; and',
  'CM-02 07 b':
    'Applies [Assignment: organization-defined security safeguards] to the devices when the individuals return.',
  'CM-03': 'CONFIGURATION CHANGE CONTROL',
  'CM-03 a':
    'Determines the types of changes to the information system that are configuration-controlled;',
  'CM-03 b':
    'Reviews proposed configuration-controlled changes to the information system and approves or disapproves such changes with explicit consideration for security impact analyses;',
  'CM-03 c':
    'Documents configuration change decisions associated with the information system;',
  'CM-03 d':
    'Implements approved configuration-controlled changes to the information system;',
  'CM-03 e':
    'Retains records of configuration-controlled changes to the information system for [Assignment: organization-defined time period];',
  'CM-03 f':
    'Audits and reviews activities associated with configuration-controlled changes to the information system; and',
  'CM-03 g':
    'Coordinates and provides oversight for configuration change control activities through [Assignment: organization-defined configuration change control element (e.g., committee, board)] that convenes [Selection (one or more): [Assignment: organization-defined frequency]; [Assignment: organization-defined configuration change conditions]].',
  'CM-03 01': 'The organization employs automated mechanisms to:',
  'CM-03 01 a': 'Document proposed changes to the information system;',
  'CM-03 01 b':
    'Notify [Assignment: organized-defined approval authorities] of proposed changes to the information system and request change approval;',
  'CM-03 01 c':
    'Highlight proposed changes to the information system that have not been approved or disapproved by [Assignment: organization-defined time period];',
  'CM-03 01 d':
    'Prohibit changes to the information system until designated approvals are received;',
  'CM-03 01 e': 'Document all changes to the information system; and',
  'CM-03 01 f':
    'Notify [Assignment: organization-defined personnel] when approved changes to the information system are completed.',
  'CM-03 02':
    'The organization tests, validates, and documents changes to the information system before implementing the changes on the operational system.',
  'CM-03 03':
    'The organization employs automated mechanisms to implement changes to the current information system baseline and deploys the updated baseline across the installed base.',
  'CM-03 04':
    'The organization requires an information security representative to be a member of the [Assignment: organization-defined configuration change control element].',
  'CM-03 05':
    'The information system implements [Assignment: organization-defined security responses] automatically if baseline configurations are changed in an unauthorized manner.',
  'CM-03 06':
    'The organization ensures that cryptographic mechanisms used to provide [Assignment: organization-defined security safeguards] are under configuration management.',
  'CM-04':
    'The organization analyzes changes to the information system to determine potential security impacts prior to change implementation.',
  'CM-04 01':
    'The organization analyzes changes to the information system in a separate test environment before implementation in an operational environment, looking for security impacts due to flaws, weaknesses, incompatibility, or intentional malice.',
  'CM-04 02':
    'The organization, after the information system is changed, checks the security functions to verify that the functions are implemented correctly, operating as intended, and producing the desired outcome with regard to meeting the security requirements for the system.',
  'CM-05':
    'The organization defines, documents, approves, and enforces physical and logical access restrictions associated with changes to the information system.',
  'CM-05 01':
    'The information system enforces access restrictions and supports auditing of the enforcement actions.',
  'CM-05 02':
    'The organization reviews information system changes [Assignment: organization-defined frequency] and [Assignment: organization-defined circumstances] to determine whether unauthorized changes have occurred.',
  'CM-05 03':
    'The information system prevents the installation of [Assignment: organization-defined software and firmware components] without verification that the component has been digitally signed using a certificate that is recognized and approved by the organization.',
  'CM-05 04':
    'The organization enforces dual authorization for implementing changes to [Assignment: organization-defined information system components and system-level information].',
  'CM-05 05': 'LIMIT PRODUCTION / OPERATIONAL PRIVILEGES',
  'CM-05 05 a':
    'Limits privileges to change information system components and system-related information within a production or operational environment; and',
  'CM-05 05 b':
    'Reviews and reevaluates privileges [Assignment: organization-defined frequency].',
  'CM-05 06':
    'The organization limits privileges to change software resident within software libraries.',
  'CM-05 07': '[Withdrawn: Incorporated into SI-7].',
  'CM-06': 'CONFIGURATION SETTINGS',
  'CM-06 a':
    'Establishes and documents configuration settings for information technology products employed within the information system using [Assignment: organization-defined security configuration checklists] that reflect the most restrictive mode consistent with operational requirements;',
  'CM-06 b': 'Implements the configuration settings;',
  'CM-06 c':
    'Identifies, documents, and approves any deviations from established configuration settings for [Assignment: organization-defined information system components] based on [Assignment: organization-defined operational requirements]; and',
  'CM-06 d':
    'Monitors and controls changes to the configuration settings in accordance with organizational policies and procedures.',
  'CM-06 01':
    'The organization employs automated mechanisms to centrally manage, apply, and verify configuration settings for [Assignment: organization-defined information system components].',
  'CM-06 02':
    'The organization employs [Assignment: organization-defined security safeguards] to respond to unauthorized changes to [Assignment: organization-defined configuration settings].',
  'CM-06 03': '[Withdrawn: Incorporated into SI-7].',
  'CM-06 04': '[Withdrawn: Incorporated into CM-4].',
  'CM-07': 'LEAST FUNCTIONALITY',
  'CM-07 a':
    'Configures the information system to provide only essential capabilities; and',
  'CM-07 b':
    'Prohibits or restricts the use of the following functions, ports, protocols, and/or services: [Assignment: organization-defined prohibited or restricted functions, ports, protocols, and/or services].',
  'CM-07 01': 'PERIODIC REVIEW',
  'CM-07 01 a':
    'Reviews the information system [Assignment: organization-defined frequency] to identify unnecessary and/or nonsecure functions, ports, protocols, and services; and',
  'CM-07 01 b':
    'Disables [Assignment: organization-defined functions, ports, protocols, and services within the information system deemed to be unnecessary and/or nonsecure].',
  'CM-07 02':
    'The information system prevents program execution in accordance with [Selection (one or more): [Assignment: organization-defined policies regarding software program usage and restrictions]; rules authorizing the terms and conditions of software program usage].',
  'CM-07 03':
    'The organization ensures compliance with [Assignment: organization-defined registration requirements for functions, ports, protocols, and services].',
  'CM-07 04': 'UNAUTHORIZED SOFTWARE / BLACKLISTING',
  'CM-07 04 a':
    'Identifies [Assignment: organization-defined software programs not authorized to execute on the information system];',
  'CM-07 04 b':
    'Employs an allow-all, deny-by-exception policy to prohibit the execution of unauthorized software programs on the information system; and',
  'CM-07 04 c':
    'Reviews and updates the list of unauthorized software programs [Assignment: organization-defined frequency].',
  'CM-07 05': 'AUTHORIZED SOFTWARE / WHITELISTING',
  'CM-07 05 a':
    'Identifies [Assignment: organization-defined software programs authorized to execute on the information system];',
  'CM-07 05 b':
    'Employs a deny-all, permit-by-exception policy to allow the execution of authorized software programs on the information system; and',
  'CM-07 05 c':
    'Reviews and updates the list of authorized software programs [Assignment: organization-defined frequency].',
  'CM-08': 'INFORMATION SYSTEM COMPONENT INVENTORY',
  'CM-08 a':
    'Develops and documents an inventory of information system components that:',
  'CM-08 a 01': 'Accurately reflects the current information system;',
  'CM-08 a 02':
    'Includes all components within the authorization boundary of the information system;',
  'CM-08 a 03':
    'Is at the level of granularity deemed necessary for tracking and reporting; and',
  'CM-08 a 04':
    'Includes [Assignment: organization-defined information deemed necessary to achieve effective information system component accountability]; and',
  'CM-08 b':
    'Reviews and updates the information system component inventory [Assignment: organization-defined frequency].',
  'CM-08 01':
    'The organization updates the inventory of information system components as an integral part of component installations, removals, and information system updates.',
  'CM-08 02':
    'The organization employs automated mechanisms to help maintain an up-to-date, complete, accurate, and readily available inventory of information system components.',
  'CM-08 03': 'AUTOMATED UNAUTHORIZED COMPONENT DETECTION',
  'CM-08 03 a':
    'Employs automated mechanisms [Assignment: organization-defined frequency] to detect the presence of unauthorized hardware, software, and firmware components within the information system; and',
  'CM-08 03 b':
    'Takes the following actions when unauthorized components are detected: [Selection (one or more): disables network access by such components; isolates the components; notifies [Assignment: organization-defined personnel or roles]].',
  'CM-08 04':
    'The organization includes in the information system component inventory information, a means for identifying by [Selection (one or more): name; position; role], individuals responsible/accountable for administering those components.',
  'CM-08 05':
    'The organization verifies that all components within the authorization boundary of the information system are not duplicated in other information system component inventories.',
  'CM-08 06':
    'The organization includes assessed component configurations and any approved deviations to current deployed configurations in the information system component inventory.',
  'CM-08 07':
    'The organization provides a centralized repository for the inventory of information system components.',
  'CM-08 08':
    'The organization employs automated mechanisms to support tracking of information system components by geographic location.',
  'CM-08 09': 'ASSIGNMENT OF COMPONENTS TO SYSTEMS',
  'CM-08 09 a':
    'Assigns [Assignment: organization-defined acquired information system components] to an information system; and',
  'CM-08 09 b':
    'Receives an acknowledgement from the information system owner of this assignment.',
  'CM-09':
    'The organization develops, documents, and implements a configuration management plan for the information system that:',
  'CM-09 a':
    'Addresses roles, responsibilities, and configuration management processes and procedures;',
  'CM-09 b':
    'Establishes a process for identifying configuration items throughout the system development life cycle and for managing the configuration of the configuration items;',
  'CM-09 c':
    'Defines the configuration items for the information system and places the configuration items under configuration management; and',
  'CM-09 d':
    'Protects the configuration management plan from unauthorized disclosure and modification.',
  'CM-09 01':
    'The organization assigns responsibility for developing the configuration management process to organizational personnel that are not directly involved in information system development.',
  'CM-10': 'SOFTWARE USAGE RESTRICTIONS',
  'CM-10 a':
    'Uses software and associated documentation in accordance with contract agreements and copyright laws;',
  'CM-10 b':
    'Tracks the use of software and associated documentation protected by quantity licenses to control copying and distribution; and',
  'CM-10 c':
    'Controls and documents the use of peer-to-peer file sharing technology to ensure that this capability is not used for the unauthorized distribution, display, performance, or reproduction of copyrighted work.',
  'CM-10 01':
    'The organization establishes the following restrictions on the use of open source software: [Assignment: organization-defined restrictions].',
  'CM-11': 'USER-INSTALLED SOFTWARE',
  'CM-11 a':
    'Establishes [Assignment: organization-defined policies] governing the installation of software by users;',
  'CM-11 b':
    'Enforces software installation policies through [Assignment: organization-defined methods]; and',
  'CM-11 c':
    'Monitors policy compliance at [Assignment: organization-defined frequency].',
  'CM-11 01':
    'The information system alerts [Assignment: organization-defined personnel or roles] when the unauthorized installation of software is detected.',
  'CM-11 02':
    'The information system prohibits user installation of software without explicit privileged status.',
  'CP-01': 'CONTINGENCY PLANNING POLICY AND PROCEDURES',
  'CP-01 a':
    'Develops, documents, and disseminates to [Assignment: organization-defined personnel or roles]:',
  'CP-01 a 01':
    'A contingency planning policy that addresses purpose, scope, roles, responsibilities, management commitment, coordination among organizational entities, and compliance; and',
  'CP-01 a 02':
    'Procedures to facilitate the implementation of the contingency planning policy and associated contingency planning controls; and',
  'CP-01 b': 'Reviews and updates the current:',
  'CP-01 b 01':
    'Contingency planning policy [Assignment: organization-defined frequency]; and',
  'CP-01 b 02':
    'Contingency planning procedures [Assignment: organization-defined frequency].',
  'CP-02': 'CONTINGENCY PLAN',
  'CP-02 a': 'Develops a contingency plan for the information system that:',
  'CP-02 a 01':
    'Identifies essential missions and business functions and associated contingency requirements;',
  'CP-02 a 02':
    'Provides recovery objectives, restoration priorities, and metrics;',
  'CP-02 a 03':
    'Addresses contingency roles, responsibilities, assigned individuals with contact information;',
  'CP-02 a 04':
    'Addresses maintaining essential missions and business functions despite an information system disruption, compromise, or failure;',
  'CP-02 a 05':
    'Addresses eventual, full information system restoration without deterioration of the security safeguards originally planned and implemented; and',
  'CP-02 a 06':
    'Is reviewed and approved by [Assignment: organization-defined personnel or roles];',
  'CP-02 b':
    'Distributes copies of the contingency plan to [Assignment: organization-defined key contingency personnel (identified by name and/or by role) and organizational elements];',
  'CP-02 c':
    'Coordinates contingency planning activities with incident handling activities;',
  'CP-02 d':
    'Reviews the contingency plan for the information system [Assignment: organization-defined frequency];',
  'CP-02 e':
    'Updates the contingency plan to address changes to the organization, information system, or environment of operation and problems encountered during contingency plan implementation, execution, or testing;',
  'CP-02 f':
    'Communicates contingency plan changes to [Assignment: organization-defined key contingency personnel (identified by name and/or by role) and organizational elements]; and',
  'CP-02 g':
    'Protects the contingency plan from unauthorized disclosure and modification.',
  'CP-02 01':
    'The organization coordinates contingency plan development with organizational elements responsible for related plans.',
  'CP-02 02':
    'The organization conducts capacity planning so that necessary capacity for information processing, telecommunications, and environmental support exists during contingency operations.',
  'CP-02 03':
    'The organization plans for the resumption of essential missions and business functions within [Assignment: organization-defined time period] of contingency plan activation.',
  'CP-02 04':
    'The organization plans for the resumption of all missions and business functions within [Assignment: organization-defined time period] of contingency plan activation.',
  'CP-02 05':
    'The organization plans for the continuance of essential missions and business functions with little or no loss of operational continuity and sustains that continuity until full information system restoration at primary processing and/or storage sites.',
  'CP-02 06':
    'The organization plans for the transfer of essential missions and business functions to alternate processing and/or storage sites with little or no loss of operational continuity and sustains that continuity through information system restoration to primary processing and/or storage sites.',
  'CP-02 07':
    'The organization coordinates its contingency plan with the contingency plans of external service providers to ensure that contingency requirements can be satisfied.',
  'CP-02 08':
    'The organization identifies critical information system assets supporting essential missions and business functions.',
  'CP-03':
    'The organization provides contingency training to information system users consistent with assigned roles and responsibilities:',
  'CP-03 a':
    'Within [Assignment: organization-defined time period] of assuming a contingency role or responsibility;',
  'CP-03 b': 'When required by information system changes; and',
  'CP-03 c': '[Assignment: organization-defined frequency] thereafter.',
  'CP-03 01':
    'The organization incorporates simulated events into contingency training to facilitate effective response by personnel in crisis situations.',
  'CP-03 02':
    'The organization employs automated mechanisms to provide a more thorough and realistic contingency training environment.',
  'CP-04': 'CONTINGENCY PLAN TESTING',
  'CP-04 a':
    'Tests the contingency plan for the information system [Assignment: organization-defined frequency] using [Assignment: organization-defined tests] to determine the effectiveness of the plan and the organizational readiness to execute the plan;',
  'CP-04 b': 'Reviews the contingency plan test results; and',
  'CP-04 c': 'Initiates corrective actions, if needed.',
  'CP-04 01':
    'The organization coordinates contingency plan testing with organizational elements responsible for related plans.',
  'CP-04 02':
    'The organization tests the contingency plan at the alternate processing site:',
  'CP-04 02 a':
    'To familiarize contingency personnel with the facility and available resources; and',
  'CP-04 02 b':
    'To evaluate the capabilities of the alternate processing site to support contingency operations.',
  'CP-04 03':
    'The organization employs automated mechanisms to more thoroughly and effectively test the contingency plan.',
  'CP-04 04':
    'The organization includes a full recovery and reconstitution of the information system to a known state as part of contingency plan testing.',
  'CP-05': '[Withdrawn: Incorporated into CP-2].',
  'CP-06': 'ALTERNATE STORAGE SITE',
  'CP-06 a':
    'Establishes an alternate storage site including necessary agreements to permit the storage and retrieval of information system backup information; and',
  'CP-06 b':
    'Ensures that the alternate storage site provides information security safeguards equivalent to that of the primary site.',
  'CP-06 01':
    'The organization identifies an alternate storage site that is separated from the primary storage site to reduce susceptibility to the same threats.',
  'CP-06 02':
    'The organization configures the alternate storage site to facilitate recovery operations in accordance with recovery time and recovery point objectives.',
  'CP-06 03':
    'The organization identifies potential accessibility problems to the alternate storage site in the event of an area-wide disruption or disaster and outlines explicit mitigation actions.',
  'CP-07': 'ALTERNATE PROCESSING SITE',
  'CP-07 a':
    'Establishes an alternate processing site including necessary agreements to permit the transfer and resumption of [Assignment: organization-defined information system operations] for essential missions/business functions within [Assignment: organization-defined time period consistent with recovery time and recovery point objectives] when the primary processing capabilities are unavailable;',
  'CP-07 b':
    'Ensures that equipment and supplies required to transfer and resume operations are available at the alternate processing site or contracts are in place to support delivery to the site within the organization-defined time period for transfer/resumption; and',
  'CP-07 c':
    'Ensures that the alternate processing site provides information security safeguards equivalent to those of the primary site.',
  'CP-07 01':
    'The organization identifies an alternate processing site that is separated from the primary processing site to reduce susceptibility to the same threats.',
  'CP-07 02':
    'The organization identifies potential accessibility problems to the alternate processing site in the event of an area-wide disruption or disaster and outlines explicit mitigation actions.',
  'CP-07 03':
    'The organization develops alternate processing site agreements that contain priority-of-service provisions in accordance with organizational availability requirements (including recovery time objectives).',
  'CP-07 04':
    'The organization prepares the alternate processing site so that the site is ready to be used as the operational site supporting essential missions and business functions.',
  'CP-07 05': '[Withdrawn: Incorporated into CP-7].',
  'CP-07 06':
    'The organization plans and prepares for circumstances that preclude returning to the primary processing site.',
  'CP-08':
    'The organization establishes alternate telecommunications services including necessary agreements to permit the resumption of [Assignment: organization-defined information system operations] for essential missions and business functions within [Assignment: organization-defined time period] when the primary telecommunications capabilities are unavailable at either the primary or alternate processing or storage sites.',
  'CP-08 01': 'PRIORITY OF SERVICE PROVISIONS',
  'CP-08 01 a':
    'Develops primary and alternate telecommunications service agreements that contain priority-of-service provisions in accordance with organizational availability requirements (including recovery time objectives); and',
  'CP-08 01 b':
    'Requests Telecommunications Service Priority for all telecommunications services used for national security emergency preparedness in the event that the primary and/or alternate telecommunications services are provided by a common carrier.',
  'CP-08 02':
    'The organization obtains alternate telecommunications services to reduce the likelihood of sharing a single point of failure with primary telecommunications services.',
  'CP-08 03':
    'The organization obtains alternate telecommunications services from providers that are separated from primary service providers to reduce susceptibility to the same threats.',
  'CP-08 04': 'PROVIDER CONTINGENCY PLAN',
  'CP-08 04 a':
    'Requires primary and alternate telecommunications service providers to have contingency plans;',
  'CP-08 04 b':
    'Reviews provider contingency plans to ensure that the plans meet organizational contingency requirements; and',
  'CP-08 04 c':
    'Obtains evidence of contingency testing/training by providers [Assignment: organization-defined frequency].',
  'CP-08 05':
    'The organization tests alternate telecommunication services [Assignment: organization-defined frequency].',
  'CP-09': 'INFORMATION SYSTEM BACKUP',
  'CP-09 a':
    'Conducts backups of user-level information contained in the information system [Assignment: organization-defined frequency consistent with recovery time and recovery point objectives];',
  'CP-09 b':
    'Conducts backups of system-level information contained in the information system [Assignment: organization-defined frequency consistent with recovery time and recovery point objectives];',
  'CP-09 c':
    'Conducts backups of information system documentation including security-related documentation [Assignment: organization-defined frequency consistent with recovery time and recovery point objectives]; and',
  'CP-09 d':
    'Protects the confidentiality, integrity, and availability of backup information at storage locations.',
  'CP-09 01':
    'The organization tests backup information [Assignment: organization-defined frequency] to verify media reliability and information integrity.',
  'CP-09 02':
    'The organization uses a sample of backup information in the restoration of selected information system functions as part of contingency plan testing.',
  'CP-09 03':
    'The organization stores backup copies of [Assignment: organization-defined critical information system software and other security-related information] in a separate facility or in a fire-rated container that is not collocated with the operational system.',
  'CP-09 04': '[Withdrawn: Incorporated into CP-9].',
  'CP-09 05':
    'The organization transfers information system backup information to the alternate storage site [Assignment: organization-defined time period and transfer rate consistent with the recovery time and recovery point objectives].',
  'CP-09 06':
    'The organization accomplishes information system backup by maintaining a redundant secondary system that is not collocated with the primary system and that can be activated without loss of information or disruption to operations.',
  'CP-09 07':
    'The organization enforces dual authorization for the deletion or destruction of [Assignment: organization-defined backup information].',
  'CP-10':
    'The organization provides for the recovery and reconstitution of the information system to a known state after a disruption, compromise, or failure.',
  'CP-10 01': '[Withdrawn: Incorporated into CP-4].',
  'CP-10 02':
    'The information system implements transaction recovery for systems that are transaction-based.',
  'CP-10 03': '[Withdrawn: Addressed through tailoring procedures].',
  'CP-10 04':
    'The organization provides the capability to restore information system components within [Assignment: organization-defined restoration time-periods] from configuration-controlled and integrity-protected information representing a known, operational state for the components.',
  'CP-10 05': '[Withdrawn: Incorporated into SI-13].',
  'CP-10 06':
    'The organization protects backup and restoration hardware, firmware, and software.',
  'CP-11':
    'The information system provides the capability to employ [Assignment: organization-defined alternative communications protocols] in support of maintaining continuity of operations.',
  'CP-12':
    'The information system, when [Assignment: organization-defined conditions] are detected, enters a safe mode of operation with [Assignment: organization-defined restrictions of safe mode of operation].',
  'CP-13':
    'The organization employs [Assignment: organization-defined alternative or supplemental security mechanisms] for satisfying [Assignment: organization-defined security functions] when the primary means of implementing the security function is unavailable or compromised.',
  'IA-01': 'IDENTIFICATION AND AUTHENTICATION POLICY AND PROCEDURES',
  'IA-01 a':
    'Develops, documents, and disseminates to [Assignment: organization-defined personnel or roles]:',
  'IA-01 a 01':
    'An identification and authentication policy that addresses purpose, scope, roles, responsibilities, management commitment, coordination among organizational entities, and compliance; and',
  'IA-01 a 02':
    'Procedures to facilitate the implementation of the identification and authentication policy and associated identification and authentication controls; and',
  'IA-01 b': 'Reviews and updates the current:',
  'IA-01 b 01':
    'Identification and authentication policy [Assignment: organization-defined frequency]; and',
  'IA-01 b 02':
    'Identification and authentication procedures [Assignment: organization-defined frequency].',
  'IA-02':
    'The information system uniquely identifies and authenticates organizational users (or processes acting on behalf of organizational users).',
  'IA-02 01':
    'The information system implements multifactor authentication for network access to privileged accounts.',
  'IA-02 02':
    'The information system implements multifactor authentication for network access to non-privileged accounts.',
  'IA-02 03':
    'The information system implements multifactor authentication for local access to privileged accounts.',
  'IA-02 04':
    'The information system implements multifactor authentication for local access to non-privileged accounts.',
  'IA-02 05':
    'The organization requires individuals to be authenticated with an individual authenticator when a group authenticator is employed.',
  'IA-02 06':
    'The information system implements multifactor authentication for network access to privileged accounts such that one of the factors is provided by a device separate from the system gaining access and the device meets [Assignment: organization-defined strength of mechanism requirements].',
  'IA-02 07':
    'The information system implements multifactor authentication for network access to non-privileged accounts such that one of the factors is provided by a device separate from the system gaining access and the device meets [Assignment: organization-defined strength of mechanism requirements].',
  'IA-02 08':
    'The information system implements replay-resistant authentication mechanisms for network access to privileged accounts.',
  'IA-02 09':
    'The information system implements replay-resistant authentication mechanisms for network access to non-privileged accounts.',
  'IA-02 10':
    'The information system provides a single sign-on capability for [Assignment: organization-defined information system accounts and services].',
  'IA-02 11':
    'The information system implements multifactor authentication for remote access to privileged and non-privileged accounts such that one of the factors is provided by a device separate from the system gaining access and the device meets [Assignment: organization-defined strength of mechanism requirements].',
  'IA-02 12':
    'The information system accepts and electronically verifies Personal Identity Verification (PIV) credentials.',
  'IA-02 13':
    'The information system implements [Assignment: organization-defined out-of-band authentication] under [Assignment: organization-defined conditions].',
  'IA-03':
    'The information system uniquely identifies and authenticates [Assignment: organization-defined specific and/or types of devices] before establishing a [Selection (one or more): local; remote; network] connection.',
  'IA-03 01':
    'The information system authenticates [Assignment: organization-defined specific devices and/or types of devices] before establishing [Selection (one or more): local; remote; network] connection using bidirectional authentication that is cryptographically based.',
  'IA-03 02': '[Withdrawn: Incorporated into IA-3 (1)].',
  'IA-03 03': 'DYNAMIC ADDRESS ALLOCATION',
  'IA-03 03 a':
    'Standardizes dynamic address allocation lease information and the lease duration assigned to devices in accordance with [Assignment: organization-defined lease information and lease duration]; and',
  'IA-03 03 b': 'Audits lease information when assigned to a device.',
  'IA-03 04':
    'The organization ensures that device identification and authentication based on attestation is handled by [Assignment: organization-defined configuration management process].',
  'IA-04': 'The organization manages information system identifiers by:',
  'IA-04 a':
    'Receiving authorization from [Assignment: organization-defined personnel or roles] to assign an individual, group, role, or device identifier;',
  'IA-04 b':
    'Selecting an identifier that identifies an individual, group, role, or device;',
  'IA-04 c':
    'Assigning the identifier to the intended individual, group, role, or device;',
  'IA-04 d':
    'Preventing reuse of identifiers for [Assignment: organization-defined time period]; and',
  'IA-04 e':
    'Disabling the identifier after [Assignment: organization-defined time period of inactivity].',
  'IA-04 01':
    'The organization prohibits the use of information system account identifiers that are the same as public identifiers for individual electronic mail accounts.',
  'IA-04 02':
    'The organization requires that the registration process to receive an individual identifier includes supervisor authorization.',
  'IA-04 03':
    'The organization requires multiple forms of certification of individual identification be presented to the registration authority.',
  'IA-04 04':
    'The organization manages individual identifiers by uniquely identifying each individual as [Assignment: organization-defined characteristic identifying individual status].',
  'IA-04 05': 'The information system dynamically manages identifiers.',
  'IA-04 06':
    'The organization coordinates with [Assignment: organization-defined external organizations] for cross-organization management of identifiers.',
  'IA-04 07':
    'The organization requires that the registration process to receive an individual identifier be conducted in person before a designated registration authority.',
  'IA-05': 'The organization manages information system authenticators by:',
  'IA-05 a':
    'Verifying, as part of the initial authenticator distribution, the identity of the individual, group, role, or device receiving the authenticator;',
  'IA-05 b':
    'Establishing initial authenticator content for authenticators defined by the organization;',
  'IA-05 c':
    'Ensuring that authenticators have sufficient strength of mechanism for their intended use;',
  'IA-05 d':
    'Establishing and implementing administrative procedures for initial authenticator distribution, for lost/compromised or damaged authenticators, and for revoking authenticators;',
  'IA-05 e':
    'Changing default content of authenticators prior to information system installation;',
  'IA-05 f':
    'Establishing minimum and maximum lifetime restrictions and reuse conditions for authenticators;',
  'IA-05 g':
    'Changing/refreshing authenticators [Assignment: organization-defined time period by authenticator type];',
  'IA-05 h':
    'Protecting authenticator content from unauthorized disclosure and modification;',
  'IA-05 i':
    'Requiring individuals to take, and having devices implement, specific security safeguards to protect authenticators; and',
  'IA-05 j':
    'Changing authenticators for group/role accounts when membership to those accounts changes.',
  'IA-05 01': 'The information system, for password-based authentication:',
  'IA-05 01 a':
    'Enforces minimum password complexity of [Assignment: organization-defined requirements for case sensitivity, number of characters, mix of upper-case letters, lower-case letters, numbers, and special characters, including minimum requirements for each type];',
  'IA-05 01 b':
    'Enforces at least the following number of changed characters when new passwords are created: [Assignment: organization-defined number];',
  'IA-05 01 c':
    'Stores and transmits only cryptographically-protected passwords;',
  'IA-05 01 d':
    'Enforces password minimum and maximum lifetime restrictions of [Assignment: organization-defined numbers for lifetime minimum, lifetime maximum];',
  'IA-05 01 e':
    'Prohibits password reuse for [Assignment: organization-defined number] generations; and',
  'IA-05 01 f':
    'Allows the use of a temporary password for system logons with an immediate change to a permanent password.',
  'IA-05 02': 'The information system, for PKI-based authentication:',
  'IA-05 02 a':
    'Validates certifications by constructing and verifying a certification path to an accepted trust anchor including checking certificate status information;',
  'IA-05 02 b': 'Enforces authorized access to the corresponding private key;',
  'IA-05 02 c':
    'Maps the authenticated identity to the account of the individual or group; and',
  'IA-05 02 d':
    'Implements a local cache of revocation data to support path discovery and validation in case of inability to access revocation information via the network.',
  'IA-05 03':
    'The organization requires that the registration process to receive [Assignment: organization-defined types of and/or specific authenticators] be conducted [Selection: in person; by a trusted third party] before [Assignment: organization-defined registration authority] with authorization by [Assignment: organization-defined personnel or roles].',
  'IA-05 04':
    'The organization employs automated tools to determine if password authenticators are sufficiently strong to satisfy [Assignment: organization-defined requirements].',
  'IA-05 05':
    'The organization requires developers/installers of information system components to provide unique authenticators or change default authenticators prior to delivery/installation.',
  'IA-05 06':
    'The organization protects authenticators commensurate with the security category of the information to which use of the authenticator permits access.',
  'IA-05 07':
    'The organization ensures that unencrypted static authenticators are not embedded in applications or access scripts or stored on function keys.',
  'IA-05 08':
    'The organization implements [Assignment: organization-defined security safeguards] to manage the risk of compromise due to individuals having accounts on multiple information systems.',
  'IA-05 09':
    'The organization coordinates with [Assignment: organization-defined external organizations] for cross-organization management of credentials.',
  'IA-05 10': 'The information system dynamically provisions identities.',
  'IA-05 11':
    'The information system, for hardware token-based authentication, employs mechanisms that satisfy [Assignment: organization-defined token quality requirements].',
  'IA-05 12':
    'The information system, for biometric-based authentication, employs mechanisms that satisfy [Assignment: organization-defined biometric quality requirements].',
  'IA-05 13':
    'The information system prohibits the use of cached authenticators after [Assignment: organization-defined time period].',
  'IA-05 14':
    'The organization, for PKI-based authentication, employs a deliberate organization-wide methodology for managing the content of PKI trust stores installed across all platforms including networks, operating systems, browsers, and applications.',
  'IA-05 15':
    'The organization uses only FICAM-approved path discovery and validation products and services.',
  'IA-06':
    'The information system obscures feedback of authentication information during the authentication process to protect the information from possible exploitation/use by unauthorized individuals.',
  'IA-07':
    'The information system implements mechanisms for authentication to a cryptographic module that meet the requirements of applicable federal laws, Executive Orders, directives, policies, regulations, standards, and guidance for such authentication.',
  'IA-08':
    'The information system uniquely identifies and authenticates non-organizational users (or processes acting on behalf of non-organizational users).',
  'IA-08 01':
    'The information system accepts and electronically verifies Personal Identity Verification (PIV) credentials from other federal agencies.',
  'IA-08 02':
    'The information system accepts only FICAM-approved third-party credentials.',
  'IA-08 03':
    'The organization employs only FICAM-approved information system components in [Assignment: organization-defined information systems] to accept third-party credentials.',
  'IA-08 04': 'The information system conforms to FICAM-issued profiles.',
  'IA-08 05':
    'The information system accepts and electronically verifies Personal Identity Verification-I (PIV-I) credentials.',
  'IA-09':
    'The organization identifies and authenticates [Assignment: organization-defined information system services] using [Assignment: organization-defined security safeguards].',
  'IA-09 01':
    'The organization ensures that service providers receive, validate, and transmit identification and authentication information.',
  'IA-09 02':
    'The organization ensures that identification and authentication decisions are transmitted between [Assignment: organization-defined services] consistent with organizational policies.',
  'IA-10':
    'The organization requires that individuals accessing the information system employ [Assignment: organization-defined supplemental authentication techniques or mechanisms] under specific [Assignment: organization-defined circumstances or situations].',
  'IA-11':
    'The organization requires users and devices to re-authenticate when [Assignment: organization-defined circumstances or situations requiring re-authentication].',
  'IR-01': 'INCIDENT RESPONSE POLICY AND PROCEDURES',
  'IR-01 a':
    'Develops, documents, and disseminates to [Assignment: organization-defined personnel or roles]:',
  'IR-01 a 01':
    'An incident response policy that addresses purpose, scope, roles, responsibilities, management commitment, coordination among organizational entities, and compliance; and',
  'IR-01 a 02':
    'Procedures to facilitate the implementation of the incident response policy and associated incident response controls; and',
  'IR-01 b': 'Reviews and updates the current:',
  'IR-01 b 01':
    'Incident response policy [Assignment: organization-defined frequency]; and',
  'IR-01 b 02':
    'Incident response procedures [Assignment: organization-defined frequency].',
  'IR-02':
    'The organization provides incident response training to information system users consistent with assigned roles and responsibilities:',
  'IR-02 a':
    'Within [Assignment: organization-defined time period] of assuming an incident response role or responsibility;',
  'IR-02 b': 'When required by information system changes; and',
  'IR-02 c': '[Assignment: organization-defined frequency] thereafter.',
  'IR-02 01':
    'The organization incorporates simulated events into incident response training to facilitate effective response by personnel in crisis situations.',
  'IR-02 02':
    'The organization employs automated mechanisms to provide a more thorough and realistic incident response training environment.',
  'IR-03':
    'The organization tests the incident response capability for the information system [Assignment: organization-defined frequency] using [Assignment: organization-defined tests] to determine the incident response effectiveness and documents the results.',
  'IR-03 01':
    'The organization employs automated mechanisms to more thoroughly and effectively test the incident response capability.',
  'IR-03 02':
    'The organization coordinates incident response testing with organizational elements responsible for related plans.',
  'IR-04': 'INCIDENT HANDLING',
  'IR-04 a':
    'Implements an incident handling capability for security incidents that includes preparation, detection and analysis, containment, eradication, and recovery;',
  'IR-04 b':
    'Coordinates incident handling activities with contingency planning activities; and',
  'IR-04 c':
    'Incorporates lessons learned from ongoing incident handling activities into incident response procedures, training, and testing, and implements the resulting changes accordingly.',
  'IR-04 01':
    'The organization employs automated mechanisms to support the incident handling process.',
  'IR-04 02':
    'The organization includes dynamic reconfiguration of [Assignment: organization-defined information system components] as part of the incident response capability.',
  'IR-04 03':
    'The organization identifies [Assignment: organization-defined classes of incidents] and [Assignment: organization-defined actions to take in response to classes of incidents] to ensure continuation of organizational missions and business functions.',
  'IR-04 04':
    'The organization correlates incident information and individual incident responses to achieve an organization-wide perspective on incident awareness and response.',
  'IR-04 05':
    'The organization implements a configurable capability to automatically disable the information system if [Assignment: organization-defined security violations] are detected.',
  'IR-04 06':
    'The organization implements incident handling capability for insider threats.',
  'IR-04 07':
    'The organization coordinates incident handling capability for insider threats across [Assignment: organization-defined components or elements of the organization].',
  'IR-04 08':
    'The organization coordinates with [Assignment: organization-defined external organizations] to correlate and share [Assignment: organization-defined incident information] to achieve a cross-organization perspective on incident awareness and more effective incident responses.',
  'IR-04 09':
    'The organization employs [Assignment: organization-defined dynamic response capabilities] to effectively respond to security incidents.',
  'IR-04 10':
    'The organization coordinates incident handling activities involving supply chain events with other organizations involved in the supply chain.',
  'IR-05':
    'The organization tracks and documents information system security incidents.',
  'IR-05 01':
    'The organization employs automated mechanisms to assist in the tracking of security incidents and in the collection and analysis of incident information.',
  'IR-06': 'INCIDENT REPORTING',
  'IR-06 a':
    'Requires personnel to report suspected security incidents to the organizational incident response capability within [Assignment: organization-defined time period]; and',
  'IR-06 b':
    'Reports security incident information to [Assignment: organization-defined authorities].',
  'IR-06 01':
    'The organization employs automated mechanisms to assist in the reporting of security incidents.',
  'IR-06 02':
    'The organization reports information system vulnerabilities associated with reported security incidents to [Assignment: organization-defined personnel or roles].',
  'IR-06 03':
    'The organization provides security incident information to other organizations involved in the supply chain for information systems or information system components related to the incident.',
  'IR-07':
    'The organization provides an incident response support resource, integral to the organizational incident response capability that offers advice and assistance to users of the information system for the handling and reporting of security incidents.',
  'IR-07 01':
    'The organization employs automated mechanisms to increase the availability of incident response-related information and support.',
  'IR-07 02': 'COORDINATION WITH EXTERNAL PROVIDERS',
  'IR-07 02 a':
    'Establishes a direct, cooperative relationship between its incident response capability and external providers of information system protection capability; and',
  'IR-07 02 b':
    'Identifies organizational incident response team members to the external providers.',
  'IR-08': 'INCIDENT RESPONSE PLAN',
  'IR-08 a': 'Develops an incident response plan that:',
  'IR-08 a 01':
    'Provides the organization with a roadmap for implementing its incident response capability;',
  'IR-08 a 02':
    'Describes the structure and organization of the incident response capability;',
  'IR-08 a 03':
    'Provides a high-level approach for how the incident response capability fits into the overall organization;',
  'IR-08 a 04':
    'Meets the unique requirements of the organization, which relate to mission, size, structure, and functions;',
  'IR-08 a 05': 'Defines reportable incidents;',
  'IR-08 a 06':
    'Provides metrics for measuring the incident response capability within the organization;',
  'IR-08 a 07':
    'Defines the resources and management support needed to effectively maintain and mature an incident response capability; and',
  'IR-08 a 08':
    'Is reviewed and approved by [Assignment: organization-defined personnel or roles];',
  'IR-08 b':
    'Distributes copies of the incident response plan to [Assignment: organization-defined incident response personnel (identified by name and/or by role) and organizational elements];',
  'IR-08 c':
    'Reviews the incident response plan [Assignment: organization-defined frequency];',
  'IR-08 d':
    'Updates the incident response plan to address system/organizational changes or problems encountered during plan implementation, execution, or testing;',
  'IR-08 e':
    'Communicates incident response plan changes to [Assignment: organization-defined incident response personnel (identified by name and/or by role) and organizational elements]; and',
  'IR-08 f':
    'Protects the incident response plan from unauthorized disclosure and modification.',
  'IR-09': 'The organization responds to information spills by:',
  'IR-09 a':
    'Identifying the specific information involved in the information system contamination;',
  'IR-09 b':
    'Alerting [Assignment: organization-defined personnel or roles] of the information spill using a method of communication not associated with the spill;',
  'IR-09 c':
    'Isolating the contaminated information system or system component;',
  'IR-09 d':
    'Eradicating the information from the contaminated information system or component;',
  'IR-09 e':
    'Identifying other information systems or system components that may have been subsequently contaminated; and',
  'IR-09 f': 'Performing other [Assignment: organization-defined actions].',
  'IR-09 01':
    'The organization assigns [Assignment: organization-defined personnel or roles] with responsibility for responding to information spills.',
  'IR-09 02':
    'The organization provides information spillage response training [Assignment: organization-defined frequency].',
  'IR-09 03':
    'The organization implements [Assignment: organization-defined procedures] to ensure that organizational personnel impacted by information spills can continue to carry out assigned tasks while contaminated systems are undergoing corrective actions.',
  'IR-09 04':
    'The organization employs [Assignment: organization-defined security safeguards] for personnel exposed to information not within assigned access authorizations.',
  'IR-10':
    'The organization establishes an integrated team of forensic/malicious code analysts, tool developers, and real-time operations personnel.',
  'MA-01': 'SYSTEM MAINTENANCE POLICY AND PROCEDURES',
  'MA-01 a':
    'Develops, documents, and disseminates to [Assignment: organization-defined personnel or roles]:',
  'MA-01 a 01':
    'A system maintenance policy that addresses purpose, scope, roles, responsibilities, management commitment, coordination among organizational entities, and compliance; and',
  'MA-01 a 02':
    'Procedures to facilitate the implementation of the system maintenance policy and associated system maintenance controls; and',
  'MA-01 b': 'Reviews and updates the current:',
  'MA-01 b 01':
    'System maintenance policy [Assignment: organization-defined frequency]; and',
  'MA-01 b 02':
    'System maintenance procedures [Assignment: organization-defined frequency].',
  'MA-02': 'CONTROLLED MAINTENANCE',
  'MA-02 a':
    'Schedules, performs, documents, and reviews records of maintenance and repairs on information system components in accordance with manufacturer or vendor specifications and/or organizational requirements;',
  'MA-02 b':
    'Approves and monitors all maintenance activities, whether performed on site or remotely and whether the equipment is serviced on site or removed to another location;',
  'MA-02 c':
    'Requires that [Assignment: organization-defined personnel or roles] explicitly approve the removal of the information system or system components from organizational facilities for off-site maintenance or repairs;',
  'MA-02 d':
    'Sanitizes equipment to remove all information from associated media prior to removal from organizational facilities for off-site maintenance or repairs;',
  'MA-02 e':
    'Checks all potentially impacted security controls to verify that the controls are still functioning properly following maintenance or repair actions; and',
  'MA-02 f':
    'Includes [Assignment: organization-defined maintenance-related information] in organizational maintenance records.',
  'MA-02 01': '[Withdrawn: Incorporated into MA-2].',
  'MA-02 02': 'AUTOMATED MAINTENANCE ACTIVITIES',
  'MA-02 02 a':
    'Employs automated mechanisms to schedule, conduct, and document maintenance and repairs; and',
  'MA-02 02 b':
    'Produces up-to date, accurate, and complete records of all maintenance and repair actions requested, scheduled, in process, and completed.',
  'MA-03':
    'The organization approves, controls, and monitors information system maintenance tools.',
  'MA-03 01':
    'The organization inspects the maintenance tools carried into a facility by maintenance personnel for improper or unauthorized modifications.',
  'MA-03 02':
    'The organization checks media containing diagnostic and test programs for malicious code before the media are used in the information system.',
  'MA-03 03':
    'The organization prevents the unauthorized removal of maintenance equipment containing organizational information by:',
  'MA-03 03 a':
    'Verifying that there is no organizational information contained on the equipment;',
  'MA-03 03 b': 'Sanitizing or destroying the equipment;',
  'MA-03 03 c': 'Retaining the equipment within the facility; or',
  'MA-03 03 d':
    'Obtaining an exemption from [Assignment: organization-defined personnel or roles] explicitly authorizing removal of the equipment from the facility.',
  'MA-03 04':
    'The information system restricts the use of maintenance tools to authorized personnel only.',
  'MA-04': 'NONLOCAL MAINTENANCE',
  'MA-04 a':
    'Approves and monitors nonlocal maintenance and diagnostic activities;',
  'MA-04 b':
    'Allows the use of nonlocal maintenance and diagnostic tools only as consistent with organizational policy and documented in the security plan for the information system;',
  'MA-04 c':
    'Employs strong authenticators in the establishment of nonlocal maintenance and diagnostic sessions;',
  'MA-04 d':
    'Maintains records for nonlocal maintenance and diagnostic activities; and',
  'MA-04 e':
    'Terminates session and network connections when nonlocal maintenance is completed.',
  'MA-04 01': 'AUDITING AND REVIEW',
  'MA-04 01 a':
    'Audits nonlocal maintenance and diagnostic sessions [Assignment: organization-defined audit events]; and',
  'MA-04 01 b':
    'Reviews the records of the maintenance and diagnostic sessions.',
  'MA-04 02':
    'The organization documents in the security plan for the information system, the policies and procedures for the establishment and use of nonlocal maintenance and diagnostic connections.',
  'MA-04 03': 'COMPARABLE SECURITY / SANITIZATION',
  'MA-04 03 a':
    'Requires that nonlocal maintenance and diagnostic services be performed from an information system that implements a security capability comparable to the capability implemented on the system being serviced; or',
  'MA-04 03 b':
    'Removes the component to be serviced from the information system prior to nonlocal maintenance or diagnostic services, sanitizes the component (with regard to organizational information) before removal from organizational facilities, and after the service is performed, inspects and sanitizes the component (with regard to potentially malicious software) before reconnecting the component to the information system.',
  'MA-04 04': 'The organization protects nonlocal maintenance sessions by:',
  'MA-04 04 a':
    'Employing [Assignment: organization-defined authenticators that are replay resistant]; and',
  'MA-04 04 b':
    'Separating the maintenance sessions from other network sessions with the information system by either:',
  'MA-04 04 b 01': 'Physically separated communications paths; or',
  'MA-04 04 b 02':
    'Logically separated communications paths based upon encryption.',
  'MA-04 05': 'APPROVALS AND NOTIFICATIONS',
  'MA-04 05 a':
    'Requires the approval of each nonlocal maintenance session by [Assignment: organization-defined personnel or roles]; and',
  'MA-04 05 b':
    'Notifies [Assignment: organization-defined personnel or roles] of the date and time of planned nonlocal maintenance.',
  'MA-04 06':
    'The information system implements cryptographic mechanisms to protect the integrity and confidentiality of nonlocal maintenance and diagnostic communications.',
  'MA-04 07':
    'The information system implements remote disconnect verification at the termination of nonlocal maintenance and diagnostic sessions.',
  'MA-05': 'MAINTENANCE PERSONNEL',
  'MA-05 a':
    'Establishes a process for maintenance personnel authorization and maintains a list of authorized maintenance organizations or personnel;',
  'MA-05 b':
    'Ensures that non-escorted personnel performing maintenance on the information system have required access authorizations; and',
  'MA-05 c':
    'Designates organizational personnel with required access authorizations and technical competence to supervise the maintenance activities of personnel who do not possess the required access authorizations.',
  'MA-05 01': 'INDIVIDUALS WITHOUT APPROPRIATE ACCESS',
  'MA-05 01 a':
    'Implements procedures for the use of maintenance personnel that lack appropriate security clearances or are not U.S. citizens, that include the following requirements:',
  'MA-05 01 a 01':
    'Maintenance personnel who do not have needed access authorizations, clearances, or formal access approvals are escorted and supervised during the performance of maintenance and diagnostic activities on the information system by approved organizational personnel who are fully cleared, have appropriate access authorizations, and are technically qualified;',
  'MA-05 01 a 02':
    'Prior to initiating maintenance or diagnostic activities by personnel who do not have needed access authorizations, clearances or formal access approvals, all volatile information storage components within the information system are sanitized and all nonvolatile storage media are removed or physically disconnected from the system and secured; and',
  'MA-05 01 b':
    'Develops and implements alternate security safeguards in the event an information system component cannot be sanitized, removed, or disconnected from the system.',
  'MA-05 02':
    'The organization ensures that personnel performing maintenance and diagnostic activities on an information system processing, storing, or transmitting classified information possess security clearances and formal access approvals for at least the highest classification level and for all compartments of information on the system.',
  'MA-05 03':
    'The organization ensures that personnel performing maintenance and diagnostic activities on an information system processing, storing, or transmitting classified information are U.S. citizens.',
  'MA-05 04': 'The organization ensures that:',
  'MA-05 04 a':
    'Cleared foreign nationals (i.e., foreign nationals with appropriate security clearances), are used to conduct maintenance and diagnostic activities on classified information systems only when the systems are jointly owned and operated by the United States and foreign allied governments, or owned and operated solely by foreign allied governments; and',
  'MA-05 04 b':
    'Approvals, consents, and detailed operational conditions regarding the use of foreign nationals to conduct maintenance and diagnostic activities on classified information systems are fully documented within Memoranda of Agreements.',
  'MA-05 05':
    'The organization ensures that non-escorted personnel performing maintenance activities not directly associated with the information system but in the physical proximity of the system, have required access authorizations.',
  'MA-06':
    'The organization obtains maintenance support and/or spare parts for [Assignment: organization-defined information system components] within [Assignment: organization-defined time period] of failure.',
  'MA-06 01':
    'The organization performs preventive maintenance on [Assignment: organization-defined information system components] at [Assignment: organization-defined time intervals].',
  'MA-06 02':
    'The organization performs predictive maintenance on [Assignment: organization-defined information system components] at [Assignment: organization-defined time intervals].',
  'MA-06 03':
    'The organization employs automated mechanisms to transfer predictive maintenance data to a computerized maintenance management system.',
  'MP-01': 'MEDIA PROTECTION POLICY AND PROCEDURES',
  'MP-01 a':
    'Develops, documents, and disseminates to [Assignment: organization-defined personnel or roles]:',
  'MP-01 a 01':
    'A media protection policy that addresses purpose, scope, roles, responsibilities, management commitment, coordination among organizational entities, and compliance; and',
  'MP-01 a 02':
    'Procedures to facilitate the implementation of the media protection policy and associated media protection controls; and',
  'MP-01 b': 'Reviews and updates the current:',
  'MP-01 b 01':
    'Media protection policy [Assignment: organization-defined frequency]; and',
  'MP-01 b 02':
    'Media protection procedures [Assignment: organization-defined frequency].',
  'MP-02':
    'The organization restricts access to [Assignment: organization-defined types of digital and/or non-digital media] to [Assignment: organization-defined personnel or roles].',
  'MP-02 01': '[Withdrawn: Incorporated into MP-4 (2)].',
  'MP-02 02': '[Withdrawn: Incorporated into SC-28 (1)].',
  'MP-03': 'MEDIA MARKING',
  'MP-03 a':
    'Marks information system media indicating the distribution limitations, handling caveats, and applicable security markings (if any) of the information; and',
  'MP-03 b':
    'Exempts [Assignment: organization-defined types of information system media] from marking as long as the media remain within [Assignment: organization-defined controlled areas].',
  'MP-04': 'MEDIA STORAGE',
  'MP-04 a':
    'Physically controls and securely stores [Assignment: organization-defined types of digital and/or non-digital media] within [Assignment: organization-defined controlled areas]; and',
  'MP-04 b':
    'Protects information system media until the media are destroyed or sanitized using approved equipment, techniques, and procedures.',
  'MP-04 01': '[Withdrawn: Incorporated into SC-28 (1)].',
  'MP-04 02':
    'The organization employs automated mechanisms to restrict access to media storage areas and to audit access attempts and access granted.',
  'MP-05': 'MEDIA TRANSPORT',
  'MP-05 a':
    'Protects and controls [Assignment: organization-defined types of information system media] during transport outside of controlled areas using [Assignment: organization-defined security safeguards];',
  'MP-05 b':
    'Maintains accountability for information system media during transport outside of controlled areas;',
  'MP-05 c':
    'Documents activities associated with the transport of information system media; and',
  'MP-05 d':
    'Restricts the activities associated with the transport of information system media to authorized personnel.',
  'MP-05 01': '[Withdrawn: Incorporated into MP-5].',
  'MP-05 02': '[Withdrawn: Incorporated into MP-5].',
  'MP-05 03':
    'The organization employs an identified custodian during transport of information system media outside of controlled areas.',
  'MP-05 04':
    'The information system implements cryptographic mechanisms to protect the confidentiality and integrity of information stored on digital media during transport outside of controlled areas.',
  'MP-06': 'MEDIA SANITIZATION',
  'MP-06 a':
    'Sanitizes [Assignment: organization-defined information system media] prior to disposal, release out of organizational control, or release for reuse using [Assignment: organization-defined sanitization techniques and procedures] in accordance with applicable federal and organizational standards and policies; and',
  'MP-06 b':
    'Employs sanitization mechanisms with the strength and integrity commensurate with the security category or classification of the information.',
  'MP-06 01':
    'The organization reviews, approves, tracks, documents, and verifies media sanitization and disposal actions.',
  'MP-06 02':
    'The organization tests sanitization equipment and procedures [Assignment: organization-defined frequency] to verify that the intended sanitization is being achieved.',
  'MP-06 03':
    'The organization applies nondestructive sanitization techniques to portable storage devices prior to connecting such devices to the information system under the following circumstances: [Assignment: organization-defined circumstances requiring sanitization of portable storage devices].',
  'MP-06 04': '[Withdrawn: Incorporated into MP-6].',
  'MP-06 05': '[Withdrawn: Incorporated into MP-6].',
  'MP-06 06': '[Withdrawn: Incorporated into MP-6].',
  'MP-06 07':
    'The organization enforces dual authorization for the sanitization of [Assignment: organization-defined information system media].',
  'MP-06 08':
    'The organization provides the capability to purge/wipe information from [Assignment: organization-defined information systems, system components, or devices] either remotely or under the following conditions: [Assignment: organization-defined conditions].',
  'MP-07':
    'The organization [Selection: restricts; prohibits] the use of [Assignment: organization-defined types of information system media] on [Assignment: organization-defined information systems or system components] using [Assignment: organization-defined security safeguards].',
  'MP-07 01':
    'The organization prohibits the use of portable storage devices in organizational information systems when such devices have no identifiable owner.',
  'MP-07 02':
    'The organization prohibits the use of sanitization-resistant media in organizational information systems.',
  'MP-08': 'MEDIA DOWNGRADING',
  'MP-08 a':
    'Establishes [Assignment: organization-defined information system media downgrading process] that includes employing downgrading mechanisms with [Assignment: organization-defined strength and integrity];',
  'MP-08 b':
    'Ensures that the information system media downgrading process is commensurate with the security category and/or classification level of the information to be removed and the access authorizations of the potential recipients of the downgraded information;',
  'MP-08 c':
    'Identifies [Assignment: organization-defined information system media requiring downgrading]; and',
  'MP-08 d':
    'Downgrades the identified information system media using the established process.',
  'MP-08 01':
    'The organization documents information system media downgrading actions.',
  'MP-08 02':
    'The organization employs [Assignment: organization-defined tests] of downgrading equipment and procedures to verify correct performance [Assignment: organization-defined frequency].',
  'MP-08 03':
    'The organization downgrades information system media containing [Assignment: organization-defined Controlled Unclassified Information (CUI)] prior to public release in accordance with applicable federal and organizational standards and policies.',
  'MP-08 04':
    'The organization downgrades information system media containing classified information prior to release to individuals without required access authorizations in accordance with NSA standards and policies.',
  'PE-01': 'PHYSICAL AND ENVIRONMENTAL PROTECTION POLICY AND PROCEDURES',
  'PE-01 a':
    'Develops, documents, and disseminates to [Assignment: organization-defined personnel or roles]:',
  'PE-01 a 01':
    'A physical and environmental protection policy that addresses purpose, scope, roles, responsibilities, management commitment, coordination among organizational entities, and compliance; and',
  'PE-01 a 02':
    'Procedures to facilitate the implementation of the physical and environmental protection policy and associated physical and environmental protection controls; and',
  'PE-01 b': 'Reviews and updates the current:',
  'PE-01 b 01':
    'Physical and environmental protection  policy [Assignment: organization-defined frequency]; and',
  'PE-01 b 02':
    'Physical and environmental protection procedures [Assignment: organization-defined frequency].',
  'PE-02': 'PHYSICAL ACCESS AUTHORIZATIONS',
  'PE-02 a':
    'Develops, approves, and maintains a list of individuals with authorized access to the facility where the information system resides;',
  'PE-02 b': 'Issues authorization credentials for facility access;',
  'PE-02 c':
    'Reviews the access list detailing authorized facility access by individuals [Assignment: organization-defined frequency]; and',
  'PE-02 d':
    'Removes individuals from the facility access list when access is no longer required.',
  'PE-02 01':
    'The organization authorizes physical access to the facility where the information system resides based on position or role.',
  'PE-02 02':
    'The organization requires two forms of identification from [Assignment: organization-defined list of acceptable forms of identification] for visitor access to the facility where the information system resides.',
  'PE-02 03':
    'The organization restricts unescorted access to the facility where the information system resides to personnel with [Selection (one or more): security clearances for all information contained within the system; formal access authorizations for all information contained within the system; need for access to all information contained within the system; [Assignment: organization-defined credentials]].',
  'PE-03': 'PHYSICAL ACCESS CONTROL',
  'PE-03 a':
    'Enforces physical access authorizations at [Assignment: organization-defined entry/exit points to the facility where the information system resides] by;',
  'PE-03 a 01':
    'Verifying individual access authorizations before granting access to the facility; and',
  'PE-03 a 02':
    'Controlling ingress/egress to the facility using [Selection (one or more): [Assignment: organization-defined physical access control systems/devices]; guards];',
  'PE-03 b':
    'Maintains physical access audit logs for [Assignment: organization-defined entry/exit points];',
  'PE-03 c':
    'Provides [Assignment: organization-defined security safeguards] to control access to areas within the facility officially designated as publicly accessible;',
  'PE-03 d':
    'Escorts visitors and monitors visitor activity [Assignment: organization-defined circumstances requiring visitor escorts and monitoring];',
  'PE-03 e': 'Secures keys, combinations, and other physical access devices;',
  'PE-03 f':
    'Inventories [Assignment: organization-defined physical access devices] every [Assignment: organization-defined frequency]; and',
  'PE-03 g':
    'Changes combinations and keys [Assignment: organization-defined frequency] and/or when keys are lost, combinations are compromised, or individuals are transferred or terminated.',
  'PE-03 01':
    'The organization enforces physical access authorizations to the information system in addition to the physical access controls for the facility at [Assignment: organization-defined physical spaces containing one or more components of the information system].',
  'PE-03 02':
    'The organization performs security checks [Assignment: organization-defined frequency] at the physical boundary of the facility or information system for unauthorized exfiltration of information or removal of information system components.',
  'PE-03 03':
    'The organization employs guards and/or alarms to monitor every physical access point to the facility where the information system resides 24 hours per day, 7 days per week.',
  'PE-03 04':
    'The organization uses lockable physical casings to protect [Assignment: organization-defined information system components] from unauthorized physical access.',
  'PE-03 05':
    'The organization employs [Assignment: organization-defined security safeguards] to [Selection (one or more): detect; prevent] physical tampering or alteration of [Assignment: organization-defined hardware components] within the information system.',
  'PE-03 06':
    'The organization employs a penetration testing process that includes [Assignment: organization-defined frequency], unannounced attempts to bypass or circumvent security controls associated with physical access points to the facility.',
  'PE-04':
    'The organization controls physical access to [Assignment: organization-defined information system distribution and transmission lines] within organizational facilities using [Assignment: organization-defined security safeguards].',
  'PE-05':
    'The organization controls physical access to information system output devices to prevent unauthorized individuals from obtaining the output.',
  'PE-05 01': 'ACCESS TO OUTPUT BY AUTHORIZED INDIVIDUALS',
  'PE-05 01 a':
    'Controls physical access to output from [Assignment: organization-defined output devices]; and',
  'PE-05 01 b':
    'Ensures that only authorized individuals receive output from the device.',
  'PE-05 02': 'The information system:',
  'PE-05 02 a':
    'Controls physical access to output from [Assignment: organization-defined output devices]; and',
  'PE-05 02 b':
    'Links individual identity to receipt of the output from the device.',
  'PE-05 03':
    'The organization marks [Assignment: organization-defined information system output devices] indicating the appropriate security marking of the information permitted to be output from the device.',
  'PE-06': 'MONITORING PHYSICAL ACCESS',
  'PE-06 a':
    'Monitors physical access to the facility where the information system resides to detect and respond to physical security incidents;',
  'PE-06 b':
    'Reviews physical access logs [Assignment: organization-defined frequency] and upon occurrence of [Assignment: organization-defined events or potential indications of events]; and',
  'PE-06 c':
    'Coordinates results of reviews and investigations with the organizational incident response capability.',
  'PE-06 01':
    'The organization monitors physical intrusion alarms and surveillance equipment.',
  'PE-06 02':
    'The organization employs automated mechanisms to recognize [Assignment: organization-defined classes/types of intrusions] and initiate [Assignment: organization-defined response actions].',
  'PE-06 03':
    'The organization employs video surveillance of [Assignment: organization-defined operational areas] and retains video recordings for [Assignment: organization-defined time period].',
  'PE-06 04':
    'The organization monitors physical access to the information system in addition to the physical access monitoring of the facility as [Assignment: organization-defined physical spaces containing one or more components of the information system].',
  'PE-07': '[Withdrawn: Incorporated into PE-2 and PE-3].',
  'PE-08': 'VISITOR ACCESS RECORDS',
  'PE-08 a':
    'Maintains visitor access records to the facility where the information system resides for [Assignment: organization-defined time period]; and',
  'PE-08 b':
    'Reviews visitor access records [Assignment: organization-defined frequency].',
  'PE-08 01':
    'The organization employs automated mechanisms to facilitate the maintenance and review of visitor access records.',
  'PE-08 02': '[Withdrawn: Incorporated into PE-2].',
  'PE-09':
    'The organization protects power equipment and power cabling for the information system from damage and destruction.',
  'PE-09 01':
    'The organization employs redundant power cabling paths that are physically separated by [Assignment: organization-defined distance].',
  'PE-09 02':
    'The organization employs automatic voltage controls for [Assignment: organization-defined critical information system components].',
  'PE-10': 'EMERGENCY SHUTOFF',
  'PE-10 a':
    'Provides the capability of shutting off power to the information system or individual system components in emergency situations;',
  'PE-10 b':
    'Places emergency shutoff switches or devices in [Assignment: organization-defined location by information system or system component] to facilitate safe and easy access for personnel; and',
  'PE-10 c':
    'Protects emergency power shutoff capability from unauthorized activation.',
  'PE-10 01': '[Withdrawn: Incorporated into PE-10].',
  'PE-11':
    'The organization provides a short-term uninterruptible power supply to facilitate [Selection (one or more): an orderly shutdown of the information system; transition of the information system to long-term alternate power] in the event of a primary power source loss.',
  'PE-11 01':
    'The organization provides a long-term alternate power supply for the information system that is capable of maintaining minimally required operational capability in the event of an extended loss of the primary power source.',
  'PE-11 02':
    'The organization provides a long-term alternate power supply for the information system that is:',
  'PE-11 02 a': 'Self-contained;',
  'PE-11 02 b': 'Not reliant on external power generation; and',
  'PE-11 02 c':
    'Capable of maintaining [Selection: minimally required operational capability; full operational capability] in the event of an extended loss of the primary power source.',
  'PE-12':
    'The organization employs and maintains automatic emergency lighting for the information system that activates in the event of a power outage or disruption and that covers emergency exits and evacuation routes within the facility.',
  'PE-12 01':
    'The organization provides emergency lighting for all areas within the facility supporting essential missions and business functions.',
  'PE-13':
    'The organization employs and maintains fire suppression and detection devices/systems for the information system that are supported by an independent energy source.',
  'PE-13 01':
    'The organization employs fire detection devices/systems for the information system that activate automatically and notify [Assignment: organization-defined personnel or roles] and [Assignment: organization-defined emergency responders] in the event of a fire.',
  'PE-13 02':
    'The organization employs fire suppression devices/systems for the information system that provide automatic notification of any activation to Assignment: organization-defined personnel or roles] and [Assignment: organization-defined emergency responders].',
  'PE-13 03':
    'The organization employs an automatic fire suppression capability for the information system when the facility is not staffed on a continuous basis.',
  'PE-13 04':
    'The organization ensures that the facility undergoes [Assignment: organization-defined frequency] inspections by authorized and qualified inspectors and resolves identified deficiencies within [Assignment: organization-defined time period].',
  'PE-14': 'TEMPERATURE AND HUMIDITY CONTROLS',
  'PE-14 a':
    'Maintains temperature and humidity levels within the facility where the information system resides at [Assignment: organization-defined acceptable levels]; and',
  'PE-14 b':
    'Monitors temperature and humidity levels [Assignment: organization-defined frequency].',
  'PE-14 01':
    'The organization employs automatic temperature and humidity controls in the facility to prevent fluctuations potentially harmful to the information system.',
  'PE-14 02':
    'The organization employs temperature and humidity monitoring that provides an alarm or notification of changes potentially harmful to personnel or equipment.',
  'PE-15':
    'The organization protects the information system from damage resulting from water leakage by providing master shutoff or isolation valves that are accessible, working properly, and known to key personnel.',
  'PE-15 01':
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
  'PE-18 01':
    'The organization plans the location or site of the facility where the information system resides with regard to physical and environmental hazards and for existing facilities, considers the physical and environmental hazards in its risk mitigation strategy.',
  'PE-19':
    'The organization protects the information system from information leakage due to electromagnetic signals emanations.',
  'PE-19 01':
    'The organization ensures that information system components, associated data communications, and networks are protected in accordance with national emissions and TEMPEST policies and procedures based on the security category or classification of the information.',
  'PE-20': 'ASSET MONITORING AND TRACKING',
  'PE-20 a':
    'Employs [Assignment: organization-defined asset location technologies] to track and monitor the location and movement of [Assignment: organization-defined assets] within [Assignment: organization-defined controlled areas]; and',
  'PE-20 b':
    'Ensures that asset location technologies are employed in accordance with applicable federal laws, Executive Orders, directives, regulations, policies, standards, and guidance.',
  'PL-01': 'SECURITY PLANNING POLICY AND PROCEDURES',
  'PL-01 a':
    'Develops, documents, and disseminates to [Assignment: organization-defined personnel or roles]:',
  'PL-01 a 01':
    'A security planning policy that addresses purpose, scope, roles, responsibilities, management commitment, coordination among organizational entities, and compliance; and',
  'PL-01 a 02':
    'Procedures to facilitate the implementation of the security planning policy and associated security planning controls; and',
  'PL-01 b': 'Reviews and updates the current:',
  'PL-01 b 01':
    'Security planning policy [Assignment: organization-defined frequency]; and',
  'PL-01 b 02':
    'Security planning procedures [Assignment: organization-defined frequency].',
  'PL-02': 'SYSTEM SECURITY PLAN',
  'PL-02 a': 'Develops a security plan for the information system that:',
  'PL-02 a 01':
    "Is consistent with the organization's enterprise architecture;",
  'PL-02 a 02': 'Explicitly defines the authorization boundary for the system;',
  'PL-02 a 03':
    'Describes the operational context of the information system in terms of missions and business processes;',
  'PL-02 a 04':
    'Provides the security categorization of the information system including supporting rationale;',
  'PL-02 a 05':
    'Describes the operational environment for the information system and relationships with or connections to other information systems;',
  'PL-02 a 06':
    'Provides an overview of the security requirements for the system;',
  'PL-02 a 07': 'Identifies any relevant overlays, if applicable;',
  'PL-02 a 08':
    'Describes the security controls in place or planned for meeting those requirements including a rationale for the tailoring decisions; and',
  'PL-02 a 09':
    'Is reviewed and approved by the authorizing official or designated representative prior to plan implementation;',
  'PL-02 b':
    'Distributes copies of the security plan and communicates subsequent changes to the plan to [Assignment: organization-defined personnel or roles];',
  'PL-02 c':
    'Reviews the security plan for the information system [Assignment: organization-defined frequency];',
  'PL-02 d':
    'Updates the plan to address changes to the information system/environment of operation or problems identified during plan implementation or security control assessments; and',
  'PL-02 e':
    'Protects the security plan from unauthorized disclosure and modification.',
  'PL-02 01': '[Withdrawn: Incorporated into PL-7].',
  'PL-02 02': '[Withdrawn: Incorporated into PL-8].',
  'PL-02 03':
    'The organization plans and coordinates security-related activities affecting the information system with [Assignment: organization-defined individuals or groups] before conducting such activities in order to reduce the impact on other organizational entities.',
  'PL-03': '[Withdrawn: Incorporated into PL-2].',
  'PL-04': 'RULES OF BEHAVIOR',
  'PL-04 a':
    'Establishes and makes readily available to individuals requiring access to the information system, the rules that describe their responsibilities and expected behavior with regard to information and information system usage;',
  'PL-04 b':
    'Receives a signed acknowledgment from such individuals, indicating that they have read, understand, and agree to abide by the rules of behavior, before authorizing access to information and the information system;',
  'PL-04 c':
    'Reviews and updates the rules of behavior [Assignment: organization-defined frequency]; and',
  'PL-04 d':
    'Requires individuals who have signed a previous version of the rules of behavior to read and re-sign when the rules of behavior are revised/updated.',
  'PL-04 01':
    'The organization includes in the rules of behavior, explicit restrictions on the use of social media/networking sites and posting organizational information on public websites.',
  'PL-05': '[Withdrawn: Incorporated into Appendix J, AR-2].',
  'PL-06': '[Withdrawn: Incorporated into PL-2].',
  'PL-07': 'SECURITY CONCEPT OF OPERATIONS',
  'PL-07 a':
    'Develops a security Concept of Operations (CONOPS) for the information system containing at a minimum, how the organization intends to operate the system from the perspective of information security; and',
  'PL-07 b':
    'Reviews and updates the CONOPS [Assignment: organization-defined frequency].',
  'PL-08': 'INFORMATION SECURITY ARCHITECTURE',
  'PL-08 a':
    'Develops an information security architecture for the information system that:',
  'PL-08 a 01':
    'Describes the overall philosophy, requirements, and approach to be taken with regard to protecting the confidentiality, integrity, and availability of organizational information;',
  'PL-08 a 02':
    'Describes how the information security architecture is integrated into and supports the enterprise architecture; and',
  'PL-08 a 03':
    'Describes any information security assumptions about, and dependencies on, external services;',
  'PL-08 b':
    'Reviews and updates the information security architecture [Assignment: organization-defined frequency] to reflect updates in the enterprise architecture; and',
  'PL-08 c':
    'Ensures that planned information security architecture changes are reflected in the security plan, the security Concept of Operations (CONOPS), and organizational procurements/acquisitions.',
  'PL-08 01':
    'The organization designs its security architecture using a defense-in-depth approach that:',
  'PL-08 01 a':
    'Allocates [Assignment: organization-defined security safeguards] to [Assignment: organization-defined locations and architectural layers]; and',
  'PL-08 01 b':
    'Ensures that the allocated security safeguards operate in a coordinated and mutually reinforcing manner.',
  'PL-08 02':
    'The organization requires that [Assignment: organization-defined security safeguards] allocated to [Assignment: organization-defined locations and architectural layers] are obtained from different suppliers.',
  'PL-09':
    'The organization centrally manages [Assignment: organization-defined security controls and related processes].',
  'PS-01': 'PERSONNEL SECURITY POLICY AND PROCEDURES',
  'PS-01 a':
    'Develops, documents, and disseminates to [Assignment: organization-defined personnel or roles]:',
  'PS-01 a 01':
    'A personnel security policy that addresses purpose, scope, roles, responsibilities, management commitment, coordination among organizational entities, and compliance; and',
  'PS-01 a 02':
    'Procedures to facilitate the implementation of the personnel security policy and associated personnel security controls; and',
  'PS-01 b': 'Reviews and updates the current:',
  'PS-01 b 01':
    'Personnel security policy [Assignment: organization-defined frequency]; and',
  'PS-01 b 02':
    'Personnel security procedures [Assignment: organization-defined frequency].',
  'PS-02': 'POSITION RISK DESIGNATION',
  'PS-02 a': 'Assigns a risk designation to all organizational positions;',
  'PS-02 b':
    'Establishes screening criteria for individuals filling those positions; and',
  'PS-02 c':
    'Reviews and updates position risk designations [Assignment: organization-defined frequency].',
  'PS-03': 'PERSONNEL SCREENING',
  'PS-03 a':
    'Screens individuals prior to authorizing access to the information system; and',
  'PS-03 b':
    'Rescreens individuals according to [Assignment: organization-defined conditions requiring rescreening and, where rescreening is so indicated, the frequency of such rescreening].',
  'PS-03 01':
    'The organization ensures that individuals accessing an information system processing, storing, or transmitting classified information are cleared and indoctrinated to the highest classification level of the information to which they have access on the system.',
  'PS-03 02':
    'The organization ensures that individuals accessing an information system processing, storing, or transmitting types of classified information which require formal indoctrination, are formally indoctrinated for all of the relevant types of information to which they have access on the system.',
  'PS-03 03':
    'The organization ensures that individuals accessing an information system processing, storing, or transmitting information requiring special protection:',
  'PS-03 03 a':
    'Have valid access authorizations that are demonstrated by assigned official government duties; and',
  'PS-03 03 b':
    'Satisfy [Assignment: organization-defined additional personnel screening criteria].',
  'PS-04': 'The organization, upon termination of individual employment:',
  'PS-04 a':
    'Disables information system access within [Assignment: organization-defined time period];',
  'PS-04 b':
    'Terminates/revokes any authenticators/credentials associated with the individual;',
  'PS-04 c':
    'Conducts exit interviews that include a discussion of [Assignment: organization-defined information security topics];',
  'PS-04 d':
    'Retrieves all security-related organizational information system-related property;',
  'PS-04 e':
    'Retains access to organizational information and information systems formerly controlled by terminated individual; and',
  'PS-04 f':
    'Notifies [Assignment: organization-defined personnel or roles] within [Assignment: organization-defined time period].',
  'PS-04 01': 'POST-EMPLOYMENT REQUIREMENTS',
  'PS-04 01 a':
    'Notifies terminated individuals of applicable, legally binding post-employment requirements for the protection of organizational information; and',
  'PS-04 01 b':
    'Requires terminated individuals to sign an acknowledgment of post-employment requirements as part of the organizational termination process.',
  'PS-04 02':
    'The organization employs automated mechanisms to notify [Assignment: organization-defined personnel or roles] upon termination of an individual.',
  'PS-05': 'PERSONNEL TRANSFER',
  'PS-05 a':
    'Reviews and confirms ongoing operational need for current logical and physical access authorizations to information systems/facilities when individuals are reassigned or transferred to other positions within the organization;',
  'PS-05 b':
    'Initiates [Assignment: organization-defined transfer or reassignment actions] within [Assignment: organization-defined time period following the formal transfer action];',
  'PS-05 c':
    'Modifies access authorization as needed to correspond with any changes in operational need due to reassignment or transfer; and',
  'PS-05 d':
    'Notifies [Assignment: organization-defined personnel or roles] within [Assignment: organization-defined time period].',
  'PS-06': 'ACCESS AGREEMENTS',
  'PS-06 a':
    'Develops and documents access agreements for organizational information systems;',
  'PS-06 b':
    'Reviews and updates the access agreements [Assignment: organization-defined frequency]; and',
  'PS-06 c':
    'Ensures that individuals requiring access to organizational information and information systems:',
  'PS-06 c 01':
    'Sign appropriate access agreements prior to being granted access; and',
  'PS-06 c 02':
    'Re-sign access agreements to maintain access to organizational information systems when access agreements have been updated or [Assignment: organization-defined frequency].',
  'PS-06 01': '[Withdrawn: Incorporated into PS-3].',
  'PS-06 02':
    'The organization ensures that access to classified information requiring special protection is granted only to individuals who:',
  'PS-06 02 a':
    'Have a valid access authorization that is demonstrated by assigned official government duties;',
  'PS-06 02 b': 'Satisfy associated personnel security criteria; and',
  'PS-06 02 c': 'Have read, understood, and signed a nondisclosure agreement.',
  'PS-06 03': 'POST-EMPLOYMENT REQUIREMENTS',
  'PS-06 03 a':
    'Notifies individuals of applicable, legally binding post-employment requirements for protection of organizational information; and',
  'PS-06 03 b':
    'Requires individuals to sign an acknowledgment of these requirements, if applicable, as part of granting initial access to covered information.',
  'PS-07': 'THIRD-PARTY PERSONNEL SECURITY',
  'PS-07 a':
    'Establishes personnel security requirements including security roles and responsibilities for third-party providers;',
  'PS-07 b':
    'Requires third-party providers to comply with personnel security policies and procedures established by the organization;',
  'PS-07 c': 'Documents personnel security requirements;',
  'PS-07 d':
    'Requires third-party providers to notify [Assignment: organization-defined personnel or roles] of any personnel transfers or terminations of third-party personnel who possess organizational credentials and/or badges, or who have information system privileges within [Assignment: organization-defined time period]; and',
  'PS-07 e': 'Monitors provider compliance.',
  'PS-08': 'PERSONNEL SANCTIONS',
  'PS-08 a':
    'Employs a formal sanctions process for individuals failing to comply with established information security policies and procedures; and',
  'PS-08 b':
    'Notifies [Assignment: organization-defined personnel or roles] within [Assignment: organization-defined time period] when a formal employee sanctions process is initiated, identifying the individual sanctioned and the reason for the sanction.',
  'RA-01': 'RISK ASSESSMENT POLICY AND PROCEDURES',
  'RA-01 a':
    'Develops, documents, and disseminates to [Assignment: organization-defined personnel or roles]:',
  'RA-01 a 01':
    'A risk assessment policy that addresses purpose, scope, roles, responsibilities, management commitment, coordination among organizational entities, and compliance; and',
  'RA-01 a 02':
    'Procedures to facilitate the implementation of the risk assessment policy and associated risk assessment controls; and',
  'RA-01 b': 'Reviews and updates the current:',
  'RA-01 b 01':
    'Risk assessment policy [Assignment: organization-defined frequency]; and',
  'RA-01 b 02':
    'Risk assessment procedures [Assignment: organization-defined frequency].',
  'RA-02': 'SECURITY CATEGORIZATION',
  'RA-02 a':
    'Categorizes information and the information system in accordance with applicable federal laws, Executive Orders, directives, policies, regulations, standards, and guidance;',
  'RA-02 b':
    'Documents the security categorization results (including supporting rationale) in the security plan for the information system; and',
  'RA-02 c':
    'Ensures that the authorizing official or authorizing official designated representative reviews and approves the security categorization decision.',
  'RA-03': 'RISK ASSESSMENT',
  'RA-03 a':
    'Conducts an assessment of risk, including the likelihood and magnitude of harm, from the unauthorized access, use, disclosure, disruption, modification, or destruction of the information system and the information it processes, stores, or transmits;',
  'RA-03 b':
    'Documents risk assessment results in [Selection: security plan; risk assessment report; [Assignment: organization-defined document]];',
  'RA-03 c':
    'Reviews risk assessment results [Assignment: organization-defined frequency];',
  'RA-03 d':
    'Disseminates risk assessment results to [Assignment: organization-defined personnel or roles]; and',
  'RA-03 e':
    'Updates the risk assessment [Assignment: organization-defined frequency] or whenever there are significant changes to the information system or environment of operation (including the identification of new threats and vulnerabilities), or other conditions that may impact the security state of the system.',
  'RA-04': '[Withdrawn: Incorporated into RA-3].',
  'RA-05': 'VULNERABILITY SCANNING',
  'RA-05 a':
    'Scans for vulnerabilities in the information system and hosted applications [Assignment: organization-defined frequency and/or randomly in accordance with organization-defined process] and when new vulnerabilities potentially affecting the system/applications are identified and reported;',
  'RA-05 b':
    'Employs vulnerability scanning tools and techniques that facilitate interoperability among tools and automate parts of the vulnerability management process by using standards for:',
  'RA-05 b 01':
    'Enumerating platforms, software flaws, and improper configurations;',
  'RA-05 b 02': 'Formatting checklists and test procedures; and',
  'RA-05 b 03': 'Measuring vulnerability impact;',
  'RA-05 c':
    'Analyzes vulnerability scan reports and results from security control assessments;',
  'RA-05 d':
    'Remediates legitimate vulnerabilities [Assignment: organization-defined response times] in accordance with an organizational assessment of risk; and',
  'RA-05 e':
    'Shares information obtained from the vulnerability scanning process and security control assessments with [Assignment: organization-defined personnel or roles] to help eliminate similar vulnerabilities in other information systems (i.e., systemic weaknesses or deficiencies).',
  'RA-05 01':
    'The organization employs vulnerability scanning tools that include the capability to readily update the information system vulnerabilities to be scanned.',
  'RA-05 02':
    'The organization updates the information system vulnerabilities scanned [Selection (one or more): [Assignment: organization-defined frequency]; prior to a new scan; when new vulnerabilities are identified and reported].',
  'RA-05 03':
    'The organization employs vulnerability scanning procedures that can identify the breadth and depth of coverage (i.e., information system components scanned and vulnerabilities checked).',
  'RA-05 04':
    'The organization determines what information about the information system is discoverable by adversaries and subsequently takes [Assignment: organization-defined corrective actions].',
  'RA-05 05':
    'The information system implements privileged access authorization to [Assignment: organization-identified information system components] for selected [Assignment: organization-defined vulnerability scanning activities].',
  'RA-05 06':
    'The organization employs automated mechanisms to compare the results of vulnerability scans over time to determine trends in information system vulnerabilities.',
  'RA-05 07': '[Withdrawn: Incorporated into CM-8].',
  'RA-05 08':
    'The organization reviews historic audit logs to determine if a vulnerability identified in the information system has been previously exploited.',
  'RA-05 09': '[Withdrawn: Incorporated into CA-8].',
  'RA-05 10':
    'The organization correlates the output from vulnerability scanning tools to determine the presence of multi-vulnerability/multi-hop attack vectors.',
  'RA-06':
    'The organization employs a technical surveillance countermeasures survey at [Assignment: organization-defined locations] [Selection (one or more): [Assignment: organization-defined frequency]; [Assignment: organization-defined events or indicators occur]].',
  'SA-01': 'SYSTEM AND SERVICES ACQUISITION POLICY AND PROCEDURES',
  'SA-01 a':
    'Develops, documents, and disseminates to [Assignment: organization-defined personnel or roles]:',
  'SA-01 a 01':
    'A system and services acquisition policy that addresses purpose, scope, roles, responsibilities, management commitment, coordination among organizational entities, and compliance; and',
  'SA-01 a 02':
    'Procedures to facilitate the implementation of the system and services acquisition policy and associated system and services acquisition controls; and',
  'SA-01 b': 'Reviews and updates the current:',
  'SA-01 b 01':
    'System and services acquisition policy [Assignment: organization-defined frequency]; and',
  'SA-01 b 02':
    'System and services acquisition procedures [Assignment: organization-defined frequency].',
  'SA-02': 'ALLOCATION OF RESOURCES',
  'SA-02 a':
    'Determines information security requirements for the information system or information system service in mission/business process planning;',
  'SA-02 b':
    'Determines, documents, and allocates the resources required to protect the information system or information system service as part of its capital planning and investment control process; and',
  'SA-02 c':
    'Establishes a discrete line item for information security in organizational programming and budgeting documentation.',
  'SA-03': 'SYSTEM DEVELOPMENT LIFE CYCLE',
  'SA-03 a':
    'Manages the information system using [Assignment: organization-defined system development life cycle] that incorporates information security considerations;',
  'SA-03 b':
    'Defines and documents information security roles and responsibilities throughout the system development life cycle;',
  'SA-03 c':
    'Identifies individuals having information security roles and responsibilities; and',
  'SA-03 d':
    'Integrates the organizational information security risk management process into system development life cycle activities.',
  'SA-04':
    'The organization includes the following requirements, descriptions, and criteria, explicitly or by reference, in the acquisition contract for the information system, system component, or information system service in accordance with applicable federal laws, Executive Orders, directives, policies, regulations, standards, guidelines, and organizational mission/business needs:',
  'SA-04 a': 'Security functional requirements;',
  'SA-04 b': 'Security strength requirements;',
  'SA-04 c': 'Security assurance requirements;',
  'SA-04 d': 'Security-related documentation requirements;',
  'SA-04 e': 'Requirements for protecting security-related documentation;',
  'SA-04 f':
    'Description of the information system development environment and environment in which the system is intended to operate; and',
  'SA-04 g': 'Acceptance criteria.',
  'SA-04 01':
    'The organization requires the developer of the information system, system component, or information system service to provide a description of the functional properties of the security controls to be employed.',
  'SA-04 02':
    'The organization requires the developer of the information system, system component, or information system service to provide design and implementation information for the security controls to be employed that includes: [Selection (one or more): security-relevant external system interfaces; high-level design; low-level design; source code or hardware schematics; [Assignment: organization-defined design/implementation information]] at [Assignment: organization-defined level of detail].',
  'SA-04 03':
    'The organization requires the developer of the information system, system component, or information system service to demonstrate the use of a system development life cycle that includes [Assignment: organization-defined state-of-the-practice system/security engineering methods, software development methods, testing/evaluation/validation techniques, and quality control processes].',
  'SA-04 04': '[Withdrawn: Incorporated into CM-8 (9)].',
  'SA-04 05':
    'The organization requires the developer of the information system, system component, or information system service to:',
  'SA-04 05 a':
    'Deliver the system, component, or service with [Assignment: organization-defined security configurations] implemented; and',
  'SA-04 05 b':
    'Use the configurations as the default for any subsequent system, component, or service reinstallation or upgrade.',
  'SA-04 06': 'USE OF INFORMATION ASSURANCE PRODUCTS',
  'SA-04 06 a':
    'Employs only government off-the-shelf (GOTS) or commercial off-the-shelf (COTS) information assurance (IA) and IA-enabled information technology products that compose an NSA-approved solution to protect classified information when the networks used to transmit the information are at a lower classification level than the information being transmitted; and',
  'SA-04 06 b':
    'Ensures that these products have been evaluated and/or validated by NSA or in accordance with NSA-approved procedures.',
  'SA-04 07': 'NIAP-APPROVED  PROTECTION PROFILES',
  'SA-04 07 a':
    'Limits the use of commercially provided information assurance (IA) and IA-enabled information technology products to those products that have been successfully evaluated against a National Information Assurance partnership (NIAP)-approved Protection Profile for a specific technology type, if such a profile exists; and',
  'SA-04 07 b':
    'Requires, if no NIAP-approved Protection Profile exists for a specific technology type but a commercially provided information technology product relies on cryptographic functionality to enforce its security policy, that the cryptographic module is FIPS-validated.',
  'SA-04 08':
    'The organization requires the developer of the information system, system component, or information system service to produce a plan for the continuous monitoring of security control effectiveness that contains [Assignment: organization-defined level of detail].',
  'SA-04 09':
    'The organization requires the developer of the information system, system component, or information system service to identify early in the system development life cycle, the functions, ports, protocols, and services intended for organizational use.',
  'SA-04 10':
    'The organization employs only information technology products on the FIPS 201-approved products list for Personal Identity Verification (PIV) capability implemented within organizational information systems.',
  'SA-05': 'INFORMATION SYSTEM DOCUMENTATION',
  'SA-05 a':
    'Obtains administrator documentation for the information system, system component, or information system service that describes:',
  'SA-05 a 01':
    'Secure configuration, installation, and operation of the system, component, or service;',
  'SA-05 a 02':
    'Effective use and maintenance of security functions/mechanisms; and',
  'SA-05 a 03':
    'Known vulnerabilities regarding configuration and use of administrative (i.e., privileged) functions;',
  'SA-05 b':
    'Obtains user documentation for the information system, system component, or information system service that describes:',
  'SA-05 b 01':
    'User-accessible security functions/mechanisms and how to effectively use those security functions/mechanisms;',
  'SA-05 b 02':
    'Methods for user interaction, which enables individuals to use the system, component, or service in a more secure manner; and',
  'SA-05 b 03':
    'User responsibilities in maintaining the security of the system, component, or service;',
  'SA-05 c':
    'Documents attempts to obtain information system, system component, or information system service documentation when such documentation is either unavailable or nonexistent and takes [Assignment: organization-defined actions] in response;',
  'SA-05 d':
    'Protects documentation as required, in accordance with the risk management strategy; and',
  'SA-05 e':
    'Distributes documentation to [Assignment: organization-defined personnel or roles].',
  'SA-05 01': '[Withdrawn: Incorporated into SA-4 (1)].',
  'SA-05 02': '[Withdrawn: Incorporated into SA-4 (2)].',
  'SA-05 03': '[Withdrawn: Incorporated into SA-4 (2)].',
  'SA-05 04': '[Withdrawn: Incorporated into SA-4 (2)].',
  'SA-05 05': '[Withdrawn: Incorporated into SA-4 (2)].',
  'SA-06': '[Withdrawn: Incorporated into CM-10 and SI-7].',
  'SA-07': '[Withdrawn: Incorporated into CM-11 and SI-7].',
  'SA-08':
    'The organization applies information system security engineering principles in the specification, design, development, implementation, and modification of the information system.',
  'SA-09': 'EXTERNAL INFORMATION SYSTEM SERVICES',
  'SA-09 a':
    'Requires that providers of external information system services comply with organizational information security requirements and employ [Assignment: organization-defined security controls] in accordance with applicable federal laws, Executive Orders, directives, policies, regulations, standards, and guidance;',
  'SA-09 b':
    'Defines and documents government oversight and user roles and responsibilities with regard  to external information system services; and',
  'SA-09 c':
    'Employs [Assignment: organization-defined processes, methods, and techniques] to monitor security control compliance by external service providers on an ongoing basis.',
  'SA-09 01': 'RISK ASSESSMENTS / ORGANIZATIONAL APPROVALS',
  'SA-09 01 a':
    'Conducts an organizational assessment of risk prior to the acquisition or outsourcing of dedicated information security services; and',
  'SA-09 01 b':
    'Ensures that the acquisition or outsourcing of dedicated information security services is approved by [Assignment: organization-defined personnel or roles].',
  'SA-09 02':
    'The organization requires providers of [Assignment: organization-defined external information system services] to identify the functions, ports, protocols, and other services required for the use of such services.',
  'SA-09 03':
    'The organization establishes, documents, and maintains trust relationships with external service providers based on [Assignment: organization-defined security requirements, properties, factors, or conditions defining acceptable trust relationships].',
  'SA-09 04':
    'The organization employs [Assignment: organization-defined security safeguards] to ensure that the interests of [Assignment: organization-defined external service providers] are consistent with and reflect organizational interests.',
  'SA-09 05':
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
  'SA-10 01':
    'The organization requires the developer of the information system, system component, or information system service to enable integrity verification of software and firmware components.',
  'SA-10 02':
    'The organization provides an alternate configuration management process using organizational personnel in the absence of a dedicated developer configuration management team.',
  'SA-10 03':
    'The organization requires the developer of the information system, system component, or information system service to enable integrity verification of hardware components.',
  'SA-10 04':
    'The organization requires the developer of the information system, system component, or information system service to employ tools for comparing newly generated versions of security-relevant hardware descriptions and software/firmware source and object code with previous versions.',
  'SA-10 05':
    'The organization requires the developer of the information system, system component, or information system service to maintain the integrity of the mapping between the  master build data (hardware drawings and software/firmware code) describing the current version of security-relevant hardware, software, and firmware and the on-site master copy of the data for the current version.',
  'SA-10 06':
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
  'SA-11 01':
    'The organization requires the developer of the information system, system component, or information system service to employ static code analysis tools to identify common flaws and document the results of the analysis.',
  'SA-11 02':
    'The organization requires the developer of the information system, system component, or information system service to perform threat and vulnerability analyses and subsequent testing/evaluation of the as-built system, component, or service.',
  'SA-11 03': 'INDEPENDENT VERIFICATION OF ASSESSMENT PLANS / EVIDENCE',
  'SA-11 03 a':
    'Requires an independent agent satisfying [Assignment: organization-defined independence criteria] to verify the correct implementation of the developer security assessment plan and the evidence produced during security testing/evaluation; and',
  'SA-11 03 b':
    'Ensures that the independent agent is either provided with sufficient information to complete the verification process or granted the authority to obtain such information.',
  'SA-11 04':
    'The organization requires the developer of the information system, system component, or information system service to perform a manual code review of [Assignment: organization-defined specific code] using [Assignment: organization-defined processes, procedures, and/or techniques].',
  'SA-11 05':
    'The organization requires the developer of the information system, system component, or information system service to perform penetration testing at [Assignment: organization-defined breadth/depth] and with [Assignment: organization-defined constraints].',
  'SA-11 06':
    'The organization requires the developer of the information system, system component, or information system service to perform attack surface reviews.',
  'SA-11 07':
    'The organization requires the developer of the information system, system component, or information system service to verify that the scope of security testing/evaluation provides complete coverage of required security controls at [Assignment: organization-defined depth of testing/evaluation].',
  'SA-11 08':
    'The organization requires the developer of the information system, system component, or information system service to employ dynamic code analysis tools to identify common flaws and document the results of the analysis.',
  'SA-12':
    'The organization protects against supply chain threats to the information system, system component, or information system service by employing [Assignment: organization-defined security safeguards] as part of a comprehensive, defense-in-breadth information security strategy.',
  'SA-12 01':
    'The organization employs [Assignment: organization-defined tailored acquisition strategies, contract tools, and procurement methods] for the purchase of the information system, system component, or information system service from suppliers.',
  'SA-12 02':
    'The organization conducts a supplier review prior to entering into a contractual agreement to acquire the information system, system component, or information system service.',
  'SA-12 03': '[Withdrawn: Incorporated into SA-12 (1)].',
  'SA-12 04': '[Withdrawn: Incorporated into SA-12 (13)].',
  'SA-12 05':
    'The organization employs [Assignment: organization-defined security safeguards] to limit harm from potential adversaries identifying and targeting the organizational supply chain.',
  'SA-12 06': '[Withdrawn: Incorporated into SA-12 (1)].',
  'SA-12 07':
    'The organization conducts an assessment of the information system, system component, or information system service prior to selection, acceptance, or update.',
  'SA-12 08':
    'The organization uses all-source intelligence analysis of suppliers and potential suppliers of the information system, system component, or information system service.',
  'SA-12 09':
    'The organization employs [Assignment: organization-defined Operations Security (OPSEC) safeguards] in accordance with classification guides to protect supply chain-related information for the information system, system component, or information system service.',
  'SA-12 10':
    'The organization employs [Assignment: organization-defined security safeguards] to validate that the information system or system component received is genuine and has not been altered.',
  'SA-12 11':
    'The organization employs [Selection (one or more): organizational analysis, independent third-party analysis, organizational penetration testing, independent third-party penetration testing] of [Assignment: organization-defined supply chain elements, processes, and actors] associated with the information system, system component, or information system service.',
  'SA-12 12':
    'The organization establishes inter-organizational agreements and procedures with entities involved in the supply chain for the information system, system component, or information system service.',
  'SA-12 13':
    'The organization employs [Assignment: organization-defined security safeguards] to ensure an adequate supply of [Assignment: organization-defined critical information system components].',
  'SA-12 14':
    'The organization establishes and retains unique identification of [Assignment: organization-defined supply chain elements, processes, and actors] for the information system, system component, or information system service.',
  'SA-12 15':
    'The organization establishes a process to address weaknesses or deficiencies in supply chain elements identified during independent or organizational assessments of such elements.',
  'SA-13': 'TRUSTWORTHINESS',
  'SA-13 a':
    'Describes the trustworthiness required in the [Assignment: organization-defined information system, information system component, or information system service] supporting its critical missions/business functions; and',
  'SA-13 b':
    'Implements [Assignment: organization-defined assurance overlay] to achieve such trustworthiness.',
  'SA-14':
    'The organization identifies critical information system components and functions by performing a criticality analysis for [Assignment: organization-defined information systems, information system components, or information system services] at [Assignment: organization-defined decision points in the system development life cycle].',
  'SA-14 01': '[Withdrawn: Incorporated into SA-20].',
  'SA-15': 'DEVELOPMENT PROCESS, STANDARDS, AND TOOLS',
  'SA-15 a':
    'Requires the developer of the information system, system component, or information system service to follow a documented development process that:',
  'SA-15 a 01': 'Explicitly addresses security requirements;',
  'SA-15 a 02':
    'Identifies the standards and tools used in the development process;',
  'SA-15 a 03':
    'Documents the specific tool options and tool configurations used in the development process; and',
  'SA-15 a 04':
    'Documents, manages, and ensures the integrity of changes to the process and/or tools used in development; and',
  'SA-15 b':
    'Reviews the development process, standards, tools, and tool options/configurations [Assignment: organization-defined frequency] to determine if the process, standards, tools, and tool options/configurations selected and employed can satisfy [Assignment: organization-defined security requirements].',
  'SA-15 01':
    'The organization requires the developer of the information system, system component, or information system service to:',
  'SA-15 01 a':
    'Define quality metrics at the beginning of the development process; and',
  'SA-15 01 b':
    'Provide evidence of meeting the quality metrics [Selection (one or more): [Assignment: organization-defined frequency]; [Assignment: organization-defined program review milestones]; upon delivery].',
  'SA-15 02':
    'The organization requires the developer of the information system, system component, or information system service to select and employ a security tracking tool for use during the development process.',
  'SA-15 03':
    'The organization requires the developer of the information system, system component, or information system service to perform a criticality analysis at [Assignment: organization-defined breadth/depth] and at [Assignment: organization-defined decision points in the system development life cycle].',
  'SA-15 04':
    'The organization requires that developers perform threat modeling and a vulnerability analysis for the information system at [Assignment: organization-defined breadth/depth] that:',
  'SA-15 04 a':
    'Uses [Assignment: organization-defined information concerning impact, environment of operations, known or assumed threats, and acceptable risk levels];',
  'SA-15 04 b':
    'Employs [Assignment: organization-defined tools and methods]; and',
  'SA-15 04 c':
    'Produces evidence that meets [Assignment: organization-defined acceptance criteria].',
  'SA-15 05':
    'The organization requires the developer of the information system, system component, or information system service to reduce attack surfaces to [Assignment: organization-defined thresholds].',
  'SA-15 06':
    'The organization requires the developer of the information system, system component, or information system service to implement an explicit process to continuously improve the development process.',
  'SA-15 07':
    'The organization requires the developer of the information system, system component, or information system service to:',
  'SA-15 07 a':
    'Perform an automated vulnerability analysis using [Assignment: organization-defined tools];',
  'SA-15 07 b':
    'Determine the exploitation potential for discovered vulnerabilities;',
  'SA-15 07 c':
    'Determine potential risk mitigations for delivered vulnerabilities; and',
  'SA-15 07 d':
    'Deliver the outputs of the tools and results of the analysis to [Assignment: organization-defined personnel or roles].',
  'SA-15 08':
    'The organization requires the developer of the information system, system component, or information system service to use threat modeling and vulnerability analyses from similar systems, components, or services to inform the current development process.',
  'SA-15 09':
    'The organization approves, documents, and controls the use of live data in development and test environments for the information system, system component, or information system service.',
  'SA-15 10':
    'The organization requires the developer of the information system, system component, or information system service to provide an incident response plan.',
  'SA-15 11':
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
  'SA-17 01':
    'The organization requires the developer of the information system, system component, or information system service to:',
  'SA-17 01 a':
    'Produce, as an integral part of the development process, a formal policy model describing the [Assignment: organization-defined elements of organizational security policy] to be enforced; and',
  'SA-17 01 b':
    'Prove that the formal policy model is internally consistent and sufficient to enforce the defined elements of the organizational security policy when implemented.',
  'SA-17 02':
    'The organization requires the developer of the information system, system component, or information system service to:',
  'SA-17 02 a':
    'Define security-relevant hardware, software, and firmware; and',
  'SA-17 02 b':
    'Provide a rationale that the definition for security-relevant hardware, software, and firmware is complete.',
  'SA-17 03':
    'The organization requires the developer of the information system, system component, or information system service to:',
  'SA-17 03 a':
    'Produce, as an integral part of the development process, a formal top-level specification that specifies the interfaces to security-relevant hardware, software, and firmware in terms of exceptions, error messages, and effects;',
  'SA-17 03 b':
    'Show via proof to the extent feasible with additional informal demonstration as necessary, that the formal top-level specification is consistent with the formal policy model;',
  'SA-17 03 c':
    'Show via informal demonstration, that the formal top-level specification completely covers the interfaces to security-relevant hardware, software, and firmware;',
  'SA-17 03 d':
    'Show that the formal top-level specification is an accurate description of the implemented security-relevant hardware, software, and firmware; and',
  'SA-17 03 e':
    'Describe the security-relevant hardware, software, and firmware mechanisms not addressed in the formal top-level specification but strictly internal to the security-relevant hardware, software, and firmware.',
  'SA-17 04':
    'The organization requires the developer of the information system, system component, or information system service to:',
  'SA-17 04 a':
    'Produce, as an integral part of the development process, an informal descriptive top-level specification that specifies the interfaces to security-relevant hardware, software, and firmware in terms of exceptions, error messages, and effects;',
  'SA-17 04 b':
    'Show via [Selection: informal demonstration, convincing argument with formal methods as feasible] that the descriptive top-level specification is consistent with the formal policy model;',
  'SA-17 04 c':
    'Show via informal demonstration, that the descriptive top-level specification completely  covers the interfaces to security-relevant hardware, software, and firmware;',
  'SA-17 04 d':
    'Show that the descriptive top-level specification is an accurate description of the interfaces to security-relevant hardware, software, and firmware; and',
  'SA-17 04 e':
    'Describe the security-relevant hardware, software, and firmware mechanisms not addressed in the descriptive top-level specification but strictly internal to the security-relevant hardware, software, and firmware.',
  'SA-17 05':
    'The organization requires the developer of the information system, system component, or information system service to:',
  'SA-17 05 a':
    'Design and structure the security-relevant hardware, software, and firmware to use a complete, conceptually simple protection mechanism with precisely defined semantics; and',
  'SA-17 05 b':
    'Internally structure the security-relevant hardware, software, and firmware with specific regard for this mechanism.',
  'SA-17 06':
    'The organization requires the developer of the information system, system component, or information system service to structure security-relevant hardware, software, and firmware to facilitate testing.',
  'SA-17 07':
    'The organization requires the developer of the information system, system component, or information system service to structure security-relevant hardware, software, and firmware to facilitate controlling access with least privilege.',
  'SA-18':
    'The organization implements a tamper protection program for the information system, system component, or information system service.',
  'SA-18 01':
    'The organization employs anti-tamper technologies and techniques during multiple phases in the system development life cycle including design, development, integration, operations, and maintenance.',
  'SA-18 02':
    'The organization inspects [Assignment: organization-defined information systems, system components, or devices] [Selection (one or more): at random; at [Assignment: organization-defined frequency], upon [Assignment: organization-defined indications of need for inspection]] to detect tampering.',
  'SA-19': 'COMPONENT AUTHENTICITY',
  'SA-19 a':
    'Develops and implements anti-counterfeit policy and procedures that include the means to detect and prevent counterfeit components from entering the information system; and',
  'SA-19 b':
    'Reports counterfeit information system components to [Selection (one or more): source of counterfeit component; [Assignment: organization-defined external reporting organizations]; [Assignment: organization-defined personnel or roles]].',
  'SA-19 01':
    'The organization trains [Assignment: organization-defined personnel or roles] to detect counterfeit information system components (including hardware, software, and firmware).',
  'SA-19 02':
    'The organization maintains configuration control over [Assignment: organization-defined information system components] awaiting service/repair and serviced/repaired components awaiting return to service.',
  'SA-19 03':
    'The organization disposes of information system components using [Assignment: organization-defined techniques and methods].',
  'SA-19 04':
    'The organization scans for counterfeit information system components [Assignment: organization-defined frequency].',
  'SA-20':
    'The organization re-implements or custom develops [Assignment: organization-defined critical information system components].',
  'SA-21':
    'The organization requires that the developer of [Assignment: organization-defined information system, system component, or information system service]:',
  'SA-21 a':
    'Have appropriate access authorizations as determined by assigned [Assignment: organization-defined official government duties]; and',
  'SA-21 b':
    'Satisfy [Assignment: organization-defined additional personnel screening criteria].',
  'SA-21 01':
    'The organization requires the developer of the information system, system component, or information system service take [Assignment: organization-defined actions] to ensure that the required access authorizations and screening criteria are satisfied.',
  'SA-22': 'UNSUPPORTED SYSTEM COMPONENTS',
  'SA-22 a':
    'Replaces information system components when support for the components is no longer available from the developer, vendor, or manufacturer; and',
  'SA-22 b':
    'Provides justification and documents approval for the continued use of unsupported system components required to satisfy mission/business needs.',
  'SA-22 01':
    'The organization provides [Selection (one or more): in-house support; [Assignment: organization-defined support from external providers]] for unsupported information system components.',
  'SC-01': 'SYSTEM AND COMMUNICATIONS PROTECTION POLICY AND PROCEDURES',
  'SC-01 a':
    'Develops, documents, and disseminates to [Assignment: organization-defined personnel or roles]:',
  'SC-01 a 01':
    'A system and communications protection policy that addresses purpose, scope, roles, responsibilities, management commitment, coordination among organizational entities, and compliance; and',
  'SC-01 a 02':
    'Procedures to facilitate the implementation of the system and communications protection policy and associated system and communications protection controls; and',
  'SC-01 b': 'Reviews and updates the current:',
  'SC-01 b 01':
    'System and communications protection policy [Assignment: organization-defined frequency]; and',
  'SC-01 b 02':
    'System and communications protection procedures [Assignment: organization-defined frequency].',
  'SC-02':
    'The information system separates user functionality (including user interface services) from information system management functionality.',
  'SC-02 01':
    'The information system prevents the presentation of information system management-related functionality at an interface for non-privileged users.',
  'SC-03':
    'The information system isolates security functions from nonsecurity functions.',
  'SC-03 01':
    'The information system utilizes underlying hardware separation mechanisms to implement security function isolation.',
  'SC-03 02':
    'The information system isolates security functions enforcing access and information flow control from nonsecurity functions and from other security functions.',
  'SC-03 03':
    'The organization minimizes the number of nonsecurity functions included within the isolation boundary containing security functions.',
  'SC-03 04':
    'The organization implements security functions as largely independent modules that maximize internal cohesiveness within modules and minimize coupling between modules.',
  'SC-03 05':
    'The organization implements security functions as a layered structure minimizing interactions between layers of the design and avoiding any dependence by lower layers on the functionality or correctness of higher layers.',
  'SC-04':
    'The information system prevents unauthorized and unintended information transfer via shared system resources.',
  'SC-04 01': '[Withdrawn: Incorporated into SC-4].',
  'SC-04 02':
    'The information system prevents unauthorized information transfer via shared resources in accordance with [Assignment: organization-defined procedures] when system processing explicitly switches between different information classification levels or security categories.',
  'SC-05':
    'The information system protects against or limits the effects of the following types of denial of service attacks: [Assignment: organization-defined types of denial of service attacks or references to sources for such information] by employing [Assignment: organization-defined security safeguards].',
  'SC-05 01':
    'The information system restricts the ability of individuals to launch [Assignment: organization-defined denial of service attacks] against other information systems.',
  'SC-05 02':
    'The information system manages excess capacity, bandwidth, or other redundancy to limit the effects of information flooding denial of service attacks.',
  'SC-05 03': 'DETECTION / MONITORING',
  'SC-05 03 a':
    'Employs [Assignment: organization-defined monitoring tools] to detect indicators of denial of service attacks against the information system; and',
  'SC-05 03 b':
    'Monitors [Assignment: organization-defined information system resources] to determine if sufficient resources exist to prevent effective denial of service attacks.',
  'SC-06':
    'The information system protects the availability of resources by allocating [Assignment: organization-defined resources] by [Selection (one or more); priority; quota; [Assignment: organization-defined security safeguards]].',
  'SC-07': 'The information system:',
  'SC-07 a':
    'Monitors and controls communications at the external boundary of the system and at key internal boundaries within the system;',
  'SC-07 b':
    'Implements subnetworks for publicly accessible system components that are [Selection: physically; logically] separated from internal organizational networks; and',
  'SC-07 c':
    'Connects to external networks or information systems only through managed interfaces consisting of boundary protection devices arranged in accordance with an organizational security architecture.',
  'SC-07 01': '[Withdrawn: Incorporated into SC-7].',
  'SC-07 02': '[Withdrawn: Incorporated into SC-7].',
  'SC-07 03':
    'The organization limits the number of external network connections to the information system.',
  'SC-07 04': 'EXTERNAL TELECOMMUNICATIONS SERVICES',
  'SC-07 04 a':
    'Implements a managed interface for each external telecommunication service;',
  'SC-07 04 b': 'Establishes a traffic flow policy for each managed interface;',
  'SC-07 04 c':
    'Protects the confidentiality and integrity of the information being transmitted across each interface;',
  'SC-07 04 d':
    'Documents each exception to the traffic flow policy with a supporting mission/business need and duration of that need; and',
  'SC-07 04 e':
    'Reviews exceptions to the traffic flow policy [Assignment: organization-defined frequency] and removes exceptions that are no longer supported by an explicit mission/business need.',
  'SC-07 05':
    'The information system at managed interfaces denies network communications traffic by default and allows network communications traffic by exception (i.e., deny all, permit by exception).',
  'SC-07 06': '[Withdrawn: Incorporated into SC-7 (18)].',
  'SC-07 07':
    'The information system, in conjunction with a remote device, prevents the device from simultaneously establishing non-remote connections with the system and communicating via some other connection to resources in external networks.',
  'SC-07 08':
    'The information system routes [Assignment: organization-defined internal communications traffic] to [Assignment: organization-defined external networks] through authenticated proxy servers at managed interfaces.',
  'SC-07 09': 'The information system:',
  'SC-07 09 a':
    'Detects and denies outgoing communications traffic posing a threat to external information systems; and',
  'SC-07 09 b':
    'Audits the identity of internal users associated with denied communications.',
  'SC-07 10':
    'The organization prevents the unauthorized exfiltration of information across managed interfaces.',
  'SC-07 11':
    'The information system only allows incoming communications from [Assignment: organization-defined authorized sources] to be routed to [Assignment: organization-defined authorized destinations].',
  'SC-07 12':
    'The organization implements [Assignment: organization-defined host-based boundary protection mechanisms] at [Assignment: organization-defined information system components].',
  'SC-07 13':
    'The organization isolates [Assignment: organization-defined information security tools, mechanisms, and support components] from other internal information system components by implementing physically separate subnetworks with managed interfaces to other components of the system.',
  'SC-07 14':
    'The organization protects against unauthorized physical connections at [Assignment: organization-defined managed interfaces].',
  'SC-07 15':
    'The information system routes all networked, privileged accesses through a dedicated, managed interface for purposes of access control and auditing.',
  'SC-07 16':
    'The information system prevents discovery of specific system components composing a managed interface.',
  'SC-07 17': 'The information system enforces adherence to protocol formats.',
  'SC-07 18':
    'The information system fails securely in the event of an operational failure of a boundary protection device.',
  'SC-07 19':
    'The information system blocks both inbound and outbound communications traffic between [Assignment: organization-defined communication clients] that are independently configured by end users and external service providers.',
  'SC-07 20':
    'The information system provides the capability to dynamically isolate/segregate [Assignment: organization-defined information system components] from other components of the system.',
  'SC-07 21':
    'The organization employs boundary protection mechanisms to separate [Assignment: organization-defined information system components] supporting [Assignment: organization-defined missions and/or business functions].',
  'SC-07 22':
    'The information system implements separate network addresses (i.e., different subnets) to connect to systems in different security domains.',
  'SC-07 23':
    'The information system disables feedback to senders on protocol format validation failure.',
  'SC-08':
    'The information system protects the [Selection (one or more): confidentiality; integrity] of transmitted information.',
  'SC-08 01':
    'The information system implements cryptographic mechanisms to [Selection (one or more): prevent unauthorized disclosure of information; detect changes to information] during transmission unless otherwise protected by [Assignment: organization-defined alternative physical safeguards].',
  'SC-08 02':
    'The information system maintains the [Selection (one or more): confidentiality; integrity] of information during preparation for transmission and during reception.',
  'SC-08 03':
    'The information system implements cryptographic mechanisms to protect message externals unless otherwise protected by [Assignment: organization-defined alternative physical safeguards].',
  'SC-08 04':
    'The information system implements cryptographic mechanisms to conceal or randomize communication patterns unless otherwise protected by [Assignment: organization-defined alternative physical safeguards].',
  'SC-09': '[Withdrawn: Incorporated into SC-8].',
  'SC-10':
    'The information system terminates the network connection associated with a communications session at the end of the session or after [Assignment: organization-defined time period] of inactivity.',
  'SC-11':
    'The information system establishes a trusted communications path between the user and the following security functions of the system: [Assignment: organization-defined security functions to include at a minimum, information system authentication and re-authentication].',
  'SC-11 01':
    'The information system provides a trusted communications path that is logically isolated and distinguishable from other paths.',
  'SC-12':
    'The organization establishes and manages cryptographic keys for required cryptography employed within the information system in accordance with [Assignment: organization-defined requirements for key generation, distribution, storage, access, and destruction].',
  'SC-12 01':
    'The organization maintains availability of information in the event of the loss of cryptographic keys by users.',
  'SC-12 02':
    'The organization produces, controls, and distributes symmetric cryptographic keys using [Selection: NIST FIPS-compliant; NSA-approved] key management technology and processes.',
  'SC-12 03':
    "The organization produces, controls, and distributes asymmetric cryptographic keys using [Selection: NSA-approved key management technology and processes; approved PKI Class 3 certificates or prepositioned keying material; approved PKI Class 3 or Class 4 certificates and hardware security tokens that protect the user's private key].",
  'SC-12 04': '[Withdrawn: Incorporated into SC-12].',
  'SC-12 05': '[Withdrawn: Incorporated into SC-12].',
  'SC-13':
    'The information system implements [Assignment: organization-defined cryptographic uses and type of cryptography required for each use] in accordance with applicable federal laws, Executive Orders, directives, policies, regulations, and standards.',
  'SC-13 01': '[Withdrawn: Incorporated into SC-13].',
  'SC-13 02': '[Withdrawn: Incorporated into SC-13].',
  'SC-13 03': '[Withdrawn: Incorporated into SC-13].',
  'SC-13 04': '[Withdrawn: Incorporated into SC-13].',
  'SC-14':
    '[Withdrawn: Capability provided by AC-2, AC-3, AC-5, AC-6, SI-3, SI-4, SI-5, SI-7, SI-10].',
  'SC-15': 'The information system:',
  'SC-15 a':
    'Prohibits remote activation of collaborative computing devices with the following exceptions: [Assignment: organization-defined exceptions where remote activation is to be allowed]; and',
  'SC-15 b':
    'Provides an explicit indication of use to users physically present at the devices.',
  'SC-15 01':
    'The information system provides physical disconnect of collaborative computing devices in a manner that supports ease of use.',
  'SC-15 02': '[Withdrawn: Incorporated into SC-7].',
  'SC-15 03':
    'The organization disables or removes collaborative computing devices from [Assignment: organization-defined information systems or information system components] in [Assignment: organization-defined secure work areas].',
  'SC-15 04':
    'The information system provides an explicit indication of current participants in [Assignment: organization-defined online meetings and teleconferences].',
  'SC-16':
    'The information system associates [Assignment: organization-defined security attributes] with information exchanged between information systems and between system components.',
  'SC-16 01':
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
  'SC-18 01':
    'The information system identifies [Assignment: organization-defined unacceptable mobile code] and takes [Assignment: organization-defined corrective actions].',
  'SC-18 02':
    'The organization ensures that the acquisition, development, and use of mobile code to be deployed in the information system meets [Assignment: organization-defined mobile code requirements].',
  'SC-18 03':
    'The information system prevents the download and execution of [Assignment: organization-defined unacceptable mobile code].',
  'SC-18 04':
    'The information system prevents the automatic execution of mobile code in [Assignment: organization-defined software applications] and enforces [Assignment: organization-defined actions] prior to executing the code.',
  'SC-18 05':
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
  'SC-20 01': '[Withdrawn: Incorporated into SC-20].',
  'SC-20 02':
    'The information system provides data origin and integrity protection artifacts for internal name/address resolution queries.',
  'SC-21':
    'The information system requests and performs data origin authentication and data integrity verification on the name/address resolution responses the system receives from authoritative sources.',
  'SC-21 01': '[Withdrawn: Incorporated into SC-21].',
  'SC-22':
    'The information systems that collectively provide name/address resolution service for an organization are fault-tolerant and implement internal/external role separation.',
  'SC-23':
    'The information system protects the authenticity of communications sessions.',
  'SC-23 01':
    'The information system invalidates session identifiers upon user logout or other session termination.',
  'SC-23 02': '[Withdrawn: Incorporated into AC-12 (1)].',
  'SC-23 03':
    'The information system generates a unique session identifier for each session with [Assignment: organization-defined randomness requirements] and recognizes only session identifiers that are system-generated.',
  'SC-23 04': '[Withdrawn: Incorporated into SC-23 (3)].',
  'SC-23 05':
    'The information system only allows the use of [Assignment: organization-defined certificate authorities] for verification of the establishment of protected sessions.',
  'SC-24':
    'The information system fails to a [Assignment: organization-defined known-state] for [Assignment: organization-defined types of failures] preserving [Assignment: organization-defined system state information] in failure.',
  'SC-25':
    'The organization employs [Assignment: organization-defined information system components] with minimal functionality and information storage.',
  'SC-26':
    'The information system includes components specifically designed to be the target of malicious attacks for the purpose of detecting, deflecting, and analyzing such attacks.',
  'SC-26 01': '[Withdrawn: Incorporated into SC-35].',
  'SC-27':
    'The information system includes: [Assignment: organization-defined platform-independent applications].',
  'SC-28':
    'The information system protects the [Selection (one or more): confidentiality; integrity] of [Assignment: organization-defined information at rest].',
  'SC-28 01':
    'The information system implements cryptographic mechanisms to prevent unauthorized disclosure and modification of [Assignment: organization-defined information] on [Assignment: organization-defined information system components].',
  'SC-28 02':
    'The organization removes from online storage and stores off-line in a secure location [Assignment: organization-defined information].',
  'SC-29':
    'The organization employs a diverse set of information technologies for [Assignment: organization-defined information system components] in the implementation of the information system.',
  'SC-29 01':
    'The organization employs virtualization techniques to support the deployment of a diversity of operating systems and applications that are changed [Assignment: organization-defined frequency].',
  'SC-30':
    'The organization employs [Assignment: organization-defined concealment and misdirection techniques] for [Assignment: organization-defined information systems] at [Assignment: organization-defined time periods] to confuse and mislead adversaries.',
  'SC-30 01': '[Withdrawn: Incorporated into SC-29 (1)].',
  'SC-30 02':
    'The organization employs [Assignment: organization-defined techniques] to introduce randomness into organizational operations and assets.',
  'SC-30 03':
    'The organization changes the location of [Assignment: organization-defined processing and/or storage] [Selection: [Assignment: organization-defined time frequency]; at random time intervals]].',
  'SC-30 04':
    'The organization employs realistic, but misleading information in [Assignment: organization-defined information system components] with regard to its security state or posture.',
  'SC-30 05':
    'The organization employs [Assignment: organization-defined techniques] to hide or conceal [Assignment: organization-defined information system components].',
  'SC-31': 'COVERT CHANNEL ANALYSIS',
  'SC-31 a':
    'Performs a covert channel analysis to identify those aspects of communications within the information system that are potential avenues for covert [Selection (one or more): storage; timing] channels; and',
  'SC-31 b': 'Estimates the maximum bandwidth of those channels.',
  'SC-31 01':
    'The organization tests a subset of the identified covert channels to determine which channels are exploitable.',
  'SC-31 02':
    'The organization reduces the maximum bandwidth for identified covert [Selection (one or more); storage; timing] channels to [Assignment: organization-defined values].',
  'SC-31 03':
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
  'SC-34 01':
    'The organization employs [Assignment: organization-defined information system components] with no writeable storage that is persistent across component restart or power on/off.',
  'SC-34 02':
    'The organization protects the integrity of information prior to storage on read-only media and controls the media after such information has been recorded onto the media.',
  'SC-34 03': 'HARDWARE-BASED PROTECTION',
  'SC-34 03 a':
    'Employs hardware-based, write-protect for [Assignment: organization-defined information system firmware components]; and',
  'SC-34 03 b':
    'Implements specific procedures for [Assignment: organization-defined authorized individuals] to manually disable hardware write-protect for firmware modifications and re-enable the write-protect prior to returning to operational mode.',
  'SC-35':
    'The information system includes components that proactively seek to identify malicious websites and/or web-based malicious code.',
  'SC-36':
    'The organization distributes [Assignment: organization-defined processing and storage] across multiple physical locations.',
  'SC-36 01':
    'The organization employs polling techniques to identify potential faults, errors, or compromises to [Assignment: organization-defined distributed processing and storage components].',
  'SC-37':
    'The organization employs [Assignment: organization-defined out-of-band channels] for the physical delivery or electronic transmission of [Assignment: organization-defined information, information system components, or devices] to [Assignment: organization-defined individuals or information systems].',
  'SC-37 01':
    'The organization employs [Assignment: organization-defined security safeguards] to ensure that only [Assignment: organization-defined individuals or information systems] receive the [Assignment: organization-defined information, information system components, or devices].',
  'SC-38':
    'The organization employs [Assignment: organization-defined operations security safeguards] to protect key organizational information throughout the system development life cycle.',
  'SC-39':
    'The information system maintains a separate execution domain for each executing process.',
  'SC-39 01':
    'The information system implements underlying hardware separation mechanisms to facilitate process separation.',
  'SC-39 02':
    'The information system maintains a separate execution domain for each thread in [Assignment: organization-defined multi-threaded processing].',
  'SC-40':
    'The information system protects external and internal [Assignment: organization-defined wireless links] from [Assignment: organization-defined types of signal parameter attacks or references to sources for such attacks].',
  'SC-40 01':
    'The information system implements cryptographic mechanisms that achieve [Assignment: organization-defined level of protection] against the effects of intentional electromagnetic interference.',
  'SC-40 02':
    'The information system implements cryptographic mechanisms to reduce the detection potential of wireless links to [Assignment: organization-defined level of reduction].',
  'SC-40 03':
    'The information system implements cryptographic mechanisms to identify and reject wireless transmissions that are deliberate attempts to achieve imitative or manipulative communications deception based on signal parameters.',
  'SC-40 04':
    'The information system implements cryptographic mechanisms to prevent the identification of [Assignment: organization-defined wireless transmitters] by using the transmitter signal parameters.',
  'SC-41':
    'The organization physically disables or removes [Assignment: organization-defined connection ports or input/output devices] on [Assignment: organization-defined information systems or information system components].',
  'SC-42': 'The information system:',
  'SC-42 a':
    'Prohibits the remote activation of environmental sensing capabilities with the following exceptions: [Assignment: organization-defined exceptions where remote activation of sensors is allowed]; and',
  'SC-42 b':
    'Provides an explicit indication of sensor use to [Assignment: organization-defined class of users].',
  'SC-42 01':
    'The organization ensures that the information system is configured so that data or information collected by the [Assignment: organization-defined sensors] is only reported to authorized individuals or roles.',
  'SC-42 02':
    'The organization employs the following measures: [Assignment: organization-defined measures], so that data or information collected by [Assignment: organization-defined sensors] is only used for authorized purposes.',
  'SC-42 03':
    'The organization prohibits the use of devices possessing [Assignment: organization-defined environmental sensing capabilities] in [Assignment: organization-defined facilities, areas, or systems].',
  'SC-43': 'USAGE RESTRICTIONS',
  'SC-43 a':
    'Establishes usage restrictions and implementation guidance for [Assignment: organization-defined information system components] based on the potential to cause damage to the information system if used maliciously; and',
  'SC-43 b':
    'Authorizes, monitors, and controls the use of such components within the information system.',
  'SC-44':
    'The organization employs a detonation chamber capability within [Assignment: organization-defined information system, system component, or location].',
  'SI-01': 'SYSTEM AND INFORMATION INTEGRITY POLICY AND PROCEDURES',
  'SI-01 a':
    'Develops, documents, and disseminates to [Assignment: organization-defined personnel or roles]:',
  'SI-01 a 01':
    'A system and information integrity policy that addresses purpose, scope, roles, responsibilities, management commitment, coordination among organizational entities, and compliance; and',
  'SI-01 a 02':
    'Procedures to facilitate the implementation of the system and information integrity policy and associated system and information integrity controls; and',
  'SI-01 b': 'Reviews and updates the current:',
  'SI-01 b 01':
    'System and information integrity policy [Assignment: organization-defined frequency]; and',
  'SI-01 b 02':
    'System and information integrity procedures [Assignment: organization-defined frequency].',
  'SI-02': 'FLAW REMEDIATION',
  'SI-02 a': 'Identifies, reports, and corrects information system flaws;',
  'SI-02 b':
    'Tests software and firmware updates related to flaw remediation for effectiveness and potential side effects before installation;',
  'SI-02 c':
    'Installs security-relevant software and firmware updates within [Assignment: organization-defined time period] of the release of the updates; and',
  'SI-02 d':
    'Incorporates flaw remediation into the organizational configuration management process.',
  'SI-02 01':
    'The organization centrally manages the flaw remediation process.',
  'SI-02 02':
    'The organization employs automated mechanisms [Assignment: organization-defined frequency] to determine the state of information system components with regard to flaw remediation.',
  'SI-02 03': 'TIME TO REMEDIATE FLAWS / BENCHMARKS FOR CORRECTIVE ACTIONS',
  'SI-02 03 a':
    'Measures the time between flaw identification and flaw remediation; and',
  'SI-02 03 b':
    'Establishes [Assignment: organization-defined benchmarks] for taking corrective actions.',
  'SI-02 04': '[Withdrawn: Incorporated into SI-2].',
  'SI-02 05':
    'The organization installs [Assignment: organization-defined security-relevant software and firmware updates] automatically to [Assignment: organization-defined information system components].',
  'SI-02 06':
    'The organization removes [Assignment: organization-defined software and firmware components] after updated versions have been installed.',
  'SI-03': 'MALICIOUS CODE PROTECTION',
  'SI-03 a':
    'Employs malicious code protection mechanisms at information system entry and exit points to detect and eradicate malicious code;',
  'SI-03 b':
    'Updates malicious code protection mechanisms whenever new releases are available in accordance with organizational configuration management policy and procedures;',
  'SI-03 c': 'Configures malicious code protection mechanisms to:',
  'SI-03 c 01':
    'Perform periodic scans of the information system [Assignment: organization-defined frequency] and real-time scans of files from external sources at [Selection (one or more); endpoint; network entry/exit points] as the files are downloaded, opened, or executed in accordance with organizational security policy; and',
  'SI-03 c 02':
    '[Selection (one or more): block malicious code; quarantine malicious code;  send alert to administrator; [Assignment: organization-defined action]] in response to malicious code detection; and',
  'SI-03 d':
    'Addresses the receipt of false positives during malicious code detection and eradication and the resulting potential impact on the availability of the information system.',
  'SI-03 01':
    'The organization centrally manages malicious code protection mechanisms.',
  'SI-03 02':
    'The information system automatically updates malicious code protection mechanisms.',
  'SI-03 03': '[Withdrawn: Incorporated into AC-6 (10)].',
  'SI-03 04':
    'The information system updates malicious code protection mechanisms only when directed by a privileged user.',
  'SI-03 05': '[Withdrawn: Incorporated into MP-7].',
  'SI-03 06': 'TESTING / VERIFICATION',
  'SI-03 06 a':
    'Tests malicious code protection mechanisms [Assignment: organization-defined frequency] by introducing a known benign, non-spreading test case into the information system; and',
  'SI-03 06 b':
    'Verifies that both detection of the test case and associated incident reporting occur.',
  'SI-03 07':
    'The information system implements nonsignature-based malicious code detection mechanisms.',
  'SI-03 08':
    'The information system detects [Assignment: organization-defined unauthorized operating system commands] through the kernel application programming interface at [Assignment: organization-defined information system hardware components] and [Selection (one or more): issues a warning; audits the command execution; prevents the execution of the command].',
  'SI-03 09':
    'The information system implements [Assignment: organization-defined security safeguards] to authenticate [Assignment: organization-defined remote commands].',
  'SI-03 10': 'MALICIOUS CODE ANALYSIS',
  'SI-03 10 a':
    'Employs [Assignment: organization-defined tools and techniques] to analyze the characteristics and behavior of malicious code; and',
  'SI-03 10 b':
    'Incorporates the results from malicious code analysis into organizational incident response and flaw remediation processes.',
  'SI-04': 'INFORMATION SYSTEM MONITORING',
  'SI-04 a': 'Monitors the information system to detect:',
  'SI-04 a 01':
    'Attacks and indicators of potential attacks in accordance with [Assignment: organization-defined monitoring objectives]; and',
  'SI-04 a 02': 'Unauthorized local, network, and remote connections;',
  'SI-04 b':
    'Identifies unauthorized use of the information system through [Assignment: organization-defined techniques and methods];',
  'SI-04 c': 'Deploys monitoring devices:',
  'SI-04 c 01':
    'Strategically within the information system to collect organization-determined essential information; and',
  'SI-04 c 02':
    'At ad hoc locations within the system to track specific types of transactions of interest to the organization;',
  'SI-04 d':
    'Protects information obtained from intrusion-monitoring tools from unauthorized access, modification, and deletion;',
  'SI-04 e':
    'Heightens the level of information system monitoring activity whenever there is an indication of increased risk to organizational operations and assets, individuals, other organizations, or the Nation based on law enforcement information, intelligence information, or other credible sources of information;',
  'SI-04 f':
    'Obtains legal opinion with regard to information system monitoring activities in accordance with applicable federal laws, Executive Orders, directives, policies, or regulations; and',
  'SI-04 g':
    'Provides [Assignment: organization-defined information system monitoring information] to [Assignment: organization-defined personnel or roles] [Selection (one or more): as needed; [Assignment: organization-defined frequency]].',
  'SI-04 01':
    'The organization connects and configures individual intrusion detection tools into an information system-wide intrusion detection system.',
  'SI-04 02':
    'The organization employs automated tools to support near real-time analysis of events.',
  'SI-04 03':
    'The organization employs automated tools to integrate intrusion detection tools into access control and flow control mechanisms for rapid response to attacks by enabling reconfiguration of these mechanisms in support of attack isolation and elimination.',
  'SI-04 04':
    'The information system monitors inbound and outbound communications traffic [Assignment: organization-defined frequency] for unusual or unauthorized activities or conditions.',
  'SI-04 05':
    'The information system alerts [Assignment: organization-defined personnel or roles] when the following indications of compromise or potential compromise occur: [Assignment: organization-defined compromise indicators].',
  'SI-04 06': '[Withdrawn: Incorporated into AC-6 (10)].',
  'SI-04 07':
    'The information system notifies [Assignment: organization-defined incident response personnel (identified by name and/or by role)] of detected suspicious events and takes [Assignment: organization-defined least-disruptive actions to terminate suspicious events].',
  'SI-04 08': '[Withdrawn: Incorporated into SI-4].',
  'SI-04 09':
    'The organization tests intrusion-monitoring tools [Assignment: organization-defined frequency].',
  'SI-04 10':
    'The organization makes provisions so that [Assignment: organization-defined encrypted communications traffic] is visible to [Assignment: organization-defined information system monitoring tools].',
  'SI-04 11':
    'The organization analyzes outbound communications traffic at the external boundary of the information system and selected [Assignment: organization-defined interior points within the system (e.g., subnetworks, subsystems)] to discover anomalies.',
  'SI-04 12':
    'The organization employs automated mechanisms to alert security personnel of the following inappropriate or unusual activities with security implications: [Assignment: organization-defined activities that trigger alerts].',
  'SI-04 13': 'ANALYZE TRAFFIC / EVENT PATTERNS',
  'SI-04 13 a':
    'Analyzes communications traffic/event patterns for the information system;',
  'SI-04 13 b':
    'Develops profiles representing common traffic patterns and/or events; and',
  'SI-04 13 c':
    'Uses the traffic/event profiles in tuning system-monitoring devices to reduce the number of false positives and the number of false negatives.',
  'SI-04 14':
    'The organization employs a wireless intrusion detection system to identify rogue wireless devices and to detect attack attempts and potential compromises/breaches to the information system.',
  'SI-04 15':
    'The organization employs an intrusion detection system to monitor wireless communications traffic as the traffic passes from wireless to wireline networks.',
  'SI-04 16':
    'The organization correlates information from monitoring tools employed throughout the information system.',
  'SI-04 17':
    'The organization correlates information from monitoring physical, cyber, and supply chain activities to achieve integrated, organization-wide situational awareness.',
  'SI-04 18':
    'The organization analyzes outbound communications traffic at the external boundary of the information system (i.e., system perimeter) and at [Assignment: organization-defined interior points within the system (e.g., subsystems, subnetworks)] to detect covert exfiltration of information.',
  'SI-04 19':
    'The organization implements [Assignment: organization-defined additional monitoring] of individuals who have been identified by [Assignment: organization-defined sources] as posing an increased level of risk.',
  'SI-04 20':
    'The organization implements [Assignment: organization-defined additional monitoring] of privileged users.',
  'SI-04 21':
    'The organization implements [Assignment: organization-defined additional monitoring] of individuals during [Assignment: organization-defined probationary period].',
  'SI-04 22':
    'The information system detects network services that have not been authorized or approved by [Assignment: organization-defined authorization or approval processes] and [Selection (one or more): audits; alerts [Assignment: organization-defined personnel or roles]].',
  'SI-04 23':
    'The organization implements [Assignment: organization-defined host-based monitoring mechanisms] at [Assignment: organization-defined information system components].',
  'SI-04 24':
    'The information system discovers, collects, distributes, and uses indicators of compromise.',
  'SI-05': 'SECURITY ALERTS, ADVISORIES, AND DIRECTIVES',
  'SI-05 a':
    'Receives information system security alerts, advisories, and directives from [Assignment: organization-defined external organizations] on an ongoing basis;',
  'SI-05 b':
    'Generates internal security alerts, advisories, and directives as deemed necessary;',
  'SI-05 c':
    'Disseminates security alerts, advisories, and directives to: [Selection (one or more): [Assignment: organization-defined personnel or roles]; [Assignment: organization-defined elements within the organization]; [Assignment: organization-defined external organizations]]; and',
  'SI-05 d':
    'Implements security directives in accordance with established time frames, or notifies the issuing organization of the degree of noncompliance.',
  'SI-05 01':
    'The organization employs automated mechanisms to make security alert and advisory information available throughout the organization.',
  'SI-06': 'The information system:',
  'SI-06 a':
    'Verifies the correct operation of [Assignment: organization-defined security functions];',
  'SI-06 b':
    'Performs this verification [Selection (one or more): [Assignment: organization-defined system transitional states]; upon command by user with appropriate privilege; [Assignment: organization-defined frequency]];',
  'SI-06 c':
    'Notifies [Assignment: organization-defined personnel or roles] of failed security verification tests; and',
  'SI-06 d':
    '[Selection (one or more): shuts the information system down; restarts the information system; [Assignment: organization-defined alternative action(s)]] when anomalies are discovered.',
  'SI-06 01': '[Withdrawn: Incorporated into SI-6].',
  'SI-06 02':
    'The information system implements automated mechanisms to support the management of distributed security testing.',
  'SI-06 03':
    'The organization reports the results of security function verification to [Assignment: organization-defined personnel or roles].',
  'SI-07':
    'The organization employs integrity verification tools to detect unauthorized changes to [Assignment: organization-defined software, firmware, and information].',
  'SI-07 01':
    'The information system performs an integrity check of [Assignment: organization-defined software, firmware, and information] [Selection (one or more): at startup; at [Assignment: organization-defined transitional states or security-relevant events]; [Assignment: organization-defined frequency]].',
  'SI-07 02':
    'The organization employs automated tools that provide notification to [Assignment: organization-defined personnel or roles] upon discovering discrepancies during integrity verification.',
  'SI-07 03':
    'The organization employs centrally managed integrity verification tools.',
  'SI-07 04': '[Withdrawn: Incorporated into SA-12].',
  'SI-07 05':
    'The information system automatically [Selection (one or more): shuts the information system down; restarts the information system; implements [Assignment: organization-defined security safeguards]] when integrity violations are discovered.',
  'SI-07 06':
    'The information system implements cryptographic mechanisms to detect unauthorized changes to software, firmware, and information.',
  'SI-07 07':
    'The organization incorporates the detection of unauthorized [Assignment: organization-defined security-relevant changes to the information system] into the organizational incident response capability.',
  'SI-07 08':
    'The information system, upon detection of a potential integrity violation, provides the capability to audit the event and initiates the following actions: [Selection (one or more): generates an audit record; alerts current user; alerts [Assignment: organization-defined personnel or roles]; [Assignment: organization-defined other actions]].',
  'SI-07 09':
    'The information system verifies the integrity of the boot process of [Assignment: organization-defined devices].',
  'SI-07 10':
    'The information system implements [Assignment: organization-defined security safeguards] to protect the integrity of boot firmware in [Assignment: organization-defined devices].',
  'SI-07 11':
    'The organization requires that [Assignment: organization-defined user-installed software] execute in a confined physical or virtual machine environment with limited privileges.',
  'SI-07 12':
    'The organization requires that the integrity of [Assignment: organization-defined user-installed software] be verified prior to execution.',
  'SI-07 13':
    'The organization allows execution of binary or machine-executable code obtained from sources with limited or no warranty and without the provision of source code only in confined physical or virtual machine environments and with the explicit approval of [Assignment: organization-defined personnel or roles].',
  'SI-07 14': 'BINARY OR MACHINE EXECUTABLE CODE',
  'SI-07 14 a':
    'Prohibits the use of binary or machine-executable code from sources with limited or no warranty and without the provision of source code; and',
  'SI-07 14 b':
    'Provides exceptions to the source code requirement only for compelling mission/operational requirements and with the approval of the authorizing official.',
  'SI-07 15':
    'The information system implements cryptographic mechanisms to authenticate [Assignment: organization-defined software or firmware components] prior to installation.',
  'SI-07 16':
    'The organization does not allow processes to execute without supervision for more than [Assignment: organization-defined time period].',
  'SI-08': 'SPAM PROTECTION',
  'SI-08 a':
    'Employs spam protection mechanisms at information system entry and exit points to detect and take action on unsolicited messages; and',
  'SI-08 b':
    'Updates spam protection mechanisms when new releases are available in accordance with organizational configuration management policy and procedures.',
  'SI-08 01': 'The organization centrally manages spam protection mechanisms.',
  'SI-08 02':
    'The information system automatically updates spam protection mechanisms.',
  'SI-08 03':
    'The information system implements spam protection mechanisms with a learning capability to more effectively identify legitimate communications traffic.',
  'SI-09': '[Withdrawn: Incorporated into AC-2, AC-3, AC-5, AC-6].',
  'SI-10':
    'The information system checks the validity of [Assignment: organization-defined information inputs].',
  'SI-10 01': 'The information system:',
  'SI-10 01 a':
    'Provides a manual override capability for input validation of [Assignment: organization-defined inputs];',
  'SI-10 01 b':
    'Restricts the use of the manual override capability to only [Assignment: organization-defined authorized individuals]; and',
  'SI-10 01 c': 'Audits the use of the manual override capability.',
  'SI-10 02':
    'The organization ensures that input validation errors are reviewed and resolved within [Assignment: organization-defined time period].',
  'SI-10 03':
    'The information system behaves in a predictable and documented manner that reflects organizational and system objectives when invalid inputs are received.',
  'SI-10 04':
    'The organization accounts for timing interactions among information system components in determining appropriate responses for invalid inputs.',
  'SI-10 05':
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
  'SI-13 01':
    'The organization takes information system components out of service by transferring component responsibilities to substitute components no later than [Assignment: organization-defined fraction or percentage] of mean time to failure.',
  'SI-13 02': '[Withdrawn: Incorporated into SI-7 (16)].',
  'SI-13 03':
    'The organization manually initiates transfers between active and standby information system components [Assignment: organization-defined frequency] if the mean time to failure exceeds [Assignment: organization-defined time period].',
  'SI-13 04':
    'The organization, if information system component failures are detected:',
  'SI-13 04 a':
    'Ensures that the standby components are successfully and transparently installed within [Assignment: organization-defined time period]; and',
  'SI-13 04 b':
    '[Selection (one or more): activates [Assignment: organization-defined alarm]; automatically shuts down the information system].',
  'SI-13 05':
    'The organization provides [Selection: real-time; near real-time] [Assignment: organization-defined failover capability] for the information system.',
  'SI-14':
    'The organization implements non-persistent [Assignment: organization-defined information system components and services] that are initiated in a known state and terminated [Selection (one or more): upon end of session of use; periodically at [Assignment: organization-defined frequency]].',
  'SI-14 01':
    'The organization ensures that software and data employed during information system component and service refreshes are obtained from [Assignment: organization-defined trusted sources].',
  'SI-15':
    'The information system validates information output from [Assignment: organization-defined software programs and/or applications] to ensure that the information is consistent with the expected content.',
  'SI-16':
    'The information system implements [Assignment: organization-defined security safeguards] to protect its memory from unauthorized code execution.',
  'SI-17':
    'The information system implements [Assignment: organization-defined fail-safe procedures] when [Assignment: organization-defined failure conditions occur].',
  'PM-01': 'INFORMATION SECURITY PROGRAM PLAN',
  'PM-01 a':
    'Develops and disseminates an organization-wide information security program plan that:',
  'PM-01 a 01':
    'Provides an overview of the requirements for the security program and a description of the security program management controls and common controls in place or planned for meeting those requirements;',
  'PM-01 a 02':
    'Includes the identification and assignment of roles, responsibilities, management commitment, coordination among organizational entities, and compliance;',
  'PM-01 a 03':
    'Reflects coordination among organizational entities responsible for the different aspects of information security (i.e., technical, physical, personnel, cyber-physical); and',
  'PM-01 a 04':
    'Is approved by a senior official with responsibility and accountability for the risk being incurred to organizational operations (including mission, functions, image, and reputation), organizational assets, individuals, other organizations, and the Nation;',
  'PM-01 b':
    'Reviews the organization-wide information security program plan [Assignment: organization-defined frequency];',
  'PM-01 c':
    'Updates the plan to address organizational changes and problems identified during plan implementation or security control assessments; and',
  'PM-01 d':
    'Protects the information security program plan from unauthorized disclosure and modification.',
  'PM-02':
    'The organization appoints a senior information security officer with the mission and resources to coordinate, develop, implement, and maintain an organization-wide information security program.',
  'PM-03': 'INFORMATION SECURITY RESOURCES',
  'PM-03 a':
    'Ensures that all capital planning and investment requests include the resources needed to implement the information security program and documents all exceptions to this requirement;',
  'PM-03 b':
    'Employs a business case/Exhibit 300/Exhibit 53 to record the resources required; and',
  'PM-03 c':
    'Ensures that information security resources are available for expenditure as planned.',
  'PM-04': 'PLAN OF ACTION AND MILESTONES PROCESS',
  'PM-04 a':
    'Implements a process for ensuring that plans of action and milestones for the security program and associated organizational information systems:',
  'PM-04 a 01': 'Are developed and maintained;',
  'PM-04 a 02':
    'Document the remedial information security actions to adequately respond to risk to organizational operations and assets, individuals, other organizations, and the Nation; and',
  'PM-04 a 03':
    'Are reported in accordance with OMB FISMA reporting requirements.',
  'PM-04 b':
    'Reviews plans of action and milestones for consistency with the organizational risk management strategy and organization-wide priorities for risk response actions.',
  'PM-05':
    'The organization develops and maintains an inventory of its information systems.',
  'PM-06':
    'The organization develops, monitors, and reports on the results of information security measures of performance.',
  'PM-07':
    'The organization develops an enterprise architecture with consideration for information security and the resulting risk to organizational operations, organizational assets, individuals, other organizations, and the Nation.',
  'PM-08':
    'The organization addresses information security issues in the development, documentation, and updating of a critical infrastructure and key resources protection plan.',
  'PM-09': 'RISK MANAGEMENT STRATEGY',
  'PM-09 a':
    'Develops a comprehensive strategy to manage risk to organizational operations and assets, individuals, other organizations, and the Nation associated with the operation and use of information systems;',
  'PM-09 b':
    'Implements the risk management strategy consistently across the organization; and',
  'PM-09 c':
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
  'PM-14 a 01': 'Are developed and maintained; and',
  'PM-14 a 02': 'Continue to be executed in a timely manner;',
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
