import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Project } from "@/src/domain/entities/Project";
import { View } from "@/src/domain/entities/View";
import { Product } from "@/src/domain/entities/Product";
import { getProjectByIdAction } from "@/src/app/actions/projectActions";
import {
  getViewsByProjectIdAction,
  getProductsByViewIdAction,
} from "@/src/app/actions/viewActions";

/**
 * Hook para manejar la visualización de un proyecto con navegación por vistas
 */
export function useProjectViewer(projectId: string) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [views, setViews] = useState<View[]>([]);
  const [currentViewIndex, setCurrentViewIndex] = useState(0);
  const [currentProducts, setCurrentProducts] = useState<Product[]>([]);
  const [nextProducts, setNextProducts] = useState<Product[]>([]); // Precarga
  const [showFinalMessage, setShowFinalMessage] = useState(false);

  /**
   * Carga los datos del proyecto y sus vistas
   */
  const loadProjectData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Cargar proyecto
      const projectData = await getProjectByIdAction(projectId);
      if (!projectData) {
        setError("Proyecto no encontrado");
        return;
      }
      setProject(projectData);

      // Cargar vistas ordenadas por idx
      const viewsData = await getViewsByProjectIdAction(projectId);
      if (viewsData.length === 0) {
        setError("No hay vistas configuradas para este proyecto");
        return;
      }

      // Ordenar vistas por idx
      const sortedViews = [...viewsData].sort((a, b) => {
        const idxA = parseInt(a.idx);
        const idxB = parseInt(b.idx);
        return idxA - idxB;
      });

      setViews(sortedViews);
    } catch (err: any) {
      console.error("Error cargando proyecto:", err);
      setError(err.message || "Error al cargar el proyecto");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Carga los productos de la vista actual
   */
  const loadCurrentViewProducts = async () => {
    try {
      const currentView = views[currentViewIndex];
      if (!currentView || !currentView.view_id) return;

      const products = await getProductsByViewIdAction(currentView.view_id);
      setCurrentProducts(products);

      // Precargar imágenes de los productos actuales
      preloadProductImages(products);
    } catch (err: any) {
      console.error("Error cargando productos de la vista:", err);
    }
  };

  /**
   * Precarga los productos de la siguiente vista
   */
  const preloadNextViewProducts = async () => {
    try {
      const nextIndex = currentViewIndex + 1;
      if (nextIndex >= views.length) return;

      const nextView = views[nextIndex];
      if (!nextView || !nextView.view_id) return;

      const products = await getProductsByViewIdAction(nextView.view_id);
      setNextProducts(products);

      // Precargar imágenes de los productos siguientes
      preloadProductImages(products);
    } catch (err: any) {
      console.error("Error precargando productos de la siguiente vista:", err);
    }
  };

  /**
   * Precarga las imágenes de los productos en segundo plano
   */
  const preloadProductImages = (products: Product[]) => {
    products.forEach((product) => {
      if (product.path && product.constants) {
        const config = product.constants as any;
        const uCount = config.uCount || 36;
        const vCount = config.vCount || 5;
        const ext = config.imageExtension || "png";

        // Precargar solo las primeras imágenes (primera fila)
        for (let u = 0; u < Math.min(uCount, 12); u++) {
          const imagePath = `${product.path}${u}_0.${ext}`;
          const img = new Image();
          img.src = imagePath;
        }
      }
    });
  };

  /**
   * Navega a la siguiente vista
   */
  const handleNextView = () => {
    if (currentViewIndex < views.length - 1) {
      setCurrentViewIndex(currentViewIndex + 1);
    } else {
      // Última vista, mostrar mensaje final
      setShowFinalMessage(true);
    }
  };

  /**
   * Navega a la vista anterior
   */
  const handlePreviousView = () => {
    if (currentViewIndex > 0) {
      setCurrentViewIndex(currentViewIndex - 1);
    }
  };

  /**
   * Vuelve al dashboard
   */
  const handleBackToDashboard = () => {
    router.push("/dashboard");
  };

  // Cargar proyecto y vistas al montar
  useEffect(() => {
    loadProjectData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  // Cargar productos cuando cambia la vista actual
  useEffect(() => {
    if (views.length > 0 && currentViewIndex < views.length) {
      loadCurrentViewProducts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentViewIndex, views]);

  // Precargar siguiente vista cuando cambian los productos actuales
  useEffect(() => {
    if (currentProducts.length > 0 && currentViewIndex < views.length - 1) {
      // Esperar un poco antes de precargar para no interferir con la vista actual
      const timer = setTimeout(() => {
        preloadNextViewProducts();
      }, 1000);

      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentProducts, currentViewIndex, views]);

  return {
    // Estado
    isLoading,
    error,
    project,
    views,
    currentViewIndex,
    currentView: views[currentViewIndex] || null,
    currentProducts,
    nextProducts, // Para debug o uso futuro
    totalViews: views.length,
    showFinalMessage,

    // Navegación
    hasNextView: currentViewIndex < views.length - 1,
    hasPreviousView: currentViewIndex > 0,
    handleNextView,
    handlePreviousView,
    handleBackToDashboard,
  };
}
