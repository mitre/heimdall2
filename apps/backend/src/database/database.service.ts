import { Injectable } from '@nestjs/common';
import { Sequelize } from 'sequelize-typescript';
import { DeltaArgs as DeltaArguments } from './interfaces/delta-args.interface';
import { IDelta } from './interfaces/delta.interface';

@Injectable()
export class DatabaseService {
  constructor(readonly sequelize: Sequelize) {}

  async cleanAll(): Promise<void> {
    await this.sequelize.truncate({ cascade: true, restartIdentity: true });
  }

  async closeConnection(): Promise<void> {
    await this.sequelize.close();
  }

  getDelta<T extends DeltaArguments>(
    source: T[],
    updated: T[],
  ): IDelta<T> {
    if (source === undefined || updated === undefined) {
      return {
        added: [],
        changed: [],
        deleted: [],
      };
    }

    const added = updated.filter(
      updatedItem =>
        source.every(sourceItem => sourceItem.id !== updatedItem.id),
    );
    const changed = updated.filter(
      updatedItem =>
        source.some(sourceItem => sourceItem.id === updatedItem.id),
    );
    const deleted = source.filter(
      sourceItem =>
        updated.every(updatedItem => updatedItem.id !== sourceItem.id),
    );

    return {
      added: added,
      changed: changed,
      deleted: deleted,
    };
  }
}
