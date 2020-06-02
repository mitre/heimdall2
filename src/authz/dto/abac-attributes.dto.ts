export class AbacAttributes {
  readonly mode: 'all' | 'nothing';
  readonly except?: string[];

  constructor(attributes: any) {
    this.mode = attributes.mode;
    this.except = attributes.except;
  }
}
