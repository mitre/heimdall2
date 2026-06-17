// Prompt user input in field
export const requireFieldRule = (v: null | string | undefined) =>
  (v ?? '').trim().length > 0 || 'Field is Required';
