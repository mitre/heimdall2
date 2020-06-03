import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { User } from './user.model';
import { getModelToken, SequelizeModule } from '@nestjs/sequelize';
import * as consts from '../../src/test.constants';
import { Repository } from 'sequelize-typescript';
import { ConfigModule } from '../../src/config/config.module';
import { ConfigService } from '../../src/config/config.service';

describe("UsersService Unit Tests", () => {
    let usersService: UsersService;
    let module: TestingModule;
    // Used for the remove() function
    let userID: number;

    beforeAll(async () => {
        module = await Test.createTestingModule({
            imports: [
                SequelizeModule.forRootAsync({
                    imports: [ConfigModule],
                    inject: [ConfigService],
                    useFactory: (configService: ConfigService) => ({
                        dialect: 'postgres',
                        host: configService.get('DATABASE_HOST') || "127.0.0.1",
                        port: Number(configService.get('DATABASE_PORT')) || 5432,
                        username: configService.get('DATABASE_USERNAME') || "postgres",
                        password: configService.get('DATABASE_PASSWORD') || "",
                        database: configService.get('DATABASE_NAME') || `heimdall-server-${configService.get('NODE_ENV').toLowerCase()}`,
                        models: [User],
                    }),
                }),
                SequelizeModule.forFeature([User])
            ],
            providers: [UsersService,],
        }).compile();

        usersService = module.get<UsersService>(UsersService);
    });

    // Checks to make sure the exists function throws exception for non-existant user
    it("should throw NotFoundException from exists function", () => {
        expect(() => { usersService.exists(consts.NULL_USER) }).toThrow("User with given id not found");
    });

    // Tests the create function
    it("should create", async () => {
        const user = await usersService.create(consts.CREATE_USER_DTO_TEST_OBJ);
        expect(user.email).toEqual(consts.USER_ONE_DTO.email);
        userID = user.id;
    });

    // Tests the findAll function
    it("should findAll", async () => {
        const userdtoArray = await usersService.findAll();
        expect(userdtoArray[1].email).toEqual(consts.USER_DTO_ARRAY[0].email);
    });

    // Tests the findById function
    it("should findById", async () => {
        const user = await usersService.findById(userID);
        expect(user.email).toEqual(consts.TEST_USER.email);
    });

    // Tests the findByEmail function
    it("should findByEmail", async () => {
        const user = await usersService.findByEmail(consts.TEST_USER.email)
        expect(user.email).toEqual(consts.USER_ONE_DTO.email);
    });

    // Tests the update function (Successful update)
    it("should update everything", async () => {
        const updatedUser = await usersService.update(userID, consts.UPDATE_USER_DTO_TEST_OBJ);
        expect(updatedUser.email).toEqual(consts.UPDATE_USER_DTO_TEST_OBJ.email);
    });

    // Tests the update function (Fail update)
    it("should fail the update (throw UnauthorizedException)", async () => {
        expect(async () => { await usersService.update(userID, consts.UPDATE_FAILURE_USER_DTO_TEST_OBJ) })
            .rejects.toThrow();
    });

    // Tests the remove function (Fail remove)
    it("should fail remove (throw UnauthorizedException)", async () => {
        expect(async () => { await usersService.remove(userID, consts.DELETE_FAILRE_USER_DTO_TEST_OBJ) })
            .rejects.toThrow();
    });

    // Tests the remove function (Successful remove)
    it("should remove", async () => {
        const removedUser = await usersService.remove(userID, consts.DELETE_USER_DTO_TEST_OBJ);
        expect(removedUser.email).toEqual(consts.UPDATE_USER_DTO_TEST_OBJ.email);
    });

    afterAll(async () => {
        module.close();
    });
})
