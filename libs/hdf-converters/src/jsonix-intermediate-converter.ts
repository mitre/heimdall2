import {JsonixConverter} from './jsonix-converter';

export abstract class JsonixIntermediateConverter<
  T,
  V
> extends JsonixConverter<T> {
  abstract toIntermediateObject(jsonixObj: T): V;
  abstract fromIntermediateObject(intermediateObj: V): T;
}
