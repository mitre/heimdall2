import _ from 'lodash';
import {MappedReform, MappedTransform, ObjectEntries} from '../base-converter';
import {ILookupPathFH} from './reverse-base-converter';

//Base converter used to support conversions from HDF to Any Format
export class FromAnyBaseConverter {
  data: any;
  mappings?: MappedTransform<any, ILookupPathFH>;
  collapseResults: boolean;

  constructor(data: any, collapseResults = false) {
    this.data = data;
    this.collapseResults = collapseResults;
  }

  setMappings(mappings: MappedTransform<any, ILookupPathFH>): void {
    this.mappings = mappings;
  }

  //Called over and over to iterate through objects assigned to keys too
  convertInternal(file: object, fields: any): MappedReform<any, ILookupPathFH> {
    return this.objectMap(fields, (v: ObjectEntries<any>) =>
      this.evaluate(file, v)
    );
  }

  // Preforms fn() on all entries inside the passed obj
  objectMap<T, V>(obj: T, fn: (v: ObjectEntries<T>) => V): {[K in keyof T]: V} {
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [k, fn(v)])
    ) as Record<keyof T, V>;
  }

  //Used to get the data located at the paths
  evaluate<T extends object & ILookupPathFH>(
    file: object,
    v: T | Array<T>
  ): T | Array<T> | MappedReform<T, ILookupPathFH> {
    const transformer = _.get(v, 'transformer');
    if (Array.isArray(v)) {
      return this.handleArray(file, v);
    }
    // Do we have a static value set here?
    if (
      typeof v === 'string' ||
      typeof v === 'number' ||
      typeof v === 'boolean' ||
      v === null
    ) {
      return v;
    }

    if (typeof transformer === 'function') {
      let result: T | Array<T> | MappedReform<T, ILookupPathFH>;
      if (!v.path) {
        if (v.passParent) {
          result = transformer(file, this);
        } else {
          result = transformer(file);
        }
      } else {
        if (v.passParent) {
          result = transformer(this.handlePath(file, v.path), this);
        } else {
          result = transformer(this.handlePath(file, v.path));
        }
      }
      if (typeof result === 'undefined' && v.default) {
        return v.default;
      }
      return result;
    } else {
      if (v.path) {
        return this.handlePath(file, v.path) as T | T[];
      }
    }
    return this.convertInternal(file, v);
  }

  handleArray<T extends ILookupPathFH>(
    file: object,
    v: Array<T & ILookupPathFH>
  ): Array<T> {
    const resultingData: Array<T> = [];
    // Looks through parsed data file using the mapping setup in V
    if (v[0] && !v[0].path) {
      const arrayTransformer = v[0].arrayTransformer; //does nothing since null
      let output: Array<T> = v.map(
        (element) => this.evaluate(file, element) as T
      );
      if (arrayTransformer) {
        output = arrayTransformer(output, this.data) as T[];
      }
      resultingData.push(...output);
    } else if (v[0] && v[0].path) {
      const path = v[0].path;
      const arrayTransformer = v[0].arrayTransformer;
      const transformer = v[0].transformer;
      if (this.hasPath(file, path)) {
        const pathVal = this.handlePath(file, path); //Any matches in the path even if more than one, will grab an array of results
        if (Array.isArray(pathVal)) {
          v = pathVal.map(
            (element: Record<string, unknown>) =>
              this.convertInternal(element, v[0]) as T
          );
          if (arrayTransformer) {
            v = arrayTransformer(v, this.data) as T[];
          }
          resultingData.push(...v);
        } else {
          if (transformer) {
            resultingData.push(
              transformer(this.handlePath(file, path) as any) as T
            );
          } else {
            resultingData.push(this.handlePath(file, path) as T);
          }
        }
      }
    }

    const uniqueResults: T[] = [];
    resultingData.forEach((result) => {
      if (
        !uniqueResults.some((uniqueResult) => _.isEqual(result, uniqueResult))
      ) {
        uniqueResults.push(result);
      }
    });
    return uniqueResults;
  }

  //Gets the value at the path using lodash and path stored in object
  handlePath(file: object, path: string): unknown {
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
