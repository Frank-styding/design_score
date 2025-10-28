import { Product } from "../../domain/model/Product";
import { CreateProductUseCase } from "../port/in/CreateProductUseCase";

export class ProductService implements CreateProductUseCase {
  createProduct(product: Product): Product {
    throw new Error("Method not implemented.");
  }
}
