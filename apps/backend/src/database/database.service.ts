import {Injectable} from '@nestjs/common';
import {Sequelize} from 'sequelize-typescript';
import {DeltaArgs} from './interfaces/delta-args.interface';

@Injectable()
export class DatabaseService {
  constructor(readonly sequelize: Sequelize) {}

  async closeConnection() {
    await this.sequelize.close();
  }

  async cleanAll() {
    Object.values(this.sequelize.models).map(model => {
      model.destroy({where: {}});
    });
  }

  getDelta<T extends DeltaArgs>(source: Array<T>, updated: Array<T> ) {
    if(source === undefined || updated === undefined) {
      return {
        added: [],
        changed: [],
        deleted: []
      }
    }

    let added = updated.filter(updatedItem => source.find(sourceItem => sourceItem.id === updatedItem.id) === undefined);
    let changed = source.filter(sourceItem => updated.find(updatedItem => updatedItem.id === sourceItem.id) !== undefined);
    let deleted = source.filter(sourceItem => updated.find(updatedItem => updatedItem.id === sourceItem.id) === undefined);

    return {
      added: added,
      changed: changed,
      deleted: deleted
    };
  }
}

