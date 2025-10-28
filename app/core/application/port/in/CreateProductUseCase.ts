import { Product } from "@/app/core/domain/model/Product";

export interface CreateProductUseCase {
  createProduct(product: Product): Product;
}
