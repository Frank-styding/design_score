"use client";

import { useState, useEffect } from "react";
import AuthForm from "@/src/components/AuthForm";
import UploadRarForm from "@/src/components/UploadRarForm";
import {
  createProductAction,
  getAllProductsAction,
} from "@/src/app/actions/productActions";
import {
  createProjectAction,
  getAllProjectsAction,
} from "@/src/app/actions/projectActions";
import { signOutAction } from "@/src/app/actions/authActions";
import { Product } from "@/src/domain/entities/Product";
import { Project } from "@/src/domain/entities/Project";

export default function UploadPage() {
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [showCreateProduct, setShowCreateProduct] = useState(false);

  // Formulario de nuevo proyecto
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectFinalMessage, setNewProjectFinalMessage] = useState("");

  // Formulario de nuevo producto
  const [newProductName, setNewProductName] = useState("");
  const [newProductDescription, setNewProductDescription] = useState("");
  const [newProductProjectId, setNewProductProjectId] = useState("");
  const [newProductWeight, setNewProductWeight] = useState("");

  // Cargar proyectos y productos cuando el usuario se autentica
  useEffect(() => {
    if (user) {
      loadProjects();
      loadProducts();
    }
  }, [user]);

  const loadProjects = async () => {
    if (!user) return;

    try {
      const userProjects = await getAllProjectsAction();
      setProjects(userProjects);
    } catch (error) {
      console.error("Error cargando proyectos:", error);
    }
  };

  const loadProducts = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const userProducts = await getAllProductsAction();
      setProducts(userProducts);
    } catch (error) {
      console.error("Error cargando productos:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAuthSuccess = (authenticatedUser: {
    id: string;
    email: string;
  }) => {
    setUser(authenticatedUser);
  };

  const handleSignOut = async () => {
    await signOutAction();
    setUser(null);
    setProjects([]);
    setProducts([]);
    setSelectedProduct(null);
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const { project, ok, error } = await createProjectAction({
        name: newProjectName,
        final_message: newProjectFinalMessage || "¡Gracias por participar!",
        num_products: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      if (ok && project) {
        alert("✅ Proyecto creado exitosamente");
        setNewProjectName("");
        setNewProjectFinalMessage("");
        setShowCreateProject(false);
        loadProjects();
      } else {
        alert(`❌ Error al crear proyecto: ${error}`);
      }
    } catch (error) {
      console.error("Error creando proyecto:", error);
      alert("❌ Error al crear proyecto");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const newProduct: Product = {
        product_id: "",
        admin_id: user.id,
        project_id: newProductProjectId,
        name: newProductName,
        description: newProductDescription,
        cover_image: undefined,
        constants: {},
        path: undefined,
        weight: parseFloat(newProductWeight) || 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const created = await createProductAction(newProduct);

      if (created) {
        alert("✅ Producto creado exitosamente");
        setNewProductName("");
        setNewProductDescription("");
        setNewProductProjectId("");
        setNewProductWeight("");
        setShowCreateProduct(false);
        loadProducts();
      } else {
        alert("❌ Error al crear producto");
      }
    } catch (error) {
      console.error("Error creando producto:", error);
      alert("❌ Error al crear producto");
    } finally {
      setLoading(false);
    }
  };

  const handleUploadSuccess = () => {
    alert("✅ Archivo procesado correctamente");
    loadProducts();
  };

  // Si no hay usuario autenticado, mostrar formulario de login
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              📦 Upload KeyShot
            </h1>
            <p className="text-gray-600">
              Sube y procesa archivos ZIP de KeyShot
            </p>
          </div>
          <AuthForm onAuthSuccess={handleAuthSuccess} />
        </div>
      </div>
    );
  }

  // Usuario autenticado - Mostrar dashboard
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              📦 Upload KeyShot
            </h1>
            <p className="text-sm text-gray-600">
              Bienvenido, <strong>{user.email}</strong>
            </p>
          </div>
          <button
            onClick={handleSignOut}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            🚪 Cerrar Sesión
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Panel izquierdo - Proyectos y Productos */}
          <div className="lg:col-span-1 space-y-6">
            {/* Sección de Proyectos */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800">
                  Proyectos
                </h2>
                <button
                  onClick={() => setShowCreateProject(!showCreateProject)}
                  className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm transition-colors"
                >
                  {showCreateProject ? "❌" : "➕"}
                </button>
              </div>

              {/* Formulario crear proyecto */}
              {showCreateProject && (
                <form
                  onSubmit={handleCreateProject}
                  className="mb-4 p-4 bg-green-50 rounded-lg border border-green-200"
                >
                  <h3 className="font-semibold mb-3 text-green-800 text-sm">
                    Nuevo Proyecto
                  </h3>

                  <input
                    type="text"
                    placeholder="Nombre del proyecto"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    className="w-full mb-2 p-2 border rounded text-sm text-black"
                    required
                  />

                  <textarea
                    placeholder="Mensaje final (opcional)"
                    value={newProjectFinalMessage}
                    onChange={(e) => setNewProjectFinalMessage(e.target.value)}
                    className="w-full mb-3 p-2 border rounded text-sm resize-none text-black"
                    rows={2}
                  />

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded font-medium transition-colors disabled:bg-green-400 text-sm"
                  >
                    {loading ? "Creando..." : "Crear"}
                  </button>
                </form>
              )}

              {/* Lista de proyectos */}
              {projects.length === 0 ? (
                <p className="text-gray-500 text-center py-4 text-xs">
                  Sin proyectos
                </p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {projects.map((project) => (
                    <div
                      key={project.project_id}
                      className="p-3 rounded-lg border bg-gray-50 border-gray-200"
                    >
                      <h3 className="font-semibold text-gray-800 truncate text-sm">
                        {project.name}
                      </h3>
                      <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs inline-block mt-1">
                        📦 {project.num_products} productos
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Sección de Productos */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800">
                  Productos
                </h2>
                <button
                  onClick={() => setShowCreateProduct(!showCreateProduct)}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm transition-colors"
                >
                  {showCreateProduct ? "❌" : "➕"}
                </button>
              </div>

              {/* Formulario crear producto */}
              {showCreateProduct && (
                <form
                  onSubmit={handleCreateProduct}
                  className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200"
                >
                  <h3 className="font-semibold mb-3 text-blue-800 text-sm">
                    Nuevo Producto
                  </h3>

                  <input
                    type="text"
                    placeholder="Nombre del producto"
                    value={newProductName}
                    onChange={(e) => setNewProductName(e.target.value)}
                    className="w-full mb-2 p-2 border rounded text-sm text-black"
                    required
                  />

                  <textarea
                    placeholder="Descripción"
                    value={newProductDescription}
                    onChange={(e) => setNewProductDescription(e.target.value)}
                    className="w-full mb-2 p-2 border rounded text-sm resize-none text-black"
                    rows={2}
                  />

                  <select
                    value={newProductProjectId}
                    onChange={(e) => setNewProductProjectId(e.target.value)}
                    className="w-full mb-2 p-2 border rounded text-sm text-black"
                    required
                  >
                    <option value="">Seleccionar Proyecto</option>
                    {projects.map((project) => (
                      <option
                        key={project.project_id}
                        value={project.project_id}
                      >
                        {project.name}
                      </option>
                    ))}
                  </select>

                  <input
                    type="number"
                    step="0.01"
                    placeholder="Peso (opcional)"
                    value={newProductWeight}
                    onChange={(e) => setNewProductWeight(e.target.value)}
                    className="w-full mb-3 p-2 border rounded text-sm text-black"
                  />

                  <button
                    type="submit"
                    disabled={loading || projects.length === 0}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded font-medium transition-colors disabled:bg-blue-400 text-sm"
                  >
                    {loading ? "Creando..." : "Crear"}
                  </button>

                  {projects.length === 0 && (
                    <p className="text-xs text-orange-600 mt-2">
                      ⚠️ Crea un proyecto primero
                    </p>
                  )}
                </form>
              )}

              {/* Lista de productos */}
              {loading && products.length === 0 ? (
                <p className="text-gray-500 text-center py-4 text-xs">
                  Cargando...
                </p>
              ) : products.length === 0 ? (
                <p className="text-gray-500 text-center py-4 text-xs">
                  Sin productos
                </p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {products.map((product) => (
                    <button
                      key={product.product_id}
                      onClick={() => setSelectedProduct(product)}
                      className={`w-full text-left p-3 rounded-lg border transition-all text-sm ${
                        selectedProduct?.product_id === product.product_id
                          ? "bg-blue-50 border-blue-500 shadow-md"
                          : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                      }`}
                    >
                      <h3 className="font-semibold text-gray-800 truncate">
                        {product.name}
                      </h3>
                      <p className="text-xs text-gray-500 truncate">
                        {product.description || "Sin descripción"}
                      </p>
                      <div className="flex gap-2 mt-2 text-xs">
                        {product.constants &&
                          Object.keys(product.constants).length > 0 && (
                            <span className="bg-green-100 text-green-700 px-2 py-1 rounded">
                              ✅ Configurado
                            </span>
                          )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Panel derecho - Upload y detalles */}
          <div className="lg:col-span-2">
            {!selectedProduct ? (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <div className="text-6xl mb-4">📦</div>
                <h3 className="text-2xl font-semibold text-gray-800 mb-2">
                  Selecciona un Producto
                </h3>
                <p className="text-gray-600">
                  Elige un producto para subir archivos ZIP de KeyShot
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Detalles del producto */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">
                    {selectedProduct.name}
                  </h2>
                  <p className="text-gray-600 mb-4">
                    {selectedProduct.description || "Sin descripción"}
                  </p>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Peso:</span>
                      <p className="font-semibold text-gray-700">
                        {selectedProduct.weight} kg
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500">Constantes:</span>
                      <p className="font-semibold text-gray-700">
                        {selectedProduct.constants
                          ? Object.keys(selectedProduct.constants).length
                          : 0}{" "}
                        variables
                      </p>
                    </div>
                  </div>

                  {selectedProduct.constants &&
                    Object.keys(selectedProduct.constants).length > 0 && (
                      <details className="mt-4">
                        <summary className="cursor-pointer text-blue-600 hover:text-blue-700 font-medium text-sm">
                          Ver constantes
                        </summary>
                        <pre className="mt-2 p-3 bg-gray-50 rounded text-xs overflow-x-auto">
                          {JSON.stringify(selectedProduct.constants, null, 2)}
                        </pre>
                      </details>
                    )}
                </div>

                {/* Formulario de upload */}
                <UploadRarForm
                  productId={selectedProduct.product_id || ""}
                  adminId={selectedProduct.admin_id}
                  onSuccess={handleUploadSuccess}
                />

                {/* Instrucciones */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <h3 className="font-semibold text-blue-900 mb-3 text-sm">
                    📋 Instrucciones
                  </h3>
                  <ol className="space-y-2 text-sm text-blue-800">
                    <li>1. Exporta desde KeyShot (Web Export)</li>
                    <li>2. Comprime en formato .zip</li>
                    <li>3. Selecciona y sube el archivo</li>
                    <li>4. Sistema procesa automáticamente</li>
                  </ol>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
