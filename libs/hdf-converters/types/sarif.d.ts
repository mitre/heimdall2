/**
 * Static Analysis Results Format (SARIF) Version 2.1.0 JSON Schema: a standard format for the output of static analysis tools.
 */
export type StaticAnalysisResultsFormatSARIFVersion210JSONSchema = {
  /**
   * The URI of the JSON schema corresponding to the version.
   */
  $schema?: string;
  /**
   * The SARIF format version of this log file.
   */
  version: '2.1.0';
  /**
   * The set of runs contained in this log file.
   *
   * @minItems 0
   * @uniqueItems false
   */
  runs: Run[] | null;
  /**
   * References to external property files that share data between runs.
   *
   * @minItems 0
   */
  inlineExternalProperties?: ExternalProperties[];
  /**
   * Key/value pairs that provide additional information about the log file.
   */
  properties?: PropertyBag;
};

/**
 * A physical or virtual address, or a range of addresses, in an 'addressable region' (memory or a binary file).
 */
export type Address = {
  /**
   * The address expressed as a byte offset from the start of the addressable region.
   */
  absoluteAddress?: number;
  /**
   * The address expressed as a byte offset from the absolute address of the top-most parent object.
   */
  relativeAddress?: number;
  /**
   * The number of bytes in this range of addresses.
   */
  length?: number;
  /**
   * An open-ended string that identifies the address kind. 'data', 'function', 'header','instruction', 'module', 'page', 'section', 'segment', 'stack', 'stackFrame', 'table' are well-known values.
   */
  kind?: string;
  /**
   * A name that is associated with the address, e.g., '.text'.
   */
  name?: string;
  /**
   * A human-readable fully qualified name that is associated with the address.
   */
  fullyQualifiedName?: string;
  /**
   * The byte offset of this address from the absolute or relative address of the parent object.
   */
  offsetFromParent?: number;
  /**
   * The index within run.addresses of the cached object for this address.
   */
  index?: number;
  /**
   * The index within run.addresses of the parent object.
   */
  parentIndex?: number;
  /**
   * Key/value pairs that provide additional information about the address.
   */
  properties?: PropertyBag;
};

/**
 * A single artifact. In some cases, this artifact might be nested within another artifact.
 */
export type Artifact = {
  /**
   * A short description of the artifact.
   */
  description?: Message;
  /**
   * The location of the artifact.
   */
  location?: ArtifactLocation;
  /**
   * Identifies the index of the immediate parent of the artifact, if this artifact is nested.
   */
  parentIndex?: number;
  /**
   * The offset in bytes of the artifact within its containing artifact.
   */
  offset?: number;
  /**
   * The length of the artifact in bytes.
   */
  length?: number;
  /**
   * The role or roles played by the artifact in the analysis.
   *
   * @minItems 0
   * @uniqueItems true
   */
  roles?: (
    | 'analysisTarget'
    | 'attachment'
    | 'responseFile'
    | 'resultFile'
    | 'standardStream'
    | 'tracedFile'
    | 'unmodified'
    | 'modified'
    | 'added'
    | 'deleted'
    | 'renamed'
    | 'uncontrolled'
    | 'driver'
    | 'extension'
    | 'translation'
    | 'taxonomy'
    | 'policy'
    | 'referencedOnCommandLine'
    | 'memoryContents'
    | 'directory'
    | 'userSpecifiedConfiguration'
    | 'toolSpecifiedConfiguration'
    | 'debugOutputFile'
  )[];
  /**
   * The MIME type (RFC 2045) of the artifact.
   */
  mimeType?: string;
  /**
   * The contents of the artifact.
   */
  contents?: ArtifactContent;
  /**
   * Specifies the encoding for an artifact object that refers to a text file.
   */
  encoding?: string;
  /**
   * Specifies the source language for any artifact object that refers to a text file that contains source code.
   */
  sourceLanguage?: string;
  /**
   * A dictionary, each of whose keys is the name of a hash function and each of whose values is the hashed value of the artifact produced by the specified hash function.
   */
  hashes?: {
    [k: string]: string;
  };
  /**
   * The Coordinated Universal Time (UTC) date and time at which the artifact was most recently modified. See "Date/time properties" in the SARIF spec for the required format.
   */
  lastModifiedTimeUtc?: string;
  /**
   * Key/value pairs that provide additional information about the artifact.
   */
  properties?: PropertyBag;
};

/**
 * A change to a single artifact.
 */
export type ArtifactChange = {
  /**
   * The location of the artifact to change.
   */
  artifactLocation: ArtifactLocation;
  /**
   * An array of replacement objects, each of which represents the replacement of a single region in a single artifact specified by 'artifactLocation'.
   *
   * @minItems 1
   * @uniqueItems false
   */
  replacements: [Replacement, ...Replacement[]];
  /**
   * Key/value pairs that provide additional information about the change.
   */
  properties?: PropertyBag;
};

/**
 * Represents the contents of an artifact.
 */
export type ArtifactContent = {
  /**
   * UTF-8-encoded content from a text artifact.
   */
  text?: string;
  /**
   * MIME Base64-encoded content from a binary artifact, or from a text artifact in its original encoding.
   */
  binary?: string;
  /**
   * An alternate rendered representation of the artifact (e.g., a decompiled representation of a binary region).
   */
  rendered?: MultiformatMessageString;
  /**
   * Key/value pairs that provide additional information about the artifact content.
   */
  properties?: PropertyBag;
};

/**
 * Specifies the location of an artifact.
 */
export type ArtifactLocation = {
  /**
   * A string containing a valid relative or absolute URI.
   */
  uri?: string;
  /**
   * A string which indirectly specifies the absolute URI with respect to which a relative URI in the "uri" property is interpreted.
   */
  uriBaseId?: string;
  /**
   * The index within the run artifacts array of the artifact object associated with the artifact location.
   */
  index?: number;
  /**
   * A short description of the artifact location.
   */
  description?: Message;
  /**
   * Key/value pairs that provide additional information about the artifact location.
   */
  properties?: PropertyBag;
};

/**
 * An artifact relevant to a result.
 */
export type Attachment = {
  /**
   * A message describing the role played by the attachment.
   */
  description?: Message;
  /**
   * The location of the attachment.
   */
  artifactLocation: ArtifactLocation;
  /**
   * An array of regions of interest within the attachment.
   *
   * @minItems 0
   * @uniqueItems true
   */
  regions?: Region[];
  /**
   * An array of rectangles specifying areas of interest within the image.
   *
   * @minItems 0
   * @uniqueItems true
   */
  rectangles?: Rectangle[];
  /**
   * Key/value pairs that provide additional information about the attachment.
   */
  properties?: PropertyBag;
};

/**
 * A set of threadFlows which together describe a pattern of code execution relevant to detecting a result.
 */
export type CodeFlow = {
  /**
   * A message relevant to the code flow.
   */
  message?: Message;
  /**
   * An array of one or more unique threadFlow objects, each of which describes the progress of a program through a thread of execution.
   *
   * @minItems 1
   * @uniqueItems false
   */
  threadFlows: [ThreadFlow, ...ThreadFlow[]];
  /**
   * Key/value pairs that provide additional information about the code flow.
   */
  properties?: PropertyBag;
};

/**
 * Information about how a specific rule or notification was reconfigured at runtime.
 */
export type ConfigurationOverride = {
  /**
   * Specifies how the rule or notification was configured during the scan.
   */
  configuration: ReportingConfiguration;
  /**
   * A reference used to locate the descriptor whose configuration was overridden.
   */
  descriptor: ReportingDescriptorReference;
  /**
   * Key/value pairs that provide additional information about the configuration override.
   */
  properties?: PropertyBag;
};

