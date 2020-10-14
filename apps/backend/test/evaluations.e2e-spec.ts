import {Test, TestingModule} from '@nestjs/testing';
import {DatabaseService} from './../src/database/database.service';
import {AppModule} from './../src/app.module';
import {INestApplication, ValidationPipe, HttpStatus} from '@nestjs/common';
import request from 'supertest';
import {
  EVALUATION_1,
  UPDATE_EVALUATION,
  EVALUATION_WITH_TAGS_1
} from './constants/evaluations-test.constant';
import {
  CREATE_USER_DTO_TEST_OBJ,
  LOGIN_AUTHENTICATION
} from './constants/users-test.constant';

describe('/evaluations', () => {
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

  describe('Unauthenticated', () => {
    describe('Create', () => {
      it('should return 401 when unauthenticated', async () => {
        await request(app.getHttpServer())
          .post('/evaluations')
          .set('Content-Type', 'application/json')
          .send(EVALUATION_1)
          .expect(HttpStatus.UNAUTHORIZED);
      });
    });

    describe('Read', () => {
      it('should return 401 when unauthenticated', async () => {
        await request(app.getHttpServer())
          .get('/evaluations')
          .expect(HttpStatus.UNAUTHORIZED);
      });
    });

    describe('Update', () => {
      it('should return 401 when unauthenticated', async () => {
        await request(app.getHttpServer())
          .put('/evaluations/1')
          .set('Content-Type', 'application/json')
          .send(UPDATE_EVALUATION)
          .expect(HttpStatus.UNAUTHORIZED);
      });
    });

    describe('Destroy', () => {
      it('should return 401 when unauthenticated', async () => {
        await request(app.getHttpServer())
          .delete('/evaluations/1')
          .expect(HttpStatus.UNAUTHORIZED);
      });
    });
  });

  describe('Authenticated', () => {
    let jwtToken: string;

    beforeEach(async () => {
      await request(app.getHttpServer())
        .post('/users')
        .set('Content-Type', 'application/json')
        .send(CREATE_USER_DTO_TEST_OBJ);

      await request(app.getHttpServer())
        .post('/authn/login')
        .set('Content-Type', 'application/json')
        .send(LOGIN_AUTHENTICATION)
        .then(response => {
          jwtToken = response.body.accessToken;
        });
    });

    describe('Create', () => {
      it('should create an evaluation', async () => {
        await request(app.getHttpServer())
          .post('/evaluations')
          .set('Content-Type', 'application/json')
          .set('Authorization', 'bearer ' + jwtToken)
          .send(EVALUATION_1)
          .expect(HttpStatus.CREATED)
          .then(response => {
            const createdAt = response.body.createdAt.valueOf();
            const updatedAt = response.body.updatedAt.valueOf();

            const createdDelta =
              new Date().getTime() - new Date(createdAt).getTime();
            const updatedDelta =
              new Date().getTime() - new Date(updatedAt).getTime();

            // 1 minute in ms
            expect(createdDelta).toBeLessThanOrEqual(60000);
            expect(updatedDelta).toBeLessThanOrEqual(60000);
            expect(response.body.id).toBeDefined();
            expect(response.body.filename).toEqual(EVALUATION_1.filename);
            expect(response.body.data).toEqual(EVALUATION_1.data);
            expect(response.body.evaluationTags).toEqual(
              EVALUATION_1.evaluationTags
            );
          });
      });

      it('should create an evaluation with tags', async () => {
        await request(app.getHttpServer())
          .post('/evaluations')
          .set('Content-Type', 'application/json')
          .set('Authorization', 'bearer ' + jwtToken)
          .send(EVALUATION_WITH_TAGS_1)
          .expect(HttpStatus.CREATED)
          .then(response => {
            const createdAt = response.body.evaluationTags[0].createdAt.valueOf();
            const updatedAt = response.body.evaluationTags[0].updatedAt.valueOf();

            const createdDelta =
              new Date().getTime() - new Date(createdAt).getTime();
            const updatedDelta =
              new Date().getTime() - new Date(updatedAt).getTime();

            // 1 minute in ms
            expect(createdDelta).toBeLessThanOrEqual(60000);
            expect(updatedDelta).toBeLessThanOrEqual(60000);
            expect(response.body.evaluationTags[0].key).toEqual(
              EVALUATION_WITH_TAGS_1.evaluationTags[0].key
            );
            expect(response.body.evaluationTags[0].value).toEqual(
              EVALUATION_WITH_TAGS_1.evaluationTags[0].value
            );
            expect(response.body.evaluationTags[0].id).toBeDefined();
            expect(response.body.id).toEqual(
              response.body.evaluationTags[0].evaluationId
            );
          });
      });
    });

    describe('With an existing evaluation', () => {
      let evaluation: any;

      beforeEach(async () => {
        await request(app.getHttpServer())
          .post('/evaluations')
          .set('Content-Type', 'application/json')
          .set('Authorization', 'bearer ' + jwtToken)
          .send(EVALUATION_WITH_TAGS_1)
          .then(response => {
            evaluation = response.body;
          });
      });

      describe('Read', () => {
        it('should get a single evaluation', async () => {
          await request(app.getHttpServer())
            .get('/evaluations/' + evaluation.id)
            .set('Authorization', 'bearer ' + jwtToken)
            .expect(HttpStatus.OK)
            .then(response => {
              expect(response.body).toEqual(evaluation);
            });
        });

        it('should get all evaluations', async () => {
          await request(app.getHttpServer())
            .get('/evaluations')
            .set('Authorization', 'bearer ' + jwtToken)
            .expect(HttpStatus.OK)
            .then(response => {
              expect(response.body[0]).toEqual(evaluation);
            });
        });
      });

      describe('Update', () => {
        it('should update an evaluation', async () => {
          await request(app.getHttpServer())
            .put('/evaluations/' + evaluation.id)
            .set('Authorization', 'bearer ' + jwtToken)
            .set(UPDATE_EVALUATION)
            .expect(HttpStatus.OK)
            .then(response => {
              const updatedAt = response.body.updatedAt.valueOf();
              const updatedDelta =
                new Date().getTime() - new Date(updatedAt).getTime();
              expect(updatedDelta).toBeLessThanOrEqual(60000);
              expect(response.body.updatedAt);
              expect(response.body.data).toEqual(evaluation.data);
              expect(response.body.version).toEqual(evaluation.version);
            });
        });
      });

      describe('Destroy', () => {
        it('should delete an evaluation and its tags', async () => {
          await request(app.getHttpServer())
            .delete('/evaluations/' + evaluation.id)
            .set('Authorization', 'bearer ' + jwtToken)
            .expect(HttpStatus.OK)
            .then(response => {
              expect(response.body).toEqual(evaluation);
            });

          await request(app.getHttpServer())
            .get('/evaluation-tags')
            .set('Authorization', 'bearer ' + jwtToken)
            .then(response => {
              // There should be no tags in the database at this point because the evaluation
              // containing them was deleted
              expect(response.body).toEqual([]);
            });
        });
      });
    });
  });

  afterAll(async () => {
    await databaseService.cleanAll();
    await app.close();
    await databaseService.closeConnection();
  });
});
