import {ConfigService} from './config.service';

describe('Config Service Empty String Handling', () => {
  // Mock the process.env that ConfigService depends on
  const originalEnv = process.env;
  
  beforeEach(() => {
    // Set up a clean environment for each test
    process.env = {
      ...originalEnv,
      EMPTY_VALUE: '',
      VALID_VALUE: 'valid-data',
      // These are the actual configs we've modified in our PR
      GITHUB_CLIENTID: '',
      OKTA_DOMAIN: 'example.okta.com',
      API_KEY_SECRET: ''
    };
  });

  afterAll(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('Empty string config values', () => {
    it('should return undefined for nonexistent values and empty strings', () => {
      const configService = new ConfigService();
      // Both nonexistent keys and empty strings are returned as undefined by ConfigService
      expect(configService.get('NONEXISTENT_KEY')).toBeUndefined();
      expect(configService.get('EMPTY_VALUE')).toBeUndefined();
    });
    
    it('should correctly handle valid string values', () => {
      const configService = new ConfigService();
      expect(configService.get('VALID_VALUE')).toBe('valid-data');
    });
  });
  
  describe('Fallback behavior with empty or undefined values', () => {
    it('should use default value with logical OR when config returns undefined', () => {
      const configService = new ConfigService();
      
      // This is the pattern we're using in our codebase
      const githubClientId = configService.get('GITHUB_CLIENTID') || 'disabled';
      expect(githubClientId).toBe('disabled');
      
      const apiKeySecret = configService.get('API_KEY_SECRET') || 'default-secret';
      expect(apiKeySecret).toBe('default-secret');
      
      // When value exists, it should use the actual value
      const oktaDomain = configService.get('OKTA_DOMAIN') || 'default-domain';
      expect(oktaDomain).toBe('example.okta.com');
    });
    
    it('should also use default value with nullish coalescing (for undefined values)', () => {
      const configService = new ConfigService();
      
      // Because empty env vars become undefined, nullish coalescing actually behaves the same way
      const githubClientId = configService.get('GITHUB_CLIENTID') ?? 'disabled';
      expect(githubClientId).toBe('disabled'); // Default value is used (because it's undefined)
      
      const apiKeySecret = configService.get('API_KEY_SECRET') ?? 'default-secret';
      expect(apiKeySecret).toBe('default-secret'); // Default value is used
      
      // Both operators behave the same for non-empty values
      const oktaDomain = configService.get('OKTA_DOMAIN') ?? 'default-domain';
      expect(oktaDomain).toBe('example.okta.com');
    });
  });
  
  // This test verifies the behavior with different types of values
  describe('Behavior with different value types', () => {
    it('should correctly handle different value types', () => {
      // Create a mock ConfigService that can return different types
      const mockConfigService = {
        get: jest.fn().mockImplementation((key: string) => {
          switch(key) {
            case 'EMPTY_STRING': return '';
            case 'UNDEFINED_VALUE': return undefined;
            case 'NULL_VALUE': return null;
            case 'ZERO_VALUE': return '0';
            default: return undefined;
          }
        })
      };
      
      // Test with empty string
      // This is the case that would differ between || and ??
      const emptyWithOR = mockConfigService.get('EMPTY_STRING') || 'default';
      const emptyWithNullish = mockConfigService.get('EMPTY_STRING') ?? 'default';
      expect(emptyWithOR).toBe('default'); // || replaces empty string
      expect(emptyWithNullish).toBe(''); // ?? keeps empty string
      
      // For undefined, both behave the same
      const undefinedWithOR = mockConfigService.get('UNDEFINED_VALUE') || 'default';
      const undefinedWithNullish = mockConfigService.get('UNDEFINED_VALUE') ?? 'default';
      expect(undefinedWithOR).toBe('default');
      expect(undefinedWithNullish).toBe('default');
      
      // For null, both behave the same
      const nullWithOR = mockConfigService.get('NULL_VALUE') || 'default';
      const nullWithNullish = mockConfigService.get('NULL_VALUE') ?? 'default';
      expect(nullWithOR).toBe('default');
      expect(nullWithNullish).toBe('default');
      
      // For zero string, they behave the same (string '0' is truthy)
      const zeroWithOR = mockConfigService.get('ZERO_VALUE') || 'default';
      const zeroWithNullish = mockConfigService.get('ZERO_VALUE') ?? 'default';
      expect(zeroWithOR).toBe('0'); // string '0' is not falsy
      expect(zeroWithNullish).toBe('0'); // ?? preserves '0'
      
      // But numeric 0 would be treated differently
      const numericZero = 0;
      expect(numericZero || 'default').toBe('default'); // numeric 0 is falsy
      expect(numericZero ?? 'default').toBe(0); // numeric 0 is preserved with ??
    });
    
    // This test explains why we need to use || for backward compatibility in our codebase
    it('should demonstrate why || is necessary for backward compatibility', () => {
      // Test with an empty string directly
      // This shows the important distinction that matters in our code changes
      const emptyValue = '';
      
      const resultWithOR = emptyValue || 'disabled';
      const resultWithNullish = emptyValue ?? 'disabled';
      
      expect(resultWithOR).toBe('disabled'); // What we need: empty string is replaced
      expect(resultWithNullish).toBe(''); // Not what we want: empty string is preserved
    });
  });
});