/**
 * Describes how a converter transformed the output of a static analysis tool from the analysis tool's native output format into the SARIF format.
 */
export type Conversion = {
  /**
   * A tool object that describes the converter.
   */
  tool: Tool;
  /**
   * An invocation object that describes the invocation of the converter.
   */
  invocation?: Invocation;
  /**
   * The locations of the analysis tool's per-run log files.
   *
   * @minItems 0
   * @uniqueItems true
   */
  analysisToolLogFiles?: ArtifactLocation[];
  /**
   * Key/value pairs that provide additional information about the conversion.
   */
  properties?: PropertyBag;
};

/**
 * Represents a directed edge in a graph.
 */
export type Edge = {
  /**
   * A string that uniquely identifies the edge within its graph.
   */
  id: string;
  /**
   * A short description of the edge.
   */
  label?: Message;
  /**
   * Identifies the source node (the node at which the edge starts).
   */
  sourceNodeId: string;
  /**
   * Identifies the target node (the node at which the edge ends).
   */
  targetNodeId: string;
  /**
   * Key/value pairs that provide additional information about the edge.
   */
  properties?: PropertyBag;
};

/**
 * Represents the traversal of a single edge during a graph traversal.
 */
export type EdgeTraversal = {
  /**
   * Identifies the edge being traversed.
   */
  edgeId: string;
  /**
   * A message to display to the user as the edge is traversed.
   */
  message?: Message;
  /**
   * The values of relevant expressions after the edge has been traversed.
   */
  finalState?: {
    [k: string]: MultiformatMessageString;
  };
  /**
   * The number of edge traversals necessary to return from a nested graph.
   */
  stepOverEdgeCount?: number;
  /**
   * Key/value pairs that provide additional information about the edge traversal.
   */
  properties?: PropertyBag;
};

/**
 * Describes a runtime exception encountered during the execution of an analysis tool.
 */
export type Exception = {
  /**
   * A string that identifies the kind of exception, for example, the fully qualified type name of an object that was thrown, or the symbolic name of a signal.
   */
  kind?: string;
  /**
   * A message that describes the exception.
   */
  message?: string;
  /**
   * The sequence of function calls leading to the exception.
   */
  stack?: Stack;
  /**
   * An array of exception objects each of which is considered a cause of this exception.
   *
   * @minItems 0
   * @uniqueItems false
   */
  innerExceptions?: Exception[];
  /**
   * Key/value pairs that provide additional information about the exception.
   */
  properties?: PropertyBag;
};

/**
 * The top-level element of an external property file.
 */
export type ExternalProperties = {
  /**
   * The URI of the JSON schema corresponding to the version of the external property file format.
   */
  schema?: string;
  /**
   * The SARIF format version of this external properties object.
   */
  version?: '2.1.0';
  /**
   * A stable, unique identifier for this external properties object, in the form of a GUID.
   */
  guid?: string;
  /**
   * A stable, unique identifier for the run associated with this external properties object, in the form of a GUID.
   */
  runGuid?: string;
  /**
   * A conversion object that will be merged with a separate run.
   */
  conversion?: Conversion;
  /**
   * An array of graph objects that will be merged with a separate run.
   *
   * @minItems 0
   * @uniqueItems true
   */
  graphs?: Graph[];
  /**
   * Key/value pairs that provide additional information that will be merged with a separate run.
   */
  externalizedProperties?: PropertyBag;
  /**
   * An array of artifact objects that will be merged with a separate run.
   *
   * @minItems 0
   * @uniqueItems true
   */
  artifacts?: Artifact[];
  /**
   * Describes the invocation of the analysis tool that will be merged with a separate run.
   *
   * @minItems 0
   * @uniqueItems false
   */
  invocations?: Invocation[];
  /**
   * An array of logical locations such as namespaces, types or functions that will be merged with a separate run.
   *
   * @minItems 0
   * @uniqueItems true
   */
  logicalLocations?: LogicalLocation[];
  /**
   * An array of threadFlowLocation objects that will be merged with a separate run.
   *
   * @minItems 0
   * @uniqueItems true
   */
  threadFlowLocations?: ThreadFlowLocation[];
  /**
   * An array of result objects that will be merged with a separate run.
   *
   * @minItems 0
   * @uniqueItems false
   */
  results?: Result[];
  /**
   * Tool taxonomies that will be merged with a separate run.
   *
   * @minItems 0
   * @uniqueItems true
   */
  taxonomies?: ToolComponent[];
  /**
   * The analysis tool object that will be merged with a separate run.
   */
  driver?: ToolComponent;
  /**
   * Tool extensions that will be merged with a separate run.
   *
   * @minItems 0
   * @uniqueItems true
   */
  extensions?: ToolComponent[];
  /**
   * Tool policies that will be merged with a separate run.
   *
   * @minItems 0
   * @uniqueItems true
   */
  policies?: ToolComponent[];
  /**
   * Tool translations that will be merged with a separate run.
   *
   * @minItems 0
   * @uniqueItems true
   */
  translations?: ToolComponent[];
  /**
   * Addresses that will be merged with a separate run.
   *
   * @minItems 0
   * @uniqueItems false
   */
  addresses?: Address[];
  /**
   * Requests that will be merged with a separate run.
   *
   * @minItems 0
   * @uniqueItems true
   */
  webRequests?: WebRequest[];
  /**
   * Responses that will be merged with a separate run.
   *
   * @minItems 0
   * @uniqueItems true
   */
  webResponses?: WebResponse[];
  /**
   * Key/value pairs that provide additional information about the external properties.
   */
  properties?: PropertyBag;
};

/**
 * Contains information that enables a SARIF consumer to locate the external property file that contains the value of an externalized property associated with the run.
 *
 * anyOf the following attributes are required: 'location', 'guid'
 */
export type ExternalPropertyFileReference = {
  /**
   * The location of the external property file.
   */
  location?: ArtifactLocation;
  /**
   * A stable, unique identifier for the external property file in the form of a GUID.
   */
  guid?: string;
  /**
   * A non-negative integer specifying the number of items contained in the external property file.
   */
  itemCount?: number;
  /**
   * Key/value pairs that provide additional information about the external property file.
   */
  properties?: PropertyBag;
};

/**
 * References to external property files that should be inlined with the content of a root log file.
 */
