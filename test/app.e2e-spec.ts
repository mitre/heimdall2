import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(() => {
    app.close();
  });

  it('/ (GET)', () => {
    // return request(app.getHttpServer())
    //   .get('/')
    //   .expect(200)
    //   .expect('Hello World!');
  });

  //     it("should test create function when passwords do not match", async () => {
  //         expect.assertions(2);
  //         try {
  //             await usersController.create(CREATE_USER_DTO_TEST_OBJ_WITH_UNMATCHING_PASSWORDS);
  //         }
  //         catch(e) {
  //             expect(e).toBeInstanceOf(BadRequestException);
  //             expect(e.message).toBe("Passwords do not match");
  //         }
  //     });
});
