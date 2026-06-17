export type IDelta<T> = {
  added: T[];
  changed: T[];
  deleted: T[];
};
