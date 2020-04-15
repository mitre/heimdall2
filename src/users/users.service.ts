import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { User } from './user.model';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User)
    private userModel: typeof User
  ) {}

  async findAll(): Promise<User[]> {
    return this.userModel.findAll();
  }

  async findById(id: string): Promise<User> {
    return this.userModel.findOne({
      where: {
        id
      }
    });
  }

  async findByEmail(email: string): Promise<User> {
    return this.userModel.findOne({
      where: {
        email
      }
    });
  }

  async remove(id: string): Promise<void> {
    const user = await this.findById(id);
    await user.destroy()
  }
}
