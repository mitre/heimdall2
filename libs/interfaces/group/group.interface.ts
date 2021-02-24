import {ISlimUser} from '../user/slim-user.interface'
export interface IGroup {
  id: string;
  readonly name: string;
  readonly public: boolean;
  readonly role?: string;
  readonly users?: ISlimUser[]
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
