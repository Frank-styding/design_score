import { Product } from "../entities/Product";
import { ProductImage } from "../entities/ProductImage";
import { IProductRepository } from "../ports/IProductRepository";

export class ProductUseCase {
  constructor(private readonly productRepository: IProductRepository) {}
  async createProduct(product: Product, adminId: string) {
    return await this.productRepository.createProduct(product, adminId);
  }

  async addImageToProductAction(
    productId: string,
    adminId: string,
    image: ProductImage
  ) {
    return await this.productRepository.addImageToProduct(
      productId,
      adminId,
      image
    );
  }
}
