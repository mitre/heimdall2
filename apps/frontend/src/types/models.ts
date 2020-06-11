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
