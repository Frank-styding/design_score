import { Product } from "../entities/Product";
import { IProductRepository } from "../ports/IProductRepository";

export class ProductUseCase {
  constructor(private readonly productRepository: IProductRepository) {}

  /**
   * Crea un nuevo producto
   */
  async createProduct(product: Product, adminId: string) {
    if (!product.name || product.name.trim().length === 0) {
      throw new Error("El nombre del producto es requerido");
    }
    if (!product.constants || product.constants.trim().length === 0) {
      throw new Error("Las constantes del producto son requeridas");
    }
    return await this.productRepository.createProduct(product, adminId);
  }

  /**
   * Agrega una imagen a un producto existente
   */
  async addImageToProductAction(
    productId: string,
    adminId: string,
    image: File,
    isFirstImage: boolean
  ) {
    if (!productId) {
      throw new Error("El ID del producto es requerido");
    }
    /*    if (!image.url) {
      throw new Error("La URL de la imagen es requerida");
    } */
    return await this.productRepository.addImageToProduct(
      productId,
      adminId,
      image,
      isFirstImage
    );
  }

  /**
   * Obtiene un producto por su ID
   */
  async getProductById(productId: string, adminId: string) {
    if (!productId) {
      throw new Error("El ID del producto es requerido");
    }
    return await this.productRepository.findById(productId, adminId);
  }

  /**
   * Obtiene todos los productos de un admin
   */
  async getAllProducts(adminId: string) {
    if (!adminId) {
      throw new Error("El ID del admin es requerido");
    }
    return await this.productRepository.findAll(adminId);
  }

  /**
   * Obtiene todos los productos públicos (sin filtro de admin)
   * Útil para encuestas públicas
   */
  async getAllPublicProducts() {
    return await this.productRepository.findAllPublic();
  }

  /**
   * Actualiza la información de un producto
   */
  async updateProduct(
    productId: string,
    adminId: string,
    updates: Partial<Product>
  ) {
    if (!productId) {
      throw new Error("El ID del producto es requerido");
    }
    if (updates.name !== undefined && updates.name.trim().length === 0) {
      throw new Error("El nombre del producto no puede estar vacío");
    }
    if (
      updates.constants !== undefined &&
      updates.constants.trim().length === 0
    ) {
      throw new Error("Las constantes del producto no pueden estar vacías");
    }
    return await this.productRepository.updateProduct(
      productId,
      adminId,
      updates
    );
  }

  /**
   * Elimina un producto y todas sus imágenes asociadas
   */
  async deleteProduct(productId: string, adminId: string) {
    if (!productId) {
      throw new Error("El ID del producto es requerido");
    }
    return await this.productRepository.deleteProduct(productId, adminId);
  }

  /**
   * Busca productos por término de búsqueda
   */
  async searchProducts(adminId: string, searchTerm: string) {
    if (!adminId) {
      throw new Error("El ID del admin es requerido");
    }
    if (!searchTerm || searchTerm.trim().length === 0) {
      return await this.getAllProducts(adminId);
    }
    return await this.productRepository.searchProducts(adminId, searchTerm);
  }
}
