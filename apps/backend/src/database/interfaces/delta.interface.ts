export interface IDelta<T> {
  added: Array<T>;
  changed: Array<T>;
  deleted: Array<T>;
}
