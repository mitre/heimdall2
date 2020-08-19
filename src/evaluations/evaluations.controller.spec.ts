import {EvaluationsService} from './evaluations.service';
import {EvaluationsController} from './evaluations.controller';
import {DatabaseModule} from '../database/database.module';
import {DatabaseService} from '../database/database.service';
import {Test, TestingModule} from '@nestjs/testing';
import {
  EVALUATION_DTO,
  UPDATE_EVALUATION,
  EVALUATION_WITH_TAGS_1,
  CREATE_EVALUATION_DTO_WITHOUT_TAGS,
  CREATE_EVALUATION_DTO_WITHOUT_DATA,
  CREATE_EVALUATION_DTO_WITHOUT_VERSION
} from '../../test/constants/evaluations-test.constant';
import {NotFoundException, BadRequestException} from '@nestjs/common';

describe('EvaluationsController', () => {
  let evaluationsController: EvaluationsController;
  let evaluationsService: EvaluationsService;
  let module: TestingModule;
  let databaseService: DatabaseService;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      controllers: [EvaluationsController],
      imports: [DatabaseModule],
      providers: [
        DatabaseService,
        {
          provide: EvaluationsService,
          useFactory: () => ({
            // Used for postiive tests
            findById: jest.fn(() => EVALUATION_DTO),
            findAll: jest.fn(() => [EVALUATION_DTO]),
            update: jest.fn(() => EVALUATION_DTO),
            create: jest.fn(() => EVALUATION_DTO),
            remove: jest.fn(() => EVALUATION_DTO)
          })
        }
      ]
    }).compile();

    databaseService = module.get<DatabaseService>(DatabaseService);
    evaluationsService = module.get<EvaluationsService>(EvaluationsService);
    evaluationsController = module.get<EvaluationsController>(
      EvaluationsController
    );
  });

  beforeEach(() => {
    return databaseService.cleanAll();
  });

  describe('findById', () => {
    it('should return a value when given an id', async () => {
      await evaluationsController.findById(1);
      expect(evaluationsService.findById).toHaveReturnedWith(EVALUATION_DTO);
    });

    it('should throw a not found exeception when given an invalid id', async () => {
      jest.spyOn(evaluationsService, 'findById').mockImplementation(() => {
        throw new NotFoundException();
      });
      expect(async () => {
        await evaluationsController.findById(0);
      }).rejects.toThrow(NotFoundException);
    });
  });

  describe('findALl', () => {
    it('should return a value when given an id', async () => {
      await evaluationsController.findAll();
      expect(evaluationsService.findAll).toHaveReturnedWith([EVALUATION_DTO]);
    });
  });

  describe('create', () => {
    it('should create an evaluation given a valid DTO', async () => {
      await evaluationsController.create(EVALUATION_WITH_TAGS_1);
      expect(evaluationsService.create).toHaveReturnedWith(EVALUATION_DTO);
    });

    it('should create an evaluation without tags', async () => {
      await evaluationsController.create(CREATE_EVALUATION_DTO_WITHOUT_TAGS);
      expect(evaluationsService.create).toHaveReturnedWith(EVALUATION_DTO);
    });

    it('should throw a bad request when evaluation version is missing', async () => {
      jest.spyOn(evaluationsService, 'create').mockImplementation(() => {
        throw new BadRequestException();
      });

      expect(async () => {
        await evaluationsController.create(
          CREATE_EVALUATION_DTO_WITHOUT_VERSION
        );
      }).rejects.toThrow(BadRequestException);
    });

    it('should throw a bad request when evaluation data is missing', async () => {
      jest.spyOn(evaluationsService, 'create').mockImplementation(() => {
        throw new BadRequestException();
      });

      expect(async () => {
        await evaluationsController.create(CREATE_EVALUATION_DTO_WITHOUT_DATA);
      }).rejects.toThrow(BadRequestException);
    });
  });

  describe('update', () => {
    // All fields in the UpdateEvaluationDto are optional, just test with all of them
    it('should update an evaluation given a valid DTO', async () => {
      await evaluationsController.update(1, UPDATE_EVALUATION);
      expect(evaluationsService.update).toHaveReturnedWith(EVALUATION_DTO);
    });
  });

  describe('remove', () => {
    it('should remove an evaluation', async () => {
      await evaluationsController.remove(1);
      expect(evaluationsService.remove).toHaveReturnedWith(EVALUATION_DTO);
    });
  });

  afterAll(async () => {
    await databaseService.cleanAll();
    await databaseService.closeConnection();
  });
});