export type ExternalPropertyFileReferences = {
  /**
   * An external property file containing a run.conversion object to be merged with the root log file.
   */
  conversion?: ExternalPropertyFileReference;
  /**
   * An array of external property files containing a run.graphs object to be merged with the root log file.
   *
   * @minItems 0
   * @uniqueItems true
   */
  graphs?: ExternalPropertyFileReference[];
  /**
   * An external property file containing a run.properties object to be merged with the root log file.
   */
  externalizedProperties?: ExternalPropertyFileReference;
  /**
   * An array of external property files containing run.artifacts arrays to be merged with the root log file.
   *
   * @minItems 0
   * @uniqueItems true
   */
  artifacts?: ExternalPropertyFileReference[];
  /**
   * An array of external property files containing run.invocations arrays to be merged with the root log file.
   *
   * @minItems 0
   * @uniqueItems true
   */
  invocations?: ExternalPropertyFileReference[];
  /**
   * An array of external property files containing run.logicalLocations arrays to be merged with the root log file.
   *
   * @minItems 0
   * @uniqueItems true
   */
  logicalLocations?: ExternalPropertyFileReference[];
  /**
   * An array of external property files containing run.threadFlowLocations arrays to be merged with the root log file.
   *
   * @minItems 0
   * @uniqueItems true
   */
  threadFlowLocations?: ExternalPropertyFileReference[];
  /**
   * An array of external property files containing run.results arrays to be merged with the root log file.
   *
   * @minItems 0
   * @uniqueItems true
   */
  results?: ExternalPropertyFileReference[];
  /**
   * An array of external property files containing run.taxonomies arrays to be merged with the root log file.
   *
   * @minItems 0
   * @uniqueItems true
   */
  taxonomies?: ExternalPropertyFileReference[];
  /**
   * An array of external property files containing run.addresses arrays to be merged with the root log file.
   *
   * @minItems 0
   * @uniqueItems true
   */
  addresses?: ExternalPropertyFileReference[];
  /**
   * An external property file containing a run.driver object to be merged with the root log file.
   */
  driver?: ExternalPropertyFileReference;
  /**
   * An array of external property files containing run.extensions arrays to be merged with the root log file.
   *
   * @minItems 0
   * @uniqueItems true
   */
  extensions?: ExternalPropertyFileReference[];
  /**
   * An array of external property files containing run.policies arrays to be merged with the root log file.
   *
   * @minItems 0
   * @uniqueItems true
   */
  policies?: ExternalPropertyFileReference[];
  /**
   * An array of external property files containing run.translations arrays to be merged with the root log file.
   *
   * @minItems 0
   * @uniqueItems true
   */
  translations?: ExternalPropertyFileReference[];
  /**
   * An array of external property files containing run.requests arrays to be merged with the root log file.
   *
   * @minItems 0
   * @uniqueItems true
   */
  webRequests?: ExternalPropertyFileReference[];
  /**
   * An array of external property files containing run.responses arrays to be merged with the root log file.
   *
   * @minItems 0
   * @uniqueItems true
   */
  webResponses?: ExternalPropertyFileReference[];
  /**
   * Key/value pairs that provide additional information about the external property files.
   */
  properties?: PropertyBag;
};

/**
 * A proposed fix for the problem represented by a result object. A fix specifies a set of artifacts to modify. For each artifact, it specifies a set of bytes to remove, and provides a set of new bytes to replace them.
 */
export type Fix = {
  /**
   * A message that describes the proposed fix, enabling viewers to present the proposed change to an end user.
   */
  description?: Message;
  /**
   * One or more artifact changes that comprise a fix for a result.
   *
   * @minItems 1
   * @uniqueItems true
   */
  artifactChanges: [ArtifactChange, ...ArtifactChange[]];
  /**
   * Key/value pairs that provide additional information about the fix.
   */
  properties?: PropertyBag;
};

/**
 * A network of nodes and directed edges that describes some aspect of the structure of the code (for example, a call graph).
 */
export type Graph = {
  /**
   * A description of the graph.
   */
  description?: Message;
  /**
   * An array of node objects representing the nodes of the graph.
   *
   * @minItems 0
   * @uniqueItems true
   */
  nodes?: Node[];
  /**
   * An array of edge objects representing the edges of the graph.
   *
   * @minItems 0
   * @uniqueItems true
   */
  edges?: Edge[];
  /**
   * Key/value pairs that provide additional information about the graph.
   */
  properties?: PropertyBag;
};

/**
 * Represents a path through a graph.
 *
 * oneOf the following attributes are required: 'runGraphIndex', 'resultGraphIndex'
 */
export type GraphTraversal = {
  /**
   * The index within the run.graphs to be associated with the result.
   */
  runGraphIndex?: number;
  /**
   * The index within the result.graphs to be associated with the result.
   */
  resultGraphIndex?: number;
  /**
   * A description of this graph traversal.
   */
  description?: Message;
  /**
   * Values of relevant expressions at the start of the graph traversal that may change during graph traversal.
   */
  initialState?: {
    [k: string]: MultiformatMessageString;
  };
  /**
   * Values of relevant expressions at the start of the graph traversal that remain constant for the graph traversal.
   */
  immutableState?: {
    [k: string]: MultiformatMessageString;
  };
  /**
   * The sequences of edges traversed by this graph traversal.
   *
   * @minItems 0
   * @uniqueItems false
   */
  edgeTraversals?: EdgeTraversal[];
  /**
   * Key/value pairs that provide additional information about the graph traversal.
   */
  properties?: PropertyBag;
};

/**
 * The runtime environment of the analysis tool run.
 */
export type Invocation = {
  /**
   * The command line used to invoke the tool.
   */
  commandLine?: string;
  /**
   * An array of strings, containing in order the command line arguments passed to the tool from the operating system.
   *
   * @minItems 0
   * @uniqueItems false
   */
  arguments?: string[];
  /**
   * The locations of any response files specified on the tool's command line.
   *
   * @minItems 0
   * @uniqueItems true
   */
  responseFiles?: ArtifactLocation[];
  /**
   * The Coordinated Universal Time (UTC) date and time at which the invocation started. See "Date/time properties" in the SARIF spec for the required format.
   */
  startTimeUtc?: string;
  /**
   * The Coordinated Universal Time (UTC) date and time at which the invocation ended. See "Date/time properties" in the SARIF spec for the required format.
   */
  endTimeUtc?: string;
  /**
   * The process exit code.
   */
  exitCode?: number;
  /**
   * An array of configurationOverride objects that describe rules related runtime overrides.
   *
   * @minItems 0
   * @uniqueItems true
   */
  ruleConfigurationOverrides?: ConfigurationOverride[];
  /**
   * An array of configurationOverride objects that describe notifications related runtime overrides.
   *
   * @minItems 0
   * @uniqueItems true
   */
  notificationConfigurationOverrides?: ConfigurationOverride[];
  /**
   * A list of runtime conditions detected by the tool during the analysis.
   *
   * @minItems 0
   * @uniqueItems false
   */
  toolExecutionNotifications?: Notification[];
  /**
   * A list of conditions detected by the tool that are relevant to the tool's configuration.
   *
   * @minItems 0
   * @uniqueItems false
   */
  toolConfigurationNotifications?: Notification[];
  /**
   * The reason for the process exit.
   */
  exitCodeDescription?: string;
  /**
   * The name of the signal that caused the process to exit.
   */
  exitSignalName?: string;
  /**
   * The numeric value of the signal that caused the process to exit.
   */
  exitSignalNumber?: number;
  /**
   * The reason given by the operating system that the process failed to start.
   */
  processStartFailureMessage?: string;
  /**
   * Specifies whether the tool's execution completed successfully.
   */
  executionSuccessful: boolean;
  /**
   * The machine on which the invocation occurred.
   */
  machine?: string;
  /**
   * The account under which the invocation occurred.
   */
  account?: string;
  /**
   * The id of the process in which the invocation occurred.
   */
  processId?: number;
  /**
   * An absolute URI specifying the location of the executable that was invoked.
   */
  executableLocation?: ArtifactLocation;
  /**
   * The working directory for the invocation.
   */
  workingDirectory?: ArtifactLocation;
  /**
   * The environment variables associated with the analysis tool process, expressed as key/value pairs.
   */
  environmentVariables?: {
    [k: string]: string;
  };
  /**
   * A file containing the standard input stream to the process that was invoked.
   */
  stdin?: ArtifactLocation;
  /**
   * A file containing the standard output stream from the process that was invoked.
   */
  stdout?: ArtifactLocation;
  /**
   * A file containing the standard error stream from the process that was invoked.
   */
  stderr?: ArtifactLocation;
  /**
   * A file containing the interleaved standard output and standard error stream from the process that was invoked.
   */
  stdoutStderr?: ArtifactLocation;
  /**
   * Key/value pairs that provide additional information about the invocation.
   */
  properties?: PropertyBag;
};

