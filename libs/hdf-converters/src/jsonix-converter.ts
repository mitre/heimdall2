import {Jsonix} from '@mitre/jsonix';

export abstract class JsonixConverter<T> {
  context: Jsonix.Context;

  constructor(mapping: Record<string, unknown>) {
    this.context = new Jsonix.Context([mapping]);
  }

  toJsonix(xmlString: string): T {
    const unmarshaller = this.context.createUnmarshaller();
    return unmarshaller.unmarshalString(xmlString) as T;
  }

  fromJsonix(object: T): string {
    const marshaller = this.context.createMarshaller();
    return marshaller.marshalString(object as Record<string, unknown>);
  }
}
