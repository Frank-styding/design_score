import { Product } from "@/src/domain/entities/Product";
import { IProductRepository } from "@/src/domain/ports/IProductRepository";
import { IStorageRepository } from "@/src/domain/ports/IStorageReposity";
import { SupabaseClient } from "@supabase/supabase-js";

export class SupabaseProductRepository implements IProductRepository {
  constructor(
    private supabaseClient: SupabaseClient,
    private storageRepository: IStorageRepository
  ) {}

  async createProduct(
    product: Product,
    adminId: string
  ): Promise<{ product: Product | null; ok: boolean; error: string | null }> {
    const { data, error } = await this.supabaseClient
      .from("product")
      .insert({
        name: product.name,
        description: product.description,
        admin_id: adminId,
        constants: product.constants,
      })
      .select()
      .single();

    if (error) {
      return { product: null, ok: false, error: error.message };
    }
    //console.log(data);
    // Actualizamos el objeto producto con el ID real asignado
    return {
      product: { ...product, id: data.product_id },
      ok: true,
      error: null,
    };
  }

  async addImageToProduct(
    productId: string,
    adminId: string,
    image: File,
    isFirstImage: boolean = false
  ): Promise<{
    ok: boolean;
    error: string | null;
  }> {
    try {
      // --- Subir archivo a Storage ---
      const path = `${adminId}/${productId}/${image.name}`;
      const { data: uploadData, error: uploadError } =
        await this.storageRepository.uploadFile(path, image);

      if (uploadError || !uploadData) {
        throw new Error(uploadError || "Error al subir imagen al Storage");
      }

      const { url } = await this.storageRepository.getFileUrl(path);

      // --- Usar función RPC para incremento atómico ---
      // Esto evita race conditions en batch paralelo
      const { error: rpcError } = await this.supabaseClient.rpc(
        "increment_product_counters",
        {
          p_product_id: productId,
          p_admin_id: adminId,
          p_size_increment: image.size,
          p_cover_image_url: isFirstImage ? url : null,
        }
      );

      if (rpcError) {
        throw new Error(`Error actualizando contadores: ${rpcError.message}`);
      }

      return {
        ok: true,
        error: null,
      };
    } catch (err: any) {
      console.error("Error agregando imagen:", err.message);
      return { ok: false, error: err.message };
    }
  }

  async findById(productId: string, adminId: string): Promise<Product | null> {
    const { data, error } = await this.supabaseClient
      .from("product")
      .select("*")
      .eq("product_id", productId)
      .eq("admin_id", adminId)
      .single();

    if (error || !data) return null;

    return {
      id: data.product_id,
      name: data.name,
      description: data.description,
      size: data.size,
      num_images: data.num_images,
      constants: data.constants,
      coverImageId: data.cover_image_id,
    };
  }

  async findAll(adminId: string): Promise<Product[]> {
    const { data, error } = await this.supabaseClient
      .from("product")
      .select("*")
      .eq("admin_id", adminId);

    if (error || !data) return [];

    return data.map((row: any) => ({
      id: row.product_id,
      name: row.name,
      description: row.description,
      size: row.size,
      num_images: row.num_images,
      constants: row.constants,
      coverImageId: row.cover_image_id,
    }));
  }

  async updateProduct(
    productId: string,
    adminId: string,
    updates: Partial<Product>
  ): Promise<{ product: Product | null; ok: boolean; error: string | null }> {
    // Construir objeto de actualización solo con campos permitidos
    const updateData: any = {};
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.description !== undefined)
      updateData.description = updates.description;
    if (updates.constants !== undefined)
      updateData.constants = updates.constants;
    if (updates.coverImageId !== undefined)
      updateData.cover_image_id = updates.coverImageId;

    const { data, error } = await this.supabaseClient
      .from("product")
      .update(updateData)
      .eq("product_id", productId)
      .eq("admin_id", adminId)
      .select()
      .single();

    if (error) {
      return { product: null, ok: false, error: error.message };
    }

    // Mapear producto actualizado
    const updatedProduct: Product = {
      id: data.product_id,
      name: data.name,
      description: data.description,
      size: data.size,
      num_images: data.num_images,
      constants: data.constants,
      coverImageId: data.cover_image_id,
    };

    return { product: updatedProduct, ok: true, error: null };
  }

  async deleteProduct(
    productId: string,
    adminId: string
  ): Promise<{ ok: boolean; error: string | null }> {
    try {
      // 1. Verificar que el producto existe y pertenece al admin
      const product = await this.findById(productId, adminId);
      if (!product) {
        return { ok: false, error: "Producto no encontrado" };
      }

      // 2. Eliminar carpeta completa del Storage (más eficiente)
      const folderPath = `${adminId}/${productId}`;

      // Listar todos los archivos para obtener sus paths completos
      const { data: files, error: listError } =
        await this.supabaseClient.storage.from("files").list(folderPath);

      if (listError) {
        console.warn("Error listando archivos:", listError.message);
      }

      // Eliminar todos los archivos de la carpeta en batch
      if (files && files.length > 0) {
        const filePaths = files.map((file) => `${folderPath}/${file.name}`);
        const { error: deleteError } = await this.supabaseClient.storage
          .from("files")
          .remove(filePaths);

        if (deleteError) {
          console.warn("Error eliminando archivos:", deleteError.message);
        }
      }

      // 3. Eliminar el producto de la base de datos
      const { error: deleteError } = await this.supabaseClient
        .from("product")
        .delete()
        .eq("product_id", productId)
        .eq("admin_id", adminId);

      if (deleteError) {
        throw new Error(deleteError.message);
      }

      return { ok: true, error: null };
    } catch (err: any) {
      console.error("Error eliminando producto:", err.message);
      return { ok: false, error: err.message };
    }
  }

  async searchProducts(
    adminId: string,
    searchTerm: string
  ): Promise<Product[]> {
    const { data, error } = await this.supabaseClient
      .from("product")
      .select("*")
      .eq("admin_id", adminId)
      .or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);

    if (error || !data) return [];

    return data.map((row: any) => ({
      id: row.product_id,
      name: row.name,
      description: row.description,
      size: row.size,
      num_images: row.num_images,
      constants: row.constants,
      coverImageId: row.cover_image_id,
    }));
  }
}
