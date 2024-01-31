import {IProduct} from '@heimdall/interfaces';
import {BuildDto} from '../../builds/dto/build.dto';
import {Product} from '../product.model';
import {GroupDto} from '../../groups/dto/group.dto';
import {Group} from '../../groups/group.model';

export class ProductDto implements IProduct {
  readonly id: string;

  readonly groups: GroupDto[];
  readonly userId?: string;
  readonly groupId?: string;
  readonly productName: string;
  readonly productId: string;
  readonly productURL: string;
  readonly objectStoreKey: string;
  readonly builds: BuildDto[];
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(
    product: Product,
    editable = false,
    shareURL: string | undefined = undefined
  ) {
    this.id = product.id;
    this.productName = product.productName;
    this.productId = product.productId;
    this.productURL = product.productURL;
    this.objectStoreKey = product.objectStoreKey;
    this.builds =
    product.builds === undefined
      ? []
      : product.builds.map((build) => {
          return new BuildDto(build, false);
        });
    if (product.groups === null || product.groups === undefined) {
      this.groups = [];
    } else {
      this.groups = product.groups.map(
        (group) => new GroupDto(group as Group)
      );
    }
    this.userId = product.userId;
    this.groupId = product.groupId;
    this.createdAt = product.createdAt;
    this.updatedAt = product.updatedAt;
  }
}
