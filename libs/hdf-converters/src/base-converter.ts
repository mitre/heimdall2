import {createHash} from 'crypto';
import parser from 'fast-xml-parser';
import * as htmlparser from 'htmlparser2';
import {ExecJSON} from 'inspecjs';
import _ from 'lodash';
import Papa from 'papaparse';

export interface ILookupPath {
  shortcircuit?: boolean;
  path?: string | string[];
  transformer?: (internalData: any) => unknown;
  arrayTransformer?: (data: unknown[], unconvertedData: any) => unknown[];
  key?: string;
}

export type ObjectEntryValue<T> = {[K in keyof T]: readonly [K, T[K]]}[keyof T];
/* eslint-disable @typescript-eslint/ban-types */
export type MappedTransform<T, U extends ILookupPath> = {
  [K in keyof T]: Exclude<T[K], undefined | null> extends Array<any>
    ? MappedTransform<T[K], U>
    : T[K] extends Function
    ? T[K]
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
/* eslint-enable @typescript-eslint/ban-types */
export type UnevaluatedMapping<T> =
  | T
  | Array<T>
  | (T & ILookupPath)
  | Array<T & ILookupPath>;

// Hashing Function
export function generateHash(data: string, algorithm = 'sha256'): string {
  const hash = createHash(algorithm);
  return hash.update(data).digest('hex');
}

export function parseHtml(input: unknown): string {
  const textData: string[] = [];
  const myParser = new htmlparser.Parser({
    ontext(text: string) {
      textData.push(text);
    }
  });
  if (typeof input === 'string') {
    myParser.write(input);
    myParser.end();
  }
  return textData.join('');
}

export function parseXml(xml: string): Record<string, unknown> {
  const options = {
    attributeNamePrefix: '',
    textNodeName: 'text',
    ignoreAttributes: false
  };
  return parser.parse(xml, options);
}

export function parseCsv(csv: string): unknown[] {
  const result = Papa.parse(csv.trim(), {header: true});

  if (result.errors.length) {
    throw result.errors;
  }

  return result.data;
}

export function impactMapping(
  mapping: Map<string, number>
): (severity: unknown) => number {
  return (severity: unknown): number => {
    if (typeof severity === 'string' || typeof severity === 'number') {
      return mapping.get(severity.toString().toLowerCase()) || 0;
    } else {
      return 0;
    }
  };
}

// eslint-disable-next-line @typescript-eslint/ban-types
function collapseDuplicates<T extends object>(
  array: Array<T>,
  key: string,
  collapseResults: boolean
): Array<T> {
  const seen = new Map<string, number>();
  const newArray: T[] = [];
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
        const oldResult = _.get(
          newArray[index],
          'results'
        ) as ExecJSON.ControlResult[];
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
              oldResult.concat(
                _.get(item, 'results') as ExecJSON.ControlResult[]
              )
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
  unconvertedData: Record<string, unknown>;
  mappings?: MappedTransform<ExecJSON.Execution, ILookupPath>;
  collapseResults: boolean;

  constructor(
    unconvertedData: Record<string, unknown>,
    collapseResults = false
  ) {
    this.unconvertedData = unconvertedData;
    this.collapseResults = collapseResults;
  }
  setMappings(
    mappings: MappedTransform<ExecJSON.Execution, ILookupPath>
  ): void {
    this.mappings = mappings;
  }
  toHdf(): ExecJSON.Execution {
    if (this.mappings === undefined) {
      throw new Error('Mappings must be provided');
    } else {
      const hdf = this.convertInternal(this.unconvertedData, this.mappings);
      hdf.profiles.forEach((profile) => {
        profile.sha256 = generateHash(JSON.stringify(profile));
      });
      return hdf;
    }
  }

  objectMap<T, V>(
    obj: T,
    fn: (v: ObjectEntryValue<T>) => V
  ): {[K in keyof T]: V} {
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [k, fn(v)])
    ) as Record<keyof T, V>;
  }
  convertInternal<T>(
    data: Record<string, unknown>,
    mappings: T
  ): MappedReform<T, ILookupPath> {
    const isShortcircuiting =
      _.isObject(mappings) &&
      _.has(mappings, 'shortcircuit') &&
      _.isBoolean(_.get(mappings, 'shortcircuit')) &&
      _.get(mappings, 'shortcircuit');
    if (isShortcircuiting) {
      return _.omit(mappings as object, 'shortcircuit') as MappedReform<
        T,
        ILookupPath
      >;
    }

    const result = this.objectMap(mappings, (mapping: ObjectEntryValue<T>) =>
      this.evaluate(data, mapping)
    );
    return result as MappedReform<T, ILookupPath>;
  }

  evaluate<T>(
    data: unknown,
    mapping: UnevaluatedMapping<T>
  ): T | Array<T> | MappedReform<T, ILookupPath> {
    if (
      _.isString(mapping) ||
      _.isNumber(mapping) ||
      _.isBoolean(mapping) ||
      _.isNull(mapping)
    ) {
      return mapping;
    }

    if (Array.isArray(mapping)) {
      return this.handleArray(data, mapping as Array<T & ILookupPath>);
    }

    const hasTransformer =
      _.isObject(mapping) &&
      _.has(mapping, 'transformer') &&
      _.isFunction(_.get(mapping, 'transformer'));
    let transformer: (i: unknown) => unknown = (i: unknown) => i;
    if (hasTransformer) {
      transformer = (
        _.get(mapping, 'transformer') as (i: unknown) => unknown
      ).bind(this);
      mapping = _.omit(mapping as object, 'transformer') as
        | (T & ILookupPath)
        | Array<T & ILookupPath>;
    }

    const hasPath = _.isObject(mapping) && _.has(mapping, 'path');
    let internalData = data;
    if (hasPath) {
      internalData = this.handlePath(
        data as Record<string, unknown>,
        _.get(mapping, 'path') as string | string[]
      );
      mapping = _.omit(mapping as object, 'path') as
        | (T & ILookupPath)
        | Array<T & ILookupPath>;
    }

    if (_.keys(mapping).length > 0 && hasTransformer) {
      return {
        ...((hasPath
          ? internalData
          : this.convertInternal(
              internalData as Record<string, unknown>,
              mapping
            )) as Record<string, unknown>),
        ...(transformer(internalData) as Record<string, unknown>)
      } as MappedReform<T, ILookupPath>;
    }

    if (hasTransformer) {
      return transformer(internalData) as
        | T
        | T[]
        | MappedReform<T, ILookupPath>;
    }

    return (
      hasPath
        ? internalData
        : this.convertInternal(internalData as Record<string, unknown>, mapping)
    ) as T | T[] | MappedReform<T, ILookupPath>;
  }

  handleArray<T>(file: unknown, v: Array<T & ILookupPath>): Array<T> {
    if (v.length === 0) {
      return [];
    }
    const resultingData: Array<T> = [];
    for (const lookupPath of v) {
      if (lookupPath.path === undefined) {
        const arrayTransformer = lookupPath.arrayTransformer?.bind(this);
        v = v.map((element) => {
          return _.isObject(element)
            ? (_.omit(element, ['arrayTransformer']) as T & ILookupPath)
            : element;
        });
        let output: Array<T> = [];
        v.forEach((element) => {
          output.push(this.evaluate(file, element) as T);
        });
        if (arrayTransformer !== undefined) {
          if (Array.isArray(arrayTransformer)) {
            output = arrayTransformer[0].apply(arrayTransformer[1], [
              v,
              this.unconvertedData
            ]);
          } else {
            output = arrayTransformer.apply(null, [
              output,
              this.unconvertedData
            ]) as T[];
          }
        }
        resultingData.push(...output);
      } else {
        const path = lookupPath.path;
        const key = lookupPath.key;
        const arrayTransformer = lookupPath.arrayTransformer?.bind(this);
        const transformer = lookupPath.transformer?.bind(this);
        if (this.hasPath(file as Record<string, unknown>, path)) {
          const pathVal = this.handlePath(
            file as Record<string, unknown>,
            path
          );
          if (Array.isArray(pathVal)) {
            v = pathVal.map((element: Record<string, unknown>) => {
              return _.omit(this.convertInternal(element, lookupPath), [
                'path',
                'transformer',
                'arrayTransformer',
                'key'
              ]) as unknown as T;
            });
            if (arrayTransformer !== undefined) {
              if (Array.isArray(arrayTransformer)) {
                v = arrayTransformer[0].apply(arrayTransformer[1], [
                  v,
                  this.unconvertedData
                ]);
              } else {
                v = arrayTransformer.apply(null, [
                  v,
                  this.unconvertedData
                ]) as T[];
              }
            }
            if (key !== undefined) {
              v = collapseDuplicates(v, key, this.collapseResults);
            }
            resultingData.push(...v);
          } else {
            if (transformer !== undefined) {
              resultingData.push(
                transformer(
                  this.handlePath(file as Record<string, unknown>, path)
                ) as T
              );
            } else {
              resultingData.push(
                this.handlePath(file as Record<string, unknown>, path) as T
              );
            }
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

  handlePath(file: Record<string, unknown>, path: string | string[]): unknown {
    let pathArray = path;

    if (typeof path === 'string') {
      pathArray = [path];
    }

    const index = _.findIndex(pathArray, (p) => this.hasPath(file, p));

    if (index === -1) {
      // should probably throw error here, but instead are providing a default value to match current behavior
      return '';
    } else if (pathArray[index].startsWith('$.')) {
      return _.get(this.unconvertedData, pathArray[index].slice(2)) || ''; // having default values implemented like this also prevents 'null' from being passed through
    } else {
      return _.get(file, pathArray[index]) || '';
    }
  }
  hasPath(file: Record<string, unknown>, path: string | string[]): boolean {
    let pathArray;
    if (typeof path === 'string') {
      pathArray = [path];
    } else {
      pathArray = path;
    }

    return _.some(pathArray, (p) => {
      if (p.startsWith('$.')) {
        return _.has(this.unconvertedData, p.slice(2));
      } else {
        return _.has(file, p);
      }
    });
  }
}
