import { useState } from "react";
import {
  createProductAction,
  deleteProductAction,
} from "@/src/app/actions/productActions";

/**
 * Hook para manejar los productos de un proyecto
 */
export function useProductManager(projectId: string) {
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [selectedProductIndex, setSelectedProductIndex] = useState(-1);
  const [newProductName, setNewProductName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const openAddProductModal = () => {
    setIsAddingProduct(true);
    setNewProductName("");
  };

  const closeAddProductModal = () => {
    setIsAddingProduct(false);
    setNewProductName("");
  };

  const addProduct = async () => {
    if (!newProductName.trim()) {
      throw new Error("El nombre del producto es obligatorio");
    }

    try {
      setIsSaving(true);

      const result = await createProductAction({
        admin_id: "",
        project_id: projectId,
        name: newProductName.trim(),
        weight: 0,
      } as any);

      if (!result) {
        throw new Error("Error al crear producto");
      }

      closeAddProductModal();
      return result;
    } catch (err: any) {
      console.error("Error agregando producto:", err);
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  const deleteProduct = async (productId: string) => {
    try {
      setIsSaving(true);

      const result = await deleteProductAction(productId);

      if (!result.ok) {
        throw new Error(result.error || "Error al eliminar producto");
      }

      setSelectedProductIndex(-1);
      return result;
    } catch (err: any) {
      console.error("Error eliminando producto:", err);
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  return {
    // Estado del modal
    isAddingProduct,
    newProductName,
    setNewProductName,
    openAddProductModal,
    closeAddProductModal,

    // Producto seleccionado para vista 3D
    selectedProductIndex,
    setSelectedProductIndex,

    // Acciones
    addProduct,
    deleteProduct,

    // Estado
    isSaving,
  };
}
