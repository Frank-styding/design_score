import { createProjectAction } from "@/src/app/actions/projectActions";
import { createProductAction } from "@/src/app/actions/productActions";
import {
  createViewAction,
  assignProductsToViewAction,
} from "@/src/app/actions/viewActions";
import { ViewConfig } from "@/src/hooks/useProjectViews";

/**
 * Datos del proyecto a crear
 */
export interface ProjectCreationData {
  name: string;
  finalMessage?: string;
  numProducts: number;
}

/**
 * Resultado de la creación del proyecto
 */
export interface ProjectCreationResult {
  success: boolean;
  project?: any;
  products?: any[];
  error?: string;
}

/**
 * Servicio para manejar la creación de proyectos
 */
export class ProjectCreationService {
  /**
   * Crea un proyecto con sus productos
   */
  static async createProject(
    data: ProjectCreationData
  ): Promise<ProjectCreationResult> {
    try {
      // 1. Crear el proyecto
      const projectResult = await createProjectAction({
        name: data.name,
        num_products: data.numProducts,
        final_message: data.finalMessage || undefined,
      });

      if (!projectResult.ok || !projectResult.project) {
        throw new Error(projectResult.error || "Error al crear proyecto");
      }

      const project = projectResult.project;

      // 2. Crear los productos
      const productPromises = Array.from({ length: data.numProducts }, (_, i) =>
        createProductAction({
          project_id: project.project_id!,
          name: `Producto ${i + 1}`,
          idx: i.toString(),
        } as any)
      );

      const products = await Promise.all(productPromises);

      if (products.some((p) => !p)) {
        throw new Error("Error al crear algunos productos");
      }

      return {
        success: true,
        project,
        products,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Crea las vistas y asigna productos
   */
  static async createViews(
    projectId: string,
    views: ViewConfig[],
    productIds: string[]
  ): Promise<{ success: boolean; errors: string[] }> {
    const errors: string[] = [];

    try {
      // Crear todas las vistas
      const viewCreationResults = await Promise.all(
        views.map((view, idx) => createViewAction(projectId, idx.toString()))
      );

      // Log de resultados
      viewCreationResults.forEach((result, idx) => {
        if (!result.ok) {
          console.error(`❌ Error creando vista ${idx + 1}:`, result.error);
          errors.push(`Vista ${idx + 1}: ${result.error}`);
        } else {
          console.log(`✅ Vista ${idx + 1} creada: ${result.view?.view_id}`);
        }
      });

      // Asignar productos a cada vista
      for (let viewIdx = 0; viewIdx < views.length; viewIdx++) {
        const viewConfig = views[viewIdx];
        const viewResult = viewCreationResults[viewIdx];

        if (viewResult.ok && viewResult.view) {
          // Obtener los IDs de productos seleccionados
          const selectedProductIds = viewConfig.products
            .map((isSelected, productIdx) =>
              isSelected ? productIds[productIdx] : null
            )
            .filter((id): id is string => id !== null);

          if (selectedProductIds.length > 0) {
            console.log(
              `Asignando ${selectedProductIds.length} productos a vista ${
                viewIdx + 1
              }`
            );

            const assignResult = await assignProductsToViewAction(
              viewResult.view.view_id!,
              selectedProductIds
            );

            if (!assignResult.ok) {
              console.error(
                `❌ Error asignando productos a vista ${viewIdx + 1}:`,
                assignResult.error
              );
              errors.push(
                `Asignación vista ${viewIdx + 1}: ${assignResult.error}`
              );
            } else {
              console.log(`✅ Productos asignados a vista ${viewIdx + 1}`);
            }
          } else {
            console.log(
              `ℹ️ Vista ${viewIdx + 1} no tiene productos seleccionados`
            );
          }
        } else {
          console.warn(
            `⚠️ Saltando asignación de productos para vista ${
              viewIdx + 1
            } (no se creó correctamente)`
          );
        }
      }

      return {
        success: errors.length === 0,
        errors,
      };
    } catch (error: any) {
      errors.push(error.message);
      return {
        success: false,
        errors,
      };
    }
  }

  /**
   * Realiza rollback eliminando el proyecto creado
   */
  static async rollback(projectId: string): Promise<void> {
    try {
      const { deleteProjectAction } = await import(
        "@/src/app/actions/projectActions"
      );

      console.log("🗑️ Eliminando proyecto y recursos asociados...");
      const deleteResult = await deleteProjectAction(projectId);

      if (deleteResult.ok) {
        console.log("✅ Rollback completado: Proyecto y recursos eliminados");
      } else {
        console.error("⚠️ Error en rollback:", deleteResult.error);
      }
    } catch (error: any) {
      console.error("❌ Error durante rollback:", error.message);
      throw error;
    }
  }
}
