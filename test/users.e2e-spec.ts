import { Test, TestingModule } from "@nestjs/testing";
import request from "supertest";
import { INestApplication, ValidationPipe, HttpStatus } from "@nestjs/common";
import { AppModule } from "./../src/app.module";
import { DatabaseService } from "./../src/database/database.service";
import {
  CREATE_USER_DTO_TEST_OBJ,
  CREATE_USER_DTO_TEST_OBJ_WITH_UNMATCHING_PASSWORDS,
  CREATE_USER_DTO_TEST_OBJ_WITH_INVALID_EMAIL_FIELD,
  CREATE_USER_DTO_TEST_OBJ_WITH_MISSING_PASSWORD_FIELD,
  CREATE_USER_DTO_TEST_OBJ_WITH_MISSING_PASSWORD_CONFIRMATION_FIELD,
  LOGIN_AUTHENTICATION,
  UPDATE_USER_DTO_TEST_OBJ_WITH_UPDATED_PASSWORD,
  UPDATE_USER_DTO_WITH_MISSING_CURRENT_PASSWORD_FIELD,
  UPDATE_USER_DTO_WITH_INVALID_CURRENT_PASSWORD,
  DELETE_USER_DTO_TEST_OBJ,
  CREATE_ADMIN_DTO,
  CREATE_USER_DTO_TEST_OBJ_WITH_MISSING_ROLE,
  MINUTE_IN_MILLISECONDS,
  CREATE_USER_DTO_TEST_OBJ_WITH_MISSING_EMAIL_FIELD,
  CREATE_USER_DTO_TEST_OBJ_WITH_INVALID_PASSWORD,
  UPDATE_USER_DTO_TEST_WITH_NOT_COMPLEX_PASSWORD,
  UPDATE_USER_DTO_TEST_OBJ_WITH_MISSMATCHING_PASSWORDS,
  UPDATE_USER_DTO_WITHOUT_PASSWORD_FIELDS,
  ADMIN_LOGIN_AUTHENTICATION,
  DELETE_FAILURE_USER_DTO_TEST_OBJ
} from "./constants/users-test.constant";
import { AuthzService } from "../src/authz/authz.service";
import {
  USER_DELETE_USERS_POLICY_DTO,
  USER_UPDATE_USERS_POLICY_DTO
} from "./constants/policy-test.constant";

