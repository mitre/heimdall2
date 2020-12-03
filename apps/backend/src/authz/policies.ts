import {ISimpleAbacAbilities} from 'simple-abac/dist/interfaces';

// These are the default policies that the app loads on startup.
// They allow the basic actions expected of the application to
// take place.

export const DEFAULT_POLICIES: ISimpleAbacAbilities[] = [
  // Allow anyone to delete their own user
  {
    role: 'any',
    actions: 'delete',
    targets: 'users',
    condition: (userId, targetOptions) => {
      return userId === targetOptions.id;
    }
  },
  // Allow anyone to update their own user
  {
    role: 'any',
    actions: 'put',
    targets: 'users',
    condition: (userId, targetOptions) => {
      return userId === targetOptions.id;
    }
  },
  // Allow administrators to delete anyone
  {
    role: 'admin',
    actions: 'delete',
    targets: 'users'
  },
  // Allow administrators to update anyone
  {
    role: 'admin',
    actions: 'delete',
    targets: 'users'
  },
  // Allow administrators to create evaluations with no stipulations
  {
    role: 'admin',
    actions: 'post',
    targets: 'evaluations'
  },
  // Allow users to create evaluations that belong to their userId
  {
    role: 'user',
    actions: 'post',
    targets: 'evaluations',
    condition: (userId, targetOptions) => {
      return userId === targetOptions.userId;
    }
  }
];
