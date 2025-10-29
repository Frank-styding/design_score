import { Product } from "@/src/domain/entities/Product";
import { ProductImage } from "@/src/domain/entities/ProductImage";
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
        xr_url: product.xr_url,
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
    image: ProductImage,
    isFirstImage: boolean = false
  ): Promise<{
    image: ProductImage | null;
    ok: boolean;
    error: string | null;
  }> {
    try {
      // --- Subir archivo a Storage ---
      const path = `${adminId}/${productId}/${image.file_name}`;
      const { data: uploadData, error: uploadError } =
        await this.storageRepository.uploadFile(path, image.file as File);

      if (uploadError || !uploadData) {
        throw new Error(uploadError || "Error al subir imagen al Storage");
      }

      const { url } = await this.storageRepository.getFileUrl(path);
      image.url = url as string;
      image.path = uploadData.path;

      // --- Insertar en tabla "image" ---
      const { data: insertedImage, error: insertError } =
        await this.supabaseClient
          .from("image")
          .insert({
            url: image.url,
            path: image.path,
            product_id: productId,
            size: image.size,
            file_name: image.file_name,
          })
          .select("image_id")
          .single();

      if (insertError) throw new Error(insertError.message);

      image.id = insertedImage.image_id;

      // --- Si es la primera imagen, asignarla como cover ---
      if (isFirstImage) {
        await this.supabaseClient
          .from("product")
          .update({ cover_image_id: image.id })
          .eq("product_id", productId);
      }

      return {
        image: { ...image, id: insertedImage.image_id },
        ok: true,
        error: null,
      };
    } catch (err: any) {
      console.error("Error agregando imagen:", err.message);
      return { image: null, ok: false, error: err.message };
    }
  }

  async findById(productId: string, adminId: string): Promise<Product | null> {
    const { data, error } = await this.supabaseClient
      .from("product")
      .select("*, image (*)")
      .eq("product_id", productId)
      .eq("admin_id", adminId)
      .single();

    if (error || !data) return null;

    const images: ProductImage[] = data.image.map((item: any) => ({
      id: item.image_id,
      url: item.url,
      path: item.path,
      productId: data.product_id,
      size: item.size,
      file_name: item.file_name,
    }));

    return {
      id: data.product_id,
      images,
      name: data.name,
      description: data.description,
      size: data.size,
      num_images: data.num_images,
      xr_url: data.xr_url,
      coverImageId: data.cover_image_id,
    };
  }

  async findAll(adminId: string): Promise<Product[]> {
    const { data, error } = await this.supabaseClient
      .from("product")
      .select("*, image (*)")
      .eq("admin_id", adminId);

    if (error || !data) return [];

    return data.map((row: any) => ({
      id: row.product_id,
      name: row.name,
      description: row.description,
      weight: row.weight,
      num_images: row.num_images,
      xr_url: row.xr_url,
      coverImageId: row.cover_image_id,
      images: row.image.map((img: any) => ({
        id: img.image_id,
        url: img.url,
        path: img.path,
        productId: row.product_id,
        size: img.size,
        file_name: img.file_name,
      })),
    }));
  }
}