describe("/users", () => {
  let app: INestApplication;
  let databaseService: DatabaseService;
  let authzService: AuthzService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
      providers: [DatabaseService, AuthzService]
    }).compile();

    databaseService = moduleFixture.get<DatabaseService>(DatabaseService);
    authzService = moduleFixture.get<AuthzService>(AuthzService);

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true
      })
    );
    await app.init();
  });

  describe("Create", () => {
    beforeEach(async () => {
      await databaseService.cleanAll();
    });

    it("should return 201 status when user is created", async () => {
      await request(app.getHttpServer())
        .post("/users")
        .set("Content-Type", "application/json")
        .send(CREATE_USER_DTO_TEST_OBJ)
        .expect(HttpStatus.CREATED)
        .then(response => {
          const createdAt = response.body.createdAt.valueOf();
          const updatedAt = response.body.updatedAt.valueOf();
          // User should have been created within the last minuted
          const createdWithinOneMinute =
            new Date().getTime() - new Date(createdAt).getTime();
          // User should have been updated within the last minuted
          const updatedWithinOneMinute =
            new Date().getTime() - new Date(updatedAt).getTime();

          expect(createdWithinOneMinute).toBeLessThanOrEqual(
            MINUTE_IN_MILLISECONDS
          );
          expect(response.body.email).toEqual(CREATE_USER_DTO_TEST_OBJ.email);
          expect(response.body.firstName).toEqual(
            CREATE_USER_DTO_TEST_OBJ.firstName
          );
          expect(response.body.id).toBeDefined();
          expect(response.body.lastLogin).toEqual(null);
          expect(response.body.lastName).toEqual(
            CREATE_USER_DTO_TEST_OBJ.lastName
          );
          expect(response.body.loginCount).toEqual("0");
          expect(response.body.organization).toEqual(
            CREATE_USER_DTO_TEST_OBJ.organization
          );
          expect(response.body.role).toEqual(CREATE_USER_DTO_TEST_OBJ.role);
          expect(response.body.title).toEqual(CREATE_USER_DTO_TEST_OBJ.title);
          expect(updatedWithinOneMinute).toBeLessThanOrEqual(
            MINUTE_IN_MILLISECONDS
          );
        });
    });

    it("should return 400 status if email is not provided", async () => {
      return await request(app.getHttpServer())
        .post("/users")
        .set("Content-Type", "application/json")
        .send(CREATE_USER_DTO_TEST_OBJ_WITH_MISSING_EMAIL_FIELD)
        .expect(HttpStatus.BAD_REQUEST)
        .then(response => {
          expect(response.body.message[0]).toEqual("email should not be empty");
          expect(response.body.error).toEqual("Bad Request");
        });
    });

    it("should return 400 status if invalid email is provided", async () => {
      return await request(app.getHttpServer())
        .post("/users")
        .set("Content-Type", "application/json")
        .send(CREATE_USER_DTO_TEST_OBJ_WITH_INVALID_EMAIL_FIELD)
        .expect(HttpStatus.BAD_REQUEST)
        .then(response => {
          expect(response.body.message[0]).toEqual("email must be an email");
          expect(response.body.error).toEqual("Bad Request");
        });
    });

    it("should return 500 status if already exisitng email is given", async () => {
      await request(app.getHttpServer())
        .post("/users")
        .set("Content-Type", "application/json")
        .send(CREATE_USER_DTO_TEST_OBJ)
        .expect(HttpStatus.CREATED);
      return await request(app.getHttpServer())
        .post("/users")
        .set("Content-Type", "application/json")
        .send(CREATE_USER_DTO_TEST_OBJ)
        .expect(HttpStatus.INTERNAL_SERVER_ERROR)
        .then(response => {
          expect(response.body.messages[0].email).toEqual(
            "email must be unique"
          );
          expect(response.body.error).toEqual("Internal Server Error");
        });
    });

    it("should return 400 status if passwords dont match", async () => {
      return await request(app.getHttpServer())
        .post("/users")
        .set("Content-Type", "application/json")
        .send(CREATE_USER_DTO_TEST_OBJ_WITH_UNMATCHING_PASSWORDS)
        .expect(HttpStatus.BAD_REQUEST)
        .then(response => {
          expect(response.body.message).toEqual("Passwords do not match");
          expect(response.body.error).toEqual("Bad Request");
        });
    });

    it("should return 400 status if password is not provided", async () => {
      return await request(app.getHttpServer())
        .post("/users")
        .set("Content-Type", "application/json")
        .send(CREATE_USER_DTO_TEST_OBJ_WITH_MISSING_PASSWORD_FIELD)
        .expect(HttpStatus.BAD_REQUEST)
        .then(response => {
          expect(response.body.message[0]).toEqual(
            "password should not be empty"
          );
          expect(response.body.error).toEqual("Bad Request");
        });
    });

    it("should return 400 status if passwordConfirmation is not provided", async () => {
      return await request(app.getHttpServer())
        .post("/users")
        .set("Content-Type", "application/json")
        .send(CREATE_USER_DTO_TEST_OBJ_WITH_MISSING_PASSWORD_CONFIRMATION_FIELD)
        .expect(HttpStatus.BAD_REQUEST)
        .then(response => {
          expect(response.body.message[0]).toEqual(
            "passwordConfirmation should not be empty"
          );
          expect(response.body.error).toEqual("Bad Request");
        });
    });

    it("should return 400 status if password does not meet complexity requirements", async () => {
      return await request(app.getHttpServer())
        .post("/users")
        .set("Content-Type", "application/json")
        .send(CREATE_USER_DTO_TEST_OBJ_WITH_INVALID_PASSWORD)
        .expect(HttpStatus.BAD_REQUEST)
        .then(response => {
          expect(response.body.message).toEqual(
            "Password does not meet complexity requirements. Passwords are a minimum of 15 characters in length. Passwords " +
              "must contain at least one special character, number, upper-case letter, and lower-case letter. Passwords cannot contain more than three consecutive repeating " +
              "characters. Passwords cannot contain more than four repeating characters from the same character class."
          );
          expect(response.body.error).toEqual("Bad Request");
        });
    });

    it("should return 400 status if no role is provided", async () => {
      return await request(app.getHttpServer())
        .post("/users")
        .set("Content-Type", "application/json")
        .send(CREATE_USER_DTO_TEST_OBJ_WITH_MISSING_ROLE)
        .expect(HttpStatus.BAD_REQUEST)
        .then(response => {
          expect(response.body.message[0]).toEqual("role should not be empty");
          expect(response.body.error).toEqual("Bad Request");
        });
    });
  });

  describe("Functions that require authentication", () => {
    let id;
    let jwtToken;

    // Clear the database and retrieve access token
    beforeEach(async () => {
      await databaseService.cleanAll();
      id;
      await request(app.getHttpServer())
        .post("/users")
        .set("Content-Type", "application/json")
        .send(CREATE_USER_DTO_TEST_OBJ)
        .expect(HttpStatus.CREATED)
        .then(response => {
          id = response.body.id;
        });

      jwtToken;
      await request(app.getHttpServer())
        .post("/authn/login")
        .set("Content-Type", "application/json")
        .send(LOGIN_AUTHENTICATION)
        .expect(HttpStatus.CREATED)
        .then(response => {
          jwtToken = response.body.accessToken;
        });
    });

    describe("Read", () => {
      it("should return 200 status when user is returned", async () => {
        return await request(app.getHttpServer())
          .get("/users/" + id)
          .set("Authorization", "bearer " + jwtToken)
          .expect(HttpStatus.OK)
          .then(response => {
            const createdAt = response.body.createdAt.valueOf();
            const updatedAt = response.body.updatedAt.valueOf();
            // User should have been created within the last minuted
            const createdWithinOneMinute =
              new Date().getTime() - new Date(createdAt).getTime();
            // User should have been updated within the last minuted
            const updatedWithinOneMinute =
              new Date().getTime() - new Date(updatedAt).getTime();

            expect(createdWithinOneMinute).toBeLessThanOrEqual(
              MINUTE_IN_MILLISECONDS
            );
            expect(response.body.email).toEqual(CREATE_USER_DTO_TEST_OBJ.email);
            expect(response.body.firstName).toEqual(
              CREATE_USER_DTO_TEST_OBJ.firstName
            );
            expect(response.body.id).toEqual(id);
            expect(response.body.lastLogin).toEqual(null);
            expect(response.body.lastName).toEqual(
              CREATE_USER_DTO_TEST_OBJ.lastName
            );
            expect(response.body.loginCount).toEqual("0");
            expect(response.body.organization).toEqual(
              CREATE_USER_DTO_TEST_OBJ.organization
            );
            expect(response.body.role).toEqual(CREATE_USER_DTO_TEST_OBJ.role);
            expect(response.body.title).toEqual(CREATE_USER_DTO_TEST_OBJ.title);
            expect(updatedWithinOneMinute).toBeLessThanOrEqual(
              MINUTE_IN_MILLISECONDS
            );
          });
      });

      it("should return 400 status if given invalid token", async () => {
        const invalidID = -1;
        return await request(app.getHttpServer())
          .get("/users/" + invalidID)
          .set("Authorization", "bearer " + "badtoken")
          .expect(HttpStatus.UNAUTHORIZED)
          .then(response => {
            expect(response.body.message).toEqual("Unauthorized");
          });
      });
    });

    describe("Update", () => {
      beforeEach(async () => {
        await authzService.abac.allow(USER_UPDATE_USERS_POLICY_DTO);
      });
      it("should return 200 status when user is updated", async () => {
        return await request(app.getHttpServer())
          .put("/users/" + id)
          .set("Authorization", "bearer " + jwtToken)
          .send(UPDATE_USER_DTO_TEST_OBJ_WITH_UPDATED_PASSWORD)
          .expect(HttpStatus.OK)
          .then(response => {
            expect(response.body.email).toEqual(
              UPDATE_USER_DTO_TEST_OBJ_WITH_UPDATED_PASSWORD.email
            );
            expect(response.body.firstName).toEqual(
              UPDATE_USER_DTO_TEST_OBJ_WITH_UPDATED_PASSWORD.firstName
            );
            expect(response.body.id).toEqual(id);
            expect(response.body.lastName).toEqual(
              UPDATE_USER_DTO_TEST_OBJ_WITH_UPDATED_PASSWORD.lastName
            );
            expect(response.body.organization).toEqual(
              UPDATE_USER_DTO_TEST_OBJ_WITH_UPDATED_PASSWORD.organization
            );
            expect(response.body.title).toEqual(
              UPDATE_USER_DTO_TEST_OBJ_WITH_UPDATED_PASSWORD.title
            );
            expect(response.body.role).toEqual(
              UPDATE_USER_DTO_TEST_OBJ_WITH_UPDATED_PASSWORD.role
            );
          });
      });

      it("should return 200 status when user is updated without changing password", async () => {
        return await request(app.getHttpServer())
          .put("/users/" + id)
          .set("Authorization", "bearer " + jwtToken)
          .send(UPDATE_USER_DTO_WITHOUT_PASSWORD_FIELDS)
          .expect(HttpStatus.OK)
          .then(response => {
            expect(response.body.email).toEqual(
              UPDATE_USER_DTO_WITHOUT_PASSWORD_FIELDS.email
            );
            expect(response.body.firstName).toEqual(
              UPDATE_USER_DTO_WITHOUT_PASSWORD_FIELDS.firstName
            );
            expect(response.body.id).toEqual(id);
            expect(response.body.lastName).toEqual(
              UPDATE_USER_DTO_WITHOUT_PASSWORD_FIELDS.lastName
            );
            expect(response.body.organization).toEqual(
              UPDATE_USER_DTO_WITHOUT_PASSWORD_FIELDS.organization
            );
            expect(response.body.title).toEqual(
              UPDATE_USER_DTO_WITHOUT_PASSWORD_FIELDS.title
            );
            expect(response.body.role).toEqual(
              UPDATE_USER_DTO_WITHOUT_PASSWORD_FIELDS.role
            );
          });
      });

      it("should return 400 status when currentPassword is empty", async () => {
        return await request(app.getHttpServer())
          .put("/users/" + id)
          .set("Authorization", "bearer " + jwtToken)
          .send(UPDATE_USER_DTO_WITH_MISSING_CURRENT_PASSWORD_FIELD)
          .expect(HttpStatus.BAD_REQUEST)
          .then(response => {
            expect(response.body.message[0]).toEqual(
              "currentPassword should not be empty"
            );
            expect(response.body.error).toEqual("Bad Request");
          });
      });

      it("should return 401 status when currentPassword is wrong", async () => {
        return request(app.getHttpServer())
          .put("/users/" + id)
          .set("Authorization", "bearer " + jwtToken)
          .send(UPDATE_USER_DTO_WITH_INVALID_CURRENT_PASSWORD)
          .expect(HttpStatus.UNAUTHORIZED);
      });

      it("should return 400 status when password does not meet complexity requirements", async () => {
        return await request(app.getHttpServer())
          .put("/users/" + id)
          .set("Authorization", "bearer " + jwtToken)
          .send(UPDATE_USER_DTO_TEST_WITH_NOT_COMPLEX_PASSWORD)
          .expect(HttpStatus.BAD_REQUEST)
          .then(response => {
            expect(response.body.message).toEqual(
              "Password does not meet complexity requirements. Passwords are a minimum of 15 characters in length. Passwords " +
                "must contain at least one special character, number, upper-case letter, and lower-case letter. Passwords cannot contain more than three consecutive repeating " +
                "characters. Passwords cannot contain more than four repeating characters from the same character class."
            );
            expect(response.body.error).toEqual("Bad Request");
          });
      });

      it("should return 400 status when password and passwordConfirmation dont match", async () => {
        return await request(app.getHttpServer())
          .put("/users/" + id)
          .set("Authorization", "bearer " + jwtToken)
          .send(UPDATE_USER_DTO_TEST_OBJ_WITH_MISSMATCHING_PASSWORDS)
          .expect(HttpStatus.BAD_REQUEST)
          .then(response => {
            expect(response.body.message).toEqual("Passwords do not match");
            expect(response.body.error).toEqual("Bad Request");
          });
      });
    });

    describe("Destroy", () => {
      beforeEach(async () => {
        await authzService.abac.allow(USER_DELETE_USERS_POLICY_DTO);
      });
      it("should return 200 status after user is deleted", async () => {
        return await request(app.getHttpServer())
          .delete("/users/" + id)
          .set("Authorization", "bearer " + jwtToken)
          .send(DELETE_USER_DTO_TEST_OBJ)
          .expect(HttpStatus.OK)
          .then(response => {
            const createdAt = response.body.createdAt.valueOf();
            const updatedAt = response.body.updatedAt.valueOf();
            // User should have been created within the last minuted
            const createdWithinOneMinute =
              new Date().getTime() - new Date(createdAt).getTime();
            // User should have been updated within the last minuted
            const updatedWithinOneMinute =
              new Date().getTime() - new Date(updatedAt).getTime();

            expect(createdWithinOneMinute).toBeLessThanOrEqual(
              MINUTE_IN_MILLISECONDS
            );
            expect(response.body.email).toEqual(CREATE_USER_DTO_TEST_OBJ.email);
            expect(response.body.firstName).toEqual(
              CREATE_USER_DTO_TEST_OBJ.firstName
            );
            expect(response.body.id).toEqual(id);
            expect(response.body.lastLogin).toEqual(null);
            expect(response.body.lastName).toEqual(
              CREATE_USER_DTO_TEST_OBJ.lastName
            );
            expect(response.body.loginCount).toEqual("0");
            expect(response.body.organization).toEqual(
              CREATE_USER_DTO_TEST_OBJ.organization
            );
            expect(response.body.role).toEqual(CREATE_USER_DTO_TEST_OBJ.role);
            expect(response.body.title).toEqual(CREATE_USER_DTO_TEST_OBJ.title);
            expect(updatedWithinOneMinute).toBeLessThanOrEqual(
              MINUTE_IN_MILLISECONDS
            );
          });
      });

      it("should return 401 status because password is wrong", async () => {
        return request(app.getHttpServer())
          .delete("/users/" + id)
          .set("Authorization", "bearer " + jwtToken)
          .send(DELETE_FAILURE_USER_DTO_TEST_OBJ)
          .expect(HttpStatus.UNAUTHORIZED);
      });

      it("should return 200 status after user is deleted by admin", async () => {
        let adminID;
        await request(app.getHttpServer())
          .post("/users")
          .set("Content-Type", "application/json")
          .send(CREATE_ADMIN_DTO)
          .expect(HttpStatus.CREATED)
          .then(response => {
            adminID = response.body.id;
          });

        let adminJWTToken;
        await request(app.getHttpServer())
          .post("/authn/login")
          .set("Content-Type", "application/json")
          .send(ADMIN_LOGIN_AUTHENTICATION)
          .expect(HttpStatus.CREATED)
          .then(response => {
            adminJWTToken = response.body.accessToken;
          });

        await request(app.getHttpServer())
          .delete("/users/" + adminID)
          .set("Authorization", "bearer " + adminJWTToken)
          .send(DELETE_USER_DTO_TEST_OBJ)
          .expect(HttpStatus.OK)
          .then(response => {
            const createdAt = response.body.createdAt.valueOf();
            const updatedAt = response.body.updatedAt.valueOf();
            // User should have been created within the last minuted
            const createdWithinOneMinute =
              new Date().getTime() - new Date(createdAt).getTime();
            // User should have been updated within the last minuted
            const updatedWithinOneMinute =
              new Date().getTime() - new Date(updatedAt).getTime();

            expect(createdWithinOneMinute).toBeLessThanOrEqual(
              MINUTE_IN_MILLISECONDS
            );
            expect(response.body.email).toEqual(CREATE_ADMIN_DTO.email);
            expect(response.body.firstName).toEqual(CREATE_ADMIN_DTO.firstName);
            expect(response.body.id).toEqual(adminID);
            expect(response.body.lastLogin).toEqual(null);
            expect(response.body.lastName).toEqual(CREATE_ADMIN_DTO.lastName);
            expect(response.body.loginCount).toEqual("0");
            expect(response.body.organization).toEqual(
              CREATE_ADMIN_DTO.organization
            );
            expect(response.body.role).toEqual(CREATE_ADMIN_DTO.role);
            expect(response.body.title).toEqual(CREATE_ADMIN_DTO.title);
            expect(updatedWithinOneMinute).toBeLessThanOrEqual(
              MINUTE_IN_MILLISECONDS
            );
          });

        return await request(app.getHttpServer())
          .get("/users/" + adminID)
          .set("Authorization", "bearer " + adminJWTToken)
          .expect(HttpStatus.NOT_FOUND)
          .then(response => {
            expect(response.body.message).toEqual(
              "User with given id not found"
            );
            expect(response.body.error).toEqual("Not Found");
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
