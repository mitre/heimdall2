import {ApiKeyService} from './apikey.service';
import {ConfigService} from '../config/config.service';
import {getModelToken} from '@nestjs/sequelize';
import {Test} from '@nestjs/testing';
import {ApiKey} from './apikey.model';
import {User} from '../users/user.model';
import {CreateApiKeyDto} from './dto/create-apikey.dto';

describe('ApiKeyService', () => {
  let apiKeyService: ApiKeyService;
  let configService: ConfigService;
  let apiKeyModel: typeof ApiKey;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        ApiKeyService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key: string) => {
              if (key === 'API_KEY_SECRET') return '';
              return undefined;
            })
          }
        },
        {
          provide: getModelToken(ApiKey),
          useValue: {
            create: jest.fn(),
            findOne: jest.fn(),
            findAll: jest.fn(),
            count: jest.fn().mockResolvedValue(0),
            update: jest.fn().mockResolvedValue([1]),
            destroy: jest.fn().mockResolvedValue(1)
          }
        }
      ]
    }).compile();

    apiKeyService = moduleRef.get<ApiKeyService>(ApiKeyService);
    configService = moduleRef.get<ConfigService>(ConfigService);
    apiKeyModel = moduleRef.get<typeof ApiKey>(getModelToken(ApiKey));
  });

  it('should create an API key with empty API_KEY_SECRET', async () => {
    // Mock the functions that would be called during create
    jest.spyOn(apiKeyModel, 'create').mockImplementation((data: any) => {
      return Promise.resolve({
        id: '123',
        name: data.name,
        userId: data.userId,
        groupId: data.groupId,
        type: data.type,
        save: jest.fn().mockResolvedValue(true),
        toJSON: jest.fn().mockReturnValue({
          id: '123',
          name: data.name,
          userId: data.userId,
          groupId: data.groupId,
          type: data.type
        })
      } as any);
    });

    // Create a more complete mock user that matches the model
    const mockUser = {
      id: '1',
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      organization: 'Test Org',
      title: 'Tester',
      encryptedPassword: 'hashedpw',
      forcePasswordChange: false
    } as unknown as User;

    // Create a mock DTO with all required fields
    const createApiKeyDto: CreateApiKeyDto = {
      name: 'Test API Key',
      currentPassword: 'password123'
    };

    // Test that the service can create a key even with empty API_KEY_SECRET
    const result = await apiKeyService.create(mockUser, createApiKeyDto);

    // Check that API key was created successfully
    expect(result).toBeDefined();
    expect(result.id).toBe('123');
    expect(result.name).toBe('Test API Key');
    expect(result.apiKey).toBeDefined();
    
    // Verify that configService.get was called with 'API_KEY_SECRET'
    expect(configService.get).toHaveBeenCalledWith('API_KEY_SECRET');
  });
});