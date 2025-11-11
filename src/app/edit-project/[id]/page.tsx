"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  getProjectByIdWithProductsAction,
  updateProjectAction,
} from "../../actions/projectActions";
import {
  createProductAction,
  deleteProductAction,
} from "../../actions/productActions";
import {
  getViewsByProjectIdAction,
  getProductsByViewIdAction,
  assignProductsToViewAction,
  deleteViewAction,
  createViewAction,
} from "../../actions/viewActions";
import { Project } from "@/src/domain/entities/Project";
import { View } from "@/src/domain/entities/View";
/* import { Product } from "@/src/domain/entities/Product"; */
import Button from "@/src/components/ui/Button";
import Input from "@/src/components/ui/Input";
import KeyShotXRViewer from "@/src/components/KeyShotXRViewer";

type Tab = "info" | "views" | "products";

export default function EditProjectPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;

  const [activeTab, setActiveTab] = useState<Tab>("info");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [project, setProject] = useState<Project | null>(null);
  const [name, setName] = useState("");
  const [finalMessage, setFinalMessage] = useState("");
  const [error, setError] = useState("");

  // Estados para vistas
  const [views, setViews] = useState<View[]>([]);
  const [viewProducts, setViewProducts] = useState<Record<string, string[]>>(
    {}
  );
  const [editingViews, setEditingViews] = useState<Record<string, boolean>>({});

  // Estado para productos
  const [selectedProductIndex, setSelectedProductIndex] = useState(-1);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [newProductName, setNewProductName] = useState("");
  const [newProductWeight, setNewProductWeight] = useState(0);

  // Cargar el proyecto
  useEffect(() => {
    const loadProject = async () => {
      try {
        setIsLoading(true);
        const projectData = await getProjectByIdWithProductsAction(projectId);

        if (!projectData) {
          setError("Proyecto no encontrado");
          return;
        }

        setProject(projectData);
        setName(projectData.name || "");
        setFinalMessage(projectData.final_message || "");

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
        console.error("Error cargando proyecto:", err);
        setError(err.message || "Error al cargar el proyecto");
      } finally {
        setIsLoading(false);
      }
    };

    if (projectId) {
      loadProject();
    }
  }, [projectId]);

  const handleSubmitInfo = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      alert("El nombre del proyecto es obligatorio");
      return;
    }

    try {
      setIsSaving(true);

      const result = await updateProjectAction(projectId, {
        name: name.trim(),
        final_message: finalMessage.trim() || undefined,
      });

      if (result.ok) {
        alert("✅ Proyecto actualizado correctamente");
        setProject(result.project);
      } else {
        throw new Error(result.error || "Error al actualizar proyecto");
      }
    } catch (err: any) {
      console.error("Error actualizando proyecto:", err);
      alert(`❌ Error: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleProductInView = async (
    viewId: string,
    productId: string
  ) => {
    const currentProducts = viewProducts[viewId] || [];
    const isSelected = currentProducts.includes(productId);

    const newProducts = isSelected
      ? currentProducts.filter((id) => id !== productId)
      : [...currentProducts, productId];

    try {
      // Actualizar en el servidor
      const result = await assignProductsToViewAction(viewId, newProducts);

      if (result.ok) {
        // Actualizar estado local
        setViewProducts({
          ...viewProducts,
          [viewId]: newProducts,
        });
      } else {
        throw new Error(result.error || "Error al actualizar vista");
      }
    } catch (err: any) {
      console.error("Error actualizando vista:", err);
      alert(`❌ Error: ${err.message}`);
    }
  };

  const handleAddView = async () => {
    try {
      const newIdx = views.length.toString();
      const result = await createViewAction(projectId, newIdx);

      if (result.ok && result.view) {
        setViews([...views, result.view]);
        setViewProducts({
          ...viewProducts,
          [result.view.view_id!]: [],
        });
        alert("✅ Vista creada correctamente");
      } else {
        throw new Error(result.error || "Error al crear vista");
      }
    } catch (err: any) {
      console.error("Error creando vista:", err);
      alert(`❌ Error: ${err.message}`);
    }
  };

  const handleDeleteView = async (viewId: string) => {
    const confirmed = confirm("¿Estás seguro de eliminar esta vista?");
    if (!confirmed) return;

    try {
      const result = await deleteViewAction(viewId);

      if (result.ok) {
        setViews(views.filter((v) => v.view_id !== viewId));
        const newViewProducts = { ...viewProducts };
        delete newViewProducts[viewId];
        setViewProducts(newViewProducts);
        alert("✅ Vista eliminada correctamente");
      } else {
        throw new Error(result.error || "Error al eliminar vista");
      }
    } catch (err: any) {
      console.error("Error eliminando vista:", err);
      alert(`❌ Error: ${err.message}`);
    }
  };

  const handleAddProduct = async () => {
    if (!newProductName.trim()) {
      alert("El nombre del producto es obligatorio");
      return;
    }

    try {
      setIsSaving(true);

      const result = await createProductAction({
        admin_id: "", // Se asignará en el action
        project_id: projectId,
        name: newProductName.trim(),
        weight: newProductWeight || 0,
      } as any);

      if (result) {
        // Recargar el proyecto completo para obtener el nuevo producto
        const updatedProject = await getProjectByIdWithProductsAction(
          projectId
        );
        if (updatedProject) {
          setProject(updatedProject);

          // Actualizar las vistas para incluir el nuevo producto (sin seleccionar)
          const updatedViewProducts = { ...viewProducts };
          views.forEach((view) => {
            if (view.view_id && !updatedViewProducts[view.view_id]) {
              updatedViewProducts[view.view_id] = [];
            }
          });
          setViewProducts(updatedViewProducts);
        }

        setNewProductName("");
        setNewProductWeight(0);
        setIsAddingProduct(false);
        alert("✅ Producto agregado correctamente");
      } else {
        throw new Error("Error al crear producto");
      }
    } catch (err: any) {
      console.error("Error agregando producto:", err);
      alert(`❌ Error: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    const confirmed = confirm(
      "¿Estás seguro de eliminar este producto? Esto también lo eliminará de todas las vistas."
    );
    if (!confirmed) return;

    try {
      setIsSaving(true);

      const result = await deleteProductAction(productId);

      if (result.ok) {
        // Recargar el proyecto completo
        const updatedProject = await getProjectByIdWithProductsAction(
          projectId
        );
        if (updatedProject) {
          setProject(updatedProject);

          // Recargar productos de cada vista
          const productsMap: Record<string, string[]> = {};
          for (const view of views) {
            if (view.view_id) {
              const products = await getProductsByViewIdAction(view.view_id);
              productsMap[view.view_id] = products.map((p) => p.product_id!);
            }
          }
          setViewProducts(productsMap);
        }

        setSelectedProductIndex(-1);
        alert("✅ Producto eliminado correctamente");
      } else {
        throw new Error(result.error || "Error al eliminar producto");
      }
    } catch (err: any) {
      console.error("Error eliminando producto:", err);
      alert(`❌ Error: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const getTotalWeight = () => {
    return (project?.products || []).reduce(
      (sum, p) => sum + (p.weight || 0),
      0
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-gray-800 mb-4"></div>
          <p className="text-gray-600">Cargando proyecto...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">
            {error || "Proyecto no encontrado"}
          </p>
          <Button onClick={() => router.push("/dashboard")} variant="primary">
            ← Volver al Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const products = project.products || [];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-light text-gray-800 mb-2">
            Editar Proyecto
          </h1>
          <p className="text-gray-600">
            Modifica la información, vistas y productos de tu proyecto
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-300">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab("info")}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === "info"
                  ? "text-gray-800 border-b-2 border-gray-800"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              📋 Información
            </button>
            <button
              onClick={() => setActiveTab("views")}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === "views"
                  ? "text-gray-800 border-b-2 border-gray-800"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              👁️ Vistas ({views.length})
            </button>
            <button
              onClick={() => setActiveTab("products")}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === "products"
                  ? "text-gray-800 border-b-2 border-gray-800"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              📦 Productos ({products.length})
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white border border-gray-300 rounded-lg p-8 shadow-md">
          {/* Tab: Información */}
          {activeTab === "info" && (
            <form onSubmit={handleSubmitInfo} className="space-y-6">
              <Input
                type="text"
                label="Nombre del Proyecto"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Mi Proyecto 3D"
                required
                containerClassName="mb-4"
              />

              <div className="flex flex-col">
                <label className="text-gray-700 text-sm mb-2">
                  Mensaje Final (Opcional)
                </label>
                <textarea
                  value={finalMessage}
                  onChange={(e) => setFinalMessage(e.target.value)}
                  placeholder="Mensaje que se mostrará al finalizar la presentación..."
                  rows={4}
                  className="w-full p-3 bg-white border border-gray-300 text-gray-800 focus:outline-none focus:border-blue-400 transition-colors resize-none rounded"
                />
                <p className="text-gray-500 text-xs mt-1">
                  Este mensaje se mostrará después de que el usuario complete
                  todas las vistas
                </p>
              </div>

              {/* Buttons */}
              <div className="flex justify-between pt-4">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => router.push("/dashboard")}
                  disabled={isSaving}
                >
                  ← Cancelar
                </Button>
                <Button type="submit" variant="primary" disabled={isSaving}>
                  {isSaving ? "Guardando..." : "Guardar Cambios"}
                </Button>
              </div>
            </form>
          )}

          {/* Tab: Vistas */}
          {activeTab === "views" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-light text-gray-800 mb-2">
                    Configurar Vistas
                  </h2>
                  <p className="text-gray-600 text-sm">
                    Define qué productos se mostrarán en cada vista
                  </p>
                </div>
                <Button type="button" variant="primary" onClick={handleAddView}>
                  + Agregar Vista
                </Button>
              </div>

              {views.length > 0 ? (
                <div className="overflow-x-auto border border-gray-300 rounded-lg">
                  <table className="w-full">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="p-3 text-left text-sm font-medium text-gray-700 border-r border-gray-300 min-w-[150px]">
                          Vista
                        </th>
                        {products.map((product, i) => (
                          <th
                            key={product.product_id}
                            className="p-3 text-center text-sm font-medium text-gray-700 border-r border-gray-300 min-w-[100px]"
                          >
                            {product.name || `Producto ${i + 1}`}
                          </th>
                        ))}
                        <th className="p-3 text-center text-sm font-medium text-gray-700 min-w-[120px]">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {views.map((view, viewIndex) => (
                        <tr
                          key={view.view_id}
                          className="border-t border-gray-200 hover:bg-gray-50"
                        >
                          <td className="p-3 border-r border-gray-300">
                            <span className="text-gray-800 font-medium">
                              Vista {parseInt(view.idx) + 1}
                            </span>
                          </td>
                          {products.map((product) => (
                            <td
                              key={product.product_id}
                              className="p-3 text-center border-r border-gray-300"
                            >
                              <input
                                type="checkbox"
                                checked={(
                                  viewProducts[view.view_id!] || []
                                ).includes(product.product_id!)}
                                onChange={() =>
                                  handleToggleProductInView(
                                    view.view_id!,
                                    product.product_id!
                                  )
                                }
                                className="w-5 h-5 text-gray-800 cursor-pointer"
                              />
                            </td>
                          ))}
                          <td className="p-3 text-center">
                            <button
                              onClick={() => handleDeleteView(view.view_id!)}
                              className="text-red-600 hover:text-red-800 transition-colors"
                              title="Eliminar vista"
                            >
                              🗑️
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 border border-gray-300 rounded-lg bg-gray-50">
                  <p className="text-gray-600">No hay vistas configuradas</p>
                  <p className="text-gray-500 text-sm mt-1">
                    Haz clic en "Agregar Vista" para comenzar
                  </p>
                </div>
              )}

              <div className="flex justify-start pt-4">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => router.push("/dashboard")}
                >
                  ← Volver al Dashboard
                </Button>
              </div>
            </div>
          )}

          {/* Tab: Productos */}
          {activeTab === "products" && (
            <div className="space-y-6">
              {/* Header con peso total */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-light text-gray-800 mb-2">
                    Galería de Productos
                  </h2>
                  <p className="text-gray-600 text-sm">
                    Gestiona los productos 3D de tu proyecto
                  </p>
                  <p className="text-gray-800 font-medium mt-2">
                    Tamaño Total:{" "}
                    <span className="text-blue-600">
                      {getTotalWeight().toFixed(2)} MB
                    </span>
                  </p>
                </div>
                <Button
                  type="button"
                  variant="primary"
                  onClick={() => setIsAddingProduct(true)}
                  disabled={isSaving}
                >
                  + Agregar Producto
                </Button>
              </div>

              {/* Modal para agregar producto */}
              {isAddingProduct && (
                <div className="border border-gray-300 rounded-lg p-6 bg-blue-50">
                  <h3 className="text-lg font-medium text-gray-800 mb-4">
                    Nuevo Producto
                  </h3>
                  <div className="space-y-4">
                    <Input
                      type="text"
                      label="Nombre del Producto"
                      value={newProductName}
                      onChange={(e) => setNewProductName(e.target.value)}
                      placeholder="Ej: Silla Modelo A"
                      required
                    />
                    <div className="text-sm text-gray-600 italic">
                      Nota: El tamaño del producto (weight) se calculará
                      automáticamente al subir las imágenes
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => {
                          setIsAddingProduct(false);
                          setNewProductName("");
                          setNewProductWeight(0);
                        }}
                        disabled={isSaving}
                      >
                        Cancelar
                      </Button>
                      <Button
                        type="button"
                        variant="primary"
                        onClick={handleAddProduct}
                        disabled={isSaving}
                      >
                        {isSaving ? "Guardando..." : "Guardar Producto"}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Gallery de productos */}
              {products.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products.map((product, index) => (
                    <div
                      key={product.product_id}
                      className="border border-gray-300 rounded-lg overflow-hidden bg-white shadow-md hover:shadow-xl transition-shadow"
                    >
                      {/* Imagen de portada o placeholder */}
                      <div className="h-48 bg-gray-100 flex items-center justify-center relative">
                        {product.cover_image ? (
                          <img
                            src={product.cover_image}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="text-gray-400 text-center">
                            <div className="text-6xl mb-2">📦</div>
                            <p className="text-sm">Sin imagen</p>
                          </div>
                        )}

                        {/* Botón de eliminar en la esquina */}
                        <button
                          onClick={() =>
                            handleDeleteProduct(product.product_id!)
                          }
                          className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full p-2 shadow-lg transition-colors"
                          title="Eliminar producto"
                          disabled={isSaving}
                        >
                          <svg
                            className="w-4 h-4"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                      </div>

                      {/* Información del producto */}
                      <div className="p-4">
                        <h3 className="text-lg font-medium text-gray-800 mb-2 truncate">
                          {product.name || `Producto ${index + 1}`}
                        </h3>

                        {/* Tamaño del archivo (solo lectura) */}
                        <div className="mb-3">
                          <label className="text-xs text-gray-600 mb-1 block">
                            Tamaño del archivo
                          </label>
                          <div className="p-2 bg-gray-100 border border-gray-300 rounded text-sm text-gray-700">
                            {product.weight
                              ? `${product.weight.toFixed(2)} MB`
                              : "Calculando..."}
                          </div>
                          <p className="text-xs text-gray-500 mt-1 italic">
                            Se calcula automáticamente al subir imágenes
                          </p>
                        </div>

                        {/* Estado del producto */}
                        <div className="flex gap-2 text-xs text-gray-600">
                          <span
                            className={`px-2 py-1 rounded ${
                              product.path
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {product.path ? "✓ Con imágenes" : "⚠ Sin imágenes"}
                          </span>
                        </div>

                        {/* Botón de vista previa */}
                        {product.path && (
                          <button
                            onClick={() => setSelectedProductIndex(index)}
                            className="mt-3 w-full px-4 py-2 bg-gray-800 hover:bg-black text-white text-sm rounded transition-colors"
                          >
                            👁️ Ver en 3D
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 border border-gray-300 rounded-lg bg-gray-50">
                  <div className="text-6xl mb-4">📦</div>
                  <p className="text-gray-600 mb-2">
                    No hay productos en este proyecto
                  </p>
                  <p className="text-gray-500 text-sm mb-4">
                    Agrega productos para comenzar
                  </p>
                  <Button
                    type="button"
                    variant="primary"
                    onClick={() => setIsAddingProduct(true)}
                  >
                    + Agregar Primer Producto
                  </Button>
                </div>
              )}

              {/* Visor 3D del producto seleccionado */}
              {products.length > 0 &&
                selectedProductIndex >= 0 &&
                products[selectedProductIndex]?.path && (
                  <div className="border border-gray-300 rounded-lg p-6 bg-white">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-medium text-gray-800">
                        Vista 3D:{" "}
                        {products[selectedProductIndex].name ||
                          `Producto ${selectedProductIndex + 1}`}
                      </h3>
                      <button
                        onClick={() => setSelectedProductIndex(-1)}
                        className="text-gray-500 hover:text-gray-700 transition-colors"
                        title="Cerrar vista 3D"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="flex justify-center">
                      <KeyShotXRViewer
                        baseUrl={products[selectedProductIndex].path!}
                        config={
                          products[selectedProductIndex].constants! as any
                        }
                        width={800}
                        height={600}
                        columns={36}
                        rows={1}
                        className="rounded-lg overflow-hidden shadow-lg"
                      />
                    </div>

                    {products[selectedProductIndex].description && (
                      <div className="mt-4 text-gray-600">
                        <p className="text-sm font-medium text-gray-700 mb-1">
                          Descripción:
                        </p>
                        <p>{products[selectedProductIndex].description}</p>
                      </div>
                    )}
                  </div>
                )}

              <div className="flex justify-start pt-4">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => router.push("/dashboard")}
                >
                  ← Volver al Dashboard
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
