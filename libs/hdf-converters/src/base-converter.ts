import {createHash} from 'crypto';
import {XMLParser} from 'fast-xml-parser';
import * as htmlparser from 'htmlparser2';
import {ExecJSON} from 'inspecjs';
import * as _ from 'lodash';
import Papa from 'papaparse';

export interface ILookupPath {
  shortcircuit?: boolean;
  path?: string | string[];
  transformer?: (value: any) => unknown;
  arrayTransformer?: (value: unknown[], file: any) => unknown[];
  pathTransform?: (value: unknown, file: any) => unknown;
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

export function parseXml(
  xml: string,
  additionalOptions?: Record<string, unknown>
): Record<string, unknown> {
  const options = {
    attributeNamePrefix: '',
    textNodeName: 'text',
    ignoreAttributes: false,
    ignoreDeclaration: true,
    parseAttributeValue: false,
    parseTagValue: false,
    removeNSPrefix: true,
    ...additionalOptions
  };
  const parser = new XMLParser(options);
  return parser.parse(xml);
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
  data: Record<string, unknown>;
  mappings?: MappedTransform<ExecJSON.Execution, ILookupPath>;
  collapseResults: boolean;

  constructor(data: Record<string, unknown>, collapseResults = false) {
    this.data = data;
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
      const v = this.convertInternal(this.data, this.mappings);
      v.profiles.forEach((element) => {
        element.sha256 = generateHash(JSON.stringify(element));
      });
      return v;
    }
  }

  objectMap<T extends Array<unknown>, V>(
    obj: T,
    fn: (v: ObjectEntryValue<T>) => V
  ): {[K in keyof T]: V} {
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [k, fn(v as ObjectEntryValue<T>)])
    ) as Record<keyof T, V>;
  }
  convertInternal<T>(
    file: Record<string, unknown>,
    fields: T
  ): MappedReform<T, ILookupPath> {
    const isShortcircuiting =
      _.isObject(fields) &&
      _.has(fields, 'shortcircuit') &&
      _.isBoolean(_.get(fields, 'shortcircuit')) &&
      _.get(fields, 'shortcircuit');
    if (isShortcircuiting) {
      return _.omit(fields as object, 'shortcircuit') as MappedReform<
        T,
        ILookupPath
      >;
    }

    const result = this.objectMap(fields as T[], (v) =>
      this.evaluate(file, v as T & object & ILookupPath)
    );
    return result as MappedReform<T, ILookupPath>;
  }

  evaluate<T>(
    file: Record<string, unknown>,
    v: T | Array<T>
  ): T | Array<T> | MappedReform<T, ILookupPath> {
    const hasTransformer =
      _.has(v, 'transformer') && _.isFunction(_.get(v, 'transformer'));
    let transformer = (val: unknown) => val;
    if (hasTransformer) {
      transformer = _.get(v, 'transformer') as any;
      v = _.omit(v as object, 'transformer') as T;
    }

    const haspathTransform =
      _.has(v, 'pathTransform') && _.isFunction(_.get(v, 'pathTransform'));

    let pathTransform: (
      val: T | T[],
      f?: Record<string, unknown>
    ) => T | T[] = (val: T | T[]) => val;
    if (haspathTransform) {
      pathTransform = _.get(v, 'pathTransform') as any;
      v = _.omit(v as object, 'pathTransform') as T;
    }

    const hasPath = _.isObject(v) && _.has(v, 'path');
    let pathV = v;
    if (hasPath) {
      pathV = pathTransform(
        this.handlePath(
          file,
          _.get(v, 'path') as unknown as string | string[]
        ) as T | T[],
        file
      );
      v = _.omit(v as object, 'path') as T;
    }

    if (
      _.isString(pathV) ||
      _.isNumber(pathV) ||
      _.isBoolean(pathV) ||
      _.isNull(pathV)
    ) {
      return transformer(pathV) as T;
    }

    if (Array.isArray(pathV)) {
      return hasTransformer
        ? (transformer(pathV) as T[])
        : this.handleArray(file, pathV as any);
    }

    if (_.keys(v).length > 0 && hasTransformer) {
      return {
        ...this.convertInternal(file, v),
        ...(transformer(hasPath ? pathV : (file as T | T[])) as object)
      } as MappedReform<T, ILookupPath>;
    }

    if (hasTransformer) {
      return transformer(hasPath ? pathV : (file as T | T[])) as
        | T
        | T[]
        | MappedReform<T, ILookupPath>;
    }

    return hasPath
      ? pathV
      : (this.convertInternal(file, v) as
          | T
          | T[]
          | MappedReform<T, ILookupPath>);
  }

  handleArray<T>(
    file: Record<string, unknown>,
    v: Array<T & ILookupPath>
  ): Array<T> {
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
        output.push(this.evaluate(file, lookupPath) as T);
        if (arrayTransformer !== undefined) {
          if (Array.isArray(arrayTransformer)) {
            output = arrayTransformer[0].apply(arrayTransformer[1], [
              v,
              this.data
            ]);
          } else {
            output = arrayTransformer.apply(null, [output, this.data]) as T[];
          }
        }
        resultingData.push(...output);
      } else {
        const path = lookupPath.path;
        const key = lookupPath.key;
        const arrayTransformer = lookupPath.arrayTransformer?.bind(this);
        const transformer = lookupPath.transformer?.bind(this);
        const pathTransform = lookupPath.pathTransform?.bind(this);
        if (this.hasPath(file, path)) {
          let pathVal = this.handlePath(file, path);
          if (pathTransform !== undefined) {
            pathVal = pathTransform(pathVal, file);
          }
          if (Array.isArray(pathVal)) {
            v = pathVal.map((element: Record<string, unknown>) => {
              return _.omit(this.convertInternal(element, lookupPath), [
                'path',
                'transformer',
                'arrayTransformer',
                'key',
                'pathTransform'
              ]) as unknown as T;
            }) as any;
            if (arrayTransformer !== undefined) {
              if (Array.isArray(arrayTransformer)) {
                v = arrayTransformer[0].apply(arrayTransformer[1], [
                  v,
                  this.data
                ]);
              } else {
                v = arrayTransformer.apply(null, [v, this.data]) as any;
              }
            }
            if (key !== undefined) {
              v = collapseDuplicates(v, key, this.collapseResults);
            }
            resultingData.push(...v);
          } else {
            if (transformer !== undefined) {
              pathVal = transformer(pathVal);
            }
            resultingData.push(pathVal as T);
          }
        }
      }
    }

    return resultingData;
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
      return _.get(this.data, pathArray[index].slice(2)) || ''; // having default values implemented like this also prevents 'null' from being passed through
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
        return _.has(this.data, p.slice(2));
      } else {
        return _.has(file, p);
      }
    });
  }
}
