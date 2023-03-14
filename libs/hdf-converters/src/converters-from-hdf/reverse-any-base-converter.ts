import {MappedReform, ObjectEntryValue} from '../base-converter';
import {FromHdfBaseConverter, ILookupPathFH} from './reverse-base-converter';

// Base converter used to support conversions from HDF to Any Format
export class FromAnyBaseConverter extends FromHdfBaseConverter {
  data: any;

  constructor(data: any, collapseResults = false) {
    super(data, collapseResults);
  }

  // Called over and over to iterate through objects assigned to keys too
  convertInternal(file: object, fields: any): MappedReform<any, ILookupPathFH> {
    return this.objectMap(fields, (v: ObjectEntryValue<any>) =>
      this.evaluate(file, v)
    );
  }

  // Preforms fn() on all entries inside the passed obj
  objectMap<T extends Array<unknown>, V>(
    obj: T,
    fn: (v: ObjectEntryValue<T>) => V
  ): {[K in keyof T]: V} {
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [k, fn(v as ObjectEntryValue<T>)])
    ) as Record<keyof T, V>;
  }
}
