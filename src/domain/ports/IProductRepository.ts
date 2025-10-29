import { Product } from "../entities/Product";
import { ProductImage } from "../entities/ProductImage";

export interface IProductRepository {
  createProduct(
    product: Product,
    adminId: string
  ): Promise<{ product: Product | null; ok: boolean; error: string | null }>;
  addImageToProduct(
    productId: string,
    adminId: string,
    image: ProductImage,
    isFirstImage?: boolean
  ): Promise<{
    image: ProductImage | null;
    ok: boolean;
    error: string | null;
  }>;
  findById(productId: string, adminId: string): Promise<Product | null>;
  findAll(adminId: string): Promise<Product[]>;
}
