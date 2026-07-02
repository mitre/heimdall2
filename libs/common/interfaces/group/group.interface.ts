import type { ISlimUser } from '../user/slim-user.interface';
export type IGroup = {
  readonly createdAt: Date;
  readonly desc: string;
  id: string;
  readonly name: string;
  readonly public: boolean;
  readonly role?: string;
  readonly updatedAt: Date;
  readonly users: ISlimUser[];
};
