import {Injectable, NotFoundException} from '@nestjs/common';
import {InjectModel} from '@nestjs/sequelize';
import {FindOptions} from 'sequelize/types';
import {DatabaseService} from '../database/database.service';
import {Build} from '../builds/build.model';
import {CreateProductDto} from './dto/create-product.dto';
import {UpdateProductDto} from './dto/update-product.dto';
import {Product} from './product.model';
import {Group} from '../groups/group.model';
import {User} from '../users/user.model';

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product)
    private readonly productModel: typeof Product,
    private readonly databaseService: DatabaseService
  ) {}

  async findAll(): Promise<Product[]> {
    return this.productModel.findAll<Product>({
      include: [User, {model: Group, include: [User]}]
    });
  }

  async count(): Promise<number> {
    return this.productModel.count();
  }

  async findById(id: string): Promise<Product> {
    return this.findByPkBang(id);
  }

  async findByProjectId(productId: string): Promise<Product> {
    return this.findOneBang({
      where: {
        productId
      }
    });
  }

  async create(product : {
    productId: string,
    productName: string,
    productURL: string,
    objectStoreKey: string,
    userId?: string,
    groupId?: string,
  }): Promise<Product> {
    return Product.create<Product>(
      {
        ...product
      }
    );
  }

  async update(productToUpdate: Product, groupDto: CreateProductDto): Promise<Product> {
    productToUpdate.update(groupDto);

    return productToUpdate.save();
  }

  async remove(productToDelete: Product): Promise<Product> {
    await productToDelete.destroy();

    return productToDelete;
  }

  async buildsExtendedInfo(id: string): Promise<Product[]> {
    return this.productModel.findAll({
      where: {id},
      include: ['builds', User, {model: Group, include: [User]}]
    });
  }

  async findByPkBang(id: string): Promise<Product> {
    const product = await this.productModel.findByPk(id, {include: ['builds', User, {model: Group, include: [User]}]});
    if (product === null) {
      throw new NotFoundException('Product with given id not found');
    } else {
      return product;
    }
  }

  async findOneBang(options: FindOptions | undefined): Promise<Product> {
    const product = await this.productModel.findOne<Product>(options);
    if (product === null) {
      throw new NotFoundException('Product with given id not found');
    } else {
      return product;
    }
  }

  async addBuildToProduct(product: Product, build: Build): Promise<void> {
    await product.$add('builds', build, {
      through: {createdAt: new Date(), updatedAt: new Date()}
    });
  }

  async removeBuildFromProduct(product: Product, build: Build): Promise<Product> {
    return product.$remove('build', build);
  }
}
