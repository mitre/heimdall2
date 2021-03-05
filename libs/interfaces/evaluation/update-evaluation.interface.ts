export interface IUpdateEvaluation {
  readonly filename: string | undefined;
  readonly data: Record<string, any> | undefined;
  readonly public: boolean | undefined;
}
