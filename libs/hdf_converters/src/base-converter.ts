import {ExecJSON} from 'inspecjs/dist/generated_parsers/v_1_0/exec-json'
import _ from 'lodash'
import {createHash} from 'crypto'

export interface LookupPath {
  path?: string;
  // Parameter will be the return type of handlePath, which can either be a string or a number
  transformer?: (value: unknown) => unknown,
  arrayTransformer?: (value: unknown[], file: unknown) => unknown[],
  key?: string;
}

export type ObjectEntries<T> = {[K in keyof T]: readonly [K, T[K]]}[keyof T];
export type MappedTransform<T, U extends LookupPath> = {
  [K in keyof T]: Exclude<T[K], undefined | null> extends Array<any>
  ? MappedTransform<T[K], U>
  : T[K] extends Function
  ? T[K]
  : T[K] extends object
  ? MappedTransform<T[K] & (U & {arrayTransformer?: (value: unknown[], file: object) => T[K][]}), U>
  : T[K] | U & {transformer?: (value: unknown) => T[K]};
};
export type MappedReform<T, U> = {
  [K in keyof T]: Exclude<T[K], undefined | null> extends Array<any>
  ? MappedReform<T[K], U>
  : T[K] extends object
  ? MappedReform<T[K] & U, U>
  : Exclude<T[K], U>;
};

// Hashing Function
export function generateHash(data: string, algorithm: string = 'sha256'): string {
  const hash = createHash(algorithm);
  return hash.update(data).digest('hex');
}

function collapseDuplicates<T extends Object>(
  array: Array<T>,
  key: string,
  collapseResults: boolean
): Array<T> {
  const seen = new Map<string, number>();
  const newArray = new Array<T>();
  let counter = 0;
  array.forEach((item: T) => {
    const propertyValue = _.get(item, key);
    const index = seen.get(propertyValue) || 0;
    if (!seen.has(propertyValue)) {
      newArray.push(item);
      seen.set(propertyValue, counter);
      counter++;
    } else {
      const descriptions = new Array<string>();
      const length = _.get(newArray[index], 'results').length;
      for (let i = 0; i < length; i++) {
        descriptions.push(
          _.get(newArray[index], `results[${i.toString()}].code_desc`)
        );
      }
      if (collapseResults) {
        if (descriptions.indexOf(_.get(item, 'results[0].code_desc')) === -1) {
          _.set(
            newArray[index],
            'results',
            _.get(newArray[index], 'results').concat(_.get(item, 'results'))
          );
        }
      } else {
        _.set(
          newArray[index],
          'results',
          _.get(newArray[index], 'results').concat(_.get(item, 'results'))
        );
      }
    }
  });
  return newArray;
}
export class BaseConverter {
  data: object;
  mappings?: MappedTransform<ExecJSON, LookupPath>;
  collapseResults: boolean

  constructor(
    data: object,
    collapseResults = false
  ) {
    this.data = data;
    this.collapseResults = collapseResults
  }
  setMappings(mappings: MappedTransform<ExecJSON, LookupPath>) {
    this.mappings = mappings
  }

  toHdf(): ExecJSON {
    if (this.mappings === undefined) {
      throw new Error('Mappings must be provided')
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
  convertInternal<T>(file: object, fields: T): MappedReform<T, LookupPath> {
    const result = this.objectMap(fields, (v: ObjectEntries<T>) =>
      this.evaluate(file, v)
    );
    return result as MappedReform<T, LookupPath>;
  }
  evaluate<T extends object>(
    file: object,
    v: T | Array<T>
  ): number | string | boolean | T | Array<T> | MappedReform<T, LookupPath> {
    if (Array.isArray(v)) {
      return this.handleArray(file, v);
    } else if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean' || v === null) {
      return v;
    } else if (_.has(v, 'path')) {
      if (_.has(v, 'transformer')) {
        return _.get(v, 'transformer')(this.handlePath(file, _.get(v, 'path')));
      } else {
        return this.handlePath(file, _.get(v, 'path'));
      }
    }
    if (_.has(v, 'transformer')) {
      return _.get(v, 'transformer')(file);
    } else {
      return this.convertInternal(file, v);
    }
  }
  handleArray<T extends object>(file: object, v: Array<T & LookupPath>): Array<T> {
    if (v.length === 0) {
      return new Array<T>();
    }
    if (v[0].path === undefined) {
      let arrayTransformer = v[0].arrayTransformer
      v = v.map(element => {
        return _.omit(element, ['arrayTransformer']) as T & LookupPath
      })
      let output: Array<T> = [];
      v.forEach((element) => {
        output.push(this.evaluate(file, element) as T);
      });
      if (arrayTransformer !== undefined) {
        output = arrayTransformer(output, this.data) as T[]
      }
      return output;
    } else {
      const path = v[0].path;
      const key = v[0].key;
      const arrayTransformer = v[0].arrayTransformer
      const transformer = v[0].transformer
      if (this.hasPath(file, path)) {
        if (Array.isArray(this.handlePath(file, path))) {
          v = this.handlePath(file, path).map((element: object) => {
            return _.omit(this.convertInternal(element, v[0]), [
              'path',
              'transformer',
              'arrayTransformer',
              'key'
            ]);
          });
          if (key !== undefined) {
            v = collapseDuplicates(v, key, this.collapseResults);
          }
          if (arrayTransformer !== undefined) {
            v = arrayTransformer(v, this.data) as T[]
          }
          return v
        } else {
          if (transformer !== undefined) {
            return [transformer(this.handlePath(file, path)) as T];
          } else {
            return [this.handlePath(file, path)]
          }
        }
      } else {
        return [];
      }
    }
  }
  handlePath(file: object, path: string) {
    if (path.startsWith('$.')) {
      return _.get(this.data, path.slice(2)) || '';
    } else {
      return _.get(file, path) || '';
    }
  }
  hasPath(file: object, path: string): boolean {
    if (path.startsWith('$.')) {
      return _.has(this.data, path.slice(2));
    } else {
      return _.has(file, path);
    }
  }
}
