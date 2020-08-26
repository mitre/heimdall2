import {DatabaseService} from './database.service';
import {DatabaseModule} from './database.module';
import {Test} from '@nestjs/testing';

describe('DatabaseSerivce', () => {
  let databaseService: DatabaseService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [DatabaseModule],
      providers: [DatabaseService]
    }).compile();

    databaseService = module.get<DatabaseService>(DatabaseService);
  });

  afterAll(async () => {
    await databaseService.cleanAll();
    await databaseService.closeConnection();
  });

  describe('getDelta', () => {
    it('returns the correct value when no items are given', async () => {
      const source = [];
      const updated = [];

      const delta = databaseService.getDelta(source, updated);
      expect(delta.added.length).toEqual(0);
      expect(delta.changed.length).toEqual(0);
      expect(delta.deleted.length).toEqual(0);
    });

    it('returns the correct value when an item is added', async () => {
      const source = [{id: 1}, {id: 2}, {id: 3}];
      const updated = [{id: 1}, {id: 2}, {id: 3}, {id: 4}];

      const delta = databaseService.getDelta(source, updated);

      expect(delta.added.length).toEqual(1);
      expect(delta.changed.length).toEqual(3);
      expect(delta.deleted.length).toEqual(0);
    });

    it('returns the correct value when an item is changed', async () => {
      const source = [{id: 1, prop: 1}];
      const updated = [{id: 1, prop: 2}];

      const delta = databaseService.getDelta(source, updated);

      expect(delta.added.length).toEqual(0);
      expect(delta.changed.length).toEqual(1);
      expect(delta.deleted.length).toEqual(0);

      expect(delta.changed[0].prop).toEqual(updated[0].prop);
    });

    it('returns the correct value when an item is deleted', async () => {
      const source = [{id: 1}, {id: 2}, {id: 3}, {id: 4}];
      const updated = [{id: 1}, {id: 2}, {id: 4}];

      const delta = databaseService.getDelta(source, updated);

      expect(delta.added.length).toEqual(0);
      expect(delta.changed.length).toEqual(3);
      expect(delta.deleted.length).toEqual(1);
    });

    it('returns the correct value when all items are added', async () => {
      const source = [];
      const updated = [{id: 1}, {id: 2}, {id: 3}, {id: 4}];

      const delta = databaseService.getDelta(source, updated);

      expect(delta.added.length).toEqual(4);
      expect(delta.changed.length).toEqual(0);
      expect(delta.deleted.length).toEqual(0);
    });

    it('returns the correct value when all items are changed', async () => {
      const source = [{id: 1}, {id: 2}, {id: 3}, {id: 4}];
      const updated = [{id: 1}, {id: 2}, {id: 3}, {id: 4}];

      const delta = databaseService.getDelta(source, updated);

      expect(delta.added.length).toEqual(0);
      expect(delta.changed.length).toEqual(4);
      expect(delta.deleted.length).toEqual(0);
    });

    it('returns the correct value when all items are deleted', async () => {
      const source = [{id: 1}, {id: 2}, {id: 3}, {id: 4}];
      const updated = [];

      const delta = databaseService.getDelta(source, updated);

      expect(delta.added.length).toEqual(0);
      expect(delta.changed.length).toEqual(0);
      expect(delta.deleted.length).toEqual(4);
    });
  });
});
