// Interface for HTML template data rendering

import {ContextualizedControl} from 'inspecjs';

// Basic info for exported files; lvl 1
export interface IFileInfo {
  filename: string;
  toolVersion: string;
  platform: string;
  duration: string;
}

// Info used for profile status reporting; lvl 1
export interface IStatistics {
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
export interface ISeverity {
  none: number;
  low: number;
  medium: number;
  high: number;
  critical: number;
}

// Info used for profile compliance reporting; lvl 1
export interface ICompliance {
  level: string;
  color: string;
}

// Container for specific info on each result; lvl 2
export interface IDetail {
  name: string;
  value: string;
  class?: string;
}

// Status of a specific result; lvl 2
export interface IResultStatus {
  status: string;
  icon: string;
}

// Severity of a specific result; lvl 2
export interface IResultSeverity {
  severity: string;
  icon: string;
}

// Container for all results; lvl 1
export interface IResultSet {
  filename: string;
  fileID: string;
  results: (ContextualizedControl & {details: IDetail[]} & {
    resultID: string;
  } & {resultStatus: IResultStatus} & {resultSeverity: IResultSeverity} & {
    controlTags: string[];
  })[];
}

// All used icons; lvl 1
export interface IIcons {
  [key: string]: string;
}

// Top level interface; lvl 0
export interface IOutputData {
  tailwindStyles: string;
  tailwindElements: string;
  files: IFileInfo[];
  statistics: IStatistics;
  severity: ISeverity;
  compliance: ICompliance;
  resultSets: IResultSet[];
  showResultSets: boolean;
  showCode: boolean;
  exportType: string;
  icons: IIcons;
}