/**
 * A location within a programming artifact.
 */
export type Location = {
  /**
   * Value that distinguishes this location from all other locations within a single result object.
   */
  id?: number;
  /**
   * Identifies the artifact and region.
   */
  physicalLocation?: PhysicalLocation;
  /**
   * The logical locations associated with the result.
   *
   * @minItems 0
   * @uniqueItems true
   */
  logicalLocations?: LogicalLocation[];
  /**
   * A message relevant to the location.
   */
  message?: Message;
  /**
   * A set of regions relevant to the location.
   *
   * @minItems 0
   * @uniqueItems true
   */
  annotations?: Region[];
  /**
   * An array of objects that describe relationships between this location and others.
   *
   * @minItems 0
   * @uniqueItems true
   */
  relationships?: LocationRelationship[];
  /**
   * Key/value pairs that provide additional information about the location.
   */
  properties?: PropertyBag;
};

/**
 * Information about the relation of one location to another.
 */
export type LocationRelationship = {
  /**
   * A reference to the related location.
   */
  target: number;
  /**
   * A set of distinct strings that categorize the relationship. Well-known kinds include 'includes', 'isIncludedBy' and 'relevant'.
   * @uniqueItems true
   */
  kinds?: string[];
  /**
   * A description of the location relationship.
   */
  description?: Message;
  /**
   * Key/value pairs that provide additional information about the location relationship.
   */
  properties?: PropertyBag;
};

/**
 * A logical location of a construct that produced a result.
 */
export type LogicalLocation = {
  /**
   * Identifies the construct in which the result occurred. For example, this property might contain the name of a class or a method.
   */
  name?: string;
  /**
   * The index within the logical locations array.
   */
  index?: number;
  /**
   * The human-readable fully qualified name of the logical location.
   */
  fullyQualifiedName?: string;
  /**
   * The machine-readable name for the logical location, such as a mangled function name provided by a C++ compiler that encodes calling convention, return type and other details along with the function name.
   */
  decoratedName?: string;
  /**
   * Identifies the index of the immediate parent of the construct in which the result was detected. For example, this property might point to a logical location that represents the namespace that holds a type.
   */
  parentIndex?: number;
  /**
   * The type of construct this logical location component refers to. Should be one of 'function', 'member', 'module', 'namespace', 'parameter', 'resource', 'returnType', 'type', 'variable', 'object', 'array', 'property', 'value', 'element', 'text', 'attribute', 'comment', 'declaration', 'dtd' or 'processingInstruction', if any of those accurately describe the construct.
   */
  kind?: string;
  /**
   * Key/value pairs that provide additional information about the logical location.
   */
  properties?: PropertyBag;
};

/**
 * Encapsulates a message intended to be read by the end user.
 * anyOf the following attributes are required: 'text', 'id'
 */
export type Message = {
  /**
   * A plain text message string.
   */
  text?: string;
  /**
   * A Markdown message string.
   */
  markdown?: string;
  /**
   * The identifier for this message.
   */
  id?: string;
  /**
   * An array of strings to substitute into the message string.
   *
   * @minItems 0
   * @uniqueItems false
   */
  arguments?: string[];
  /**
   * Key/value pairs that provide additional information about the message.
   */
  properties?: PropertyBag;
};

/**
 * A message string or message format string rendered in multiple formats.
 */
export type MultiformatMessageString = {
  /**
   * A plain text message string or format string.
   */
  text: string;
  /**
   * A Markdown message string or format string.
   */
  markdown?: string;
  /**
   * Key/value pairs that provide additional information about the message.
   */
  properties?: PropertyBag;
};

/**
 * Represents a node in a graph.
 */
export type Node = {
  /**
   * A string that uniquely identifies the node within its graph.
   */
  id: string;
  /**
   * A short description of the node.
   */
  label?: Message;
  /**
   * A code location associated with the node.
   */
  location?: Location;
  /**
   * Array of child nodes.
   *
   * @minItems 0
   * @uniqueItems true
   */
  children?: Node[];
  /**
   * Key/value pairs that provide additional information about the node.
   */
  properties?: PropertyBag;
};

/**
 * Describes a condition relevant to the tool itself, as opposed to being relevant to a target being analyzed by the tool.
 */
export type Notification = {
  /**
   * The locations relevant to this notification.
   *
   * @minItems 0
   * @uniqueItems true
   */
  locations?: Location[];
  /**
   * A message that describes the condition that was encountered.
   */
  message: Message;
  /**
   * A value specifying the severity level of the notification.
   */
  level?: 'none' | 'note' | 'warning' | 'error';
  /**
   * The thread identifier of the code that generated the notification.
   */
  threadId?: number;
  /**
   * The Coordinated Universal Time (UTC) date and time at which the analysis tool generated the notification.
   */
  timeUtc?: string;
  /**
   * The runtime exception, if any, relevant to this notification.
   */
  exception?: Exception;
  /**
   * A reference used to locate the descriptor relevant to this notification.
   */
  descriptor?: ReportingDescriptorReference;
  /**
   * A reference used to locate the rule descriptor associated with this notification.
   */
  associatedRule?: ReportingDescriptorReference;
  /**
   * Key/value pairs that provide additional information about the notification.
   */
  properties?: PropertyBag;
};

/**
 * A physical location relevant to a result. Specifies a reference to a programming artifact together with a range of bytes or characters within that artifact.
 *
 * anyOf the following attributes are required: 'address', 'artifactLocation'
 */
export type PhysicalLocation = {
  /**
   * The address of the location.
   */
  address?: Address;
  /**
   * The location of the artifact.
   */
  artifactLocation?: ArtifactLocation;
  /**
   * Specifies a portion of the artifact.
   */
  region?: Region;
  /**
   * Specifies a portion of the artifact that encloses the region. Allows a viewer to display additional context around the region.
   */
  contextRegion?: Region;
  /**
   * Key/value pairs that provide additional information about the physical location.
   */
  properties?: PropertyBag;
};

/**
 * Key/value pairs that provide additional information about the object.
 */
export type PropertyBag = {
  /**
   * A set of distinct strings that provide additional information.
   *
   * @minItems 0
   * @uniqueItems true
   */
  tags?: string[];
  [k: string]: unknown;
};

/**
 * An area within an image.
 */
export type Rectangle = {
  /**
   * The Y coordinate of the top edge of the rectangle, measured in the image's natural units.
   */
  top?: number;
  /**
   * The X coordinate of the left edge of the rectangle, measured in the image's natural units.
   */
  left?: number;
  /**
   * The Y coordinate of the bottom edge of the rectangle, measured in the image's natural units.
   */
  bottom?: number;
  /**
   * The X coordinate of the right edge of the rectangle, measured in the image's natural units.
   */
  right?: number;
  /**
   * A message relevant to the rectangle.
   */
  message?: Message;
  /**
   * Key/value pairs that provide additional information about the rectangle.
   */
  properties?: PropertyBag;
};

/**
 * A region within an artifact where a result was detected.
 *
 * anyOf the following attributes are required: 'startLine', 'charOffset', 'byteOffset'
 */
export type Region = {
  /**
   * The line number of the first character in the region.
   */
  startLine?: number;
  /**
   * The column number of the first character in the region.
   */
  startColumn?: number;
  /**
   * The line number of the last character in the region.
   */
  endLine?: number;
  /**
   * The column number of the character following the end of the region.
   */
  endColumn?: number;
  /**
   * The zero-based offset from the beginning of the artifact of the first character in the region.
   */
  charOffset?: number;
  /**
   * The length of the region in characters.
   */
  charLength?: number;
  /**
   * The zero-based offset from the beginning of the artifact of the first byte in the region.
   */
  byteOffset?: number;
  /**
   * The length of the region in bytes.
   */
  byteLength?: number;
  /**
   * The portion of the artifact contents within the specified region.
   */
  snippet?: ArtifactContent;
  /**
   * A message relevant to the region.
   */
  message?: Message;
  /**
   * Specifies the source language, if any, of the portion of the artifact specified by the region object.
   */
  sourceLanguage?: string;
  /**
   * Key/value pairs that provide additional information about the region.
   */
  properties?: PropertyBag;
};

