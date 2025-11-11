import { useEffect } from "react";
import { useProjectData } from "./useProjectData";
import { useProjectViewsManager } from "./useProjectViewsManager";
import { useProductManager } from "./useProductManager";
import { useProjectInfoEditor } from "./useProjectInfoEditor";
import { getProjectByIdWithProductsAction } from "@/src/app/actions/projectActions";

/**
 * Hook principal que orquesta toda la lógica de edición de proyecto
 */
export function useProjectEditor(projectId: string) {
  // Estado del proyecto
  const projectData = useProjectData(projectId);

  // Editor de información
  const infoEditor = useProjectInfoEditor(
    projectId,
    projectData.project?.name || "",
    projectData.project?.final_message || ""
  );

  // Gestor de vistas
  const viewsManager = useProjectViewsManager(projectId);

  // Gestor de productos
  const productManager = useProductManager(projectId);

  // Actualizar el editor de info cuando cambie el proyecto
  useEffect(() => {
    if (projectData.project) {
      infoEditor.setName(projectData.project.name || "");
      infoEditor.setFinalMessage(projectData.project.final_message || "");
    }
  }, [projectData.project]);

  // Manejar submit de información
  const handleSubmitInfo = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const updatedProject = await infoEditor.updateInfo();
      projectData.setProject(updatedProject);
      alert("✅ Proyecto actualizado correctamente");
    } catch (err: any) {
      alert(`❌ Error: ${err.message}`);
    }
  };

  // Manejar toggle de producto en vista
  const handleToggleProductInView = async (
    viewId: string,
    productId: string
  ) => {
    try {
      await viewsManager.toggleProductInView(viewId, productId);
    } catch (err: any) {
      alert(`❌ Error: ${err.message}`);
    }
  };

  // Manejar agregar vista
  const handleAddView = async () => {
    try {
      await viewsManager.addView();
      alert("✅ Vista creada correctamente");
    } catch (err: any) {
      alert(`❌ Error: ${err.message}`);
    }
  };

  // Manejar eliminar vista
  const handleDeleteView = async (viewId: string) => {
    const confirmed = confirm("¿Estás seguro de eliminar esta vista?");
    if (!confirmed) return;

    try {
      await viewsManager.deleteView(viewId);
      alert("✅ Vista eliminada correctamente");
    } catch (err: any) {
      alert(`❌ Error: ${err.message}`);
    }
  };

  // Manejar agregar producto
  const handleAddProduct = async () => {
    try {
      await productManager.addProduct();

      // Recargar proyecto completo
      const updatedProject = await getProjectByIdWithProductsAction(projectId);
      if (updatedProject) {
        projectData.setProject(updatedProject);
        await viewsManager.reloadViewProducts();
      }

      alert("✅ Producto agregado correctamente");
    } catch (err: any) {
      alert(`❌ Error: ${err.message}`);
    }
  };

  // Manejar eliminar producto
  const handleDeleteProduct = async (productId: string) => {
    const confirmed = confirm(
      "¿Estás seguro de eliminar este producto? Esto también lo eliminará de todas las vistas."
    );
    if (!confirmed) return;

    try {
      await productManager.deleteProduct(productId);

      // Recargar proyecto completo
      const updatedProject = await getProjectByIdWithProductsAction(projectId);
      if (updatedProject) {
        projectData.setProject(updatedProject);
        await viewsManager.reloadViewProducts();
      }

      alert("✅ Producto eliminado correctamente");
    } catch (err: any) {
      alert(`❌ Error: ${err.message}`);
    }
  };

  return {
    // Estado del proyecto
    project: projectData.project,
    products: projectData.products,
    isLoading: projectData.isLoading,
    error: projectData.error,
    getTotalWeight: projectData.getTotalWeight,

    // Editor de información
    name: infoEditor.name,
    setName: infoEditor.setName,
    finalMessage: infoEditor.finalMessage,
    setFinalMessage: infoEditor.setFinalMessage,
    isSavingInfo: infoEditor.isSaving,
    handleSubmitInfo,

    // Vistas
    views: viewsManager.views,
    viewProducts: viewsManager.viewProducts,
    handleToggleProductInView,
    handleAddView,
    handleDeleteView,

    // Productos
    isAddingProduct: productManager.isAddingProduct,
    newProductName: productManager.newProductName,
    setNewProductName: productManager.setNewProductName,
    openAddProductModal: productManager.openAddProductModal,
    closeAddProductModal: productManager.closeAddProductModal,
    selectedProductIndex: productManager.selectedProductIndex,
    setSelectedProductIndex: productManager.setSelectedProductIndex,
    isSavingProduct: productManager.isSaving,
    handleAddProduct,
    handleDeleteProduct,
  };
}
