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

  // Resetear sincronización cuando cambia la vista
  useEffect(() => {
    setIsSynced(false);
    iframesRef.current.clear();
  }, [currentViewIndex]);

  // Notificar a todos los iframes cuando cambie el estado de sincronización
  useEffect(() => {
    iframesRef.current.forEach((iframe) => {
      if (iframe.contentWindow) {
        iframe.contentWindow.postMessage(
          {
            type: "keyshot-sync-enable",
            enabled: isSynced,
          },
          "*"
        );
      }
    });
  }, [isSynced]);

  // Sincronización mediante monitoreo de índices de KeyShotXR
  useEffect(() => {
    console.log(
      "🔧 [SYNC] useEffect ejecutado - isSynced:",
      isSynced,
      "hasMultipleProducts:",
      hasMultipleProducts
    );
    console.log(
      "🔧 [SYNC] iframes registrados:",
      Array.from(iframesRef.current.keys())
    );

    if (!isSynced || !hasMultipleProducts) {
      // Deshabilitar sincronización en todos los iframes
      console.log("❌ [SYNC] Deshabilitando sincronización...");
      iframesRef.current.forEach((iframe, productId) => {
        if (iframe.contentWindow) {
          console.log("  ➡️ Deshabilitando en:", productId);
          iframe.contentWindow.postMessage(
            {
              type: "keyshot-sync-enable",
              enabled: false,
            },
            "*"
          );
        }
      });
      return;
    }

    // Habilitar sincronización en todos los iframes
    console.log(
      "✅ [SYNC] Habilitando sincronización en",
      iframesRef.current.size,
      "iframes..."
    );
    iframesRef.current.forEach((iframe, productId) => {
      if (iframe.contentWindow) {
        console.log("  ➡️ Habilitando en:", productId);

        // Enviar múltiples veces con delay para asegurar que KeyShotXR esté listo
        const sendEnableMessage = () => {
          if (iframe.contentWindow) {
            console.log(
              "    📤 Enviando mensaje keyshot-sync-enable a:",
              productId
            );
            iframe.contentWindow.postMessage(
              {
                type: "keyshot-sync-enable",
                enabled: true,
              },
              "*"
            );
          }
        };

        // Enviar inmediatamente
        sendEnableMessage();

        // Reintentar después de 100ms, 500ms y 1000ms por si KeyShotXR aún no estaba listo
        setTimeout(sendEnableMessage, 100);
        setTimeout(sendEnableMessage, 500);
        setTimeout(sendEnableMessage, 1000);
      }
    });

    // Escuchar cambios de índices desde cualquier iframe
    const handleIndexChanged = (event: MessageEvent) => {
      // Log de TODOS los mensajes para debug
      if (event.data.type && event.data.type.startsWith("keyshot")) {
        console.log(
          "📬 [MESSAGE] Mensaje recibido:",
          event.data.type,
          event.data
        );
      }

      if (event.data.type === "keyshot-index-changed") {
        const { containerId, uIndex, vIndex } = event.data;

        console.log(
          "📩 [SYNC] Índice cambiado en:",
          containerId,
          "u:",
          uIndex,
          "v:",
          vIndex
        );
        console.log(
          "📋 [SYNC] iframes disponibles para propagar:",
          Array.from(iframesRef.current.keys())
        );

        // Propagar a todos los demás iframes
        let propagatedCount = 0;
        let skippedCount = 0;
        iframesRef.current.forEach((iframe, productId) => {
          if (iframe.contentWindow) {
            console.log(
              "  🔍 Evaluando:",
              productId,
              "- es el mismo que source?",
              productId === containerId
            );
            console.log("    → Enviando sync-indices a:", productId);
            iframe.contentWindow.postMessage(
              {
                type: "keyshot-sync-indices",
                containerId: containerId, // Enviar el ID del source para que no se cree loop
                uIndex,
                vIndex,
              },
              "*"
            );
            propagatedCount++;
          } else {
            console.log("  ⚠️ iframe sin contentWindow:", productId);
            skippedCount++;
          }
        });

        console.log(
          `✅ [SYNC] Propagado a ${propagatedCount} iframes (saltados: ${skippedCount})`
        );
      }
    };

    console.log("👂 [SYNC] Registrando listener de mensajes...");
    window.addEventListener("message", handleIndexChanged);

    // Debug: Listener adicional para ver TODOS los mensajes
    const debugListener = (event: MessageEvent) => {
      console.log("🔔 [DEBUG] Mensaje recibido:", {
        type: event.data?.type,
        origin: event.origin,
        data: event.data,
      });
    };
    window.addEventListener("message", debugListener);

    return () => {
      console.log("🧹 [SYNC] Limpiando listener de mensajes...");
      window.removeEventListener("message", handleIndexChanged);
      window.removeEventListener("message", debugListener);
    };
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
      {/* Botón de sincronización */}
      {hasMultipleProducts && (
        <SyncToggle isSynced={isSynced} onToggle={setIsSynced} />
      )}

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
                          console.log(
                            "🎯 [IFRAME] Registrando iframe para producto:",
                            product.product_id
                          );
                          iframesRef.current.set(product.product_id!, iframe);
                          console.log(
                            "📝 [IFRAME] Total de iframes registrados:",
                            iframesRef.current.size
                          );
                          console.log(
                            "📋 [IFRAME] IDs registrados:",
                            Array.from(iframesRef.current.keys())
                          );
                        } else {
                          console.log(
                            "🗑️ [IFRAME] Eliminando iframe para producto:",
                            product.product_id
                          );
                          iframesRef.current.delete(product.product_id!);
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
