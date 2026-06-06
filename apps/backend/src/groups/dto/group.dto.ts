import {SlimUserDto} from '../../users/dto/slim-user.dto';

interface GroupWithUsers {
  id: number;
  name: string;
  public: boolean;
  desc: string | null;
  createdAt: string;
  updatedAt: string;
  groupUsers?: Array<{
    role: string | null;
    user: {id: number; email: string; title?: string | null; firstName?: string | null; lastName?: string | null} | null;
  }>;
}

export class GroupDto {
  readonly id: string;
  readonly name: string;
  readonly public: boolean;
  readonly role?: string;
  readonly users: SlimUserDto[];
  readonly desc: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(group: GroupWithUsers, role?: string) {
    this.id = String(group.id);
    this.name = group.name;
    this.role = role;
    this.public = group.public;
    this.users = (group.groupUsers ?? [])
      .filter((gu): gu is typeof gu & {user: NonNullable<typeof gu.user>} => gu.user != null)
      .map((gu) => new SlimUserDto(gu.user, gu.role ?? undefined));
    this.desc = group.desc ?? '';
    this.createdAt = new Date(group.createdAt);
    this.updatedAt = new Date(group.updatedAt);
  }
}
