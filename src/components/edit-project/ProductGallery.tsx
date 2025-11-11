import { Product } from "@/src/domain/entities/Product";
import Button from "@/src/components/ui/Button";

interface ProductGalleryProps {
  products: Product[];
  onSelectProduct: (index: number) => void;
  onDeleteProduct: (productId: string) => Promise<void>;
  isSaving: boolean;
}

export function ProductGallery({
  products,
  onSelectProduct,
  onDeleteProduct,
  isSaving,
}: ProductGalleryProps) {
  if (products.length === 0) {
    return (
      <div className="text-center py-12 border border-gray-300 rounded-lg bg-gray-50">
        <div className="text-6xl mb-4">📦</div>
        <p className="text-gray-600 mb-2">No hay productos en este proyecto</p>
        <p className="text-gray-500 text-sm">Agrega productos para comenzar</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 justify-start">
      {products.map((product, index) => (
        <div
          key={product.product_id}
          className="border border-gray-300 rounded-lg overflow-hidden bg-white shadow-md hover:shadow-xl transition-shadow"
        >
          {/* Imagen de portada */}
          <div className="h-48 bg-gray-100 flex items-center justify-center relative">
            {product.cover_image ? (
              <img
                src={product.cover_image}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-gray-400 text-center">
                <div className="text-6xl mb-2">📦</div>
                <p className="text-sm">Sin imagen</p>
              </div>
            )}

            {/* Botón de eliminar */}
            <button
              onClick={() => onDeleteProduct(product.product_id!)}
              className="absolute top-2 right-2  text-black rounded-[8px] p-2  transition-colors border-1 border-black hover:bg-black hover:text-white"
              title="Eliminar producto"
              disabled={isSaving}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>

          {/* Información del producto */}
          <div className="p-4">
            <h3 className="text-lg font-medium text-gray-800 mb-2 truncate">
              {product.name || `Producto ${index + 1}`}
            </h3>

            {/* Tamaño del archivo */}
            <div className="mb-3">
              <label className="text-xs text-gray-600 mb-1 block">
                Tamaño del archivo
              </label>
              <div className="p-2 bg-gray-100 border border-gray-300 rounded text-sm text-gray-700">
                {product.weight
                  ? `${product.weight.toFixed(2)} MB`
                  : "Calculando..."}
              </div>
            </div>

            {/* Botón de vista previa */}
            {product.path && (
              <button
                onClick={() => onSelectProduct(index)}
                className="w-full px-4 py-2 bg-white hover:bg-black text-black text-lg rounded transition-colors border-1 border-black hover:text-white"
              >
                Ver
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
