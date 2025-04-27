// These tests verify the behavior of logical OR vs nullish coalescing operators
describe('Logical OR vs Nullish Coalescing behavior', () => {
  it('should use different fallback behavior for empty strings', () => {
    // With logical OR, empty strings are falsy and trigger fallback
    const emptyString = '';
    // Using separate variables to avoid TypeScript warnings
    // @ts-ignore
    const resultWithOR = emptyString || 'fallback';
    expect(resultWithOR).toBe('fallback');
    
    // With nullish coalescing, empty strings are NOT nullish and do NOT trigger fallback
    // @ts-ignore
    const resultWithNullish = emptyString ?? 'fallback';
    expect(resultWithNullish).toBe('');
  });
  
  it('should use same behavior for undefined/null', () => {
    // Both operators treat undefined as a reason to use the fallback
    let undefinedValue: string | undefined;
    // @ts-ignore
    const resultWithOR1 = undefinedValue || 'fallback';
    // @ts-ignore
    const resultWithNullish1 = undefinedValue ?? 'fallback';
    
    expect(resultWithOR1).toBe('fallback');
    expect(resultWithNullish1).toBe('fallback');
    
    // Both operators treat null as a reason to use the fallback
    const nullValue: string | null = null;
    // @ts-ignore
    const resultWithOR2 = nullValue || 'fallback';
    // @ts-ignore
    const resultWithNullish2 = nullValue ?? 'fallback';
    
    expect(resultWithOR2).toBe('fallback');
    expect(resultWithNullish2).toBe('fallback');
  });
  
  it('should have different behaviors for other falsy values', () => {
    // OR treats 0, false as falsy, triggering fallback
    const zeroValue = 0;
    const falseValue = false;
    
    // @ts-ignore
    expect(zeroValue || 'fallback').toBe('fallback');
    // @ts-ignore
    expect(falseValue || 'fallback').toBe('fallback');
    
    // Nullish coalescing preserves 0, false (not nullish)
    // @ts-ignore
    expect(zeroValue ?? 'fallback').toBe(0);
    // @ts-ignore
    expect(falseValue ?? 'fallback').toBe(false);
  });

  // This test explains why we use || for backward compatibility in our codebase
  it('should explain the importance of using || for config values', () => {
    const mockConfig = {
      get: jest.fn().mockImplementation((key: string): string | undefined | null => {
        if (key === 'CLIENT_ID') return ''; // Empty string
        if (key === 'API_SECRET') return undefined; // Undefined
        return null; // Default case
      })
    };

    // Test with logical OR (what we want for backward compatibility)
    const clientId: string = mockConfig.get('CLIENT_ID') as string;
    // @ts-ignore
    const clientIdWithOR = clientId || 'default-id';
    expect(clientIdWithOR).toBe('default-id'); // Empty string is replaced
    
    // Test with nullish coalescing (behavior we want to avoid)
    // @ts-ignore
    const clientIdWithNullish = clientId ?? 'default-id';
    expect(clientIdWithNullish).toBe(''); // Empty string is preserved (not what we want)
    
    // Both work the same for undefined/null
    const apiSecret = mockConfig.get('API_SECRET');
    // @ts-ignore
    const apiSecretWithOR = apiSecret || 'default-secret';
    // @ts-ignore
    const apiSecretWithNullish = apiSecret ?? 'default-secret';
    expect(apiSecretWithOR).toBe('default-secret');
    expect(apiSecretWithNullish).toBe('default-secret');
  });
});