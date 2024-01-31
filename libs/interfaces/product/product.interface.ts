import {IBuild} from '../build/build.interface';
import {IGroup} from '../group/group.interface';

export interface IProduct {
  readonly id: string;
  groups: IGroup[];
  readonly userId?: string;
  readonly groupId?: string;
  readonly productName: string;
  readonly productId: string;
  readonly productURL: string;
  readonly objectStoreKey: string;
  readonly builds: IBuild[];
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
