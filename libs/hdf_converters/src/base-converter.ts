import {createHash} from 'crypto';
import {
  ExecJSON
} from 'inspecjs';
import _ from 'lodash';

export interface LookupPath {
  path?: string;
  // Parameter will be the return type of handlePath, which can either be a string or a number
  transformer?: (value: unknown) => unknown;
  arrayTransformer?: (value: unknown[], file: unknown) => unknown[];
  key?: string;
}

export type ObjectEntries<T> = {[K in keyof T]: readonly [K, T[K]]}[keyof T];
export type MappedTransform<T, U extends LookupPath> = {
  [K in keyof T]: Exclude<T[K], undefined | null> extends Array<any>
  ? MappedTransform<T[K], U>
  : // eslint-disable-next-line @typescript-eslint/ban-types
  T[K] extends Function
  ? T[K]
  : // eslint-disable-next-line @typescript-eslint/ban-types
  T[K] extends object
  ? MappedTransform<
    T[K] &
    (U & {
      arrayTransformer?: (
        value: unknown[],
        file: Record<string, unknown>
      ) => T[K][];
    }),
    U
  >
  : T[K] | (U & {transformer?: (value: unknown) => T[K]});
};
export type MappedReform<T, U> = {
  [K in keyof T]: Exclude<T[K], undefined | null> extends Array<any>
  ? MappedReform<T[K], U>
  : // eslint-disable-next-line @typescript-eslint/ban-types
  T[K] extends object
  ? MappedReform<T[K] & U, U>
  : Exclude<T[K], U>;
};

// Hashing Function
export function generateHash(data: string, algorithm: string = 'sha256'): string {
  const hash = createHash(algorithm);
  return hash.update(data).digest('hex');
}

// eslint-disable-next-line @typescript-eslint/ban-types
function collapseDuplicates<T extends object>(
  array: Array<T>,
  key: string,
  collapseResults: boolean
): Array<T> {
  const seen = new Map<string, number>();
  const newArray = new Array<T>();
  let counter = 0;
  array.forEach((item: T) => {
    const propertyValue = _.get(item, key);
    if (typeof propertyValue === 'string') {
      const index = seen.get(propertyValue) || 0;
      if (!seen.has(propertyValue)) {
        newArray.push(item);
        seen.set(propertyValue, counter);
        counter++;
      } else {
        const oldResult = _.get(newArray[index], 'results') as ExecJSON.ControlResult[];
        const descriptions = oldResult.map((element) =>
          _.get(element, 'code_desc')
        );
        if (collapseResults) {
          if (
            descriptions.indexOf(
              _.get(item, 'results[0].code_desc') as string
            ) === -1
          ) {
            _.set(
              newArray[index],
              'results',
              oldResult.concat(_.get(item, 'results') as ExecJSON.ControlResult[])
            );
          }
        } else {
          _.set(
            newArray[index],
            'results',
            oldResult.concat(_.get(item, 'results') as ExecJSON.ControlResult[])
          );
        }
      }
    }
  });
  return newArray;
}
export class BaseConverter {
  data: Record<string, unknown>;
  mappings?: MappedTransform<ExecJSON.Execution, LookupPath>;
  collapseResults: boolean;

  constructor(data: Record<string, unknown>, collapseResults = false) {
    this.data = data;
    this.collapseResults = collapseResults;
  }
  setMappings(mappings: MappedTransform<ExecJSON.Execution, LookupPath>) {
    this.mappings = mappings;
  }

  toHdf(): ExecJSON.Execution {
    if (this.mappings === undefined) {
      throw new Error('Mappings must be provided');
    } else {
      const v = this.convertInternal(this.data, this.mappings);
      v.profiles.forEach((element) => {
        element.sha256 = generateHash(
          JSON.stringify(element)
        );
      });
      return v;
    }
  }

  objectMap<T, V>(obj: T, fn: (v: ObjectEntries<T>) => V): {[K in keyof T]: V} {
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [k, fn(v)])
    ) as Record<keyof T, V>;
  }
  convertInternal<T>(
    file: Record<string, unknown>,
    fields: T
  ): MappedReform<T, LookupPath> {
    const result = this.objectMap(fields, (v: ObjectEntries<T>) =>
      this.evaluate(file, v)
    );
    return result as MappedReform<T, LookupPath>;
  }
  // eslint-disable-next-line @typescript-eslint/ban-types
  evaluate<T extends object>(
    file: Record<string, unknown>,
    v: Array<T> | T
  ): T | Array<T> | MappedReform<T, LookupPath> {
    const transformer = _.get(v, 'transformer');
    if (Array.isArray(v)) {
      return this.handleArray(file, v);
    } else if (
      typeof v === 'string' ||
      typeof v === 'number' ||
      typeof v === 'boolean' ||
      v === null
    ) {
      return v;
    } else if (_.has(v, 'path')) {
      if (typeof transformer === 'function') {
        return transformer(this.handlePath(file, _.get(v, 'path') as string));
      }
      const pathVal = this.handlePath(file, _.get(v, 'path') as string);
      if (Array.isArray(pathVal)) {
        return pathVal as T[];
      }
      return pathVal as T;
    }
    if (typeof transformer === 'function') {
      return transformer(file);
    } else {
      return this.convertInternal(file, v);
    }
  }
  // eslint-disable-next-line @typescript-eslint/ban-types
  handleArray<T extends object>(
    file: Record<string, unknown>,
    v: Array<T & LookupPath>
  ): Array<T> {
    if (v.length === 0) {
      return new Array<T>();
    }
    if (v[0].path === undefined) {
      const arrayTransformer = v[0].arrayTransformer;
      v = v.map((element) => {
        return _.omit(element, ['arrayTransformer']) as T & LookupPath;
      });
      let output: Array<T> = [];
      v.forEach((element) => {
        output.push(this.evaluate(file, element) as T);
      });
      if (arrayTransformer !== undefined) {
        output = arrayTransformer(output, this.data) as T[];
      }
      return output;
    } else {
      const path = v[0].path;
      const key = v[0].key;
      const arrayTransformer = v[0].arrayTransformer;
      const transformer = v[0].transformer;
      if (this.hasPath(file, path)) {
        const pathVal = this.handlePath(file, path);
        if (Array.isArray(pathVal)) {
          v = pathVal.map((element: Record<string, unknown>) => {
            return _.omit(this.convertInternal(element, v[0]), [
              'path',
              'transformer',
              'arrayTransformer',
              'key'
            ]) as T;
          });
          if (key !== undefined) {
            v = collapseDuplicates(v, key, this.collapseResults);
          }
          if (arrayTransformer !== undefined) {
            v = arrayTransformer(v, this.data) as T[];
          }
          return v;
        } else {
          if (transformer !== undefined) {
            return [transformer(this.handlePath(file, path)) as T];
          } else {
            return [this.handlePath(file, path) as T];
          }
        }
      } else {
        return [];
      }
    }
  }
  handlePath(file: Record<string, unknown>, path: string) {
    if (path.startsWith('$.')) {
      return _.get(this.data, path.slice(2)) || '';
    } else {
      return _.get(file, path) || '';
    }
  }
  hasPath(file: Record<string, unknown>, path: string): boolean {
    if (path.startsWith('$.')) {
      return _.has(this.data, path.slice(2));
    } else {
      return _.has(file, path);
    }
  }
}
