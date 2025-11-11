/* eslint-disable react/forbid-dom-props */
"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import KeyShotXRViewer from "@/src/components/KeyShotXRViewer";
import SyncToggle from "@/src/components/SyncToggle";
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
  const [isSynced, setIsSynced] = useState(false);
  const hasMultipleProducts = currentProducts.length > 1;
  const iframesRef = useRef<Map<string, HTMLIFrameElement>>(new Map());

  // Sincronización: Deshabilitar la sincronización por ahora
  // TODO: Implementar sincronización funcional en el futuro
  useEffect(() => {
    // Funcionalidad de sincronización deshabilitada temporalmente
    // El approach actual no funciona correctamente con KeyShotXR
  }, [isSynced, hasMultipleProducts]);

  // Renderizar viewers de forma memoizada
  const currentViewers = useMemo(() => {
    return currentProducts.map((product, index) => {
      return {
        product,
        index,
      };
    });
  }, [currentProducts]);

  const nextViewers = useMemo(() => {
    return nextProducts.map((product) => {
      return {
        product,
      };
    });
  }, [nextProducts]);

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
      {/* Botón de sincronización - DESHABILITADO TEMPORALMENTE
      {hasMultipleProducts && (
        <SyncToggle isSynced={isSynced} onToggle={setIsSynced} />
      )}
      */}

      <div className={`grid gap-4 h-full w-full ${gridClass} bg-white`}>
        {currentViewers.map(({ product, index }) => {
          return (
            <div
              key={`container-${product.product_id}-${currentViewIndex}`}
              className="relative w-full h-full flex items-center justify-center rounded-lg overflow-hidden"
            >
              {/* Visor 360 centrado y con tamaño contenido */}
              {product.path && product.constants ? (
                <div className="w-full h-full flex items-center justify-center relative">
                  <div
                    className={`relative flex items-center justify-center w-full h-full ${
                      /*         hasMultipleProducts
                        ? "max-w-[90%] max-h-[85%]"
                        : "max-w-full max-h-[95%]" */
                      "max-w-full max-h-[95%]"
                    }`}
                  >
                    <KeyShotXRViewer
                      key={product.product_id}
                      baseUrl={product.path}
                      config={product.constants as any}
                      className="w-full h-full"
                      viewerId={product.product_id!}
                      onIframeReady={(iframe) => {
                        if (iframe) {
                          iframesRef.current.set(product.product_id!, iframe);
                        }
                      }}
                    />
                  </div>
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
        {nextViewers.map(({ product }) => (
          <div key={`preload-${product.product_id}`}>
            {product.path && product.constants && (
              <KeyShotXRViewer
                key={product.product_id}
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
