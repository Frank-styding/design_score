export interface ProductImage {
  id: string;
  url: string;
  path: string;
  productId: string;
  file_name: string;
  size: number;
  file?: File;
}
