import { Inject, Injectable } from '@nestjs/common';
import { Sequelize } from 'sequelize-typescript';

@Injectable()
export class DatabaseService {
  constructor(private sequelize: Sequelize) { }

  async cleanAll() {
    return this.sequelize.drop();
  }
}
