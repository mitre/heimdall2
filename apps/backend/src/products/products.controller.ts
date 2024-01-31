import {ForbiddenError} from '@casl/ability';
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Delete,
  Param,
  Post,
  Request,
  UseGuards,
  UseInterceptors
} from '@nestjs/common';
import _ from 'lodash';
import {AuthzService} from '../authz/authz.service';
import {Action} from '../casl/casl-ability.factory';
import {Group} from '../groups/group.model';
import {GroupsService} from '../groups/groups.service';
import {Build} from '../builds/build.model';
import {BuildsService} from '../builds/builds.service';
import {BuildDto} from '../builds/dto/build.dto';
import {APIKeyOrJwtAuthGuard} from '../guards/api-key-or-jwt-auth.guard';
import {JwtAuthGuard} from '../guards/jwt-auth.guard';
import {LoggingInterceptor} from '../interceptors/logging.interceptor';
import {User} from '../users/user.model';
import {CreateProductDto} from './dto/create-product.dto';
import {ProductDto} from './dto/product.dto';
import {ProductsService} from './products.service';
import {AddBuildToProductDto} from './dto/add-build-to-product-dto';
import {RemoveBuildFromProductDto} from './dto/remove-build-from-product-dto';

@Controller('products')
@UseInterceptors(LoggingInterceptor)
export class ProductsController {
  constructor(
    private readonly productService: ProductsService,
    private readonly buildsService: BuildsService,
    private readonly groupsService: GroupsService,
    private readonly authz: AuthzService
  ) {}


  @UseGuards(JwtAuthGuard)
  @Get()
  async findAll(@Request() request: {user: User}): Promise<ProductDto[]> {
    const abac = this.authz.abac.createForUser(request.user);
    let products = await this.productService.findAll();
    products = products.filter((product) =>
      abac.can(Action.Read, product)
    );
    return products.map((product) => new ProductDto(product));
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async findById(
    @Request() request: {user: User},
    @Param('id') id: string
  ): Promise<ProductDto> {
    const abac = this.authz.abac.createForUser(request.user);
    const product = await this.productService.findByPkBang(id);
    ForbiddenError.from(abac).throwUnlessCan(Action.Read, product);
    return new ProductDto(product, false);
  }

  @UseGuards(APIKeyOrJwtAuthGuard)
  @Get('id/:id')
  async findByProjectId(
    @Request() request: {user: User},
    @Param('id') id: string
  ): Promise<ProductDto> {
    const product = await this.productService.findByProjectId(id);
    return new ProductDto(product, false);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/builds')
  async buildsForProduct(
    @Param('id') id: string,
    @Request() request: {user: User}
  ): Promise<BuildDto[]> {
  const abac = this.authz.abac.createForUser(request.user);
    let products = await this.productService.buildsExtendedInfo(id);
    products = products.filter((product) =>
    abac.can(Action.Read, product)
    );
    return products.flatMap((product) => {
      return product.builds.map((build) => new BuildDto(build));
    });
  }

  @UseGuards(APIKeyOrJwtAuthGuard)
  @Post()
  async create(
    @Request() request: {user: User | Group},
    @Body() createProductDto: CreateProductDto
  ): Promise<ProductDto> {
    if (request.user instanceof Group) {
      // Product created by Group API Key
      const product = await this.productService
      .create({
        productId: createProductDto.productId,
        productName: createProductDto.productName,
        productURL: createProductDto.productURL,
        objectStoreKey: createProductDto.objectStoreKey,
        groupId: request.user.id
      })
      .then(async (createdProduct) => {
        const group = await this.groupsService.findByPkBang(
          request.user.id
        );
        this.groupsService.addProductToGroup(group, createdProduct)
        return createdProduct;
      })
      .catch((err) => {
        throw new BadRequestException(err.message);
      });

      return new ProductDto(product);
    }

    // Product created by User's JWT
    let groups: Group[] = createProductDto.groups
      ? await this.groupsService.findByIds(createProductDto.groups)
      : [];

    // Make sure the user can add product to each group
    const abac = this.authz.abac.createForUser(request.user);
    groups = groups.filter((group) => {
      return abac.can(Action.AddEvaluation, group);
    });

    const product = await this.productService
    .create({
      productId: createProductDto.productId,
      productName: createProductDto.productName,
      productURL: createProductDto.productURL,
      objectStoreKey: createProductDto.objectStoreKey,
      userId: request.user.id
    })
    .then((createdProduct) => {
      groups.forEach((group) =>
        this.groupsService.addProductToGroup(group, createdProduct)
      );
      return createdProduct;
    });

    return new ProductDto(product);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @Request() request: {user: User}
  ): Promise<ProductDto> {
    const abac = this.authz.abac.createForUser(request.user);
    const product = await this.productService.findByPkBang(id);
    ForbiddenError.from(abac).throwUnlessCan(Action.Delete, product);
    return new ProductDto(await this.productService.remove(product));
  }

  @UseGuards(APIKeyOrJwtAuthGuard)
  @Post('/:id/build')
  async addBuildToProduct(
    @Param('id') id: string,
    @Request() request: {build: Build},
    @Body() addBuildToProductDto: AddBuildToProductDto
  ): Promise<ProductDto> {
    const product = await this.productService.findByPkBang(id);
    const buildToAdd = await this.buildsService.findById(
      addBuildToProductDto.buildId
    );
    await this.productService.addBuildToProduct(
      product,
      buildToAdd
    );

    // TODO: update Product updatedAt time before returning

    return new ProductDto(product);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('/:id/build')
  async removeBuildFromProduct(
    @Param('id') id: string,
    @Request() request: {user: User},
    @Body() removeBuildFromProductDto: RemoveBuildFromProductDto
  ): Promise<ProductDto> {
    const abac = this.authz.abac.createForUser(request.user);
    const product = await this.productService.findByPkBang(id);
    ForbiddenError.from(abac).throwUnlessCan(Action.Update, product);
    const buildToRemove = await this.buildsService.findById(
      removeBuildFromProductDto.buildId
    );
    return new ProductDto(
      await this.productService.removeBuildFromProduct(product, buildToRemove)
    );
  }
}