export interface IPasswordValidationResult {
  readonly errors: string[];
  isString: boolean;
  meetsCharRequirement: boolean;
  meetsClassRequirement: boolean;
  meetsNoRepeatsRequirement: boolean;
}
