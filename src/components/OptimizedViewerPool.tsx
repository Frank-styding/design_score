"use client";

import { useMemo } from "react";
import KeyShotXRViewer from "@/src/components/KeyShotXRViewer";
import { Product } from "@/src/domain/entities/Product";

interface OptimizedViewerPoolProps {
  currentProducts: Product[];
  nextProducts?: Product[];
  currentViewIndex: number;
  gridCols: 1 | 2 | 3 | 4;
}

export default function OptimizedViewerPool({
  currentProducts,
  nextProducts = [],
  currentViewIndex,
  gridCols,
}: OptimizedViewerPoolProps) {
  // Generar ID único para cada combinación producto-vista
  const getViewerId = (productId: string, viewIndex: number) =>
    `${productId}-${viewIndex}`;

  // Renderizar viewers de forma memoizada
  const currentViewers = useMemo(() => {
    return currentProducts.map((product, index) => {
      const viewerId = getViewerId(product.product_id!, currentViewIndex);
      return {
        viewerId,
        product,
        index,
      };
    });
  }, [currentProducts, currentViewIndex]);

  const nextViewers = useMemo(() => {
    return nextProducts.map((product) => {
      const viewerId = getViewerId(product.product_id!, currentViewIndex + 1);
      return {
        viewerId,
        product,
      };
    });
  }, [nextProducts, currentViewIndex]);

  // Mapeo de gridCols a clases de Tailwind
  const gridClass =
    gridCols === 1
      ? "grid-cols-1"
      : gridCols === 2
      ? "grid-cols-2"
      : gridCols === 3
      ? "grid-cols-3"
      : "grid-cols-2 lg:grid-cols-4";

  return (
    <>
      <div className={`grid gap-2 h-full w-full ${gridClass}`}>
        {currentViewers.map(({ viewerId, product, index }) => {
          const hasMultipleProducts = currentProducts.length > 1;

          return (
            <div
              key={`container-${viewerId}`}
              className="relative w-full h-full overflow-hidden bg-gray-50 flex items-center justify-center"
            >
              {/* Nombre del producto en comparativos */}
              {hasMultipleProducts && (
                <div className="absolute top-2 left-2 right-2 z-10 bg-white bg-opacity-90 px-3 py-1 rounded shadow">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {product.name}
                  </p>
                </div>
              )}

              {/* Visor 360 */}
              {product.path && product.constants ? (
                <div className="w-full h-full flex items-center justify-center">
                  <KeyShotXRViewer
                    key={viewerId}
                    baseUrl={product.path}
                    config={product.constants as any}
                    className="w-full h-full"
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center text-gray-400">
                  Sin vista 360
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Visores precargados ocultos para la siguiente vista */}
      <div className="hidden">
        {nextViewers.map(({ viewerId, product }) => (
          <div key={`preload-${viewerId}`}>
            {product.path && product.constants && (
              <KeyShotXRViewer
                key={viewerId}
                baseUrl={product.path}
                config={product.constants as any}
                className="w-full h-full"
              />
            )}
          </div>
        ))}
      </div>
    </>
  );
}
