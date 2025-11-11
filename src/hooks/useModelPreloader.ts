import { useState, useEffect, useCallback } from "react";
import { View } from "@/src/domain/entities/View";
import { Product } from "@/src/domain/entities/Product";

interface PreloadProgress {
  totalProducts: number;
  loadedProducts: number;
  percentage: number;
  currentProduct: string;
}

interface PreloadedData {
  viewId: string;
  products: Product[];
}

/**
 * Hook para pre-cargar todos los modelos de todas las vistas
 */
export function useModelPreloader(views: View[], allProducts: Product[][]) {
  const [isPreloading, setIsPreloading] = useState(true);
  const [progress, setProgress] = useState<PreloadProgress>({
    totalProducts: 0,
    loadedProducts: 0,
    percentage: 0,
    currentProduct: "",
  });
  const [preloadedData, setPreloadedData] = useState<Map<string, Product[]>>(
    new Map()
  );

  /**
   * Pre-carga las imágenes clave de un producto
   */
  const preloadProductImages = useCallback(
    (product: Product): Promise<void> => {
      return new Promise((resolve) => {
        if (!product.path || !product.constants) {
          resolve();
          return;
        }

        const config = product.constants as any;
        const uCount = config.uCount || 36;
        const vCount = config.vCount || 5;
        const ext = config.imageExtension || "png";

        // Calculamos cuántas imágenes pre-cargar (primeras columnas de cada fila)
        const imagesToPreload: string[] = [];
        const columnsToPreload = Math.min(uCount, 18); // Primeras 18 columnas

        for (let v = 0; v < vCount; v++) {
          for (let u = 0; u < columnsToPreload; u++) {
            imagesToPreload.push(`${product.path}/${v}_${u}.${ext}`);
          }
        }

        let loadedImages = 0;
        const totalImages = imagesToPreload.length;

        if (totalImages === 0) {
          resolve();
          return;
        }

        const checkComplete = () => {
          loadedImages++;
          if (loadedImages >= totalImages) {
            resolve();
          }
        };

        // Pre-cargar imágenes en paralelo
        imagesToPreload.forEach((src) => {
          const img = new Image();
          img.onload = checkComplete;
          img.onerror = checkComplete; // Continuar incluso si falla
          img.src = src;
        });

        // Timeout de seguridad
        setTimeout(() => {
          if (loadedImages < totalImages) {
            console.warn(
              `Timeout pre-cargando ${product.name}: ${loadedImages}/${totalImages}`
            );
            resolve();
          }
        }, 10000); // 10 segundos máximo por producto
      });
    },
    []
  );

  /**
   * Pre-carga todos los productos de todas las vistas
   */
  const preloadAllProducts = useCallback(async () => {
    if (views.length === 0 || allProducts.length === 0) {
      setIsPreloading(false);
      return;
    }

    // Contar total de productos
    const totalProducts = allProducts.reduce(
      (sum, products) => sum + products.length,
      0
    );

    setProgress({
      totalProducts,
      loadedProducts: 0,
      percentage: 0,
      currentProduct: "",
    });

    let loadedCount = 0;
    const preloadedMap = new Map<string, Product[]>();

    // Pre-cargar productos vista por vista
    for (let i = 0; i < views.length; i++) {
      const view = views[i];
      const products = allProducts[i];

      if (!view.view_id || !products) continue;

      // Pre-cargar cada producto de esta vista
      for (const product of products) {
        setProgress((prev) => ({
          ...prev,
          currentProduct: product.name || "Cargando...",
        }));

        await preloadProductImages(product);

        loadedCount++;
        const percentage = Math.round((loadedCount / totalProducts) * 100);

        setProgress({
          totalProducts,
          loadedProducts: loadedCount,
          percentage,
          currentProduct: product.name || "",
        });
      }

      // Guardar productos de esta vista
      preloadedMap.set(view.view_id, products);
    }

    setPreloadedData(preloadedMap);
    setIsPreloading(false);
  }, [views, allProducts, preloadProductImages]);

  // Iniciar pre-carga cuando cambien las vistas o productos
  useEffect(() => {
    if (views.length > 0 && allProducts.length > 0) {
      setIsPreloading(true);
      preloadAllProducts();
    }
  }, [views, allProducts, preloadAllProducts]);

  return {
    isPreloading,
    progress,
    preloadedData,
  };
}
