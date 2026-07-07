// Interface for HTML template data rendering

import type { ContextualizedControl } from 'inspecjs';

// Basic info for exported files; lvl 1
export type IFileInfo = {
  duration: string;
  filename: string;
  platform: string;
  toolVersion: string;
};

// Info used for profile status reporting; lvl 1
export type IStatistics = {
  failed: number;
  failedTests: number;
  notApplicable: number;
  notReviewed: number;
  passed: number;
  passedTests: number;
  passingTestsFailedResult: number;
  profileError: number;
  totalResults: number;
  totalTests: number;
};

// Info used for profile result severity reporting; lvl 1
export type ISeverity = {
  critical: number;
  high: number;
  low: number;
  medium: number;
  none: number;
};

// Info used for profile compliance reporting; lvl 1
export type ICompliance = {
  color: string;
  level: string;
};

// Container for specific info on each result; lvl 2
export type IDetail = {
  class?: string;
  name: string;
  value: string;
};

// Status of a specific result; lvl 2
export type IResultStatus = {
  icon: string;
  status: string;
};

// Severity of a specific result; lvl 2
export type IResultSeverity = {
  icon: string;
  severity: string;
};

// Container for all results; lvl 1
export type IResultSet = {
  fileID: string;
  filename: string;
  results: (ContextualizedControl & { controlTags: string[] } & { details: IDetail[] } & { resultID: string } & { resultSeverity: IResultSeverity } & { resultStatus: IResultStatus })[];
};

// All used icons; lvl 1
export type IIcons = Record<string, string>;

// Top level interface; lvl 0
export type IOutputData = {
  compliance: ICompliance;
  exportType: string;
  files: IFileInfo[];
  icons: IIcons;
  resultSets: IResultSet[];
  severity: ISeverity;
  showCode: boolean;
  showResultSets: boolean;
  statistics: IStatistics;
  tailwindElements: string;
  tailwindStyles: string;
};
