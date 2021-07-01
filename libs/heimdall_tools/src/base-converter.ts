import { ExecJSON } from 'inspecjs/dist/generated_parsers/v_1_0/exec-json'
import { version as HeimdallToolsVersion } from '../package.json'
import _ from 'lodash'
import fs from 'fs'

export type ObjectEntries<T> = { [K in keyof T]: readonly [K, T[K]] }[keyof T];
export type MappedTransform<T, U> = {
  [K in keyof T]: T[K] extends Array<any> ? MappedTransform<T[K], U> : T[K] extends object ? MappedTransform<T[K] & U, U> : T[K] | U;
};
export type MappedReform<T, U> = {
  [K in keyof T]: T[K] extends Array<any> ? MappedReform<T[K], U> : T[K] extends object ? MappedReform<T[K] & U, U> : Exclude<T[K], U>;
};
export interface LookupPath {
  path?: string | string[];
  // Parameter will be the return type of handlePath, which can either be a string or a number
  transformer?: ((value: string) => string | number) | ((value: number) => string | number);
}

export class BaseConverter {
  data: object
  mappings: MappedTransform<ExecJSON, LookupPath>

  constructor(data: object, mappings: MappedTransform<ExecJSON, LookupPath>) {
    this.data = data
    this.mappings = mappings
  }

  toHdf(): ExecJSON {
    let v = this.convertInternal(this.data, this.mappings)
    // v.profiles.forEach((element) => {
    //   element.sha256 = generateHash(_.omit(v.profiles, ['sha256']).toString())
    // })
    //set the sha-256 to the hash(_.omit(v.profiles, ['sha256']), map the controls
    return v
  }

  objectMap<T, V>(obj: T, fn: (v: ObjectEntries<T>) => V): { [K in keyof T]: V } {
    return Object.fromEntries(
      Object.entries(obj).map(
        ([k, v]) => [k, fn(v)]
      )
    ) as Record<keyof T, V>
  }
  convertInternal<T>(file: object, fields: T): MappedReform<T, LookupPath> {
    const result = this.objectMap(fields, (v: ObjectEntries<T>) => this.evaluate(file, v)) //TODO
    return result as MappedReform<T, LookupPath>
  }
  // async function generateHash(data: string): string {
  //   const encoder = new TextEncoder();
  //   const encdata = encoder.encode(data);

  //   const byteArray = await crypto.subtle.digest('SHA-256', encdata)
  //   return Array.prototype.map.call(new Uint8Array(byteArray), x => (('00' + x.toString(16)).slice(-2))).join('');
  // }
  evaluate<T>(file: object, v: T | Array<T>): number | string | T | Array<T> | MappedReform<T, LookupPath> {
    if (Array.isArray(v)) {
      return this.handleArray(file, v)
    } else if (typeof v === 'string') {
      return v
    } else if (_.has(v, 'path')) {
      // Need to figure out how to pass argument into transformer function
      if (_.has(v, 'transformer')) {
        return (_.get(v, 'transformer'))(this.handlePath(file, _.get(v, 'path')))
      } else {
        return this.handlePath(file, _.get(v, 'path'))
      }
    } else {
      return this.convertInternal(file, v)
    }
  }
  handleArray<T>(file: object, v: Array<T & LookupPath>): Array<T> {
    if (v.length === 0) {
      return new Array<T>()
    }
    if (v[0].path === undefined) {
      return [this.evaluate(file, v[0]) as T]
    } else {
      let path = v[0].path
      let length = _.get(file, path).length
      v[0] = _.omit(v[0], ['path']) as T
      for (let i = 1; i < length; i++) {
        v.push({ ...v[0] })
      }
      var counter = 0
      _.get(file, path).forEach((element: object) => {
        v[counter] = this.convertInternal(element, v[counter]) as T
        counter++
      })
      return v
    }
  }
  handlePath(file: object, path: string | string[]): string | number {
    if (typeof path === 'string') {
      return _.get(file, path) || ''
    } else {
      var value: string = ''
      path.forEach(function (item) {
        if (typeof _.get(file, item) === undefined) {
          value += item + ' '
        } else {
          value += _.get(file, item) + ' '
        }
      })
      return value
    }
  }
}
