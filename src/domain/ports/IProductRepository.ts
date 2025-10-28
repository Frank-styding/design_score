import { Product } from "../entities/Product";

export interface IProductRepository {
  findById(productId: string, adminId: string): Promise<Product | null>;
  save(
    product: Product,
    adminId: string
  ): Promise<{ product: Product | null; ok: boolean; error: string | null }>;
  delete(
    productId: string,
    adminId: string
  ): Promise<{ ok: boolean; error: string | null }>;
  findAll(adminId: string): Promise<Product[]>;
}
