/*  Provides unified compliance formatting function for compliance summaries used across both Results.vue and ExportHTMLModal.vue */

export const MAX_DECIMAL_PRECISION = 2;

// Format all final compliance level results to hundredths place percentage of compliance level
// Returns string typed compliance level
export function formatCompliance(rawCompliance: number): string {
  let truncatedCompliance =
    Math.trunc(Math.pow(10, MAX_DECIMAL_PRECISION) * rawCompliance) /
    Math.pow(10, MAX_DECIMAL_PRECISION);

  // Check if calculated compliance is valid
  if (truncatedCompliance < 0) {
    truncatedCompliance = 0;
  }

  // Return as string representation of compliance level percentage
  return `${truncatedCompliance.toFixed(MAX_DECIMAL_PRECISION)}%`;
}

// Takes formatted compliance level and determines human language equivalent of compliance
// >=90 is high compliance, >= 60 is medium compliance, <60 is low compliance
// Mainly for HTML export
export function translateCompliance(rawCompliance: string): string {
  const compliance = parseFloat(rawCompliance.slice(0, -1));

  if (compliance >= 90) {
    return 'high';
  } else if (compliance >= 60) {
    return 'medium';
  } else {
    return 'low';
  }
}
