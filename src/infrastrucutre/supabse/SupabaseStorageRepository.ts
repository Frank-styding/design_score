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

  async listFiles(folderPath: string): Promise<{
    ok: boolean;
    data: { name: string; id: string }[] | null;
    error: string | null;
  }> {
    const { data, error } = await this.supabaseClient.storage
      .from("files")
      .list(folderPath);

    if (error) {
      return { ok: false, data: null, error: error.message };
    }

    return { ok: true, data: data || [], error: null };
  }

  async deleteFolder(
    folderPath: string
  ): Promise<{ ok: boolean; error: string | null }> {
    // Listar todos los archivos en la carpeta
    const { data: files, error: listError } = await this.supabaseClient.storage
      .from("files")
      .list(folderPath);

    if (listError) {
      return { ok: false, error: listError.message };
    }

    // Si no hay archivos, no hay nada que eliminar
    if (!files || files.length === 0) {
      return { ok: true, error: null };
    }

    // Construir las rutas completas de los archivos
    const filePaths = files.map((file) => `${folderPath}/${file.name}`);

    // Eliminar todos los archivos
    const { error: deleteError } = await this.supabaseClient.storage
      .from("files")
      .remove(filePaths);

    if (deleteError) {
      return { ok: false, error: deleteError.message };
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
      .upload(filePath, file, {
        upsert: true, // ✅ Sobrescribir si ya existe
      });
    if (error) {
      return { ok: false, error: error.message, data: null };
    }

    return { ok: true, error: null, data };
  }

  async uploadBuffer(
    filePath: string,
    buffer: Buffer,
    contentType: string = "application/octet-stream"
  ): Promise<{
    ok: boolean;
    data: { fullPath: string; path: string } | null;
    error: string | null;
  }> {
    const { data, error } = await this.supabaseClient.storage
      .from("files")
      .upload(filePath, buffer, {
        contentType: contentType,
        upsert: true, // ✅ Sobrescribir si ya existe
      });
    if (error) {
      return { ok: false, error: error.message, data: null };
    }

    return { ok: true, error: null, data };
  }
}