/**
 * The replacement of a single region of an artifact.
 */
export type Replacement = {
  /**
   * The region of the artifact to delete.
   */
  deletedRegion: Region;
  /**
   * The content to insert at the location specified by the 'deletedRegion' property.
   */
  insertedContent?: ArtifactContent;
  /**
   * Key/value pairs that provide additional information about the replacement.
   */
  properties?: PropertyBag;
};

/**
 * Metadata that describes a specific report produced by the tool, as part of the analysis it provides or its runtime reporting.
 */
export type ReportingDescriptor = {
  /**
   * A stable, opaque identifier for the report.
   */
  id: string;
  /**
   * An array of stable, opaque identifiers by which this report was known in some previous version of the analysis tool.
   *
   * @minItems 0
   * @uniqueItems true
   */
  deprecatedIds?: string[];
  /**
   * A unique identifier for the reporting descriptor in the form of a GUID.
   */
  guid?: string;
  /**
   * An array of unique identifies in the form of a GUID by which this report was known in some previous version of the analysis tool.
   *
   * @minItems 0
   * @uniqueItems true
   */
  deprecatedGuids?: string[];
  /**
   * A report identifier that is understandable to an end user.
   */
  name?: string;
  /**
   * An array of readable identifiers by which this report was known in some previous version of the analysis tool.
   *
   * @minItems 0
   * @uniqueItems true
   */
  deprecatedNames?: string[];
  /**
   * A concise description of the report. Should be a single sentence that is understandable when visible space is limited to a single line of text.
   */
  shortDescription?: MultiformatMessageString;
  /**
   * A description of the report. Should, as far as possible, provide details sufficient to enable resolution of any problem indicated by the result.
   */
  fullDescription?: MultiformatMessageString;
  /**
   * A set of name/value pairs with arbitrary names. Each value is a multiformatMessageString object, which holds message strings in plain text and (optionally) Markdown format. The strings can include placeholders, which can be used to construct a message in combination with an arbitrary number of additional string arguments.
   */
  messageStrings?: {
    [k: string]: MultiformatMessageString;
  };
  /**
   * Default reporting configuration information.
   */
  defaultConfiguration?: ReportingConfiguration;
  /**
   * A URI where the primary documentation for the report can be found.
   */
  helpUri?: string;
  /**
   * Provides the primary documentation for the report, useful when there is no online documentation.
   */
  help?: MultiformatMessageString;
  /**
   * An array of objects that describe relationships between this reporting descriptor and others.
   *
   * @minItems 0
   * @uniqueItems true
   */
  relationships?: ReportingDescriptorRelationship[];
  /**
   * Key/value pairs that provide additional information about the report.
   */
  properties?: PropertyBag;
};

/**
 * Information about a rule or notification that can be configured at runtime.
 */
export type ReportingConfiguration = {
  /**
   * Specifies whether the report may be produced during the scan.
   */
  enabled?: boolean;
  /**
   * Specifies the failure level for the report.
   */
  level?: 'none' | 'note' | 'warning' | 'error';
  /**
   * Specifies the relative priority of the report. Used for analysis output only.
   */
  rank?: number;
  /**
   * Contains configuration information specific to a report.
   */
  parameters?: PropertyBag;
  /**
   * Key/value pairs that provide additional information about the reporting configuration.
   */
  properties?: PropertyBag;
};

/**
 * Information about how to locate a relevant reporting descriptor.
 *
 * anyOf the following attributes are required: 'index', 'guid', 'id'
 */
export type ReportingDescriptorReference = {
  /**
   * The id of the descriptor.
   */
  id?: string;
  /**
   * The index into an array of descriptors in toolComponent.ruleDescriptors, toolComponent.notificationDescriptors, or toolComponent.taxonomyDescriptors, depending on context.
   */
  index?: number;
  /**
   * A guid that uniquely identifies the descriptor.
   */
  guid?: string;
  /**
   * A reference used to locate the toolComponent associated with the descriptor.
   */
  toolComponent?: ToolComponentReference;
  /**
   * Key/value pairs that provide additional information about the reporting descriptor reference.
   */
  properties?: PropertyBag;
};

/**
 * Information about the relation of one reporting descriptor to another.
 */
export type ReportingDescriptorRelationship = {
  /**
   * A reference to the related reporting descriptor.
   */
  target: ReportingDescriptorReference;
  /**
   * A set of distinct strings that categorize the relationship. Well-known kinds include 'canPrecede', 'canFollow', 'willPrecede', 'willFollow', 'superset', 'subset', 'equal', 'disjoint', 'relevant', and 'incomparable'.
   *
   * @uniqueItems true
   */
  kinds?: string[];
  /**
   * A description of the reporting descriptor relationship.
   */
  description?: Message;
  /**
   * Key/value pairs that provide additional information about the reporting descriptor reference.
   */
  properties?: PropertyBag;
};

/**
 * A result produced by an analysis tool.
 */
export type Result = {
  /**
   * The stable, unique identifier of the rule, if any, to which this result is relevant.
   */
  ruleId?: string;
  /**
   * The index within the tool component rules array of the rule object associated with this result.
   */
  ruleIndex?: number;
  /**
   * A reference used to locate the rule descriptor relevant to this result.
   */
  rule?: ReportingDescriptorReference;
  /**
   * A value that categorizes results by evaluation state.
   */
  kind?:
    | 'notApplicable'
    | 'pass'
    | 'fail'
    | 'review'
    | 'open'
    | 'informational';
  /**
   * A value specifying the severity level of the result.
   */
  level?: 'none' | 'note' | 'warning' | 'error';
  /**
   * A message that describes the result. The first sentence of the message only will be displayed when visible space is limited.
   */
  message: Message;
  /**
   * Identifies the artifact that the analysis tool was instructed to scan. This need not be the same as the artifact where the result actually occurred.
   */
  analysisTarget?: ArtifactLocation;
  /**
   * The set of locations where the result was detected. Specify only one location unless the problem indicated by the result can only be corrected by making a change at every specified location.
   *
   * @minItems 0
   * @uniqueItems false
   */
  locations?: Location[];
  /**
   * A stable, unique identifier for the result in the form of a GUID.
   */
  guid?: string;
  /**
   * A stable, unique identifier for the equivalence class of logically identical results to which this result belongs, in the form of a GUID.
   */
  correlationGuid?: string;
  /**
   * A positive integer specifying the number of times this logically unique result was observed in this run.
   */
  occurrenceCount?: number;
  /**
   * A set of strings that contribute to the stable, unique identity of the result.
   */
  partialFingerprints?: {
    [k: string]: string;
  };
  /**
   * A set of strings each of which individually defines a stable, unique identity for the result.
   */
  fingerprints?: {
    [k: string]: string;
  };
  /**
   * An array of 'stack' objects relevant to the result.
   *
   * @minItems 0
   * @uniqueItems true
   */
  stacks?: Stack[];
  /**
   * An array of 'codeFlow' objects relevant to the result.
   *
   * @minItems 0
   * @uniqueItems false
   */
  codeFlows?: CodeFlow[];
  /**
   * An array of zero or more unique graph objects associated with the result.
   *
   * @minItems 0
   * @uniqueItems true
   */
  graphs?: Graph[];
  /**
   * An array of one or more unique 'graphTraversal' objects.
   *
   * @minItems 0
   * @uniqueItems true
   */
  graphTraversals?: GraphTraversal[];
  /**
   * A set of locations relevant to this result.
   *
   * @minItems 0
   * @uniqueItems true
   */
  relatedLocations?: Location[];
  /**
   * A set of suppressions relevant to this result.
   *
   * @minItems 0
   * @uniqueItems true
   */
  suppressions?: Suppression[];
  /**
   * The state of a result relative to a baseline of a previous run.
   */
  baselineState?: 'new' | 'unchanged' | 'updated' | 'absent';
  /**
   * A number representing the priority or importance of the result.
   */
  rank?: number;
  /**
   * A set of artifacts relevant to the result.
   *
   * @minItems 0
   * @uniqueItems true
   */
  attachments?: Attachment[];
  /**
   * An absolute URI at which the result can be viewed.
   */
  hostedViewerUri?: string;
  /**
   * The URIs of the work items associated with this result.
   *
   * @minItems 0
   * @uniqueItems true
   */
  workItemUris?: string[];
  /**
   * Information about how and when the result was detected.
   */
  provenance?: ResultProvenance;
  /**
   * An array of 'fix' objects, each of which represents a proposed fix to the problem indicated by the result.
   *
   * @minItems 0
   * @uniqueItems true
   */
  fixes?: Fix[];
  /**
   * An array of references to taxonomy reporting descriptors that are applicable to the result.
   *
   * @minItems 0
   * @uniqueItems true
   */
  taxa?: ReportingDescriptorReference[];
  /**
   * A web request associated with this result.
   */
  webRequest?: WebRequest;
  /**
   * A web response associated with this result.
   */
  webResponse?: WebResponse;
  /**
   * Key/value pairs that provide additional information about the result.
   */
  properties?: PropertyBag;
};

