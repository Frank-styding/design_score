import { useState } from "react";
import { deleteProjectAction } from "@/src/app/actions/projectActions";
import { useLoadingState } from "./useLoadingState";

/**
 * Resultado de la eliminación
 */
export interface DeleteResult {
  success: boolean;
  error?: string;
}

/**
 * Hook para manejar la eliminación de proyectos con progreso
 */
export function useProjectDeletion() {
  const loadingState = useLoadingState();
  const [isDeleting, setIsDeleting] = useState(false);

  /**
   * Confirma con el usuario antes de eliminar
   */
  const confirmDeletion = (
    projectName: string,
    numProducts: number
  ): boolean => {
    return window.confirm(
      `⚠️ ¿Estás seguro de que deseas eliminar "${projectName}"?\n\n` +
        `Esto eliminará:\n` +
        `• El proyecto\n` +
        `• Todos los productos asociados (${numProducts})\n` +
        `• Todas las imágenes en la nube\n` +
        `• Todas las vistas configuradas\n\n` +
        `Esta acción NO se puede deshacer.`
    );
  };

  /**
   * Elimina un proyecto con progreso visual
   */
  const deleteProject = async (
    projectId: string,
    projectName: string
  ): Promise<DeleteResult> => {
    try {
      setIsDeleting(true);
      loadingState.startLoading(
        `Preparando eliminación de "${projectName}"...`
      );

      // Simular progreso visual con pasos descriptivos
      const steps = [
        {
          progress: 0,
          message: `Preparando eliminación de "${projectName}"...`,
          delay: 300,
        },
        {
          progress: 10,
          message: `Eliminando proyecto "${projectName}"...`,
          delay: 200,
        },
        {
          progress: 30,
          message: "Eliminando productos asociados...",
          delay: 200,
        },
        {
          progress: 50,
          message: "Eliminando imágenes del almacenamiento...",
          delay: 200,
        },
        {
          progress: 70,
          message: "Eliminando vistas configuradas...",
          delay: 200,
        },
      ];

      for (const step of steps) {
        loadingState.updateProgress(step.progress, step.message);
        await new Promise((resolve) => setTimeout(resolve, step.delay));
      }

      // Ejecutar la eliminación real
      const result = await deleteProjectAction(projectId);

      loadingState.updateProgress(90, "Finalizando eliminación...");
      await new Promise((resolve) => setTimeout(resolve, 200));

      if (result.ok) {
        loadingState.finishLoading(
          `✅ Proyecto "${projectName}" eliminado exitosamente`
        );
        await new Promise((resolve) => setTimeout(resolve, 1000));

        return { success: true };
      } else {
        throw new Error(result.error || "Error desconocido al eliminar");
      }
    } catch (err: any) {
      const errorMessage = err.message || "Error desconocido";
      loadingState.updateProgress(0, `❌ Error: ${errorMessage}`);
      await new Promise((resolve) => setTimeout(resolve, 2000));

      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setIsDeleting(false);
      loadingState.resetLoading();
    }
  };

  return {
    isDeleting,
    deleteProgress: loadingState.progress,
    deleteMessage: loadingState.message,
    confirmDeletion,
    deleteProject,
  };
}
