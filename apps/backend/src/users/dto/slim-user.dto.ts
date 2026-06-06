import type {SelectUser} from '../../db/zod-schemas';

export class SlimUserDto {
  readonly id: string;
  readonly email: string;
  readonly title?: string;
  readonly groupRole?: string;
  readonly firstName?: string;
  readonly lastName?: string;

  constructor(
    user: {id: string | number; email: string; title?: string | null; firstName?: string | null; lastName?: string | null},
    groupRole: string | undefined = undefined,
  ) {
    this.id = String(user.id);
    this.email = user.email;
    this.title = user.title ?? undefined;
    this.groupRole = groupRole;
    this.firstName = user.firstName ?? undefined;
    this.lastName = user.lastName ?? undefined;
  }
}
