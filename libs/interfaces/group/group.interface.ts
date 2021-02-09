export interface IGroup {
  id: string;
  readonly name: string;
  readonly public: boolean;
  readonly role?: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
