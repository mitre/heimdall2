import { ExecJSON } from 'inspecjs/dist/generated_parsers/v_1_0/exec-json'
import _ from 'lodash'
import { createHash } from 'crypto';

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
  transformer?: (((value: string) => string | number) | ((value: number) => string | number) | ((value: object) => string | number | object));
  key?: string;
}

// Hashing Function
export function generateHash(data: string, algorithm: string): string {
  var hash = createHash(algorithm)
  var output = hash.update(data).digest('hex')
  return output
}

function collapseDuplicates<T extends Object>(array: Array<T>, key: string): Array<T> {
  let seen = new Map<string, number>()
  let newArray = new Array<T>()
  let counter = 0
  array.forEach((item: T) => {
    var propertyValue = _.get(item, 'id')
    var index = seen.get(propertyValue) || 0
    var test = _.get(newArray[index], 'results[?(code_desc)]')
    if (!seen.has(propertyValue)) {
      newArray.push(item)
      seen.set(propertyValue, counter)
      counter++
    } else {
      let descriptions = new Array<string>()
      let length = _.get(newArray[index], 'results').length
      for (let i = 0; i < length; i++) {
        descriptions.push(_.get(newArray[index], `results[${i.toString()}].code_desc`))
      }
      if (descriptions.indexOf(_.get(item, 'results[0].code_desc')) === -1) {
        _.set(newArray[index], 'results', (_.get(newArray[index], 'results').concat(_.get(item, 'results'))))
      }
    }
  })
  return newArray
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
    v.profiles.forEach((element) => {
      element.sha256 = generateHash(_.omit(element, ['sha256']).toString(), 'sha256')
    })
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
  evaluate<T>(file: object, v: T | Array<T>): number | string | T | Array<T> | MappedReform<T, LookupPath> {
    if (Array.isArray(v)) {
      return this.handleArray(file, v)
    } else if ((typeof v === 'string') || (typeof v === 'number') || (v === null)) {
      return v
    } else if (_.has(v, 'path')) {
      if (_.has(v, 'transformer')) {
        return (_.get(v, 'transformer'))(this.handlePath(file, _.get(v, 'path')))
      } else {
        return this.handlePath(file, _.get(v, 'path'))
      }
    } if (_.has(v, 'transformer')) {
      return (_.get(v, 'transformer'))(file)
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
      let key = v[0].key
      if (_.has(file, path)) {
        let length = _.get(file, path).length
        v[0] = _.omit(v[0], ['path', 'key']) as T
        for (let i = 1; i < length; i++) {
          v.push({ ...v[0] })
        }
        var counter = 0
        _.get(file, path).forEach((element: object) => {
          v[counter] = this.convertInternal(element, v[counter]) as T
          counter++
        })
        if (key !== undefined) {
          return collapseDuplicates(v, key)
        } else {
          return v
        }
      } else {
        return []
      }
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
