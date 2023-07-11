// Prompt user input in field
export const requireFieldRule = (v: string | null | undefined) =>
  (v ?? '').trim().length > 0 || 'Field is Required';
