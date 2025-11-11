"use client";

import { useCallback, useState } from "react";
import {
  createProductAction,
  addImagesBatchAction,
} from "../app/actions/productActions";
// TODO: Descomentar processFiles en fileProcessing.ts
// import { processFiles } from "../lib/fileProcessing";
// import { Product } from "../domain/entities/Product";

interface UploadFolderFormProps {
  adminId: string;
  projectId?: string;
  onSuccess?: (productId: string) => void;
}

export default function UploadFolderForm({
  adminId,
  projectId,
  onSuccess,
}: UploadFolderFormProps) {
  const [productName, setProductName] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  const handleFolderSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      setSelectedFiles(files);
      setMessage("");
    },
    []
  );

  const handleUpload = useCallback(async () => {
    if (!selectedFiles || !productName.trim()) {
      setMessage("Selecciona una carpeta y nombre del producto");
      return;
    }

    setUploading(true);
    setMessage("Procesando archivos...");

    let productId: string | null = null;

    try {
      // TODO: Restaurar cuando processFiles esté disponible
      // const { parsedConstants, images } = await processFiles(selectedFiles);
      const parsedConstants = "{}";
      const images: File[] = [];
      
      // 1. Crear el producto primero
      const newProduct = await createProductAction({
        name: productName,
        project_id: projectId || "",
        constants: JSON.parse(parsedConstants),
        admin_id: adminId,
        weight: 0,
      });

      if (!newProduct || !newProduct.product_id) {
        throw new Error("No se pudo crear el producto");
      }

      productId = newProduct.product_id;
      /*       console.log("✅ Producto creado:", productId); */

      // 2. Procesar archivos (comprimir imágenes + extraer constantes)

      // 3. Subir carpeta KeyShot completa con imágenes comprimidas en lotes de máximo 512KB
      setMessage("Subiendo archivos...");

      const MAX_BATCH_SIZE_MB = 0.5; // 512KB por lote (Next.js tiene límite de 1MB)
      const MAX_BATCH_SIZE_BYTES = MAX_BATCH_SIZE_MB * 1024 * 1024;
      const totalImages = images.length;
      let uploadedCount = 0;

      // Agrupar imágenes en lotes que no superen 512KB
      const batches: File[][] = [];
      let currentBatch: File[] = [];
      let currentBatchSize = 0;

      for (const image of images) {
        const imageSize = image.size;

        // Si agregar esta imagen excede 512KB, crear nuevo lote
        if (
          currentBatchSize + imageSize > MAX_BATCH_SIZE_BYTES &&
          currentBatch.length > 0
        ) {
          batches.push(currentBatch);
          currentBatch = [];
          currentBatchSize = 0;
        }

        currentBatch.push(image);
        currentBatchSize += imageSize;
      }

      // Agregar el último lote si tiene imágenes
      if (currentBatch.length > 0) {
        batches.push(currentBatch);
      }

      const totalBatches = batches.length;
      /*       console.log(
        `📦 Total de lotes creados: ${totalBatches} (máx 512KB cada uno)`
      ); */

      // Subir cada lote secuencialmente
      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        const batchNumber = i + 1;
        const batchSizeMB = (
          batch.reduce((sum, img) => sum + img.size, 0) /
          1024 /
          1024
        ).toFixed(2);

        setMessage(
          `Subiendo lote ${batchNumber}/${totalBatches} (${batch.length} imágenes, ${batchSizeMB}MB)...`
        );
        /*        console.log(
          `📤 Lote ${batchNumber}/${totalBatches}: ${batch.length} imágenes (${batchSizeMB}MB)`
        );
 */
        const result = await addImagesBatchAction(
          productId,
          batch,
          i === 0 // isFirstBatch solo para el primer lote
        );

        if (!result.ok) {
          throw new Error(
            result.error || `Error en lote ${batchNumber}/${totalBatches}`
          );
        }

        uploadedCount += result.uploaded;
        /*         console.log(
          `✅ Lote ${batchNumber}/${totalBatches} completado (${result.uploaded} imágenes)`
        ); */
      }

      setMessage(
        `✅ Producto "${productName}" subido con éxito (${uploadedCount} imágenes en ${totalBatches} lotes)`
      );
      setProductName("");
      setSelectedFiles(null);
      if (onSuccess && productId) onSuccess(productId);
    } catch (error: any) {
      console.error("❌ Error en upload:", error);
      setMessage(`❌ Error: ${error.message}`);

      // ROLLBACK: Si hubo error, eliminar el producto creado
      if (productId) {
        try {
          const { deleteProductAction } = await import(
            "../app/actions/productActions"
          );
          await deleteProductAction(productId);
          /*           console.log("🔄 Producto eliminado por rollback"); */
        } catch (rollbackError) {
          console.error("⚠️ Error en rollback:", rollbackError);
        }
      }
    } finally {
      setUploading(false);
    }
  }, [selectedFiles, productName, adminId, onSuccess]);

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-center text-gray-800">
        Subir Carpeta KeyShot
      </h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nombre del Producto
          </label>
          <input
            type="text"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
            placeholder="Ej: Silla Moderna 2024"
            disabled={uploading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Seleccionar Carpeta
          </label>
          <input
            type="file"
            // @ts-expect-error - webkitdirectory is not in React types
            webkitdirectory="true"
            multiple
            onChange={handleFolderSelect}
            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            disabled={uploading}
          />
          {selectedFiles && (
            <p className="mt-2 text-sm text-gray-600">
              {selectedFiles.length} archivos seleccionados
            </p>
          )}
        </div>

        <button
          onClick={handleUpload}
          disabled={uploading || !selectedFiles || !productName.trim()}
          className={`w-full py-2 px-4 rounded-md font-semibold text-white transition-colors ${
            uploading || !selectedFiles || !productName.trim()
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {uploading ? "Subiendo..." : "Subir Producto"}
        </button>

        {message && (
          <div
            className={`p-3 rounded-md text-sm ${
              message.startsWith("✅")
                ? "bg-green-50 text-green-800"
                : message.startsWith("❌")
                ? "bg-red-50 text-red-800"
                : "bg-blue-50 text-blue-800"
            }`}
          >
            {message}
          </div>
        )}
      </div>
    </div>
  );
}
