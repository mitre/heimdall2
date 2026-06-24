import type { ExecJSON } from 'inspecjs';
import * as _ from 'lodash';
import type {
  MappedReform,
  MappedTransform,
  ObjectEntryValue,
} from '../base-converter';

export type ILookupPathFH = {
  arrayTransformer?: (value: unknown[], file: ExecJSON.Execution) => unknown[];
  default?: any;
  key?: string;
  passParent?: boolean;
  path?: string;
  transformer?: (value: any, context?: any) => unknown;
};

// Base converter used to support conversions from HDF to Any Format
export class FromHdfBaseConverter {
  collapseResults: boolean;
  data: ExecJSON.Execution;
  mappings?: MappedTransform<any, ILookupPathFH>;

  constructor(data: ExecJSON.Execution, collapseResults = false) {
    this.data = data;
    this.collapseResults = collapseResults;
  }

  // Called over and over to iterate through objects assigned to keys too
  convertInternal<T>(file: object, fields: T): MappedReform<T, ILookupPathFH> {
    const result = this.objectMap(fields as T[], v =>
      this.evaluate(file, v as ILookupPathFH & object & T),
    );
    return result as MappedReform<T, ILookupPathFH>;
  }

  // Used to get the data located at the paths
  evaluate<T extends ILookupPathFH & object>(
    file: object,
    v: T | T[],
  ): MappedReform<T, ILookupPathFH> | T | T[] {
    const transformer = _.get(v, 'transformer') as any;
    if (Array.isArray(v)) {
      return this.handleArray(file, v);
    }
    // Do we have a static value set here?
    if (
      typeof v === 'string'
      || typeof v === 'number'
      || typeof v === 'boolean'
      || v === undefined
      || v === null
    ) {
      return v;
    }

    if (typeof transformer === 'function') {
      if (v.path) {
        return v.passParent ? transformer(this.handlePath(file, v.path), this) : transformer(this.handlePath(file, v.path));
      }
      return v.passParent ? transformer(file, this) : transformer(file);
    }
    if (v.path) {
      return this.handlePath(file, v.path) as T | T[];
    }
    return this.convertInternal(file, v);
  }

  handleArray<T extends ILookupPathFH>(
    file: object,
    v: (ILookupPathFH & T)[],
  ): T[] {
    const resultingData: T[] = [];
    // Looks through parsed data file using the mapping setup in V
    if (v[0] && !v[0].path) {
      const arrayTransformer = v[0].arrayTransformer; // does nothing since null
      let output: T[] = v.map(
        element => this.evaluate(file, element) as T,
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
        const pathVal = this.handlePath(file, path); // Any matches in the path even if more than one, will grab an array of results
        if (Array.isArray(pathVal)) {
          v = pathVal.map(
            (element: Record<string, unknown>) =>
              this.convertInternal(element, v[0]) as T,
          );
          if (arrayTransformer) {
            v = arrayTransformer(v, this.data) as T[];
          }
          resultingData.push(...v);
        } else {
          if (transformer) {
            resultingData.push(
              transformer(this.handlePath(file, path) as any) as T,
            );
          } else {
            resultingData.push(this.handlePath(file, path) as T);
          }
        }
      }
    }

    const uniqueResults: T[] = [];
    for (const result of resultingData) {
      if (
        uniqueResults.every(uniqueResult => !_.isEqual(result, uniqueResult))
      ) {
        uniqueResults.push(result);
      }
    }
    return uniqueResults;
  }

  // Gets the value at the path using lodash and path stored in object
  handlePath(file: object, path: string): unknown {
    return path.startsWith('$.') ? _.get(this.data, path.slice(2)) : _.get(file, path);
  }

  hasPath(file: object, path: string): boolean {
    return path.startsWith('$.') ? _.has(this.data, path.slice(2)) : _.has(file, path);
  }

  // Preforms fn() on all entries inside the passed obj
  objectMap<T extends unknown[], V>(
    obj: T,
    fn: (v: ObjectEntryValue<T>) => V,
  ): { [K in keyof T]: V } {
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [k, fn(v as ObjectEntryValue<T>)]),
    ) as Record<keyof T, V>;
  }

  setMappings(mappings: MappedTransform<any, ILookupPathFH>): void {
    this.mappings = mappings;
  }
}
