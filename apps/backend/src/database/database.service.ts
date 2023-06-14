import {Injectable} from '@nestjs/common';
import {Sequelize} from 'sequelize-typescript';
import {DeltaArgs} from './interfaces/delta-args.interface';
import {IDelta} from './interfaces/delta.interface';

@Injectable()
export class DatabaseService {
  constructor(readonly sequelize: Sequelize) {}

  async closeConnection(): Promise<void> {
    await this.sequelize.close();
  }

  async cleanAll(): Promise<void> {
    const promises: Promise<number>[] = [];
    for (const model of Object.values(this.sequelize.models)) {
      promises.push(model.destroy({where: {}}));
    }
    await Promise.all(promises);
  }

  getDelta<T extends DeltaArgs>(
    source: Array<T>,
    updated: Array<T>
  ): IDelta<T> {
    if (source === undefined || updated === undefined) {
      return {
        added: [],
        changed: [],
        deleted: []
      };
    }

    const added = updated.filter(
      (updatedItem) =>
        source.find((sourceItem) => sourceItem.id === updatedItem.id) ===
        undefined
    );
    const changed = updated.filter(
      (updatedItem) =>
        source.find((sourceItem) => sourceItem.id === updatedItem.id) !==
        undefined
    );
    const deleted = source.filter(
      (sourceItem) =>
        updated.find((updatedItem) => updatedItem.id === sourceItem.id) ===
        undefined
    );

    return {
      added: added,
      changed: changed,
      deleted: deleted
    };
  }
}
