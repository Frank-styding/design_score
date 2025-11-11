import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/src/infrastrucutre/supabse/client";
import { processZipFile } from "@/src/lib/fileProcessingServer";
import { ProductUseCase } from "@/src/domain/usecase/ProductUseCase";
import { SupabaseProductRepository } from "@/src/infrastrucutre/supabse/SupabaseProductRepositry";
import { SupabaseStorageRepository } from "@/src/infrastrucutre/supabse/SupabaseStorageRepository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/upload-rar
 *
 * Sube un archivo ZIP, lo descomprime, procesa las constantes del HTML
 * y sube las imágenes a Supabase Storage
 *
 * Body (multipart/form-data):
 * - file: archivo ZIP
 * - product_id: ID del producto
 * - admin_id: ID del administrador
 *
 * Response:
 * - constants: constantes extraídas del HTML
 * - uploadedImages: lista de rutas de imágenes subidas
 * - imageCount: número de imágenes procesadas
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verificar autenticación
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Usuario no autenticado" },
        { status: 401 }
      );
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
      return NextResponse.json(
        { error: "No se proporcionó archivo" },
        { status: 400 }
      );
    }

    if (!product_id || !admin_id) {
      return NextResponse.json(
        { error: "Se requiere product_id y admin_id" },
        { status: 400 }
      );
    }

    // Validar que sea SOLO un archivo ZIP
    const isZip = file.name.toLowerCase().endsWith(".zip");

    if (!isZip) {
      return NextResponse.json(
        {
          error:
            "Solo se permiten archivos .zip. Por favor, convierte tu archivo a formato ZIP.",
        },
        { status: 400 }
      );
    }

    // Convertir File a Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Validar que el archivo ZIP sea válido
    try {
      const AdmZip = require("adm-zip");
      const testZip = new AdmZip(buffer);
      testZip.getEntries(); // Esto lanzará error si no es un ZIP válido
    } catch (zipError: any) {
      console.error("❌ Archivo ZIP inválido:", zipError.message);
      return NextResponse.json(
        {
          ok: false,
          error: `Archivo ZIP corrupto o inválido: ${zipError.message}. Asegúrate de que el archivo sea un ZIP válido.`,
        },
        { status: 400 }
      );
    }

    // 1. Procesar archivo ZIP (extraer y procesar)
    /* console.log("🔄 Extrayendo archivos del archivo..."); */
    const { constants, imageFiles } = await processZipFile(buffer, false);

    /*   console.log(`✅ Extraídas ${imageFiles.size} imágenes`);
    console.log(
      `✅ Constantes procesadas: ${Object.keys(constants).length} variables`
    ); */

    // 2. Subir imágenes a Supabase Storage usando el repositorio
    const uploadedImages: string[] = [];
    const storagePath = `${admin_id}/${product_id}`;

    /*     console.log(`📤 Subiendo imágenes a: ${storagePath}`); */

    for (const [fileName, imageBuffer] of imageFiles.entries()) {
      const filePath = `${storagePath}/${fileName}`;

      // Usar el método uploadBuffer del repositorio de storage
      const { ok: uploadOk, error: uploadError } =
        await storageRepository.uploadBuffer(
          filePath,
          imageBuffer,
          "image/png"
        );

      if (!uploadOk || uploadError) {
        console.error(`❌ Error subiendo ${fileName}:`, uploadError);
        throw new Error(`Error al subir imagen ${fileName}: ${uploadError}`);
      }

      uploadedImages.push(filePath);
      /*    console.log(`✅ Subida: ${fileName}`); */
    }

    // 3. Actualizar producto con las constantes usando el use case
    const { product, ok, error } = await productUseCase.updateProduct(
      product_id,
      {
        constants: constants,
        path: storagePath,
        updated_at: new Date().toISOString(),
      }
    );

    if (!ok || error) {
      console.error("❌ Error actualizando producto:", error);
      throw new Error(`Error actualizando producto: ${error}`);
    }

    /*     console.log(`✅ Producto actualizado con constantes y path`); */

    return NextResponse.json(
      {
        ok: true,
        message: "Archivo procesado exitosamente",
        constants,
        uploadedImages,
        imageCount: imageFiles.size,
        storagePath,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("❌ Error en /api/upload-rar:", error.message);
    return NextResponse.json(
      {
        ok: false,
        error: error.message || "Error procesando archivo ZIP",
      },
      { status: 500 }
    );
  }
}
