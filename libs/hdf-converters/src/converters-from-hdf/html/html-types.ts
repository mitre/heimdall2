// Interface for HTML template data rendering

import type {ContextualizedControl} from 'inspecjs';

// Basic info for exported files; lvl 1
export type IFileInfo = {
  filename: string;
  toolVersion: string;
  platform: string;
  duration: string;
};

// Info used for profile status reporting; lvl 1
export type IStatistics = {
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
};

// Info used for profile result severity reporting; lvl 1
export type ISeverity = {
  none: number;
  low: number;
  medium: number;
  high: number;
  critical: number;
};

// Info used for profile compliance reporting; lvl 1
export type ICompliance = {
  level: string;
  color: string;
};

// Container for specific info on each result; lvl 2
export type IDetail = {
  name: string;
  value: string;
  class?: string;
};

// Status of a specific result; lvl 2
export type IResultStatus = {
  status: string;
  icon: string;
};

// Severity of a specific result; lvl 2
export type IResultSeverity = {
  severity: string;
  icon: string;
};

// Container for all results; lvl 1
export type IResultSet = {
  filename: string;
  fileID: string;
  results: (ContextualizedControl & {details: IDetail[]} & {
    resultID: string;
  } & {resultStatus: IResultStatus} & {resultSeverity: IResultSeverity} & {
    controlTags: string[];
  })[];
};

// All used icons; lvl 1
export type IIcons = Record<string, string>;

// Top level interface; lvl 0
export type IOutputData = {
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
};