/**
 * Contains information about how and when a result was detected.
 * Information about how and when the result was detected.
 */
export type ResultProvenance = {
  /**
   * The Coordinated Universal Time (UTC) date and time at which the result was first detected. See "Date/time properties" in the SARIF spec for the required format.
   */
  firstDetectionTimeUtc?: string;
  /**
   * The Coordinated Universal Time (UTC) date and time at which the result was most recently detected. See "Date/time properties" in the SARIF spec for the required format.
   */
  lastDetectionTimeUtc?: string;
  /**
   * A GUID-valued string equal to the automationDetails.guid property of the run in which the result was first detected.
   */
  firstDetectionRunGuid?: string;
  /**
   * A GUID-valued string equal to the automationDetails.guid property of the run in which the result was most recently detected.
   */
  lastDetectionRunGuid?: string;
  /**
   * The index within the run.invocations array of the invocation object which describes the tool invocation that detected the result.
   */
  invocationIndex?: number;
  /**
   * An array of physicalLocation objects which specify the portions of an analysis tool's output that a converter transformed into the result.
   *
   * @minItems 0
   * @uniqueItems true
   */
  conversionSources?: PhysicalLocation[];
  /**
   * Key/value pairs that provide additional information about the result.
   */
  properties?: PropertyBag;
};

/**
 * Describes a single run of an analysis tool, and contains the reported output of that run.
 */
export type Run = {
  /**
   * Information about the tool or tool pipeline that generated the results in this run. A run can only contain results produced by a single tool or tool pipeline. A run can aggregate results from multiple log files, as long as context around the tool run (tool command-line arguments and the like) is identical for all aggregated files.
   */
  tool: Tool;
  /**
   * Describes the invocation of the analysis tool.
   *
   * @minItems 0
   * @uniqueItems false
   */
  invocations?: Invocation[];
  /**
   * A conversion object that describes how a converter transformed an analysis tool's native reporting format into the SARIF format.
   */
  conversion?: Conversion;
  /**
   * The language of the messages emitted into the log file during this run (expressed as an ISO 639-1 two-letter lowercase culture code) and an optional region (expressed as an ISO 3166-1 two-letter uppercase subculture code associated with a country or region). The casing is recommended but not required (in order for this data to conform to RFC5646).
   */
  language?: string;
  /**
   * Specifies the revision in version control of the artifacts that were scanned.
   *
   * @minItems 0
   * @uniqueItems true
   */
  versionControlProvenance?: VersionControlDetails[];
  /**
   * The artifact location specified by each uriBaseId symbol on the machine where the tool originally ran.
   */
  originalUriBaseIds?: {
    [k: string]: ArtifactLocation;
  };
  /**
   * An array of artifact objects relevant to the run.
   *
   * @minItems 0
   * @uniqueItems true
   */
  artifacts?: Artifact[];
  /**
   * An array of logical locations such as namespaces, types or functions.
   *
   * @minItems 0
   * @uniqueItems true
   */
  logicalLocations?: LogicalLocation[];
  /**
   * An array of zero or more unique graph objects associated with the run.
   *
   * @minItems 0
   * @uniqueItems true
   */
  graphs?: Graph[];
  /**
   * The set of results contained in an SARIF log. The results array can be omitted when a run is solely exporting rules metadata. It must be present (but may be empty) if a log file represents an actual scan.
   *
   * @minItems 0
   * @uniqueItems false
   */
  results?: Result[];
  /**
   * Automation details that describe this run.
   */
  automationDetails?: RunAutomationDetails;
  /**
   * Automation details that describe the aggregate of runs to which this run belongs.
   *
   * @minItems 0
   * @uniqueItems true
   */
  runAggregates?: RunAutomationDetails[];
  /**
   * The 'guid' property of a previous SARIF 'run' that comprises the baseline that was used to compute result 'baselineState' properties for the run.
   */
  baselineGuid?: string;
  /**
   * An array of strings used to replace sensitive information in a redaction-aware property.
   *
   * @minItems 0
   * @uniqueItems true
   */
  redactionTokens?: string[];
  /**
   * Specifies the default encoding for any artifact object that refers to a text file.
   */
  defaultEncoding?: string;
  /**
   * Specifies the default source language for any artifact object that refers to a text file that contains source code.
   */
  defaultSourceLanguage?: string;
  /**
   * An ordered list of character sequences that were treated as line breaks when computing region information for the run.
   *
   * @minItems 1
   * @uniqueItems true
   */
  newlineSequences?: [string, ...string[]];
  /**
   * Specifies the unit in which the tool measures columns.
   */
  columnKind?: 'utf16CodeUnits' | 'unicodeCodePoints';
  /**
   * References to external property files that should be inlined with the content of a root log file.
   */
  externalPropertyFileReferences?: ExternalPropertyFileReferences;
  /**
   * An array of threadFlowLocation objects cached at run level.
   *
   * @minItems 0
   * @uniqueItems true
   */
  threadFlowLocations?: ThreadFlowLocation[];
  /**
   * An array of toolComponent objects relevant to a taxonomy in which results are categorized.
   *
   * @minItems 0
   * @uniqueItems true
   */
  taxonomies?: ToolComponent[];
  /**
   * Addresses associated with this run instance, if any.
   *
   * @minItems 0
   * @uniqueItems false
   */
  addresses?: Address[];
  /**
   * The set of available translations of the localized data provided by the tool.
   *
   * @minItems 0
   * @uniqueItems true
   */
  translations?: ToolComponent[];
  /**
   * Contains configurations that may potentially override both reportingDescriptor.defaultConfiguration (the tool's default severities) and invocation.configurationOverrides (severities established at run-time from the command line).
   *
   * @minItems 0
   * @uniqueItems true
   */
  policies?: ToolComponent[];
  /**
   * An array of request objects cached at run level.
   *
   * @minItems 0
   * @uniqueItems true
   */
  webRequests?: WebRequest[];
  /**
   * An array of response objects cached at run level.
   *
   * @minItems 0
   * @uniqueItems true
   */
  webResponses?: WebResponse[];
  /**
   * A specialLocations object that defines locations of special significance to SARIF consumers.
   */
  specialLocations?: SpecialLocations;
  /**
   * Key/value pairs that provide additional information about the run.
   */
  properties?: PropertyBag;
};

