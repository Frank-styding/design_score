import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLoadingState } from "./useLoadingState";
import { useProjectViews, ViewConfig } from "./useProjectViews";
import { SSEUploadProcessor } from "@/src/lib/sseUploadProcessor";
import { ProjectCreationService } from "@/src/lib/projectCreationService";

/**
 * Datos del proyecto
 */
export interface ProjectData {
  name: string;
  finalMessage: string;
}

/**
 * Hook principal para manejar el proceso completo de creación de proyecto
 */
export function useProjectCreation() {
  const router = useRouter();
  const [projectData, setProjectData] = useState<ProjectData>({
    name: "",
    finalMessage: "",
  });
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const loadingState = useLoadingState();
  const viewsState = useProjectViews();

  /**
   * Maneja la subida de archivos y actualiza las vistas
   */
  const handleFilesUploaded = (files: File[]) => {
    setUploadedFiles(files);
    viewsState.updateViewsForNewProducts(files.length);
  };

  /**
   * Procesa la creación completa del proyecto
   */
  const createProject = async () => {
    let createdProject: any = null;
    let createdProducts: any[] = [];

    try {
      loadingState.startLoading("Preparando proyecto...");

      // 1. Crear proyecto y productos
      const projectResult = await ProjectCreationService.createProject({
        name: projectData.name,
        finalMessage: projectData.finalMessage,
        numProducts: uploadedFiles.length,
      });

      if (!projectResult.success || !projectResult.project) {
        throw new Error(projectResult.error || "Error al crear proyecto");
      }

      createdProject = projectResult.project;
      createdProducts = projectResult.products || [];

      // 2. Subir archivos con progreso
      if (uploadedFiles.length > 0 && createdProducts.length > 0) {
        loadingState.updateProgress(0, "Preparando subida de archivos...");

        // Pequeño delay para asegurar que el modal se muestre
        await new Promise((resolve) => setTimeout(resolve, 100));

        const productIds = createdProducts.map((p) => p.product_id);
        const adminId = createdProducts[0].admin_id;

        // Procesar archivos con SSE
        await SSEUploadProcessor.processMultipleFiles(
          uploadedFiles,
          productIds,
          adminId,
          // Callback de progreso
          (progressData) => {
            const message = `Archivo ${progressData.fileIndex + 1}/${
              progressData.totalFiles
            } - ${progressData.message}`;
            loadingState.updateProgress(progressData.progress, message);
          },
          // Callback de error
          (error) => {
            console.error(
              `Error en archivo ${error.fileIndex + 1}:`,
              error.message
            );
            loadingState.updateProgress(
              loadingState.progress,
              `Error en archivo ${error.fileIndex + 1}: ${error.message}`
            );
          }
        );

        loadingState.finishLoading("¡Archivos subidos exitosamente!");
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      // 3. Crear vistas y asignar productos
      loadingState.resetLoading();

      const productIds = createdProducts.map((p) => p.product_id);
      const viewsResult = await ProjectCreationService.createViews(
        createdProject.project_id!,
        viewsState.views,
        productIds
      );

      if (!viewsResult.success && viewsResult.errors.length > 0) {
        console.warn("⚠️ Algunas vistas tuvieron errores:", viewsResult.errors);
      }

      // 4. Éxito - Redireccionar
      console.log("✅ Proyecto creado completamente");
      router.push("/dashboard");
    } catch (error: any) {
      console.error("❌ Error creando proyecto:", error);

      // Rollback
      loadingState.updateProgress(0, "Error detectado. Realizando limpieza...");

      if (createdProject?.project_id) {
        try {
          await ProjectCreationService.rollback(createdProject.project_id);
        } catch (rollbackError: any) {
          console.error("❌ Error durante rollback:", rollbackError.message);
        }
      }

      // Mostrar error
      alert(
        `❌ Error al crear el proyecto: ${error.message}\n\n` +
          `Los cambios han sido revertidos automáticamente.`
      );

      loadingState.resetLoading();
    }
  };

  return {
    // Estado del proyecto
    projectData,
    setProjectData,

    // Archivos
    uploadedFiles,
    setUploadedFiles,
    handleFilesUploaded,

    // Vistas
    views: viewsState.views,
    setViews: viewsState.setViews,

    // Carga
    isSubmitting: loadingState.isLoading,
    loadingProgress: loadingState.progress,
    loadingMessage: loadingState.message,

    // Acciones
    createProject,
  };
}
