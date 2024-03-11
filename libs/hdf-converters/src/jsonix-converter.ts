import {Jsonix} from '@mitre/jsonix';

export abstract class JsonixConverter<T> {
  xmlString: string;

  constructor(xmlString: string) {
    this.xmlString = xmlString;
  }

  toJsonix(mapping: Record<string, unknown>): T {
    const context = new Jsonix.Context([mapping]);
    const unmarshaller = context.createUnmarshaller();
    return unmarshaller.unmarshalString(this.xmlString) as T;
  }
}
