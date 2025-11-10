import UploadRarForm from "@/src/components/UploadRarForm";

/**
 * Ejemplo de página para subir archivos RAR de KeyShot
 *
 * Uso:
 * 1. El usuario selecciona un producto existente
 * 2. Sube un archivo .rar con HTML e imágenes de KeyShot
 * 3. El sistema procesa y actualiza el producto automáticamente
 */
export default function UploadRarPage({
  params,
}: {
  params: { productId: string; adminId: string };
}) {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          Cargar Archivos KeyShot
        </h1>

        <UploadRarForm
          productId={params.productId}
          adminId={params.adminId}
          onSuccess={() => {
            // Redirigir o recargar datos después de éxito
            console.log("✅ Archivo procesado exitosamente");
            window.location.reload();
          }}
        />

        <div className="mt-12 bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">📋 Instrucciones</h2>

          <ol className="space-y-3 text-gray-700">
            <li className="flex items-start">
              <span className="font-bold text-blue-600 mr-2">1.</span>
              <span>
                Exporta tu modelo 3D desde KeyShot usando la opción
                <strong> "Export → Web"</strong>
              </span>
            </li>

            <li className="flex items-start">
              <span className="font-bold text-blue-600 mr-2">2.</span>
              <span>
                Comprime la carpeta generada (HTML + imágenes PNG) en un archivo
                <strong> .rar</strong>
              </span>
            </li>

            <li className="flex items-start">
              <span className="font-bold text-blue-600 mr-2">3.</span>
              <span>Sube el archivo usando el formulario anterior</span>
            </li>

            <li className="flex items-start">
              <span className="font-bold text-blue-600 mr-2">4.</span>
              <span>
                El sistema procesará automáticamente:
                <ul className="ml-6 mt-2 space-y-1 list-disc">
                  <li>Extracción de constantes del HTML</li>
                  <li>Subida de imágenes a Storage</li>
                  <li>Actualización del producto</li>
                </ul>
              </span>
            </li>
          </ol>

          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-800">
              <strong>⚠️ Importante:</strong> El archivo RAR debe contener un
              archivo HTML principal y las imágenes PNG generadas por KeyShot.
              No incluyas otros archivos.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
