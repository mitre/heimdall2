import { JsonixConverter } from './jsonix-converter';

export abstract class JsonixIntermediateConverter<
  T,
  V,
> extends JsonixConverter<T> {
  abstract fromIntermediateObject(intermediateObj: V): T;
  abstract toIntermediateObject(jsonixObj: T): V;
}
