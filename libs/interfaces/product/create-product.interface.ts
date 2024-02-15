export interface ICreateProduct {
  readonly productName: string;
  readonly productId: string;
  readonly productURL: string;
  readonly objectStoreKey: string;
  readonly groups: string[] | undefined;
}