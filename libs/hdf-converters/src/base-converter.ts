import { createHash } from 'crypto';
import { XMLParser } from 'fast-xml-parser';
import type { ExecJSON } from 'inspecjs';
import * as _ from 'lodash';
import Papa from 'papaparse';

export type ILookupPath = {
  arrayTransformer?: (value: unknown[], file: any) => unknown[];
  key?: string;
  path?: string | string[];
  pathTransform?: (value: unknown, file: any) => unknown;
  shortcircuit?: boolean;
  transformer?: (value: any) => unknown;
};

export type MappedReform<T, U> = {
  [K in keyof T]: Exclude<T[K], null | undefined> extends any[]
    ? MappedReform<T[K], U>
    : T[K] extends object
      ? MappedReform<T[K] & U, U>
      : Exclude<T[K], U>;
};
export type MappedTransform<T, U extends ILookupPath> = {
  [K in keyof T]: Exclude<T[K], null | undefined> extends any[]
    ? MappedTransform<T[K], U>
    : T[K] extends (...args: any[]) => any
      ? T[K]
      : T[K] extends object
        ? MappedTransform<T[K] & U, U>
        : T[K] | U;
};
export type ObjectEntryValue<T> = { [K in keyof T]: readonly [K, T[K]] }[keyof T];

export const DEFAULT_PROFILE_FIELDS = {
  attributes: [],
  copyright: null,
  copyright_email: null,
  depends: [],
  description: null,
  groups: [],
  inspec_version: null,
  license: null,
  maintainer: null,
  parent_profile: null,
  sha256: '',
  skip_message: null,
  status: 'loaded',
  status_message: null,
  summary: null,
  supports: [],
  title: null,
  version: null,
} as const;

const identityTransformer = (val: unknown) => val;

export class BaseConverter<D = Record<string, unknown>> {
  collapseResults: boolean;
  data: D;
  mappings?: MappedTransform<ExecJSON.Execution, ILookupPath>;

  constructor(data: D, collapseResults = false) {
    this.data = data;
    this.collapseResults = collapseResults;
  }

  convertInternal<T>(
    file: Record<string, unknown>,
    fields: T,
  ): MappedReform<T, ILookupPath> {
    const isShortcircuiting
      = _.isObject(fields)
        && _.has(fields, 'shortcircuit')
        && _.isBoolean(_.get(fields, 'shortcircuit'))
        && _.get(fields, 'shortcircuit');
    if (isShortcircuiting) {
      return _.omit(fields as object, 'shortcircuit') as MappedReform<
        T,
        ILookupPath
      >;
    }

    const result = this.objectMap(fields as T[], v =>
      this.evaluate(file, v as ILookupPath & object & T),
    );
    return result as MappedReform<T, ILookupPath>;
  }

  evaluate<T>(
    file: Record<string, unknown>,
    v: T | T[],
  ): MappedReform<T, ILookupPath> | T | T[] {
    if (v === undefined) {
      return v;
    }

    const hasTransformer
      = _.has(v, 'transformer') && _.isFunction(_.get(v, 'transformer'));
    let transformer = identityTransformer;
    if (hasTransformer) {
      transformer = _.get(v, 'transformer') as any;
      v = _.omit(v as object, 'transformer') as T;
    }

    const haspathTransform
      = _.has(v, 'pathTransform') && _.isFunction(_.get(v, 'pathTransform'));

    let pathTransform: (
      val: T | T[],
      f?: Record<string, unknown>,
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
          _.get(v, 'path') as unknown as string | string[],
        ) as T | T[],
        file,
      );
      v = _.omit(v as object, 'path') as T;
    }

    if (
      _.isString(pathV)
      || _.isNumber(pathV)
      || _.isBoolean(pathV)
      || _.isNull(pathV)
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
        ...this.convertInternal(
          hasPath ? (pathV as Record<string, unknown>) : file,
          transformer(hasPath ? pathV : (file as T | T[])) as object,
        ),
      } as MappedReform<T, ILookupPath>;
    }

    if (hasTransformer) {
      return transformer(hasPath ? pathV : (file)) as
        | MappedReform<T, ILookupPath>
        | T
        | T[];
    }

    return hasPath
      ? pathV
      : (this.convertInternal(file, v) as
      | MappedReform<T, ILookupPath>
      | T
      | T[]);
  }

  handleArray<T>(
    file: Record<string, unknown>,
    v: (ILookupPath & T)[],
  ): T[] {
    if (v.length === 0) {
      return [];
    }
    const resultingData: T[] = [];
    for (const lookupPath of v) {
      if (lookupPath.path === undefined) {
        const arrayTransformer = lookupPath.arrayTransformer?.bind(this);
        v = v.map((element) => {
          return _.isObject(element)
            ? (_.omit(element, ['arrayTransformer']) as ILookupPath & T)
            : element;
        });
        let output: T[] = [this.evaluate(file, lookupPath) as T];
        if (arrayTransformer !== undefined) {
          output = Array.isArray(arrayTransformer)
            ? arrayTransformer[0].apply(arrayTransformer[1], [
              v,
              this.data,
            ])
            : (Reflect.apply(arrayTransformer, null, [output, this.data]) as T[]);
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
              let processed = _.omit(
                this.convertInternal(element, lookupPath),
                [
                  'path',
                  'transformer',
                  'arrayTransformer',
                  'key',
                  'pathTransform',
                ],
              ) as unknown as T;
              if (transformer !== undefined) {
                processed = this.evaluate(element, {
                  ...processed,
                  transformer,
                }) as T;
              }
              return processed;
            }) as any;
            if (arrayTransformer !== undefined) {
              v = Array.isArray(arrayTransformer)
                ? arrayTransformer[0].apply(arrayTransformer[1], [
                  v,
                  this.data,
                ])
                : (Reflect.apply(arrayTransformer, null, [v, this.data]) as any);
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

    const index = _.findIndex(pathArray, p => this.hasPath(file, p));

    if (index === -1) {
      // should probably throw error here, but instead are providing a default value to match current behavior
      return '';
    } else if (pathArray[index].startsWith('$.')) {
      return _.get(this.data, pathArray[index].slice(2)) || ''; // having default values implemented like this also prevents 'null' from being passed through
    } else {
      return _.get(file, pathArray[index]) ?? '';
    }
  }

  hasPath(file: Record<string, unknown>, path: string | string[]): boolean {
    const pathArray = typeof path === 'string' ? [path] : path;

    return _.some(pathArray, (p) => {
      return p.startsWith('$.') ? _.has(this.data, p.slice(2)) : _.has(file, p);
    });
  }

  objectMap<T extends unknown[], V>(
    obj: T,
    fn: (v: ObjectEntryValue<T>) => V,
  ): { [K in keyof T]: V } {
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [k, fn(v as ObjectEntryValue<T>)]),
    ) as Record<keyof T, V>;
  }

  setMappings(
    mappings: MappedTransform<ExecJSON.Execution, ILookupPath>,
  ): void {
    this.mappings = mappings;
  }

  toHdf(): ExecJSON.Execution {
    if (this.mappings === undefined) {
      throw new Error('Mappings must be provided');
    } else {
      const v = this.convertInternal(
        this.data as Record<string, unknown>,
        this.mappings,
      );
      for (const element of v.profiles) {
        element.sha256 = generateHash(JSON.stringify(element));
      }
      return v;
    }
  }
}

