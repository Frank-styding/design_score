"use client";

import { useParams, useRouter } from "next/navigation";
import { Button } from "@/src/components/ui";
import { useTabs } from "@/src/hooks/useTabs";
import { useProjectEditor } from "@/src/hooks/useProjectEditor";
import { ProjectInfoTab } from "@/src/components/edit-project/ProjectInfoTab";
import { ViewsTab } from "@/src/components/edit-project/ViewsTab";
import { ProductsTab } from "@/src/components/edit-project/ProductsTab";

type Tab = "info" | "views" | "products";

export default function EditProjectPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  // Hook de tabs
  const { activeTab, setActiveTab } = useTabs<Tab>("info");

  // Hook principal de edición de proyecto
  const editor = useProjectEditor(projectId);

  if (editor.isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
        <div className="bg-white rounded-lg shadow-xl p-12 max-w-md w-full">
          <div className="text-center">
            {/* Spinner animado */}
            <div className="relative mx-auto mb-8 w-24 h-24">
              <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>
              <div className="absolute inset-0 rounded-full border-4 border-gray-800 border-t-transparent animate-spin"></div>
              <div
                className="absolute inset-3 rounded-full border-4 border-gray-400 border-b-transparent animate-spin"
                style={{
                  animationDirection: "reverse",
                  animationDuration: "1.5s",
                }}
              ></div>
            </div>

            {/* Texto de carga */}
            <h2 className="text-2xl font-light text-gray-800 mb-3">
              Cargando Proyecto
            </h2>
            <p className="text-gray-600 mb-4">
              Preparando la información del proyecto...
            </p>

            {/* Barra de progreso indeterminada */}
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-gray-800 rounded-full animate-pulse"
                style={{ width: "60%" }}
              ></div>
            </div>

            {/* Indicadores de estado */}
            <div className="mt-6 space-y-2 text-left">
              <div className="flex items-center text-sm text-gray-600">
                <div className="w-2 h-2 bg-gray-800 rounded-full mr-2 animate-pulse"></div>
                Cargando información del proyecto
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <div
                  className="w-2 h-2 bg-gray-800 rounded-full mr-2 animate-pulse"
                  style={{ animationDelay: "0.2s" }}
                ></div>
                Obteniendo productos
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <div
                  className="w-2 h-2 bg-gray-800 rounded-full mr-2 animate-pulse"
                  style={{ animationDelay: "0.4s" }}
                ></div>
                Preparando vistas
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (editor.error || !editor.project) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">
            {editor.error || "Proyecto no encontrado"}
          </p>
          <Button onClick={() => router.push("/dashboard")} variant="primary">
            ← Volver al Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-light text-gray-800 mb-2">
            Editar Proyecto
          </h1>
          <p className="text-gray-600 text-sm">
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
              👁️ Vistas ({editor.views.length})
            </button>
            <button
              onClick={() => setActiveTab("products")}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === "products"
                  ? "text-gray-800 border-b-2 border-gray-800"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              📦 Productos ({editor.products.length})
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white border border-gray-300 rounded-lg p-8 shadow-md">
          {/* Tab: Información */}
          {activeTab === "info" && (
            <ProjectInfoTab
              name={editor.name}
              setName={editor.setName}
              finalMessage={editor.finalMessage}
              setFinalMessage={editor.setFinalMessage}
              onSubmit={editor.handleSubmitInfo}
              isSaving={editor.isSavingInfo}
            />
          )}

          {/* Tab: Vistas */}
          {activeTab === "views" && (
            <ViewsTab
              views={editor.views}
              products={editor.products}
              viewProducts={editor.viewProducts}
              onToggleProduct={editor.handleToggleProductInView}
              onAddView={editor.handleAddView}
              onDeleteView={editor.handleDeleteView}
              onUpdateViewName={editor.updateViewName}
              viewCreationModal={editor.viewCreationModal}
              onCloseViewCreationModal={editor.closeViewCreationModal}
              viewDeletionModal={editor.viewDeletionModal}
              onConfirmDeleteView={editor.confirmDeleteView}
              onCancelDeleteView={editor.cancelDeleteView}
              onCloseViewDeletionModal={editor.closeViewDeletionModal}
            />
          )}

          {/* Tab: Productos */}
          {activeTab === "products" && (
            <ProductsTab
              products={editor.products}
              selectedProductIndex={editor.selectedProductIndex}
              isAddingProduct={editor.isAddingProduct}
              selectedProductsToAdd={editor.selectedProductsToAdd}
              onSelectProduct={editor.setSelectedProductIndex}
              onAddProduct={editor.handleAddProduct}
              onDeleteProduct={editor.handleDeleteProduct}
              onOpenAddProductModal={editor.openAddProductModal}
              onCloseAddProductModal={editor.closeAddProductModal}
              onSelectedProductsChange={editor.setSelectedProductsToAdd}
              isSaving={editor.isSavingProduct}
              productAdditionModal={editor.productAdditionModal}
              onCloseProductAdditionModal={editor.closeProductAdditionModal}
            />
          )}
        </div>
      </div>
    </div>
  );
}
