import {subject} from '@casl/ability';
import type {AuthUser} from '../casl/casl-ability.factory';

export interface RequestUser {
  id: string | number;
  role: string;
  creationMethod?: string | null;
}

export function asAuthUser(user: {id: string | number; role: string}): AuthUser {
  return {id: String(user.id), role: user.role};
}

export function caslSubject<T extends {id: string | number}>(
  type: string,
  entity: T,
): T & {id: string} {
  return subject(type, {...entity, id: String(entity.id)}) as T & {id: string};
}