export async function buildParseHtmlFunc(): Promise<(input: unknown) => string> {
  const htmlparser = await import('htmlparser2');
  return (input: unknown): string => {
    if (!_.isString(input)) {
      return '';
    }
    const data: string[] = [];
    const parser = new htmlparser.Parser({
      ontext(text: string) {
        data.push(text);
      },
    });
    parser.write(String(input));
    parser.end();
    return data.join('');
  };
}

// Hashing Function
export function generateHash(data: string, algorithm = 'sha256'): string {
  const hash = createHash(algorithm);
  return hash.update(data).digest('hex');
}

export function impactMapping(
  mapping: Map<string, number>,
): (severity: unknown) => number {
  return (severity: unknown): number => {
    return typeof severity === 'string' || typeof severity === 'number' ? mapping.get(severity.toString().toLowerCase()) || 0 : 0;
  };
}

export function parseCsv(csv: string): unknown[] {
  const result = Papa.parse(csv.trim(), { header: true });

  if (result.errors.length > 0) {
    throw new Error(`CSV parse errors: ${JSON.stringify(result.errors)}`);
  }

  return result.data;
}

export function parseXml(
  xml: string,
  additionalOptions?: Record<string, unknown>,
): Record<string, unknown> {
  const options = {
    attributeNamePrefix: '',
    ignoreAttributes: false,
    ignoreDeclaration: true,
    parseAttributeValue: false,
    parseTagValue: false,
    removeNSPrefix: true,
    textNodeName: 'text',
    ...additionalOptions,
  };
  const parser = new XMLParser(options);
  return parser.parse(xml);
}

function collapseDuplicates<T extends object>(
  array: T[],
  key: string,
  collapseResults: boolean,
): T[] {
  const seen = new Map<string, number>();
  const newArray: T[] = [];
  let counter = 0;
  for (const item of array) {
    const propertyValue = _.get(item, key);
    if (typeof propertyValue === 'string') {
      const index = seen.get(propertyValue) || 0;
      if (seen.has(propertyValue)) {
        const oldResult = _.get(
          newArray[index],
          'results',
        ) as ExecJSON.ControlResult[];
        const descriptions = oldResult.map(element =>
          _.get(element, 'code_desc'),
        );
        if (collapseResults) {
          if (
            !descriptions.includes(_.get(item, 'results[0].code_desc') as string)
          ) {
            _.set(
              newArray[index],
              'results',
              [...oldResult, ..._.get(item, 'results') as ExecJSON.ControlResult[]],
            );
          }
        } else {
          _.set(
            newArray[index],
            'results',
            [...oldResult, ..._.get(item, 'results') as ExecJSON.ControlResult[]],
          );
        }
      } else {
        newArray.push(item);
        seen.set(propertyValue, counter);
        counter++;
      }
    }
  }
  return newArray;
}