/**
 * Information that describes a run's identity and role within an engineering system process.
 */
export type RunAutomationDetails = {
  /**
   * A description of the identity and role played within the engineering system by this object's containing run object.
   */
  description?: Message;
  /**
   * A hierarchical string that uniquely identifies this object's containing run object.
   */
  id?: string;
  /**
   * A stable, unique identifier for this object's containing run object in the form of a GUID.
   */
  guid?: string;
  /**
   * A stable, unique identifier for the equivalence class of runs to which this object's containing run object belongs in the form of a GUID.
   */
  correlationGuid?: string;
  /**
   * Key/value pairs that provide additional information about the run automation details.
   */
  properties?: PropertyBag;
};

/**
 * A specialLocations object that defines locations of special significance to SARIF consumers.
 */
export type SpecialLocations = {
  /**
   * Provides a suggestion to SARIF consumers to display file paths relative to the specified location.
   */
  displayBase?: ArtifactLocation;
  /**
   * Key/value pairs that provide additional information about the special locations.
   */
  properties?: PropertyBag;
};

/**
 * A call stack that is relevant to a result.
 */
export type Stack = {
  /**
   * A message relevant to this call stack.
   */
  message?: Message;
  /**
   * An array of stack frames that represents a sequence of calls, rendered in reverse chronological order, that comprise the call stack.
   *
   * @minItems 0
   * @uniqueItems false
   */
  frames: StackFrame[];
  /**
   * Key/value pairs that provide additional information about the stack.
   */
  properties?: PropertyBag;
};

/**
 * A function call within a stack trace.
 */
export type StackFrame = {
  /**
   * The location to which this stack frame refers.
   */
  location?: Location;
  /**
   * The name of the module that contains the code of this stack frame.
   */
  module?: string;
  /**
   * The thread identifier of the stack frame.
   */
  threadId?: number;
  /**
   * The parameters of the call that is executing.
   *
   * @minItems 0
   * @uniqueItems false
   */
  parameters?: string[];
  /**
   * Key/value pairs that provide additional information about the stack frame.
   */
  properties?: PropertyBag;
};

/**
 * A suppression that is relevant to a result.
 */
export type Suppression = {
  /**
   * A stable, unique identifier for the suprression in the form of a GUID.
   */
  guid?: string;
  /**
   * A string that indicates where the suppression is persisted.
   */
  kind: 'inSource' | 'external';
  /**
   * A string that indicates the review status of the suppression.
   */
  status?: 'accepted' | 'underReview' | 'rejected';
  /**
   * A string representing the justification for the suppression.
   */
  justification?: string;
  /**
   * Identifies the location associated with the suppression.
   */
  location?: Location;
  /**
   * Key/value pairs that provide additional information about the suppression.
   */
  properties?: PropertyBag;
};

/**
 * Describes a sequence of code locations that specify a path through a single thread of execution such as an operating system or fiber.
 */
export type ThreadFlow = {
  /**
   * An string that uniquely identifies the threadFlow within the codeFlow in which it occurs.
   */
  id?: string;
  /**
   * A message relevant to the thread flow.
   */
  message?: Message;
  /**
   * Values of relevant expressions at the start of the thread flow that may change during thread flow execution.
   */
  initialState?: {
    [k: string]: MultiformatMessageString;
  };
  /**
   * Values of relevant expressions at the start of the thread flow that remain constant.
   */
  immutableState?: {
    [k: string]: MultiformatMessageString;
  };
  /**
   * A temporally ordered array of 'threadFlowLocation' objects, each of which describes a location visited by the tool while producing the result.
   *
   * @minItems 1
   * @uniqueItems false
   */
  locations: [ThreadFlowLocation, ...ThreadFlowLocation[]];
  /**
   * Key/value pairs that provide additional information about the thread flow.
   */
  properties?: PropertyBag;
};

/**
 * A location visited by an analysis tool while simulating or monitoring the execution of a program.
 */
export type ThreadFlowLocation = {
  /**
   * The index within the run threadFlowLocations array.
   */
  index?: number;
  /**
   * The code location.
   */
  location?: Location;
  /**
   * The call stack leading to this location.
   */
  stack?: Stack;
  /**
   * A set of distinct strings that categorize the thread flow location. Well-known kinds include 'acquire', 'release', 'enter', 'exit', 'call', 'return', 'branch', 'implicit', 'false', 'true', 'caution', 'danger', 'unknown', 'unreachable', 'taint', 'function', 'handler', 'lock', 'memory', 'resource', 'scope' and 'value'.
   *
   * @minItems 0
   * @uniqueItems true
   */
  kinds?: string[];
  /**
   * An array of references to rule or taxonomy reporting descriptors that are applicable to the thread flow location.
   *
   * @minItems 0
   * @uniqueItems true
   */
  taxa?: ReportingDescriptorReference[];
  /**
   * The name of the module that contains the code that is executing.
   */
  module?: string;
  /**
   * A dictionary, each of whose keys specifies a variable or expression, the associated value of which represents the variable or expression value. For an annotation of kind 'continuation', for example, this dictionary might hold the current assumed values of a set of global variables.
   */
  state?: {
    [k: string]: MultiformatMessageString;
  };
  /**
   * An integer representing a containment hierarchy within the thread flow.
   */
  nestingLevel?: number;
  /**
   * An integer representing the temporal order in which execution reached this location.
   */
  executionOrder?: number;
  /**
   * The Coordinated Universal Time (UTC) date and time at which this location was executed.
   */
  executionTimeUtc?: string;
  /**
   * Specifies the importance of this location in understanding the code flow in which it occurs. The order from most to least important is "essential", "important", "unimportant". Default: "important".
   */
  importance?: 'important' | 'essential' | 'unimportant';
  /**
   * A web request associated with this thread flow location.
   */
  webRequest?: WebRequest;
  /**
   * A web response associated with this thread flow location.
   */
  webResponse?: WebResponse;
  /**
   * Key/value pairs that provide additional information about the threadflow location.
   */
  properties?: PropertyBag;
};

/**
 * The analysis tool that was run.
 */
export type Tool = {
  /**
   * The analysis tool that was run.
   */
  driver: ToolComponent;
  /**
   * Tool extensions that contributed to or reconfigured the analysis tool that was run.
   *
   * @minItems 0
   * @uniqueItems true
   */
  extensions?: ToolComponent[];
  /**
   * Key/value pairs that provide additional information about the tool.
   */
  properties?: PropertyBag;
};

/**
 * A component, such as a plug-in or the driver, of the analysis tool that was run.
 */
