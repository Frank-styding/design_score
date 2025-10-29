"use server";
import { Product } from "@/src/domain/entities/Product";
import { AuthUseCase } from "@/src/domain/usecase/AuthUseCase";
import { ProductUseCase } from "@/src/domain/usecase/ProductUseCase";
import { createClient } from "@/src/infrastrucutre/supabse/client";
import { SupabaseAuthRepository } from "@/src/infrastrucutre/supabse/SupabaseAuthRepository";
import { SupabaseProductRepository } from "@/src/infrastrucutre/supabse/SupabaseProductRepositry";
import { SupabaseStorageRepository } from "@/src/infrastrucutre/supabse/SupabaseStorageRepository";
import { SupabaseClient } from "@supabase/supabase-js";
let cachedClient: SupabaseClient<any, "public", "public"> | null = null;

export async function createProductAction(
  productData: Product
): Promise<Product | null> {
  const client = cachedClient ?? (cachedClient = await createClient());
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
  imageFiles: File | File[],
  isFirst: boolean
) {
  const client = cachedClient ?? (cachedClient = await createClient());
  //const client = await createClient();
  const authRepository = new SupabaseAuthRepository(client);
  const storageRepository = new SupabaseStorageRepository(client);
  const productRepository = new SupabaseProductRepository(
    client,
    storageRepository
  );
  const productUseCase = new ProductUseCase(productRepository);
  const authUseCase = new AuthUseCase(authRepository);

  const admin = await authUseCase.getCurrentUser();
  if (!admin) return null;

  const files = Array.isArray(imageFiles) ? imageFiles : [imageFiles];

  const uploadResults = await Promise.all(
    files.map((imageFile, i) =>
      productUseCase.addImageToProductAction(
        productId,
        admin.id as string,
        {
          file: imageFile,
          file_name: imageFile.name,
          size: imageFile.size,
        },
        i == 0 && isFirst
      )
    )
  );
  /* 
  if (!Array.isArray(imageFiles) && uploadResults[0].ok) {
    return { ok: true };
  }

  if (Array.isArray(imageFiles) && up) {
    return { ok: true };
  } */

  if (uploadResults.filter((item) => !item.ok).length > 0) {
    return { ok: false };
  }
  return { ok: true };
}
