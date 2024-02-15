export interface ICreateBuild {
  readonly buildId: string;
  readonly buildType: number;
  readonly branchName: string;
  readonly groups: string[] | undefined;
}