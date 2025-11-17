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
    try {
      // Listar todos los archivos en la carpeta (recursivamente)
      const { data: files, error: listError } =
        await this.supabaseClient.storage.from("files").list(folderPath, {
          limit: 1000, // Aumentar el límite para manejar muchos archivos
          offset: 0,
          sortBy: { column: "name", order: "asc" },
        });

      if (listError) {
        console.error(`❌ Error listando carpeta ${folderPath}:`, listError);
        return { ok: false, error: listError.message };
      }

      // Si no hay archivos, retornar éxito
      if (!files || files.length === 0) {
        return { ok: true, error: null };
      }

      // Separar archivos y carpetas
      const filesToDelete: string[] = [];
      const foldersToDelete: string[] = [];

      for (const file of files) {
        const fullPath = `${folderPath}/${file.name}`;

        // Si el item tiene metadata de carpeta o no tiene extension, tratarlo como carpeta
        if (file.id === null || !file.name.includes(".")) {
          foldersToDelete.push(fullPath);
        } else {
          filesToDelete.push(fullPath);
        }
      }

      // Eliminar subcarpetas recursivamente
      if (foldersToDelete.length > 0) {
        for (const folder of foldersToDelete) {
          await this.deleteFolder(folder); // Llamada recursiva
        }
      }

      // Eliminar archivos del nivel actual
      if (filesToDelete.length > 0) {
        const { error: deleteError } = await this.supabaseClient.storage
          .from("files")
          .remove(filesToDelete);

        if (deleteError) {
          console.error(
            `❌ Error eliminando archivos de ${folderPath}:`,
            deleteError
          );
          return { ok: false, error: deleteError.message };
        }
      }

      return { ok: true, error: null };
    } catch (err: any) {
      console.error(`❌ Error eliminando carpeta ${folderPath}:`, err);
      return { ok: false, error: err.message };
    }
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
    try {
      console.log(
        `📤 [SupabaseStorageRepository] Subiendo archivo: ${filePath} (${(
          file.size / 1024
        ).toFixed(2)} KB)`
      );

      const { data, error } = await this.supabaseClient.storage
        .from("files")
        .upload(filePath, file, {
          upsert: true, // ✅ Sobrescribir si ya existe
        });

      if (error) {
        console.error(
          `❌ [SupabaseStorageRepository] Error subiendo ${filePath}:`,
          error
        );
        return { ok: false, error: error.message, data: null };
      }

      console.log(`✅ [SupabaseStorageRepository] Archivo subido: ${filePath}`);
      return { ok: true, error: null, data };
    } catch (err: any) {
      console.error(
        `❌ [SupabaseStorageRepository] Excepción subiendo ${filePath}:`,
        err
      );
      return { ok: false, error: err.message, data: null };
    }
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
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 1000; // 1 segundo entre reintentos

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const { data, error } = await this.supabaseClient.storage
          .from("files")
          .upload(filePath, buffer, {
            contentType: contentType,
            upsert: true, // ✅ Sobrescribir si ya existe
          });

        if (error) {
          console.error(
            `❌ Error en uploadBuffer para ${filePath} (intento ${attempt}/${MAX_RETRIES}):`,
            error
          );

          // Si es el último intento, devolver el error
          if (attempt === MAX_RETRIES) {
            return {
              ok: false,
              error: error.message || String(error),
              data: null,
            };
          }

          // Esperar antes de reintentar
          await new Promise((resolve) =>
            setTimeout(resolve, RETRY_DELAY * attempt)
          );
          continue; // Reintentar
        }

        // ✅ Subida exitosa
        if (attempt > 1) {
          console.log(
            `✅ Subida exitosa en intento ${attempt} para ${filePath}`
          );
        }
        return { ok: true, error: null, data };
      } catch (err: any) {
        console.error(
          `❌ Excepción en uploadBuffer para ${filePath} (intento ${attempt}/${MAX_RETRIES}):`,
          err
        );

        // Si es el último intento, devolver el error
        if (attempt === MAX_RETRIES) {
          return {
            ok: false,
            error: `Falló después de ${MAX_RETRIES} intentos: ${
              err.message || String(err)
            }`,
            data: null,
          };
        }

        // Esperar antes de reintentar
        await new Promise((resolve) =>
          setTimeout(resolve, RETRY_DELAY * attempt)
        );
      }
    }

    // Esto nunca debería ejecutarse, pero TypeScript lo requiere
    return {
      ok: false,
      error: "Error desconocido en uploadBuffer",
      data: null,
    };
  }

  /**
   * Sube múltiples buffers en paralelo para mejorar el rendimiento
   * @param uploads Array de objetos con filePath, buffer y contentType
   * @returns Array de resultados de las subidas
   */
  async uploadBuffersBatch(
    uploads: Array<{
      filePath: string;
      buffer: Buffer;
      contentType?: string;
    }>
  ): Promise<
    Array<{
      filePath: string;
      ok: boolean;
      data: { fullPath: string; path: string } | null;
      error: string | null;
    }>
  > {
    const uploadPromises = uploads.map(
      async ({ filePath, buffer, contentType }) => {
        const result = await this.uploadBuffer(
          filePath,
          buffer,
          contentType || "image/png"
        );
        return { filePath, ...result };
      }
    );

    return Promise.all(uploadPromises);
  }
}
