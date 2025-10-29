import { IStorageRepository } from "@/src/domain/ports/IStorageReposity";
import SupabaseClient from "@supabase/supabase-js/dist/module/SupabaseClient";

export class SupabaseStorageRepository implements IStorageRepository {
  constructor(private supabaseClient: SupabaseClient) {}
  async deleteFile(
    filePath: string
  ): Promise<{ ok: boolean; error: string | null }> {
    const { error } = await this.supabaseClient.storage
      .from("files")
      .remove([filePath]);
    if (error) {
      return { ok: false, error: error.message };
    }
    return { ok: true, error: null };
  }
  async deleteFiles(
    filePaths: string[]
  ): Promise<{ ok: boolean; error: string | null }> {
    const { error } = await this.supabaseClient.storage
      .from("files")
      .remove(filePaths);
    if (error) {
      return { ok: false, error: error.message };
    }
    return { ok: true, error: null };
  }
  async getFileUrl(filePath: string): Promise<{ url: string | null }> {
    const { data } = await this.supabaseClient.storage
      .from("files")
      .getPublicUrl(filePath);

    return { url: data.publicUrl };
  }
  async uploadFile(
    filePath: string,
    file: File
  ): Promise<{
    ok: boolean;
    data: { fullPath: string; path: string } | null;
    error: string | null;
  }> {
    const { data, error } = await this.supabaseClient.storage
      .from("files")
      .upload(filePath, file);
    if (error) {
      return { ok: false, error: error.message, data: null };
    }

    return { ok: true, error: null, data };
  }
}
