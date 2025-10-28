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

  async findById(productId: string, adminId: string): Promise<Product | null> {
    const { data: productData, error: productError } = await this.supabaseClient
      .from("product")
      .select("*")
      .eq("product_id", productId)
      .eq("admin_id", adminId)
      .single();

    if (productError) {
      return null;
    }

    const { data: imagesData, error: imagesError } = await this.supabaseClient
      .from("image")
      .select("*")
      .eq("product_id", productId);

    if (imagesError) {
      return null;
    }

    const images: ProductImage[] = imagesData.map((item) => ({
      id: item.image_id,
      url: item.url,
      path: item.path,
      productId: productId,
      size: item.size,
      file_name: item.file_name,
    }));

    return {
      images,
      name: productData.name,
      description: productData.description,
      weight: productData.weight,
      num_images: productData.num_images,
      xr_url: productData.xr_url,
      coverImageId: productData.cover_image_id,
    };
  }
  async save(
    product: Product,
    adminId: string
  ): Promise<{ product: Product | null; ok: boolean; error: string | null }> {
    const { data, error: productError } = await this.supabaseClient
      .from("product")
      .insert({
        name: product.name,
        description: product.description,
        weight: product.weight,
        num_images: product.images.length,
        admin_id: adminId,
        xr_url: product.xr_url, //TODO: !change in the furture
      })
      .select()
      .single();

    if (productError) {
      return {
        product: null,
        ok: false,
        error: productError?.message || "Unknown error",
      };
    }
    product.id = data.product_id;

    let finalError: string | null = null;

    for (let i = 0; i < product.images.length; i++) {
      const productImage = product.images[i];
      const path = `${adminId}/${product.id}/${productImage.id}`;
      const { error, data } = await this.storageRepository.uploadFile(
        path,
        productImage.file as File
      );
      if (error) {
        finalError = error || "Failed to upload image";
        break;
      }
      if (!data) {
        finalError = "No data returned from uploadFile";
        break;
      }
      const { url } = await this.storageRepository.getFileUrl(path);
      productImage.url = url as string;
      productImage.path = data.path;
      const { error: insertImageError, data: insertImage } =
        await this.supabaseClient
          .from("image")
          .insert({
            url: productImage.url,
            path: productImage.path,
            product_id: product.id,
            size: productImage.size,
            file_name: productImage.file_name,
          })
          .select()
          .single();
      if (insertImageError) {
        finalError = insertImageError.message || "Error inserting image record";
        break;
      }
      productImage.id = insertImage.image_id;
    }

    if (finalError) {
      this.supabaseClient
        .from("product")
        .delete()
        .eq("product_id", product.id)
        .eq("admin_id", adminId);
      this.storageRepository.deleteFiles(product.images.map((img) => img.path));
      return {
        product: null,
        ok: false,
        error: finalError,
      };
    }

    await this.supabaseClient
      .from("product")
      .update({ cover_image_id: product.images[0].id })
      .eq("product_id", product.id)
      .eq("admin_id", adminId);

    return {
      product,
      ok: true,
      error: null,
    };
  }
  async delete(
    productId: string,
    adminId: string
  ): Promise<{ ok: boolean; error: string | null }> {
    await this.supabaseClient
      .from("product")
      .select("*")
      .eq("product_id", productId);
  }
  findAll(adminId: string): Promise<Product[]> {
    throw new Error("Method not implemented.");
  }
}
