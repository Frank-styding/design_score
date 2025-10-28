import { Product } from "@/app/core/domain/model/Product";

export interface ProductRepositoryPort {
  save(product: Product): Product;
}
