export interface IUpdateEvaluation {
  readonly filename: string | undefined;
  readonly groups: string[] | undefined;
  readonly data: Record<string, any> | undefined;
}
