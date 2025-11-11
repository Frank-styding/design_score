import { useState, useEffect } from "react";
import {
  getViewsByProjectIdAction,
  getProductsByViewIdAction,
  assignProductsToViewAction,
  deleteViewAction,
  createViewAction,
} from "@/src/app/actions/viewActions";
import { View } from "@/src/domain/entities/View";

/**
 * Hook para manejar las vistas de un proyecto
 */
export function useProjectViewsManager(projectId: string) {
  const [views, setViews] = useState<View[]>([]);
  const [viewProducts, setViewProducts] = useState<Record<string, string[]>>(
    {}
  );
  const [isLoading, setIsLoading] = useState(true);

  const loadViews = async () => {
    try {
      setIsLoading(true);

      // Cargar vistas
      const viewsData = await getViewsByProjectIdAction(projectId);
      setViews(viewsData);

      // Cargar productos de cada vista
      const productsMap: Record<string, string[]> = {};
      for (const view of viewsData) {
        if (view.view_id) {
          const products = await getProductsByViewIdAction(view.view_id);
          productsMap[view.view_id] = products.map((p) => p.product_id!);
        }
      }
      setViewProducts(productsMap);
    } catch (err: any) {
      console.error("Error cargando vistas:", err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      loadViews();
    }
  }, [projectId]);

  const toggleProductInView = async (viewId: string, productId: string) => {
    const currentProducts = viewProducts[viewId] || [];
    const isSelected = currentProducts.includes(productId);

    const newProducts = isSelected
      ? currentProducts.filter((id) => id !== productId)
      : [...currentProducts, productId];

    try {
      const result = await assignProductsToViewAction(viewId, newProducts);

      if (result.ok) {
        setViewProducts({
          ...viewProducts,
          [viewId]: newProducts,
        });
      } else {
        throw new Error(result.error || "Error al actualizar vista");
      }
    } catch (err: any) {
      console.error("Error actualizando vista:", err);
      throw err;
    }
  };

  const addView = async () => {
    try {
      const newIdx = views.length.toString();
      const result = await createViewAction(projectId, newIdx);

      if (result.ok && result.view) {
        setViews([...views, result.view]);
        setViewProducts({
          ...viewProducts,
          [result.view.view_id!]: [],
        });
        return result.view;
      } else {
        throw new Error(result.error || "Error al crear vista");
      }
    } catch (err: any) {
      console.error("Error creando vista:", err);
      throw err;
    }
  };

  const deleteView = async (viewId: string) => {
    try {
      const result = await deleteViewAction(viewId);

      if (result.ok) {
        setViews(views.filter((v) => v.view_id !== viewId));
        const newViewProducts = { ...viewProducts };
        delete newViewProducts[viewId];
        setViewProducts(newViewProducts);
      } else {
        throw new Error(result.error || "Error al eliminar vista");
      }
    } catch (err: any) {
      console.error("Error eliminando vista:", err);
      throw err;
    }
  };

  const reloadViewProducts = async () => {
    const productsMap: Record<string, string[]> = {};
    for (const view of views) {
      if (view.view_id) {
        const products = await getProductsByViewIdAction(view.view_id);
        productsMap[view.view_id] = products.map((p) => p.product_id!);
      }
    }
    setViewProducts(productsMap);
  };

  return {
    views,
    viewProducts,
    isLoading,
    loadViews,
    toggleProductInView,
    addView,
    deleteView,
    reloadViewProducts,
  };
}