export type ToolComponent = {
  /**
   * A unique identifier for the tool component in the form of a GUID.
   */
  guid?: string;
  /**
   * The name of the tool component.
   */
  name: string;
  /**
   * The organization or company that produced the tool component.
   */
  organization?: string;
  /**
   * A product suite to which the tool component belongs.
   */
  product?: string;
  /**
   * A localizable string containing the name of the suite of products to which the tool component belongs.
   */
  productSuite?: string;
  /**
   * A brief description of the tool component.
   */
  shortDescription?: MultiformatMessageString;
  /**
   * A comprehensive description of the tool component.
   */
  fullDescription?: MultiformatMessageString;
  /**
   * The name of the tool component along with its version and any other useful identifying information, such as its locale.
   */
  fullName?: string;
  /**
   * The tool component version, in whatever format the component natively provides.
   */
  version?: string;
  /**
   * The tool component version in the format specified by Semantic Versioning 2.0.
   */
  semanticVersion?: string;
  /**
   * The binary version of the tool component's primary executable file expressed as four non-negative integers separated by a period (for operating systems that express file versions in this way).
   */
  dottedQuadFileVersion?: string;
  /**
   * A string specifying the UTC date (and optionally, the time) of the component's release.
   */
  releaseDateUtc?: string;
  /**
   * The absolute URI from which the tool component can be downloaded.
   */
  downloadUri?: string;
  /**
   * The absolute URI at which information about this version of the tool component can be found.
   */
  informationUri?: string;
  /**
   * A dictionary, each of whose keys is a resource identifier and each of whose values is a multiformatMessageString object, which holds message strings in plain text and (optionally) Markdown format. The strings can include placeholders, which can be used to construct a message in combination with an arbitrary number of additional string arguments.
   */
  globalMessageStrings?: {
    [k: string]: MultiformatMessageString;
  };
  /**
   * An array of reportingDescriptor objects relevant to the notifications related to the configuration and runtime execution of the tool component.
   *
   * @minItems 0
   * @uniqueItems true
   */
  notifications?: ReportingDescriptor[];
  /**
   * An array of reportingDescriptor objects relevant to the analysis performed by the tool component.
   *
   * @minItems 0
   * @uniqueItems true
   */
  rules?: ReportingDescriptor[];
  /**
   * An array of reportingDescriptor objects relevant to the definitions of both standalone and tool-defined taxonomies.
   *
   * @minItems 0
   * @uniqueItems true
   */
  taxa?: ReportingDescriptor[];
  /**
   * An array of the artifactLocation objects associated with the tool component.
   *
   * @minItems 0
   */
  locations?: ArtifactLocation[];
  /**
   * The language of the messages emitted into the log file during this run (expressed as an ISO 639-1 two-letter lowercase language code) and an optional region (expressed as an ISO 3166-1 two-letter uppercase subculture code associated with a country or region). The casing is recommended but not required (in order for this data to conform to RFC5646).
   */
  language?: string;
  /**
   * The kinds of data contained in this object.
   */
  contents?: ('localizedData' | 'nonLocalizedData')[];
  /**
   * Specifies whether this object contains a complete definition of the localizable and/or non-localizable data for this component, as opposed to including only data that is relevant to the results persisted to this log file.
   */
  isComprehensive?: boolean;
  /**
   * The semantic version of the localized strings defined in this component; maintained by components that provide translations.
   */
  localizedDataSemanticVersion?: string;
  /**
   * The minimum value of localizedDataSemanticVersion required in translations consumed by this component; used by components that consume translations.
   */
  minimumRequiredLocalizedDataSemanticVersion?: string;
  /**
   * The component which is strongly associated with this component. For a translation, this refers to the component which has been translated. For an extension, this is the driver that provides the extension's plugin model.
   */
  associatedComponent?: ToolComponentReference;
  /**
   * Translation metadata, required for a translation, not populated by other component types.
   */
  translationMetadata?: TranslationMetadata;
  /**
   * An array of toolComponentReference objects to declare the taxonomies supported by the tool component.
   *
   * @minItems 0
   * @uniqueItems true
   */
  supportedTaxonomies?: ToolComponentReference[];
  /**
   * Key/value pairs that provide additional information about the tool component.
   */
  properties?: PropertyBag;
};

/**
 * Identifies a particular toolComponent object, either the driver or an extension.
 */
export type ToolComponentReference = {
  /**
   * The 'name' property of the referenced toolComponent.
   */
  name?: string;
  /**
   * An index into the referenced toolComponent in tool.extensions.
   */
  index?: number;
  /**
   * The 'guid' property of the referenced toolComponent.
   */
  guid?: string;
  /**
   * Key/value pairs that provide additional information about the toolComponentReference.
   */
  properties?: PropertyBag;
};

/**
 * Provides additional metadata related to translation.
 */
export type TranslationMetadata = {
  /**
   * The name associated with the translation metadata.
   */
  name: string;
  /**
   * The full name associated with the translation metadata.
   */
  fullName?: string;
  /**
   * A brief description of the translation metadata.
   */
  shortDescription?: MultiformatMessageString;
  /**
   * A comprehensive description of the translation metadata.
   */
  fullDescription?: MultiformatMessageString;
  /**
   * The absolute URI from which the translation metadata can be downloaded.
   */
  downloadUri?: string;
  /**
   * The absolute URI from which information related to the translation metadata can be downloaded.
   */
  informationUri?: string;
  /**
   * Key/value pairs that provide additional information about the translation metadata.
   */
  properties?: PropertyBag;
};

/**
 * Specifies the information necessary to retrieve a desired revision from a version control system.
 */
export type VersionControlDetails = {
  /**
   * The absolute URI of the repository.
   */
  repositoryUri: string;
  /**
   * A string that uniquely and permanently identifies the revision within the repository.
   */
  revisionId?: string;
  /**
   * The name of a branch containing the revision.
   */
  branch?: string;
  /**
   * A tag that has been applied to the revision.
   */
  revisionTag?: string;
  /**
   * A Coordinated Universal Time (UTC) date and time that can be used to synchronize an enlistment to the state of the repository at that time.
   */
  asOfTimeUtc?: string;
  /**
   * The location in the local file system to which the root of the repository was mapped at the time of the analysis.
   */
  mappedTo?: ArtifactLocation;
  /**
   * Key/value pairs that provide additional information about the version control details.
   */
  properties?: PropertyBag;
};

/**
 * Describes an HTTP request.
 */
export type WebRequest = {
  /**
   * The index within the run.webRequests array of the request object associated with this result.
   */
  index?: number;
  /**
   * The request protocol. Example: 'http'.
   */
  protocol?: string;
  /**
   * The request version. Example: '1.1'.
   */
  version?: string;
  /**
   * The target of the request.
   */
  target?: string;
  /**
   * The HTTP method. Well-known values are 'GET', 'PUT', 'POST', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS', 'TRACE', 'CONNECT'.
   */
  method?: string;
  /**
   * The request headers.
   */
  headers?: {
    [k: string]: string;
  };
  /**
   * The request parameters.
   */
  parameters?: {
    [k: string]: string;
  };
  /**
   * The body of the request.
   */
  body?: ArtifactContent;
  /**
   * Key/value pairs that provide additional information about the request.
   */
  properties?: PropertyBag;
};

/**
 * Describes the response to an HTTP request.
 */
export type WebResponse = {
  /**
   * The index within the run.webResponses array of the response object associated with this result.
   */
  index?: number;
  /**
   * The response protocol. Example: 'http'.
   */
  protocol?: string;
  /**
   * The response version. Example: '1.1'.
   */
  version?: string;
  /**
   * The response status code. Example: 451.
   */
  statusCode?: number;
  /**
   * The response reason. Example: 'Not found'.
   */
  reasonPhrase?: string;
  /**
   * The response headers.
   */
  headers?: {
    [k: string]: string;
  };
  /**
   * The body of the response.
   */
  body?: ArtifactContent;
  /**
   * Specifies whether a response was received from the server.
   */
  noResponseReceived?: boolean;
  /**
   * Key/value pairs that provide additional information about the response.
   */
  properties?: PropertyBag;
};
