// Interface for HTML template data rendering

import {ContextualizedControl} from 'inspecjs';

// Basic info for exported files; lvl 1
export interface FileInfo {
  filename: string;
  toolVersion: string;
  platform: string;
  duration: string;
}

// Info used for profile status reporting; lvl 1
export interface Statistics {
  passed: number;
  failed: number;
  notApplicable: number;
  notReviewed: number;
  profileError: number;
  totalResults: number;
  passedTests: number;
  passingTestsFailedResult: number;
  failedTests: number;
  totalTests: number;
}

// Info used for profile result severity reporting; lvl 1
export interface Severity {
  none: number;
  low: number;
  medium: number;
  high: number;
  critical: number;
}

// Info used for profile compliance reporting; lvl 1
export interface Compliance {
  level: string;
  color: string;
}

// Container for specific info on each result; lvl 2
export interface Detail {
  name: string;
  value: string;
  class?: string;
}

// Status of a specific result; lvl 2
export interface ResultStatus {
  status: string;
  icon: string;
}

// Severity of a specific result; lvl 2
export interface ResultSeverity {
  severity: string;
  icon: string;
}

// Container for all results; lvl 1
export interface ResultSet {
  filename: string;
  fileID: string;
  results: (ContextualizedControl & {details: Detail[]} & {
    resultID: string;
  } & {resultStatus: ResultStatus} & {resultSeverity: ResultSeverity} & {
    controlTags: string[];
  })[];
}

// All used icons; lvl 1
export interface Icons {
  [key: string]: string;
}

// Top level interface; lvl 0
export interface OutputData {
  tailwindStyles: string;
  tailwindElements: string;
  files: FileInfo[];
  statistics: Statistics;
  severity: Severity;
  compliance: Compliance;
  resultSets: ResultSet[];
  showResultSets: boolean;
  showCode: boolean;
  exportType: string;
  icons: Icons;
}
