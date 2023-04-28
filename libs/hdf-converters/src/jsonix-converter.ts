import {Jsonix} from '@mitre/jsonix';

export abstract class JsonixConverter<T, V> {
  abstract toIntermediateObject(raw: T): V;

  toJsonix(xml: string, mapping: object): T {
    const context = new Jsonix.Context([mapping]);
    const unmarshaller = context.createUnmarshaller();
    return unmarshaller.unmarshalString(xml) as T;
  }
}
