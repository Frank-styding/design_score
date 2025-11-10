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
    product: Product
  ): Promise<{ product: Product | null; ok: boolean; error: string | null }> {
    const { data, error } = await this.supabaseClient
      .from("products")
      .insert({
        admin_id: product.admin_id,
        project_id: product.project_id,
        name: product.name,
        description: product.description,
        cover_image: product.cover_image,
        constants: product.constants,
        path: product.path,
        weight: product.weight || 0,
      })
      .select()
      .single();

    if (error) {
      return { product: null, ok: false, error: error.message };
    }

    return {
      product: this.mapToProduct(data),
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
      // --- Subir archivo a Storage usando admin_id y product_id ---
      const path = `${adminId}/${productId}/${image.name}`;
      const { data: uploadData, error: uploadError } =
        await this.storageRepository.uploadFile(path, image);

      if (uploadError || !uploadData) {
        throw new Error(uploadError || "Error al subir imagen al Storage");
      }

      const { url } = await this.storageRepository.getFileUrl(path);

      // --- Si es la primera imagen, actualizar cover_image ---
      if (isFirstImage) {
        const { error: updateError } = await this.supabaseClient
          .from("products")
          .update({ cover_image: url })
          .eq("product_id", productId);

        if (updateError) {
          throw new Error(
            `Error actualizando cover_image: ${updateError.message}`
          );
        }
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

  async findById(productId: string): Promise<Product | null> {
    const { data, error } = await this.supabaseClient
      .from("products")
      .select("*")
      .eq("product_id", productId)
      .single();

    if (error || !data) return null;

    return this.mapToProduct(data);
  }

  async findByProjectId(projectId: string): Promise<Product[]> {
    const { data, error } = await this.supabaseClient
      .from("products")
      .select("*")
      .eq("project_id", projectId)
      .order("weight", { ascending: true });

    if (error || !data) return [];

    return data.map((row: any) => this.mapToProduct(row));
  }

  async findByAdminId(adminId: string): Promise<Product[]> {
    const { data, error } = await this.supabaseClient
      .from("products")
      .select("*")
      .eq("admin_id", adminId)
      .order("created_at", { ascending: false });

    if (error || !data) return [];

    return data.map((row: any) => this.mapToProduct(row));
  }

  async updateProduct(
    productId: string,
    updates: Partial<Product>
  ): Promise<{ product: Product | null; ok: boolean; error: string | null }> {
    // Construir objeto de actualización solo con campos permitidos
    const updateData: any = {};
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.description !== undefined)
      updateData.description = updates.description;
    if (updates.cover_image !== undefined)
      updateData.cover_image = updates.cover_image;
    if (updates.constants !== undefined)
      updateData.constants = updates.constants;
    if (updates.path !== undefined) updateData.path = updates.path;
    if (updates.weight !== undefined) updateData.weight = updates.weight;

    const { data, error } = await this.supabaseClient
      .from("products")
      .update(updateData)
      .eq("product_id", productId)
      .select()
      .single();

    if (error) {
      return { product: null, ok: false, error: error.message };
    }

    return { product: this.mapToProduct(data), ok: true, error: null };
  }

  async deleteProduct(
    productId: string
  ): Promise<{ ok: boolean; error: string | null }> {
    try {
      // 1. Verificar que el producto existe
      const product = await this.findById(productId);
      if (!product) {
        return { ok: false, error: "Producto no encontrado" };
      }

      // 2. Eliminar carpeta completa del Storage usando StorageRepository
      const folderPath = `${product.admin_id}/${productId}`;
      const { ok: deleteFolderOk, error: deleteFolderError } =
        await this.storageRepository.deleteFolder(folderPath);

      if (!deleteFolderOk && deleteFolderError) {
        console.warn(
          "Error eliminando carpeta del Storage:",
          deleteFolderError
        );
      }

      // 3. Eliminar el producto de la base de datos
      // El trigger automáticamente actualizará num_products en projects
      // CASCADE eliminará registros relacionados en view_products
      const { error: deleteError } = await this.supabaseClient
        .from("products")
        .delete()
        .eq("product_id", productId);

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
    projectId: string,
    searchTerm: string
  ): Promise<Product[]> {
    const { data, error } = await this.supabaseClient
      .from("products")
      .select("*")
      .eq("project_id", projectId)
      .or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
      .order("weight", { ascending: true });

    if (error || !data) return [];

    return data.map((row: any) => this.mapToProduct(row));
  }

  // Método helper para mapear datos de DB a la entidad Product
  private mapToProduct(data: any): Product {
    return {
      product_id: data.product_id,
      admin_id: data.admin_id,
      project_id: data.project_id,
      name: data.name,
      description: data.description,
      cover_image: data.cover_image,
      constants: data.constants,
      path: data.path,
      weight: parseFloat(data.weight),
      created_at: data.created_at,
      updated_at: data.updated_at,
    };
  }
}
