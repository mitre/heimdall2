import {sanitize} from './database.module';

describe('Database module sanitize function', () => {
  it('should handle undefined values correctly', () => {
    const fields = ['field1', 'password', 'username'];
    const values = undefined;
    
    const result = sanitize(fields, values);
    expect(result).toEqual([]);
  });

  it('should handle empty array values correctly', () => {
    const fields = ['field1', 'password', 'username'];
    const values: string[] = [];
    
    const result = sanitize(fields, values);
    expect(result).toEqual([]);
  });

  it('should map values without redaction (no sensitive fields)', () => {
    const fields = ['id', 'field1', 'username'];
    const values = ['1', 'value1', 'testuser'];
    
    const result = sanitize(fields, values);
    // This test checks that values are passed through when no sensitive fields are found
    expect(result).toEqual(['1', 'value1', 'testuser']);
  });

  it('should handle values array without modification when fields don\'t match sensitive patterns', () => {
    const fields = ['id', 'field1', 'username'];
    const values = ['1', '', 'testuser'];
    
    const result = sanitize(fields, values);
    expect(result).toEqual(['1', '', 'testuser']);
  });
});