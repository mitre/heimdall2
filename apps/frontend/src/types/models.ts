export class Content {
  name!: string;
  value!: string;
}
export class Tag {
  content!: Content;
  createdAt!: Date;
  id!: number;
  taggerId!: number;
  taggerType!: string;
  updatedAt!: Date;
}
export class Evaluation {
  createdAt!: Date;
  filename!: string;
  id!: number;
  tags!: Tag[];
  updatedAt!: Date;
  version!: string;
}
export class Tags {
  tags!: Tag[];
}
export class Usergroup {
  createdAt!: Date;
  evaluations!: Evaluation[];
  id!: number;
  name!: string;
  type!: string;
  updatedAt!: Date;
  users!: UserProfile[];
}
export class UserProfile {
  createdAt!: Date;
  email!: string;
  firstName!: string;
  id!: number;
  image!: string;
  lastName!: string;
  personalGroup!: Usergroup;
  phoneNumber!: string;
  updatedAt!: Date;
  usergroups!: Usergroup[];
}
