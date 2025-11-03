import { Product } from "../entities/Product";

export interface IProductRepository {
  createProduct(
    product: Product,
    adminId: string
  ): Promise<{ product: Product | null; ok: boolean; error: string | null }>;

  addImageToProduct(
    productId: string,
    adminId: string,
    image: File,
    isFirstImage?: boolean
  ): Promise<{
    ok: boolean;
    error: string | null;
  }>;

  findById(productId: string, adminId: string): Promise<Product | null>;

  findAll(adminId: string): Promise<Product[]>;

  findAllPublic(): Promise<Product[]>;

  updateProduct(
    productId: string,
    adminId: string,
    updates: Partial<Product>
  ): Promise<{ product: Product | null; ok: boolean; error: string | null }>;

  deleteProduct(
    productId: string,
    adminId: string
  ): Promise<{ ok: boolean; error: string | null }>;

  searchProducts(adminId: string, searchTerm: string): Promise<Product[]>;
}
