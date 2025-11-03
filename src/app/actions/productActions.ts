"use server";
import { Product } from "@/src/domain/entities/Product";
import { AuthUseCase } from "@/src/domain/usecase/AuthUseCase";
import { ProductUseCase } from "@/src/domain/usecase/ProductUseCase";
import { createClient } from "@/src/infrastrucutre/supabse/client";
import { SupabaseAuthRepository } from "@/src/infrastrucutre/supabse/SupabaseAuthRepository";
import { SupabaseProductRepository } from "@/src/infrastrucutre/supabse/SupabaseProductRepositry";
import { SupabaseStorageRepository } from "@/src/infrastrucutre/supabse/SupabaseStorageRepository";
import { SupabaseClient } from "@supabase/supabase-js";

export async function createProductAction(
  productData: Product
): Promise<Product | null> {
  try {
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
  } catch (error) {
    console.error("Error creating product:", error);
    return null;
  }
}

export async function addImageToProductAction(
  productId: string,
  imageFiles: File | File[],
  isFirst: boolean
) {
  try {
    const client = await createClient();
    const authRepository = new SupabaseAuthRepository(client);
    const storageRepository = new SupabaseStorageRepository(client);
    const productRepository = new SupabaseProductRepository(
      client,
      storageRepository
    );
    const productUseCase = new ProductUseCase(productRepository);
    const authUseCase = new AuthUseCase(authRepository);

    const admin = await authUseCase.getCurrentUser();
    if (!admin) return { ok: false, error: "No authenticated user" };

    const files = Array.isArray(imageFiles) ? imageFiles : [imageFiles];

    const uploadResults = await Promise.all(
      files.map((imageFile, i) =>
        productUseCase.addImageToProductAction(
          productId,
          admin.id as string,
          imageFile,
          i == 0 && isFirst
        )
      )
    );

    const hasErrors = uploadResults.some((item) => !item.ok);

    if (hasErrors) {
      return { ok: false, error: "Some images failed to upload" };
    }

    return { ok: true };
  } catch (error) {
    console.error("Error adding images to product:", error);
    return { ok: false, error: String(error) };
  }
}

/**
 * Subida optimizada de múltiples imágenes en batch
 * Reutiliza la autenticación y conexión para todas las imágenes
 */
export async function addImagesBatchAction(
  productId: string,
  imageFiles: File[],
  isFirstBatch: boolean
): Promise<{ ok: boolean; error: string | null; uploaded: number }> {
  try {
    const client = await createClient();
    const authRepository = new SupabaseAuthRepository(client);
    const storageRepository = new SupabaseStorageRepository(client);
    const productRepository = new SupabaseProductRepository(
      client,
      storageRepository
    );
    const productUseCase = new ProductUseCase(productRepository);
    const authUseCase = new AuthUseCase(authRepository);

    // Una sola verificación de autenticación
    const admin = await authUseCase.getCurrentUser();

    // 🔍 DEBUG: Información del usuario
    /*    console.log("🔍 DEBUG - Usuario autenticado:", {
      id: admin?.id,
      email: admin?.email,
      hasUser: !!admin,
    }); */

    if (!admin) {
      console.error("❌ No hay usuario autenticado");
      return { ok: false, error: "No authenticated user", uploaded: 0 };
    }

    // 🔍 DEBUG: Verificar producto y su admin_id
    const { data: productData, error: productError } = await client
      .from("product")
      .select("product_id, name, admin_id")
      .eq("product_id", productId)
      .single();

    /* console.log("🔍 DEBUG - Producto:", {
      product_id: productData?.product_id,
      name: productData?.name,
      admin_id: productData?.admin_id,
      current_user_id: admin.id,
      admin_id_match: productData?.admin_id === admin.id,
      error: productError?.message,
    }); */

    if (!productData) {
      console.error("❌ Producto no encontrado:", productId);
      return { ok: false, error: "Producto no encontrado", uploaded: 0 };
    }

    if (productData.admin_id !== admin.id) {
      console.error("❌ admin_id no coincide:", {
        product_admin_id: productData.admin_id,
        user_id: admin.id,
      });
      return {
        ok: false,
        error: "No tienes permiso para modificar este producto",
        uploaded: 0,
      };
    }

    let uploadedCount = 0;

    // Subir todas las imágenes en paralelo
    const uploadPromises = imageFiles.map((imageFile, index) =>
      productUseCase
        .addImageToProductAction(
          productId,
          admin.id as string,
          imageFile,
          index === 0 && isFirstBatch
        )
        .then((result) => {
          if (result.ok) uploadedCount++;
          return result;
        })
        .catch((error) => ({
          ok: false,
          error: error.message,
          image: null,
        }))
    );

    const results = await Promise.all(uploadPromises);
    const hasErrors = results.some((result) => !result.ok);

    if (hasErrors) {
      const errors = results.filter((r) => !r.ok).map((r) => r.error);
      return {
        ok: false,
        error: `${errors.length} imágenes fallaron: ${errors[0]}`,
        uploaded: uploadedCount,
      };
    }

    return { ok: true, error: null, uploaded: uploadedCount };
  } catch (error) {
    console.error("Error in batch upload:", error);
    return { ok: false, error: String(error), uploaded: 0 };
  }
}

