export class Content {
  name!: string;
  value!: string;
}
export class Tag {
  id!: number;
  taggerId!: number;
  taggerType!: string;
  content!: Content;
  createdAt!: Date;
  updatedAt!: Date;
}
export class Evaluation {
  id!: number;
  filename!: string;
  version!: string;
  createdAt!: Date;
  updatedAt!: Date;
  tags!: Tag[];
}
export class Tags {
  tags!: Tag[];
}
export class UserProfile {
  id!: number;
  firstName!: string;
  lastName!: string;
  email!: string;
  image!: string;
  phoneNumber!: string;
  createdAt!: Date;
  updatedAt!: Date;
  personalGroup!: Usergroup;
  usergroups!: Usergroup[];
}
export class Usergroup {
  id!: number;
  name!: string;
  type!: string;
  users!: UserProfile[];
  evaluations!: Evaluation[];
  createdAt!: Date;
  updatedAt!: Date;
}
