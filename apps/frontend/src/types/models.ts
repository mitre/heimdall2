export class Content {
  name!: string;
  value!: string;
}
export class Tag {
  id!: number;
  tagger_id!: number;
  tagger_type!: string;
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
  first_name!: string;
  last_name!: string;
  email!: string;
  image!: string;
  phone_number!: string;
  createdAt!: Date;
  updatedAt!: Date;
  personal_group!: Usergroup;
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
