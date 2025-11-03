"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { getCurrentUserAction } from "../actions/authActions";
import {
  getAllProductsAction,
  deleteProductAction,
  updateProductAction,
} from "../actions/productActions";
import { Product } from "@/src/domain/entities/Product";

// Importación dinámica del visor KeyShot XR para evitar SSR
const KeyShotXRViewer = dynamic(
  () => import("@/src/components/KeyShotXRViewer"),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Cargando visor 3D...</p>
      </div>
    ),
  }
);

export default function ProductsPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
  });

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (user) {
      loadProducts();
    }
  }, [user]);

  const loadUser = async () => {
    try {
      const result = await getCurrentUserAction();
      if (
        result.success &&
        result.user &&
        result.user.id &&
        result.user.email
      ) {
        setUser({
          id: result.user.id,
          email: result.user.email,
        });
      }
    } catch (error) {
      console.error("Error al cargar usuario:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const allProducts = await getAllProductsAction();
      setProducts(allProducts || []);
    } catch (error) {
      console.error("Error cargando productos:", error);
      setProducts([]);
    }
  };

  const handleDelete = async (productId: string, productName: string) => {
    if (
      !confirm(
        `¿Estás seguro de eliminar el producto "${productName}"?\n\nEsta acción no se puede deshacer.`
      )
    ) {
      return;
    }

    try {
      const result = await deleteProductAction(productId);
      if (result.ok) {
        alert("✓ Producto eliminado correctamente");
        loadProducts(); // Recargar lista
      } else {
        alert("✗ Error al eliminar: " + result.error);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("✗ Error al eliminar el producto");
    }
  };

  const startEditing = (product: Product) => {
    setEditingProduct(product);
    setEditForm({
      name: product.name || "",
      description: product.description || "",
    });
  };

  const cancelEditing = () => {
    setEditingProduct(null);
    setEditForm({ name: "", description: "" });
  };

  const handleSaveEdit = async () => {
    if (!editingProduct || !editingProduct.id) return;

    if (!editForm.name.trim()) {
      alert("El nombre del producto es obligatorio");
      return;
    }

    try {
      const result = await updateProductAction(editingProduct.id, {
        name: editForm.name.trim(),
        description: editForm.description.trim(),
      });

      if (result.ok) {
        alert("✓ Producto actualizado correctamente");
        cancelEditing();
        loadProducts(); // Recargar lista
      } else {
        alert("✗ Error al actualizar: " + result.error);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("✗ Error al actualizar el producto");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">
            No se pudo cargar la información del usuario
          </p>
        </div>
      </div>
    );
  }
  console.log(products);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Mis Productos
          </h1>
          <p className="text-gray-600">
            Usuario: <span className="font-medium">{user.email}</span>
          </p>
          <p className="text-gray-500 text-sm mt-2">
            Total de productos: {products.length}
          </p>
        </div>

        {/* Navigation */}
        <div className="mb-6 flex gap-4">
          <button
            onClick={() => router.push("/dashboard")}
            className="bg-gray-600 hover:bg-gray-500 text-white py-2 px-6 rounded-lg transition-colors"
          >
            ← Volver al Dashboard
          </button>
          <button
            onClick={() => router.push("/upload")}
            className="bg-blue-600 hover:bg-blue-500 text-white py-2 px-6 rounded-lg transition-colors"
          >
            + Subir Producto
          </button>
        </div>

        {/* Products Grid */}
        {products.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-500 text-lg mb-4">
              No hay productos disponibles
            </p>
            <button
              onClick={() => router.push("/upload")}
              className="bg-blue-600 hover:bg-blue-500 text-white py-2 px-6 rounded-lg transition-colors"
            >
              Subir tu Primer Producto
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow"
              >
                {/* Product Image/Preview */}
                <div
                  className="h-48 bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center cursor-pointer relative group"
                  onClick={() => setViewingProduct(product)}
                >
                  {product.coverImage ? (
                    <img
                      src={product.coverImage}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center">
                      <div className="text-6xl mb-2">📦</div>
                      <p className="text-gray-500 text-sm">Sin imagen</p>
                    </div>
                  )}
                  {/* Overlay para indicar que es clickeable */}
                  {/* <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-10 transition-all flex items-center justify-center">
                    <div className="opacity-0 hover:opacity-100 transition-opacity bg-white rounded-full p-3 shadow-lg">
                      <span className="text-2xl">👁️</span>
                    </div>
                  </div> */}
                </div>

                {/* Product Info */}
                <div className="p-5">
                  <h3 className="text-xl font-bold text-gray-800 mb-2">
                    {product.name}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {product.description || "Sin descripción"}
                  </p>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
                    <div className="bg-gray-50 p-2 rounded">
                      <p className="text-gray-500">Imágenes</p>
                      <p className="font-semibold">{product.num_images || 0}</p>
                    </div>
                    <div className="bg-gray-50 p-2 rounded">
                      <p className="text-gray-500">Tamaño</p>
                      <p className="font-semibold">
                        {((product.size || 0) / 1024 / 1024).toFixed(1)} MB
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => startEditing(product)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors text-sm font-medium"
                    >
                      ✏️ Editar
                    </button>
                    <button
                      onClick={() =>
                        product.id &&
                        handleDelete(product.id, product.name || "producto")
                      }
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg transition-colors text-sm font-medium"
                    >
                      🗑️ Eliminar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3D Viewer Modal */}
      {viewingProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full h-full max-w-7xl max-h-[95vh] overflow-hidden flex flex-col">
            {/* Header del modal */}
            <div className="p-4 bg-gray-800 text-white flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">{viewingProduct.name}</h2>
                <p className="text-gray-300 text-sm">
                  {viewingProduct.description || "Visor 3D"}
                </p>
              </div>
              <button
                onClick={() => setViewingProduct(null)}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors font-medium"
              >
                ✕ Cerrar
              </button>
            </div>

            {/* Visor 3D */}
            <div className="flex-1 overflow-hidden">
              {viewingProduct.constants && user ? (
                <KeyShotXRViewer
                  config={JSON.parse(viewingProduct.constants)}
                  baseUrl={`https://emrgqbrqnqpbkrpruwts.supabase.co/storage/v1/object/public/files/${user.id}/${viewingProduct.id}/`}
                  onLoad={() => console.log("Visor 3D cargado")}
                  onError={(error) =>
                    console.error("Error en visor 3D:", error)
                  }
                />
              ) : (
                <div className="flex items-center justify-center h-full bg-gray-100">
                  <div className="text-center">
                    <div className="text-6xl mb-4">⚠️</div>
                    <p className="text-gray-600 text-lg">
                      No hay configuración 3D disponible para este producto
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">
                Editar Producto
              </h2>

              <div className="space-y-4">
                {/* Nombre */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre del Producto *
                  </label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) =>
                      setEditForm({ ...editForm, name: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ej: Silla Moderna"
                  />
                </div>

                {/* Descripción */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descripción
                  </label>
                  <textarea
                    value={editForm.description}
                    onChange={(e) =>
                      setEditForm({ ...editForm, description: e.target.value })
                    }
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Describe el producto..."
                  />
                </div>

                {/* Info */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Nota:</strong> Esta edición solo modifica la
                    información del producto. Las imágenes y archivos XR no se
                    pueden cambiar.
                  </p>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-4 mt-6">
                <button
                  onClick={cancelEditing}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  💾 Guardar Cambios
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
