import { NextRequest } from "next/server";
import { createClient } from "@/src/infrastrucutre/supabse/client";
import { processZipFile } from "@/src/lib/fileProcessingServer";
import { ProductUseCase } from "@/src/domain/usecase/ProductUseCase";
import { SupabaseProductRepository } from "@/src/infrastrucutre/supabse/SupabaseProductRepositry";
import { SupabaseStorageRepository } from "@/src/infrastrucutre/supabse/SupabaseStorageRepository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/upload-rar-stream
 *
 * Sube un archivo ZIP/RAR con progreso en tiempo real usando Server-Sent Events
 */
export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();

  // Validación temprana antes de crear el stream
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return new Response(JSON.stringify({ error: "Usuario no autenticado" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: "Error de autenticación: " + error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const stream = new ReadableStream({
    async start(controller) {
      const sendMessage = (data: any) => {
        try {
          const message = `data: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(message));
        } catch (err) {
          console.error("❌ Error enviando mensaje SSE:", err);
        }
      };

      try {
        const supabase = await createClient();

        // Verificar autenticación
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          console.error("❌ [upload-rar-stream] Usuario no autenticado");
          sendMessage({ type: "error", message: "Usuario no autenticado" });
          controller.close();
          return;
        }

        // Inicializar use cases
        const storageRepository = new SupabaseStorageRepository(supabase);
        const productRepository = new SupabaseProductRepository(
          supabase,
          storageRepository
        );
        const productUseCase = new ProductUseCase(productRepository);

        // Parsear el formulario multipart
        const formData = await request.formData();
        const file = formData.get("file") as File;
        const product_id = formData.get("product_id") as string;
        const admin_id = formData.get("admin_id") as string;

        if (!file) {
          sendMessage({ type: "error", message: "No se proporcionó archivo" });
          controller.close();
          return;
        }

        if (!product_id || !admin_id) {
          sendMessage({
            type: "error",
            message: "Se requiere product_id y admin_id",
          });
          controller.close();
          return;
        }

        // Validar que sea SOLO un archivo ZIP
        const isZip = file.name.toLowerCase().endsWith(".zip");

        if (!isZip) {
          sendMessage({
            type: "error",
            message:
              "Solo se permiten archivos .zip. Por favor, convierte tu archivo a formato ZIP.",
          });
          controller.close();
          return;
        }

        // Convertir File a Buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Validar que el archivo ZIP sea válido
        try {
          const AdmZip = require("adm-zip");
          const testZip = new AdmZip(buffer);
          testZip.getEntries();
        } catch (zipError: any) {
          sendMessage({
            type: "error",
            message: `Archivo ZIP corrupto o inválido: ${zipError.message}`,
          });
          controller.close();
          return;
        }

        sendMessage({
          type: "progress",
          phase: "upload-complete",
          message: "Archivo recibido",
        });

        // 1. Procesar archivo ZIP (extraer y procesar)
        sendMessage({
          type: "progress",
          phase: "extracting",
          message: "Extrayendo archivos...",
        });

        const { constants, imageFiles } = await processZipFile(buffer, false);

        sendMessage({
          type: "progress",
          phase: "extracted",
          message: `${imageFiles.size} imágenes extraídas`,
          imageCount: imageFiles.size,
        });

        // 2. Subir imágenes a Supabase Storage en lotes paralelos (OPTIMIZADO)
        const uploadedImages: string[] = [];
        const storagePath = `${admin_id}/${product_id}`;
        let uploadedCount = 0;

        // Calcular el tamaño total de las imágenes en MB
        let totalSizeBytes = 0;
        for (const [, imageBuffer] of imageFiles.entries()) {
          totalSizeBytes += imageBuffer.length;
        }
        const totalSizeMB = totalSizeBytes / (1024 * 1024); // Convertir bytes a MB
        console.log(
          `📊 [upload-rar-stream] Tamaño total de imágenes: ${totalSizeMB.toFixed(
            2
          )} MB`
        );

        sendMessage({
          type: "progress",
          phase: "uploading-images",
          message: "Iniciando subida de imágenes a la base de datos...",
          total: imageFiles.size,
          uploaded: 0,
        });

        // Convertir Map a array para procesamiento en lotes
        const imageArray = Array.from(imageFiles.entries());

        // Ordenar alfabéticamente por nombre de archivo para tener un orden consistente
        // Esto asegura que la primera imagen sea predecible (ej: img_0.png, img_1.png, etc.)
        imageArray.sort((a, b) => {
          const nameA = a[0].toLowerCase();
          const nameB = b[0].toLowerCase();
          return nameA.localeCompare(nameB, undefined, {
            numeric: true,
            sensitivity: "base",
          });
        });

        const BATCH_SIZE = 3; // ✅ REDUCIDO: Subir solo 3 imágenes en paralelo para evitar rate limits
        const DELAY_BETWEEN_BATCHES = 300; // ✅ Esperar 300ms entre lotes para darle tiempo a Supabase

        // Dividir en lotes y subir
        for (let i = 0; i < imageArray.length; i += BATCH_SIZE) {
          const batch = imageArray.slice(i, i + BATCH_SIZE);

          // Preparar el batch para subida
          const batchUploads = batch.map(([fileName, imageBuffer]) => ({
            filePath: `${storagePath}/${fileName}`,
            buffer: imageBuffer,
            contentType: "image/png",
          }));

          // Subir el lote completo en paralelo usando el método batch
          const results = await storageRepository.uploadBuffersBatch(
            batchUploads
          );

          // Procesar resultados del lote
          for (let j = 0; j < results.length; j++) {
            const result = results[j];
            const fileName = batch[j][0];

            if (!result.ok || result.error) {
              console.error(
                `❌ [upload-rar-stream] Error subiendo ${fileName}:`,
                result.error
              );
              sendMessage({
                type: "error",
                message: `Error subiendo ${fileName}: ${result.error}`,
              });
              // ⚠️ NO hacer continue, intentar seguir con las demás imágenes
            } else {
              uploadedImages.push(result.filePath);
              uploadedCount++;
            }

            // Enviar progreso actualizado (cada imagen para mejor feedback)
            sendMessage({
              type: "progress",
              phase: "uploading-images",
              message: `Subiendo imágenes: ${uploadedCount}/${imageFiles.size}`,
              fileName: fileName,
              uploaded: uploadedCount,
              total: imageFiles.size,
              percentage: Math.round((uploadedCount / imageFiles.size) * 100),
            });
          }

          // ✅ DELAY entre lotes para evitar saturar Supabase
          if (i + BATCH_SIZE < imageArray.length) {
            await new Promise((resolve) =>
              setTimeout(resolve, DELAY_BETWEEN_BATCHES)
            );
          }

          // Enviar actualización después de cada lote completo
          sendMessage({
            type: "progress",
            phase: "uploading-images",
            message: `Lote ${Math.ceil(
              (i + BATCH_SIZE) / BATCH_SIZE
            )} completado: ${uploadedCount}/${imageFiles.size} imágenes`,
            uploaded: uploadedCount,
            total: imageFiles.size,
            percentage: Math.round((uploadedCount / imageFiles.size) * 100),
          });
        }

        sendMessage({
          type: "progress",
          phase: "images-uploaded",
          message: "Todas las imágenes subidas",
          uploaded: uploadedCount,
          total: imageFiles.size,
        });

        // 3. Obtener la URL de la primera imagen para usarla como cover_image
        // y también obtener la URL base de la carpeta para el path
        let coverImageUrl: string | null = null;
        let storagePathUrl: string | null = null;

        if (uploadedImages.length > 0) {
          const firstImagePath = uploadedImages[0];
          const { url } = await storageRepository.getFileUrl(firstImagePath);
          coverImageUrl = url;

          // Extraer la URL base de la carpeta (sin el nombre del archivo)
          // Ejemplo: https://.../files/admin_id/product_id/img_0.png
          // Resultado: https://.../files/admin_id/product_id
          if (url) {
            const lastSlashIndex = url.lastIndexOf("/");
            storagePathUrl = url.substring(0, lastSlashIndex);
          }

          console.log(
            `✅ [upload-rar-stream] Cover image establecida: ${coverImageUrl}`
          );
          console.log(
            `✅ [upload-rar-stream] Storage path URL: ${storagePathUrl}`
          );
        } else {
          console.warn(
            `⚠️ [upload-rar-stream] No hay imágenes subidas para establecer cover_image`
          );
        }

        // 4. Actualizar producto con las constantes, path, cover_image y weight
        sendMessage({
          type: "progress",
          phase: "updating-product",
          message: "Actualizando información del producto...",
        });

        const updateData: any = {
          constants: constants,
          path: storagePathUrl || storagePath, // Usar URL completa o fallback a ruta relativa
          weight: totalSizeMB, // Tamaño total de las imágenes en MB
          updated_at: new Date().toISOString(),
        };

        // Agregar cover_image solo si se obtuvo la URL de la primera imagen
        if (coverImageUrl) {
          updateData.cover_image = coverImageUrl;
        }

        console.log(
          `📊 [upload-rar-stream] Actualizando producto con weight: ${totalSizeMB.toFixed(
            2
          )} MB`
        );

        const { product, ok, error } = await productUseCase.updateProduct(
          product_id,
          updateData
        );

        if (!ok || error) {
          console.error(
            "❌ [upload-rar-stream] Error actualizando producto:",
            error
          );
          sendMessage({
            type: "error",
            message: `Error actualizando producto: ${error}`,
          });
          controller.close();
          return;
        }

        // Enviar resultado final
        sendMessage({
          type: "complete",
          message: "Procesamiento completado",
          constants,
          uploadedImages,
          imageCount: imageFiles.size,
          storagePath: storagePathUrl || storagePath, // URL completa o ruta relativa
          coverImage: coverImageUrl,
          totalSizeMB: parseFloat(totalSizeMB.toFixed(2)), // Tamaño total en MB
        });

        controller.close();
      } catch (error: any) {
        console.error("❌ Error en upload-rar-stream:", error);

        try {
          sendMessage({
            type: "error",
            message: error.message || "Error procesando archivo",
            stack:
              process.env.NODE_ENV === "development" ? error.stack : undefined,
          });
        } catch (sendError) {
          console.error("Error enviando mensaje de error:", sendError);
        }

        try {
          controller.close();
        } catch (closeError) {
          console.error("Error cerrando controller:", closeError);
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