/**
 * Obtiene un producto por su ID
 */
export async function getProductByIdAction(
  productId: string
): Promise<Product | null> {
  try {
    const client = await createClient();
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

    return await productUseCase.getProductById(productId, admin.id as string);
  } catch (error) {
    console.error("Error getting product:", error);
    return null;
  }
}

/**
 * Obtiene todos los productos del admin autenticado
 */
export async function getAllProductsAction(): Promise<Product[]> {
  try {
    const client = await createClient();
    const authRepository = new SupabaseAuthRepository(client);
    const storageRepository = new SupabaseStorageRepository(client);
    const productRepository = new SupabaseProductRepository(
      client,
      storageRepository
    );
    const productUseCase = new ProductUseCase(productRepository);
    const authUseCase = new AuthUseCase(authRepository);

    const admin = await authUseCase.getCurrentUser();
    if (!admin) return [];

    return await productUseCase.getAllProducts(admin.id as string);
  } catch (error) {
    console.error("Error getting products:", error);
    return [];
  }
}

/**
 * Obtiene todos los productos públicos (sin autenticación requerida)
 * Útil para encuestas públicas donde los participantes no están autenticados
 */
export async function getAllPublicProductsAction(): Promise<Product[]> {
  try {
    const client = await createClient();
    const storageRepository = new SupabaseStorageRepository(client);
    const productRepository = new SupabaseProductRepository(
      client,
      storageRepository
    );
    const productUseCase = new ProductUseCase(productRepository);

    // Obtener todos los productos sin filtrar por admin_id
    return await productUseCase.getAllPublicProducts();
  } catch (error) {
    console.error("Error getting public products:", error);
    return [];
  }
}

/**
 * Actualiza un producto
 */
export async function updateProductAction(
  productId: string,
  updates: Partial<Product>
): Promise<{ ok: boolean; product: Product | null; error: string | null }> {
  try {
    const client = await createClient();
    const authRepository = new SupabaseAuthRepository(client);
    const storageRepository = new SupabaseStorageRepository(client);
    const productRepository = new SupabaseProductRepository(
      client,
      storageRepository
    );
    const productUseCase = new ProductUseCase(productRepository);
    const authUseCase = new AuthUseCase(authRepository);

    const admin = await authUseCase.getCurrentUser();
    if (!admin)
      return { ok: false, product: null, error: "No authenticated user" };

    return await productUseCase.updateProduct(
      productId,
      admin.id as string,
      updates
    );
  } catch (error) {
    console.error("Error updating product:", error);
    return { ok: false, product: null, error: String(error) };
  }
}

/**
 * Elimina un producto y todas sus imágenes asociadas
 */
export async function deleteProductAction(
  productId: string
): Promise<{ ok: boolean; error: string | null }> {
  try {
    const client = await createClient();
    const authRepository = new SupabaseAuthRepository(client);
    const storageRepository = new SupabaseStorageRepository(client);
    const productRepository = new SupabaseProductRepository(
      client,
      storageRepository
    );
    const productUseCase = new ProductUseCase(productRepository);
    const authUseCase = new AuthUseCase(authRepository);

    const admin = await authUseCase.getCurrentUser();
    if (!admin) return { ok: false, error: "No authenticated user" };

    return await productUseCase.deleteProduct(productId, admin.id as string);
  } catch (error) {
    console.error("Error deleting product:", error);
    return { ok: false, error: String(error) };
  }
}

/**
 * Busca productos por término de búsqueda
 */
export async function searchProductsAction(
  searchTerm: string
): Promise<Product[]> {
  try {
    const client = await createClient();
    const authRepository = new SupabaseAuthRepository(client);
    const storageRepository = new SupabaseStorageRepository(client);
    const productRepository = new SupabaseProductRepository(
      client,
      storageRepository
    );
    const productUseCase = new ProductUseCase(productRepository);
    const authUseCase = new AuthUseCase(authRepository);

    const admin = await authUseCase.getCurrentUser();
    if (!admin) return [];

    return await productUseCase.searchProducts(admin.id as string, searchTerm);
  } catch (error) {
    console.error("Error searching products:", error);
    return [];
  }
}

/**
 * Obtiene el conteo de productos del usuario actual
 */
export async function getProductsCountAction(): Promise<number> {
  try {
    const client = await createClient();
    const authRepository = new SupabaseAuthRepository(client);
    const authUseCase = new AuthUseCase(authRepository);

    const admin = await authUseCase.getCurrentUser();
    if (!admin) return 0;

    const { count, error } = await client
      .from("product")
      .select("*", { count: "exact", head: true })
      .eq("admin_id", admin.id);

    if (error) {
      console.error("Error counting products:", error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error("Error counting products:", error);
    return 0;
  }
}
