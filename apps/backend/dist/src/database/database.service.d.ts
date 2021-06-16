import { Sequelize } from 'sequelize-typescript';
import { DeltaArgs } from './interfaces/delta-args.interface';
import { IDelta } from './interfaces/delta.interface';
export declare class DatabaseService {
    readonly sequelize: Sequelize;
    constructor(sequelize: Sequelize);
    closeConnection(): Promise<void>;
    cleanAll(): Promise<void>;
    getDelta<T extends DeltaArgs>(source: Array<T>, updated: Array<T>): IDelta<T>;
}
