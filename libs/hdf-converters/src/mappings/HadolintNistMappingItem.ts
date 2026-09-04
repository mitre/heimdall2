export class HadolintNistMappingItem {
  rule: string;
  control: string;

  constructor(rule: string, control: string) {
    this.rule = rule;
    this.control = control;
  }
}
