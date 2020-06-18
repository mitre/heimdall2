import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { INestApplication, ValidationPipe, HttpStatus } from '@nestjs/common';
import { AppModule } from './../src/app.module';
import { DatabaseService } from './../src/database/database.service';
import { CREATE_USER_DTO_TEST_OBJ } from './test.constants';

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let databaseService: DatabaseService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
      providers: [DatabaseService]
    }).compile();

    databaseService = moduleFixture.get<DatabaseService>(DatabaseService);

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true
      })
    );
    await app.init();
  });

  beforeEach(async () => {
    await databaseService.cleanAll();
  });

  describe('/users', () => {
    it('should POST', async () => {
      return request(app.getHttpServer()).post('/users').set('Content-Type', 'application/json').send(CREATE_USER_DTO_TEST_OBJ).expect(HttpStatus.CREATED).then(response => {
        expect(response.body.email).toEqual('abc@yahoo.com')
      });
    });
  });

  afterAll(async () => {
    await app.close();
    await databaseService.closeConnection();
  });
});
