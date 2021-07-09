import { ExecJSON } from 'inspecjs/dist/generated_parsers/v_1_0/exec-json'
import _ from 'lodash'
import { createHash } from 'crypto';

export type ObjectEntries<T> = { [K in keyof T]: readonly [K, T[K]] }[keyof T];
export type MappedTransform<T, U> = {
  [K in keyof T]: Exclude<T[K], undefined | null> extends Array<any>
  ? MappedTransform<T[K], U>
  : T[K] extends object
  ? MappedTransform<T[K] & U, U>
  : T[K] | U;
};
export type MappedReform<T, U> = {
  [K in keyof T]: Exclude<T[K], undefined | null> extends Array<any>
  ? MappedReform<T[K], U>
  : T[K] extends object
  ? MappedReform<T[K] & U, U>
  : Exclude<T[K], U>;
};
export interface LookupPath {
  path?: string | string[];
  // Parameter will be the return type of handlePath, which can either be a string or a number
  transformer?:
  | ((value: string) => string | number)
  | ((value: number) => string | number)
  | ((value: object) => string | number | object | Array<any> | null);
  key?: string;
}

// Hashing Function
export function generateHash(data: string, algorithm: string): string {
  const hash = createHash(algorithm);
  const output = hash.update(data).digest('hex');
  return output;
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
    const test = _.get(newArray[index], 'results[?(code_desc)]');
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
  mappings: MappedTransform<ExecJSON, LookupPath>;
  collapseResults: boolean

  constructor(
    data: object,
    mappings: MappedTransform<ExecJSON, LookupPath>,
    collapseResults = false
  ) {
    this.data = data;
    this.mappings = mappings;
    this.collapseResults = collapseResults
  }

  toHdf(): ExecJSON {
    const v = this.convertInternal(this.data, this.mappings);
    v.profiles.forEach((element) => {
      element.sha256 = generateHash(
        JSON.stringify(element),
        'sha256'
      );
    });
    return v;
  }

  objectMap<T, V>(obj: T, fn: (v: ObjectEntries<T>) => V): { [K in keyof T]: V } {
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [k, fn(v)])
    ) as Record<keyof T, V>;
  }
  convertInternal<T>(file: object, fields: T): MappedReform<T, LookupPath> {
    const result = this.objectMap(fields, (v: ObjectEntries<T>) =>
      this.evaluate(file, v)
    ); //TODO
    return result as MappedReform<T, LookupPath>;
  }
  evaluate<T>(
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
  handleArray<T>(file: object, v: Array<T & LookupPath>): Array<T> {
    if (v.length === 0) {
      return new Array<T>();
    }
    if (v[0].path === undefined) {
      const output: Array<T> = [];
      v.forEach((element) => {
        output.push(this.evaluate(file, element) as T);
      });
      return output;
    } else {
      const path = v[0].path;
      const key = v[0].key;
      if (_.has(file, path)) {
        const length = _.get(file, path).length;
        for (let i = 1; i < length; i++) {
          v.push({ ...v[0] });
        }
        let counter = 0;
        _.get(file, path).forEach((element: object) => {
          v[counter] = _.omit(this.convertInternal(element, v[counter]), [
            'path',
            'key'
          ]) as T;
          counter++;
        });
        if (key !== undefined) {
          return collapseDuplicates(v, key, this.collapseResults);
        } else {
          return v;
        }
      } else {
        return [];
      }
    }
  }
  handlePath(file: object, path: string | string[]): string | number {
    if (typeof path === 'string' && path.startsWith('$.')) {
      return _.get(this.data, path.slice(2)) || '';
    } else if (typeof path === 'string') {
      return _.get(file, path) || '';
    } else {
      let value = '';
      path.forEach(function (item) {
        if (typeof _.get(file, item) === undefined) {
          value += item + ' ';
        } else {
          value += _.get(file, item) + ' ';
        }
      });
      return value;
    }
  }
}
