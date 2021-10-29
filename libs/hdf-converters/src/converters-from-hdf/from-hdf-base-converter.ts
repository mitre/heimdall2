import {MappedTransform, MappedReform, ObjectEntries} from '../base-converter';
import {ExecJSON} from 'inspecjs';
import { ExecJSONControl, ExecJSONProfile } from 'inspecjs/src/generated_parsers/v_1_0/exec-json';
import { StringLiteralLike } from 'typescript';
import _ from 'lodash';
import fs from 'fs';
import { createHash } from "crypto";



export interface ILookupPathFH {
  path?: string;
  transformer?: (value: unknown, newThis?: unknown) => unknown ;
  arrayTransformer?: (value: unknown[], file: unknown) => unknown[];
  key?: string;
}

//Base converter used to support conversions from HDF to Any Format
export class FromHdfBaseConverter {

    data: ExecJSON.Execution;
    mappings?: MappedTransform<any, (ILookupPathFH & {passParent?: boolean})>;
    collapseResults: boolean;
    
  
    constructor(data: ExecJSON.Execution, collapseResults = false) {
      this.data = data;
      this.collapseResults = collapseResults;
    }

    
  
    setMappings(
      mappings: MappedTransform<any, ILookupPathFH>
    ): void {
      this.mappings = mappings;
    }
  
    //Called over and over to iterate through objects assigned to keys too
  convertInternal<T>(
    file: object,
    fields: T
  ): MappedReform<T, ILookupPathFH> {
    const result = this.objectMap(fields, (v: ObjectEntries<T>) =>
      this.evaluate(file, v)
    );
    return result as MappedReform<T, ILookupPathFH>;
  }
  //Map is passed here to get looked through by each key pairs
  //Inner most to outward,
  //You take the key value pair in array form from each pair in the map, then  create an array of the key mapped to the result of value passed to evaluate
  // All the results should then be turned into one big object formed from the arrays of key value paids
  //file is the parsed data
  //fields is the mapping the data is being formed into    ;  objectMap updates all the fields in objectMap
  //iterates through the keys in field map, and based on matches in the lookup , assigns the data to the fields
  objectMap<T, V>(obj: T, fn: (v: ObjectEntries<T>) => V): {[K in keyof T]: V} {
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [k, fn(v)])
    ) as Record<keyof T, V>;
  }

    //Used to get the data located at the paths  
  // eslint-disable-next-line @typescript-eslint/ban-types
  evaluate<T extends object>(
    file: object,
    v: Array<T> | T
  ): T | Array<T> | MappedReform<T, ILookupPathFH> {
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
        let pathVal;
        if(_.get(v, 'path') as string == ""){
          pathVal = file;
        }else if(_.get(v, 'path') as string ==  "IgnoreMyArray"){
          return transformer(null,null);
        }else{

          pathVal = this.handlePath(file, _.get(v, 'path') as string);
        }
        
        if (_.has(v, 'passParent')) {
            return transformer( pathVal, this);
        }else{

            return transformer(pathVal);
        }


     
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
    file: object,
    v: Array<T & ILookupPathFH>
  ): Array<T> {//Looks throguh parsed data file using the mapping setup in V
    if (v.length === 0) {
      return [];
    }
    if (v[0].path === undefined) {
      const arrayTransformer = v[0].arrayTransformer;//does nothing since null
      v = v.map((element) => {
        return _.omit(element, ['arrayTransformer']) as T & ILookupPathFH;
      });//does nothing too
      let output: Array<T> = [];//Create empty array of generic to push evaluated values
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
        const pathVal = this.handlePath(file, path);//Any matches in the path even if more than one,  will grab an array of results, the issues
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
            v = this.collapseDuplicates(v, key, this.collapseResults);
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


 collapseDuplicates<T extends object>(
    array: Array<T>,
    key: string,
    collapseResults: boolean
  ): Array<T> {//Method is used to take the array of issues that will be formatted as controlls. Then group the duplicates into results for the correct control number
    const seen = new Map<string, number>();
    const newArray: T[] = [];
    let counter = 0;
    array.forEach((item: T) => {
      const propertyValue = _.get(item, key);
      if (typeof propertyValue === 'string') {
        const index = seen.get(propertyValue) || 0;
        if (!seen.has(propertyValue)) {//Sets the  control with first result
          newArray.push(item);
          seen.set(propertyValue, counter);
          counter++;
        } else {
          const oldResult = _.get(
            newArray[index],
            'results'
          ) as ExecJSON.ControlResult[];//Grab cureent list if results
          const descriptions = oldResult.map((element) =>
            _.get(element, 'code_desc')
          );//grab description
          if (collapseResults) {
            if (
              descriptions.indexOf(
                _.get(item, 'results[0].code_desc') as string
              ) === -1
            ) {//Handles appending the results to eachother if can't be found
              _.set(
                newArray[index],
                'results',
                oldResult.concat(
                  _.get(item, 'results') as ExecJSON.ControlResult[]
                )
              );
            }
          } else {//Handles appending the results to eachother inside a control
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
  }