import { Injectable } from '@nestjs/common';
import { Sequelize } from 'sequelize-typescript';

@Injectable()
export class DatabaseService {
  constructor(private sequelize: Sequelize) { }

  async closeConnection() {
    await this.sequelize.close();
  }

  async cleanAll() {
    Object.values(this.sequelize.models).map(model => {
      model.destroy({ truncate: true });
    });
  }
}
