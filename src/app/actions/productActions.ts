"use server";
import { Product } from "@/src/domain/entities/Product";
import { ProductImage } from "@/src/domain/entities/ProductImage";
import { AuthUseCase } from "@/src/domain/usecase/AuthUseCase";
import { ProductUseCase } from "@/src/domain/usecase/ProductUseCase";
import { createClient } from "@/src/infrastrucutre/supabse/client";
import { SupabaseAuthRepository } from "@/src/infrastrucutre/supabse/SupabaseAuthRepository";
import { SupabaseProductRepository } from "@/src/infrastrucutre/supabse/SupabaseProductRepositry";
import { SupabaseStorageRepository } from "@/src/infrastrucutre/supabse/SupabaseStorageRepository";
export async function createProductAction(
  productData: Product
): Promise<Product | null> {
  const client = await createClient();
  const authRepository = new SupabaseAuthRepository(client);
  const storageRepository = new SupabaseStorageRepository(client);
  const productRespository = new SupabaseProductRepository(
    client,
    storageRepository
  );
  const productUseCase = new ProductUseCase(productRespository);
  const authUseCase = new AuthUseCase(authRepository);
  const admin = await authUseCase.getCurrentUser();
  if (!admin) return null;

  const { product, ok } = await productUseCase.createProduct(
    productData,
    admin.id as string
  );
  if (!ok) return null;

  return product;
}

export async function addImageToProductAction(
  productId: string,
  imageFile: File
) {
  const client = await createClient();
  const authRepository = new SupabaseAuthRepository(client);
  const storageRepository = new SupabaseStorageRepository(client);
  const productRespository = new SupabaseProductRepository(
    client,
    storageRepository
  );
  const productUseCase = new ProductUseCase(productRespository);
  const authUseCase = new AuthUseCase(authRepository);
  const admin = await authUseCase.getCurrentUser();
  if (!admin) return null;

  console.log(productId, admin.id);

  return await productUseCase.addImageToProductAction(
    productId,
    admin.id as string,
    {
      file: imageFile,
      file_name: imageFile.name,
      size: imageFile.size,
    }
  );
}
