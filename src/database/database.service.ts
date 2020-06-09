<<<<<<< HEAD
import { Injectable } from '@nestjs/common';
=======
import { Inject, Injectable } from '@nestjs/common';
>>>>>>> 5aae785... Rework test database configuration to use app database configuration instead of separate. Convert databaseProvider to a service. Add test helper module and service that assists with cleaning database but can hold additional helper methods.
import { Sequelize } from 'sequelize-typescript';

@Injectable()
export class DatabaseService {
  constructor(private sequelize: Sequelize) { }

<<<<<<< HEAD
  async closeConnection() {
    await this.sequelize.close();
  }

  async cleanAll() {
    Object.values(this.sequelize.models).map(model => {
      model.destroy({ truncate: true });
    });
=======
  async cleanAll() {
    return this.sequelize.drop();
>>>>>>> 5aae785... Rework test database configuration to use app database configuration instead of separate. Convert databaseProvider to a service. Add test helper module and service that assists with cleaning database but can hold additional helper methods.
  }
}
