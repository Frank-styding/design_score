import { SupabaseClient } from "@supabase/supabase-js";
import { Project } from "@/src/domain/entities/Project";
import { Product } from "@/src/domain/entities/Product";
import { IProjectRepository } from "@/src/domain/ports/IProjectRepository";
import { IStorageRepository } from "@/src/domain/ports/IStorageReposity";
import { IProductRepository } from "@/src/domain/ports/IProductRepository";

export class SupabaseProjectRepository implements IProjectRepository {
  constructor(
    private supabaseClient: SupabaseClient,
    private storageRepository?: IStorageRepository,
    private productRepository?: IProductRepository
  ) {}

  async createProject(project: Project): Promise<{
    project: Project | null;
    ok: boolean;
    error: string | null;
  }> {
    const { data, error } = await this.supabaseClient
      .from("projects")
      .insert({
        admin_id: project.admin_id,
        name: project.name,
        final_message: project.final_message,
      })
      .select()
      .single();

    if (error) {
      return { project: null, ok: false, error: error.message };
    }

    return {
      project: this.mapToProject(data),
      ok: true,
      error: null,
    };
  }

  async findById(projectId: string): Promise<Project | null> {
    const { data, error } = await this.supabaseClient
      .from("projects")
      .select("*")
      .eq("project_id", projectId)
      .single();

    if (error || !data) return null;

    return this.mapToProject(data);
  }

  async findByIdWithProducts(projectId: string): Promise<Project | null> {
    const { data, error } = await this.supabaseClient
      .from("projects")
      .select(
        `
        *,
        products (*)
      `
      )
      .eq("project_id", projectId)
      .single();

    if (error || !data) return null;

    const project = this.mapToProject(data);

    // Mapear productos si existen
    if (data.products && Array.isArray(data.products)) {
      project.products = data.products.map((p: any) => this.mapToProduct(p));
    }

    return project;
  }

  async findByAdminId(adminId: string): Promise<Project[]> {
    const { data, error } = await this.supabaseClient
      .from("projects")
      .select("*")
      .eq("admin_id", adminId)
      .order("created_at", { ascending: false });

    if (error || !data) return [];

    return data.map((row: any) => this.mapToProject(row));
  }

  async updateProject(
    projectId: string,
    updates: Partial<Project>
  ): Promise<{
    project: Project | null;
    ok: boolean;
    error: string | null;
  }> {
    const updateData: any = {};

    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.final_message !== undefined)
      updateData.final_message = updates.final_message;

    const { data, error } = await this.supabaseClient
      .from("projects")
      .update(updateData)
      .eq("project_id", projectId)
      .select()
      .single();

    if (error) {
      return { project: null, ok: false, error: error.message };
    }

    return {
      project: this.mapToProject(data),
      ok: true,
      error: null,
    };
  }

  async deleteProject(projectId: string): Promise<{
    ok: boolean;
    error: string | null;
  }> {
    try {
      // 1. Obtener todos los productos del proyecto para eliminar sus imágenes
      if (this.productRepository && this.storageRepository) {
        const { data: productsData, error: productsError } =
          await this.supabaseClient
            .from("products")
            .select("product_id, admin_id, path")
            .eq("project_id", projectId);

        if (productsError) {
          console.error(
            "❌ Error al obtener productos:",
            productsError.message
          );
        }

        // 2. Eliminar las carpetas de imágenes de cada producto
        if (productsData && productsData.length > 0) {
          for (const product of productsData) {
            if (product.path) {
              // Eliminar la carpeta completa del producto
              const { ok, error } = await this.storageRepository.deleteFolder(
                product.path
              );

              if (!ok) {
                console.error(
                  `❌ Error eliminando carpeta ${product.path}:`,
                  error
                );
              }
            }

            // También intentar eliminar carpeta por admin_id/product_id si existe
            const fallbackPath = `${product.admin_id}/${product.product_id}`;
            const { ok: fallbackOk, error: fallbackError } =
              await this.storageRepository.deleteFolder(fallbackPath);

            if (!fallbackOk && fallbackError) {
              console.error(
                `❌ Error eliminando carpeta fallback ${fallbackPath}:`,
                fallbackError
              );
            }
          }
        }
      }

      // 3. Eliminar el proyecto (CASCADE eliminará automáticamente productos, views, view_products)
      const { error: deleteError } = await this.supabaseClient
        .from("projects")
        .delete()
        .eq("project_id", projectId);

      if (deleteError) {
        throw new Error(deleteError.message);
      }

      return { ok: true, error: null };
    } catch (err: any) {
      console.error("❌ Error eliminando proyecto:", err.message);
      return { ok: false, error: err.message };
    }
  }

  // Método helper para mapear datos de DB a la entidad Project
  private mapToProject(data: any): Project {
    return {
      project_id: data.project_id,
      admin_id: data.admin_id,
      name: data.name,
      num_products: data.num_products || 0,
      final_message: data.final_message,
      created_at: data.created_at,
      updated_at: data.updated_at,
      products: [], // Se llena por separado si es necesario
    };
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
      weight: parseFloat(data.weight || 0),
      created_at: data.created_at,
      updated_at: data.updated_at,
    };
  }
}
