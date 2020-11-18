export class AbacAttributes {
  readonly mode: 'all' | 'nothing';
  readonly except?: string[];

  constructor(attributes: {mode: 'all' | 'nothing'; except: string[]}) {
    this.mode = attributes.mode;
    this.except = attributes.except;
  }
}
